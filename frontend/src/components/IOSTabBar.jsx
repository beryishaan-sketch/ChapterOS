import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useHaptic } from '../hooks/useHaptic';

const HomeIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M12 2L3 9.5V21C3 21.55 3.45 22 4 22H8.5V15H15.5V22H20C20.55 22 21 21.55 21 21V9.5L12 2Z" fill="currentColor"/>
      : <path d="M12 2L3 9.5V21C3 21.55 3.45 22 4 22H8.5V15H15.5V22H20C20.55 22 21 21.55 21 21V9.5L12 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>
    }
  </svg>
);

const MembersIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled ? (
      <>
        <circle cx="9" cy="8" r="4" fill="currentColor"/>
        <path d="M1 20C1 16.13 4.58 13 9 13H10C14.42 13 18 16.13 18 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="18" cy="8" r="3" fill="currentColor" opacity="0.6"/>
        <path d="M16 20C16 17.5 17.5 15.3 20 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6"/>
      </>
    ) : (
      <>
        <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" fill="none"/>
        <path d="M1 20C1 16.13 4.58 13 9 13H10C14.42 13 18 16.13 18 20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
        <circle cx="18" cy="8" r="3" stroke="currentColor" strokeWidth="1.7" fill="none"/>
        <path d="M16 20C16 17.5 17.5 15.3 20 14.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
      </>
    )}
  </svg>
);

const ChatIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled
      ? <path d="M12 2C6.48 2 2 5.92 2 10.75C2 13.21 3.18 15.43 5.08 16.97L4 22L9.42 19.29C10.24 19.46 11.1 19.55 12 19.55C17.52 19.55 22 15.63 22 10.75C22 5.92 17.52 2 12 2Z" fill="currentColor"/>
      : <path d="M12 2C6.48 2 2 5.92 2 10.75C2 13.21 3.18 15.43 5.08 16.97L4 22L9.42 19.29C10.24 19.46 11.1 19.55 12 19.55C17.52 19.55 22 15.63 22 10.75C22 5.92 17.52 2 12 2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill="none"/>
    }
  </svg>
);

const EventsIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <>
      <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.7" fill={filled ? 'rgba(79,142,247,0.15)' : 'none'}/>
      <path d="M3 9H21" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M8 2V5M16 2V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      {filled && <rect x="7" y="13" width="3" height="3" rx="1" fill="currentColor"/>}
      {filled && <rect x="14" y="13" width="3" height="3" rx="1" fill="currentColor"/>}
      {!filled && <rect x="7" y="13" width="3" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/>}
      {!filled && <rect x="14" y="13" width="3" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" fill="none"/>}
    </>
  </svg>
);

const MoreIcon = ({ filled }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    {filled ? (
      <>
        <circle cx="5" cy="12" r="2.2" fill="currentColor"/>
        <circle cx="12" cy="12" r="2.2" fill="currentColor"/>
        <circle cx="19" cy="12" r="2.2" fill="currentColor"/>
      </>
    ) : (
      <>
        <circle cx="5" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
        <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
        <circle cx="19" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.7" fill="none"/>
      </>
    )}
  </svg>
);

const TABS = [
  { to: '/dashboard', label: 'Home',    Icon: HomeIcon },
  { to: '/members',   label: 'Members', Icon: MembersIcon },
  { to: '/channels',  label: 'Chat',    Icon: ChatIcon },
  { to: '/events',    label: 'Events',  Icon: EventsIcon },
  { to: '/more',      label: 'More',    Icon: MoreIcon },
];

export default function IOSTabBar() {
  const { impact } = useHaptic();
  const location = useLocation();

  return (
    <nav
      className="lg:hidden"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(10,15,28,0.97)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: 49 }}>
        {TABS.map(({ to, label, Icon }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => impact('light')}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 3, paddingTop: 6,
                WebkitTapHighlightColor: 'transparent',
                textDecoration: 'none',
              }}
            >
              <div style={{
                color: isActive ? '#4F8EF7' : 'rgba(255,255,255,0.28)',
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
                transition: 'all 150ms ease',
              }}>
                <Icon filled={isActive} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#4F8EF7' : 'rgba(255,255,255,0.28)',
                lineHeight: 1,
                letterSpacing: '-0.01em',
                transition: 'color 150ms ease',
              }}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
