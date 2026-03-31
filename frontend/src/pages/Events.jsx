import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, MapPin, Users, CalendarDays, Clock, QrCode,
  X, ChevronDown, Filter, ExternalLink, Clipboard, Download, FileText
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const EVENT_TYPES = ['mixer', 'formal', 'philanthropy', 'meeting', 'social', 'other'];

const TYPE_CONFIG = {
  mixer: { label: 'Mixer', classes: 'badge-blue', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-400' },
  formal: { label: 'Formal', classes: 'badge-gold', bg: 'bg-gold/10', border: 'border-gold/30', dot: 'bg-gold' },
  philanthropy: { label: 'Philanthropy', classes: 'badge-green', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-400' },
  meeting: { label: 'Meeting', classes: 'badge-navy', bg: 'bg-navy/5', border: 'border-navy/20', dot: 'bg-navy' },
  social: { label: 'Social', classes: 'badge-purple', bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400' },
  other: { label: 'Other', classes: 'badge-gray', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400' },
};

const TypeBadge = ({ type }) => {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other;
  return <span className={`badge ${cfg.classes} capitalize`}>{cfg.label}</span>;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

// Event Form Modal
const EventFormModal = ({ isOpen, onClose, onSave, editEvent }) => {
  const empty = { title: '', type: 'mixer', date: '', time: '', location: '', description: '', guestCap: '' };
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editEvent) {
      const d = editEvent.date ? new Date(editEvent.date) : null;
      setForm({
        title: editEvent.title || '',
        type: editEvent.type || 'mixer',
        date: d ? d.toISOString().split('T')[0] : '',
        time: d ? `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}` : '',
        location: editEvent.location || '',
        description: editEvent.description || '',
        guestCap: editEvent.guestCap || '',
      });
    } else {
      setForm(empty);
    }
    setError('');
  }, [editEvent, isOpen]);

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError('Event title is required.'); return; }
    if (!form.date) { setError('Event date is required.'); return; }
    setLoading(true);
    try {
      const dateTime = form.time ? `${form.date}T${form.time}:00Z` : `${form.date}T18:00:00Z`;
      const payload = { ...form, date: dateTime, guestCap: form.guestCap ? parseInt(form.guestCap) : null };
      delete payload.time;

      let res;
      if (editEvent) {
        res = await client.patch(`/events/${editEvent.id}`, payload);
      } else {
        res = await client.post('/events', payload);
      }

      if (res.data.success) { onSave(res.data.data); onClose(); }
      else setError(res.data.error || 'Failed to save event');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editEvent ? 'Edit Event' : 'Create Event'} size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : editEvent ? 'Save changes' : 'Create event'}
          </button>
        </>
      }
    >
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
          <X size={14} />{error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="label">Event title *</label>
          <input className="input-field" placeholder="Spring Formal 2025" value={form.title} onChange={e => update('title', e.target.value)} autoFocus />
        </div>

        <div>
          <label className="label">Event type</label>
          <div className="grid grid-cols-3 gap-2">
            {EVENT_TYPES.map(t => {
              const cfg = TYPE_CONFIG[t];
              return (
                <button key={t} type="button"
                  onClick={() => update('type', t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all
                    ${form.type === t ? `${cfg.bg} ${cfg.border} text-gray-800` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date *</label>
            <input type="date" className="input-field" value={form.date} onChange={e => update('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Time</label>
            <input type="time" className="input-field" value={form.time} onChange={e => update('time', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Location</label>
            <input className="input-field" placeholder="Chapter House" value={form.location} onChange={e => update('location', e.target.value)} />
          </div>
          <div>
            <label className="label">Guest cap</label>
            <input type="number" className="input-field" placeholder="No limit" value={form.guestCap} onChange={e => update('guestCap', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input-field resize-none" rows={3} placeholder="Event details, dress code, etc." value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// Event Detail Modal
const EventDetailModal = ({ event, isOpen, onClose, onEdit }) => {
  const { user } = useAuth();
  const isAdminOrOfficer = user?.role === 'admin' || user?.role === 'officer';
  const [qrCopied, setQrCopied] = useState(false);
  const [minutes, setMinutes] = useState('');
  const [savingMinutes, setSavingMinutes] = useState(false);
  const [minutesSaved, setMinutesSaved] = useState(false);
  const [showMinutes, setShowMinutes] = useState(false);

  useEffect(() => { if (event) setMinutes(event.minutes || ''); }, [event]);
  if (!event) return null;

  const checkInUrl = `${window.location.origin}/checkin?event=${event.id}`;
  const copyLink = () => {
    navigator.clipboard.writeText(checkInUrl);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  const saveMinutes = async () => {
    setSavingMinutes(true);
    await client.patch(`/events/${event.id}/minutes`, { minutes }).catch(() => {});
    setMinutesSaved(true);
    setTimeout(() => setMinutesSaved(false), 2000);
    setSavingMinutes(false);
  };

  const downloadIcal = () => {
    window.open(`/api/events/${event.id}/ical`, '_blank');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Details" size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => { onClose(); onEdit(event); }}>Edit Event</button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 ${TYPE_CONFIG[event.type]?.bg || 'bg-gray-50'} rounded-xl flex items-center justify-center flex-shrink-0 border ${TYPE_CONFIG[event.type]?.border || 'border-gray-200'}`}>
            <CalendarDays size={22} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <TypeBadge type={event.type} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays size={14} className="text-gray-400" />
            {formatDate(event.date)}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock size={14} className="text-gray-400" />
            {formatTime(event.date)}
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-gray-600 col-span-2">
              <MapPin size={14} className="text-gray-400" />
              {event.location}
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Users size={14} className="text-gray-400" />
            {event.guestCount || 0} guests{event.guestCap ? ` / ${event.guestCap} cap` : ''}
          </div>
          {event.attendanceCount != null && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clipboard size={14} className="text-gray-400" />
              {event.attendanceCount} attended
            </div>
          )}
        </div>

        {event.description && (
          <div className="p-3.5 bg-gray-50 rounded-xl text-sm text-gray-700 border border-gray-100">
            {event.description}
          </div>
        )}

        {/* Actions row */}
        <div className="flex gap-2">
          <button onClick={downloadIcal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Download size={13} /> Add to Calendar
          </button>
          <button onClick={() => setShowMinutes(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${showMinutes ? 'bg-navy text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
            <FileText size={13} /> Meeting Minutes
          </button>
        </div>

        {/* Meeting minutes */}
        {showMinutes && (
          <div className="border border-gray-200 rounded-xl p-4 animate-slide-up">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Meeting Minutes</p>
            {isAdminOrOfficer ? (
              <>
                <textarea
                  className="input-field resize-none text-sm font-mono"
                  rows={8}
                  placeholder="Record motions, votes, action items, and notes from this meeting..."
                  value={minutes}
                  onChange={e => setMinutes(e.target.value)}
                />
                <button onClick={saveMinutes} disabled={savingMinutes}
                  className="btn-primary text-xs mt-2">
                  {minutesSaved ? '✓ Saved!' : savingMinutes ? 'Saving…' : 'Save Minutes'}
                </button>
              </>
            ) : minutes ? (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap border border-gray-100">
                {minutes}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic py-4 text-center">No minutes recorded for this meeting yet.</p>
            )}
          </div>
        )}

        {/* QR Section */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <QrCode size={16} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Check-in Link</span>
            </div>
            <button onClick={copyLink} className={`text-xs font-medium transition-colors ${qrCopied ? 'text-emerald-600' : 'text-navy hover:text-gold'}`}>
              {qrCopied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>
          <p className="text-xs text-gray-400 font-mono truncate bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
            {checkInUrl}
          </p>
        </div>
      </div>
    </Modal>
  );
};

// Event Card — calendar-widget date + type color accent
const EventCard = ({ event, onClick }) => {
  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
  const isPast = new Date(event.date) < new Date();
  const d = new Date(event.date);
  const dayNum = d.toLocaleDateString('en-US', { day: 'numeric' });
  const monthAbbr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const timeStr = formatTime(event.date);
  const fillPct = event.guestCap ? Math.min(100, Math.round((event.guestCount || 0) / event.guestCap * 100)) : null;

  return (
    <div onClick={onClick}
      className={`card cursor-pointer active:scale-98 transition-all hover:shadow-card-hover group overflow-hidden ${isPast ? 'opacity-70' : ''}`}>
      {/* Top accent bar */}
      <div className={`h-1 w-full ${cfg.dot}`} />
      <div className="p-4 flex gap-3">
        {/* Calendar date widget */}
        <div className={`w-12 flex-shrink-0 flex flex-col items-center justify-center rounded-xl py-1.5 ${cfg.bg} border ${cfg.border}`}>
          <p className="text-[10px] font-bold text-gray-500 leading-none">{monthAbbr}</p>
          <p className="text-xl font-extrabold text-gray-900 leading-tight">{dayNum}</p>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-navy transition-colors">
              {event.title}
            </h3>
            <span className={`badge ${cfg.classes} flex-shrink-0`}>{cfg.label}</span>
          </div>

          <div className="mt-1.5 space-y-1">
            {timeStr && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Clock size={11} />
                {timeStr}
                {event.location && <><span>·</span><MapPin size={11} />{event.location}</>}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Users size={11} />
              {event.guestCount || 0}{event.guestCap ? ` / ${event.guestCap}` : ''} guests
              {isPast && event.attendanceCount != null && (
                <span className="text-emerald-600 font-medium">· {event.attendanceCount} attended</span>
              )}
            </div>
          </div>

          {/* Capacity bar */}
          {fillPct !== null && !isPast && (
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${fillPct >= 90 ? 'bg-red-400' : fillPct >= 60 ? 'bg-gold' : 'bg-emerald-400'}`}
                style={{ width: `${fillPct}%` }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await client.get('/events');
      if (res.data.success) setEvents(res.data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleSave = (saved) => {
    setEvents(prev => {
      const idx = prev.findIndex(e => e.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  };

  const now = new Date();
  const filtered = events.filter(e => {
    const isUpcoming = new Date(e.date) >= now;
    const matchTab = tab === 'upcoming' ? isUpcoming : !isUpcoming;
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Manage chapter events and track attendance</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Create Event
        </button>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {['upcoming', 'past'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="input-field pl-10 py-2"
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton w-16 h-5 rounded-lg mb-3" />
              <div className="skeleton w-36 h-5 rounded mb-2" />
              <div className="space-y-1.5">
                <div className="skeleton w-40 h-3.5 rounded" />
                <div className="skeleton w-28 h-3.5 rounded" />
                <div className="skeleton w-20 h-3.5 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <CalendarDays size={48} className="text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">
            {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </h3>
          {tab === 'upcoming' && (
            <button className="btn-primary mt-4" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> Create first event
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setDetailEvent(event)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <EventFormModal
        isOpen={showCreate || !!editEvent}
        onClose={() => { setShowCreate(false); setEditEvent(null); }}
        onSave={handleSave}
        editEvent={editEvent}
      />

      <EventDetailModal
        event={detailEvent}
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        onEdit={(e) => { setDetailEvent(null); setEditEvent(e); }}
      />
    </div>
  );
}
