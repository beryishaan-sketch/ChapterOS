import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, ChevronDown, Star, Users, TrendingUp,
  SlidersHorizontal, User, BookOpen, Mail, Phone, MapPin,
  Calendar, MessageSquare, CheckCircle, Save
} from 'lucide-react';
import KanbanBoard, { STAGE_CONFIG, StarRating } from '../components/KanbanBoard';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const STAGES = Object.keys(STAGE_CONFIG);

// Add PNM Modal
const AddPNMModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    major: '', year: '', gpa: '', hometown: '', stage: 'invited', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) { setError('First and last name are required.'); return; }
    setLoading(true);
    try {
      const res = await client.post('/pnms', form);
      if (res.data.success) { onSave(res.data.data); onClose(); }
      else setError(res.data.error || 'Failed to add PNM');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Potential New Member" size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Add PNM'}
          </button>
        </>
      }
    >
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4 text-sm text-red-700">
          <X size={14} />{error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">First name *</label>
          <input className="input-field" placeholder="Jane" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
        </div>
        <div>
          <label className="label">Last name *</label>
          <input className="input-field" placeholder="Smith" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
        </div>
        <div>
          <label className="label">Email</label>
          <input type="email" className="input-field" placeholder="jane@university.edu" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input type="tel" className="input-field" placeholder="(555) 000-0000" value={form.phone} onChange={e => update('phone', e.target.value)} />
        </div>
        <div>
          <label className="label">Major</label>
          <input className="input-field" placeholder="Computer Science" value={form.major} onChange={e => update('major', e.target.value)} />
        </div>
        <div>
          <label className="label">Year</label>
          <select className="select-field" value={form.year} onChange={e => update('year', e.target.value)}>
            <option value="">Select year</option>
            {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="label">GPA</label>
          <input type="number" step="0.01" min="0" max="4" className="input-field" placeholder="3.50" value={form.gpa} onChange={e => update('gpa', e.target.value)} />
        </div>
        <div>
          <label className="label">Hometown</label>
          <input className="input-field" placeholder="Chicago, IL" value={form.hometown} onChange={e => update('hometown', e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="label">Initial stage</label>
          <select className="select-field" value={form.stage} onChange={e => update('stage', e.target.value)}>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea className="input-field resize-none" rows={3} placeholder="Any notes about this PNM…" value={form.notes} onChange={e => update('notes', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// Interactive star rating
const StarRatingInput = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i)}
        className="transition-transform hover:scale-110"
      >
        <Star
          size={20}
          className={i <= value ? 'text-gold fill-gold' : 'text-gray-200 fill-gray-200'}
        />
      </button>
    ))}
  </div>
);

