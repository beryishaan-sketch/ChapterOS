import React, { useState, useEffect } from 'react';
import {
  Building2, DollarSign, Plus, Search, Edit2, Trash2,
  ChevronRight, X, Mail, Phone, Globe, StickyNote,
  TrendingUp, CheckCircle2, Clock, AlertCircle, Users
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { value: 'restaurant', label: '🍕 Restaurant & Food' },
  { value: 'apparel',    label: '👔 Clothing & Apparel' },
  { value: 'finance',    label: '💼 Finance & Banking' },
  { value: 'fitness',    label: '🏋️ Fitness & Wellness' },
  { value: 'tech',       label: '📱 Tech & Apps' },
  { value: 'entertainment', label: '🎵 Entertainment' },
  { value: 'realestate', label: '🏠 Real Estate' },
  { value: 'law',        label: '⚖️ Law & Consulting' },
  { value: 'other',      label: '🏢 Other' },
];

const STATUSES = [
  { value: 'prospect',    label: 'Prospect',    color: 'badge-gray' },
  { value: 'contacted',   label: 'Contacted',   color: 'badge-blue' },
  { value: 'negotiating', label: 'Negotiating', color: 'badge-yellow' },
  { value: 'active',      label: 'Active',      color: 'badge-green' },
  { value: 'completed',   label: 'Completed',   color: 'badge-navy' },
  { value: 'declined',    label: 'Declined',    color: 'badge-red' },
];

const TIERS = [
  { value: '',         label: 'No tier' },
  { value: 'bronze',   label: '🥉 Bronze  · $150–$300' },
  { value: 'silver',   label: '🥈 Silver  · $300–$600' },
  { value: 'gold',     label: '🥇 Gold    · $600–$1,200' },
  { value: 'platinum', label: '💎 Platinum · $1,200+' },
];

const TIER_STYLES = {
  bronze:   { bg: 'bg-orange-50',   text: 'text-orange-700', border: 'border-orange-200' },
  silver:   { bg: 'bg-gray-50',     text: 'text-gray-600',   border: 'border-gray-300' },
  gold:     { bg: 'bg-gold/10',     text: 'text-gold-dark',  border: 'border-gold/30' },
  platinum: { bg: 'bg-purple-50',   text: 'text-purple-700', border: 'border-purple-200' },
};

const CAT_ICONS = { restaurant:'🍕', apparel:'👔', finance:'💼', fitness:'🏋️', tech:'📱', entertainment:'🎵', realestate:'🏠', law:'⚖️', other:'🏢' };
const CAT_COLORS = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-orange-500','bg-rose-500','bg-teal-500','bg-indigo-500','bg-amber-500','bg-navy'];
const catColor = (cat) => CAT_COLORS[['restaurant','apparel','finance','fitness','tech','entertainment','realestate','law','other'].indexOf(cat)] || 'bg-navy';

const fmt$ = (n) => n ? `$${Number(n).toLocaleString()}` : null;
const statusCfg = (s) => STATUSES.find(x => x.value === s) || STATUSES[0];

const EMPTY_FORM = { name:'', contactName:'', email:'', phone:'', website:'', category:'other', dealAmount:'', dealStatus:'prospect', dealNotes:'', tier:'' };

