import React, { useState, useEffect } from 'react';
import { Trophy, Star, BookOpen, Zap, Settings, Plus, Minus, Check } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = [
  'bg-navy text-white', 'bg-purple-600 text-white', 'bg-emerald-600 text-white',
  'bg-orange-500 text-white', 'bg-rose-500 text-white', 'bg-blue-600 text-white',
];
const avatarCls = (name = '') => AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
const initials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

const PODIUM = [
  { rank: 2, height: 'h-24', bg: 'from-gray-200 to-gray-300', numBg: 'bg-gray-400', label: '2nd' },
  { rank: 1, height: 'h-32', bg: 'from-yellow-300 to-yellow-400', numBg: 'bg-yellow-500', label: '1st' },
  { rank: 3, height: 'h-20', bg: 'from-orange-300 to-orange-400', numBg: 'bg-orange-500', label: '3rd' },
];

function PointsRow({ m, onAdjust }) {
  const [input, setInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [pts, setPts] = useState(m.points || 0);

  const adjust = async (delta) => {
    const amt = parseInt(input) || 10;
    setSaving(true);
    try {
      const res = await client.post(`/leaderboard/${m.id}/points`, { points: delta * amt });
      setPts(res.data.data.points);
      onAdjust(m.id, res.data.data.points);
      setInput('');
    } catch {}
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 rounded-full ${avatarCls(m.firstName)} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
        {initials(m.firstName, m.lastName)}
      </div>
      <p className="flex-1 text-sm font-medium text-gray-900 truncate">{m.firstName} {m.lastName}</p>
      <span className="text-xs font-bold text-gold-dark w-14 text-right">{pts} pts</span>
      <button onClick={() => adjust(-1)} disabled={saving}
        className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 disabled:opacity-40">
        <Minus size={12} />
      </button>
      <input
        type="number" min="1"
        className="w-14 text-xs text-center border border-gray-200 rounded-lg px-1 py-1.5 focus:outline-none focus:ring-1 focus:ring-navy"
        placeholder="10"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button onClick={() => adjust(1)} disabled={saving}
        className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-100 disabled:opacity-40">
        <Plus size={12} />
      </button>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('points');
  const [managing, setManaging] = useState(false);
  const [search, setSearch] = useState('');

  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  useEffect(() => {
    client.get('/members').then(res => {
      if (res.data.success) setMembers(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleAdjust = (id, newPts) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, points: newPts } : m));
  };

  const active = members.filter(m => m.role !== 'alumni');

  const sorted = [...active].sort((a, b) => {
    if (tab === 'points') return (b.points || 0) - (a.points || 0);
    if (tab === 'gpa') return (b.gpa || 0) - (a.gpa || 0);
    return (b.studyHours || 0) - (a.studyHours || 0);
  });

  const filtered = managing
    ? active.filter(m => `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
    : sorted;

  const top3 = sorted.slice(0, 3);
  const podiumOrder = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length >= 2 ? [top3[1], top3[0]] : top3;

  const topValue = (m) => {
    if (tab === 'points') return `${m.points || 0} pts`;
    if (tab === 'gpa') return m.gpa ? m.gpa.toFixed(2) : '—';
    return `${m.studyHours || 0}h`;
  };
  const maxValue = sorted[0]
    ? (tab === 'points' ? sorted[0].points || 1 : tab === 'gpa' ? sorted[0].gpa || 1 : sorted[0].studyHours || 1)
    : 1;
  const rowValue = (m) => tab === 'points' ? m.points || 0 : tab === 'gpa' ? m.gpa || 0 : m.studyHours || 0;

  const totalPoints = members.reduce((s, m) => s + (m.points || 0), 0);
  const withGpa = active.filter(m => m.gpa);
  const avgGpa = withGpa.length > 0 ? withGpa.reduce((s, m) => s + m.gpa, 0) / withGpa.length : 0;

  if (loading) return (
    <div className="max-w-lg mx-auto space-y-3">
      {Array(6).fill(0).map((_, i) => <div key={i} className="card h-16 skeleton" />)}
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      {/* Header with manage toggle */}
      <div className="flex items-center justify-between mb-4">
        <div />
        {isOfficer && (
          <button onClick={() => { setManaging(m => !m); setSearch(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              managing ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {managing ? <><Check size={12} /> Done</> : <><Settings size={12} /> Manage Points</>}
          </button>
        )}
      </div>

      {/* Manage Points Panel */}
      {managing && (
        <div className="card mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-navy/3">
            <p className="text-sm font-bold text-gray-900 mb-0.5">✏️ Edit Member Points</p>
            <p className="text-xs text-gray-400">Enter an amount and press + or − to adjust</p>
          </div>
          <div className="px-4 py-2 border-b border-gray-100">
            <input className="input-field w-full text-sm" placeholder="Search member…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {filtered.map(m => (
              <PointsRow key={m.id} m={m} onAdjust={handleAdjust} />
            ))}
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-gold-dark" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900">{totalPoints.toLocaleString()}</p>
            <p className="text-xs text-gray-400">Total Points</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <BookOpen size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900">{avgGpa ? avgGpa.toFixed(2) : '—'}</p>
            <p className="text-xs text-gray-400">Avg GPA</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
        {[
          { value: 'points', label: '🏆 Points' },
          { value: 'gpa', label: '📚 GPA' },
          { value: 'study', label: '⏰ Study Hours' },
        ].map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              tab === t.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Podium */}
      {!managing && podiumOrder.length >= 2 && (
        <div className="card p-5 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide text-center mb-4">Top Performers</p>
          <div className="flex items-end justify-center gap-3">
            {podiumOrder.map((m, idx) => {
              const cfg = PODIUM[idx];
              if (!m) return null;
              return (
                <div key={m.id} className="flex flex-col items-center gap-2 flex-1">
                  <div className={`w-12 h-12 rounded-2xl ${avatarCls(m.firstName)} flex items-center justify-center text-sm font-extrabold shadow-sm`}>
                    {initials(m.firstName, m.lastName)}
                  </div>
                  <p className="text-xs font-bold text-gray-900 text-center leading-tight max-w-20 truncate">
                    {m.firstName} {m.lastName[0]}.
                  </p>
                  <p className="text-xs text-gray-400 -mt-1">{topValue(m)}</p>
                  <div className={`w-full bg-gradient-to-t ${cfg.bg} rounded-t-xl ${cfg.height} flex items-start justify-center pt-2`}>
                    <span className="text-white font-extrabold text-sm">{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full ranked list */}
      {!managing && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">Full Rankings</p>
          </div>
          <div className="divide-y divide-gray-50">
            {sorted.map((m, i) => {
              const pct = maxValue > 0 ? (rowValue(m) / maxValue) * 100 : 0;
              const isTop3 = i < 3;
              return (
                <div key={m.id} className={`flex items-center gap-3 px-4 py-3.5 ${isTop3 ? 'bg-gold/3' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                    i === 0 ? 'bg-yellow-400 text-white' :
                    i === 1 ? 'bg-gray-300 text-white' :
                    i === 2 ? 'bg-orange-400 text-white' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {i < 3 ? <Trophy size={12} /> : i + 1}
                  </div>
                  <div className={`w-9 h-9 rounded-full ${avatarCls(m.firstName)} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                    {initials(m.firstName, m.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.firstName} {m.lastName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-navy/40'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-gray-900">{topValue(m)}</p>
                    {m.onProbation && <span className="text-xs text-red-500">Probation</span>}
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="py-12 text-center">
                <Trophy size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No members to rank yet</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
