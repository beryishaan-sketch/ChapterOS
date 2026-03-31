import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hash, Plus, Send, Trash2, Settings, Lock, Globe,
  ChevronLeft, X, Eye, EyeOff, KeyRound, ShieldAlert, Search
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const ROLE_OPTIONS = [
  { value: 'all',           label: '🌐 Everyone' },
  { value: 'admin,officer', label: '⭐ Officers & Above' },
  { value: 'admin',         label: '👑 President Only' },
  { value: 'member',        label: '👥 Members Only' },
  { value: 'pledge',        label: '🔰 Pledges Only' },
];

const EMOJI_OPTIONS = ['💬', '⭐', '📅', '🤝', '💰', '🏆', '📢', '🎉', '🛡️', '📋', '🔒', '⚡', '🎯', '🗳️'];

const AVATAR_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#0F1C3F'];
const avatarColor = (name = '') => AVATAR_COLORS[name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

function Avatar({ firstName = '', lastName = '', size = 8 }) {
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  const color = avatarColor(firstName + lastName);
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: color, width: `${size * 4}px`, height: `${size * 4}px`, fontSize: `${size * 1.5}px` }}>
      {initials}
    </div>
  );
}

// Groups consecutive messages from same author
function groupMessages(messages) {
  const groups = [];
  let current = null;
  for (const msg of messages) {
    const authorId = msg.authorId;
    const ts = new Date(msg.createdAt);
    const prev = current?.messages[current.messages.length - 1];
    const gap = prev ? (ts - new Date(prev.createdAt)) / 1000 / 60 > 5 : true;
    if (current && current.authorId === authorId && !gap) {
      current.messages.push(msg);
    } else {
      current = { authorId, author: msg.author, messages: [msg] };
      groups.push(current);
    }
  }
  return groups;
}

