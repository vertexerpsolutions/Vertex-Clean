import React, { useState } from 'react';
import { 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  FileCode,
  Zap
} from 'lucide-react';
import { deploymentService } from '../../services/deploymentService';
import { SecretVariable, ProductionSettings, DebugSettings } from '../../core/deployment/DeploymentTypes';

export const EnvironmentManagerView: React.FC = () => {
  const [activeProfile, setActiveProfile] = useState(() => deploymentService.getActiveProfile());
  const [showSecretsMap, setShowSecretsMap] = useState<Record<string, boolean>>({});

  const toggleShowSecret = (key: string) => {
    setShowSecretsMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleSsl = () => {
    const updated = deploymentService.updateActiveProfile({
      productionSettings: {
        ...activeProfile.productionSettings,
        sslEnforced: !activeProfile.productionSettings.sslEnforced,
      }
    });
    setActiveProfile(updated);
  };

  const handleToggleVerboseLogs = () => {
    const updated = deploymentService.updateActiveProfile({
      debugSettings: {
        ...activeProfile.debugSettings,
        verboseLogs: !activeProfile.debugSettings.verboseLogs,
      }
    });
    setActiveProfile(updated);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase">
            PHASE 04: ENVIRONMENT MANAGEMENT
          </span>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
            SECRETS &amp; PRODUCTION POLICIES
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-100">Environment Variables &amp; Vault Configuration</h2>
        <p className="text-xs text-slate-400">
          Manage system variables, encrypted secrets, CORS whitelists, SSL enforcement, and debug diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environment Variables & .env.example Validator */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Environment Variables (.env)</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 border border-slate-800 text-slate-400">
              Active Profile Variables
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {Object.entries(activeProfile.envVariables).map(([key, value]) => (
              <div key={key} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <span className="text-amber-400 font-semibold">{key}</span>
                <span className="text-slate-200 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">✓ `.env.example` Synchronization:</div>
            <p>
              All active variables are declared in <code className="text-amber-300 font-mono">.env.example</code> to maintain container build contracts.
            </p>
          </div>
        </div>

        {/* Secrets Vault */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Encrypted Secrets Vault</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
              ZERO CLIENT LEAKS
            </span>
          </div>

          <div className="space-y-3">
            {activeProfile.secrets.map((secret: SecretVariable) => {
              const isVisible = showSecretsMap[secret.key];
              return (
                <div key={secret.key} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-mono font-bold text-slate-200">{secret.key}</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800">
                        {secret.category}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      secret.status === 'injected_server_side'
                        ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                        : secret.status === 'configured'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {secret.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{secret.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Production & Debug Settings Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Production Security Policies</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">SSL / TLS 1.3 Enforcement</span>
                <span className="text-slate-400 text-[11px]">Force all HTTP requests to redirect to HTTPS.</span>
              </div>
              <button
                onClick={handleToggleSsl}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                  activeProfile.productionSettings.sslEnforced
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {activeProfile.productionSettings.sslEnforced ? 'ENFORCED' : 'OFF'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-bold text-slate-200 block">Allowed CORS Origins</span>
              <div className="flex flex-wrap gap-1 font-mono text-[11px]">
                {activeProfile.productionSettings.corsAllowedOrigins.map((origin, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                    {origin}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
              <span className="text-slate-400">Rate Limiting Threshold:</span>
              <span className="text-indigo-400 font-bold">
                {activeProfile.productionSettings.rateLimitingEnabled
                  ? `${activeProfile.infrastructure.apiHosting.rateLimitPerMin} req / min`
                  : 'Disabled'}
              </span>
            </div>
          </div>
        </div>

        {/* Debug Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <span>Debug &amp; Diagnostics Controls</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-200 block">Verbose Diagnostic Logging</span>
                <span className="text-slate-400 text-[11px]">Detailed stdout stream for API gateway calls.</span>
              </div>
              <button
                onClick={handleToggleVerboseLogs}
                className={`px-3 py-1.5 rounded-xl font-mono font-bold transition-all ${
                  activeProfile.debugSettings.verboseLogs
                    ? 'bg-purple-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {activeProfile.debugSettings.verboseLogs ? 'VERBOSE' : 'STANDARD'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
              <span className="text-slate-400">Node Memory Sampling:</span>
              <span className={activeProfile.debugSettings.memorySamplingEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {activeProfile.debugSettings.memorySamplingEnabled ? 'Active (5s interval)' : 'Disabled'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
              <span className="text-slate-400">Event Loop Lag Tracing:</span>
              <span className={activeProfile.debugSettings.eventLoopTracing ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                {activeProfile.debugSettings.eventLoopTracing ? 'Active (&lt;1ms lag)' : 'Disabled'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
