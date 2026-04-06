import React, { useState, useEffect, useCallback } from 'react';
import {
  ThumbsUp, ThumbsDown, Minus, RefreshCw, CheckCircle, XCircle,
  Users, Vote, Lock, BarChart2, ChevronRight
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getIsNative } from '../hooks/useNative';

const T = {
  bg: '#070B14', card: '#0D1424', elevated: '#131D2E',
  accent: '#4F8EF7', gold: '#F0B429', success: '#34D399', warning: '#FBBF24', danger: '#F87171',
  text1: '#F8FAFC', text2: '#94A3B8', text3: '#475569',
  border: 'rgba(255,255,255,0.07)', borderStrong: 'rgba(255,255,255,0.12)',
};

const VOTE_OPTIONS = [
  { value: 'yes',     label: 'Yes',     icon: ThumbsUp,   color: T.success,  dimColor: 'rgba(52,211,153,0.12)',  activeGlow: '0 0 20px rgba(52,211,153,0.3)' },
  { value: 'abstain', label: 'Abstain', icon: Minus,       color: T.warning,  dimColor: 'rgba(251,191,36,0.12)',  activeGlow: '0 0 20px rgba(251,191,36,0.3)' },
  { value: 'no',      label: 'No',      icon: ThumbsDown,  color: T.danger,   dimColor: 'rgba(248,113,113,0.12)', activeGlow: '0 0 20px rgba(248,113,113,0.3)' },
];

