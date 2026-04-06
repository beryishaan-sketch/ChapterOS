import React, { useState, useEffect } from 'react';
import {
  Building2, DollarSign, Plus, Search, Edit2, Trash2,
  ChevronRight, X, Mail, Phone, Globe, StickyNote,
  TrendingUp, CheckCircle2, Clock, AlertCircle, Users
} from 'lucide-react';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

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
  { value: 'prospect',    label: 'Prospect' },
  { value: 'contacted',   label: 'Contacted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'active',      label: 'Active' },
  { value: 'completed',   label: 'Completed' },
  { value: 'declined',    label: 'Declined' },
];

const TIERS = [
  { value: '',         label: 'No tier' },
  { value: 'bronze',   label: '🥉 Bronze  · $150–$300' },
  { value: 'silver',   label: '🥈 Silver  · $300–$600' },
  { value: 'gold',     label: '🥇 Gold    · $600–$1,200' },
  { value: 'platinum', label: '💎 Platinum · $1,200+' },
];

const TIER_STYLES = {
  bronze:   { color: '#F97316', bg: 'rgba(249,115,22,0.12)',   border: 'rgba(249,115,22,0.25)',   accent: '#F97316' },
  silver:   { color: '#94A3B8', bg: 'rgba(148,163,184,0.12)',  border: 'rgba(148,163,184,0.25)',  accent: '#94A3B8' },
  gold:     { color: '#F0B429', bg: 'rgba(240,180,41,0.12)',   border: 'rgba(240,180,41,0.25)',   accent: '#F0B429' },
  platinum: { color: '#A78BFA', bg: 'rgba(167,139,250,0.12)',  border: 'rgba(167,139,250,0.25)',  accent: '#A78BFA' },
};

const STATUS_STYLES = {
  prospect:    { color: T.text3,    bg: 'rgba(255,255,255,0.05)',   border: T.border },
  contacted:   { color: T.accent,   bg: 'rgba(79,142,247,0.12)',    border: 'rgba(79,142,247,0.25)' },
  negotiating: { color: T.warning,  bg: 'rgba(251,191,36,0.12)',    border: 'rgba(251,191,36,0.25)' },
  active:      { color: T.success,  bg: 'rgba(52,211,153,0.12)',    border: 'rgba(52,211,153,0.25)' },
  completed:   { color: '#A78BFA',  bg: 'rgba(167,139,250,0.12)',   border: 'rgba(167,139,250,0.25)' },
  declined:    { color: T.danger,   bg: 'rgba(248,113,113,0.12)',   border: 'rgba(248,113,113,0.25)' },
};

const CAT_ICONS = { restaurant:'🍕', apparel:'👔', finance:'💼', fitness:'🏋️', tech:'📱', entertainment:'🎵', realestate:'🏠', law:'⚖️', other:'🏢' };
const CAT_BG = ['rgba(79,142,247,0.15)','rgba(167,139,250,0.15)','rgba(52,211,153,0.15)','rgba(249,115,22,0.15)','rgba(248,113,113,0.15)','rgba(20,184,166,0.15)','rgba(99,102,241,0.15)','rgba(240,180,41,0.15)','rgba(255,255,255,0.06)'];
const catBg = (cat) => CAT_BG[['restaurant','apparel','finance','fitness','tech','entertainment','realestate','law','other'].indexOf(cat)] || CAT_BG[8];

const fmt$ = (n) => n ? `$${Number(n).toLocaleString()}` : null;
const statusCfg = (s) => STATUSES.find(x => x.value === s) || STATUSES[0];

const EMPTY_FORM = { name:'', contactName:'', email:'', phone:'', website:'', category:'other', dealAmount:'', dealStatus:'prospect', dealNotes:'', tier:'' };

