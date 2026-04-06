import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Search, Check, X, QrCode, Users,
  TrendingUp, ChevronDown, History, ClipboardCheck
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E', sidebar: '#0A0F1C',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const AVATAR_PALETTE = ['#4F8EF7', '#A78BFA', '#34D399', '#FB923C', '#F87171', '#22D3EE', '#F0B429'];
const avatarColor = (name) => AVATAR_PALETTE[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTE.length];

const cardStyle = {
  background: T.card,
  border: '1px solid ' + T.border,
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
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
};

const primaryBtnStyle = {
  background: T.accent,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 0 20px rgba(79,142,247,0.2)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
};

const secondaryBtnStyle = {
  background: 'rgba(255,255,255,0.06)',
  color: T.text1,
  border: '1px solid ' + T.borderStrong,
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
};

const QRScanModal = ({ isOpen, onClose, eventId }) => {
  const checkInUrl = eventId ? `${window.location.origin}/checkin?event=${eventId}` : '';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Check-in" size="sm">
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: T.text2, marginBottom: 16 }}>
          Share this link or QR code with members to record attendance:
        </p>
        <div style={{ background: T.elevated, border: '1px solid ' + T.border, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{
            width: 160, height: 160, background: 'rgba(255,255,255,0.04)', margin: '0 auto 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 12,
          }}>
            <QrCode size={64} color={T.text3} />
            <span className="sr-only">QR placeholder — integrate a QR library in production</span>
          </div>
          <p style={{ fontSize: 11, color: T.text3, fontFamily: 'monospace', wordBreak: 'break-all' }}>{checkInUrl}</p>
        </div>
        <button style={{ ...secondaryBtnStyle, width: '100%', justifyContent: 'center' }}
          onClick={() => { navigator.clipboard.writeText(checkInUrl); }}>
          Copy link
        </button>
      </div>
    </Modal>
  );
};

