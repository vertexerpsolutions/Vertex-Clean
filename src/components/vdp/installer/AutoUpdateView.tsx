import React, { useState } from 'react';
import { RefreshCw, Download, RotateCcw, CheckCircle2, AlertCircle, Clock, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { installerService } from '../../../services/installerService';
import { SoftwareReleaseSpec } from '../../../core/installer/InstallerTypes';

export const AutoUpdateView: React.FC = () => {
  const [releases, setReleases] = useState<SoftwareReleaseSpec[]>(() => installerService.getReleases());
  const [checking, setChecking] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const availableUpdate = releases.find(r => r.status === 'available');

  const handleCheckForUpdates = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setReleases([...installerService.getReleases()]);
    }, 800);
  };

  const handleApplyUpdate = (version: string) => {
    setIsUpdating(true);
    setDownloadProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 20;
      setDownloadProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsUpdating(false);
        const updated = installerService.applyUpdate(version);
        setReleases([...updated]);
      }
    }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 03: Automatic Update & Patch Engine</h2>
            <p className="text-xs text-slate-400">Background Stream, SHA-256 Hash Check, In-Place Atomic Binary Swapping & Rollback</p>
          </div>
        </div>

        <button
          onClick={handleCheckForUpdates}
          disabled={checking || isUpdating}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg shadow-purple-500/20 flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Checking Update Server...' : 'Check for Updates'}</span>
        </button>
      </div>

      {availableUpdate && (
        <div className="p-6 rounded-2xl bg-purple-950/40 border border-purple-500/40 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold font-mono bg-purple-500 text-slate-950 uppercase">
                NEW RELEASE AVAILABLE
              </span>
              <span className="text-sm font-bold text-slate-100 font-mono">{availableUpdate.version}</span>
            </div>
            <span className="text-xs font-mono text-purple-300">{availableUpdate.packageSizeMb} MB</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-300">
            <div className="text-slate-400 font-bold uppercase text-[10px]">Release Highlights:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-300">
              {availableUpdate.releaseNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>

          {isUpdating ? (
            <div className="space-y-2 font-mono text-xs pt-2">
              <div className="flex items-center justify-between text-purple-300">
                <span>Downloading and verifying package checksum...</span>
                <span>{downloadProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleApplyUpdate('1.0.1')}
              className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-lg flex items-center space-x-2 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download & Install Patch v1.0.1</span>
            </button>
          )}
        </div>
      )}

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Release History & Version Log</h3>
        <div className="space-y-3">
          {releases.map((rel, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-200 font-bold">
                <span className="text-slate-100 font-extrabold">{rel.version}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                    rel.status === 'installed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : rel.status === 'available'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {rel.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-slate-500 text-[10px]">Released: {rel.releaseDate} | Size: {rel.packageSizeMb} MB</div>
              <div className="text-slate-400 text-[10px] truncate">SHA-256: {rel.sha256Hash}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
