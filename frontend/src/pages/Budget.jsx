import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Filter } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';
import { getIsNative } from '../hooks/useNative';

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

const CATEGORIES = {
  income: ['dues', 'fundraising', 'donations', 'sponsorship', 'other'],
  expense: ['venue', 'food', 'supplies', 'apparel', 'philanthropy', 'other'],
};

const CAT_CONFIG = {
  dues:         { color: '#60A5FA', bg: 'rgba(96,165,250,0.15)' },
  fundraising:  { color: '#34D399', bg: 'rgba(52,211,153,0.15)' },
  donations:    { color: '#A78BFA', bg: 'rgba(167,139,250,0.15)' },
  sponsorship:  { color: '#F0B429', bg: 'rgba(240,180,41,0.15)' },
  venue:        { color: '#F87171', bg: 'rgba(248,113,113,0.15)' },
  food:         { color: '#FB923C', bg: 'rgba(251,146,60,0.15)' },
  supplies:     { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
  apparel:      { color: '#818CF8', bg: 'rgba(129,140,248,0.15)' },
  philanthropy: { color: '#2DD4BF', bg: 'rgba(45,212,191,0.15)' },
  other:        { color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' },
};

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: T.textSecondary,
  marginBottom: 6,
  letterSpacing: '0.05em',
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

const btnPrimary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '8px 16px',
  background: T.accent,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
};

const btnSecondary = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '7px 14px',
  background: T.elevated,
  color: T.textSecondary,
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 150ms ease',
};

// ─── Native design tokens ─────────────────────────────────────────────────────
const N = {
  bg: '#080C14', card: '#111827', elevated: '#1E2A3A',
  border: 'rgba(255,255,255,0.08)',
  accent: '#3B82F6', gold: '#F59E0B', success: '#10B981', danger: '#EF4444', purple: '#8B5CF6',
  text1: '#FFFFFF', text2: 'rgba(255,255,255,0.55)', text3: 'rgba(255,255,255,0.28)',
  sep: 'rgba(255,255,255,0.06)',
  font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
};

const NATIVE_CAT_COLORS = {
  dues:         '#3B82F6',
  fundraising:  '#10B981',
  donations:    '#8B5CF6',
  sponsorship:  '#F59E0B',
  venue:        '#EF4444',
  food:         '#F97316',
  supplies:     '#94A3B8',
  apparel:      '#6366F1',
  philanthropy: '#06B6D4',
  other:        '#94A3B8',
};

