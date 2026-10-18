import React, { useState } from 'react';
import { Layers, Cloud, Server, HardDrive, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { backupService } from '../../../services/backupService';
import { RedundancyConfig } from '../../../core/backup/BackupTypes';

export const RedundancyView: React.FC = () => {
  const [config, setConfig] = useState<RedundancyConfig>(() => backupService.getRedundancyConfig());
  const [savedMessage, setSavedMessage] = useState(false);

  const handleToggleReplication = () => {
    const updated = backupService.updateRedundancyConfig({
      cloudReplicationEnabled: !config.cloudReplicationEnabled
    });
    setConfig({ ...updated });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 05: Storage Redundancy & Replication</h2>
            <p className="text-xs text-slate-400">Multi-Region Cloud Bucket Sync, SAN/NAS Cold Vaults, Glacier Deep Archive & Integrity Hashing</p>
          </div>
        </div>

        {savedMessage && (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Redundancy Settings Updated</span>
          </span>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Primary & Secondary Storage Pools</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-500 uppercase">Primary Hot Storage Pool</div>
            <div className="text-sm font-bold text-slate-100">{config.primaryStoragePool}</div>
            <div className="text-[10px] text-emerald-400">Status: Active & Low Latency Write-Through</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-500 uppercase">Secondary Cloud Replication Region</div>
            <div className="text-sm font-bold text-cyan-400">{config.secondaryCloudRegion}</div>
            <div className="text-[10px] text-cyan-400">Sync Pipeline: Active (Async Stream)</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-200">Cloud Replication Pipeline Status</span>
            <button
              onClick={handleToggleReplication}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                config.cloudReplicationEnabled
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {config.cloudReplicationEnabled ? 'Enabled (Active)' : 'Disabled (Paused)'}
            </button>
          </div>
          <p className="text-slate-400 text-[11px]">
            Replication automatically copies verified TAR.GZ backup payloads across 3 geographic availability zones.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Multiple Active Backup Locations ({config.backupLocations.length})</h3>
        <div className="space-y-3">
          {config.backupLocations.map((loc) => (
            <div key={loc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-100">{loc.name}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] bg-slate-800 text-slate-400 uppercase">
                    {loc.type}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">Path/URI: {loc.pathOrUri}</div>
              </div>

              <div className="text-right">
                <div className="text-emerald-400 font-bold">{loc.freeSpaceGb.toLocaleString()} GB Free</div>
                <span className="text-[10px] text-slate-500 uppercase">Status: Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
