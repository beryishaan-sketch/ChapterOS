import React, { useState, useEffect } from 'react';
import { Trophy, Star, BookOpen, Zap, Settings, Plus, Minus, Check, Crown } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        '#070B14',
  card:      '#0D1424',
  elevated:  '#131D2E',
  blue:      '#4F8EF7',
  gold:      '#F0B429',
  success:   '#34D399',
  warning:   '#FBBF24',
  danger:    '#F87171',
  textPrimary:   '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted:     '#475569',
  border:    'rgba(255,255,255,0.07)',
  radius:    12,
  btnRadius: 8,
  shadow:    '0 4px 24px rgba(0,0,0,0.4)',
  transition:'150ms ease',
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_BG = ['#4F8EF7','#a78bfa','#34D399','#F0B429','#F87171','#22d3ee','#fb923c'];
const getAvatarBg = (name = '') => AVATAR_BG[(name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % AVATAR_BG.length];
const initials = (f, l) => `${f?.[0] || ''}${l?.[0] || ''}`.toUpperCase();

// ─── Podium medal config (display order: 2nd | 1st | 3rd) ────────────────────
const MEDAL = {
  1: { color: T.gold,         glow: 'rgba(240,180,41,0.4)',         bg: 'rgba(240,180,41,0.08)',   border: 'rgba(240,180,41,0.35)',   label: '1st', silver: false },
  2: { color: 'rgb(192,192,192)', glow: 'rgba(192,192,192,0.25)',   bg: 'rgba(192,192,192,0.06)',  border: 'rgba(192,192,192,0.25)',  label: '2nd', silver: true  },
  3: { color: 'rgb(205,133,63)',  glow: 'rgba(205,133,63,0.25)',    bg: 'rgba(205,133,63,0.06)',   border: 'rgba(205,133,63,0.25)',   label: '3rd', silver: false },
};

// ─── Points Row (manage panel) ────────────────────────────────────────────────
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

  const bg = getAvatarBg(m.firstName + m.lastName);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
        {initials(m.firstName, m.lastName)}
      </div>
      <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {m.firstName} {m.lastName}
      </p>
      <span style={{ fontSize: 12, fontWeight: 700, color: T.gold, minWidth: 52, textAlign: 'right' }}>{pts} pts</span>
      <button onClick={() => adjust(-1)} disabled={saving}
        style={{ width: 28, height: 28, background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving ? 'not-allowed' : 'pointer', color: T.danger, opacity: saving ? 0.4 : 1 }}>
        <Minus size={11} />
      </button>
      <input type="number" min="1" placeholder="10" value={input} onChange={e => setInput(e.target.value)}
        style={{ width: 52, textAlign: 'center', background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 6px', fontSize: 12, color: T.textPrimary, fontFamily: 'inherit', outline: 'none' }} />
      <button onClick={() => adjust(1)} disabled={saving}
        style={{ width: 28, height: 28, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving ? 'not-allowed' : 'pointer', color: T.success, opacity: saving ? 0.4 : 1 }}>
        <Plus size={11} />
      </button>
    </div>
  );
}

// ─── Podium Card ──────────────────────────────────────────────────────────────
function PodiumCard({ member, rank, topValue, isCenter }) {
  if (!member) return null;
  const medal = MEDAL[rank];
  const avatarSize = isCenter ? 56 : 44;
  const bg = getAvatarBg(member.firstName + member.lastName);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      flex: isCenter ? '0 0 auto' : '0 0 auto',
      width: isCenter ? 160 : 128,
      position: 'relative',
      zIndex: isCenter ? 2 : 1,
    }}>
      {/* Crown for 1st */}
      {isCenter && (
        <div style={{ marginBottom: 6 }}>
          <Crown size={22} style={{ color: T.gold, filter: 'drop-shadow(0 0 8px rgba(240,180,41,0.8))' }} />
        </div>
      )}

      {/* Avatar */}
      <div style={{
        width: avatarSize, height: avatarSize, borderRadius: '50%',
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: isCenter ? 20 : 15,
        border: `2px solid ${medal.border}`,
        boxShadow: `0 0 ${isCenter ? 32 : 16}px ${medal.glow}`,
        marginBottom: 10,
        flexShrink: 0,
      }}>
        {initials(member.firstName, member.lastName)}
      </div>

      {/* Name */}
      <p style={{ fontSize: isCenter ? 14 : 13, fontWeight: 700, color: T.textPrimary, margin: '0 0 2px', textAlign: 'center', maxWidth: isCenter ? 140 : 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {member.firstName} {member.lastName[0]}.
      </p>

      {/* Score */}
      <p style={{ fontSize: 12, color: medal.color, fontWeight: 600, margin: '0 0 12px' }}>
        {topValue(member)}
      </p>

      {/* Podium block */}
      <div style={{
        width: '100%',
        height: isCenter ? 80 : rank === 2 ? 56 : 44,
        background: medal.bg,
        border: `1px solid ${medal.border}`,
        borderRadius: '8px 8px 0 0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 2,
      }}>
        <span style={{ fontSize: isCenter ? 28 : 22, fontWeight: 900, color: medal.color, lineHeight: 1 }}>
          #{rank}
        </span>
      </div>
    </div>
  );
}

