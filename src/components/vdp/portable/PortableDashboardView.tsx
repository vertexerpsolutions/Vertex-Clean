import React, { useState } from 'react';
import { HardDrive, ShieldCheck, Database, Cpu, Activity, RefreshCw, Lock, Zap, LogOut } from 'lucide-react';
import { portableService } from '../../../services/portableService';
import { PortableDashboardInfo } from '../../../core/portable/PortableTypes';

export const PortableDashboardView: React.FC = () => {
  const [dashInfo, setDashInfo] = useState<PortableDashboardInfo>(() => portableService.getDashboardInfo());

  const handleEject = () => {
    portableService.ejectVolume();
    setDashInfo({ ...portableService.getDashboardInfo() });
  };

  const handleMount = () => {
    portableService.mountVolume();
    setDashInfo({ ...portableService.getDashboardInfo() });
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Primary Status Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-slate-100 font-mono">{dashInfo.volume.driveLabel}</h2>
            <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase flex items-center space-x-1 ${
              dashInfo.isMounted
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              <HardDrive className="w-3.5 h-3.5" />
              <span>{dashInfo.isMounted ? 'VOLUME MOUNTED' : 'VOLUME EJECTED'}</span>
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {dashInfo.volume.fsType}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Mount Point: <span className="text-cyan-400 font-bold">{dashInfo.volume.mountPoint}</span> | Hardware: <span className="text-slate-200">{dashInfo.volume.hardwareVendor}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs shrink-0">
          {dashInfo.isMounted ? (
            <button
              onClick={handleEject}
              className="px-4 py-2 rounded-xl font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1.5 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Safe Eject Storage</span>
            </button>
          ) : (
            <button
              onClick={handleMount}
              className="px-4 py-2 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1.5 transition-all"
            >
              <HardDrive className="w-4 h-4" />
              <span>Remount Hardware Volume</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Volume Capacity</div>
          <div className="text-lg font-bold text-slate-100 mt-1">
            {(dashInfo.volume.freeCapacityMb / 1024).toFixed(1)} GB Free / {(dashInfo.volume.totalCapacityMb / 1024).toFixed(0)} GB
          </div>
          <div className="text-[10px] text-slate-400">USB 3.2 High-Speed Flash</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Zero-Install Runtime</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{dashInfo.zeroInstallStatus}</div>
          <div className="text-[10px] text-slate-400">No Host Admin Req.</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Embedded Local DB</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">{dashInfo.dbConfig.dbEngine}</div>
          <div className="text-[10px] text-slate-400">SQLCipher Encrypted</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Sync Events Ledger</div>
          <div className="text-lg font-bold text-purple-400 mt-1">{dashInfo.totalSyncEvents} Events</div>
          <div className="text-[10px] text-slate-400">Local-First Delta Sync</div>
        </div>
      </div>

      {/* Database & Volume Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 flex items-center space-x-2">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Embedded Portable Storage Engine</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500">Database Engine</div>
              <div className="text-slate-100 font-bold">{dashInfo.dbConfig.dbEngine}</div>
              <div className="text-[10px] text-slate-400 truncate">{dashInfo.dbConfig.dbPath}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500">Database File Size</div>
              <div className="text-amber-400 font-bold">{dashInfo.dbConfig.dbSizeMb} MB</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-500">Last Local-to-Cloud Sync</div>
              <div className="text-emerald-400 font-bold">{new Date(dashInfo.dbConfig.lastSyncTimestamp).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 flex items-center space-x-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Portable Hardware Encryption & Safety</span>
          </h3>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Volume Encryption</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                AES-256 BitLocker To Go
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Hardware Serial Number</span>
              <span className="text-cyan-400 font-bold">{dashInfo.volume.serialNumber}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Host Registry footprint</span>
              <span className="text-emerald-400 font-bold">ZERO (Clean Runtime)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
