import React, { useState } from 'react';
import { BarChart3, Globe, HardDrive, ShieldCheck, Activity, Users, PieChart } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { DistributionAnalytics } from '../../../core/license/LicenseTypes';

export const DistributionAnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<DistributionAnalytics>(() => licenseService.getAnalytics());

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 08: Global Product Distribution Analytics</h2>
            <p className="text-xs text-slate-400">Installed Base Telemetry, Active Licenses, Activation Success Rates, Regional Distribution & Version Adoption</p>
          </div>
        </div>

        {/* Big Numbers Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 font-mono text-xs">
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Total Installed Copies</div>
            <div className="text-2xl font-black text-slate-100">{stats.totalInstalledCopies.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">Global Enterprise Deployments</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Total Active License Keys</div>
            <div className="text-2xl font-black text-emerald-400">{stats.totalActiveLicenses.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">Active SLA Entitlements</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Registered Active Pod Devices</div>
            <div className="text-2xl font-black text-cyan-400">{stats.activeDevicesCount.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400">HWID Bound Nodes</div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Activation Success SLA</div>
            <div className="text-2xl font-black text-amber-400">{stats.activationSuccessRatePercentage}%</div>
            <div className="text-[10px] text-slate-400">KMS Online Validation</div>
          </div>
        </div>
      </div>

      {/* Regional & Version Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2 border-b border-slate-800 pb-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Regional License Distribution</span>
          </h3>

          <div className="space-y-3">
            {stats.regionalBreakdown.map((r) => (
              <div key={r.region} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-200">{r.region}</span>
                <span className="font-extrabold text-cyan-400">{r.count.toLocaleString()} Installations</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2 border-b border-slate-800 pb-2">
            <PieChart className="w-4 h-4 text-purple-400" />
            <span>Software Version Adoption</span>
          </h3>

          <div className="space-y-3">
            {stats.versionUsageBreakdown.map((v) => (
              <div key={v.version} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                <span className="font-bold text-slate-200">{v.version}</span>
                <span className="font-extrabold text-emerald-400">{v.percentage}% Active Base</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
