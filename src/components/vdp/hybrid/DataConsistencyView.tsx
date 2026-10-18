import React from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertCircle, Search } from 'lucide-react';
import { hybridService } from '../../../services/hybridService';

export const DataConsistencyView: React.FC = () => {
  const checks = hybridService.getConsistencyChecks();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 05: Data Consistency & Integrity Validation</h2>
            <p className="text-xs text-slate-400">SHA-256 Checksum Matching, Drift Detection & Transaction Level Replay</p>
          </div>
        </div>

        <div className="overflow-x-auto mt-6">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase">
                <th className="p-3">Entity Collection</th>
                <th className="p-3">Local Count</th>
                <th className="p-3">Cloud Count</th>
                <th className="p-3">Unmatched Delta</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {checks.map((chk, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30">
                  <td className="p-3 font-bold text-slate-100">{chk.entityType}</td>
                  <td className="p-3 text-cyan-400">{chk.localRecordCount.toLocaleString()}</td>
                  <td className="p-3 text-blue-400">{chk.cloudRecordCount.toLocaleString()}</td>
                  <td className="p-3 font-bold text-amber-400">{chk.unmatchedRecords}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        chk.status === 'In Sync'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {chk.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{new Date(chk.lastValidated).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
