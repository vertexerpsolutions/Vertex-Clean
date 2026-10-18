import React, { useState } from 'react';
import { 
  Laptop, 
  Cloud, 
  Network, 
  CheckCircle2, 
  ShieldCheck, 
  Settings, 
  Database, 
  Radio, 
  Lock, 
  Terminal,
  Zap
} from 'lucide-react';
import { deploymentService } from '../../services/deploymentService';
import { DeploymentEdition, EnvironmentProfile, DeploymentProfileConfig } from '../../core/deployment/DeploymentTypes';

export const DeploymentProfilesView: React.FC = () => {
  const [profiles, setProfiles] = useState<DeploymentProfileConfig[]>(() => deploymentService.getAllProfiles());
  const [activeProfile, setActiveProfile] = useState<DeploymentProfileConfig>(() => deploymentService.getActiveProfile());

  const handleSelectProfile = (id: string) => {
    const updated = deploymentService.setActiveProfile(id);
    setActiveProfile(updated);
    setProfiles(deploymentService.getAllProfiles());
  };

  const handleEditionSwitch = (edition: DeploymentEdition) => {
    const updated = deploymentService.switchEdition(edition);
    setActiveProfile(updated);
    setProfiles(deploymentService.getAllProfiles());
  };

  const handleEnvironmentSwitch = (env: EnvironmentProfile) => {
    const updated = deploymentService.switchEnvironment(env);
    setActiveProfile(updated);
    setProfiles(deploymentService.getAllProfiles());
  };

  return (
    <div className="space-y-6">
      {/* Top Selector Quick Controls */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
              PHASE 03: DEPLOYMENT PROFILES
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">Select Architecture Edition &amp; Stage</h2>
            <p className="text-xs text-slate-400">
              Switch deployment target profiles without modifying any ERP core business modules.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-mono">Active Profile:</span>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {activeProfile.name}
            </span>
          </div>
        </div>

        {/* Edition Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleEditionSwitch('desktop')}
            className={`p-4 rounded-xl border transition-all text-left flex items-start space-x-3 ${
              activeProfile.edition === 'desktop'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-md shadow-amber-950/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Laptop className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold font-mono">Desktop Edition</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Offline-first SQLite WAL package</div>
            </div>
          </button>

          <button
            onClick={() => handleEditionSwitch('cloud')}
            className={`p-4 rounded-xl border transition-all text-left flex items-start space-x-3 ${
              activeProfile.edition === 'cloud'
                ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200 shadow-md shadow-indigo-950/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Cloud className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold font-mono">Cloud Edition</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Clustered Cloud Run / PostgreSQL</div>
            </div>
          </button>

          <button
            onClick={() => handleEditionSwitch('hybrid')}
            className={`p-4 rounded-xl border transition-all text-left flex items-start space-x-3 ${
              activeProfile.edition === 'hybrid'
                ? 'bg-purple-500/10 border-purple-500/40 text-purple-200 shadow-md shadow-purple-950/40'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Network className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold font-mono">Hybrid Edition</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Edge branch gateway + Cloud sync</div>
            </div>
          </button>
        </div>

        {/* Environment Stage Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
          <span className="text-xs font-mono text-slate-400 shrink-0">Stage Environment:</span>
          {(['development', 'testing', 'production'] as EnvironmentProfile[]).map(env => (
            <button
              key={env}
              onClick={() => handleEnvironmentSwitch(env)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all uppercase ${
                activeProfile.environment === env
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {env}
            </button>
          ))}
        </div>
      </div>

      {/* Profiles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profiles.map(prof => {
          const isSelected = prof.id === activeProfile.id;
          return (
            <div
              key={prof.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-xl'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-100">{prof.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-950 border border-slate-800 text-slate-300">
                      {prof.environment}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{prof.description}</p>
                </div>

                <button
                  onClick={() => handleSelectProfile(prof.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 cursor-default'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  {isSelected ? '✓ ACTIVE' : 'ACTIVATE'}
                </button>
              </div>

              {/* Technical Specifications preview */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 pt-2 border-t border-slate-800">
                <div className="p-2 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-between">
                  <span className="text-slate-400">Database:</span>
                  <span className="text-amber-300 truncate max-w-[110px]" title={prof.infrastructure.cloudHosting.databaseCluster}>
                    {prof.edition === 'desktop' ? prof.infrastructure.desktopInstallation.databaseEngine : prof.infrastructure.cloudHosting.databaseCluster}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-between">
                  <span className="text-slate-400">Ingress:</span>
                  <span className="text-emerald-400">
                    Port {prof.infrastructure.apiHosting.port}
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-between">
                  <span className="text-slate-400">Workers:</span>
                  <span className="text-indigo-400">
                    {prof.infrastructure.backgroundServices.workerCount} Concurrent
                  </span>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800/60 flex items-center justify-between">
                  <span className="text-slate-400">SSL / TLS:</span>
                  <span className={prof.productionSettings.sslEnforced ? 'text-emerald-400' : 'text-slate-500'}>
                    {prof.productionSettings.sslEnforced ? 'Enforced' : 'Optional'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
