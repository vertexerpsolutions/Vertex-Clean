import React from 'react';

interface GoldStatusBadgeProps {
  status: 'completed' | 'active' | 'pending' | 'warning' | 'error' | string;
  label?: string;
  className?: string;
}

export const GoldStatusBadge: React.FC<GoldStatusBadgeProps> = ({ status, label, className = '' }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  if (status === 'completed' || status === 'active' || status === 'success') {
    badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  } else if (status === 'warning' || status === 'pending') {
    badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  } else if (status === 'error' || status === 'critical') {
    badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  }

  return (
    <span
      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border uppercase tracking-wider ${badgeStyle} ${className}`}
    >
      {label || status}
    </span>
  );
};
