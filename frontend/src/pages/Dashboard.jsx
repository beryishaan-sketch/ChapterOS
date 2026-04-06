import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, CalendarDays, TrendingUp,
  ChevronRight, UserPlus, BarChart2, Star,
  Zap, Clock, ArrowRight, MessageSquare
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
import { getIsNative } from '../hooks/useNative';

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
  btnRadius:   8,
  shadow:      '0 4px 24px rgba(0,0,0,0.4)',
  transition:  '150ms ease',
};

const card = {
  background:   T.cardBg,
  border:       `1px solid ${T.border}`,
  borderRadius: T.cardRadius,
  boxShadow:    T.shadow,
};

// ── Helpers ────────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const ACTIVITY_CFG = {
  dues_paid:     { bg: T.success,  icon: DollarSign },
  member_joined: { bg: T.accentBlue, icon: UserPlus },
  event_created: { bg: '#A78BFA',  icon: CalendarDays },
  default:       { bg: T.textMuted, icon: Zap },
};

const EVENT_COLORS = {
  mixer:        T.accentBlue,
  formal:       T.gold,
  meeting:      '#818CF8',
  philanthropy: T.success,
  social:       '#A78BFA',
  other:        T.textMuted,
};

const QUICK = [
  { to: '/members',    icon: UserPlus,    label: 'Add Member', color: T.accentBlue },
  { to: '/events',     icon: CalendarDays, label: 'New Event', color: '#A78BFA' },
  { to: '/recruitment', icon: Star,        label: 'Rush',      color: T.gold },
  { to: '/analytics',  icon: BarChart2,   label: 'Analytics', color: T.success },
];

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ label, value, color, icon: Icon, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...card,
        padding: 20,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        transition: `border-color ${T.transition}, transform ${T.transition}`,
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Subtle tint gradient */}
      <div style={{
        position: 'absolute', bottom: 0, right: 0,
        width: 80, height: 80,
        background: `radial-gradient(circle at bottom right, ${color}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Icon badge */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        width: 32, height: 32, borderRadius: 8,
        background: `${color}1A`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={15} color={color} strokeWidth={2} />
      </div>

      <p style={{ fontSize: 28, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px', lineHeight: 1 }}>
        {value ?? '—'}
      </p>
      <p style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label}
      </p>
    </div>
  );
}

// ── Section label ──────────────────────────────────────────────
const SectionLabel = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </p>
    {action}
  </div>
);

// ── Native design tokens ───────────────────────────────────────
const N = {
  bg: '#000000',
  card: '#1C1C1E',
  elevated: '#2C2C2E',
  sep: 'rgba(255,255,255,0.08)',
  accent: '#0A84FF',
  success: '#30D158',
  warning: '#FF9F0A',
  danger: '#FF453A',
  text1: '#FFFFFF',
  text2: 'rgba(235,235,245,0.6)',
  text3: 'rgba(235,235,245,0.3)',
  font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
};

// ── Main Component ─────────────────────────────────────────────
export default function Dashboard() {
  const { user, org } = useAuth();
  const { impact } = useHaptic();
  const navigate = useNavigate();
  const isNative = getIsNative();
  const [stats, setStats]       = useState(null);
  const [events, setEvents]     = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats').catch(() => null),
      client.get('/events?upcoming=true&limit=4').catch(() => null),
      client.get('/dashboard/activity?limit=8').catch(() => null),
    ]).then(([s, e, a]) => {
      if (s?.data?.success) setStats(s.data.data);
      if (e?.data?.success) setEvents(e.data.data || []);
      if (a?.data?.success) setActivity(a.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const healthScore = stats ? Math.min(100, Math.round(
    (stats.duesRate || 0) * 0.35 +
    (Math.min(stats.totalMembers || 0, 80) / 80) * 100 * 0.25 +
    (Math.min(stats.upcomingEvents || 0, 5) / 5) * 100 * 0.25 +
    (Math.min(stats.activePNMs || 0, 20) / 20) * 100 * 0.15
  )) : 0;

  const healthColor = healthScore >= 75 ? T.success : healthScore >= 50 ? T.warning : T.danger;
  const circumference = 2 * Math.PI * 34; // r=34

  // ── NATIVE BRANCH ────────────────────────────────────────────
  if (isNative) {
    const NN = {
      bg: '#080C14',
      card: '#111827',
      elevated: '#1E2A3A',
      border: 'rgba(255,255,255,0.08)',
      accent: '#3B82F6',
      gold: '#F59E0B',
      success: '#10B981',
      danger: '#EF4444',
      purple: '#8B5CF6',
      text1: '#FFFFFF',
      text2: 'rgba(255,255,255,0.55)',
      text3: 'rgba(255,255,255,0.28)',
      sep: 'rgba(255,255,255,0.06)',
      font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
    };

    const getTimeOfDay = () => {
      const h = new Date().getHours();
      return h < 12 ? 'Good morning,' : h < 17 ? 'Good afternoon,' : 'Good evening,';
    };

    const upcomingEvents = events.slice(0, 4);
    const recentActivity = activity.slice(0, 2);

    return (
      <div style={{ background: NN.bg, minHeight: '100vh', fontFamily: NN.font, paddingBottom: 20 }}>

        {/* Greeting header */}
        <div style={{ padding: '24px 20px 8px' }}>
          <p style={{ fontSize: 15, color: NN.text2, margin: '0 0 4px', fontWeight: 500 }}>{getTimeOfDay()}</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: NN.text1, margin: 0, letterSpacing: -0.5 }}>
            {user?.firstName || 'Welcome'} <span style={{ background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>👋</span>
          </h1>
        </div>

        {/* 2×2 stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 20px 0' }}>
          {[
            { label: 'Members',  value: stats?.totalMembers ?? '—',                      color: NN.accent,  icon: '👥' },
            { label: 'Events',   value: stats?.eventsThisMonth ?? '—',                   color: NN.purple,  icon: '📅' },
            { label: 'PNMs',     value: stats?.activePNMs ?? '—',                        color: NN.gold,    icon: '⭐' },
            { label: 'Dues Rate', value: stats?.duesRate ? stats.duesRate + '%' : '—',   color: NN.success, icon: '💚' },
          ].map(s => (
            <div key={s.label} style={{ background: NN.card, borderRadius: 16, border: '1px solid ' + NN.border, padding: '18px 16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 12 }}>{s.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: NN.text1, letterSpacing: -0.5, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: NN.text2, marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming Events */}
        <div style={{ padding: '28px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: NN.text3, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Upcoming</span>
            <span style={{ fontSize: 13, color: NN.accent }}>See all →</span>
          </div>
          <div style={{ background: NN.card, borderRadius: 16, border: '1px solid ' + NN.border, overflow: 'hidden' }}>
            {upcomingEvents.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: NN.text3, fontSize: 14 }}>No upcoming events</div>
            ) : upcomingEvents.map((ev, i, arr) => {
              const typeColors = { Mixer: NN.accent, Social: NN.purple, Meeting: NN.success, Formal: NN.gold, Other: '#64748B' };
              const color = typeColors[ev.type] || NN.accent;
              return (
                <div key={ev.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: i < arr.length - 1 ? '1px solid ' + NN.sep : 'none' }}>
                  <div style={{ width: 4, height: 44, borderRadius: 2, background: color, marginRight: 14, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: NN.text1 }}>{ev.title || ev.name}</div>
                    <div style={{ fontSize: 13, color: NN.text2, marginTop: 2 }}>{new Date(ev.startDate || ev.date).toLocaleDateString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: color, background: color + '20', padding: '3px 10px', borderRadius: 99 }}>{ev.type || 'Event'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Announcements */}
        <div style={{ padding: '24px 20px 0' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: NN.text3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 14 }}>Announcements</span>
          {recentActivity.length === 0 ? (
            <div style={{ background: NN.card, borderRadius: 16, border: '1px solid ' + NN.border, padding: '24px', textAlign: 'center', color: NN.text3, fontSize: 14 }}>No recent announcements</div>
          ) : recentActivity.map((item, i) => (
            <div key={i} style={{ background: NN.card, borderRadius: 16, border: '1px solid ' + NN.border, padding: '16px', marginBottom: 10 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: NN.text1, marginBottom: 4 }}>{item.title || item.action || item.message}</div>
              <div style={{ fontSize: 13, color: NN.text2 }}>{item.description || item.detail || timeAgo(item.createdAt)}</div>
            </div>
          ))}
        </div>

      </div>
    );
  }
  // ── END NATIVE BRANCH ────────────────────────────────────────

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: T.bgPrimary, minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D1424 0%, #111827 50%, #0a1628 100%)',
        padding: '32px 24px 28px',
        paddingTop: 'max(32px, calc(env(safe-area-inset-top) + 24px))',
        position: 'relative',
        overflow: 'hidden',
        borderBottom: `1px solid ${T.border}`,
      }}>
        {/* SVG noise texture overlay */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feBlend in="SourceGraphic" mode="overlay" />
            </filter>
          </defs>
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          filter: 'url(#noise)',
          opacity: 0.03,
          pointerEvents: 'none',
          background: '#fff',
        }} />

        {/* Soft glow orbs */}
        <div style={{ position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${T.accentBlue}14 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${T.gold}0d 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          {/* Left: greeting */}
          <div style={{ flex: 1 }}>
            <p style={{ color: T.textMuted, fontSize: 13, fontWeight: 500, margin: '0 0 4px', letterSpacing: '0.01em' }}>
              {greeting()},
            </p>
            <h1 style={{ color: T.textPrimary, fontSize: 28, fontWeight: 800, margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {user?.firstName} {user?.lastName}
            </h1>
            <p style={{ color: T.textSecond, fontSize: 13, margin: 0 }}>{org?.name}</p>
          </div>

          {/* Right: Health ring */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              {/* Track */}
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
              {/* Progress */}
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={healthColor} strokeWidth="6"
                strokeDasharray={`${(healthScore / 100) * circumference} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
                style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 6px ${healthColor}66)` }}
              />
              <text x="40" y="44" textAnchor="middle" fill={T.textPrimary} fontSize="14" fontWeight="700" fontFamily="-apple-system, sans-serif">
                {healthScore}
              </text>
            </svg>
            <p style={{ fontSize: 10, fontWeight: 600, color: healthColor, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Health
            </p>
          </div>
        </div>

        {/* Mini health pills */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Dues', value: `${stats?.duesRate ?? '—'}%`, color: T.success },
            { label: 'Events', value: stats?.upcomingEvents ?? '—', color: T.accentBlue },
            { label: 'Members', value: stats?.totalMembers ?? '—', color: T.gold },
            { label: 'PNMs', value: stats?.activePNMs ?? '—', color: '#A78BFA' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: `${color}12`,
              border: `1px solid ${color}33`,
              borderRadius: 999,
              padding: '5px 12px',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: '24px 20px 48px' }}>

        {/* ── STAT CARDS ── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Overview</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <StatCard label="Members" value={loading ? '—' : stats?.totalMembers} color={T.accentBlue} icon={Users} onClick={() => { impact?.('light'); navigate('/members'); }} />
            <StatCard label="Dues Rate" value={loading ? '—' : `${stats?.duesRate ?? 0}%`} color={T.success} icon={DollarSign} onClick={() => { impact?.('light'); navigate('/dues'); }} />
            <StatCard label="Upcoming Events" value={loading ? '—' : stats?.upcomingEvents} color="#A78BFA" icon={CalendarDays} onClick={() => { impact?.('light'); navigate('/events'); }} />
            <StatCard label="Active PNMs" value={loading ? '—' : stats?.activePNMs} color={T.warning} icon={TrendingUp} onClick={() => { impact?.('light'); navigate('/recruitment'); }} />
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Quick Actions</SectionLabel>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {QUICK.map(({ to, icon: Icon, label, color }) => (
              <QuickPill key={to} to={to} icon={Icon} label={label} color={color} onClick={() => impact?.('light')} />
            ))}
          </div>
        </div>

        {/* ── UPCOMING EVENTS ── */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel
            action={
              <Link to="/events" style={{ color: T.accentBlue, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                See all <ChevronRight size={13} />
              </Link>
            }
          >
            Upcoming Events
          </SectionLabel>

          {events.length === 0 ? (
            <div style={{ ...card, padding: 32, textAlign: 'center' }}>
              <CalendarDays size={28} color={T.textMuted} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: T.textMuted, margin: '0 0 10px' }}>No upcoming events</p>
              <Link to="/events" style={{ fontSize: 13, color: T.accentBlue, fontWeight: 600, textDecoration: 'none' }}>
                Create one <ArrowRight size={12} style={{ verticalAlign: 'middle' }} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map((e) => (
                <EventRow key={e.id} event={e} onClick={() => { impact?.('light'); navigate('/events'); }} />
              ))}
            </div>
          )}
        </div>

        {/* ── ACTIVITY FEED ── */}
        <div style={{ marginBottom: 8 }}>
          <SectionLabel>Recent Activity</SectionLabel>
          {activity.length === 0 ? (
            <div style={{ ...card, padding: 32, textAlign: 'center' }}>
              <Clock size={28} color={T.textMuted} style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>No activity yet</p>
            </div>
          ) : (
            <div style={{ ...card, overflow: 'hidden' }}>
              {activity.map((item, i) => {
                const cfg = ACTIVITY_CFG[item.type] || ACTIVITY_CFG.default;
                const Icon = cfg.icon;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 16px',
                    borderBottom: i < activity.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `${cfg.bg}20`,
                      border: `1px solid ${cfg.bg}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={15} color={cfg.bg} strokeWidth={2} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: T.textPrimary, margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.message}
                      </p>
                    </div>
                    <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function QuickPill({ to, icon: Icon, label, color, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <Link
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '9px 16px',
        background: hovered ? `${T.accentBlue}12` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? T.accentBlue : 'rgba(255,255,255,0.10)'}`,
        borderRadius: 999,
        textDecoration: 'none',
        transition: `all ${T.transition}`,
        cursor: 'pointer',
      }}
    >
      <Icon size={14} color={hovered ? T.accentBlue : color} strokeWidth={2} style={{ transition: `color ${T.transition}` }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: hovered ? T.textPrimary : T.textSecond, transition: `color ${T.transition}` }}>
        {label}
      </span>
    </Link>
  );
}

function EventRow({ event: e, onClick }) {
  const [hovered, setHovered] = React.useState(false);
  const color = EVENT_COLORS[e.type] || EVENT_COLORS.other;
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...card,
        padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
        borderLeft: `3px solid ${color}`,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        borderLeftColor: color,
        transition: `all ${T.transition}`,
        transform: hovered ? 'translateX(2px)' : 'none',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.title}
        </p>
        <p style={{ fontSize: 12, color: T.textSecond, margin: 0 }}>{fmtDate(e.date)}</p>
      </div>
      <span style={{
        fontSize: 11, fontWeight: 600, color,
        background: `${color}18`,
        border: `1px solid ${color}33`,
        padding: '3px 9px', borderRadius: 6,
        textTransform: 'capitalize', flexShrink: 0,
      }}>
        {e.type}
      </span>
    </div>
  );
}
