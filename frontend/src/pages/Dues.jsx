import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, Plus, Search, Download, Send, Check, X,
  AlertCircle, ChevronDown, Filter, TrendingUp, Clock, AlertTriangle,
  FileSpreadsheet, ArrowRight
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import ImportComponent from './Import';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: '#070B14',
  card: '#0D1424',
  elevated: '#131D2E',
  accent: '#4F8EF7',
  gold: '#F0B429',
  success: '#34D399',
  danger: '#F87171',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
  border: 'rgba(255,255,255,0.07)',
  cardShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const cardStyle = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  boxShadow: T.cardShadow,
};

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  paid:    { label: 'Paid',    color: T.success, bg: 'rgba(52,211,153,0.12)' },
  unpaid:  { label: 'Unpaid',  color: T.danger,  bg: 'rgba(248,113,113,0.12)' },
  partial: { label: 'Partial', color: T.gold,    bg: 'rgba(240,180,41,0.12)' },
  waived:  { label: 'Waived',  color: T.textMuted, bg: 'rgba(71,85,105,0.2)' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unpaid;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: cfg.color,
      background: cfg.bg,
    }}>
      {cfg.label}
    </span>
  );
};

const formatCurrency = (cents) => {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Input / label styles ─────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: T.textSecondary,
  marginBottom: 6,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const inputStyle = {
  width: '100%',
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  padding: '9px 12px',
  color: T.textPrimary,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 150ms ease',
};

const selectStyle = { ...inputStyle };

// ─── Create Dues Modal ────────────────────────────────────────────────────────
const CreateDuesModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ semester: '', amount: '', dueDate: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async () => {
    if (!form.semester || !form.amount) { setError('Semester and amount are required.'); return; }
    const amountCents = Math.round(parseFloat(form.amount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) { setError('Enter a valid amount.'); return; }
    setLoading(true);
    try {
      const res = await client.post('/dues', { ...form, amount: amountCents });
      if (res.data.success) { onSave(res.data.data); onClose(); }
      else setError(res.data.error || 'Failed to create dues record');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const currentYear = new Date().getFullYear();
  const semesters = [
    `Fall ${currentYear}`, `Spring ${currentYear + 1}`,
    `Fall ${currentYear - 1}`, `Spring ${currentYear}`,
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Dues Record" size="md"
      footer={
        <>
          <button style={{ ...btnSecondary }} onClick={onClose}>Cancel</button>
          <button style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : 'Create record'}
          </button>
        </>
      }
    >
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: 'rgba(248,113,113,0.1)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 8,
          marginBottom: 16,
          color: T.danger,
          fontSize: 13,
        }}>
          <X size={14} />{error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Semester *</label>
          <select style={selectStyle} value={form.semester} onChange={e => update('semester', e.target.value)}>
            <option value="">Select semester…</option>
            {semesters.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Amount *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 14 }}>$</span>
              <input type="number" step="0.01" min="0" style={{ ...inputStyle, paddingLeft: 24 }} placeholder="200.00" value={form.amount} onChange={e => update('amount', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Due date</label>
            <input type="date" style={inputStyle} value={form.dueDate} onChange={e => update('dueDate', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <input style={inputStyle} placeholder="Semester dues, initiation fee, etc." value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// ─── Mark Payment Modal ───────────────────────────────────────────────────────
const MarkPaymentModal = ({ dueRecord, isOpen, onClose, onSave }) => {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('paid');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dueRecord) {
      const remaining = (dueRecord.amount - (dueRecord.paidAmount || 0)) / 100;
      setAmount(remaining.toFixed(2));
    }
  }, [dueRecord]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await client.post(`/dues/${dueRecord.id}/payment`, {
        amount: Math.round(parseFloat(amount) * 100),
        status,
        paidDate: date,
      });
      if (res.data.success) { onSave(res.data.data); onClose(); }
    } catch { /* empty */ }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="sm"
      footer={
        <>
          <button style={btnSecondary} onClick={onClose}>Cancel</button>
          <button style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Record payment'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Amount paid</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 14 }}>$</span>
            <input type="number" step="0.01" min="0" style={{ ...inputStyle, paddingLeft: 24 }} value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Status</label>
          <select style={selectStyle} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="paid">Paid in full</option>
            <option value="partial">Partial payment</option>
            <option value="waived">Waived</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Payment date</label>
          <input type="date" style={inputStyle} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// ─── Button styles ────────────────────────────────────────────────────────────
const btnPrimary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  background: T.accent,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
  whiteSpace: 'nowrap',
};

const btnSecondary = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  background: T.elevated,
  color: T.textSecondary,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
  whiteSpace: 'nowrap',
};

// ─── Main Dues Page ───────────────────────────────────────────────────────────
export default function Dues() {
  const { user } = useAuth();
  const [dues, setDues] = useState([]);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [sendingReminder, setSendingReminder] = useState(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const fetchData = useCallback(async () => {
    try {
      const duesRes = await client.get('/dues');
      if (duesRes.data.success) setDues(duesRes.data.data || []);
    } catch { /* empty */ }
    try {
      const finesRes = await client.get('/dues/fines');
      if (finesRes.data.success) setFines(finesRes.data.data || []);
    } catch { setFines([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePaymentSave = (updated) => {
    setDues(prev => prev.map(d => d.id === updated.id ? { ...d, status: updated.status, paidAmount: updated.amount, paidDate: updated.paidAt } : d));
    fetchData();
  };

  const sendReminder = async (dueId) => {
    setSendingReminder(dueId);
    try { await client.post(`/dues/${dueId}/reminder`); }
    catch { /* empty */ }
    finally { setSendingReminder(null); }
  };

  const sendBulkReminder = async () => {
    const ids = selected.size > 0 ? [...selected] : dues.filter(d => d.status === 'unpaid' || d.status === 'partial').map(d => d.id);
    await Promise.all(ids.map(id => client.post(`/dues/${id}/reminder`).catch(() => {})));
    setSelected(new Set());
  };

  const exportCSV = () => {
    const rows = [['Member', 'Semester', 'Amount', 'Paid', 'Status', 'Due Date', 'Paid Date']];
    dues.forEach(d => rows.push([
      d.memberName || '',
      d.semester || '',
      formatCurrency(d.amount),
      formatCurrency(d.paidAmount),
      d.status,
      formatDate(d.dueDate),
      formatDate(d.paidDate),
    ]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dues.csv';
    a.click();
  };

  const filtered = dues.filter(d => {
    const matchSearch = !search || d.memberName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalAmount = dues.reduce((s, d) => s + (d.amount || 0), 0);
  const totalPaid = dues.reduce((s, d) => s + (d.paidAmount || 0), 0);
  const totalOutstanding = totalAmount - totalPaid;
  const collectionRate = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statCards = [
    {
      label: 'Total Collected',
      value: loading ? '—' : formatCurrency(totalPaid),
      sub: loading ? null : `of ${formatCurrency(totalAmount)}`,
      icon: Check,
      iconColor: T.success,
      iconBg: 'rgba(52,211,153,0.15)',
    },
    {
      label: 'Outstanding',
      value: loading ? '—' : formatCurrency(totalOutstanding),
      sub: loading ? null : `${dues.filter(d => d.status !== 'paid').length} unpaid records`,
      icon: AlertTriangle,
      iconColor: T.danger,
      iconBg: 'rgba(248,113,113,0.15)',
    },
    {
      label: 'Collection Rate',
      value: loading ? '—' : `${collectionRate}%`,
      sub: loading ? null : `${dues.filter(d => d.status === 'paid').length} / ${dues.length} members`,
      icon: TrendingUp,
      iconColor: T.accent,
      iconBg: 'rgba(79,142,247,0.15)',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '0 0 48px' }}>

      {/* Header */}
      <div style={{ padding: '28px 24px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.03em' }}>Dues</h1>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: '4px 0 0' }}>Track member payments and outstanding balances</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button style={btnSecondary} onClick={exportCSV}><Download size={14} /> Export</button>
          {isAdmin && (
            <>
              <button style={btnSecondary} onClick={() => window.location.href='/import'}>
                <FileSpreadsheet size={14} /> Import Spreadsheet
              </button>
              <button style={btnPrimary} onClick={() => setShowCreate(true)}>
                <Plus size={15} /> Create Record
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, padding: '0 24px 24px' }}>
        {statCards.map(({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
          <div key={label} style={{ ...cardStyle, padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} color={iconColor} />
            </div>
            <div>
              <p style={{ fontSize: 22, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
              <p style={{ fontSize: 12, color: T.textSecondary, margin: '2px 0 0', fontWeight: 500 }}>{label}</p>
              {sub && <p style={{ fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Bulk Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, padding: '0 24px 16px' }}>
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            style={{ ...inputStyle, paddingLeft: 36 }}
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select style={{ ...selectStyle, width: 'auto', paddingRight: 32 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        {isAdmin && (
          <>
            <button onClick={sendBulkReminder} style={btnSecondary}>
              <Send size={13} />
              {selected.size > 0 ? `Email ${selected.size}` : 'Email Unpaid'}
            </button>
            <button onClick={async () => {
              if (!dues[0]?.id) return;
              const r = await client.post('/dues/sms-reminders', { duesRecordId: dues[0].duesRecordId }).catch(() => null);
              if (r?.data?.data) alert(`SMS sent to ${r.data.data.sent} members${r.data.data.noPhone > 0 ? ` (${r.data.data.noPhone} had no phone number)` : ''}`);
            }} style={{ ...btnSecondary, color: T.success, borderColor: 'rgba(52,211,153,0.3)' }}>
              SMS Unpaid
            </button>
          </>
        )}
      </div>

      {/* Dues Table */}
      <div style={{ padding: '0 24px', marginBottom: 32 }}>
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '0' }}>
              {Array(5).fill(0).map((_, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px',
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  {[120, 60, 60, 60, 56].map((w, j) => (
                    <div key={j} style={{ height: 14, width: w, background: T.elevated, borderRadius: 6, opacity: 0.6 }} />
                  ))}
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center' }}>
              <DollarSign size={32} color={T.textMuted} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: T.textMuted }}>No dues records found</p>
            </div>
          ) : (() => {
            const hasExtended = filtered.some(d => d.winterPayment > 0 || d.springPayment > 0 || d.discount > 0 || d.owing != null);
            return (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {isAdmin && (
                        <th style={{ width: 36, padding: '12px 12px 12px 16px' }}>
                          <input type="checkbox" style={{ accentColor: T.accent }}
                            onChange={e => setSelected(e.target.checked ? new Set(filtered.map(d => d.id)) : new Set())}
                            checked={selected.size === filtered.length && filtered.length > 0} />
                        </th>
                      )}
                      {['Member', 'Dues Owed', ...(hasExtended ? ['Discount', 'Paid (Winter)', 'Paid (Spring)'] : []), 'A/R', 'Status', 'Notes', ...(isAdmin ? [''] : [])].map((h, i) => (
                        <th key={i} style={{
                          padding: '11px 12px',
                          textAlign: h === 'Member' || h === 'Notes' || h === '' ? 'left' : 'right',
                          fontSize: 11,
                          fontWeight: 700,
                          color: T.textMuted,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          background: T.elevated,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((due, idx) => {
                      const isPaid = due.status === 'paid';
                      const isWaived = due.status === 'waived';
                      const owing = due.owing != null ? due.owing : (due.amount - (due.winterPayment || 0) - (due.springPayment || 0) - (due.discount || 0));
                      const statusDot = isPaid ? T.success : isWaived ? T.textMuted : due.status === 'partial' ? T.gold : T.danger;
                      return (
                        <tr
                          key={due.id}
                          style={{
                            borderBottom: idx < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                            background: selected.has(due.id) ? 'rgba(79,142,247,0.06)' : 'transparent',
                            transition: 'background 150ms ease',
                          }}
                          onMouseEnter={e => { if (!selected.has(due.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = selected.has(due.id) ? 'rgba(79,142,247,0.06)' : 'transparent'; }}
                        >
                          {isAdmin && (
                            <td style={{ padding: '12px 12px 12px 16px' }}>
                              <input type="checkbox" style={{ accentColor: T.accent }}
                                checked={selected.has(due.id)} onChange={() => toggleSelect(due.id)} />
                            </td>
                          )}
                          {/* Member */}
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusDot, flexShrink: 0 }} />
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%',
                                background: 'rgba(79,142,247,0.15)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: T.accent, fontSize: 10, fontWeight: 700, flexShrink: 0,
                              }}>
                                {due.memberName?.split(' ').map(n => n[0]).join('') || '?'}
                              </div>
                              <span style={{ fontWeight: 600, color: T.textPrimary, whiteSpace: 'nowrap' }}>{due.memberName || '—'}</span>
                            </div>
                          </td>
                          {/* Dues Owed */}
                          <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', color: T.textSecondary }}>{formatCurrency(due.amount)}</td>
                          {/* Discount */}
                          {hasExtended && (
                            <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                              {due.discount > 0
                                ? <span style={{ color: T.success }}>−{formatCurrency(due.discount)}</span>
                                : <span style={{ color: T.textMuted }}>—</span>}
                            </td>
                          )}
                          {/* Paid Winter */}
                          {hasExtended && (
                            <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                              {due.winterPayment > 0
                                ? <span style={{ color: T.success }}>{formatCurrency(due.winterPayment)}</span>
                                : <span style={{ color: T.textMuted }}>—</span>}
                            </td>
                          )}
                          {/* Paid Spring */}
                          {hasExtended && (
                            <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace' }}>
                              {due.springPayment > 0
                                ? <span style={{ color: T.success }}>{formatCurrency(due.springPayment)}</span>
                                : <span style={{ color: T.textMuted }}>—</span>}
                            </td>
                          )}
                          {/* A/R */}
                          <td style={{ padding: '12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                            {owing <= 0
                              ? <span style={{ color: T.success }}>—</span>
                              : <span style={{ color: T.danger }}>{formatCurrency(owing)}</span>}
                          </td>
                          {/* Status */}
                          <td style={{ padding: '12px' }}><StatusBadge status={due.status} /></td>
                          {/* Notes */}
                          <td style={{ padding: '12px', color: T.textMuted, fontSize: 12, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={due.notes || ''}>
                            {due.notes || ''}
                          </td>
                          {/* Actions */}
                          {isAdmin && (
                            <td style={{ padding: '12px 16px 12px 4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                {!isPaid && !isWaived && (
                                  <button
                                    onClick={() => setPayModal(due)}
                                    style={{
                                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      background: 'rgba(52,211,153,0.12)', color: T.success, border: 'none', borderRadius: 7,
                                      cursor: 'pointer', transition: 'opacity 150ms ease',
                                    }}
                                    title="Mark paid"
                                  >
                                    <Check size={13} />
                                  </button>
                                )}
                                {(due.status === 'unpaid' || due.status === 'partial') && (
                                  <button
                                    onClick={() => sendReminder(due.id)}
                                    disabled={sendingReminder === due.id}
                                    style={{
                                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      background: 'transparent', color: T.textMuted, border: 'none', borderRadius: 7,
                                      cursor: 'pointer', transition: 'color 150ms ease',
                                    }}
                                    title="Send reminder"
                                  >
                                    {sendingReminder === due.id
                                      ? <span style={{ width: 12, height: 12, border: `2px solid ${T.textMuted}`, borderTopColor: T.textSecondary, borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                                      : <Send size={12} />}
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Fines Section */}
      {fines.length > 0 && (
        <div style={{ padding: '0 24px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: T.textSecondary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Fines</h2>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.elevated }}>
                  {['Member', 'Reason', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fines.map((fine, idx) => (
                  <tr key={fine.id} style={{ borderBottom: idx < fines.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                    <td style={{ padding: '12px 16px', color: T.textPrimary, fontWeight: 600 }}>{fine.memberName || '—'}</td>
                    <td style={{ padding: '12px 16px', color: T.textSecondary }}>{fine.reason || '—'}</td>
                    <td style={{ padding: '12px 16px', color: T.textPrimary, fontWeight: 700 }}>{formatCurrency(fine.amount)}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={fine.status} /></td>
                    <td style={{ padding: '12px 16px', color: T.textMuted }}>{formatDate(fine.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showImport} onClose={() => { setShowImport(false); fetchData(); }} title="Import Dues" size="xl">
        <div style={{ padding: 4 }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, marginBottom: 16,
          }}>
            <FileSpreadsheet size={16} color={T.success} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: T.textSecondary }}>
              <p style={{ fontWeight: 600, color: T.success, margin: '0 0 2px' }}>Format: Name (or First/Last), Paid (Yes/No), Amount (optional)</p>
              <p style={{ margin: 0, fontSize: 12, color: T.textMuted }}>Upload your spreadsheet → map columns → hit Import. Takes 30 seconds.</p>
            </div>
          </div>
          <ImportComponent
            onboardingMode={true}
            defaultType="dues"
            onDone={() => { setShowImport(false); fetchData(); }}
          />
        </div>
      </Modal>
      <CreateDuesModal isOpen={showCreate} onClose={() => setShowCreate(false)} onSave={(d) => setDues(prev => [d, ...prev])} />
      {payModal && (
        <MarkPaymentModal dueRecord={payModal} isOpen={!!payModal} onClose={() => setPayModal(null)} onSave={handlePaymentSave} />
      )}
    </div>
  );
}
