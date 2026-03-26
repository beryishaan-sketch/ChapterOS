import React, { useState, useEffect } from 'react';
import { Zap, Users, Building2, DollarSign, TrendingUp, RefreshCw, Trash2, Calendar } from 'lucide-react';
import client from '../api/client';

const SUPER_KEY = 'chapterhq-superadmin-2026';

export default function SuperAdmin() {
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(false);

  const login = () => {
    if (keyInput === SUPER_KEY) { setAuthed(true); load(keyInput); }
    else alert('Wrong key');
  };

  const load = async (key = SUPER_KEY) => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        client.get('/superadmin/stats', { headers: { 'x-super-admin-key': key } }),
        client.get('/superadmin/orgs', { headers: { 'x-super-admin-key': key } }),
      ]);
      setStats(s.data.data);
      setOrgs(o.data.data);
    } catch (e) { alert('Failed: ' + e.message); }
    finally { setLoading(false); }
  };

  const deleteOrg = async (id, name) => {
    if (!window.confirm(`Delete "${name}" and ALL their data? This cannot be undone.`)) return;
    try {
      await client.delete(`/superadmin/orgs/${id}`, { headers: { 'x-super-admin-key': SUPER_KEY } });
      setOrgs(prev => prev.filter(o => o.id !== id));
    } catch (e) { alert('Failed: ' + e.message); }
  };

  if (!authed) return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-navy rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-gold" />
          </div>
          <span className="font-bold text-gray-900">ChapterHQ Super Admin</span>
        </div>
        <input
          type="password"
          className="input-field w-full mb-3"
          placeholder="Admin key"
          value={keyInput}
          onChange={e => setKeyInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <button onClick={login} className="btn-primary w-full">Access Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gold rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-navy" />
          </div>
          <span className="font-bold">ChapterHQ — Super Admin</span>
        </div>
        <button onClick={() => load()} disabled={loading}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {stats && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { icon: Building2, label: 'Total Chapters', value: stats.totalOrgs, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: Users, label: 'Total Members', value: stats.totalMembers, color: 'text-purple-600', bg: 'bg-purple-50' },
                { icon: TrendingUp, label: 'On Trial', value: stats.trialOrgs, color: 'text-amber-600', bg: 'bg-amber-50' },
                { icon: DollarSign, label: 'Est. MRR', value: `$${(stats.mrr || 0).toLocaleString()}`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(({ icon: Icon, label, value, color, bg }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon size={18} className={color} />
                  </div>
                  <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Chapters table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">All Chapters</h2>
                <p className="text-sm text-gray-400">{orgs.length} total</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Chapter</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">School</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Members</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Events</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {orgs.map(org => (
                      <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{org.name}</p>
                          <p className="text-xs text-gray-400">{org.type}</p>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{org.school}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
                            ${org.plan === 'trial' ? 'bg-amber-100 text-amber-700' :
                              org.plan === 'standard' ? 'bg-blue-100 text-blue-700' :
                              'bg-emerald-100 text-emerald-700'}`}>
                            {org.plan}
                          </span>
                          {org.trialEndsAt && org.plan === 'trial' && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Ends {new Date(org.trialEndsAt).toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-600">{org._count?.members || 0}</td>
                        <td className="px-4 py-4 text-gray-600">{org._count?.events || 0}</td>
                        <td className="px-4 py-4 text-gray-400 text-xs">
                          {new Date(org.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4">
                          <button onClick={() => deleteOrg(org.id, org.name)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
