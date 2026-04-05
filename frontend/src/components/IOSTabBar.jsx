import React, { useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useHaptic } from '../hooks/useHaptic';

// SF Symbol-style SVG paths — hand-crafted to feel native
const HomeIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    {filled ? (
      <path d="M13 2.5L3 10.5V22.5C3 23.05 3.45 23.5 4 23.5H9.5V16.5H16.5V23.5H22C22.55 23.5 23 23.05 23 22.5V10.5L13 2.5Z" fill="currentColor"/>
    ) : (
      <>
        <path d="M13 2.5L3 10.5V22.5C3 23.05 3.45 23.5 4 23.5H9.5V16.5H16.5V23.5H22C22.55 23.5 23 23.05 23 22.5V10.5L13 2.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
      </>
    )}
  </svg>
);

const MembersIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    {filled ? (
      <>
        <circle cx="10" cy="9" r="4" fill="currentColor"/>
        <path d="M2 21C2 17.13 5.13 14 9 14H11C14.87 14 18 17.13 18 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
        <circle cx="19" cy="9" r="3" fill="currentColor" opacity="0.7"/>
        <path d="M17 21C17 18.24 18.69 15.89 21 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.7"/>
      </>
    ) : (
      <>
        <circle cx="10" cy="9" r="4" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M2 21C2 17.13 5.13 14 9 14H11C14.87 14 18 17.13 18 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
        <circle cx="19" cy="9" r="3" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M17 21C17 18.24 18.69 15.89 21 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </>
    )}
  </svg>
);

const ChatIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    {filled ? (
      <path d="M13 3C7.48 3 3 6.92 3 11.75C3 14.21 4.18 16.43 6.08 17.97L5 23L10.42 20.29C11.24 20.46 12.1 20.55 13 20.55C18.52 20.55 23 16.63 23 11.75C23 6.92 18.52 3 13 3Z" fill="currentColor"/>
    ) : (
      <path d="M13 3C7.48 3 3 6.92 3 11.75C3 14.21 4.18 16.43 6.08 17.97L5 23L10.42 20.29C11.24 20.46 12.1 20.55 13 20.55C18.52 20.55 23 16.63 23 11.75C23 6.92 18.52 3 13 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
    )}
  </svg>
);

const EventsIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    {filled ? (
      <>
        <rect x="3" y="5" width="20" height="18" rx="3" fill="currentColor" opacity="0.15"/>
        <rect x="3" y="5" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M3 10H23" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 3V7M18 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        {filled && <rect x="7" y="14" width="4" height="4" rx="1" fill="currentColor"/>}
        {filled && <rect x="15" y="14" width="4" height="4" rx="1" fill="currentColor"/>}
      </>
    ) : (
      <>
        <rect x="3" y="5" width="20" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <path d="M3 10H23" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M8 3V7M18 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="7" y="14" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <rect x="15" y="14" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </>
    )}
  </svg>
);

const MoreIcon = ({ filled }) => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    {filled ? (
      <>
        <circle cx="5.5" cy="13" r="2.5" fill="currentColor"/>
        <circle cx="13" cy="13" r="2.5" fill="currentColor"/>
        <circle cx="20.5" cy="13" r="2.5" fill="currentColor"/>
      </>
    ) : (
      <>
        <circle cx="5.5" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <circle cx="13" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
        <circle cx="20.5" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.8" fill="none"/>
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

  const handleTap = () => impact('light');

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(249,249,249,0.92)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '0.5px solid rgba(0,0,0,0.18)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="lg:hidden"
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 49, paddingTop: 8 }}>
        {TABS.map(({ to, label, Icon }) => {
          const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              onClick={handleTap}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                paddingBottom: 6,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{
                color: isActive ? '#0F1C3F' : '#8E8E93',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.15s ease',
              }}>
                <Icon filled={isActive} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: isActive ? '#0F1C3F' : '#8E8E93',
                lineHeight: 1,
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
                transition: 'color 0.15s ease',
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
