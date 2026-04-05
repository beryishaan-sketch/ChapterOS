import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, CalendarDays, TrendingUp,
  ChevronRight, UserPlus, BarChart2, Star, Bell,
  Zap, Clock, ArrowRight
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
import { IOSStatCard } from '../components/IOSList';
import OnboardingChecklist from '../components/OnboardingChecklist';

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

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

const ACTIVITY_ICONS = {
  dues_paid: { bg: '#34C759', icon: DollarSign },
  member_joined: { bg: '#007AFF', icon: UserPlus },
  event_created: { bg: '#AF52DE', icon: CalendarDays },
  default: { bg: '#8E8E93', icon: Zap },
};

const EVENT_COLORS = {
  mixer: '#007AFF', formal: '#C9A84C', meeting: '#0F1C3F',
  philanthropy: '#34C759', social: '#AF52DE', other: '#8E8E93',
};

const QUICK = [
  { to: '/members', icon: UserPlus, label: 'Add Member', color: '#007AFF' },
  { to: '/events', icon: CalendarDays, label: 'New Event', color: '#AF52DE' },
  { to: '/recruitment', icon: Star, label: 'Rush', color: '#C9A84C' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics', color: '#30B0C7' },
];

export default function Dashboard() {
  const { user, org } = useAuth();
  const { impact } = useHaptic();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const healthColor = healthScore >= 75 ? '#34C759' : healthScore >= 50 ? '#FF9500' : '#FF3B30';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>

      {/* ── HERO HEADER ── */}
      <div style={{
        background: 'linear-gradient(160deg, #0F1C3F 0%, #1a2f6b 100%)',
        padding: '56px 20px 28px',
        paddingTop: 'max(56px, calc(env(safe-area-inset-top) + 40px))',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 180, height: 180, borderRadius: '50%',
          background: 'rgba(201,168,76,0.12)',
        }} />
        <div style={{
          position: 'absolute', top: 20, right: 20,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(201,168,76,0.08)',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, margin: '0 0 4px', fontWeight: 500 }}>
              {org?.name}
            </p>
            <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {greeting()},{'\n'}
              <span style={{ color: '#C9A84C' }}>{user?.firstName}</span>
            </h1>
          </div>
          <button
            onClick={() => { impact('light'); navigate('/profile'); }}
            style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(201,168,76,0.2)',
              border: '2px solid rgba(201,168,76,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#C9A84C', fontWeight: 700, fontSize: 15,
              WebkitTapHighlightColor: 'transparent', cursor: 'pointer',
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </button>
        </div>

        {/* Health ring */}
        <div style={{
          marginTop: 20,
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="5" />
            <circle
              cx="26" cy="26" r="22" fill="none"
              stroke={healthColor} strokeWidth="5"
              strokeDasharray={`${(healthScore / 100) * 138.2} 138.2`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
            <text x="26" y="30" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="-apple-system">{healthScore}</text>
          </svg>
          <div>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, margin: 0 }}>Chapter Health</p>
            <p style={{ color: healthColor, fontSize: 12, fontWeight: 600, margin: '3px 0 0' }}>
              {healthScore >= 75 ? '✓ Excellent' : healthScore >= 50 ? 'Good' : 'Needs attention'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, margin: '2px 0 0' }}>Dues · Events · Members · Rush</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dues</p>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{stats?.duesRate ?? '—'}%</p>
            </div>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Events</p>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{stats?.upcomingEvents ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <OnboardingChecklist />

        {/* ── STATS GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <IOSStatCard
            label="Members"
            value={loading ? '—' : stats?.totalMembers}
            color="#0F1C3F"
            icon={<Users size={16} />}
            onClick={() => { impact('light'); navigate('/members'); }}
          />
          <IOSStatCard
            label="Dues Rate"
            value={loading ? '—' : `${stats?.duesRate ?? 0}%`}
            color="#34C759"
            icon={<DollarSign size={16} />}
            sub={stats?.duesRate >= 80 ? 'On track ↑' : null}
            onClick={() => { impact('light'); navigate('/dues'); }}
          />
          <IOSStatCard
            label="Upcoming Events"
            value={loading ? '—' : stats?.upcomingEvents}
            color="#AF52DE"
            icon={<CalendarDays size={16} />}
            onClick={() => { impact('light'); navigate('/events'); }}
          />
          <IOSStatCard
            label="Active PNMs"
            value={loading ? '—' : stats?.activePNMs}
            color="#FF9500"
            icon={<TrendingUp size={16} />}
            onClick={() => { impact('light'); navigate('/recruitment'); }}
          />
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#6C6C70', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>
            Quick Actions
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {QUICK.map(({ to, icon: Icon, label, color }) => (
              <Link
                key={to}
                to={to}
                onClick={() => impact('light')}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 6, padding: '12px 4px',
                  background: '#fff', borderRadius: 14,
                  boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)',
                  WebkitTapHighlightColor: 'transparent',
                  textDecoration: 'none',
                }}
                className="active:scale-95 transition-transform duration-100"
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={color} strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 11, color: '#3C3C43', fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── UPCOMING EVENTS ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: 0, letterSpacing: '-0.02em' }}>
              Upcoming
            </p>
            <Link to="/events" onClick={() => impact('light')} style={{ color: '#0F1C3F', fontSize: 14, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
              See all <ChevronRight size={14} />
            </Link>
          </div>
          {events.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }}>
              <CalendarDays size={28} color="#C7C7CC" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, color: '#8E8E93', margin: 0 }}>No upcoming events</p>
              <Link to="/events" style={{ fontSize: 13, color: '#0F1C3F', fontWeight: 600, textDecoration: 'none', marginTop: 6, display: 'block' }}>Create one →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {events.map((e, i) => (
                <div key={e.id} onClick={() => { impact('light'); navigate('/events'); }}
                  style={{
                    background: '#fff', borderRadius: 14,
                    padding: '12px 14px',
                    display: 'flex', alignItems: 'center', gap: 12,
                    boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  className="active:scale-[0.98] transition-transform duration-75"
                >
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: (EVENT_COLORS[e.type] || EVENT_COLORS.other) + '18',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <CalendarDays size={20} color={EVENT_COLORS[e.type] || EVENT_COLORS.other} strokeWidth={1.8} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 600, color: '#000', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</p>
                    <p style={{ fontSize: 13, color: '#8E8E93', margin: '2px 0 0' }}>{fmtDate(e.date)}</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: EVENT_COLORS[e.type] || EVENT_COLORS.other,
                    background: (EVENT_COLORS[e.type] || EVENT_COLORS.other) + '18',
                    padding: '3px 8px', borderRadius: 20, textTransform: 'capitalize',
                  }}>{e.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── ACTIVITY FEED ── */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#000', margin: '0 0 10px', letterSpacing: '-0.02em' }}>
            Recent Activity
          </p>
          {activity.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, textAlign: 'center', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }}>
              <Clock size={28} color="#C7C7CC" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 14, color: '#8E8E93', margin: 0 }}>No activity yet</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.08)' }}>
              {activity.map((item, i) => {
                const cfg = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.default;
                const Icon = cfg.icon;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    borderBottom: i < activity.length - 1 ? '0.5px solid rgba(0,0,0,0.08)' : 'none',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: cfg.bg + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Icon size={16} color={cfg.bg} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, color: '#000', margin: 0, lineHeight: 1.3 }}>{item.message}</p>
                      <p style={{ fontSize: 12, color: '#8E8E93', margin: '2px 0 0' }}>{timeAgo(item.createdAt)}</p>
                    </div>
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
