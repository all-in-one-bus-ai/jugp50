import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, getStatusColor } from '@/lib/utils';
import type { Event } from '@/lib/types';
import {
  CalendarDays,
  MapPin,
  Clock,
  Edit3,
  Save,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function EventsPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    event_date: '',
    venue: '',
    venue_city: '',
    registration_deadline: '',
    status: '',
  });

  useEffect(() => {
    fetchEvent();
  }, []);

  async function fetchEvent() {
    setLoading(true);
    const { data, error: fetchErr } = await supabase
      .from('events')
      .select('*')
      .limit(1)
      .single();

    if (fetchErr) {
      setError('Failed to load event details.');
    } else if (data) {
      setEvent(data as Event);
      setForm({
        name: data.name,
        event_date: data.event_date,
        venue: data.venue,
        venue_city: data.venue_city,
        registration_deadline: data.registration_deadline,
        status: data.status,
      });
    }
    setLoading(false);
  }

  function startEditing() {
    if (event) {
      setForm({
        name: event.name,
        event_date: event.event_date,
        venue: event.venue,
        venue_city: event.venue_city,
        registration_deadline: event.registration_deadline,
        status: event.status,
      });
    }
    setEditing(true);
    setError('');
  }

  async function handleSave() {
    if (!event) return;
    setSaving(true);
    setError('');

    const { error: updateErr } = await supabase
      .from('events')
      .update({
        name: form.name,
        event_date: form.event_date,
        venue: form.venue,
        venue_city: form.venue_city,
        registration_deadline: form.registration_deadline,
        status: form.status,
      })
      .eq('id', event.id);

    if (updateErr) {
      setError('Failed to update event. Please try again.');
      setSaving(false);
      return;
    }

    await fetchEvent();
    setEditing(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-jubilee-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">Events</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage the Golden Jubilee event details
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {event && !editing && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-jubilee-700 to-jubilee-600 px-6 py-8 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-jubilee-200 text-xs font-medium uppercase tracking-wider mb-1">
                  Main Event
                </p>
                <h2 className="text-2xl font-serif font-bold">{event.name}</h2>
                <p className="text-jubilee-200 text-sm mt-1">
                  {event.department} • {event.university}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'active' || event.status === 'registration_open'
                    ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-400/30'
                    : 'bg-white/10 text-white/80 border border-white/20'
                }`}
              >
                {event.status === 'registration_open'
                  ? 'Registration Open'
                  : event.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-jubilee-50 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-jubilee-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Event Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(event.event_date)}
                  </p>
                  {event.event_day && (
                    <p className="text-xs text-gray-400">{event.event_day}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-jubilee-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-jubilee-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Venue</p>
                  <p className="text-sm font-medium text-gray-900">
                    {event.venue}
                  </p>
                  <p className="text-xs text-gray-400">{event.venue_city}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Registration Deadline</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(event.registration_deadline)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Eligible Batches</p>
                  <p className="text-sm font-medium text-gray-900">
                    {event.eligible_batches || 'All'}
                  </p>
                </div>
              </div>
            </div>

            {event.description && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700">{event.description}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={startEditing}
                className="flex items-center gap-2 text-sm font-medium text-jubilee-700 hover:text-jubilee-800 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                Edit Event Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Edit Form */}
      {editing && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Event Details
            </h3>
            <button
              onClick={() => setEditing(false)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Event Date
                </label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={(e) =>
                    setForm({ ...form, event_date: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={form.registration_deadline}
                  onChange={(e) =>
                    setForm({ ...form, registration_deadline: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Venue
                </label>
                <input
                  type="text"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Venue City
                </label>
                <input
                  type="text"
                  value={form.venue_city}
                  onChange={(e) =>
                    setForm({ ...form, venue_city: e.target.value })
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input-field"
              >
                <option value="registration_open">Registration Open</option>
                <option value="registration_closed">Registration Closed</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary !py-2.5 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn-secondary !py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
