-- ─────────────────────────────────────────────────────────────
-- Migration: Shared gate-staff login per event
-- Run this in your Supabase SQL editor on EXISTING databases.
-- (Fresh setups created from schema.sql already include this.)
--
-- Requirement: "Different staff can use the same login credentials
-- for the same event all at once."
--
-- - Gate staff may SHARE an email (and password) so a whole team can
--   log in with one set of credentials — e.g. gate@choir.com.
-- - Non-staff emails (super_admin / organiser) must stay unique.
-- - A staff email may only be reused WITHIN the same event — never for
--   two different events (that would make login ambiguous).
-- - Each staff row is still bound to exactly ONE event via
--   assigned_event_id, and gate staff only ever see that event.
-- ─────────────────────────────────────────────────────────────

-- 0) Ensure the one-event staff scoping column exists (from migration
--    20260808_staff_event_assignment.sql) — makes this file self-contained.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_event_id UUID REFERENCES events(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_users_assigned_event ON users(assigned_event_id);

-- 1) Remove the global email UNIQUE constraint.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;

-- 2) Keep emails unique for admins / organisers only.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique_nonstaff
  ON users(email)
  WHERE role IS DISTINCT FROM 'gate_staff';

-- 3) Gate staff may share an email only within the SAME event.
--    Inserting/updating a staff row whose email is already used by a
--    DIFFERENT event (or by a non-staff account) is rejected.
CREATE OR REPLACE FUNCTION enforce_staff_email_per_event()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'gate_staff' THEN
    IF EXISTS (
      SELECT 1 FROM users
      WHERE email = NEW.email
        AND id IS DISTINCT FROM NEW.id
        AND (
          -- same email on a different assigned event (NULL == NULL is equal,
          -- so unassigned staff may share an email, but never mix assigned
          -- and unassigned rows — that would make login scope ambiguous)
          (role = 'gate_staff'
            AND assigned_event_id IS DISTINCT FROM NEW.assigned_event_id)
          OR
          -- same email on a non-staff account
          (role IS DISTINCT FROM 'gate_staff')
        )
    ) THEN
      RAISE EXCEPTION 'This login is already in use for another event';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_email_per_event ON users;
CREATE TRIGGER trg_staff_email_per_event
  BEFORE INSERT OR UPDATE OF email, role, assigned_event_id ON users
  FOR EACH ROW EXECUTE FUNCTION enforce_staff_email_per_event();
