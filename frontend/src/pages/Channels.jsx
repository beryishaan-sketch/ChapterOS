import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Send, Trash2, Settings, Lock, ChevronLeft, Eye, EyeOff, ShieldAlert, KeyRound, Hash, Users } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

/* ─── constants ─── */
const ROLE_OPTIONS = [
  { value: 'all',           label: '🌐 Everyone' },
  { value: 'admin,officer', label: '⭐ Officers & Above' },
  { value: 'admin',         label: '👑 President Only' },
  { value: 'member',        label: '👥 Members Only' },
  { value: 'pledge',        label: '🔰 Pledges Only' },
];
const EMOJI_OPTIONS = ['💬','⭐','📅','🤝','💰','🏆','📢','🎉','🛡️','📋','🔒','⚡','🎯','🗳️','🏠','🎓'];
const AVATAR_BG = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#C9A84C','#0F1C3F'];
const avatarBg  = (s='') => AVATAR_BG[s.split('').reduce((a,c)=>a+c.charCodeAt(0),0)%AVATAR_BG.length];
const initials  = (f='',l='') => `${f[0]||''}${l[0]||''}`.toUpperCase();

function Avatar({ firstName, lastName, size=32 }) {
  return (
    <div style={{ width:size, height:size, background:avatarBg(firstName+lastName), borderRadius:'50%',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'#fff', fontWeight:700, fontSize:size*0.38, flexShrink:0 }}>
      {initials(firstName, lastName)}
    </div>
  );
}

function fmtTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate()-1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return d.toLocaleDateString([],{month:'short',day:'numeric'}) + ' at ' + time;
}

function groupMessages(msgs) {
  const groups = [];
  msgs.forEach(msg => {
    const last = groups[groups.length-1];
    const sameAuthor = last && last.authorId === msg.authorId;
    const within5min = last && (new Date(msg.createdAt)-new Date(last.messages[last.messages.length-1].createdAt)) < 5*60000;
    if (sameAuthor && within5min) last.messages.push(msg);
    else groups.push({ authorId:msg.authorId, author:msg.author, messages:[msg] });
  });
  return groups;
}

