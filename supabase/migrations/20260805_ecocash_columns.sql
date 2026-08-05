-- ─────────────────────────────────────────────────────────────
-- Migration: EcoCash payment settings for events
-- Run this in your Supabase SQL editor on EXISTING databases.
-- (Fresh setups created from schema.sql already include these.)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ecocash_type TEXT CHECK (ecocash_type IN ('biller','agent','none')),
  ADD COLUMN IF NOT EXISTS ecocash_code TEXT,
  ADD COLUMN IF NOT EXISTS ecocash_phone TEXT;
