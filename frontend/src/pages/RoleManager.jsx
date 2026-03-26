import React, { useState, useEffect } from 'react';
import { Shield, Check, ChevronDown, Search, Users, AlertCircle } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'admin',   label: 'President / Admin', color: 'bg-navy text-white',           desc: 'Full access — manage everything' },
  { value: 'officer', label: 'Officer',            color: 'bg-blue-100 text-blue-700',    desc: 'Can manage members, events, dues' },
  { value: 'member',  label: 'Active Brother',     color: 'bg-gray-100 text-gray-700',    desc: 'Standard access' },
  { value: 'pledge',  label: 'Pledge',             color: 'bg-amber-100 text-amber-700',  desc: 'Limited access — view only' },
  { value: 'alumni',  label: 'Alumni',             color: 'bg-purple-100 text-purple-700',desc: 'Alumni portal access' },
];

const POSITIONS = [
  'President', 'Vice President', 'Secretary', 'Treasurer',
  'Sergeant-at-Arms', 'Recruitment Chair', 'Risk Manager',
  'Social Chair', 'Philanthropy Chair', 'Alumni Chair',
  'Academic Chair', 'Chaplain', 'Marshal', 'Historian',
  'IFC Representative', 'Warden', 'Herald', 'Steward',
];

function RoleChip({ role }) {
  const cfg = ROLES.find(r => r.value === role) || ROLES[2];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function MemberRoleRow({ member, onUpdate, isCurrentUser }) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(member.role);
  const [position, setPosition] = useState(member.position || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const avatarColors = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-amber-500','bg-red-500','bg-indigo-500'];
  const color = avatarColors[(member.firstName?.charCodeAt(0) || 0) % avatarColors.length];
  const init = `${member.firstName?.[0] || ''}${member.lastName?.[0] || ''}`.toUpperCase();

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await client.put(`/members/${member.id}`, { role, position });
      if (res.data.success) {
        onUpdate({ ...member, role, position });
        setEditing(false);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const cancel = () => {
    setRole(member.role);
    setPosition(member.position || '');
    setEditing(false);
    setError('');
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${editing ? 'border-navy bg-navy/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {init}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900">{member.firstName} {member.lastName}</p>
          {isCurrentUser && <span className="text-xs text-gray-400">(you)</span>}
        </div>
        <p className="text-xs text-gray-400 truncate mt-0.5">{member.email}</p>
      </div>

      {!editing ? (
        <>
          {/* Current role/position display */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <RoleChip role={member.role} />
            {member.position && (
              <span className="text-sm text-gray-500 hidden sm:block">{member.position}</span>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            Edit <ChevronDown size={13} />
          </button>
        </>
      ) : (
        <div className="flex items-start gap-3 flex-1 flex-wrap sm:flex-nowrap">
          {error && (
            <div className="w-full flex items-center gap-1.5 text-xs text-red-600 mb-1">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          {/* Role picker */}
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-gray-500 mb-1 block">Role</label>
            <select
              className="select-field text-sm w-full"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          {/* Position picker */}
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-500 mb-1 block">Position / Title</label>
            <input
              className="input-field text-sm w-full"
              list="positions-list"
              placeholder="President, VP, Treasurer…"
              value={position}
              onChange={e => setPosition(e.target.value)}
            />
            <datalist id="positions-list">
              {POSITIONS.map(p => <option key={p} value={p} />)}
            </datalist>
          </div>
          {/* Actions */}
          <div className="flex items-end gap-2 pb-0.5">
            <button onClick={cancel} className="btn-secondary text-sm py-2 px-3">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm py-2 px-3 gap-1.5">
              {saving ? '…' : <><Check size={13} /> Save</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoleManager() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    client.get('/members')
      .then(r => setMembers(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = (updated) => {
    setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
  };

  const filtered = members.filter(m => {
    const matchSearch = !search || `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const officers = members.filter(m => m.role === 'admin' || m.role === 'officer');
  const admins = members.filter(m => m.role === 'admin');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Roles & Officers</h1>
        <p className="page-subtitle">Assign roles and positions to chapter members</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Members', value: members.length, icon: Users, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: 'Officers', value: officers.length, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Admins', value: admins.length, icon: Shield, color: 'text-navy', bg: 'bg-navy/5' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4`}>
            <Icon size={18} className={`${color} mb-2`} />
            <p className="text-2xl font-extrabold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Role legend */}
      <div className="card p-4 mb-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Role Permissions</p>
        <div className="space-y-2">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-center gap-3">
              <RoleChip role={r.value} />
              <span className="text-xs text-gray-500">{r.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9 py-2 text-sm" placeholder="Search members…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field py-2 text-sm" style={{ width: 'auto' }}
          value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">All roles</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Members list */}
      {loading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton w-32 h-4 rounded" />
                <div className="skeleton w-48 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No members found</p>
          ) : (
            filtered.map(m => (
              <MemberRoleRow
                key={m.id}
                member={m}
                onUpdate={handleUpdate}
                isCurrentUser={m.id === user?.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
