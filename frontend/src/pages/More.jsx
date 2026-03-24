import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Megaphone, Vote, Trophy, BarChart2, DollarSign, Shield,
  BookOpen, Star, ClipboardList, FileText, Settings, CreditCard,
  ChevronRight, UserCircle, Download, Building2, Gavel, Users
} from 'lucide-react';

const COLORS = {
  blue:   { bg: 'bg-blue-500',   text: 'text-white' },
  purple: { bg: 'bg-purple-500', text: 'text-white' },
  yellow: { bg: 'bg-amber-400',  text: 'text-white' },
  indigo: { bg: 'bg-indigo-500', text: 'text-white' },
  gold:   { bg: 'bg-gold',       text: 'text-navy-dark' },
  orange: { bg: 'bg-orange-500', text: 'text-white' },
  green:  { bg: 'bg-emerald-500',text: 'text-white' },
  red:    { bg: 'bg-red-500',    text: 'text-white' },
  teal:   { bg: 'bg-teal-500',   text: 'text-white' },
  navy:   { bg: 'bg-navy',       text: 'text-white' },
  gray:   { bg: 'bg-gray-500',   text: 'text-white' },
  slate:  { bg: 'bg-slate-600',  text: 'text-white' },
};

const SECTIONS = [
  {
    title: 'Engagement',
    items: [
      { to: '/announcements', icon: Megaphone, label: 'Announcements', color: 'blue' },
      { to: '/polls',         icon: Vote,      label: 'Polls',         color: 'purple' },
      { to: '/leaderboard',   icon: Trophy,    label: 'Leaderboard',   color: 'yellow' },
      { to: '/analytics',     icon: BarChart2, label: 'Analytics',     color: 'indigo' },
    ],
  },
  {
    title: 'Recruitment',
    items: [
      { to: '/recruitment', icon: Star,        label: 'PNM Tracker',  color: 'gold' },
      { to: '/bid-voting',  icon: Gavel,       label: 'Bid Voting',   color: 'orange' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/budget',      icon: DollarSign,   label: 'Treasury',          color: 'green' },
      { to: '/risk',        icon: Shield,        label: 'Risk Management',   color: 'red' },
      { to: '/academics',   icon: BookOpen,      label: 'Academics',         color: 'teal' },
      { to: '/attendance',  icon: ClipboardList, label: 'Attendance',        color: 'navy' },
      { to: '/sponsors',    icon: Building2,     label: 'Sponsorships',      color: 'gold' },
    ],
  },
  {
    title: 'Admin',
    roles: ['admin', 'officer'],
    items: [
      { to: '/reports',   icon: FileText,   label: 'HQ Reports',   color: 'slate' },
      { to: '/import',    icon: Download,   label: 'Import Data',  color: 'gray' },
      { to: '/documents', icon: FileText,   label: 'Documents',    color: 'gray' },
      { to: '/billing',   icon: CreditCard, label: 'Billing',      color: 'gray' },
      { to: '/settings',  icon: Settings,   label: 'Settings',     color: 'gray' },
    ],
  },
];

export default function More() {
  const { user } = useAuth();

  return (
    <div className="max-w-lg mx-auto">

      {/* Profile card */}
      <Link to="/profile"
        className="card flex items-center gap-4 px-5 py-4 mb-6 active:scale-[0.985] transition-transform block">
        <div className="w-14 h-14 bg-navy rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-bold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
          <p className="text-[13px] text-gray-400 truncate capitalize">{user?.role} · {user?.email}</p>
        </div>
        <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
      </Link>

      {/* Sections — iOS Settings style */}
      <div className="space-y-6">
        {SECTIONS.map(section => {
          if (section.roles && !section.roles.includes(user?.role)) return null;
          return (
            <div key={section.title}>
              <p className="section-title mb-2 px-1">{section.title}</p>
              <div className="card overflow-hidden">
                {section.items.map(({ to, icon: Icon, label, color }, i) => {
                  const c = COLORS[color] || COLORS.gray;
                  return (
                    <Link key={to} to={to}
                      className={`flex items-center gap-3.5 px-4 py-3.5 active:bg-gray-50 transition-colors
                        ${i < section.items.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {/* Colored icon */}
                      <div className={`w-9 h-9 ${c.bg} rounded-[10px] flex items-center justify-center flex-shrink-0`}
                        style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.15)' }}>
                        <Icon size={17} className={c.text} strokeWidth={2} />
                      </div>
                      <p className="flex-1 text-[15px] font-medium text-gray-900">{label}</p>
                      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-4" />
    </div>
  );
}
