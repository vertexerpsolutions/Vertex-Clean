import React, { useState } from 'react';
import { Key, ShieldCheck, Activity, Laptop, Clock, Users, Award, RefreshCw, AlertCircle } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { LicenseDashboardInfo } from '../../../core/license/LicenseTypes';

export const LicenseDashboardView: React.FC = () => {
  const [dashInfo, setDashInfo] = useState<LicenseDashboardInfo>(() => licenseService.getDashboardInfo());

  return (
    <div className="space-y-6 font-sans">
      {/* Primary License Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-black text-slate-100 font-mono">{dashInfo.licenseKey}</h2>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{dashInfo.status}</span>
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              {dashInfo.type}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Customer: <span className="text-slate-200 font-bold">{dashInfo.customer.companyName}</span> ({dashInfo.customer.contactEmail}) | Account Manager: <span className="text-cyan-400">{dashInfo.customer.accountManager}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 font-mono text-xs shrink-0">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <div className="text-[10px] text-slate-500 uppercase">License Health</div>
            <div className="text-lg font-black text-emerald-400">{dashInfo.licenseHealthScore}%</div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Activation Status</div>
          <div className="text-lg font-bold text-emerald-400 mt-1">{dashInfo.activationStatus}</div>
          <div className="text-[10px] text-slate-400">RSA-4096 Signed Certificate</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Expiration Date</div>
          <div className="text-lg font-bold text-amber-400 mt-1">
            {new Date(dashInfo.expirationDate).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-slate-400">Auto-Renewal Active</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Remaining Activations</div>
          <div className="text-lg font-bold text-cyan-400 mt-1">
            {dashInfo.remainingActivations} / {dashInfo.maxActivationsAllowed} Seats
          </div>
          <div className="text-[10px] text-slate-400">Floating License Pool</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
          <div className="text-[10px] text-slate-500 uppercase">Registered Pod Devices</div>
          <div className="text-lg font-bold text-purple-400 mt-1">
            {dashInfo.registeredDevices.length} Machines
          </div>
          <div className="text-[10px] text-slate-400">Hardware Fingerprinted</div>
        </div>
      </div>

      {/* Customer Information & Registered Devices Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Users className="w-4 h-4 text-amber-400" />
            <span>Customer & Support Tier</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="text-[10px] text-slate-500">Company Name</div>
              <div className="text-slate-100 font-bold text-sm">{dashInfo.customer.companyName}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Contact Email</div>
              <div className="text-cyan-400 font-mono">{dashInfo.customer.contactEmail}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Support SLA Tier</div>
              <div className="text-emerald-400 font-bold">{dashInfo.customer.supportTier}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Tier Level Allocation</div>
              <div className="text-purple-400 font-bold">{dashInfo.customer.tierLevel}</div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Laptop className="w-4 h-4 text-cyan-400" />
              <span>Registered Pod Devices ({dashInfo.registeredDevices.length})</span>
            </span>
            <span className="text-[10px] text-slate-500">HWID Binding Active</span>
          </h3>

          <div className="space-y-3">
            {dashInfo.registeredDevices.map((dev) => (
              <div key={dev.deviceId} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100">{dev.deviceName}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {dev.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">HWID: {dev.hardwareFingerprint} | IP: {dev.ipAddress}</div>
                  <div className="text-[10px] text-slate-400">{dev.osVersion}</div>
                </div>

                <div className="text-right text-[10px] text-slate-400">
                  <div>Activated: {new Date(dev.activatedAt).toLocaleDateString()}</div>
                  <div className="text-emerald-400">Heartbeat: {new Date(dev.lastHeartbeatAt).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
