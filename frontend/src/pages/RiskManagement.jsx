import React, { useState, useEffect } from 'react';
import { Shield, Plus, CheckCircle2, Circle, Trash2, Users, AlertTriangle } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const DEFAULT_ITEMS = [
  'AlcoholEdu / Haven Completion',
  'Title IX Training',
  'Risk Management Policy Acknowledgment',
  'Anti-Hazing Certification',
  'Bystander Intervention Training',
];

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: T.text1,
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  fontSize: 14,
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: T.text2,
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

export default function RiskManagement() {
  const { user } = useAuth();
  const [data, setData] = useState({ items: [], totalMembers: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState({});

  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const load = () => {
    setLoading(true);
    client.get('/risk').then(r => setData(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post('/risk', form);
      setShowModal(false);
      setForm({ title: '', description: '', dueDate: '' });
      load();
    } finally { setSaving(false); }
  };

  const toggleComplete = async (itemId) => {
    setCompleting(c => ({ ...c, [itemId]: true }));
    try {
      await client.post(`/risk/${itemId}/complete`, {});
      load();
    } finally { setCompleting(c => ({ ...c, [itemId]: false })); }
  };

  const deleteItem = async (id) => {
    if (!confirm('Delete this requirement?')) return;
    await client.delete(`/risk/${id}`);
    load();
  };

  const addDefaults = async () => {
    for (const title of DEFAULT_ITEMS) {
      await client.post('/risk', { title, required: true }).catch(() => {});
    }
    load();
  };

  const myCompletedIds = new Set(
    data.items.flatMap(i => i.completions.filter(c => c.memberId === user?.id).map(c => c.riskItemId))
  );

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0 }}>Risk Management</h1>
          <p style={{ color: T.text2, marginTop: 6, fontSize: 14, margin: '6px 0 0' }}>Track chapter compliance and member training requirements</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 10 }}>
            {data.items.length === 0 && (
              <button
                onClick={addDefaults}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: T.text1,
                  border: '1px solid ' + T.borderStrong,
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Load Defaults
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: T.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 16px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(79,142,247,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Plus size={16} /> Add Requirement
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{
          background: T.card,
          border: '1px solid ' + T.border,
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
          color: T.text2,
        }}>
          Loading…
        </div>
      ) : data.items.length === 0 ? (
        <div style={{
          background: T.card,
          border: '1px solid ' + T.border,
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <div style={{ background: 'rgba(248,113,113,0.1)', borderRadius: 10, padding: 14, display: 'inline-flex', marginBottom: 16 }}>
            <Shield size={32} color={T.danger} />
          </div>
          <p style={{ fontWeight: 600, color: T.text1, marginBottom: 8, fontSize: 15 }}>No requirements set</p>
          <p style={{ fontSize: 13, color: T.text2, marginBottom: 20 }}>Add compliance requirements for your chapter members</p>
          {isAdmin && (
            <button
              onClick={addDefaults}
              style={{
                background: T.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 20px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 0 20px rgba(79,142,247,0.2)',
              }}
            >
              Load Standard Requirements
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.items.map(item => {
            const completed = item.completions.length;
            const total = data.totalMembers;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const iDone = myCompletedIds.has(item.id);
            const barColor = pct === 100 ? T.success : pct > 60 ? T.gold : T.danger;

            return (
              <div
                key={item.id}
                style={{
                  background: T.card,
                  border: '1px solid ' + T.border,
                  borderRadius: 12,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <button
                    onClick={() => toggleComplete(item.id)}
                    disabled={completing[item.id]}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      marginTop: 2,
                      flexShrink: 0,
                      color: iDone ? T.success : T.text3,
                      display: 'flex',
                      transition: 'color 0.2s',
                    }}
                  >
                    {iDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: iDone ? T.text3 : T.text1,
                          textDecoration: iDone ? 'line-through' : 'none',
                          margin: '0 0 4px',
                        }}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p style={{ fontSize: 13, color: T.text2, margin: '0 0 4px' }}>{item.description}</p>
                        )}
                        {item.dueDate && (
                          <p style={{ fontSize: 12, color: T.warning, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={11} />
                            Due {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 14, fontWeight: 700, color: T.text1, margin: 0 }}>{pct}%</p>
                          <p style={{ fontSize: 11, color: T.text2, margin: '2px 0 0' }}>{completed}/{total} members</p>
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => deleteItem(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: '6px',
                              cursor: 'pointer',
                              color: T.text3,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = T.danger}
                            onMouseLeave={e => e.currentTarget.style.color = T.text3}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{
                      marginTop: 12,
                      height: 6,
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        borderRadius: 999,
                        background: barColor,
                        width: `${pct}%`,
                        transition: 'width 0.5s ease',
                        boxShadow: `0 0 8px ${barColor}55`,
                      }} />
                    </div>

                    {/* Completion tags */}
                    {item.completions.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {item.completions.slice(0, 8).map(c => (
                          <span
                            key={c.id}
                            style={{
                              fontSize: 11,
                              background: 'rgba(52,211,153,0.1)',
                              color: T.success,
                              border: '1px solid rgba(52,211,153,0.2)',
                              borderRadius: 999,
                              padding: '2px 10px',
                              fontWeight: 500,
                            }}
                          >
                            {c.member.firstName} {c.member.lastName[0]}.
                          </span>
                        ))}
                        {item.completions.length > 8 && (
                          <span style={{ fontSize: 11, color: T.text3 }}>+{item.completions.length - 8} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Requirement">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Requirement Title</label>
            <input
              style={inputStyle}
              placeholder="e.g. AlcoholEdu Completion"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Description (optional)</label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              rows={2}
              placeholder="Additional details or instructions"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label style={labelStyle}>Due Date (optional)</label>
            <input
              style={inputStyle}
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                color: T.text1,
                border: '1px solid ' + T.borderStrong,
                borderRadius: 8,
                padding: '9px 16px',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                background: T.accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 16px',
                fontWeight: 600,
                fontSize: 13,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 0 20px rgba(79,142,247,0.2)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Adding…' : 'Add Requirement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
