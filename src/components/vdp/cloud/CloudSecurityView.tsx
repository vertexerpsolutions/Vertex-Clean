import React from 'react';
import { ShieldCheck, Lock, Key, Globe, Shield, Activity } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';

export const CloudSecurityView: React.FC = () => {
  const security = cloudService.getSecurityState();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Cloud Security Sentinel</h2>
            <p className="text-xs text-slate-400">TLS 1.3 mTLS Enclosure, Cloud KMS Key Rotation, WAF Shielding & API Rate Throttling</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Transport Layer Encryption</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">TLS 1.3 & mTLS Enforced</div>
            <div className="text-[10px] text-slate-400 font-mono">Zero-Trust Internal Network Mesh</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Cloud WAF & DDoS Shield</div>
            <div className="text-sm font-bold text-blue-400 font-mono">{security.ddosMitigationLevel}</div>
            <div className="text-[10px] text-slate-400 font-mono">Rate Limit: {security.rateLimitPerMin} Req/Min</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Secrets & Token Rotation</div>
            <div className="text-sm font-bold text-purple-400 font-mono">Auto-Rotate ({security.secretRotationDays} Days)</div>
            <div className="text-[10px] text-slate-400 font-mono">Active Tokens: {security.activeTokensCount} OAuth2</div>
          </div>
        </div>
      </div>
    </div>
  );
};
