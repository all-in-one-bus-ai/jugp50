import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  Minus,
  Plus,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Batch, Hall, FeeRule } from '@/lib/types';
import { calculateParticipantFee, calculateTotalFee } from '@/lib/fee-calculator';
import {
  validateBangladeshMobile,
  generateRegistrationNumber,
  generateTransactionId,
  formatCurrency,
} from '@/lib/utils';

interface FormData {
  fullName: string;
  email: string;
  mobile: string;
  profession: string;
  organization: string;
  address: string;
  batchId: string;
  hallId: string;
  guestCount: number;
  termsAccepted: boolean;
  profilePhoto: File | null;
}

interface FormErrors {
  [key: string]: string;
}

const initialForm: FormData = {
  fullName: '',
  email: '',
  mobile: '',
  profession: '',
  organization: '',
  address: '',
  batchId: '',
  hallId: '',
  guestCount: 0,
  termsAccepted: false,
  profilePhoto: null,
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [batches, setBatches] = useState<Batch[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [feeRules, setFeeRules] = useState<FeeRule[]>([]);
  const [guestFee, setGuestFee] = useState(500);
  const [gatewayPct, setGatewayPct] = useState(2.5);
  const [gatewayEnabled, setGatewayEnabled] = useState(true);
  const [maxGuests, setMaxGuests] = useState(5);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('batches').select('*').order('batch_number'),
      supabase.from('halls').select('*').order('sort_order'),
      supabase.from('fee_rules').select('*'),
      supabase.from('settings').select('key, value'),
    ]).then(([batchRes, hallRes, feeRes, settingsRes]) => {
      if (batchRes.data) setBatches(batchRes.data);
      if (hallRes.data) setHalls(hallRes.data);
      if (feeRes.data) setFeeRules(feeRes.data);
      if (settingsRes.data) {
        const s = Object.fromEntries(settingsRes.data.map((r) => [r.key, r.value]));
        if (s.guest_fee) setGuestFee(Number(s.guest_fee));
        if (s.gateway_charge_percentage) setGatewayPct(Number(s.gateway_charge_percentage));
        if (s.gateway_charge_enabled) setGatewayEnabled(s.gateway_charge_enabled === 'true');
        if (s.max_guests) setMaxGuests(Number(s.max_guests));
      }
    });
  }, []);

  const selectedBatch = batches.find((b) => b.id === form.batchId);
  const participantFee = selectedBatch
    ? calculateParticipantFee(selectedBatch.batch_number, feeRules)
    : 0;

  const feeBreakdown = useMemo(
    () => calculateTotalFee(participantFee, form.guestCount, guestFee, gatewayPct, gatewayEnabled),
    [participantFee, form.guestCount, guestFee, gatewayPct, gatewayEnabled]
  );

  function updateField(field: keyof FormData, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, profilePhoto: 'Only JPG and PNG files are allowed' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, profilePhoto: 'File size must be under 2 MB' }));
      return;
    }
    updateField('profilePhoto', file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function validate(): boolean {
    const errs: FormErrors = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.mobile.trim()) errs.mobile = 'Mobile number is required';
    else if (!validateBangladeshMobile(form.mobile))
      errs.mobile = 'Enter a valid Bangladesh mobile number';
    if (!form.batchId) errs.batchId = 'Please select your batch';
    if (!form.hallId) errs.hallId = 'Please select your hall';
    if (!form.termsAccepted) errs.termsAccepted = 'You must accept the terms and conditions';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      const { data: participant, error: pErr } = await supabase
        .from('participants')
        .insert({
          full_name: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          mobile: form.mobile.trim(),
          profession: form.profession.trim() || null,
          organization: form.organization.trim() || null,
          address: form.address.trim() || null,
          batch_id: form.batchId,
          hall_id: form.hallId,
        })
        .select('id')
        .single();

      if (pErr) throw new Error(pErr.message);

      const { data: event } = await supabase.from('events').select('id').limit(1).single();
      if (!event) throw new Error('Event not found');

      const regNum = generateRegistrationNumber();
      const { data: registration, error: rErr } = await supabase
        .from('registrations')
        .insert({
          registration_number: regNum,
          event_id: event.id,
          participant_id: participant.id,
          guest_count: form.guestCount,
          participant_fee: feeBreakdown.participantFee,
          guest_fee: feeBreakdown.guestTotal,
          subtotal: feeBreakdown.subtotal,
          gateway_charge: feeBreakdown.gatewayCharge,
          total_amount: feeBreakdown.total,
          registration_status: 'confirmed',
        })
        .select('id')
        .single();

      if (rErr) throw new Error(rErr.message);

      const txnId = generateTransactionId();
      await supabase.from('payments').insert({
        registration_id: registration.id,
        transaction_id: txnId,
        payment_method: 'Online',
        amount: feeBreakdown.total,
        gateway_charge: feeBreakdown.gatewayCharge,
        status: 'paid',
        paid_at: new Date().toISOString(),
      });

      await supabase.from('tickets').insert({
        registration_id: registration.id,
        ticket_id: 'TKT-' + txnId.slice(4, 12),
      });

      navigate(`/confirmation/${registration.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="bg-gradient-to-br from-jubilee-800 via-jubilee-700 to-jubilee-600 text-white py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="font-serif text-3xl lg:text-4xl font-bold mb-3">Registration</h1>
            <p className="text-gold-300 font-serif italic text-lg mb-4">
              Be a part of 50 years of history
            </p>
            <p className="text-jubilee-200 text-sm">
              Fill in your details below. Your registration fee is calculated automatically based on
              your batch and number of accompanying guests.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Calendar, label: '18 December 2026', sub: 'Friday' },
            { icon: MapPin, label: 'Jahangirnagar University', sub: 'Savar, Dhaka' },
            { icon: Users, label: 'All Generations', sub: '8th – 55th Batch' },
          ].map((item) => (
            <div key={item.label} className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-jubilee-50 flex items-center justify-center shrink-0">
                <item.icon className="w-5 h-5 text-jubilee-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Information */}
              <div className="card p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-jubilee-50 flex items-center justify-center text-sm font-bold text-jubilee-700">
                    1
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-gray-900">
                    Personal Information
                  </h2>
                </div>

                <div className="space-y-5">
                  <Field label="Full Name" required error={errors.fullName}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter your full name"
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                    />
                  </Field>

                  <Field label="Profile Picture" error={errors.profilePhoto}>
                    <div className="flex items-center gap-4">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-jubilee-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Upload className="w-4 h-4" />
                          Choose Photo
                          <input
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handlePhotoChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400 mt-1">JPG / PNG, max 2 MB</p>
                      </div>
                    </div>
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Mobile Number" required error={errors.mobile}>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          +880
                        </span>
                        <input
                          type="tel"
                          className="input-field !pl-16"
                          placeholder="1XXXXXXXXX"
                          value={form.mobile}
                          onChange={(e) => updateField('mobile', e.target.value)}
                        />
                      </div>
                    </Field>

                    <Field label="Email Address" required error={errors.email}>
                      <input
                        type="email"
                        className="input-field"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Current Profession">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Professor, Engineer"
                        value={form.profession}
                        onChange={(e) => updateField('profession', e.target.value)}
                      />
                    </Field>
                    <Field label="Organization / Workplace">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Dhaka University"
                        value={form.organization}
                        onChange={(e) => updateField('organization', e.target.value)}
                      />
                    </Field>
                  </div>

                  <Field label="Present Address">
                    <textarea
                      className="input-field min-h-[80px] resize-none"
                      placeholder="Your present address"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                    />
                  </Field>
                </div>
              </div>

              {/* Alumni Information */}
              <div className="card p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-jubilee-50 flex items-center justify-center text-sm font-bold text-jubilee-700">
                    2
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-gray-900">
                    Alumni Information
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <Field label="Batch" required error={errors.batchId}>
                    <select
                      className="select-field"
                      value={form.batchId}
                      onChange={(e) => updateField('batchId', e.target.value)}
                    >
                      <option value="">Select your batch</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batch_name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Hall" required error={errors.hallId}>
                    <select
                      className="select-field"
                      value={form.hallId}
                      onChange={(e) => updateField('hallId', e.target.value)}
                    >
                      <option value="">Select your hall</option>
                      {halls.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                          {h.former_name ? ` (Ex: ${h.former_name})` : ''}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              {/* Accompanying Guests */}
              <div className="card p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-jubilee-50 flex items-center justify-center text-sm font-bold text-jubilee-700">
                    3
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-gray-900">
                    Accompanying Guests
                  </h2>
                </div>

                <p className="text-sm text-gray-500 mb-2">
                  Include any spouse, child or driver attending with you.
                </p>
                <p className="text-sm text-gold-600 font-medium mb-6">
                  {formatCurrency(guestFee)} per accompanying person
                </p>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => updateField('guestCount', Math.max(0, form.guestCount - 1))}
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    disabled={form.guestCount === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center text-xl font-semibold text-gray-900">
                    {form.guestCount}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField('guestCount', Math.min(maxGuests, form.guestCount + 1))
                    }
                    className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    disabled={form.guestCount >= maxGuests}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-500">
                    {form.guestCount > 0
                      ? `${form.guestCount} guest${form.guestCount > 1 ? 's' : ''}`
                      : 'No guests'}
                  </span>
                </div>
              </div>

              {/* Terms */}
              <div className="card p-6 lg:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-jubilee-50 flex items-center justify-center text-sm font-bold text-jubilee-700">
                    4
                  </div>
                  <h2 className="font-serif text-xl font-semibold text-gray-900">
                    Terms & Confirmation
                  </h2>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.termsAccepted}
                    onChange={(e) => updateField('termsAccepted', e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-jubilee-700 focus:ring-jubilee-700"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed">
                    I confirm that the information provided is correct and I agree to the Terms &
                    Conditions, Privacy Policy and Refund Policy.
                  </span>
                </label>
                {errors.termsAccepted && (
                  <p className="text-red-500 text-xs mt-2">{errors.termsAccepted}</p>
                )}
              </div>

              {/* Mobile fee summary */}
              <div className="lg:hidden">
                <FeeSummaryCard
                  feeBreakdown={feeBreakdown}
                  guestCount={form.guestCount}
                  guestFee={guestFee}
                  gatewayEnabled={gatewayEnabled}
                  submitting={submitting}
                  submitError={submitError}
                />
              </div>
            </div>

            {/* Desktop fee summary */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <FeeSummaryCard
                  feeBreakdown={feeBreakdown}
                  guestCount={form.guestCount}
                  guestFee={guestFee}
                  gatewayEnabled={gatewayEnabled}
                  submitting={submitting}
                  submitError={submitError}
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-red-500 text-xs mt-1.5">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

function FeeSummaryCard({
  feeBreakdown,
  guestCount,
  guestFee,
  gatewayEnabled,
  submitting,
  submitError,
}: {
  feeBreakdown: ReturnType<typeof calculateTotalFee>;
  guestCount: number;
  guestFee: number;
  gatewayEnabled: boolean;
  submitting: boolean;
  submitError: string;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-serif text-lg font-semibold text-gray-900 mb-6">
        Registration Fee Summary
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Registration Fee</span>
          <span className="font-medium text-gray-900">
            {formatCurrency(feeBreakdown.participantFee)}
          </span>
        </div>

        {guestCount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Accompanying guests ({guestCount} &times; {formatCurrency(guestFee)})
            </span>
            <span className="font-medium text-gray-900">
              {formatCurrency(feeBreakdown.guestTotal)}
            </span>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4 flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium text-gray-900">{formatCurrency(feeBreakdown.subtotal)}</span>
        </div>

        {gatewayEnabled && feeBreakdown.gatewayCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Gateway charge</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(feeBreakdown.gatewayCharge)}
            </span>
          </div>
        )}

        <div className="border-t-2 border-jubilee-700 pt-4 flex justify-between">
          <span className="font-semibold text-gray-900">TOTAL PAYABLE</span>
          <span className="text-xl font-bold text-jubilee-700">
            {formatCurrency(feeBreakdown.total)}
          </span>
        </div>
      </div>

      {submitError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {submitError}
          </p>
        </div>
      )}

      <button
        type="submit"
        form=""
        onClick={(e) => {
          const formEl = document.querySelector('form');
          if (formEl) formEl.requestSubmit();
          else e.preventDefault();
        }}
        disabled={submitting}
        className="btn-gold w-full mt-6 !py-3.5 disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Proceed to Payment
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );
}
