import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, DollarSign, CalendarDays, Zap,
  ChevronRight, UserPlus, MessageSquare,
  Star, Clock, ArrowUpRight, ShieldAlert,
  TrendingUp, Bell, BarChart2, FileSpreadsheet
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

const EVENT_COLORS = {
  mixer: '#3b82f6', formal: '#C9A84C', meeting: '#6366f1',
  philanthropy: '#10b981', social: '#8b5cf6', other: '#9ca3af',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats'),
      client.get('/events'),
      client.get('/members'),
      client.get('/announcements'),
    ]).then(([s, e, m, a]) => {
      setStats(s.data.data);
      setEvents((e.data.data || []).filter(ev => new Date(ev.date) >= new Date()).slice(0, 3));
      setMembers((m.data.data || []).slice(0, 5));
      setAnnouncements((a.data.data || []).slice(0, 2));
    }).finally(() => setLoading(false));
  }, []);

  const firstName = user?.firstName || 'Brother';
  const org = user?.org;
  const duesRate = stats ? Math.round((stats.duesCollected / Math.max(stats.totalMembers, 1)) * 100) : 0;

  if (loading) return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-40 bg-navy/10 rounded-3xl" />
      <div className="h-20 bg-gray-100 rounded-2xl" />
      <div className="h-32 bg-gray-100 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-4 pb-4">

      {/* ── HERO HEADER ──────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F1C3F 0%, #1a2f6e 60%, #0F1C3F 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-gold/10 rounded-full" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative p-6 pb-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/50 text-xs font-medium tracking-wide uppercase">{greeting()}</p>
              <h1 className="text-white text-2xl font-extrabold mt-0.5">{firstName} 👋</h1>
              <p className="text-white/40 text-xs mt-0.5">{org?.name}</p>
            </div>
            <Link to="/announcements"
              className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors relative">
              <Bell size={17} className="text-white" />
              {announcements.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full text-[9px] font-bold text-navy flex items-center justify-center">
                  {announcements.length}
                </span>
              )}
            </Link>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Members', value: stats?.totalMembers ?? '—', icon: Users, to: '/members' },
              { label: 'Dues Rate', value: `${stats?.duesRate ?? 0}%`, icon: DollarSign, to: '/dues' },
              { label: 'Events', value: events.length, icon: CalendarDays, to: '/events' },
            ].map(({ label, value, icon: Icon, to }) => (
              <Link key={label} to={to}
                className="bg-white/10 rounded-2xl p-3 flex flex-col gap-1.5 hover:bg-white/15 transition-colors active:scale-95">
                <Icon size={14} className="text-white/50" />
                <p className="text-white font-extrabold text-xl leading-none">{value}</p>
                <p className="text-white/40 text-[10px] font-medium">{label}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: MessageSquare, label: 'Chat',     to: '/channels',   bg: 'bg-blue-50',   fg: 'text-blue-600' },
          { icon: DollarSign,    label: 'Dues',     to: '/dues',       bg: 'bg-emerald-50',fg: 'text-emerald-600' },
          { icon: Star,          label: 'Rush',     to: '/recruitment',bg: 'bg-amber-50',  fg: 'text-amber-600' },
          { icon: BarChart2,     label: 'Analytics',to: '/analytics',  bg: 'bg-purple-50', fg: 'text-purple-600' },
        ].map(({ icon: Icon, label, to, bg, fg }) => (
          <Link key={to} to={to}
            className={`${bg} rounded-2xl p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform`}>
            <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
              <Icon size={18} className={fg} />
            </div>
            <span className="text-xs font-semibold text-gray-700">{label}</span>
          </Link>
        ))}
      </div>

      {/* ── ANNOUNCEMENTS ────────────────────────────── */}
      {announcements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-gray-900">Announcements</p>
            <Link to="/announcements" className="text-xs text-navy font-semibold flex items-center gap-0.5">
              All <ChevronRight size={12} />
            </Link>
          </div>
          {announcements.map(a => (
            <div key={a.id} className="bg-navy/5 border border-navy/10 rounded-2xl p-4">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-navy rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={11} className="text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── UPCOMING EVENTS ──────────────────────────── */}
      {events.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-gray-900">Upcoming</p>
            <Link to="/events" className="text-xs text-navy font-semibold flex items-center gap-0.5">
              All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {events.map(ev => {
              const color = EVENT_COLORS[ev.type] || EVENT_COLORS.other;
              const dt = new Date(ev.date);
              return (
                <Link key={ev.id} to="/events"
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-transform shadow-sm hover:shadow-md">
                  {/* Date block */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center"
                    style={{ background: color + '18', border: `1.5px solid ${color}30` }}>
                    <span className="text-xs font-bold uppercase" style={{ color }}>
                      {dt.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-lg font-extrabold leading-none text-gray-900">{dt.getDate()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{ev.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {ev.location && ` · ${ev.location}`}
                    </p>
                  </div>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: color + '20' }}>
                    <span className="w-2 h-2 rounded-full block" style={{ background: color }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── DUES SNAPSHOT ────────────────────────────── */}
      {stats && (
        <Link to="/dues" className="block bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Dues Collection</p>
            <ArrowUpRight size={15} className="text-gray-300" />
          </div>
          {/* Progress bar */}
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${stats.duesRate || 0}%`,
                background: stats.duesRate >= 80 ? '#10b981' : stats.duesRate >= 50 ? '#C9A84C' : '#f87171'
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{stats.duesRate || 0}% paid</span>
            <span className="font-semibold text-gray-900">
              ${((stats.duesCollected || 0) / 100).toFixed(0)} collected
            </span>
          </div>
        </Link>
      )}

      {/* ── BROTHERS ─────────────────────────────────── */}
      {members.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-gray-900">Brothers</p>
            <Link to="/members" className="text-xs text-navy font-semibold flex items-center gap-0.5">
              All {stats?.totalMembers} <ChevronRight size={12} />
            </Link>
          </div>
          {/* Avatar row */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              {members.slice(0, 6).map((m, i) => {
                const colors = ['#0F1C3F','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];
                return (
                  <div key={m.id} className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: colors[i % colors.length] }}>
                    {m.firstName?.[0]}{m.lastName?.[0]}
                  </div>
                );
              })}
              {stats?.totalMembers > 6 && (
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  +{stats.totalMembers - 6}
                </div>
              )}
            </div>
            <Link to="/members" className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{stats?.totalMembers || 0} active brothers</span>
              <span className="text-xs text-navy font-semibold flex items-center gap-0.5">View all <ChevronRight size={12} /></span>
            </Link>
          </div>
        </div>
      )}

      {/* ── ADMIN QUICK ACTIONS ──────────────────────── */}
      {(user?.role === 'admin' || user?.role === 'officer') && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-900 px-1">Manage</p>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
            {[
              { icon: UserPlus,      label: 'Add a Brother',       sub: 'Invite or import members',    to: '/members',    color: 'text-blue-500',    bg: 'bg-blue-50' },
              { icon: ShieldAlert,   label: 'Roles & Officers',    sub: 'Assign positions & access',   to: '/roles',      color: 'text-navy',        bg: 'bg-navy/8' },
              { icon: FileSpreadsheet,label:'Import Spreadsheet',  sub: 'Roster, dues, events',        to: '/import',     color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { icon: TrendingUp,    label: 'Analytics',           sub: 'Chapter health & stats',      to: '/analytics',  color: 'text-purple-600',  bg: 'bg-purple-50' },
            ].map(({ icon: Icon, label, sub, to, color, bg }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors">
                <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
