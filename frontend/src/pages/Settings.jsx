import React, { useState, useEffect } from 'react';
import {
  Building2, Bell, Shield, AlertTriangle, Upload, Check, X,
  ChevronRight, Save, Trash2, Users, Plus, Edit2, Copy, RefreshCw, Link2
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 8, color: T.text1, padding: '10px 14px', outline: 'none', width: '100%',
  fontSize: 13, boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, color: T.text2,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};

const cardStyle = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)', padding: '24px',
};

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: T.accent, color: '#fff', border: 'none', borderRadius: 8,
  padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
  boxShadow: '0 0 20px rgba(79,142,247,0.2)', transition: 'opacity 0.15s',
};

const secondaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  background: 'rgba(255,255,255,0.06)', color: T.text2,
  border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8,
  padding: '8px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 13,
};

const ACCENT_COLORS = [
  { name: 'Gold',    value: '#C9A84C' },
  { name: 'Navy',    value: '#0F1C3F' },
  { name: 'Crimson', value: '#DC2626' },
  { name: 'Forest',  value: '#16A34A' },
  { name: 'Purple',  value: '#7C3AED' },
  { name: 'Sky',     value: '#0EA5E9' },
  { name: 'Orange',  value: '#EA580C' },
  { name: 'Rose',    value: '#E11D48' },
];

const OFFICER_ROLES = [
  'President', 'Vice President', 'Secretary', 'Treasurer',
  'Recruitment Chair', 'Social Chair', 'Philanthropy Chair',
  'Risk Manager', 'Alumni Relations', 'Sergeant at Arms',
];

const SectionHeader = ({ icon: Icon, title, description }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: 'rgba(79,142,247,0.1)', border: `1px solid rgba(79,142,247,0.15)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={16} style={{ color: T.accent }} />
    </div>
    <div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: T.text1, margin: '0 0 3px' }}>{title}</h2>
      {description && <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>{description}</p>}
    </div>
  </div>
);

const Toggle = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => !disabled && onChange(!checked)}
    style={{
      position: 'relative', width: 40, height: 22, borderRadius: 99,
      background: checked ? T.accent : 'rgba(255,255,255,0.08)',
      border: `1px solid ${checked ? 'transparent' : T.border}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'background 0.2s, border-color 0.2s',
      flexShrink: 0, outline: 'none',
      boxShadow: checked ? '0 0 12px rgba(79,142,247,0.3)' : 'none',
    }}
  >
    <span style={{
      position: 'absolute', top: 2, left: checked ? 20 : 2,
      width: 16, height: 16, borderRadius: '50%', background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
      transition: 'left 0.2s',
    }} />
  </button>
);

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
          <button style={secondaryBtn} onClick={onClose}>Cancel</button>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(248,113,113,0.15)', color: T.danger,
              border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8,
              padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
              opacity: (loading || confirm !== org?.name) ? 0.5 : 1,
            }}
            onClick={handleDelete}
            disabled={loading || confirm !== org?.name}
          >
            {loading ? 'Deleting…' : <><Trash2 size={14} /> Delete forever</>}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          padding: '12px 14px', background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.25)', borderRadius: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertTriangle size={15} style={{ color: T.danger, marginTop: 1, flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.danger, margin: '0 0 4px' }}>This action is permanent</p>
              <p style={{ fontSize: 13, color: 'rgba(248,113,113,0.7)', margin: 0 }}>All members, events, dues records, and data will be permanently deleted. This cannot be undone.</p>
            </div>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Type <strong style={{ color: T.text1 }}>{org?.name}</strong> to confirm</label>
          <input
            style={inputStyle}
            placeholder={org?.name}
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError(''); }}
          />
        </div>
        {error && <p style={{ fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>}
      </div>
    </Modal>
  );
};

