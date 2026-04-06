import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useHaptic } from '../hooks/useHaptic';
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
