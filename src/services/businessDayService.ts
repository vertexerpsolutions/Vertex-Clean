export type BusinessDayStatus = 'open' | 'closing_in_progress' | 'closed' | 'locked';
export type ShiftType = 'morning' | 'evening' | 'night' | 'custom';
export type ShiftStatus = 'active' | 'completed' | 'scheduled';

export interface BranchBusinessDay {
  branchId: string;
  branchCode: string;
  branchName: string;
  region: string;
  currentBusinessDate: string;
  status: BusinessDayStatus;
  openedAt: string;
  openedBy: string;
  closedAt?: string;
  closedBy?: string;
  activeShiftId?: string;
  treasuryBalance: number;
  bankBalance: number;
  openInvoicesCount: number;
  pendingPaymentsCount: number;
  pendingReceiptsCount: number;
  inventoryTxCount: number;
  journalEntriesCount: number;
  discrepancyCount: number;
}

export interface WorkShift {
  id: string;
  shiftCode: string;
  type: ShiftType;
  title: string;
  branchId: string;
  branchName: string;
  assignedUsers: string[];
  assignedCashiers: string[];
  assignedWarehouse: string;
  assignedTreasury: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  cashCollected: number;
  receiptsIssuedCount: number;
}

export interface DayClosingVerificationItem {
  id: string;
  category: 'open_invoices' | 'pending_payments' | 'pending_receipts' | 'inventory_vouchers' | 'journal_entries' | 'cash_balances' | 'bank_transactions';
  title: string;
  pendingCount: number;
  totalVolume: number;
  status: 'verified' | 'action_required' | 'discrepancy';
  details: string;
}

export interface FinancialReconciliationItem {
  id: string;
  accountGroup: 'Treasury Cash' | 'Bank Accounts' | 'Inventory Valuation' | 'Accounts Receivable (Customers)' | 'Accounts Payable (Suppliers)' | 'General Ledger Control';
  systemCalculatedBalance: number;
  physicalActualBalance: number;
  varianceAmount: number;
  status: 'balanced' | 'variance_detected';
  notes: string;
  requiresManagerApproval: boolean;
  isApproved: boolean;
}

export interface BusinessDayHistory {
  id: string;
  date: string;
  branchCode: string;
  openedBy: string;
  closedBy: string;
  openedAt: string;
  closedAt: string;
  totalSalesVolume: number;
  totalCashCollected: number;
  discrepanciesResolved: number;
  status: BusinessDayStatus;
  isLocked: boolean;
}

export interface BusinessDayState {
  currentGlobalDate: string;
  isCentralizedControl: boolean;
  branches: BranchBusinessDay[];
  shifts: WorkShift[];
  closingVerifications: DayClosingVerificationItem[];
  reconciliationItems: FinancialReconciliationItem[];
  history: BusinessDayHistory[];
  isVgf04Completed: boolean;
}

const STORAGE_KEY = 'VERTEX_VGF04_BUSINESS_DAY';

export const INITIAL_BRANCH_DAYS: BranchBusinessDay[] = [
  {
    branchId: 'BR-01',
    branchCode: 'BR-01',
    branchName: 'الفرع الرئيسي',
    region: 'الإسكندرية / القاهرة',
    currentBusinessDate: new Date().toISOString().slice(0, 10),
    status: 'closed',
    openedAt: '2026-01-01T08:00:00Z',
    openedBy: 'vtx_sysadmin',
    treasuryBalance: 0,
    bankBalance: 0,
    openInvoicesCount: 0,
    pendingPaymentsCount: 0,
    pendingReceiptsCount: 0,
    inventoryTxCount: 0,
    journalEntriesCount: 0,
    discrepancyCount: 0
  }
];

export const INITIAL_WORK_SHIFTS: WorkShift[] = [];

export const INITIAL_CLOSING_VERIFICATIONS: DayClosingVerificationItem[] = [
  { id: 'CHK-01', category: 'open_invoices', title: 'Open Sales Invoices', pendingCount: 0, totalVolume: 0, status: 'verified', details: 'لا توجد فواتير معلقة' },
  { id: 'CHK-02', category: 'pending_payments', title: 'Pending Supplier Bills / Payments', pendingCount: 0, totalVolume: 0, status: 'verified', details: 'لا توجد مستحقات معلقة' },
  { id: 'CHK-03', category: 'pending_receipts', title: 'Pending Cash Receipts', pendingCount: 0, totalVolume: 0, status: 'verified', details: 'لا توجد مقبوضات معلقة' },
  { id: 'CHK-04', category: 'inventory_vouchers', title: 'Unposted Stock Movements', pendingCount: 0, totalVolume: 0, status: 'verified', details: 'جميع حركات المخزون مرحلة' },
  { id: 'CHK-05', category: 'journal_entries', title: 'Day End Journal Entries', pendingCount: 0, totalVolume: 0, status: 'verified', details: 'لا توجد قيود معلقة' },
  { id: 'CHK-06', category: 'cash_balances', title: 'Treasury Physical Cash Count', pendingCount: 0, totalVolume: 0, status: 'verified', details: 'الرصيد النقدي مطابق' },
  { id: 'CHK-07', category: 'bank_transactions', title: 'Bank Statement Clearing Feed', pendingCount: 0, totalVolume: 0, status: 'verified', details: 'كشف الحساب البنكي متطابق' }
];

export const INITIAL_RECONCILIATION: FinancialReconciliationItem[] = [];

class BusinessDayService {
  private state: BusinessDayState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): BusinessDayState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          branches: parsed.branches || INITIAL_BRANCH_DAYS,
          shifts: parsed.shifts || INITIAL_WORK_SHIFTS,
          closingVerifications: parsed.closingVerifications || INITIAL_CLOSING_VERIFICATIONS,
          reconciliationItems: parsed.reconciliationItems || INITIAL_RECONCILIATION
        };
      }
    } catch (e) {
      console.warn('Failed to parse Business Day storage, using defaults:', e);
    }

    return {
      currentGlobalDate: new Date().toISOString().slice(0, 10),
      isCentralizedControl: true,
      branches: INITIAL_BRANCH_DAYS,
      shifts: INITIAL_WORK_SHIFTS,
      closingVerifications: INITIAL_CLOSING_VERIFICATIONS,
      reconciliationItems: INITIAL_RECONCILIATION,
      history: [],
      isVgf04Completed: true
    };
  }

  public getState(): BusinessDayState {
    return this.state;
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Business Day state:', e);
    }
  }

  public updateBranchStatus(branchId: string, status: BusinessDayStatus): void {
    this.state.branches = this.state.branches.map(b => {
      if (b.branchId === branchId) {
        return {
          ...b,
          status,
          closedAt: status === 'closed' || status === 'locked' ? new Date().toISOString() : b.closedAt,
          closedBy: status === 'closed' || status === 'locked' ? 'vtx_sysadmin' : b.closedBy
        };
      }
      return b;
    });
    this.saveState();
  }

  public approveReconciliationVariance(recId: string): void {
    this.state.reconciliationItems = this.state.reconciliationItems.map(r => {
      if (r.id === recId) {
        return { ...r, isApproved: true };
      }
      return r;
    });
    this.saveState();
  }

  public addShift(shift: WorkShift): void {
    this.state.shifts = [shift, ...this.state.shifts];
    this.saveState();
  }

  public markVgf04Completed(): void {
    this.state.isVgf04Completed = true;
    this.saveState();
  }

  public resetState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
  }
}

export const businessDayService = new BusinessDayService();