const TallyBar = ({ tally }) => {
  const total = tally.yes + tally.no + tally.abstain;
  if (total === 0) return <p style={{ fontSize: 12, color: T.text3, fontStyle: 'italic' }}>No votes yet</p>;

  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 2, background: 'rgba(255,255,255,0.05)' }}>
        {tally.yes > 0 && (
          <div style={{ background: T.success, transition: 'width 0.5s', width: `${pct(tally.yes)}%`, borderRadius: 99 }} />
        )}
        {tally.abstain > 0 && (
          <div style={{ background: T.warning, transition: 'width 0.5s', width: `${pct(tally.abstain)}%`, borderRadius: 99 }} />
        )}
        {tally.no > 0 && (
          <div style={{ background: T.danger, transition: 'width 0.5s', width: `${pct(tally.no)}%`, borderRadius: 99 }} />
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 11 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.success, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, display: 'inline-block' }} />
          Yes: {tally.yes} ({pct(tally.yes)}%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.warning, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.warning, display: 'inline-block' }} />
          Abstain: {tally.abstain}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.danger, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.danger, display: 'inline-block' }} />
          No: {tally.no}
        </span>
        <span style={{ marginLeft: 'auto', color: T.text3 }}>{total} vote{total !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

const PNMCard = ({ pnm, result, votingOpen, onVote, onMove, isAdmin, userVote }) => {
  const [voting, setVoting] = useState(false);
  const [moving, setMoving] = useState(null);
  const tally = result?.tally || { yes: 0, no: 0, abstain: 0 };

  const castVote = async (vote) => {
    if (!votingOpen || voting) return;
    setVoting(true);
    try {
      await client.post(`/pnms/${pnm.id}/bid-vote`, { vote });
      onVote(pnm.id, vote);
    } catch { /* empty */ }
    finally { setVoting(false); }
  };

  const moveTo = async (stage) => {
    setMoving(stage);
    try {
      await client.patch(`/pnms/${pnm.id}/stage`, { stage });
      onMove(pnm.id, stage);
    } catch { /* empty */ }
    finally { setMoving(null); }
  };

  const initials = `${pnm.firstName?.[0] || ''}${pnm.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${T.accent}, rgba(167,139,250,0.6))` }} />

      <div style={{ padding: '18px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F8EF7, #A78BFA)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0,
              boxShadow: '0 0 12px rgba(79,142,247,0.3)',
            }}>
              {initials}
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: T.text1, margin: 0, fontSize: 15 }}>{pnm.firstName} {pnm.lastName}</h3>
              <p style={{ fontSize: 12, color: T.text3, margin: '2px 0 0' }}>{result?.totalVotes || 0} member{result?.totalVotes !== 1 ? 's' : ''} voted</p>
            </div>
          </div>

          {!votingOpen && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11,
              color: T.text3, background: 'rgba(255,255,255,0.05)',
              padding: '3px 8px', borderRadius: 99, border: `1px solid ${T.border}`,
            }}>
              <Lock size={10} /> Closed
            </span>
          )}
        </div>

        {/* Tally */}
        <div style={{ marginBottom: 16 }}>
          <TallyBar tally={tally} />
        </div>

        {/* Vote buttons */}
        {votingOpen && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            {VOTE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const isSelected = userVote === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => castVote(opt.value)}
                  disabled={voting}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '10px 8px',
                    borderRadius: 10,
                    border: `1px solid ${isSelected ? opt.color : T.border}`,
                    background: isSelected ? opt.dimColor : 'rgba(255,255,255,0.03)',
                    color: isSelected ? opt.color : T.text3,
                    fontSize: 11, fontWeight: 700,
                    cursor: voting ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? opt.activeGlow : 'none',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                    opacity: voting ? 0.6 : 1,
                  }}
                >
                  <Icon size={15} strokeWidth={2.5} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Admin controls */}
        {isAdmin && !votingOpen && (
          <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
            <button
              onClick={() => moveTo('pledged')}
              disabled={moving !== null}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(52,211,153,0.1)', color: T.success,
                border: `1px solid rgba(52,211,153,0.25)`,
                opacity: moving !== null ? 0.6 : 1, transition: 'all 0.15s',
              }}
            >
              <CheckCircle size={13} />
              {moving === 'pledged' ? 'Moving…' : 'Bid → Pledged'}
            </button>
            <button
              onClick={() => moveTo('dropped')}
              disabled={moving !== null}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(248,113,113,0.1)', color: T.danger,
                border: `1px solid rgba(248,113,113,0.25)`,
                opacity: moving !== null ? 0.6 : 1, transition: 'all 0.15s',
              }}
            >
              <XCircle size={13} />
              {moving === 'dropped' ? 'Moving…' : 'Drop'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function BidVoting() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'officer';

  const [pnms, setPnms] = useState([]);
  const [results, setResults] = useState({});
  const [userVotes, setUserVotes] = useState({});
  const [votingOpen, setVotingOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [pnmRes, resultsRes] = await Promise.all([
        client.get('/pnms?stage=bid'),
        client.get('/pnms/bid-results'),
      ]);

      const pnmList = pnmRes.data.data || [];
      setPnms(pnmList);

      const resultList = resultsRes.data.data || [];
      const resultMap = {};
      resultList.forEach(r => { resultMap[r.id] = r; });
      setResults(resultMap);
    } catch { /* empty */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!votingOpen) return;
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [votingOpen, fetchData]);

  const handleVote = (pnmId, vote) => {
    setUserVotes(prev => ({ ...prev, [pnmId]: vote }));
    setResults(prev => {
      const current = prev[pnmId] || { tally: { yes: 0, no: 0, abstain: 0 }, totalVotes: 0 };
      const oldVote = userVotes[pnmId];
      const newTally = { ...current.tally };
      if (oldVote) newTally[oldVote] = Math.max(0, newTally[oldVote] - 1);
      newTally[vote] = (newTally[vote] || 0) + 1;
      const totalVotes = current.totalVotes + (oldVote ? 0 : 1);
      return { ...prev, [pnmId]: { ...current, tally: newTally, totalVotes } };
    });
  };

  const handleMove = (pnmId, stage) => {
    setPnms(prev => prev.filter(p => p.id !== pnmId));
    setResults(prev => {
      const next = { ...prev };
      delete next[pnmId];
      return next;
    });
  };

  const isNative = getIsNative();

  const N = {
    bg: '#000000', card: '#1C1C1E', elevated: '#2C2C2E',
    sep: 'rgba(255,255,255,0.08)',
    accent: '#0A84FF', success: '#30D158', warning: '#FF9F0A', danger: '#FF453A',
    text1: '#FFFFFF', text2: 'rgba(235,235,245,0.6)', text3: 'rgba(235,235,245,0.3)',
    font: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
  };

  const AVATAR_COLORS = ['#0A84FF','#30D158','#FF9F0A','#FF453A','#BF5AF2','#FF375F','#64D2FF','#FFD60A'];
  const avatarColor = (name) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

  const totalVoted = Object.keys(userVotes).length;
  const allTallies = Object.values(results);
  const totalYes = allTallies.reduce((s, r) => s + (r.tally?.yes || 0), 0);
  const totalNo = allTallies.reduce((s, r) => s + (r.tally?.no || 0), 0);
  const totalAll = totalYes + totalNo + allTallies.reduce((s, r) => s + (r.tally?.abstain || 0), 0);
  const yesPct = totalAll > 0 ? Math.round((totalYes / totalAll) * 100) : 0;
  const noPct = totalAll > 0 ? Math.round((totalNo / totalAll) * 100) : 0;

  if (isNative) return (
    <div style={{ background: N.bg, minHeight: '100vh', paddingBottom: 20, fontFamily: N.font }}>
      <h1 style={{ fontSize: 34, fontWeight: 700, color: N.text1, margin: 0, padding: '16px 20px 4px', letterSpacing: -0.5 }}>Bid Voting</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '16px 16px 0' }}>
        {[
          { value: pnms.length, label: 'Candidates', color: N.text1 },
          { value: `${yesPct}%`, label: 'Yes', color: N.success },
          { value: `${noPct}%`, label: 'No', color: N.danger },
        ].map(({ value, label, color }) => (
          <div key={label} style={{ background: N.card, borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: N.text3, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Status + controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0' }}>
        <span style={{ flex: 1, fontSize: 14, color: votingOpen ? N.success : N.text3, fontWeight: 600 }}>
          {votingOpen ? 'Voting Open' : 'Voting Closed'}
        </span>
        <button onClick={() => fetchData(true)} disabled={refreshing} style={{ background: N.elevated, border: 'none', borderRadius: 10, padding: '8px 14px', color: N.text2, fontSize: 14, cursor: 'pointer' }}>
          Refresh
        </button>
        {isAdmin && (
          <button onClick={() => setVotingOpen(v => !v)} style={{ background: votingOpen ? 'rgba(255,69,58,0.15)' : N.accent, color: votingOpen ? N.danger : '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {votingOpen ? 'Close' : 'Reopen'}
          </button>
        )}
      </div>

      {/* PNM cards */}
      <div style={{ padding: '16px 0 0' }}>
        {loading ? (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: N.text3 }}>Loading…</div>
        ) : pnms.length === 0 ? (
          <div style={{ margin: '0 16px', background: N.card, borderRadius: 14, padding: '40px 20px', textAlign: 'center' }}>
            <Users size={32} style={{ color: N.text3, marginBottom: 12 }} />
            <div style={{ fontSize: 17, color: N.text2, fontWeight: 600 }}>No candidates in bid stage</div>
            <div style={{ fontSize: 14, color: N.text3, marginTop: 6 }}>Move PNMs to the "bid" stage in Recruitment.</div>
          </div>
        ) : pnms.map(pnm => {
          const result = results[pnm.id];
          const tally = result?.tally || { yes: 0, no: 0, abstain: 0 };
          const myVote = userVotes[pnm.id];
          const initials = `${pnm.firstName?.[0] || ''}${pnm.lastName?.[0] || ''}`.toUpperCase();
          const ac = avatarColor(pnm.firstName);
          return (
            <div key={pnm.id} style={{ margin: '0 16px 14px', background: N.card, borderRadius: 14, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 26, background: ac, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{initials}</span>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: N.text1 }}>{pnm.firstName} {pnm.lastName}</div>
                  <div style={{ fontSize: 14, color: N.text2 }}>{result?.totalVotes || 0} vote{result?.totalVotes !== 1 ? 's' : ''} cast</div>
                </div>
              </div>
              {/* Tally bar */}
              {(tally.yes + tally.no + tally.abstain) > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', height: 5, borderRadius: 99, overflow: 'hidden', gap: 2, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }}>
                    {tally.yes > 0 && <div style={{ background: N.success, width: `${Math.round(tally.yes/(tally.yes+tally.no+tally.abstain)*100)}%`, borderRadius: 99 }} />}
                    {tally.abstain > 0 && <div style={{ background: N.warning, width: `${Math.round(tally.abstain/(tally.yes+tally.no+tally.abstain)*100)}%`, borderRadius: 99 }} />}
                    {tally.no > 0 && <div style={{ background: N.danger, width: `${Math.round(tally.no/(tally.yes+tally.no+tally.abstain)*100)}%`, borderRadius: 99 }} />}
                  </div>
                  <div style={{ fontSize: 12, color: N.text3 }}>Yes {tally.yes} · Abs {tally.abstain} · No {tally.no}</div>
                </div>
              )}
              {/* Vote buttons */}
              {votingOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <button
                    onClick={() => { client.post(`/pnms/${pnm.id}/bid-vote`, { vote: 'yes' }).then(() => handleVote(pnm.id, 'yes')).catch(() => {}); }}
                    style={{ padding: '12px 0', background: myVote === 'yes' ? 'rgba(48,209,88,0.2)' : N.elevated, border: myVote === 'yes' ? '1px solid rgba(48,209,88,0.4)' : '1px solid transparent', borderRadius: 12, color: myVote === 'yes' ? N.success : N.text2, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                  >✓ Yes</button>
                  <button
                    onClick={() => { client.post(`/pnms/${pnm.id}/bid-vote`, { vote: 'abstain' }).then(() => handleVote(pnm.id, 'abstain')).catch(() => {}); }}
                    style={{ padding: '12px 0', background: myVote === 'abstain' ? 'rgba(255,159,10,0.15)' : N.elevated, border: myVote === 'abstain' ? '1px solid rgba(255,159,10,0.3)' : '1px solid transparent', borderRadius: 12, color: myVote === 'abstain' ? N.warning : N.text2, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                  >— Abs</button>
                  <button
                    onClick={() => { client.post(`/pnms/${pnm.id}/bid-vote`, { vote: 'no' }).then(() => handleVote(pnm.id, 'no')).catch(() => {}); }}
                    style={{ padding: '12px 0', background: myVote === 'no' ? 'rgba(255,69,58,0.15)' : N.elevated, border: myVote === 'no' ? '1px solid rgba(255,69,58,0.3)' : '1px solid transparent', borderRadius: 12, color: myVote === 'no' ? N.danger : N.text2, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
                  >✕ No</button>
                </div>
              )}
              {/* Admin move controls */}
              {isAdmin && !votingOpen && (
                <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${N.sep}` }}>
                  <button
                    onClick={() => { client.patch(`/pnms/${pnm.id}/stage`, { stage: 'pledged' }).then(() => handleMove(pnm.id, 'pledged')).catch(() => {}); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(48,209,88,0.12)', color: N.success, border: '1px solid rgba(48,209,88,0.25)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Bid → Pledged
                  </button>
                  <button
                    onClick={() => { client.patch(`/pnms/${pnm.id}/stage`, { stage: 'dropped' }).then(() => handleMove(pnm.id, 'dropped')).catch(() => {}); }}
                    style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,69,58,0.12)', color: N.danger, border: '1px solid rgba(255,69,58,0.25)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Drop
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: T.bg }}>

      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ color: T.text1, fontWeight: 800, fontSize: 26, margin: 0 }}>Bid Day Voting</h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700,
              padding: '4px 10px', borderRadius: 99,
              background: votingOpen ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)',
              color: votingOpen ? T.success : T.text3,
              border: `1px solid ${votingOpen ? 'rgba(52,211,153,0.25)' : T.border}`,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: votingOpen ? T.success : T.text3,
                display: 'inline-block',
                animation: votingOpen ? 'pulse 2s infinite' : 'none',
              }} />
              {votingOpen ? 'Voting Open' : 'Voting Closed'}
            </span>
          </div>
          <p style={{ color: T.text2, fontSize: 14, margin: 0 }}>
            {votingOpen
              ? 'Cast your vote for each candidate. Results are anonymous — only tallies are shown.'
              : 'Voting is closed. Admins can now move candidates to Pledged or Dropped.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.06)', color: T.text2,
              border: `1px solid rgba(255,255,255,0.1)`, borderRadius: 8,
              padding: '8px 16px', fontWeight: 500, cursor: 'pointer', fontSize: 13,
              opacity: refreshing ? 0.7 : 1,
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => setVotingOpen(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: votingOpen ? 'rgba(248,113,113,0.15)' : T.accent,
                color: votingOpen ? T.danger : '#fff',
                border: `1px solid ${votingOpen ? 'rgba(248,113,113,0.3)' : 'transparent'}`,
                borderRadius: 8, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13,
                boxShadow: votingOpen ? 'none' : '0 0 20px rgba(79,142,247,0.2)',
              }}
            >
              {votingOpen ? <><Lock size={14} /> Close Voting</> : <><Vote size={14} /> Reopen Voting</>}
            </button>
          )}
        </div>
      </div>

      {/* Instructions banner */}
      {votingOpen && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '14px 18px',
          background: 'rgba(79,142,247,0.07)',
          border: `1px solid rgba(79,142,247,0.2)`,
          borderRadius: 10, marginBottom: 24,
        }}>
          <Vote size={17} style={{ color: T.accent, marginTop: 1, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: T.accent, margin: '0 0 2px' }}>Voting is anonymous.</p>
            <p style={{ fontSize: 13, color: T.text2, margin: 0 }}>
              Individual votes are not shown — only the total tally (Yes / Abstain / No). Vote for each candidate using the buttons below their name. You can change your vote at any time while voting is open.
            </p>
          </div>
        </div>
      )}

      {/* PNM Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }} />
                <div>
                  <div style={{ width: 120, height: 14, borderRadius: 6, background: 'rgba(255,255,255,0.05)', marginBottom: 6 }} />
                  <div style={{ width: 70, height: 11, borderRadius: 6, background: 'rgba(255,255,255,0.04)' }} />
                </div>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3].map(j => <div key={j} style={{ flex: 1, height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.04)' }} />)}
              </div>
            </div>
          ))}
        </div>
      ) : pnms.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
          }}>
            <Users size={32} style={{ color: T.text3 }} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text2, margin: '0 0 8px' }}>No candidates in bid stage</h3>
          <p style={{ fontSize: 14, color: T.text3, maxWidth: 340, margin: '0 0 24px' }}>
            Move PNMs to the "bid" stage in Recruitment to start voting.
          </p>
          <a href="/recruitment" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: T.accent, color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', fontSize: 14,
            boxShadow: '0 0 20px rgba(79,142,247,0.2)',
          }}>
            Go to Recruitment <ChevronRight size={14} />
          </a>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {pnms.map(pnm => (
              <PNMCard
                key={pnm.id}
                pnm={pnm}
                result={results[pnm.id]}
                votingOpen={votingOpen}
                onVote={handleVote}
                onMove={handleMove}
                isAdmin={isAdmin}
                userVote={userVotes[pnm.id]}
              />
            ))}
          </div>

          {/* Summary footer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            marginTop: 24, padding: '14px 18px',
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          }}>
            <BarChart2 size={17} style={{ color: T.text3, flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: T.text2 }}>
              <strong style={{ color: T.text1 }}>{pnms.length}</strong> candidate{pnms.length !== 1 ? 's' : ''} in bid stage &middot;{' '}
              <strong style={{ color: T.text1 }}>{Object.values(userVotes).length}</strong> of {pnms.length} voted by you
            </div>
            {isAdmin && !votingOpen && (
              <div style={{ marginLeft: 'auto', fontSize: 12, color: T.text3 }}>
                Voting closed — use the buttons on each card to finalize decisions.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
