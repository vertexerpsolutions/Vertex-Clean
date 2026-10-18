import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw, Activity, Cpu } from 'lucide-react';
import { configService } from '../../../services/configService';
import { ConfigValidationResult } from '../../../core/config/ConfigTypes';

export const ConfigValidationView: React.FC = () => {
  const [valResult, setValResult] = useState<ConfigValidationResult>(() => configService.validateConfiguration());
  const [validating, setValidating] = useState(false);

  const handleRunValidation = () => {
    setValidating(true);
    setTimeout(() => {
      setValResult(configService.validateConfiguration());
      setValidating(false);
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 05: Configuration Validator & Dependency Checker</h2>
              <p className="text-xs text-slate-400">Automated missing key detection, schema integrity, dependency checks, and health scoring</p>
            </div>
          </div>

          <button
            onClick={handleRunValidation}
            disabled={validating}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${validating ? 'animate-spin' : ''}`} />
            <span>Run Validation Check</span>
          </button>
        </div>

        {/* Health Score Banner */}
        <div className="mt-6 p-6 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono">
          <div className="space-y-1">
            <div className="text-xs text-slate-500 uppercase">Configuration Health Score</div>
            <div className="text-3xl font-black text-emerald-400">{valResult.healthScore}%</div>
            <p className="text-xs text-slate-400">Validation Timestamp: {new Date(valResult.validationTimestamp).toLocaleTimeString()}</p>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status: {valResult.isValid ? 'PASSED & HEALTHY' : 'ERRORS DETECTED'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Keys & Deprecated Keys Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Missing Key Detection ({valResult.missingKeys.length})</span>
          </h3>
          {valResult.missingKeys.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 text-xs">
              ✓ All required application and infrastructure environment keys are present and set.
            </div>
          ) : (
            <div className="space-y-2">
              {valResult.missingKeys.map((mk) => (
                <div key={mk} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
                  Missing required variable: <span className="font-bold">{mk}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Deprecated Variables Detection ({valResult.deprecatedKeys.length})</span>
          </h3>
          <div className="space-y-2">
            {valResult.deprecatedKeys.map((dk) => (
              <div key={dk} className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Deprecated key flagged: <span className="font-bold">{dk}</span> (Scheduled for removal in v1.1)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dependency Checker Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">System Service Dependency Checks</h3>

        <div className="space-y-3">
          {valResult.dependencyChecks.map((dc) => (
            <div key={dc.serviceName} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-100">{dc.serviceName}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {dc.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{dc.message}</p>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-500">Required Variables:</div>
                <div className="flex space-x-1 mt-1">
                  {dc.requiredVars.map((rv) => (
                    <span key={rv} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                      {rv}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
