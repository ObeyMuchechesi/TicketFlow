-- ─────────────────────────────────────────────────────────────
-- Migration: assign each gate staff member to a single event
-- Run this in your Supabase SQL editor on EXISTING databases.
-- (Fresh setups created from schema.sql already include this.)
-- ─────────────────────────────────────────────────────────────

-- Each gate staff member works ONE event. assigned_event_id scopes their
-- gate dashboard and check-in access to that event only.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS assigned_event_id UUID REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_assigned_event ON users(assigned_event_id);
