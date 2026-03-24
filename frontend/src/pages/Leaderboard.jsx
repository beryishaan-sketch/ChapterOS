import React, { useState, useEffect } from 'react';
import { Trophy, Star, BookOpen, Zap, Users } from 'lucide-react';
import client from '../api/client';

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

export default function Leaderboard() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('points');

  useEffect(() => {
    client.get('/members').then(res => {
      if (res.data.success) setMembers(res.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const active = members.filter(m => m.role !== 'alumni');

  const sorted = [...active].sort((a, b) => {
    if (tab === 'points') return (b.points || 0) - (a.points || 0);
    if (tab === 'gpa') return (b.gpa || 0) - (a.gpa || 0);
    return (b.studyHours || 0) - (a.studyHours || 0);
  });

  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
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
  const avgGpa = active.filter(m => m.gpa).reduce((s, m, _, a) => s + m.gpa / a.length, 0);

  if (loading) return (
    <div className="max-w-lg mx-auto space-y-3">
      {Array(6).fill(0).map((_, i) => <div key={i} className="card h-16 skeleton" />)}
    </div>
  );

  // Reorder for podium: 2nd | 1st | 3rd
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length >= 2
    ? [top3[1], top3[0]]
    : top3;

  return (
    <div className="max-w-lg mx-auto">
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
      {podiumOrder.length >= 2 && (
        <div className="card p-5 mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide text-center mb-4">Top Performers</p>
          <div className="flex items-end justify-center gap-3">
            {podiumOrder.map((m, idx) => {
              const cfg = PODIUM[idx];
              if (!m) return null;
              return (
                <div key={m.id} className="flex flex-col items-center gap-2 flex-1">
                  {/* Avatar */}
                  <div className={`w-12 h-12 rounded-2xl ${avatarCls(m.firstName)} flex items-center justify-center text-sm font-extrabold shadow-sm`}>
                    {initials(m.firstName, m.lastName)}
                  </div>
                  <p className="text-xs font-bold text-gray-900 text-center leading-tight max-w-20 truncate">
                    {m.firstName} {m.lastName[0]}.
                  </p>
                  <p className="text-xs text-gray-400 -mt-1">{topValue(m)}</p>
                  {/* Podium block */}
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
                {/* Rank */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                  i === 0 ? 'bg-yellow-400 text-white' :
                  i === 1 ? 'bg-gray-300 text-white' :
                  i === 2 ? 'bg-orange-400 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {i < 3 ? <Trophy size={12} /> : i + 1}
                </div>

                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full ${avatarCls(m.firstName)} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                  {initials(m.firstName, m.lastName)}
                </div>

                {/* Name + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{m.firstName} {m.lastName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-navy/40'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                {/* Value */}
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
    </div>
  );
}
