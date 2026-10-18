import React, { useState } from 'react';
import { Radio, RefreshCw, AlertTriangle, ShieldCheck, ToggleLeft, ToggleRight, Wrench } from 'lucide-react';
import { configService } from '../../../services/configService';
import { RuntimeState, FeatureFlagItem } from '../../../core/config/ConfigTypes';

export const RuntimeManagementView: React.FC = () => {
  const [runtimeState, setRuntimeState] = useState<RuntimeState>(() => configService.getRuntimeState());
  const [maintReason, setMaintReason] = useState('');

  const handleToggleMaintenance = () => {
    configService.toggleMaintenanceMode(maintReason);
    setRuntimeState({ ...configService.getRuntimeState() });
  };

  const handleToggleFlag = (key: string) => {
    configService.toggleFeatureFlag(key);
    setRuntimeState({ ...configService.getRuntimeState() });
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 07: Runtime Management & Feature Flag Engine</h2>
            <p className="text-xs text-slate-400">Zero-downtime hot reload configuration, restart pending detection, runtime overrides, feature flags, and maintenance mode</p>
          </div>
        </div>

        {/* Runtime Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Hot Reload Engine</div>
            <div className="text-sm font-extrabold text-emerald-400">
              {runtimeState.hotReloadEnabled ? 'ACTIVE (Zero-Downtime)' : 'DISABLED'}
            </div>
            <div className="text-[10px] text-slate-400">In-Memory Bus Invalidation</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Restart Required Detection</div>
            <div className={`text-sm font-extrabold ${runtimeState.restartPending ? 'text-amber-400' : 'text-slate-400'}`}>
              {runtimeState.restartPending ? `${runtimeState.pendingRestartKeys.length} Pending Keys` : 'NO RESTART NEEDED'}
            </div>
            <div className="text-[10px] text-slate-400">Process Signals Clean</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Maintenance Mode</div>
            <div className={`text-sm font-extrabold ${runtimeState.maintenanceMode ? 'text-rose-400' : 'text-emerald-400'}`}>
              {runtimeState.maintenanceMode ? 'ACTIVE (BLOCKING NON-ADMIN)' : 'ONLINE'}
            </div>
            <div className="text-[10px] text-slate-400">Ingress Circuit Breaker</div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode Toggle Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-rose-400" />
          <span>Platform Maintenance Mode Switch</span>
        </h3>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-bold text-slate-100">Toggle Maintenance Mode Status</span>
              <p className="text-[11px] text-slate-400">When enabled, non-administrator HTTP requests will receive 503 Maintenance Mode status page.</p>
            </div>

            <button
              onClick={handleToggleMaintenance}
              className={`px-5 py-2 rounded-xl font-bold transition-all shrink-0 ${
                runtimeState.maintenanceMode
                  ? 'bg-rose-500 hover:bg-rose-400 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {runtimeState.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
            </button>
          </div>

          {runtimeState.maintenanceMode && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              Maintenance Reason: <span className="font-bold">{runtimeState.maintenanceReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Feature Flags Manager */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Live Feature Flags ({runtimeState.featureFlags.length})</h3>

        <div className="space-y-3">
          {runtimeState.featureFlags.map((flag) => (
            <div key={flag.key} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{flag.name}</span>
                  <span className="text-slate-500 text-[10px]">({flag.key})</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    flag.enabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {flag.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{flag.description}</p>
                <div className="flex space-x-1 mt-1">
                  {flag.targetEnvironments.map((e) => (
                    <span key={e} className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[9px] uppercase">
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleToggleFlag(flag.key)}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-1 transition-all ${
                    flag.enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {flag.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  <span>{flag.enabled ? 'Enabled' : 'Disabled'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
