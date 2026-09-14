import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Ticket,
  UsersRound,
  Banknote,
  CalendarDays,
  Clock,
  MapPin,
  Eye,
  TrendingUp,
  BarChart3,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, daysUntil, getStatusColor } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DashboardStats {
  totalParticipants: number;
  ticketsIssued: number;
  accompanyingGuests: number;
  totalRevenue: number;
}

interface TicketSummary {
  total: number;
  checkedIn: number;
  pending: number;
  cancelled: number;
}

interface DailyRegistration {
  date: string;
  label: string;
  count: number;
}

interface BatchGroup {
  range: string;
  count: number;
}

interface RecentRegistration {
  id: string;
  registration_number: string;
  guest_count: number;
  total_amount: number;
  registration_status: string;
  created_at: string;
  participant: {
    full_name: string;
    batch: {
      batch_name: string;
    };
  };
}

/* ------------------------------------------------------------------ */
/*  Skeleton helpers                                                    */
/* ------------------------------------------------------------------ */

function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className ?? ''}`}
      style={style}
    />
  );
}

function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-8 w-20" />
        </div>
        <SkeletonBlock className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBlock className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Circular progress (SVG)                                            */
/* ------------------------------------------------------------------ */

function CircularProgress({
  percentage,
  size = 100,
  strokeWidth = 8,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0B3D2C"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-lg font-bold text-jubilee-700">
        {Math.round(percentage)}%
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Batch group ranges                                                 */
/* ------------------------------------------------------------------ */

const BATCH_GROUPS: { label: string; min: number; max: number }[] = [
  { label: '8–10', min: 8, max: 10 },
  { label: '11–15', min: 11, max: 15 },
  { label: '16–20', min: 16, max: 20 },
  { label: '21–25', min: 21, max: 25 },
  { label: '26–30', min: 26, max: 30 },
  { label: '31–35', min: 31, max: 35 },
  { label: '36–40', min: 36, max: 40 },
  { label: '41–45', min: 41, max: 45 },
  { label: '46–49', min: 46, max: 49 },
  { label: '50–55', min: 50, max: 55 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ticketSummary, setTicketSummary] = useState<TicketSummary | null>(null);
  const [dailyData, setDailyData] = useState<DailyRegistration[] | null>(null);
  const [batchGroups, setBatchGroups] = useState<BatchGroup[] | null>(null);
  const [recent, setRecent] = useState<RecentRegistration[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ---- data fetchers ---- */

  async function fetchStats() {
    const [participantsRes, ticketsRes, guestsRes, revenueRes] = await Promise.all([
      supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .eq('registration_status', 'confirmed'),
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('registrations')
        .select('guest_count')
        .eq('registration_status', 'confirmed'),
      supabase
        .from('registrations')
        .select('total_amount')
        .eq('registration_status', 'confirmed'),
    ]);

    const totalGuests = (guestsRes.data ?? []).reduce(
      (sum, r) => sum + (r.guest_count ?? 0),
      0
    );
    const totalRevenue = (revenueRes.data ?? []).reduce(
      (sum, r) => sum + (r.total_amount ?? 0),
      0
    );

    setStats({
      totalParticipants: participantsRes.count ?? 0,
      ticketsIssued: ticketsRes.count ?? 0,
      accompanyingGuests: totalGuests,
      totalRevenue: totalRevenue,
    });
  }

  async function fetchTicketSummary() {
    const [totalRes, checkedInRes, pendingRes, cancelledRes] = await Promise.all([
      supabase.from('tickets').select('*', { count: 'exact', head: true }),
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'checked_in'),
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled'),
    ]);

    setTicketSummary({
      total: totalRes.count ?? 0,
      checkedIn: checkedInRes.count ?? 0,
      pending: pendingRes.count ?? 0,
      cancelled: cancelledRes.count ?? 0,
    });
  }

  async function fetchDailyRegistrations() {
    const days: DailyRegistration[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();

      days.push({
        date: dayStart,
        label: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
        count: 0,
      });

      const { count } = await supabase
        .from('registrations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart)
        .lt('created_at', dayEnd);

      days[days.length - 1].count = count ?? 0;
    }

    setDailyData(days);
  }

  async function fetchBatchGroups() {
    const { data } = await supabase
      .from('registrations')
      .select('participant:participants(batch:batches(batch_number))')
      .eq('registration_status', 'confirmed');

    const counts = new Map<string, number>();
    BATCH_GROUPS.forEach((g) => counts.set(g.label, 0));

    (data ?? []).forEach((row: any) => {
      const batchNumber = row.participant?.batch?.batch_number;
      if (typeof batchNumber !== 'number') return;
      for (const g of BATCH_GROUPS) {
        if (batchNumber >= g.min && batchNumber <= g.max) {
          counts.set(g.label, (counts.get(g.label) ?? 0) + 1);
          break;
        }
      }
    });

    setBatchGroups(
      BATCH_GROUPS.map((g) => ({ range: g.label, count: counts.get(g.label) ?? 0 }))
    );
  }

  async function fetchRecent() {
    const { data } = await supabase
      .from('registrations')
      .select(
        'id, registration_number, guest_count, total_amount, registration_status, created_at, participant:participants(full_name, batch:batches(batch_name))'
      )
      .order('created_at', { ascending: false })
      .limit(10);

    setRecent((data as unknown as RecentRegistration[]) ?? []);
  }

  async function loadAll() {
    setRefreshing(true);
    await Promise.all([
      fetchStats(),
      fetchTicketSummary(),
      fetchDailyRegistrations(),
      fetchBatchGroups(),
      fetchRecent(),
    ]);
    setRefreshing(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  /* ---- derived ---- */

  const checkinPercentage = useMemo(() => {
    if (!ticketSummary || ticketSummary.total === 0) return 0;
    return (ticketSummary.checkedIn / ticketSummary.total) * 100;
  }, [ticketSummary]);

  const dailyMax = useMemo(
    () => Math.max(...(dailyData ?? []).map((d) => d.count), 1),
    [dailyData]
  );

  const batchMax = useMemo(
    () => Math.max(...(batchGroups ?? []).map((b) => b.count), 1),
    [batchGroups]
  );

  /* ---- stat card config ---- */

  const statCards = stats
    ? [
        {
          label: 'Total Participants',
          value: stats.totalParticipants.toLocaleString(),
          icon: Users,
          color: 'bg-jubilee-50 text-jubilee-700',
        },
        {
          label: 'Tickets Issued',
          value: stats.ticketsIssued.toLocaleString(),
          icon: Ticket,
          color: 'bg-blue-50 text-blue-700',
        },
        {
          label: 'Accompanying Guests',
          value: stats.accompanyingGuests.toLocaleString(),
          icon: UsersRound,
          color: 'bg-amber-50 text-amber-700',
        },
        {
          label: 'Total Revenue BDT',
          value: formatCurrency(stats.totalRevenue),
          icon: Banknote,
          color: 'bg-emerald-50 text-emerald-700',
        },
      ]
    : null;

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ---- Welcome header ---- */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-serif font-bold text-jubilee-700">
            Welcome Back, Admin!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Golden Jubilee Celebration 2026 — Department of Government &amp; Politics,
            Jahangirnagar University
          </p>
        </div>
        <button
          onClick={loadAll}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-jubilee-700 bg-jubilee-50 rounded-lg hover:bg-jubilee-100 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ---- Stat cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 stagger-children">
        {statCards
          ? statCards.map((card) => (
              <div key={card.label} className="card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.label}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
                  </div>
                  <div className={`p-2.5 rounded-lg ${card.color}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))
          : Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>

      {/* ---- Two-column layout ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Left column (wider) ---- */}
        <div className="lg:col-span-2 space-y-6">
          {/* Registrations Overview (last 7 days) */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="section-label mb-1">Overview</p>
                <h2 className="text-lg font-serif font-semibold text-gray-900">
                  Registrations Overview
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <TrendingUp className="w-3.5 h-3.5" />
                Last 7 days
              </div>
            </div>

            {dailyData ? (
              <div className="flex items-end gap-3 h-44">
                {dailyData.map((day) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <span className="text-xs font-semibold text-gray-700">
                      {day.count}
                    </span>
                    <div className="w-full bg-gray-100 rounded-t-md relative overflow-hidden"
                      style={{ height: '100%' }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t-md bg-gradient-to-t from-jubilee-700 to-jubilee-400 transition-all duration-500"
                        style={{
                          height: `${Math.max((day.count / dailyMax) * 100, 4)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-end gap-3 h-44">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1">
                    <SkeletonBlock
                      className="w-full"
                      style={{ height: `${30 + i * 10}%` }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registrations by Batch */}
          <div className="card p-6">
            <div className="mb-6">
              <p className="section-label mb-1">Batch Breakdown</p>
              <h2 className="text-lg font-serif font-semibold text-gray-900">
                Registrations by Batch
              </h2>
            </div>

            {batchGroups ? (
              <div className="space-y-3">
                {batchGroups.map((group) => (
                  <div key={group.range} className="flex items-center gap-3">
                    <span className="w-14 text-xs font-medium text-gray-600 text-right shrink-0">
                      {group.range}
                    </span>
                    <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-500 flex items-center justify-end pr-2"
                        style={{
                          width: `${Math.max((group.count / batchMax) * 100, 2)}%`,
                          minWidth: group.count > 0 ? '2.5rem' : '0.5rem',
                        }}
                      >
                        {group.count > 0 && (
                          <span className="text-[10px] font-bold text-white">
                            {group.count}
                          </span>
                        )}
                      </div>
                    </div>
                    {group.count === 0 && (
                      <span className="text-xs text-gray-400">0</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonBlock className="h-4 w-14" />
                    <SkeletonBlock className="h-7 flex-1" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---- Right column (narrower) ---- */}
        <div className="space-y-6">
          {/* Ticket Summary */}
          <div className="card p-6">
            <div className="mb-5">
              <p className="section-label mb-1">Tickets</p>
              <h2 className="text-lg font-serif font-semibold text-gray-900">
                Ticket Summary
              </h2>
            </div>

            {ticketSummary ? (
              <>
                <div className="flex justify-center mb-5">
                  <CircularProgress percentage={checkinPercentage} size={120} strokeWidth={10} />
                </div>
                <p className="text-center text-xs text-gray-500 mb-5">
                  Check-in Progress
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Total Issued',
                      value: ticketSummary.total,
                      dot: 'bg-jubilee-700',
                    },
                    {
                      label: 'Checked In',
                      value: ticketSummary.checkedIn,
                      dot: 'bg-teal-500',
                    },
                    {
                      label: 'Pending',
                      value: ticketSummary.pending,
                      dot: 'bg-amber-400',
                    },
                    {
                      label: 'Cancelled',
                      value: ticketSummary.cancelled,
                      dot: 'bg-red-400',
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2.5"
                    >
                      <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                      <div>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-sm font-bold text-gray-900">
                          {item.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <SkeletonBlock className="h-28 w-28 rounded-full" />
                <SkeletonBlock className="h-4 w-24" />
                <div className="grid grid-cols-2 gap-3 w-full">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonBlock key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Event */}
          <div className="card p-6 bg-gradient-to-br from-jubilee-700 to-jubilee-800 text-white border-0">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-4 h-4 text-gold-400" />
              <p className="text-xs font-semibold tracking-widest uppercase text-gold-400">
                Upcoming Event
              </p>
            </div>
            <h3 className="text-lg font-serif font-bold text-white mb-3">
              Golden Jubilee Celebration 2026
            </h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center gap-2 text-jubilee-200">
                <CalendarDays className="w-4 h-4 shrink-0" />
                <span>18 December 2026</span>
              </div>
              <div className="flex items-center gap-2 text-jubilee-200">
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Jahangirnagar University Campus, Savar, Dhaka</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300">
                ● Registration Open
              </span>
            </div>
          </div>

          {/* Registration Deadline */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-gold-400" />
              <p className="section-label">Deadline</p>
            </div>
            <h3 className="text-lg font-serif font-semibold text-gray-900 mb-1">
              Registration Deadline
            </h3>
            <p className="text-sm text-gray-500 mb-4">30 November 2026</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-jubilee-700">
                {daysUntil('2026-11-30')}
              </span>
              <span className="text-sm text-gray-500">days remaining</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Recent Participants ---- */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <p className="section-label mb-1">Latest</p>
            <h2 className="text-lg font-serif font-semibold text-gray-900">
              Recent Participants
            </h2>
          </div>
          <Link
            to="/admin/participants"
            className="inline-flex items-center gap-1 text-sm font-medium text-jubilee-700 hover:text-jubilee-600 transition-colors"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Batch
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tickets
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount (BDT)
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Registration Date
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recent === null
                ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} />)
                : recent.length === 0
                ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                        No registrations yet.
                      </td>
                    </tr>
                  )
                : recent.map((reg, index) => (
                    <tr
                      key={reg.id}
                      className="hover:bg-cream-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {reg.participant?.full_name ?? '—'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {reg.registration_number}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {reg.participant?.batch?.batch_name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {1 + reg.guest_count}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(reg.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {formatDate(reg.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${getStatusColor(
                            reg.registration_status
                          )}`}
                        >
                          {reg.registration_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/admin/participants?view=${reg.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-jubilee-700 hover:text-jubilee-500 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
