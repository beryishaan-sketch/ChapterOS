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
        {/* Desktop navbar only */}
        <div className="hidden lg:block">
          <Navbar onMenuClick={() => setMobileOpen(true)} />
        </div>

        <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Mobile: zero top padding — hero cards handle their own spacing */}
          <div className="px-4 pt-0 pb-28 lg:px-8 lg:pt-8 lg:pb-10 max-w-screen-xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
