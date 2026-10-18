import React, { useState } from 'react';
import { Server, Activity, Cpu, ShieldCheck, Database, Key, Globe, CheckCircle2, RefreshCw } from 'lucide-react';
import { configService } from '../../../services/configService';
import { EnvironmentInfo, SystemVariable } from '../../../core/config/ConfigTypes';

export const EnvironmentDashboardView: React.FC = () => {
  const [envInfo, setEnvInfo] = useState<EnvironmentInfo>(() => configService.getEnvironmentInfo());
  const [variables, setVariables] = useState<SystemVariable[]>(() => configService.getSystemVariables());

  return (
    <div className="space-y-6 font-sans">
      {/* Active Environment Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-slate-100">{envInfo.activeProfileName}</h2>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <Activity className="w-3.5 h-3.5" />
              <span>{envInfo.status}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Active Environment: <span className="text-amber-400 font-bold uppercase">{envInfo.currentEnvironment}</span> | Region: <span className="text-cyan-400">{envInfo.cloudRegion}</span> ({envInfo.clusterId})
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase">Config Health Score</div>
            <div className="text-lg font-black text-emerald-400">{envInfo.healthScorePercentage}%</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Runtime Environment</div>
          <div className="text-lg font-bold text-slate-100 mt-1">{envInfo.nodeVersion}</div>
          <div className="text-[10px] text-slate-400 truncate">{envInfo.osArchitecture}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Memory Footprint</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">{envInfo.memoryUsageMb} MB</div>
          <div className="text-[10px] text-slate-400">Heap Allocated</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Configured Variables</div>
          <div className="text-lg font-bold text-amber-400 mt-1">{envInfo.totalVariablesCount} Active Keys</div>
          <div className="text-[10px] text-slate-400">Vault & Environment</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Process Uptime</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{(envInfo.uptimeSeconds / 86400).toFixed(1)} Days</div>
          <div className="text-[10px] text-slate-400">Continuous Running</div>
        </div>
      </div>

      {/* Primary Configuration Preview */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase">Active Core Configuration Variables ({variables.length})</h3>
          <span className="text-[10px] text-slate-500">Live Process Overrides Active</span>
        </div>

        <div className="space-y-2">
          {variables.map((v) => (
            <div
              key={v.key}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{v.key}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-800 text-slate-400">
                    {v.category}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {v.source}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{v.description}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono text-slate-200 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 block text-xs">
                  {v.isSecret ? '••••••••••••••••••••' : v.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
