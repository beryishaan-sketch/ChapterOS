import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const STEPS = [
  { id: 'members', label: 'Add your first member', desc: 'Invite brothers to join your chapter', action: '/members', check: async () => { const r = await client.get('/members'); return (r.data.data?.length || 0) > 1; } },
  { id: 'event', label: 'Create your first event', desc: 'Set up an upcoming event for your chapter', action: '/events', check: async () => { const r = await client.get('/events'); return (r.data.data?.length || 0) > 0; } },
  { id: 'dues', label: 'Set up semester dues', desc: 'Configure dues amounts for your members', action: '/dues', check: async () => { const r = await client.get('/dues'); return (r.data.data?.length || 0) > 0; } },
  { id: 'settings', label: 'Customize chapter profile', desc: 'Add your chapter logo and details', action: '/settings', check: async () => { const r = await client.get('/orgs/current'); return !!(r.data.data?.logoUrl); } },
  { id: 'invite', label: 'Share your invite code', desc: 'Get brothers signed up on ChapterOS', action: '/settings', check: async () => { const r = await client.get('/members'); return (r.data.data?.length || 0) >= 5; } },
];

export default function OnboardingChecklist() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = localStorage.getItem('onboarding_dismissed');
    if (d) { setDismissed(true); return; }
    Promise.all(STEPS.map(s => s.check().then(r => [s.id, r]).catch(() => [s.id, false])))
      .then(results => {
        const map = Object.fromEntries(results);
        setCompleted(map);
      })
      .finally(() => setLoading(false));
  }, []);

  if (dismissed || loading) return null;

  const doneCount = Object.values(completed).filter(Boolean).length;
  const allDone = doneCount === STEPS.length;

  if (allDone) {
    localStorage.setItem('onboarding_dismissed', '1');
    return null;
  }

  const dismiss = () => {
    localStorage.setItem('onboarding_dismissed', '1');
    setDismissed(true);
  };

  const pct = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="card border-navy/20 bg-gradient-to-br from-navy/5 to-white mb-6">
      <div className="flex items-center gap-3 p-5 cursor-pointer" onClick={() => setCollapsed(c => !c)}>
        <div className="w-9 h-9 bg-navy rounded-xl flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-gold" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 text-sm">Get started with ChapterOS</h3>
            <span className="text-xs bg-gold/15 text-gold-dark font-bold px-2 py-0.5 rounded-full">{doneCount}/{STEPS.length} done</span>
          </div>
          <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden w-48">
            <div className="h-full bg-gold rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); dismiss(); }} className="p-1 text-gray-300 hover:text-gray-500 rounded transition-colors">
          <X size={15} />
        </button>
        {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
      </div>

      {!collapsed && (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {STEPS.map(step => {
            const done = completed[step.id];
            return (
              <button key={step.id} onClick={() => navigate(step.action)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50/80 transition-colors text-left">
                {done ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" /> : <Circle size={18} className="text-gray-300 flex-shrink-0" />}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{step.label}</p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
                {!done && <span className="text-xs text-navy font-medium">Go →</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
