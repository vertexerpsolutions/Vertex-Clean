import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Activity,
  Terminal,
  Server
} from 'lucide-react';
import { deploymentService } from '../../services/deploymentService';
import { ValidationReport, ValidationItem } from '../../core/deployment/DeploymentTypes';

export const ValidationReportView: React.FC = () => {
  const [report, setReport] = useState<ValidationReport>(() => deploymentService.runValidation());
  const [isValidating, setIsValidating] = useState(false);

  const handleRunValidation = async () => {
    setIsValidating(true);
    await new Promise(r => setTimeout(r, 400));
    const newReport = deploymentService.runValidation();
    setReport(newReport);
    setIsValidating(false);
  };

  const getStatusBadge = (status: 'passed' | 'warning' | 'failed') => {
    switch (status) {
      case 'passed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>PASSED</span>
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3" />
            <span>WARNING</span>
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              PHASE 06: PRE-FLIGHT VALIDATION
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 uppercase">
              PRODUCTION READINESS
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">Deployment Validation Suite</h2>
          <p className="text-xs text-slate-400">
            Validates dependencies, environment profiles, security rules, and container readiness before launch.
          </p>
        </div>

        <button
          onClick={handleRunValidation}
          disabled={isValidating}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-2 shrink-0 shadow-lg shadow-emerald-500/20"
        >
          <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
          <span>{isValidating ? 'Running Suite...' : 'Re-Run Pre-Flight Check'}</span>
        </button>
      </div>

      {/* Summary Score Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Overall Status</span>
          <div className={`text-xl font-bold font-mono uppercase ${
            report.overallStatus === 'ready' ? 'text-emerald-400' : report.overallStatus === 'degraded' ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {report.overallStatus}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Score: {report.scorePercentage}%</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Passed Checks</span>
          <div className="text-2xl font-bold font-mono text-emerald-400">{report.passedCount}</div>
          <span className="text-[10px] text-slate-500 font-mono">Zero Errors</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Warnings</span>
          <div className="text-2xl font-bold font-mono text-amber-400">{report.warningCount}</div>
          <span className="text-[10px] text-slate-500 font-mono">Non-blocking</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <span className="text-xs text-slate-400">Critical Failures</span>
          <div className="text-2xl font-bold font-mono text-rose-400">{report.failedCount}</div>
          <span className="text-[10px] text-slate-500 font-mono">Deployment Blockers</span>
        </div>
      </div>

      {/* Validation Checklist Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center space-x-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Pre-Flight Validation Item Matrix</span>
        </h3>

        <div className="space-y-3">
          {report.items.map((item: ValidationItem) => (
            <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold text-slate-200">{item.id}</span>
                  <span className="text-xs font-bold text-slate-100">{item.title}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-900 text-slate-400 border border-slate-800 uppercase">
                    {item.category.replace('_', ' ')}
                  </span>
                </div>
                {getStatusBadge(item.status)}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
              
              <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800/60 font-mono text-[11px] text-emerald-400">
                {item.details}
              </div>

              {item.remediation && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 font-mono text-[11px] text-amber-300">
                  <span className="font-bold">Remediation: </span>{item.remediation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
