import React from 'react';
import { Package, Terminal, ShieldCheck, CheckCircle2, Cpu } from 'lucide-react';
import { installerService } from '../../../services/installerService';

export const InstallerAnalysisView: React.FC = () => {
  const analysis = installerService.getAnalysis();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 01: Installer Architecture Analysis</h2>
            <p className="text-xs text-slate-400">Windows MSI/WiX Setup Specifications & Silent Unattended Deployment Matrix</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Target Platform</div>
            <div className="text-sm font-bold text-amber-400 mt-1">{analysis.supportedTargetOS}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Packaging Engine</div>
            <div className="text-sm font-bold text-cyan-400 mt-1">{analysis.installerFramework}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Security Elevation</div>
            <div className="text-sm font-bold text-purple-400 mt-1">{analysis.elevationRequired}</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Supported Deployment & Maintenance Modes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {analysis.supportedModes.map((mode, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-slate-200 font-mono">{mode}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
