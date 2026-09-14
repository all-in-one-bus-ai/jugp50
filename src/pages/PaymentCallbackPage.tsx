import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const registrationId = searchParams.get('reg') || '';
  const invoiceNumber = searchParams.get('invoice') || '';
  const [verifyStatus, setVerifyStatus] = useState<'loading' | 'paid' | 'pending' | 'cancelled' | 'failed'>('loading');
  const [verifiedRegId, setVerifiedRegId] = useState(registrationId);

  useEffect(() => {
    if (!invoiceNumber) {
      if (status === 'success') setVerifyStatus('paid');
      else if (status === 'cancelled') setVerifyStatus('cancelled');
      else if (status === 'failed') setVerifyStatus('failed');
      else setVerifyStatus('pending');
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    fetch(`${supabaseUrl}/functions/v1/paystation-verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_number: invoiceNumber }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Verification failed');
        const data = await res.json();
        if (data.registration_id) setVerifiedRegId(data.registration_id);
        if (data.status === 'paid') setVerifyStatus('paid');
        else if (data.status === 'cancelled') setVerifyStatus('cancelled');
        else if (data.status === 'failed') setVerifyStatus('failed');
        else setVerifyStatus('pending');
      })
      .catch(() => {
        if (status === 'success') setVerifyStatus('paid');
        else if (status === 'cancelled') setVerifyStatus('cancelled');
        else setVerifyStatus('failed');
      });
  }, [invoiceNumber, status]);

  if (verifyStatus === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-jubilee-700 animate-spin mx-auto mb-4" />
          <h2 className="font-serif text-xl font-semibold text-gray-900 mb-2">
            Verifying Payment...
          </h2>
          <p className="text-gray-500 text-sm">
            Please wait while we confirm your payment with the gateway.
          </p>
        </div>
      </div>
    );
  }

  if (verifyStatus === 'paid') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50 py-16">
        <div className="max-w-md mx-auto px-4 text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">
            Your payment has been confirmed and your registration is complete. You can now view your
            confirmation details and download your digital ticket.
          </p>
          {verifiedRegId && (
            <div className="flex flex-col gap-3">
              <Link to={`/confirmation/${verifiedRegId}`} className="btn-gold !py-3">
                View Confirmation
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to={`/ticket/${verifiedRegId}`} className="btn-secondary !py-3">
                View Your Ticket
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
          {!verifiedRegId && (
            <Link to="/" className="btn-primary !py-3">
              Go to Homepage
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (verifyStatus === 'cancelled') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50 py-16">
        <div className="max-w-md mx-auto px-4 text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-3">Payment Cancelled</h1>
          <p className="text-gray-600 mb-8">
            Your payment was cancelled. Your registration is saved but not confirmed. You can try
            again whenever you are ready.
          </p>
          <div className="flex flex-col gap-3">
            <Link to="/register" className="btn-gold !py-3">
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Link>
            <Link to="/" className="btn-secondary !py-3">
              Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (verifyStatus === 'pending') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-cream-50 py-16">
        <div className="max-w-md mx-auto px-4 text-center animate-slide-up">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-gray-900 mb-3">Payment Processing</h1>
          <p className="text-gray-600 mb-8">
            Your payment is being processed. This may take a few moments. Your registration will be
            confirmed once the payment is verified.
          </p>
          <Link to="/" className="btn-primary !py-3">
            Go to Homepage
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Failed
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-cream-50 py-16">
      <div className="max-w-md mx-auto px-4 text-center animate-slide-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-3">Payment Failed</h1>
        <p className="text-gray-600 mb-8">
          Unfortunately, your payment could not be processed. Please try again or contact support if
          the problem persists.
        </p>
        <div className="flex flex-col gap-3">
          <Link to="/register" className="btn-gold !py-3">
            <RotateCcw className="w-4 h-4" />
            Try Again
          </Link>
          <Link to="/" className="btn-secondary !py-3">
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
