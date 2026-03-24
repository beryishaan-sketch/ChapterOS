import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Search, Check, X, QrCode, Users,
  TrendingUp, ChevronDown, History, ClipboardCheck
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500'];
const avatarColor = (name) => avatarColors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];

const QRScanModal = ({ isOpen, onClose, eventId }) => {
  const checkInUrl = eventId ? `${window.location.origin}/checkin/${eventId}` : '';
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR Check-in" size="sm">
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-600">Share this link or QR code with members to record attendance:</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="w-40 h-40 bg-white mx-auto mb-3 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
            <QrCode size={64} className="text-gray-300" />
            <span className="sr-only">QR placeholder — integrate a QR library in production</span>
          </div>
          <p className="text-xs text-gray-400 font-mono break-all">{checkInUrl}</p>
        </div>
        <button
          className="btn-secondary w-full justify-center"
          onClick={() => { navigator.clipboard.writeText(checkInUrl); }}
        >
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

  const event = events.find(e => e.id === selectedEvent);

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track member attendance at chapter events</p>
        </div>
        {selectedEvent && (
          <button className="btn-secondary self-start sm:self-auto" onClick={() => setShowQR(true)}>
            <QrCode size={15} /> QR Check-in
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit mb-6">
        <button onClick={() => setTab('checklist')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'checklist' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <ClipboardCheck size={14} className="inline mr-1.5" />Checklist
        </button>
        <button onClick={() => setTab('history')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <History size={14} className="inline mr-1.5" />History
        </button>
      </div>

      {tab === 'checklist' && (
        <>
          {/* Event selector */}
          <div className="flex flex-wrap items-end gap-4 mb-5">
            <div className="flex-1 min-w-64">
              <label className="label">Select event</label>
              <select
                className="select-field"
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
          </div>

          {selectedEvent && (
            <>
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{attendedCount}</p>
                  <p className="text-xs text-gray-500">Present</p>
                </div>
                <div className="card p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{members.length - attendedCount}</p>
                  <p className="text-xs text-gray-500">Absent</p>
                </div>
                <div className="card p-4 text-center">
                  <p className={`text-2xl font-bold ${attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {attendanceRate}%
                  </p>
                  <p className="text-xs text-gray-500">Rate</p>
                </div>
              </div>

              {/* Rate bar */}
              <div className="mb-5">
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${attendanceRate}%` }}
                  />
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input className="input-field pl-10 py-2" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {/* Member checklist */}
              {loading ? (
                <div className="space-y-2">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-gray-100">
                      <div className="skeleton w-9 h-9 rounded-full" />
                      <div className="skeleton h-4 flex-1 rounded" />
                      <div className="skeleton w-8 h-8 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users size={32} className="mx-auto mb-2 text-gray-200" />
                  No members found
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredMembers.map(m => {
                    const present = attendance[m.id] || false;
                    const color = avatarColor(m.firstName + m.lastName);
                    const init = `${m.firstName?.[0] || ''}${m.lastName?.[0] || ''}`.toUpperCase();
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleAttendance(m.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none
                          ${present
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          } ${!isAdmin ? 'cursor-default' : ''}`}
                      >
                        <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {init}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{m.firstName} {m.lastName}</p>
                          {m.position && <p className="text-xs text-gray-400 truncate">{m.position}</p>}
                        </div>
                        {saving === m.id ? (
                          <span className="w-7 h-7 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${present ? 'bg-emerald-500' : 'bg-gray-100'}`}>
                            {present && <Check size={14} className="text-white" />}
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <CalendarDays size={48} className="text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-400">Select an event to take attendance</p>
            </div>
          )}
        </>
      )}

      {tab === 'history' && (
        <div>
          {historyLoading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <History size={48} className="text-gray-200 mb-4" />
              <p className="text-sm text-gray-400">No attendance history yet</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="th">Event</th>
                    <th className="th hidden sm:table-cell">Date</th>
                    <th className="th">Present</th>
                    <th className="th">Total</th>
                    <th className="th">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, i) => {
                    const rate = row.total > 0 ? Math.round((row.attended / row.total) * 100) : 0;
                    return (
                      <tr key={i} className="table-row">
                        <td className="td font-medium text-gray-900">{row.eventTitle}</td>
                        <td className="td hidden sm:table-cell text-gray-500">
                          {row.date ? new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="td text-gray-700">{row.attended}</td>
                        <td className="td text-gray-700">{row.total}</td>
                        <td className="td">
                          <span className={`font-semibold ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {rate}%
                          </span>
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
    </div>
  );
}
