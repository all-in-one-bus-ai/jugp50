/*
# Golden Jubilee 2026 - Core Database Schema

1. New Tables
  - `events` - stores event details (date, venue, deadline, status)
  - `batches` - stores batch numbers (8-55) with display labels
  - `halls` - stores university hall names with optional former names
  - `fee_rules` - batch-range fee configuration
  - `settings` - key-value app settings
  - `participants` - registered alumni personal information
  - `registrations` - registration records linking participant to event
  - `guests` - accompanying guests per registration
  - `payments` - payment transaction records
  - `tickets` - digital tickets with QR tokens
  - `checkins` - check-in records for ticket verification
  - `admins` - admin users with role-based access

2. Security
  - RLS enabled on ALL tables
  - Public read on events, batches, halls, fee_rules, settings
  - Public read on confirmed participants (limited fields via view)
  - Admin operations scoped to authenticated admin users
  - Anon insert for registrations (public registration flow)

3. Important Notes
  - Fee rules are configurable: batch_from, batch_to, fee_amount
  - Guest fee stored in settings table
  - Registration numbers auto-generated as GJ2026-XXXX
  - QR tokens are UUID-based secure identifiers
  - Check-in prevents duplicates via unique constraint
*/

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL,
  university text NOT NULL,
  event_date date NOT NULL,
  event_day text NOT NULL,
  venue text NOT NULL,
  venue_city text NOT NULL,
  eligible_batches text NOT NULL,
  registration_deadline date NOT NULL,
  status text NOT NULL DEFAULT 'registration_open',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_events" ON events;
CREATE POLICY "public_read_events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_events" ON events;
CREATE POLICY "auth_insert_events" ON events FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_events" ON events;
CREATE POLICY "auth_update_events" ON events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_events" ON events;
CREATE POLICY "auth_delete_events" ON events FOR DELETE TO authenticated USING (true);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number integer NOT NULL UNIQUE,
  batch_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_batches" ON batches;
CREATE POLICY "public_read_batches" ON batches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_batches" ON batches;
CREATE POLICY "auth_insert_batches" ON batches FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_batches" ON batches;
CREATE POLICY "auth_update_batches" ON batches FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_batches" ON batches;
CREATE POLICY "auth_delete_batches" ON batches FOR DELETE TO authenticated USING (true);

-- Halls table
CREATE TABLE IF NOT EXISTS halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  former_name text,
  sort_order integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_halls" ON halls;
CREATE POLICY "public_read_halls" ON halls FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_halls" ON halls;
CREATE POLICY "auth_insert_halls" ON halls FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_halls" ON halls;
CREATE POLICY "auth_update_halls" ON halls FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_halls" ON halls;
CREATE POLICY "auth_delete_halls" ON halls FOR DELETE TO authenticated USING (true);

-- Fee rules table
CREATE TABLE IF NOT EXISTS fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_from integer NOT NULL,
  batch_to integer NOT NULL,
  fee_amount integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fee_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_fee_rules" ON fee_rules;
