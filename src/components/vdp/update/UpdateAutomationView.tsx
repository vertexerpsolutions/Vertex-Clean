import React, { useState } from 'react';
import { Clock, Calendar, Bell, ShieldCheck, CheckCircle2, VolumeX, Sparkles } from 'lucide-react';
import { updateService } from '../../../services/updateService';
import { MaintenanceWindowSpec } from '../../../core/update/UpdateTypes';

export const UpdateAutomationView: React.FC = () => {
  const [windowSpec, setWindowSpec] = useState<MaintenanceWindowSpec>(() => updateService.getMaintenanceWindow());
  const [savedMessage, setSavedMessage] = useState(false);

  const handleToggle = (key: keyof MaintenanceWindowSpec) => {
    const updated = updateService.updateMaintenanceWindow({
      [key]: !windowSpec[key]
    });
    setWindowSpec({ ...updated });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleDayChange = (day: MaintenanceWindowSpec['dayOfWeek']) => {
    const updated = updateService.updateMaintenanceWindow({ dayOfWeek: day });
    setWindowSpec({ ...updated });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  const handleHourChange = (hour: number) => {
    const updated = updateService.updateMaintenanceWindow({ startHourUtc: hour });
    setWindowSpec({ ...updated });
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 07: Automation & Maintenance Windows</h2>
            <p className="text-xs text-slate-400">Automated scheduled updates, maintenance windows, silent background patches, and user notifications</p>
          </div>
        </div>

        {savedMessage && (
          <span className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved</span>
          </span>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase">Automated Update & Maintenance Controls</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-slate-100">Scheduled Maintenance Window</div>
              <p className="text-[11px] text-slate-400">Apply non-disruptive patches only during configured off-peak maintenance window</p>
            </div>
            <button
              onClick={() => handleToggle('enabled')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                windowSpec.enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {windowSpec.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-slate-100">Auto-Approve Security Hotfixes</div>
              <p className="text-[11px] text-slate-400">Automatically install critical zero-day security patches without manual approval</p>
            </div>
            <button
              onClick={() => handleToggle('autoApproveHotfixes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                windowSpec.autoApproveHotfixes ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {windowSpec.autoApproveHotfixes ? 'Auto Active' : 'Manual Approval'}
            </button>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-slate-100">Silent Background Updates</div>
              <p className="text-[11px] text-slate-400">Download and staging execute silently in background without UI disruption</p>
            </div>
            <button
              onClick={() => handleToggle('silentMode')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                windowSpec.silentMode ? 'bg-purple-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {windowSpec.silentMode ? 'Silent Enabled' : 'Interactive'}
            </button>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-bold text-slate-100">User Pre-Notification Banner</div>
              <p className="text-[11px] text-slate-400">Notify active users {windowSpec.notifyUsersAheadMinutes} minutes ahead of maintenance restarts</p>
            </div>
            <span className="text-cyan-400 font-bold">{windowSpec.notifyUsersAheadMinutes} Min Countdown</span>
          </div>
        </div>

        {/* Schedule Selector */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="font-bold text-slate-100">Configure Maintenance Schedule (UTC)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold">Select Maintenance Day</label>
              <div className="grid grid-cols-7 gap-1 mt-1">
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleDayChange(d)}
                    className={`py-2 rounded-lg font-bold text-[10px] truncate transition-all ${
                      windowSpec.dayOfWeek === d ? 'bg-purple-500 text-slate-950 font-extrabold' : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase font-bold">Start Time (UTC)</label>
              <select
                value={windowSpec.startHourUtc}
                onChange={(e) => handleHourChange(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 mt-1 focus:outline-none"
              >
                {[0, 1, 2, 3, 4, 5, 22, 23].map((h) => (
                  <option key={h} value={h}>
                    {h < 10 ? `0${h}:00 AM UTC` : `${h}:00 UTC`} (Duration: {windowSpec.durationHours} Hours)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