// ─── Main Leaderboard ─────────────────────────────────────────────────────────
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
  // Podium display order: 2nd (left) | 1st (center) | 3rd (right)
  const podiumOrder = top3.length >= 3
    ? [{ m: top3[1], rank: 2 }, { m: top3[0], rank: 1 }, { m: top3[2], rank: 3 }]
    : top3.length >= 2
    ? [{ m: top3[1], rank: 2 }, { m: top3[0], rank: 1 }]
    : top3.map((m, i) => ({ m, rank: i + 1 }));

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

  const rankColor = (i) => {
    if (i === 0) return T.gold;
    if (i === 1) return 'rgb(192,192,192)';
    if (i === 2) return 'rgb(205,133,63)';
    return T.textMuted;
  };
  const rankBarColor = (i) => {
    if (i === 0) return T.gold;
    if (i === 1) return 'rgb(192,192,192)';
    if (i === 2) return 'rgb(205,133,63)';
    return T.blue;
  };

  if (loading) return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', background: T.bg, minHeight: '100vh', padding: '32px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array(6).fill(0).map((_, i) => (
        <div key={i} style={{ height: 64, borderRadius: T.radius, background: T.card, border: `1px solid ${T.border}` }} />
      ))}
    </div>
  );

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', background: T.bg, minHeight: '100vh', padding: '32px 32px 64px', maxWidth: 800, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: '-0.03em' }}>Leaderboard</h1>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: '5px 0 0' }}>{active.length} active members ranked</p>
        </div>
        {isOfficer && (
          <button
            onClick={() => { setManaging(m => !m); setSearch(''); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', borderRadius: T.btnRadius,
              border: `1px solid ${managing ? T.blue : T.border}`,
              background: managing ? 'rgba(79,142,247,0.12)' : 'transparent',
              color: managing ? T.blue : T.textSecondary,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: T.transition,
            }}>
            {managing ? <><Check size={13} /> Done</> : <><Settings size={13} /> Manage Points</>}
          </button>
        )}
      </div>

      {/* ── Stats Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        {[
          { icon: Zap, color: T.gold,    glowColor: 'rgba(240,180,41,0.12)',  value: totalPoints.toLocaleString(), label: 'Total Points' },
          { icon: BookOpen, color: T.blue, glowColor: 'rgba(79,142,247,0.12)', value: avgGpa ? avgGpa.toFixed(2) : '—', label: 'Chapter Avg GPA' },
        ].map(({ icon: Icon, color, glowColor, value, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: glowColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.03em' }}>{value}</p>
              <p style={{ fontSize: 12, color: T.textMuted, margin: '2px 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Manage Points Panel ── */}
      {managing && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow, marginBottom: 24 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, background: 'rgba(79,142,247,0.04)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: '0 0 2px' }}>Edit Member Points</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Enter an amount and press + or − to adjust</p>
          </div>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
            <input
              placeholder="Search member…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: T.elevated, border: `1px solid ${T.border}`, borderRadius: T.btnRadius, padding: '8px 12px', color: T.textPrimary, fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
            />
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {filtered.map(m => <PointsRow key={m.id} m={m} onAdjust={handleAdjust} />)}
          </div>
        </div>
      )}

      {/* ── Tab Switcher ── */}
      <div style={{ display: 'flex', background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: 4, marginBottom: 24, gap: 4 }}>
        {[
          { value: 'points', label: 'Points',      emoji: '🏆' },
          { value: 'gpa',    label: 'GPA',          emoji: '📚' },
          { value: 'study',  label: 'Study Hours',  emoji: '⏰' },
        ].map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            style={{
              flex: 1, padding: '9px 8px', borderRadius: T.btnRadius - 2,
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              fontFamily: 'inherit', transition: T.transition,
              background: tab === t.value ? T.blue : 'transparent',
              color: tab === t.value ? '#fff' : T.textMuted,
              boxShadow: tab === t.value ? '0 0 14px rgba(79,142,247,0.25)' : 'none',
            }}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── Top 3 Podium ── */}
      {!managing && podiumOrder.length >= 2 && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow, padding: '28px 24px 0', marginBottom: 20, overflow: 'hidden' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 24px' }}>
            Top Performers
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
            {podiumOrder.map(({ m, rank }) => (
              <PodiumCard key={m.id} member={m} rank={rank} topValue={topValue} isCenter={rank === 1} />
            ))}
          </div>
        </div>
      )}

      {/* ── Full Rankings List ── */}
      {!managing && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Full Rankings</p>
          </div>

          {sorted.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <Trophy size={36} style={{ color: T.textMuted, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>No members to rank yet</p>
            </div>
          ) : (
            sorted.map((m, i) => {
              const pct = maxValue > 0 ? (rowValue(m) / maxValue) * 100 : 0;
              const bg = getAvatarBg(m.firstName + m.lastName);
              const isEven = i % 2 === 0;

              return (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  background: isEven ? T.card : '#0A0F1C',
                  borderBottom: i < sorted.length - 1 ? `1px solid ${T.border}` : 'none',
                  transition: T.transition,
                }}>
                  {/* Large rank number */}
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#1a2340', lineHeight: 1, width: 40, textAlign: 'right', flexShrink: 0, letterSpacing: '-0.04em' }}>
                    {i + 1}
                  </span>

                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0, border: i < 3 ? `2px solid ${rankColor(i)}40` : '2px solid transparent', boxShadow: i < 3 ? `0 0 8px ${rankColor(i)}30` : 'none' }}>
                    {initials(m.firstName, m.lastName)}
                  </div>

                  {/* Name + progress bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.firstName} {m.lastName}
                    </p>
                    {/* Thin animated progress bar */}
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: i < 3
                          ? `linear-gradient(90deg, ${rankBarColor(i)}, ${rankBarColor(i)}aa)`
                          : `linear-gradient(90deg, ${T.blue}60, ${T.blue}30)`,
                        borderRadius: 2,
                        transition: 'width 700ms cubic-bezier(0.4,0,0.2,1)',
                        boxShadow: i < 3 ? `0 0 6px ${rankBarColor(i)}60` : 'none',
                      }} />
                    </div>
                  </div>

                  {/* Score pill + probation */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: i < 3 ? rankColor(i) : T.textSecondary,
                      background: i < 3 ? `${rankColor(i)}14` : T.elevated,
                      padding: '4px 10px', borderRadius: 20,
                      border: `1px solid ${i < 3 ? rankColor(i) + '30' : T.border}`,
                      whiteSpace: 'nowrap',
                    }}>
                      {topValue(m)}
                    </span>
                    {m.onProbation && (
                      <span style={{ fontSize: 10, color: T.danger, fontWeight: 600 }}>Probation</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