export default function Attendance() {
  const { user } = useAuth();
  const [tab, setTab] = useState('checklist');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [members, setMembers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [showQR, setShowQR] = useState(false);

  // History tab
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  useEffect(() => {
    client.get('/events')
      .then(res => { if (res.data.success) setEvents(res.data.data || []); })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, []);

  const loadEvent = useCallback(async (eventId) => {
    if (!eventId) return;
    setLoading(true);
    try {
      const [membersRes, attendanceRes] = await Promise.all([
        client.get('/members'),
        client.get(`/events/${eventId}/attendance`),
      ]);
      if (membersRes.data.success) setMembers(membersRes.data.data || []);
      if (attendanceRes.data.success) {
        const map = {};
        (attendanceRes.data.data || []).forEach(r => { map[r.memberId] = r.attended; });
        setAttendance(map);
      }
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadEvent(selectedEvent); }, [selectedEvent, loadEvent]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await client.get('/attendance/history');
      if (res.data.success) setHistory(res.data.data || []);
    } catch { /* empty */ }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const toggleAttendance = async (memberId) => {
    if (!selectedEvent || !isAdmin) return;
    const newVal = !attendance[memberId];
    setAttendance(prev => ({ ...prev, [memberId]: newVal }));
    setSaving(memberId);
    try {
      await client.post(`/events/${selectedEvent}/attendance`, { memberId, attended: newVal });
    } catch {
      setAttendance(prev => ({ ...prev, [memberId]: !newVal }));
    } finally { setSaving(null); }
  };

  const filteredMembers = members.filter(m =>
    !search || `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const attendedCount = Object.values(attendance).filter(Boolean).length;
  const attendanceRate = members.length > 0 ? Math.round((attendedCount / members.length) * 100) : 0;

  const rateColor = attendanceRate >= 80 ? T.success : attendanceRate >= 60 ? T.warning : T.danger;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0 }}>Attendance</h1>
          <p style={{ fontSize: 14, color: T.text2, margin: '4px 0 0' }}>Track member attendance at chapter events</p>
        </div>
        {selectedEvent && (
          <button style={secondaryBtnStyle} onClick={() => setShowQR(true)}>
            <QrCode size={15} /> QR Check-in
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setTab('checklist')}
          style={tab === 'checklist'
            ? { background: T.accent, color: '#fff', borderRadius: 20, padding: '6px 16px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }
            : { background: 'transparent', color: T.text2, borderRadius: 20, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }
          }
        >
          <ClipboardCheck size={14} /> Checklist
        </button>
        <button
          onClick={() => setTab('history')}
          style={tab === 'history'
            ? { background: T.accent, color: '#fff', borderRadius: 20, padding: '6px 16px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }
            : { background: 'transparent', color: T.text2, borderRadius: 20, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }
          }
        >
          <History size={14} /> History
        </button>
      </div>

      {tab === 'checklist' && (
        <>
          {/* Event selector */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Select Event
            </label>
            <select
              style={{ ...inputStyle, cursor: 'pointer', appearance: 'none', backgroundImage: 'none' }}
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              disabled={eventsLoading}
            >
              <option value="">Choose an event…</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} — {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Present', value: attendedCount, color: T.success },
                  { label: 'Absent', value: members.length - attendedCount, color: T.danger },
                  { label: 'Rate', value: `${attendanceRate}%`, color: rateColor },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
                    <p style={{ fontSize: 28, fontWeight: 700, color, margin: '0 0 4px' }}>{value}</p>
                    <p style={{ fontSize: 12, color: T.text3, margin: 0, fontWeight: 500 }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Rate bar */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, width: `${attendanceRate}%`,
                    background: rateColor, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.text3, pointerEvents: 'none' }} />
                <input
                  style={{ ...inputStyle, paddingLeft: 38 }}
                  placeholder="Search members…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Member checklist */}
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} style={{ ...cardStyle, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />
                      <div style={{ flex: 1, height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)' }} />
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '64px 0', color: T.text3 }}>
                  <Users size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                  No members found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredMembers.map(m => {
                    const present = attendance[m.id] || false;
                    const color = avatarColor((m.firstName || '') + (m.lastName || ''));
                    const init = `${m.firstName?.[0] || ''}${m.lastName?.[0] || ''}`.toUpperCase();
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleAttendance(m.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          borderRadius: 10, cursor: isAdmin ? 'pointer' : 'default', userSelect: 'none',
                          transition: 'all 0.15s',
                          background: present ? 'rgba(52,211,153,0.08)' : T.card,
                          border: present ? '1px solid rgba(52,211,153,0.25)' : '1px solid ' + T.border,
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {init}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: T.text1, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {m.firstName} {m.lastName}
                          </p>
                          {m.position && (
                            <p style={{ fontSize: 12, color: T.text3, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {m.position}
                            </p>
                          )}
                        </div>
                        {saving === m.id ? (
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid rgba(255,255,255,0.15)`, borderTopColor: T.accent,
                            animation: 'spin 0.7s linear infinite',
                          }} />
                        ) : (
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: present ? T.success : 'rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.15s',
                          }}>
                            {present && <Check size={14} color="#fff" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {!selectedEvent && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
              <CalendarDays size={48} style={{ color: T.text3, marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: T.text3 }}>Select an event to take attendance</p>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div>
          {historyLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Array(5).fill(0).map((_, i) => (
                <div key={i} style={{ height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}>
              <History size={48} style={{ color: T.text3, marginBottom: 12, opacity: 0.5 }} />
              <p style={{ fontSize: 14, color: T.text2 }}>No attendance history yet</p>
            </div>
          ) : (
            <div style={{ ...cardStyle, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid ' + T.border, background: 'rgba(255,255,255,0.02)' }}>
                    {['Event', 'Date', 'Present', 'Total', 'Rate'].map((h, i) => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '12px 16px',
                        fontSize: 11, fontWeight: 700, color: T.text3,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        display: i === 1 ? undefined : undefined,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => {
                    const rate = row.total > 0 ? Math.round((row.attended / row.total) * 100) : 0;
                    const rColor = rate >= 80 ? T.success : rate >= 60 ? T.warning : T.danger;
                    return (
                      <tr
                        key={i}
                        style={{
                          background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: T.text1 }}>
                          {row.eventTitle}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: T.text2 }}>
                          {row.date ? new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: T.text2 }}>{row.attended}</td>
                        <td style={{ padding: '13px 16px', fontSize: 14, color: T.text2 }}>{row.total}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: rColor }}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <QRScanModal isOpen={showQR} onClose={() => setShowQR(false)} eventId={selectedEvent} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
