import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNative } from '../hooks/useNative';

const ROUTE_TITLES = {
  '/dashboard':    'Home',
  '/members':      'Members',
  '/channels':     'Chat',
  '/events':       'Events',
  '/more':         'More',
  '/recruitment':  'Recruitment',
  '/dues':         'Dues',
  '/analytics':    'Analytics',
  '/leaderboard':  'Leaderboard',
  '/announcements':'Announcements',
  '/budget':       'Budget',
  '/attendance':   'Attendance',
  '/academics':    'Academics',
  '/polls':        'Polls',
  '/settings':     'Settings',
  '/profile':      'Profile',
  '/reports':      'Reports',
  '/bid-voting':   'Bid Voting',
  '/sponsors':     'Sponsors',
  '/risk':         'Risk',
  '/documents':    'Documents',
  '/billing':      'Billing',
};

export default function NativeTopBar() {
  const isNative = useNative();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Track scroll to show/hide border under nav bar
  useEffect(() => {
    const el = document.getElementById('ios-main-scroll');
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  // Reset scroll state on route change
  useEffect(() => {
    setScrolled(false);
    const el = document.getElementById('ios-main-scroll');
    if (el) el.scrollTop = 0;
  }, [location.pathname]);

  if (!isNative) return null;

  const title = ROUTE_TITLES[location.pathname] || 'ChapterOS';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        paddingTop: 'env(safe-area-inset-top)',
        background: scrolled
          ? 'rgba(0,0,0,0.88)'
          : 'rgba(0,0,0,0)',
        backdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(20px)' : 'none',
        borderBottom: scrolled
          ? '0.5px solid rgba(255,255,255,0.12)'
          : '0.5px solid transparent',
        transition: 'background 200ms ease, border-color 200ms ease',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 17,
            fontWeight: 600,
            color: '#FFFFFF',
            letterSpacing: '-0.2px',
            fontFamily: '-apple-system, SF Pro Text, system-ui, sans-serif',
            opacity: scrolled ? 1 : 0,
            transition: 'opacity 150ms ease',
          }}
        >
          {title}
        </span>
      </div>
    </div>
  );
}
