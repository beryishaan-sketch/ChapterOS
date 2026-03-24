import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, iconColor = 'text-navy', iconBg = 'bg-navy/8', trend, trendLabel, loading }) => {
  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton w-16 h-5 rounded" />
        </div>
        <div className="skeleton w-20 h-8 rounded mb-1" />
        <div className="skeleton w-32 h-4 rounded" />
      </div>
    );
  }

  const trendConfig = {
    up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    down: { icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50' },
    neutral: { icon: Minus, color: 'text-gray-400', bg: 'bg-gray-100' },
  };

  const trendInfo = trend ? trendConfig[trend] || trendConfig.neutral : null;

  return (
    <div className="card p-5 group active:scale-98 transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
          {Icon && <Icon size={20} className={iconColor} strokeWidth={1.8} />}
        </div>
        {trendInfo && (
          <div className={`flex items-center gap-1 px-2 py-0.5 ${trendInfo.bg} rounded-full`}>
            <trendInfo.icon size={12} className={trendInfo.color} />
            {trendLabel && <span className={`text-xs font-medium ${trendInfo.color}`}>{trendLabel}</span>}
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value ?? '—'}</p>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
