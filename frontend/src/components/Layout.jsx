import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import IOSTabBar from './IOSTabBar';
import TrialBanner from './TrialBanner';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: '#F2F2F7' }}>
      {/* Sidebar — desktop only */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <TrialBanner />
        {/* Desktop navbar only */}
        <div className="hidden lg:block">
          <Navbar onMenuClick={() => setMobileOpen(true)} />
        </div>

        <main
          id="ios-main-scroll"
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {/* Mobile: no horizontal padding (pages handle their own), tab bar safe area */}
          <div className="lg:px-8 lg:pt-8 lg:pb-10 max-w-screen-xl mx-auto pb-[calc(49px+env(safe-area-inset-bottom)+8px)]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* iOS native tab bar */}
      <IOSTabBar />
    </div>
  );
}
