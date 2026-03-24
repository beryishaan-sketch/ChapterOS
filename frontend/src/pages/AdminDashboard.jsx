import React, { useState, useEffect } from 'react';
import { Building2, Users, TrendingUp, AlertCircle, Database, RefreshCw, Shield, Clock, Server, CheckCircle2, Download, Loader, Eye, EyeOff } from 'lucide-react';

const BASE = '/api/admin';

function useAdmin(secret) {
  const headers = { 'x-admin-secret': secret, 'Content-Type': 'application/json' };

  const get = (path) => fetch(BASE + path, { headers }).then(r => r.json());
  const post = (path) => fetch(BASE + path, { method: 'POST', headers }).then(r => r.json());

  return { get, post };
}

const StatBox = ({ icon: Icon, label, value, sub, color = 'bg-navy' }) => (
  <div className="card p-5">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
      <Icon size={18} className="text-white" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

const StatusBadge = ({ ok }) => (
  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
    {ok ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
    {ok ? 'Healthy' : 'Issue'}
  </span>
);

export default function AdminDashboard() {
  const [secret, setSecret] = useState(() => localStorage.getItem('admin_secret') || '');
  const [secretInput, setSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [health, setHealth] = useState(null);
  const [errors, setErrors] = useState([]);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState('');

  const api = useAdmin(secret);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, o, h, e, b] = await Promise.all([
        api.get('/stats'), api.get('/orgs'), api.get('/health'),
        api.get('/errors'), api.get('/backups'),
      ]);
      if (!s.success) { setError('Invalid admin secret'); setAuthed(false); return; }
      setStats(s.data); setOrgs(o.data || []); setHealth(h.data);
      setErrors(e.data || []); setBackups(b.data || []);
      setAuthed(true);
    } catch {
      setError('Could not connect to API');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    localStorage.setItem('admin_secret', secretInput);
    setSecret(secretInput);
  };

  useEffect(() => { if (secret) load(); }, [secret]);

  const triggerBackup = async () => {
    setBackingUp(true);
    const result = await api.post('/backup');
    if (result.success) await load();
    setBackingUp(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
        <div className="card p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={20} className="text-navy" />
            <h1 className="text-xl font-bold text-gray-900">Admin Access</h1>
          </div>
          {error && <p className="text-sm text-red-600 mb-3 bg-red-50 p-2 rounded-lg">{error}</p>}
          <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Admin Secret</label>
          <div className="relative mb-4">
            <input
              type={showSecret ? 'text' : 'password'}
              className="input-field pr-10"
              placeholder="Enter ADMIN_SECRET"
              value={secretInput}
              onChange={e => setSecretInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <button onClick={() => setShowSecret(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <button onClick={handleLogin} className="btn-primary w-full">Access Dashboard</button>
          <p className="text-xs text-gray-400 mt-3 text-center">Set ADMIN_SECRET in backend .env</p>
        </div>
      </div>
    );
  }

  const TABS = ['overview', 'chapters', 'errors', 'backups'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="gradient-navy px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">ChapterHQ Admin</h1>
            <p className="text-white/50 text-xs mt-0.5">Internal dashboard — keep this private</p>
          </div>
          <div className="flex items-center gap-3">
            {health && <StatusBadge ok={health.status === 'healthy'} />}
            <button onClick={load} disabled={loading} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit mb-6">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === t ? 'bg-navy text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox icon={Building2} label="Total Chapters" value={stats.orgs.total} sub={`${stats.orgs.newThisWeek} this week`} color="bg-navy" />
              <StatBox icon={Users} label="Total Members" value={stats.members.total} color="bg-blue-500" />
              <StatBox icon={TrendingUp} label="Paid Chapters" value={stats.orgs.paid} sub={`${stats.orgs.trial} on trial`} color="bg-emerald-500" />
              <StatBox icon={TrendingUp} label="New This Month" value={stats.orgs.newThisMonth} color="bg-purple-500" />
            </div>

            {health && (
              <div className="card p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Server size={17} className="text-gray-400" /> System Health
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Uptime', value: health.uptimeHuman },
                    { label: 'DB Latency', value: `${health.db?.latencyMs}ms` },
                    { label: 'Heap Used', value: `${health.memory?.heapUsedMB}MB` },
                    { label: 'RSS Memory', value: `${health.memory?.rssMB}MB` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chapters */}
        {tab === 'chapters' && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">All Chapters ({orgs.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Chapter', 'School', 'Plan', 'Members', 'Events', 'Joined'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orgs.map(org => (
                    <tr key={org.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-sm text-gray-900">{org.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{org.type}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{org.school}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${org.plan === 'trial' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{org._count?.members ?? 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{org._count?.events ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(org.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Errors */}
        {tab === 'errors' && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Recent Errors ({errors.length})</h2>
            </div>
            {errors.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No errors logged 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {errors.map((e, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-red-700 truncate">{e.message}</p>
                        {e.path && <p className="text-xs text-gray-400 mt-0.5">{e.method} {e.path}</p>}
                        {e.stack && <pre className="text-xs text-gray-400 mt-2 overflow-x-auto whitespace-pre-wrap max-h-24">{e.stack.split('\n').slice(0,4).join('\n')}</pre>}
                      </div>
                      <p className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {e.timestamp ? new Date(e.timestamp).toLocaleTimeString() : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Backups */}
        {tab === 'backups' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Database Backups</h2>
                <p className="text-sm text-gray-400 mt-0.5">Automatic daily at 3 AM ET · 7 backups retained</p>
              </div>
              <button onClick={triggerBackup} disabled={backingUp}
                className="btn-primary flex items-center gap-2 text-sm">
                {backingUp ? <><Loader size={14} className="animate-spin" /> Backing up…</> : <><Database size={14} /> Backup Now</>}
              </button>
            </div>
            <div className="card overflow-hidden">
              {backups.length === 0 ? (
                <div className="py-12 text-center">
                  <Database size={28} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No backups yet — click "Backup Now" to create one</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {backups.map((b, i) => (
                    <div key={i} className="flex items-center gap-4 px-6 py-4">
                      <Database size={16} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{b.filename}</p>
                        <p className="text-xs text-gray-400">{new Date(b.created).toLocaleString()}</p>
                      </div>
                      <span className="text-xs text-gray-400">{(b.size / 1024).toFixed(1)} KB</span>
                      {i === 0 && <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">Latest</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
