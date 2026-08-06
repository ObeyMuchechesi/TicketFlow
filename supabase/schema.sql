-- TiketFlow Database Schema
-- Run this in your Supabase SQL editor to set up all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  full_name      TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('super_admin','organiser','gate_staff')),
  phone          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 2. EVENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organiser_id      UUID REFERENCES users(id) ON DELETE SET NULL,
  event_name        TEXT NOT NULL,
  slug              TEXT UNIQUE NOT NULL,
  date              DATE NOT NULL,
  time              TEXT,
  venue             TEXT NOT NULL,
  description       TEXT,
  poster_image      TEXT,
  cover_image       TEXT,
  theme_image       TEXT,
  performer_images  JSONB DEFAULT '[]',
  theme_color       TEXT DEFAULT '#e94560',
  capacity          INTEGER DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft','published','sold_out','completed','cancelled')),
  ecocash_type      TEXT CHECK (ecocash_type IN ('biller','agent','none')),
  ecocash_code      TEXT,
  ecocash_phone     TEXT,
  bank_name         TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 3. TICKET TYPES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_types (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id            UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  price               DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity_available  INTEGER NOT NULL DEFAULT 0,
  quantity_sold       INTEGER NOT NULL DEFAULT 0,
  max_per_person      INTEGER NOT NULL DEFAULT 0, -- 0 = unlimited, otherwise max tickets per email
  color               TEXT DEFAULT '#e94560',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 4. TICKETS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id  UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  buyer_name      TEXT NOT NULL,
  buyer_email     TEXT NOT NULL,
  buyer_phone     TEXT,
  qr_code_token   TEXT UNIQUE NOT NULL,
  is_checked_in   BOOLEAN DEFAULT FALSE,
  checked_in_at   TIMESTAMPTZ,
  checked_in_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  purchase_date   TIMESTAMPTZ DEFAULT NOW(),
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','used','cancelled','refunded'))
);

-- ─────────────────────────────────────────
-- 5. CHECK-INS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS check_ins (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id    UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_id     UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  staff_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  scanned_at   TIMESTAMPTZ DEFAULT NOW(),
  method       TEXT DEFAULT 'qr_scan' CHECK (method IN ('qr_scan','manual_search')),
  device_info  TEXT
);

-- ─────────────────────────────────────────
-- 6. PAYMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id        UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  amount           DECIMAL(10,2) NOT NULL,
  currency         TEXT DEFAULT 'USD',
  payment_method   TEXT NOT NULL
                     CHECK (payment_method IN ('ecocash','visa','mastercard','stripe','paypal','bank_transfer')),
  transaction_ref  TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','completed','failed','refunded')),
  paid_at          TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- 7. PROMO CODES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS promo_codes (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id          UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  code              TEXT NOT NULL,
  discount_percent  INTEGER NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
  max_uses          INTEGER NOT NULL DEFAULT 100,
  times_used        INTEGER NOT NULL DEFAULT 0,
  expires_at        DATE,
  is_active         BOOLEAN DEFAULT TRUE,
  UNIQUE(event_id, code)
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets       ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes   ENABLE ROW LEVEL SECURITY;

-- Public can read published events
CREATE POLICY "Public read published events"
  ON events FOR SELECT USING (status = 'published');

-- Public can read ticket types for published events
CREATE POLICY "Public read ticket types"
  ON ticket_types FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM events e WHERE e.id = event_id AND e.status = 'published'
  ));

-- Service role has full access to all tables (used by API routes)
-- Add policies as needed for your auth approach

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_slug       ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status     ON events(status);
CREATE INDEX IF NOT EXISTS idx_tickets_token     ON tickets(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_tickets_email     ON tickets(buyer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_event     ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_checkins_event    ON check_ins(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_ticket   ON payments(ticket_id);

-- ─────────────────────────────────────────
-- SEED: Default Super Admin
-- ─────────────────────────────────────────
-- Password: Admin1234! (bcrypt hash — change immediately after setup)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
  'admin@tiketflow.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCg8bKSwAuGr3YFP3B7l0kq',
  'Super Admin',
  'super_admin'
) ON CONFLICT (email) DO NOTHING;
