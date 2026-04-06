import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, LayoutGrid, List, X, Mail, Phone,
  GraduationCap, Calendar, Shield, Star, BookOpen, Check,
  Edit2, Send, ChevronRight
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useHaptic } from '../hooks/useHaptic';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:        '#070B14',
  card:      '#0D1424',
  elevated:  '#131D2E',
  blue:      '#4F8EF7',
  gold:      '#F0B429',
  success:   '#34D399',
  warning:   '#FBBF24',
  danger:    '#F87171',
  textPrimary:   '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted:     '#475569',
  border:    'rgba(255,255,255,0.07)',
  radius:    12,
  btnRadius: 8,
  shadow:    '0 4px 24px rgba(0,0,0,0.4)',
  transition:'150ms ease',
};

// ─── Roles ────────────────────────────────────────────────────────────────────
const ROLES = ['admin', 'officer', 'member', 'alumni', 'pledge'];
const ROLE_CONFIG = {
  admin:   { label: 'Admin',   color: T.blue,    bg: 'rgba(79,142,247,0.12)'  },
  officer: { label: 'Officer', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  member:  { label: 'Member',  color: T.textSecondary, bg: 'rgba(148,163,184,0.1)' },
  alumni:  { label: 'Alumni',  color: T.gold,    bg: 'rgba(240,180,41,0.12)'  },
  pledge:  { label: 'Pledge',  color: T.success, bg: 'rgba(52,211,153,0.12)'  },
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_BG = ['#4F8EF7','#a78bfa','#34D399','#F0B429','#F87171','#22d3ee','#fb923c'];
const getAvatarBg = (name) => AVATAR_BG[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_BG.length];
const initials = (f, l) => `${(f || ' ')[0]}${(l || ' ')[0]}`.toUpperCase();

// ─── Sub-components ──────────────────────────────────────────────────────────

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.member;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      color: cfg.color, background: cfg.bg,
      padding: '3px 9px', borderRadius: 20,
      textTransform: 'capitalize', whiteSpace: 'nowrap',
      border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.label}
    </span>
  );
};

