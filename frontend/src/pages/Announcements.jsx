import React, { useState, useEffect } from 'react';
import { Pin, Trash2, Plus, Megaphone, AlertCircle, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import Modal from '../components/Modal';

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
const avatarColor = (name) => {
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700', 'bg-rose-100 text-rose-700'];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

export default function Announcements() {
  const { user } = useAuth();
  const isAdmin = ['admin', 'officer'].includes(user?.role);

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
    <div className="max-w-2xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="card h-32 skeleton" />)}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Chapter-wide updates</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-navy text-sm px-3 py-2 min-h-0 h-10">
            <Plus size={15} /> Post
          </button>
        )}
      </div>

      {announcements.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Megaphone size={24} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-400">No announcements yet</p>
          {isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 mx-auto">
              Post First Announcement
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className={`card overflow-hidden ${ann.pinned ? 'border-gold/40' : ''}`}>
              {ann.pinned && (
                <div className="flex items-center gap-1.5 text-gold-dark text-xs font-bold px-4 pt-3 pb-0">
                  <Pin size={11} className="fill-gold-dark" /> PINNED
                </div>
              )}
              <div className={`p-4 ${ann.pinned ? 'bg-gold/3' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-gray-900 leading-snug flex-1">{ann.title}</h3>
                  {isAdmin && (
                    <div className="flex gap-0.5 flex-shrink-0">
                      <button onClick={() => handlePin(ann.id)}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          ann.pinned ? 'text-gold bg-gold/10' : 'text-gray-300 hover:text-gold hover:bg-gold/10'
                        }`}>
                        <Pin size={14} />
                      </button>
                      <button onClick={() => handleDelete(ann.id)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap line-clamp-3">{ann.body}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarColor(ann.author?.firstName)}`}>
                    {initials(ann.author?.firstName, ann.author?.lastName)}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{ann.author?.firstName} {ann.author?.lastName}</p>
                  <span className="text-gray-200">·</span>
                  <p className="text-xs text-gray-400">{timeAgo(ann.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setError(''); }} title="Post Announcement">
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={14} className="text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          <div>
            <label className="label">Title</label>
            <input className="input-field" placeholder="Announcement title" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea className="input-field h-32 resize-none" placeholder="Write your announcement..."
              value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
          </div>
          {user?.role === 'admin' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))}
                className="w-4 h-4 accent-gold" />
              <span className="text-sm text-gray-700 font-medium">Pin this announcement</span>
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
              {submitting ? 'Posting…' : 'Post Announcement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
