-- Free Events Support
-- Run this in the Supabase SQL editor. Free events are simply ticket types
-- priced at 0.00 — no new tables needed. This only adds the optional
-- per-person reservation limit used to prevent one buyer grabbing everything.

ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS max_per_person INTEGER NOT NULL DEFAULT 0;

-- 0 (default) = unlimited tickets per person
-- N            = max N tickets a single email address may reserve for that tier
