import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';
import { setupWizardService } from './setupWizardService';
import { salesEntryService } from './salesEntryService';
import { customerService } from './customerService';
import { BranchItem, TreasuryItem } from '../types';

export interface SystemUserOption {
  id: string;
  username: string;
  fullName: string;
  roleTitle: string;
  department: string;
  avatarLetter: string;
  isSuperAdmin?: boolean;
  branchId?: string;
}

export interface TreasuryTransaction {
  id: string;
  treasuryId: string;
  date: string;
  type: 'opening_balance' | 'cash_sale' | 'customer_receipt' | 'vendor_payment' | 'cash_return' | 'expense' | 'transfer_in' | 'transfer_out';
  typeLabel: string;
  amount: number;
  direction: 'in' | 'out';
  referenceNumber: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface Treasury {
  id: string;
  code: string;
  name: string;
  branchId: string;
  branchName: string;
  currency: string;
  exchangeRate: number;
  openingBalance: number;
  openingBalanceDate: string;
  allowedUsersType: 'all' | 'specific';
  allowedUserIds: string[];
  status: 'نشط' | 'غير نشط' | 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'VERTEX_TREASURY_MASTER_V1';

export const VERTEX_SYSTEM_USERS: SystemUserOption[] = [
  {
    id: 'USR-001',
    username: 'alex.mercer',
    fullName: 'م. أحمد مراد (مدير النظام العام - Super Admin)',
    roleTitle: 'مدير النظام التنفيذي',
    department: 'الإدارة العامة وتكنولوجيا المعلومات',
    avatarLetter: 'أ',
    isSuperAdmin: true
  },
  {
    id: 'USR-002',
    username: 'elena.rodriguez',
    fullName: 'أ. إيلينا رودريغيز (رئيس الحسابات والمدير المالي)',
    roleTitle: 'رئيس قسم الحسابات',
    department: 'الإدارة المالية والمحاسبة',
    avatarLetter: 'إ'
  },
  {
    id: 'USR-003',
    username: 'sarah_treasurer',
    fullName: 'أ. سارة أمين (أمين الخزينة الرئيسي)',
    roleTitle: 'أمين الصندوق والخزينة',
    department: 'إدارة النقدية والتحصيل',
    avatarLetter: 'س'
  },
  {
    id: 'USR-004',
    username: 'ahmed_cashier',
    fullName: 'أ. أحمد كمال (كاشير مبيعات المعرض)',
    roleTitle: 'مسؤول نقطة البيع',
    department: 'المبيعات والمعارض',
    avatarLetter: 'أ'
  },
  {
    id: 'USR-005',
    username: 'uk_branch_mgr',
    fullName: 'م. ديفيد سميث (مدير فرع بريطانيا ولندن)',
    roleTitle: 'مدير الفرع الإقليمي',
    department: 'الإدارة الإقليمية',
    avatarLetter: 'د'
  },
  {
    id: 'USR-006',
    username: 'tariq_auditor',
    fullName: 'أ. طارق عبد الله (مدقق الحسابات والجرد)',
    roleTitle: 'مراجع الحسابات الداخلي',
    department: 'التدقيق والرقابة المالية',
    avatarLetter: 'ط'
  },
  {
    id: 'USR-007',
    username: 'yasin_pos',
    fullName: 'أ. ياسين محمود (كاشير نقطة البيع - العجمي)',
    roleTitle: 'كاشير مالي معتمد',
    department: 'المبيعات ونقاط البيع',
    avatarLetter: 'ي'
  },
  {
    id: 'USR-008',
    username: 'sales_rep_01',
    fullName: 'أ. محمود عبد الرحمن (مندوب تحصيل ومبيعات)',
    roleTitle: 'مسؤول التحصيل الميداني',
    department: 'إدارة المبيعات الخارجية',
    avatarLetter: 'م'
  }
];

export const DEFAULT_MAIN_TREASURY: Treasury = {
  id: 'TR-01',
  code: 'TR-001',
  name: 'خزينة الفرع الرئيسي',
  branchId: 'BR-01',
  branchName: 'الفرع الرئيسي',
  currency: 'EGP (ج.م)',
  exchangeRate: 1,
  openingBalance: 0,
  openingBalanceDate: '2026-01-01',
  allowedUsersType: 'all',
  allowedUserIds: [],
  status: 'نشط',
  notes: 'الخزينة الافتراضية للفرع الرئيسي',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

export const INITIAL_TREASURIES_SEED: Treasury[] = [DEFAULT_MAIN_TREASURY];

class TreasuryService {
  private treasuries: Treasury[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadTreasuries();
  }

  private getMainBranchInfo(): { id: string; name: string } {
    try {
      const branches = setupWizardService.getConfig()?.branches;
      if (Array.isArray(branches) && branches.length > 0) {
        const main = branches.find((b: any) => b.isMain) || branches.find((b: any) => b.id === 'BR-01') || branches[0];
        if (main) {
          return { id: main.id || 'BR-01', name: main.name || 'الفرع الرئيسي' };
        }
      }
    } catch {
      // fallback
    }
    return { id: 'BR-01', name: 'الفرع الرئيسي' };
  }

  /**
   * Ensures the existence of the default Main Branch treasury.
   * - Does NOT create a duplicate if a treasury for the main branch already exists.
   * - Idempotent operation: if existing, ensures proper linkage to main branch.
   */
  public ensureMainBranchTreasury(): Treasury {
    const mainBranch = this.getMainBranchInfo();

    // Check if main branch treasury already exists (by ID, branchId, or standard name)
    const existing = this.treasuries.find(
      t => t.id === 'TR-01' || t.branchId === mainBranch.id || (t.name === 'خزينة الفرع الرئيسي' && (!t.branchId || t.branchId === mainBranch.id))
    );

    if (existing) {
      let changed = false;
      if (!existing.branchId || existing.branchId !== mainBranch.id) {
        existing.branchId = mainBranch.id;
        changed = true;
      }
      if (!existing.branchName || existing.branchName !== mainBranch.name) {
        existing.branchName = mainBranch.name;
        changed = true;
      }
      if (changed) {
        this.persist();
      }
      return existing;
    }

    const defaultTr: Treasury = {
      ...DEFAULT_MAIN_TREASURY,
      branchId: mainBranch.id,
      branchName: mainBranch.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.treasuries.unshift(defaultTr);
    this.persist();
    return defaultTr;
  }

  private loadTreasuries(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.treasuries = parsed.filter(
            (t: any) => 
              !t.name?.includes('العجوزة') && 
              !t.branchName?.includes('العجوزة') && 
              t.branchId !== 'BR-02' &&
              // Filter out pure legacy demo seed
              !(t.id === 'TR-01' && (t.branchName?.includes('New York') || t.openingBalance === 250000))
          );
          this.ensureMainBranchTreasury();
          this.persist();
          return;
        }
      }
      this.treasuries = [];
      this.ensureMainBranchTreasury();
      this.persist();
    } catch {
      this.treasuries = [];
      this.ensureMainBranchTreasury();
      this.persist();
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.treasuries));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to persist treasuries to localStorage', e);
    }
  }

  public reloadFromStorage(): void {
    this.loadTreasuries();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Error in treasury service listener', err);
      }
    });
  }

  public getAllTreasuries(): Treasury[] {
    return [...this.treasuries];
  }

  public getActiveTreasuries(): Treasury[] {
    const configBranches = setupWizardService.getConfig().branches || [];
    const inactiveBranchIds = new Set(
      configBranches.filter((b: any) => b.status === 'غير نشط').map((b: any) => b.id)
    );
    return this.treasuries.filter(
      t => (t.status === 'نشط' || t.status === 'active') && !inactiveBranchIds.has(t.branchId)
    );
  }

  /**
   * Retrieves active treasuries accessible for a specific user and optionally within a branch scope.
   * - Only 'نشط' (Active) treasuries are returned for new transactions/operations.
   * - Inactive treasuries ('غير نشط') are excluded from new transactions.
   * - If allowedUsersType === 'all', accessible to all permitted users.
   * - If allowedUsersType === 'specific', accessible only to assigned users or Super Admin.
   */
  public getAvailableTreasuriesForUser(userIdOrUsername?: string, userRole?: string, branchId?: string): Treasury[] {
    let list = this.getActiveTreasuries();

    if (branchId && branchId !== 'all') {
      list = list.filter(t => t.branchId === branchId);
    }

    const isSuperAdmin = 
      userRole === 'SUPER_ADMIN' || 
      userRole === 'SECURITY_ADMIN' || 
      userIdOrUsername === 'USR-001' || 
      userIdOrUsername === 'alex.mercer';

    if (!isSuperAdmin && userIdOrUsername) {
      const user = VERTEX_SYSTEM_USERS.find(
        u => u.id === userIdOrUsername || u.username === userIdOrUsername
      );
      const actualUserId = user ? user.id : userIdOrUsername;
      const actualUsername = user ? user.username : userIdOrUsername;

      list = list.filter(t => {
        if (t.allowedUsersType === 'all') return true;
        if (!Array.isArray(t.allowedUserIds) || t.allowedUserIds.length === 0) return true;
        return t.allowedUserIds.includes(actualUserId) || t.allowedUserIds.includes(actualUsername);
      });
    }

    return list;
  }

  public getTreasuryById(id: string): Treasury | undefined {
    return this.treasuries.find(t => t.id === id || t.code === id);
  }

  /**
   * Retrieves the default treasury for a branch.
   * For Main Branch, returns the main treasury (TR-01 or first treasury of the branch).
   */
  public getDefaultTreasury(branchId?: string): Treasury | undefined {
    const targetBranchId = branchId || 'BR-01';
    const branchTrs = this.treasuries.filter(t => t.branchId === targetBranchId && (t.status === 'نشط' || t.status === 'active'));
    if (branchTrs.length === 0) {
      const allBranchTrs = this.treasuries.filter(t => t.branchId === targetBranchId);
      if (allBranchTrs.length > 0) return allBranchTrs[0];
      if (targetBranchId === 'BR-01' || !branchId) {
        return this.treasuries.find(t => t.id === 'TR-01') || this.treasuries[0];
      }
      return undefined;
    }
    const defaultTr = branchTrs.find(t => t.id === 'TR-01' || t.name.includes('الرئيسي')) || branchTrs[0];
    return defaultTr;
  }

  public getAvailableBranches(): BranchItem[] {
    try {
      const configBranches = setupWizardService.getConfig()?.branches;
      if (Array.isArray(configBranches) && configBranches.length > 0) {
        return configBranches;
      }
    } catch {
      // ignore
    }
    return [
      { id: 'BR-01', code: 'BR-01', name: 'الفرع الرئيسي', city: 'الإسكندرية / القاهرة', isMain: true }
    ];
  }

  public getAvailableUsers(): SystemUserOption[] {
    return [...VERTEX_SYSTEM_USERS];
  }

  /**
   * Generates the next sequential treasury code (e.g., TR-005)
   */
  public getNextTreasuryCode(): string {
    const existingNumbers = this.treasuries.map(t => {
      const match = t.code.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxNum = existingNumbers.length > 0 ? Math.max(...existingNumbers, 0) : 0;
    const nextNum = maxNum + 1;
    return `TR-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Validates Treasury input data according to strict business logic.
   */
  public validateTreasury(data: Partial<Treasury>, existingId?: string): { isValid: boolean; error?: string } {
    if (!data.name || !data.name.trim()) {
      return { isValid: false, error: 'اسم الخزينة مطلوب ولا يمكن تركه فارغاً.' };
    }

    if (!data.branchId || !data.branchId.trim()) {
      return { isValid: false, error: 'يجب اختيار الفرع التابعة له الخزينة.' };
    }

    // Check duplicate treasury name in the same branch
    const cleanName = data.name.trim().toLowerCase();
    const isDuplicateName = this.treasuries.some(t => 
      t.id !== existingId && 
      t.branchId === data.branchId && 
      t.name.trim().toLowerCase() === cleanName
    );

    if (isDuplicateName) {
      return { 
        isValid: false, 
        error: `يوجد بالفعل خزينة بنفس الاسم "${data.name.trim()}" مسجلة على نفس الفرع. يرجى اختيار اسم فريد.` 
      };
    }

    const hasOpeningBalance = typeof data.openingBalance === 'number' && data.openingBalance > 0;
    const hasOpeningDate = Boolean(data.openingBalanceDate && data.openingBalanceDate.trim());

    // Rule 1: Balance entered without date -> Reject
    if (hasOpeningBalance && !hasOpeningDate) {
      return { 
        isValid: false, 
        error: 'يرجى تحديد تاريخ الرصيد الافتتاحي عند إدخال قيمة للرصيد الافتتاحي.' 
      };
    }

    // Rule 2: Date entered without balance -> Reject
    if (hasOpeningDate && (!data.openingBalance || data.openingBalance <= 0)) {
      return { 
        isValid: false, 
        error: 'يرجى إدخال قيمة الرصيد الافتتاحي أو إفراغ حقل التاريخ.' 
      };
    }

    // Rule for specific users selection
    if (data.allowedUsersType === 'specific' && (!data.allowedUserIds || data.allowedUserIds.length === 0)) {
      return {
        isValid: false,
        error: 'عند تحديد "مستخدمين محددين"، يجب اختيار مستخدم واحد على الأقل مسموح له باستخدام الخزينة.'
      };
    }

    return { isValid: true };
  }

  /**
   * Creates a new Treasury
   */
  public createTreasury(data: {
    name: string;
    branchId: string;
    currency?: string;
    exchangeRate?: number;
    openingBalance?: number;
    openingBalanceDate?: string;
    allowedUsersType?: 'all' | 'specific';
    allowedUserIds?: string[];
    status?: 'نشط' | 'غير نشط' | 'active' | 'inactive';
    notes?: string;
  }): { success: boolean; treasury?: Treasury; error?: string } {
    const validation = this.validateTreasury(data);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const branch = this.getAvailableBranches().find(b => b.id === data.branchId);
    const branchName = branch ? branch.name : 'الفرع الرئيسي';
    const autoCode = this.getNextTreasuryCode();
    const newId = `TR-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const opBal = (typeof data.openingBalance === 'number' && data.openingBalance > 0) ? data.openingBalance : 0;
    const opDate = opBal > 0 ? (data.openingBalanceDate || '') : '';

    const newTreasury: Treasury = {
      id: newId,
      code: autoCode,
      name: data.name.trim(),
      branchId: data.branchId,
      branchName: branchName,
      currency: data.currency || 'جنيه مصري (EGP)',
      exchangeRate: data.exchangeRate || 1.00,
      openingBalance: opBal,
      openingBalanceDate: opDate,
      allowedUsersType: data.allowedUsersType || 'all',
      allowedUserIds: data.allowedUsersType === 'specific' ? (data.allowedUserIds || []) : [],
      status: (data.status === 'غير نشط' || data.status === 'inactive') ? 'غير نشط' : 'نشط',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.treasuries = [newTreasury, ...this.treasuries];
    this.persist();

    auditEngine.logAction(
      'إنشاء خزينة جديدة',
      'إدارة الخزائن النقدية',
      `تم إنشاء الخزينة (${newTreasury.name}) بكود [${newTreasury.code}] تابعة لـ (${newTreasury.branchName}) برصيد افتتاحي ${newTreasury.openingBalance.toLocaleString()} ${newTreasury.currency}.`,
      'info'
    );

    notificationEngine.addNotification(
      'إضافة خزينة جديدة بنجاح',
      `تم تسجيل الخزينة [${newTreasury.code}] ${newTreasury.name} في قاعدة البيانات الموحدة.`,
      'success',
      'إدارة الخزائن'
    );

    return { success: true, treasury: newTreasury };
  }

  /**
   * Updates an existing Treasury
   */
  public updateTreasury(
    id: string,
    updates: Partial<Treasury>
  ): { success: boolean; treasury?: Treasury; error?: string } {
    const existingIndex = this.treasuries.findIndex(t => t.id === id);
    if (existingIndex === -1) {
      return { success: false, error: 'الخزينة المطلوبة غير موجودة في قاعدة البيانات.' };
    }

    const current = this.treasuries[existingIndex];
    const mergedData = { ...current, ...updates };

    const validation = this.validateTreasury(mergedData, id);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const branch = this.getAvailableBranches().find(b => b.id === mergedData.branchId);
    const branchName = branch ? branch.name : current.branchName;

    const opBal = (typeof mergedData.openingBalance === 'number' && mergedData.openingBalance > 0) ? mergedData.openingBalance : 0;
    const opDate = opBal > 0 ? (mergedData.openingBalanceDate || '') : '';

    const updated: Treasury = {
      ...current,
      name: mergedData.name.trim(),
      branchId: mergedData.branchId,
      branchName: branchName,
      currency: mergedData.currency || current.currency,
      exchangeRate: mergedData.exchangeRate || current.exchangeRate,
      openingBalance: opBal,
      openingBalanceDate: opDate,
      allowedUsersType: mergedData.allowedUsersType || current.allowedUsersType,
      allowedUserIds: mergedData.allowedUsersType === 'specific' ? (mergedData.allowedUserIds || []) : [],
      status: (mergedData.status === 'غير نشط' || mergedData.status === 'inactive') ? 'غير نشط' : 'نشط',
      notes: mergedData.notes !== undefined ? mergedData.notes : current.notes,
      updatedAt: new Date().toISOString()
      // Note: code and id remain strictly immutable!
    };

    this.treasuries[existingIndex] = updated;
    this.persist();

    auditEngine.logAction(
      'تعديل بيانات خزينة',
      'إدارة الخزائن النقدية',
      `تم تحديث بيانات الخزينة (${updated.name}) بكود [${updated.code}].`,
      'info'
    );

    notificationEngine.addNotification(
      'تحديث بيانات الخزينة',
      `تم حفظ التعديلات بنجاح على الخزينة [${updated.code}] ${updated.name}.`,
      'info',
      'إدارة الخزائن'
    );

    return { success: true, treasury: updated };
  }

  /**
   * Checks if a treasury has associated financial transactions across the system
   */
  public getTreasuryTransactions(treasuryId: string): TreasuryTransaction[] {
    const treasury = this.getTreasuryById(treasuryId);
    if (!treasury) return [];

    const txs: TreasuryTransaction[] = [];

    // 1. Opening balance record if exists
    if (treasury.openingBalance > 0) {
      txs.push({
        id: `TX-OP-${treasury.id}`,
        treasuryId: treasury.id,
        date: treasury.openingBalanceDate || treasury.createdAt.slice(0, 10),
        type: 'opening_balance',
        typeLabel: 'رصيد افتتاحي معتمد',
        amount: treasury.openingBalance,
        direction: 'in',
        referenceNumber: `OP-${treasury.code}`,
        description: `رصيد أول المدة الافتتاحي للخزينة (${treasury.name})`,
        performedBy: 'مدير النظام',
        createdAt: treasury.createdAt
      });
    }

    // 2. Fetch sales invoices associated with this treasury
    try {
      const state = salesEntryService.getState();
      const allInvoices = [...(state.completedInvoices || []), ...(state.openInvoices || [])];
      allInvoices.forEach(inv => {
        if (
          (inv.treasuryId === treasury.id || inv.treasuryId === treasury.code || inv.treasuryName === treasury.name) &&
          inv.status !== 'cancelled'
        ) {
          const invAmount = inv.cashPaid || inv.grandTotal || inv.subtotal || 0;
          txs.push({
            id: `TX-INV-${inv.id}`,
            treasuryId: treasury.id,
            date: inv.createdAt ? inv.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            type: 'cash_sale',
            typeLabel: 'مبيعات نقدية (فاتورة مبيعات)',
            amount: invAmount,
            direction: 'in',
            referenceNumber: inv.invoiceNumber || inv.id,
            description: `تحصيل مبيعات نقدية - العميل: ${inv.customerName || 'عميل نقدي'}`,
            performedBy: inv.sellerName || 'كاشير المبيعات',
            createdAt: inv.createdAt
          });
        }
      });
    } catch {
      // safe fallback
    }

    // 2.5. Fetch real income and expense transactions
    try {
      const storedInc = localStorage.getItem('VERTEX_INCOME_TRANSACTIONS_V1');
      if (storedInc) {
        const incList = JSON.parse(storedInc);
        if (Array.isArray(incList)) {
          incList.forEach((inc: any) => {
            // Only completed transactions have financial impact on treasury
            if (inc.status !== 'مكتمل') return;

            // Source treasury match
            if (inc.treasuryId === treasury.id || inc.treasuryName === treasury.name) {
              const isOut = inc.type === 'outward' || 
                inc.accountType === 'other_treasury' || 
                inc.accountType === 'bank' || 
                inc.accountType === 'branch_transfer';

              txs.push({
                id: `TX-INC-${inc.id}`,
                treasuryId: treasury.id,
                date: inc.date || inc.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                type: isOut ? 'vendor_payment' : 'customer_receipt',
                typeLabel: `${inc.typeLabel || (inc.type === 'inward' ? 'وارد خزينة' : 'صادر خزينة')} (${inc.accountTypeLabel || inc.accountType})`,
                amount: inc.amount,
                direction: isOut ? 'out' : 'in',
                referenceNumber: inc.documentNumber || inc.id,
                description: `${inc.typeLabel || ''} - ${inc.accountName || ''} ${inc.notes ? `(${inc.notes})` : ''}`,
                performedBy: inc.performedBy || 'أمين الخزينة',
                createdAt: inc.createdAt || new Date().toISOString()
              });
            }

            // Target treasury match (for completed transfers)
            if (
              (inc.accountType === 'other_treasury' || inc.accountType === 'branch_transfer') &&
              inc.targetTreasuryOrBankId === treasury.id &&
              inc.status === 'مكتمل'
            ) {
              txs.push({
                id: `TX-INC-IN-${inc.id}`,
                treasuryId: treasury.id,
                date: inc.date || inc.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
                type: 'customer_receipt',
                typeLabel: `تحويل مستلم من (${inc.treasuryName})`,
                amount: inc.amount,
                direction: 'in',
                referenceNumber: inc.documentNumber || inc.id,
                description: `تحويل نقدي وارد من خزينة [${inc.treasuryName}] ${inc.notes ? `(${inc.notes})` : ''}`,
                performedBy: inc.completedBy || inc.performedBy || 'أمين الخزينة',
                createdAt: inc.completedAt || inc.createdAt || new Date().toISOString()
              });
            }
          });
        }
      }
    } catch {
      // safe fallback
    }

    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Dynamic calculation of current balance based on actual movements
   */
  public getTreasuryBalance(treasuryId: string): number {
    const treasury = this.getTreasuryById(treasuryId);
    if (!treasury) return 0;

    const txs = this.getTreasuryTransactions(treasuryId);
    let totalIn = 0;
    let totalOut = 0;

    txs.forEach(tx => {
      if (tx.direction === 'in') {
        totalIn += tx.amount;
      } else {
        totalOut += tx.amount;
      }
    });

    return totalIn - totalOut;
  }

  /**
   * Checks if treasury can be safely deleted or is protected by transactions
   */
  public canDeleteTreasury(treasuryId: string): { canDelete: boolean; reason?: string; transactionCount: number } {
    const treasury = this.getTreasuryById(treasuryId);
    if (!treasury) {
      return { canDelete: false, reason: 'الخزينة غير موجودة.', transactionCount: 0 };
    }

    const mainBranch = this.getMainBranchInfo();
    const isMainBranchDefault = (treasury.id === 'TR-01' || treasury.branchId === mainBranch.id) &&
      this.treasuries.filter(t => t.branchId === mainBranch.id).length <= 1;
    if (isMainBranchDefault) {
      return {
        canDelete: false,
        transactionCount: 0,
        reason: 'لا يمكن حذف الخزينة الافتراضية للفرع الرئيسي، فهي الخزينة الأساسية لنظام التشغيل.'
      };
    }

    const txs = this.getTreasuryTransactions(treasuryId);
    // If there is any non-opening balance transaction, or active invoices
    const activeMovements = txs.filter(t => t.type !== 'opening_balance');

    if (activeMovements.length > 0 || txs.length > 1) {
      return {
        canDelete: false,
        reason: `لا يمكن حذف الخزينة (${treasury.name}) نظراً لوجود (${txs.length}) حركة مالية وعمليات نقدية مسجلة عليها. للحفاظ على سلامة الحسابات والأستاذ العام، يُمنع حذف الخزائن ذات المعاملات المالية. يمكنك بدلاً من ذلك تعطيل حالتها إلى "غير نشط".`,
        transactionCount: txs.length
      };
    }

    return { canDelete: true, transactionCount: txs.length };
  }

  /**
   * Deletes a treasury if it has no associated transactions
   */
  public deleteTreasury(treasuryId: string): { success: boolean; error?: string } {
    const treasury = this.getTreasuryById(treasuryId);
    if (!treasury) {
      return { success: false, error: 'الخزينة غير موجودة في قاعدة البيانات.' };
    }

    const check = this.canDeleteTreasury(treasuryId);
    if (!check.canDelete) {
      return { success: false, error: check.reason };
    }

    this.treasuries = this.treasuries.filter(t => t.id !== treasuryId);
    this.persist();

    auditEngine.logAction(
      'حذف خزينة',
      'إدارة الخزائن النقدية',
      `تم حذف الخزينة (${treasury.name}) بكود [${treasury.code}].`,
      'warning'
    );

    notificationEngine.addNotification(
      'تم حذف الخزينة بنجاح',
      `تم حذف سجل الخزينة [${treasury.code}] ${treasury.name}.`,
      'warning',
      'إدارة الخزائن'
    );

    return { success: true };
  }
}

export const treasuryService = new TreasuryService();
