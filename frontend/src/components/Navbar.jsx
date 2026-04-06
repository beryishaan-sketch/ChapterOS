import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Settings, LogOut, Search, Shield, UserCircle } from 'lucide-react';
import GlobalSearch from './GlobalSearch';
import NotificationBell from './NotificationBell';

const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/members':       'Members',
  '/recruitment':   'Recruitment',
  '/bid-voting':    'Bid Voting',
  '/events':        'Events',
  '/attendance':    'Attendance',
  '/dues':          'Dues',
  '/announcements': 'Announcements',
  '/polls':         'Polls',
  '/leaderboard':   'Leaderboard',
  '/analytics':     'Analytics',
  '/budget':        'Treasury',
  '/risk':          'Risk Management',
  '/academics':     'Academics',
  '/reports':       'HQ Reports',
  '/sponsors':      'Sponsorships',
  '/documents':     'Documents',
  '/import':        'Import Data',
  '/profile':       'Profile',
  '/settings':      'Settings',
  '/billing':       'Billing & Plan',
  '/channels':      'Channels',
  '/more':          'More',
};

export default function Navbar({ onMenuClick }) {
  const { user, org, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef(null);

  const title = PAGE_TITLES[location.pathname] || 'ChapterOS';

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

      <header style={{
        background: 'rgba(10,15,28,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 24px', gap: 16 }}>

          {/* Page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ color: '#F8FAFC', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', margin: 0 }}>
              {title}
            </h1>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#475569', cursor: 'pointer', transition: 'all 150ms ease',
                fontSize: 13,
              }}
              className="hover:border-[rgba(255,255,255,0.12)] hover:text-[#94A3B8]"
            >
              <Search size={13} />
              <span className="hidden sm:inline">Search</span>
              <kbd style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4, padding: '1px 5px',
                fontSize: 10, fontFamily: 'monospace', color: '#475569',
              }} className="hidden sm:inline">⌘K</kbd>
            </button>

            <NotificationBell />

            {/* Avatar / Dropdown */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 8px', borderRadius: 8,
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', transition: 'background 150ms ease',
                }}
                className="hover:bg-[rgba(255,255,255,0.05)]"
              >
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'rgba(79,142,247,0.2)',
                  border: '1px solid rgba(79,142,247,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#4F8EF7', fontWeight: 700, fontSize: 11, flexShrink: 0,
                }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <ChevronDown
                  size={13} color="#475569"
                  style={{ transition: 'transform 150ms ease', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}
                  className="hidden sm:block"
                />
              </button>

              {dropdownOpen && (
                <div
                  className="animate-scale-in"
                  style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                    width: 224,
                    background: '#131D2E',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 12,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    overflow: 'hidden', zIndex: 50,
                  }}
                >
                  {/* User info */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'rgba(79,142,247,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#4F8EF7', fontWeight: 700, fontSize: 13, flexShrink: 0,
                      }}>
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: '#F8FAFC', fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p style={{ color: '#475569', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: 6 }}>
                    {[
                      { icon: UserCircle, label: 'My Profile',    to: '/profile' },
                      { icon: Settings,   label: 'Settings',      to: '/settings' },
                      { icon: Shield,     label: 'Billing & Plan',to: '/billing' },
                    ].map(({ icon: Icon, label, to }) => (
                      <button
                        key={to}
                        onClick={() => { navigate(to); setDropdownOpen(false); }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 8,
                          background: 'none', border: 'none',
                          color: '#94A3B8', fontSize: 13, cursor: 'pointer',
                          transition: 'all 150ms ease', textAlign: 'left',
                        }}
                        className="hover:bg-[rgba(255,255,255,0.05)] hover:text-[#F8FAFC]"
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
                    <button
                      onClick={logout}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8,
                        background: 'none', border: 'none',
                        color: '#F87171', fontSize: 13, cursor: 'pointer',
                        transition: 'background 150ms ease', textAlign: 'left',
                      }}
                      className="hover:bg-[rgba(248,113,113,0.08)]"
                    >
                      <LogOut size={14} />
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
