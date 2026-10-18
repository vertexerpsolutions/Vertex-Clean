import React, { useState } from 'react';
import { 
  Server, 
  Activity, 
  Layers, 
  Settings, 
  Sliders, 
  HardDrive, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  Sparkles,
  Terminal
} from 'lucide-react';
import { DeploymentAnalysisView } from './DeploymentAnalysisView';
import { DecoupledLayersView } from './DecoupledLayersView';
import { DeploymentProfilesView } from './DeploymentProfilesView';
import { EnvironmentManagerView } from './EnvironmentManagerView';
import { InfrastructureView } from './InfrastructureView';
import { ValidationReportView } from './ValidationReportView';
import { DeploymentDocsView } from './DeploymentDocsView';
import { deploymentService } from '../../services/deploymentService';

export const VDP01DeploymentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'phase01' | 'phase02' | 'phase03' | 'phase04' | 'phase05' | 'phase06' | 'phase07'
  >('phase01');

  const activeProfile = deploymentService.getActiveProfile();

  return (
    <div className="space-y-6">
      {/* Top Main Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase">
              VDP-01 DEPLOYMENT ARCHITECTURE
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              RELEASE CANDIDATE (RC1)
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 uppercase">
              DESKTOP • CLOUD • HYBRID
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center space-x-3">
            <Server className="w-7 h-7 text-amber-400 shrink-0" />
            <span>Vertex ERP Deployment Architecture</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Production deployment suite preparing Vertex ERP Ultimate across Desktop, Cloud, and Hybrid environments with zero modifications to business layer modules or Gold features.
          </p>
        </div>

        {/* Status Pill */}
        <div className="px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-400 font-semibold">ACTIVE PROFILE</div>
            <div className="text-xs font-bold text-slate-100 font-mono">{activeProfile.name}</div>
            <div className="text-[10px] text-emerald-400 font-mono">VDP-01 Completed</div>
          </div>
        </div>
      </div>

      {/* Navigation Phase Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto bg-slate-900 p-2 rounded-2xl border border-slate-800 custom-scrollbar">
        {[
          { id: 'phase01', label: '01: Analysis', icon: Activity },
          { id: 'phase02', label: '02: 5 Tiers', icon: Layers },
          { id: 'phase03', label: '03: Profiles', icon: Settings },
          { id: 'phase04', label: '04: Env & Secrets', icon: Sliders },
          { id: 'phase05', label: '05: Infrastructure', icon: HardDrive },
          { id: 'phase06', label: '06: Validation', icon: ShieldCheck },
          { id: 'phase07', label: '07: Documentation', icon: BookOpen },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Phase Content */}
      <div className="pt-2">
        {activeTab === 'phase01' && <DeploymentAnalysisView />}
        {activeTab === 'phase02' && <DecoupledLayersView />}
        {activeTab === 'phase03' && <DeploymentProfilesView />}
        {activeTab === 'phase04' && <EnvironmentManagerView />}
        {activeTab === 'phase05' && <InfrastructureView />}
        {activeTab === 'phase06' && <ValidationReportView />}
        {activeTab === 'phase07' && <DeploymentDocsView />}
      </div>
    </div>
  );
};
