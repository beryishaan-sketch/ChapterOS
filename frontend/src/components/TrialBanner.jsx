import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function TrialBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !user?.org) return null;
  const { plan, trialEndsAt } = user.org;
  if (plan !== 'trial' || !trialEndsAt) return null;

  const daysLeft = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return null;

  const urgent = daysLeft <= 3;

  return (
    <div style={{
      height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px',
      background: urgent
        ? 'rgba(248,113,113,0.1)'
        : 'rgba(240,180,41,0.08)',
      borderBottom: `1px solid ${urgent ? 'rgba(248,113,113,0.2)' : 'rgba(240,180,41,0.15)'}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Zap size={12} color={urgent ? '#F87171' : '#F0B429'} />
        <span style={{
          fontSize: 12, fontWeight: 500,
          color: urgent ? '#F87171' : '#F0B429',
        }}>
          {daysLeft === 0 ? 'Trial expires today' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in trial`}
          <span style={{ color: '#475569', marginLeft: 6 }}>— upgrade to keep full access</span>
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link to="/billing" style={{
          fontSize: 11, fontWeight: 700,
          color: '#070B14',
          background: urgent ? '#F87171' : '#F0B429',
          padding: '3px 10px', borderRadius: 999,
          textDecoration: 'none',
          transition: 'filter 150ms ease',
        }}
          className="hover:brightness-110"
        >
          Upgrade
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 2, display: 'flex' }}
          className="hover:text-[#94A3B8]"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
