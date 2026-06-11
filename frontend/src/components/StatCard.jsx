import React from 'react';

const StatCard = ({ title, value, icon, description, trend, trendType = 'neutral' }) => {
  const trendColor = {
    positive: 'text-emerald-600 bg-emerald-50 border-emerald-200/50 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
    negative: 'text-rose-600 bg-rose-50 border-rose-200/50 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20',
    neutral: 'text-slate-600 bg-slate-50 border-slate-200/50 dark:text-slate-400 dark:bg-slate-500/10 dark:border-slate-500/20',
  };

  return (
    <div className="glass-card flex items-start justify-between relative overflow-hidden group hover:border-blue-500/30 dark:hover:border-brand-500/30">
      {/* Decorative Gradient Background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors duration-300 pointer-events-none dark:bg-brand-500/5 dark:group-hover:bg-brand-500/10" />

      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</span>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{value}</span>
        
        {(description || trend) && (
          <div className="flex items-center gap-2 mt-2">
            {trend && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trendColor[trendType]}`}>
                {trend}
              </span>
            )}
            {description && <span className="text-xs text-slate-400 dark:text-slate-500">{description}</span>}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all duration-300 shadow-sm dark:bg-darkBg-850 dark:border-0 dark:text-brand-400 dark:group-hover:bg-brand-500">
        {icon}
      </div>
    </div>
  );
};

export default StatCard;