export default function Budget() {
  const isNative = getIsNative();
  const [data, setData] = useState({ transactions: [], summary: { income: 0, expenses: 0, balance: 0 } });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', category: 'dues', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const load = () => {
    setLoading(true);
    client.get('/budget').then(r => setData(r.data.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    try {
      await client.post('/budget', form);
      setShowModal(false);
      setForm({ type: 'income', amount: '', description: '', category: 'dues', date: new Date().toISOString().split('T')[0] });
      load();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Failed to save transaction.');
    } finally { setSaving(false); }
  };

  const deleteT = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    await client.delete(`/budget/${id}`);
    load();
  };

  const filtered = filter === 'all' ? data.transactions : data.transactions.filter(t => t.type === filter);
  const { income, expenses, balance } = data.summary;

  const summaryCards = [
    {
      label: 'Total Income',
      value: `$${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconColor: T.success,
      iconBg: 'rgba(52,211,153,0.15)',
      valueColor: T.success,
    },
    {
      label: 'Total Expenses',
      value: `$${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: TrendingDown,
      iconColor: T.danger,
      iconBg: 'rgba(248,113,113,0.15)',
      valueColor: T.danger,
    },
    {
      label: 'Balance',
      value: `${balance < 0 ? '-' : ''}$${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      iconColor: balance >= 0 ? T.success : T.danger,
      iconBg: balance >= 0 ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
      valueColor: balance >= 0 ? T.success : T.danger,
      highlight: true,
    },
  ];

  // ─── Native iOS layout ──────────────────────────────────────────────────────
  if (isNative) {
    const { income, expenses, balance } = data.summary;
    const nativeFiltered = filter === 'all' ? data.transactions : data.transactions.filter(t => t.type === filter);

    // Group by month
    const grouped = {};
    nativeFiltered.forEach(t => {
      const key = t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
    const monthGroups = Object.entries(grouped);

    const nativeTabs = ['All', 'Income', 'Expense'];
    const nativeTabKey = { All: 'all', Income: 'income', Expense: 'expense' };
    const activeTab = nativeTabs.find(t => nativeTabKey[t] === filter) || 'All';

    const totalIncome = income.toLocaleString('en-US', { minimumFractionDigits: 2 });
    const totalExpenses = expenses.toLocaleString('en-US', { minimumFractionDigits: 2 });

    return (
      <div style={{ background: N.bg, minHeight: '100vh', paddingBottom: 40, fontFamily: N.font }}>
        {/* Large title */}
        <h1 style={{ fontSize: 34, fontWeight: 800, color: N.text1, margin: 0, padding: '20px 20px 6px', letterSpacing: -0.8 }}>Budget</h1>

        {/* Full-width balance card */}
        <div style={{ margin: '16px 20px 0', background: balance >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: '1px solid ' + (balance >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'), borderRadius: 20, padding: '24px 20px' }}>
          <div style={{ fontSize: 13, color: N.text2, marginBottom: 6 }}>Total Balance</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: balance >= 0 ? N.success : N.danger, letterSpacing: -1, marginBottom: 16 }}>${Math.abs(balance).toLocaleString()}</div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: N.text3 }}>Income</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.success }}>${totalIncome}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: N.text3 }}>Expenses</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: N.danger }}>${totalExpenses}</div>
            </div>
          </div>
        </div>

        {/* Segmented control */}
        <div style={{ display: 'flex', background: N.elevated, borderRadius: 10, padding: 3, margin: '16px 20px 0' }}>
          {nativeTabs.map(t => (
            <button key={t} onClick={() => setFilter(nativeTabKey[t])} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: N.font, background: activeTab === t ? N.card : 'transparent', color: activeTab === t ? N.text1 : N.text2, boxShadow: activeTab === t ? '0 1px 4px rgba(0,0,0,0.4)' : 'none', transition: 'background 0.15s' }}>{t}</button>
          ))}
        </div>

        {/* Transaction list grouped by month */}
        {loading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: N.text3, fontSize: 14 }}>Loading…</div>
        ) : nativeFiltered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: N.text3, fontSize: 14 }}>No transactions</div>
        ) : monthGroups.map(([month, txns]) => (
          <div key={month} style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: N.text3, padding: '0 20px', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>{month}</div>
            <div style={{ background: N.card, borderRadius: 16, margin: '0 20px', border: '1px solid ' + N.border, overflow: 'hidden' }}>
              {txns.map((t, idx) => {
                const isIncome = t.type === 'income';
                const catColor = NATIVE_CAT_COLORS[t.category] || NATIVE_CAT_COLORS.other;
                const Icon = isIncome ? TrendingUp : TrendingDown;
                const dateStr = t.date ? new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: idx < txns.length - 1 ? '1px solid ' + N.sep : 'none' }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: catColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 14 }}>
                      <Icon size={18} style={{ color: catColor }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: N.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                      <div style={{ fontSize: 12, color: N.text2, marginTop: 2, textTransform: 'capitalize' }}>{t.category} · {dateStr}</div>
                    </div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: isIncome ? N.success : N.text1, marginLeft: 12, flexShrink: 0 }}>
                      {isIncome ? '+' : ''}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* FAB */}
        <button onClick={() => setShowModal(true)} style={{ position: 'fixed', bottom: 32, right: 24, width: 56, height: 56, borderRadius: 28, background: N.accent, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(59,130,246,0.45)' }}>
          <Plus size={24} style={{ color: '#fff' }} />
        </button>

        {/* Add Transaction Modal (reuse existing) */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSaveError(''); }} title="Add Transaction">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {saveError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, fontSize: 13, color: N.danger }}>{saveError}</div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              {['income', 'expense'].map(tp => (
                <button key={tp} type="button" onClick={() => setForm(f => ({ ...f, type: tp, category: CATEGORIES[tp][0] }))} style={{ flex: 1, padding: '9px', borderRadius: 8, fontSize: 13, fontWeight: 700, textTransform: 'capitalize', cursor: 'pointer', transition: 'all 150ms ease', border: form.type === tp ? `2px solid ${tp === 'income' ? N.success : N.danger}` : '2px solid ' + N.border, background: form.type === tp ? (tp === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : N.elevated, color: form.type === tp ? (tp === 'income' ? N.success : N.danger) : N.text2 }}>{tp}</button>
              ))}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: N.text2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Amount ($)</label>
              <input style={{ width: '100%', background: N.elevated, border: '1px solid ' + N.border, borderRadius: 8, padding: '9px 12px', color: N.text1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: N.text2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Description</label>
              <input style={{ width: '100%', background: N.elevated, border: '1px solid ' + N.border, borderRadius: 8, padding: '9px 12px', color: N.text1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} placeholder="e.g. Spring mixer ticket sales" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: N.text2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Category</label>
                <select style={{ width: '100%', background: N.elevated, border: '1px solid ' + N.border, borderRadius: 8, padding: '9px 12px', color: N.text1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES[form.type].map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: N.text2, marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Date</label>
                <input style={{ width: '100%', background: N.elevated, border: '1px solid ' + N.border, borderRadius: 8, padding: '9px 12px', color: N.text1, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center', padding: '8px 14px', background: N.elevated, color: N.text2, border: '1px solid ' + N.border, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ flex: 1, justifyContent: 'center', padding: '8px 16px', background: N.accent, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving…' : 'Add Transaction'}</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, padding: '0 0 48px' }}>

      {/* Header */}
      <div style={{ padding: '28px 24px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.03em' }}>Treasury</h1>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: '4px 0 0' }}>Track chapter income, expenses, and running balance</p>
        </div>
        <button onClick={() => setShowModal(true)} style={btnPrimary}>
          <Plus size={15} /> Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: '0 24px 24px' }}>
        {summaryCards.map(({ label, value, icon: Icon, iconColor, iconBg, valueColor, highlight }) => (
          <div key={label} style={{
            ...cardStyle,
            padding: '20px',
            ...(highlight ? { border: `1px solid ${balance >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}` } : {}),
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={iconColor} />
              </div>
              <span style={{ fontSize: 12, color: T.textSecondary, fontWeight: 600, letterSpacing: '0.02em' }}>{label}</span>
            </div>
            <p style={{ fontSize: 22, fontWeight: 800, color: valueColor, margin: 0, letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Transaction List */}
      <div style={{ padding: '0 24px' }}>
        <div style={cardStyle}>
          {/* List Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.border}`,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: 0 }}>Transactions</h2>
            <div style={{ display: 'flex', gap: 2, background: T.bg, borderRadius: 8, padding: 3 }}>
              {['all', 'income', 'expense'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '5px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 150ms ease',
                    background: filter === f ? T.elevated : 'transparent',
                    color: filter === f ? T.textPrimary : T.textMuted,
                    boxShadow: filter === f ? `0 1px 4px rgba(0,0,0,0.3)` : 'none',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: T.textMuted }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '56px 20px', textAlign: 'center' }}>
              <DollarSign size={32} color={T.textMuted} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: T.textMuted, margin: '0 0 4px' }}>No transactions yet</p>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Add your first income or expense</p>
            </div>
          ) : (
            <div>
              {filtered.map((t, idx) => {
                const isIncome = t.type === 'income';
                const cat = CAT_CONFIG[t.category] || CAT_CONFIG.other;
                return (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 20px',
                      borderBottom: idx < filtered.length - 1 ? `1px solid ${T.border}` : 'none',
                      transition: 'background 150ms ease',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Type icon */}
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: isIncome ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isIncome
                        ? <TrendingUp size={14} color={T.success} />
                        : <TrendingDown size={14} color={T.danger} />}
                    </div>

                    {/* Description + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.description}
                      </p>
                      <p style={{ fontSize: 12, color: T.textMuted, margin: '2px 0 0' }}>
                        {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {t.createdBy?.firstName ? ` · ${t.createdBy.firstName}` : ''}
                      </p>
                    </div>

                    {/* Category chip */}
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      textTransform: 'capitalize',
                      color: cat.color,
                      background: cat.bg,
                      flexShrink: 0,
                    }}>
                      {t.category}
                    </span>

                    {/* Amount */}
                    <p style={{
                      fontWeight: 800,
                      fontSize: 15,
                      width: 96,
                      textAlign: 'right',
                      flexShrink: 0,
                      color: isIncome ? T.success : T.danger,
                      margin: 0,
                      letterSpacing: '-0.01em',
                    }}>
                      {isIncome ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>

                    {/* Delete */}
                    <button
                      onClick={() => deleteT(t.id)}
                      style={{
                        width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'transparent', border: 'none', borderRadius: 7,
                        color: T.textMuted, cursor: 'pointer', transition: 'all 150ms ease', flexShrink: 0,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSaveError(''); }} title="Add Transaction">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {saveError && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 8,
              fontSize: 13,
              color: T.danger,
            }}>{saveError}</div>
          )}

          {/* Income / Expense toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {['income', 'expense'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(f => ({ ...f, type: t, category: CATEGORIES[t][0] }))}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  border: form.type === t
                    ? `2px solid ${t === 'income' ? T.success : T.danger}`
                    : `2px solid ${T.border}`,
                  background: form.type === t
                    ? (t === 'income' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)')
                    : T.elevated,
                  color: form.type === t
                    ? (t === 'income' ? T.success : T.danger)
                    : T.textMuted,
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div>
            <label style={labelStyle}>Amount ($)</label>
            <input style={inputStyle} type="number" step="0.01" min="0" placeholder="0.00"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} placeholder="e.g. Spring mixer ticket sales"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={inputStyle} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES[form.type].map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} type="date"
                value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
