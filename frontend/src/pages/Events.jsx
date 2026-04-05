import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, MapPin, Users, CalendarDays, Clock, QrCode,
  X, ChevronRight, Download, FileText, Clipboard
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const EVENT_TYPES = ['mixer', 'formal', 'philanthropy', 'meeting', 'social', 'other'];

const TYPE_CONFIG = {
  mixer:        { label: 'Mixer',        dot: '#3b82f6', accent: 'rgba(59,130,246,0.15)',  text: '#3b82f6',  bg: 'bg-blue-50',    border: 'border-blue-200',    classes: 'badge-blue'   },
  formal:       { label: 'Formal',       dot: '#C9A84C', accent: 'rgba(201,168,76,0.15)', text: '#b8932a',  bg: 'bg-gold/10',    border: 'border-gold/30',     classes: 'badge-gold'   },
  philanthropy: { label: 'Philanthropy', dot: '#10b981', accent: 'rgba(16,185,129,0.15)', text: '#059669',  bg: 'bg-emerald-50', border: 'border-emerald-200', classes: 'badge-green'  },
  meeting:      { label: 'Meeting',      dot: '#0F1C3F', accent: 'rgba(15,28,63,0.1)',    text: '#0F1C3F',  bg: 'bg-navy/5',     border: 'border-navy/20',     classes: 'badge-navy'   },
  social:       { label: 'Social',       dot: '#8b5cf6', accent: 'rgba(139,92,246,0.15)', text: '#7c3aed',  bg: 'bg-purple-50',  border: 'border-purple-200',  classes: 'badge-purple' },
  other:        { label: 'Other',        dot: '#6b7280', accent: 'rgba(107,114,128,0.1)', text: '#4b5563',  bg: 'bg-gray-50',    border: 'border-gray-200',    classes: 'badge-gray'   },
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

/* ─── Group events by date label ─── */
function groupEventsByDate(events) {
  const groups = new Map();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  events.forEach(event => {
    const d = new Date(event.date);
    const eventDay = new Date(d); eventDay.setHours(0, 0, 0, 0);
    const diff = Math.round((eventDay - today) / 86400000);

    let key;
    if (diff === 0) key = 'Today';
    else if (diff === 1) key = 'Tomorrow';
    else if (diff === -1) key = 'Yesterday';
    else key = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  });

  return [...groups.entries()];
}

/* ─── Event Form Modal ─── */
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
        time: d ? `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}` : '',
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
      if (editEvent) res = await client.patch(`/events/${editEvent.id}`, payload);
      else res = await client.post('/events', payload);
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
                <button key={t} type="button" onClick={() => update('type', t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${form.type === t ? `${cfg.bg} ${cfg.border} text-gray-800` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
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

/* ─── Event Detail Modal ─── */
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

  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;

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
        {/* Title + type */}
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 border ${cfg.border}`}>
            <CalendarDays size={22} className="text-gray-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
            <span className={`badge ${cfg.classes} capitalize mt-1`}>{cfg.label}</span>
          </div>
        </div>

        {/* Details */}
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

        <div className="flex gap-2">
          <button onClick={() => window.open(`/api/events/${event.id}/ical`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Download size={13} /> Add to Calendar
          </button>
          <button onClick={() => setShowMinutes(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${showMinutes ? 'bg-navy text-white' : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}>
            <FileText size={13} /> Meeting Minutes
          </button>
        </div>

        {showMinutes && (
          <div className="border border-gray-200 rounded-xl p-4 animate-slide-up">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Meeting Minutes</p>
            {isAdminOrOfficer ? (
              <>
                <textarea className="input-field resize-none text-sm font-mono" rows={8}
                  placeholder="Record motions, votes, action items..." value={minutes}
                  onChange={e => setMinutes(e.target.value)} />
                <button onClick={saveMinutes} disabled={savingMinutes} className="btn-primary text-xs mt-2">
                  {minutesSaved ? '✓ Saved!' : savingMinutes ? 'Saving…' : 'Save Minutes'}
                </button>
              </>
            ) : minutes ? (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 font-mono whitespace-pre-wrap border border-gray-100">{minutes}</div>
            ) : (
              <p className="text-sm text-gray-400 italic py-4 text-center">No minutes recorded yet.</p>
            )}
          </div>
        )}

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
          <p className="text-xs text-gray-400 font-mono truncate bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">{checkInUrl}</p>
        </div>
      </div>
    </Modal>
  );
};

/* ─── Event Row ─── */
const EventRow = ({ event, onClick, isFirst, isLast }) => {
  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
  const isPast = new Date(event.date) < new Date();
  const timeStr = formatTime(event.date);
  const fillPct = event.guestCap ? Math.min(100, Math.round((event.guestCount || 0) / event.guestCap * 100)) : null;

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 bg-white cursor-pointer transition-colors active:bg-gray-50 hover:bg-gray-50/80 ${!isLast ? 'border-b border-gray-50' : ''} ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''}`}
      style={{ opacity: isPast ? 0.65 : 1 }}
    >
      {/* Colored accent dot */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1" style={{ width: 36 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: cfg.dot,
          boxShadow: `0 0 0 3px ${cfg.accent}`,
        }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-gray-900 truncate">{event.title}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {timeStr && (
            <span className="flex items-center gap-1 text-[12px] text-gray-400">
              <Clock size={10} />{timeStr}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1 text-[12px] text-gray-400 truncate">
              <MapPin size={10} />{event.location}
            </span>
          )}
        </div>
        {/* Capacity bar */}
        {fillPct !== null && !isPast && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${fillPct}%`, background: fillPct >= 90 ? '#ef4444' : fillPct >= 60 ? '#C9A84C' : '#10b981' }} />
            </div>
            <span className="text-[10px] text-gray-400 flex-shrink-0">{event.guestCount || 0}/{event.guestCap}</span>
          </div>
        )}
        {isPast && event.attendanceCount != null && (
          <span className="text-[11px] text-emerald-600 font-medium">{event.attendanceCount} attended</span>
        )}
      </div>

      {/* Right: type badge + chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="hidden sm:inline-flex" style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 99,
          background: cfg.accent, color: cfg.text, letterSpacing: '0.02em',
        }}>
          {cfg.label}
        </span>
        <ChevronRight size={15} className="text-gray-300" />
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('upcoming');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);
  const { user } = useAuth();
  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  const fetchEvents = useCallback(async () => {
    try {
      const res = await client.get('/events');
      if (res.data.success) setEvents(res.data.data || []);
    } catch { }
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
  }).sort((a, b) => tab === 'upcoming' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date));

  const grouped = groupEventsByDate(filtered);

  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(160deg, #0F1C3F 0%, #1a2f6b 100%)',
        margin: '-1rem -1rem 0',
        padding: '28px 20px 24px',
      }} className="lg:mx-0 lg:rounded-2xl lg:mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-0.03em', lineHeight: 1.2 }}>Events</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 3 }}>
              {filtered.length} {tab === 'upcoming' ? 'upcoming' : 'past'} event{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
          {isOfficer && (
            <button onClick={() => setShowCreate(true)}
              style={{ background: 'linear-gradient(180deg, #d4b05a 0%, #C9A84C 100%)', color: '#0F1C3F', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, boxShadow: '0 2px 8px rgba(201,168,76,0.35)' }}>
              <Plus size={15} /> Create Event
            </button>
          )}
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 mb-5 mt-5">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {['upcoming', 'past'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" className="input-field pl-10 py-2.5 text-sm" placeholder="Search events…"
            value={search} onChange={e => setSearch(e.target.value)} />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="card">
              <div className="p-4 flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton w-40 h-4 rounded" />
                  <div className="skeleton w-28 h-3 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div style={{ width: 72, height: 72, background: 'rgba(15,28,63,0.05)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <CalendarDays size={32} className="text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-400 mb-1">
            {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </h3>
          {tab === 'upcoming' && isOfficer && (
            <button className="btn-primary mt-5" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Create first event
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([dateLabel, dayEvents]) => (
            <div key={dateLabel}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-2 px-1">
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {dateLabel}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
                <span style={{ fontSize: 11, color: '#C7C7CC', fontWeight: 500 }}>
                  {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Event rows grouped in card */}
              <div className="card overflow-hidden" style={{ border: '0.5px solid rgba(0,0,0,0.08)' }}>
                {dayEvents.map((event, i) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    onClick={() => setDetailEvent(event)}
                    isFirst={i === 0}
                    isLast={i === dayEvents.length - 1}
                  />
                ))}
              </div>
            </div>
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
