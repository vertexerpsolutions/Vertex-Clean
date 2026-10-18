import React, { useState } from 'react';
import { Layers, Cpu, RefreshCw, Wifi, ShieldCheck, Lock, Play, FileText, Server } from 'lucide-react';
import { HybridAnalysisView } from './HybridAnalysisView';
import { HybridArchitectureView } from './HybridArchitectureView';
import { SynchronizationView } from './SynchronizationView';
import { ConnectivityModeView } from './ConnectivityModeView';
import { DataConsistencyView } from './DataConsistencyView';
import { HybridSecurityView } from './HybridSecurityView';
import { HybridValidationView } from './HybridValidationView';
import { HybridDocsView } from './HybridDocsView';

type TabId = 'analysis' | 'architecture' | 'sync' | 'connectivity' | 'consistency' | 'security' | 'validation' | 'docs';

export const VDP04HybridDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('analysis');

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'analysis', label: 'Phase 01: Analysis', icon: Layers },
    { id: 'architecture', label: 'Phase 02: Architecture', icon: Cpu },
    { id: 'sync', label: 'Phase 03: Sync Engine', icon: RefreshCw },
    { id: 'connectivity', label: 'Phase 04: Connectivity', icon: Wifi },
    { id: 'consistency', label: 'Phase 05: Data Consistency', icon: ShieldCheck },
    { id: 'security', label: 'Phase 06: Security', icon: Lock },
    { id: 'validation', label: 'Phase 07: Validation', icon: Play },
    { id: 'docs', label: 'Phase 08: Documentation', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase bg-purple-500 text-slate-950">
                VDP-04 HYBRID EDITION
              </span>
              <span className="text-xs text-purple-400 font-mono font-bold">Vertex ERP Ultimate v1.0</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Unified Enterprise Hybrid Engine</h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Fusing Desktop local execution and Cloud multi-tenant scale with real-time incremental synchronization and zero-loss offline continuity.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Engine Status</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Hybrid Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
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
                  ? 'bg-purple-500 text-slate-950 font-extrabold shadow-lg shadow-purple-500/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'analysis' && <HybridAnalysisView />}
        {activeTab === 'architecture' && <HybridArchitectureView />}
        {activeTab === 'sync' && <SynchronizationView />}
        {activeTab === 'connectivity' && <ConnectivityModeView />}
        {activeTab === 'consistency' && <DataConsistencyView />}
        {activeTab === 'security' && <HybridSecurityView />}
        {activeTab === 'validation' && <HybridValidationView />}
        {activeTab === 'docs' && <HybridDocsView />}
      </div>
    </div>
  );
};
