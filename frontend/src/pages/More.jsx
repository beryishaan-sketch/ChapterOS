import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
import { getIsNative } from '../hooks/useNative';
import {
  Megaphone, Trophy, BarChart2, DollarSign, ShieldCheck,
  Star, FileText, Settings, CreditCard, ChevronRight,
  Users, Gavel, Bell, LogOut, Vote, Upload,
  BookOpen, Shield, MessageSquare, Calendar, Key, Wallet,
  UserCheck, ClipboardList, Building2
} from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#070B14',
  card: '#0D1424',
  elevated: '#131D2E',
  accent: '#4F8EF7',
  gold: '#F0B429',
  success: '#34D399',
  danger: '#F87171',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  border: 'rgba(255,255,255,0.07)',
};

// ─── Dark section wrapper ─────────────────────────────────────────────────────
function DarkSection({ label, children, footer }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {label && (
        <p style={{
          fontSize: 10,
          fontWeight: 700,
          color: T.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginLeft: 4,
          marginBottom: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>{label}</p>
      )}
      <div style={{
        background: T.card,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}>
        {children}
      </div>
      {footer && (
        <p style={{
          fontSize: 12,
          color: T.textMuted,
          marginLeft: 4,
          marginTop: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>{footer}</p>
      )}
    </div>
  );
}

// ─── Dark list row ────────────────────────────────────────────────────────────
function DarkRow({ icon, iconBg, label, subtitle, to, badge, destructive, onClick, rightElement, isLast }) {
  const navigate = useNavigate();
  const { impact } = useHaptic();

  const handleClick = () => {
    if (onClick) { onClick(); return; }
    if (to) { impact('light'); navigate(to); }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 14px 11px 14px',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        position: 'relative',
        transition: 'background 100ms ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Icon square */}
      {icon && (
        <div style={{
          width: 30, height: 30,
          borderRadius: 7,
          background: iconBg || T.elevated,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: '#fff', display: 'flex', alignItems: 'center' }}>
            {React.cloneElement(icon, { size: 15 })}
          </span>
        </div>
      )}

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 16,
          fontWeight: 400,
          color: destructive ? T.danger : T.textPrimary,
          margin: 0,
          letterSpacing: '-0.01em',
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>{label}</p>
        {subtitle && (
          <p style={{
            fontSize: 12,
            color: T.textMuted,
            margin: '1px 0 0',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          }}>{subtitle}</p>
        )}
      </div>

      {/* Badge */}
      {badge && (
        <span style={{
          background: T.accent,
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
          padding: '2px 7px',
          borderRadius: 10,
          letterSpacing: '0.04em',
          marginRight: 2,
        }}>{badge}</span>
      )}

      {/* Right element */}
      {rightElement && <span style={{ flexShrink: 0 }}>{rightElement}</span>}

      {/* Chevron */}
      {!destructive && <ChevronRight size={16} color={T.textMuted} />}

      {/* Separator */}
      {!isLast && (
        <div style={{
          position: 'absolute', bottom: 0,
          left: icon ? 56 : 14, right: 0,
          height: '0.5px',
          background: T.border,
        }} />
      )}
    </div>
  );
}

// ─── Convenience Row with navigate built-in ───────────────────────────────────
function Row({ icon: Icon, iconBg, label, to, badge, isLast }) {
  return (
    <DarkRow
      icon={<Icon />}
      iconBg={iconBg}
      label={label}
      to={to}
      badge={badge}
      isLast={isLast}
    />
  );
}

// ─── More Page ────────────────────────────────────────────────────────────────
export default function More() {
  const { user, org, logout } = useAuth();
  const { impact, notification } = useHaptic();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isOfficer = isAdmin || user?.role === 'officer';
  const isNative = getIsNative();

  const N = {
    bg: '#000000', card: '#1C1C1E', elevated: '#2C2C2E',
    sep: 'rgba(255,255,255,0.08)',
    accent: '#0A84FF', success: '#30D158', warning: '#FF9F0A', danger: '#FF453A',
    text1: '#FFFFFF', text2: 'rgba(235,235,245,0.6)', text3: 'rgba(235,235,245,0.3)',
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  };

  const NRow = ({ icon: Icon, iconBg, label, to, badge, onClick: rowClick, destructive }) => (
    <div
      onClick={() => {
        if (rowClick) { rowClick(); return; }
        if (to) { impact('light'); navigate(to); }
      }}
      style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', minHeight: 50, borderBottom: `1px solid ${N.sep}`, cursor: 'pointer', WebkitTapHighlightColor: 'rgba(255,255,255,0.05)' }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
        <Icon size={17} style={{ color: '#fff' }} />
      </div>
      <span style={{ flex: 1, fontSize: 17, color: destructive ? N.danger : N.text1 }}>{label}</span>
      {badge && <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: N.accent, borderRadius: 8, padding: '2px 7px', marginRight: 8 }}>{badge}</span>}
      {!destructive && <ChevronRight size={17} style={{ color: N.text3 }} />}
    </div>
  );

  const NSection = ({ title, children }) => (
    <div style={{ padding: '28px 16px 0' }}>
      <div style={{ fontSize: 13, color: N.text3, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 4px 8px' }}>{title}</div>
      <div style={{ background: N.card, borderRadius: 14, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  const NV = {
    bg: '#080C14', card: '#111827', elevated: '#1E2A3A',
    border: 'rgba(255,255,255,0.08)',
    accent: '#3B82F6', gold: '#F59E0B', success: '#10B981', danger: '#EF4444', purple: '#8B5CF6',
    text1: '#FFFFFF', text2: 'rgba(255,255,255,0.55)', text3: 'rgba(255,255,255,0.28)',
    sep: 'rgba(255,255,255,0.06)',
    font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || '?';
  const roleLabel = user?.position || (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '');

  const NVRow = ({ icon: Icon, iconBg, label, to, onClick: rowClick }) => (
    <div
      onClick={() => { if (rowClick) { rowClick(); return; } if (to) { impact('light'); navigate(to); } }}
      style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid ' + NV.sep, cursor: 'pointer' }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
        <Icon size={17} color="#fff" />
      </div>
      <span style={{ flex: 1, fontSize: 16, color: NV.text1 }}>{label}</span>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  );

  const NVSection = ({ title, children }) => (
    <div style={{ margin: '24px 20px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: NV.text3, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 4px 10px' }}>{title}</div>
      <div style={{ background: NV.card, borderRadius: 16, border: '1px solid ' + NV.border, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  if (isNative) return (
    <div style={{ background: NV.bg, minHeight: '100vh', paddingBottom: 20, fontFamily: NV.font }}>
      {/* Profile hero card */}
      <div
        onClick={() => { impact('light'); navigate('/profile'); }}
        style={{ margin: '20px 20px 0', background: 'linear-gradient(135deg, #111827 0%, #1E2A3A 100%)', borderRadius: 20, border: '1px solid rgba(59,130,246,0.2)', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
      >
        <div style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 26, fontWeight: 800, color: '#fff', boxShadow: '0 0 24px rgba(59,130,246,0.3)' }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: NV.text1, marginBottom: 3 }}>{user?.firstName} {user?.lastName}</div>
          <div style={{ fontSize: 14, color: NV.text2 }}>{roleLabel} · {user?.chapterName || org?.name || 'Chapter'}</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
      </div>

      {/* CHAPTER section */}
      <NVSection title="CHAPTER">
        <NVRow icon={Megaphone}     iconBg="#3B82F6" label="Recruitment"  to="/recruitment" />
        <NVRow icon={Calendar}      iconBg="#8B5CF6" label="Events"        to="/events" />
        <NVRow icon={Users}         iconBg="#10B981" label="Members"       to="/roles" />
        <NVRow icon={DollarSign}    iconBg="#F59E0B" label="Dues"          to="/dues" />
      </NVSection>

      {/* TOOLS section */}
      <NVSection title="TOOLS">
        <NVRow icon={BarChart2}     iconBg="#06B6D4" label="Analytics"     to="/analytics" />
        <NVRow icon={Trophy}        iconBg="#F59E0B" label="Leaderboard"   to="/leaderboard" />
        <NVRow icon={Wallet}        iconBg="#10B981" label="Budget"        to="/budget" />
        <NVRow icon={ClipboardList} iconBg="#8B5CF6" label="Attendance"    to="/attendance" />
        <NVRow icon={BookOpen}      iconBg="#3B82F6" label="Academics"     to="/academics" />
        <NVRow icon={FileText}      iconBg="#64748B" label="Documents"     to="/documents" />
      </NVSection>

      {/* SETTINGS section */}
      <NVSection title="SETTINGS">
        <NVRow icon={CreditCard}    iconBg="#F59E0B" label="Billing"       to="/billing" />
        <NVRow icon={Settings}      iconBg="#64748B" label="Settings"      to="/settings" />
      </NVSection>

      {/* Sign Out */}
      <button
        onClick={() => { notification('warning'); if (window.confirm('Sign out of ChapterOS?')) logout(); }}
        style={{ display: 'block', width: 'calc(100% - 40px)', margin: '24px 20px 8px', padding: '16px', background: 'transparent', border: 'none', color: '#EF4444', fontSize: 17, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}
      >
        Sign Out
      </button>
    </div>
  );

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      background: T.bg,
      minHeight: '100vh',
    }}>

      {/* ── PROFILE CARD ── */}
      <div style={{
        background: 'linear-gradient(160deg, #070B14 0%, #0F1C3F 50%, #1a2f6b 100%)',
        padding: '52px 20px 24px',
        paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 36px))',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div
          onClick={() => { impact('light'); navigate('/profile'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 14,
            padding: '14px 16px',
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
        >
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(240,180,41,0.2)',
            border: '2px solid rgba(240,180,41,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: T.gold,
            fontWeight: 800,
            fontSize: 18,
            flexShrink: 0,
            letterSpacing: '-0.02em',
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: T.textPrimary, fontWeight: 700, fontSize: 17, margin: 0, letterSpacing: '-0.02em' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ color: T.textSecondary, fontSize: 13, margin: '2px 0 0', textTransform: 'capitalize' }}>
              {user?.position || user?.role}{org?.name ? ` · ${org.name}` : ''}
            </p>
          </div>

          <ChevronRight size={18} color={T.textMuted} />
        </div>
      </div>

      {/* ── MENU SECTIONS ── */}
      <div style={{ padding: '20px 16px 0' }}>

        {/* Engagement */}
        <DarkSection label="Engagement">
          <Row icon={Megaphone}     iconBg="#EF4444" label="Announcements"   to="/announcements" />
          <Row icon={MessageSquare} iconBg="#3B82F6" label="Channels"        to="/channels" badge="NEW" />
          <Row icon={Trophy}        iconBg="#F97316" label="Leaderboard"     to="/leaderboard" />
          <Row icon={Vote}          iconBg="#7C3AED" label="Polls"           to="/polls" isLast />
        </DarkSection>

        {/* Chapter */}
        <DarkSection label="Chapter">
          <Row icon={Calendar}      iconBg="#9333EA" label="Events"          to="/events" />
          <Row icon={ClipboardList} iconBg="#0EA5E9" label="Attendance"      to="/attendance" />
          <Row icon={BookOpen}      iconBg="#10B981" label="Academics"       to="/academics" />
          <Row icon={FileText}      iconBg="#64748B" label="Documents"       to="/documents" isLast />
        </DarkSection>

        {/* Officer Tools */}
        {isOfficer && (
          <DarkSection label="Officer Tools">
            <Row icon={UserCheck}   iconBg="#F97316" label="Rush Pipeline"   to="/recruitment" />
            <Row icon={Gavel}       iconBg="#EF4444" label="Bid Voting"      to="/bid-voting" badge="NEW" />
            <Row icon={DollarSign}  iconBg="#10B981" label="Dues"            to="/dues" />
            <Row icon={Wallet}      iconBg="#0EA5E9" label="Treasury"        to="/budget" />
            <Row icon={ShieldCheck} iconBg="#EF4444" label="Risk Management" to="/risk" />
            <Row icon={Building2}   iconBg="#7C3AED" label="Sponsorships"    to="/sponsors" badge="NEW" />
            <Row icon={BarChart2}   iconBg="#3B82F6" label="Analytics"       to="/analytics" />
            <Row icon={FileText}    iconBg="#64748B" label="Reports"         to="/reports" />
            <Row icon={Upload}      iconBg="#475569" label="Import Data"     to="/import" isLast />
          </DarkSection>
        )}

        {/* Admin */}
        {isAdmin && (
          <DarkSection label="Admin">
            <Row icon={Users}  iconBg="#1E3A5F" label="Roles & Officers" to="/roles" />
            <Row icon={Shield} iconBg="#1E3A5F" label="Billing & Plan"   to="/billing" isLast />
          </DarkSection>
        )}

        {/* Account */}
        <DarkSection label="Account">
          <Row icon={Settings} iconBg="#64748B" label="Settings"        to="/settings" />
          <Row icon={Key}      iconBg="#475569" label="Change Password" to="/change-password" />
          <DarkRow
            icon={<LogOut />}
            iconBg="#7F1D1D"
            label="Sign Out"
            destructive
            isLast
            onClick={() => {
              notification('warning');
              if (window.confirm('Sign out of ChapterOS?')) logout();
            }}
          />
        </DarkSection>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: 11,
          color: T.textMuted,
          marginBottom: 32,
          marginTop: -8,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
          letterSpacing: '0.02em',
        }}>
          ChapterOS · {org?.plan === 'trial' ? 'Trial' : 'Pro'}
        </p>
      </div>
    </div>
  );
}
