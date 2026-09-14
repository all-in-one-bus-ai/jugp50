import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Ticket, UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime, formatCurrency } from '@/lib/utils';
import type { Registration, Participant, Batch, Hall, Payment, Ticket as TicketType } from '@/lib/types';

interface RegistrationDetails extends Registration {
  participant: Participant & {
    batch: Batch;
    hall: Hall;
  };
  payment: Payment | null;
  ticket: TicketType | null;
}

export default function ConfirmationPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const [registration, setRegistration] = useState<RegistrationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRegistration() {
      if (!registrationId) {
        setError('No registration ID provided.');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select(`
          *,
          participant:participants (
            *,
            batch:batches (*),
            hall:halls (*)
          ),
          payment:payments (*),
          ticket:tickets (*)
        `)
        .eq('id', registrationId)
        .single();

      if (fetchError || !data) {
        setError('Registration not found. Please check your registration link.');
        setLoading(false);
        return;
      }

      setRegistration({
        ...data,
        participant: data.participant,
        payment: Array.isArray(data.payment) ? data.payment[0] ?? null : data.payment,
        ticket: Array.isArray(data.ticket) ? data.ticket[0] ?? null : data.ticket,
      } as RegistrationDetails);
      setLoading(false);
    }

    loadRegistration();
  }, [registrationId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-jubilee-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your registration...</p>
        </div>
      </div>
    );
  }

  if (error || !registration) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
            Registration Not Found
          </h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/register" className="btn-primary">
            Go to Registration
          </Link>
        </div>
      </div>
    );
  }

  const { participant } = registration;

  return (
    <div className="min-h-screen bg-cream-50 py-12 lg:py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Success Icon */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>

          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            Registration Confirmed!
          </h1>
          <p className="text-gray-600 leading-relaxed max-w-lg mx-auto">
            Thank you for registering for the Golden Jubilee Celebration 2026. We look forward to
            welcoming you to campus.
          </p>
        </div>

        {/* Confirmed Badge */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            Your Registration is Confirmed!
          </span>
        </div>

        {/* Email Info */}
        <p className="text-center text-sm text-gray-500 mb-8">
          A confirmation email has been sent to{' '}
          <span className="font-medium text-gray-700">{participant.email}</span>
        </p>

        {/* Registration Details Card */}
        <div className="card p-6 lg:p-8 mb-8">
          <h2 className="font-serif text-xl font-semibold text-gray-900 mb-6 pb-4 border-b border-gray-100">
            Registration Details
          </h2>

          <div className="space-y-4">
            <DetailRow label="Registration No" value={registration.registration_number} />
            <DetailRow label="Participant Name" value={participant.full_name} />
            <DetailRow label="Batch" value={participant.batch.batch_name} />
            <DetailRow label="Hall" value={participant.hall.name} />
            <DetailRow
              label="Payment"
              value={
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Payment Successful
                </span>
              }
            />
            <DetailRow
              label="Date & Time"
              value={formatDateTime(registration.created_at)}
            />
            <DetailRow
              label="Amount Paid"
              value={
                <span className="font-semibold text-gray-900">
                  {formatCurrency(registration.total_amount)}
                </span>
              }
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/ticket/${registrationId}`}
            className="btn-gold flex-1 !py-3.5"
          >
            <Ticket className="w-5 h-5" />
            View Your Ticket
          </Link>
          <Link
            to="/register"
            className="btn-secondary flex-1 !py-3.5"
          >
            <UserPlus className="w-5 h-5" />
            New Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 mb-1 sm:mb-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
