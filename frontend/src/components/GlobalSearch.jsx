import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Star, Calendar, X, ArrowRight } from 'lucide-react';
import client from '../api/client';

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

export default function GlobalSearch({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ members: [], pnms: [], events: [] });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const debouncedQuery = useDebounce(query, 280);

  useEffect(() => {
    if (isOpen) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(''); setResults({ members: [], pnms: [], events: [] }); }
  }, [isOpen]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults({ members: [], pnms: [], events: [] }); return; }
    setLoading(true);
    Promise.all([
      client.get(`/members?search=${encodeURIComponent(debouncedQuery)}`).catch(() => ({ data: { data: [] } })),
      client.get(`/pnms?search=${encodeURIComponent(debouncedQuery)}`).catch(() => ({ data: { data: [] } })),
      client.get(`/events?search=${encodeURIComponent(debouncedQuery)}`).catch(() => ({ data: { data: [] } })),
    ]).then(([m, p, e]) => {
      setResults({
        members: (m.data.data || []).slice(0, 4),
        pnms: (p.data.data || []).slice(0, 4),
        events: (e.data.data || []).slice(0, 3),
      });
      setSelected(0);
    }).finally(() => setLoading(false));
  }, [debouncedQuery]);

  const allItems = [
    ...results.members.map(m => ({ type: 'member', label: `${m.firstName} ${m.lastName}`, sub: m.position || m.role, to: '/members', icon: Users, color: 'text-blue-500 bg-blue-50' })),
    ...results.pnms.map(p => ({ type: 'pnm', label: `${p.firstName} ${p.lastName}`, sub: p.major || 'PNM', to: '/recruitment', icon: Star, color: 'text-purple-500 bg-purple-50' })),
    ...results.events.map(e => ({ type: 'event', label: e.title, sub: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), to: '/events', icon: Calendar, color: 'text-gold bg-gold/10' })),
  ];

  const handleSelect = (item) => { navigate(item.to); onClose(); };

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, allItems.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && allItems[selected]) handleSelect(allItems[selected]);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, selected, allItems]);

  if (!isOpen) return null;

  const hasResults = allItems.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy-dark/70 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-xl animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="bg-white rounded-2xl shadow-modal overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search members, PNMs, events…"
              className="flex-1 text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent" />
            {loading && <div className="w-4 h-4 border-2 border-gray-300 border-t-navy rounded-full animate-spin flex-shrink-0" />}
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"><X size={16} /></button>
          </div>

          {/* Results */}
          {query && (
            <div className="max-h-80 overflow-y-auto py-2">
              {!hasResults && !loading && (
                <div className="px-4 py-8 text-center text-gray-400 text-sm">No results for "{query}"</div>
              )}
              {results.members.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Members</p>
                  {results.members.map((m, i) => {
                    const idx = i;
                    return (
                      <button key={m.id} onClick={() => handleSelect({ to: '/members' })}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${selected === idx ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                        <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users size={14} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{m.firstName} {m.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{m.position || m.role}</p>
                        </div>
                        <ArrowRight size={12} className="text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              )}
              {results.pnms.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">PNMs</p>
                  {results.pnms.map((p, i) => {
                    const idx = results.members.length + i;
                    return (
                      <button key={p.id} onClick={() => handleSelect({ to: '/recruitment' })}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${selected === idx ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                        <div className="w-8 h-8 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Star size={14} className="text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-gray-400 truncate">{p.major || 'PNM'} · {p.stage}</p>
                        </div>
                        <ArrowRight size={12} className="text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              )}
              {results.events.length > 0 && (
                <div>
                  <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Events</p>
                  {results.events.map((e, i) => {
                    const idx = results.members.length + results.pnms.length + i;
                    return (
                      <button key={e.id} onClick={() => handleSelect({ to: '/events' })}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${selected === idx ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                        <div className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Calendar size={14} className="text-gold-dark" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{e.title}</p>
                          <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <ArrowRight size={12} className="text-gray-300" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              <p>Type to search members, PNMs, or events</p>
              <p className="text-xs mt-1 text-gray-300">↑↓ navigate · Enter select · Esc close</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
