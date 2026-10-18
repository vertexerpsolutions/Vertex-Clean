import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatItem {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'amber' | 'emerald' | 'rose' | 'indigo';
}

interface GoldStatisticsProps {
  stats: StatItem[];
  columns?: number;
}

export const GoldStatistics: React.FC<GoldStatisticsProps> = ({ stats, columns = 4 }) => {
  const gridColsClass =
    columns === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridColsClass} gap-4`}>
      {stats.map((item, idx) => {
        const Icon = item.icon;
        const variant = item.variant || 'default';

        const borderColor =
          variant === 'amber'
            ? 'border-amber-500/30 text-amber-400'
            : variant === 'emerald'
            ? 'border-emerald-500/30 text-emerald-400'
            : variant === 'rose'
            ? 'border-rose-500/30 text-rose-400'
            : variant === 'indigo'
            ? 'border-indigo-500/30 text-indigo-400'
            : 'border-slate-800 text-slate-100';

        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl bg-slate-900 border ${borderColor} shadow-xl space-y-1 relative overflow-hidden`}
          >
            {Icon && (
              <div className="absolute top-4 right-4 opacity-10">
                <Icon className="w-10 h-10" />
              </div>
            )}
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
              {item.label}
            </span>
            <p className="text-2xl font-black font-mono">{item.value}</p>
            {item.subtext && <p className="text-[10px] text-slate-400">{item.subtext}</p>}
          </div>
        );
      })}
    </div>
  );
};
