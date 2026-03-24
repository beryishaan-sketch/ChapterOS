import React, { useState, useEffect } from 'react';
import { Shield, Plus, CheckCircle2, Circle, Trash2, Users, AlertTriangle } from 'lucide-react';
import client from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const DEFAULT_ITEMS = [
  'AlcoholEdu / Haven Completion',
  'Title IX Training',
  'Risk Management Policy Acknowledgment',
  'Anti-Hazing Certification',
  'Bystander Intervention Training',
];

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
    <div className="max-w-2xl mx-auto lg:max-w-5xl">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Risk Management</h1>
            <p className="page-subtitle">Track chapter compliance and member training requirements</p>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              {data.items.length === 0 && (
                <button onClick={addDefaults} className="btn-secondary">Load Defaults</button>
              )}
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <Plus size={16} /> Add Requirement
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="card p-12 text-center text-gray-400">Loading…</div>
      ) : data.items.length === 0 ? (
        <div className="card p-12 text-center">
          <Shield size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="font-semibold text-gray-500 mb-2">No requirements set</p>
          <p className="text-sm text-gray-400 mb-5">Add compliance requirements for your chapter members</p>
          {isAdmin && <button onClick={addDefaults} className="btn-primary mx-auto">Load Standard Requirements</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {data.items.map(item => {
            const completed = item.completions.length;
            const total = data.totalMembers;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const iDone = myCompletedIds.has(item.id);

            return (
              <div key={item.id} className="card p-5">
                <div className="flex items-start gap-4">
                  <button onClick={() => toggleComplete(item.id)}
                    disabled={completing[item.id]}
                    className={`mt-0.5 flex-shrink-0 transition-colors ${iDone ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-400'}`}>
                    {iDone ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className={`font-semibold ${iDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{item.title}</h3>
                        {item.description && <p className="text-sm text-gray-400 mt-0.5">{item.description}</p>}
                        {item.dueDate && (
                          <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={11} /> Due {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">{pct}%</p>
                          <p className="text-xs text-gray-400">{completed}/{total} members</p>
                        </div>
                        {isAdmin && (
                          <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : pct > 60 ? 'bg-gold' : 'bg-red-400'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    {/* Who completed */}
                    {item.completions.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 flex-wrap">
                        {item.completions.slice(0, 8).map(c => (
                          <span key={c.id} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            {c.member.firstName} {c.member.lastName[0]}.
                          </span>
                        ))}
                        {item.completions.length > 8 && (
                          <span className="text-xs text-gray-400">+{item.completions.length - 8} more</span>
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
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Requirement Title</label>
            <input className="input-field" placeholder="e.g. AlcoholEdu Completion" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input-field resize-none" rows={2} placeholder="Additional details or instructions" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Due Date (optional)</label>
            <input className="input-field" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Adding…' : 'Add Requirement'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
