import React, { useState } from 'react';
import { ShieldAlert, Play, CheckCircle2, Clock, Activity, ArrowRight } from 'lucide-react';
import { backupService } from '../../../services/backupService';
import { DisasterRecoveryPlan } from '../../../core/backup/BackupTypes';

export const DisasterRecoveryView: React.FC = () => {
  const [plans, setPlans] = useState<DisasterRecoveryPlan[]>(() => backupService.getDisasterRecoveryPlans());
  const [runningPlanId, setRunningPlanId] = useState<string | null>(null);

  const handleRunPlan = (planId: string) => {
    setRunningPlanId(planId);
    setTimeout(() => {
      backupService.runRecoveryPlan(planId);
      setPlans([...backupService.getDisasterRecoveryPlans()]);
      setRunningPlanId(null);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 04: Disaster Recovery Framework</h2>
            <p className="text-xs text-slate-400">Automated Recovery Orchestration, RTO/RPO Metrics, Failover Checklists & Recovery Logging</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 font-mono text-xs">
        {plans.map((plan) => (
          <div key={plan.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-extrabold text-slate-100">{plan.name}</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    {plan.targetEnvironment}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] mt-1">
                  Target RTO: <span className="text-emerald-400 font-bold">{plan.targetRTOSeconds}s</span> | Target RPO: <span className="text-emerald-400 font-bold">{plan.targetRPOSeconds}s (Zero Data Loss)</span>
                </div>
              </div>

              <button
                onClick={() => handleRunPlan(plan.id)}
                disabled={runningPlanId === plan.id}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-slate-950 shadow-lg shadow-rose-500/20 flex items-center space-x-2 transition-all disabled:opacity-50 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{runningPlanId === plan.id ? 'Running Disaster Failover...' : 'Execute Recovery Plan'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-slate-300 font-bold text-[11px] uppercase">Automated Recovery Checklist ({plan.checklistItems.length} Steps)</h4>
              <div className="space-y-2">
                {plan.checklistItems.map((step) => (
                  <div key={step.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[10px]">
                          {step.stepOrder}
                        </span>
                        <span className="font-bold text-slate-200">{step.title}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] pl-7">{step.description}</p>
                    </div>

                    <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
