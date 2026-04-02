import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, LayoutGrid, List, X, Mail, Phone,
  GraduationCap, Calendar, Shield, Star, BookOpen, Check,
  Edit2, Send, ChevronRight
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = ['admin', 'officer', 'member', 'alumni', 'pledge'];
const ROLE_CONFIG = {
  admin: { label: 'Admin', classes: 'badge-gold' },
  officer: { label: 'Officer', classes: 'badge-navy' },
  member: { label: 'Member', classes: 'badge-gray' },
  alumni: { label: 'Alumni', classes: 'badge-purple' },
  pledge: { label: 'Pledge', classes: 'badge-blue' },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  return <span className={cfg.classes + ' capitalize'}>{cfg.label}</span>;
};

const avatarColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500'];

const initials = (firstName, lastName) => `${(firstName || ' ')[0]}${(lastName || ' ')[0]}`.toUpperCase();
const avatarColor = (name) => avatarColors[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % avatarColors.length];

// Add Member Modal
const AddMemberModal = ({ isOpen, onClose, onSave }) => {
  const [mode, setMode] = useState('invite');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'member', pledgeClass: '', position: '', phone: '', major: '', gpa: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleInvite = async () => {
    // Invite requires full name — use manual add instead
    if (!form.firstName || !form.lastName) { setError('First and last name are required.'); return; }
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) { setError('Enter a valid email.'); return; }
    setLoading(true);
    try {
      const res = await client.post('/members', form);
      if (res.data.success) { onSave(res.data.data); onClose(); }
      else setError(res.data.error || 'Failed to add member');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.firstName || !form.lastName || !form.email) { setError('Name and email are required.'); return; }
    setLoading(true);
    try {
      const res = await client.post('/members', form);
      if (res.data.success) { onSave(res.data.data); onClose(); }
      else setError(res.data.error || 'Failed to add member');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member" size="md"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={mode === 'invite' ? handleInvite : handleAdd} disabled={loading}>
            {loading ? 'Saving…' : mode === 'invite' ? 'Send Invite' : 'Add Member'}
          </button>
        </>
      }
    >
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {['invite', 'manual'].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {m === 'invite' ? 'Invite by Email' : 'Add Manually'}
          </button>
        ))}
      </div>

      {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-5 text-sm text-red-700"><X size={14} />{error}</div>}
      {success && <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-5 text-sm text-emerald-700"><Check size={14} />{success}</div>}

      {mode === 'invite' ? (
        <div className="space-y-2">
          <label className="label">Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="email" className="input-field pl-10" placeholder="member@chapter.edu" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoFocus />
          </div>
          <p className="text-xs text-gray-400 mt-2">They'll receive a link to create their account.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First name *</label>
              <input className="input-field" placeholder="Jane" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
            </div>
            <div>
              <label className="label">Last name *</label>
              <input className="input-field" placeholder="Smith" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Email *</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="email" className="input-field pl-10" value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="select-field" value={form.role} onChange={e => update('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Pledge class</label>
              <input className="input-field" placeholder="Fall 2023" value={form.pledgeClass} onChange={e => update('pledgeClass', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input-field" value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">GPA</label>
              <input type="number" step="0.01" min="0" max="4" className="input-field" placeholder="3.50" value={form.gpa} onChange={e => update('gpa', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// Member Profile Modal
const MemberProfileModal = ({ member, isOpen, onClose, onUpdate, isAdmin }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (member) {
      setForm({ ...member });
      setEditing(false);
      setTab('info');
    }
  }, [member]);

  if (!member) return null;
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await client.patch(`/members/${member.id}`, form);
      if (res.data.success) { onUpdate(res.data.data); setEditing(false); }
    } catch { /* empty */ }
    finally { setSaving(false); }
  };

  const color = avatarColor(member.firstName + member.lastName);
  const init = initials(member.firstName, member.lastName);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg"
      footer={
        isAdmin && editing ? (
          <>
            <button className="btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          </>
        ) : isAdmin ? (
          <button className="btn-secondary" onClick={() => setEditing(true)}><Edit2 size={14} /> Edit</button>
        ) : null
      }
    >
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-6">
        <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
          {init}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{member.firstName} {member.lastName}</h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <RoleBadge role={member.role} />
            {member.position && <span className="text-sm text-gray-500">{member.position}</span>}
            {member.pledgeClass && <span className="text-xs text-gray-400">· {member.pledgeClass}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {['info', 'dues', 'attendance', ...(isAdmin ? ['access'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="space-y-5">
          {editing ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">First name</label><input className="input-field" value={form.firstName || ''} onChange={e => update('firstName', e.target.value)} /></div>
                <div><label className="label">Last name</label><input className="input-field" value={form.lastName || ''} onChange={e => update('lastName', e.target.value)} /></div>
              </div>
              <div><label className="label">Email</label><input type="email" className="input-field" value={form.email || ''} onChange={e => update('email', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Role</label>
                  <select className="select-field" value={form.role || 'member'} onChange={e => update('role', e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
                  </select>
                </div>
                <div><label className="label">Position</label><input className="input-field" placeholder="President, VP…" value={form.position || ''} onChange={e => update('position', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Pledge class</label><input className="input-field" value={form.pledgeClass || ''} onChange={e => update('pledgeClass', e.target.value)} /></div>
                <div><label className="label">GPA</label><input type="number" step="0.01" className="input-field" value={form.gpa || ''} onChange={e => update('gpa', e.target.value)} /></div>
              </div>
              <div><label className="label">Phone</label><input type="tel" className="input-field" value={form.phone || ''} onChange={e => update('phone', e.target.value)} /></div>
              <div><label className="label">Major</label><input className="input-field" value={form.major || ''} onChange={e => update('major', e.target.value)} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              {[
                { icon: Mail, label: 'Email', value: member.email },
                { icon: Phone, label: 'Phone', value: member.phone },
                { icon: GraduationCap, label: 'Major', value: member.major },
                { icon: BookOpen, label: 'GPA', value: member.gpa },
                { icon: Calendar, label: 'Pledge Class', value: member.pledgeClass },
                { icon: Shield, label: 'Position', value: member.position },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} className="flex items-start gap-2 text-gray-600">
                  <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-medium text-gray-800">{value}</p>
                  </div>
                </div>
              ) : null)}
            </div>
          )}

          <PointsManager member={member} isAdmin={isAdmin} onUpdate={onUpdate} />
        </div>
      )}

      {tab === 'dues' && (
        <MemberDues memberId={member.id} />
      )}

      {tab === 'attendance' && (
        <MemberAttendance memberId={member.id} />
      )}

      {tab === 'access' && isAdmin && (
        <MemberPermissions memberId={member.id} memberName={`${member.firstName} ${member.lastName}`} memberRole={member.role} />
      )}
    </Modal>
  );
};

const PointsManager = ({ member, isAdmin, onUpdate }) => {
  const [points, setPoints] = useState(member.points ?? 0);
  const [input, setInput] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const adjust = async (delta) => {
    const amt = parseInt(input);
    if (!amt || isNaN(amt)) return;
    setSaving(true);
    try {
      const res = await client.post(`/leaderboard/${member.id}/points`, { points: delta * amt, reason });
      setPoints(res.data.data.points);
      onUpdate({ ...member, points: res.data.data.points });
      setInput(''); setReason('');
    } catch {}
    setSaving(false);
  };

  return (
    <div className="p-3.5 bg-gold/5 border border-gold/20 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-gold-dark" />
          <span className="text-sm font-semibold text-gold-dark">{points} merit points</span>
        </div>
      </div>
      {isAdmin && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input type="number" min="1" className="input-field flex-1 text-sm" placeholder="Points"
              value={input} onChange={e => setInput(e.target.value)} />
            <button onClick={() => adjust(1)} disabled={saving || !input}
              className="px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-40">+</button>
            <button onClick={() => adjust(-1)} disabled={saving || !input}
              className="px-3 py-2 bg-red-400 text-white rounded-xl text-sm font-bold hover:bg-red-500 disabled:opacity-40">−</button>
          </div>
          <input className="input-field w-full text-sm" placeholder="Reason (optional)"
            value={reason} onChange={e => setReason(e.target.value)} />
        </div>
      )}
    </div>
  );
};

const MemberDues = ({ memberId }) => {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/members/${memberId}/dues`)
      .then(res => { if (res.data.success) setDues(res.data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>;
  if (!dues.length) return <p className="text-sm text-gray-400 text-center py-8">No dues records</p>;

  return (
    <div className="space-y-2">
      {dues.map(d => (
        <div key={d.id} className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-800">{d.semester || 'Unknown semester'}</p>
            <p className="text-xs text-gray-400">${((d.amount || 0) / 100).toFixed(2)} due</p>
          </div>
          <span className={`badge ${d.status === 'paid' ? 'badge-green' : d.status === 'partial' ? 'badge-yellow' : 'badge-red'} capitalize`}>{d.status}</span>
        </div>
      ))}
    </div>
  );
};

const MemberAttendance = ({ memberId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/members/${memberId}/attendance`)
      .then(res => { if (res.data.success) setRecords(res.data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>;
  if (!records.length) return <p className="text-sm text-gray-400 text-center py-8">No attendance records</p>;

  const attended = records.filter(r => r.attended).length;
  const rate = records.length > 0 ? Math.round((attended / records.length) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-700">Attendance Rate</p>
        <p className="text-sm font-bold text-gray-900">{rate}% ({attended}/{records.length})</p>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div className={`h-full rounded-full ${rate >= 80 ? 'bg-emerald-500' : rate >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {records.map((r, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-700 truncate">{r.eventTitle}</span>
            {r.attended ? <span className="badge-green">✓</span> : <span className="badge-red">✗</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const FEATURE_LABELS = {
  dashboard: 'Dashboard', members: 'Member Directory', dues: 'Dues & Payments',
  events: 'Events', recruitment: 'Recruitment Pipeline', budget: 'Budget & Treasury',
  announcements: 'Announcements', polls: 'Polls', risk: 'Risk Management',
  reports: 'HQ Reports', sponsors: 'Sponsorships', analytics: 'Analytics',
  channels: 'Channels', settings: 'Settings',
};

const MemberPermissions = ({ memberId, memberName, memberRole }) => {
  const [perms, setPerms] = useState(null);
  const [overrides, setOverrides] = useState({});
  const [defaults, setDefaults] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    client.get(`/members/${memberId}/permissions`)
      .then(r => {
        setPerms(r.data.data.permissions);
        setOverrides(r.data.data.overrides || {});
        setDefaults(r.data.data.roleDefaults || {});
      }).catch(() => {});
  }, [memberId]);

  const toggle = (feature) => {
    setPerms(p => ({ ...p, [feature]: !p[feature] }));
    setOverrides(o => ({ ...o, [feature]: !perms[feature] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await client.patch(`/members/${memberId}/permissions`, { permissions: overrides });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {} finally { setSaving(false); }
  };

  const reset = async () => {
    try {
      await client.delete(`/members/${memberId}/permissions`);
      setOverrides({});
      setPerms({ ...defaults });
    } catch {}
  };

  if (!perms) return <div className="py-8 text-center text-gray-400 text-sm">Loading permissions…</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Feature Access for {memberName}</p>
          <p className="text-xs text-gray-400 mt-0.5">Overrides apply on top of the <span className="font-medium text-gray-600">{memberRole}</span> role defaults</p>
        </div>
        <button onClick={reset} className="text-xs text-gray-400 hover:text-red-500 transition-colors">Reset to defaults</button>
      </div>

      <div className="space-y-2">
        {Object.entries(FEATURE_LABELS).map(([feature, label]) => {
          const enabled = perms[feature];
          const isOverridden = overrides.hasOwnProperty(feature);
          return (
            <div key={feature} className={`flex items-center justify-between p-3 rounded-xl border transition-all
              ${enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{label}</span>
                {isOverridden && (
                  <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 rounded-full px-2 py-0.5">custom</span>
                )}
              </div>
              <button onClick={() => toggle(feature)}
                className={`relative w-10 h-5.5 rounded-full transition-colors duration-200
                  ${enabled ? 'bg-navy' : 'bg-gray-200'}`}
                style={{ height: '22px', minWidth: '40px' }}
              >
                <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200
                  ${enabled ? 'translate-x-[18px]' : 'translate-x-0'}`}
                  style={{ width: '18px', height: '18px' }}
                />
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={save} disabled={saving || Object.keys(overrides).length === 0}
        className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Permissions'}
      </button>
    </div>
  );
};

// Inline role changer — tap role badge to cycle through roles
const RoleChanger = ({ member, onUpdate, isAdmin }) => {
  const [loading, setLoading] = useState(false);

  const cycleRole = async (e) => {
    e.stopPropagation();
    if (!isAdmin || loading) return;
    const idx = ROLES.indexOf(member.role);
    const nextRole = ROLES[(idx + 1) % ROLES.length];
    setLoading(true);
    try {
      const res = await client.patch(`/members/${member.id}`, { role: nextRole });
      if (res.data.success) onUpdate(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  if (!isAdmin) return <RoleBadge role={member.role} />;
  const cfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
  return (
    <button onClick={cycleRole} disabled={loading}
      className={`${cfg.classes} capitalize flex items-center gap-1 transition-opacity ${loading ? 'opacity-50' : 'hover:opacity-80'}`}
      title="Tap to change role">
      {loading ? '…' : cfg.label}
    </button>
  );
};

// Member Card (grid view)
const MemberCard = ({ member, onClick, onUpdate, isAdmin }) => {
  const color = avatarColor(member.firstName + member.lastName);
  const init = initials(member.firstName, member.lastName);
  return (
    <div onClick={onClick} className="card-hover p-4 cursor-pointer group">
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0 transition-transform group-hover:scale-105 text-sm`}>
          {init}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate text-sm">{member.firstName} {member.lastName}</p>
          {member.position && <p className="text-xs text-gray-500 truncate mt-0.5">{member.position}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <RoleChanger member={member} onUpdate={onUpdate} isAdmin={isAdmin} />
        {member.pledgeClass && <span className="text-xs text-gray-400">{member.pledgeClass}</span>}
      </div>
    </div>
  );
};

// Member Row (list view) — card-style with chevron
const MemberRow = ({ member, onClick }) => {
  const color = avatarColor(member.firstName + member.lastName);
  const init = initials(member.firstName, member.lastName);
  return (
    <div
      onClick={onClick}
      className="card flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:shadow-card-hover transition-all duration-150 active:scale-[0.99]"
    >
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
        {init}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{member.firstName} {member.lastName}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{member.email}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <RoleBadge role={member.role} />
        <ChevronRight size={16} className="text-gray-300" />
      </div>
    </div>
  );
};

export default function Members() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const fetchMembers = useCallback(async () => {
    try {
      const res = await client.get('/members');
      if (res.data.success) setMembers(res.data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  const handleUpdate = (updated) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
    setSelectedMember(updated);
  };

  const pledgeClasses = [...new Set(members.map(m => m.pledgeClass).filter(Boolean))].sort().reverse();

  const filtered = members.filter(m => {
    const matchSearch = !search || `${m.firstName} ${m.lastName} ${m.email || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    const matchClass = classFilter === 'all' || m.pledgeClass === classFilter;
    return matchSearch && matchRole && matchClass;
  });

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">{members.length} member{members.length !== 1 ? 's' : ''} in your chapter</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2 self-start sm:self-auto flex-wrap">
            <button className="btn-secondary" onClick={async () => {
              if (!window.confirm('Remove duplicate members (same email or name)? This cannot be undone.')) return;
              const res = await client.post('/members/dedup').catch(() => null);
              if (res?.data?.success) { alert(`Removed ${res.data.data.removed} duplicate(s)`); fetchMembers(); }
            }}>
              Dedup
            </button>
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Member
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-0" style={{ minWidth: '180px' }}>
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input-field pl-10 py-2" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
        </div>

        <select className="select-field py-2 text-sm" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All roles</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
        </select>

        {pledgeClasses.length > 0 && (
          <select className="select-field py-2 text-sm" style={{ width: 'auto' }} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="all">All classes</option>
            {pledgeClasses.map(pc => <option key={pc} value={pc}>{pc}</option>)}
          </select>
        )}

        <div className="flex bg-gray-100 rounded-xl p-1 ml-auto">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Members Grid / List */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="skeleton w-12 h-12 rounded-2xl" />
                  <div className="skeleton w-24 h-4 rounded" />
                </div>
                <div className="skeleton w-16 h-5 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="card flex items-center gap-3 px-4 py-3.5">
                <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
                <div className="skeleton w-16 h-5 rounded-full" />
              </div>
            ))}
          </div>
        )
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <Users size={36} className="text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 mb-1">
            {search || roleFilter !== 'all' || classFilter !== 'all' ? 'No members match your filters' : 'No members yet'}
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            {search || roleFilter !== 'all' || classFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Add your first member to get started.'}
          </p>
          {isAdmin && !search && roleFilter === 'all' && classFilter === 'all' && (
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={16} /> Add Member
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(m => (
            <MemberCard key={m.id} member={m} onClick={() => setSelectedMember(m)} onUpdate={handleUpdate} isAdmin={isAdmin} />
          ))}
        </div>
      ) : (
        /* iOS-style: all rows inside ONE card with dividers */
        <div className="card overflow-hidden">
          {filtered.map((m, i) => (
            <div key={m.id}
              onClick={() => setSelectedMember(m)}
              className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50 transition-colors
                ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
              <div className={`w-10 h-10 ${avatarColor(m.firstName + m.lastName)} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {initials(m.firstName, m.lastName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 truncate leading-tight">{m.firstName} {m.lastName}</p>
                <p className="text-[13px] text-gray-400 truncate mt-0.5">{m.position || m.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <RoleChanger member={m} onUpdate={handleUpdate} isAdmin={isAdmin} />
                <ChevronRight size={15} className="text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AddMemberModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSave={(m) => setMembers(prev => [m, ...prev])} />
      <MemberProfileModal
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        onUpdate={handleUpdate}
        isAdmin={isAdmin}
      />
    </div>
  );
}
