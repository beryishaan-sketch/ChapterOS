import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Hash, Plus, Send, Trash2, Settings, Lock, Globe,
  ChevronLeft, MoreVertical, X, Check, Users, ShieldAlert, Eye, EyeOff, KeyRound
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const ROLE_OPTIONS = [
  { value: 'all',           label: '🌐 Everyone' },
  { value: 'admin,officer', label: '⭐ Officers & Above' },
  { value: 'admin',         label: '👑 President Only' },
  { value: 'member',        label: '👥 Members Only (no pledges/alumni)' },
  { value: 'pledge',        label: '🔰 Pledges Only' },
];

const EMOJI_OPTIONS = ['💬', '⭐', '📅', '🤝', '💰', '🏆', '📢', '🎉', '🛡️', '📋', '🔒', '⚡', '🎯', '🗳️'];

function ChannelItem({ channel, active, onClick }) {
  const lastMsg = channel.messages?.[0];
  const isRestricted = channel.allowedRoles !== 'all';
  const isPinLocked = channel.isLocked;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
        ${active ? 'bg-navy text-white' : 'hover:bg-gray-100 text-gray-700'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0
        ${active ? 'bg-white/10' : isPinLocked ? 'bg-red-50' : 'bg-gray-100'}`}>
        {channel.emoji || '#'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-semibold text-sm truncate flex items-center gap-1.5 ${active ? 'text-white' : 'text-gray-900'}`}>
          {channel.name}
          {isPinLocked && <Lock size={10} className={active ? 'text-white/60' : 'text-red-400'} />}
        </div>
        {lastMsg && (
          <div className={`text-xs truncate ${active ? 'text-white/50' : 'text-gray-400'}`}>
            {lastMsg.author?.firstName}: {lastMsg.content}
          </div>
        )}
      </div>
      {(isRestricted || isPinLocked) && (
        <div className="flex-shrink-0">
          {isPinLocked
            ? <ShieldAlert size={12} className={active ? 'text-white/40' : 'text-red-300'} />
            : <Lock size={12} className={active ? 'text-white/40' : 'text-gray-300'} />
          }
        </div>
      )}
    </button>
  );
}

