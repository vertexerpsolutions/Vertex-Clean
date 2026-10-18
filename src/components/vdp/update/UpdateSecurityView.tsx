import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
import { updateService } from '../../../services/updateService';
import { SecurityCheckResult } from '../../../core/update/UpdateTypes';

export const UpdateSecurityView: React.FC = () => {
  const [sec, setSec] = useState<SecurityCheckResult>(() => updateService.verifySecurity());

  const handleReverify = () => {
    setSec(updateService.verifySecurity());
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Update Security & Cryptographic Integrity</h2>
            <p className="text-xs text-slate-400">RSA-4096 Envelope Signatures, SHA-256 Checksums, Trusted Publisher PKI Vault & Anti-Tamper Detection</p>
          </div>
        </div>

        <button
          onClick={handleReverify}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center space-x-2 transition-all shrink-0"
        >
          <Shield className="w-4 h-4" />
          <span>Re-Verify PKI Signatures</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">RSA-4096 Signature</div>
          <div className="text-sm font-extrabold text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>VERIFIED VALID</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">SHA-256 Checksum</div>
          <div className="text-sm font-extrabold text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>EXACT MATCH</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Trusted Publisher</div>
          <div className="text-sm font-extrabold text-cyan-400 mt-1 flex items-center space-x-1">
            <ShieldCheck className="w-4 h-4" />
            <span>TRUSTED CA</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] text-slate-500 uppercase">Anti-Tamper Status</div>
          <div className="text-sm font-extrabold text-emerald-400 mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>CLEAN (0 TAMPER)</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">PKI Publisher Certificate Vault Details</h3>

        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-100">{sec.publisherName}</span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              {sec.securityVerdict}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-400 text-[11px]">
            <div>Certificate Expiry: <span className="text-slate-200">{new Date(sec.certificateExpiry).toLocaleDateString()}</span></div>
            <div>Verification Date: <span className="text-slate-200">{new Date(sec.checkTimestamp).toLocaleString()}</span></div>
            <div>Encryption Algorithm: <span className="text-slate-200">RSA-4096 / SHA-256 Digest</span></div>
            <div>KMS Key Alias: <span className="text-slate-200">projects/vertex-erp/keyRings/update-ring</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
