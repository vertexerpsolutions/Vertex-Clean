import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';
import { vendorService, Vendor } from './vendorService';
import { salesEntryService, ProductItem } from './salesEntryService';
import { treasuryService } from './treasuryService';
import { warehouseService } from './warehouseService';
import { branchService } from './branchService';

export interface PurchaseLineItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  bonusQuantity?: number;
  unitPrice: number; // Purchase price (سعر الشراء)
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  lineTotal: number;
}

export interface PurchaseInvoiceData {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  branchId?: string;
  branchName?: string;
  vendorType: 'cash' | 'permanent';
  vendorId: string;
  vendorName: string;
  warehouseId: string;
  warehouseName: string;
  paymentMethod: 'نقدي' | 'آجل' | 'تحويل بنكي' | 'شيك' | 'card' | 'mixed' | 'deferred' | 'cash';
  treasuryId: string;
  treasuryName: string;
  bankId?: string;
  bankName?: string;
  cashPaid?: number;
  cardPaid?: number;
  creditPaid?: number;
  lineItems: PurchaseLineItem[];
  subtotal: number;
  invoiceDiscountType: 'percent' | 'fixed';
  invoiceDiscountValue: number;
  totalDiscount: number;
  isTaxInvoice: boolean;
  taxRate: number;
  totalTax: number;
  taxDiscountRate: number;
  taxDiscount: number;
  grandTotal: number;
  notes?: string;
  status: 'draft' | 'completed' | 'held' | 'cancelled';
  wasHeld?: boolean;
  isEdited?: boolean;
  originalInvoiceId?: string;
  paidAmount?: number;
  remainingAmount?: number;
  printFormat?: 'a4' | 'receipt';
}

const STORAGE_KEY_COMPLETED = 'VERTEX_PURCHASE_INVOICES_V1';
const STORAGE_KEY_HELD = 'VERTEX_PURCHASE_HELD_INVOICES_V1';
const STORAGE_KEY_COUNTER = 'VERTEX_PURCHASE_SEQUENCE_COUNTER_V1';

class PurchaseService {
  private completedInvoices: PurchaseInvoiceData[] = [];
  private heldInvoices: PurchaseInvoiceData[] = [];
  private highestSequenceGenerated: number = 1000;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const savedCompleted = localStorage.getItem(STORAGE_KEY_COMPLETED);
      if (savedCompleted) {
        this.completedInvoices = JSON.parse(savedCompleted);
      } else {
        this.completedInvoices = [];
      }

      const savedHeld = localStorage.getItem(STORAGE_KEY_HELD);
      if (savedHeld) {
        this.heldInvoices = JSON.parse(savedHeld);
      } else {
        this.heldInvoices = [];
      }

      // Collect all invoices and sanitize any legacy random invoice numbers
      const allInvoices = [...(this.completedInvoices || []), ...(this.heldInvoices || [])];
      
      // If there are legacy invoices with numbers created by Math.random (e.g., > 1000 + count * 5 or non-sequential)
      const needsResequencing = allInvoices.some(inv => {
        if (!inv.invoiceNumber) return true;
        const match = inv.invoiceNumber.match(/(\d+)$/);
        if (!match) return true;
        const seq = parseInt(match[1], 10);
        return isNaN(seq) || seq < 1001 || (seq > 1000 + Math.max(allInvoices.length, 1) + 20);
      });

      if (needsResequencing && allInvoices.length > 0) {
        // Sort chronologically and reassign sequential numbers starting at PUR-2026-1001
        allInvoices.sort((a, b) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tA - tB;
        });

        let currentSeq = 1001;
        allInvoices.forEach(inv => {
          inv.invoiceNumber = `PUR-2026-${String(currentSeq).padStart(4, '0')}`;
          currentSeq++;
        });

