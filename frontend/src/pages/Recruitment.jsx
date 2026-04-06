import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, X, Star, Users, TrendingUp,
  SlidersHorizontal, Mail, Phone, MapPin,
  Calendar, CheckCircle, Save, BookOpen, GripVertical,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { getIsNative } from '../hooks/useNative';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Modal from '../components/Modal';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// ─── Design tokens ───────────────────────────────────────────
const T = {
  bgPrimary:   '#070B14',
  cardBg:      '#0D1424',
  elevated:    '#131D2E',
  accentBlue:  '#4F8EF7',
  gold:        '#F0B429',
  success:     '#34D399',
  warning:     '#FBBF24',
  danger:      '#F87171',
  textPrimary: '#F8FAFC',
  textSec:     '#94A3B8',
  textMuted:   '#475569',
  border:      'rgba(255,255,255,0.07)',
  cardRadius:  12,
  btnRadius:   8,
  cardShadow:  '0 4px 24px rgba(0,0,0,0.4)',
  cardBorder:  '1px solid rgba(255,255,255,0.07)',
};

// ─── Stage config ─────────────────────────────────────────────
export const STAGE_CONFIG = {
  invited:  { label: 'Prospecting', topColor: '#64748B', badgeBg: 'rgba(100,116,139,0.18)', badgeText: '#94A3B8' },
  met:      { label: 'Met',         topColor: '#4F8EF7', badgeBg: 'rgba(79,142,247,0.18)',  badgeText: '#7FB3FF' },
  liked:    { label: 'Liked',       topColor: '#A78BFA', badgeBg: 'rgba(167,139,250,0.18)', badgeText: '#C4B5FD' },
  rush:     { label: 'Rush',        topColor: '#FB923C', badgeBg: 'rgba(251,146,60,0.18)',  badgeText: '#FCA36D' },
  bid:      { label: 'Bid',         topColor: '#F0B429', badgeBg: 'rgba(240,180,41,0.18)',  badgeText: '#F6C94E' },
  pledged:  { label: 'Pledged',     topColor: '#34D399', badgeBg: 'rgba(52,211,153,0.18)',  badgeText: '#6EE7B7' },
  dropped:  { label: 'Dropped',     topColor: '#F87171', badgeBg: 'rgba(248,113,113,0.18)', badgeText: '#FCA5A5' },
};

const STAGES = Object.keys(STAGE_CONFIG);

const avatarPalette = [
  ['#1E3A5F', '#7FB3FF'],
  ['#2D1B69', '#C4B5FD'],
  ['#1A3D2F', '#6EE7B7'],
  ['#3D2000', '#FCA36D'],
  ['#3D1515', '#FCA5A5'],
  ['#1A3040', '#67E8F9'],
  ['#1F2D55', '#818CF8'],
];

// ─── Star Rating (display) ────────────────────────────────────
export const StarRating = ({ score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={10}
        style={{ color: i <= score ? T.gold : T.textMuted, fill: i <= score ? T.gold : T.textMuted }}
      />
    ))}
  </div>
);

// ─── Star Rating Input ────────────────────────────────────────
const StarRatingInput = ({ value, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, transition: 'transform 0.1s' }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Star
          size={22}
          style={{ color: i <= value ? T.gold : T.textMuted, fill: i <= value ? T.gold : T.textMuted }}
        />
      </button>
    ))}
  </div>
);

