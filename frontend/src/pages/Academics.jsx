import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, AlertTriangle, TrendingUp, Clock, Search, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const GPA_COLORS = { high: 'text-emerald-600', mid: 'text-gold-dark', low: 'text-red-500' };
const gpaColor = (gpa) => !gpa ? 'text-gray-300' : gpa >= 3.0 ? GPA_COLORS.high : gpa >= 2.5 ? GPA_COLORS.mid : GPA_COLORS.low;
const gpaBg = (gpa) => !gpa ? 'bg-gray-100' : gpa >= 3.0 ? 'bg-emerald-50' : gpa >= 2.5 ? 'bg-gold/10' : 'bg-red-50';

const avatarColors = ['bg-blue-500','bg-purple-500','bg-emerald-500','bg-orange-500','bg-rose-500','bg-cyan-500','bg-amber-500'];
const avatarColor = (name) => avatarColors[(name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%avatarColors.length];

export default function Academics() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filter, setFilter] = useState('all'); // all | probation | honors | missing
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ gpa: '', studyHours: '', onProbation: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await client.get('/members');
      if (res.data.success) setMembers(res.data.data || []);
    } catch {}
    finally { setLoading(false); }
  };

  const startEdit = (m) => {
    setEditing(m.id);
    setEditForm({ gpa: m.gpa ?? '', studyHours: m.studyHours ?? 0, onProbation: m.onProbation ?? false });
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const payload = {
        gpa: editForm.gpa !== '' ? parseFloat(editForm.gpa) : null,
        studyHours: parseInt(editForm.studyHours) || 0,
        onProbation: editForm.onProbation,
      };
      const res = await client.patch(`/members/${id}`, payload);
      if (res.data.success) {
        setMembers(ms => ms.map(m => m.id === id ? { ...m, ...payload } : m));
        setEditing(null);
      }
    } catch {}
    finally { setSaving(false); }
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ChevronUp size={12} className="text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp size={12} className="text-navy" /> : <ChevronDown size={12} className="text-navy" />;
  };

  const filtered = members
    .filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || (m.major || '').toLowerCase().includes(q);
      const matchFilter = filter === 'all' ? true
        : filter === 'probation' ? m.onProbation
        : filter === 'honors' ? (m.gpa >= 3.5)
        : filter === 'missing' ? !m.gpa
        : true;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      let va, vb;
      if (sortBy === 'name') { va = `${a.firstName} ${a.lastName}`; vb = `${b.firstName} ${b.lastName}`; }
      else if (sortBy === 'gpa') { va = a.gpa ?? -1; vb = b.gpa ?? -1; }
      else if (sortBy === 'hours') { va = a.studyHours ?? 0; vb = b.studyHours ?? 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const withGpa = members.filter(m => m.gpa != null);
  const avgGpa = withGpa.length ? (withGpa.reduce((s, m) => s + m.gpa, 0) / withGpa.length).toFixed(2) : '—';
  const onProbationCount = members.filter(m => m.onProbation).length;
  const honorsCount = members.filter(m => m.gpa >= 3.5).length;
  const belowReqCount = members.filter(m => m.gpa != null && m.gpa < 2.5).length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Academic Tracking</h1>
          <p className="page-subtitle">Monitor GPA, study hours, and academic standing</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-navy/8 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-navy" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgGpa}</p>
          <p className="text-sm text-gray-500">Chapter Avg GPA</p>
        </div>
        <div className="card p-5">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-1">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{onProbationCount}</p>
          <p className="text-sm text-gray-500">On Probation</p>
        </div>
        <div className="card p-5">
          <div className="w-9 h-9 bg-gold/10 rounded-xl flex items-center justify-center mb-1">
            <GraduationCap size={16} className="text-gold-dark" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{honorsCount}</p>
          <p className="text-sm text-gray-500">Dean's List (3.5+)</p>
        </div>
        <div className="card p-5">
          <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center mb-1">
            <BookOpen size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{belowReqCount}</p>
          <p className="text-sm text-gray-500">Below 2.5 GPA</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search members…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {[['all','All'],['probation','Probation'],['honors','Honors'],['missing','No GPA']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${filter === val ? 'bg-navy text-white border-navy' : 'bg-white text-gray-600 border-gray-200 hover:border-navy/30'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <button onClick={() => toggleSort('name')} className="flex items-center gap-1">Name <SortIcon col="name" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Major</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <button onClick={() => toggleSort('gpa')} className="flex items-center gap-1">GPA <SortIcon col="gpa" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <button onClick={() => toggleSort('hours')} className="flex items-center gap-1 whitespace-nowrap">Study Hrs <SortIcon col="hours" /></button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Standing</th>
                {isAdmin && <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(5).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="skeleton h-4 rounded w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <GraduationCap size={32} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No members found</p>
                  </td>
                </tr>
              ) : filtered.map(m => (
                <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${avatarColor(`${m.firstName}${m.lastName}`)} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {(m.firstName||'?')[0]}{(m.lastName||'?')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{m.firstName} {m.lastName}</p>
                        <p className="text-xs text-gray-400 capitalize">{m.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-gray-600">{m.major || <span className="text-gray-300">—</span>}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    {editing === m.id ? (
                      <input type="number" step="0.01" min="0" max="4" className="input-field w-20 py-1 text-sm"
                        value={editForm.gpa} onChange={e => setEditForm(f => ({ ...f, gpa: e.target.value }))} />
                    ) : (
                      <span className={`text-sm font-bold ${gpaColor(m.gpa)}`}>
                        {m.gpa != null ? m.gpa.toFixed(2) : <span className="text-gray-300 font-normal">—</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editing === m.id ? (
                      <input type="number" min="0" className="input-field w-20 py-1 text-sm"
                        value={editForm.studyHours} onChange={e => setEditForm(f => ({ ...f, studyHours: e.target.value }))} />
                    ) : (
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />{m.studyHours || 0}h
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {editing === m.id ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={editForm.onProbation}
                          onChange={e => setEditForm(f => ({ ...f, onProbation: e.target.checked }))}
                          className="rounded border-gray-300 text-red-500" />
                        <span className="text-xs text-gray-600">Probation</span>
                      </label>
                    ) : (
                      m.onProbation ? (
                        <span className="badge-red text-xs">Probation</span>
                      ) : m.gpa >= 3.5 ? (
                        <span className="badge-gold text-xs">Honors</span>
                      ) : m.gpa >= 3.0 ? (
                        <span className="badge-green text-xs">Good Standing</span>
                      ) : m.gpa >= 2.5 ? (
                        <span className="badge-gray text-xs">Satisfactory</span>
                      ) : m.gpa != null ? (
                        <span className="badge-red text-xs">At Risk</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-3.5 text-right">
                      {editing === m.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => saveEdit(m.id)} disabled={saving}
                            className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center text-white transition-colors">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setEditing(null)}
                            className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 transition-colors">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(m)}
                          className="text-xs text-navy hover:text-gold font-semibold transition-colors">
                          Edit
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GPA Distribution */}
      {!loading && withGpa.length > 0 && (
        <div className="card p-6 mt-6">
          <h2 className="section-title mb-4">GPA Distribution</h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '3.5 – 4.0', sublabel: "Dean's List", count: members.filter(m => m.gpa >= 3.5).length, color: 'bg-emerald-500' },
              { label: '3.0 – 3.49', sublabel: 'Good Standing', count: members.filter(m => m.gpa >= 3.0 && m.gpa < 3.5).length, color: 'bg-blue-400' },
              { label: '2.5 – 2.99', sublabel: 'Satisfactory', count: members.filter(m => m.gpa >= 2.5 && m.gpa < 3.0).length, color: 'bg-gold' },
              { label: 'Below 2.5', sublabel: 'At Risk', count: members.filter(m => m.gpa != null && m.gpa < 2.5).length, color: 'bg-red-400' },
            ].map(({ label, sublabel, count, color }) => (
              <div key={label} className="text-center">
                <div className="relative h-24 flex items-end justify-center mb-2">
                  <div className={`${color} rounded-t-lg w-12 transition-all`}
                    style={{ height: `${withGpa.length > 0 ? Math.max(8, (count / withGpa.length) * 96) : 8}px` }} />
                </div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs font-semibold text-gray-600">{label}</p>
                <p className="text-xs text-gray-400">{sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
