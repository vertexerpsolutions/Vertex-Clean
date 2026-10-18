import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, AlertTriangle, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { SecurityAudit } from '../../../core/license/LicenseTypes';

export const LicenseSecurityView: React.FC = () => {
  const [sec, setSec] = useState<SecurityAudit>(() => licenseService.getSecurityAudit());
  const [checking, setChecking] = useState(false);

  const handleRunAudit = () => {
    setChecking(true);
    setTimeout(() => {
      licenseService.runAntiCrackValidation();
      setSec({ ...licenseService.getSecurityAudit() });
      setChecking(false);
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
            <h2 className="text-lg font-bold text-slate-100">Phase 09: License Security, RSA-4096 Signatures & Anti-Crack Vault</h2>
            <p className="text-xs text-slate-400">Encrypted License Vault, RSA Signature Verification, Tamper Detection Shield & Anti-Crack Integrity Check</p>
          </div>
        </div>

        {/* Security Audit Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-2">
            <div className="text-[10px] text-slate-500 uppercase">RSA Public Key Signing Fingerprint</div>
            <div className="font-bold text-emerald-400 break-all">{sec.rsaKeyFingerprint}</div>
            <div className="text-[10px] text-slate-400">KMS HSM Key Ring Certificate Validated</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-2">
            <div className="text-[10px] text-slate-500 uppercase">Anti-Crack & Tamper Validation Status</div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black text-emerald-400">{sec.antiCrackValidationStatus}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Tamper Shield Active
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Checked: {new Date(sec.lastSecurityCheckTimestamp).toLocaleString()}</div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <button
            onClick={handleRunAudit}
            disabled={checking}
            className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Executing Anti-Crack Diagnostics...' : 'Run Real-Time Anti-Tamper & RSA Security Audit'}</span>
          </button>
        </div>
      </div>

      {/* Vault Specs */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Encrypted KMS License Vault Reference</span>
        </h3>
        <p className="text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">{sec.encryptedLicenseVaultRef}</p>
      </div>
    </div>
  );
};
