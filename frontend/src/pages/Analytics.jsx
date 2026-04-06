import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Star, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import client from '../api/client';

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bgPrimary:   '#070B14',
  cardBg:      '#0D1424',
  elevatedBg:  '#131D2E',
  accentBlue:  '#4F8EF7',
  gold:        '#F0B429',
  success:     '#34D399',
  warning:     '#FBBF24',
  danger:      '#F87171',
  textPrimary: '#F8FAFC',
  textSecond:  '#94A3B8',
  textMuted:   '#475569',
  border:      'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.13)',
  cardRadius:  12,
  shadow:      '0 4px 24px rgba(0,0,0,0.4)',
  transition:  '150ms ease',
};

const card = {
  background:   T.cardBg,
  border:       `1px solid ${T.border}`,
  borderRadius: T.cardRadius,
  boxShadow:    T.shadow,
};

const featuredCard = {
  ...card,
  borderTop: `2px solid ${T.accentBlue}`,
  boxShadow: `${T.shadow}, inset 0 2px 0 0 ${T.accentBlue}`,
};

// ── Section label ──────────────────────────────────────────────
const SectionLabel = ({ children }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
    {children}
  </p>
);

// ── Stat card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...card,
        padding: '20px 20px 18px',
        flex: 1,
        minWidth: 0,
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        transition: `border-color ${T.transition}, transform ${T.transition}`,
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Tint glow */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 90, height: 90,
        background: `radial-gradient(circle at bottom right, ${color}1e 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 9,
        background: `${color}1A`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon size={16} color={color} strokeWidth={2} />
      </div>
      <p style={{ fontSize: 30, fontWeight: 800, color: T.textPrimary, margin: '0 0 4px', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: 11, color: T.textSecond, margin: '5px 0 0' }}>{sub}</p>
      )}
    </div>
  );
}

// ── Funnel step ────────────────────────────────────────────────
const FUNNEL_COLORS = [
  T.textSecond,
  T.accentBlue,
  '#A78BFA',
  T.gold,
  T.success,
];

const STAGE_LABEL = { invited: 'Invited', met: 'Met', liked: 'Liked', bid: 'Bid', pledged: 'Pledged' };

function FunnelViz({ stageCounts, totalPnms }) {
  if (totalPnms === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <Star size={28} color={T.textMuted} style={{ margin: '0 auto 10px' }} />
        <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>No PNMs added yet</p>
      </div>
    );
  }

  const maxCount = Math.max(...stageCounts.map(s => s.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {stageCounts.map(({ stage, count }, i) => {
        const pctOfMax = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const pctOfTotal = totalPnms > 0 ? Math.round((count / totalPnms) * 100) : 0;
        const color = FUNNEL_COLORS[i];
        const prevCount = i > 0 ? stageCounts[i - 1].count : null;
        const dropPct = prevCount != null && prevCount > 0 ? Math.round(((prevCount - count) / prevCount) * 100) : null;

        return (
          <React.Fragment key={stage}>
            {/* Drop indicator between steps */}
            {dropPct !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 4px' }}>
                <div style={{ flex: 1, height: 1, background: T.border }} />
                <span style={{ fontSize: 10, color: dropPct > 30 ? T.danger : T.textMuted, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  -{dropPct}% drop
                </span>
                <div style={{ flex: 1, height: 1, background: T.border }} />
              </div>
            )}

            {/* Funnel bar */}
            <div style={{ position: 'relative' }}>
              {/* Background bar */}
              <div style={{
                height: 44, borderRadius: 8,
                background: T.elevatedBg,
                border: `1px solid ${T.border}`,
                overflow: 'hidden',
                position: 'relative',
              }}>
                {/* Fill */}
                <div style={{
                  position: 'absolute', inset: '0 auto 0 0',
                  width: `${pctOfMax}%`,
                  background: `linear-gradient(90deg, ${color}2e 0%, ${color}18 100%)`,
                  borderRight: `2px solid ${color}55`,
                  transition: `width 700ms cubic-bezier(0.34,1.56,0.64,1)`,
                }} />
                {/* Label row */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center',
                  padding: '0 14px',
                  justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{STAGE_LABEL[stage]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{count}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>{pctOfTotal}%</span>
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Conversion footer */}
      <div style={{
        marginTop: 8, padding: '12px 14px',
        background: T.elevatedBg,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 12, color: T.textSecond }}>Bid → Pledged conversion</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.success }}>
          {stageCounts[3].count > 0 ? Math.round((stageCounts[4].count / stageCounts[3].count) * 100) : 0}%
        </span>
      </div>
    </div>
  );
}

// ── Horizontal bar chart ───────────────────────────────────────
const ROLE_COLORS = {
  Admins:  T.gold,
  Officers: T.accentBlue,
  Members: '#818CF8',
  Alumni:  '#A78BFA',
};

function HorizBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
          <span style={{ fontSize: 11, color: T.textMuted, minWidth: 32, textAlign: 'right' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: 6, background: T.elevatedBg, borderRadius: 4, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
          width: `${pct}%`,
          transition: 'width 700ms cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 8px ${color}55`,
        }} />
      </div>
    </div>
  );
}