function InviteCodeCard() {
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [regen, setRegen] = useState(false);

  const joinLink = code ? `${window.location.origin}/register?invite=${code}` : '';

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
    <div style={cardStyle}>
      <SectionHeader icon={Link2} title="Chapter Invite Link" description="Share with brothers so they can join your chapter" />

      {/* Invite code display */}
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Invite Code</label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
          background: T.elevated, borderRadius: 10, border: `1px solid ${T.border}`,
        }}>
          <span style={{
            flex: 1, textAlign: 'center', fontFamily: 'monospace',
            fontSize: 24, fontWeight: 800, letterSpacing: '0.3em', color: T.text1,
          }}>
            {code || '········'}
          </span>
          <button
            onClick={copyCode}
            style={{
              padding: '7px', borderRadius: 8, cursor: 'pointer',
              background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)',
              color: copied ? T.success : T.text2,
              border: `1px solid ${copied ? 'rgba(52,211,153,0.25)' : T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            title="Copy code"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Full join link */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Shareable Join Link</label>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(79,142,247,0.06)', borderRadius: 10, border: `1px solid rgba(79,142,247,0.15)`,
        }}>
          <span style={{ flex: 1, fontSize: 12, fontFamily: 'monospace', color: 'rgba(79,142,247,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {joinLink || 'Loading…'}
          </span>
          <button
            onClick={copyLink}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px',
              borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              background: linkCopied ? 'rgba(52,211,153,0.12)' : T.accent,
              color: linkCopied ? T.success : '#fff',
              border: `1px solid ${linkCopied ? 'rgba(52,211,153,0.25)' : 'transparent'}`,
              transition: 'all 0.15s',
            }}
          >
            {linkCopied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy Link</>}
          </button>
        </div>
      </div>

      {/* Regenerate */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
        <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>
          Members enter this code at registration → "Join a chapter"
        </p>
        <button
          onClick={regenerate}
          disabled={regen}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            color: regen ? T.text3 : T.text2, cursor: regen ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
            transition: 'all 0.15s',
          }}
        >
          <RefreshCw size={12} style={{ animation: regen ? 'spin 1s linear infinite' : 'none' }} />
          {regen ? 'Regenerating…' : 'Regenerate Code'}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, org, refreshUser } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [profile, setProfile] = useState({
    name: '', school: '', greekLetters: '', type: 'fraternity',
    chapterDesignation: '', accentColor: '#C9A84C',
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    dueReminders: true,
    eventReminders: true,
    newMembers: true,
    pnmUpdates: true,
    weeklyDigest: false,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  const [officers, setOfficers] = useState([]);
  const [members, setMembers] = useState([]);
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ memberId: '', role: '' });

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
      const res = await client.post('/orgs/current/officers', {
        memberId: newOfficer.memberId,
        role: 'officer',
        position: newOfficer.role,
      });
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
    dueReminders:   'Dues reminders sent to members',
    eventReminders: 'Event reminders 24h before',
    newMembers:     'New member joined chapter',
    pnmUpdates:     'PNM stage changes',
    weeklyDigest:   'Weekly chapter digest',
  };

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.text1, margin: '0 0 6px' }}>Settings</h1>
          <p style={{ fontSize: 14, color: T.text2, margin: 0 }}>Manage your chapter configuration and preferences</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Chapter Profile */}
          <div style={cardStyle}>
            <SectionHeader icon={Building2} title="Chapter Profile" description="Basic information about your organization" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Organization name</label>
                  <input style={{ ...inputStyle, opacity: !isAdmin ? 0.5 : 1 }} value={profile.name} onChange={e => updateProfile('name', e.target.value)} disabled={!isAdmin} />
                </div>
                <div>
                  <label style={labelStyle}>School</label>
                  <input style={{ ...inputStyle, opacity: !isAdmin ? 0.5 : 1 }} value={profile.school} onChange={e => updateProfile('school', e.target.value)} disabled={!isAdmin} />
                </div>
                <div>
                  <label style={labelStyle}>Greek letters</label>
                  <input style={{ ...inputStyle, fontFamily: 'serif', fontSize: 17, opacity: !isAdmin ? 0.5 : 1 }} value={profile.greekLetters} onChange={e => updateProfile('greekLetters', e.target.value)} disabled={!isAdmin} />
                </div>
                <div>
                  <label style={labelStyle}>Chapter designation</label>
                  <input style={{ ...inputStyle, opacity: !isAdmin ? 0.5 : 1 }} placeholder="Gamma Chapter" value={profile.chapterDesignation} onChange={e => updateProfile('chapterDesignation', e.target.value)} disabled={!isAdmin} />
                </div>
              </div>

              {isAdmin && (
                <>
                  {/* Logo upload */}
                  <div>
                    <label style={labelStyle}>Chapter logo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', border: `1px solid ${T.border}` }} />
                      ) : (
                        <div style={{
                          width: 56, height: 56, borderRadius: 12,
                          background: T.elevated, border: `2px dashed ${T.borderStrong}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Upload size={20} style={{ color: T.text3 }} />
                        </div>
                      )}
                      <label htmlFor="settingsLogo" style={{ ...secondaryBtn, cursor: 'pointer' }}>
                        <Upload size={14} /> {logoPreview ? 'Change' : 'Upload'}
                        <input id="settingsLogo" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                      </label>
                    </div>
                  </div>

                  {/* Accent color */}
                  <div>
                    <label style={labelStyle}>Accent color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {ACCENT_COLORS.map(({ name, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateProfile('accentColor', value)}
                          title={name}
                          style={{
                            width: 32, height: 32, borderRadius: 8,
                            backgroundColor: value, cursor: 'pointer',
                            border: profile.accentColor === value
                              ? `2px solid ${T.text1}`
                              : `2px solid transparent`,
                            transform: profile.accentColor === value ? 'scale(1.15)' : 'scale(1)',
                            transition: 'all 0.15s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: profile.accentColor === value ? '0 0 12px rgba(255,255,255,0.2)' : 'none',
                          }}
                        >
                          {profile.accentColor === value && <Check size={12} style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }} />}
                        </button>
                      ))}
                      <input
                        type="color"
                        value={profile.accentColor}
                        onChange={e => updateProfile('accentColor', e.target.value)}
                        style={{ width: 32, height: 32, borderRadius: 8, cursor: 'pointer', border: `2px solid ${T.border}`, background: 'transparent' }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={saveProfile}
                    disabled={profileSaving}
                    style={{
                      ...primaryBtn,
                      opacity: profileSaving ? 0.6 : 1,
                      cursor: profileSaving ? 'not-allowed' : 'pointer',
                      background: profileSaved ? 'rgba(52,211,153,0.15)' : T.accent,
                      color: profileSaved ? T.success : '#fff',
                      border: profileSaved ? '1px solid rgba(52,211,153,0.3)' : 'none',
                      boxShadow: profileSaved ? 'none' : '0 0 20px rgba(79,142,247,0.2)',
                    }}
                  >
                    {profileSaved ? <><Check size={15} /> Saved!</> : profileSaving ? 'Saving…' : <><Save size={15} /> Save changes</>}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications */}
          <div style={cardStyle}>
            <SectionHeader icon={Bell} title="Notifications" description="Configure which emails you receive" />
            <div>
              {Object.entries(NOTIF_LABELS).map(([key, label], idx, arr) => (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: idx < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: T.text1, margin: 0 }}>{label}</p>
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
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <SectionHeader icon={Shield} title="Officers" description="Manage chapter officer assignments" />
                <button style={{ ...secondaryBtn, marginLeft: 16 }} onClick={() => setShowAddOfficer(true)}>
                  <Plus size={14} /> Add
                </button>
              </div>

              {showAddOfficer && (
                <div style={{
                  display: 'flex', gap: 10, marginBottom: 16, padding: '14px 16px',
                  background: T.elevated, borderRadius: 10, border: `1px solid ${T.border}`,
                }}>
                  <select style={{ ...inputStyle, flex: 1 }} value={newOfficer.memberId} onChange={e => setNewOfficer(f => ({ ...f, memberId: e.target.value }))}>
                    <option value="">Select member…</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>)}
                  </select>
                  <select style={{ ...inputStyle, flex: 1 }} value={newOfficer.role} onChange={e => setNewOfficer(f => ({ ...f, role: e.target.value }))}>
                    <option value="">Select role…</option>
                    {OFFICER_ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                  <button onClick={addOfficer} style={{ ...primaryBtn, padding: '8px 12px' }}><Check size={14} /></button>
                  <button onClick={() => setShowAddOfficer(false)} style={{ ...secondaryBtn, padding: '8px 12px' }}><X size={14} /></button>
                </div>
              )}

              {officers.length === 0 ? (
                <p style={{ fontSize: 13, color: T.text3, textAlign: 'center', padding: '24px 0', margin: 0 }}>No officers assigned yet</p>
              ) : (
                <div>
                  {officers.map((o, idx) => (
                    <div key={o.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: idx < officers.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                        }}>
                          {(o.firstName?.[0] || '').toUpperCase()}{(o.lastName?.[0] || '').toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: '0 0 2px' }}>{o.firstName} {o.lastName}</p>
                          <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>{o.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeOfficer(o.id)}
                        style={{
                          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: T.text3, background: 'transparent', border: 'none', cursor: 'pointer',
                          borderRadius: 8, transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = T.danger; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
                      >
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
            <div style={{ ...cardStyle, border: '1px solid rgba(248,113,113,0.2)' }}>
              <SectionHeader icon={AlertTriangle} title="Danger Zone" description="Irreversible and destructive actions" />
              <div style={{
                padding: '16px', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 10, background: 'rgba(248,113,113,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.text1, margin: '0 0 4px' }}>Delete this chapter</p>
                    <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>Permanently delete the chapter and all associated data. Cannot be undone.</p>
                  </div>
                  <button
                    onClick={() => setShowDelete(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'rgba(248,113,113,0.15)', color: T.danger,
                      border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8,
                      padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                      whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s',
                    }}
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
    </div>
  );
}
