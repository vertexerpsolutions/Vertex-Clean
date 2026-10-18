import React, { useState } from 'react';
import { Zap, CheckCircle2, ShieldCheck, RefreshCw, Cpu, Layers } from 'lucide-react';
import { portableService } from '../../../services/portableService';

export const ZeroInstallView: React.FC = () => {
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState(() => portableService.getDashboardInfo().zeroInstallStatus);

  const handleVerify = () => {
    setChecking(true);
    setTimeout(() => {
      const res = portableService.runZeroInstallCheck();
      setStatus(res);
      setChecking(false);
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: Zero-Install Standalone Runtime Engine</h2>
            <p className="text-xs text-slate-400">Plug-and-play execution without host operating system registry changes or installer dependencies</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 mt-6 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Zero-Install Runtime Cache Status</span>
              <span className="text-lg font-bold text-emerald-400">{status}</span>
            </div>

            <button
              onClick={handleVerify}
              disabled={checking}
              className="px-5 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Validating Cache...' : 'Verify Zero-Install Binaries'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500">Host OS Privileges</div>
              <div className="text-slate-100 font-bold">Standard User (No Admin/UAC Required)</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500">Host Disk Residue</div>
              <div className="text-emerald-400 font-bold">0 Bytes (Clean Auto-Purge on Exit)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
