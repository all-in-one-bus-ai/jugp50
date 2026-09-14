/*
# Seed Data: Batches, Halls, Fee Rules, Settings, Event

1. Seed Data
  - 48 batches (8th through 55th) with display labels
  - 21 university halls with former names where applicable
  - 3 fee rules (8-45: 1500, 46-49: 800, 50-55: 500)
  - Settings for guest fee, gateway charge, max guests
  - Initial event: Golden Jubilee Celebration 2026

2. Important Notes
  - Uses ON CONFLICT to be idempotent
  - Halls sorted alphabetically by name
  - Batch names use proper ordinal suffixes
*/

-- Insert batches 8-55
INSERT INTO batches (batch_number, batch_name) VALUES
(8, '8th Batch'), (9, '9th Batch'), (10, '10th Batch'), (11, '11th Batch'),
(12, '12th Batch'), (13, '13th Batch'), (14, '14th Batch'), (15, '15th Batch'),
(16, '16th Batch'), (17, '17th Batch'), (18, '18th Batch'), (19, '19th Batch'),
(20, '20th Batch'), (21, '21st Batch'), (22, '22nd Batch'), (23, '23rd Batch'),
(24, '24th Batch'), (25, '25th Batch'), (26, '26th Batch'), (27, '27th Batch'),
(28, '28th Batch'), (29, '29th Batch'), (30, '30th Batch'), (31, '31st Batch'),
(32, '32nd Batch'), (33, '33rd Batch'), (34, '34th Batch'), (35, '35th Batch'),
(36, '36th Batch'), (37, '37th Batch'), (38, '38th Batch'), (39, '39th Batch'),
(40, '40th Batch'), (41, '41st Batch'), (42, '42nd Batch'), (43, '43rd Batch'),
(44, '44th Batch'), (45, '45th Batch'), (46, '46th Batch'), (47, '47th Batch'),
(48, '48th Batch'), (49, '49th Batch'), (50, '50th Batch'), (51, '51st Batch'),
(52, '52nd Batch'), (53, '53rd Batch'), (54, '54th Batch'), (55, '55th Batch')
ON CONFLICT (batch_number) DO NOTHING;

-- Insert halls (alphabetical)
INSERT INTO halls (name, former_name, sort_order) VALUES
('AFM Kamaluddin Hall', NULL, 1),
('Al-Beruni Hall', NULL, 2),
('Begum Khaleda Zia Hall', NULL, 3),
('Begum Rokeya Hall', NULL, 4),
('Bishwakabi Rabindranath Tagore Hall', NULL, 5),
('Fazilatunnesa Hall', NULL, 6),
('Jahanara Imam Hall', NULL, 7),
('July Chobbish Jagaroni Hall', 'Sheikh Hasina Hall', 8),
('Kazi Nazrul Islam Hall', NULL, 9),
('Mir Mosharraf Hossain Hall', NULL, 10),
('Moulana Bhashani Hall', NULL, 11),
('Nawab Faizunnesa Hall', NULL, 12),
('Nawab Salimullah Hall', NULL, 13),
('Pritilata Hall', NULL, 14),
('Shaheed Felani Khatun Hall', 'Bongomata Fazilatunnesa Mujib Hall', 15),
('Shaheed Rafiq-Jabbar Hall', NULL, 16),
('Shaheed Salam-Barkat Hall', NULL, 17),
('Shaheed Tajuddin Ahmad Hall', NULL, 18),
('Sher-e-Bangla A. K. Fazlul Huq Hall', 'Bangbandhu Sheikh Mujibur Rahman Hall', 19),
('Sufia Kamal Hall', NULL, 20),
('Taramon Bibi Hall', NULL, 21)
ON CONFLICT (name) DO NOTHING;

-- Insert fee rules
INSERT INTO fee_rules (batch_from, batch_to, fee_amount) VALUES
(8, 45, 1500),
(46, 49, 800),
(50, 55, 500)
ON CONFLICT DO NOTHING;

-- Insert settings
INSERT INTO settings (key, value, description) VALUES
('guest_fee', '500', 'Fee per accompanying guest in BDT'),
('gateway_charge_percentage', '2.5', 'Payment gateway charge percentage'),
('gateway_charge_enabled', 'true', 'Whether gateway charge is applied'),
('max_guests', '5', 'Maximum number of accompanying guests allowed'),
('registration_open', 'true', 'Whether registration is currently open'),
('contact_email', 'gp.ju.goldenjubilee@gmail.com', 'Contact email for support'),
('contact_phone', '+8801XXXXXXXXX', 'Contact phone number')
ON CONFLICT (key) DO NOTHING;

-- Insert the main event
INSERT INTO events (name, department, university, event_date, event_day, venue, venue_city, eligible_batches, registration_deadline, status, description)
VALUES (
  'Golden Jubilee Celebration 2026',
  'Department of Government & Politics',
  'Jahangirnagar University',
  '2026-12-18',
  'Friday',
  'Jahangirnagar University',
  'Savar, Dhaka',
  '8th – 55th Batch',
  '2026-11-30',
  'registration_open',
  'The Golden Jubilee Celebration 2026 is a homecoming for everyone who has been part of the Department of Government & Politics, Jahangirnagar University.'
)
ON CONFLICT DO NOTHING;
