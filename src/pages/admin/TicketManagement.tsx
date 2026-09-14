import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Printer,
  FileDown,
  Ticket,
  CheckCircle2,
  XCircle,
  TicketCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime, getStatusColor } from '@/lib/utils';

interface TicketRow {
  id: string;
  ticket_id: string;
  status: string;
  issued_at: string;
  registration: {
    registration_number: string;
    participant: {
      full_name: string;
      batch: { batch_name: string };
      hall: { name: string };
    };
    payment: { status: string } | null;
  };
  checked_in: boolean;
}

interface Stats {
  total: number;
  active: number;
  checkedIn: number;
  cancelled: number;
}

const PAGE_SIZE = 15;

export default function TicketManagement() {
  const [rows, setRows] = useState<TicketRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, checkedIn: 0, cancelled: 0 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openAction, setOpenAction] = useState<string | null>(null);

  // Load stats
  useEffect(() => {
    async function loadStats() {
      const [totalRes, activeRes, cancelledRes, checkinRes] = await Promise.all([
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'cancelled'),
        supabase.from('checkins').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        total: totalRes.count ?? 0,
        active: activeRes.count ?? 0,
        checkedIn: checkinRes.count ?? 0,
        cancelled: cancelledRes.count ?? 0,
      });
    }
    loadStats();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch tickets
    let query = supabase
      .from('tickets')
      .select(
        '*, registration:registrations(registration_number, participant:participants(full_name, batch:batches(batch_name), hall:halls(name)), payment:payments(status))',
        { count: 'exact' }
      )
      .order('issued_at', { ascending: false });

    if (search) {
      query = query.or(`ticket_id.ilike.%${search}%,registration.participant.full_name.ilike.%${search}%`);
    }

    if (statusFilter === 'checked_in') {
      // We'll filter client-side after joining with checkins
    } else if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count, error } = await query.range(from, to);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Fetch checkins for current page tickets
    const ticketIds = data.map((t: any) => t.id);
    const { data: checkins } = await supabase
      .from('checkins')
      .select('ticket_id')
      .in('ticket_id', ticketIds);

    const checkinSet = new Set((checkins ?? []).map((c: any) => c.ticket_id));

    let mapped: TicketRow[] = (data as any[]).map((t) => ({
      ...t,
      checked_in: checkinSet.has(t.id),
    }));

    // Client-side filter for checked_in status
    if (statusFilter === 'checked_in') {
      mapped = mapped.filter((t) => t.checked_in);
    }

    setRows(mapped);
    setTotalCount(statusFilter === 'checked_in' ? mapped.length : (count ?? 0));
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function resolveDisplayStatus(row: TicketRow): string {
    if (row.status === 'cancelled') return 'cancelled';
    if (row.checked_in) return 'checked_in';
    return 'active';
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const showFrom = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const showTo = Math.min((page + 1) * PAGE_SIZE, totalCount);

  const statCards = [
    { label: 'Total Tickets', value: stats.total, icon: Ticket, color: 'bg-jubilee-50 text-jubilee-700' },
    { label: 'Active', value: stats.active, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Checked In', value: stats.checkedIn, icon: TicketCheck, color: 'bg-teal-50 text-teal-700' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'bg-red-50 text-red-700' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Ticket Management</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage issued tickets</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ticket ID or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="input-field !pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="select-field"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="checked_in">Checked In</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ticket ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Reg. No.</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Participant</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Batch</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Hall</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Payment</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Ticket Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Issued Date</th>
                <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="px-4 py-4">
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">No tickets found</p>
                      <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                )
                : rows.map((row) => {
                    const displayStatus = resolveDisplayStatus(row);
                    return (
                      <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs font-medium text-jubilee-700">
                            {row.ticket_id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-600">
                            {row.registration?.registration_number}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {row.registration?.participant?.full_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {row.registration?.participant?.batch?.batch_name}
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">
                          {row.registration?.participant?.hall?.name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              row.registration?.payment?.status ?? 'pending'
                            )}`}
                          >
                            {row.registration?.payment?.status ?? 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                              displayStatus
                            )}`}
                          >
                            {displayStatus.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {formatDateTime(row.issued_at)}
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
                                  <FileDown className="w-4 h-4" /> Download
                                </button>
                                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                  <Printer className="w-4 h-4" /> Print
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