const inputStyle = {
  background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`,
  borderRadius: 8, color: T.text1, padding: '10px 14px', outline: 'none', width: '100%',
  fontSize: 13, boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, color: T.text2,
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};

function SponsorCard({ sponsor, isAdmin, onEdit, onDelete }) {
  const tier = TIER_STYLES[sponsor.tier];
  const sc = STATUS_STYLES[sponsor.dealStatus] || STATUS_STYLES.prospect;
  const statusLabel = statusCfg(sponsor.dealStatus)?.label || 'Prospect';

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Tier accent line */}
      {sponsor.tier && tier ? (
        <div style={{ height: 3, background: tier.accent }} />
      ) : (
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.accent}, rgba(167,139,250,0.4))` }} />
      )}

      <div style={{ padding: '16px' }}>
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: catBg(sponsor.category),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
            border: `1px solid ${T.border}`,
          }}>
            {CAT_ICONS[sponsor.category] || '🏢'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: T.text1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sponsor.name}
            </p>
            {sponsor.contactName && (
              <p style={{ fontSize: 12, color: T.text3, margin: '3px 0 0' }}>{sponsor.contactName}</p>
            )}
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              <button onClick={() => onEdit(sponsor)} style={{
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.text3, background: 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: 8, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,142,247,0.1)'; e.currentTarget.style.color = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
              >
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(sponsor.id)} style={{
                width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.text3, background: 'transparent', border: 'none', cursor: 'pointer',
                borderRadius: 8, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.color = T.danger; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text3; }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
            background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
          }}>
            {statusLabel}
          </span>
          {sponsor.tier && tier && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99,
              background: tier.bg, color: tier.color, border: `1px solid ${tier.border}`,
            }}>
              {sponsor.tier.charAt(0).toUpperCase() + sponsor.tier.slice(1)}
            </span>
          )}
        </div>

        {/* Deal amount */}
        {sponsor.dealAmount && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 8, marginBottom: 12,
            background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)',
          }}>
            <DollarSign size={13} style={{ color: T.success }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: T.success }}>{fmt$(sponsor.dealAmount)}</span>
            <span style={{ fontSize: 11, color: 'rgba(52,211,153,0.6)', marginLeft: 'auto' }}>deal value</span>
          </div>
        )}

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {sponsor.email && (
            <a href={`mailto:${sponsor.email}`} style={{
              display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
              color: T.text3, textDecoration: 'none', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = T.text2}
              onMouseLeave={e => e.currentTarget.style.color = T.text3}
            >
              <Mail size={11} style={{ color: T.text3 }} />{sponsor.email}
            </a>
          )}
          {sponsor.phone && (
            <a href={`tel:${sponsor.phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
              color: T.text3, textDecoration: 'none', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = T.text2}
              onMouseLeave={e => e.currentTarget.style.color = T.text3}
            >
              <Phone size={11} style={{ color: T.text3 }} />{sponsor.phone}
            </a>
          )}
          {sponsor.website && (
            <a href={sponsor.website} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 7, fontSize: 12,
              color: T.accent, textDecoration: 'none', transition: 'opacity 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Globe size={11} style={{ color: T.accent }} />{sponsor.website.replace(/https?:\/\/(www\.)?/, '')}
            </a>
          )}
        </div>

        {sponsor.dealNotes && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 12, color: T.text3, lineHeight: 1.6, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {sponsor.dealNotes}
            </p>
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
        <button style={{
          background: 'rgba(255,255,255,0.06)', color: T.text2,
          border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8,
          padding: '8px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 13,
        }} onClick={onClose}>Cancel</button>
        <button style={{
          background: T.accent, color: '#fff', border: 'none', borderRadius: 8,
          padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
          boxShadow: '0 0 20px rgba(79,142,247,0.2)', opacity: saving ? 0.7 : 1,
        }} onClick={handleSubmit} disabled={saving}>{saving ? 'Saving…' : initial?.id ? 'Save Changes' : 'Add Sponsor'}</button>
      </>}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 8, fontSize: 13, color: T.danger,
          }}>
            <AlertCircle size={14} />{error}
          </div>
        )}

        <div>
          <label style={labelStyle}>Company Name *</label>
          <input style={inputStyle} placeholder="e.g. Domino's Pizza" value={form.name} onChange={e => update('name', e.target.value)} autoFocus />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Contact Name</label>
            <input style={inputStyle} placeholder="John Smith" value={form.contactName} onChange={e => update('contactName', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={form.category} onChange={e => update('category', e.target.value)}>
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" style={inputStyle} placeholder="contact@co.com" value={form.email} onChange={e => update('email', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Phone</label>
            <input type="tel" style={inputStyle} placeholder="555-0100" value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Website</label>
          <input type="url" style={inputStyle} placeholder="https://company.com" value={form.website} onChange={e => update('website', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Deal Amount ($)</label>
            <input type="number" min="0" step="50" style={inputStyle} placeholder="500" value={form.dealAmount} onChange={e => update('dealAmount', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.dealStatus} onChange={e => update('dealStatus', e.target.value)}>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Tier</label>
          <select style={inputStyle} value={form.tier} onChange={e => update('tier', e.target.value)}>
            {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Notes</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'none' }} placeholder="Any notes about this sponsor…" value={form.dealNotes} onChange={e => update('dealNotes', e.target.value)} />
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

  if (loading) return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array(4).fill(0).map((_, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, height: 144 }} />
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ color: T.text1, fontWeight: 800, fontSize: 26, margin: '0 0 4px' }}>Sponsorships</h1>
            <p style={{ color: T.text2, fontSize: 14, margin: 0 }}>Track local business deals and revenue</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setEditing(null); setShowModal(true); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: T.accent, color: '#fff', border: 'none', borderRadius: 8,
                padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                boxShadow: '0 0 20px rgba(79,142,247,0.2)',
              }}
            >
              <Plus size={15} /> Add Sponsor
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { value: sponsors.length, label: 'Total', color: T.text1 },
            { value: activeCount,     label: 'Active', color: T.success },
            { value: totalRevenue > 0 ? fmt$(totalRevenue) : '—', label: 'Raised', color: T.gold },
          ].map(({ value, label, color }) => (
            <div key={label} style={{
              background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
              padding: '18px 16px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}>
              <p style={{ fontSize: 24, fontWeight: 800, color, margin: '0 0 4px' }}>{value}</p>
              <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, paddingBottom: 2 }}>
          {[{ v: 'all', l: `All (${sponsors.length})` }, ...STATUSES.map(s => ({ v: s.value, l: s.label }))].map(({ v, l }) => (
            <button key={v} onClick={() => setStatusFilter(v)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', transition: 'all 0.15s',
              background: statusFilter === v ? T.accent : 'rgba(255,255,255,0.05)',
              color: statusFilter === v ? '#fff' : T.text2,
              border: `1px solid ${statusFilter === v ? 'transparent' : T.border}`,
              boxShadow: statusFilter === v ? '0 0 16px rgba(79,142,247,0.2)' : 'none',
            }}>
              {l}
            </button>
          ))}
        </div>

        {/* Search */}
        {sponsors.length > 0 && (
          <div style={{ position: 'relative', marginBottom: 20 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: T.text3, pointerEvents: 'none' }} />
            <input
              style={{ ...{
                background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`,
                borderRadius: 8, color: T.text1, padding: '10px 14px 10px 40px', outline: 'none', width: '100%',
                fontSize: 13, boxSizing: 'border-box',
              }}}
              placeholder="Search sponsors…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                color: T.text3, background: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}>
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 12,
            padding: '64px 24px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Users size={28} style={{ color: T.text3 }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text2, margin: '0 0 6px' }}>
              {search || statusFilter !== 'all' ? 'No sponsors match' : 'No sponsors yet'}
            </p>
            <p style={{ fontSize: 13, color: T.text3, margin: '0 0 20px' }}>Local businesses want to reach your members.</p>
            {isAdmin && !search && statusFilter === 'all' && (
              <button
                onClick={() => { setEditing(null); setShowModal(true); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: T.accent, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                  boxShadow: '0 0 20px rgba(79,142,247,0.2)',
                }}
              >
                <Plus size={15} /> Add First Sponsor
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
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
    </div>
  );
}
