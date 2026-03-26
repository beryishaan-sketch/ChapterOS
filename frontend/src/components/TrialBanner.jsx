import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function TrialBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (!user?.org) return null;

  const { plan, trialEndsAt } = user.org;
  if (plan !== 'trial' || !trialEndsAt) return null;

  const daysLeft = Math.ceil((new Date(trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return null;

  const urgent = daysLeft <= 7;

  return (
    <div className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm
      ${urgent ? 'bg-red-500 text-white' : 'bg-amber-50 border-b border-amber-200 text-amber-800'}`}>
      <div className="flex items-center gap-2">
        <Clock size={14} className="flex-shrink-0" />
        <span className="font-medium">
          {daysLeft === 0
            ? 'Your free trial expires today!'
            : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left in your free trial`}
        </span>
        <span className={urgent ? 'text-white/70' : 'text-amber-600'}>
          — upgrade to keep your chapter running
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link to="/billing"
          className={`font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors
            ${urgent ? 'bg-white text-red-600 hover:bg-red-50' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
          Upgrade now
        </Link>
        <button onClick={() => setDismissed(true)}
          className={`p-1 rounded ${urgent ? 'hover:bg-white/10' : 'hover:bg-amber-100'} transition-colors`}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