        this.highestSequenceGenerated = 1000 + allInvoices.length;
      } else if (allInvoices.length === 0) {
        this.highestSequenceGenerated = 1000;
      } else {
        let maxSeq = 1000;
        allInvoices.forEach(inv => {
          if (inv && inv.invoiceNumber) {
            const match = inv.invoiceNumber.match(/(\d+)$/);
            if (match) {
              const seq = parseInt(match[1], 10);
              if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        });
        this.highestSequenceGenerated = maxSeq;
      }

      this.saveToStorage();
    } catch (e) {
      console.error('Error loading purchase invoices from storage:', e);
      this.completedInvoices = [];
      this.heldInvoices = [];
      this.highestSequenceGenerated = 1000;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(this.completedInvoices));
      localStorage.setItem(STORAGE_KEY_HELD, JSON.stringify(this.heldInvoices));
      localStorage.setItem(STORAGE_KEY_COUNTER, String(this.highestSequenceGenerated));
    } catch (e) {
      console.error('Error saving purchase invoices to storage:', e);
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
        console.error('PurchaseService listener error:', err);
      }
    });
  }

  public getCompletedInvoices(): PurchaseInvoiceData[] {
    return [...this.completedInvoices];
  }

  public getHeldInvoices(): PurchaseInvoiceData[] {
    return [...this.heldInvoices];
  }

  public isInvoiceSaved(invoiceId?: string): boolean {
    if (!invoiceId) return false;
    return this.completedInvoices.some(inv => inv.id === invoiceId);
  }

  public getInvoiceById(invoiceId: string): PurchaseInvoiceData | undefined {
    return this.completedInvoices.find(inv => inv.id === invoiceId) || this.heldInvoices.find(inv => inv.id === invoiceId);
  }

  public getNextSequenceNumber(): number {
    let maxSeq = 1000;
    const allInvoices = [...(this.completedInvoices || []), ...(this.heldInvoices || [])];
    allInvoices.forEach(inv => {
      if (inv && inv.invoiceNumber) {
        const match = inv.invoiceNumber.match(/(\d+)$/);
        if (match) {
          const seq = parseInt(match[1], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });

    if (this.highestSequenceGenerated && this.highestSequenceGenerated > maxSeq) {
      maxSeq = this.highestSequenceGenerated;
    }

    return maxSeq + 1;
  }

  public generateNextInvoiceNumber(): string {
    const year = 2026;
    const nextSeq = this.getNextSequenceNumber();
    return `PUR-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  public ensureUniqueInvoiceNumber(inv: PurchaseInvoiceData): void {
    const existingNumbers = new Set([
      ...(this.completedInvoices || []).filter(c => c.id !== inv.id).map(c => c.invoiceNumber),
      ...(this.heldInvoices || []).filter(h => h.id !== inv.id).map(h => h.invoiceNumber)
    ]);

    if (!inv.invoiceNumber || existingNumbers.has(inv.invoiceNumber)) {
      let seq = this.getNextSequenceNumber();
      const year = 2026;
      let candidate = `PUR-${year}-${String(seq).padStart(4, '0')}`;
      while (existingNumbers.has(candidate)) {
        seq++;
        candidate = `PUR-${year}-${String(seq).padStart(4, '0')}`;
      }
      inv.invoiceNumber = candidate;
    }

    if (inv.invoiceNumber) {
      const match = inv.invoiceNumber.match(/(\d+)$/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > this.highestSequenceGenerated) {
          this.highestSequenceGenerated = seq;
        }
      }
    }
  }

  /**
   * Validates whether a purchase invoice credit/deferred amount is allowed for a vendor
   * Follows the exact identical credit logic and rules as salesEntryService.validateCustomerCredit
   */
  public validateVendorCredit(
    vendorId?: string,
    invoiceAmount: number = 0,
    paymentMethod: string = 'deferred',
    editingInvoiceId?: string
  ): {
    allowed: boolean;
    reason?: 'vendor_not_found' | 'disallowed' | 'credit_limit_exceeded';
    message?: string;
    allowCreditPurchases?: boolean;
    creditLimit?: number;
    currentOutstanding?: number;
    availableCredit?: number;
    isLimitExceeded?: boolean;
    invoiceAmount?: number;
    projectedOutstanding?: number;
  } {
    if (!vendorId) {
      return {
        allowed: false,
        reason: 'vendor_not_found',
        message: 'المورد المحدد غير موجود',
        availableCredit: 0,
        currentOutstanding: 0,
        creditLimit: 0,
        allowCreditPurchases: false
      };
    }

    const vendor = vendorService.getVendorById(vendorId);

    if (!vendor) {
      return {
        allowed: false,
        reason: 'vendor_not_found',
        message: 'المورد المحدد غير موجود بجدول الموردين',
        availableCredit: 0,
        currentOutstanding: 0,
        creditLimit: 0,
        allowCreditPurchases: false
      };
    }

    if (!vendor.isSystemCashVendor && vendor.id !== 'VEND-CASH' && vendor.id !== 'VEND-CASH-001' && (vendor.status === 'غير نشط' || vendor.status === 'inactive' || vendor.status === 'محذوف' || vendor.status === 'deleted')) {
      return {
        allowed: false,
        reason: 'disallowed',
        message: 'هذا المورد معطّل ولا يمكن إنشاء فاتورة شراء له.',
        allowCreditPurchases: false,
        creditLimit: vendor.creditLimit || 0,
        currentOutstanding: vendor.balanceDue || 0,
        availableCredit: 0,
        isLimitExceeded: false,
        invoiceAmount,
        projectedOutstanding: (vendor.balanceDue || 0) + invoiceAmount
      };
    }

    let currentOutstanding = vendor.balanceDue || 0;

    // If editing an existing completed invoice that was previously recorded as deferred, subtract its old deferred amount to avoid double counting
    if (editingInvoiceId) {
      const prevInv = this.completedInvoices.find(c => c.id === editingInvoiceId);
      if (prevInv && prevInv.status !== 'cancelled') {
        const prevDeferred = prevInv.creditPaid ?? (prevInv.paymentMethod === 'آجل' || prevInv.paymentMethod === 'deferred' ? prevInv.grandTotal : 0);
        if (prevDeferred > 0) {
          currentOutstanding = Math.max(0, currentOutstanding - prevDeferred);
        }
      }
    }

    const allowCreditPurchases = vendor.allowCreditPurchases ?? false;
    const creditLimit = vendor.creditLimit || 0;
    const hasCreditLimit = creditLimit > 0;

    // Available Credit:
    // If creditLimit > 0 -> Credit Limit - Current Outstanding
    // If creditLimit === 0 (or unset) -> No credit limit (بلا حد ائتماني)
    const availableCredit = hasCreditLimit ? Math.max(0, creditLimit - currentOutstanding) : 999999999;
    const isLimitExceeded = hasCreditLimit ? currentOutstanding > creditLimit : false;
    const projectedOutstanding = currentOutstanding + invoiceAmount;

    // Rule 1: Check if credit purchases are allowed for this vendor
    if (!allowCreditPurchases) {
      return {
        allowed: invoiceAmount === 0,
        reason: 'disallowed',
        message: 'سبب المنع: الشراء الآجل غير مسموح لهذا المورد',
        allowCreditPurchases: false,
        creditLimit,
        currentOutstanding,
        availableCredit,
        isLimitExceeded,
        invoiceAmount,
        projectedOutstanding
      };
    }

    // Rule 2: If vendor has a defined credit limit and has already exceeded it, any new credit is blocked
    if (hasCreditLimit && invoiceAmount > 0 && isLimitExceeded) {
      return {
        allowed: false,
        reason: 'credit_limit_exceeded',
        message: 'سبب المنع: المورد متجاوز للحد الائتماني بالفعل',
        allowCreditPurchases: true,
        creditLimit,
        currentOutstanding,
        availableCredit,
        isLimitExceeded: true,
        invoiceAmount,
        projectedOutstanding
      };
    }

    // Rule 3: Validate invoice credit amount against Available Credit (projected outstanding > credit limit) only if credit limit is defined
    if (hasCreditLimit && (invoiceAmount > availableCredit || projectedOutstanding > creditLimit)) {
      return {
        allowed: invoiceAmount === 0,
        reason: 'credit_limit_exceeded',
        message: 'سبب المنع: تجاوز حد الائتمان المسموح للمورد',
        allowCreditPurchases: true,
        creditLimit,
        currentOutstanding,
        availableCredit,
        isLimitExceeded: isLimitExceeded || projectedOutstanding > creditLimit,
        invoiceAmount,
        projectedOutstanding
      };
    }

    return {
      allowed: true,
      allowCreditPurchases: true,
      creditLimit,
      currentOutstanding,
      availableCredit,
      isLimitExceeded: false,
      invoiceAmount,
      projectedOutstanding
    };
  }

  /**
   * Save a purchase invoice:
   * - Validates vendor credit limits & permissions if deferred
   * - Adds inventory stock to warehouse
   * - Updates product purchase prices
   * - Updates vendor balance (if deferred or permanent vendor)
   * - Records treasury outflow (if cash)
   * - Stores completed invoice
   */
  public savePurchaseInvoice(invoice: PurchaseInvoiceData): { success: boolean; error?: string; invoice?: PurchaseInvoiceData } {
    if (!invoice.lineItems || invoice.lineItems.length === 0) {
      return { success: false, error: 'لا يمكن حفظ فاتورة شراء بدون أصناف.' };
    }

    // Branch Status and Isolation Guard: Ensure warehouse belongs to the invoice's branch and an active branch
    const warehouseId = invoice.warehouseId || 'WH-01';
    const allWarehouses = warehouseService.getAllWarehouses();
    const targetWh = allWarehouses.find(w => 
      w.id === warehouseId || 
      w.code === warehouseId ||
      w.id.toLowerCase() === warehouseId.toLowerCase() ||
      w.code.toLowerCase() === warehouseId.toLowerCase()
    );

    if (!targetWh) {
      return {
        success: false,
        error: `المخزن المحدد [${warehouseId}] غير موجود في النظام.`
      };
    }

    const invoiceBranchId = invoice.branchId || branchService.getCurrentBranch()?.id;
    if (targetWh.branchId && invoiceBranchId && targetWh.branchId !== invoiceBranchId) {
      const whBranch = branchService.getBranchById(targetWh.branchId);
      const invBranch = branchService.getBranchById(invoiceBranchId);
      return {
        success: false,
        error: `لا يمكن حفظ فاتورة الشراء على مخزن تابع لفرع آخر [${whBranch?.name || targetWh.branchId}]. الفاتورة مخصصة لفرع [${invBranch?.name || invoiceBranchId}].`
      };
    }

    if (targetWh.branchId) {
      const branch = branchService.getBranchById(targetWh.branchId);
      if (branch && branch.status === 'غير نشط') {
        return {
          success: false,
          error: `لا يمكن حفظ فاتورة الشراء على مخزن تابع لفرع موقوف/غير نشط [${branch.name}].`
        };
      }
    }

    const creditAmount = invoice.creditPaid !== undefined 
      ? invoice.creditPaid 
      : (invoice.paymentMethod === 'آجل' || invoice.paymentMethod === 'deferred' ? invoice.grandTotal : 0);

    const cashAmount = invoice.cashPaid !== undefined
      ? invoice.cashPaid
      : (invoice.paymentMethod === 'نقدي' || invoice.paymentMethod === 'cash' ? invoice.grandTotal : 0);

    // Credit limit validation MUST execute if creditAmount > 0
    if (creditAmount > 0 && invoice.vendorId && invoice.vendorId !== 'VEND-CASH' && invoice.vendorId !== 'VEND-CASH-001') {
      const creditVal = this.validateVendorCredit(invoice.vendorId, creditAmount, invoice.paymentMethod, invoice.id);
      if (!creditVal.allowed) {
        return {
          success: false,
          error: creditVal.message || 'تم رفض العملية: تجاوز حد الائتمان أو الآجل غير مسموح للمورد.'
        };
      }
    }

    const completedInv: PurchaseInvoiceData = {
      ...invoice,
      status: 'completed',
      createdAt: invoice.createdAt || new Date().toISOString()
    };

    const existingIndex = this.completedInvoices.findIndex(c => c.id === completedInv.id);
    const prevInv = existingIndex >= 0 ? this.completedInvoices[existingIndex] : null;

    const products = salesEntryService.getState().products;

    // 1. INVERSE OF SALES: Manage Stock Adjustments
    if (prevInv && prevInv.lineItems) {
      // Revert previous stock addition before applying updated invoice items
      const prevWId = prevInv.warehouseId || 'WH-01';
      prevInv.lineItems.forEach(item => {
        const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
        if (p && p.warehouseStocks) {
          const prevPurchasedQty = (item.quantity || 0) + (item.bonusQuantity || 0);
          p.warehouseStocks[prevWId] = Math.max(0, (p.warehouseStocks[prevWId] || 0) - prevPurchasedQty);
          p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
        }
      });
    }

    // Add stock for all purchased items (Quantity + Bonus) into target warehouse
    invoice.lineItems.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        if (!p.warehouseStocks) {
          p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
          const prodWId = salesEntryService.normalizeWarehouseId(p.warehouse);
          p.warehouseStocks[prodWId] = p.stockQty || 0;
        }
        const totalPurchasedQty = (item.quantity || 0) + (item.bonusQuantity || 0);
        p.warehouseStocks[warehouseId] = (p.warehouseStocks[warehouseId] || 0) + totalPurchasedQty;
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);

        // Update product cost and last purchase price
        if (item.unitPrice > 0) {
          p.lastPurchasePrice = item.unitPrice;
          p.costPrice = item.unitPrice;
        }
      }
    });

    salesEntryService.saveState();

    // 2. Vendor balance update: If payment has deferred/credit component (آجل)
    if (invoice.vendorId && invoice.vendorId !== 'VEND-CASH' && invoice.vendorId !== 'VEND-CASH-001') {
      const vendor = vendorService.getVendorById(invoice.vendorId);
      if (vendor) {
        if (prevInv) {
          const prevDeferred = prevInv.creditPaid !== undefined
            ? prevInv.creditPaid
            : (prevInv.paymentMethod === 'آجل' || prevInv.paymentMethod === 'deferred' ? prevInv.grandTotal : 0);
          const diff = creditAmount - prevDeferred;
          if (diff !== 0) {
            const newBalance = Math.max(0, (vendor.balanceDue || 0) + diff);
            vendorService.updateVendor(vendor.id, { balanceDue: newBalance });
          }
        } else if (creditAmount > 0) {
          const newBalance = (vendor.balanceDue || 0) + creditAmount;
          vendorService.updateVendor(vendor.id, { balanceDue: newBalance });
        }
      }
    }

    // 3. Treasury transaction: If cash was paid
    if (cashAmount > 0 && invoice.treasuryId) {
      const treasury = treasuryService.getTreasuryById(invoice.treasuryId);
      if (treasury) {
        auditEngine.logAction(
          'سداد فاتورة مشتريات نقدية',
          'المشتريات والخزينة',
          `تم سداد فاتورة مشتريات رقم [${completedInv.invoiceNumber}] بقيمة ${cashAmount} $ من الخزينة [${treasury.name}] للمورد (${completedInv.vendorName}).`,
          'info'
        );
      }
    }

    // 4. Remove from held invoices if previously held
    this.heldInvoices = this.heldInvoices.filter(h => h.id !== completedInv.id);

    // 5. Update or insert into completed invoices
    if (existingIndex >= 0) {
      this.completedInvoices[existingIndex] = completedInv;
    } else {
      this.ensureUniqueInvoiceNumber(completedInv);
      this.completedInvoices = [completedInv, ...this.completedInvoices];
    }

    this.saveToStorage();

    auditEngine.logAction(
      'حفظ فاتورة مشتريات',
      'إدارة المشتريات والموردين',
      `تم حفظ فاتورة الشراء رقم [${completedInv.invoiceNumber}] بنجاح، المورد: ${completedInv.vendorName}، الإجمالي: ${completedInv.grandTotal} ج.م.`,
      'info'
    );

    notificationEngine.addNotification(
      'تم حفظ فاتورة الشراء بنجاح',
      `فاتورة الشراء [${completedInv.invoiceNumber}] للمورد ${completedInv.vendorName} بإجمالي ${completedInv.grandTotal.toFixed(2)} ج.م.`,
      'success',
      'المشتريات'
    );

    return { success: true, invoice: completedInv };
  }

  /**
   * Hold a purchase invoice
   */
  public holdPurchaseInvoice(invoice: PurchaseInvoiceData): PurchaseInvoiceData {
    const invoiceBranchId = invoice.branchId || branchService.getCurrentBranch()?.id;
    const allWarehouses = warehouseService.getAllWarehouses();
    const targetWh = allWarehouses.find(w => w.id === invoice.warehouseId || w.code === invoice.warehouseId);
    if (targetWh && targetWh.branchId && invoiceBranchId && targetWh.branchId !== invoiceBranchId) {
      throw new Error(`لا يمكن تعليق فاتورة الشراء على مخزن تابع لفرع آخر.`);
    }

    const heldInv: PurchaseInvoiceData = {
      ...invoice,
      branchId: invoiceBranchId,
      status: 'held',
      wasHeld: true,
      createdAt: invoice.createdAt || new Date().toISOString()
    };

    const existingIdx = this.heldInvoices.findIndex(h => h.id === heldInv.id);
    if (existingIdx >= 0) {
      this.heldInvoices[existingIdx] = heldInv;
    } else {
      this.ensureUniqueInvoiceNumber(heldInv);
      this.heldInvoices = [heldInv, ...this.heldInvoices];
    }

    this.saveToStorage();

    auditEngine.logAction(
      'تعليق فاتورة مشتريات',
      'إدارة المشتريات',
      `تم تعليق مسودة فاتورة الشراء رقم [${heldInv.invoiceNumber}] للمورد ${heldInv.vendorName}.`,
      'info'
    );

    return heldInv;
  }

  /**
   * Resume held purchase invoice
   */
  public resumeHeldInvoice(invoiceId: string): PurchaseInvoiceData | undefined {
    const inv = this.heldInvoices.find(h => h.id === invoiceId);
    if (inv) {
      this.heldInvoices = this.heldInvoices.filter(h => h.id !== invoiceId);
      this.saveToStorage();
    }
    return inv;
  }

  /**
   * Delete single held invoice
   */
  public deleteHeldInvoice(invoiceId: string): void {
    const inv = this.heldInvoices.find(h => h.id === invoiceId);
    this.heldInvoices = this.heldInvoices.filter(h => h.id !== invoiceId);
    this.saveToStorage();

    if (inv) {
      auditEngine.logAction(
        'حذف فاتورة مشتريات معلقة',
        'إدارة المشتريات',
        `تم حذف فاتورة الشراء المعلقة رقم [${inv.invoiceNumber}].`,
        'warning'
      );
    }
  }

  /**
   * Delete all held invoices
   */
  public deleteAllHeldInvoices(): void {
    const count = this.heldInvoices.length;
    this.heldInvoices = [];
    this.saveToStorage();

    auditEngine.logAction(
      'حذف جميع الفواتير المعلقة',
      'إدارة المشتريات',
      `تم حذف جميع فواتير الشراء المعلقة (${count} فاتورة).`,
      'warning'
    );
  }

  /**
   * Cancel completed purchase invoice:
   * - Reverses inventory additions (subtracts items from warehouse)
   * - Reverses vendor balance
   * - Marks invoice as cancelled
   */
  public cancelPurchaseInvoice(invoiceId: string): { success: boolean; error?: string; invoice?: PurchaseInvoiceData } {
    const inv = this.completedInvoices.find(c => c.id === invoiceId);
    if (!inv) {
      return { success: false, error: 'فاتورة الشراء غير موجودة بالسجل.' };
    }

    if (inv.status === 'cancelled') {
      return { success: false, error: 'هذه الفاتورة ملغاة بالفعل مسبقاً.' };
    }

    // 1. Reverse stock additions
    const products = salesEntryService.getState().products;
    const warehouseId = inv.warehouseId || 'WH-01';

    inv.lineItems.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p && p.warehouseStocks) {
        const totalPurchasedQty = (item.quantity || 0) + (item.bonusQuantity || 0);
        p.warehouseStocks[warehouseId] = Math.max(0, (p.warehouseStocks[warehouseId] || 0) - totalPurchasedQty);
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    salesEntryService.saveState();

    // 2. Reverse vendor balance if deferred
    const creditAmount = inv.creditPaid !== undefined 
      ? inv.creditPaid 
      : (inv.paymentMethod === 'آجل' || inv.paymentMethod === 'deferred' ? inv.grandTotal : 0);

    if (inv.vendorId && creditAmount > 0 && inv.vendorId !== 'VEND-CASH' && inv.vendorId !== 'VEND-CASH-001') {
      const vendor = vendorService.getVendorById(inv.vendorId);
      if (vendor) {
        const newBalance = Math.max(0, (vendor.balanceDue || 0) - creditAmount);
        vendorService.updateVendor(vendor.id, { balanceDue: newBalance });
      }
    }

    // 3. Mark as cancelled
    inv.status = 'cancelled';
    this.saveToStorage();

    auditEngine.logAction(
      'إلغاء فاتورة مشتريات',
      'إدارة المشتريات',
      `تم إلغاء فاتورة الشراء رقم [${inv.invoiceNumber}] وعكس التأثير المخزني والمالي.`,
      'warning'
    );

    notificationEngine.addNotification(
      'تم إلغاء فاتورة الشراء',
      `تم إلغاء فاتورة الشراء [${inv.invoiceNumber}] وعكس الكميات بالمخزن.`,
      'warning',
      'المشتريات'
    );

    return { success: true, invoice: inv };
  }
}

export const purchaseService = new PurchaseService();
