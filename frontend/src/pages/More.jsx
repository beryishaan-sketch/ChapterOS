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
import { IOSSection, IOSRow } from '../components/IOSList';

function Row({ icon: Icon, iconBg, label, to, badge }) {
  const navigate = useNavigate();
  const { impact } = useHaptic();
  return (
    <IOSRow
      icon={<Icon size={16} />}
      iconBg={iconBg}
      label={label}
      chevron
      rightElement={badge ? (
        <span style={{
          background: '#FF3B30', color: '#fff',
          fontSize: 10, fontWeight: 700,
          padding: '2px 6px', borderRadius: 10,
          marginRight: 4,
        }}>{badge}</span>
      ) : null}
      onClick={() => { impact('light'); navigate(to); }}
    />
  );
}

export default function More() {
  const { user, org, logout } = useAuth();
  const { impact, notification } = useHaptic();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isOfficer = isAdmin || user?.role === 'officer';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', paddingTop: 0 }}>

      {/* ── PROFILE CARD ── */}
      <div style={{
        background: 'linear-gradient(160deg, #0F1C3F 0%, #1a2f6b 100%)',
        padding: '52px 20px 24px',
        paddingTop: 'max(52px, calc(env(safe-area-inset-top) + 36px))',
      }}>
        <div
          onClick={() => { impact('light'); navigate('/profile'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '14px 16px',
            cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
          }}
          className="active:opacity-70 transition-opacity duration-75"
        >
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(201,168,76,0.3)',
            border: '2px solid rgba(201,168,76,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#C9A84C', fontWeight: 700, fontSize: 18, flexShrink: 0,
          }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontWeight: 600, fontSize: 17, margin: 0, letterSpacing: '-0.02em' }}>
              {user?.firstName} {user?.lastName}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '2px 0 0', textTransform: 'capitalize' }}>
              {user?.position || user?.role} · {org?.name}
            </p>
          </div>
          <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
        </div>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── ENGAGEMENT ── */}
        <IOSSection label="Engagement">
          <Row icon={Megaphone}    iconBg="#FF3B30" label="Announcements"   to="/announcements" />
          <Row icon={MessageSquare} iconBg="#007AFF" label="Channels"        to="/channels" badge="NEW" />
          <Row icon={Trophy}       iconBg="#FF9500" label="Leaderboard"      to="/leaderboard" />
          <Row icon={Vote}         iconBg="#5856D6" label="Polls"            to="/polls" />
        </IOSSection>

        {/* ── CHAPTER ── */}
        <IOSSection label="Chapter">
          <Row icon={Calendar}     iconBg="#AF52DE" label="Events"           to="/events" />
          <Row icon={ClipboardList} iconBg="#30B0C7" label="Attendance"      to="/attendance" />
          <Row icon={BookOpen}     iconBg="#34C759" label="Academics"        to="/academics" />
          <Row icon={FileText}     iconBg="#636366" label="Documents"        to="/documents" />
        </IOSSection>

        {/* ── OFFICER TOOLS (if officer+) ── */}
        {isOfficer && (
          <IOSSection label="Officer Tools">
            <Row icon={UserCheck}   iconBg="#FF9500" label="Rush Pipeline"    to="/recruitment" />
            <Row icon={Gavel}       iconBg="#FF3B30" label="Bid Voting"       to="/bid-voting" badge="NEW" />
            <Row icon={DollarSign}  iconBg="#34C759" label="Dues"             to="/dues" />
            <Row icon={Wallet}      iconBg="#30B0C7" label="Treasury"         to="/budget" />
            <Row icon={ShieldCheck} iconBg="#FF3B30" label="Risk Management"  to="/risk" />
            <Row icon={Building2}   iconBg="#5856D6" label="Sponsorships"     to="/sponsors" badge="NEW" />
            <Row icon={BarChart2}   iconBg="#007AFF" label="Analytics"        to="/analytics" />
            <Row icon={FileText}    iconBg="#636366" label="Reports"          to="/reports" />
            <Row icon={Upload}      iconBg="#8E8E93" label="Import Data"      to="/import" />
          </IOSSection>
        )}

        {/* ── ADMIN ── */}
        {isAdmin && (
          <IOSSection label="Admin">
            <Row icon={Users}   iconBg="#0F1C3F" label="Roles & Officers" to="/roles" />
            <Row icon={Shield}  iconBg="#0F1C3F" label="Billing & Plan"   to="/billing" />
          </IOSSection>
        )}

        {/* ── ACCOUNT ── */}
        <IOSSection label="Account">
          <Row icon={Settings}  iconBg="#636366" label="Settings"         to="/settings" />
          <Row icon={Key}       iconBg="#8E8E93" label="Change Password"  to="/change-password" />
          <IOSRow
            icon={<LogOut size={16} />}
            iconBg="#FF3B30"
            label="Sign Out"
            destructive
            onClick={() => {
              notification('warning');
              if (window.confirm('Sign out of ChapterOS?')) logout();
            }}
          />
        </IOSSection>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: 12,
          color: '#C7C7CC', marginBottom: 24, marginTop: -8,
          fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
          ChapterOS · {org?.plan === 'trial' ? 'Trial' : 'Pro'}
        </p>
      </div>
    </div>
  );
}