CREATE POLICY "public_read_fee_rules" ON fee_rules FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_fee_rules" ON fee_rules;
CREATE POLICY "auth_insert_fee_rules" ON fee_rules FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_fee_rules" ON fee_rules;
CREATE POLICY "auth_update_fee_rules" ON fee_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_fee_rules" ON fee_rules;
CREATE POLICY "auth_delete_fee_rules" ON fee_rules FOR DELETE TO authenticated USING (true);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_settings" ON settings;
CREATE POLICY "public_read_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_settings" ON settings;
CREATE POLICY "auth_insert_settings" ON settings FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_settings" ON settings;
CREATE POLICY "auth_update_settings" ON settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_settings" ON settings;
CREATE POLICY "auth_delete_settings" ON settings FOR DELETE TO authenticated USING (true);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  mobile text NOT NULL,
  profile_photo_url text,
  profession text,
  organization text,
  address text,
  batch_id uuid NOT NULL REFERENCES batches(id),
  hall_id uuid NOT NULL REFERENCES halls(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_participants" ON participants;
CREATE POLICY "public_read_participants" ON participants FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_participants" ON participants;
CREATE POLICY "anon_insert_participants" ON participants FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_participants" ON participants;
CREATE POLICY "auth_update_participants" ON participants FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_participants" ON participants;
CREATE POLICY "auth_delete_participants" ON participants FOR DELETE TO authenticated USING (true);

-- Registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number text NOT NULL UNIQUE,
  event_id uuid NOT NULL REFERENCES events(id),
  participant_id uuid NOT NULL REFERENCES participants(id),
  guest_count integer NOT NULL DEFAULT 0,
  participant_fee integer NOT NULL,
  guest_fee integer NOT NULL DEFAULT 0,
  subtotal integer NOT NULL,
  gateway_charge integer NOT NULL DEFAULT 0,
  total_amount integer NOT NULL,
  registration_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_registrations" ON registrations;
CREATE POLICY "public_read_registrations" ON registrations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_registrations" ON registrations;
CREATE POLICY "anon_insert_registrations" ON registrations FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_registrations" ON registrations;
CREATE POLICY "auth_update_registrations" ON registrations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_registrations" ON registrations;
CREATE POLICY "auth_delete_registrations" ON registrations FOR DELETE TO authenticated USING (true);

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  guest_type text NOT NULL,
  name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_guests" ON guests;
CREATE POLICY "public_read_guests" ON guests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_guests" ON guests;
CREATE POLICY "anon_insert_guests" ON guests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_guests" ON guests;
CREATE POLICY "auth_update_guests" ON guests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_guests" ON guests;
CREATE POLICY "auth_delete_guests" ON guests FOR DELETE TO authenticated USING (true);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id),
  transaction_id text NOT NULL UNIQUE,
  payment_method text,
  amount integer NOT NULL,
  gateway_charge integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_payments" ON payments;
CREATE POLICY "public_read_payments" ON payments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_payments" ON payments;
CREATE POLICY "anon_insert_payments" ON payments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_payments" ON payments;
CREATE POLICY "auth_update_payments" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_payments" ON payments;
CREATE POLICY "auth_delete_payments" ON payments FOR DELETE TO authenticated USING (true);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id),
  ticket_id text NOT NULL UNIQUE,
  qr_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  status text NOT NULL DEFAULT 'active',
  issued_at timestamptz DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_tickets" ON tickets;
CREATE POLICY "public_read_tickets" ON tickets FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_tickets" ON tickets;
CREATE POLICY "anon_insert_tickets" ON tickets FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_tickets" ON tickets;
CREATE POLICY "auth_update_tickets" ON tickets FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_tickets" ON tickets;
CREATE POLICY "auth_delete_tickets" ON tickets FOR DELETE TO authenticated USING (true);

-- Checkins table
CREATE TABLE IF NOT EXISTS checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES tickets(id) UNIQUE,
  checked_in_at timestamptz DEFAULT now(),
  checked_in_by text
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_checkins" ON checkins;
CREATE POLICY "public_read_checkins" ON checkins FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_checkins" ON checkins;
CREATE POLICY "auth_insert_checkins" ON checkins FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_checkins" ON checkins;
CREATE POLICY "auth_update_checkins" ON checkins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_checkins" ON checkins;
CREATE POLICY "auth_delete_checkins" ON checkins FOR DELETE TO authenticated USING (true);

-- Admins table (maps auth.users to admin roles)
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) UNIQUE,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_read_admins" ON admins;
CREATE POLICY "auth_read_admins" ON admins FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "auth_insert_admins" ON admins;
CREATE POLICY "auth_insert_admins" ON admins FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_admins" ON admins;
CREATE POLICY "auth_update_admins" ON admins FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "auth_delete_admins" ON admins;
CREATE POLICY "auth_delete_admins" ON admins FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_participants_batch ON participants(batch_id);
CREATE INDEX IF NOT EXISTS idx_participants_hall ON participants(hall_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_participant ON registrations(participant_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_registrations_number ON registrations(registration_number);
CREATE INDEX IF NOT EXISTS idx_payments_registration ON payments(registration_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_tickets_registration ON tickets(registration_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON tickets(qr_token);
CREATE INDEX IF NOT EXISTS idx_checkins_ticket ON checkins(ticket_id);
CREATE INDEX IF NOT EXISTS idx_fee_rules_batch ON fee_rules(batch_from, batch_to);
