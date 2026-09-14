import { useEffect, useState, useCallback, useRef } from 'react';
import { Search, Users, GraduationCap, Building2, X, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Batch, Hall } from '@/lib/types';
import { getInitials } from '@/lib/utils';

const PAGE_SIZE = 15;
const DEBOUNCE_MS = 300;

interface ParticipantCard {
  id: string;
  full_name: string;
  profile_photo_url: string | null;
  batch: { batch_name: string; batch_number: number } | null;
  hall: { name: string } | null;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<ParticipantCard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [halls, setHalls] = useState<Hall[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedHall, setSelectedHall] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Debounced search
  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  // Load filter options
  useEffect(() => {
    Promise.all([
      supabase.from('batches').select('id, batch_number, batch_name').order('batch_number'),
      supabase.from('halls').select('id, name, former_name, sort_order').order('sort_order'),
    ]).then(([batchRes, hallRes]) => {
      if (batchRes.data) setBatches(batchRes.data);
      if (hallRes.data) setHalls(hallRes.data as Hall[]);
    });
  }, []);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('registrations')
        .select(
          'participant:participants!inner(id, full_name, profile_photo_url, batch_id, hall_id, batch:batches(batch_name, batch_number), hall:halls(name))',
          { count: 'exact' }
        )
        .eq('registration_status', 'confirmed');

      if (debouncedSearch) {
        query = query.ilike('participants.full_name', `%${debouncedSearch}%`);
      }
      if (selectedBatch) {
        query = query.eq('participants.batch_id', selectedBatch);
      }
      if (selectedHall) {
        query = query.eq('participants.hall_id', selectedHall);
      }

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const mapped: ParticipantCard[] = (data ?? []).map((row: any) => {
        const p = row.participant;
        return {
          id: p.id,
          full_name: p.full_name,
          profile_photo_url: p.profile_photo_url,
          batch: p.batch,
          hall: p.hall,
        };
      });

      setParticipants(mapped);
      setTotalCount(count ?? 0);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load participants');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedBatch, selectedHall]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Registered alumni count for hero (unfiltered)
  const [heroCount, setHeroCount] = useState(0);
  useEffect(() => {
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('registration_status', 'confirmed')
      .then(({ count }) => {
        if (count !== null) setHeroCount(count);
      });
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const rangeStart = totalCount === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min((page + 1) * PAGE_SIZE, totalCount);

  const resetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedBatch('');
    setSelectedHall('');
    setPage(0);
  };

  const hasFilters = search || selectedBatch || selectedHall;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-jubilee-800 to-jubilee-700 text-white">
        <div className="absolute inset-0 opacity-[0.03]">
          <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none">
            {Array.from({ length: 12 }).map((_, i) => (
              <circle
                key={i}
                cx={80 + (i % 4) * 200}
                cy={60 + Math.floor(i / 4) * 130}
                r={30 + (i % 3) * 15}
                fill="white"
              />
            ))}
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">
          <p className="section-label !text-gold-400 mb-3">Golden Jubilee 2026</p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
            Registered Participants
          </h1>
          <p className="font-serif italic text-gold-300/90 text-xl mb-4">
            Reuniting Generations, Strengthening Our Bonds
          </p>
          <p className="text-jubilee-200 text-lg max-w-2xl mx-auto mb-10">
            See who's joining the Golden Jubilee Celebration 2026. Find your classmates, hallmates
            and friends.
          </p>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Users className="w-5 h-5 text-gold-400" />
                <span className="font-serif text-3xl font-bold text-white">
                  {heroCount}
                </span>
              </div>
              <p className="text-jubilee-300 text-sm">Registered Alumni</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <GraduationCap className="w-5 h-5 text-gold-400" />
                <span className="font-serif text-3xl font-bold text-white">48</span>
              </div>
              <p className="text-jubilee-300 text-sm">Batches</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Building2 className="w-5 h-5 text-gold-400" />
                <span className="font-serif text-3xl font-bold text-white">21</span>
              </div>
              <p className="text-jubilee-300 text-sm">Halls</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-8 lg:h-12">
            <path d="M0,60 L0,30 Q360,0 720,30 T1440,30 L1440,60Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white py-8 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field !pl-10"
              />
            </div>

            <div className="relative">
              <select
                value={selectedBatch}
                onChange={(e) => {
                  setSelectedBatch(e.target.value);
                  setPage(0);
                }}
                className="select-field"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batch_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <select
                value={selectedHall}
                onChange={(e) => {
                  setSelectedHall(e.target.value);
                  setPage(0);
                }}
                className="select-field"
              >
                <option value="">All Halls</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button onClick={resetFilters} className="btn-secondary !py-3">
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Participant Grid */}
      <section className="bg-cream-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Error state */}
          {error && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-gray-900 mb-2">
                Something went wrong
              </h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button onClick={fetchParticipants} className="btn-primary">
                Try Again
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-2/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && participants.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-jubilee-50 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-jubilee-400" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-gray-900 mb-2">
                No participants found
              </h3>
              <p className="text-gray-500 mb-6">
                {hasFilters
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Be the first to register for the Golden Jubilee Celebration!'}
              </p>
              {hasFilters && (
                <button onClick={resetFilters} className="btn-secondary">
                  <X className="w-4 h-4" />
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* Results */}
          {!loading && !error && participants.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="card p-6 hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      {p.profile_photo_url ? (
                        <img
                          src={p.profile_photo_url}
                          alt={p.full_name}
                          className="w-14 h-14 rounded-full object-cover shrink-0 border-2 border-jubilee-100"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-jubilee-100 text-jubilee-700 flex items-center justify-center shrink-0 font-semibold text-lg">
                          {getInitials(p.full_name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{p.full_name}</h3>
                        {p.batch && (
                          <p className="text-sm text-jubilee-600 truncate flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                            {p.batch.batch_name}
                          </p>
                        )}
                        {p.hall && (
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            {p.hall.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">
                  Showing{' '}
                  <span className="font-medium text-gray-900">
                    {rangeStart}–{rangeEnd}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium text-gray-900">{totalCount}</span> participants
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn-secondary !px-4 !py-2 !text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-500 px-2">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page + 1 >= totalPages}
                    className="btn-secondary !px-4 !py-2 !text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
