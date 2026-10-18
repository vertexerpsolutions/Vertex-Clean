import React from 'react';
import { LucideIcon, CheckCircle2, ShieldCheck, Award } from 'lucide-react';

interface GoldHeaderProps {
  code: string;
  title: string;
  description: string;
  version?: string;
  isCompleted?: boolean;
  icon?: LucideIcon;
  actions?: React.ReactNode;
}

export const GoldHeader: React.FC<GoldHeaderProps> = ({
  code,
  title,
  description,
  version = '1.0.0',
  isCompleted = true,
  icon: Icon = ShieldCheck,
  actions
}) => {
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Icon className="w-48 h-48 text-amber-400" />
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
              {code}
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                isCompleted
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isCompleted ? `${code} COMPLETED` : 'IN PROGRESS'}</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">v{version}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>

        {actions && (
          <div className="flex items-center space-x-3 shrink-0 relative z-10">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