// PNM Profile Slide Panel
const PNMPanel = ({ pnm, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState(pnm?.notes || '');
  const [stage, setStage] = useState(pnm?.stage || 'invited');
  const [myRating, setMyRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pnm) {
      setNotes(pnm.notes || '');
      setStage(pnm.stage || 'invited');
      // Find current user's existing vote
      const existingVote = pnm.votes?.find(v => v.memberId === user?.id);
      setMyRating(existingVote?.score || 0);
    }
  }, [pnm, user]);

  if (!pnm) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await client.patch(`/pnms/${pnm.id}`, { notes, stage });
      if (myRating > 0) {
        await client.post(`/pnms/${pnm.id}/vote`, { score: myRating });
      }
      if (res.data.success) {
        onUpdate({ ...pnm, notes, stage, ...res.data.data });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  const initials = `${pnm.firstName?.[0] || ''}${pnm.lastName?.[0] || ''}`;
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-orange-500', 'bg-rose-500'];
  const colorIndex = (pnm.firstName?.charCodeAt(0) || 0 + pnm.lastName?.charCodeAt(0) || 0) % colors.length;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-navy-dark/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-modal flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 ${colors[colorIndex]} rounded-2xl flex items-center justify-center text-white font-bold text-lg`}>
                {initials}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{pnm.firstName} {pnm.lastName}</h2>
                {pnm.major && <p className="text-sm text-gray-500">{pnm.major}{pnm.year ? ` · ${pnm.year}` : ''}</p>}
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>

          {pnm.avgScore > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <StarRating score={Math.round(pnm.avgScore)} />
              <span className="text-sm font-semibold text-gray-700">{pnm.avgScore.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({pnm.votes?.length || 0} vote{pnm.votes?.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {pnm.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400" />{pnm.email}
              </div>
            )}
            {pnm.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400" />{pnm.phone}
              </div>
            )}
            {pnm.hometown && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400" />{pnm.hometown}
              </div>
            )}
            {pnm.gpa && (
              <div className="flex items-center gap-2 text-gray-600">
                <BookOpen size={14} className="text-gray-400" />GPA {pnm.gpa}
              </div>
            )}
          </div>

          {/* Stage */}
          <div>
            <label className="label">Stage</label>
            <select
              className="select-field"
              value={stage}
              onChange={e => setStage(e.target.value)}
            >
              {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
            </select>
          </div>

          {/* My Rating */}
          <div>
            <label className="label">My Rating</label>
            <StarRatingInput value={myRating} onChange={setMyRating} />
            <p className="text-xs text-gray-400 mt-1.5">Only you can see your individual rating</p>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Add notes about this PNM…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Event Attendance */}
          {pnm.eventAttendance && pnm.eventAttendance.length > 0 && (
            <div>
              <label className="label flex items-center gap-2">
                <Calendar size={14} />Event Attendance
              </label>
              <div className="space-y-2">
                {pnm.eventAttendance.map((ev, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{ev.title}</span>
                    {ev.attended ? (
                      <span className="badge-green">Attended</span>
                    ) : (
                      <span className="badge-gray">Absent</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full justify-center"
          >
            {saved ? (
              <><CheckCircle size={16} /> Saved!</>
            ) : saving ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-navy-dark/30 border-t-navy-dark rounded-full animate-spin" />
                Saving…
              </span>
            ) : (
              <><Save size={16} /> Save changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Recruitment() {
  const [pnms, setPnms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPNM, setSelectedPNM] = useState(null);

  const fetchPNMs = useCallback(async () => {
    try {
      const res = await client.get('/pnms');
      if (res.data.success) setPnms(res.data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPNMs(); }, [fetchPNMs]);

  const handleStageChange = async (pnmId, newStage) => {
    setPnms(prev => prev.map(p => p.id === pnmId ? { ...p, stage: newStage } : p));
    try { await client.patch(`/pnms/${pnmId}`, { stage: newStage }); }
    catch { fetchPNMs(); }
  };

  const handleSaveNew = (newPNM) => {
    setPnms(prev => [newPNM, ...prev]);
  };

  const handleUpdate = (updated) => {
    setPnms(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPNM(updated);
  };

  const filteredPNMs = pnms.filter(p => {
    const matchSearch = !search || `${p.firstName} ${p.lastName} ${p.major || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === 'all' || p.stage === filterStage;
    return matchSearch && matchStage;
  });

  const stats = {
    total: pnms.length,
    avgScore: pnms.filter(p => p.avgScore > 0).length > 0
      ? (pnms.filter(p => p.avgScore > 0).reduce((a, p) => a + p.avgScore, 0) / pnms.filter(p => p.avgScore > 0).length).toFixed(1)
      : '—',
    pledged: pnms.filter(p => p.stage === 'pledged').length,
    conversionRate: pnms.length > 0 ? Math.round((pnms.filter(p => p.stage === 'pledged').length / pnms.length) * 100) : 0,
  };

  return (
    <div className="max-w-full">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Recruitment Pipeline</h1>
          <p className="page-subtitle">Track and manage potential new members</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add PNM
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total PNMs', value: loading ? '—' : stats.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
          { label: 'Avg Score', value: loading ? '—' : stats.avgScore, icon: Star, color: 'text-gold-dark bg-gold/10' },
          { label: 'Pledged', value: loading ? '—' : stats.pledged, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Conversion', value: loading ? '—' : `${stats.conversionRate}%`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 ${color.split(' ')[1]} rounded-lg flex items-center justify-center`}>
              <Icon size={16} className={color.split(' ')[0]} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            className="input-field pl-10 py-2"
            placeholder="Search PNMs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="relative">
          <SlidersHorizontal size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            className="select-field pl-8 pr-8 py-2 text-sm"
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
          >
            <option value="all">All stages</option>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
          </select>
        </div>
        {(search || filterStage !== 'all') && (
          <span className="text-xs text-gray-500">{filteredPNMs.length} result{filteredPNMs.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(s => (
            <div key={s} className="w-64 flex-shrink-0 rounded-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="skeleton w-20 h-4 rounded" />
              </div>
              <div className="p-3 space-y-2.5 bg-gray-50/50 min-h-[200px]">
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-3.5 shadow-card">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="skeleton w-8 h-8 rounded-full" />
                      <div className="skeleton w-24 h-4 rounded" />
                    </div>
                    <div className="skeleton w-16 h-3 rounded" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : pnms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users size={48} className="text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">No PNMs yet</h3>
          <p className="text-sm text-gray-400 mb-4">Start tracking potential new members</p>
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add first PNM
          </button>
        </div>
      ) : (
        <KanbanBoard
          pnms={filteredPNMs}
          onPNMClick={setSelectedPNM}
          onStageChange={handleStageChange}
        />
      )}

      {/* Modals */}
      <AddPNMModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSave={handleSaveNew} />

      {selectedPNM && (
        <PNMPanel
          pnm={selectedPNM}
          onClose={() => setSelectedPNM(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