function SponsorCard({ sponsor, isAdmin, onEdit, onDelete }) {
  const tier = TIER_STYLES[sponsor.tier];
  const sc = statusCfg(sponsor.dealStatus);

  return (
    <div className="card overflow-hidden">
      {/* Tier accent */}
      {sponsor.tier && (
        <div className={`h-1 w-full ${sponsor.tier === 'gold' ? 'gradient-gold' : sponsor.tier === 'platinum' ? 'bg-purple-400' : sponsor.tier === 'silver' ? 'bg-gray-400' : 'bg-orange-400'}`} />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className={`w-12 h-12 ${catColor(sponsor.category)} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
            {CAT_ICONS[sponsor.category] || '🏢'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-gray-900 truncate leading-tight">{sponsor.name}</p>
            {sponsor.contactName && <p className="text-[13px] text-gray-500 mt-0.5">{sponsor.contactName}</p>}
          </div>

          {isAdmin && (
            <div className="flex gap-1 flex-shrink-0">
              <button onClick={() => onEdit(sponsor)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-navy hover:bg-navy/8 rounded-xl transition-colors">
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(sponsor.id)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`badge ${sc.color}`}>{sc.label}</span>
          {sponsor.tier && (
            <span className={`badge border ${tier?.bg} ${tier?.text} ${tier?.border}`} style={{ fontSize: '11px' }}>
              {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
            </span>
          )}
        </div>

        {/* Deal amount */}
        {sponsor.dealAmount && (
          <div className="flex items-center gap-1.5 p-2.5 bg-emerald-50 rounded-xl mb-3">
            <DollarSign size={13} className="text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">{fmt$(sponsor.dealAmount)}</span>
            <span className="text-xs text-emerald-500 ml-auto">deal value</span>
          </div>
        )}

        {/* Contact info */}
        <div className="space-y-1">
          {sponsor.email && (
            <a href={`mailto:${sponsor.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-navy">
              <Mail size={11} className="text-gray-400" />{sponsor.email}
            </a>
          )}
          {sponsor.phone && (
            <a href={`tel:${sponsor.phone}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-navy">
              <Phone size={11} className="text-gray-400" />{sponsor.phone}
            </a>
          )}
          {sponsor.website && (
            <a href={sponsor.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-navy hover:underline">
              <Globe size={11} className="text-navy/50" />{sponsor.website.replace(/https?:\/\/(www\.)?/,'')}
            </a>
          )}
        </div>

        {sponsor.dealNotes && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{sponsor.dealNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SponsorModal({ isOpen, onClose, onSave, initial }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (isOpen) setForm(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
    setError('');
  }, [isOpen, initial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Company name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, dealAmount: form.dealAmount ? parseFloat(form.dealAmount) : null };
      const res = initial?.id
        ? await client.patch(`/sponsors/${initial.id}`, payload)
        : await client.post('/sponsors', payload);
      if (res.data.success) { onSave(res.data.data, !!initial?.id); onClose(); }
      else setError(res.data.error || 'Failed to save');
    } catch { setError('Something went wrong'); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initial?.id ? 'Edit Sponsor' : 'Add Sponsor'}
      footer={<>
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Sponsor'}</button>
      </>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"><AlertCircle size={14} />{error}</div>}

        <div>
          <label className="label">Company Name *</label>
          <input className="input-field" placeholder="e.g. Domino's Pizza" value={form.name} onChange={e => update('name', e.target.value)} autoFocus />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Contact Name</label>
            <input className="input-field" placeholder="John Smith" value={form.contactName} onChange={e => update('contactName', e.target.value)} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="select-field" value={form.category} onChange={e => update('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" placeholder="contact@co.com" value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input type="tel" className="input-field" placeholder="555-0100" value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Website</label>
          <input type="url" className="input-field" placeholder="https://company.com" value={form.website} onChange={e => update('website', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Deal Amount ($)</label>
            <input type="number" min="0" step="50" className="input-field" placeholder="500" value={form.dealAmount} onChange={e => update('dealAmount', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select-field" value={form.dealStatus} onChange={e => update('dealStatus', e.target.value)}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Tier</label>
          <select className="select-field" value={form.tier} onChange={e => update('tier', e.target.value)}>
            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea className="input-field min-h-[80px] resize-none" placeholder="Any notes about this sponsor…" value={form.dealNotes} onChange={e => update('dealNotes', e.target.value)} />
        </div>
      </form>
    </Modal>
  );
}

export default function Sponsors() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'officer'].includes(user?.role);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    client.get('/sponsors').then(r => {
      if (r.data.success) setSponsors(r.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = (s, isEdit) => {
    if (isEdit) setSponsors(p => p.map(x => x.id === s.id ? s : x));
    else setSponsors(p => [s, ...p]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this sponsor?')) return;
    await client.delete(`/sponsors/${id}`).catch(() => {});
    setSponsors(p => p.filter(x => x.id !== id));
  };

  const filtered = sponsors.filter(s => {
    const q = search.toLowerCase();
    return (statusFilter === 'all' || s.dealStatus === statusFilter) &&
      (!search || s.name.toLowerCase().includes(q) || (s.contactName || '').toLowerCase().includes(q));
  });

  const totalRevenue = sponsors.filter(s => ['active','completed'].includes(s.dealStatus))
    .reduce((sum, s) => sum + (s.dealAmount || 0), 0);
  const activeCount = sponsors.filter(s => s.dealStatus === 'active').length;
  const prospectCount = sponsors.filter(s => s.dealStatus === 'prospect').length;

  if (loading) return (
    <div className="max-w-2xl mx-auto lg:max-w-4xl space-y-3">
      {Array(4).fill(0).map((_, i) => <div key={i} className="card h-36 skeleton" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto lg:max-w-4xl">

      {/* Header */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title">Sponsorships</h1>
          <p className="page-subtitle">Track local business deals and revenue</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={15} /> Add Sponsor
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4 text-center">
          <p className="text-xl font-black text-gray-900">{sponsors.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xl font-black text-emerald-600">{activeCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Active</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-xl font-black text-navy">{totalRevenue > 0 ? fmt$(totalRevenue) : '—'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Raised</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-0.5">
        {[{ v: 'all', l: `All (${sponsors.length})` }, ...STATUSES.map(s => ({ v: s.value, l: s.label }))].map(({ v, l }) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
              statusFilter === v ? 'bg-navy text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {l}
          </button>
        ))}
      </div>

      {/* Search */}
      {sponsors.length > 0 && (
        <div className="relative mb-5">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input className="input-field pl-11" placeholder="Search sponsors…" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
        </div>
      )}

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-gray-300" />
          </div>
          <p className="text-base font-bold text-gray-400">
            {search || statusFilter !== 'all' ? 'No sponsors match' : 'No sponsors yet'}
          </p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Local businesses want to reach your members.</p>
          {isAdmin && !search && statusFilter === 'all' && (
            <button className="btn-primary mx-auto" onClick={() => { setEditing(null); setShowModal(true); }}>
              <Plus size={15} /> Add First Sponsor
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(s => (
            <SponsorCard key={s.id} sponsor={s} isAdmin={isAdmin}
              onEdit={(s) => { setEditing(s); setShowModal(true); }}
              onDelete={handleDelete} />
          ))}
        </div>
      )}

      <SponsorModal isOpen={showModal} onClose={() => { setShowModal(false); setEditing(null); }}
        onSave={handleSave} initial={editing} />
    </div>
  );
}
