import React, { useState, useEffect } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Play, 
  Square, 
  RotateCcw, 
  Users, 
  Building2, 
  Building, 
  Landmark, 
  CreditCard, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  BarChart3, 
  Sliders, 
  Check, 
  X, 
  Plus, 
  Eye, 
  Activity, 
  Zap, 
  ChevronRight, 
  HelpCircle, 
  FileCheck, 
  RefreshCw, 
  Award 
} from 'lucide-react';
import { 
  businessDayService, 
  BusinessDayState, 
  BusinessDayStatus, 
  WorkShift, 
  ShiftType, 
  BranchBusinessDay 
} from '../../services/businessDayService';
import { setupWizardService } from '../../services/setupWizardService';
import { bankAccountService } from '../../services/bankAccountService';

type VGF04Tab = 
  | 'day_center'
  | 'shift_mgmt'
  | 'day_closing'
  | 'reconciliation'
  | 'multi_branch'
  | 'reports_integration';

export const VGF04BusinessDayExtension: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VGF04Tab>('day_center');
  const [bdState, setBdState] = useState<BusinessDayState>(businessDayService.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wizardCfg = setupWizardService.getConfig();
  const branches = wizardCfg?.branches || [];
  const currentBranch = branches.find((b: any) => b.isMain) || branches[0] || { id: 'BR-01', code: 'BR-01', name: 'الفرع الرئيسي' };
  const openBranchId = currentBranch.id;
  const liveBankBalance = bankAccountService.getTotalBankLiquidity(openBranchId);
  const visibleBranches = bdState.branches.filter(b => b.branchId === openBranchId || b.branchId === 'BR-01' || b.branchId === 'BR-NY-01').slice(0, 1);

  // New Shift modal state
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [newShiftType, setNewShiftType] = useState<ShiftType>('morning');
  const [newShiftTitle, setNewShiftTitle] = useState('');

  // Report modal state
  const [activeReportModal, setActiveReportModal] = useState<'day' | 'shift' | 'closing' | 'reconciliation' | 'cash' | 'branch' | 'audit' | null>(null);

  useEffect(() => {
    setBdState(businessDayService.getState());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleBranchStatusChange = (branchId: string, status: BusinessDayStatus) => {
    businessDayService.updateBranchStatus(branchId, status);
    setBdState(businessDayService.getState());
    showToast(`Branch ${branchId} status updated to ${status.toUpperCase()}`);
  };

  const handleApproveVariance = (recId: string) => {
    businessDayService.approveReconciliationVariance(recId);
    setBdState(businessDayService.getState());
    showToast('Reconciliation variance approved by Financial Controller');
  };

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    const newShift: WorkShift = {
      id: `SH-CUSTOM-${Date.now().toString().slice(-4)}`,
      shiftCode: `SFT-${Date.now().toString().slice(-4)}`,
      type: newShiftType,
      title: newShiftTitle || `${newShiftType.toUpperCase()} Duty Shift`,
      branchId: 'BR-NY-01',
      branchName: 'New York Headquarters',
      assignedUsers: ['vtx_sysadmin'],
      assignedCashiers: ['vtx_sysadmin'],
      assignedWarehouse: 'WH-NY-MAIN',
      assignedTreasury: 'TR-NY-PRIMARY',
      startTime: '09:00 AM',
      endTime: '05:00 PM',
      status: 'active',
      cashCollected: 0.00,
      receiptsIssuedCount: 0
    };
    businessDayService.addShift(newShift);
    setBdState(businessDayService.getState());
    setIsAddShiftOpen(false);
    setNewShiftTitle('');
    showToast('New Custom Work Shift Created Successfully!');
  };

  const markCompleted = () => {
    businessDayService.markVgf04Completed();
    setBdState(businessDayService.getState());
    showToast('VGF-04 Business Day Extension Marked as Completed!');
  };

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Calendar className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                VGF-04
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                bdState.isVgf04Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{bdState.isVgf04Completed ? 'VGF-04 COMPLETED' : 'OFFICIALLY APPROVED'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Version 1.1.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Business Day Extension
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Enterprise control for multi-branch business days, work shifts, treasury cash sessions, end-of-day closing automation, and multi-ledger financial reconciliation.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark VGF-04 Completed</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>BUSINESS DAY ENGINE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'day_center', label: '1. Business Day Center', icon: Calendar },
            { id: 'shift_mgmt', label: '2. Shift Management', icon: Clock },
            { id: 'day_closing', label: '3. Day Closing Console', icon: Lock },
            { id: 'reconciliation', label: '4. Financial Reconciliation', icon: ShieldCheck },
            { id: 'multi_branch', label: '5. Multi-Branch Operations', icon: Building2 },
            { id: 'reports_integration', label: '6. Reports & Integration', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as VGF04Tab)}
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

      {/* TAB 1: BUSINESS DAY CENTER */}
      {activeTab === 'day_center' && (
        <div className="space-y-6 animate-fade-in">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>GLOBAL BUSINESS DATE</span>
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">{bdState.currentGlobalDate}</p>
              <p className="text-[11px] text-emerald-400 mt-1 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Financial Period</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>OPEN BRANCH DAYS</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">
                {bdState.branches.filter(b => b.status === 'open' || b.status === 'closing_in_progress').length} / {bdState.branches.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Active trading operating units</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>ACTIVE WORK SHIFTS</span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">
                {bdState.shifts.filter(s => s.status === 'active').length}
              </p>
              <p className="text-[11px] text-indigo-300 mt-1">Cashiers & users on active shift</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>CLOSED & LOCKED DAYS</span>
                <Lock className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-black text-slate-100 font-mono mt-2">
                {bdState.branches.filter(b => b.status === 'closed' || b.status === 'locked').length}
              </p>
              <p className="text-[11px] text-sky-300 mt-1">Audited and ledger locked</p>
            </div>
          </div>

          {/* Working Calendar & Day Control Grid */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span>Working Calendar & Branch Business Day Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Control business day status independently per operating branch.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Branch Name</th>
                    <th className="pb-2">Region</th>
                    <th className="pb-2">Business Date</th>
                    <th className="pb-2">Opened At</th>
                    <th className="pb-2">Treasury Cash ($)</th>
                    <th className="pb-2">Bank Balance ($)</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visibleBranches.map(branch => (
                    <tr key={branch.branchId} className="hover:bg-slate-950/50">
                      <td className="py-3 font-bold text-slate-100">{branch.branchName} ({branch.branchCode})</td>
                      <td className="py-3 text-slate-400 font-mono">{branch.region}</td>
                      <td className="py-3 font-mono text-amber-400 font-bold">{branch.currentBusinessDate}</td>
                      <td className="py-3 font-mono text-slate-400 text-[11px]">{new Date(branch.openedAt).toLocaleTimeString()}</td>
                      <td className="py-3 font-mono text-emerald-400">${branch.treasuryBalance.toLocaleString()}</td>
                      <td className="py-3 font-mono text-sky-400">${liveBankBalance.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          branch.status === 'open' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          branch.status === 'closing_in_progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          branch.status === 'closed' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                          'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {branch.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center space-x-2">
                          {branch.status === 'closed' && (
                            <button
                              onClick={() => handleBranchStatusChange(branch.branchId, 'open')}
                              className="px-2.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px]"
                            >
                              Open Day
                            </button>
                          )}
                          {branch.status === 'open' && (
                            <button
                              onClick={() => handleBranchStatusChange(branch.branchId, 'closing_in_progress')}
                              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px]"
                            >
                              Close Day
                            </button>
                          )}
                          {branch.status === 'closed' && (
                            <button
                              onClick={() => handleBranchStatusChange(branch.branchId, 'locked')}
                              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-[10px]"
                            >
                              Lock Day
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHIFT MANAGEMENT */}
      {activeTab === 'shift_mgmt' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span>Work Shift Management & Cashier Assignment</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Assign users, cash drawers, warehouses, and treasuries to unlimited work shifts.</p>
              </div>

              <button
                onClick={() => setIsAddShiftOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Shift</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bdState.shifts.map(shift => (
                <div key={shift.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-amber-400 font-bold uppercase">
                      {shift.type} SHIFT
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                      shift.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {shift.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{shift.title}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{shift.branchName}</p>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-300 font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <p>Hours: <span className="text-amber-400">{shift.startTime} - {shift.endTime}</span></p>
                    <p>Warehouse: <span className="text-indigo-300">{shift.assignedWarehouse}</span></p>
                    <p>Treasury: <span className="text-sky-300">{shift.assignedTreasury}</span></p>
                    <p>Cash Collected: <span className="text-emerald-400 font-bold">${shift.cashCollected.toLocaleString()}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DAY CLOSING CONSOLE */}
      {activeTab === 'day_closing' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>Phase 03: Automated Day Closing Checklist</span>
            </h3>

            <div className="space-y-3">
              {bdState.closingVerifications.map(chk => (
                <div key={chk.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${chk.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">{chk.title}</h4>
                      <p className="text-xs text-slate-400">{chk.details}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] px-2.5 py-1 rounded font-bold uppercase ${
                      chk.status === 'verified' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {chk.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FINANCIAL RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Phase 04: Financial Reconciliation Matrix</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Account Group</th>
                    <th className="pb-2">System Ledger ($)</th>
                    <th className="pb-2">Physical Actual ($)</th>
                    <th className="pb-2">Variance ($)</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Manager Sign-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bdState.reconciliationItems.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-950/50">
                      <td className="py-3 font-bold text-slate-100">{rec.accountGroup}</td>
                      <td className="py-3 font-mono text-emerald-400">${rec.systemCalculatedBalance.toLocaleString()}</td>
                      <td className="py-3 font-mono text-sky-400">${rec.physicalActualBalance.toLocaleString()}</td>
                      <td className="py-3 font-mono font-bold text-rose-400">${rec.varianceAmount.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          rec.status === 'balanced' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {rec.requiresManagerApproval && !rec.isApproved ? (
                          <button
                            onClick={() => handleApproveVariance(rec.id)}
                            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px]"
                          >
                            Approve Variance
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </span>
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

      {/* TAB 5: MULTI-BRANCH OPERATIONS */}
      {activeTab === 'multi_branch' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>Head Office Multi-Branch Monitoring Dashboard</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleBranches.map(b => (
                <div key={b.branchId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-100">{b.branchName}</h4>
                    <span className="text-[10px] font-mono text-amber-400">{b.branchCode}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">TREASURY CASH</span>
                      <span className="text-emerald-400 font-bold">${b.treasuryBalance.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[9px]">BANK LIQUIDITY</span>
                      <span className="text-sky-400 font-bold">${liveBankBalance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
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
              <span>Phase 06: Business Day Reports & Integration Suite</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { type: 'day', title: 'Business Day Summary Report', desc: 'Detailed log of opened/closed business days across all branches.' },
                { type: 'shift', title: 'Work Shift Audit Report', desc: 'Cashier cash collection vs issued invoices per shift session.' },
                { type: 'closing', title: 'Day Closing Balance Report', desc: 'End-of-day checklist and GL posting reconciliation.' },
                { type: 'reconciliation', title: 'Financial Variance Report', desc: 'Discrepancy audit log and controller sign-offs.' },
                { type: 'cash', title: 'Treasury & Cash Summary', desc: 'Liquidity movement breakdown.' },
                { type: 'branch', title: 'Branch Performance Matrix', desc: 'Multi-branch operational comparative analysis.' }
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

      {/* Add Shift Modal */}
      {isAddShiftOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateShift} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Create New Work Shift</h3>
              <button type="button" onClick={() => setIsAddShiftOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Shift Type</label>
                <select
                  value={newShiftType}
                  onChange={e => setNewShiftType(e.target.value as ShiftType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="morning">Morning Shift</option>
                  <option value="evening">Evening Shift</option>
                  <option value="night">Night Shift</option>
                  <option value="custom">Custom Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Shift Title / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Weekend Special Sales Shift"
                  value={newShiftTitle}
                  onChange={e => setNewShiftTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddShiftOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Create Shift
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 uppercase">{activeReportModal} REPORT</h3>
              <button onClick={() => setActiveReportModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              <p className="text-amber-400 font-bold">VERTEX BUSINESS DAY AUDIT REPORT</p>
              <p className="text-slate-500">Date: {bdState.currentGlobalDate}</p>
              <div className="h-px bg-slate-800 my-2" />
              <p>Active Branches: {bdState.branches.length}</p>
              <p>Active Shifts: {bdState.shifts.length}</p>
              <p>Reconciliation Status: VERIFIED</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setActiveReportModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
