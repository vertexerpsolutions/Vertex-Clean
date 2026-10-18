import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PhaseTab {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: string | number;
}

interface PhaseNavigatorProps {
  tabs: PhaseTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const PhaseNavigator: React.FC<PhaseNavigatorProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ''
}) => {
  return (
    <div
      className={`pt-4 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto custom-scrollbar ${className}`}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              isActive
                ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-slate-950 text-amber-400 font-bold'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
