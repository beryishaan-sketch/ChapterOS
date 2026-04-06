import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import IOSTabBar from './IOSTabBar';
import TrialBanner from './TrialBanner';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#070B14' }}>
      {/* Sidebar — desktop only */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TrialBanner />

        {/* Navbar — desktop only */}
        <div className="hidden lg:block">
          <Navbar onMenuClick={() => setMobileOpen(true)} />
        </div>

        <main
          id="ios-main-scroll"
          style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}
        >
          <div
            className="lg:p-8 max-w-screen-xl mx-auto"
            style={{ paddingBottom: 'calc(49px + env(safe-area-inset-bottom) + 8px)' }}
          >
            <Outlet />
          </div>
        </main>
      </div>

      {/* iOS tab bar */}
      <IOSTabBar />
    </div>
  );
}
