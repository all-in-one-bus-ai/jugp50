import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Printer,
  FileDown,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDateTime, getStatusColor, getInitials } from '@/lib/utils';
import type { Batch, Hall } from '@/lib/types';

interface RegistrationRow {
  id: string;
  registration_number: string;
  guest_count: number;
  total_amount: number;
  registration_status: string;
  created_at: string;
  participant: {
    id: string;
    full_name: string;
    email: string;
    mobile: string;
    profile_photo_url: string | null;
    batch: { id: string; batch_number: number; batch_name: string };
    hall: { id: string; name: string };
  };
  payment: { status: string; transaction_id: string } | null;
}

const PAGE_SIZE = 15;

export default function AdminParticipants() {
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [hallFilter, setHallFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const [batches, setBatches] = useState<Batch[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [openAction, setOpenAction] = useState<string | null>(null);

  // Load filter options
  useEffect(() => {
    supabase.from('batches').select('*').order('batch_number').then(({ data }) => {
      if (data) setBatches(data);
    });
    supabase.from('halls').select('*').order('sort_order').then(({ data }) => {
      if (data) setHalls(data);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('registrations')
      .select(
        '*, participant:participants(*, batch:batches(*), hall:halls(*)), payment:payments(status, transaction_id)',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('participant.full_name', `%${search}%`);
    }
    if (batchFilter) {
      query = query.eq('participant.batch_id', batchFilter);
    }
    if (hallFilter) {
      query = query.eq('participant.hall_id', hallFilter);
    }
    if (paymentFilter) {
      query = query.eq('payment.status', paymentFilter);
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count, error } = await query.range(from, to);

    if (!error && data) {
      setRows(data as unknown as RegistrationRow[]);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [search, batchFilter, hallFilter, paymentFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset filters
  function handleReset() {
    setSearch('');
    setBatchFilter('');
    setHallFilter('');
    setPaymentFilter('');
    setPage(0);
  }

  // CSV export
  async function handleExportCSV() {
    let query = supabase
      .from('registrations')
      .select(
        '*, participant:participants(full_name, email, mobile, batch:batches(batch_name), hall:halls(name)), payment:payments(status, transaction_id)'
      )
      .order('created_at', { ascending: false });

    if (search) query = query.ilike('participant.full_name', `%${search}%`);
    if (batchFilter) query = query.eq('participant.batch_id', batchFilter);
    if (hallFilter) query = query.eq('participant.hall_id', hallFilter);
    if (paymentFilter) query = query.eq('payment.status', paymentFilter);

    const { data } = await query;
    if (!data || data.length === 0) return;

    const headers = [
      'Reg. No.',
      'Name',
      'Email',
      'Mobile',
      'Batch',
      'Hall',
      'Guests',
      'Total Fee',
      'Payment Status',
      'Registration Date',
    ];

    const csvRows = (data as unknown as RegistrationRow[]).map((r) => [
      r.registration_number,
      r.participant?.full_name,
      r.participant?.email,
      r.participant?.mobile,
      r.participant?.batch?.batch_name,
      r.participant?.hall?.name,
      r.guest_count,
      r.total_amount,
      r.payment?.status ?? 'N/A',
      r.created_at,
    ]);

    const csv = [headers, ...csvRows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participants_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showFrom = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const showTo = Math.min((page + 1) * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Participants</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all registered participants and their details
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-jubilee-700 text-white text-sm font-medium rounded-lg hover:bg-jubilee-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input-field !pl-10 w-full"
            />
          </div>
          <select
            value={batchFilter}
            onChange={(e) => { setBatchFilter(e.target.value); setPage(0); }}
            className="select-field"
          >
            <option value="">All Batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.batch_name}
              </option>
            ))}
          </select>
          <select
            value={hallFilter}
            onChange={(e) => { setHallFilter(e.target.value); setPage(0); }}
            className="select-field"
          >
            <option value="">All Halls</option>
            {halls.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => { setPaymentFilter(e.target.value); setPage(0); }}
            className="select-field"
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reg. No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Participant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Mobile</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Batch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Hall</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Guests</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Fee (BDT)</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Registration Date</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-16 text-center">
                      <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No participants found</p>
                      <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                )
                : rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-jubilee-700">
                          {row.registration_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {row.participant?.profile_photo_url ? (
                            <img
                              src={row.participant.profile_photo_url}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-jubilee-100 text-jubilee-700 flex items-center justify-center text-xs font-semibold">
                              {getInitials(row.participant?.full_name ?? '?')}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {row.participant?.full_name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {row.participant?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.participant?.mobile}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.participant?.batch?.batch_name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                        {row.participant?.hall?.name}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{row.guest_count}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(row.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            row.payment?.status ?? 'pending'
                          )}`}
                        >
                          {row.payment?.status ?? 'pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {formatDateTime(row.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setOpenAction(openAction === row.id ? null : row.id)
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openAction === row.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Eye className="w-4 h-4" /> View
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <Printer className="w-4 h-4" /> Print Ticket
                              </button>
                              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                <FileDown className="w-4 h-4" /> Download
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalCount > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{showFrom}</span>–
              <span className="font-medium text-gray-700">{showTo}</span> of{' '}
              <span className="font-medium text-gray-700">{totalCount}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
