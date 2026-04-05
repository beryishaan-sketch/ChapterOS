import React, { useState, useEffect } from 'react';
import {
  CreditCard, Users, Check, ExternalLink, AlertCircle,
  Clock, ChevronRight, Download, Zap, Shield, Star
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  {
    name: 'Basic',
    price: '$0',
    period: '/mo',
    description: 'For small chapters getting started',
    memberLimit: 25,
    features: [
      { text: 'Up to 25 members', included: true },
      { text: 'Events & attendance', included: true },
      { text: 'Dues tracking', included: true },
      { text: 'Guest lists', included: true },
      { text: 'Recruitment pipeline', included: false },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Standard',
    price: '$29',
    period: '/mo',
    description: 'For growing chapters',
    memberLimit: 100,
    popular: true,
    features: [
      { text: 'Up to 100 members', included: true },
      { text: 'Events & attendance', included: true },
      { text: 'Dues tracking', included: true },
      { text: 'Guest lists', included: true },
      { text: 'Recruitment pipeline', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$59',
    period: '/mo',
    description: 'For large chapters needing everything',
    memberLimit: null,
    features: [
      { text: 'Unlimited members', included: true },
      { text: 'Events & attendance', included: true },
      { text: 'Dues tracking', included: true },
      { text: 'Guest lists', included: true },
      { text: 'Recruitment pipeline', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority support', included: true },
    ],
  },
];

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (cents) => {
  if (cents == null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
};

const PlanComparison = ({ currentPlan, onUpgrade }) => (
  <div>
    <h2 className="section-title mb-4">Plans</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {PLANS.map(plan => {
        const isCurrent = plan.name.toLowerCase() === currentPlan?.toLowerCase();
        return (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-5 border-2 transition-all ${
              plan.popular ? 'border-navy shadow-card-hover' : isCurrent ? 'border-gold' : 'border-gray-200'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-navy text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
              </div>
            )}
            {isCurrent && !plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gold text-navy-dark text-xs font-bold px-3 py-1 rounded-full">Current Plan</span>
              </div>
            )}

            <div className="mb-4">
              <p className="text-base font-bold text-gray-900">{plan.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-0.5 mb-4">
              <span className="text-3xl font-black text-gray-900">{plan.price}</span>
              <span className="text-sm text-gray-500">{plan.period}</span>
            </div>

            <ul className="space-y-2 mb-5">
              {plan.features.map(f => (
                <li key={f.text} className="flex items-center gap-2 text-sm">
                  {f.included ? (
                    <Check size={13} className="text-emerald-500 flex-shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    </span>
                  )}
                  <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <div className="w-full py-2.5 text-center text-sm font-medium text-gray-400 border border-gray-200 rounded-xl">
                Current plan
              </div>
            ) : (
              <button
                onClick={() => onUpgrade(plan.name)}
                className={`w-full py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  plan.popular
                    ? 'bg-navy text-white hover:bg-navy-light'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {PLANS.findIndex(p => p.name === plan.name) > PLANS.findIndex(p => p.name === currentPlan) ? 'Upgrade' : 'Downgrade'}
              </button>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default function Billing() {
  const { org } = useAuth();
  const [billing, setBilling] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/billing/current').catch(() => null),
      client.get('/billing/invoices').catch(() => null),
    ]).then(([billingRes, invoicesRes]) => {
      if (billingRes?.data?.success) setBilling(billingRes.data.data);
      if (invoicesRes?.data?.success) setInvoices(invoicesRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (planName) => {
    try {
      const res = await client.post('/billing/checkout', { plan: planName.toLowerCase() });
      if (res.data.success && res.data.data?.url) {
        window.location.href = res.data.data.url;
      }
    } catch { /* empty */ }
  };

  const handleManageBilling = async () => {
    try {
      const res = await client.post('/billing/portal');
      if (res.data.success && res.data.data?.url) {
        window.open(res.data.data.url, '_blank');
      }
    } catch { /* empty */ }
  };

  const plan = billing?.plan || org?.plan || 'basic';
  const planConfig = PLANS.find(p => p.name.toLowerCase() === plan.toLowerCase()) || PLANS[0];
  const memberCount = billing?.memberCount || 0;
  const memberLimit = planConfig.memberLimit;
  const memberPct = memberLimit ? Math.min(100, Math.round((memberCount / memberLimit) * 100)) : null;

  // Trial
  const isOnTrial = billing?.status === 'trialing';
  const trialEnd = billing?.trialEnd;
  const trialDaysLeft = trialEnd
    ? Math.max(0, Math.ceil((new Date(trialEnd) - Date.now()) / 86400000))
    : null;

  return (
    <div className="max-w-4xl">
      <div className="page-header">
        <h1 className="page-title">Billing</h1>
        <p className="page-subtitle">Manage your subscription and payment information</p>
      </div>

      {/* Trial banner */}
      {isOnTrial && trialDaysLeft != null && (
        <div className="flex items-center gap-3 p-4 bg-gold/10 border border-gold/30 rounded-xl mb-6 animate-slide-up">
          <Clock size={18} className="text-gold-dark flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gold-dark">
              {trialDaysLeft > 0 ? `${trialDaysLeft} days left in your trial` : 'Your trial has ended'}
            </p>
            <p className="text-xs text-gold-dark/70 mt-0.5">Upgrade to keep full access after your trial.</p>
          </div>
          <button onClick={() => handleUpgrade('Standard')} className="btn-primary text-xs py-2">
            Upgrade now <ChevronRight size={13} />
          </button>
        </div>
      )}

      <div className="space-y-8">
        {/* Current Plan */}
        <div className="card p-6">
          <h2 className="section-title mb-5">Current Plan</h2>
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-8 w-32 rounded" />
              <div className="skeleton h-4 w-48 rounded" />
              <div className="skeleton h-3 w-full rounded-full" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-2xl font-black text-gray-900">{planConfig.name}</p>
                    {billing?.status === 'active' && (
                      <span className="badge-green">Active</span>
                    )}
                    {isOnTrial && <span className="badge-yellow">Trial</span>}
                  </div>
                  <p className="text-sm text-gray-500">{planConfig.price}{planConfig.period}</p>
                  {billing?.nextBillingDate && (
                    <p className="text-xs text-gray-400 mt-1">
                      Next billing: {formatDate(billing.nextBillingDate)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {billing?.customerId && (
                    <button onClick={handleManageBilling} className="btn-secondary">
                      <CreditCard size={14} /> Manage Billing
                    </button>
                  )}
                  {plan.toLowerCase() !== 'pro' && (
                    <button onClick={() => handleUpgrade('Pro')} className="btn-primary">
                      <Zap size={14} /> Upgrade
                    </button>
                  )}
                </div>
              </div>

              {/* Usage bar */}
              {memberLimit && (
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users size={14} className="text-gray-400" />
                      Members used
                    </div>
                    <span className="font-semibold text-gray-900">
                      {memberCount} / {memberLimit}
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${memberPct >= 100 ? 'bg-red-500' : memberPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${memberPct || 0}%` }}
                    />
                  </div>
                  {memberPct >= 80 && (
                    <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={11} />
                      {memberPct >= 100 ? 'Member limit reached — upgrade to add more' : 'Approaching member limit'}
                    </p>
                  )}
                </div>
              )}

              {!memberLimit && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <Check size={14} />
                  Unlimited members on Pro
                </div>
              )}
            </>
          )}
        </div>

        {/* Plan Comparison */}
        <PlanComparison currentPlan={planConfig.name} onUpgrade={handleUpgrade} />

        {/* Invoice History */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="section-title">Invoice History</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="th">Invoice</th>
                <th className="th">Date</th>
                <th className="th">Amount</th>
                <th className="th">Status</th>
                <th className="th text-right">Download</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(5).fill(0).map((__, j) => (
                      <td key={j} className="td"><div className="skeleton h-4 rounded w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="td text-center py-10 text-gray-400">
                    <CreditCard size={28} className="mx-auto mb-2 text-gray-200" />
                    No invoices yet
                  </td>
                </tr>
              ) : invoices.map(inv => (
                <tr key={inv.id} className="table-row">
                  <td className="td font-medium text-gray-900">{inv.description || `Invoice ${inv.id?.slice(0, 8)}`}</td>
                  <td className="td text-gray-500">{formatDate(inv.date)}</td>
                  <td className="td font-semibold text-gray-900">{formatCurrency(inv.amount)}</td>
                  <td className="td">
                    <span className={inv.status === 'paid' ? 'badge-green' : inv.status === 'open' ? 'badge-yellow' : 'badge-gray'}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="td text-right">
                    {inv.pdfUrl && (
                      <a href={inv.pdfUrl} target="_blank" rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors inline-flex">
                        <Download size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
