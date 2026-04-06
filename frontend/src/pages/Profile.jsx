import React, { useState, useEffect } from 'react';
import { Phone, Save, CheckCircle2, Trophy, BookOpen, ClipboardList, Clock, ChevronRight } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getIsNative } from '../hooks/useNative';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const ROLE_CONFIG = {
  admin:   { label: 'Admin',   color: T.danger,   bg: 'rgba(248,113,113,0.12)',  border: 'rgba(248,113,113,0.25)' },
  officer: { label: 'Officer', color: T.gold,     bg: 'rgba(240,180,41,0.12)',   border: 'rgba(240,180,41,0.25)' },
  member:  { label: 'Member',  color: T.accent,   bg: 'rgba(79,142,247,0.12)',   border: 'rgba(79,142,247,0.25)' },
  alumni:  { label: 'Alumni',  color: T.text2,    bg: 'rgba(255,255,255,0.06)',  border: T.border },
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

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', major: '', year: '', pledgeClass: '', position: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
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
      setSaveError('');
      await client.patch(`/members/${user.id}`, form);
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
      if (refreshUser) refreshUser();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save. Please try again.');
    } finally { setSaving(false); }
  };

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || '?';
  const roleCfg = ROLE_CONFIG[user?.role] || ROLE_CONFIG.member;
  const isNative = getIsNative();

  const N = {
    bg: '#000000', card: '#1C1C1E', elevated: '#2C2C2E',
    sep: 'rgba(255,255,255,0.08)',
    accent: '#0A84FF', success: '#30D158', warning: '#FF9F0A', danger: '#FF453A',
    text1: '#FFFFFF', text2: 'rgba(235,235,245,0.6)', text3: 'rgba(235,235,245,0.3)',
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  };

  const nInputStyle = {
    background: N.elevated, border: `1px solid ${N.sep}`,
    borderRadius: 10, color: N.text1, padding: '12px 14px', outline: 'none', width: '100%',
    fontSize: 15, boxSizing: 'border-box',
  };

  if (isNative) {
    if (loading) return (
      <div style={{ background: N.bg, minHeight: '100vh', fontFamily: N.font }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: N.text1, margin: 0, padding: '16px 20px 4px', letterSpacing: -0.5 }}>Profile</h1>
        <div style={{ margin: '16px', background: N.card, borderRadius: 16, height: 200 }} />
      </div>
    );

    return (
      <div style={{ background: N.bg, minHeight: '100vh', paddingBottom: 20, fontFamily: N.font }}>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: N.text1, margin: 0, padding: '16px 20px 4px', letterSpacing: -0.5 }}>Profile</h1>

        {/* Hero card */}
        <div style={{ margin: '16px 16px 0', background: N.card, borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: 40, background: 'linear-gradient(135deg, #0A84FF, #BF5AF2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, fontSize: 30, fontWeight: 700, color: '#fff' }}>
            {initials}
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: N.text1 }}>{form.firstName} {form.lastName}</div>
          <div style={{ fontSize: 15, color: N.text2, marginTop: 4 }}>
            <span style={{ textTransform: 'capitalize' }}>{roleCfg.label}</span>
            {form.position ? ` · ${form.position}` : ''}
          </div>
          <div style={{ fontSize: 13, color: N.text3, marginTop: 4 }}>{user?.email}</div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, width: '100%', marginTop: 20, borderTop: `1px solid ${N.sep}`, paddingTop: 16 }}>
            {[
              { icon: Trophy,        value: user?.points ?? 0,             label: 'Points',    color: '#FF9F0A' },
              { icon: BookOpen,      value: user?.gpa?.toFixed(2) ?? '—',  label: 'GPA',       color: '#0A84FF' },
              { icon: ClipboardList, value: user?.studyHours ?? 0,         label: 'Study Hrs', color: '#30D158' },
            ].map(({ icon: Icon, value, label, color }, i) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, borderRight: i < 2 ? `1px solid ${N.sep}` : 'none' }}>
                <Icon size={16} style={{ color }} />
                <span style={{ fontSize: 20, fontWeight: 700, color: N.text1 }}>{value}</span>
                <span style={{ fontSize: 11, color: N.text3 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Edit toggle button */}
        <div style={{ padding: '16px 16px 0' }}>
          <button
            onClick={() => setEditMode(e => !e)}
            style={{ width: '100%', padding: '13px', borderRadius: 12, background: editMode ? N.elevated : N.accent, color: editMode ? N.text2 : '#fff', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}
          >
            {editMode ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Edit form */}
        {editMode && (
          <div style={{ margin: '16px 16px 0', background: N.card, borderRadius: 14, overflow: 'hidden' }}>
            {saveError && (
              <div style={{ padding: '12px 16px', background: 'rgba(255,69,58,0.12)', borderBottom: `1px solid ${N.sep}`, fontSize: 14, color: N.danger }}>{saveError}</div>
            )}
            {[
              { key: 'firstName', label: 'First Name', type: 'text' },
              { key: 'lastName', label: 'Last Name', type: 'text' },
              { key: 'phone', label: 'Phone', type: 'tel', placeholder: '555-867-5309' },
              { key: 'major', label: 'Major', type: 'text', placeholder: 'Finance' },
              { key: 'pledgeClass', label: 'Pledge Class', type: 'text', placeholder: 'Fall 2023' },
              { key: 'position', label: 'Position / Title', type: 'text', placeholder: 'Rush Chair' },
            ].map(({ key, label, type, placeholder }, idx) => (
              <div key={key} style={{ padding: '12px 16px', borderBottom: `1px solid ${N.sep}` }}>
                <div style={{ fontSize: 12, color: N.text3, marginBottom: 6 }}>{label}</div>
                <input
                  style={{ ...nInputStyle, padding: 0, background: 'transparent', border: 'none', fontSize: 16 }}
                  type={type}
                  placeholder={placeholder || label}
                  value={form[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${N.sep}` }}>
              <div style={{ fontSize: 12, color: N.text3, marginBottom: 6 }}>Year</div>
              <select
                style={{ background: 'transparent', border: 'none', color: N.text1, fontSize: 16, outline: 'none', width: '100%' }}
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              >
                <option value="">Select…</option>
                {['Freshman','Sophomore','Junior','Senior','Graduate','Alumni'].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ width: '100%', padding: '13px', borderRadius: 12, background: saved ? 'rgba(48,209,88,0.2)' : N.accent, color: saved ? N.success : '#fff', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Info display (view mode) */}
        {!editMode && (
          <div style={{ margin: '16px 16px 0', background: N.card, borderRadius: 14, overflow: 'hidden' }}>
            {[
              { label: 'Phone',        value: form.phone || 'Not set',  muted: !form.phone },
              { label: 'Major',        value: form.major || '—',        muted: !form.major },
              { label: 'Year',         value: form.year || '—',         muted: !form.year },
              { label: 'Pledge Class', value: form.pledgeClass || '—',  muted: !form.pledgeClass },
              { label: 'Position',     value: form.position || '—',     muted: !form.position },
            ].map(({ label, value, muted }, idx, arr) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: idx < arr.length - 1 ? `1px solid ${N.sep}` : 'none' }}>
                <span style={{ fontSize: 16, color: N.text1 }}>{label}</span>
                <span style={{ fontSize: 16, color: muted ? N.text3 : N.text2 }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (loading) return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, height: 200 }} />
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, height: 140 }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>

        {/* Hero Card */}
        <div style={{
          background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)', overflow: 'hidden', marginBottom: 16,
        }}>
          {/* Gradient header banner */}
          <div style={{
            height: 90,
            background: 'linear-gradient(135deg, rgba(79,142,247,0.25) 0%, rgba(167,139,250,0.25) 50%, rgba(79,142,247,0.1) 100%)',
            borderBottom: `1px solid ${T.border}`,
            position: 'relative',
          }}>
            {/* Subtle grid overlay */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.15,
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }} />
          </div>

          <div style={{ padding: '0 24px 24px' }}>
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -36, marginBottom: 16 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 24,
                boxShadow: '0 0 24px rgba(79,142,247,0.4), 0 8px 32px rgba(0,0,0,0.5)',
                border: `3px solid ${T.card}`,
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <button
                onClick={() => setEditMode(e => !e)}
                style={{
                  background: editMode ? T.accent : 'rgba(255,255,255,0.06)',
                  color: editMode ? '#fff' : T.text2,
                  border: `1px solid ${editMode ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, padding: '7px 14px', fontWeight: 600, cursor: 'pointer',
                  fontSize: 12, transition: 'all 0.15s',
                  boxShadow: editMode ? '0 0 16px rgba(79,142,247,0.25)' : 'none',
                }}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <h1 style={{ fontSize: 20, fontWeight: 800, color: T.text1, margin: '0 0 8px' }}>
              {form.firstName} {form.lastName}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                background: roleCfg.bg, color: roleCfg.color, border: `1px solid ${roleCfg.border}`,
                textTransform: 'capitalize',
              }}>
                {roleCfg.label}
              </span>
              {form.position && <span style={{ fontSize: 13, color: T.text2 }}>{form.position}</span>}
              {form.pledgeClass && <span style={{ fontSize: 12, color: T.text3 }}>{form.pledgeClass}</span>}
            </div>
            <p style={{ fontSize: 13, color: T.text3, margin: 0 }}>{user?.email}</p>
          </div>

          {/* Stats strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${T.border}` }}>
            {[
              { icon: Trophy,       value: user?.points ?? 0,              label: 'Points',    color: T.gold },
              { icon: BookOpen,     value: user?.gpa?.toFixed(2) ?? '—',   label: 'GPA',       color: T.accent },
              { icon: ClipboardList,value: user?.studyHours ?? 0,          label: 'Study Hrs', color: T.success },
            ].map(({ icon: Icon, value, label, color }, i) => (
              <div key={label} style={{
                padding: '18px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
              }}>
                <Icon size={16} style={{ color }} />
                <p style={{ fontSize: 20, fontWeight: 800, color: T.text1, margin: 0 }}>{value}</p>
                <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phone nudge */}
        {!form.phone && !editMode && (
          <div
            onClick={() => setEditMode(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.2)',
              borderRadius: 12, padding: '14px 16px', marginBottom: 16,
              transition: 'background 0.15s',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'rgba(240,180,41,0.15)', border: '1px solid rgba(240,180,41,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Phone size={17} style={{ color: T.gold }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.gold, margin: '0 0 2px' }}>Add your phone number</p>
              <p style={{ fontSize: 12, color: 'rgba(240,180,41,0.7)', margin: 0 }}>Get SMS dues reminders from your chapter</p>
            </div>
            <ChevronRight size={16} style={{ color: 'rgba(240,180,41,0.5)' }} />
          </div>
        )}

        {/* Edit Form */}
        {editMode && (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)', padding: '20px 24px', marginBottom: 16,
          }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: T.text1, margin: '0 0 20px' }}>Edit Profile</h2>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {saveError && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8, fontSize: 13, color: T.danger,
                }}>
                  {saveError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input style={inputStyle} value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input style={inputStyle} value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required />
                </div>
              </div>

              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={11} style={{ color: T.text3 }} /> Phone
                  <span style={{ fontWeight: 500, color: T.success, textTransform: 'none', letterSpacing: 'normal', fontSize: 11 }}>(SMS reminders)</span>
                </label>
                <input style={inputStyle} type="tel" placeholder="555-867-5309"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Major</label>
                  <input style={inputStyle} placeholder="Finance"
                    value={form.major} onChange={e => setForm(f => ({ ...f, major: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Year</label>
                  <select style={inputStyle} value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                    <option value="">Select…</option>
                    {['Freshman','Sophomore','Junior','Senior','Graduate','Alumni'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Pledge Class</label>
                  <input style={inputStyle} placeholder="Fall 2023"
                    value={form.pledgeClass} onChange={e => setForm(f => ({ ...f, pledgeClass: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Position / Title</label>
                  <input style={inputStyle} placeholder="Rush Chair"
                    value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  background: saved ? 'rgba(52,211,153,0.15)' : T.accent,
                  color: saved ? T.success : '#fff',
                  border: `1px solid ${saved ? 'rgba(52,211,153,0.3)' : 'transparent'}`,
                  borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer',
                  fontSize: 14, width: '100%', transition: 'all 0.2s',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: saved ? 'none' : '0 0 20px rgba(79,142,247,0.2)',
                }}
              >
                {saved ? <><CheckCircle2 size={15} /> Saved!</> : saving ? 'Saving…' : <><Save size={15} /> Save Changes</>}
              </button>
            </form>
          </div>
        )}

        {/* Info display (view mode) */}
        {!editMode && (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,0.4)', overflow: 'hidden',
          }}>
            {[
              { label: 'Phone',        value: form.phone || 'Not set',   muted: !form.phone },
              { label: 'Major',        value: form.major || '—',         muted: !form.major },
              { label: 'Year',         value: form.year || '—',          muted: !form.year },
              { label: 'Pledge Class', value: form.pledgeClass || '—',   muted: !form.pledgeClass },
              { label: 'Position',     value: form.position || '—',      muted: !form.position },
            ].map(({ label, value, muted }, idx, arr) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: idx < arr.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <span style={{ fontSize: 13, color: T.text3 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: muted ? T.text3 : T.text1 }}>{value}</span>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