/* ─── message group (Discord-style) ─── */
function MessageGroup({ group, isOwn, canDelete, onDelete }) {
  const { author, messages } = group;
  const [hovering, setHovering] = useState(null);
  return (
    <div className="flex gap-3 px-4 py-1 hover:bg-gray-50/60 group"
      onMouseLeave={()=>setHovering(null)}>
      <div className="mt-0.5 flex-shrink-0">
        <Avatar firstName={author?.firstName} lastName={author?.lastName} size={36} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[13px] font-bold text-gray-900">
            {author?.firstName} {author?.lastName}
            {isOwn && <span className="ml-1 text-[10px] font-medium text-navy/50">(you)</span>}
          </span>
          {author?.position && (
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
              {author.position}
            </span>
          )}
          <span className="text-[11px] text-gray-400">{fmtTime(messages[0].createdAt)}</span>
        </div>
        {messages.map((msg,i) => (
          <div key={msg.id} className="relative group/msg"
            onMouseEnter={()=>setHovering(msg.id)}>
            <p className="text-[14px] text-gray-800 leading-relaxed break-words">{msg.content}</p>
            {hovering===msg.id && canDelete && (
              <button onClick={()=>onDelete(msg.id)}
                className="absolute -top-1 right-0 w-6 h-6 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg flex items-center justify-center transition-colors opacity-0 group-hover/msg:opacity-100">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── date divider ─── */
function DateDivider({ date }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-semibold text-gray-400 bg-white px-2">{date}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

/* ─── channel settings ─── */
function ChannelSettings({ channel, onUpdate, onDelete, onClose }) {
  const [form, setForm] = useState({ name:channel.name, description:channel.description||'', emoji:channel.emoji||'💬', allowedRoles:channel.allowedRoles||'all' });
  const [pinMode, setPinMode] = useState('idle');
  const [newPin, setNewPin] = useState('');
  const [pinHint, setPinHint] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const savePin = async () => {
    if (newPin.length < 4) { setErr('PIN must be at least 4 digits'); return; }
    setSaving(true);
    try { await onUpdate({ pin:newPin, pinHint }); setPinMode('idle'); setNewPin(''); setErr(''); }
    catch { setErr('Failed to save'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="label">Icon</p>
        <div className="flex flex-wrap gap-2">
          {EMOJI_OPTIONS.map(e=>(
            <button key={e} onClick={()=>setForm(p=>({...p,emoji:e}))}
              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.emoji===e?'bg-navy text-white scale-110':'bg-gray-100 hover:bg-gray-200'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="label">Name</p>
        <input className="input-field w-full" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} />
      </div>
      <div>
        <p className="label">Description</p>
        <input className="input-field w-full text-sm" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="What's this channel for?" />
      </div>
      <div>
        <p className="label">Who can access</p>
        <select className="select-field w-full" value={form.allowedRoles} onChange={e=>setForm(p=>({...p,allowedRoles:e.target.value}))}>
          {ROLE_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>

      {/* Passcode */}
      <div className="border border-gray-100 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={13} className={channel.isLocked?'text-red-500':'text-gray-300'} />
            <span className="text-sm font-semibold text-gray-800">Passcode Lock</span>
            {channel.isLocked && <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold">Active</span>}
          </div>
          {pinMode==='idle' && (
            <button className="text-xs font-semibold text-navy hover:underline" onClick={()=>setPinMode(channel.isLocked?'remove':'set')}>
              {channel.isLocked?'Change / Remove':'Set Passcode'}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">{channel.isLocked?`Members enter a passcode to read messages.${channel.pinHint?` Hint: "${channel.pinHint}"`:''}`:'Require a passcode to access this channel.'}</p>
        {pinMode==='set' && (
          <div className="space-y-2 pt-1">
            <input type="password" className="input-field w-full font-mono tracking-widest" placeholder="New passcode (min 4)" value={newPin} onChange={e=>setNewPin(e.target.value)} autoFocus />
            <input className="input-field w-full text-sm" placeholder="Hint shown to members (optional)" value={pinHint} onChange={e=>setPinHint(e.target.value)} />
            {err && <p className="text-xs text-red-500">{err}</p>}
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-sm" onClick={()=>{setPinMode('idle');setNewPin('');setErr('');}}>Cancel</button>
              <button className="btn-primary flex-1 text-sm" onClick={savePin} disabled={saving||newPin.length<4}>🔒 Set Passcode</button>
            </div>
          </div>
        )}
        {pinMode==='remove' && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">This removes the passcode and opens the channel to anyone with role access.</p>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1 text-sm" onClick={()=>setPinMode('idle')}>Cancel</button>
              <button className="flex-1 text-sm py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors" onClick={async()=>{setSaving(true);await onUpdate({removePin:true});setPinMode('idle');setSaving(false);}} disabled={saving}>Remove</button>
            </div>
            <button className="w-full text-xs text-navy font-semibold hover:underline text-center" onClick={()=>setPinMode('set')}>Change passcode instead →</button>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
        <button className="btn-primary flex-1" onClick={()=>onUpdate(form)}>Save Changes</button>
      </div>
      <div className="pt-1 border-t border-gray-100">
        <button className="w-full py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors" onClick={onDelete}>
          Delete Channel
        </button>
      </div>
    </div>
  );
}

/* ─── main component ─── */
export default function Channels() {
  const { user } = useAuth();
  const [channels, setChannels] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [newCh, setNewCh] = useState({ name:'', description:'', emoji:'💬', allowedRoles:'all', pin:'', pinHint:'' });
  const [unlocked, setUnlocked] = useState(()=>{ try{return new Set(JSON.parse(localStorage.getItem('unlockedChannels')||'[]'))}catch{return new Set()} });
  const [pinEntry, setPinEntry] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinErr, setPinErr] = useState('');
  const [showPinText, setShowPinText] = useState(false);
  const bottomRef = useRef(null);
  const pollRef = useRef(null);
  const lastIdRef = useRef(null);
  const inputRef = useRef(null);

  const isAdmin   = user?.role === 'admin';
  const isOfficer = user?.role === 'admin' || user?.role === 'officer';

  /* fetch */
  const fetchChannels = useCallback(async () => {
    const res = await client.get('/channels');
    const list = res.data.data || [];
    setChannels(list);
    if (!active && list.length>0) setActive(list[0]);
  }, [active]);

  const fetchMessages = useCallback(async (id) => {
    const res = await client.get(`/channels/${id}/messages?limit=80`);
    const msgs = res.data.data || [];
    setMessages(msgs);
    if (msgs.length) lastIdRef.current = msgs[msgs.length-1].id;
  }, []);

  useEffect(()=>{ fetchChannels().finally(()=>setLoading(false)); },[]);

  useEffect(()=>{
    if (!active) return;
    fetchMessages(active.id);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async()=>{
      try {
        const res = await client.get(`/channels/${active.id}/messages?limit=20`);
        const msgs = res.data.data||[];
        if (msgs.length && msgs[msgs.length-1].id !== lastIdRef.current) {
          setMessages(msgs);
          lastIdRef.current = msgs[msgs.length-1].id;
        }
      } catch {}
    }, 3000);
    return ()=>clearInterval(pollRef.current);
  }, [active?.id]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages]);

  /* actions */
  const selectChannel = (ch) => {
    if (ch.isLocked && !unlocked.has(ch.id)) { setPinEntry(ch); setPinInput(''); setPinErr(''); }
    else { setActive(ch); setMobileView('chat'); }
  };

  const submitPin = async () => {
    if (!pinInput) return;
    try {
      await client.post(`/channels/${pinEntry.id}/verify-pin`, { pin: pinInput });
      setUnlocked(prev=>{ const n=new Set([...prev,pinEntry.id]); localStorage.setItem('unlockedChannels',JSON.stringify([...n])); return n; });
      setActive(pinEntry); setMobileView('chat'); setPinEntry(null); setPinInput('');
    } catch { setPinErr('Wrong passcode — try again'); setPinInput(''); }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim()||!active||sending) return;
    setSending(true);
    const text = input.trim(); setInput('');
    try {
      const res = await client.post(`/channels/${active.id}/messages`, { content:text });
      setMessages(p=>[...p, res.data.data]);
      lastIdRef.current = res.data.data.id;
    } catch { setInput(text); }
    setSending(false);
  };

  const deleteMsg = async (msgId) => {
    await client.delete(`/channels/${active.id}/messages/${msgId}`);
    setMessages(p=>p.filter(m=>m.id!==msgId));
  };

  const createChannel = async () => {
    if (!newCh.name.trim()) return;
    try {
      const payload = {...newCh};
      if (!payload.pin) { delete payload.pin; delete payload.pinHint; }
      const res = await client.post('/channels', payload);
      const created = res.data.data;
      setChannels(p=>[...p, created]);
      if (created.isLocked) setUnlocked(p=>new Set([...p, created.id]));
      setActive(created); setMobileView('chat');
      setShowCreate(false);
      setNewCh({ name:'', description:'', emoji:'💬', allowedRoles:'all', pin:'', pinHint:'' });
    } catch {}
  };

  const updateChannel = async (updates) => {
    try {
      const res = await client.put(`/channels/${active.id}`, updates);
      if (!res.data.success) throw new Error(res.data.error);
      const updated = res.data.data;
      setChannels(p=>p.map(c=>c.id===updated.id?{...c,...updated}:c));
      setActive(updated); setShowSettings(false);
    } catch (e) { alert(e.response?.data?.error||e.message||'Failed to update'); }
  };

  const deleteChannel = async () => {
    if (!window.confirm('Delete this channel?')) return;
    await client.delete(`/channels/${active.id}`);
    const rest = channels.filter(c=>c.id!==active.id);
    setChannels(rest); setActive(rest[0]||null); setShowSettings(false);
  };

  /* ─── grouped messages with date dividers ─── */
  const renderMessages = () => {
    const groups = groupMessages(messages);
    const elements = [];
    let lastDate = null;
    groups.forEach((group,i) => {
      const d = new Date(group.messages[0].createdAt);
      const dateStr = d.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
      if (dateStr !== lastDate) {
        elements.push(<DateDivider key={`d-${i}`} date={dateStr} />);
        lastDate = dateStr;
      }
      elements.push(
        <MessageGroup key={i} group={group}
          isOwn={group.authorId===user?.id}
          canDelete={group.messages.some(m=>m.authorId===user?.id||isAdmin)}
          onDelete={deleteMsg} />
      );
    });
    return elements;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-navy border-t-transparent rounded-full" /></div>;

  /* ─── sidebar ─── */
  const sidebar = (
    <div className="flex flex-col h-full" style={{background:'linear-gradient(160deg,#0f1c3f 0%,#0b1530 100%)'}}>
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white font-extrabold text-[15px] tracking-tight">Channels</span>
          {isOfficer && (
            <button onClick={()=>setShowCreate(true)}
              className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all">
              <Plus size={14} className="text-white" />
            </button>
          )}
        </div>
        <p className="text-white/30 text-[11px]">{channels.length} channels</p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {channels.map(ch=>{
          const isActive = active?.id===ch.id;
          const lastMsg = ch.messages?.[0];
          return (
            <button key={ch.id} onClick={()=>selectChannel(ch)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all group ${isActive?'bg-white/12':'hover:bg-white/6'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all ${isActive?'bg-white/18':'bg-white/6 group-hover:bg-white/10'}`}>
                {ch.emoji||'💬'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[13px] font-semibold truncate ${isActive?'text-white':'text-white/65 group-hover:text-white/85'}`}>{ch.name}</span>
                  {ch.isLocked && <Lock size={9} className="text-white/30 flex-shrink-0" />}
                  {ch.allowedRoles!=='all' && <span className="text-[9px] bg-white/10 text-white/40 px-1 rounded font-medium">restricted</span>}
                </div>
                <p className={`text-[11px] truncate mt-0.5 ${isActive?'text-white/45':'text-white/25'}`}>
                  {lastMsg ? `${lastMsg.author?.firstName}: ${lastMsg.content}` : ch.description||'No messages yet'}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  /* ─── chat area ─── */
  const isLocked = active?.isLocked && !unlocked.has(active?.id);

  const chatArea = (
    <div className="flex-1 flex flex-col min-w-0 bg-white h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white flex-shrink-0" style={{boxShadow:'0 1px 0 rgba(0,0,0,0.06)'}}>
        <button className="md:hidden p-1.5 -ml-1 hover:bg-gray-100 rounded-lg" onClick={()=>setMobileView('list')}>
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        {active ? (
          <>
            <div className="w-9 h-9 rounded-xl bg-navy/7 flex items-center justify-center text-xl flex-shrink-0">{active.emoji||'💬'}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-gray-900 text-[15px]">{active.name}</h3>
                {active.isLocked && <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full font-semibold"><Lock size={8}/>PIN</span>}
                {active.allowedRoles!=='all' && <span className="hidden sm:flex text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold">Restricted</span>}
              </div>
              {active.description && <p className="text-xs text-gray-400 truncate">{active.description}</p>}
            </div>
            {isOfficer && (
              <button onClick={()=>setShowSettings(true)} className="w-8 h-8 hover:bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                <Settings size={15}/>
              </button>
            )}
          </>
        ) : <p className="text-gray-400 text-sm font-medium">Select a channel</p>}
      </div>

      {/* PIN lock screen */}
      {isLocked && (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 w-full max-w-xs text-center">
            <div className="w-14 h-14 bg-navy/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert size={26} className="text-navy" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">Passcode Required</h3>
            <p className="text-sm text-gray-400 mb-5">{active?.pinHint?`Hint: ${active.pinHint}`:'Enter the passcode to access this channel'}</p>
            {pinErr && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{pinErr}</p>}
            <div className="relative mb-3">
              <input type={showPinText?'text':'password'} className="input-field w-full text-center text-xl font-mono tracking-[0.3em] pr-10"
                placeholder="••••" value={pinInput} onChange={e=>setPinInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&submitPin()} autoFocus />
              <button type="button" onClick={()=>setShowPinText(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPinText?<EyeOff size={14}/>:<Eye size={14}/>}
              </button>
            </div>
            <button onClick={submitPin} disabled={!pinInput} className="btn-primary w-full justify-center gap-2">
              <KeyRound size={14}/> Unlock
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      {!isLocked && (
        <>
          <div className="flex-1 overflow-y-auto py-4">
            {!active ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-16 h-16 bg-navy/6 rounded-3xl flex items-center justify-center mb-4 text-3xl">💬</div>
                <p className="font-extrabold text-gray-800 text-lg">Welcome to Channels</p>
                <p className="text-sm text-gray-400 mt-1 max-w-xs">Select a channel from the left to start messaging your chapter.</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <div className="w-16 h-16 bg-navy/6 rounded-3xl flex items-center justify-center mb-4 text-3xl">{active.emoji}</div>
                <p className="font-extrabold text-gray-800 text-lg">{active.name}</p>
                <p className="text-sm text-gray-400 mt-1">No messages yet — be the first to say something 👋</p>
              </div>
            ) : (
              <div>
                {renderMessages()}
                <div ref={bottomRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Input */}
          {active && (
            <div className="px-4 pb-5 pt-2 border-t border-gray-100 bg-white flex-shrink-0"
              style={{paddingBottom:'max(20px,env(safe-area-inset-bottom))'}}>
              <form onSubmit={send}
                className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 focus-within:border-navy/30 focus-within:bg-white focus-within:shadow-sm transition-all">
                <Avatar firstName={user?.firstName||''} lastName={user?.lastName||''} size={28} />
                <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(e);} }}
                  placeholder={`Message ${active.name}…`}
                  className="flex-1 bg-transparent text-sm outline-none text-gray-900 placeholder-gray-400"
                  maxLength={4000} disabled={sending} />
                <button type="submit" disabled={!input.trim()||sending}
                  className="w-8 h-8 flex items-center justify-center bg-navy text-white rounded-xl disabled:opacity-20 hover:bg-navy/85 transition-all active:scale-95 flex-shrink-0">
                  <Send size={13}/>
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-4rem)] md:h-[calc(100dvh-0px)] -m-4 md:-m-6 overflow-hidden rounded-2xl shadow-sm border border-gray-100">
      {/* Sidebar */}
      <div className={`w-64 flex-shrink-0 border-r border-white/8 ${mobileView==='chat'?'hidden md:flex':'flex'} flex-col`}>
        {sidebar}
      </div>

      {/* Chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView==='list'?'hidden md:flex':'flex'}`}>
        {chatArea}
      </div>

      {/* Modals */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="New Channel">
        <div className="space-y-4">
          <div>
            <p className="label">Icon</p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e=>(
                <button key={e} onClick={()=>setNewCh(p=>({...p,emoji:e}))}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${newCh.emoji===e?'bg-navy text-white':'bg-gray-100 hover:bg-gray-200'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label">Name</p>
            <input className="input-field w-full" placeholder="Officers, General, Rush 2026…"
              value={newCh.name} onChange={e=>setNewCh(p=>({...p,name:e.target.value}))} autoFocus />
          </div>
          <div>
            <p className="label">Description <span className="text-gray-400 font-normal text-xs">— optional</span></p>
            <input className="input-field w-full text-sm" placeholder="What's this channel for?"
              value={newCh.description} onChange={e=>setNewCh(p=>({...p,description:e.target.value}))} />
          </div>
          <div>
            <p className="label">Who can access</p>
            <select className="select-field w-full" value={newCh.allowedRoles} onChange={e=>setNewCh(p=>({...p,allowedRoles:e.target.value}))}>
              {ROLE_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <p className="label">Passcode <span className="text-gray-400 font-normal text-xs">— optional, locks the channel</span></p>
            <input type="password" className="input-field w-full font-mono" placeholder="Leave blank for open access"
              value={newCh.pin} onChange={e=>setNewCh(p=>({...p,pin:e.target.value}))} />
          </div>
          <div className="flex gap-2 pt-1">
            <button className="btn-secondary flex-1" onClick={()=>setShowCreate(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={createChannel} disabled={!newCh.name.trim()}>
              {newCh.pin?'🔒 Create Locked':'Create Channel'}
            </button>
          </div>
        </div>
      </Modal>

      {/* PIN entry modal */}
      {pinEntry && (
        <Modal isOpen={!!pinEntry} onClose={()=>setPinEntry(null)} title="">
          <div className="text-center py-4">
            <div className="w-14 h-14 bg-navy/8 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">{pinEntry.emoji||'🔒'}</div>
            <h3 className="font-extrabold text-gray-900 text-lg mb-1">{pinEntry.name}</h3>
            <p className="text-sm text-gray-400 mb-5">{pinEntry.pinHint?`Hint: ${pinEntry.pinHint}`:'Enter passcode to unlock'}</p>
            {pinErr && <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-3">{pinErr}</p>}
            <input type="password" className="input-field w-full text-center text-xl font-mono tracking-widest mb-3"
              placeholder="••••" value={pinInput} onChange={e=>setPinInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&submitPin()} autoFocus />
            <button onClick={submitPin} disabled={!pinInput} className="btn-primary w-full justify-center"><KeyRound size={14}/> Unlock</button>
          </div>
        </Modal>
      )}

      {active && (
        <Modal isOpen={showSettings} onClose={()=>setShowSettings(false)} title={`${active.emoji} ${active.name}`}>
          <ChannelSettings channel={active} onUpdate={updateChannel} onDelete={deleteChannel} onClose={()=>setShowSettings(false)} />
        </Modal>
      )}
    </div>
  );
}
