import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck, Play, RefreshCw } from 'lucide-react';
import { hybridService } from '../../../services/hybridService';
import { HybridValidationReport } from '../../../core/hybrid/HybridTypes';

export const HybridValidationView: React.FC = () => {
  const [report, setReport] = useState<HybridValidationReport>(() => hybridService.runValidation());

  const handleRunValidation = () => {
    setReport(hybridService.runValidation());
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 07: Hybrid Platform Validation Suite</h2>
              <p className="text-xs text-slate-400">Sync Performance, Offline Stability, Data Integrity & Hybrid Readiness Test</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleRunValidation}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Re-Run Validation Suite</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Sync Success Rate</div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">{report.syncSuccessRatePct}%</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Switch Latency</div>
          <div className="text-xl font-extrabold text-cyan-400 font-mono mt-1">{report.offlineSwitchLatencyMs} ms</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Integrity Score</div>
          <div className="text-xl font-extrabold text-purple-400 font-mono mt-1">{report.dataIntegrityScore}/100</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Hybrid Readiness</div>
          <div className="text-xl font-extrabold text-blue-400 font-mono mt-1">{report.hybridReadinessScore}%</div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Validation Suite Results</h3>
        <div className="space-y-3">
          {report.checkItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-100 font-mono">{item.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 uppercase">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono pl-6">{item.details}</p>
              </div>
              <span className="px-2.5 py-1 rounded text-[10px] font-bold font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