// ─── Add PNM Modal ────────────────────────────────────────────
const AddPNMModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    major: '', year: '', gpa: '', hometown: '', stage: 'invited', notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) { setError('First and last name are required.'); return; }
    setLoading(true);
    try {
      const res = await client.post('/pnms', form);
      if (res.data.success) { onSave(res.data.data); onClose(); }
      else setError(res.data.error || 'Failed to add PNM');
    } catch { setError('Something went wrong.'); }
    finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', background: T.elevated, border: T.cardBorder, borderRadius: T.btnRadius,
    color: T.textPrimary, fontSize: 14, padding: '9px 12px', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: T.textSec, marginBottom: 6, display: 'block', letterSpacing: '0.02em' };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Potential New Member" size="lg"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving…' : 'Add PNM'}
          </button>
        </>
      }
    >
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: T.btnRadius, marginBottom: 16, fontSize: 13, color: T.danger }}>
          <X size={14} />{error}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>First name *</label>
          <input style={inputStyle} placeholder="Jane" value={form.firstName} onChange={e => update('firstName', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Last name *</label>
          <input style={inputStyle} placeholder="Smith" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="email" style={inputStyle} placeholder="jane@university.edu" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input type="tel" style={inputStyle} placeholder="(555) 000-0000" value={form.phone} onChange={e => update('phone', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Major</label>
          <input style={inputStyle} placeholder="Computer Science" value={form.major} onChange={e => update('major', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Year</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.year} onChange={e => update('year', e.target.value)}>
            <option value="">Select year</option>
            {['Freshman', 'Sophomore', 'Junior', 'Senior'].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>GPA</label>
          <input type="number" step="0.01" min="0" max="4" style={inputStyle} placeholder="3.50" value={form.gpa} onChange={e => update('gpa', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Hometown</label>
          <input style={inputStyle} placeholder="Chicago, IL" value={form.hometown} onChange={e => update('hometown', e.target.value)} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Initial stage</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.stage} onChange={e => update('stage', e.target.value)}>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Notes</label>
          <textarea style={{ ...inputStyle, resize: 'none' }} rows={3} placeholder="Any notes about this PNM…" value={form.notes} onChange={e => update('notes', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
};

// ─── PNM Slide Panel ──────────────────────────────────────────
const PNMPanel = ({ pnm, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState(pnm?.notes || '');
  const [stage, setStage] = useState(pnm?.stage || 'invited');
  const [myRating, setMyRating] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (pnm) {
      setNotes(pnm.notes || '');
      setStage(pnm.stage || 'invited');
      const existingVote = pnm.votes?.find(v => v.memberId === user?.id);
      setMyRating(existingVote?.score || 0);
    }
  }, [pnm, user]);

  if (!pnm) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await client.patch(`/pnms/${pnm.id}`, { notes, stage });
      if (myRating > 0) {
        await client.post(`/pnms/${pnm.id}/vote`, { score: myRating });
      }
      if (res.data.success) {
        onUpdate({ ...pnm, notes, stage, ...res.data.data });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  const initials = `${pnm.firstName?.[0] || ''}${pnm.lastName?.[0] || ''}`.toUpperCase();
  const colorIndex = ((pnm.firstName?.charCodeAt(0) || 0) + (pnm.lastName?.charCodeAt(0) || 0)) % avatarPalette.length;
  const [avBg, avText] = avatarPalette[colorIndex];

  const inputStyle = {
    width: '100%', background: T.elevated, border: T.cardBorder, borderRadius: T.btnRadius,
    color: T.textPrimary, fontSize: 14, padding: '9px 12px', outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: T.textSec, marginBottom: 6, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 40, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(7,11,20,0.7)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      {/* Panel */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 420,
        background: T.cardBg, borderLeft: T.cardBorder,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '-8px 0 48px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 20px', borderBottom: T.cardBorder, background: T.elevated }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: avBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: avText, fontWeight: 800, fontSize: 18, flexShrink: 0,
                boxShadow: `0 0 0 2px ${avBg}44`,
              }}>
                {initials}
              </div>
              <div>
                <h2 style={{ color: T.textPrimary, fontWeight: 700, fontSize: 17, margin: 0, lineHeight: 1.2 }}>
                  {pnm.firstName} {pnm.lastName}
                </h2>
                {pnm.major && (
                  <p style={{ color: T.textSec, fontSize: 13, margin: '3px 0 0' }}>
                    {pnm.major}{pnm.year ? ` · ${pnm.year}` : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: T.textSec, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >
              <X size={16} />
            </button>
          </div>
          {pnm.avgScore > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StarRating score={Math.round(pnm.avgScore)} />
              <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 700 }}>{pnm.avgScore.toFixed(1)}</span>
              <span style={{ color: T.textMuted, fontSize: 12 }}>({pnm.votes?.length || 0} vote{pnm.votes?.length !== 1 ? 's' : ''})</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {pnm.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textSec }}>
                <Mail size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pnm.email}</span>
              </div>
            )}
            {pnm.phone && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textSec }}>
                <Phone size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                {pnm.phone}
              </div>
            )}
            {pnm.hometown && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textSec }}>
                <MapPin size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                {pnm.hometown}
              </div>
            )}
            {pnm.gpa && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.textSec }}>
                <BookOpen size={13} style={{ color: T.textMuted, flexShrink: 0 }} />
                GPA {pnm.gpa}
              </div>
            )}
          </div>

          {/* Stage */}
          <div>
            <label style={labelStyle}>Stage</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={stage} onChange={e => setStage(e.target.value)}>
              {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
            </select>
          </div>

          {/* My Rating */}
          <div>
            <label style={labelStyle}>My Rating</label>
            <StarRatingInput value={myRating} onChange={setMyRating} />
            <p style={{ color: T.textMuted, fontSize: 11, marginTop: 6 }}>Only you can see your individual rating</p>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              rows={4}
              placeholder="Add notes about this PNM…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Event Attendance */}
          {pnm.eventAttendances && pnm.eventAttendances.length > 0 && (
            <div>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={12} />Event Attendance
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pnm.eventAttendances.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: T.elevated, borderRadius: T.btnRadius, border: T.cardBorder }}>
                    <span style={{ fontSize: 13, color: T.textPrimary }}>{ev.event?.title || 'Event'}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(52,211,153,0.15)', color: T.success }}>Attended</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: T.cardBorder, background: T.elevated }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '12px 20px', borderRadius: T.btnRadius,
              background: saved ? 'rgba(52,211,153,0.15)' : `linear-gradient(135deg, ${T.accentBlue}, #3B72D9)`,
              border: saved ? '1px solid rgba(52,211,153,0.3)' : 'none',
              color: saved ? T.success : '#fff',
              fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: saving ? 0.7 : 1,
              boxShadow: saved ? 'none' : '0 4px 16px rgba(79,142,247,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {saved ? (
              <><CheckCircle size={16} /> Saved!</>
            ) : saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                Saving…
              </span>
            ) : (
              <><Save size={16} /> Save changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Dark Kanban PNM Card ─────────────────────────────────────
const DarkPNMCard = ({ pnm, onClick, isDragging }) => {
  const initials = `${pnm.firstName?.[0] || ''}${pnm.lastName?.[0] || ''}`.toUpperCase();
  const colorIndex = ((pnm.firstName?.charCodeAt(0) || 0) + (pnm.lastName?.charCodeAt(0) || 0)) % avatarPalette.length;
  const [avBg, avText] = avatarPalette[colorIndex];

  const interestColors = {
    high: { bg: 'rgba(52,211,153,0.15)', text: '#34D399', label: 'High' },
    medium: { bg: 'rgba(251,191,36,0.15)', text: '#FBBF24', label: 'Med' },
    low: { bg: 'rgba(248,113,113,0.15)', text: '#F87171', label: 'Low' },
  };
  const interest = pnm.interest || (pnm.avgScore >= 4 ? 'high' : pnm.avgScore >= 2.5 ? 'medium' : pnm.avgScore > 0 ? 'low' : null);
  const interestCfg = interest ? interestColors[interest] : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: T.elevated,
        border: isDragging ? `1px solid ${T.accentBlue}44` : T.cardBorder,
        borderRadius: 10,
        padding: 14,
        cursor: 'pointer',
        boxShadow: isDragging ? '0 12px 32px rgba(0,0,0,0.6)' : '0 2px 8px rgba(0,0,0,0.3)',
        transform: isDragging ? 'rotate(2deg) scale(1.03)' : 'none',
        opacity: isDragging ? 0.95 : 1,
        transition: 'box-shadow 0.15s, border-color 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => { if (!isDragging) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; } }}
      onMouseLeave={e => { if (!isDragging) { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; } }}
    >
      {/* Top row: avatar + name + interest badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: avBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: avText, fontWeight: 800, fontSize: 13, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pnm.firstName} {pnm.lastName}
          </p>
          {pnm.major && (
            <p style={{ color: T.textSec, fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pnm.major}{pnm.year ? ` · ${pnm.year}` : ''}
            </p>
          )}
        </div>
        {interestCfg && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99,
            background: interestCfg.bg, color: interestCfg.text, flexShrink: 0,
            marginTop: 1,
          }}>
            {interestCfg.label}
          </span>
        )}
      </div>

      {/* Bottom: star rating */}
      {pnm.avgScore > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: 'rgba(255,255,255,0.05) solid 1px' }}>
          <StarRating score={Math.round(pnm.avgScore)} />
          <span style={{ color: T.textSec, fontSize: 11, fontWeight: 600 }}>{pnm.avgScore.toFixed(1)}</span>
          <span style={{ color: T.textMuted, fontSize: 11, marginLeft: 'auto' }}>{pnm.votes?.length || 0}v</span>
        </div>
      )}
    </div>
  );
};