function MessageGroup({ group, isOwn, onDelete, canDelete }) {
  const { author, messages } = group;
  const time = new Date(messages[0].createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div className={`flex gap-3 px-4 py-1 group ${isOwn ? 'flex-row-reverse' : ''}`}>
      {/* Avatar — only show for others */}
      {!isOwn && (
        <div className="flex-shrink-0 mt-1">
          <Avatar firstName={author?.firstName} lastName={author?.lastName} size={8} />
        </div>
      )}

      <div className={`flex flex-col gap-0.5 max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Name + time */}
        {!isOwn && (
          <div className="flex items-baseline gap-2 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {author?.firstName} {author?.lastName}
            </span>
            {author?.position && (
              <span className="text-[10px] text-amber-600 font-medium">{author.position}</span>
            )}
            <span className="text-[10px] text-gray-400">{time}</span>
          </div>
        )}

        {/* Bubbles */}
        {messages.map((msg, i) => (
          <div key={msg.id} className={`relative group/msg flex items-end gap-1.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <div className={`px-3.5 py-2 text-sm leading-relaxed break-words
              ${isOwn
                ? 'bg-navy text-white rounded-[18px] rounded-br-[4px]'
                : 'bg-white border border-gray-100 text-gray-900 rounded-[18px] rounded-bl-[4px] shadow-sm'
              }
              ${messages.length > 1 && i === 0 && isOwn ? 'rounded-br-[18px]' : ''}
              ${messages.length > 1 && i > 0 && i < messages.length - 1 && isOwn ? 'rounded-r-[4px]' : ''}
              ${messages.length > 1 && i === messages.length - 1 && isOwn ? 'rounded-br-[4px]' : ''}
              ${messages.length > 1 && i === 0 && !isOwn ? 'rounded-bl-[18px]' : ''}
              ${messages.length > 1 && i > 0 && i < messages.length - 1 && !isOwn ? 'rounded-l-[4px]' : ''}
              ${messages.length > 1 && i === messages.length - 1 && !isOwn ? 'rounded-bl-[4px]' : ''}
            `}>
              {msg.content}
            </div>
            {canDelete && (
              <button onClick={() => onDelete(msg.id)}
                className="opacity-0 group-hover/msg:opacity-100 p-1 hover:bg-red-50 text-gray-300 hover:text-red-400 rounded-lg transition-all flex-shrink-0">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}

        {isOwn && (
          <span className="text-[10px] text-gray-400 px-1">{time}</span>
        )}
      </div>
    </div>
  );
}

function ChannelRow({ channel, active, onClick }) {
  const lastMsg = channel.messages?.[0];
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
        ${active ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/70 hover:text-white'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 transition-all
        ${active ? 'bg-white/15' : 'bg-white/8'}`}>
        {channel.emoji || '#'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-semibold text-sm truncate ${active ? 'text-white' : 'text-white/80'}`}>
            {channel.name}
          </span>
          {channel.isLocked && <Lock size={9} className="text-white/40 flex-shrink-0" />}
        </div>
        {lastMsg ? (
          <p className="text-xs text-white/40 truncate">
            {lastMsg.author?.firstName}: {lastMsg.content}
          </p>
        ) : (
          <p className="text-xs text-white/25">No messages yet</p>
        )}
      </div>
    </button>
  );
}

export default function Channels() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const lastMsgId = useRef(null);
  const inputRef = useRef(null);

  const [newChannel, setNewChannel] = useState({ name: '', description: '', emoji: '💬', allowedRoles: 'all', pin: '', pinHint: '' });
  const [unlockedChannels, setUnlockedChannels] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('unlockedChannels') || '[]')); } catch { return new Set(); }
  });
  const [pinEntry, setPinEntry] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  const isAdmin = user?.role === 'admin';
  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  const fetchChannels = useCallback(async () => {
    try {
      const res = await client.get('/channels');
      const list = res.data.data || [];
      setChannels(list);
      if (!activeChannel && list.length > 0) setActiveChannel(list[0]);
    } catch {}
  }, [activeChannel]);

  const fetchMessages = useCallback(async (channelId) => {
    if (!channelId) return;
    try {
      const res = await client.get(`/channels/${channelId}/messages?limit=80`);
      const msgs = res.data.data || [];
      setMessages(msgs);
      if (msgs.length > 0) lastMsgId.current = msgs[msgs.length - 1].id;
    } catch {}
  }, []);

  useEffect(() => { fetchChannels().finally(() => setLoading(false)); }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const res = await client.get(`/channels/${activeChannel.id}/messages?limit=20`);
          const msgs = res.data.data || [];
          if (msgs.length > 0 && msgs[msgs.length - 1].id !== lastMsgId.current) {
            setMessages(msgs);
            lastMsgId.current = msgs[msgs.length - 1].id;
          }
        } catch {}
      }, 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [activeChannel?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectChannel = (ch) => {
    if (ch.isLocked && !unlockedChannels.has(ch.id)) {
      setPinEntry({ channelId: ch.id, channelName: ch.name, pinHint: ch.pinHint });
      setPinInput(''); setPinError('');
      setActiveChannel(ch);
      setMobileView('chat');
      return;
    }
    setActiveChannel(ch);
    setMobileView('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const submitPin = async () => {
    if (!pinInput) return;
    try {
      const res = await client.post(`/channels/${pinEntry.channelId}/verify-pin`, { pin: pinInput });
      if (res.data.success) {
        setUnlockedChannels(prev => {
          const next = new Set([...prev, pinEntry.channelId]);
          localStorage.setItem('unlockedChannels', JSON.stringify([...next]));
          return next;
        });
        setPinEntry(null); setPinInput(''); setPinError('');
      }
    } catch (e) {
      setPinError(e.response?.data?.error || 'Wrong PIN');
      setPinInput('');
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChannel || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const res = await client.post(`/channels/${activeChannel.id}/messages`, { content: text });
      setMessages(prev => [...prev, res.data.data]);
      lastMsgId.current = res.data.data.id;
    } catch { setInput(text); }
    finally { setSending(false); }
  };

  const deleteMsg = async (msgId) => {
    try {
      await client.delete(`/channels/${activeChannel.id}/messages/${msgId}`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch {}
  };

  const createChannel = async () => {
    if (!newChannel.name.trim()) return;
    try {
      const payload = { ...newChannel };
      if (!payload.pin) { delete payload.pin; delete payload.pinHint; }
      const res = await client.post('/channels', payload);
      const created = res.data.data;
      setChannels(prev => [...prev, created]);
      if (created.isLocked) setUnlockedChannels(prev => new Set([...prev, created.id]));
      setActiveChannel(created);
      setShowCreate(false);
      setNewChannel({ name: '', description: '', emoji: '💬', allowedRoles: 'all', pin: '', pinHint: '' });
    } catch {}
  };

  const deleteChannel = async (id) => {
    if (!window.confirm('Delete this channel?')) return;
    try {
      await client.delete(`/channels/${id}`);
      const remaining = channels.filter(c => c.id !== id);
      setChannels(remaining);
      setActiveChannel(remaining[0] || null);
      setShowSettings(false);
    } catch {}
  };

  const updateChannel = async (updates) => {
    try {
      const res = await client.put(`/channels/${activeChannel.id}`, updates);
      if (!res.data.success) throw new Error(res.data.error || 'Update failed');
      const updated = res.data.data;
      setChannels(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setActiveChannel(updated);
      setShowSettings(false);
    } catch (e) {
      alert(e.response?.data?.error || e.message || 'Failed to update channel');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-navy border-t-transparent rounded-full" />
    </div>
  );

  const messageGroups = groupMessages(messages);

  const sidebar = (
    <div className="flex flex-col h-full" style={{ background: '#0F1C3F' }}>
      {/* Sidebar header */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-extrabold text-white text-base">Channels</h2>
            <p className="text-white/40 text-xs mt-0.5">{channels.length} channels</p>
          </div>
          {isOfficer && (
            <button onClick={() => setShowCreate(true)}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
              <Plus size={15} className="text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 no-scrollbar">
        {channels.length === 0 ? (
          <p className="text-white/30 text-xs text-center py-8">No channels yet</p>
        ) : channels.map(ch => (
          <ChannelRow key={ch.id} channel={ch} active={activeChannel?.id === ch.id} onClick={() => selectChannel(ch)} />
        ))}
      </div>
    </div>
  );

  const isLocked = activeChannel?.isLocked && !unlockedChannels.has(activeChannel?.id);

  const chatArea = (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <button className="md:hidden p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setMobileView('list')}>
          <ChevronLeft size={18} className="text-gray-600" />
        </button>
        {activeChannel ? (
          <>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: '#0F1C3F15' }}>
              {activeChannel.emoji || '💬'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{activeChannel.name}</h3>
              {activeChannel.description && (
                <p className="text-xs text-gray-400 truncate">{activeChannel.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeChannel.isLocked && (
                <div className="flex items-center gap-1 bg-red-50 text-red-500 border border-red-100 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  <Lock size={9} /> PIN
                </div>
              )}
              {activeChannel.allowedRoles !== 'all' && (
                <div className="hidden sm:flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  <Lock size={9} /> Restricted
                </div>
              )}
              {isOfficer && (
                <button onClick={() => setShowSettings(true)}
                  className="w-7 h-7 hover:bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                  <Settings size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">Select a channel</p>
        )}
      </div>

      {/* PIN lock screen */}
      {isLocked && (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full max-w-xs text-center">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={26} className="text-red-500" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">PIN Required</h3>
            <p className="text-sm text-gray-400 mb-4">
              {activeChannel?.pinHint ? `Hint: ${activeChannel.pinHint}` : 'Enter PIN to unlock this channel'}
            </p>
            {pinError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{pinError}</p>
            )}
            <div className="relative mb-3">
              <input
                type={showPin ? 'text' : 'password'}
                className="input-field w-full text-center text-2xl font-mono tracking-[0.3em] pr-10"
                placeholder="••••"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitPin()}
                autoFocus
              />
              <button type="button" onClick={() => setShowPin(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <button onClick={submitPin} disabled={!pinInput}
              className="btn-primary w-full justify-center gap-2">
              <KeyRound size={14} /> Unlock
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {!isLocked && (
        <>
          <div className="flex-1 overflow-y-auto py-4">
            {!activeChannel ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-300">
                <div className="text-5xl mb-3">💬</div>
                <p className="text-sm font-medium">Pick a channel</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-5xl mb-3">{activeChannel.emoji}</div>
                <p className="font-bold text-gray-700">#{activeChannel.name}</p>
                <p className="text-sm text-gray-400 mt-1">No messages yet — say something 👋</p>
              </div>
            ) : (
              <div className="space-y-1">
                {messageGroups.map((group, i) => (
                  <MessageGroup
                    key={i}
                    group={group}
                    isOwn={group.authorId === user?.id}
                    canDelete={group.messages.some(m => m.authorId === user?.id || isAdmin)}
                    onDelete={deleteMsg}
                  />
                ))}
                <div ref={messagesEndRef} className="h-2" />
              </div>
            )}
          </div>

          {/* Input bar */}
          {activeChannel && (
            <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 flex-shrink-0">
              <form onSubmit={send}
                className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus-within:border-navy/30 focus-within:bg-white transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e); }
                  }}
                  placeholder={`Message #${activeChannel.name}…`}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400 resize-none leading-relaxed"
                  maxLength={4000}
                  disabled={sending}
                />
                <button type="submit" disabled={!input.trim() || sending}
                  className="w-8 h-8 flex items-center justify-center bg-navy text-white rounded-xl disabled:opacity-25 hover:bg-navy/80 transition-all active:scale-95 flex-shrink-0">
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-7rem)] md:h-[calc(100vh-5rem)] flex rounded-2xl overflow-hidden border border-gray-200 shadow-sm -mx-4 md:mx-0">
      {/* Sidebar */}
      <div className={`w-64 flex-shrink-0
        ${mobileView === 'chat' ? 'hidden md:flex md:flex-col' : 'flex flex-col w-full md:w-64'}`}>
        {sidebar}
      </div>

      {/* Chat */}
      <div className={`flex-1 flex flex-col min-w-0
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {chatArea}
      </div>

      {/* Create Channel Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Channel">
        <div className="space-y-4">
          <div>
            <label className="label">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map(e => (
                <button key={e} onClick={() => setNewChannel(p => ({ ...p, emoji: e }))}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all
                    ${newChannel.emoji === e ? 'bg-navy text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Name</label>
            <div className="flex items-center gap-2 input-field">
              <Hash size={13} className="text-gray-400" />
              <input className="flex-1 bg-transparent outline-none text-sm"
                placeholder="general, officers, rush-2026…"
                value={newChannel.name}
                onChange={e => setNewChannel(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
            </div>
          </div>
          <div>
            <label className="label">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <input className="input-field w-full text-sm" placeholder="What's this channel for?"
              value={newChannel.description}
              onChange={e => setNewChannel(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div>
            <label className="label">Who can see it</label>
            <select className="select-field w-full" value={newChannel.allowedRoles}
              onChange={e => setNewChannel(p => ({ ...p, allowedRoles: e.target.value }))}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-red-500" />
              <p className="text-sm font-semibold text-gray-900">PIN Lock <span className="text-xs text-gray-400 font-normal">— optional</span></p>
            </div>
            <p className="text-xs text-gray-400">Requires a PIN to read — great for exec-only threads.</p>
            <div className="relative">
              <input type={showPin ? 'text' : 'password'} className="input-field w-full pr-10 text-sm"
                placeholder="Set a PIN (leave blank for none)"
                value={newChannel.pin}
                onChange={e => setNewChannel(p => ({ ...p, pin: e.target.value }))} />
              <button type="button" onClick={() => setShowPin(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            {newChannel.pin && (
              <input className="input-field w-full text-sm" placeholder="PIN hint (visible to members)"
                value={newChannel.pinHint}
                onChange={e => setNewChannel(p => ({ ...p, pinHint: e.target.value }))} />
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createChannel} disabled={!newChannel.name.trim()} className="btn-primary flex-1">
              {newChannel.pin ? '🔒 Create Locked' : 'Create Channel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      {activeChannel && (
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title={`#${activeChannel.name}`}>
          <ChannelSettings channel={activeChannel} onUpdate={updateChannel}
            onDelete={() => deleteChannel(activeChannel.id)} onClose={() => setShowSettings(false)} />
        </Modal>
      )}
    </div>
  );
}

function ChannelSettings({ channel, onUpdate, onDelete, onClose }) {
  const [form, setForm] = useState({
    name: channel.name,
    description: channel.description || '',
    emoji: channel.emoji || '💬',
    allowedRoles: channel.allowedRoles || 'all',
  });
  const [pinSection, setPinSection] = useState('idle'); // idle | set | remove
  const [newPin, setNewPin] = useState('');
  const [pinHint, setPinHint] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMsg, setPinMsg] = useState('');

  const savePin = async () => {
    if (newPin.length < 4) { setPinMsg('PIN must be at least 4 digits'); return; }
    setPinSaving(true);
    try {
      await onUpdate({ pin: newPin, pinHint });
      setPinSection('idle'); setNewPin(''); setPinHint('');
      setPinMsg('');
    } catch { setPinMsg('Failed to save PIN'); }
    setPinSaving(false);
  };

  const removePin = async () => {
    setPinSaving(true);
    try { await onUpdate({ removePin: true }); setPinSection('idle'); }
    catch { setPinMsg('Failed to remove PIN'); }
    setPinSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Icon</label>
        <div className="flex gap-2 flex-wrap">
          {EMOJI_OPTIONS.map(e => (
            <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))}
              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all
                ${form.emoji === e ? 'bg-navy text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Name</label>
        <input className="input-field w-full text-sm" value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
      </div>
      <div>
        <label className="label">Description</label>
        <input className="input-field w-full text-sm" value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>
      <div>
        <label className="label">Access</label>
        <select className="select-field w-full" value={form.allowedRoles}
          onChange={e => setForm(p => ({ ...p, allowedRoles: e.target.value }))}>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* PIN Lock Management */}
      <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={14} className={channel.isLocked ? 'text-red-500' : 'text-gray-300'} />
            <span className="text-sm font-semibold text-gray-800">Passcode Lock</span>
            {channel.isLocked && <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">Active</span>}
          </div>
          {pinSection === 'idle' && (
            <button onClick={() => setPinSection(channel.isLocked ? 'remove' : 'set')}
              className="text-xs font-semibold text-navy hover:underline">
              {channel.isLocked ? 'Change / Remove' : 'Set Passcode'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {channel.isLocked
            ? `Members must enter the passcode to read messages.${channel.pinHint ? ` Hint: "${channel.pinHint}"` : ''}`
            : 'Require a passcode to access this channel.'}
        </p>

        {pinSection === 'set' && (
          <div className="space-y-2 pt-1">
            <input type="password" className="input-field w-full text-sm font-mono tracking-widest"
              placeholder="New passcode (min 4 digits)" value={newPin}
              onChange={e => setNewPin(e.target.value)} autoFocus />
            <input className="input-field w-full text-sm" placeholder="Hint shown to members (optional)"
              value={pinHint} onChange={e => setPinHint(e.target.value)} />
            {pinMsg && <p className="text-xs text-red-500">{pinMsg}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setPinSection('idle'); setNewPin(''); setPinMsg(''); }}
                className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              <button onClick={savePin} disabled={pinSaving || newPin.length < 4}
                className="btn-primary flex-1 text-sm py-2">
                {pinSaving ? 'Saving…' : '🔒 Set Passcode'}
              </button>
            </div>
          </div>
        )}

        {pinSection === 'remove' && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">This will remove the passcode and make the channel accessible to everyone with role access.</p>
            <div className="flex gap-2">
              <button onClick={() => setPinSection('idle')} className="btn-secondary flex-1 text-sm py-2">Cancel</button>
              <button onClick={removePin} disabled={pinSaving} className="flex-1 text-sm py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors">
                {pinSaving ? 'Removing…' : 'Remove Passcode'}
              </button>
            </div>
            {channel.isLocked && (
              <button onClick={() => setPinSection('set')} className="w-full text-xs text-navy font-semibold hover:underline text-center pt-1">
                Change passcode instead →
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onUpdate(form)} className="btn-primary flex-1">Save</button>
      </div>
      <div className="pt-2 border-t border-gray-100">
        <button onClick={onDelete}
          className="w-full py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          Delete Channel
        </button>
      </div>
    </div>
  );
}
