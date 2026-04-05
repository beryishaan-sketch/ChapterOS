import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, DollarSign, CalendarDays, TrendingUp, Zap,
  Plus, ChevronRight, ArrowRight, UserPlus, BarChart2,
  Star, CheckCircle2, Clock
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
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
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const fmtDate = (d) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
};

const EVENT_DOT = {
  mixer: 'bg-blue-400', formal: 'bg-gold', meeting: 'bg-navy/40',
  philanthropy: 'bg-emerald-400', social: 'bg-purple-400', other: 'bg-gray-300',
};

const ACTIVITY_CFG = {
  dues_paid:     { bg: 'bg-emerald-100', color: 'text-emerald-600', icon: DollarSign },
  member_joined: { bg: 'bg-blue-100',    color: 'text-blue-600',    icon: UserPlus },
  event_created: { bg: 'bg-purple-100',  color: 'text-purple-600',  icon: CalendarDays },
  default:       { bg: 'bg-gray-100',    color: 'text-gray-500',    icon: Zap },
};

function HealthRing({ score }) {
  const r = 28, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#C9A84C' : '#f87171';
  const label = score >= 75 ? 'Excellent' : score >= 50 ? 'Good' : 'Needs Work';

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex-shrink-0">
        <svg className="-rotate-90" viewBox="0 0 72 72" width="64" height="64">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-gray-900">{score}</span>
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">Chapter Health</p>
        <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">Dues · Events · Members · Rush</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, to, sub }) {
  return (
    <Link to={to} className="card p-4 flex items-start gap-3 active:scale-95 transition-all duration-150 hover:shadow-card-hover group">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon size={18} className="text-white" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xl font-black text-gray-900 leading-tight tabular-nums">{value ?? '—'}</p>
        <p className="text-xs text-gray-400 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-xs text-emerald-500 font-medium mt-0.5">{sub}</p>}
      </div>
      <ChevronRight size={14} className="text-gray-200 group-hover:text-gray-400 transition-colors mt-1 flex-shrink-0" />
    </Link>
  );
}

export default function Dashboard() {
  const { user, org } = useAuth();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats').catch(() => null),
      client.get('/events?upcoming=true&limit=4').catch(() => null),
      client.get('/dashboard/activity?limit=6').catch(() => null),
    ]).then(([s, e, a]) => {
      if (!s && !e && !a) { setLoadError(true); return; }
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

  if (loading) return (
    <div className="max-w-2xl mx-auto lg:max-w-none space-y-4">
      <div className="card h-24 skeleton" />
      <div className="grid grid-cols-2 gap-3">
        {Array(4).fill(0).map((_,i) => <div key={i} className="card h-20 skeleton" />)}
      </div>
      <div className="card h-48 skeleton" />
    </div>
  );

  if (loadError) return (
    <div className="max-w-2xl mx-auto lg:max-w-none">
      <div className="card p-12 text-center">
        <p className="text-gray-400 font-medium mb-2">Couldn't load dashboard</p>
        <p className="text-sm text-gray-300 mb-4">Check your connection and try again</p>
        <button onClick={() => window.location.reload()} className="btn-primary mx-auto">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto lg:max-w-none">
      <OnboardingChecklist />

      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-black text-gray-900 tracking-tight">
            {greeting()}, {user?.firstName}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">{org?.name}</p>
        </div>
        <Link to="/events" className="btn-primary btn-sm gap-1.5">
          <Plus size={14} /> Event
        </Link>
      </div>

      {/* ── HEALTH + QUICK STATS ── */}
      <div className="card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <HealthRing score={healthScore} />
          <Link to="/analytics" className="text-xs text-navy font-semibold flex items-center gap-1 hover:underline">
            Full analytics <ArrowRight size={11} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { pct: stats?.duesRate || 0, label: 'Dues collected', color: 'bg-emerald-500' },
            { pct: Math.min(100, ((stats?.upcomingEvents || 0) / 5) * 100), label: 'Events this month', color: 'bg-purple-500' },
          ].map(({ pct, label, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">{label}</span>
                <span className="font-bold text-gray-900">{Math.round(pct)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Total Members" value={stats?.totalMembers} icon={Users} color="bg-navy" to="/members" />
        <StatCard label="Dues Rate" value={stats?.duesRate != null ? `${stats.duesRate}%` : '—'} icon={DollarSign} color="bg-emerald-500" to="/dues" sub={stats?.duesRate >= 80 ? 'On track' : null} />
        <StatCard label="Upcoming Events" value={stats?.upcomingEvents} icon={CalendarDays} color="bg-purple-500" to="/events" />
        <StatCard label="Active PNMs" value={stats?.activePNMs} icon={TrendingUp} color="bg-orange-500" to="/recruitment" />
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="card p-4 mb-4">
        <p className="section-title mb-3">Quick Actions</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { to: '/members', icon: UserPlus, label: 'Add Member', bg: 'bg-blue-50', fg: 'text-blue-600' },
            { to: '/events', icon: CalendarDays, label: 'New Event', bg: 'bg-purple-50', fg: 'text-purple-600' },
            { to: '/recruitment', icon: Star, label: 'Add PNM', bg: 'bg-gold/10', fg: 'text-gold-dark' },
            { to: '/analytics', icon: BarChart2, label: 'Analytics', bg: 'bg-gray-100', fg: 'text-gray-600' },
          ].map(({ to, icon: Icon, label, bg, fg }) => (
            <Link key={to} to={to}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${bg} active:scale-95 transition-transform`}>
              <Icon size={18} className={fg} />
              <span className={`text-[10px] font-bold ${fg} text-center leading-tight`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── BOTTOM PANELS ── */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">

        {/* Upcoming Events */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">Upcoming Events</p>
            <Link to="/events" className="text-xs font-semibold text-navy hover:underline flex items-center gap-0.5">
              All <ChevronRight size={11} />
            </Link>
          </div>
          {events.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarDays size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No upcoming events</p>
              <Link to="/events" className="text-xs text-navy font-medium mt-1 inline-block">Create one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {events.map(e => (
                <div key={e.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${EVENT_DOT[e.type] || EVENT_DOT.other}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400">{fmtDate(e.date)}</p>
                  </div>
                  <span className="text-xs text-gray-300 capitalize flex-shrink-0">{e.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-50">
            <p className="text-sm font-bold text-gray-900">Recent Activity</p>
          </div>
          {activity.length === 0 ? (
            <div className="py-10 text-center">
              <Clock size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activity.map((item, i) => {
                const cfg = ACTIVITY_CFG[item.type] || ACTIVITY_CFG.default;
                const Icon = cfg.icon;
                return (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <div className={`w-7 h-7 ${cfg.bg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon size={13} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">{item.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.createdAt)}</p>
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