// ─── Add Member Modal ─────────────────────────────────────────────────────────
const AddMemberModal = ({ isOpen, onClose, onSave }) => {
  const [mode, setMode] = useState('invite');
  const [email, setEmail] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', role: 'member', pledgeClass: '', position: '', phone: '', major: '', gpa: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleInvite = async () => {
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

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: T.elevated, border: `1px solid ${T.border}`,
    borderRadius: T.btnRadius, padding: '10px 14px',
    color: T.textPrimary, fontSize: 14,
    fontFamily: 'inherit', outline: 'none',
    transition: T.transition,
  };

  const labelStyle = { fontSize: 12, fontWeight: 500, color: T.textSecondary, display: 'block', marginBottom: 6 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member" size="md"
      footer={
        <>
          <button
            onClick={onClose}
            style={{ padding: '9px 18px', borderRadius: T.btnRadius, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: T.transition }}
          >
            Cancel
          </button>
          <button
            onClick={mode === 'invite' ? handleInvite : handleAdd}
            disabled={loading}
            style={{ padding: '9px 18px', borderRadius: T.btnRadius, border: 'none', background: T.blue, color: '#fff', fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: T.transition }}
          >
            {loading ? 'Saving…' : mode === 'invite' ? 'Send Invite' : 'Add Member'}
          </button>
        </>
      }
    >
      {/* Mode switcher */}
      <div style={{ display: 'flex', background: T.elevated, borderRadius: T.btnRadius, padding: 4, marginBottom: 20, width: 'fit-content', border: `1px solid ${T.border}` }}>
        {['invite', 'manual'].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(''); setSuccess(''); }}
            style={{
              padding: '7px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: T.transition, border: 'none',
              background: mode === m ? T.blue : 'transparent',
              color: mode === m ? '#fff' : T.textMuted,
            }}>
            {m === 'invite' ? 'Invite by Email' : 'Add Manually'}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: T.btnRadius, marginBottom: 16, fontSize: 13, color: T.danger }}>
          <X size={14} />{error}
        </div>
      )}
      {success && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: T.btnRadius, marginBottom: 16, fontSize: 13, color: T.success }}>
          <Check size={14} />{success}
        </div>
      )}

      {mode === 'invite' ? (
        <div>
          <label style={labelStyle}>Email address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
            <input type="email" style={{ ...inputStyle, paddingLeft: 38 }} placeholder="member@chapter.edu"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }} autoFocus />
          </div>
          <p style={{ fontSize: 12, color: T.textMuted, marginTop: 8 }}>They'll receive a link to create their account.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>First name *</label>
              <input style={inputStyle} placeholder="Jane" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Last name *</label>
              <input style={inputStyle} placeholder="Smith" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Email *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
              <input type="email" style={{ ...inputStyle, paddingLeft: 38 }} value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Role</label>
              <select style={{ ...inputStyle }} value={form.role} onChange={e => update('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pledge class</label>
              <input style={inputStyle} placeholder="Fall 2023" value={form.pledgeClass} onChange={e => update('pledgeClass', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Phone</label>
              <input type="tel" style={inputStyle} value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>GPA</label>
              <input type="number" step="0.01" min="0" max="4" style={inputStyle} placeholder="3.50" value={form.gpa} onChange={e => update('gpa', e.target.value)} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── Member Profile Modal ─────────────────────────────────────────────────────
const MemberProfileModal = ({ member, isOpen, onClose, onUpdate, isAdmin }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('info');

  useEffect(() => {
    if (member) { setForm({ ...member }); setEditing(false); setTab('info'); }
  }, [member]);

  if (!member) return null;
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await client.patch(`/members/${member.id}`, form);
      if (res.data.success) { onUpdate(res.data.data); setEditing(false); }
    } catch {}
    finally { setSaving(false); }
  };

  const bg = getAvatarBg(member.firstName + member.lastName);
  const init = initials(member.firstName, member.lastName);

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: T.elevated, border: `1px solid ${T.border}`,
    borderRadius: T.btnRadius, padding: '10px 14px',
    color: T.textPrimary, fontSize: 14,
    fontFamily: 'inherit', outline: 'none',
  };
  const labelStyle = { fontSize: 12, fontWeight: 500, color: T.textSecondary, display: 'block', marginBottom: 6 };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="lg"
      footer={
        isAdmin && editing ? (
          <>
            <button onClick={() => setEditing(false)} style={{ padding: '9px 18px', borderRadius: T.btnRadius, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{ padding: '9px 18px', borderRadius: T.btnRadius, border: 'none', background: T.blue, color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        ) : isAdmin ? (
          <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: T.btnRadius, border: `1px solid ${T.border}`, background: 'transparent', color: T.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            <Edit2 size={14} /> Edit
          </button>
        ) : null
      }
    >
      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
          {init}
        </div>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, margin: '0 0 8px' }}>{member.firstName} {member.lastName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <RoleBadge role={member.role} />
            {member.position && <span style={{ fontSize: 13, color: T.textSecondary }}>{member.position}</span>}
            {member.pledgeClass && <span style={{ fontSize: 12, color: T.textMuted }}>· {member.pledgeClass}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: T.elevated, borderRadius: T.btnRadius, padding: 4, marginBottom: 20, width: 'fit-content', border: `1px solid ${T.border}` }}>
        {['info', 'dues', 'attendance', ...(isAdmin ? ['access'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', transition: T.transition, border: 'none',
              background: tab === t ? T.blue : 'transparent',
              color: tab === t ? '#fff' : T.textMuted,
              textTransform: 'capitalize',
            }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>First name</label><input style={inputStyle} value={form.firstName || ''} onChange={e => update('firstName', e.target.value)} /></div>
                <div><label style={labelStyle}>Last name</label><input style={inputStyle} value={form.lastName || ''} onChange={e => update('lastName', e.target.value)} /></div>
              </div>
              <div><label style={labelStyle}>Email</label><input type="email" style={inputStyle} value={form.email || ''} onChange={e => update('email', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Role</label>
                  <select style={inputStyle} value={form.role || 'member'} onChange={e => update('role', e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r]?.label || r}</option>)}
                  </select>
                </div>
                <div><label style={labelStyle}>Position</label><input style={inputStyle} placeholder="President, VP…" value={form.position || ''} onChange={e => update('position', e.target.value)} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Pledge class</label><input style={inputStyle} value={form.pledgeClass || ''} onChange={e => update('pledgeClass', e.target.value)} /></div>
                <div><label style={labelStyle}>GPA</label><input type="number" step="0.01" style={inputStyle} value={form.gpa || ''} onChange={e => update('gpa', e.target.value)} /></div>
              </div>
              <div><label style={labelStyle}>Phone</label><input type="tel" style={inputStyle} value={form.phone || ''} onChange={e => update('phone', e.target.value)} /></div>
              <div><label style={labelStyle}>Major</label><input style={inputStyle} value={form.major || ''} onChange={e => update('major', e.target.value)} /></div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
              {[
                { icon: Mail,          label: 'Email',        value: member.email },
                { icon: Phone,         label: 'Phone',        value: member.phone },
                { icon: GraduationCap, label: 'Major',        value: member.major },
                { icon: BookOpen,      label: 'GPA',          value: member.gpa },
                { icon: Calendar,      label: 'Pledge Class', value: member.pledgeClass },
                { icon: Shield,        label: 'Position',     value: member.position },
              ].map(({ icon: Icon, label, value }) => value ? (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <Icon size={14} style={{ color: T.textMuted, marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 2px' }}>{label}</p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary, margin: 0 }}>{value}</p>
                  </div>
                </div>
              ) : null)}
            </div>
          )}
          <PointsManager member={member} isAdmin={isAdmin} onUpdate={onUpdate} />
        </div>
      )}

      {tab === 'dues' && <MemberDues memberId={member.id} />}
      {tab === 'attendance' && <MemberAttendance memberId={member.id} />}
      {tab === 'access' && isAdmin && (
        <MemberPermissions memberId={member.id} memberName={`${member.firstName} ${member.lastName}`} memberRole={member.role} />
      )}
    </Modal>
  );
};

// ─── Points Manager ───────────────────────────────────────────────────────────
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

  const inputStyle = {
    background: T.elevated, border: `1px solid ${T.border}`,
    borderRadius: T.btnRadius, padding: '8px 12px',
    color: T.textPrimary, fontSize: 13, fontFamily: 'inherit', outline: 'none',
  };

  return (
    <div style={{ padding: '14px 16px', background: 'rgba(240,180,41,0.06)', border: '1px solid rgba(240,180,41,0.18)', borderRadius: T.radius }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isAdmin ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Star size={14} style={{ color: T.gold }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: T.gold }}>{points} merit points</span>
        </div>
      </div>
      {isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" min="1" style={{ ...inputStyle, flex: 1 }} placeholder="Points"
              value={input} onChange={e => setInput(e.target.value)} />
            <button onClick={() => adjust(1)} disabled={saving || !input}
              style={{ padding: '8px 14px', background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: T.btnRadius, color: T.success, fontWeight: 700, fontSize: 15, cursor: (!input || saving) ? 'not-allowed' : 'pointer', opacity: (!input || saving) ? 0.4 : 1 }}>
              +
            </button>
            <button onClick={() => adjust(-1)} disabled={saving || !input}
              style={{ padding: '8px 14px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: T.btnRadius, color: T.danger, fontWeight: 700, fontSize: 15, cursor: (!input || saving) ? 'not-allowed' : 'pointer', opacity: (!input || saving) ? 0.4 : 1 }}>
              −
            </button>
          </div>
          <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} placeholder="Reason (optional)"
            value={reason} onChange={e => setReason(e.target.value)} />
        </div>
      )}
    </div>
  );
};

// ─── Member Dues ──────────────────────────────────────────────────────────────
const MemberDues = ({ memberId }) => {
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/members/${memberId}/dues`)
      .then(res => { if (res.data.success) setDues(res.data.data || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [memberId]);

  const statusColor = { paid: T.success, partial: T.warning, unpaid: T.danger };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array(3).fill(0).map((_, i) => (
        <div key={i} style={{ height: 52, borderRadius: T.btnRadius, background: T.elevated, animation: 'pulse 1.5s infinite' }} />
      ))}
    </div>
  );
  if (!dues.length) return <p style={{ fontSize: 14, color: T.textMuted, textAlign: 'center', padding: '32px 0' }}>No dues records</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {dues.map(d => (
        <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: T.elevated, borderRadius: T.btnRadius, border: `1px solid ${T.border}` }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: T.textPrimary, margin: 0 }}>{d.semester || 'Unknown semester'}</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: '2px 0 0' }}>${((d.amount || 0) / 100).toFixed(2)} due</p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: statusColor[d.status] || T.textMuted, background: (statusColor[d.status] || T.textMuted) + '18', padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize', border: `1px solid ${(statusColor[d.status] || T.textMuted)}30` }}>
            {d.status}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Member Attendance ────────────────────────────────────────────────────────
const MemberAttendance = ({ memberId }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/members/${memberId}/attendance`)
      .then(res => { if (res.data.success) setRecords(res.data.data || []); })
      .catch(() => {}).finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array(3).fill(0).map((_, i) => <div key={i} style={{ height: 44, borderRadius: T.btnRadius, background: T.elevated }} />)}
    </div>
  );
  if (!records.length) return <p style={{ fontSize: 14, color: T.textMuted, textAlign: 'center', padding: '32px 0' }}>No attendance records</p>;

  const attended = records.filter(r => r.attended).length;
  const rate = records.length > 0 ? Math.round((attended / records.length) * 100) : 0;
  const barColor = rate >= 80 ? T.success : rate >= 60 ? T.warning : T.danger;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: T.textSecondary }}>Attendance Rate</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary }}>{rate}% ({attended}/{records.length})</span>
      </div>
      <div style={{ height: 6, background: T.elevated, borderRadius: 3, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ height: '100%', width: `${rate}%`, background: barColor, borderRadius: 3, transition: 'width 600ms ease' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {records.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: T.elevated, borderRadius: T.btnRadius, fontSize: 13 }}>
            <span style={{ color: T.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.eventTitle}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: r.attended ? T.success : T.danger, flexShrink: 0, marginLeft: 8 }}>{r.attended ? '✓' : '✗'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Member Permissions ───────────────────────────────────────────────────────
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

  if (!perms) return <p style={{ textAlign: 'center', color: T.textMuted, fontSize: 14, padding: '32px 0' }}>Loading permissions…</p>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: '0 0 2px' }}>Feature Access for {memberName}</p>
          <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>Overrides apply on top of the <strong style={{ color: T.textSecondary }}>{memberRole}</strong> role defaults</p>
        </div>
        <button onClick={reset} style={{ fontSize: 12, color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          Reset to defaults
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(FEATURE_LABELS).map(([feature, label]) => {
          const enabled = perms[feature];
          const isOverridden = overrides.hasOwnProperty(feature);
          return (
            <div key={feature} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: T.btnRadius, border: `1px solid ${enabled ? 'rgba(79,142,247,0.15)' : T.border}`, background: enabled ? 'rgba(79,142,247,0.04)' : T.elevated, transition: T.transition }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.textPrimary }}>{label}</span>
                {isOverridden && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: T.warning, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 20, padding: '2px 7px' }}>custom</span>
                )}
              </div>
              <button onClick={() => toggle(feature)}
                style={{ position: 'relative', width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: enabled ? T.blue : T.elevated, transition: T.transition, flexShrink: 0, outline: 'none' }}>
                <span style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: T.transition, transform: enabled ? 'translateX(18px)' : 'translateX(0)' }} />
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={save} disabled={saving || Object.keys(overrides).length === 0}
        style={{ width: '100%', marginTop: 16, padding: '11px', borderRadius: T.btnRadius, border: 'none', background: T.blue, color: '#fff', fontSize: 14, fontWeight: 600, cursor: (saving || Object.keys(overrides).length === 0) ? 'not-allowed' : 'pointer', opacity: (saving || Object.keys(overrides).length === 0) ? 0.5 : 1, transition: T.transition }}>
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save Permissions'}
      </button>
    </div>
  );
};

