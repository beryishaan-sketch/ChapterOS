import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, CreditCard, MoreHorizontal } from 'lucide-react';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/members',   icon: Users,           label: 'Members' },
  { to: '/events',    icon: Calendar,        label: 'Events' },
  { to: '/dues',      icon: CreditCard,      label: 'Dues' },
  { to: '/more',      icon: MoreHorizontal,  label: 'More' },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-gray-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -1px 0 rgba(0,0,0,0.06), 0 -8px 24px rgba(0,0,0,0.06)' }}>
      <div className="flex items-stretch justify-around h-[56px]">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-[3px] flex-1 px-1 transition-all duration-150
              ${isActive ? 'text-navy' : 'text-gray-400'}`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active pill background */}
                {isActive && (
                  <span className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-7 bg-navy/8 rounded-xl" />
                )}
                <Icon size={20} className="relative z-10" strokeWidth={isActive ? 2.3 : 1.7} />
                <span className={`text-[10px] leading-none font-semibold relative z-10 ${isActive ? 'text-navy' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
