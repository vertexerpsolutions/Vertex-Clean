import React, { useState } from 'react';
import { HardDrive, Zap, RefreshCw, Lock, Activity, ShieldCheck, BookOpen, Database } from 'lucide-react';
import { PortableDashboardView } from './PortableDashboardView';
import { PortableStorageView } from './PortableStorageView';
import { ZeroInstallView } from './ZeroInstallView';
import { PortableSyncView } from './PortableSyncView';
import { PortableSecurityView } from './PortableSecurityView';
import { PortableAnalysisView } from './PortableAnalysisView';
import { PortableValidationView } from './PortableValidationView';
import { PortableDocsView } from './PortableDocsView';

export const VDP06PortableDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'storage' | 'zeroinstall' | 'sync' | 'security' | 'analysis' | 'validation' | 'docs'
  >('dashboard');

  const tabs: { id: typeof activeTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Phase 01: Portable Dashboard', icon: HardDrive },
    { id: 'storage', label: 'Phase 02: Storage Volume & Partitioning', icon: Database },
    { id: 'zeroinstall', label: 'Phase 03: Zero-Install Standalone Engine', icon: Zap },
    { id: 'sync', label: 'Phase 04: Local-First Synchronization', icon: RefreshCw },
    { id: 'security', label: 'Phase 05: BitLocker/LUKS Security', icon: Lock },
    { id: 'analysis', label: 'Phase 06: Hardware Telemetry', icon: Activity },
    { id: 'validation', label: 'Phase 07: Storage Integrity', icon: ShieldCheck },
    { id: 'docs', label: 'Phase 08: Portable Documentation', icon: BookOpen },
  ];

  return (
    <div className="space-y-6 p-6 min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Engine Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 uppercase tracking-tight">
                VDP-06: Portable Deployment Engine
              </h1>
              <p className="text-xs text-slate-400">
                Vertex ERP Ultimate v1.0 – Zero-Install Standalone Executable & Encrypted Portable Storage Volume
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>STANDALONE ZERO-INSTALL READY</span>
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 font-mono text-xs shadow-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center space-x-2 ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-lg font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Phase Component View */}
      <div className="transition-all">
        {activeTab === 'dashboard' && <PortableDashboardView />}
        {activeTab === 'storage' && <PortableStorageView />}
        {activeTab === 'zeroinstall' && <ZeroInstallView />}
        {activeTab === 'sync' && <PortableSyncView />}
        {activeTab === 'security' && <PortableSecurityView />}
        {activeTab === 'analysis' && <PortableAnalysisView />}
        {activeTab === 'validation' && <PortableValidationView />}
        {activeTab === 'docs' && <PortableDocsView />}
      </div>
    </div>
  );
};
