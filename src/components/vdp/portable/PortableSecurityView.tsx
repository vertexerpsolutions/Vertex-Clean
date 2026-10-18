import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, RefreshCw, CheckCircle2 } from 'lucide-react';
import { portableService } from '../../../services/portableService';
import { PortableSecurityAudit } from '../../../core/portable/PortableTypes';

export const PortableSecurityView: React.FC = () => {
  const [sec, setSec] = useState<PortableSecurityAudit>(() => portableService.getSecurityAudit());
  const [checking, setChecking] = useState(false);

  const handleAudit = () => {
    setChecking(true);
    setTimeout(() => {
      portableService.runSecurityAudit();
      setSec({ ...portableService.getSecurityAudit() });
      setChecking(false);
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 05: Portable Storage Security & BitLocker/LUKS Shield</h2>
            <p className="text-xs text-slate-400">Hardware-bound AES-256 Encryption Keys, Anti-Tamper Volume Verification & Emergency Wipe Protocols</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-500 uppercase">AES-256 Key Fingerprint</div>
            <div className="font-bold text-emerald-400 break-all">{sec.aes256KeyFingerprint}</div>
            <div className="text-[10px] text-slate-400">Hardware Key Bound to USB Controller</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-500 uppercase">Anti-Tamper Integrity Check</div>
            <div className="text-lg font-bold text-emerald-400 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{sec.tamperCheckPassed ? 'PASSED (Clean Volume)' : 'TAMPER DETECTED'}</span>
            </div>
            <div className="text-[10px] text-slate-400">Audited: {new Date(sec.lastAuditTimestamp).toLocaleString()}</div>
          </div>
        </div>

        <button
          onClick={handleAudit}
          disabled={checking}
          className="mt-6 px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          <span>{checking ? 'Auditing Encryption Shield...' : 'Execute Anti-Tamper Security Audit'}</span>
        </button>
      </div>
    </div>
  );
};
