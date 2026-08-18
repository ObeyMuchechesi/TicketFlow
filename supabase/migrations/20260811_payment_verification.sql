-- ─────────────────────────────────────────────────────────────
-- Migration: Payment verification for EcoCash
-- Tickets stay 'pending' until transaction reference is verified
-- ─────────────────────────────────────────────────────────────

-- Add transaction_ref column to tickets (for EcoCash verification)
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS transaction_ref TEXT;

-- Update the status CHECK to include 'pending' for EcoCash flow
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname LIKE '%tickets_status%'
      AND conrelid = 'tickets'::regclass
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE tickets DROP CONSTRAINT ' || conname
      FROM pg_constraint
      WHERE conname LIKE '%tickets_status%'
        AND conrelid = 'tickets'::regclass
      LIMIT 1
    );
  END IF;
END $$;

ALTER TABLE tickets
  ADD CONSTRAINT tickets_status_check
  CHECK (status IN ('active', 'used', 'cancelled', 'refunded', 'pending'));
