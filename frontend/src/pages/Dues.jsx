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

const STATUS_CONFIG = {
  paid: { label: 'Paid', classes: 'badge-green' },
  unpaid: { label: 'Unpaid', classes: 'badge-red' },
  partial: { label: 'Partial', classes: 'badge-yellow' },
  waived: { label: 'Waived', classes: 'badge-gray' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unpaid;
  return <span className={cfg.classes}>{cfg.label}</span>;
};

const formatCurrency = (cents) => {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Create Dues Record Modal
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
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating…' : 'Create record'}
          </button>
        </>
      }
    >
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
          <X size={14} />{error}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className="label">Semester *</label>
          <select className="select-field" value={form.semester} onChange={e => update('semester', e.target.value)}>
            <option value="">Select semester…</option>
            {semesters.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Amount *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input type="number" step="0.01" min="0" className="input-field pl-7" placeholder="200.00" value={form.amount} onChange={e => update('amount', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Due date</label>
            <input type="date" className="input-field" value={form.dueDate} onChange={e => update('dueDate', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input-field" placeholder="Semester dues, initiation fee, etc." value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// Mark Payment Modal
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
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Record payment'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Amount paid</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input type="number" step="0.01" min="0" className="input-field pl-7" value={amount} onChange={e => setAmount(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select-field" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="paid">Paid in full</option>
            <option value="partial">Partial payment</option>
            <option value="waived">Waived</option>
          </select>
        </div>
        <div>
          <label className="label">Payment date</label>
          <input type="date" className="input-field" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

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
    // Fines is optional — don't let it break dues loading
    try {
      const finesRes = await client.get('/dues/fines');
      if (finesRes.data.success) setFines(finesRes.data.data || []);
    } catch { setFines([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePaymentSave = (updated) => {
    setDues(prev => prev.map(d => d.id === updated.id ? { ...d, status: updated.status, paidAmount: updated.amount, paidDate: updated.paidAt } : d));
    fetchData(); // re-fetch to get accurate flat data from server
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

  // Summary stats
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

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Dues</h1>
          <p className="page-subtitle">Track member payments and outstanding balances</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary" onClick={exportCSV}><Download size={15} /> Export</button>
          {isAdmin && (
            <>
              <button className="btn-secondary" onClick={() => window.location.href='/import'}>
                <FileSpreadsheet size={15} /> Import Spreadsheet
              </button>
              <button className="btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={16} /> Create Record
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Collected', value: loading ? '—' : formatCurrency(totalPaid), icon: Check, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', sub: loading ? null : `of ${formatCurrency(totalAmount)}` },
          { label: 'Outstanding', value: loading ? '—' : formatCurrency(totalOutstanding), icon: AlertTriangle, iconBg: 'bg-red-50', iconColor: 'text-red-500', sub: loading ? null : `${dues.filter(d => d.status !== 'paid').length} unpaid records` },
          { label: 'Collection Rate', value: loading ? '—' : `${collectionRate}%`, icon: TrendingUp, iconBg: 'bg-blue-50', iconColor: 'text-blue-600', sub: loading ? null : `${dues.filter(d => d.status === 'paid').length} / ${dues.length} members` },
        ].map(({ label, value, icon: Icon, iconBg, iconColor, sub }) => (
          <div key={label} className="card p-5 flex items-start gap-4">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
              <Icon size={18} className={iconColor} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
              {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input-field pl-10 py-2" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select-field py-2 text-sm w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {Object.keys(STATUS_CONFIG).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        {isAdmin && (
          <>
            <button onClick={sendBulkReminder} className="btn-secondary py-2" title="Email reminders to unpaid">
              <Send size={14} />
              {selected.size > 0 ? `Email ${selected.size}` : 'Email Unpaid'}
            </button>
            <button onClick={async () => {
              if (!dues[0]?.id) return;
              const r = await client.post('/dues/sms-reminders', { duesRecordId: dues[0].duesRecordId }).catch(() => null);
              if (r?.data?.data) alert(`📱 SMS sent to ${r.data.data.sent} members${r.data.data.noPhone > 0 ? ` (${r.data.data.noPhone} had no phone number)` : ''}`);
            }} className="btn-secondary py-2 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" title="SMS reminders to unpaid members">
              📱 SMS Unpaid
            </button>
          </>
        )}
      </div>

      {/* Dues List — card-based for mobile */}
            {/* Dues Table — mirrors the treasurer spreadsheet */}
      <div className="card overflow-hidden mb-8">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <div className="skeleton w-32 h-4 rounded" />
                <div className="skeleton h-4 w-16 rounded ml-auto" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-6 w-14 rounded-full" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center">
            <DollarSign size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">No dues records found</p>
          </div>
        ) : (() => {
          // Detect if extended treasurer fields exist
          const hasExtended = filtered.some(d => d.winterPayment > 0 || d.springPayment > 0 || d.discount > 0 || d.owing != null);
          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    {isAdmin && <th className="w-8 px-3 py-3"><input type="checkbox" className="rounded"
                      onChange={e => setSelected(e.target.checked ? new Set(filtered.map(d => d.id)) : new Set())}
                      checked={selected.size === filtered.length && filtered.length > 0} /></th>}
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Member</th>
                    <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Dues Owed</th>
                    {hasExtended && <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Discount</th>}
                    {hasExtended && <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Paid (Winter)</th>}
                    {hasExtended && <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">Paid (Spring)</th>}
                    <th className="text-right px-3 py-3 font-semibold text-gray-600 whitespace-nowrap">A/R</th>
                    <th className="px-3 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-3 py-3 font-semibold text-gray-600 hidden lg:table-cell">Notes</th>
                    {isAdmin && <th className="px-3 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(due => {
                    const isPaid = due.status === 'paid';
                    const isWaived = due.status === 'waived';
                    const owing = due.owing != null ? due.owing : (due.amount - (due.winterPayment || 0) - (due.springPayment || 0) - (due.discount || 0));
                    return (
                      <tr key={due.id} className={`transition-colors ${selected.has(due.id) ? 'bg-navy/[0.03]' : 'hover:bg-gray-50/60'}`}>
                        {isAdmin && (
                          <td className="px-3 py-3">
                            <input type="checkbox" className="rounded"
                              checked={selected.has(due.id)} onChange={() => toggleSelect(due.id)} />
                          </td>
                        )}
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isPaid ? 'bg-emerald-500' : isWaived ? 'bg-gray-300' : due.status === 'partial' ? 'bg-amber-400' : 'bg-red-400'}`} />
                            <div className="w-7 h-7 bg-navy/10 rounded-full flex items-center justify-center text-navy text-[10px] font-bold flex-shrink-0">
                              {due.memberName?.split(' ').map(n => n[0]).join('') || '?'}
                            </div>
                            <span className="font-semibold text-gray-900 whitespace-nowrap">{due.memberName || '—'}</span>
                          </div>
                        </td>
                        {/* Dues Owed */}
                        <td className="px-3 py-3 text-right font-mono text-gray-800">{formatCurrency(due.amount)}</td>
                        {/* Discount */}
                        {hasExtended && <td className="px-3 py-3 text-right font-mono text-gray-500">
                          {due.discount > 0 ? <span className="text-emerald-600">−{formatCurrency(due.discount)}</span> : <span className="text-gray-300">—</span>}
                        </td>}
                        {/* Paid Winter */}
                        {hasExtended && <td className="px-3 py-3 text-right font-mono">
                          {due.winterPayment > 0 ? <span className="text-emerald-700">{formatCurrency(due.winterPayment)}</span> : <span className="text-gray-300">—</span>}
                        </td>}
                        {/* Paid Spring */}
                        {hasExtended && <td className="px-3 py-3 text-right font-mono">
                          {due.springPayment > 0 ? <span className="text-emerald-700">{formatCurrency(due.springPayment)}</span> : <span className="text-gray-300">—</span>}
                        </td>}
                        {/* A/R */}
                        <td className="px-3 py-3 text-right font-mono font-semibold">
                          {owing <= 0
                            ? <span className="text-emerald-600">—</span>
                            : <span className="text-red-600">{formatCurrency(owing)}</span>}
                        </td>
                        {/* Status */}
                        <td className="px-3 py-3"><StatusBadge status={due.status} /></td>
                        {/* Notes */}
                        <td className="px-3 py-3 text-gray-400 text-xs max-w-[180px] truncate hidden lg:table-cell" title={due.notes || ''}>
                          {due.notes || ''}
                        </td>
                        {/* Actions */}
                        {isAdmin && (
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              {!isPaid && !isWaived && (
                                <button onClick={() => setPayModal(due)}
                                  className="w-7 h-7 flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                                  title="Mark paid"><Check size={13} /></button>
                              )}
                              {(due.status === 'unpaid' || due.status === 'partial') && (
                                <button onClick={() => sendReminder(due.id)} disabled={sendingReminder === due.id}
                                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-navy hover:bg-navy/8 rounded-lg transition-colors"
                                  title="Send reminder">
                                  {sendingReminder === due.id
                                    ? <span className="w-3 h-3 border border-gray-400 border-t-gray-700 rounded-full animate-spin" />
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

      {/* Fines Section */}
      {fines.length > 0 && (
        <div className="mb-8">
          <h2 className="section-title mb-4">Fines</h2>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="th">Member</th>
                  <th className="th">Reason</th>
                  <th className="th">Amount</th>
                  <th className="th">Status</th>
                  <th className="th hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {fines.map(fine => (
                  <tr key={fine.id} className="table-row">
                    <td className="td font-medium text-gray-900">{fine.memberName || '—'}</td>
                    <td className="td text-gray-600">{fine.reason || '—'}</td>
                    <td className="td font-semibold text-gray-900">{formatCurrency(fine.amount)}</td>
                    <td className="td"><StatusBadge status={fine.status} /></td>
                    <td className="td hidden sm:table-cell text-gray-500">{formatDate(fine.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <Modal isOpen={showImport} onClose={() => { setShowImport(false); fetchData(); }} title="Import Dues" size="xl">
        <div className="p-1">
          <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-4">
            <FileSpreadsheet size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold mb-0.5">Format: Name (or First/Last), Paid (Yes/No), Amount (optional)</p>
              <p className="text-xs text-emerald-600">Upload your spreadsheet → map columns → hit Import. Takes 30 seconds.</p>
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
