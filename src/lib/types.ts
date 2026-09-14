export interface Event {
  id: string;
  name: string;
  department: string;
  university: string;
  event_date: string;
  event_day: string;
  venue: string;
  venue_city: string;
  eligible_batches: string;
  registration_deadline: string;
  status: string;
  description: string | null;
  created_at: string;
}

export interface Batch {
  id: string;
  batch_number: number;
  batch_name: string;
}

export interface Hall {
  id: string;
  name: string;
  former_name: string | null;
  sort_order: number | null;
}

export interface FeeRule {
  id: string;
  batch_from: number;
  batch_to: number;
  fee_amount: number;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
}

export interface Participant {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  profile_photo_url: string | null;
  profession: string | null;
  organization: string | null;
  address: string | null;
  batch_id: string;
  hall_id: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  registration_number: string;
  event_id: string;
  participant_id: string;
  guest_count: number;
  participant_fee: number;
  guest_fee: number;
  subtotal: number;
  gateway_charge: number;
  total_amount: number;
  registration_status: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  registration_id: string;
  transaction_id: string;
  payment_method: string | null;
  amount: number;
  gateway_charge: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  registration_id: string;
  ticket_id: string;
  qr_token: string;
  status: string;
  issued_at: string;
}

export interface Checkin {
  id: string;
  ticket_id: string;
  checked_in_at: string;
  checked_in_by: string | null;
}

export interface Admin {
  id: string;
  user_id: string;
  name: string;
  role: string;
  created_at: string;
}

export interface ParticipantWithDetails extends Participant {
  batch: Batch;
  hall: Hall;
  registration?: Registration & {
    payment?: Payment;
    ticket?: Ticket & { checkin?: Checkin };
  };
}
