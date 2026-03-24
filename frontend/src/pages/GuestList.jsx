import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, X, Check, Search, Download, ChevronDown,
  AlertCircle, UserCheck, UserX, Clock, Mail, CalendarDays
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  pending: { label: 'Pending', classes: 'badge-yellow', icon: Clock },
  approved: { label: 'Approved', classes: 'badge-green', icon: UserCheck },
  denied: { label: 'Denied', classes: 'badge-red', icon: UserX },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return <span className={cfg.classes}>{cfg.label}</span>;
};

// Add Guest Form
const AddGuestForm = ({ eventId, onAdded }) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Guest name is required.'); return; }
    setLoading(true);
    try {
      const res = await client.post(`/events/${eventId}/guests`, { name, contact });
      if (res.data.success) {
        onAdded(res.data.data);
        setName('');
        setContact('');
        setError('');
      } else {
        setError(res.data.error || 'Failed to add guest');
      }
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex-1">
        <input
          className="input-field"
          placeholder="Guest name *"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
        />
      </div>
      <div className="flex-1">
        <input
          className="input-field"
          placeholder="Phone or email (optional)"
          value={contact}
          onChange={e => setContact(e.target.value)}
        />
      </div>
      <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
        <Plus size={16} /> {loading ? 'Adding…' : 'Add Guest'}
      </button>
      {error && (
        <div className="sm:col-span-3 flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={14} />{error}
        </div>
      )}
    </form>
  );
};

