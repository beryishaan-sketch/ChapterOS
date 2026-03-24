import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Settings, LogOut, User, Search, Shield, UserCircle } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const PAGE_CONFIG = {
  '/dashboard':    { title: 'Dashboard',       sub: null },
  '/members':      { title: 'Members',         sub: null },
  '/recruitment':  { title: 'Recruitment',     sub: null },
  '/bid-voting':   { title: 'Bid Voting',      sub: null },
  '/events':       { title: 'Events',          sub: null },
  '/attendance':   { title: 'Attendance',      sub: null },
  '/dues':         { title: 'Dues',            sub: null },
  '/announcements':{ title: 'Announcements',  sub: null },
  '/polls':        { title: 'Polls',           sub: null },
  '/leaderboard':  { title: 'Leaderboard',     sub: null },
  '/analytics':    { title: 'Analytics',       sub: null },
  '/budget':       { title: 'Treasury',        sub: null },
  '/risk':         { title: 'Risk Mgmt',       sub: null },
  '/academics':    { title: 'Academics',       sub: null },
  '/reports':      { title: 'HQ Reports',      sub: null },
  '/sponsors':     { title: 'Sponsors',        sub: null },
  '/documents':    { title: 'Documents',       sub: null },
  '/import':       { title: 'Import',          sub: null },
  '/profile':      { title: 'Profile',         sub: null },
  '/settings':     { title: 'Settings',        sub: null },
  '/billing':      { title: 'Billing',         sub: null },
  '/more':         { title: 'More',            sub: null },
};

export default function Navbar({ onMenuClick }) {
  const { user, org, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef(null);

  const page = PAGE_CONFIG[location.pathname] || { title: 'ChapterHQ', sub: null };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
        <div className="flex items-center h-14 px-4 lg:px-6 gap-3">

          {/* Left — org name on mobile, hamburger on desktop */}
          <div className="flex-1 min-w-0">
            {/* Mobile: show page title */}
            <div className="lg:hidden">
              <h1 className="text-[17px] font-bold text-gray-900 tracking-tight truncate">{page.title}</h1>
              {org && <p className="text-[11px] text-gray-400 leading-none mt-0.5 truncate">{org.name}</p>}
            </div>
            {/* Desktop: show org name */}
            <div className="hidden lg:block">
              <h1 className="text-sm font-semibold text-gray-900">{page.title}</h1>
              {org && <p className="text-xs text-gray-400 mt-0.5">{org.name} · {org.school}</p>}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 hover:bg-gray-200 rounded-xl transition-colors text-xs">
              <Search size={14} />
              <span>Search</span>
              <kbd className="bg-white border border-gray-200 rounded px-1 py-0.5 text-[10px] font-mono text-gray-400">⌘K</kbd>
            </button>
            <button onClick={() => setSearchOpen(true)}
              className="sm:hidden w-9 h-9 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-xl transition-colors">
              <Search size={18} />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Avatar / dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <ChevronDown size={13} className={`text-gray-400 hidden sm:block transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-modal border border-gray-100 animate-scale-in overflow-hidden z-50">
                  <div className="px-4 py-3.5 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    {[
                      { icon: UserCircle, label: 'My Profile', to: '/profile' },
                      { icon: Settings, label: 'Settings', to: '/settings' },
                      { icon: Shield, label: 'Billing & Plan', to: '/billing' },
                    ].map(({ icon: Icon, label, to }) => (
                      <button key={to} onClick={() => { navigate(to); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                        <Icon size={15} className="text-gray-400" />
                        {label}
                      </button>
                    ))}
                    <div className="my-1.5 border-t border-gray-50" />
                    <button onClick={logout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <LogOut size={15} className="text-red-400" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