function MessageBubble({ message, isOwn, onDelete, canDelete }) {
  const [showActions, setShowActions] = useState(false);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const author = message.author;

  return (
    <div
      className={`group flex gap-3 px-4 py-1.5 hover:bg-gray-50 rounded-lg transition-colors`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
        {author?.firstName?.[0]}{author?.lastName?.[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-semibold text-sm text-gray-900">
            {author?.firstName} {author?.lastName}
          </span>
          {author?.position && (
            <span className="text-xs text-gold-dark font-medium">{author.position}</span>
          )}
          <span className="text-xs text-gray-400">{time}</span>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed break-words">{message.content}</p>
      </div>

      {/* Actions */}
      {canDelete && showActions && (
        <button
          onClick={() => onDelete(message.id)}
          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 hover:text-red-500 text-gray-400 rounded transition-all"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
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
  const [mobileView, setMobileView] = useState('list'); // list | chat
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const lastMsgId = useRef(null);

  const [newChannel, setNewChannel] = useState({ name: '', description: '', emoji: '💬', allowedRoles: 'all', pin: '', pinHint: '' });
  const [unlockedChannels, setUnlockedChannels] = useState(new Set()); // channel IDs that have been PIN-verified this session
  const [pinEntry, setPinEntry] = useState(null); // { channelId, pinHint }
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

  useEffect(() => {
    fetchChannels().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel.id);
      clearInterval(pollRef.current);
      // Poll for new messages every 3 seconds
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
    // If channel is PIN-locked and not yet verified this session, show PIN entry
    if (ch.isLocked && !unlockedChannels.has(ch.id)) {
      setPinEntry({ channelId: ch.id, channelName: ch.name, pinHint: ch.pinHint });
      setPinInput('');
      setPinError('');
      setActiveChannel(ch); // set it so we know which channel we're trying to open
      setMobileView('chat');
      return;
    }
    setActiveChannel(ch);
    setMobileView('chat');
  };

  const submitPin = async () => {
    if (!pinInput) return;
    try {
      const res = await client.post(`/channels/${pinEntry.channelId}/verify-pin`, { pin: pinInput });
      if (res.data.success) {
        setUnlockedChannels(prev => new Set([...prev, pinEntry.channelId]));
        setPinEntry(null);
        setPinInput('');
        setPinError('');
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
      // Auto-unlock newly created locked channel for this session
      if (created.isLocked) setUnlockedChannels(prev => new Set([...prev, created.id]));
      setActiveChannel(created);
      setShowCreate(false);
      setNewChannel({ name: '', description: '', emoji: '💬', allowedRoles: 'all', pin: '', pinHint: '' });
    } catch {}
  };

  const deleteChannel = async (id) => {
    if (!window.confirm('Delete this channel and all its messages?')) return;
    try {
      await client.delete(`/channels/${id}`);
      const remaining = channels.filter(c => c.id !== id);
      setChannels(remaining);
      setActiveChannel(remaining[0] || null);
    } catch {}
  };

  const updateChannel = async (updates) => {
    try {
      const res = await client.put(`/channels/${activeChannel.id}`, updates);
      const updated = res.data.data;
      setChannels(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
      setActiveChannel(prev => ({ ...prev, ...updated }));
      setShowSettings(false);
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-6 h-6 border-2 border-navy border-t-transparent rounded-full" />
    </div>
  );

  const sidebar = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Channels</h2>
          {isOfficer && (
            <button onClick={() => setShowCreate(true)}
              className="w-7 h-7 flex items-center justify-center bg-navy text-white rounded-lg hover:bg-navy/80 transition-colors">
              <Plus size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">{channels.length} channel{channels.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {channels.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No channels yet</p>
        ) : channels.map(ch => (
          <ChannelItem
            key={ch.id}
            channel={ch}
            active={activeChannel?.id === ch.id}
            onClick={() => selectChannel(ch)}
          />
        ))}
      </div>
    </div>
  );

  const chatArea = (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
        <button className="md:hidden p-1" onClick={() => setMobileView('list')}>
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        {activeChannel ? (
          <>
            <div className="w-8 h-8 bg-navy/8 rounded-lg flex items-center justify-center text-base">
              {activeChannel.emoji || <Hash size={16} className="text-navy" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm">#{activeChannel.name}</h3>
              {activeChannel.description && (
                <p className="text-xs text-gray-400 truncate">{activeChannel.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              {activeChannel.allowedRoles !== 'all' ? (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-medium">
                  <Lock size={10} />
                  {ROLE_OPTIONS.find(r => r.value === activeChannel.allowedRoles)?.label || 'Restricted'}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-400 text-xs">
                  <Globe size={11} /> Everyone
                </div>
              )}
              {isAdmin && (
                <button onClick={() => setShowSettings(true)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors ml-1">
                  <Settings size={15} />
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-sm">Select a channel</p>
        )}
      </div>

      {/* PIN Lock Screen */}
      {activeChannel && activeChannel.isLocked && !unlockedChannels.has(activeChannel.id) && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-5">
            <ShieldAlert size={32} className="text-red-500" />
          </div>
          <h3 className="font-bold text-gray-900 text-xl mb-1">Locked Channel</h3>
          <p className="text-sm text-gray-500 mb-1 text-center">This channel requires a PIN to access</p>
          {activeChannel.pinHint && (
            <p className="text-xs text-gray-400 mb-5">Hint: {activeChannel.pinHint}</p>
          )}
          {pinError && (
            <div className="flex items-center gap-2 text-red-600 text-sm mb-3 bg-red-50 px-4 py-2 rounded-xl">
              <X size={14} /> {pinError}
            </div>
          )}
          <div className="relative w-64">
            <input
              type={showPin ? 'text' : 'password'}
              className="input-field w-full text-center text-xl font-mono tracking-widest pr-10"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitPin()}
              autoFocus
            />
            <button type="button" onClick={() => setShowPin(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPin ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={submitPin} disabled={!pinInput}
            className="btn-primary mt-3 w-64 justify-center gap-2">
            <KeyRound size={15} /> Unlock Channel
          </button>
        </div>
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto py-4 ${activeChannel?.isLocked && !unlockedChannels.has(activeChannel?.id) ? 'hidden' : ''}`}>
        {!activeChannel ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Hash size={40} className="mb-3 opacity-20" />
            <p className="text-sm">Select a channel to start chatting</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="text-4xl mb-3">{activeChannel.emoji || '💬'}</div>
            <p className="font-semibold text-gray-600 text-sm">#{activeChannel.name}</p>
            <p className="text-xs mt-1">Be the first to send a message</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.authorId === user?.id}
                canDelete={msg.authorId === user?.id || isAdmin}
                onDelete={deleteMsg}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {activeChannel && (!activeChannel.isLocked || unlockedChannels.has(activeChannel.id)) && (
        <div className="px-4 pb-4">
          <form onSubmit={send} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Message #${activeChannel.name}`}
              className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
              maxLength={4000}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="w-8 h-8 flex items-center justify-center bg-navy text-white rounded-xl disabled:opacity-30 hover:bg-navy/80 transition-colors flex-shrink-0"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Sidebar — hidden on mobile when in chat */}
      <div className={`w-64 flex-shrink-0 border-r border-gray-100 bg-gray-50
        ${mobileView === 'chat' ? 'hidden md:flex md:flex-col' : 'flex flex-col w-full md:w-64'}`}>
        {sidebar}
      </div>

      {/* Chat — hidden on mobile when in list */}
      <div className={`flex-1 flex flex-col
        ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {chatArea}
      </div>

      {/* Create Channel Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Channel">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Emoji</label>
            <div className="flex gap-2 flex-wrap">
              {EMOJI_OPTIONS.map(e => (
                <button key={e}
                  onClick={() => setNewChannel(p => ({ ...p, emoji: e }))}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all
                    ${newChannel.emoji === e ? 'bg-navy text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Channel Name</label>
            <div className="flex items-center gap-2 input-field">
              <Hash size={14} className="text-gray-400 flex-shrink-0" />
              <input
                className="flex-1 bg-transparent outline-none text-sm"
                placeholder="e.g. general, officers, rush-2026"
                value={newChannel.name}
                onChange={e => setNewChannel(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Description (optional)</label>
            <input
              className="input-field w-full text-sm"
              placeholder="What's this channel for?"
              value={newChannel.description}
              onChange={e => setNewChannel(p => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Who can access</label>
            <select className="select-field w-full" value={newChannel.allowedRoles}
              onChange={e => setNewChannel(p => ({ ...p, allowedRoles: e.target.value }))}>
              {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          {/* PIN Lock */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-red-500" />
              <p className="text-sm font-semibold text-gray-800">PIN Lock <span className="text-xs font-normal text-gray-400">(optional)</span></p>
            </div>
            <p className="text-xs text-gray-400">Members must enter a PIN to read this channel — even after login. Perfect for sensitive exec discussions.</p>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                className="input-field w-full text-sm pr-10"
                placeholder="Set a PIN (leave blank for no lock)"
                value={newChannel.pin}
                onChange={e => setNewChannel(p => ({ ...p, pin: e.target.value }))}
              />
              <button type="button" onClick={() => setShowPin(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {newChannel.pin && (
              <input className="input-field w-full text-sm" placeholder="PIN hint (optional, visible to members)"
                value={newChannel.pinHint}
                onChange={e => setNewChannel(p => ({ ...p, pinHint: e.target.value }))} />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={createChannel} disabled={!newChannel.name.trim()} className="btn-primary flex-1">
              {newChannel.pin ? '🔒 Create Locked Channel' : 'Create Channel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Channel Settings Modal */}
      {activeChannel && (
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title={`#${activeChannel.name} Settings`}>
          <ChannelSettings
            channel={activeChannel}
            onUpdate={updateChannel}
            onDelete={() => deleteChannel(activeChannel.id)}
            onClose={() => setShowSettings(false)}
          />
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

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Emoji</label>
        <div className="flex gap-2 flex-wrap">
          {EMOJI_OPTIONS.map(e => (
            <button key={e} onClick={() => setForm(p => ({ ...p, emoji: e }))}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all
                ${form.emoji === e ? 'bg-navy text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Name</label>
        <input className="input-field w-full text-sm" value={form.name}
          onChange={e => setForm(p => ({ ...p, name: e.target.value.toLowerCase().replace(/\s+/g, '-') }))} />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Description</label>
        <input className="input-field w-full text-sm" value={form.description}
          onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Access</label>
        <select className="select-field w-full" value={form.allowedRoles}
          onChange={e => setForm(p => ({ ...p, allowedRoles: e.target.value }))}>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={() => onUpdate(form)} className="btn-primary flex-1">Save</button>
      </div>

      <div className="border-t border-red-100 pt-4">
        <button onClick={onDelete} className="w-full py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
          Delete Channel
        </button>
      </div>
    </div>
  );
}
