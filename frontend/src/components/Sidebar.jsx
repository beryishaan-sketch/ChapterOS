import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  CreditCard, UserCheck, Settings, Shield,
  LogOut, X, Zap, Upload, Megaphone, Trophy, BarChart2, GraduationCap, ClipboardList as ReportIcon,
  Vote, Building2, Wallet, ShieldCheck, FileText, User, ChevronDown, Gavel, MessageSquare
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/analytics', icon: BarChart2, label: 'Analytics' },
      { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    ],
  },
  {
    label: 'Chapter',
    items: [
      { to: '/members', icon: Users, label: 'Members' },
      { to: '/recruitment', icon: UserCheck, label: 'Recruitment' },
      { to: '/bid-voting', icon: Gavel, label: 'Bid Voting', badge: 'NEW' },
      { to: '/events', icon: Calendar, label: 'Events' },
      { to: '/attendance', icon: ClipboardList, label: 'Attendance' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/dues', icon: CreditCard, label: 'Dues' },
      { to: '/budget', icon: Wallet, label: 'Treasury' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { to: '/announcements', icon: Megaphone, label: 'Announcements' },
      { to: '/channels', icon: MessageSquare, label: 'Channels', badge: 'NEW' },
      { to: '/polls', icon: Vote, label: 'Polls' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/academics', icon: GraduationCap, label: 'Academics' },
      { to: '/reports', icon: ReportIcon, label: 'HQ Reports', badge: 'NEW' },
      { to: '/risk', icon: ShieldCheck, label: 'Risk Management' },
      { to: '/documents', icon: FileText, label: 'Documents' },
      { to: '/import', icon: Upload, label: 'Import Data' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/sponsors', icon: Building2, label: 'Sponsorships', badge: 'NEW' },
    ],
  },
];

const NavItem = ({ to, icon: Icon, label, badge, onClick }) => (
  <NavLink to={to} onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group ${
        isActive ? 'bg-gold text-navy-dark shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/8'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className="flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && <span className="text-[9px] font-bold bg-gold/20 text-gold px-1.5 py-0.5 rounded-full">{badge}</span>}
      </>
    )}
  </NavLink>
);

const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();

  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={15} className="text-navy-dark" strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight">ChapterHQ</p>
            {org && <p className="text-white/40 text-xs truncate">{org.name}</p>}
          </div>
        </div>
      </div>

      <div className="px-3 mb-1"><div className="h-px bg-white/8" /></div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 overflow-y-auto py-2 space-y-3">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 pb-1">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.to} {...item} onClick={() => setMobileOpen?.(false)} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-0.5">
        <NavItem to="/settings" icon={Settings} label="Settings" onClick={() => setMobileOpen?.(false)} />
        <NavItem to="/billing" icon={Shield} label="Billing & Plan" onClick={() => setMobileOpen?.(false)} />

        {/* User card */}
        <div className="mt-2 px-3 py-2.5 flex items-center gap-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-colors"
          onClick={() => { navigate('/profile'); setMobileOpen?.(false); }}>
          <div className="w-7 h-7 bg-gold/20 rounded-full flex items-center justify-center text-gold text-xs font-bold flex-shrink-0">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white/80 text-xs font-semibold truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-white/35 text-[10px] capitalize">{user?.role}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); logout(); }}
            className="p-1 text-white/25 hover:text-white/60 rounded transition-colors" title="Sign out">
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-56 bg-navy min-h-screen flex-shrink-0">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-dark/70 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-navy animate-slide-in">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-1.5 text-white/40 hover:text-white/80 rounded-lg">
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
