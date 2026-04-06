import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  CreditCard, UserCheck, Settings, Shield,
  LogOut, X, Zap, Upload, Megaphone, Trophy, BarChart2, GraduationCap,
  Vote, Building2, Wallet, ShieldCheck, FileText, Gavel, MessageSquare
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/analytics',  icon: BarChart2,        label: 'Analytics' },
      { to: '/leaderboard',icon: Trophy,           label: 'Leaderboard' },
    ],
  },
  {
    label: 'Chapter',
    items: [
      { to: '/members',    icon: Users,       label: 'Members' },
      { to: '/recruitment',icon: UserCheck,   label: 'Recruitment', role: 'officer' },
      { to: '/bid-voting', icon: Gavel,       label: 'Bid Voting',  role: 'officer', badge: 'NEW' },
      { to: '/events',     icon: Calendar,    label: 'Events' },
      { to: '/attendance', icon: ClipboardList,label: 'Attendance' },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/dues',   icon: CreditCard, label: 'Dues' },
      { to: '/budget', icon: Wallet,     label: 'Treasury', role: 'officer' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { to: '/announcements', icon: Megaphone,     label: 'Announcements' },
      { to: '/channels',      icon: MessageSquare, label: 'Channels', badge: 'NEW' },
      { to: '/polls',         icon: Vote,          label: 'Polls' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/academics',  icon: GraduationCap, label: 'Academics' },
      { to: '/risk',       icon: ShieldCheck,   label: 'Risk Mgmt',   role: 'officer' },
      { to: '/documents',  icon: FileText,      label: 'Documents' },
      { to: '/sponsors',   icon: Building2,     label: 'Sponsorships',role: 'officer', badge: 'NEW' },
      { to: '/import',     icon: Upload,        label: 'Import Data', role: 'admin' },
    ],
  },
];

const canSee = (itemRole, userRole) => {
  if (!itemRole) return true;
  if (itemRole === 'admin') return userRole === 'admin';
  if (itemRole === 'officer') return userRole === 'admin' || userRole === 'officer';
  return true;
};

const NavItem = ({ to, icon: Icon, label, badge, onClick }) => (
  <NavLink to={to} onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative group ${
        isActive
          ? 'text-[#4F8EF7] bg-[rgba(79,142,247,0.1)]'
          : 'text-[#475569] hover:text-[#94A3B8] hover:bg-[rgba(255,255,255,0.04)]'
      }`
    }
  >
    {({ isActive }) => (
      <>
        {/* Active blue left border */}
        {isActive && (
          <div style={{
            position: 'absolute', left: 0, top: '20%', bottom: '20%',
            width: 3, borderRadius: '0 3px 3px 0',
            background: '#4F8EF7',
            boxShadow: '0 0 8px rgba(79,142,247,0.6)',
          }} />
        )}
        <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge && (
          <span style={{
            fontSize: 9, fontWeight: 700,
            background: 'rgba(79,142,247,0.2)', color: '#4F8EF7',
            padding: '1px 5px', borderRadius: 999,
            border: '1px solid rgba(79,142,247,0.3)',
          }}>
            {badge}
          </span>
        )}
      </>
    )}
  </NavLink>
);

const SidebarContent = ({ user, org, logout, navigate, onClose }) => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    {/* Logo */}
    <div style={{ padding: '20px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'linear-gradient(135deg, #4F8EF7, #3b7de8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, boxShadow: '0 0 16px rgba(79,142,247,0.35)',
        }}>
          <Zap size={15} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ color: '#F8FAFC', fontWeight: 700, fontSize: 14, lineHeight: 1.2, margin: 0 }}>ChapterOS</p>
          {org && <p style={{ color: '#475569', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</p>}
        </div>
      </div>
    </div>

    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

    {/* Nav */}
    <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 8px', scrollbarWidth: 'none' }}>
      {NAV_GROUPS.map(group => {
        const visible = group.items.filter(item => canSee(item.role, user?.role));
        if (!visible.length) return null;
        return (
          <div key={group.label} style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 10, fontWeight: 700,
              color: '#334155', textTransform: 'uppercase',
              letterSpacing: '0.08em', padding: '0 12px 6px',
              margin: 0,
            }}>
              {group.label}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {visible.map(item => (
                <NavItem key={item.to} {...item} onClick={onClose} />
              ))}
            </div>
          </div>
        );
      })}
    </nav>

    {/* Bottom */}
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 8px 16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 8 }}>
        <NavItem to="/settings" icon={Settings} label="Settings" onClick={onClose} />
        {user?.role === 'admin' && (
          <NavItem to="/billing" icon={Shield} label="Billing & Plan" onClick={onClose} />
        )}
      </div>

      {/* User card */}
      <div
        onClick={() => { navigate('/profile'); onClose?.(); }}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer', transition: 'all 150ms ease',
        }}
        className="hover:bg-[rgba(255,255,255,0.06)]"
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: 'rgba(79,142,247,0.2)',
          border: '1px solid rgba(79,142,247,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#4F8EF7', fontWeight: 700, fontSize: 11, flexShrink: 0,
        }}>
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.firstName} {user?.lastName}
          </p>
          <p style={{ color: '#475569', fontSize: 10, margin: 0, textTransform: 'capitalize' }}>{user?.role}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); logout(); }}
          style={{ padding: 4, color: '#475569', borderRadius: 6, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 150ms ease', display: 'flex' }}
          className="hover:text-[#F87171]"
          title="Sign out"
        >
          <LogOut size={13} />
        </button>
      </div>
    </div>
  </div>
);

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { user, org, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0"
        style={{
          width: 220, minHeight: '100vh',
          background: '#0A0F1C',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}
      >
        <SidebarContent user={user} org={org} logout={logout} navigate={navigate} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(7,11,20,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="animate-slide-in"
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 240,
              background: '#0A0F1C',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <button
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 14,
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: 'none',
                color: '#94A3B8', cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={15} />
            </button>
            <SidebarContent user={user} org={org} logout={logout} navigate={navigate} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
