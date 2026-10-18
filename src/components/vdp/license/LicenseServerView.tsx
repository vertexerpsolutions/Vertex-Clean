import React, { useState } from 'react';
import { Server, ShieldAlert, ShieldCheck, Trash2, RefreshCw, AlertTriangle, Clock } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { LicenseDashboardInfo } from '../../../core/license/LicenseTypes';

export const LicenseServerView: React.FC = () => {
  const [dashInfo, setDashInfo] = useState<LicenseDashboardInfo>(() => licenseService.getDashboardInfo());
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [renewing, setRenewing] = useState(false);

  const handleRevoke = (deviceId: string) => {
    setRevokingId(deviceId);
    setTimeout(() => {
      licenseService.revokeDevice(deviceId);
      setDashInfo({ ...licenseService.getDashboardInfo() });
      setRevokingId(null);
    }, 600);
  };

  const handleRenew = () => {
    setRenewing(true);
    setTimeout(() => {
      licenseService.renewLicense(1);
      setDashInfo({ ...licenseService.getDashboardInfo() });
      setRenewing(false);
    }, 800);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 04: License Verification Server & Device Revocation</h2>
            <p className="text-xs text-slate-400">License Verification, Activation Queue Management, Device Management, Revocation & Blacklist Engine</p>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Active License Expiration</span>
            <span className="text-sm font-bold text-amber-400">{new Date(dashInfo.expirationDate).toLocaleDateString()}</span>
          </div>

          <button
            onClick={handleRenew}
            disabled={renewing}
            className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            <Clock className="w-4 h-4" />
            <span>{renewing ? 'Extending Term...' : 'Renew Entitlement (+1 Year)'}</span>
          </button>
        </div>
      </div>

      {/* Device Management & Revocation List */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Device Management & Blacklist Control ({dashInfo.registeredDevices.length})</h3>

        <div className="space-y-3">
          {dashInfo.registeredDevices.map((dev) => {
            const isRevoked = dev.status === 'REVOKED';
            return (
              <div key={dev.deviceId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-100">{dev.deviceName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      isRevoked ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {dev.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">HWID: {dev.hardwareFingerprint} | IP: {dev.ipAddress}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!isRevoked && (
                    <button
                      onClick={() => handleRevoke(dev.deviceId)}
                      disabled={revokingId === dev.deviceId}
                      className="px-3 py-1.5 rounded-lg font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{revokingId === dev.deviceId ? 'Revoking...' : 'Revoke & Blacklist'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
