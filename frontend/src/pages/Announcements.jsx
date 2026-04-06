import React, { useState, useEffect } from 'react';
import { Pin, Trash2, Plus, Megaphone, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  overflow: 'hidden',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const roleBadge = (role) => {
  const map = { admin: 'badge-gold', officer: 'badge-navy', member: 'badge-gray', alumni: 'badge-purple' };
  return map[role] || 'badge-gray';
};

const initials = (firstName, lastName) => `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();

const AVATAR_PALETTES = [
  { color: '#60A5FA', bg: 'rgba(96,165,250,0.2)' },
  { color: '#A78BFA', bg: 'rgba(167,139,250,0.2)' },
  { color: '#34D399', bg: 'rgba(52,211,153,0.2)' },
  { color: '#FB923C', bg: 'rgba(251,146,60,0.2)' },
  { color: '#F472B6', bg: 'rgba(244,114,182,0.2)' },
];
const avatarPalette = (name) => AVATAR_PALETTES[(name?.charCodeAt(0) || 0) % AVATAR_PALETTES.length];

// ─── Native design tokens ─────────────────────────────────────────────────────
const N = {
  bg: '#000000', card: '#1C1C1E', elevated: '#2C2C2E',
  sep: 'rgba(255,255,255,0.08)',
  accent: '#0A84FF', success: '#30D158', warning: '#FF9F0A', danger: '#FF453A',
  text1: '#FFFFFF', text2: 'rgba(235,235,245,0.6)', text3: 'rgba(235,235,245,0.3)',
  font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'officer'].includes(user?.role);
  const isNative = getIsNative();

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', pinned: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const res = await client.get('/announcements');
      if (res.data.success) setAnnouncements(res.data.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { setError('Title and body are required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await client.post('/announcements', form);
      if (res.data.success) {
        setAnnouncements(prev => [res.data.data, ...prev]);
        setShowModal(false);
        setForm({ title: '', body: '', pinned: false });
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to post');
    } finally { setSubmitting(false); }
  };

  const handlePin = async (id) => {
    try {
      const res = await client.patch(`/announcements/${id}/pin`);
      if (res.data.success) {
        setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, pinned: res.data.data.pinned } : a)
          .sort((a, b) => b.pinned - a.pinned || new Date(b.createdAt) - new Date(a.createdAt)));
      }
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await client.delete(`/announcements/${id}`);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch {}
  };

  if (loading) return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ ...cardStyle, height: 128, background: T.card, opacity: 0.5 }} />
      ))}
    </div>
  );

  // ─── Native iOS layout ────────────────────────────────────────────────────
  if (isNative) {
    // Pinned items first, then by date
    const sorted = [...announcements].sort((a, b) => {
      if (b.pinned !== a.pinned) return b.pinned - a.pinned;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return (
      <div style={{ background: N.bg, minHeight: '100vh', paddingBottom: 20, fontFamily: N.font }}>
        {/* Large title */}
        <h1 style={{ fontSize: 34, fontWeight: 700, color: N.text1, margin: 0, padding: '16px 20px 4px', letterSpacing: -0.5 }}>
          Announcements
        </h1>

        {/* Announcement cards */}
        <div style={{ marginTop: 12 }}>
          {sorted.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: N.text2, fontSize: 15 }}>
              No announcements yet
            </div>
          ) : (
            sorted.map(ann => {
              const palette = avatarPalette(ann.author?.firstName);
              const inits = initials(ann.author?.firstName, ann.author?.lastName);
              return (
                <div key={ann.id} style={{ margin: '0 16px 12px', background: N.card, borderRadius: 14, padding: '16px' }}>
                  {/* Author row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 18, background: palette.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: palette.color }}>{inits}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: N.text1 }}>
                        {ann.author?.firstName} {ann.author?.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: N.text3 }}>{timeAgo(ann.createdAt)}</div>
                    </div>
                    {ann.pinned && (
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: N.warning, fontWeight: 600 }}>PINNED</span>
                    )}
                  </div>
                  {/* Title */}
                  <div style={{ fontSize: 17, fontWeight: 600, color: N.text1, marginBottom: 6 }}>{ann.title}</div>
                  {/* Body */}
                  <div style={{ fontSize: 15, color: N.text2, lineHeight: 1.5 }}>{ann.body}</div>
                </div>
              );
            })
          )}
        </div>

        {/* FAB — post announcement (admin only) */}
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              position: 'fixed', bottom: 'calc(83px + env(safe-area-inset-bottom))', right: 20,
              width: 56, height: 56, borderRadius: 28, background: N.accent,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', boxShadow: '0 4px 20px rgba(10,132,255,0.4)', zIndex: 50,
            }}
          >
            <Plus size={24} style={{ color: '#fff' }} />
          </button>
        )}

        {/* Reuse existing post modal */}
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Post Announcement">
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <label style={labelStyle}>Title</label>
              <input style={inputStyle} placeholder="Announcement title" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Message</label>
              <textarea
                style={{ ...inputStyle, height: 128, resize: 'none', lineHeight: 1.6 }}
                placeholder="Write your announcement..."
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              />
            </div>
            {user?.role === 'admin' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                  style={{ accentColor: T.gold, width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>Pin this announcement</span>
              </label>
            )}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={() => setShowModal(false)} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Posting…' : 'Post Announcement'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 0 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '28px 24px 20px', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.03em' }}>Announcements</h1>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: '4px 0 0' }}>Chapter-wide updates</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} style={btnPrimary}>
            <Plus size={15} /> Post
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '0 24px' }}>
        {announcements.length === 0 ? (
          <div style={{ ...cardStyle, padding: '64px 24px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: T.elevated,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Megaphone size={24} color={T.textMuted} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.textSecondary, margin: '0 0 4px' }}>No announcements yet</p>
            {isAdmin && (
              <button onClick={() => setShowModal(true)} style={{ ...btnPrimary, marginTop: 16 }}>
                Post First Announcement
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map(ann => {
              const palette = avatarPalette(ann.author?.firstName);
              return (
                <div
                  key={ann.id}
                  style={{
                    ...cardStyle,
                    border: ann.pinned
                      ? `1px solid rgba(240,180,41,0.3)`
                      : `1px solid ${T.border}`,
                  }}
                >
                  {/* Pinned bar */}
                  {ann.pinned && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px 0',
                      color: T.gold,
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}>
                      <Pin size={10} fill={T.gold} color={T.gold} />
                      Pinned
                    </div>
                  )}

                  <div style={{ padding: ann.pinned ? '10px 16px 16px' : '16px', background: ann.pinned ? 'rgba(240,180,41,0.03)' : 'transparent' }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, margin: 0, lineHeight: 1.35, flex: 1 }}>
                        {ann.title}
                      </h3>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button
                            onClick={() => handlePin(ann.id)}
                            style={{
                              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 150ms ease',
                              background: ann.pinned ? 'rgba(240,180,41,0.15)' : 'transparent',
                              color: ann.pinned ? T.gold : T.textMuted,
                            }}
                            onMouseEnter={e => { if (!ann.pinned) { e.currentTarget.style.color = T.gold; e.currentTarget.style.background = 'rgba(240,180,41,0.12)'; } }}
                            onMouseLeave={e => { if (!ann.pinned) { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent'; } }}
                          >
                            <Pin size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(ann.id)}
                            style={{
                              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 150ms ease',
                              background: 'transparent', color: T.textMuted,
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = T.danger; e.currentTarget.style.background = 'rgba(248,113,113,0.12)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent'; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <p style={{
                      fontSize: 14,
                      color: T.textSecondary,
                      marginTop: 10,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {ann.body}
                    </p>

                    {/* Author + timestamp */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginTop: 12, paddingTop: 12,
                      borderTop: `1px solid ${T.border}`,
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: palette.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: palette.color,
                        fontSize: 10,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}>
                        {initials(ann.author?.firstName, ann.author?.lastName)}
                      </div>
                      <p style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600, margin: 0 }}>
                        {ann.author?.firstName} {ann.author?.lastName}
                      </p>
                      <span style={{ color: T.textMuted, fontSize: 13 }}>·</span>
                      <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{timeAgo(ann.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Post Announcement">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 8,
            }}>
              <AlertCircle size={14} color={T.danger} />
              <p style={{ fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
            </div>
          )}
          <div>
            <label style={labelStyle}>Title</label>
            <input style={inputStyle} placeholder="Announcement title" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div>
            <label style={labelStyle}>Message</label>
            <textarea
              style={{ ...inputStyle, height: 128, resize: 'none', lineHeight: 1.6 }}
              placeholder="Write your announcement..."
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            />
          </div>
          {user?.role === 'admin' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                style={{ accentColor: T.gold, width: 16, height: 16 }}
              />
              <span style={{ fontSize: 13, color: T.textSecondary, fontWeight: 600 }}>Pin this announcement</span>
            </label>
          )}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={() => setShowModal(false)} style={{ ...btnSecondary, flex: 1, justifyContent: 'center' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: submitting ? 0.6 : 1 }}>
              {submitting ? 'Posting…' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
