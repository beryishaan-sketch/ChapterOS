import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, BarChart2, Trash2, AlertCircle, Vote } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Modal from '../components/Modal';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E', sidebar: '#0A0F1C',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const cardStyle = {
  background: T.card,
  border: '1px solid ' + T.border,
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const primaryBtnStyle = {
  background: T.accent,
  color: '#fff',
  border: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 0 20px rgba(79,142,247,0.2)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
};

const secondaryBtnStyle = {
  background: 'rgba(255,255,255,0.06)',
  color: T.text1,
  border: '1px solid ' + T.borderStrong,
  borderRadius: 8,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 14,
};

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

const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function Polls() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'officer'].includes(user?.role);
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
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg, maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1, 2].map(i => (
          <div key={i} style={{ ...cardStyle, padding: 24 }}>
            <div style={{ height: 120, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0 }}>Chapter Polls</h1>
            <p style={{ fontSize: 14, color: T.text2, margin: '4px 0 0' }}>Vote on chapter decisions and track results</p>
          </div>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} style={primaryBtnStyle}>
              <Plus size={16} /> Create Poll
            </button>
          )}
        </div>

        {polls.length === 0 ? (
          <div style={{ ...cardStyle, padding: '64px 24px', textAlign: 'center' }}>
            <Vote size={36} style={{ color: T.text3, margin: '0 auto 14px', display: 'block', opacity: 0.5 }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text1, margin: '0 0 6px' }}>No polls yet</h3>
            <p style={{ fontSize: 14, color: T.text2, margin: '0 0 20px' }}>Create a poll to get your chapter's input</p>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} style={{ ...primaryBtnStyle, margin: '0 auto' }}>
                Create First Poll
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {polls.map(poll => {
              const totalVotes = (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0);
              const myVote = voted[poll.id];
              const expired = poll.expiresAt && new Date(poll.expiresAt) < new Date();
              return (
                <div key={poll.id} style={{ ...cardStyle, padding: 24 }}>
                  {/* Poll header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text1, margin: '0 0 8px', lineHeight: 1.4 }}>
                        {poll.question}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: T.text3 }}>
                          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                        </span>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20,
                          background: expired ? 'rgba(255,255,255,0.06)' : 'rgba(52,211,153,0.12)',
                          color: expired ? T.text3 : T.success,
                          border: expired ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(52,211,153,0.2)',
                        }}>
                          {expired
                            ? 'Closed'
                            : poll.expiresAt
                              ? `Closes ${new Date(poll.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                              : 'Open'}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleDelete(poll.id)} style={{
                        padding: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)',
                        borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Trash2 size={14} color={T.danger} />
                      </button>
                    )}
                  </div>

                  {/* Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(poll.options || []).map((opt, i) => {
                      const pct = totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0;
                      const selected = myVote === i;
                      const canVote = myVote === undefined && !expired;
                      const showResult = myVote !== undefined || expired;
                      return (
                        <button
                          key={i}
                          onClick={() => canVote && handleVote(poll.id, i)}
                          disabled={!canVote}
                          style={{
                            width: '100%', textAlign: 'left', position: 'relative', overflow: 'hidden',
                            padding: '12px 14px', borderRadius: 9, cursor: canVote ? 'pointer' : 'default',
                            background: selected ? 'rgba(79,142,247,0.1)' : 'rgba(255,255,255,0.03)',
                            border: selected
                              ? '1px solid rgba(79,142,247,0.4)'
                              : canVote
                                ? '1px solid rgba(255,255,255,0.1)'
                                : '1px solid rgba(255,255,255,0.06)',
                            transition: 'border-color 0.15s, background 0.15s',
                          }}
                        >
                          {/* Progress bar fill */}
                          {showResult && (
                            <div style={{
                              position: 'absolute', inset: 0, left: 0, top: 0, bottom: 0,
                              width: `${pct}%`,
                              background: selected ? 'rgba(79,142,247,0.15)' : 'rgba(255,255,255,0.04)',
                              transition: 'width 0.4s ease',
                              borderRadius: 8,
                            }} />
                          )}
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {selected && <CheckCircle2 size={14} color={T.accent} style={{ flexShrink: 0 }} />}
                              <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? T.accent : T.text1 }}>
                                {opt.label || opt.text || `Option ${i + 1}`}
                              </span>
                            </div>
                            {showResult && (
                              <span style={{ fontSize: 13, fontWeight: 700, color: selected ? T.accent : T.text2, flexShrink: 0 }}>
                                {pct}%
                              </span>
                            )}
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

        {/* Create Poll Modal */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Create Poll">
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 8,
              }}>
                <AlertCircle size={14} color={T.danger} />
                <p style={{ fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Question
              </label>
              <input
                style={inputStyle}
                placeholder="What should we decide?"
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text2, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Options
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {form.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder={`Option ${i + 1}`}
                      value={opt}
                      onChange={e => setForm(f => ({ ...f, options: f.options.map((o, j) => j === i ? e.target.value : o) }))}
                    />
                    {form.options.length > 2 && (
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, j) => j !== i) }))}
                        style={{
                          padding: '8px 10px', background: 'rgba(248,113,113,0.08)',
                          border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, cursor: 'pointer',
                          display: 'flex', alignItems: 'center',
                        }}>
                        <Trash2 size={14} color={T.danger} />
                      </button>
                    )}
                  </div>
                ))}
                {form.options.length < 6 && (
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: T.accent, textAlign: 'left', padding: '2px 0' }}>
                    + Add option
                  </button>
                )}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: T.text2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Closes In
              </label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.expiresIn}
                onChange={e => setForm(f => ({ ...f, expiresIn: e.target.value }))}
              >
                <option value="24">24 hours</option>
                <option value="48">48 hours</option>
                <option value="72">3 days</option>
                <option value="168">1 week</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ ...secondaryBtnStyle, flex: 1, justifyContent: 'center' }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting} style={{ ...primaryBtnStyle, flex: 1, justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Creating…' : 'Create Poll'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
}
