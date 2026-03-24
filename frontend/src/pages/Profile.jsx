import React, { useState, useEffect } from 'react';
import { Phone, Save, CheckCircle2, Trophy, BookOpen, ClipboardList, Clock, ChevronRight } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLE_CONFIG = {
  admin: { label: 'Admin', cls: 'bg-red-100 text-red-700 border-red-200' },
  officer: { label: 'Officer', cls: 'bg-gold/15 text-gold-dark border-gold/30' },
  member: { label: 'Member', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  alumni: { label: 'Alumni', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const AVATAR_COLORS = [
  'from-navy to-blue-700',
  'from-purple-600 to-purple-800',
  'from-emerald-600 to-teal-700',
  'from-orange-500 to-orange-700',
];

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', major: '', year: '', pledgeClass: '', position: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    client.get('/auth/me').then(res => {
      const m = res.data.data;
      setForm({
        firstName: m.firstName || '',
        lastName: m.lastName || '',
        phone: m.phone || '',
        major: m.major || '',
        year: m.year || '',
        pledgeClass: m.pledgeClass || '',
        position: m.position || '',
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.patch(`/members/${user.id}`, form);
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
      if (refreshUser) refreshUser();
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || '?';
  const avatarGradient = AVATAR_COLORS[(user?.firstName?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const roleCfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.member;

  if (loading) return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="card h-48 skeleton" />
      <div className="card h-32 skeleton" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">

      {/* Hero Card */}
      <div className="card overflow-hidden mb-4">
        {/* Navy gradient header */}
        <div className="gradient-hero h-24 relative" />

        {/* Avatar + info */}
        <div className="px-5 pb-5">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-2xl font-extrabold shadow-lg border-4 border-white`}>
              {initials}
            </div>
            <button onClick={() => setEditMode(e => !e)}
              className={`btn-secondary text-xs h-8 min-h-0 px-3 ${editMode ? 'bg-navy text-white border-navy' : ''}`}>
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <h1 className="text-xl font-extrabold text-gray-900">{form.firstName} {form.lastName}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`badge border ${roleCfg.cls} capitalize`}>{roleCfg.label}</span>
            {form.position && <span className="text-sm text-gray-500">{form.position}</span>}
            {form.pledgeClass && <span className="text-xs text-gray-400">{form.pledgeClass}</span>}
          </div>
          <p className="text-sm text-gray-400 mt-1">{user?.email}</p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 border-t border-gray-50">
          {[
            { icon: Trophy, value: user?.points ?? 0, label: 'Points', color: 'text-gold-dark' },
            { icon: BookOpen, value: user?.gpa?.toFixed(2) ?? '—', label: 'GPA', color: 'text-blue-500' },
            { icon: ClipboardList, value: user?.studyHours ?? 0, label: 'Study Hrs', color: 'text-emerald-500' },
          ].map(({ icon: Icon, value, label, color }, i) => (
            <div key={label} className={`py-4 flex flex-col items-center gap-1 ${i < 2 ? 'border-r border-gray-50' : ''}`}>
              <Icon size={16} className={color} />
              <p className="text-lg font-extrabold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phone nudge */}
      {!form.phone && !editMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3 cursor-pointer active:scale-98 transition-transform" onClick={() => setEditMode(true)}>
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Phone size={18} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Add your phone number</p>
            <p className="text-xs text-amber-700 mt-0.5">Get SMS dues reminders from your chapter</p>
          </div>
          <ChevronRight size={16} className="text-amber-400" />
        </div>
      )}

      {/* Edit Form */}
      {editMode && (
        <div className="card p-5 mb-4 animate-slide-up">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Edit Profile</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input className="input-field" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input className="input-field" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Phone size={12} className="text-gray-400" /> Phone
                <span className="font-normal text-emerald-600 text-xs">(SMS reminders)</span>
              </label>
              <input className="input-field" type="tel" placeholder="555-867-5309"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Major</label>
                <input className="input-field" placeholder="Finance"
                  value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))} />
              </div>
              <div>
                <label className="label">Year</label>
                <select className="select-field" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                  <option value="">Select…</option>
                  {['Freshman','Sophomore','Junior','Senior','Graduate','Alumni'].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Pledge Class</label>
                <input className="input-field" placeholder="Fall 2023"
                  value={form.pledgeClass} onChange={e => setForm(f => ({ ...f, pledgeClass: e.target.value }))} />
              </div>
              <div>
                <label className="label">Position / Title</label>
                <input className="input-field" placeholder="Rush Chair"
                  value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
              </div>
            </div>

            <button type="submit" disabled={saving} className="btn-navy w-full justify-center">
              {saved ? <><CheckCircle2 size={15} /> Saved!</> : saving ? 'Saving…' : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </div>
      )}

      {/* Info display when not editing */}
      {!editMode && (
        <div className="card divide-y divide-gray-50">
          {[
            { label: 'Phone', value: form.phone || 'Not set', muted: !form.phone },
            { label: 'Major', value: form.major || '—', muted: !form.major },
            { label: 'Year', value: form.year || '—', muted: !form.year },
            { label: 'Pledge Class', value: form.pledgeClass || '—', muted: !form.pledgeClass },
            { label: 'Position', value: form.position || '—', muted: !form.position },
          ].map(({ label, value, muted }) => (
            <div key={label} className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm text-gray-500">{label}</span>
              <span className={`text-sm font-medium ${muted ? 'text-gray-300' : 'text-gray-900'}`}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
