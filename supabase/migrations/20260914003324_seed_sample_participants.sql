/*
# Seed Sample Participants for Development/Testing

1. Inserts ~20 sample participants across various batches and halls
2. Creates registrations with different statuses
3. Creates payment records and tickets
*/

DO $$
DECLARE
  v_event_id uuid;
  v_batch_id uuid;
  v_hall_id uuid;
  v_participant_id uuid;
  v_registration_id uuid;
  v_reg_num text;
  v_txn_id text;
  v_counter integer := 1;
BEGIN
  SELECT id INTO v_event_id FROM events LIMIT 1;

  -- 1: Md Arifur Rahman
  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 12;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Jahanara Imam Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Md Arifur Rahman', 'arifur95@gmail.com', '01874831773', 'Marketing Executive', 'Amazon UK', 'Luton, United Kingdom', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    v_reg_num := 'GJ2026-7536';
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES (v_reg_num, v_event_id, v_participant_id, 1, 1500, 500, 2000, 50, 2050, 'confirmed', '2026-09-13 10:24:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      v_txn_id := 'TXN-' || substr(gen_random_uuid()::text, 1, 12);
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at)
      VALUES (v_registration_id, v_txn_id, 'bKash', 2050, 50, 'paid', '2026-09-13 10:24:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status)
      VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  -- 2: Nusrat Jahan
  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 11;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Begum Rokeya Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Nusrat Jahan', 'nusrat.jahan@gmail.com', '01712345678', 'Lecturer', 'Dhaka University', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    v_reg_num := 'GJ2026-7538';
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES (v_reg_num, v_event_id, v_participant_id, 0, 1500, 0, 1500, 38, 1538, 'confirmed', '2026-09-13 09:18:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at)
      VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'Nagad', 1538, 38, 'paid', '2026-09-13 09:18:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status)
      VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  -- 3: Tanvir Ahmed
  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 20;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Shaheed Salam-Barkat Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Tanvir Ahmed', 'tanvir@outlook.com', '01898765432', 'Policy Analyst', 'Ministry of Planning', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    v_reg_num := 'GJ2026-7539';
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES (v_reg_num, v_event_id, v_participant_id, 2, 1500, 1000, 2500, 63, 2563, 'confirmed', '2026-09-12 22:41:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at)
      VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 2563, 63, 'paid', '2026-09-12 22:41:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status)
      VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  -- 4: Sadia Afrin (pending)
  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 12;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Begum Rokeya Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Sadia Afrin', 'sadia.afrin@gmail.com', '01623456789', 'Business Owner', 'Self-employed', 'Chittagong, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    v_reg_num := 'GJ2026-7540';
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES (v_reg_num, v_event_id, v_participant_id, 0, 1500, 0, 1500, 38, 1538, 'pending', '2026-09-12 20:12:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status)
      VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), NULL, 1538, 38, 'pending');
    END IF;
  END IF;

  -- 5: Mehedi Hasan
  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 9;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Nawab Salimullah Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Mehedi Hasan', 'mehedi.hasan@gmail.com', '01534567890', 'NGO Director', 'BRAC', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    v_reg_num := 'GJ2026-7541';
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES (v_reg_num, v_event_id, v_participant_id, 0, 1500, 0, 1500, 38, 1538, 'confirmed', '2026-09-12 18:06:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at)
      VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 1538, 38, 'paid', '2026-09-12 18:06:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status)
      VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  -- 6-15: More participants
  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 13;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Begum Rokeya Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Faria Sultana', 'faria.sultana@gmail.com', '01745678901', 'Professor', 'JU', 'Savar, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7542', v_event_id, v_participant_id, 1, 1500, 500, 2000, 50, 2050, 'confirmed', '2026-09-11 14:30:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 2050, 50, 'paid', '2026-09-11 14:30:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 12;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Shaheed Salam-Barkat Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Sakib Mahmud', 'sakib.mahmud@gmail.com', '01856789012', 'Software Engineer', 'Google', 'California, USA', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7543', v_event_id, v_participant_id, 0, 1500, 0, 1500, 38, 1538, 'confirmed', '2026-09-10 11:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'Card', 1538, 38, 'paid', '2026-09-10 11:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 11;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Jahanara Imam Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Tahsina Akter', 'tahsina@gmail.com', '01967890123', 'Journalist', 'Daily Star', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7544', v_event_id, v_participant_id, 0, 1500, 0, 1500, 38, 1538, 'confirmed', '2026-09-09 16:45:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 1538, 38, 'paid', '2026-09-09 16:45:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 10;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Nawab Salimullah Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Raiful Islam', 'raiful@outlook.com', '01678901234', 'Bank Manager', 'Sonali Bank', 'Rajshahi, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7545', v_event_id, v_participant_id, 1, 1500, 500, 2000, 50, 2050, 'confirmed', '2026-09-08 09:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'Nagad', 2050, 50, 'paid', '2026-09-08 09:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 46;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Begum Rokeya Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Mim Chowdhury', 'mim.chow@gmail.com', '01789012345', 'Student', 'JU', 'Savar, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7546', v_event_id, v_participant_id, 0, 800, 0, 800, 20, 820, 'confirmed', '2026-09-07 13:20:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 820, 20, 'paid', '2026-09-07 13:20:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 9;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Shaheed Salam-Barkat Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Nahid Hasan', 'nahid.hasan@yahoo.com', '01890123456', 'Advocate', 'Supreme Court', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7547', v_event_id, v_participant_id, 2, 1500, 1000, 2500, 63, 2563, 'confirmed', '2026-09-06 17:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 2563, 63, 'paid', '2026-09-06 17:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 50;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Jahanara Imam Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Umme Habiba', 'umme.habiba@gmail.com', '01901234567', 'Student', 'JU', 'Savar, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7548', v_event_id, v_participant_id, 0, 500, 0, 500, 13, 513, 'confirmed', '2026-09-05 10:30:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'Nagad', 513, 13, 'paid', '2026-09-05 10:30:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 12;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Nawab Salimullah Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Rayhan Kabir', 'rayhan.kabir@gmail.com', '01612345678', 'Civil Servant', 'BCS Admin', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7549', v_event_id, v_participant_id, 1, 1500, 500, 2000, 50, 2050, 'confirmed', '2026-09-04 15:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 2050, 50, 'paid', '2026-09-04 15:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 10;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Begum Rokeya Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Farzana Islam', 'farzana@gmail.com', '01523456789', 'Doctor', 'Dhaka Medical College', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7550', v_event_id, v_participant_id, 0, 1500, 0, 1500, 38, 1538, 'confirmed', '2026-09-03 12:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'Card', 1538, 38, 'paid', '2026-09-03 12:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 8;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Shaheed Salam-Barkat Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Kazi Ahsan', 'kazi.ahsan@gmail.com', '01734567890', 'Retired Professor', 'JU', 'Savar, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7551', v_event_id, v_participant_id, 1, 1500, 500, 2000, 50, 2050, 'confirmed', '2026-09-02 08:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 2050, 50, 'paid', '2026-09-02 08:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  -- More diverse batches
  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 25;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Kazi Nazrul Islam Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Sharif Uddin', 'sharif@gmail.com', '01845678901', 'Entrepreneur', 'Tech BD', 'Dhaka, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7552', v_event_id, v_participant_id, 3, 1500, 1500, 3000, 75, 3075, 'confirmed', '2026-09-01 11:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 3075, 75, 'paid', '2026-09-01 11:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 35;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Moulana Bhashani Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Imran Hossain', 'imran.h@gmail.com', '01956789012', 'Banker', 'Dutch Bangla Bank', 'Khulna, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7553', v_event_id, v_participant_id, 0, 1500, 0, 1500, 38, 1538, 'confirmed', '2026-08-30 09:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'Nagad', 1538, 38, 'paid', '2026-08-30 09:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 48;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Sher-e-Bangla A. K. Fazlul Huq Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Anisur Rahman', 'anisur@gmail.com', '01667890123', 'Research Assistant', 'JU', 'Savar, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7554', v_event_id, v_participant_id, 0, 800, 0, 800, 20, 820, 'confirmed', '2026-08-28 14:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 820, 20, 'paid', '2026-08-28 14:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 52;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'Sufia Kamal Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Tasnim Akter', 'tasnim@gmail.com', '01778901234', 'Student', 'JU', 'Savar, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7555', v_event_id, v_participant_id, 0, 500, 0, 500, 13, 513, 'confirmed', '2026-08-25 10:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status, paid_at) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), 'bKash', 513, 13, 'paid', '2026-08-25 10:00:00+06');
      INSERT INTO tickets (registration_id, ticket_id, status) VALUES (v_registration_id, 'TKT-' || substr(gen_random_uuid()::text, 1, 8), 'active');
    END IF;
  END IF;

  SELECT id INTO v_batch_id FROM batches WHERE batch_number = 40;
  SELECT id INTO v_hall_id FROM halls WHERE name = 'AFM Kamaluddin Hall';
  INSERT INTO participants (full_name, email, mobile, profession, organization, address, batch_id, hall_id)
  VALUES ('Rafiq Ahmed', 'rafiq.ahmed@gmail.com', '01489012345', 'Teacher', 'Govt. College', 'Sylhet, Bangladesh', v_batch_id, v_hall_id)
  ON CONFLICT DO NOTHING RETURNING id INTO v_participant_id;
  IF v_participant_id IS NOT NULL THEN
    INSERT INTO registrations (registration_number, event_id, participant_id, guest_count, participant_fee, guest_fee, subtotal, gateway_charge, total_amount, registration_status, created_at)
    VALUES ('GJ2026-7556', v_event_id, v_participant_id, 2, 1500, 1000, 2500, 63, 2563, 'cancelled', '2026-08-20 16:00:00+06')
    ON CONFLICT DO NOTHING RETURNING id INTO v_registration_id;
    IF v_registration_id IS NOT NULL THEN
      INSERT INTO payments (registration_id, transaction_id, payment_method, amount, gateway_charge, status) VALUES (v_registration_id, 'TXN-' || substr(gen_random_uuid()::text, 1, 12), NULL, 2563, 63, 'cancelled');
    END IF;
  END IF;

END $$;
