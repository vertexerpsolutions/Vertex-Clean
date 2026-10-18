import React, { useState } from 'react';
import { RefreshCw, Download, CheckCircle2, AlertCircle, Calendar, Tag, ShieldCheck, FileText, Sparkles } from 'lucide-react';
import { updateService } from '../../../services/updateService';
import { SystemVersionInfo } from '../../../core/update/UpdateTypes';

export const UpdateDashboardView: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<SystemVersionInfo>(() => updateService.getVersionInfo());
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckForUpdates = () => {
    setIsChecking(true);
    setTimeout(() => {
      const updated = updateService.checkForUpdates();
      setVersionInfo({ ...updated });
      setIsChecking(false);
    }, 800);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'up_to_date':
        return <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1.5"><CheckCircle2 className="w-3.5 h-3.5" /><span>System Up To Date</span></span>;
      case 'update_available':
        return <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1.5"><Sparkles className="w-3.5 h-3.5" /><span>Update Available (v{versionInfo.latestAvailableVersion})</span></span>;
      case 'downloading':
        return <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center space-x-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Downloading Patch...</span></span>;
      case 'ready_to_install':
        return <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center space-x-1.5"><Download className="w-3.5 h-3.5" /><span>Ready to Install</span></span>;
      default:
        return <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  const currentRelease = versionInfo.releaseNotes.find(r => r.version === versionInfo.latestAvailableVersion) || versionInfo.releaseNotes[0];

  return (
    <div className="space-y-6 font-sans">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-slate-100">Vertex ERP Enterprise System Overview</h2>
            {getStatusBadge(versionInfo.updateStatus)}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Active Channel: <span className="text-amber-400 font-bold uppercase">{versionInfo.channel}</span> | Managed by VDP-08 Patch & Update Management Engine
          </p>
        </div>

        <button
          onClick={handleCheckForUpdates}
          disabled={isChecking}
          className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
          <span>{isChecking ? 'Checking Enterprise Servers...' : 'Check For Updates'}</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Installed Version</div>
          <div className="text-2xl font-black text-slate-100">v{versionInfo.currentVersion}</div>
          <div className="text-[10px] text-slate-400">Build #{versionInfo.currentBuildNumber}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Latest Available</div>
          <div className="text-2xl font-black text-amber-400">v{versionInfo.latestAvailableVersion}</div>
          <div className="text-[10px] text-slate-400">Build #{versionInfo.latestBuildNumber}</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Release Date</div>
          <div className="text-lg font-bold text-slate-200 mt-1">{versionInfo.releaseDate}</div>
          <div className="text-[10px] text-emerald-400">Digitally Signed & Verified</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Update Package Size</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">{currentRelease?.downloadSizeMb || 142.8} MB</div>
          <div className="text-[10px] text-slate-400 truncate">SHA256: {currentRelease?.sha256Checksum.slice(0, 16)}...</div>
        </div>
      </div>

      {/* Release Notes Card */}
      {currentRelease && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">{currentRelease.title}</h3>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-slate-800 text-slate-300">
              {currentRelease.category} release
            </span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <h4 className="text-amber-400 font-bold uppercase text-[11px] mb-2 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Feature Highlights</span>
              </h4>
              <ul className="space-y-1 pl-4 list-disc text-slate-300">
                {currentRelease.highlights.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-emerald-400 font-bold uppercase text-[11px] mb-2 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Bug Fixes & Resolved Issues</span>
              </h4>
              <ul className="space-y-1 pl-4 list-disc text-slate-300">
                {currentRelease.bugFixes.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            {currentRelease.breakingChanges.length > 0 && (
              <div>
                <h4 className="text-rose-400 font-bold uppercase text-[11px] mb-2 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Breaking Changes & Deprecations</span>
                </h4>
                <ul className="space-y-1 pl-4 list-disc text-slate-300">
                  {currentRelease.breakingChanges.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
