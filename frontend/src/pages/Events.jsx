import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, MapPin, Users, CalendarDays, Clock, QrCode,
  X, ChevronRight, Download, FileText, Clipboard
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getIsNative } from '../hooks/useNative';

// ─── Design tokens ───────────────────────────────────────────
const T = {
  bgPrimary:   '#070B14',
  cardBg:      '#0D1424',
  elevated:    '#131D2E',
  accentBlue:  '#4F8EF7',
  gold:        '#F0B429',
  success:     '#34D399',
  warning:     '#FBBF24',
  danger:      '#F87171',
  textPrimary: '#F8FAFC',
  textSec:     '#94A3B8',
  textMuted:   '#475569',
  border:      'rgba(255,255,255,0.07)',
  cardRadius:  12,
  btnRadius:   8,
  cardShadow:  '0 4px 24px rgba(0,0,0,0.4)',
  cardBorder:  '1px solid rgba(255,255,255,0.07)',
};

// ─── Event type config ────────────────────────────────────────
const EVENT_TYPES = ['mixer', 'formal', 'philanthropy', 'meeting', 'social', 'other'];

const TYPE_CONFIG = {
  mixer:        { label: 'Mixer',        bar: '#4F8EF7', badgeBg: 'rgba(79,142,247,0.15)',   badgeText: '#7FB3FF',  dot: '#4F8EF7'  },
  formal:       { label: 'Formal',       bar: '#F0B429', badgeBg: 'rgba(240,180,41,0.15)',   badgeText: '#F6C94E',  dot: '#F0B429'  },
  philanthropy: { label: 'Philanthropy', bar: '#34D399', badgeBg: 'rgba(52,211,153,0.15)',   badgeText: '#6EE7B7',  dot: '#34D399'  },
  meeting:      { label: 'Meeting',      bar: '#94A3B8', badgeBg: 'rgba(148,163,184,0.12)',  badgeText: '#CBD5E1',  dot: '#94A3B8'  },
  social:       { label: 'Social',       bar: '#A78BFA', badgeBg: 'rgba(167,139,250,0.15)',  badgeText: '#C4B5FD',  dot: '#A78BFA'  },
  other:        { label: 'Other',        bar: '#475569', badgeBg: 'rgba(71,85,105,0.15)',    badgeText: '#94A3B8',  dot: '#475569'  },
};

// ─── Helpers ──────────────────────────────────────────────────
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