// My Guests Tab
const MyGuestsView = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedEvent) {
      setLoading(true);
      client.get(`/events/${selectedEvent}/guests/mine`)
        .then(res => { if (res.data.success) setGuests(res.data.data || []); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [selectedEvent]);

  const handleAdded = (guest) => setGuests(prev => [guest, ...prev]);

  const event = events.find(e => e.id === selectedEvent);
  const totalGuests = guests.length;
  const cap = event?.guestCap;
  const capPct = cap ? Math.min(100, Math.round((totalGuests / cap) * 100)) : null;

  return (
    <div className="space-y-5">
      <div>
        <label className="label">Select event</label>
        <select
          className="select-field max-w-sm"
          value={selectedEvent || ''}
          onChange={e => setSelectedEvent(e.target.value)}
        >
          <option value="">Choose an event…</option>
          {events.map(ev => (
            <option key={ev.id} value={ev.id}>
              {ev.title} — {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <>
          {cap != null && (
            <div className="card p-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Guest slots used</span>
                <span className="font-bold text-gray-900">{totalGuests} / {cap}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${capPct >= 100 ? 'bg-red-500' : capPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${capPct}%` }}
                />
              </div>
              {capPct >= 100 && (
                <p className="text-xs text-red-600 mt-1.5">Guest cap reached</p>
              )}
            </div>
          )}

          <AddGuestForm eventId={selectedEvent} onAdded={handleAdded} />

          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700">My Guests ({totalGuests})</h3>
            </div>
            {loading ? (
              <div className="p-5 space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-8 h-8 rounded-full" />
                    <div className="skeleton h-4 flex-1 rounded" />
                    <div className="skeleton w-16 h-5 rounded-full" />
                  </div>
                ))}
              </div>
            ) : guests.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <Users size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No guests added yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {guests.map(g => (
                  <div key={g.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 bg-navy/10 rounded-full flex items-center justify-center text-navy text-xs font-bold flex-shrink-0">
                      {g.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{g.name}</p>
                      {g.contact && <p className="text-xs text-gray-400 truncate">{g.contact}</p>}
                    </div>
                    <StatusBadge status={g.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedEvent && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CalendarDays size={40} className="text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Select an event to manage your guests</p>
        </div>
      )}
    </div>
  );
};

// Admin All Guests Tab
const AllGuestsView = ({ events }) => {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchGuests = useCallback(async (evId) => {
    if (!evId) return;
    setLoading(true);
    try {
      const res = await client.get(`/events/${evId}/guests`);
      if (res.data.success) setGuests(res.data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGuests(selectedEvent); }, [selectedEvent, fetchGuests]);

  const updateStatus = async (guestId, status) => {
    setUpdating(guestId);
    try {
      const res = await client.patch(`/events/${selectedEvent}/guests/${guestId}`, { status });
      if (res.data.success) {
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, status } : g));
      }
    } catch { /* empty */ }
    finally { setUpdating(null); }
  };

  const exportCSV = () => {
    const rows = [['Name', 'Contact', 'Submitted By', 'Status']];
    guests.forEach(g => rows.push([g.name, g.contact || '', g.submittedBy || '', g.status]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guests-${selectedEvent}.csv`;
    a.click();
  };

  const filtered = guests.filter(g => !search || g.name?.toLowerCase().includes(search.toLowerCase()) || g.submittedBy?.toLowerCase().includes(search.toLowerCase()));

  const counts = { pending: 0, approved: 0, denied: 0 };
  guests.forEach(g => { counts[g.status] = (counts[g.status] || 0) + 1; });

  const event = events.find(e => e.id === selectedEvent);
  const capPct = event?.guestCap ? Math.min(100, Math.round((guests.length / event.guestCap) * 100)) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-48">
          <label className="label">Select event</label>
          <select className="select-field" value={selectedEvent || ''} onChange={e => setSelectedEvent(e.target.value)}>
            <option value="">Choose an event…</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
        {selectedEvent && (
          <button onClick={exportCSV} className="btn-secondary">
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {selectedEvent && (
        <>
          {/* Summary chips */}
          <div className="flex flex-wrap gap-3">
            <div className="card p-3 flex items-center gap-2 text-sm">
              <Users size={14} className="text-gray-400" />
              <span className="font-semibold text-gray-900">{guests.length}</span>
              <span className="text-gray-500">total{event?.guestCap ? ` / ${event.guestCap} cap` : ''}</span>
            </div>
            {Object.entries(counts).map(([status, count]) => (
              count > 0 && (
                <div key={status} className="card p-3">
                  <StatusBadge status={status} /> <span className="ml-1 text-sm font-bold text-gray-900">{count}</span>
                </div>
              )
            ))}
          </div>

          {capPct != null && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Cap usage</span>
                <span>{guests.length} / {event.guestCap}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${capPct >= 100 ? 'bg-red-500' : capPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${capPct}%` }} />
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input className="input-field pl-10" placeholder="Search guests…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="th">Guest</th>
                  <th className="th">Contact</th>
                  <th className="th">Submitted By</th>
                  <th className="th">Status</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      {Array(5).fill(0).map((__, j) => (
                        <td key={j} className="td"><div className="skeleton h-4 rounded w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="td text-center py-8 text-gray-400">No guests found</td>
                  </tr>
                ) : filtered.map(g => (
                  <tr key={g.id} className="table-row">
                    <td className="td font-medium text-gray-900">{g.name}</td>
                    <td className="td text-gray-500">{g.contact || '—'}</td>
                    <td className="td text-gray-500">{g.submittedBy || '—'}</td>
                    <td className="td"><StatusBadge status={g.status} /></td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1.5">
                        {g.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(g.id, 'approved')}
                            disabled={updating === g.id}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {g.status !== 'denied' && (
                          <button
                            onClick={() => updateStatus(g.id, 'denied')}
                            disabled={updating === g.id}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Deny"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default function GuestList() {
  const { user } = useAuth();
  const [tab, setTab] = useState('mine');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    client.get('/events')
      .then(res => { if (res.data.success) setEvents(res.data.data || []); })
      .catch(() => {})
      .finally(() => setLoadingEvents(false));
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Guest List</h1>
        <p className="page-subtitle">Manage event guest submissions and approvals</p>
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button
          onClick={() => setTab('mine')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'mine' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          My Guests
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab('all')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All Guests
          </button>
        )}
      </div>

      {loadingEvents ? (
        <div className="space-y-4">
          <div className="skeleton h-10 rounded-xl max-w-sm" />
          <div className="skeleton h-32 rounded-xl" />
        </div>
      ) : (
        tab === 'mine'
          ? <MyGuestsView events={events} />
          : <AllGuestsView events={events} />
      )}
    </div>
  );
}
