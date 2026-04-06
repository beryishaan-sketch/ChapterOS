import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Send, Trash2, Settings, Lock, ChevronLeft, Eye, EyeOff, ShieldAlert, KeyRound, Hash } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import { getIsNative } from '../hooks/useNative';

/* ─── constants ─── */
const ROLE_OPTIONS = [
  { value: 'all',           label: '🌐 Everyone' },
  { value: 'admin,officer', label: '⭐ Officers & Above' },
  { value: 'admin',         label: '👑 President Only' },
  { value: 'member',        label: '👥 Members Only' },
  { value: 'pledge',        label: '🔰 Pledges Only' },
];
const EMOJI_OPTIONS = ['💬','⭐','📅','🤝','💰','🏆','📢','🎉','🛡️','📋','🔒','⚡','🎯','🗳️','🏠','🎓'];
const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#C9A84C'];
const avatarBg = (s = '') => AVATAR_COLORS[s.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const initials = (f = '', l = '') => `${f[0] || ''}${l[0] || ''}`.toUpperCase();

const N = {
  bg: '#080C14', card: '#111827', elevated: '#1E2A3A',
  border: 'rgba(255,255,255,0.08)',
  accent: '#3B82F6', gold: '#F59E0B', success: '#10B981', danger: '#EF4444',
  text1: '#FFFFFF', text2: 'rgba(255,255,255,0.55)', text3: 'rgba(255,255,255,0.28)',
  sep: 'rgba(255,255,255,0.06)',
  font: "-apple-system, 'SF Pro Display', system-ui, sans-serif",
};

function Avatar({ firstName, lastName, size = 32 }) {
  return (
    <div style={{
      width: size, height: size,
      background: avatarBg(firstName + lastName),
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
    }}>
      {initials(firstName, lastName)}
    </div>
  );
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return time;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + time;
}

function groupMessages(msgs) {
  const groups = [];
  msgs.forEach(msg => {
    const last = groups[groups.length - 1];
    const sameAuthor = last && last.authorId === msg.authorId;
    const within5min = last && (new Date(msg.createdAt) - new Date(last.messages[last.messages.length - 1].createdAt)) < 5 * 60000;
    if (sameAuthor && within5min) last.messages.push(msg);
    else groups.push({ authorId: msg.authorId, author: msg.author, messages: [msg] });
  });
  return groups;
}

/* ─── Message Bubble Group ─── */
function MessageGroup({ group, isOwn, canDelete, onDelete }) {
  const { author, messages } = group;
  return (
    <div className={`flex gap-2.5 px-3 py-0.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
      {!isOwn && (
        <div className="mt-1 flex-shrink-0">
          <Avatar firstName={author?.firstName} lastName={author?.lastName} size={30} />
        </div>
      )}
      <div className={`flex flex-col gap-1 max-w-[72%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && (
          <div className="flex items-center gap-2 px-1 mb-0.5">
            <span className="text-[12px] font-bold" style={{ color: avatarBg(author?.firstName + author?.lastName) }}>
              {author?.firstName} {author?.lastName}
            </span>
            {author?.position && (
              <span className="text-[10px]" style={{ color: 'rgba(201,168,76,0.8)' }}>{author.position}</span>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id} className={`flex items-end gap-1.5 group/msg ${isOwn ? 'flex-row-reverse' : ''}`}>
            {canDelete && (
              <button
                onClick={() => onDelete(msg.id)}
                className="opacity-0 group-hover/msg:opacity-100 transition-opacity mb-1"
              >
                <Trash2 size={11} style={{ color: 'rgba(255,100,100,0.6)' }} />
              </button>
            )}
            <div style={{
              background: isOwn
                ? 'linear-gradient(135deg, #1e3a7a 0%, #0F1C3F 100%)'
                : '#2c2c30',
              borderRadius: isOwn
                ? '18px 18px 4px 18px'
                : i === 0 ? '4px 18px 18px 18px' : '18px',
              padding: '9px 13px',
              boxShadow: isOwn
                ? '0 2px 12px rgba(15,28,63,0.5)'
                : '0 1px 3px rgba(0,0,0,0.25)',
            }}>
              <p style={{ color: 'rgba(255,255,255,0.93)', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', margin: 0 }}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        <span className="px-1" style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>
          {fmtTime(messages[messages.length - 1].createdAt)}
        </span>
      </div>
    </div>
  );
}

/* ─── Date Divider ─── */
function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>{date}</span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
    </div>
  );
}

/* ─── Channel Settings ─── */
function ChannelSettings({ channel, onUpdate, onDelete, onClose }) {
  const [form, setForm] = useState({ name: channel.name, description: channel.description || '', emoji: channel.emoji || '💬', allowedRoles: channel.allowedRoles || 'all' });
  const [pinMode, setPinMode] = useState('idle');
  const [newPin, setNewPin] = useState('');
  const [pinHint, setPinHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const savePin = async () => {
    if (newPin.length < 4) { setErr('PIN must be at least 4 digits'); return; }
    setSaving(true);
    try { await onUpdate({ pin: newPin, pinHint }); setPinMode('idle'); setNewPin(''); setErr(''); }
    catch { setErr('Failed to save'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="label">Icon</p>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map(e => (
            <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))}
              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.emoji === e ? 'bg-navy text-white scale-110' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Name</p>
        <input className="input-field w-full" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div>
        <p className="label">Description</p>
        <input className="input-field w-full text-sm" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="What's this channel for?" />
      </div>
      <div>
        <p className="label">Who can access</p>
        <select className="select-field w-full" value={form.allowedRoles} onChange={e => setForm(p => ({ ...p, allowedRoles: e.target.value }))}>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="border border-gray-100 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={13} className={channel.isLocked ? 'text-red-500' : 'text-gray-300'} />
            <span className="text-sm font-semibold text-gray-800">Passcode Lock</span>
            {channel.isLocked && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold">Active</span>}
          </div>
          {pinMode === 'idle' && (
            <button className="text-xs font-semibold text-navy hover:underline" onClick={() => setPinMode(channel.isLocked ? 'remove' : 'set')}>
              {channel.isLocked ? 'Change / Remove' : 'Set Passcode'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">{channel.isLocked ? `Members enter a passcode.${channel.pinHint ? ` Hint: "${channel.pinHint}"` : ''}` : 'Require a passcode to access.'}</p>
        {pinMode === 'set' && (
          <div className="space-y-2 pt-1">
            <input type="password" className="input-field w-full font-mono tracking-widest" placeholder="New passcode (min 4)" value={newPin} onChange={e => setNewPin(e.target.value)} autoFocus />
            <input className="input-field w-full text-sm" placeholder="Hint (optional)" value={pinHint} onChange={e => setPinHint(e.target.value)} />
            {err && <p className="text-xs text-red-500">{err}</p>}
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-sm" onClick={() => { setPinMode('idle'); setNewPin(''); setErr(''); }}>Cancel</button>
              <button className="btn-primary flex-1 text-sm" onClick={savePin} disabled={saving || newPin.length < 4}>Set Passcode</button>
            </div>
          </div>
        )}
        {pinMode === 'remove' && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">This removes the passcode.</p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-sm" onClick={() => setPinMode('idle')}>Cancel</button>
              <button className="flex-1 text-sm py-2 bg-red-500 text-white rounded-xl font-semibold" onClick={async () => { setSaving(true); await onUpdate({ removePin: true }); setPinMode('idle'); setSaving(false); }} disabled={saving}>Remove</button>
            </div>
            <button className="w-full text-xs text-navy font-semibold hover:underline text-center" onClick={() => setPinMode('set')}>Change passcode instead →</button>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button className="btn-primary flex-1" onClick={() => onUpdate(form)}>Save Changes</button>
      </div>
      <div className="pt-1 border-t border-gray-100">
        <button className="w-full py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors" onClick={onDelete}>
          Delete Channel
        </button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function Channels() {
  const { user } = useAuth();
  const isNative = getIsNative();
  const [channels, setChannels] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [nativeScreen, setNativeScreen] = useState('list'); // 'list' | 'chat'
  const [nativeSearch, setNativeSearch] = useState('');
  const [newCh, setNewCh] = useState({ name: '', description: '', emoji: '💬', allowedRoles: 'all', pin: '', pinHint: '' });
  const [unlocked, setUnlocked] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem('unlockedChannels') || '[]')); } catch { return new Set(); } });
  const [pinEntry, setPinEntry] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const lastIdRef = useRef(null);
  const inputRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const fetchChannels = useCallback(async () => {
    const res = await client.get('/channels');
    const list = res.data.data || [];
    setChannels(list);
    if (!active && list.length > 0) setActive(list[0]);
  }, [active]);

  const fetchMessages = useCallback(async (id) => {
    const res = await client.get(`/channels/${id}/messages?limit=80`);
    const msgs = res.data.data || [];
    setMessages(msgs);
    if (msgs.length) lastIdRef.current = msgs[msgs.length - 1].id;
  }, []);

  useEffect(() => { fetchChannels().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (!active) return;
    fetchMessages(active.id);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await client.get(`/channels/${active.id}/messages?limit=20`);
        const msgs = res.data.data || [];
        if (msgs.length && msgs[msgs.length - 1].id !== lastIdRef.current) {
          setMessages(msgs);
          lastIdRef.current = msgs[msgs.length - 1].id;
        }
      } catch { }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [active?.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const selectChannel = (ch) => {
    if (ch.isLocked && !unlocked.has(ch.id)) { setPinEntry(ch); setPinInput(''); setPinErr(''); }
    else { setActive(ch); setMobileView('chat'); }
  };

  const selectNativeChannel = (ch) => {
    if (ch.isLocked && !unlocked.has(ch.id)) {
      setPinEntry(ch); setPinInput(''); setPinErr('');
    } else {
      setActive(ch);
      setNativeScreen('chat');
    }
  };

  const submitPin = async () => {
    if (!pinInput) return;
    try {
      await client.post(`/channels/${pinEntry.id}/verify-pin`, { pin: pinInput });
      setUnlocked(prev => { const n = new Set([...prev, pinEntry.id]); localStorage.setItem('unlockedChannels', JSON.stringify([...n])); return n; });
      setActive(pinEntry); setMobileView('chat'); setNativeScreen('chat'); setPinEntry(null); setPinInput('');
    } catch { setPinErr('Wrong passcode — try again'); setPinInput(''); }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || !active || sending) return;
    setSending(true);
    const text = input.trim(); setInput('');
    try {
      const res = await client.post(`/channels/${active.id}/messages`, { content: text });
      setMessages(p => [...p, res.data.data]);
      lastIdRef.current = res.data.data.id;
    } catch { setInput(text); }
    setSending(false);
  };

  const deleteMsg = async (msgId) => {
    await client.delete(`/channels/${active.id}/messages/${msgId}`);
    setMessages(p => p.filter(m => m.id !== msgId));
  };

  const createChannel = async () => {
    if (!newCh.name.trim()) return;
    try {
      const payload = { ...newCh };
      if (!payload.pin) { delete payload.pin; delete payload.pinHint; }
      const res = await client.post('/channels', payload);
      const created = res.data.data;
      setChannels(p => [...p, created]);
      if (created.isLocked) setUnlocked(p => new Set([...p, created.id]));
      setActive(created); setMobileView('chat');
      setShowCreate(false);
      setNewCh({ name: '', description: '', emoji: '💬', allowedRoles: 'all', pin: '', pinHint: '' });
    } catch { }
  };

  const updateChannel = async (updates) => {
    try {
      const res = await client.put(`/channels/${active.id}`, updates);
      if (!res.data.success) throw new Error(res.data.error);
      const updated = res.data.data;
      setChannels(p => p.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setActive(updated); setShowSettings(false);
    } catch (e) { alert(e.response?.data?.error || e.message || 'Failed to update'); }
  };

  const deleteChannel = async () => {
    if (!window.confirm('Delete this channel?')) return;
    await client.delete(`/channels/${active.id}`);
    const rest = channels.filter(c => c.id !== active.id);
    setChannels(rest); setActive(rest[0] || null); setShowSettings(false);
  };

  const renderMessages = () => {
    const groups = groupMessages(messages);
    const elements = [];
    let lastDate = null;
    groups.forEach((group, i) => {
      const d = new Date(group.messages[0].createdAt);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
      const isYesterday = d.toDateString() === yesterday.toDateString();
      const dateStr = isToday ? 'Today' : isYesterday ? 'Yesterday' : d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
      if (dateStr !== lastDate) {
        elements.push(<DateDivider key={`d-${i}`} date={dateStr} />);
        lastDate = dateStr;
      }
      elements.push(
        <MessageGroup key={i} group={group}
          isOwn={group.authorId === user?.id}
          canDelete={group.messages.some(m => m.authorId === user?.id || isAdmin)}
          onDelete={deleteMsg} />
      );
    });
    return elements;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-navy border-t-transparent rounded-full" />
    </div>
  );

  /* ─── Native iOS Layout ─── */
  if (isNative) return (
    <>
      {nativeScreen === 'list' && (
        <div style={{ position:'fixed', top:'calc(44px + env(safe-area-inset-top))', bottom:'calc(49px + env(safe-area-inset-bottom))', left:0, right:0, background: N.bg, display:'flex', flexDirection:'column', fontFamily: N.font }}>
          {/* Header */}
          <div style={{ padding: '20px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <h1 style={{ fontSize:34, fontWeight:700, color:N.text1, margin:0, letterSpacing:-0.5 }}>Chat</h1>
            {isOfficer && <button onClick={() => setShowCreate(true)} style={{ width:36, height:36, borderRadius:18, background:N.accent, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><Plus size={18} color="#fff" /></button>}
          </div>

          {/* Search bar */}
          <div style={{ padding:'0 20px 12px', flexShrink:0 }}>
            <div style={{ background:N.card, borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, border:`1px solid ${N.border}` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={nativeSearch} onChange={e => setNativeSearch(e.target.value)} placeholder="Search channels" style={{ background:'none', border:'none', color:N.text1, fontSize:16, flex:1, outline:'none', fontFamily:N.font }} />
            </div>
          </div>

          {/* Channel list */}
          <div style={{ flex:1, overflowY:'auto', padding:'0 20px' }}>
            <div style={{ background:N.card, borderRadius:16, overflow:'hidden', border:`1px solid ${N.border}` }}>
              {channels.filter(ch => ch.name.toLowerCase().includes(nativeSearch.toLowerCase())).map((ch, idx, arr) => {
                const lastMsg = ch.messages?.[0];
                const isLast = idx === arr.length - 1;
                return (
                  <button key={ch.id} onClick={() => selectNativeChannel(ch)} style={{ width:'100%', display:'flex', alignItems:'center', padding:'14px 16px', background:'transparent', border:'none', cursor:'pointer', borderBottom: isLast ? 'none' : `1px solid ${N.sep}`, textAlign:'left' }}>
                    <div style={{ width:48, height:48, borderRadius:14, background: N.elevated, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0, marginRight:14, border:`1px solid ${N.border}` }}>
                      {ch.emoji || '💬'}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                        <span style={{ fontSize:16, fontWeight:600, color:N.text1 }}>{ch.name}</span>
                        {ch.isLocked && <Lock size={11} style={{ color:N.text3 }} />}
                      </div>
                      <p style={{ fontSize:13, color:N.text2, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {lastMsg ? `${lastMsg.author?.firstName}: ${lastMsg.content}` : ch.description || 'No messages yet'}
                      </p>
                    </div>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                );
              })}
            </div>
            {channels.length === 0 && (
              <div style={{ textAlign:'center', padding:'60px 20px' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>💬</div>
                <p style={{ fontSize:17, fontWeight:600, color:N.text1, margin:'0 0 8px' }}>No channels yet</p>
                <p style={{ fontSize:14, color:N.text2 }}>{isOfficer ? 'Create one to get started' : 'Your officers will create channels'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {nativeScreen === 'chat' && (
        <div style={{ position:'fixed', top:'calc(44px + env(safe-area-inset-top))', bottom:'calc(49px + env(safe-area-inset-bottom))', left:0, right:0, background:'#0A0F1A', display:'flex', flexDirection:'column', fontFamily: N.font }}>
          {/* Chat header */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'rgba(8,12,20,0.95)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:`1px solid ${N.border}`, flexShrink:0 }}>
            <button onClick={() => setNativeScreen('list')} style={{ width:36, height:36, borderRadius:10, background:N.card, border:`1px solid ${N.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div style={{ width:40, height:40, borderRadius:12, background:N.elevated, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{active?.emoji || '💬'}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:17, fontWeight:700, color:N.text1 }}>{active?.name}</div>
              {active?.description && <div style={{ fontSize:12, color:N.text3 }}>{active.description}</div>}
            </div>
            {isOfficer && <button onClick={() => setShowSettings(true)} style={{ width:36, height:36, borderRadius:10, background:N.card, border:`1px solid ${N.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}><Settings size={16} color={N.text2} /></button>}
          </div>

          {/* Messages */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {renderMessages()}
            <div ref={bottomRef} style={{ height:8 }} />
          </div>

          {/* Input */}
          {active && (
            <div style={{ padding:'10px 16px', paddingBottom:'max(14px, env(safe-area-inset-bottom))', background:'rgba(8,12,20,0.95)', borderTop:`1px solid ${N.border}`, flexShrink:0 }}>
              <form onSubmit={send} style={{ display:'flex', alignItems:'center', gap:10, background:N.card, borderRadius:24, padding:'8px 8px 8px 16px', border:`1px solid ${N.border}` }}>
                <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} placeholder={`Message ${active?.name||''}…`} style={{ flex:1, background:'transparent', border:'none', color:N.text1, fontSize:16, outline:'none', fontFamily:N.font }} />
                <button type="submit" disabled={!input.trim()||sending} style={{ width:36, height:36, borderRadius:18, background:input.trim() ? N.accent : N.elevated, border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'background 0.15s' }}>
                  <Send size={15} color="#fff" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Native Modals */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Channel">
        <div className="space-y-4">
          <div>
            <p className="label">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setNewCh(p => ({ ...p, emoji: e }))}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${newCh.emoji === e ? 'bg-navy text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Name</p>
            <input className="input-field w-full" placeholder="Officers, General, Rush 2026…"
              value={newCh.name} onChange={e => setNewCh(p => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
          <div>
            <p className="label">Description <span className="text-gray-400 font-normal text-xs">— optional</span></p>
            <input className="input-field w-full text-sm" placeholder="What's this channel for?"
              value={newCh.description} onChange={e => setNewCh(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <p className="label">Who can access</p>
            <select className="select-field w-full" value={newCh.allowedRoles} onChange={e => setNewCh(p => ({ ...p, allowedRoles: e.target.value }))}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <p className="label">Passcode <span className="text-gray-400 font-normal text-xs">— optional, locks the channel</span></p>
            <input type="password" className="input-field w-full font-mono" placeholder="Leave blank for open access"
              value={newCh.pin} onChange={e => setNewCh(p => ({ ...p, pin: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={createChannel} disabled={!newCh.name.trim()}>
              {newCh.pin ? '🔒 Create Locked' : 'Create Channel'}
            </button>
          </div>
        </div>
      </Modal>

      {pinEntry && (
        <Modal isOpen={!!pinEntry} onClose={() => setPinEntry(null)} title="">
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-navy/8 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">{pinEntry.emoji || '🔒'}</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">{pinEntry.name}</h3>
            <p className="text-sm text-gray-400 mb-5">{pinEntry.pinHint ? `Hint: ${pinEntry.pinHint}` : 'Enter passcode to unlock'}</p>
            {pinErr && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{pinErr}</p>}
            <input type="password" className="input-field w-full text-center text-xl font-mono tracking-widest mb-3"
              placeholder="••••" value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitPin()} autoFocus />
            <button onClick={submitPin} disabled={!pinInput} className="btn-primary w-full justify-center">
              <KeyRound size={14} /> Unlock
            </button>
          </div>
        </Modal>
      )}

      {active && (
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title={`${active.emoji} ${active.name}`}>
          <ChannelSettings channel={active} onUpdate={updateChannel} onDelete={deleteChannel} onClose={() => setShowSettings(false)} />
        </Modal>
      )}
    </>
  );

  /* ─── Container style: fixed on mobile, static on desktop ─── */
  const containerStyle = isMobile ? {
    position: 'fixed',
    top: 'env(safe-area-inset-top)',
    bottom: 'calc(49px + env(safe-area-inset-bottom))',
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    overflow: 'hidden',
  } : {
    display: 'flex',
    height: 'calc(100vh - 80px)',
    marginLeft: '-2rem',
    marginRight: '-2rem',
    marginTop: '-2rem',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
  };

  /* ─── Sidebar ─── */
  const sidebar = (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(160deg, #0f1c3f 0%, #090f1f 100%)' }}>
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>Channels</span>
          {isOfficer && (
            <button onClick={() => setShowCreate(true)}
              style={{ background: 'rgba(255,255,255,0.1)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="hover:bg-white/20 transition-all">
              <Plus size={14} color="#fff" />
            </button>
          )}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{channels.length} channels</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4" style={{ scrollbarWidth: 'none' }}>
        {channels.map(ch => {
          const isActive = active?.id === ch.id;
          const lastMsg = ch.messages?.[0];
          return (
            <button key={ch.id} onClick={() => selectChannel(ch)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-left transition-all group"
              style={{ background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', marginBottom: 2 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                {ch.emoji || '💬'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : 'rgba(255,255,255,0.6)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ch.name}
                  </span>
                  {ch.isLocked && <Lock size={9} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />}
                </div>
                <p style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.22)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                  {lastMsg ? `${lastMsg.author?.firstName}: ${lastMsg.content}` : ch.description || 'No messages yet'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ─── Chat Area ─── */
  const isLocked = active?.isLocked && !unlocked.has(active?.id);

  const chatArea = (
    <div className="flex-1 flex flex-col min-w-0 h-full" style={{ background: '#1c1c1e' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0" style={{
        height: 56,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(28,28,30,0.95)',
        backdropFilter: 'blur(10px)',
      }}>
        <button
          className="md:hidden flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', marginLeft: -4 }}
          onClick={() => setMobileView('list')}>
          <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
        </button>
        {active ? (
          <>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {active.emoji || '💬'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 style={{ fontWeight: 700, color: '#fff', fontSize: 15, letterSpacing: '-0.01em' }}>{active.name}</h3>
                {active.isLocked && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, background: 'rgba(255,59,48,0.15)', color: '#FF6B6B', border: '1px solid rgba(255,59,48,0.25)', padding: '2px 7px', borderRadius: 99, fontWeight: 600 }}>
                    <Lock size={8} /> PIN
                  </span>
                )}
              </div>
              {active.description && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{active.description}</p>
              )}
            </div>
            {isOfficer && (
              <button onClick={() => setShowSettings(true)}
                style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="hover:bg-white/10 transition-colors">
                <Settings size={15} color="rgba(255,255,255,0.5)" />
              </button>
            )}
          </>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Select a channel</p>
        )}
      </div>

      {/* PIN Lock Screen */}
      {isLocked && (
        <div className="flex-1 flex items-center justify-center p-8" style={{ background: '#141416' }}>
          <div style={{ background: '#252528', borderRadius: 24, padding: 32, width: '100%', maxWidth: 320, textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ width: 56, height: 56, background: 'rgba(15,28,63,0.4)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldAlert size={26} color="#C9A84C" />
            </div>
            <h3 style={{ fontWeight: 800, color: '#fff', fontSize: 18, marginBottom: 6 }}>Passcode Required</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              {active?.pinHint ? `Hint: ${active.pinHint}` : 'Enter the passcode to access this channel'}
            </p>
            {pinErr && (
              <p style={{ fontSize: 12, color: '#FF6B6B', background: 'rgba(255,59,48,0.12)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>{pinErr}</p>
            )}
            <div className="relative mb-3">
              <input
                type={showPinText ? 'text' : 'password'}
                style={{ width: '100%', background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '12px 40px 12px 14px', color: '#fff', fontSize: 20, fontFamily: 'monospace', letterSpacing: '0.3em', textAlign: 'center', outline: 'none' }}
                placeholder="••••"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitPin()}
                autoFocus
              />
              <button type="button" onClick={() => setShowPinText(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                {showPinText ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button onClick={submitPin} disabled={!pinInput}
              style={{ width: '100%', background: 'linear-gradient(135deg, #1e3a7a, #0F1C3F)', color: '#fff', borderRadius: 12, padding: '12px 0', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: !pinInput ? 0.4 : 1 }}>
              <KeyRound size={14} /> Unlock
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {!isLocked && (
        <>
          <div className="flex-1 overflow-y-auto py-2" style={{ scrollbarWidth: 'none' }}>
            {!active ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.06)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 32 }}>💬</div>
                <p style={{ fontWeight: 800, color: '#fff', fontSize: 18, marginBottom: 6 }}>Welcome to Channels</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', maxWidth: 260 }}>Select a channel to start messaging your chapter.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div style={{ width: 64, height: 64, background: 'rgba(255,255,255,0.06)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 32 }}>
                  {active.emoji}
                </div>
                <p style={{ fontWeight: 800, color: '#fff', fontSize: 18, marginBottom: 6 }}>{active.name}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>No messages yet — say something 👋</p>
              </div>
            ) : (
              <div>
                {renderMessages()}
                <div ref={bottomRef} className="h-3" />
              </div>
            )}
          </div>

          {/* Input */}
          {active && (
            <div className="flex-shrink-0 px-3 pt-2" style={{
              paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              background: '#1c1c1e',
            }}>
              <form onSubmit={send} className="flex items-center gap-2"
                style={{ background: '#2c2c30', borderRadius: 24, padding: '8px 8px 8px 16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <Avatar firstName={user?.firstName || ''} lastName={user?.lastName || ''} size={26} />
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); } }}
                  placeholder={`Message ${active.name}…`}
                  style={{ flex: 1, background: 'transparent', outline: 'none', color: '#fff', fontSize: 14, '::placeholder': { color: 'rgba(255,255,255,0.3)' } }}
                  className="placeholder:text-white/30"
                  maxLength={4000}
                  disabled={sending}
                />
                <button type="submit" disabled={!input.trim() || sending}
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: input.trim() ? 'linear-gradient(135deg, #1e3a7a, #0F1C3F)' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.15s',
                  }}>
                  <Send size={13} color={input.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      <div style={containerStyle}>
        {/* Sidebar */}
        <div
          className={`flex-shrink-0 flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}
          style={{
            width: isMobile && mobileView === 'list' ? '100%' : 240,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}>
          {sidebar}
        </div>

        {/* Chat */}
        <div
          className={`flex-col min-w-0 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}
          style={{ width: isMobile && mobileView === 'chat' ? '100%' : undefined, flex: isMobile && mobileView === 'chat' ? 'none' : 1 }}>
          {chatArea}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Channel">
        <div className="space-y-4">
          <div>
            <p className="label">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setNewCh(p => ({ ...p, emoji: e }))}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${newCh.emoji === e ? 'bg-navy text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Name</p>
            <input className="input-field w-full" placeholder="Officers, General, Rush 2026…"
              value={newCh.name} onChange={e => setNewCh(p => ({ ...p, name: e.target.value }))} autoFocus />
          </div>
          <div>
            <p className="label">Description <span className="text-gray-400 font-normal text-xs">— optional</span></p>
            <input className="input-field w-full text-sm" placeholder="What's this channel for?"
              value={newCh.description} onChange={e => setNewCh(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <p className="label">Who can access</p>
            <select className="select-field w-full" value={newCh.allowedRoles} onChange={e => setNewCh(p => ({ ...p, allowedRoles: e.target.value }))}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <p className="label">Passcode <span className="text-gray-400 font-normal text-xs">— optional, locks the channel</span></p>
            <input type="password" className="input-field w-full font-mono" placeholder="Leave blank for open access"
              value={newCh.pin} onChange={e => setNewCh(p => ({ ...p, pin: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={createChannel} disabled={!newCh.name.trim()}>
              {newCh.pin ? '🔒 Create Locked' : 'Create Channel'}
            </button>
          </div>
        </div>
      </Modal>

      {pinEntry && (
        <Modal isOpen={!!pinEntry} onClose={() => setPinEntry(null)} title="">
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-navy/8 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">{pinEntry.emoji || '🔒'}</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">{pinEntry.name}</h3>
            <p className="text-sm text-gray-400 mb-5">{pinEntry.pinHint ? `Hint: ${pinEntry.pinHint}` : 'Enter passcode to unlock'}</p>
            {pinErr && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{pinErr}</p>}
            <input type="password" className="input-field w-full text-center text-xl font-mono tracking-widest mb-3"
              placeholder="••••" value={pinInput} onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitPin()} autoFocus />
            <button onClick={submitPin} disabled={!pinInput} className="btn-primary w-full justify-center">
              <KeyRound size={14} /> Unlock
            </button>
          </div>
        </Modal>
      )}

      {active && (
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title={`${active.emoji} ${active.name}`}>
          <ChannelSettings channel={active} onUpdate={updateChannel} onDelete={deleteChannel} onClose={() => setShowSettings(false)} />
        </Modal>
      )}
    </>
  );
}