function groupEventsByDate(events) {
  const groups = new Map();
  const today = new Date(); today.setHours(0, 0, 0, 0);

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

// ─── Shimmer skeleton ─────────────────────────────────────────
const Shimmer = ({ width, height, borderRadius = 6, style: extraStyle }) => (
  <div style={{
    width, height, borderRadius,
    background: `linear-gradient(90deg, ${T.cardBg} 0%, ${T.elevated} 50%, ${T.cardBg} 100%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    flexShrink: 0,
    ...extraStyle,
  }} />
);

// ─── Event Form Modal ─────────────────────────────────────────
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

  const inputStyle = {
    width: '100%', background: T.elevated, border: T.cardBorder, borderRadius: T.btnRadius,
    color: T.textPrimary, fontSize: 14, padding: '9px 12px', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 6, display: 'block' };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: T.btnRadius, marginBottom: 16, fontSize: 13, color: T.danger }}>
          <X size={14} />{error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Event title *</label>
          <input style={inputStyle} placeholder="Spring Formal 2025" value={form.title} onChange={e => update('title', e.target.value)} autoFocus />
        </div>
        <div>
          <label style={labelStyle}>Event type</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {EVENT_TYPES.map(t => {
              const cfg = TYPE_CONFIG[t];
              const selected = form.type === t;
              return (
                <button key={t} type="button" onClick={() => update('type', t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                    borderRadius: T.btnRadius, fontSize: 13, fontWeight: 600,
                    border: selected ? `1px solid ${cfg.dot}44` : T.cardBorder,
                    background: selected ? cfg.badgeBg : T.elevated,
                    color: selected ? cfg.badgeText : T.textSec,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input type="date" style={inputStyle} value={form.date} onChange={e => update('date', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Time</label>
            <input type="time" style={inputStyle} value={form.time} onChange={e => update('time', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Location</label>
            <input style={inputStyle} placeholder="Chapter House" value={form.location} onChange={e => update('location', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Guest cap</label>
            <input type="number" style={inputStyle} placeholder="No limit" value={form.guestCap} onChange={e => update('guestCap', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, resize: 'none' }} rows={3} placeholder="Event details, dress code, etc." value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// ─── Event Detail Modal ───────────────────────────────────────
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

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textSec };
  const iconStyle = { color: T.textMuted, flexShrink: 0 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Event Details" size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={() => { onClose(); onEdit(event); }}>Edit Event</button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Title + type */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, flexShrink: 0,
            background: cfg.badgeBg, border: `1px solid ${cfg.dot}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CalendarDays size={22} style={{ color: cfg.dot }} />
          </div>
          <div>
            <h3 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 20, margin: '0 0 6px', letterSpacing: '-0.02em' }}>{event.title}</h3>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
              background: cfg.badgeBg, color: cfg.badgeText, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px', background: T.elevated, borderRadius: T.cardRadius, border: T.cardBorder }}>
          <div style={rowStyle}><CalendarDays size={14} style={iconStyle} />{formatDate(event.date)}</div>
          <div style={rowStyle}><Clock size={14} style={iconStyle} />{formatTime(event.date)}</div>
          {event.location && (
            <div style={{ ...rowStyle, gridColumn: '1 / -1' }}><MapPin size={14} style={iconStyle} />{event.location}</div>
          )}
          <div style={rowStyle}><Users size={14} style={iconStyle} />{event.guestCount || 0} guests{event.guestCap ? ` / ${event.guestCap} cap` : ''}</div>
          {event.attendanceCount != null && (
            <div style={rowStyle}><Clipboard size={14} style={iconStyle} />{event.attendanceCount} attended</div>
          )}
        </div>

        {event.description && (
          <div style={{ padding: '14px', background: T.elevated, borderRadius: T.cardRadius, border: T.cardBorder, fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>
            {event.description}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => window.open(`/api/events/${event.id}/ical`, '_blank')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: T.textSec, background: T.elevated, border: T.cardBorder, borderRadius: T.btnRadius, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = T.textPrimary; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.borderColor = T.border; }}
          >
            <Download size={13} /> Add to Calendar
          </button>
          <button
            onClick={() => setShowMinutes(s => !s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', fontSize: 12, fontWeight: 600,
              background: showMinutes ? T.accentBlue : T.elevated,
              color: showMinutes ? '#fff' : T.textSec,
              border: showMinutes ? 'none' : T.cardBorder,
              borderRadius: T.btnRadius, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <FileText size={13} /> Meeting Minutes
          </button>
        </div>

        {showMinutes && (
          <div style={{ border: T.cardBorder, borderRadius: T.cardRadius, padding: 16, background: T.elevated }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meeting Minutes</p>
            {isAdminOrOfficer ? (
              <>
                <textarea
                  style={{ width: '100%', background: T.cardBg, border: T.cardBorder, borderRadius: T.btnRadius, color: T.textPrimary, fontSize: 13, padding: '10px 12px', outline: 'none', resize: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  rows={8} placeholder="Record motions, votes, action items..."
                  value={minutes} onChange={e => setMinutes(e.target.value)}
                />
                <button
                  onClick={saveMinutes} disabled={savingMinutes}
                  style={{
                    marginTop: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700,
                    background: minutesSaved ? 'rgba(52,211,153,0.15)' : T.accentBlue,
                    color: minutesSaved ? T.success : '#fff',
                    border: minutesSaved ? '1px solid rgba(52,211,153,0.3)' : 'none',
                    borderRadius: T.btnRadius, cursor: 'pointer',
                  }}
                >
                  {minutesSaved ? '✓ Saved!' : savingMinutes ? 'Saving…' : 'Save Minutes'}
                </button>
              </>
            ) : minutes ? (
              <div style={{ background: T.cardBg, borderRadius: T.btnRadius, padding: 12, fontSize: 13, color: T.textSec, fontFamily: 'monospace', whiteSpace: 'pre-wrap', border: T.cardBorder }}>{minutes}</div>
            ) : (
              <p style={{ fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '16px 0', fontStyle: 'italic' }}>No minutes recorded yet.</p>
            )}
          </div>
        )}

        {/* Check-in link */}
        <div style={{ border: T.cardBorder, borderRadius: T.cardRadius, padding: 16, background: T.elevated }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <QrCode size={15} style={{ color: T.textSec }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>Check-in Link</span>
            </div>
            <button
              onClick={copyLink}
              style={{ fontSize: 12, fontWeight: 700, color: qrCopied ? T.success : T.accentBlue, background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'color 0.15s' }}
            >
              {qrCopied ? '✓ Copied!' : 'Copy link'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: T.cardBg, padding: '8px 12px', borderRadius: T.btnRadius, border: T.cardBorder, margin: 0 }}>
            {checkInUrl}
          </p>
        </div>
      </div>
    </Modal>
  );
};

// ─── Event Row ────────────────────────────────────────────────
const EventRow = ({ event, onClick, isFirst, isLast }) => {
  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
  const isPast = new Date(event.date) < new Date();
  const timeStr = formatTime(event.date);
  const fillPct = event.guestCap ? Math.min(100, Math.round((event.guestCount || 0) / event.guestCap * 100)) : null;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 0,
        background: hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        cursor: 'pointer',
        borderTop: isFirst ? 'none' : `1px solid ${T.border}`,
        transition: 'background 0.15s',
        minHeight: 56,
        opacity: isPast ? 0.6 : 1,
      }}
    >
      {/* Left colored accent bar */}
      <div style={{ width: 3, alignSelf: 'stretch', background: cfg.bar, flexShrink: 0, borderRadius: isFirst ? '0 0 0 0' : '0', marginRight: 16 }} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, padding: '12px 0' }}>
        <p style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 3 }}>
          {timeStr && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textMuted }}>
              <Clock size={10} />{timeStr}
            </span>
          )}
          {event.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin size={10} />{event.location}
            </span>
          )}
        </div>
        {/* Capacity bar */}
        {fillPct !== null && !isPast && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, width: `${fillPct}%`, background: fillPct >= 90 ? T.danger : fillPct >= 60 ? T.warning : T.success, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>{event.guestCount || 0}/{event.guestCap}</span>
          </div>
        )}
        {isPast && event.attendanceCount != null && (
          <span style={{ fontSize: 11, color: T.success, fontWeight: 600, marginTop: 3, display: 'block' }}>{event.attendanceCount} attended</span>
        )}
      </div>

      {/* Right: type badge + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, paddingRight: 16 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 99,
          background: cfg.badgeBg, color: cfg.badgeText,
          letterSpacing: '0.03em', whiteSpace: 'nowrap',
        }}>
          {cfg.label}
        </span>
        <ChevronRight size={14} style={{ color: hovered ? T.textSec : T.textMuted, transition: 'color 0.15s' }} />
      </div>
    </div>
  );
};

// ─── Native design tokens ─────────────────────────────────────
const N = {
  bg: '#080C14', card: '#111827', elevated: '#1E2A3A',
  border: 'rgba(255,255,255,0.08)',
  accent: '#3B82F6', gold: '#F59E0B', success: '#10B981', danger: '#EF4444', purple: '#8B5CF6',
  text1: '#FFFFFF', text2: 'rgba(255,255,255,0.55)', text3: 'rgba(255,255,255,0.28)',
  sep: 'rgba(255,255,255,0.06)',
  font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
};

// ─── Main Events Page ─────────────────────────────────────────
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
  const isNative = getIsNative();

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

  // ─── Native iOS layout ──────────────────────────────────────
  if (isNative) {
    const TYPE_COLORS = { Mixer: N.accent, Social: N.purple, Meeting: N.success, Formal: N.gold, Other: '#64748B' };
    const [nativeTab, setNativeTab] = useState('Upcoming');

    const nativeFiltered = events.filter(e => {
      const isUpcoming = new Date(e.date) >= new Date();
      if (nativeTab === 'Upcoming') return isUpcoming;
      if (nativeTab === 'Past') return !isUpcoming;
      return true;
    }).sort((a, b) => nativeTab === 'Past'
      ? new Date(b.date) - new Date(a.date)
      : new Date(a.date) - new Date(b.date));

    const nativeGrouped = groupEventsByDate(nativeFiltered);

    return (
      <div style={{ background: N.bg, minHeight: '100vh', fontFamily: N.font, paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ padding: '24px 20px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: N.text1, margin: 0, letterSpacing: -0.5 }}>Events</h1>
        </div>

        {/* Segmented control */}
        <div style={{ display: 'flex', background: N.card, borderRadius: 12, padding: 3, margin: '16px 20px', border: '1px solid ' + N.border }}>
          {['Upcoming', 'Past', 'All'].map(t => (
            <button key={t} onClick={() => setNativeTab(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, background: nativeTab === t ? N.elevated : 'transparent', color: nativeTab === t ? N.text1 : N.text2, transition: 'all 0.15s' }}>{t}</button>
          ))}
        </div>

        {/* Event list grouped by date */}
        {loading ? (
          <div style={{ padding: '24px 20px', color: N.text2, fontSize: 15 }}>Loading…</div>
        ) : nativeFiltered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
            <p style={{ fontSize: 17, fontWeight: 600, color: N.text1, margin: '0 0 8px' }}>No events</p>
            <p style={{ fontSize: 14, color: N.text2 }}>Create one with the + button below</p>
          </div>
        ) : (
          nativeGrouped.map(([dateLabel, dayEvents]) => (
            <div key={dateLabel}>
              {/* Date header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 20px 10px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: N.text3, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{dateLabel.toUpperCase()}</span>
                <div style={{ flex: 1, height: '1px', background: N.sep }} />
              </div>

              {/* Events in this date group */}
              <div style={{ margin: '0 20px', background: N.card, borderRadius: 16, border: '1px solid ' + N.border, overflow: 'hidden' }}>
                {dayEvents.map((ev, i, arr) => {
                  const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.other;
                  const color = TYPE_COLORS[cfg.label] || N.accent;
                  return (
                    <div key={ev.id} onClick={() => setDetailEvent(ev)} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid ' + N.sep : 'none', cursor: 'pointer' }}>
                      <div style={{ width: 4, height: 52, borderRadius: 2, background: color, marginRight: 14, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: N.text1, marginBottom: 3 }}>{ev.title}</div>
                        <div style={{ fontSize: 13, color: N.text2 }}>{new Date(ev.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}{ev.location ? ' · ' + ev.location : ''}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: color, background: color + '20', padding: '4px 10px', borderRadius: 99, flexShrink: 0, marginLeft: 8 }}>{cfg.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {/* FAB — create event (officers only) */}
        {isOfficer && (
          <button onClick={() => setShowCreate(true)} style={{ position: 'fixed', bottom: 'calc(83px + env(safe-area-inset-bottom))', right: 20, width: 56, height: 56, borderRadius: 28, background: N.accent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, boxShadow: '0 4px 24px rgba(59,130,246,0.4)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        )}

        {/* Reuse existing modals */}
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

  return (
    <div>
      {/* inject shimmer keyframe */}
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }`}</style>

      {/* ─── Header card ─── */}
      <div style={{
        background: `linear-gradient(140deg, #0D1424 0%, #111827 50%, #0D1A2D 100%)`,
        border: T.cardBorder,
        borderRadius: T.cardRadius,
        padding: '28px 28px 24px',
        marginBottom: 24,
        boxShadow: T.cardShadow,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* subtle background decoration */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Events
            </h1>
            <p style={{ color: T.textMuted, fontSize: 13, margin: '5px 0 0' }}>
              {loading ? '…' : `${filtered.length} ${tab === 'upcoming' ? 'upcoming' : 'past'} event${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          {isOfficer && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: T.btnRadius,
                background: `linear-gradient(135deg, ${T.accentBlue}, #3B72D9)`,
                border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', flexShrink: 0,
                boxShadow: `0 4px 16px rgba(79,142,247,0.35), 0 0 0 1px rgba(79,142,247,0.2)`,
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(79,142,247,0.5), 0 0 0 1px rgba(79,142,247,0.3)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,142,247,0.35), 0 0 0 1px rgba(79,142,247,0.2)'}
            >
              <Plus size={15} /> Create Event
            </button>
          )}
        </div>
      </div>

      {/* ─── Tabs + Search ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Pill switcher */}
        <div style={{ display: 'flex', background: T.elevated, borderRadius: T.cardRadius, padding: 4, border: T.cardBorder }}>
          {['upcoming', 'past'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '7px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: tab === t ? T.accentBlue : 'transparent',
                color: tab === t ? '#fff' : T.textSec,
                textTransform: 'capitalize',
                boxShadow: tab === t ? '0 2px 8px rgba(79,142,247,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search events…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: T.cardBg, border: T.cardBorder,
              borderRadius: T.btnRadius, color: T.textPrimary, fontSize: 14,
              padding: '9px 36px 9px 36px', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Date label shimmer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Shimmer width={60} height={10} />
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>
          <div style={{ background: T.cardBg, border: T.cardBorder, borderRadius: T.cardRadius, overflow: 'hidden', boxShadow: T.cardShadow }}>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderTop: i > 0 ? T.cardBorder : 'none' }}>
                <div style={{ width: 3, height: 36, background: T.elevated, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Shimmer width="55%" height={13} />
                  <Shimmer width="35%" height={11} />
                </div>
                <Shimmer width={50} height={20} borderRadius={99} />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: T.cardBg, border: T.cardBorder, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: T.cardShadow }}>
            <CalendarDays size={34} style={{ color: T.textMuted }} />
          </div>
          <h3 style={{ color: T.textSec, fontWeight: 700, fontSize: 18, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </h3>
          <p style={{ color: T.textMuted, fontSize: 14, margin: '0 0 24px' }}>
            {tab === 'upcoming' ? 'Schedule something for your chapter' : 'No events match your search'}
          </p>
          {tab === 'upcoming' && isOfficer && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
                borderRadius: T.btnRadius, background: `linear-gradient(135deg, ${T.accentBlue}, #3B72D9)`,
                border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', boxShadow: '0 4px 16px rgba(79,142,247,0.35)',
              }}
            >
              <Plus size={15} /> Create first event
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {grouped.map(([dateLabel, dayEvents]) => (
            <div key={dateLabel}>
              {/* Date section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: T.textMuted,
                  textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                }}>
                  {dateLabel}
                </span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {dayEvents.length} event{dayEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Event rows in dark card */}
              <div style={{
                background: T.cardBg, border: T.cardBorder, borderRadius: T.cardRadius,
                overflow: 'hidden', boxShadow: T.cardShadow,
              }}>
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

      {/* ─── Modals ─── */}
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
