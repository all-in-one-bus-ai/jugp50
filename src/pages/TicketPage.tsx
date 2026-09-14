import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2,
  AlertCircle,
  Printer,
  Share2,
  Copy,
  Check,
  UserPlus,
  CheckCircle,
  Calendar,
  MapPin,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/lib/supabase';
import { getInitials, getStatusColor } from '@/lib/utils';
import type { Registration, Participant, Batch, Hall, Payment, Ticket } from '@/lib/types';

interface TicketData extends Registration {
  participant: Participant & {
    batch: Batch;
    hall: Hall;
  };
  payment: Payment | null;
  ticket: Ticket | null;
}

export default function TicketPage() {
  const { registrationId } = useParams<{ registrationId: string }>();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTicket() {
      if (!registrationId) {
        setError('No registration ID provided.');
        setLoading(false);
        return;
      }

      const { data: reg, error: fetchError } = await supabase
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

      if (fetchError || !reg) {
        setError('Ticket not found. Please check your link.');
        setLoading(false);
        return;
      }

      setData({
        ...reg,
        participant: reg.participant,
        payment: Array.isArray(reg.payment) ? reg.payment[0] ?? null : reg.payment,
        ticket: Array.isArray(reg.ticket) ? reg.ticket[0] ?? null : reg.ticket,
      } as TicketData);
      setLoading(false);
    }

    loadTicket();
  }, [registrationId]);

  const handlePrint = () => window.print();

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShareFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareWhatsApp = () => {
    const message = `I've registered for the Golden Jubilee Celebration 2026 – Department of Government & Politics, Jahangirnagar University! 🎉 ${shareUrl}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-jubilee-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Ticket Not Found</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link to="/register" className="btn-primary">
            Go to Registration
          </Link>
        </div>
      </div>
    );
  }

  const { participant, ticket, payment } = data;
  const paymentStatus = payment?.status ?? 'unknown';

  return (
    <div className="min-h-screen bg-cream-50 py-12 lg:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Page Heading */}
        <div className="text-center mb-8 animate-slide-up">
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900">
            Your Digital Ticket
          </h1>
        </div>

        {/* Ticket Card */}
        <div className="card overflow-hidden border-2 border-jubilee-200 print:border print:shadow-none mb-8">
          {/* Ticket Header */}
          <div className="bg-gradient-to-r from-jubilee-800 via-jubilee-700 to-jubilee-600 text-white px-6 py-6 text-center">
            <h2 className="font-serif text-2xl lg:text-3xl font-bold text-gold-400 mb-1">
              Golden Jubilee Celebration 2026
            </h2>
            <p className="text-jubilee-200 text-sm">Department of Government & Politics</p>
            <p className="text-jubilee-300 text-xs">Jahangirnagar University</p>
          </div>

          {/* Decorative Divider */}
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-cream-50 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-cream-50 rounded-full" />
            <div className="border-t-2 border-dashed border-gray-200 mx-6" />
          </div>

          {/* Ticket Body */}
          <div className="p-6 lg:p-8">
            <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
              {/* Left Section */}
              <div className="flex-1">
                {/* Photo / Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  {participant.profile_photo_url ? (
                    <img
                      src={participant.profile_photo_url}
                      alt={participant.full_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-jubilee-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-jubilee-100 text-jubilee-700 flex items-center justify-center text-xl font-bold font-serif">
                      {getInitials(participant.full_name)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-serif text-xl font-bold text-gray-900">
                      {participant.full_name}
                    </h3>
                    <p className="text-sm text-gray-500">{participant.batch.batch_name}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <TicketDetail label="Hall" value={participant.hall.name} />
                  {participant.profession && (
                    <TicketDetail label="Profession" value={participant.profession} />
                  )}
                  {participant.organization && (
                    <TicketDetail label="Organization" value={participant.organization} />
                  )}
                  <TicketDetail label="Mobile" value={participant.mobile} />
                  <TicketDetail label="Email" value={participant.email} />
                  {data.guest_count > 0 && (
                    <TicketDetail
                      label="Guests"
                      value={`${data.guest_count} guest${data.guest_count > 1 ? 's' : ''}`}
                    />
                  )}
                </div>
              </div>

              {/* Right Section */}
              <div className="flex flex-col items-center justify-center md:border-l md:border-gray-100 md:pl-6 lg:pl-8">
                {/* QR Code */}
                {ticket?.qr_token && (
                  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm mb-4">
                    <QRCodeSVG value={ticket.qr_token} size={160} />
                  </div>
                )}

                {/* Registration Number */}
                <p className="text-xs text-gray-500 mb-1">Registration No</p>
                <p className="font-mono text-sm font-semibold text-gray-900 mb-3">
                  {data.registration_number}
                </p>

                {/* Payment Status */}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(paymentStatus)}`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {paymentStatus === 'paid' ? 'Payment Successful' : paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 bg-cream-50 rounded-full" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-6 h-6 bg-cream-50 rounded-full" />
            <div className="border-t-2 border-dashed border-gray-200 mx-6" />
          </div>

          {/* Ticket Footer */}
          <div className="px-6 py-4 bg-cream-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-jubilee-600" />
              <span>
                <span className="font-medium text-gray-800">Event Date:</span> 18 December 2026
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-jubilee-600" />
              <span>
                <span className="font-medium text-gray-800">Venue:</span> Jahangirnagar University
                Campus
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 print:hidden">
          <button onClick={handlePrint} className="btn-gold !py-3">
            <Printer className="w-4 h-4" />
            Download / Print Ticket
          </button>
          <button onClick={handleShareFacebook} className="btn-secondary !py-3">
            <Share2 className="w-4 h-4" />
            Share on Facebook
          </button>
          <button onClick={handleShareLinkedIn} className="btn-secondary !py-3">
            <Share2 className="w-4 h-4" />
            Share on LinkedIn
          </button>
          <button onClick={handleShareWhatsApp} className="btn-secondary !py-3">
            <Share2 className="w-4 h-4" />
            Share on WhatsApp
          </button>
          <button onClick={handleCopyLink} className="btn-secondary !py-3">
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Link Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Link
              </>
            )}
          </button>
          <Link to="/register" className="btn-secondary !py-3">
            <UserPlus className="w-4 h-4" />
            New Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

function TicketDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
