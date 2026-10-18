import React, { useState, useEffect } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  GitMerge, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Play, 
  RotateCcw, 
  Users, 
  Truck, 
  Package, 
  BookOpen, 
  Landmark, 
  Building2, 
  Briefcase, 
  CreditCard, 
  DollarSign, 
  Search, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  FileText, 
  Activity, 
  Clock, 
  Undo2, 
  Eye, 
  BarChart3, 
  Sliders, 
  RefreshCw, 
  Zap, 
  Lock, 
  Shield, 
  CheckSquare, 
  FileCheck, 
  AlertCircle, 
  Terminal, 
  Building, 
  ListFilter, 
  Database
} from 'lucide-react';
import { 
  mergeEngineService, 
  MergeEngineState, 
  MergeRecordType, 
  MergeCandidatePair, 
  DEFAULT_RECORD_TYPE_LABELS 
} from '../../services/mergeEngineService';

type VGF03Tab = 
  | 'center'
  | 'selection'
  | 'validation'
  | 'execution'
  | 'rollback_audit'
  | 'reports_integration';

export const VGF03MergeEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VGF03Tab>('center');
  const [engineState, setEngineState] = useState<MergeEngineState>(mergeEngineService.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filter & selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<MergeCandidatePair | null>(
    engineState.candidates[0] || null
  );

  // Modal states for reports
  const [activeReportModal, setActiveReportModal] = useState<'merge' | 'affected' | 'relationship' | 'audit' | 'statistics' | null>(null);
  const [detailSnapshotRecord, setDetailSnapshotRecord] = useState<any | null>(null);

  useEffect(() => {
    setEngineState(mergeEngineService.getState());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleUpdateRecordType = (recordType: MergeRecordType) => {
    const updated = mergeEngineService.updateState({ activeRecordType: recordType });
    setEngineState({ ...updated });
    showToast(`Switched view to ${DEFAULT_RECORD_TYPE_LABELS[recordType].title}`);
  };

  const handleAttributeSelection = (candidateId: string, fieldKey: string, val: 'primary' | 'secondary' | 'custom', customVal?: string) => {
    mergeEngineService.updateCandidateAttribute(candidateId, fieldKey, val, customVal);
    setEngineState(mergeEngineService.getState());
    // Keep local candidate reference updated
    const updatedCand = mergeEngineService.getState().candidates.find(c => c.id === candidateId);
    if (updatedCand) setSelectedCandidate(updatedCand);
    showToast(`Updated winning value for ${fieldKey}`);
  };

  const handleExecuteMerge = (candidateId: string) => {
    const result = mergeEngineService.executeMerge(candidateId);
    if (result) {
      setEngineState(mergeEngineService.getState());
      showToast(`Successfully merged ${result.secondaryCode} into ${result.primaryCode}!`);
      setActiveTab('rollback_audit');
    }
  };

  const handleRollback = (executionId: string) => {
    const success = mergeEngineService.rollbackMerge(executionId);
    if (success) {
      setEngineState(mergeEngineService.getState());
      showToast(`Merge transaction ${executionId} rolled back successfully!`);
    }
  };

  const markCompleted = () => {
    mergeEngineService.markVgf03Completed();
    setEngineState(mergeEngineService.getState());
    showToast('VGF-03 Merge Engine Marked as Completed & Approved!');
  };

  const getRecordTypeIcon = (recType: MergeRecordType) => {
    switch (recType) {
      case 'customers': return Users;
      case 'suppliers': return Truck;
      case 'items': return Package;
      case 'accounts': return BookOpen;
      case 'warehouses': return Landmark;
      case 'branches': return Building2;
      case 'employees': return Users;
      case 'assets': return Briefcase;
      case 'banks': return CreditCard;
      case 'treasuries': return DollarSign;
      default: return Layers;
    }
  };

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Title & Banner Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GitMerge className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                VGF-03
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                engineState.isVgf03Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{engineState.isVgf03Completed ? 'VGF-03 COMPLETED' : 'OFFICIALLY APPROVED'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Version 1.1.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Enterprise Merge Engine
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Safely merge duplicate entities, reconcile financial ledgers, re-link transactional histories, and maintain complete audit trails with full snapshot rollback support.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark VGF-03 Completed</span>
            </button>
            <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center space-x-2 ${
              engineState.isVgf03Completed
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/40 animate-pulse'
            }`}>
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{engineState.isVgf03Completed ? 'MERGE ENGINE ACTIVE' : 'MERGE ENGINE INITIALIZED'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'center', label: '1. Merge Center', icon: GitMerge },
            { id: 'selection', label: '2. Record Selection & Side-by-Side', icon: Sliders },
            { id: 'validation', label: '3. Merge Validation Lab', icon: ShieldCheck },
            { id: 'execution', label: '4. Merge Execution Engine', icon: Play },
            { id: 'rollback_audit', label: '5. Rollback & Audit Vault', icon: Undo2 },
            { id: 'reports_integration', label: '6. Reports & Module Integration', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as VGF03Tab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: MERGE CENTER DASHBOARD */}
      {activeTab === 'center' && (
        <div className="space-y-6 animate-fade-in">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Total Merges Executed</span>
                <GitMerge className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">{engineState.stats.totalMergesExecuted}</p>
              <p className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% Data Integrity Preserved</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Consolidated Records</span>
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">{engineState.stats.recordsConsolidatedCount}</p>
              <p className="text-[11px] text-indigo-300 mt-1">Duplicates safely unified</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Relinked Transactions</span>
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">{engineState.stats.financialTransactionsRelinked}</p>
              <p className="text-[11px] text-emerald-400 mt-1">Invoices, GL, Stock & Receipts</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400 uppercase">Rollbacks Executed</span>
                <Undo2 className="w-5 h-5 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">{engineState.stats.rollbacksPerformed}</p>
              <p className="text-[11px] text-slate-400 mt-1">Snapshot restoration available</p>
            </div>
          </div>

          {/* 10 Supported Record Types Grid */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>10 Supported Merge Entity Domains</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Select a domain to inspect duplicate candidates and begin field consolidation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.keys(DEFAULT_RECORD_TYPE_LABELS) as MergeRecordType[]).map(recType => {
                const info = DEFAULT_RECORD_TYPE_LABELS[recType];
                const Icon = getRecordTypeIcon(recType);
                const isSelected = engineState.activeRecordType === recType;
                return (
                  <button
                    key={recType}
                    onClick={() => handleUpdateRecordType(recType)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 shadow-lg ring-1 ring-amber-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                        {info.module}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 truncate">{info.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-snug">{info.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Merge Operations Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Recent Merge Operations</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Merge Code</th>
                    <th className="pb-2">Domain</th>
                    <th className="pb-2">Primary Target Record</th>
                    <th className="pb-2">Merged Secondary Record</th>
                    <th className="pb-2">Transferred Docs</th>
                    <th className="pb-2">Financial Volume</th>
                    <th className="pb-2">Executed At</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {engineState.executionHistory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-950/50">
                      <td className="py-3 font-mono font-bold text-amber-400">{item.mergeCode}</td>
                      <td className="py-3 font-mono text-slate-300 uppercase text-[11px]">{item.recordType}</td>
                      <td className="py-3 text-slate-200 font-semibold">{item.primaryName} ({item.primaryCode})</td>
                      <td className="py-3 text-slate-400">{item.secondaryName} ({item.secondaryCode})</td>
                      <td className="py-3 font-mono text-indigo-300">{item.transferredItemsCount} items</td>
                      <td className="py-3 font-mono text-emerald-400">${item.totalFinancialVolumeTransferred.toLocaleString()}</td>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{new Date(item.executedAt).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          item.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECORD SELECTION & SIDE-BY-SIDE COMPARISON */}
      {activeTab === 'selection' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <span>Side-by-Side Record Comparison & Field Conflict Resolver</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Compare Primary vs Secondary records. Select winning field values or type custom values prior to merging.
                </p>
              </div>

              {selectedCandidate && (
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                    Match Confidence: {selectedCandidate.matchScorePercentage}%
                  </span>
                  <button
                    onClick={() => setActiveTab('validation')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow flex items-center space-x-1"
                  >
                    <span>Proceed to Validation</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Candidate Selector Switcher */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {engineState.candidates.map(candidate => {
                const isSelected = selectedCandidate?.id === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">{candidate.recordType}</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">{candidate.matchScorePercentage}% Match</span>
                    </div>
                    <p className="text-xs font-bold text-slate-100 mt-1 truncate">
                      {candidate.primaryRecord.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      vs {candidate.secondaryRecord.name}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Side-by-Side Detailed Comparison Table */}
            {selectedCandidate && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Primary Record Summary Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                      PRIMARY RECORD (WILL BE RETAINED)
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{selectedCandidate.primaryRecord.name}</h4>
                    <p className="text-xs font-mono text-slate-400">
                      ID: <span className="text-emerald-400">{selectedCandidate.primaryRecord.code}</span> | Balance: <strong className="text-emerald-400">${selectedCandidate.primaryRecord.balance.toLocaleString()}</strong>
                    </p>
                  </div>

                  {/* Secondary Record Summary Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/40 space-y-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold uppercase">
                      SECONDARY RECORD (WILL BE CONSOLIDATED & DEACTIVATED)
                    </span>
                    <h4 className="text-sm font-bold text-slate-100">{selectedCandidate.secondaryRecord.name}</h4>
                    <p className="text-xs font-mono text-slate-400">
                      ID: <span className="text-rose-400">{selectedCandidate.secondaryRecord.code}</span> | Balance: <strong className="text-rose-400">${selectedCandidate.secondaryRecord.balance.toLocaleString()}</strong>
                    </p>
                  </div>
                </div>

                {/* Attribute Comparison Grid */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Field Conflict Resolution Matrix</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                          <th className="pb-2">Attribute Field</th>
                          <th className="pb-2">Primary Value</th>
                          <th className="pb-2">Secondary Value</th>
                          <th className="pb-2">Selection Rule</th>
                          <th className="pb-2">Final Winning Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedCandidate.attributes.map(attr => (
                          <tr key={attr.fieldKey} className="hover:bg-slate-900/50">
                            <td className="py-3 font-semibold text-slate-200">{attr.fieldLabel}</td>
                            <td className="py-3 font-mono text-emerald-300">{String(attr.primaryValue)}</td>
                            <td className="py-3 font-mono text-rose-300">{String(attr.secondaryValue)}</td>
                            <td className="py-3">
                              <select
                                value={attr.selectedValue}
                                onChange={e => handleAttributeSelection(selectedCandidate.id, attr.fieldKey, e.target.value as any)}
                                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                              >
                                <option value="primary">Use Primary Value</option>
                                <option value="secondary">Use Secondary Value</option>
                                <option value="custom">Custom Override</option>
                              </select>
                            </td>
                            <td className="py-3 font-mono font-bold text-amber-400">
                              {attr.selectedValue === 'primary' && String(attr.primaryValue)}
                              {attr.selectedValue === 'secondary' && String(attr.secondaryValue)}
                              {attr.selectedValue === 'custom' && (attr.customValue || 'Custom Value')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Linked Transactions & Documents to Transfer */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Linked Transactions & Documents ({selectedCandidate.linkedTransactions.length} Items to Re-parent)</span>
                  </h4>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                          <th className="pb-2">Document #</th>
                          <th className="pb-2">Type</th>
                          <th className="pb-2">Date</th>
                          <th className="pb-2">Amount</th>
                          <th className="pb-2">Description</th>
                          <th className="pb-2">Current Belongs To</th>
                          <th className="pb-2">Target Position</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {selectedCandidate.linkedTransactions.map(tx => (
                          <tr key={tx.id} className="hover:bg-slate-900/50">
                            <td className="py-2.5 font-mono text-amber-400 font-bold">{tx.documentNumber}</td>
                            <td className="py-2.5 text-slate-300 font-semibold">{tx.entityType}</td>
                            <td className="py-2.5 font-mono text-slate-400">{tx.date}</td>
                            <td className="py-2.5 font-mono text-emerald-400">${tx.amount.toLocaleString()}</td>
                            <td className="py-2.5 text-slate-300">{tx.description}</td>
                            <td className="py-2.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                tx.belongsTo === 'primary' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {tx.belongsTo} Record
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-bold uppercase">
                                Re-parent to {selectedCandidate.primaryRecord.code}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MERGE VALIDATION LAB */}
      {activeTab === 'validation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <span>Phase 03: Pre-Merge Integrity Validation Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comprehensive automated scan verifying balances, foreign key relationships, pending workflow locks, and audit integrity.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('execution')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow flex items-center space-x-1"
              >
                <span>Proceed to Execution Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Validation Checkpoints List */}
            <div className="space-y-3">
              {engineState.validationWarnings.map(warn => (
                <div key={warn.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    warn.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-100">{warn.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 uppercase">
                        {warn.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{warn.message}</p>
                    <p className="text-[11px] text-amber-300 font-mono mt-1.5 flex items-center space-x-1">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span>Resolution Rule: {warn.resolutionHint}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MERGE EXECUTION CONSOLE */}
      {activeTab === 'execution' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Play className="w-5 h-5 text-amber-400" />
                  <span>Phase 04: Live Merge Execution Console</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute safe transaction re-parenting across invoices, payments, receipts, journal entries, inventory movements, and assets.
                </p>
              </div>
            </div>

            {selectedCandidate ? (
              <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
                  <GitMerge className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-100">Ready to Merge Candidate Pair</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Consolidate <strong className="text-rose-400">{selectedCandidate.secondaryRecord.name} ({selectedCandidate.secondaryRecord.code})</strong> into <strong className="text-emerald-400">{selectedCandidate.primaryRecord.name} ({selectedCandidate.primaryRecord.code})</strong>.
                  </p>
                </div>

                <div className="inline-flex items-center space-x-4 bg-slate-900 px-6 py-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <p className="text-slate-400">Total Transactions to Transfer</p>
                    <p className="font-bold text-indigo-300 font-mono text-sm mt-0.5">{selectedCandidate.linkedTransactions.length} Documents</p>
                  </div>
                  <div className="h-8 w-px bg-slate-800" />
                  <div>
                    <p className="text-slate-400">Financial Volume</p>
                    <p className="font-bold text-emerald-400 font-mono text-sm mt-0.5">${selectedCandidate.linkedTransactions.reduce((acc, c) => acc + c.amount, 0).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => handleExecuteMerge(selectedCandidate.id)}
                    className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-xl shadow-amber-500/20 flex items-center space-x-2 mx-auto"
                  >
                    <Play className="w-4 h-4 text-slate-950" />
                    <span>Confirm & Execute Safe Merge</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Please select a candidate pair in Section 2.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ROLLBACK & AUDIT VAULT */}
      {activeTab === 'rollback_audit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Undo2 className="w-5 h-5 text-amber-400" />
              <span>Phase 05: Merge Execution History & Undo Rollback Vault</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Merge Code</th>
                    <th className="pb-2">Primary Record</th>
                    <th className="pb-2">Merged Secondary Record</th>
                    <th className="pb-2">Transferred Docs</th>
                    <th className="pb-2">Executed At</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {engineState.executionHistory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-950/50">
                      <td className="py-3 font-mono font-bold text-amber-400">{item.mergeCode}</td>
                      <td className="py-3 text-slate-200 font-semibold">{item.primaryName} ({item.primaryCode})</td>
                      <td className="py-3 text-slate-400">{item.secondaryName} ({item.secondaryCode})</td>
                      <td className="py-3 font-mono text-indigo-300">{item.transferredItemsCount} items</td>
                      <td className="py-3 font-mono text-slate-400 text-[11px]">{new Date(item.executedAt).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          item.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {item.status === 'completed' && (
                          <button
                            onClick={() => handleRollback(item.id)}
                            className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-colors shadow flex items-center space-x-1"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            <span>Undo Merge</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS & INTEGRATION */}
      {activeTab === 'reports_integration' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Phase 06: Reports & Module Integration Matrix</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { type: 'merge', title: 'Merge Summary Report', desc: 'Consolidated report of all merged records, accounts, and primary field values.' },
                { type: 'affected', title: 'Affected Records Report', desc: 'Detail list of all secondary records merged and deactivated.' },
                { type: 'relationship', title: 'Relationship Update Report', desc: 'Traceability list of all re-parented invoices, receipts, and journal vouchers.' },
                { type: 'audit', title: 'Audit Trail Report', desc: 'Security audit logs containing user ID, timestamp, and field level before/after values.' },
                { type: 'statistics', title: 'Merge Statistics Report', desc: 'Analytical chart overview of record consolidation efficiency.' }
              ].map(rpt => (
                <button
                  key={rpt.type}
                  onClick={() => setActiveReportModal(rpt.type as any)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all space-y-2"
                >
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-100">{rpt.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{rpt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span className="uppercase">{activeReportModal} Report</span>
              </h3>
              <button
                onClick={() => setActiveReportModal(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2 max-h-80 overflow-y-auto">
              <p className="text-amber-400 font-bold">VERTEX ERP VGF-03 MERGE ENGINE AUDIT REPORT</p>
              <p className="text-slate-500">Generated: {new Date().toISOString()}</p>
              <div className="h-px bg-slate-800 my-2" />
              <p>Record Type: {engineState.activeRecordType.toUpperCase()}</p>
              <p>Total Executed Merges: {engineState.stats.totalMergesExecuted}</p>
              <p>Consolidated Entities: {engineState.stats.recordsConsolidatedCount}</p>
              <p>Relinked Transactions: {engineState.stats.financialTransactionsRelinked}</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
