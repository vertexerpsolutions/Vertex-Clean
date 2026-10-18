import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, UserCheck, FileText, CheckCircle2 } from 'lucide-react';
import { backupService } from '../../../services/backupService';
import { BackupSecurityConfig, BackupAuditLog } from '../../../core/backup/BackupTypes';

export const BackupSecurityView: React.FC = () => {
  const [security, setSecurity] = useState<BackupSecurityConfig>(() => backupService.getSecurityConfig());
  const logs: BackupAuditLog[] = backupService.getAuditLogs();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 06: Backup Security & Authentication</h2>
            <p className="text-xs text-slate-400">AES-256-GCM Envelope Encryption, KMS Key Rings, Immutable WORM Vaults & Audit Logs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 font-mono text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Encryption Cipher</div>
            <div className="text-sm font-bold text-emerald-400 mt-1">{security.encryptionAlgorithm}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Restore Authentication</div>
            <div className="text-sm font-bold text-cyan-400 mt-1">
              {security.requireAuthForRestore ? 'Mandatory MFA / OAuth' : 'Standard Auth'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Immutable WORM Vault</div>
            <div className="text-sm font-bold text-purple-400 mt-1">
              {security.immutableWormStorageEnabled ? 'Active (Ransomware Proof)' : 'Disabled'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Audit Logging Engine</div>
            <div className="text-sm font-bold text-amber-400 mt-1">Enabled (Tamper Proof)</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Google Cloud KMS Key Ring Alias</h3>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 break-all">
          {security.kmsKeyAlias}
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Backup & Restore Audit Trail ({logs.length})</h3>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-100">{log.action}</span>
                  <span className="text-slate-500">by {log.operator}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {log.status}
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">{log.details}</p>
              <div className="text-[10px] text-slate-500">
                Timestamp: {new Date(log.timestamp).toLocaleString()} | IP: {log.ipAddress}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
