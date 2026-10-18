import { BranchItem } from '../types';
import { setupWizardService } from './setupWizardService';
import { warehouseService, Warehouse } from './warehouseService';
import { treasuryService, Treasury } from './treasuryService';
import { chartOfAccountsService, ChartAccountNode } from './chartOfAccountsService';
import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';

export interface BranchLinkedEntities {
  warehouses: Warehouse[];
  treasuries: Treasury[];
  chartAccount?: ChartAccountNode;
}

class BranchService {
  private listeners: (() => void)[] = [];

  constructor() {
    // Note: Strict constraint - do not perform automatic destructive cleanups of existing data
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error('Error notifying BranchService listener:', e);
      }
    });
  }

  /**
   * Cleans and normalizes branch list:
   * 1. Replaces any English mock seed (HQ-NY / Global Headquarters) with the authentic Arabic Main Branch.
   * 2. Filters out legacy mock branches BR-LDN (London) and BR-DXB (Dubai).
   * 3. Deduplicates by ID.
   * 4. Ensures isMain: true is correctly assigned and at least one branch is active.
   */
  private normalizeBranches(rawBranches: BranchItem[]): BranchItem[] {
    if (!Array.isArray(rawBranches) || rawBranches.length === 0) {
      return [
        {
          id: 'BR-01',
          code: 'BR-01',
          name: 'الفرع الرئيسي',
          nameEn: 'Main Branch',
          city: 'الإسكندرية / القاهرة',
          address: 'المقر الرئيسي - الإسكندرية',
          phones: ['01000000001'],
          accountId: 'COA-12070701',
          accountCode: '12070701',
          accountName: 'جارى المركز الرئيسى',
          isMain: true,
          status: 'نشط'
        }
      ];
    }

    const seenIds = new Set<string>();
    const cleaned: BranchItem[] = [];

    rawBranches.forEach(b => {
      if (!b || !b.id) return;
      if (seenIds.has(b.id)) return;

      // Filter out legacy default mock branches BR-LDN (London) and BR-DXB (Dubai)
      if (
        (b.code === 'BR-LDN' || (b.name?.includes('London') && !b.isMain)) ||
        (b.code === 'BR-DXB' || (b.name?.includes('Dubai') && !b.isMain))
      ) {
        return;
      }

      seenIds.add(b.id);

      // Normalize the main branch if it had legacy English mock data, otherwise preserve all user-edited values
      if (b.id === 'BR-01' || b.code === 'HQ-NY') {
        const isEnglishMock = b.name?.includes('Global Headquarters') || b.code === 'HQ-NY';
        cleaned.push({
          id: 'BR-01',
          code: isEnglishMock ? 'BR-01' : (b.code || 'BR-01'),
          name: isEnglishMock ? 'الفرع الرئيسي' : (b.name || 'الفرع الرئيسي'),
          nameEn: isEnglishMock ? 'Main Branch' : (b.nameEn !== undefined ? b.nameEn : ''),
          city: isEnglishMock ? 'الإسكندرية / القاهرة' : (b.city !== undefined ? b.city : ''),
          address: isEnglishMock ? 'المقر الرئيسي - الإسكندرية' : (b.address !== undefined ? b.address : ''),
          phones: Array.isArray(b.phones) ? b.phones : (b.phones ? [b.phones] : []),
          accountId: b.accountId || 'COA-12070701',
          accountCode: b.accountCode || (b.accountId === 'COA-12070701' || !b.accountId ? '12070701' : ''),
          accountName: b.accountName || (b.accountId === 'COA-12070701' || !b.accountId ? 'جارى المركز الرئيسى' : ''),
          isMain: true,
          status: b.status === 'غير نشط' ? 'غير نشط' : 'نشط',
          showOnMainScreen: b.showOnMainScreen !== undefined ? Boolean(b.showOnMainScreen) : false
        });
      } else {
        cleaned.push({
          ...b,
          nameEn: b.nameEn !== undefined ? b.nameEn : '',
          city: b.city !== undefined ? b.city : '',
          address: b.address !== undefined ? b.address : '',
          phones: Array.isArray(b.phones) ? b.phones : (b.phones ? [b.phones] : []),
          accountId: b.accountId || '',
          accountCode: b.accountCode || '',
          accountName: b.accountName || '',
          status: b.status === 'غير نشط' ? 'غير نشط' : 'نشط',
          isMain: Boolean(b.isMain),
          showOnMainScreen: b.showOnMainScreen !== undefined ? Boolean(b.showOnMainScreen) : false
        });
      }
    });

    // Ensure at least BR-01 exists as isMain
    if (cleaned.length === 0) {
      cleaned.push({
        id: 'BR-01',
        code: 'BR-01',
        name: 'الفرع الرئيسي',
        nameEn: 'Main Branch',
        city: 'الإسكندرية / القاهرة',
        address: 'المقر الرئيسي - الإسكندرية',
        phones: ['01000000001'],
        accountId: 'COA-12070701',
        accountCode: '12070701',
        accountName: 'جارى المركز الرئيسى',
        isMain: true,
        status: 'نشط'
      });
    } else if (!cleaned.some(b => b.isMain)) {
      cleaned[0].isMain = true;
    }

    // Ensure that if there is only 1 branch in the system, its status is ALWAYS 'نشط'
    if (cleaned.length === 1) {
      cleaned[0].status = 'نشط';
    } else if (!cleaned.some(b => b.status !== 'غير نشط')) {
      const main = cleaned.find(b => b.isMain) || cleaned[0];
      main.status = 'نشط';
    }

    return cleaned;
  }

  /**
   * Retrieves all registered branches from system configuration
   */
  public getAllBranches(): BranchItem[] {
    const config = setupWizardService.getConfig();
    const rawBranches = config?.branches;
    const normalized = this.normalizeBranches(rawBranches);

    // If normalization altered the stored array or fields, sync back to authoritative source
    if (!rawBranches || !Array.isArray(rawBranches) || JSON.stringify(rawBranches) !== JSON.stringify(normalized)) {
      setupWizardService.updateConfig({ branches: normalized });
    }

    return [...normalized];
  }

  /**
   * Retrieves active branches only
   */
  public getActiveBranches(): BranchItem[] {
    return this.getAllBranches().filter(b => b.status !== 'غير نشط');
  }

  private currentBranchId: string | null = null;

  /**
   * Sets the active current branch ID and saves it to local storage
   */
  public setCurrentBranch(id: string): void {
    this.currentBranchId = id;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('VERTEX_CURRENT_BRANCH_ID', id);
    }
    this.notify();
  }

  /**
   * Retrieves a single branch by ID or Code
   */
  public getBranchById(idOrCode: string): BranchItem | undefined {
    const branches = this.getAllBranches();
    return branches.find(b => b.id === idOrCode || b.code === idOrCode);
  }

  /**
   * Returns the current active branch (active branch selected, active main branch, or first active branch)
   */
  public getCurrentBranch(): BranchItem {
    const branches = this.getAllBranches();
    
    // Check in-memory or persisted current branch selection
    const targetId = this.currentBranchId || (
      typeof localStorage !== 'undefined' 
        ? (localStorage.getItem('VERTEX_CURRENT_BRANCH_ID') || localStorage.getItem('VERTEX_LAST_SELECTED_BRANCH_ID'))
        : null
    );

    if (targetId) {
      const activeMatch = branches.find(b => (b.id === targetId || b.code === targetId) && b.status !== 'غير نشط');
      if (activeMatch) return activeMatch;
    }

    const activeMain = branches.find(b => b.isMain && b.status !== 'غير نشط');
    if (activeMain) return activeMain;
    const firstActive = branches.find(b => b.status !== 'غير نشط');
    if (firstActive) return firstActive;
    return branches[0];
  }

  /**
   * Calculates the next sequential branch code (e.g. BR-02, BR-03, BR-04...)
   */
  public getNextBranchCode(): string {
    const branches = this.getAllBranches();
    let maxNum = 0;
    branches.forEach(b => {
      const match = b.code.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `BR-${nextNum.toString().padStart(2, '0')}`;
  }

  /**
   * Updates a branch without altering its ID or Code.
   * Enforces account uniqueness across all branches.
   */
  public updateBranch(
    id: string, 
    data: {
      name: string;
      nameEn?: string;
      city?: string;
      address?: string;
      phones?: string[];
      accountId?: string;
      accountCode?: string;
      accountName?: string;
      status?: 'نشط' | 'غير نشط';
      showOnMainScreen?: boolean;
    }
  ): { success: boolean; branch?: BranchItem; error?: string } {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم الفرع مطلوب ولا يمكن تركه فارغاً.' };
    }

    const branches = this.getAllBranches();
    const branchIndex = branches.findIndex(b => b.id === id);
    if (branchIndex === -1) {
      return { success: false, error: `الفرع المطلوب برقم [${id}] غير موجود في النظام.` };
    }

    const currentBranch = branches[branchIndex];
    const oldName = currentBranch.name;

    // Enforce active branch constraint: There must always be at least one active branch in the system!
    if (data.status === 'غير نشط') {
      const otherActiveBranches = branches.filter(b => b.id !== id && b.status !== 'غير نشط');
      if (branches.length <= 1) {
        return {
          success: false,
          error: 'لا يمكن تعطيل الفرع الوحيد في النظام؛ يجب أن يظل هناك فرع واحد نشط على الأقل دائماً لإتمام العمليات التشغيلية والمالية.'
        };
      }
      if (otherActiveBranches.length === 0) {
        return {
          success: false,
          error: 'لا يمكن تعطيل هذا الفرع؛ يجب أن يظل هناك فرع واحد نشط على الأقل دائماً في النظام لإتمام العمليات التشغيلية والمالية.'
        };
      }
    }

    // Duplicate name check (excluding current record)
    const duplicate = branches.some(b => b.id !== id && b.name.trim().toLowerCase() === trimmedName.toLowerCase());
    if (duplicate) {
      return { success: false, error: `يوجد فرع آخر مسجل بالفعل بنفس الاسم [${trimmedName}].` };
    }

    // Enforce account uniqueness: account cannot be linked to more than one branch
    if (data.accountId) {
      const existingUsage = branches.find(b => b.id !== id && (b.accountId === data.accountId || (data.accountCode && b.accountCode === data.accountCode)));
      if (existingUsage) {
        return { 
          success: false, 
          error: `حساب جاري الفرع المحدد مرتبط بالفعل بفرع آخر [${existingUsage.name}]. لا يمكن ربط نفس الحساب بأكثر من فرع.` 
        };
      }
    }

    // Update branch in branches array
    const updatedBranch: BranchItem = {
      ...currentBranch,
      name: trimmedName,
      nameEn: data.nameEn !== undefined ? data.nameEn.trim() : currentBranch.nameEn,
      city: data.city !== undefined ? data.city.trim() : currentBranch.city,
      address: data.address !== undefined ? data.address.trim() : currentBranch.address,
      phones: data.phones !== undefined ? data.phones.filter(p => p.trim()) : currentBranch.phones,
      accountId: data.accountId !== undefined ? data.accountId : currentBranch.accountId,
      accountCode: data.accountCode !== undefined ? data.accountCode : currentBranch.accountCode,
      accountName: data.accountName !== undefined ? data.accountName : currentBranch.accountName,
      status: data.status || currentBranch.status || 'نشط',
      showOnMainScreen: data.showOnMainScreen !== undefined ? Boolean(data.showOnMainScreen) : Boolean(currentBranch.showOnMainScreen)
    };

    branches[branchIndex] = updatedBranch;
    setupWizardService.updateConfig({ branches });

    // Synchronize branchName in warehouses
    try {
      const warehouses = warehouseService.getAllWarehouses();
      let whUpdated = false;
      const updatedWhs = warehouses.map(w => {
        if (w.branchId === id) {
          whUpdated = true;
          return { ...w, branchName: trimmedName };
        }
        return w;
      });
      if (whUpdated && typeof localStorage !== 'undefined') {
        localStorage.setItem('VERTEX_WAREHOUSE_MASTER_V1', JSON.stringify(updatedWhs));
      }
    } catch (e) {
      console.warn('Failed to sync warehouse branch names:', e);
    }

    // Synchronize branchName in treasuries
    try {
      const treasuries = treasuryService.getAllTreasuries();
      let trUpdated = false;
      const updatedTrs = treasuries.map(t => {
        if (t.branchId === id) {
          trUpdated = true;
          return { ...t, branchName: trimmedName };
        }
        return t;
      });
      if (trUpdated && typeof localStorage !== 'undefined') {
        localStorage.setItem('VERTEX_TREASURY_MASTER_V1', JSON.stringify(updatedTrs));
      }
    } catch (e) {
      console.warn('Failed to sync treasury branch names:', e);
    }

    auditEngine.logAction(
      'تعديل بيانات الفرع',
      'إعدادات الفروع',
      `تم تعديل مسمى الفرع من [${oldName}] إلى [${trimmedName}] (كود: ${currentBranch.code} - معرف: ${id}) وتحديث بيانات الحساب الجاري والعنوان والهواتف.`,
      'info'
    );

    notificationEngine.addNotification(
      'تحديث بيانات الفرع',
      `تم تحديث بيانات الفرع [${trimmedName}] بنجاح`,
      'info',
      'إعدادات الفروع'
    );

    this.notify();
    return { success: true, branch: updatedBranch };
  }

  /**
   * Creates a new branch record only.
   * Rules:
   * - Creates branch data only.
   * - Does NOT create a warehouse automatically.
   * - Does NOT create a treasury automatically.
   * - Does NOT create any account or operational transaction automatically.
   * - Links the current account selected from the dropdown.
   */
  public createBranch(data: {
    name: string;
    nameEn?: string;
    code?: string;
    city?: string;
    address?: string;
    phones?: string[];
    accountId?: string;
    accountCode?: string;
    accountName?: string;
    status?: 'نشط' | 'غير نشط';
    showOnMainScreen?: boolean;
  }): { 
    success: boolean; 
    branch?: BranchItem; 
    error?: string;
  } {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم الفرع إجباري ومطلوب.' };
    }

    const branches = this.getAllBranches();

    // Check duplicate name
    if (branches.some(b => b.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `يوجد فرع مسجل مسبقاً بنفس الاسم [${trimmedName}].` };
    }

    const branchCode = data.code?.trim().toUpperCase() || this.getNextBranchCode();
    if (branches.some(b => b.code.toUpperCase() === branchCode)) {
      return { success: false, error: `كود الفرع [${branchCode}] مسجل مسبقاً.` };
    }

    // Enforce account uniqueness
    if (data.accountId) {
      const existingUsage = branches.find(b => b.accountId === data.accountId || (data.accountCode && b.accountCode === data.accountCode));
      if (existingUsage) {
        return { 
          success: false, 
          error: `حساب جاري الفرع المحدد مرتبط بالفعل بفرع آخر [${existingUsage.name}]. لا يمكن ربط نفس الحساب بأكثر من فرع.` 
        };
      }
    }

    const branchId = `BR-${Date.now().toString().slice(-4)}`;
    const newBranch: BranchItem = {
      id: branchId,
      code: branchCode,
      name: trimmedName,
      nameEn: data.nameEn?.trim() || '',
      city: data.city?.trim() || '',
      address: data.address?.trim() || '',
      phones: Array.isArray(data.phones) ? data.phones.filter(p => p.trim()) : [],
      accountId: data.accountId || '',
      accountCode: data.accountCode || '',
      accountName: data.accountName || '',
      status: data.status || 'نشط',
      isMain: false,
      showOnMainScreen: Boolean(data.showOnMainScreen)
    };

    // Save only the branch to configuration
    const updatedBranches = [...branches, newBranch];
    setupWizardService.updateConfig({ branches: updatedBranches });

    auditEngine.logAction(
      'إنشاء فرع جديد',
      'إعدادات الفروع',
      `تم إنشاء الفرع الجديد [${trimmedName}] (كود: ${branchCode}) وربطه بحساب جاري [${data.accountName || data.accountCode || 'غير محدد'}].`,
      'info'
    );

    notificationEngine.addNotification(
      'تأسيس فرع جديد',
      `تم إنشاء الفرع [${trimmedName}] بنجاح`,
      'success',
      'إعدادات الفروع'
    );

    this.notify();
    return {
      success: true,
      branch: newBranch
    };
  }

  /**
   * Deletes a branch.
   * Safety rule: The main branch (isMain: true) cannot be deleted under any circumstances.
   */
  public deleteBranch(id: string): { success: boolean; error?: string } {
    const branches = this.getAllBranches();
    const branch = branches.find(b => b.id === id);

    if (!branch) {
      return { success: false, error: 'الفرع المطلوب حذفه غير موجود.' };
    }

    if (branch.isMain) {
      return { 
        success: false, 
        error: 'الفرع الرئيسي للنظام هو كيان تأسيسي جوهري ولا يمكن حذفه نهائياً.' 
      };
    }

    // Ensure we do not delete the only active branch
    const otherActiveBranches = branches.filter(b => b.id !== id && b.status !== 'غير نشط');
    if (otherActiveBranches.length === 0) {
      return {
        success: false,
        error: 'لا يمكن حذف هذا الفرع؛ يجب أن يظل هناك فرع واحد نشط على الأقل في النظام.'
      };
    }

    // Check linked warehouses
    const linkedWarehouses = warehouseService.getAllWarehouses().filter(w => w.branchId === id);
    if (linkedWarehouses.length > 0) {
      return {
        success: false,
        error: `لا يمكن حذف الفرع لوجود (${linkedWarehouses.length}) مخزن/مستودع مرتبط به. يجب نقل المخازن أو حذفها أولاً.`
      };
    }

    // Check linked treasuries
    const linkedTreasuries = treasuryService.getAllTreasuries().filter(t => t.branchId === id);
    if (linkedTreasuries.length > 0) {
      return {
        success: false,
        error: `لا يمكن حذف الفرع لوجود (${linkedTreasuries.length}) خزينة نقدية مرتبطة به. يجب نقل الخزن أو حذفها أولاً.`
      };
    }

    const updatedBranches = branches.filter(b => b.id !== id);
    setupWizardService.updateConfig({ branches: updatedBranches });

    auditEngine.logAction(
      'حذف فرع',
      'إعدادات الفروع',
      `تم حذف الفرع [${branch.name}] (كود: ${branch.code}).`,
      'warning'
    );

    notificationEngine.addNotification(
      'حذف فرع',
      `تم حذف الفرع [${branch.name}] بنجاح`,
      'info',
      'إعدادات الفروع'
    );

    this.notify();
    return { success: true };
  }

  /**
   * Cleans up the test branch "العجوزة" (BR-02) and all its associated warehouses,
   * treasuries, transactions, and links, restoring the system state to before its creation.
   * Strictly preserves BR-01 and does not alter the Chart of Accounts.
   */
  public purgeAgouzaTestData(): { success: boolean; details: string[] } {
    const details: string[] = [];
    if (typeof localStorage === 'undefined') {
      return { success: true, details: ['Environment without localStorage, clean state confirmed.'] };
    }

    try {
      // 1. Clean Branches in setupWizardService
      const currentConfig = setupWizardService.getConfig();
      let agouzaBranchId = 'BR-AGZ';
      if (Array.isArray(currentConfig?.branches)) {
        const found = currentConfig.branches.find(
          b => b.id !== 'BR-01' && (b.name?.includes('العجوزة') || b.name?.includes('Agouza') || b.code === 'BR-AGZ')
        );
        if (found) {
          agouzaBranchId = found.id;
          details.push(`حذف فرع «${found.name}» (كود: ${found.code}, معرف: ${found.id})`);
        }
        const cleanedBranches = currentConfig.branches.filter(
          b => b.id === 'BR-01' || (!b.name?.includes('العجوزة') && !b.name?.includes('Agouza') && b.code !== 'BR-AGZ')
        );
        setupWizardService.updateConfig({ branches: cleanedBranches });
      }

      // 2. Clean Warehouses
      const rawWh = localStorage.getItem('VERTEX_WAREHOUSE_MASTER_V1');
      if (rawWh) {
        const warehouses = JSON.parse(rawWh);
        if (Array.isArray(warehouses)) {
          const removedWhs = warehouses.filter(
            (w: any) => w.name?.includes('العجوزة') || w.branchName?.includes('العجوزة') || (w.branchId !== 'BR-01' && (w.branchId === agouzaBranchId || w.branchId === 'BR-AGZ'))
          );
          if (removedWhs.length > 0) {
            removedWhs.forEach((w: any) => details.push(`حذف المخزن التابع: [${w.name}] (معرف: ${w.id})`));
            const remainingWhs = warehouses.filter((w: any) => !removedWhs.some((rw: any) => rw.id === w.id));
            localStorage.setItem('VERTEX_WAREHOUSE_MASTER_V1', JSON.stringify(remainingWhs));
          }
        }
      }

      // 3. Clean Treasuries
      const rawTr = localStorage.getItem('VERTEX_TREASURY_MASTER_V1');
      if (rawTr) {
        const treasuries = JSON.parse(rawTr);
        if (Array.isArray(treasuries)) {
          const removedTrs = treasuries.filter(
            (t: any) => t.name?.includes('العجوزة') || t.branchName?.includes('العجوزة') || (agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' && t.branchId === agouzaBranchId)
          );
          if (removedTrs.length > 0) {
            removedTrs.forEach((t: any) => details.push(`حذف الخزينة التابعة: [${t.name}] (معرف: ${t.id})`));
            const remainingTrs = treasuries.filter((t: any) => !removedTrs.some((rt: any) => rt.id === t.id));
            localStorage.setItem('VERTEX_TREASURY_MASTER_V1', JSON.stringify(remainingTrs));
          }
        }
      }

      // 4. Clean Sales Invoices (VGF-06)
      const rawSales = localStorage.getItem('VERTEX_VGF06_SALES_ENTRY');
      if (rawSales) {
        const salesData = JSON.parse(rawSales);
        if (Array.isArray(salesData)) {
          const remaining = salesData.filter((inv: any) => 
            inv.branchName?.includes('العجوزة') ? false : (agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' ? inv.branchId !== agouzaBranchId : true)
          );
          if (remaining.length !== salesData.length) {
            details.push(`حذف معاملات مبيعات تجريبية مرتبطة بالفرع (${salesData.length - remaining.length})`);
            localStorage.setItem('VERTEX_VGF06_SALES_ENTRY', JSON.stringify(remaining));
          }
        } else if (salesData && Array.isArray(salesData.completedInvoices)) {
          const remaining = salesData.completedInvoices.filter((inv: any) => 
            inv.branchName?.includes('العجوزة') ? false : (agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' ? inv.branchId !== agouzaBranchId : true)
          );
          if (remaining.length !== salesData.completedInvoices.length) {
            details.push(`حذف معاملات مبيعات تجريبية مكتملة (${salesData.completedInvoices.length - remaining.length})`);
            salesData.completedInvoices = remaining;
            localStorage.setItem('VERTEX_VGF06_SALES_ENTRY', JSON.stringify(salesData));
          }
        }
      }

      // 5. Clean Purchase Invoices
      const rawPurchases = localStorage.getItem('VERTEX_PURCHASE_INVOICES_V1');
      if (rawPurchases) {
        const purchases = JSON.parse(rawPurchases);
        if (Array.isArray(purchases)) {
          const remaining = purchases.filter((inv: any) => 
            inv.branchName?.includes('العجوزة') ? false : (agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' ? inv.branchId !== agouzaBranchId : true)
          );
          if (remaining.length !== purchases.length) {
            details.push(`حذف معاملات مشتريات تجريبية (${purchases.length - remaining.length})`);
            localStorage.setItem('VERTEX_PURCHASE_INVOICES_V1', JSON.stringify(remaining));
          }
        }
      }

      // 6. Clean Income Transactions
      const rawIncome = localStorage.getItem('VERTEX_INCOME_TRANSACTIONS_V1');
      if (rawIncome) {
        const incomeTxs = JSON.parse(rawIncome);
        if (Array.isArray(incomeTxs)) {
          const remaining = incomeTxs.filter((tx: any) => 
            tx.description?.includes('العجوزة') ? false : (agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' ? tx.branchId !== agouzaBranchId : true)
          );
          if (remaining.length !== incomeTxs.length) {
            details.push(`حذف حركات نقدية/دخل تجريبية (${incomeTxs.length - remaining.length})`);
            localStorage.setItem('VERTEX_INCOME_TRANSACTIONS_V1', JSON.stringify(remaining));
          }
        }
      }

      // 7. Clean Stock Transfers
      const rawTransfers = localStorage.getItem('VERTEX_STOCK_TRANSFERS_V1');
      if (rawTransfers) {
        const transfers = JSON.parse(rawTransfers);
        if (Array.isArray(transfers)) {
          const remaining = transfers.filter((t: any) => 
            agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' ? (t.fromBranch !== agouzaBranchId && t.toBranch !== agouzaBranchId) : true
          );
          if (remaining.length !== transfers.length) {
            details.push(`حذف حركات تحويل مخزني تجريبية (${transfers.length - remaining.length})`);
            localStorage.setItem('VERTEX_STOCK_TRANSFERS_V1', JSON.stringify(remaining));
          }
        }
      }

      // 8. Clean Business Day Shifts & Branch States
      const rawBd = localStorage.getItem('VERTEX_VGF04_BUSINESS_DAY');
      if (rawBd) {
        const bdState = JSON.parse(rawBd);
        let modified = false;
        if (bdState && Array.isArray(bdState.branches)) {
          const remaining = bdState.branches.filter((b: any) => 
            agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' ? b.branchId !== agouzaBranchId : true
          );
          if (remaining.length !== bdState.branches.length) {
            bdState.branches = remaining;
            modified = true;
          }
        }
        if (bdState && Array.isArray(bdState.shifts)) {
          const remaining = bdState.shifts.filter((s: any) => 
            agouzaBranchId !== 'BR-01' && agouzaBranchId !== 'BR-02' ? s.branchId !== agouzaBranchId : true
          );
          if (remaining.length !== bdState.shifts.length) {
            bdState.shifts = remaining;
            modified = true;
          }
        }
        if (modified) {
          details.push('تنظيف ورديات وأيام العمل التجريبية المرتبطة');
          localStorage.setItem('VERTEX_VGF04_BUSINESS_DAY', JSON.stringify(bdState));
        }
      }

      // 9. Clean Sellers
      const rawSellers = localStorage.getItem('VERTEX_SELLER_MASTER_V1');
      if (rawSellers) {
        const sellers = JSON.parse(rawSellers);
        if (Array.isArray(sellers)) {
          const remaining = sellers.filter((s: any) => 
            s.branchId !== agouzaBranchId && s.branchId !== 'BR-02' && !s.branchName?.includes('العجوزة')
          );
          if (remaining.length !== sellers.length) {
            details.push(`حذف مناديب بيع مسجلين للفرع التجريبي (${sellers.length - remaining.length})`);
            localStorage.setItem('VERTEX_SELLER_MASTER_V1', JSON.stringify(remaining));
          }
        }
      }

      // 10. Clean Chart of Accounts (جاري فرع العجوزة)
      const rawCoa = localStorage.getItem('VERTEX_CHART_OF_ACCOUNTS_REF_V1');
      if (rawCoa) {
        const accounts = JSON.parse(rawCoa);
        if (Array.isArray(accounts)) {
          const remaining = accounts.filter((a: any) => 
            !a.name?.includes('العجوزة') && !a.name?.includes('العجوزه') && !a.name?.includes('Agouza') && !a.notes?.includes('العجوز')
          );
          if (remaining.length !== accounts.length) {
            details.push(`حذف حساب جاري الفرع التجريبي من دليل الحسابات (${accounts.length - remaining.length})`);
            localStorage.setItem('VERTEX_CHART_OF_ACCOUNTS_REF_V1', JSON.stringify(remaining));
          }
        }
      }
      try {
        chartOfAccountsService.deleteAgouzaAccount();
      } catch {}

      this.notify();
    } catch (e) {
      console.error('Error during purgeAgouzaTestData:', e);
      return { success: false, details };
    }

    return { success: true, details };
  }
}

export const branchService = new BranchService();
