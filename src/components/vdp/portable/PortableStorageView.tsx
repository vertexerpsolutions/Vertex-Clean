import React, { useState } from 'react';
import { HardDrive, Lock, ShieldCheck, Database, CheckCircle2 } from 'lucide-react';
import { portableService } from '../../../services/portableService';
import { PortableDashboardInfo } from '../../../core/portable/PortableTypes';

export const PortableStorageView: React.FC = () => {
  const [dashInfo] = useState<PortableDashboardInfo>(() => portableService.getDashboardInfo());

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: Encrypted Storage Volume & Hardware Partitioning</h2>
            <p className="text-xs text-slate-400">Manage Portable Storage Volumes, Filesystems (exFAT, LUKS, NTFS), Hardware Encryption & Capacity Allocations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 flex items-center space-x-2">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Volume Attributes</span>
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-500 text-[10px] block">Drive Label</span>
                <span className="text-slate-100 font-bold">{dashInfo.volume.driveLabel}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Volume ID</span>
                <span className="text-cyan-400 font-bold">{dashInfo.volume.volumeId}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Filesystem Type</span>
                <span className="text-amber-400 font-bold">{dashInfo.volume.fsType}</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Encryption & Hardware</span>
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-500 text-[10px] block">Vendor Specs</span>
                <span className="text-slate-100 font-bold">{dashInfo.volume.hardwareVendor}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Serial Number</span>
                <span className="text-purple-400 font-bold">{dashInfo.volume.serialNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Encryption Status</span>
                <span className="text-emerald-400 font-bold">AES-256 BitLocker Encrypted</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 flex items-center space-x-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Capacity Allocation</span>
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-slate-500 text-[10px] block">Total Volume Size</span>
                <span className="text-slate-100 font-bold">{(dashInfo.volume.totalCapacityMb / 1024).toFixed(0)} GB</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Free Space Available</span>
                <span className="text-emerald-400 font-bold">{(dashInfo.volume.freeCapacityMb / 1024).toFixed(1)} GB</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Local Database Footprint</span>
                <span className="text-amber-400 font-bold">{dashInfo.dbConfig.dbSizeMb} MB</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
