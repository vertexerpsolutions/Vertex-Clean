import React from 'react';
import { Layers, CheckCircle2, Cpu, HardDrive, Cloud, RefreshCw } from 'lucide-react';
import { hybridService } from '../../../services/hybridService';

export const HybridAnalysisView: React.FC = () => {
  const analysis = hybridService.getAnalysis();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 01: Hybrid Platform Analysis</h2>
            <p className="text-xs text-slate-400">Desktop & Cloud Edition Synergy, Shared Services & Sync Capabilities</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Architecture Model</div>
            <div className="text-sm font-bold text-purple-400 font-mono mt-1">{analysis.architectureModel}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Sync Protocol</div>
            <div className="text-sm font-bold text-cyan-400 font-mono mt-1">{analysis.syncProtocol}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Offline Capacity</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-1">{analysis.offlineReadiness}</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono mb-4">Shared Core Subsystems</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {analysis.sharedComponents.map((item, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-xs font-bold text-slate-200 font-mono">{item}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                UNIFIED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
