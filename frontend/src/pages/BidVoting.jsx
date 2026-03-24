import React, { useState, useEffect, useCallback } from 'react';
import {
  ThumbsUp, ThumbsDown, Minus, RefreshCw, CheckCircle, XCircle,
  Users, Vote, Lock, BarChart2, ChevronRight
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const VOTE_OPTIONS = [
  { value: 'yes', label: 'Yes', icon: ThumbsUp, color: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500', ring: 'ring-emerald-400', text: 'text-emerald-700', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'abstain', label: 'Abstain', icon: Minus, color: 'amber', bg: 'bg-amber-400', border: 'border-amber-400', ring: 'ring-amber-300', text: 'text-amber-700', light: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'no', label: 'No', icon: ThumbsDown, color: 'red', bg: 'bg-red-500', border: 'border-red-500', ring: 'ring-red-400', text: 'text-red-700', light: 'bg-red-50 text-red-700 border-red-200' },
];

const TallyBar = ({ tally }) => {
  const total = tally.yes + tally.no + tally.abstain;
  if (total === 0) return <p className="text-xs text-gray-400 italic">No votes yet</p>;

  const pct = (n) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="space-y-1.5">
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {tally.yes > 0 && (
          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${pct(tally.yes)}%` }} />
        )}
        {tally.abstain > 0 && (
          <div className="bg-amber-400 transition-all duration-500" style={{ width: `${pct(tally.abstain)}%` }} />
        )}
        {tally.no > 0 && (
          <div className="bg-red-500 transition-all duration-500" style={{ width: `${pct(tally.no)}%` }} />
        )}
        {total === 0 && <div className="bg-gray-200 w-full" />}
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1 font-semibold text-emerald-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Yes: {tally.yes} ({pct(tally.yes)}%)
        </span>
        <span className="flex items-center gap-1 font-semibold text-amber-600">
          <div className="w-2 h-2 rounded-full bg-amber-400" /> Abstain: {tally.abstain}
        </span>
        <span className="flex items-center gap-1 font-semibold text-red-600">
          <div className="w-2 h-2 rounded-full bg-red-500" /> No: {tally.no}
        </span>
        <span className="ml-auto text-gray-400">{total} vote{total !== 1 ? 's' : ''}</span>
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

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy/10 rounded-full flex items-center justify-center text-navy font-bold text-sm flex-shrink-0">
            {pnm.firstName[0]}{pnm.lastName[0]}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{pnm.firstName} {pnm.lastName}</h3>
            <p className="text-xs text-gray-400">{result?.totalVotes || 0} member{result?.totalVotes !== 1 ? 's' : ''} voted</p>
          </div>
        </div>

        {!votingOpen && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            <Lock size={10} /> Closed
          </span>
        )}
      </div>

      {/* Tally */}
      <div className="mb-4">
        <TallyBar tally={tally} />
      </div>

      {/* Vote buttons */}
      {votingOpen && (
        <div className="flex gap-2 mb-4">
          {VOTE_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const isSelected = userVote === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => castVote(opt.value)}
                disabled={voting}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                  isSelected
                    ? `${opt.bg} border-transparent text-white shadow-md scale-105`
                    : `bg-white ${opt.border} ${opt.text} hover:scale-102 opacity-70 hover:opacity-100`
                }`}
              >
                <Icon size={16} strokeWidth={2.5} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Admin controls — only show after voting closed */}
      {isAdmin && !votingOpen && (
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => moveTo('pledged')}
            disabled={moving !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
          >
            <CheckCircle size={14} />
            {moving === 'pledged' ? 'Moving…' : 'Bid → Pledged'}
          </button>
          <button
            onClick={() => moveTo('dropped')}
            disabled={moving !== null}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60"
          >
            <XCircle size={14} />
            {moving === 'dropped' ? 'Moving…' : 'Drop'}
          </button>
        </div>
      )}
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

      // Check which PNMs the current user has voted on
      // We can infer this from the PNM votes if included, otherwise we track locally
    } catch { /* empty */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh tallies every 15s when voting is open
  useEffect(() => {
    if (!votingOpen) return;
    const interval = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(interval);
  }, [votingOpen, fetchData]);

  const handleVote = (pnmId, vote) => {
    setUserVotes(prev => ({ ...prev, [pnmId]: vote }));
    // Optimistically update tally
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

  return (
    <div>
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="page-title">Bid Day Voting</h1>
            <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
              votingOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${votingOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
              {votingOpen ? 'Voting Open' : 'Voting Closed'}
            </span>
          </div>
          <p className="page-subtitle">
            {votingOpen
              ? 'Cast your vote for each candidate. Results are anonymous — only tallies are shown.'
              : 'Voting is closed. Admins can now move candidates to Pledged or Dropped.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchData(true)}
            className="btn-secondary"
            disabled={refreshing}
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => setVotingOpen(v => !v)}
              className={votingOpen ? 'btn-danger' : 'btn-primary'}
            >
              {votingOpen ? <><Lock size={14} /> Close Voting</> : <><Vote size={14} /> Reopen Voting</>}
            </button>
          )}
        </div>
      </div>

      {/* Instructions */}
      {votingOpen && (
        <div className="flex items-start gap-3 p-4 bg-navy/5 border border-navy/15 rounded-xl mb-6">
          <Vote size={18} className="text-navy mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-navy">Voting is anonymous.</p>
            <p className="text-sm text-gray-600">Individual votes are not shown — only the total tally (Yes / Abstain / No). Vote for each candidate using the buttons below their name. You can change your vote at any time while voting is open.</p>
          </div>
        </div>
      )}

      {/* PNM Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div>
                  <div className="skeleton w-28 h-4 rounded mb-1" />
                  <div className="skeleton w-16 h-3 rounded" />
                </div>
              </div>
              <div className="skeleton w-full h-2 rounded-full mb-3" />
              <div className="flex gap-2">
                <div className="skeleton flex-1 h-10 rounded-xl" />
                <div className="skeleton flex-1 h-10 rounded-xl" />
                <div className="skeleton flex-1 h-10 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : pnms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Users size={48} className="text-gray-200 mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-1">No candidates in bid stage</h3>
          <p className="text-sm text-gray-400 max-w-sm">
            Move PNMs to the "bid" stage in Recruitment to start voting.
          </p>
          <a href="/recruitment" className="btn-primary mt-4">
            Go to Recruitment <ChevronRight size={14} />
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-4">
            <BarChart2 size={18} className="text-gray-400 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <strong>{pnms.length}</strong> candidate{pnms.length !== 1 ? 's' : ''} in bid stage ·{' '}
              <strong>{Object.values(userVotes).length}</strong> of {pnms.length} voted by you
            </div>
            {isAdmin && !votingOpen && (
              <div className="ml-auto text-xs text-gray-400">
                Voting closed — use the buttons on each card to finalize decisions.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
