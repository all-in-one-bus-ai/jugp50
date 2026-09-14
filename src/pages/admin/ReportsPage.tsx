import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart3,
  Users,
  UserCheck,
  Banknote,
  Download,
  Filter,
  Loader2,
  TicketCheck,
  Home,
  CreditCard,
} from 'lucide-react';

interface Batch {
  id: string;
  batch_name: string;
}

interface Hall {
  id: string;
  name: string;
}

interface RegistrationRow {
  registration_status: string;
  guest_count: number;
  total_amount: number;
  created_at: string;
  participant: { batch_id: string; hall_id: string } | null;
  payment: { status: string; payment_method: string | null; amount: number } | null;
}

interface CheckinRow {
  id: string;
  ticket: { registration_id: string } | null;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [hallFilter, setHallFilter] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [batchRes, hallRes, regRes, checkinRes] = await Promise.all([
      supabase.from('batches').select('id, batch_name').order('batch_number'),
      supabase.from('halls').select('id, name').order('sort_order'),
      supabase
        .from('registrations')
        .select(
          'registration_status, guest_count, total_amount, created_at, participant:participants(batch_id, hall_id), payment:payments(status, payment_method, amount)'
        ),
      supabase
        .from('checkins')
        .select('id, ticket:tickets(registration_id)'),
    ]);

    if (batchRes.data) setBatches(batchRes.data as Batch[]);
    if (hallRes.data) setHalls(hallRes.data as Hall[]);
    if (regRes.data) setRegistrations(regRes.data as unknown as RegistrationRow[]);
    if (checkinRes.data) setCheckins(checkinRes.data as unknown as CheckinRow[]);

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters
  const filtered = registrations.filter((r) => {
    if (dateFrom && r.created_at < dateFrom) return false;
    if (dateTo && r.created_at > dateTo + 'T23:59:59') return false;
    if (batchFilter && r.participant?.batch_id !== batchFilter) return false;
    if (hallFilter && r.participant?.hall_id !== hallFilter) return false;
    return true;
  });

  // --- Computed stats ---

  // 1. Registration Summary
  const totalRegs = filtered.length;
  const confirmedRegs = filtered.filter(
    (r) => r.registration_status === 'confirmed'
  ).length;
  const pendingRegs = filtered.filter(
    (r) => r.registration_status === 'pending'
  ).length;
  const cancelledRegs = filtered.filter(
    (r) => r.registration_status === 'cancelled'
  ).length;

  // 2. Batch-wise
  const batchCounts = batches.map((b) => ({
    name: b.batch_name,
    count: filtered.filter((r) => r.participant?.batch_id === b.id).length,
  }));

  // 3. Hall-wise
  const hallCounts = halls.map((h) => ({
    name: h.name,
    count: filtered.filter((r) => r.participant?.hall_id === h.id).length,
  }));

  // 4. Guest Summary
  const totalGuests = filtered.reduce((sum, r) => sum + (r.guest_count || 0), 0);
  const avgGuests = totalRegs > 0 ? (totalGuests / totalRegs).toFixed(1) : '0';

  // 5. Revenue Report
  const totalRevenue = filtered.reduce((sum, r) => {
    if (r.payment?.status === 'paid') return sum + (r.payment.amount || 0);
    return sum;
  }, 0);

  const revenueByMethod: Record<string, number> = {};
  filtered.forEach((r) => {
    if (r.payment?.status === 'paid') {
      const method = r.payment.payment_method || 'Unknown';
      revenueByMethod[method] = (revenueByMethod[method] || 0) + (r.payment.amount || 0);
    }
  });
  const avgRevenue = totalRegs > 0 ? totalRevenue / totalRegs : 0;

  // 6. Payment Status
  const paymentStatusCounts: Record<string, number> = {};
  filtered.forEach((r) => {
    const status = r.payment?.status || 'no_payment';
    paymentStatusCounts[status] = (paymentStatusCounts[status] || 0) + 1;
  });

  // 7. Check-in Report
  const totalCheckedIn = checkins.length;
  const totalTickets = filtered.filter(
    (r) => r.registration_status === 'confirmed'
  ).length;
  const pendingCheckin = Math.max(0, totalTickets - totalCheckedIn);
  const checkinRate =
    totalTickets > 0 ? ((totalCheckedIn / totalTickets) * 100).toFixed(1) : '0';

  // --- CSV Export ---
  function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportRegistrationSummary() {
    downloadCSV(
      'registration_summary',
      ['Status', 'Count'],
      [
        ['Total', String(totalRegs)],
        ['Confirmed', String(confirmedRegs)],
        ['Pending', String(pendingRegs)],
        ['Cancelled', String(cancelledRegs)],
      ]
    );
  }

  function exportBatchWise() {
    downloadCSV(
      'batch_wise_registration',
      ['Batch', 'Count'],
      batchCounts.map((b) => [b.name, String(b.count)])
    );
  }

  function exportHallWise() {
    downloadCSV(
      'hall_wise_registration',
      ['Hall', 'Count'],
      hallCounts.map((h) => [h.name, String(h.count)])
    );
  }

  function exportGuestSummary() {
    downloadCSV(
      'guest_summary',
      ['Metric', 'Value'],
      [
        ['Total Guests', String(totalGuests)],
        ['Avg per Registration', avgGuests],
      ]
    );
  }

  function exportRevenue() {
    const rows: string[][] = [
      ['Total Revenue', formatCurrency(totalRevenue)],
      ['Avg per Registration', formatCurrency(avgRevenue)],
      ...Object.entries(revenueByMethod).map(([method, amount]) => [
        method,
        formatCurrency(amount),
      ]),
    ];
    downloadCSV('revenue_report', ['Metric', 'Value'], rows);
  }

