import React, { useState } from 'react';
import { HardDrive, Calendar, RotateCcw, ShieldAlert, Layers, Lock, ShieldCheck, FileText } from 'lucide-react';
import { BackupAnalysisView } from './BackupAnalysisView';
import { BackupStrategyView } from './BackupStrategyView';
import { RestoreSystemView } from './RestoreSystemView';
import { DisasterRecoveryView } from './DisasterRecoveryView';
import { RedundancyView } from './RedundancyView';
import { BackupSecurityView } from './BackupSecurityView';
import { BackupValidationView } from './BackupValidationView';
import { BackupDocsView } from './BackupDocsView';

type TabId = 'analysis' | 'strategy' | 'restore' | 'dr' | 'redundancy' | 'security' | 'validation' | 'docs';

export const VDP07BackupDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('analysis');

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'analysis', label: 'Phase 01: Analysis', icon: HardDrive },
    { id: 'strategy', label: 'Phase 02: Strategy', icon: Calendar },
    { id: 'restore', label: 'Phase 03: Restore System', icon: RotateCcw },
    { id: 'dr', label: 'Phase 04: Disaster Recovery', icon: ShieldAlert },
    { id: 'redundancy', label: 'Phase 05: Redundancy', icon: Layers },
    { id: 'security', label: 'Phase 06: Security', icon: Lock },
    { id: 'validation', label: 'Phase 07: Validation', icon: ShieldCheck },
    { id: 'docs', label: 'Phase 08: Documentation', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase bg-amber-500 text-slate-950">
                VDP-07 BACKUP & DISASTER RECOVERY
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold">Vertex ERP Ultimate v1.0</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Enterprise Backup & Recovery Engine</h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Unified Desktop, Cloud & Hybrid backup orchestration, AES-256 envelope encryption, sub-second WAL point-in-time recovery, multi-region replication, and automated disaster failover plans.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Recovery Engine</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Disaster Ready / Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-2 scrollbar-none border-b border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'analysis' && <BackupAnalysisView />}
        {activeTab === 'strategy' && <BackupStrategyView />}
        {activeTab === 'restore' && <RestoreSystemView />}
        {activeTab === 'dr' && <DisasterRecoveryView />}
        {activeTab === 'redundancy' && <RedundancyView />}
        {activeTab === 'security' && <BackupSecurityView />}
        {activeTab === 'validation' && <BackupValidationView />}
        {activeTab === 'docs' && <BackupDocsView />}
      </div>
    </div>
  );
};
