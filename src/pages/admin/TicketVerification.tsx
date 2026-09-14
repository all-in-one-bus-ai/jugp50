import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDateTime, getStatusColor, getInitials } from '@/lib/utils';
import {
  ScanLine,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Loader2,
} from 'lucide-react';

type Mode = 'scan' | 'search';

interface TicketResult {
  id: string;
  ticket_id: string;
  qr_token: string;
  status: string;
  issued_at: string;
  registration: {
    registration_number: string;
    guest_count: number;
    participant: {
      full_name: string;
      batch: { batch_name: string } | null;
      hall: { name: string } | null;
    } | null;
    payment: { status: string } | null;
  } | null;
}

interface CheckinResult {
  id: string;
  checked_in_at: string;
  checked_in_by: string | null;
}

export default function TicketVerification() {
  const [mode, setMode] = useState<Mode>('scan');
  const [scanInput, setScanInput] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<TicketResult | null>(null);
  const [checkin, setCheckin] = useState<CheckinResult | null>(null);
  const [error, setError] = useState('');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  function reset() {
    setTicket(null);
    setCheckin(null);
    setError('');
    setCheckinSuccess(false);
  }

  async function handleVerify() {
    const token = scanInput.trim();
    if (!token) return;
    reset();
    setLoading(true);

    const { data, error: fetchErr } = await supabase
      .from('tickets')
      .select(
        '*, registration:registrations(registration_number, guest_count, participant:participants(full_name, batch:batches(batch_name), hall:halls(name)), payment:payments(status))'
      )
      .eq('qr_token', token)
      .maybeSingle();

    if (fetchErr) {
      setError('Error verifying ticket. Please try again.');
      setLoading(false);
      return;
    }
    if (!data) {
      setError('Ticket not found. Please check the QR code and try again.');
      setLoading(false);
      return;
    }

    setTicket(data as TicketResult);
    await fetchCheckin(data.id);
    setLoading(false);
  }

  async function handleSearch() {
    const query = searchInput.trim();
    if (!query) return;
    reset();
    setLoading(true);

    // Try ticket_id first, then registration_number
    let { data, error: fetchErr } = await supabase
      .from('tickets')
      .select(
        '*, registration:registrations(registration_number, guest_count, participant:participants(full_name, batch:batches(batch_name), hall:halls(name)), payment:payments(status))'
      )
      .eq('ticket_id', query)
      .maybeSingle();

    if (!data && !fetchErr) {
      const { data: regData, error: regErr } = await supabase
        .from('tickets')
        .select(
          '*, registration:registrations!inner(registration_number, guest_count, participant:participants(full_name, batch:batches(batch_name), hall:halls(name)), payment:payments(status))'
        )
        .eq('registrations.registration_number', query)
        .maybeSingle();
      data = regData;
      fetchErr = regErr;
    }

    if (fetchErr) {
      setError('Error searching for ticket. Please try again.');
      setLoading(false);
      return;
    }
    if (!data) {
      setError('Ticket not found. Please check the ID and try again.');
      setLoading(false);
      return;
    }

    setTicket(data as TicketResult);
    await fetchCheckin(data.id);
    setLoading(false);
  }

  async function fetchCheckin(ticketId: string) {
    const { data } = await supabase
      .from('checkins')
      .select('*')
      .eq('ticket_id', ticketId)
      .maybeSingle();
    if (data) setCheckin(data as CheckinResult);
  }

  async function handleCheckIn() {
    if (!ticket) return;
    setCheckingIn(true);

    const { error: insertErr } = await supabase
      .from('checkins')
      .insert({ ticket_id: ticket.id, checked_in_by: 'Admin' });

    if (insertErr) {
      if (insertErr.code === '23505') {
        setError('This ticket has already been checked in.');
      } else {
        setError('Failed to check in. Please try again.');
      }
      setCheckingIn(false);
      return;
    }

    await supabase
      .from('tickets')
      .update({ status: 'checked_in' })
      .eq('id', ticket.id);

    setTicket({ ...ticket, status: 'checked_in' });
    setCheckinSuccess(true);
    setCheckingIn(false);

    // Refresh checkin info
    await fetchCheckin(ticket.id);
  }

  const participant = ticket?.registration?.participant;
  const registration = ticket?.registration;
  const payment = ticket?.registration?.payment;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          Ticket Verification
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Scan QR code or search manually to verify and check in attendees
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => {
            setMode('scan');
            reset();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'scan'
              ? 'bg-white text-jubilee-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          Scan QR Code
        </button>
        <button
          onClick={() => {
            setMode('search');
            reset();
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'search'
              ? 'bg-white text-jubilee-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Search className="w-4 h-4" />
          Manual Search
        </button>
      </div>

      {/* Scan Mode */}
      {mode === 'scan' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="border-2 border-dashed border-jubilee-300 rounded-xl bg-jubilee-50/50 p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-jubilee-100 flex items-center justify-center">
              <ScanLine className="w-8 h-8 text-jubilee-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Enter QR Code or scan with camera
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Paste the QR token UUID below
              </p>
            </div>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                className="input-field flex-1 text-center font-mono text-sm"
              />
              <button
                onClick={handleVerify}
                disabled={loading || !scanInput.trim()}
                className="btn-primary !py-2.5 !px-6 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Mode */}
      {mode === 'search' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-3">
            Search by Ticket ID or Registration Number
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Ticket ID or Registration Number"
                className="input-field !pl-10 w-full"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading || !searchInput.trim()}
              className="btn-primary !py-2.5 !px-6 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-jubilee-600 animate-spin" />
          <p className="text-sm text-gray-500">Verifying ticket…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-white rounded-2xl border border-red-200 p-6">
          <div className="flex items-center gap-3 text-red-600">
            <XCircle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-medium">Ticket not found</p>
              <p className="text-sm text-red-500 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Result Card */}
      {ticket && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Check-in Success Banner */}
          {checkinSuccess && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">
                  Check-in Successful!
                </p>
                <p className="text-sm text-emerald-600">
                  Attendee has been checked in successfully.
                </p>
              </div>
            </div>
          )}

          {/* Participant Info */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-jubilee-100 flex items-center justify-center text-jubilee-700 font-bold text-lg shrink-0">
                {participant ? (
                  getInitials(participant.full_name)
                ) : (
                  <User className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900">
                  {participant?.full_name || 'Unknown'}
                </h3>
                <p className="text-sm text-gray-500">
                  {registration?.registration_number}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  ticket.status
                )}`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
            </div>

            {/* Details Grid */}
            <div className="mt-5 grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Batch</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {participant?.batch?.batch_name || '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Hall</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {participant?.hall?.name || '—'}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Guests</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {registration?.guest_count ?? 0}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Payment</p>
                <p className="text-sm font-medium mt-0.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      payment?.status || 'unknown'
                    )}`}
                  >
                    {payment?.status || 'N/A'}
                  </span>
                </p>
              </div>
            </div>

            {/* Check-in Section */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              {checkin ? (
                <div className="flex items-center gap-3 bg-amber-50 rounded-xl p-4">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Already Checked In
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      {formatDateTime(checkin.checked_in_at)} by{' '}
                      {checkin.checked_in_by || 'Unknown'}
                    </p>
                  </div>
                </div>
              ) : !checkinSuccess ? (
                <button
                  onClick={handleCheckIn}
                  disabled={checkingIn}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3.5 rounded-xl transition-colors disabled:opacity-60"
                >
                  {checkingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking in…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Check In
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
