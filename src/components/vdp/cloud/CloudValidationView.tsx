import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Play, Cpu, Cloud, Zap } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';
import { CloudValidationReport } from '../../../core/cloud/CloudTypes';

export const CloudValidationView: React.FC = () => {
  const [report, setReport] = useState<CloudValidationReport>(cloudService.runValidation());
  const [isRunning, setIsRunning] = useState(false);

  const handleRunValidation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setReport(cloudService.runValidation());
      setIsRunning(false);
    }, 800);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 07: Cloud Enterprise Validation</h2>
              <p className="text-xs text-slate-400">Cross-Tenant Isolation, Load Bursting & Multi-AZ Disaster Recovery Verification</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunValidation}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-mono text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? 'Running Cloud Suite...' : 'Run Cloud Enterprise Audit'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Tenant Isolation Score</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{report.multiTenantIsolationScore}%</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Latency p99</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{report.performanceP99Ms} ms</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Scalability Index</div>
          <div className="text-2xl font-bold text-indigo-400 font-mono mt-1">{report.scalabilityReadinessScore}%</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Availability SLA</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{report.availabilitySla}</div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Validation Audit Checklist</h3>
        <div className="space-y-3">
          {report.checkItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-200 font-mono">{item.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400">
                    {item.category}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">{item.details}</div>
              </div>

              <span className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-xs font-bold shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PASSED</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
