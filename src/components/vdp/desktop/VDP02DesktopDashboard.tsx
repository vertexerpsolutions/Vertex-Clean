import React, { useState } from 'react';
import {
  Monitor,
  Layout,
  HardDrive,
  WifiOff,
  Printer,
  ShieldCheck,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { DesktopAnalysisView } from './DesktopAnalysisView';
import { DesktopPlatformView } from './DesktopPlatformView';
import { LocalStorageView } from './LocalStorageView';
import { OfflineModeView } from './OfflineModeView';
import { DesktopServicesView } from './DesktopServicesView';
import { DesktopSecurityView } from './DesktopSecurityView';
import { DesktopValidationView } from './DesktopValidationView';
import { DesktopDocsView } from './DesktopDocsView';

export const VDP02DesktopDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'phase01' | 'phase02' | 'phase03' | 'phase04' | 'phase05' | 'phase06' | 'phase07' | 'phase08'
  >('phase01');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase">
              VDP-02 DESKTOP EDITION
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              RELEASED & VERIFIED
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase">
              WINDOWS WORKSTATION
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Monitor className="w-7 h-7 text-cyan-400 shrink-0" />
            <span>Vertex ERP Desktop Edition</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Offline-first Windows Desktop platform featuring encrypted SQLite vault, native spooler printing, DPAPI key protection, and automated background transaction reconciliation.
          </p>
        </div>

        {/* Status Pill */}
        <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 font-semibold">EDITION STATUS</div>
            <div className="text-xs font-bold text-slate-100 font-mono">Windows x64 Native</div>
            <div className="text-[10px] text-emerald-400 font-mono">VDP-02 Completed</div>
          </div>
        </div>
      </div>

      {/* Phase Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto bg-slate-900 p-2 rounded-2xl border border-slate-800 custom-scrollbar">
        {[
          { id: 'phase01', label: '01: Analysis', icon: Monitor },
          { id: 'phase02', label: '02: Platform', icon: Layout },
          { id: 'phase03', label: '03: Local Storage', icon: HardDrive },
          { id: 'phase04', label: '04: Offline Mode', icon: WifiOff },
          { id: 'phase05', label: '05: Hardware Services', icon: Printer },
          { id: 'phase06', label: '06: Security', icon: ShieldCheck },
          { id: 'phase07', label: '07: Validation', icon: CheckCircle2 },
          { id: 'phase08', label: '08: Documentation', icon: BookOpen },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active View */}
      <div className="pt-2">
        {activeTab === 'phase01' && <DesktopAnalysisView />}
        {activeTab === 'phase02' && <DesktopPlatformView />}
        {activeTab === 'phase03' && <LocalStorageView />}
        {activeTab === 'phase04' && <OfflineModeView />}
        {activeTab === 'phase05' && <DesktopServicesView />}
        {activeTab === 'phase06' && <DesktopSecurityView />}
        {activeTab === 'phase07' && <DesktopValidationView />}
        {activeTab === 'phase08' && <DesktopDocsView />}
      </div>
    </div>
  );
};
