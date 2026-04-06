import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, X, Check, Search, Download, ChevronDown,
  AlertCircle, UserCheck, UserX, Clock, Mail, CalendarDays
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: T.text1,
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  fontSize: 14,
  boxSizing: 'border-box',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: T.text2,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', bg: 'rgba(251,191,36,0.12)', color: '#FBBF24', border: 'rgba(251,191,36,0.25)' },
  approved: { label: 'Approved', bg: 'rgba(52,211,153,0.12)', color: '#34D399', border: 'rgba(52,211,153,0.25)' },
  denied: { label: 'Denied', bg: 'rgba(248,113,113,0.12)', color: '#F87171', border: 'rgba(248,113,113,0.25)' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 999,
      padding: '3px 10px',
      letterSpacing: '0.03em',
    }}>
      {cfg.label}
    </span>
  );
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
    <form onSubmit={handleAdd} style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      padding: 16,
      background: T.elevated,
      border: '1px solid ' + T.border,
      borderRadius: 10,
    }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <input
          style={inputStyle}
          placeholder="Guest name *"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
        />
      </div>
      <div style={{ flex: 1, minWidth: 160 }}>
        <input
          style={inputStyle}
          placeholder="Phone or email (optional)"
          value={contact}
          onChange={e => setContact(e.target.value)}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          background: T.accent,
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '10px 18px',
          fontWeight: 600,
          fontSize: 13,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: '0 0 20px rgba(79,142,247,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: loading ? 0.7 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        <Plus size={16} /> {loading ? 'Adding…' : 'Add Guest'}
      </button>
      {error && (
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T.danger }}>
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
  const capBarColor = capPct >= 100 ? T.danger : capPct >= 80 ? T.warning : T.success;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={labelStyle}>Select event</label>
        <div style={{ position: 'relative', maxWidth: 360 }}>
          <select
            style={selectStyle}
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
          <ChevronDown size={14} color={T.text2} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        </div>
      </div>

      {selectedEvent && (
        <>
          {cap != null && (
            <div style={{
              background: T.card,
              border: '1px solid ' + T.border,
              borderRadius: 12,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                <span style={{ fontWeight: 500, color: T.text2 }}>Guest slots used</span>
                <span style={{ fontWeight: 700, color: T.text1 }}>{totalGuests} / {cap}</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 999,
                  background: capBarColor,
                  width: `${capPct}%`,
                  transition: 'width 0.5s ease',
                  boxShadow: `0 0 8px ${capBarColor}55`,
                }} />
              </div>
              {capPct >= 100 && (
                <p style={{ fontSize: 12, color: T.danger, marginTop: 6, margin: '6px 0 0' }}>Guest cap reached</p>
              )}
            </div>
          )}

          <AddGuestForm eventId={selectedEvent} onAdded={handleAdded} />

          <div style={{
            background: T.card,
            border: '1px solid ' + T.border,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid ' + T.border,
              background: T.elevated,
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: T.text2, margin: 0 }}>My Guests ({totalGuests})</h3>
            </div>
            {loading ? (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ flex: 1, height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ width: 64, height: 20, borderRadius: 999, background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                ))}
              </div>
            ) : guests.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(79,142,247,0.08)', borderRadius: 10, padding: 12, display: 'inline-flex', marginBottom: 12 }}>
                  <Users size={24} color={T.text3} />
                </div>
                <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>No guests added yet</p>
              </div>
            ) : (
              <div>
                {guests.map((g, idx) => (
                  <div
                    key={g.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 20px',
                      borderBottom: idx < guests.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: idx % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      background: 'rgba(79,142,247,0.12)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                      color: T.accent,
                      flexShrink: 0,
                    }}>
                      {g.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</p>
                      {g.contact && <p style={{ fontSize: 12, color: T.text2, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.contact}</p>}
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(79,142,247,0.08)', borderRadius: 12, padding: 16, display: 'inline-flex', marginBottom: 14 }}>
            <CalendarDays size={32} color={T.text3} />
          </div>
          <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>Select an event to manage your guests</p>
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
  const capBarColor = capPct >= 100 ? T.danger : capPct >= 80 ? T.warning : T.success;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={labelStyle}>Select event</label>
          <div style={{ position: 'relative' }}>
            <select
              style={selectStyle}
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
            <ChevronDown size={14} color={T.text2} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        </div>
        {selectedEvent && (
          <button
            onClick={exportCSV}
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: T.text1,
              border: '1px solid ' + T.borderStrong,
              borderRadius: 8,
              padding: '10px 16px',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {selectedEvent && (
        <>
          {/* Summary chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <div style={{
              background: T.card,
              border: '1px solid ' + T.border,
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
            }}>
              <Users size={14} color={T.text2} />
              <span style={{ fontWeight: 700, color: T.text1 }}>{guests.length}</span>
              <span style={{ color: T.text2 }}>total{event?.guestCap ? ` / ${event.guestCap} cap` : ''}</span>
            </div>
            {Object.entries(counts).map(([status, count]) =>
              count > 0 && (
                <div key={status} style={{
                  background: T.card,
                  border: '1px solid ' + T.border,
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <StatusBadge status={status} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.text1 }}>{count}</span>
                </div>
              )
            )}
          </div>

          {capPct != null && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T.text2, marginBottom: 6 }}>
                <span>Cap usage</span>
                <span>{guests.length} / {event.guestCap}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 999,
                  background: capBarColor,
                  width: `${capPct}%`,
                  transition: 'width 0.5s ease',
                  boxShadow: `0 0 8px ${capBarColor}55`,
                }} />
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color={T.text2} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              style={{ ...inputStyle, paddingLeft: 40 }}
              placeholder="Search guests…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div style={{
            background: T.card,
            border: '1px solid ' + T.border,
            borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid ' + T.border, background: T.elevated }}>
                  {['Guest', 'Contact', 'Submitted By', 'Status', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '12px 16px',
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.text2,
                        textAlign: i === 4 ? 'right' : 'left',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {Array(5).fill(0).map((__, j) => (
                        <td key={j} style={{ padding: '12px 16px' }}>
                          <div style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.05)', width: 80 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '32px 16px', textAlign: 'center', color: T.text2, fontSize: 13 }}>
                      No guests found
                    </td>
                  </tr>
                ) : filtered.map((g, idx) => (
                  <tr
                    key={g.id}
                    style={{
                      borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      background: idx % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent'}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: T.text1 }}>{g.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.text2 }}>{g.contact || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: T.text2 }}>{g.submittedBy || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={g.status} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                        {g.status !== 'approved' && (
                          <button
                            onClick={() => updateStatus(g.id, 'approved')}
                            disabled={updating === g.id}
                            title="Approve"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '6px',
                              cursor: updating === g.id ? 'not-allowed' : 'pointer',
                              color: T.success,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              opacity: updating === g.id ? 0.5 : 1,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,211,153,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        {g.status !== 'denied' && (
                          <button
                            onClick={() => updateStatus(g.id, 'denied')}
                            disabled={updating === g.id}
                            title="Deny"
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '6px',
                              cursor: updating === g.id ? 'not-allowed' : 'pointer',
                              color: T.danger,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              opacity: updating === g.id ? 0.5 : 1,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
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

      {!selectedEvent && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(79,142,247,0.08)', borderRadius: 12, padding: 16, display: 'inline-flex', marginBottom: 14 }}>
            <CalendarDays size={32} color={T.text3} />
          </div>
          <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>Select an event to manage guests</p>
        </div>
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
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0 }}>Guest List</h1>
        <p style={{ color: T.text2, marginTop: 6, fontSize: 14, margin: '6px 0 0' }}>Manage event guest submissions and approvals</p>
      </div>

      {/* Tab switcher */}
      <div style={{
        display: 'inline-flex',
        background: T.elevated,
        border: '1px solid ' + T.border,
        borderRadius: 10,
        padding: 4,
        marginBottom: 24,
        gap: 4,
      }}>
        <button
          onClick={() => setTab('mine')}
          style={{
            padding: '8px 20px',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: tab === 'mine' ? T.card : 'transparent',
            color: tab === 'mine' ? T.text1 : T.text2,
            boxShadow: tab === 'mine' ? '0 1px 6px rgba(0,0,0,0.3)' : 'none',
          }}
        >
          My Guests
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab('all')}
            style={{
              padding: '8px 20px',
              borderRadius: 7,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: tab === 'all' ? T.card : 'transparent',
              color: tab === 'all' ? T.text1 : T.text2,
              boxShadow: tab === 'all' ? '0 1px 6px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            All Guests
          </button>
        )}
      </div>

      {loadingEvents ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ height: 40, borderRadius: 8, background: 'rgba(255,255,255,0.05)', maxWidth: 360 }} />
          <div style={{ height: 128, borderRadius: 12, background: 'rgba(255,255,255,0.05)' }} />
        </div>
      ) : (
        tab === 'mine'
          ? <MyGuestsView events={events} />
          : <AllGuestsView events={events} />
      )}
    </div>
  );
}