// ── Academic row ───────────────────────────────────────────────
function AcademicRow({ icon: Icon, label, value, highlight, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${T.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: highlight ? `${T.danger}18` : T.elevatedBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={14} color={highlight ? T.danger : T.textSecond} strokeWidth={2} />
        </div>
        <span style={{ fontSize: 13, color: T.textPrimary }}>{label}</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color: highlight ? T.danger : T.textPrimary }}>
        {value}
      </span>
    </div>
  );
}

// ── Event type colors ──────────────────────────────────────────
const EVENT_TYPE_COLORS = {
  mixer:        T.accentBlue,
  formal:       T.gold,
  philanthropy: T.success,
  meeting:      '#818CF8',
  rush:         '#A78BFA',
  other:        T.textMuted,
};

// ── Main component ─────────────────────────────────────────────
export default function Analytics() {
  const [data, setData]       = useState(null);
  const [members, setMembers] = useState([]);
  const [pnms, setPnms]       = useState([]);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
      client.get('/members').catch(() => ({ data: { data: [] } })),
      client.get('/pnms').catch(() => ({ data: { data: [] } })),
      client.get('/events').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, membersRes, pnmsRes, eventsRes]) => {
      setData(statsRes.data.data || {});
      setMembers(membersRes.data.data || []);
      setPnms(pnmsRes.data.data || []);
      setEvents(eventsRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: T.bgPrimary, minHeight: '100vh', padding: '32px 20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ ...card, padding: 20, height: 100 }}>
            <div style={{ height: '100%', background: T.elevatedBg, borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {[1,2].map(i => (
          <div key={i} style={{ ...card, padding: 24, height: 200 }}>
            <div style={{ height: '100%', background: T.elevatedBg, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );

  // ── Derived data (identical to original) ──────────────────────
  const stages = ['invited','met','liked','bid','pledged'];
  const stageCounts = stages.map(s => ({ stage: s, count: pnms.filter(p => p.stage === s).length }));
  const totalPnms = pnms.length;

  const roleBreakdown = [
    { label: 'Admins',   value: members.filter(m => m.role === 'admin').length },
    { label: 'Officers', value: members.filter(m => m.role === 'officer').length },
    { label: 'Members',  value: members.filter(m => m.role === 'member').length },
    { label: 'Alumni',   value: members.filter(m => m.role === 'alumni').length },
  ];
  const totalMembers = members.length;

  const withGpa = members.filter(m => m.gpa);
  const avgGpa = withGpa.length > 0 ? (withGpa.reduce((s, m) => s + m.gpa, 0) / withGpa.length).toFixed(2) : null;
  const onProbation = members.filter(m => m.onProbation).length;
  const totalStudyHours = members.reduce((s, m) => s + (m.studyHours || 0), 0);

  const now = new Date();
  const upcoming = events.filter(e => new Date(e.date) >= now).length;
  const past     = events.filter(e => new Date(e.date) < now).length;

  const eventTypes = ['mixer','formal','philanthropy','meeting','rush','other'];
  const eventTypeRows = eventTypes.map(type => ({ type, count: events.filter(e => e.type === type).length })).filter(r => r.count > 0);

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      background: T.bgPrimary,
      minHeight: '100vh',
      padding: '28px 20px 60px',
      maxWidth: 1100,
      margin: '0 auto',
    }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary, margin: '0 0 4px', letterSpacing: '-0.03em' }}>
          Chapter Analytics
        </h1>
        <p style={{ fontSize: 14, color: T.textSecond, margin: 0 }}>At-a-glance stats on your chapter's health</p>
      </div>

      {/* ── TOP STAT CARDS ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatCard
          icon={Users} label="Total Members"
          value={totalMembers}
          sub={`${members.filter(m => m.role !== 'alumni').length} active`}
          color={T.accentBlue}
        />
        <StatCard
          icon={DollarSign} label="Dues Collected"
          value={`$${((data?.duesCollected || 0) / 100).toLocaleString()}`}
          sub={`${data?.duesRate || 0}% collection rate`}
          color={T.success}
        />
        <StatCard
          icon={Star} label="Active PNMs"
          value={data?.activePNMs || pnms.filter(p => !['pledged','dropped'].includes(p.stage)).length}
          sub={`${pnms.filter(p => p.stage === 'pledged').length} pledged`}
          color="#A78BFA"
        />
        <StatCard
          icon={Calendar} label="Upcoming Events"
          value={upcoming}
          sub={`${past} past events`}
          color={T.gold}
        />
      </div>

      {/* ── FUNNEL + BREAKDOWN row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* Recruitment Funnel — featured card */}
        <div style={{ ...featuredCard, padding: '22px 22px 20px' }}>
          <SectionLabel>Recruitment Funnel</SectionLabel>
          <FunnelViz stageCounts={stageCounts} totalPnms={totalPnms} />
        </div>

        {/* Member Breakdown */}
        <div style={{ ...card, padding: '22px 22px 20px' }}>
          <SectionLabel>Member Breakdown</SectionLabel>
          {totalMembers === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <Users size={28} color={T.textMuted} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>No members yet</p>
            </div>
          ) : (
            <div>
              {roleBreakdown.map(({ label, value }) => (
                <HorizBar key={label} label={label} value={value} max={totalMembers} color={ROLE_COLORS[label]} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ACADEMIC + EVENTS row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

        {/* Academic Standing */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 4px' }}>
            <SectionLabel>Academic Standing</SectionLabel>
          </div>
          <AcademicRow icon={TrendingUp} label="Chapter GPA" value={avgGpa || '—'} highlight={false} />
          <AcademicRow icon={CheckCircle2} label="Total Study Hours Logged" value={`${totalStudyHours}h`} highlight={false} />
          <AcademicRow icon={AlertTriangle} label="On Academic Probation" value={onProbation} highlight={onProbation > 0} last />
        </div>

        {/* Events Overview */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 4px' }}>
            <SectionLabel>Events Overview</SectionLabel>
          </div>
          {eventTypeRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px 24px' }}>
              <Calendar size={24} color={T.textMuted} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>No events yet</p>
            </div>
          ) : (
            eventTypeRows.map(({ type, count }, i) => {
              const color = EVENT_TYPE_COLORS[type] || T.textMuted;
              return (
                <div key={type} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '13px 20px',
                  borderBottom: i < eventTypeRows.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: T.textPrimary, textTransform: 'capitalize' }}>{type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{count}</span>
                    <span style={{ fontSize: 11, color: T.textMuted }}>event{count !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
