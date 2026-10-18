import React from 'react';
import { Lock, Key, ShieldAlert, Cpu, Fingerprint } from 'lucide-react';
import { hybridService } from '../../../services/hybridService';

export const HybridSecurityView: React.FC = () => {
  const security = hybridService.getSecurityState();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Hybrid Security & Cryptographic Handshake</h2>
            <p className="text-xs text-slate-400">mTLS Authentication, Device Fingerprinting & Payload Encryption</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Payload Encryption</div>
            <div className="text-sm font-bold text-purple-400">{security.encryptionProtocol}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Device Attestation</div>
            <div className="text-sm font-bold text-cyan-400">{security.deviceRegistrationStatus}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Cloud Authorization</div>
            <div className="text-sm font-bold text-blue-400">{security.cloudAuthorization}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Deduplication Engine</div>
            <div className="text-sm font-bold text-emerald-400">{security.duplicateDetectionEngine}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