// ─── Sortable PNM Card wrapper ────────────────────────────────
const SortablePNMCard = ({ pnm, onClick, onStageChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pnm.id });
  const STAGES_LIST = Object.keys(STAGE_CONFIG);
  const currentIdx = STAGES_LIST.indexOf(pnm.stage);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const moveStage = (e, direction) => {
    e.stopPropagation();
    const newStage = STAGES_LIST[currentIdx + direction];
    if (newStage) onStageChange?.(pnm.id, newStage);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ position: 'relative' }}>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', left: -8, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'grab', color: T.textMuted,
            display: 'flex', alignItems: 'center', padding: 4, zIndex: 10,
            opacity: 0, transition: 'opacity 0.15s',
          }}
          className="drag-handle"
        >
          <GripVertical size={12} />
        </button>
        <DarkPNMCard pnm={pnm} onClick={() => onClick(pnm)} isDragging={isDragging} />
        {/* Mobile move buttons */}
        <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }} className="md:hidden">
          {currentIdx > 0 && (
            <button onClick={e => moveStage(e, -1)} style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.06)', border: T.cardBorder, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: T.textSec }}>
              <ChevronLeft size={12} />
            </button>
          )}
          {currentIdx < STAGES_LIST.length - 1 && (
            <button onClick={e => moveStage(e, 1)} style={{ width: 24, height: 24, background: T.accentBlue, border: 'none', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Dark Kanban Column ───────────────────────────────────────
const DarkKanbanColumn = ({ stage, pnms, onPNMClick, onStageChange, onAddPNM }) => {
  const cfg = STAGE_CONFIG[stage];
  const { setNodeRef } = useSortable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex', flexDirection: 'column',
        minWidth: 280, width: 280, flexShrink: 0,
        background: T.cardBg,
        border: T.cardBorder,
        borderRadius: T.cardRadius,
        overflow: 'hidden',
        boxShadow: T.cardShadow,
      }}
    >
      {/* Colored top border accent */}
      <div style={{ height: 3, background: cfg.topColor, flexShrink: 0 }} />

      {/* Column header */}
      <div style={{ padding: '12px 14px', borderBottom: T.cardBorder, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: T.textPrimary, fontWeight: 700, fontSize: 14 }}>{cfg.label}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 99,
          background: cfg.badgeBg, color: cfg.badgeText,
        }}>
          {pnms.length}
        </span>
      </div>

      {/* Cards area */}
      <div style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
        <SortableContext items={pnms.map(p => p.id)} strategy={verticalListSortingStrategy}>
          {pnms.length === 0 ? (
            <button
              onClick={() => onAddPNM && onAddPNM(stage)}
              style={{
                flex: 1, minHeight: 100, borderRadius: 10,
                border: '1px dashed rgba(255,255,255,0.12)',
                background: 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 8, cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={14} style={{ color: T.textMuted }} />
              </div>
              <p style={{ color: T.textMuted, fontSize: 12, fontWeight: 500, margin: 0 }}>Drop here</p>
            </button>
          ) : (
            <>
              {pnms.map(pnm => (
                <SortablePNMCard key={pnm.id} pnm={pnm} onClick={onPNMClick} onStageChange={onStageChange} />
              ))}
              <button
                onClick={() => onAddPNM && onAddPNM(stage)}
                style={{
                  padding: '8px', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.08)',
                  background: 'transparent', cursor: 'pointer', color: T.textMuted,
                  fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent'; }}
              >
                <Plus size={11} /> Add
              </button>
            </>
          )}
        </SortableContext>
      </div>
    </div>
  );
};

// ─── Dark Kanban Board ────────────────────────────────────────
const DarkKanbanBoard = ({ pnms, onPNMClick, onStageChange }) => {
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const stages = Object.keys(STAGE_CONFIG);
  const pnmsByStage = stages.reduce((acc, stage) => {
    acc[stage] = pnms.filter(p => p.stage === stage);
    return acc;
  }, {});

  const activePNM = activeId ? pnms.find(p => p.id === activeId) : null;

  const handleDragStart = ({ active }) => setActiveId(active.id);
  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over) return;
    const pnm = pnms.find(p => p.id === active.id);
    if (!pnm) return;
    const targetStage = stages.includes(over.id)
      ? over.id
      : pnms.find(p => p.id === over.id)?.stage;
    if (targetStage && targetStage !== pnm.stage) {
      onStageChange(pnm.id, targetStage);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 24, alignItems: 'flex-start' }}>
        {stages.map(stage => (
          <DarkKanbanColumn
            key={stage}
            stage={stage}
            pnms={pnmsByStage[stage]}
            onPNMClick={onPNMClick}
            onStageChange={onStageChange}
          />
        ))}
      </div>
      <DragOverlay>
        {activePNM && <DarkPNMCard pnm={activePNM} onClick={() => {}} isDragging />}
      </DragOverlay>
    </DndContext>
  );
};

