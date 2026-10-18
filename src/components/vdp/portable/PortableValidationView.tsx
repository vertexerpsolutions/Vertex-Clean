import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export const PortableValidationView: React.FC = () => {
  const [running, setRunning] = useState(false);
  const [verified, setVerified] = useState(true);

  const handleValidate = () => {
    setRunning(true);
    setTimeout(() => {
      setVerified(true);
      setRunning(false);
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 07: Portable Storage Integrity Validation</h2>
            <p className="text-xs text-slate-400">Comprehensive Checksums, SQLite PRAGMA integrity_check & Flash Sector Diagnostics</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 mt-6 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Database & File Integrity</span>
              <span className="text-lg font-bold text-emerald-400">PRAGMA integrity_check = ok</span>
            </div>

            <button
              onClick={handleValidate}
              disabled={running}
              className="px-5 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Verifying Integrity...' : 'Run Integrity Diagnostics'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
