import React, { useState } from 'react';
import { Cpu, CheckCircle2, ShieldCheck, Play, RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';
import { updateService } from '../../../services/updateService';
import { PatchPackage, PatchOperationResult } from '../../../core/update/UpdateTypes';

export const PatchInstallerView: React.FC = () => {
  const [pkg, setPkg] = useState<PatchPackage>(() => updateService.getPatchPackage());
  const [isInstalling, setIsInstalling] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<PatchOperationResult | null>(null);

  const steps = [
    '1. Verifying RSA-4096 Digital Signature & SHA-256 Checksum',
    '2. Generating Baseline Recovery Snapshot (pre-patch backup)',
    '3. Extracting Delta Tar.Gz Assemblies & Binary Files',
    '4. Executing Database SQL Migrations (PostgreSQL & SQLite)',
    '5. Hot-Swapping C++ VGF Core Runtime & Restarting Services'
  ];

  const handleApplyPatch = () => {
    setIsInstalling(true);
    setResult(null);
    setProgressStep(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setProgressStep(current);
      if (current >= steps.length) {
        clearInterval(interval);
        const res = updateService.applyPatch();
        setResult(res);
        setIsInstalling(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 04: Atomic Patch Installer Engine</h2>
            <p className="text-xs text-slate-400">Package Verification, Automated Pre-Patch Backup, In-Place Hot Swap & Automatic Rollback</p>
          </div>
        </div>

        {/* Selected Package Details */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-100 text-sm">{pkg.packageId}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
                {pkg.isOfflineFile ? 'OFFLINE VPK' : 'ONLINE CHANNEL'}
              </span>
            </div>
            <span className="text-cyan-400 font-bold">{pkg.sizeMb} MB</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 text-[11px]">
            <div>Source Version: <span className="text-slate-200">{pkg.sourceVersion}</span></div>
            <div>Target Version: <span className="text-emerald-400 font-bold">v{pkg.targetVersion}</span></div>
            <div>Publisher: <span className="text-slate-200">{pkg.publisherName}</span></div>
            <div>Fingerprint: <span className="text-slate-200">{pkg.publisherFingerprint}</span></div>
          </div>

          <div className="border-t border-slate-900 pt-2 text-[10px] text-slate-500 truncate">
            SHA-256 Checksum: {pkg.sha256Checksum}
          </div>
        </div>
      </div>

      {/* Installation Control & Console */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase">Patch Execution Pipeline</h3>
          <button
            onClick={handleApplyPatch}
            disabled={isInstalling}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            {isInstalling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isInstalling ? 'Applying Patch...' : `Apply Patch v${pkg.targetVersion}`}</span>
          </button>
        </div>

        {/* Step Progress Display */}
        <div className="space-y-2">
          {steps.map((st, idx) => {
            const isCompleted = progressStep > idx || (result && result.success);
            const isCurrent = progressStep === idx + 1 && isInstalling;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isCurrent
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <span>{st}</span>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {isCurrent && <RefreshCw className="w-4 h-4 text-purple-400 animate-spin shrink-0" />}
              </div>
            );
          })}
        </div>

        {result && result.success && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Patch v{pkg.targetVersion} Applied Successfully! System Restarted.</span>
            </div>
            <p className="text-[11px] text-emerald-300">
              Pre-patch backup snapshot recorded: <span className="font-mono font-bold">{result.backupSnapshotId}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
