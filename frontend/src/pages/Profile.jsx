import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, BookOpen, GraduationCap, Calendar,
  Shield, Edit3, Check, X, LogOut, Key, ChevronRight, Camera
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['#0F1C3F','#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4'];

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName:  user?.lastName  || '',
    phone:     user?.phone     || '',
    major:     user?.major     || '',
    year:      user?.year      || '',
    gpa:       user?.gpa       || '',
    linkedin:  user?.linkedin  || '',
    hometown:  user?.hometown  || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const color = AVATAR_COLORS[(user?.firstName?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();

  const ROLE_LABELS = { admin: 'President / Admin', officer: 'Officer', member: 'Member', pledge: 'Pledge', alumni: 'Alumni' };

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await client.put(`/members/${user.id}`, form);
      if (!res.data.success) throw new Error(res.data.error);
      updateUser?.(res.data.data);
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="max-w-lg mx-auto space-y-4 pb-4">

      {/* Hero card */}
      <div className="relative rounded-3xl overflow-hidden -mx-4 lg:mx-0 lg:rounded-3xl"
        style={{ background: 'linear-gradient(135deg, #0F1C3F 0%, #1a2f6e 100%)' }}>
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="relative p-6 pb-8 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-extrabold shadow-lg"
              style={{ background: color }}>
              {initials}
            </div>
          </div>
          <h1 className="text-white text-xl font-extrabold">{user?.firstName} {user?.lastName}</h1>
          {user?.position && <p className="text-gold text-sm font-semibold mt-0.5">{user.position}</p>}
          <p className="text-white/40 text-xs mt-1">{ROLE_LABELS[user?.role] || user?.role} · {user?.org?.name}</p>

          {saved && (
            <div className="mt-3 flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-sm px-3 py-1.5 rounded-full">
              <Check size={13} /> Saved
            </div>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <p className="font-bold text-gray-900 text-sm">My Info</p>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-navy text-sm font-semibold">
              <Edit3 size={13} /> Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); setError(''); }}
                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={14} /></button>
              <button onClick={save} disabled={saving}
                className="flex items-center gap-1 bg-navy text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                <Check size={12} /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-xs text-red-500 px-5 py-2 bg-red-50">{error}</p>}

        {editing ? (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First Name</label>
                <input className="input-field" value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} /></div>
              <div><label className="label">Last Name</label>
                <input className="input-field" value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} /></div>
            </div>
            <div><label className="label">Phone</label>
              <input type="tel" className="input-field w-full" placeholder="(555) 000-0000" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Major</label>
                <input className="input-field" placeholder="Finance" value={form.major} onChange={e => setForm(f => ({...f, major: e.target.value}))} /></div>
              <div><label className="label">GPA</label>
                <input type="number" step="0.01" min="0" max="4" className="input-field" placeholder="3.5" value={form.gpa} onChange={e => setForm(f => ({...f, gpa: e.target.value}))} /></div>
            </div>
            <div><label className="label">Year / Class Standing</label>
              <select className="select-field w-full" value={form.year} onChange={e => setForm(f => ({...f, year: e.target.value}))}>
                <option value="">Select year</option>
                {['Freshman','Sophomore','Junior','Senior','Graduate'].map(y => <option key={y} value={y}>{y}</option>)}
              </select></div>
            <div><label className="label">Hometown</label>
              <input className="input-field w-full" placeholder="New York, NY" value={form.hometown} onChange={e => setForm(f => ({...f, hometown: e.target.value}))} /></div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[
              { icon: Mail, label: 'Email', value: user?.email },
              { icon: Phone, label: 'Phone', value: user?.phone || 'Not set' },
              { icon: BookOpen, label: 'Major', value: user?.major || 'Not set' },
              { icon: GraduationCap, label: 'GPA', value: user?.gpa || 'Not set' },
              { icon: Calendar, label: 'Year', value: user?.year || 'Not set' },
              { icon: Calendar, label: 'Pledge Class', value: user?.pledgeClass || 'Not set' },
              { icon: Shield, label: 'Role', value: ROLE_LABELS[user?.role] || user?.role },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5">
                <Icon size={15} className="text-gray-300 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button onClick={() => navigate('/change-password')}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50">
          <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Key size={14} className="text-blue-600" />
          </div>
          <span className="flex-1 text-sm font-semibold text-gray-900 text-left">Change Password</span>
          <ChevronRight size={14} className="text-gray-300" />
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 active:bg-red-100 transition-colors">
          <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <LogOut size={14} className="text-red-500" />
          </div>
          <span className="flex-1 text-sm font-semibold text-red-500 text-left">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
