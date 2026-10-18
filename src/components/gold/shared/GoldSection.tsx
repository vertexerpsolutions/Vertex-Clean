import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GoldSectionProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const GoldSection: React.FC<GoldSectionProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = ''
}) => {
  return (
    <div className={`p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                {Icon && <Icon className="w-5 h-5 text-amber-400 shrink-0" />}
                <span>{title}</span>
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
