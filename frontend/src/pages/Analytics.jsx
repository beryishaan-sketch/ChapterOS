import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Star, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';
import client from '../api/client';

const StatCard = ({ icon: Icon, label, value, sub, color = 'bg-navy', trend }) => (
  <div className="card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={18} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const ProgressBar = ({ label, value, max, color = 'bg-navy' }) => {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{value} / {max} <span className="text-gray-400">({pct}%)</span></span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [members, setMembers] = useState([]);
  const [pnms, setPnms] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      client.get('/dashboard/stats').catch(() => ({ data: { data: {} } })),
      client.get('/members').catch(() => ({ data: { data: [] } })),
      client.get('/pnms').catch(() => ({ data: { data: [] } })),
      client.get('/events').catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, membersRes, pnmsRes, eventsRes]) => {
      setData(statsRes.data.data || {});
      setMembers(membersRes.data.data || []);
      setPnms(pnmsRes.data.data || []);
      setEvents(eventsRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-2xl mx-auto lg:max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[1,2,3,4].map(i => <div key={i} className="card p-5"><div className="skeleton h-20 rounded" /></div>)}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        {[1,2].map(i => <div key={i} className="card p-6"><div className="skeleton h-48 rounded" /></div>)}
      </div>
    </div>
  );

  // Recruitment funnel
  const stages = ['invited','met','liked','bid','pledged'];
  const stageCounts = stages.map(s => ({ stage: s, count: pnms.filter(p => p.stage === s).length }));
  const totalPnms = pnms.length;

  // Member breakdown
  const roleBreakdown = [
    { label: 'Admins', value: members.filter(m => m.role === 'admin').length, color: 'bg-gold' },
    { label: 'Officers', value: members.filter(m => m.role === 'officer').length, color: 'bg-navy' },
    { label: 'Members', value: members.filter(m => m.role === 'member').length, color: 'bg-blue-400' },
    { label: 'Alumni', value: members.filter(m => m.role === 'alumni').length, color: 'bg-purple-400' },
  ];
  const totalMembers = members.length;

  // Academic
  const withGpa = members.filter(m => m.gpa);
  const avgGpa = withGpa.length > 0 ? (withGpa.reduce((s, m) => s + m.gpa, 0) / withGpa.length).toFixed(2) : null;
  const onProbation = members.filter(m => m.onProbation).length;
  const totalStudyHours = members.reduce((s, m) => s + (m.studyHours || 0), 0);

  // Events
  const now = new Date();
  const upcoming = events.filter(e => new Date(e.date) >= now).length;
  const past = events.filter(e => new Date(e.date) < now).length;

  const stageLabel = { invited: 'Invited', met: 'Met', liked: 'Liked', bid: 'Bid', pledged: 'Pledged' };
  const stageColor = { invited: 'bg-gray-400', met: 'bg-blue-400', liked: 'bg-purple-400', bid: 'bg-gold', pledged: 'bg-emerald-500' };

  return (
    <div className="max-w-2xl mx-auto lg:max-w-5xl">
      <div className="page-header">
        <h1 className="page-title">Chapter Analytics</h1>
        <p className="page-subtitle">At-a-glance stats on your chapter's health</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Members" value={totalMembers} sub={`${members.filter(m => m.role !== 'alumni').length} active`} color="bg-navy" />
        <StatCard icon={DollarSign} label="Dues Collected" value={`$${(data?.duesCollected || 0).toLocaleString()}`} sub={`${data?.duesRate || 0}% collection rate`} color="bg-emerald-500" />
        <StatCard icon={Star} label="Active PNMs" value={data?.activePNMs || pnms.filter(p => !['pledged','dropped'].includes(p.stage)).length} sub={`${pnms.filter(p => p.stage === 'pledged').length} pledged`} color="bg-purple-500" />
        <StatCard icon={Calendar} label="Upcoming Events" value={upcoming} sub={`${past} past events`} color="bg-blue-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Recruitment Funnel */}
        <div className="card p-6">
          <h2 className="section-title mb-5">Recruitment Funnel</h2>
          {totalPnms === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Star size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No PNMs added yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {stageCounts.map(({ stage, count }) => (
                <ProgressBar key={stage} label={stageLabel[stage]} value={count} max={totalPnms} color={stageColor[stage]} />
              ))}
              <div className="pt-3 border-t border-gray-100 mt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Conversion rate (bid → pledged)</span>
                  <span className="font-semibold text-gray-900">
                    {stageCounts[3].count > 0 ? Math.round((stageCounts[4].count / stageCounts[3].count) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Member Breakdown */}
        <div className="card p-6">
          <h2 className="section-title mb-5">Member Breakdown</h2>
          {totalMembers === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No members yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {roleBreakdown.map(({ label, value, color }) => (
                <ProgressBar key={label} label={label} value={value} max={totalMembers} color={color} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Academic */}
        <div className="card p-6">
          <h2 className="section-title mb-5">Academic Standing</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                <span className="text-sm text-gray-700">Chapter GPA</span>
              </div>
              <span className="font-bold text-gray-900">{avgGpa || '—'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-gray-700">Total Study Hours Logged</span>
              </div>
              <span className="font-bold text-gray-900">{totalStudyHours}h</span>
            </div>
            <div className={`flex items-center justify-between p-3 rounded-lg ${onProbation > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className={onProbation > 0 ? 'text-red-500' : 'text-gray-400'} />
                <span className="text-sm text-gray-700">On Academic Probation</span>
              </div>
              <span className={`font-bold ${onProbation > 0 ? 'text-red-600' : 'text-gray-900'}`}>{onProbation}</span>
            </div>
          </div>
        </div>

        {/* Event breakdown */}
        <div className="card p-6">
          <h2 className="section-title mb-5">Events Overview</h2>
          <div className="space-y-4">
            {['mixer','formal','philanthropy','meeting','rush','other'].map(type => {
              const count = events.filter(e => e.type === type).length;
              if (count === 0) return null;
              return (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                  <span className="font-bold text-gray-900">{count} event{count !== 1 ? 's' : ''}</span>
                </div>
              );
            })}
            {events.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Calendar size={24} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No events yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
