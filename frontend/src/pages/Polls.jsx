import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, BarChart2, Trash2, AlertCircle, Vote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Modal from '../components/Modal';

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
};

export default function Polls() {
  const { user } = useAuth();
  const isAdmin = ['admin','officer'].includes(user?.role);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ question: '', options: ['', ''], expiresIn: '72' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [voted, setVoted] = useState({});

  useEffect(() => {
    client.get('/polls').then(res => {
      if (res.data.success) {
        setPolls(res.data.data);
        const v = {};
        res.data.data.forEach(p => { if (p.userVote) v[p.id] = p.userVote; });
        setVoted(v);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleVote = async (pollId, optionIndex) => {
    if (voted[pollId] !== undefined) return;
    try {
      const res = await client.post(`/polls/${pollId}/vote`, { optionIndex });
      if (res.data.success) {
        setVoted(v => ({ ...v, [pollId]: optionIndex }));
        setPolls(prev => prev.map(p => p.id === pollId ? res.data.data : p));
      }
    } catch {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const opts = form.options.filter(o => o.trim());
    if (!form.question.trim() || opts.length < 2) { setError('Question and at least 2 options required'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await client.post('/polls', { question: form.question, options: opts, expiresInHours: parseInt(form.expiresIn) });
      if (res.data.success) {
        setPolls(prev => [res.data.data, ...prev]);
        setShowModal(false);
        setForm({ question: '', options: ['', ''], expiresIn: '72' });
      }
    } catch (e) { setError(e.response?.data?.error || 'Failed to create poll'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this poll?')) return;
    await client.delete(`/polls/${id}`).catch(() => {});
    setPolls(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto space-y-4">
      {[1,2].map(i => <div key={i} className="card p-6"><div className="skeleton h-32 rounded" /></div>)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="page-title">Chapter Polls</h1>
          <p className="page-subtitle">Vote on chapter decisions and track results</p>
        </div>
        {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Create Poll</button>}
      </div>

      {polls.length === 0 ? (
        <div className="card p-16 text-center">
          <Vote size={32} className="text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">No polls yet</h3>
          <p className="text-sm text-gray-400 mb-4">Create a poll to get your chapter's input</p>
          {isAdmin && <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">Create First Poll</button>}
        </div>
      ) : (
        <div className="space-y-5">
          {polls.map(poll => {
            const totalVotes = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
            const myVote = voted[poll.id];
            const expired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
            return (
              <div key={poll.id} className="card p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{poll.question}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-400">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${expired ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {expired ? 'Closed' : `Closes ${timeAgo(new Date(poll.expiresAt?.getTime?.() || Date.now() - 1))}`}
                      </span>
                    </div>
                  </div>
                  {isAdmin && <button onClick={() => handleDelete(poll.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>}
                </div>
                <div className="space-y-2.5">
                  {(poll.options || []).map((opt, i) => {
                    const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                    const selected = myVote === i;
                    const canVote = myVote === undefined && !expired;
                    return (
                      <button key={i} onClick={() => canVote && handleVote(poll.id, i)} disabled={!canVote}
                        className={`w-full text-left rounded-xl border-2 transition-all overflow-hidden ${selected ? 'border-navy' : canVote ? 'border-gray-200 hover:border-navy/40' : 'border-gray-100'}`}>
                        <div className="relative p-3">
                          <div className="absolute inset-0 bg-navy/8 transition-all" style={{ width: (myVote !== undefined || expired) ? `${pct}%` : '0%' }} />
                          <div className="relative flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {selected && <CheckCircle2 size={14} className="text-navy flex-shrink-0" />}
                              <span className={`text-sm font-medium ${selected ? 'text-navy' : 'text-gray-700'}`}>{opt.label || opt.text || `Option ${i+1}`}</span>
                            </div>
                            {(myVote !== undefined || expired) && <span className="text-xs font-semibold text-gray-500">{pct}%</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Create Poll">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"><AlertCircle size={14} className="text-red-500" /><p className="text-sm text-red-700">{error}</p></div>}
          <div>
            <label className="label">Question</label>
            <input className="input-field" placeholder="What should we decide?" value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="label">Options</label>
            <div className="space-y-2">
              {form.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input-field flex-1" placeholder={`Option ${i + 1}`} value={opt}
                    onChange={e => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? e.target.value : o) }))} />
                  {form.options.length > 2 && (
                    <button type="button" onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
              {form.options.length < 6 && (
                <button type="button" onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                  className="text-sm text-navy hover:text-navy-light font-medium">+ Add option</button>
              )}
            </div>
          </div>
          <div>
            <label className="label">Closes in</label>
            <select className="select-field" value={form.expiresIn} onChange={e => setForm(f => ({ ...f, expiresIn: e.target.value }))}>
              <option value="24">24 hours</option>
              <option value="48">48 hours</option>
              <option value="72">3 days</option>
              <option value="168">1 week</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">{submitting ? 'Creating…' : 'Create Poll'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
