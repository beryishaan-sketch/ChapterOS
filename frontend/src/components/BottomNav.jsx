import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, MessageSquare, Calendar, MoreHorizontal } from 'lucide-react';

const TABS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/members',   icon: Users,           label: 'Members' },
  { to: '/channels',  icon: MessageSquare,   label: 'Chat' },
  { to: '/events',    icon: Calendar,        label: 'Events' },
  { to: '/more',      icon: MoreHorizontal,  label: 'More' },
];

export default function BottomNav() {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40"
      style={{
        background: 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '0.5px solid rgba(0,0,0,0.1)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
      }}
    >
      <div className="flex items-end justify-around h-[62px] px-2">
        {TABS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="flex-1">
            {({ isActive }) => (
              <div className="flex flex-col items-center justify-center gap-1 pt-2 pb-1">
                <div className={`flex items-center justify-center rounded-2xl transition-all duration-200
                  ${isActive ? 'bg-navy w-12 h-8' : 'w-10 h-7'}`}>
                  <Icon
                    size={isActive ? 19 : 22}
                    className={isActive ? 'text-white' : 'text-gray-400'}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                </div>
                <span className={`text-[10px] leading-none font-semibold tracking-wide transition-colors
                  ${isActive ? 'text-navy' : 'text-gray-400'}`}>
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
