-- ─────────────────────────────────────────────────────────────
-- Migration: Event cover/theme images + bank account payments
-- Run this in your Supabase SQL editor on EXISTING databases.
-- (Fresh setups created from schema.sql already include these.)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS theme_image TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT;

-- Allow bank_transfer as a payment method for manual bank payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('ecocash','visa','mastercard','stripe','paypal','bank_transfer'));