// ─── Skeleton shimmer ─────────────────────────────────────────
const Shimmer = ({ width, height, borderRadius = 6 }) => (
  <div style={{
    width, height, borderRadius,
    background: `linear-gradient(90deg, ${T.cardBg} 0%, ${T.elevated} 50%, ${T.cardBg} 100%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
  }} />
);

// ─── Native design tokens ─────────────────────────────────────
const N = {
  bg: '#000000', card: '#1C1C1E', elevated: '#2C2C2E',
  sep: 'rgba(255,255,255,0.08)',
  accent: '#0A84FF', success: '#30D158', warning: '#FF9F0A', danger: '#FF453A',
  text1: '#FFFFFF', text2: 'rgba(235,235,245,0.6)', text3: 'rgba(235,235,245,0.3)',
  font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
};

// ─── Main Recruitment Page ────────────────────────────────────
export default function Recruitment() {
  const [pnms, setPnms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedPNM, setSelectedPNM] = useState(null);
  const isNative = getIsNative();

  const fetchPNMs = useCallback(async () => {
    try {
      const res = await client.get('/pnms');
      if (res.data.success) setPnms(res.data.data || []);
    } catch { /* empty */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPNMs(); }, [fetchPNMs]);

  const handleStageChange = async (pnmId, newStage) => {
    setPnms(prev => prev.map(p => p.id === pnmId ? { ...p, stage: newStage } : p));
    try { await client.patch(`/pnms/${pnmId}`, { stage: newStage }); }
    catch { fetchPNMs(); }
  };

  const handleSaveNew = (newPNM) => setPnms(prev => [newPNM, ...prev]);

  const handleUpdate = (updated) => {
    setPnms(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPNM(updated);
  };

  const filteredPNMs = pnms.filter(p => {
    const matchSearch = !search || `${p.firstName} ${p.lastName} ${p.major || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchStage = filterStage === 'all' || p.stage === filterStage;
    return matchSearch && matchStage;
  });

  const stats = {
    total: pnms.length,
    avgScore: pnms.filter(p => p.avgScore > 0).length > 0
      ? (pnms.filter(p => p.avgScore > 0).reduce((a, p) => a + p.avgScore, 0) / pnms.filter(p => p.avgScore > 0).length).toFixed(1)
      : '—',
    pledged: pnms.filter(p => p.stage === 'pledged').length,
    conversionRate: pnms.length > 0 ? Math.round((pnms.filter(p => p.stage === 'pledged').length / pnms.length) * 100) : 0,
  };

  const statCards = [
    { label: 'Total PNMs',  value: loading ? '—' : stats.total,            icon: Users,      iconColor: T.accentBlue, iconBg: 'rgba(79,142,247,0.12)' },
    { label: 'Avg Score',   value: loading ? '—' : stats.avgScore,          icon: Star,       iconColor: T.gold,       iconBg: 'rgba(240,180,41,0.12)' },
    { label: 'Pledged',     value: loading ? '—' : stats.pledged,           icon: CheckCircle,iconColor: T.success,    iconBg: 'rgba(52,211,153,0.12)' },
    { label: 'Conversion',  value: loading ? '—' : `${stats.conversionRate}%`, icon: TrendingUp, iconColor: '#A78BFA',   iconBg: 'rgba(167,139,250,0.12)' },
  ];

  // ── Native layout ─────────────────────────────────────────────
  if (isNative) {
    const nativeStageColors = {
      invited:  '#8E8E93',
      met:      '#0A84FF',
      liked:    '#BF5AF2',
      rush:     '#FF6B35',
      bid:      '#FF9F0A',
      pledged:  '#30D158',
      dropped:  '#FF453A',
    };

    const bidsOut = pnms.filter(p => p.stage === 'bid').length;
    const acceptanceRate = bidsOut > 0 ? Math.round((stats.pledged / bidsOut) * 100) : 0;

    return (
      <div style={{ background: N.bg, minHeight: '100vh', paddingBottom: 20, fontFamily: N.font }}>
        {/* Large title + add button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 4px' }}>
          <h1 style={{ fontSize: 34, fontWeight: 700, color: N.text1, margin: 0, letterSpacing: -0.5 }}>Recruitment</h1>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              width: 32, height: 32, borderRadius: 16, background: N.accent,
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Plus size={18} color="#fff" />
          </button>
        </div>

        {/* 2×2 stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 16px 0' }}>
          {[
            { value: loading ? '—' : stats.total, label: 'Total PNMs' },
            { value: loading ? '—' : bidsOut, label: 'Bids Out' },
            { value: loading ? '—' : `${acceptanceRate}%`, label: 'Acceptance Rate' },
            { value: loading ? '—' : stats.pledged, label: 'Pledged' },
          ].map(({ value, label }) => (
            <div key={label} style={{ background: N.card, borderRadius: 14, padding: '18px 16px' }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: N.text1, letterSpacing: -0.5 }}>{value}</div>
              <div style={{ fontSize: 13, color: N.text2, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Pipeline — one card per stage */}
        <div style={{ marginTop: 16 }}>
          {STAGES.map(stage => {
            const cfg = STAGE_CONFIG[stage];
            const stagePNMs = pnms.filter(p => p.stage === stage);
            const stageColor = nativeStageColors[stage] || N.text2;

            if (stagePNMs.length === 0) return null;

            return (
              <div key={stage} style={{ margin: '0 16px 14px', background: N.card, borderRadius: 14, overflow: 'hidden' }}>
                {/* Stage header */}
                <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: stageColor }} />
                    <span style={{ fontSize: 17, fontWeight: 600, color: N.text1 }}>{cfg.label}</span>
                  </div>
                  <span style={{ fontSize: 14, color: N.text2 }}>{stagePNMs.length} PNMs</span>
                </div>

                {/* PNM rows */}
                {stagePNMs.map((pnm, i) => {
                  const colorIndex = ((pnm.firstName?.charCodeAt(0) || 0) + (pnm.lastName?.charCodeAt(0) || 0)) % avatarPalette.length;
                  const [avBg, avText] = avatarPalette[colorIndex];
                  const inits = `${pnm.firstName?.[0] || ''}${pnm.lastName?.[0] || ''}`.toUpperCase();
                  const STAGES_LIST = Object.keys(STAGE_CONFIG);
                  const currentIdx = STAGES_LIST.indexOf(pnm.stage);

                  return (
                    <div
                      key={pnm.id}
                      onClick={() => setSelectedPNM(pnm)}
                      style={{
                        display: 'flex', alignItems: 'center', padding: '10px 16px',
                        borderTop: `1px solid ${N.sep}`, cursor: 'pointer',
                        minHeight: 52,
                      }}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 18, background: avBg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: avText, fontWeight: 700, fontSize: 13, flexShrink: 0, marginRight: 12,
                      }}>
                        {inits}
                      </div>

                      {/* Name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: N.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {pnm.firstName} {pnm.lastName}
                        </div>
                        {(pnm.major || pnm.year) && (
                          <div style={{ fontSize: 12, color: N.text2, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pnm.major}{pnm.year ? ` · ${pnm.year}` : ''}
                          </div>
                        )}
                      </div>

                      {/* Move stage buttons */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {currentIdx > 0 && (
                          <button
                            onClick={e => { e.stopPropagation(); handleStageChange(pnm.id, STAGES_LIST[currentIdx - 1]); }}
                            style={{
                              width: 28, height: 28, borderRadius: 8, border: `1px solid ${N.sep}`,
                              background: N.elevated, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <ChevronLeft size={14} color={N.text2} />
                          </button>
                        )}
                        {currentIdx < STAGES_LIST.length - 1 && (
                          <button
                            onClick={e => { e.stopPropagation(); handleStageChange(pnm.id, STAGES_LIST[currentIdx + 1]); }}
                            style={{
                              width: 28, height: 28, borderRadius: 8, border: 'none',
                              background: N.accent, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          >
                            <ChevronRight size={14} color="#fff" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Empty state */}
          {pnms.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: N.text3 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: N.text2, marginBottom: 8 }}>No PNMs yet</div>
              <div style={{ fontSize: 14, color: N.text3 }}>Tap + to add your first PNM</div>
            </div>
          )}
        </div>

        {/* Modals — reuse existing */}
        <AddPNMModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSave={pnm => { handleSaveNew(pnm); }} />
        {selectedPNM && (
          <PNMPanel pnm={selectedPNM} onClose={() => setSelectedPNM(null)} onUpdate={handleUpdate} />
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* inject shimmer animation */}
      <style>{`
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes spin { to { transform: rotate(360deg) } }
        .drag-handle { opacity: 0 !important; }
        .drag-handle-wrapper:hover .drag-handle { opacity: 0.5 !important; }
        .drag-handle-wrapper:hover .drag-handle:hover { opacity: 1 !important; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ color: T.textPrimary, fontWeight: 800, fontSize: 24, margin: 0, letterSpacing: '-0.03em' }}>
            Recruitment Pipeline
          </h1>
          <p style={{ color: T.textSec, fontSize: 14, margin: '4px 0 0' }}>
            Track and manage potential new members
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: T.btnRadius,
            background: `linear-gradient(135deg, ${T.accentBlue}, #3B72D9)`,
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 14,
            cursor: 'pointer',
            boxShadow: `0 4px 16px rgba(79,142,247,0.35), 0 0 0 1px rgba(79,142,247,0.2)`,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 24px rgba(79,142,247,0.5), 0 0 0 1px rgba(79,142,247,0.3)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(79,142,247,0.35), 0 0 0 1px rgba(79,142,247,0.2)'}
        >
          <Plus size={16} /> Add PNM
        </button>
      </div>

      {/* ─── Stats row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div key={label} style={{
            background: T.cardBg, border: T.cardBorder, borderRadius: T.cardRadius,
            boxShadow: T.cardShadow, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={18} style={{ color: iconColor }} />
            </div>
            <div>
              <p style={{ color: T.textPrimary, fontWeight: 800, fontSize: 22, margin: 0, lineHeight: 1 }}>{value}</p>
              <p style={{ color: T.textSec, fontSize: 12, margin: '4px 0 0' }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Search + Filter ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search PNMs…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: T.cardBg, border: T.cardBorder,
              borderRadius: T.btnRadius, color: T.textPrimary, fontSize: 14,
              padding: '9px 36px 9px 36px', outline: 'none', boxSizing: 'border-box',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex' }}>
              <X size={13} />
            </button>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <SlidersHorizontal size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <select
            value={filterStage}
            onChange={e => setFilterStage(e.target.value)}
            style={{
              background: T.cardBg, border: T.cardBorder, borderRadius: T.btnRadius,
              color: T.textPrimary, fontSize: 13, padding: '9px 12px 9px 30px',
              outline: 'none', cursor: 'pointer', fontWeight: 500,
            }}
          >
            <option value="all">All stages</option>
            {STAGES.map(s => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
          </select>
        </div>
        {(search || filterStage !== 'all') && (
          <span style={{ fontSize: 12, color: T.textMuted }}>{filteredPNMs.length} result{filteredPNMs.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* ─── Kanban Board ─── */}
      {loading ? (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 24 }}>
          {STAGES.map(s => (
            <div key={s} style={{ minWidth: 280, width: 280, flexShrink: 0, background: T.cardBg, border: T.cardBorder, borderRadius: T.cardRadius, overflow: 'hidden', boxShadow: T.cardShadow }}>
              <div style={{ height: 3, background: STAGE_CONFIG[s].topColor }} />
              <div style={{ padding: '12px 14px', borderBottom: T.cardBorder }}>
                <Shimmer width={80} height={14} />
              </div>
              <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array(2).fill(0).map((_, i) => (
                  <div key={i} style={{ background: T.elevated, borderRadius: 10, padding: 14, border: T.cardBorder }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Shimmer width={34} height={34} borderRadius={10} />
                      <div style={{ flex: 1 }}>
                        <Shimmer width="70%" height={13} />
                        <div style={{ marginTop: 6 }}><Shimmer width="50%" height={11} /></div>
                      </div>
                    </div>
                    <Shimmer width="60%" height={10} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : pnms.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.04)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <Users size={32} style={{ color: T.textMuted }} />
          </div>
          <h3 style={{ color: T.textSec, fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>No PNMs yet</h3>
          <p style={{ color: T.textMuted, fontSize: 14, margin: '0 0 24px' }}>Start tracking potential new members</p>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
              borderRadius: T.btnRadius, background: `linear-gradient(135deg, ${T.accentBlue}, #3B72D9)`,
              border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(79,142,247,0.35)',
            }}
          >
            <Plus size={16} /> Add first PNM
          </button>
        </div>
      ) : (
        <DarkKanbanBoard
          pnms={filteredPNMs}
          onPNMClick={setSelectedPNM}
          onStageChange={handleStageChange}
        />
      )}

      {/* ─── Modals ─── */}
      <AddPNMModal isOpen={showAdd} onClose={() => setShowAdd(false)} onSave={handleSaveNew} />
      {selectedPNM && (
        <PNMPanel pnm={selectedPNM} onClose={() => setSelectedPNM(null)} onUpdate={handleUpdate} />
      )}
    </div>
  );
}
