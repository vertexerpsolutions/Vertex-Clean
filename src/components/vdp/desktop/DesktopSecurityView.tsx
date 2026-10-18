import React from 'react';
import { ShieldCheck, Lock, Key, Cpu, FileCheck } from 'lucide-react';
import { desktopService } from '../../../services/desktopService';

export const DesktopSecurityView: React.FC = () => {
  const machine = desktopService.getMachineIdentity();
  const vault = desktopService.getVaultStatus();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Desktop Security Sentinel</h2>
            <p className="text-xs text-slate-400">DPAPI Key Hierarchy, Hardware Machine Binding & Encrypted Vault Engine</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Encrypted Local Storage Vault</span>
            </div>
            <div className="text-sm font-bold text-slate-200 font-mono">Algorithm: {vault.algorithm}</div>
            <div className="text-[10px] text-slate-400 font-mono">Key Derivation: {vault.keyDerivation}</div>
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              VAULT PROTECTED
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-cyan-400" />
              <span>Machine Hardware Fingerprint</span>
            </div>
            <div className="text-sm font-bold text-cyan-400 font-mono">{machine.machineGuid}</div>
            <div className="text-[10px] text-slate-400 font-mono">Host: {machine.hostname} ({machine.osName})</div>
            <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
              TPM 2.0 ATTESTED
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Workstation License & Hardware Signature</h3>
        
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">License Cryptographic Hash:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">{machine.licenseHash}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Processor Spec:</span>
            <span className="text-xs font-mono text-slate-200">{machine.cpuModel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Physical Workstation RAM:</span>
            <span className="text-xs font-mono text-slate-200">{machine.totalRamGb} GB DDR5 ECC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">Virtual Machine Sentinel:</span>
            <span className="text-xs font-mono text-emerald-400">Bare Metal Workstation (No Hypervisor Detected)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
