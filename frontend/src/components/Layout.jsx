import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import IOSTabBar from './IOSTabBar';
import TrialBanner from './TrialBanner';
import NativeTopBar from './NativeTopBar';
import { getIsNative } from '../hooks/useNative';

const isNative = getIsNative();

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: isNative ? '100vh' : undefined, minHeight: isNative ? undefined : '100vh', background: isNative ? '#080C14' : '#070B14' }}>
      {/* Sidebar — desktop only (never on native) */}
      {!isNative && <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!isNative && <TrialBanner />}

        {/* Desktop navbar */}
        {!isNative && (
          <div className="hidden lg:block">
            <Navbar onMenuClick={() => setMobileOpen(true)} />
          </div>
        )}

        {/* iOS native nav bar — sits above content, appears on scroll */}
        <NativeTopBar />

        <main
          id="ios-main-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            className={isNative ? '' : 'lg:p-8 max-w-screen-xl mx-auto'}
            style={{
              paddingBottom: isNative
                ? 'calc(83px + env(safe-area-inset-bottom))'
                : 'calc(49px + env(safe-area-inset-bottom) + 8px)',
              // On native, extra top padding for the translucent nav bar
              paddingTop: isNative ? 'calc(44px + env(safe-area-inset-top))' : undefined,
            }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* Tab bar — mobile web + native */}
      <IOSTabBar />
    </div>
  );
}
