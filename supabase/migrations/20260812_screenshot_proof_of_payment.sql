-- Add screenshot proof of payment support
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS payment_screenshot TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS screenshot_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_screenshot TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS screenshot_verified BOOLEAN DEFAULT FALSE;

-- Add a verification_log table to track AI verification attempts
CREATE TABLE IF NOT EXISTS payment_verifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id       UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  payment_id      UUID REFERENCES payments(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('manual_ref', 'screenshot_ocr', 'admin_review')),
  extracted_ref   TEXT,
  extracted_amount DECIMAL(10,2),
  extracted_phone TEXT,
  screenshot_data TEXT,
  confidence      DECIMAL(5,2), -- OCR confidence score 0-100
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'verified', 'rejected', 'needs_review')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_verifications_ticket ON payment_verifications(ticket_id);