// ─── Role Changer ─────────────────────────────────────────────────────────────
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
    <button onClick={cycleRole} disabled={loading} title="Tap to change role"
      style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.02em', color: cfg.color, background: cfg.bg, padding: '3px 9px', borderRadius: 20, textTransform: 'capitalize', border: `1px solid ${cfg.color}30`, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: T.transition }}>
      {loading ? '…' : cfg.label}
    </button>
  );
};

// ─── Member Card (grid view) ──────────────────────────────────────────────────
const MemberCard = ({ member, onClick, onUpdate, isAdmin }) => {
  const [hovered, setHovered] = useState(false);
  const bg = getAvatarBg(member.firstName + member.lastName);
  const init = initials(member.firstName, member.lastName);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? T.elevated : T.card,
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : T.border}`,
        borderRadius: T.radius,
        boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.5)' : T.shadow,
        padding: '16px',
        cursor: 'pointer',
        transition: T.transition,
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
          {init}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.firstName} {member.lastName}</p>
          {member.position && <p style={{ fontSize: 12, color: T.textSecondary, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.position}</p>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <RoleChanger member={member} onUpdate={onUpdate} isAdmin={isAdmin} />
        {member.pledgeClass && <span style={{ fontSize: 11, color: T.textMuted }}>{member.pledgeClass}</span>}
      </div>
    </div>
  );
};

// ─── Main Members Page ────────────────────────────────────────────────────────
export default function Members() {
  const { user } = useAuth();
  const { impact } = useHaptic();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const fetchMembers = useCallback(async () => {
    try {
      const res = await client.get('/members');
      if (res.data.success) setMembers(res.data.data || []);
    } catch {}
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

  const ROLE_PILLS = ['all', ...ROLES];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', background: T.bg, minHeight: '100vh', padding: '32px 32px 48px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: '-0.03em' }}>Members</h1>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: '5px 0 0' }}>
            {members.length} {members.length === 1 ? 'member' : 'members'} in your chapter
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', background: T.card, border: `1px solid ${T.border}`, borderRadius: T.btnRadius, padding: 3 }}>
            {[{ mode: 'list', Icon: List }, { mode: 'grid', Icon: LayoutGrid }].map(({ mode, Icon }) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                style={{ width: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: viewMode === mode ? T.elevated : 'transparent', color: viewMode === mode ? T.textPrimary : T.textMuted, transition: T.transition }}>
                <Icon size={15} />
              </button>
            ))}
          </div>
          {isAdmin && (
            <button
              onClick={() => { impact('medium'); setShowAdd(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: T.btnRadius, border: 'none', background: T.blue, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 20px rgba(79,142,247,0.25)', transition: T.transition }}
            >
              <Plus size={16} />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members by name or email…"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: T.radius, padding: '12px 40px 12px 44px',
            color: T.textPrimary, fontSize: 14,
            fontFamily: 'inherit', outline: 'none',
            transition: T.transition,
          }}
        />
        {search && (
          <button onClick={() => setSearch('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: T.elevated, border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textMuted }}>
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Role Filter Pills ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {ROLE_PILLS.map(r => {
          const active = roleFilter === r;
          const cfg = ROLE_CONFIG[r];
          return (
            <button key={r} onClick={() => { impact('light'); setRoleFilter(r); }}
              style={{
                padding: '6px 16px', borderRadius: 20,
                border: active ? 'none' : `1px solid ${T.border}`,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit',
                background: active ? T.blue : 'transparent',
                color: active ? '#fff' : T.textMuted,
                boxShadow: active ? '0 0 12px rgba(79,142,247,0.3)' : 'none',
                transition: T.transition,
              }}>
              {r === 'all' ? 'All' : ROLE_CONFIG[r]?.label || r}
            </button>
          );
        })}
      </div>

      {/* ── Member List ── */}
      {loading ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: i < 5 ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: T.elevated, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 13, width: 140, background: T.elevated, borderRadius: 4, marginBottom: 8 }} />
                <div style={{ height: 11, width: 100, background: T.elevated, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, boxShadow: T.shadow }}>
          <Users size={40} style={{ color: T.textMuted, margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: T.textSecondary, margin: '0 0 4px' }}>
            {search || roleFilter !== 'all' ? 'No matches found' : 'No members yet'}
          </p>
          <p style={{ fontSize: 14, color: T.textMuted, margin: 0 }}>
            {search || roleFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first member to get started'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map(m => (
            <MemberCard key={m.id} member={m} onClick={() => { impact('light'); setSelectedMember(m); }} onUpdate={handleUpdate} isAdmin={isAdmin} />
          ))}
        </div>
      ) : (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden', boxShadow: T.shadow }}>
          {filtered.map((m, i) => {
            const bg = getAvatarBg(m.firstName + m.lastName);
            const isHovered = hoveredRow === m.id;
            return (
              <div
                key={m.id}
                onClick={() => { impact('light'); setSelectedMember(m); }}
                onMouseEnter={() => setHoveredRow(m.id)}
                onMouseLeave={() => setHoveredRow(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 20px',
                  height: 64, boxSizing: 'border-box',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  cursor: 'pointer',
                  background: isHovered ? 'rgba(255,255,255,0.025)' : 'transparent',
                  transition: T.transition,
                }}
              >
                {/* Avatar */}
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                    {initials(m.firstName, m.lastName)}
                  </div>
                )}

                {/* Name + secondary */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.firstName} {m.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: T.textSecondary, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.position || m.major || m.pledgeClass || m.email || ''}
                  </p>
                </div>

                {/* Role badge + chevron */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <RoleBadge role={m.role} />
                  <ChevronRight size={16} style={{ color: T.textMuted, opacity: isHovered ? 1 : 0.5, transition: T.transition }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}
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
