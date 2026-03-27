import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import TrialBanner from './TrialBanner';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: '#F2F2F7' }}>
      {/* Sidebar — desktop only */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <TrialBanner />
        {/* Navbar — desktop only, hide on mobile (bottom nav handles navigation) */}
        <div className="hidden lg:block">
          <Navbar onMenuClick={() => setMobileOpen(true)} />
        </div>
        {/* Mobile top bar — just shows page title, no hamburger clutter */}
        <div className="lg:hidden sticky top-0 z-30 bg-[#F2F2F7]/90 backdrop-blur-xl px-4 pt-safe-top">
          <div className="h-11" /> {/* status bar space */}
        </div>

        <main className="flex-1 overflow-auto">
          {/* Mobile: tight native-app padding */}
          <div className="px-4 pt-2 pb-28 lg:px-8 lg:pt-8 lg:pb-10 max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
