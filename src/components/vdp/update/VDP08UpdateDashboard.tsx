import React, { useState } from 'react';
import { RefreshCw, Radio, Download, Cpu, History, ShieldCheck, Clock, FileText } from 'lucide-react';
import { UpdateDashboardView } from './UpdateDashboardView';
import { UpdateChannelsView } from './UpdateChannelsView';
import { UpdateDownloaderView } from './UpdateDownloaderView';
import { PatchInstallerView } from './PatchInstallerView';
import { VersionManagementView } from './VersionManagementView';
import { UpdateSecurityView } from './UpdateSecurityView';
import { UpdateAutomationView } from './UpdateAutomationView';
import { UpdateDocsView } from './UpdateDocsView';

type TabId = 'dashboard' | 'channels' | 'downloader' | 'installer' | 'versions' | 'security' | 'automation' | 'docs';

export const VDP08UpdateDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Phase 01: Dashboard', icon: RefreshCw },
    { id: 'channels', label: 'Phase 02: Channels', icon: Radio },
    { id: 'downloader', label: 'Phase 03: Downloader', icon: Download },
    { id: 'installer', label: 'Phase 04: Patch Installer', icon: Cpu },
    { id: 'versions', label: 'Phase 05: Version History', icon: History },
    { id: 'security', label: 'Phase 06: Security', icon: ShieldCheck },
    { id: 'automation', label: 'Phase 07: Automation', icon: Clock },
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
                VDP-08 UPDATE & PATCH ENGINE
              </span>
              <span className="text-xs text-amber-400 font-mono font-bold">Vertex ERP Ultimate v1.0</span>
            </div>
            <h1 className="text-2xl font-black text-slate-100 tracking-tight">Enterprise Update & Patch Management Engine</h1>
            <p className="text-xs text-slate-400 max-w-2xl">
              Zero-downtime update distribution across Stable/LTS/Beta/Offline channels, multi-threaded downloader, atomic patch installer with pre-patch backups, RSA-4096 signature security, and automated maintenance windows.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase">Update Engine</div>
              <div className="text-xs font-bold text-emerald-400 flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active & Protected</span>
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
        {activeTab === 'dashboard' && <UpdateDashboardView />}
        {activeTab === 'channels' && <UpdateChannelsView />}
        {activeTab === 'downloader' && <UpdateDownloaderView />}
        {activeTab === 'installer' && <PatchInstallerView />}
        {activeTab === 'versions' && <VersionManagementView />}
        {activeTab === 'security' && <UpdateSecurityView />}
        {activeTab === 'automation' && <UpdateAutomationView />}
        {activeTab === 'docs' && <UpdateDocsView />}
      </div>
    </div>
  );
};
