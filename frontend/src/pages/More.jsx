import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import {
  Megaphone, Trophy, BarChart2, DollarSign, ShieldCheck,
  Star, FileText, Settings, CreditCard, ChevronRight,
  Users, Gavel, Bell, BellOff, LogOut, Vote, Upload,
  BookOpen, Shield, MessageSquare, Calendar, Key
} from 'lucide-react';

const Section = ({ title, children }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">{title}</p>
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
      {children}
    </div>
  </div>
);

const NavRow = ({ icon: Icon, label, sub, to, color = 'bg-gray-100', iconColor = 'text-gray-600', badge, onClick }) => {
  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}>
      <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={17} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {badge && <span className="bg-navy text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{badge}</span>}
      {!onClick && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
};

export default function More() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { subscribed, permission, loading, subscribe, unsubscribe } = usePushNotifications();
  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const AVATAR_COLORS = ['#0F1C3F','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444'];
  const color = AVATAR_COLORS[(user?.firstName?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-5 pb-4">

      {/* Profile card */}
      <Link to="/profile">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-lg flex-shrink-0"
            style={{ background: color }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-400">{user?.position || user?.role}</p>
            <p className="text-xs text-navy font-semibold mt-0.5">View & edit profile →</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </div>
      </Link>

      {/* Chapter */}
      <Section title="Chapter">
        <NavRow icon={Megaphone}   label="Announcements"   to="/announcements"  color="bg-red-100"     iconColor="text-red-600" />
        <NavRow icon={MessageSquare} label="Channels"      to="/channels"       color="bg-blue-100"    iconColor="text-blue-600" />
        <NavRow icon={Calendar}    label="Events"          to="/events"         color="bg-purple-100"  iconColor="text-purple-600" />
        <NavRow icon={Trophy}      label="Leaderboard"     to="/leaderboard"    color="bg-amber-100"   iconColor="text-amber-600" />
        <NavRow icon={Vote}        label="Polls"           to="/polls"          color="bg-indigo-100"  iconColor="text-indigo-600" />
      </Section>

      {/* Recruitment */}
      <Section title="Recruitment">
        <NavRow icon={Star}        label="Rush Pipeline"   to="/recruitment"    color="bg-amber-100"   iconColor="text-amber-600" />
        <NavRow icon={Gavel}       label="Bid Voting"      to="/bid-voting"     color="bg-orange-100"  iconColor="text-orange-600" />
      </Section>

      {isAdmin && (
        <Section title="Manage">
          <NavRow icon={Shield}    label="Roles & Officers" to="/roles"         color="bg-navy/10"     iconColor="text-navy" />
          <NavRow icon={DollarSign} label="Dues"            to="/dues"          color="bg-emerald-100" iconColor="text-emerald-600" />
          <NavRow icon={BarChart2} label="Budget"           to="/budget"        color="bg-teal-100"    iconColor="text-teal-600" />
          <NavRow icon={ShieldCheck} label="Risk Management" to="/risk"         color="bg-red-100"     iconColor="text-red-600" />
          <NavRow icon={Upload}    label="Import Data"      to="/import"        color="bg-blue-100"    iconColor="text-blue-600" />
          <NavRow icon={FileText}  label="Reports"          to="/reports"       color="bg-gray-100"    iconColor="text-gray-600" />
          <NavRow icon={BarChart2} label="Analytics"        to="/analytics"     color="bg-purple-100"  iconColor="text-purple-600" />
        </Section>
      )}

      {/* Notifications */}
      <Section title="Notifications">
        <NavRow
          icon={subscribed ? BellOff : Bell}
          label={subscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
          sub={permission === 'denied' ? 'Blocked in browser settings' : subscribed ? 'Tap to turn off' : 'Get alerts for announcements & dues'}
          color={subscribed ? 'bg-gray-100' : 'bg-blue-100'}
          iconColor={subscribed ? 'text-gray-500' : 'text-blue-600'}
          onClick={loading ? null : subscribed ? unsubscribe : subscribe}
        />
      </Section>

      {/* Account */}
      <Section title="Account">
        <NavRow icon={Settings}    label="Settings"         to="/settings"      color="bg-gray-100"    iconColor="text-gray-600" />
        <NavRow icon={Key}         label="Change Password"  to="/change-password" color="bg-blue-100"  iconColor="text-blue-600" />
        {isAdmin && <NavRow icon={CreditCard} label="Billing & Plan" to="/billing" color="bg-emerald-100" iconColor="text-emerald-600" />}
        <NavRow
          icon={LogOut}
          label="Sign Out"
          color="bg-red-50"
          iconColor="text-red-500"
          onClick={() => { logout(); navigate('/login'); }}
        />
      </Section>

      <p className="text-center text-xs text-gray-300 pb-2">ChapterHQ · Built for Greek life</p>
    </div>
  );
}
