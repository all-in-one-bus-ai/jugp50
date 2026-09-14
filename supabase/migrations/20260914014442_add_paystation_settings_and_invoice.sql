/*
# Add PayStation Payment Gateway Support

1. Modified Tables
  - `payments`: Add `invoice_number` column (text, nullable) for PayStation invoice tracking
  - `payments`: Add `gateway_response` column (text, nullable) for raw IPN/response logging

2. New Settings
  - `paystation_env` - sandbox or live
  - `paystation_merchant_id` - merchant ID credential
  - `paystation_password` - merchant password credential
  - `paystation_callback_url` - browser return URL after payment
  - `paystation_ipn_url` - server-to-server IPN URL

3. Important Notes
  - Sandbox credentials from official PayStation docs are pre-populated
  - Credentials are stored in the settings table (admin-configurable)
  - Edge functions read these at runtime so admins can switch sandbox/live
  - Index added on payments.invoice_number for fast IPN lookups
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE payments ADD COLUMN invoice_number text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'gateway_response'
  ) THEN
    ALTER TABLE payments ADD COLUMN gateway_response text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_number);

-- PayStation settings (sandbox credentials from official docs)
INSERT INTO settings (key, value, description) VALUES
  ('paystation_env', 'sandbox', 'PayStation environment: sandbox or live'),
  ('paystation_merchant_id', '104-1653730183', 'PayStation Merchant ID'),
  ('paystation_password', 'gamecoderstorepass', 'PayStation Password'),
  ('paystation_callback_url', '', 'PayStation browser callback URL (auto-detected if empty)'),
  ('paystation_ipn_url', '', 'PayStation IPN URL (auto-detected if empty)')
ON CONFLICT (key) DO NOTHING;
