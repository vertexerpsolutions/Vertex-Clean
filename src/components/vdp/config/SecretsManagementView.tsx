import React, { useState } from 'react';
import { Lock, RefreshCw, Key, ShieldCheck, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';
import { configService } from '../../../services/configService';
import { SecretItem } from '../../../core/config/ConfigTypes';

export const SecretsManagementView: React.FC = () => {
  const [secrets, setSecrets] = useState<SecretItem[]>(() => configService.getSecrets());
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [showVaultKey, setShowVaultKey] = useState<Record<string, boolean>>({});

  const handleRotate = (id: string) => {
    setRotatingId(id);
    setTimeout(() => {
      configService.rotateSecret(id);
      setSecrets([...configService.getSecrets()]);
      setRotatingId(null);
    }, 800);
  };

  const toggleShow = (id: string) => {
    setShowVaultKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 04: Secrets Management & KMS Encryption Vault</h2>
            <p className="text-xs text-slate-400">Hardware-encrypted KMS secret store, automatic key rotation policies, and protected credential access</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">KMS Envelope Encryption</div>
            <div className="text-sm font-extrabold text-emerald-400">AES-256-GCM + RSA-4096</div>
            <div className="text-[10px] text-slate-400">Google KMS Key Ring</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Vault Secret Keys</div>
            <div className="text-sm font-extrabold text-purple-400">{secrets.length} Protected Keys</div>
            <div className="text-[10px] text-slate-400">Hardware Isolated</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Automatic Rotation</div>
            <div className="text-sm font-extrabold text-amber-400">POLICY ACTIVE</div>
            <div className="text-[10px] text-slate-400">60-180 Day Intervals</div>
          </div>
        </div>
      </div>

      {/* Secret Vault List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Encrypted Secrets Vault ({secrets.length})</h3>

        <div className="space-y-3">
          {secrets.map((sec) => {
            const isShowing = showVaultKey[sec.id];
            return (
              <div
                key={sec.id}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-100 text-sm">{sec.keyName}</span>
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/30">
                        {sec.category}
                      </span>
                      {sec.isProtected && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          PROTECTED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-1">Ref: {sec.encryptedVaultRef}</p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => toggleShow(sec.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
                    >
                      {isShowing ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleRotate(sec.id)}
                      disabled={rotatingId === sec.id}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-md flex items-center space-x-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rotatingId === sec.id ? 'animate-spin' : ''}`} />
                      <span>{rotatingId === sec.id ? 'Rotating Key...' : 'Rotate Key Now'}</span>
                    </button>
                  </div>
                </div>

                {/* Secret Value Preview */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono break-all flex items-center justify-between">
                  <span>{isShowing ? 'vtx_live_sec_key_rsa4096_verified_token_2026' : sec.maskedValue}</span>
                  <span className="text-[10px] text-slate-500">Access Count: {sec.accessCount}</span>
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Last Rotated: {new Date(sec.lastRotatedAt).toLocaleDateString()}</span>
                  <span>Rotation Interval: Every {sec.rotationPolicyDays} Days</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
