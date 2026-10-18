import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';
import { setupWizardService } from './setupWizardService';
import { salesEntryService } from './salesEntryService';
import { customerService } from './customerService';
import { BranchItem } from '../types';
import { SystemUserOption, VERTEX_SYSTEM_USERS } from './treasuryService';

export interface Seller {
  id: string;
  code: string;
  name: string;
  phone: string;
  branchId: string;
  branchName: string;
  commissionType: string; // e.g., 'كل المنتجات'
  salesCommissionPercent: number; // نسبة العمولة على المبيعات %
  salesCommissionAmount: number; // قيمة/الوحدة على المبيعات
  status: 'نشط' | 'غير نشط' | 'active' | 'inactive';
  allowedUsersType: 'all' | 'specific';
  allowedUserIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellerDTO {
  name: string;
  phone?: string;
  branchId: string;
  branchName?: string;
  commissionType?: string;
  salesCommissionPercent?: number;
  salesCommissionAmount?: number;
  status?: 'نشط' | 'غير نشط';
  allowedUsersType?: 'all' | 'specific';
  allowedUserIds?: string[];
  notes?: string;
}

export interface UpdateSellerDTO extends Partial<CreateSellerDTO> {}

const STORAGE_KEY = 'VERTEX_SELLER_MASTER_V1';

export const INITIAL_SELLERS: Seller[] = [];

class SellerService {
  private sellers: Seller[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out dummy/fake demo sellers (London, Dubai, EMEA, MENA, or hardcoded seed sellers)
          const filtered = parsed.filter((s: any) => 
            !s.branchName?.includes('London') && 
            !s.branchName?.includes('EMEA') && 
            !s.branchName?.includes('Dubai') && 
            !s.branchName?.includes('MENA') && 
            !s.notes?.includes('EMEA') &&
            s.branchId !== 'BR-02' &&
            s.branchId !== 'BR-03' &&
            !(s.id === 'SLR-001' && s.name === 'ماى' && s.phone === '01012345678') &&
            !(s.id === 'SLR-002' && s.name === 'أحمد كمال' && s.phone === '01234567890')
          );
          this.sellers = filtered;
          this.saveToStorage();
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load sellers from storage:', e);
    }
    this.sellers = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sellers));
    } catch (e) {
      console.error('Failed to persist sellers to storage:', e);
    }
  }

  private notify(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error('Error in sellerService listener:', err);
      }
    });
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getAllSellers(): Seller[] {
    return [...this.sellers];
  }

  public getActiveSellers(): Seller[] {
    return this.sellers.filter(s => s.status === 'نشط' || s.status === 'active');
  }

  public getSellerById(id: string): Seller | undefined {
    return this.sellers.find(s => s.id === id);
  }

  public getSellerByCode(code: string): Seller | undefined {
    const trimmed = String(code).trim();
    return this.sellers.find(s => String(s.code).trim() === trimmed);
  }

  public getAvailableBranches(): BranchItem[] {
    try {
      const config = setupWizardService.getConfig();
      if (config?.branches && config.branches.length > 0) {
        return config.branches;
      }
    } catch (e) {
      console.warn('Error reading branches from setupWizardService:', e);
    }
    return [
      { id: 'BR-01', name: 'الفرع الرئيسي', code: 'BR-01', isMain: true, city: 'الإسكندرية / القاهرة' }
    ];
  }

  public getAvailableUsers(): SystemUserOption[] {
    return VERTEX_SYSTEM_USERS;
  }

  public getNextSequentialCode(): string {
    if (this.sellers.length === 0) return '1';
    
    // Extract numeric codes
    const numericCodes = this.sellers
      .map(s => parseInt(s.code, 10))
      .filter(n => !isNaN(n) && n > 0);

    if (numericCodes.length === 0) {
      return String(this.sellers.length + 1);
    }

    const maxCode = Math.max(...numericCodes);
    return String(maxCode + 1);
  }

  public getTransactionsCount(sellerId: string, sellerName?: string): number {
    let count = 0;
    try {
      // 1. Check Sales Invoices
      const salesState = salesEntryService.getState();
      const allInvoices = [
        ...(salesState?.completedInvoices || []),
        ...(salesState?.openInvoices || [])
      ];

      allInvoices.forEach(inv => {
        if (
          inv.sellerId === sellerId ||
          (sellerName && inv.sellerName === sellerName)
        ) {
          count++;
        }
      });

      // 2. Check Customers assigned to seller
      const customers = customerService.getAllCustomers();
      customers.forEach(cust => {
        if (
          cust.assignedSeller &&
          (cust.assignedSeller === sellerId || (sellerName && cust.assignedSeller === sellerName))
        ) {
          count++;
        }
      });
    } catch (err) {
      console.warn('Error checking seller transaction count:', err);
    }
    return count;
  }

  public createSeller(data: CreateSellerDTO): Seller {
    if (!data.name || !data.name.trim()) {
      throw new Error('اسم البائع مطلوب وإجباري');
    }

    const branches = this.getAvailableBranches();
    const branch = branches.find(b => b.id === data.branchId);
    const branchName = data.branchName || branch?.name || 'داتا اليكس للتوريدات العمومية';

    const code = this.getNextSequentialCode();
    const newId = `SLR-${Date.now().toString().slice(-4)}`;

    const newSeller: Seller = {
      id: newId,
      code,
      name: data.name.trim(),
      phone: data.phone?.trim() || '',
      branchId: data.branchId || 'BR-01',
      branchName,
      commissionType: data.commissionType || 'كل المنتجات',
      salesCommissionPercent: data.salesCommissionPercent || 0,
      salesCommissionAmount: data.salesCommissionAmount || 0,
      status: data.status || 'نشط',
      allowedUsersType: data.allowedUsersType || 'all',
      allowedUserIds: data.allowedUsersType === 'specific' ? (data.allowedUserIds || []) : [],
      notes: data.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.sellers.push(newSeller);
    this.saveToStorage();

    auditEngine.logAction(
      'إنشاء بائع جديد',
      'إدارة البائعين',
      `تم إنشاء بائع جديد: [${newSeller.code}] ${newSeller.name} - فرع: ${newSeller.branchName}`,
      'info'
    );

    notificationEngine.addNotification(
      'إضافة بائع جديد بنجاح',
      `تم تسجيل البائع (${newSeller.name}) بالكود [${newSeller.code}] بنجاح`,
      'success',
      'إدارة البائعين'
    );

    this.notify();
    return newSeller;
  }

  public updateSeller(id: string, data: UpdateSellerDTO): Seller {
    const index = this.sellers.findIndex(s => s.id === id);
    if (index === -1) {
      throw new Error(`البائع بالمعرف ${id} غير موجود`);
    }

    const current = this.sellers[index];
    const branches = this.getAvailableBranches();
    const branch = data.branchId ? branches.find(b => b.id === data.branchId) : undefined;
    const branchName = data.branchId
      ? (branch?.name || data.branchName || current.branchName)
      : current.branchName;

    const updated: Seller = {
      ...current,
      name: data.name ? data.name.trim() : current.name,
      phone: data.phone !== undefined ? data.phone.trim() : current.phone,
      branchId: data.branchId || current.branchId,
      branchName,
      commissionType: data.commissionType !== undefined ? data.commissionType : current.commissionType,
      salesCommissionPercent: data.salesCommissionPercent !== undefined ? data.salesCommissionPercent : current.salesCommissionPercent,
      salesCommissionAmount: data.salesCommissionAmount !== undefined ? data.salesCommissionAmount : current.salesCommissionAmount,
      status: data.status || current.status,
      allowedUsersType: data.allowedUsersType || current.allowedUsersType,
      allowedUserIds: data.allowedUsersType === 'all' ? [] : (data.allowedUserIds ?? current.allowedUserIds),
      notes: data.notes !== undefined ? data.notes.trim() : current.notes,
      updatedAt: new Date().toISOString()
    };

    this.sellers[index] = updated;
    this.saveToStorage();

    auditEngine.logAction(
      'تحديث بيانات بائع',
      'إدارة البائعين',
      `تم تحديث بيانات البائع: [${updated.code}] ${updated.name} (الحالة: ${updated.status})`,
      'info'
    );

    notificationEngine.addNotification(
      'تحديث بيانات بائع',
      `تم حفظ تعديلات البائع (${updated.name}) بنجاح`,
      'info',
      'إدارة البائعين'
    );

    this.notify();
    return updated;
  }

  public deleteSeller(id: string): { success: boolean; error?: string; txCount?: number } {
    const seller = this.getSellerById(id);
    if (!seller) {
      return { success: false, error: 'البائع غير موجود' };
    }

    const txCount = this.getTransactionsCount(seller.id, seller.name);
    if (txCount > 0) {
      return {
        success: false,
        txCount,
        error: `لا يمكن حذف البائع (${seller.name}) لوجود (${txCount}) حركة ومبيعات أو عملاء مسجلين عليه! للحفاظ على سلامة القيود والتقارير التاريخية، يُرجى تغيير حالته إلى "غير نشط".`
      };
    }

    this.sellers = this.sellers.filter(s => s.id !== id);
    this.saveToStorage();

    auditEngine.logAction(
      'حذف بائع',
      'إدارة البائعين',
      `تم حذف البائع: [${seller.code}] ${seller.name} بنجاح`,
      'warning'
    );

    notificationEngine.addNotification(
      'حذف بائع',
      `تم حذف البائع (${seller.name}) من النظام نهائياً`,
      'warning',
      'إدارة البائعين'
    );

    this.notify();
    return { success: true };
  }
}

export const sellerService = new SellerService();
