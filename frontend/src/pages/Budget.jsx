import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Filter } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';

const CATEGORIES = {
  income: ['dues', 'fundraising', 'donations', 'sponsorship', 'other'],
  expense: ['venue', 'food', 'supplies', 'apparel', 'philanthropy', 'other'],
};

const CAT_COLORS = {
  dues: 'bg-blue-100 text-blue-700',
  fundraising: 'bg-emerald-100 text-emerald-700',
  donations: 'bg-purple-100 text-purple-700',
  sponsorship: 'bg-gold/15 text-gold-dark',
  venue: 'bg-red-100 text-red-700',
  food: 'bg-orange-100 text-orange-700',
  supplies: 'bg-gray-100 text-gray-600',
  apparel: 'bg-indigo-100 text-indigo-700',
  philanthropy: 'bg-teal-100 text-teal-700',
  other: 'bg-gray-100 text-gray-600',
};

export default function Budget() {
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

  return (
    <div className="max-w-2xl mx-auto lg:max-w-5xl">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Treasury</h1>
            <p className="page-subtitle">Track chapter income, expenses, and running balance</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-600" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Total Income</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <TrendingDown size={16} className="text-red-500" />
            </div>
            <span className="text-sm text-gray-500 font-medium">Total Expenses</span>
          </div>
          <p className="text-2xl font-extrabold text-gray-900">${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={`card p-5 ${balance >= 0 ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${balance >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
              <DollarSign size={16} className={balance >= 0 ? 'text-emerald-600' : 'text-red-500'} />
            </div>
            <span className="text-sm text-gray-500 font-medium">Balance</span>
          </div>
          <p className={`text-2xl font-extrabold ${balance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {balance < 0 ? '-' : ''}${Math.abs(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Transactions</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {['all', 'income', 'expense'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${filter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No transactions yet</p>
            <p className="text-gray-300 text-sm">Add your first income or expense</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${t.type === 'income' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                  {t.type === 'income' ? <TrendingUp size={14} className="text-emerald-600" /> : <TrendingDown size={14} className="text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {t.createdBy?.firstName}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${CAT_COLORS[t.category] || 'bg-gray-100 text-gray-600'}`}>{t.category}</span>
                <p className={`font-bold text-base w-24 text-right ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <button onClick={() => deleteT(t.id)} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add transaction modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setSaveError(''); }} title="Add Transaction">
        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{saveError}</div>
          )}
          <div className="flex gap-2">
            {['income', 'expense'].map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t, category: CATEGORIES[t][0] }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-all capitalize ${form.type === t ? (t === 'income' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-600') : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                {t}
              </button>
            ))}
          </div>
          <div>
            <label className="label">Amount ($)</label>
            <input className="input-field" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input-field" placeholder="e.g. Spring mixer ticket sales" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Category</label>
              <select className="select-field" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES[form.type].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input-field" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Saving…' : 'Add Transaction'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
