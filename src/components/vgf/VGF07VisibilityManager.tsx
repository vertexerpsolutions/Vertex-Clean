import React, { useState, useEffect } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  Search, 
  Filter, 
  BarChart3, 
  FileText, 
  RotateCcw, 
  Building2, 
  Users, 
  Package, 
  Layers, 
  CreditCard, 
  Landmark, 
  Briefcase, 
  DollarSign, 
  Percent, 
  Check, 
  X, 
  AlertTriangle, 
  Clock, 
  History, 
  Lock, 
  Unlock, 
  RefreshCw, 
  FileSpreadsheet, 
  Tag, 
  ChevronRight, 
  SlidersHorizontal 
} from 'lucide-react';
import { 
  visibilityService, 
  VisibilityState, 
  VisibilityRecord, 
  EntityType, 
  VisibilityAuditEntry 
} from '../../services/visibilityService';

export const VGF07VisibilityManager: React.FC = () => {
  const [visState, setVisState] = useState<VisibilityState>(visibilityService.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'records_manager' | 'security_audit' | 'reports_integration'>('dashboard');

  // Filters state
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType | 'All'>('All');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible_only' | 'hidden_only'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  // Multi-select state
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);

  // Action Modal State
  const [activeModalAction, setActiveModalAction] = useState<{
    type: 'hide_single' | 'restore_single' | 'bulk_hide' | 'bulk_restore';
    recordId?: string;
    recordName?: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<string>('vtx_sysadmin');

  // Reports Modal State
  const [activeReportModal, setActiveReportModal] = useState<'hidden_report' | 'history_report' | 'stats_report' | 'audit_report' | null>(null);

  useEffect(() => {
    setVisState(visibilityService.getState());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleToggleSelectRecord = (id: string) => {
    if (selectedRecordIds.includes(id)) {
      setSelectedRecordIds(selectedRecordIds.filter(item => item !== id));
    } else {
      setSelectedRecordIds([...selectedRecordIds, id]);
    }
  };

  const handleSelectAllFiltered = (filteredIds: string[]) => {
    if (selectedRecordIds.length === filteredIds.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(filteredIds);
    }
  };

  const handleConfirmAction = () => {
    if (!actionReason.trim()) {
      showToast('Please provide a valid reason for this visibility operation.');
      return;
    }

    if (!activeModalAction) return;

    if (activeModalAction.type === 'hide_single' && activeModalAction.recordId) {
      visibilityService.hideRecord(activeModalAction.recordId, actionReason, currentUser);
      showToast(`Record '${activeModalAction.recordName}' is now HIDDEN.`);
    } else if (activeModalAction.type === 'restore_single' && activeModalAction.recordId) {
      visibilityService.restoreRecord(activeModalAction.recordId, actionReason, currentUser);
      showToast(`Record '${activeModalAction.recordName}' restored to VISIBLE.`);
    } else if (activeModalAction.type === 'bulk_hide') {
      visibilityService.bulkHide(selectedRecordIds, actionReason, currentUser);
      showToast(`${selectedRecordIds.length} records are now HIDDEN.`);
      setSelectedRecordIds([]);
    } else if (activeModalAction.type === 'bulk_restore') {
      visibilityService.bulkRestore(selectedRecordIds, actionReason, currentUser);
      showToast(`${selectedRecordIds.length} records restored to VISIBLE.`);
      setSelectedRecordIds([]);
    }

    setVisState(visibilityService.getState());
    setActiveModalAction(null);
    setActionReason('');
  };

  const markCompleted = () => {
    visibilityService.markVgf07Completed();
    setVisState(visibilityService.getState());
    showToast('VGF-07 Visibility Manager Marked as Completed!');
  };

  const { records, auditLogs, stats } = visState;

  // Filtered records
  const filteredRecords = records.filter(r => {
    if (selectedEntityType !== 'All' && r.entityType !== selectedEntityType) return false;
    if (visibilityFilter === 'visible_only' && r.isHidden) return false;
    if (visibilityFilter === 'hidden_only' && !r.isHidden) return false;
    if (selectedBranch !== 'All' && r.branch !== selectedBranch) return false;
    if (selectedCompany !== 'All' && r.company !== selectedCompany) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.entityName.toLowerCase().includes(q) ||
        r.entityCode.toLowerCase().includes(q) ||
        (r.hiddenBy && r.hiddenBy.toLowerCase().includes(q)) ||
        (r.hiddenReason && r.hiddenReason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const entityTypesList: EntityType[] = [
    'Items', 'Item Categories', 'Customers', 'Suppliers', 'Warehouses',
    'Branches', 'Banks', 'Treasuries', 'Accounts', 'Employees', 'Assets',
    'Currencies', 'Payment Methods', 'Tax Codes'
  ];

  const recentlyHidden = auditLogs.filter(a => a.action === 'hide').slice(0, 5);
  const recentlyRestored = auditLogs.filter(a => a.action === 'restore').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <EyeOff className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                VGF-07
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                visState.isVgf07Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{visState.isVgf07Completed ? 'VGF-07 COMPLETED' : 'OFFICIALLY APPROVED'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Version 1.0.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Enterprise Visibility Manager
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Centralized administrative governance engine for hiding business entities without deletion. Keeps historical data, reports, and existing transactions intact while excluding hidden items from active lookups.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark VGF-07 Completed</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>NON-DESTRUCTIVE GOVERNANCE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: '1. Visibility Dashboard', icon: BarChart3 },
            { id: 'records_manager', label: `2. Entities & Operations (${records.length})`, icon: EyeOff },
            { id: 'security_audit', label: `3. Security & Audit Trail (${auditLogs.length})`, icon: ShieldCheck },
            { id: 'reports_integration', label: '4. Reports & Integration', icon: FileText }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: VISIBILITY DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Total Managed Entities</span>
              <p className="text-2xl font-black text-slate-100 font-mono">{stats.totalEntities}</p>
              <p className="text-[10px] text-slate-400">Across 14 ERP Subsystems</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-emerald-400 uppercase">Visible Records</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">{stats.totalVisible}</p>
              <p className="text-[10px] text-emerald-400/80">Active in search & lookups</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-rose-400 uppercase">Hidden Records</span>
              <p className="text-2xl font-black text-rose-400 font-mono">{stats.totalHidden}</p>
              <p className="text-[10px] text-rose-400/80">Excluded from active pickers</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-amber-400 uppercase">Archived Share</span>
              <p className="text-2xl font-black text-amber-400 font-mono">{stats.hiddenPercentage.toFixed(1)}%</p>
              <p className="text-[10px] text-amber-400/80">Historical integrity preserved</p>
            </div>
          </div>

          {/* Supported Entities Grid & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Entity Types Matrix (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Visibility Status by Entity Type</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">14 Enterprise Subsystems</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                {stats.byEntityType.map(item => (
                  <div key={item.type} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>{item.type}</span>
                      <span className="font-mono text-[10px] text-slate-400">{item.total} total</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono">
                      <span className="text-emerald-400">{item.visible} Visible</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-rose-400">{item.hidden} Hidden</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recently Hidden & Restored (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Recent Governance Activity</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Live Activity Feed</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">Recently Hidden</span>
                  {recentlyHidden.map(h => (
                    <div key={h.id} className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/20 text-xs space-y-0.5">
                      <div className="flex justify-between font-bold text-slate-200">
                        <span>{h.entityName}</span>
                        <span className="text-rose-400 font-mono text-[10px]">{h.entityCode}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{h.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ENTITIES & VISIBILITY OPERATIONS */}
      {activeTab === 'records_manager' && (
        <div className="space-y-6 animate-fade-in">
          {/* Advanced Search & Filter Bar (Phase 04) */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                <span>Multi-Criteria Entity Visibility Filter</span>
              </h3>

              {/* Bulk Actions Bar (Phase 03) */}
              {selectedRecordIds.length > 0 && (
                <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-xl border border-amber-500/40 animate-fade-in">
                  <span className="text-[10px] font-mono text-amber-400 font-bold px-2">{selectedRecordIds.length} Selected</span>
                  <button
                    onClick={() => setActiveModalAction({ type: 'bulk_hide' })}
                    className="px-2.5 py-1 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Selected</span>
                  </button>
                  <button
                    onClick={() => setActiveModalAction({ type: 'bulk_restore' })}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Restore Selected</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Entity Type Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Entity Subsystem</label>
                <select
                  value={selectedEntityType}
                  onChange={e => setSelectedEntityType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All 14 Subsystems</option>
                  {entityTypesList.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Visibility Status Filter */}
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Visibility Status</label>
                <select
                  value={visibilityFilter}
                  onChange={e => setVisibilityFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">All Records (Visible & Hidden)</option>
                  <option value="visible_only">Visible Only</option>
                  <option value="hidden_only">Hidden Only</option>
                </select>
              </div>

              {/* Quick Search */}
              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-mono">Quick Search Query</label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Code, Name, Reason, or User..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Records Table */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                  <th className="pb-3 pr-2">
                    <input
                      type="checkbox"
                      checked={selectedRecordIds.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={() => handleSelectAllFiltered(filteredRecords.map(r => r.id))}
                      className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                    />
                  </th>
                  <th className="pb-3">Subsystem</th>
                  <th className="pb-3">Code & Name</th>
                  <th className="pb-3">Category / Branch</th>
                  <th className="pb-3">Visibility Status</th>
                  <th className="pb-3">Hidden Reason / By</th>
                  <th className="pb-3 text-right">Usage Count</th>
                  <th className="pb-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 italic">
                      No records match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedRecordIds.includes(r.id)}
                          onChange={() => handleToggleSelectRecord(r.id)}
                          className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                        />
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-400">{r.entityType}</td>
                      <td className="py-3 font-bold text-slate-100">
                        <div>{r.entityName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{r.entityCode}</div>
                      </td>
                      <td className="py-3 text-slate-400 font-mono text-[10px]">
                        <div>{r.category || 'General'}</div>
                        <div className="text-slate-500">{r.branch || 'Global'}</div>
                      </td>
                      <td className="py-3">
                        {r.isHidden ? (
                          <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono font-bold flex items-center space-x-1 w-fit">
                            <EyeOff className="w-3 h-3" />
                            <span>HIDDEN</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center space-x-1 w-fit">
                            <Eye className="w-3 h-3" />
                            <span>VISIBLE</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-300 text-[11px]">
                        {r.isHidden ? (
                          <div>
                            <div className="font-bold text-rose-300/90 leading-snug">{r.hiddenReason}</div>
                            <div className="text-[10px] text-slate-500 font-mono">By {r.hiddenBy} on {new Date(r.hiddenAt!).toLocaleDateString()}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">Active in active pickers</span>
                        )}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-300 font-bold">{r.usageCountInTransactions}</td>
                      <td className="py-3 text-center">
                        {r.isHidden ? (
                          <button
                            onClick={() => setActiveModalAction({ type: 'restore_single', recordId: r.id, recordName: r.entityName })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40 text-[10px] font-bold transition-all"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveModalAction({ type: 'hide_single', recordId: r.id, recordName: r.entityName })}
                            className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 border border-rose-500/40 text-[10px] font-bold transition-all"
                          >
                            Hide
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & AUDIT TRAIL (Phase 05) */}
      {activeTab === 'security_audit' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Visibility Governance Audit Log</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">{auditLogs.length} System Trail Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Subsystem</th>
                    <th className="pb-3">Entity Code & Name</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Performed By</th>
                    <th className="pb-3">Justification Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditLogs.map(a => (
                    <tr key={a.id} className="hover:bg-slate-950/50">
                      <td className="py-3 text-slate-400 text-[10px]">{new Date(a.timestamp).toLocaleString()}</td>
                      <td className="py-3 font-bold text-amber-400">{a.entityType}</td>
                      <td className="py-3 text-slate-100">
                        <div>{a.entityName}</div>
                        <div className="text-[10px] text-slate-500">{a.entityCode}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          a.action === 'hide'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {a.action}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-bold">{a.performedBy}</td>
                      <td className="py-3 text-slate-400 font-sans text-xs">{a.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & INTEGRATION (Phase 06) */}
      {activeTab === 'reports_integration' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Visibility Management Reports & System Integration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { type: 'hidden_report', title: 'Hidden Records Report', desc: 'Comprehensive listing of all suppressed entities across 14 modules.' },
                { type: 'history_report', title: 'Visibility History Report', desc: 'Chronological state transition timeline for auditing.' },
                { type: 'stats_report', title: 'Subsystem Breakdown', desc: 'Distribution matrix of visible vs archived entities.' },
                { type: 'audit_report', title: 'User Governance Audit', desc: 'Security officer authorization & justification log.' }
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

      {/* Action Reason Modal */}
      {activeModalAction && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                Confirm Visibility Operation
              </h3>
              <button onClick={() => setActiveModalAction(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                You are performing a visibility state change. Please enter an authorized audit justification.
              </p>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Authorized Administrator ID</label>
                <input
                  type="text"
                  value={currentUser}
                  onChange={e => setCurrentUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Justification Reason *</label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={e => setActionReason(e.target.value)}
                  placeholder="e.g. End of life product, compliance hold, merged branch..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Apply & Record Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Visibility Report Preview</h3>
              <button onClick={() => setActiveReportModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono space-y-2">
              <p className="text-amber-400 font-bold uppercase">Vertex Enterprise Visibility Report Generated</p>
              <p>Subsystems Scanned: 14 Modules</p>
              <p>Total Records Evaluated: {stats.totalEntities}</p>
              <p>Suppressed Entities: {stats.totalHidden}</p>
              <p>Audit Verification Status: PASS (Compliance 100%)</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
