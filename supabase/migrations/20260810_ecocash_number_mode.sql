-- ─────────────────────────────────────────────────────────────
-- Migration: Add 'number' (Send Money) mode to EcoCash
-- Run this in your Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────

-- 1. Ensure the EcoCash columns exist (safe to re-run)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ecocash_type TEXT,
  ADD COLUMN IF NOT EXISTS ecocash_code TEXT,
  ADD COLUMN IF NOT EXISTS ecocash_phone TEXT;

-- 2. Drop old CHECK constraint if it exists, then add new one with 'number'
DO $$
BEGIN
  -- Try to drop the existing constraint (name varies by setup)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname LIKE '%ecocash_type%'
      AND conrelid = 'events'::regclass
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE events DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conname LIKE '%ecocash_type%'
        AND conrelid = 'events'::regclass
      LIMIT 1
    );
  END IF;
END $$;

-- 3. Add new CHECK constraint that includes 'number'
ALTER TABLE events
  ADD CONSTRAINT events_ecocash_type_check
  CHECK (ecocash_type IN ('biller', 'agent', 'number', 'none'));

-- 4. Set any NULL values to 'none' for safety
UPDATE events SET ecocash_type = 'none' WHERE ecocash_type IS NULL;

-- 5. Verify
SELECT event_name, ecocash_type, ecocash_code, ecocash_phone
FROM events
ORDER BY created_at DESC;
