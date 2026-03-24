import React, { useState, useEffect } from 'react';
import {
  Building2, Bell, Shield, AlertTriangle, Upload, Check, X,
  ChevronRight, Save, Trash2, Users, Plus, Edit2, Copy, RefreshCw, Link2
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const ACCENT_COLORS = [
  { name: 'Gold', value: '#C9A84C' },
  { name: 'Navy', value: '#0F1C3F' },
  { name: 'Crimson', value: '#DC2626' },
  { name: 'Forest', value: '#16A34A' },
  { name: 'Purple', value: '#7C3AED' },
  { name: 'Sky', value: '#0EA5E9' },
  { name: 'Orange', value: '#EA580C' },
  { name: 'Rose', value: '#E11D48' },
];

const OFFICER_ROLES = [
  'President', 'Vice President', 'Secretary', 'Treasurer',
  'Recruitment Chair', 'Social Chair', 'Philanthropy Chair',
  'Risk Manager', 'Alumni Relations', 'Sergeant at Arms',
];

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3 mb-5">
    <div className="w-9 h-9 bg-navy/8 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={16} className="text-navy" />
    </div>
    <div>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
    </div>
  </div>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-navy/30
      ${checked ? 'bg-navy' : 'bg-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    style={{ height: '22px', minWidth: '40px' }}
  >
    <span
      className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200
        ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
      style={{ width: '18px', height: '18px' }}
    />
  </button>
);

// Delete Chapter modal
const DeleteChapterModal = ({ isOpen, onClose }) => {
  const { org, logout } = useAuth();
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (confirm !== org?.name) { setError('Chapter name does not match.'); return; }
    setLoading(true);
    try {
      await client.delete('/orgs/current');
      logout();
    } catch { setError('Failed to delete chapter. Contact support.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Chapter" size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleDelete}
            disabled={loading || confirm !== org?.name}
          >
            {loading ? 'Deleting…' : <><Trash2 size={14} /> Delete forever</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">This action is permanent</p>
              <p className="text-sm text-red-700 mt-0.5">All members, events, dues records, and data will be permanently deleted. This cannot be undone.</p>
            </div>
          </div>
        </div>
        <div>
          <label className="label">Type <strong>{org?.name}</strong> to confirm</label>
          <input
            className="input-field"
            placeholder={org?.name}
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(''); }}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
};

function InviteCodeCard() {
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [regen, setRegen] = useState(false);

  const joinLink = code ? `https://chapteros.app/register?invite=${code}` : '';

  useEffect(() => {
    client.get('/orgs/current').then(r => setCode(r.data.data?.inviteCode));
  }, []);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    if (!joinLink) return;
    navigator.clipboard.writeText(joinLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const regenerate = async () => {
    if (!confirm('This will invalidate the current invite code. Anyone with the old code can no longer join. Continue?')) return;
    setRegen(true);
    try {
      // Try PATCH /invite-code first, fall back to POST /current/regenerate-invite
      let r;
      try {
        r = await client.patch('/orgs/invite-code');
      } catch {
        r = await client.post('/orgs/current/regenerate-invite');
      }
      setCode(r.data.data?.inviteCode || r.data.data?.inviteCode);
    } catch { /* empty */ }
    finally { setRegen(false); }
  };

  return (
    <div className="card p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-9 h-9 bg-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Link2 size={16} className="text-navy" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Chapter Invite Link</h2>
          <p className="text-sm text-gray-400">Share with brothers so they can join your chapter</p>
        </div>
      </div>

      {/* Invite code display */}
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Invite Code</label>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <span className="flex-1 text-center font-mono text-2xl font-black tracking-[0.3em] text-navy">
            {code || '········'}
          </span>
          <button onClick={copyCode}
            className={`p-2 rounded-lg transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'hover:bg-gray-200 text-gray-500'}`}
            title="Copy code">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Full join link */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Shareable Join Link</label>
        <div className="flex items-center gap-2 p-3 bg-navy/5 rounded-xl border border-navy/15">
          <span className="flex-1 text-xs font-mono text-navy/80 truncate">
            {joinLink || 'Loading…'}
          </span>
          <button onClick={copyLink}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
              linkCopied ? 'bg-emerald-100 text-emerald-700' : 'bg-navy text-white hover:bg-navy-light'
            }`}>
            {linkCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
          </button>
        </div>
      </div>

      {/* Regenerate */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400">
          Members enter this code at registration → "Join a chapter"
        </p>
        <button onClick={regenerate} disabled={regen}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition-colors">
          <RefreshCw size={12} className={regen ? 'animate-spin' : ''} />
          {regen ? 'Regenerating…' : 'Regenerate Code'}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, org, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Chapter profile state
  const [profile, setProfile] = useState({
    name: '', school: '', greekLetters: '', type: 'fraternity',
    chapterDesignation: '', accentColor: '#C9A84C',
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState({
    dueReminders: true,
    eventReminders: true,
    newMembers: true,
    pnmUpdates: true,
    weeklyDigest: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // Officers
  const [officers, setOfficers] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ memberId: '', role: '' });

  // Danger zone
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    if (org) {
      setProfile({
        name: org.name || '',
        school: org.school || '',
        greekLetters: org.greekLetters || '',
        type: org.type || 'fraternity',
        chapterDesignation: org.chapterDesignation || '',
        accentColor: org.accentColor || '#C9A84C',
      });
      if (org.logoUrl) setLogoPreview(org.logoUrl);
    }
  }, [org]);

  useEffect(() => {
    // Load officers and members
    Promise.all([
      client.get('/orgs/current/officers').catch(() => ({ data: { data: [] } })),
      client.get('/members').catch(() => ({ data: { data: [] } })),
    ]).then(([offRes, memRes]) => {
      setOfficers(offRes.data.data || []);
      setMembers(memRes.data.data || []);
    });
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const formData = new FormData();
      Object.entries(profile).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (logoFile) formData.append('logo', logoFile);
      await client.patch('/orgs/current', formData);
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch { /* empty */ }
    finally { setProfileSaving(false); }
  };

  const saveNotifications = async (key, value) => {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    setNotifSaving(true);
    try { await client.patch('/auth/me/notifications', updated); }
    catch { setNotifications(notifications); }
    finally { setNotifSaving(false); }
  };

  const addOfficer = async () => {
    if (!newOfficer.memberId || !newOfficer.role) return;
    try {
      const res = await client.post('/orgs/current/officers', newOfficer);
      if (res.data.success) {
        setOfficers(prev => [...prev, res.data.data]);
        setShowAddOfficer(false);
        setNewOfficer({ memberId: '', role: '' });
      }
    } catch { /* empty */ }
  };

  const removeOfficer = async (officerId) => {
    try {
      await client.delete(`/orgs/current/officers/${officerId}`);
      setOfficers(prev => prev.filter(o => o.id !== officerId));
    } catch { /* empty */ }
  };

  const updateProfile = (k, v) => setProfile(f => ({ ...f, [k]: v }));

  const NOTIF_LABELS = {
    dueReminders: 'Dues reminders sent to members',
    eventReminders: 'Event reminders 24h before',
    newMembers: 'New member joined chapter',
    pnmUpdates: 'PNM stage changes',
    weeklyDigest: 'Weekly chapter digest',
  };

  return (
    <div className="max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your chapter configuration and preferences</p>
      </div>

      <div className="space-y-8">
        {/* Chapter Profile */}
        <div className="card p-6">
          <SectionHeader icon={Building2} title="Chapter Profile" description="Basic information about your organization" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Organization name</label>
                <input className="input-field" value={profile.name} onChange={e => updateProfile('name', e.target.value)} disabled={!isAdmin} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">School</label>
                <input className="input-field" value={profile.school} onChange={e => updateProfile('school', e.target.value)} disabled={!isAdmin} />
              </div>
              <div>
                <label className="label">Greek letters</label>
                <input className="input-field font-serif text-lg" value={profile.greekLetters} onChange={e => updateProfile('greekLetters', e.target.value)} disabled={!isAdmin} />
              </div>
              <div>
                <label className="label">Chapter designation</label>
                <input className="input-field" placeholder="Gamma Chapter" value={profile.chapterDesignation} onChange={e => updateProfile('chapterDesignation', e.target.value)} disabled={!isAdmin} />
              </div>
            </div>

            {isAdmin && (
              <>
                {/* Logo upload */}
                <div>
                  <label className="label">Chapter logo</label>
                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200">
                        <Upload size={20} className="text-gray-400" />
                      </div>
                    )}
                    <label htmlFor="settingsLogo" className="btn-secondary cursor-pointer">
                      <Upload size={14} /> {logoPreview ? 'Change' : 'Upload'}
                      <input id="settingsLogo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                  </div>
                </div>

                {/* Accent color */}
                <div>
                  <label className="label">Accent color</label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {ACCENT_COLORS.map(({ name, value }) => (
                      <button key={value} type="button" onClick={() => updateProfile('accentColor', value)} title={name}
                        className={`relative w-8 h-8 rounded-lg transition-all border-2 ${profile.accentColor === value ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent'}`}
                        style={{ backgroundColor: value }}>
                        {profile.accentColor === value && <Check size={12} className="absolute inset-0 m-auto text-white drop-shadow" />}
                      </button>
                    ))}
                    <input type="color" value={profile.accentColor} onChange={e => updateProfile('accentColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200" />
                  </div>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {profileSaved ? <><Check size={15} /> Saved!</> : profileSaving ? 'Saving…' : <><Save size={15} /> Save changes</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <SectionHeader icon={Bell} title="Notifications" description="Configure which emails you receive" />
          <div className="space-y-1">
            {Object.entries(NOTIF_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                </div>
                <Toggle
                  checked={notifications[key]}
                  onChange={(val) => saveNotifications(key, val)}
                  disabled={notifSaving}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Officers */}
        {isAdmin && (
          <div className="card p-6">
            <div className="flex items-start justify-between mb-5">
              <SectionHeader icon={Shield} title="Officers" description="Manage chapter officer assignments" />
              <button className="btn-secondary ml-4" onClick={() => setShowAddOfficer(true)}>
                <Plus size={14} /> Add
              </button>
            </div>

            {showAddOfficer && (
              <div className="flex gap-3 mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-slide-up">
                <select className="select-field flex-1" value={newOfficer.memberId} onChange={e => setNewOfficer(f => ({ ...f, memberId: e.target.value }))}>
                  <option value="">Select member…</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                </select>
                <select className="select-field flex-1" value={newOfficer.role} onChange={e => setNewOfficer(f => ({ ...f, role: e.target.value }))}>
                  <option value="">Select role…</option>
                  {OFFICER_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
                <button onClick={addOfficer} className="btn-primary px-3"><Check size={14} /></button>
                <button onClick={() => setShowAddOfficer(false)} className="btn-secondary px-3"><X size={14} /></button>
              </div>
            )}

            {officers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No officers assigned yet</p>
            ) : (
              <div className="space-y-1">
                {officers.map(o => (
                  <div key={o.id} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{o.memberName}</p>
                      <p className="text-xs text-gray-500">{o.role}</p>
                    </div>
                    <button onClick={() => removeOfficer(o.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invite Code */}
        {isAdmin && <InviteCodeCard />}

        {/* Danger Zone */}
        {isAdmin && (
          <div className="card p-6 border-red-200">
            <SectionHeader icon={AlertTriangle} title="Danger Zone" description="Irreversible and destructive actions" />
            <div className="p-4 border border-red-200 rounded-xl bg-red-50/50">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Delete this chapter</p>
                  <p className="text-sm text-gray-500 mt-0.5">Permanently delete the chapter and all associated data. Cannot be undone.</p>
                </div>
                <button
                  onClick={() => setShowDelete(true)}
                  className="btn-danger whitespace-nowrap flex-shrink-0"
                >
                  <Trash2 size={14} /> Delete chapter
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteChapterModal isOpen={showDelete} onClose={() => setShowDelete(false)} />
    </div>
  );
}