  function exportPaymentStatus() {
    downloadCSV(
      'payment_status',
      ['Status', 'Count'],
      Object.entries(paymentStatusCounts).map(([s, c]) => [s, String(c)])
    );
  }

  function exportCheckinReport() {
    downloadCSV(
      'checkin_report',
      ['Metric', 'Value'],
      [
        ['Total Checked In', String(totalCheckedIn)],
        ['Pending Check-in', String(pendingCheckin)],
        ['Check-in Rate', `${checkinRate}%`],
      ]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-jubilee-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          View and export event registration reports
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input-field !py-2 !text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input-field !py-2 !text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Batch</label>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="input-field !py-2 !text-sm"
            >
              <option value="">All Batches</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batch_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Hall</label>
            <select
              value={hallFilter}
              onChange={(e) => setHallFilter(e.target.value)}
              className="input-field !py-2 !text-sm"
            >
              <option value="">All Halls</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1. Registration Summary */}
        <ReportCard
          icon={Users}
          title="Registration Summary"
          onExport={exportRegistrationSummary}
        >
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Total" value={totalRegs} color="text-gray-900" />
            <StatBox
              label="Confirmed"
              value={confirmedRegs}
              color="text-emerald-600"
            />
            <StatBox
              label="Pending"
              value={pendingRegs}
              color="text-amber-600"
            />
            <StatBox
              label="Cancelled"
              value={cancelledRegs}
              color="text-red-600"
            />
          </div>
        </ReportCard>

        {/* 2. Batch-wise Registration */}
        <ReportCard
          icon={BarChart3}
          title="Batch-wise Registration"
          onExport={exportBatchWise}
        >
          <div className="max-h-52 overflow-y-auto -mx-1 px-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left pb-2 font-medium">Batch</th>
                  <th className="text-right pb-2 font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {batchCounts.map((b) => (
                  <tr key={b.name}>
                    <td className="py-1.5 text-gray-700">{b.name}</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">
                      {b.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>

        {/* 3. Hall-wise Registration */}
        <ReportCard
          icon={Home}
          title="Hall-wise Registration"
          onExport={exportHallWise}
        >
          <div className="max-h-52 overflow-y-auto -mx-1 px-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left pb-2 font-medium">Hall</th>
                  <th className="text-right pb-2 font-medium">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {hallCounts.map((h) => (
                  <tr key={h.name}>
                    <td className="py-1.5 text-gray-700">{h.name}</td>
                    <td className="py-1.5 text-right font-medium text-gray-900">
                      {h.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportCard>

        {/* 4. Guest Summary */}
        <ReportCard
          icon={UserCheck}
          title="Guest Summary"
          onExport={exportGuestSummary}
        >
          <div className="grid grid-cols-2 gap-3">
            <StatBox label="Total Guests" value={totalGuests} color="text-gray-900" />
            <StatBox
              label="Avg per Registration"
              value={avgGuests}
              color="text-jubilee-600"
            />
          </div>
        </ReportCard>

        {/* 5. Revenue Report */}
        <ReportCard
          icon={Banknote}
          title="Revenue Report"
          onExport={exportRevenue}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <StatBox
                label="Total Revenue"
                value={formatCurrency(totalRevenue)}
                color="text-emerald-600"
                large
              />
              <StatBox
                label="Avg per Registration"
                value={formatCurrency(avgRevenue)}
                color="text-gray-900"
              />
            </div>
            {Object.keys(revenueByMethod).length > 0 && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">By Payment Method</p>
                <div className="space-y-1.5">
                  {Object.entries(revenueByMethod).map(([method, amount]) => (
                    <div
                      key={method}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 capitalize">{method}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ReportCard>

        {/* 6. Payment Status */}
        <ReportCard
          icon={CreditCard}
          title="Payment Status"
          onExport={exportPaymentStatus}
        >
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(paymentStatusCounts).map(([status, count]) => (
              <StatBox
                key={status}
                label={status === 'no_payment' ? 'No Payment' : status}
                value={count}
                color={
                  status === 'paid'
                    ? 'text-emerald-600'
                    : status === 'pending'
                    ? 'text-amber-600'
                    : status === 'cancelled' || status === 'failed'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }
              />
            ))}
          </div>
        </ReportCard>

        {/* 7. Check-in Report */}
        <ReportCard
          icon={TicketCheck}
          title="Check-in Report"
          onExport={exportCheckinReport}
        >
          <div className="grid grid-cols-3 gap-3">
            <StatBox
              label="Checked In"
              value={totalCheckedIn}
              color="text-emerald-600"
            />
            <StatBox
              label="Pending"
              value={pendingCheckin}
              color="text-amber-600"
            />
            <StatBox
              label="Check-in Rate"
              value={`${checkinRate}%`}
              color="text-jubilee-600"
            />
          </div>
        </ReportCard>
      </div>
    </div>
  );
}

// --- Sub-components ---

function ReportCard({
  icon: Icon,
  title,
  onExport,
  children,
}: {
  icon: React.ElementType;
  title: string;
  onExport: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-jubilee-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-jubilee-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-jubilee-700 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-jubilee-50"
        >
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </button>
      </div>
      {children}
    </div>
  );
}

function StatBox({
  label,
  value,
  color,
  large,
}: {
  label: string;
  value: string | number;
  color: string;
  large?: boolean;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p
        className={`${
          large ? 'text-xl' : 'text-lg'
        } font-bold ${color} mt-0.5 capitalize`}
      >
        {value}
      </p>
    </div>
  );
}
