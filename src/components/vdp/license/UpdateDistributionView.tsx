import React, { useState } from 'react';
import { RefreshCw, Download, ShieldCheck, CheckCircle2, Radio, Layers } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { ReleaseUpdateItem } from '../../../core/license/LicenseTypes';

export const UpdateDistributionView: React.FC = () => {
  const [releases, setReleases] = useState<ReleaseUpdateItem[]>(() => licenseService.getReleases());
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | 'STABLE' | 'BETA' | 'HOTFIX'>('ALL');

  const filteredReleases = releases.filter(r => selectedChannel === 'ALL' || r.channel === selectedChannel);

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Update Distribution & Patch Release Channels</h2>
            <p className="text-xs text-slate-400">Enterprise Patch Distribution, Release Channels (Stable, Hotfix, Beta Program) and Auto-Update Signaling</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 border-b border-slate-800 pb-2 font-mono text-xs mt-6">
          {(['ALL', 'STABLE', 'HOTFIX', 'BETA'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                selectedChannel === ch ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-950 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ch} Channel
            </button>
          ))}
        </div>
      </div>

      {/* Release Items List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Available Patch & Release Packages ({filteredReleases.length})</h3>

        <div className="space-y-3">
          {filteredReleases.map((rel) => (
            <div key={rel.version} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{rel.version}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    rel.channel === 'STABLE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : rel.channel === 'HOTFIX'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  }`}>
                    {rel.channel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{rel.summary}</p>
                <div className="text-[10px] text-slate-500">Released: {rel.releaseDate} | Size: {rel.downloadSizeMb} MB</div>
              </div>

              <a
                href={rel.patchUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center space-x-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Fetch Patch</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
