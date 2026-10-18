import React from 'react';
import { Monitor, CheckCircle2, Cpu, HardDrive, Shield, WifiOff } from 'lucide-react';
import { desktopService } from '../../../services/desktopService';

export const DesktopAnalysisView: React.FC = () => {
  const analysis = desktopService.getAnalysis();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 01: Desktop Analysis</h2>
            <p className="text-xs text-slate-400">Windows File System, Process Sandboxing, Hardware Resources & Offline Readiness</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Target Workstation OS</div>
            <div className="text-sm font-bold text-cyan-400 font-mono mt-1">{analysis.targetPlatform}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Compatibility Index</div>
            <div className="text-sm font-bold text-emerald-400 font-mono mt-1">{analysis.compatibilityStatus}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Offline Architecture</div>
            <div className="text-sm font-bold text-indigo-400 font-mono mt-1">Local Event Loop & Sync Queue</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono mb-4">Verified Subsystems for Desktop Runtime</h3>
        <div className="space-y-3">
          {analysis.verifiedModules.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold text-slate-300 font-mono">{item}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                VERIFIED
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
