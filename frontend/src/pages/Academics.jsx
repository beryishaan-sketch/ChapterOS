import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, AlertTriangle, TrendingUp, Clock, Search, ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E', sidebar: '#0A0F1C',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const AVATAR_PALETTE = ['#4F8EF7', '#A78BFA', '#34D399', '#FB923C', '#F87171', '#22D3EE', '#F0B429'];
const avatarColor = (name) => AVATAR_PALETTE[(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_PALETTE.length];

const gpaColor = (gpa) => !gpa ? T.text3 : gpa >= 3.0 ? T.success : gpa >= 2.5 ? T.warning : T.danger;

const cardStyle = {
  background: T.card,
  border: '1px solid ' + T.border,
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: T.text1,
  padding: '10px 14px',
  outline: 'none',
  width: '100%',
  fontSize: 14,
  boxSizing: 'border-box',
};

const badgeBase = { borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 600 };
const badges = {
  red: { ...badgeBase, background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1px solid rgba(248,113,113,0.25)' },
  green: { ...badgeBase, background: 'rgba(52,211,153,0.15)', color: '#34D399', border: '1px solid rgba(52,211,153,0.25)' },
  blue: { ...badgeBase, background: 'rgba(79,142,247,0.15)', color: '#4F8EF7', border: '1px solid rgba(79,142,247,0.25)' },
  gold: { ...badgeBase, background: 'rgba(240,180,41,0.15)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.25)' },
  gray: { ...badgeBase, background: 'rgba(255,255,255,0.07)', color: T.text2, border: '1px solid rgba(255,255,255,0.12)' },
};

const distBarColors = [T.success, T.accent, T.gold, T.danger];

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
    const active = sortBy === col;
    const color = active ? T.accent : T.text3;
    return sortDir === 'asc' || !active
      ? <ChevronUp size={12} style={{ color }} />
      : <ChevronDown size={12} style={{ color }} />;
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

  const statCards = [
    { icon: <TrendingUp size={16} color={T.accent} />, iconBg: 'rgba(79,142,247,0.12)', value: avgGpa, label: 'Chapter Avg GPA' },
    { icon: <AlertTriangle size={16} color={T.danger} />, iconBg: 'rgba(248,113,113,0.12)', value: onProbationCount, label: 'On Probation' },
    { icon: <GraduationCap size={16} color={T.gold} />, iconBg: 'rgba(240,180,41,0.12)', value: honorsCount, label: "Dean's List (3.5+)" },
    { icon: <BookOpen size={16} color={T.warning} />, iconBg: 'rgba(251,191,36,0.12)', value: belowReqCount, label: 'Below 2.5 GPA' },
  ];

  const filterOptions = [['all', 'All'], ['probation', 'Probation'], ['honors', 'Honors'], ['missing', 'No GPA']];

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: T.text1, margin: 0 }}>Academic Tracking</h1>
        <p style={{ fontSize: 14, color: T.text2, margin: '4px 0 0' }}>Monitor GPA, study hours, and academic standing</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {statCards.map(({ icon, iconBg, value, label }) => (
          <div key={label} style={{ ...cardStyle, padding: 20 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              {icon}
            </div>
            <p style={{ fontSize: 28, fontWeight: 700, color: T.text1, margin: '0 0 4px' }}>{value}</p>
            <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.text3, pointerEvents: 'none' }} />
          <input
            style={{ ...inputStyle, paddingLeft: 38 }}
            placeholder="Search members…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filterOptions.map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={
              filter === val
                ? { background: T.accent, color: '#fff', borderRadius: 20, padding: '6px 16px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: 13 }
                : { background: 'transparent', color: T.text2, borderRadius: 20, padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13 }
            }>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid ' + T.border, background: 'rgba(255,255,255,0.02)' }}>
                {[
                  { label: 'Name', col: 'name', sortable: true },
                  { label: 'Major', col: null, sortable: false },
                  { label: 'GPA', col: 'gpa', sortable: true },
                  { label: 'Study Hrs', col: 'hours', sortable: true },
                  { label: 'Standing', col: null, sortable: false },
                ].map(({ label, col, sortable }) => (
                  <th key={label} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sortable ? (
                      <button onClick={() => toggleSort(col)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, color: T.text3, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', padding: 0 }}>
                        {label} <SortIcon col={col} />
                      </button>
                    ) : label}
                  </th>
                ))}
                {isAdmin && <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(5 + (isAdmin ? 1 : 0)).fill(0).map((_, j) => (
                      <td key={j} style={{ padding: '16px 16px' }}>
                        <div style={{ height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.06)', width: 80 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center' }}>
                    <GraduationCap size={32} style={{ color: T.text3, margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                    <p style={{ fontSize: 14, color: T.text2, margin: 0 }}>No members found</p>
                  </td>
                </tr>
              ) : filtered.map((m, idx) => (
                <tr
                  key={m.id}
                  style={{
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                >
                  {/* Name */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: avatarColor(`${m.firstName}${m.lastName}`),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {(m.firstName || '?')[0]}{(m.lastName || '?')[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: T.text1, margin: 0 }}>{m.firstName} {m.lastName}</p>
                        <p style={{ fontSize: 12, color: T.text3, margin: '2px 0 0', textTransform: 'capitalize' }}>{m.role}</p>
                      </div>
                    </div>
                  </td>
                  {/* Major */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ fontSize: 14, color: m.major ? T.text2 : T.text3 }}>{m.major || '—'}</span>
                  </td>
                  {/* GPA */}
                  <td style={{ padding: '14px 16px' }}>
                    {editing === m.id ? (
                      <input type="number" step="0.01" min="0" max="4"
                        style={{ ...inputStyle, width: 80, padding: '6px 10px', fontSize: 13 }}
                        value={editForm.gpa}
                        onChange={e => setEditForm(f => ({ ...f, gpa: e.target.value }))}
                      />
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: gpaColor(m.gpa) }}>
                        {m.gpa != null ? m.gpa.toFixed(2) : <span style={{ color: T.text3, fontWeight: 400 }}>—</span>}
                      </span>
                    )}
                  </td>
                  {/* Study Hours */}
                  <td style={{ padding: '14px 16px' }}>
                    {editing === m.id ? (
                      <input type="number" min="0"
                        style={{ ...inputStyle, width: 80, padding: '6px 10px', fontSize: 13 }}
                        value={editForm.studyHours}
                        onChange={e => setEditForm(f => ({ ...f, studyHours: e.target.value }))}
                      />
                    ) : (
                      <span style={{ fontSize: 14, color: T.text2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Clock size={12} style={{ color: T.text3 }} />{m.studyHours || 0}h
                      </span>
                    )}
                  </td>
                  {/* Standing */}
                  <td style={{ padding: '14px 16px' }}>
                    {editing === m.id ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={editForm.onProbation}
                          onChange={e => setEditForm(f => ({ ...f, onProbation: e.target.checked }))}
                          style={{ accentColor: T.danger }} />
                        <span style={{ fontSize: 12, color: T.text2 }}>Probation</span>
                      </label>
                    ) : (
                      m.onProbation ? (
                        <span style={badges.red}>Probation</span>
                      ) : m.gpa >= 3.5 ? (
                        <span style={badges.gold}>Honors</span>
                      ) : m.gpa >= 3.0 ? (
                        <span style={badges.green}>Good Standing</span>
                      ) : m.gpa >= 2.5 ? (
                        <span style={badges.gray}>Satisfactory</span>
                      ) : m.gpa != null ? (
                        <span style={badges.red}>At Risk</span>
                      ) : (
                        <span style={{ color: T.text3, fontSize: 13 }}>—</span>
                      )
                    )}
                  </td>
                  {/* Action */}
                  {isAdmin && (
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {editing === m.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                          <button onClick={() => saveEdit(m.id)} disabled={saving} style={{
                            width: 28, height: 28, background: T.success, border: 'none', borderRadius: 7,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          }}>
                            <Check size={13} color="#fff" />
                          </button>
                          <button onClick={() => setEditing(null)} style={{
                            width: 28, height: 28, background: 'rgba(255,255,255,0.07)', border: '1px solid ' + T.border, borderRadius: 7,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                          }}>
                            <X size={13} color={T.text2} />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(m)} style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: 600, color: T.accent,
                        }}>
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
        <div style={{ ...cardStyle, padding: 24, marginTop: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.text1, margin: '0 0 20px' }}>GPA Distribution</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: '3.5 – 4.0', sublabel: "Dean's List", count: members.filter(m => m.gpa >= 3.5).length, color: distBarColors[0] },
              { label: '3.0 – 3.49', sublabel: 'Good Standing', count: members.filter(m => m.gpa >= 3.0 && m.gpa < 3.5).length, color: distBarColors[1] },
              { label: '2.5 – 2.99', sublabel: 'Satisfactory', count: members.filter(m => m.gpa >= 2.5 && m.gpa < 3.0).length, color: distBarColors[2] },
              { label: 'Below 2.5', sublabel: 'At Risk', count: members.filter(m => m.gpa != null && m.gpa < 2.5).length, color: distBarColors[3] },
            ].map(({ label, sublabel, count, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ height: 96, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 10 }}>
                  <div style={{
                    width: 44, borderRadius: '6px 6px 0 0', background: color,
                    height: `${withGpa.length > 0 ? Math.max(8, (count / withGpa.length) * 96) : 8}px`,
                    transition: 'height 0.4s',
                    boxShadow: `0 0 16px ${color}44`,
                  }} />
                </div>
                <p style={{ fontSize: 20, fontWeight: 700, color: T.text1, margin: '0 0 2px' }}>{count}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: T.text2, margin: '0 0 2px' }}>{label}</p>
                <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>{sublabel}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
