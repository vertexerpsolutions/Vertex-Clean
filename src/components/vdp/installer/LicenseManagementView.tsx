import React, { useState } from 'react';
import { Key, ShieldCheck, Cpu, Building, CheckCircle2, Lock, RefreshCw } from 'lucide-react';
import { installerService } from '../../../services/installerService';
import { EnterpriseLicenseKey } from '../../../core/installer/InstallerTypes';

export const LicenseManagementView: React.FC = () => {
  const [license, setLicense] = useState<EnterpriseLicenseKey>(() => installerService.getLicense());
  const [keyInput, setKeyInput] = useState('');
  const [orgInput, setOrgInput] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput || !orgInput) return;
    setIsActivating(true);
    setTimeout(() => {
      const updated = installerService.activateLicense(keyInput, orgInput);
      setLicense({ ...updated });
      setIsActivating(false);
      setKeyInput('');
      setOrgInput('');
    }, 600);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 04: Enterprise License Management</h2>
            <p className="text-xs text-slate-400">RSA-4096 Signed License Certificates, Hardware TPM Registration & Offline Activation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">License Tier</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">{license.tier}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Licensed Seat Limit</div>
            <div className="text-sm font-bold text-cyan-400 mt-1">{license.maxSeats} Users</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Subscription Status</div>
            <div className="text-sm font-bold text-purple-400 mt-1 capitalize">{license.status}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Expiration Date</div>
            <div className="text-sm font-bold text-amber-400 mt-1">{license.subscriptionExpires}</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Active Hardware & Machine Attestation</h3>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">License Key:</span>
            <span className="font-bold text-slate-100">{license.licenseKey}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">Registered Org:</span>
            <span className="font-bold text-cyan-400">{license.organizationName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">Machine Fingerprint:</span>
            <span className="text-purple-400 truncate max-w-[280px]">{license.assignedMachineHash}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">Offline Certificate Signature:</span>
            <span className="text-amber-400 truncate max-w-[280px]">{license.offlineSignature}</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Activate New Software License Key</h3>
        <form onSubmit={handleActivate} className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <input
            type="text"
            placeholder="License Key (VTX-ENT-...)"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            placeholder="Organization Name"
            value={orgInput}
            onChange={(e) => setOrgInput(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={isActivating || !keyInput || !orgInput}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center space-x-2 transition-all"
          >
            {isActivating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Key className="w-3.5 h-3.5" />}
            <span>{isActivating ? 'Verifying RSA Signature...' : 'Activate License'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
