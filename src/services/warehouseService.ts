import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';
import { setupWizardService } from './setupWizardService';
import { salesEntryService } from './salesEntryService';
import { BranchItem } from '../types';
import { SystemUserOption, VERTEX_SYSTEM_USERS } from './treasuryService';
import { sellerService } from './sellerService';

export interface AccountOption {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface WarehouseTransaction {
  id: string;
  warehouseId: string;
  date: string;
  type: 'opening_stock' | 'sales_invoice' | 'sales_return' | 'purchase_receipt' | 'purchase_return' | 'transfer_in' | 'transfer_out' | 'inventory_adjustment';
  typeLabel: string;
  itemCount: number;
  totalQuantity: number;
  direction: 'in' | 'out';
  referenceNumber: string;
  description: string;
  performedBy: string;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  branchId: string;
  branchName: string;
  accountId: string;
  accountName: string;
  valuationType: 'included' | 'excluded'; // يدخل ضمن التقييم / لا يدخل ضمن التقييم
  allowedUsersType: 'all' | 'specific';
  allowedUserIds: string[];
  status: 'نشط' | 'غير نشط' | 'active' | 'inactive';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'VERTEX_WAREHOUSE_MASTER_V1';

export const INVENTORY_CHART_OF_ACCOUNTS: AccountOption[] = [
  { id: 'ACC-1205', code: '1205', name: 'المخزون (مخزون بضائع بغرض البيع)', category: 'أصول متداولة / مخزون' },
  { id: 'ACC-1201', code: '1201', name: 'مخزون الخامات والمواد الأولية', category: 'أصول متداولة / مخزون' },
  { id: 'ACC-1202', code: '1202', name: 'مخزون الإنتاج تحت التشغيل', category: 'أصول متداولة / مخزون' },
  { id: 'ACC-1203', code: '1203', name: 'مخزون البضاعة التامة والجاهزة', category: 'أصول متداولة / مخزون' },
  { id: 'ACC-1204', code: '1204', name: 'مخزون قطع الغيار والمهمات', category: 'أصول متداولة / مخزون' },
  { id: 'ACC-1206', code: '1206', name: 'بضاعة بالطريق واعتمادات استيرادية', category: 'أصول متداولة / مخزون' },
  { id: 'ACC-1207', code: '1207', name: 'مخزون المعارض ومنافذ التوزيع', category: 'أصول متداولة / مخزون' },
  { id: 'ACC-1208', code: '1208', name: 'مخزون بضاعة الأمانات ولدى الغير', category: 'أصول متداولة / مخزون' }
];

export const DEFAULT_MAIN_WAREHOUSE: Warehouse = {
  id: 'WH-01',
  code: '1',
  name: 'مخزن الفرع الرئيسي',
  nameEn: 'Main Branch Warehouse',
  branchId: 'BR-01',
  branchName: 'الفرع الرئيسي',
  accountId: 'ACC-1205',
  accountName: 'المخزون (مخزون بضائع بغرض البيع)',
  valuationType: 'included',
  allowedUsersType: 'all',
  allowedUserIds: [],
  status: 'نشط',
  notes: 'المخزن الافتراضي للفرع الرئيسي',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

export const INITIAL_WAREHOUSES: Warehouse[] = [DEFAULT_MAIN_WAREHOUSE];

class WarehouseService {
  private warehouses: Warehouse[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private deduplicateWarehouses(list: Warehouse[]): Warehouse[] {
    const seen = new Set<string>();
    return list.filter(w => {
      if (!w || !w.id) return false;
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
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
   * Ensures the existence of the default Main Branch warehouse.
   * - Does NOT create a duplicate if a warehouse for the main branch already exists.
   * - Idempotent operation: if existing, ensures proper linkage to main branch.
   */
  public ensureMainBranchWarehouse(): Warehouse {
    const mainBranch = this.getMainBranchInfo();

    // Check if main branch warehouse already exists (by ID, branchId, or standard name)
    const existing = this.warehouses.find(
      w => w.id === 'WH-01' || w.branchId === mainBranch.id || (w.name === 'مخزن الفرع الرئيسي' && (!w.branchId || w.branchId === mainBranch.id))
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
        this.saveToStorage();
      }
      return existing;
    }

    const defaultWh: Warehouse = {
      ...DEFAULT_MAIN_WAREHOUSE,
      branchId: mainBranch.id,
      branchName: mainBranch.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.warehouses.unshift(defaultWh);
    this.saveToStorage();
    return defaultWh;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const mapped = parsed
            .filter((w: any) => 
              !w.name?.includes('العجوزة') && 
              !w.branchName?.includes('العجوزة') && 
              w.branchId !== 'BR-02' &&
              // Filter out pure legacy demo seed record if never customized
              !(w.id === 'WH-01' && (w.nameEn === 'Main Distribution Depot' || w.notes?.includes('المستودع الرئيسي العام لاستلام وتسليم')))
            )
            .map((w: any) => {
              const matchingAcc = INVENTORY_CHART_OF_ACCOUNTS.find(
                a => a.id === w.accountId || a.code === w.accountId
              );
              return {
                ...w,
                accountId: matchingAcc ? matchingAcc.id : (w.accountId || 'ACC-1205'),
                accountName: matchingAcc ? matchingAcc.name : (w.accountName || 'المخزون (مخزون بضائع بغرض البيع)')
              };
            });
          this.warehouses = this.deduplicateWarehouses(mapped);
          this.ensureMainBranchWarehouse();
          this.saveToStorage();
          return;
        }
      }
    } catch (err) {
      console.warn('Could not parse stored warehouses:', err);
    }
    this.warehouses = [];
    this.ensureMainBranchWarehouse();
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      this.warehouses = this.deduplicateWarehouses(this.warehouses);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.warehouses));
    } catch (err) {
      console.error('Failed to save warehouses to localStorage', err);
    }
    this.notifyListeners();
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Error in warehouse service listener', err);
      }
    });
  }

  public getAllWarehouses(): Warehouse[] {
    return this.deduplicateWarehouses([...this.warehouses]);
  }

  public getActiveWarehouses(): Warehouse[] {
    const branches = this.getAvailableBranches();
    const inactiveBranchIds = new Set(
      branches.filter(b => b.status === 'غير نشط').map(b => b.id)
    );
    const active = this.warehouses.filter(
      w => (w.status === 'نشط' || w.status === 'active') && !inactiveBranchIds.has(w.branchId)
    );
    return this.deduplicateWarehouses(active);
  }

  /**
   * Retrieves active warehouses belonging strictly to a specific branch.
   */
  public getWarehousesByBranch(branchId: string): Warehouse[] {
    if (!branchId) return [];
    return this.getActiveWarehouses().filter(w => w.branchId === branchId);
  }

  /**
   * Retrieves the default warehouse for a branch.
   * For Main Branch, returns the main warehouse (WH-01 or first warehouse of the branch).
   */
  public getDefaultWarehouse(branchId?: string): Warehouse | undefined {
    const targetBranchId = branchId || this.getCurrentBranchId();
    const branchWhs = this.warehouses.filter(w => w.branchId === targetBranchId && (w.status === 'نشط' || w.status === 'active'));
    if (branchWhs.length === 0) {
      const allBranchWhs = this.warehouses.filter(w => w.branchId === targetBranchId);
      if (allBranchWhs.length > 0) return allBranchWhs[0];
      if (targetBranchId === 'BR-01' || !branchId) {
        return this.warehouses.find(w => w.id === 'WH-01') || this.warehouses[0];
      }
      return undefined;
    }
    const defaultWh = branchWhs.find(w => w.id === 'WH-01' || w.name.includes('الرئيسي')) || branchWhs[0];
    return defaultWh;
  }

  /**
   * Helper to retrieve current active branch ID without circular import issues
   */
  public getCurrentBranchId(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('VERTEX_CURRENT_BRANCH_ID') || localStorage.getItem('VERTEX_LAST_SELECTED_BRANCH_ID');
      if (stored) return stored;
    }
    const branches = this.getAvailableBranches();
    const activeMain = branches.find(b => b.isMain && b.status !== 'غير نشط');
    if (activeMain) return activeMain.id;
    return branches[0]?.id || 'BR-01';
  }

  /**
   * Retrieves active warehouses accessible for a specific user and optionally within a branch scope.
   * - Only 'نشط' (Active) warehouses are returned for new transactions/operations.
   * - Inactive warehouses ('غير نشط') are excluded from new transactions.
   * - If allowedUsersType === 'all', accessible to all permitted users.
   * - If allowedUsersType === 'specific', accessible only to assigned users or Super Admin.
   * - Strictly isolates warehouses to the branch scope (user branch or target branch).
   */
  public getAvailableWarehousesForUser(userIdOrUsername?: string, userRole?: string, branchId?: string): Warehouse[] {
    let list = this.getActiveWarehouses();

    // Determine target branch scope
    let targetBranchId = branchId && branchId !== 'all' ? branchId : undefined;
    if (!targetBranchId && userIdOrUsername) {
      const user = VERTEX_SYSTEM_USERS.find(
        u => u.id === userIdOrUsername || u.username === userIdOrUsername
      );
      if (user?.branchId) {
        targetBranchId = user.branchId;
      }
    }

    if (!targetBranchId && branchId !== 'all') {
      targetBranchId = this.getCurrentBranchId();
    }

    if (targetBranchId && targetBranchId !== 'all') {
      list = list.filter(w => w.branchId === targetBranchId);
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

      list = list.filter(w => {
        if (w.allowedUsersType === 'all') return true;
        if (!Array.isArray(w.allowedUserIds) || w.allowedUserIds.length === 0) return true;
        return w.allowedUserIds.includes(actualUserId) || w.allowedUserIds.includes(actualUsername);
      });
    }

    return this.deduplicateWarehouses(list);
  }

  public getWarehouseById(id: string): Warehouse | undefined {
    return this.warehouses.find(w => w.id === id || w.code === id);
  }

  public getAvailableBranches(): BranchItem[] {
    try {
      const wizardBranches = setupWizardService.getConfig().branches;
      if (Array.isArray(wizardBranches) && wizardBranches.length > 0) {
        return wizardBranches;
      }
    } catch {
      // ignore
    }
    return [
      { id: 'BR-01', code: 'BR-01', name: 'الفرع الرئيسي', city: 'الإسكندرية / القاهرة', isMain: true }
    ];
  }

  public getAvailableUsers(): SystemUserOption[] {
    const sellers = sellerService.getActiveSellers();
    return sellers.map(s => ({
      id: s.id,
      username: s.code,
      fullName: s.name,
      roleTitle: 'مندوب مبيعات معتمد',
      department: s.branchName || 'إدارة المبيعات والتوزيع',
      avatarLetter: s.name ? s.name[0] : 'م'
    }));
  }

  public getAvailableAccounts(): AccountOption[] {
    return INVENTORY_CHART_OF_ACCOUNTS;
  }

  /**
   * Generates the next sequential warehouse code (e.g., 1, 2, 3, 4)
   */
  public getNextWarehouseCode(): string {
    if (this.warehouses.length === 0) return '1';
    
    const numericCodes = this.warehouses
      .map(w => {
        const match = w.code.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter((n): n is number => n !== null && !isNaN(n));

    if (numericCodes.length === 0) {
      return (this.warehouses.length + 1).toString();
    }

    const maxCode = Math.max(...numericCodes);
    return (maxCode + 1).toString();
  }

  /**
   * Creates a new warehouse master record
   */
  public createWarehouse(data: {
    code?: string;
    name: string;
    nameEn?: string;
    branchId: string;
    branchName?: string;
    accountId?: string;
    accountName?: string;
    valuationType: 'included' | 'excluded';
    allowedUsersType: 'all' | 'specific';
    allowedUserIds?: string[];
    status?: 'نشط' | 'غير نشط';
    notes?: string;
  }): { success: boolean; warehouse?: Warehouse; error?: string } {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'اسم المخزن إجباري ومطلوب.' };
    }

    // Check duplicate warehouse name in the same branch
    const trimmedName = data.name.trim().toLowerCase();
    const existing = this.warehouses.find(
      w => w.name.toLowerCase() === trimmedName && w.branchId === data.branchId
    );
    if (existing) {
      return { success: false, error: `يوجد مخزن مسجل بنفس الاسم (${data.name.trim()}) على نفس الفرع.` };
    }

    const code = data.code?.trim() || this.getNextWarehouseCode();
    const branches = this.getAvailableBranches();
    const branch = branches.find(b => b.id === data.branchId);
    const branchName = data.branchName || branch?.name || 'الفرع الرئيسي';

    const accounts = this.getAvailableAccounts();
    const acc = data.accountId 
      ? accounts.find(a => a.id === data.accountId || a.code === data.accountId)
      : accounts[0];
    const accountId = acc ? acc.id : (data.accountId || 'ACC-1205');
    const accountName = data.accountName || acc?.name || 'المخزون (مخزون بضائع بغرض البيع)';

    const newId = `WH-${Date.now().toString().slice(-4)}`;

    const newWarehouse: Warehouse = {
      id: newId,
      code,
      name: data.name.trim(),
      nameEn: data.nameEn?.trim() || undefined,
      branchId: data.branchId,
      branchName,
      accountId,
      accountName,
      valuationType: data.valuationType || 'included',
      allowedUsersType: data.allowedUsersType || 'all',
      allowedUserIds: data.allowedUsersType === 'specific' ? (data.allowedUserIds || []) : [],
      status: data.status || 'نشط',
      notes: data.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.warehouses.unshift(newWarehouse);
    this.saveToStorage();

    auditEngine.logAction(
      'VGF-INV: Warehouse Master Creation',
      `تم إنشاء سجل مخزن جديد [${newWarehouse.code}] ${newWarehouse.name} فرع (${newWarehouse.branchName}).`,
      'info'
    );

    notificationEngine.addNotification(
      'إضافة مخزن جديد',
      `تم تسجيل المخزن [${newWarehouse.code}] (${newWarehouse.name}) بنجاح.`,
      'success',
      'MOD-INV'
    );

    return { success: true, warehouse: newWarehouse };
  }

  /**
   * Updates an existing warehouse record
   */
  public updateWarehouse(
    id: string,
    data: Partial<Omit<Warehouse, 'id' | 'createdAt'>>
  ): { success: boolean; warehouse?: Warehouse; error?: string } {
    const idx = this.warehouses.findIndex(w => w.id === id);
    if (idx === -1) {
      return { success: false, error: 'المخزن المطلوب تعديله غير موجود.' };
    }

    const current = this.warehouses[idx];

    if (data.name && data.name.trim()) {
      const trimmedName = data.name.trim().toLowerCase();
      const targetBranchId = data.branchId || current.branchId;
      const duplicate = this.warehouses.find(
        w => w.id !== id && w.name.toLowerCase() === trimmedName && w.branchId === targetBranchId
      );
      if (duplicate) {
        return { success: false, error: `يوجد مخزن آخر بنفس الاسم (${data.name.trim()}) على نفس الفرع.` };
      }
    }

    const branches = this.getAvailableBranches();
    const branchName = data.branchId 
      ? (branches.find(b => b.id === data.branchId)?.name || current.branchName)
      : current.branchName;

    const accounts = this.getAvailableAccounts();
    const acc = data.accountId ? accounts.find(a => a.id === data.accountId || a.code === data.accountId) : undefined;
    const accountId = acc ? acc.id : (data.accountId !== undefined ? data.accountId : current.accountId);
    const accountName = acc ? acc.name : (data.accountName || current.accountName);

    const updated: Warehouse = {
      ...current,
      ...data,
      name: data.name ? data.name.trim() : current.name,
      nameEn: data.nameEn !== undefined ? (data.nameEn.trim() || undefined) : current.nameEn,
      branchName,
      accountId,
      accountName,
      allowedUserIds: data.allowedUsersType === 'all' ? [] : (data.allowedUserIds ?? current.allowedUserIds),
      updatedAt: new Date().toISOString()
    };

    this.warehouses[idx] = updated;
    this.saveToStorage();

    auditEngine.logAction(
      'VGF-INV: Warehouse Master Update',
      `تم تحديث بيانات المخزن [${updated.code}] ${updated.name}. الحالة: (${updated.status}).`,
      'info'
    );

    notificationEngine.addNotification(
      'تحديث بيانات المخزن',
      `تم حفظ تعديلات المخزن [${updated.code}] (${updated.name}) بنجاح.`,
      'info',
      'MOD-INV'
    );

    return { success: true, warehouse: updated };
  }

  /**
   * Checks if a warehouse has associated inventory movements or sales across the system
   */
  public getWarehouseTransactions(warehouseId: string): WarehouseTransaction[] {
    const warehouse = this.getWarehouseById(warehouseId);
    if (!warehouse) return [];

    const txs: WarehouseTransaction[] = [];

    // 1. Fetch sales invoices associated with this warehouse
    try {
      const salesHistory = salesEntryService.getState()?.completedInvoices || [];
      salesHistory.forEach(inv => {
        if (
          (inv.warehouseId === warehouse.id || inv.warehouseId === warehouse.code || inv.warehouseName === warehouse.name) &&
          inv.status !== 'cancelled'
        ) {
          const totalQty = (inv.lineItems || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
          txs.push({
            id: `TX-SALES-${inv.id}`,
            warehouseId: warehouse.id,
            date: inv.createdAt ? inv.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            type: 'sales_invoice',
            typeLabel: 'صرف بضاعة / فاتورة مبيعات',
            itemCount: inv.lineItems?.length || 0,
            totalQuantity: totalQty,
            direction: 'out',
            referenceNumber: inv.invoiceNumber || inv.id,
            description: `صرف مبيعات للعميل (${inv.customerName || 'عميل نقدي'}) - إجمالي: ${inv.grandTotal?.toLocaleString() || 0}`,
            performedBy: 'النظام',
            createdAt: inv.createdAt || new Date().toISOString()
          });
        }
      });
    } catch {
      // ignore
    }

    // 1b. Stock Transfers (Issue & Receipt)
    try {
      const storedTransfers = localStorage.getItem('VERTEX_STOCK_TRANSFERS_V1');
      if (storedTransfers) {
        const transfers: any[] = JSON.parse(storedTransfers);
        transfers.forEach(tr => {
          if (tr.fromWarehouseId === warehouse.id || tr.fromWarehouseId === warehouse.code) {
            txs.push({
              id: `TX-TR-OUT-${tr.id}`,
              warehouseId: warehouse.id,
              date: tr.date || tr.createdAt?.slice(0, 10),
              type: 'transfer_out',
              typeLabel: 'إذن صرف تحويل مخزني',
              itemCount: tr.totalItems || tr.items?.length || 0,
              totalQuantity: tr.totalQuantity || 0,
              direction: 'out',
              referenceNumber: tr.transferNumber,
              description: `تحويل صادر إلى (${tr.toWarehouseName}) - الحالة: ${tr.status}`,
              performedBy: tr.createdBy || 'أمين المخزن',
              createdAt: tr.createdAt || new Date().toISOString()
            });
          }
          if ((tr.toWarehouseId === warehouse.id || tr.toWarehouseId === warehouse.code) && tr.status === 'مكتمل') {
            txs.push({
              id: `TX-TR-IN-${tr.id}`,
              warehouseId: warehouse.id,
              date: tr.completedAt?.slice(0, 10) || tr.date,
              type: 'transfer_in',
              typeLabel: 'إذن إضافة تحويل مخزني',
              itemCount: tr.totalItems || tr.items?.length || 0,
              totalQuantity: tr.totalQuantity || 0,
              direction: 'in',
              referenceNumber: tr.receiptNumber || `IN-${tr.transferNumber}`,
              description: `تحويل وارد مستلم من (${tr.fromWarehouseName})`,
              performedBy: tr.completedBy || 'أمين مخزن الاستلام',
              createdAt: tr.completedAt || new Date().toISOString()
            });
          }
        });
      }
    } catch {
      // ignore
    }

    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Checks if warehouse can be safely deleted or is protected by transactions
   */
  public canDeleteWarehouse(warehouseId: string): { canDelete: boolean; reason?: string; transactionCount: number } {
    const warehouse = this.getWarehouseById(warehouseId);
    if (!warehouse) {
      return { canDelete: false, reason: 'المخزن غير موجود.', transactionCount: 0 };
    }

    const mainBranch = this.getMainBranchInfo();
    const isMainBranchDefault = (warehouse.id === 'WH-01' || warehouse.branchId === mainBranch.id) &&
      this.warehouses.filter(w => w.branchId === mainBranch.id).length <= 1;
    if (isMainBranchDefault) {
      return {
        canDelete: false,
        transactionCount: 0,
        reason: 'لا يمكن حذف المخزن الافتراضي للفرع الرئيسي، فهو المخزن الأساسي لنظام التشغيل.'
      };
    }

    const txs = this.getWarehouseTransactions(warehouseId);
    if (txs.length > 0) {
      return {
        canDelete: false,
        transactionCount: txs.length,
        reason: `لا يمكن حذف المخزن (${warehouse.name}) نظراً لوجود (${txs.length}) حركة مخزنية ومبيعات مسجلة عليه. للحفاظ على سلامة أرصدة المخزون والقيود المحاسبية، يُمنع حذف المخازن ذات الحركات. يمكنك بدلاً من ذلك تعطيل حالته إلى "غير نشط".`
      };
    }

    return { canDelete: true, transactionCount: 0 };
  }

  /**
   * Deletes a warehouse if it has no associated transactions
   */
  public deleteWarehouse(warehouseId: string): { success: boolean; error?: string } {
    const warehouse = this.getWarehouseById(warehouseId);
    if (!warehouse) {
      return { success: false, error: 'المخزن غير موجود.' };
    }

    const check = this.canDeleteWarehouse(warehouseId);
    if (!check.canDelete) {
      return { success: false, error: check.reason };
    }

    this.warehouses = this.warehouses.filter(w => w.id !== warehouseId);
    this.saveToStorage();

    auditEngine.logAction(
      'VGF-INV: Warehouse Master Deletion',
      `تم حذف المخزن (${warehouse.name}) بكود [${warehouse.code}].`,
      'warning'
    );

    notificationEngine.addNotification(
      'حذف مخزن',
      `تم حذف سجل المخزن [${warehouse.code}] ${warehouse.name}.`,
      'warning',
      'MOD-INV'
    );

    return { success: true };
  }
}

export const warehouseService = new WarehouseService();
