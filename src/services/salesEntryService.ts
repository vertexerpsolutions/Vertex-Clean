export type SalesEntryMode = 'standard' | 'pos' | 'button';
import { permissionIntegrationService } from './permissionIntegrationService';
import { auditEngine } from './auditEngine';
import { UserRole } from '../core/vpe/security/SecurityTypes';
import { categoryService } from './categoryService';
import { warehouseService } from './warehouseService';
import { setupWizardService } from './setupWizardService';
import { branchService } from './branchService';

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  barcode: string;
  serialNumber?: string;
  serialNumbers?: string[];
  category: string;
  subCategory: string;
  unitPrice: number;
  costPrice: number; // Approved standard inventory cost
  averageCost?: number; // Weighted average cost in inventory
  lastPurchasePrice?: number; // Last purchase price from supplier
  taxRate: number; // e.g. 0.08 for 8%
  stockQty: number;
  warehouse: string;
  warehouseStocks?: Record<string, number>;
  batchNumber: string;
  isFavorite: boolean;
  imageIcon?: string;
  basicUnit?: string;
  subUnit?: string;
  conversionFactor?: number;
  unit?: string;
  type?: 'stockable' | 'service';
}

export interface CreditValidationResult {
  allowed: boolean;
  reason?: 'disallowed' | 'credit_limit_exceeded' | 'customer_not_found';
  message?: string;
  allowCreditSales?: boolean;
  creditLimit?: number;
  currentOutstanding?: number;
  availableCredit?: number;
  isLimitExceeded?: boolean;
  invoiceAmount?: number;
  projectedOutstanding?: number;
}

import { customerService, Customer, SYSTEM_CASH_CUSTOMER } from './customerService';
export type { Customer };

export function parseDiscountString(input: string | number | undefined | null): { value: number; type: 'fixed' | 'percent' } {
  if (input === undefined || input === null) {
    return { value: 0, type: 'fixed' };
  }
  if (typeof input === 'number') {
    return { value: Math.max(0, isNaN(input) ? 0 : input), type: 'fixed' };
  }
  const str = input.toString().trim();
  if (str === '') {
    return { value: 0, type: 'fixed' };
  }
  if (str.includes('%')) {
    const cleaned = str.replace(/[%$]/g, '').trim();
    const val = parseFloat(cleaned);
    return {
      value: isNaN(val) ? 0 : Math.max(0, val),
      type: 'percent',
    };
  } else {
    const cleaned = str.replace(/[$]/g, '').trim();
    const val = parseFloat(cleaned);
    return {
      value: isNaN(val) ? 0 : Math.max(0, val),
      type: 'fixed',
    };
  }
}

export interface InvoiceLineItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode: string;
  serialNumber?: string;
  quantity: number;
  subQuantity?: number;
  bonusQuantity?: number;
  unitPrice: number;
  discountType?: 'fixed' | 'percent';
  discountValue?: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
  warehouse: string;
  batchNumber: string;
  basicUnit?: string;
  subUnit?: string;
  conversionFactor?: number;
  unit?: string;
}

export interface InvoiceProfitabilityItemBreakdown {
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  bonusQuantity: number;
  totalQuantity: number;
  unitPrice: number; // سعر البيع
  netSales: number; // صافي البيع
  averageCost: number; // متوسط التكلفة
  lastPurchasePrice: number; // آخر سعر شراء
  approvedCost: number; // تكلفة المخزون المعتمدة
  totalCost: number; // التكلفة الإجمالية المعتمدة
  profit: number; // الربح
}

export interface InvoiceProfitabilityResult {
  allowed: boolean;
  error?: string;
  netSales: number;
  itemsCost: number;
  profit: number;
  profitMargin: number;
  profitByAverageCost: number;
  profitByLastPurchasePrice: number;
  totalAverageCost: number;
  totalLastPurchaseCost: number;
  itemsBreakdown: InvoiceProfitabilityItemBreakdown[];
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  mode: SalesEntryMode;
  customerId: string;
  customerName: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  treasuryId?: string;
  treasuryName?: string;
  bankId?: string;
  bankName?: string;
  sellerId?: string;
  sellerName?: string;
  createdAt: string;
  status: 'active' | 'held' | 'completed' | 'cancelled' | 'unpaid';
  lineItems: InvoiceLineItem[];
  subtotal: number; // Subtotal Before Discount
  invoiceDiscountType?: 'fixed' | 'percent';
  invoiceDiscountValue?: number;
  invoiceDiscountAmount?: number;
  totalDiscount: number; // Normal Discount (Item discounts + Invoice discount)
  netBeforeTax: number; // Net Amount After Invoice Discount
  taxDiscountRate?: number; // 0, 1, or 3 (%)
  taxDiscount: number; // Tax Discount Amount
  isTaxInvoice: boolean; // Tax Invoice (14% VAT) vs Non-Tax Invoice (0%)
  vatRate: number; // 0.14 or 0
  totalTax: number; // VAT Amount
  grandTotal: number; // Final Total
  cashPaid: number;
  cardPaid: number;
  deferredPaid?: number;
  changeDue: number;
  paymentMethod?: 'cash' | 'card' | 'mixed' | 'deferred';
  scanCount: number;
  timeToCompleteSeconds?: number;
  wasHeld?: boolean;
  cancelledBy?: string;
  cancelledByRole?: string;
  cancelledAt?: string;
}

export interface ModePerformanceMetrics {
  totalInvoicesCompleted: number;
  totalRevenue: number;
  standardModeCount: number;
  posModeCount: number;
  buttonModeCount: number;
  averageScansPerMin: number;
  averageInvoiceTimeSeconds: number;
  topCategories: { category: string; salesCount: number }[];
}

export interface SalesEntryState {
  currentMode: SalesEntryMode;
  activeInvoice: SalesInvoice;
  openInvoices: SalesInvoice[]; // Held or multiple open tabs
  completedInvoices: SalesInvoice[]; // Saved / Paid invoices history
  customers: Customer[];
  products: ProductItem[];
  recentlySoldProducts: ProductItem[];
  metrics: ModePerformanceMetrics;
  isVgf06Completed: boolean;
  highestSequenceGenerated?: number;
}

const STORAGE_KEY = 'VERTEX_VGF06_SALES_ENTRY';

export const INITIAL_PRODUCTS: ProductItem[] = [];

export const INITIAL_CUSTOMERS: Customer[] = customerService.getAllCustomers();

export const createBlankInvoice = (
  mode: SalesEntryMode = 'standard',
  customer: Customer = INITIAL_CUSTOMERS[0],
  customInvoiceNumber?: string,
  warehouseId: string = 'WH-01',
  warehouseName: string = 'Main Distribution Hub NY',
  treasuryId: string = 'TR-01',
  treasuryName: string = 'الخزينة الرئيسية - الصندوق العام (HQ Vault)',
  branchId?: string,
  branchName?: string
): SalesInvoice => {
  const freshCustomer = customerService.getCustomerById(customer.id) || customer;
  let custDiscountPercent = 0;
  if (freshCustomer && freshCustomer.discountRate !== undefined && freshCustomer.discountRate !== null && freshCustomer.discountRate > 0) {
    custDiscountPercent = freshCustomer.discountRate <= 1 ? Math.round(freshCustomer.discountRate * 10000) / 100 : freshCustomer.discountRate;
  }

  let effectiveBranch: any = null;
  try {
    if (typeof branchService !== 'undefined' && branchService) {
      effectiveBranch = branchId ? branchService.getBranchById(branchId) : branchService.getCurrentBranch();
    }
  } catch {
    // fallback if circular module import in progress
  }

  return {
    id: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.floor(Math.random() * 1000000)}`,
    invoiceNumber: customInvoiceNumber || `INV-2026-1001`,
    mode,
    customerId: freshCustomer.id,
    customerName: freshCustomer.name,
    branchId: branchId || effectiveBranch?.id || 'BR-01',
    branchName: branchName || effectiveBranch?.name || 'الفرع الرئيسي',
    warehouseId,
    warehouseName,
    treasuryId,
    treasuryName,
    createdAt: new Date().toISOString(),
    status: 'active',
    lineItems: [],
    subtotal: 0,
    invoiceDiscountType: 'percent',
    invoiceDiscountValue: custDiscountPercent,
    invoiceDiscountAmount: 0,
    totalDiscount: 0,
    netBeforeTax: 0,
    taxDiscountRate: 0,
    taxDiscount: 0,
    isTaxInvoice: false,
    vatRate: 0,
    totalTax: 0,
    grandTotal: 0,
    cashPaid: 0,
    cardPaid: 0,
    changeDue: 0,
    scanCount: 0,
    wasHeld: false
  };
};

class SalesEntryService {
  private state: SalesEntryState;
  private listeners: Array<() => void> = [];

  constructor() {
    this.state = this.loadInitialState();
    this.syncProductsFromMaster();
    customerService.subscribe(() => {
      if (this.state) {
        this.state.customers = customerService.getAllCustomers();
        this.saveState();
        this.notify();
      }
    });
    categoryService.subscribe(() => {
      if (this.state) {
        this.syncProductsFromMaster();
        this.saveState();
        this.notify();
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (e) {
        console.warn('Listener error in SalesEntryService:', e);
      }
    });
  }

  private getNextSequenceNumber(): number {
    let maxSeq = 1000;

    const savedInvoices: SalesInvoice[] = [
      ...(this.state?.completedInvoices || []),
      ...(this.state?.openInvoices || [])
    ];

    for (const inv of savedInvoices) {
      if (inv && inv.invoiceNumber) {
        const match = inv.invoiceNumber.match(/\d+$/);
        if (match) {
          const seq = parseInt(match[0], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }

    // Also compare against highestSequenceGenerated if stored
    if (this.state?.highestSequenceGenerated && this.state.highestSequenceGenerated > maxSeq) {
      maxSeq = this.state.highestSequenceGenerated;
    }

    return maxSeq + 1;
  }

  public generateNextInvoiceNumber(): string {
    const seq = this.getNextSequenceNumber();
    return `INV-2026-${String(seq).padStart(4, '0')}`;
  }

  public createNextBlankInvoice(mode: SalesEntryMode = 'standard', customer: Customer = INITIAL_CUSTOMERS[0], branchId?: string): SalesInvoice {
    // Generates a preview invoice number based on current committed max sequence without incrementing or locking the sequence
    const invoiceNum = this.generateNextInvoiceNumber();
    const curBranch = branchId ? branchService.getBranchById(branchId) : branchService.getCurrentBranch();
    const effectiveBranchId = curBranch?.id || 'BR-01';
    const branchWhs = warehouseService.getActiveWarehouses().filter(w => w.branchId === effectiveBranchId);
    const defWh = branchWhs[0] || warehouseService.getActiveWarehouses()[0] || { id: 'WH-01', name: 'المخزن الرئيسي' };
    const defTr = { id: 'TR-01', name: 'الخزينة الرئيسية - الصندوق العام (HQ Vault)' };
    return createBlankInvoice(mode, customer, invoiceNum, defWh.id, defWh.name, defTr.id, defTr.name, effectiveBranchId, curBranch?.name);
  }

  public ensureUniqueInvoiceNumber(inv: SalesInvoice): void {
    const existingNumbers = new Set([
      ...(this.state.completedInvoices || []).filter(c => c.id !== inv.id).map(c => c.invoiceNumber),
      ...(this.state.openInvoices || []).filter(o => o.id !== inv.id).map(o => o.invoiceNumber)
    ]);

    if (existingNumbers.has(inv.invoiceNumber)) {
      let seq = this.getNextSequenceNumber();
      let candidate = `INV-2026-${String(seq).padStart(4, '0')}`;
      while (existingNumbers.has(candidate)) {
        seq++;
        candidate = `INV-2026-${String(seq).padStart(4, '0')}`;
      }
      inv.invoiceNumber = candidate;
    }
  }

  public normalizeWarehouseId(warehouse?: { id?: string; code?: string; name?: string } | string | null): string {
    if (!warehouse) return 'WH-01';

    let raw = '';
    if (typeof warehouse === 'string') {
      raw = warehouse;
    } else {
      raw = `${warehouse.id || ''} ${warehouse.code || ''} ${warehouse.name || ''}`;
    }
    const clean = raw.toLowerCase().replace(/[-_\s]/g, '');
    if (!clean) return 'WH-01';

    if (clean.includes('wh01') || clean.includes('main') || clean.includes('ny') || clean.includes('رئيسي')) {
      return 'WH-01';
    }
    if (clean.includes('wh02') || clean.includes('lon') || clean.includes('eu') || clean.includes('ldn') || clean.includes('لندن')) {
      return 'WH-02';
    }
    if (clean.includes('wh03') || clean.includes('dxb') || clean.includes('me') || clean.includes('vault') || clean.includes('dubai') || clean.includes('دبي')) {
      return 'WH-03';
    }
    return clean;
  }

  private loadInitialState(): SalesEntryState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const completedInvoices: SalesInvoice[] = parsed.completedInvoices || [];
        const openInvoices: SalesInvoice[] = parsed.openInvoices || [];

        const seenInvoiceIds = new Set<string>();
        const sanitizeInvoice = (inv: SalesInvoice): SalesInvoice => {
          if (!inv.id || seenInvoiceIds.has(inv.id)) {
            inv.id = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.floor(Math.random() * 1000000)}`;
          }
          seenInvoiceIds.add(inv.id);

          const seenLineIds = new Set<string>();
          if (inv.lineItems && Array.isArray(inv.lineItems)) {
            inv.lineItems = inv.lineItems.map((item, idx) => {
              if (!item.id || seenLineIds.has(item.id)) {
                item.id = `LINE-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`;
              }
              seenLineIds.add(item.id);
              if (item.bonusQuantity === undefined || item.bonusQuantity === null || isNaN(item.bonusQuantity)) {
                item.bonusQuantity = 0;
              }
              return item;
            });
          }
          return inv;
        };

        const openInvoicesSanitized = openInvoices.map(sanitizeInvoice);
        const completedInvoicesSanitized = completedInvoices.map(sanitizeInvoice);

        let maxSeq = 1000;
        const checkSeq = (inv?: SalesInvoice) => {
          if (inv?.invoiceNumber) {
            const m = inv.invoiceNumber.match(/\d+$/);
            if (m) {
              const num = parseInt(m[0], 10);
              if (!isNaN(num) && num > maxSeq) maxSeq = num;
            }
          }
        };
        completedInvoicesSanitized.forEach(checkSeq);
        openInvoicesSanitized.forEach(checkSeq);
        if (parsed.activeInvoice) checkSeq(parsed.activeInvoice);

        const loadedProducts: ProductItem[] = (parsed.products || INITIAL_PRODUCTS).map((p: ProductItem) => {
          if (!p.warehouseStocks) {
            const initialMatch = INITIAL_PRODUCTS.find(ip => ip.id === p.id || ip.code === p.code);
            if (initialMatch?.warehouseStocks) {
              return { ...p, warehouseStocks: { ...initialMatch.warehouseStocks } };
            }
            const normWId = this.normalizeWarehouseId(p.warehouse);
            const wStocks: Record<string, number> = {
              'WH-01': normWId === 'WH-01' ? (p.stockQty || 0) : 0,
              'WH-02': normWId === 'WH-02' ? (p.stockQty || 0) : 0,
              'WH-03': normWId === 'WH-03' ? (p.stockQty || 0) : 0,
            };
            return { ...p, warehouseStocks: wStocks };
          }
          return p;
        });

        this.state = {
          ...parsed,
          products: loadedProducts,
          customers: parsed.customers || INITIAL_CUSTOMERS,
          openInvoices: openInvoicesSanitized,
          completedInvoices: completedInvoicesSanitized,
          recentlySoldProducts: parsed.recentlySoldProducts || [],
          highestSequenceGenerated: Math.max(parsed.highestSequenceGenerated || 1000, maxSeq),
          metrics: parsed.metrics || {
            totalInvoicesCompleted: 0,
            totalRevenue: 0,
            standardModeCount: 0,
            posModeCount: 0,
            buttonModeCount: 0,
            averageScansPerMin: 0,
            averageInvoiceTimeSeconds: 0,
            topCategories: []
          },
          isVgf06Completed: true
        };

        if (parsed.activeInvoice) {
          this.state.activeInvoice = sanitizeInvoice(parsed.activeInvoice);
          const otherInvoiceNumbers = new Set([
            ...completedInvoicesSanitized.map(c => c.invoiceNumber),
            ...openInvoicesSanitized.map(o => o.invoiceNumber)
          ]);
          if (otherInvoiceNumbers.has(this.state.activeInvoice.invoiceNumber)) {
            this.ensureUniqueInvoiceNumber(this.state.activeInvoice);
          }
        } else {
          this.state.activeInvoice = this.createNextBlankInvoice(parsed.currentMode || 'standard');
        }

        return this.state;
      }
    } catch (e) {
      console.warn('Failed to parse Sales Entry state:', e);
    }

    const defaultState: SalesEntryState = {
      currentMode: 'standard',
      activeInvoice: createBlankInvoice('standard', INITIAL_CUSTOMERS[0], 'INV-2026-1001', 'WH-01', 'مخزن الفرع الرئيسي', 'TR-01', 'خزينة الفرع الرئيسي'),
      openInvoices: [],
      completedInvoices: [],
      products: [],
      customers: INITIAL_CUSTOMERS,
      recentlySoldProducts: [],
      metrics: {
        totalInvoicesCompleted: 0,
        totalRevenue: 0,
        standardModeCount: 0,
        posModeCount: 0,
        buttonModeCount: 0,
        averageScansPerMin: 0,
        averageInvoiceTimeSeconds: 0,
        topCategories: []
      },
      isVgf06Completed: true
    };

    this.state = defaultState;
    return defaultState;
  }

  public syncProductsFromMaster(): ProductItem[] {
    try {
      const masterProducts = categoryService.getProducts();
      if (masterProducts && masterProducts.length > 0) {
        const existingById = new Map((this.state?.products || []).map(p => [p.id, p]));
        const existingByCode = new Map((this.state?.products || []).map(p => [p.code, p]));
        
        const syncedMaster: ProductItem[] = masterProducts.map(mp => {
          const existing = existingById.get(mp.id) || existingByCode.get(mp.code);
          return {
            id: mp.id,
            code: mp.code,
            name: mp.name,
            barcode: mp.barcode || '',
            serialNumber: mp.serialNumber || existing?.serialNumber,
            serialNumbers: mp.serialNumbers || existing?.serialNumbers,
            category: mp.category || '',
            subCategory: mp.subCategory || '',
            unitPrice: mp.sellingPrice !== undefined && mp.sellingPrice >= 0 ? mp.sellingPrice : (existing?.unitPrice || 100),
            costPrice: mp.costPrice !== undefined && mp.costPrice >= 0 ? mp.costPrice : (existing?.costPrice || 0),
            averageCost: existing?.averageCost || mp.costPrice || 0,
            lastPurchasePrice: existing?.lastPurchasePrice || mp.costPrice || 0,
            taxRate: existing?.taxRate || 0.14,
            stockQty: mp.stockQty !== undefined ? mp.stockQty : (existing?.stockQty ?? 50),
            warehouse: existing?.warehouse || 'WH-01',
            warehouseStocks: existing?.warehouseStocks || {
              'WH-01': mp.stockQty !== undefined ? mp.stockQty : 50,
              'WH-02': 0,
              'WH-03': 0
            },
            batchNumber: existing?.batchNumber || 'BATCH-2026-A',
            isFavorite: existing?.isFavorite || false,
            basicUnit: mp.basicUnit || mp.unit || 'عدد',
            subUnit: mp.subUnit,
            conversionFactor: mp.conversionFactor,
            unit: mp.unit || mp.basicUnit || 'عدد',
            type: mp.type || 'stockable'
          };
        });

        const masterIds = new Set(masterProducts.map(mp => mp.id));
        const masterCodes = new Set(masterProducts.map(mp => mp.code));
        const remainingInitial = (this.state?.products || []).filter(p => !masterIds.has(p.id) && !masterCodes.has(p.code));

        const finalProducts = [...syncedMaster, ...remainingInitial];
        if (this.state) {
          this.state.products = finalProducts;
        }
        return finalProducts;
      }
    } catch (e) {
      console.warn('Failed to sync master products into sales service:', e);
    }
    return this.state?.products || [];
  }

  public getState(): SalesEntryState {
    const allCustomers = customerService.getAllCustomers();
    if (allCustomers && allCustomers.length > 0) {
      this.state.customers = allCustomers;
    }

    this.syncProductsFromMaster();

    return {
      ...this.state,
      activeInvoice: {
        ...this.state.activeInvoice,
        lineItems: (this.state.activeInvoice.lineItems || []).map(item => ({ ...item })),
      },
      openInvoices: (this.state.openInvoices || []).map(inv => ({
        ...inv,
        lineItems: (inv.lineItems || []).map(item => ({ ...item })),
      })),
      completedInvoices: (this.state.completedInvoices || []).map(inv => ({
        ...inv,
        lineItems: (inv.lineItems || []).map(item => ({ ...item })),
      })),
      products: [...this.state.products],
      customers: [...this.state.customers],
      recentlySoldProducts: [...this.state.recentlySoldProducts],
      metrics: { ...this.state.metrics },
    };
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Sales Entry state:', e);
    }
  }

  public switchMode(mode: SalesEntryMode): void {
    this.state.currentMode = mode;
    this.state.activeInvoice.mode = mode;
    this.saveState();
  }

  public setCustomer(customer: Customer, customName?: string): { success: boolean; error?: string } {
    const freshCustomer = customerService.getCustomerById(customer.id) || customer;
    
    // Strict customer status validation (Active vs Disabled)
    if (!customerService.isCustomerActive(freshCustomer)) {
      return {
        success: false,
        error: 'هذا العميل معطّل ولا يمكن إنشاء فاتورة بيع له.'
      };
    }

    this.state.activeInvoice.customerId = freshCustomer.id;
    this.state.activeInvoice.customerName = customName || freshCustomer.name;

    let custDiscountPercent = 0;
    if (freshCustomer.discountRate !== undefined && freshCustomer.discountRate !== null && freshCustomer.discountRate > 0) {
      custDiscountPercent = freshCustomer.discountRate <= 1 ? Math.round(freshCustomer.discountRate * 10000) / 100 : freshCustomer.discountRate;
    }

    if (custDiscountPercent > 0) {
      this.setInvoiceDiscount(custDiscountPercent, 'percent');
    } else {
      this.setInvoiceDiscount(0, 'percent');
    }

    return { success: true };
  }

  public setCustomerName(customerName: string): void {
    this.state.activeInvoice.customerName = customerName || 'عميل نقدي';
    this.saveState();
  }

  public setWarehouse(warehouseId: string, warehouseName?: string): void {
    const wh = warehouseService.getWarehouseById(warehouseId);
    this.state.activeInvoice.warehouseId = warehouseId || undefined;
    this.state.activeInvoice.warehouseName = warehouseName || wh?.name || undefined;
    if (wh?.branchId) {
      this.state.activeInvoice.branchId = wh.branchId;
      this.state.activeInvoice.branchName = wh.branchName;
    }
    this.saveState();
  }

  public setBranch(branchId: string, branchName?: string): void {
    const br = branchService.getBranchById(branchId);
    this.state.activeInvoice.branchId = branchId;
    this.state.activeInvoice.branchName = branchName || br?.name;
    const branchWhs = warehouseService.getActiveWarehouses().filter(w => w.branchId === branchId);
    if (branchWhs.length > 0 && !branchWhs.some(w => w.id === this.state.activeInvoice.warehouseId)) {
      this.state.activeInvoice.warehouseId = branchWhs[0].id;
      this.state.activeInvoice.warehouseName = branchWhs[0].name;
    }
    this.saveState();
  }

  public setTreasury(treasuryId: string, treasuryName?: string): void {
    this.state.activeInvoice.treasuryId = treasuryId || undefined;
    this.state.activeInvoice.treasuryName = treasuryName || undefined;
    this.saveState();
  }

  public setBank(bankId: string, bankName?: string): void {
    this.state.activeInvoice.bankId = bankId || undefined;
    this.state.activeInvoice.bankName = bankName || undefined;
    this.saveState();
  }

  public setSeller(sellerId: string, sellerName?: string): void {
    this.state.activeInvoice.sellerId = sellerId || undefined;
    this.state.activeInvoice.sellerName = sellerName || undefined;
    this.saveState();
  }

  public setInvoiceDate(newDateIsoString: string): void {
    if (!newDateIsoString) return;
    this.state.activeInvoice.createdAt = newDateIsoString;
    this.saveState();
  }

  public getProductStockInWarehouse(
    product: ProductItem | string,
    warehouse?: { id?: string; code?: string; name?: string } | string
  ): number {
    const p = typeof product === 'string'
      ? this.state.products.find(item => item.id === product || item.code === product)
      : product;
    if (!p) return 0;

    const targetWId = this.normalizeWarehouseId(
      warehouse !== undefined ? warehouse : (this.state.activeInvoice.warehouseId || 'WH-01')
    );

    if (p.warehouseStocks && typeof p.warehouseStocks[targetWId] === 'number') {
      return Math.max(0, p.warehouseStocks[targetWId]);
    }

    const prodWId = this.normalizeWarehouseId(p.warehouse);
    if (prodWId === targetWId) {
      return Math.max(0, p.stockQty || 0);
    }

    return 0;
  }

  public validateWarehousePermission(
    warehouseIdOrCode?: string,
    actorRole: UserRole = 'SUPER_ADMIN',
    actorUsername: string = 'alex.mercer'
  ): { allowed: boolean; error?: string; reason?: string } {
    const currentWId = this.normalizeWarehouseId(warehouseIdOrCode || this.state.activeInvoice.warehouseId || 'WH-01');
    const permResult = permissionIntegrationService.canUserAccessWarehouse(actorRole, currentWId, actorUsername);
    if (!permResult.allowed) {
      permissionIntegrationService.logSecurityEvent(
        actorUsername,
        actorRole,
        'ACCESS_DENIED',
        `WAREHOUSE_${currentWId}`,
        'DENIED',
        `User ${actorUsername} (${actorRole}) attempted to access or issue sales invoice on unauthorized warehouse ${currentWId}: ${permResult.reason}`
      );
      return {
        allowed: false,
        error: `تم رفض العملية: ${permResult.reason}`,
        reason: permResult.reason
      };
    }
    return { allowed: true, reason: permResult.reason };
  }

  public validateTreasuryPermission(
    treasuryIdOrCode?: string,
    actorRole: UserRole = 'SUPER_ADMIN',
    actorUsername: string = 'alex.mercer'
  ): { allowed: boolean; error?: string; reason?: string } {
    const currentTId = treasuryIdOrCode || this.state.activeInvoice.treasuryId || 'TR-01';
    const permResult = permissionIntegrationService.canUserAccessTreasury(actorRole, currentTId, actorUsername);
    if (!permResult.allowed) {
      permissionIntegrationService.logSecurityEvent(
        actorUsername,
        actorRole,
        'ACCESS_DENIED',
        `TREASURY_${currentTId}`,
        'DENIED',
        `User ${actorUsername} (${actorRole}) attempted to collect or issue receipt on unauthorized treasury ${currentTId}: ${permResult.reason}`
      );
      return {
        allowed: false,
        error: `تم رفض العملية: ${permResult.reason}`,
        reason: permResult.reason
      };
    }
    return { allowed: true, reason: permResult.reason };
  }

  public validateInvoiceForSale(
    invoiceToValidate?: SalesInvoice,
    actorRole?: UserRole,
    actorUsername?: string
  ): { allowed: boolean; error?: string } {
    const inv = invoiceToValidate || this.state.activeInvoice;

    // 0. Validate Customer Status (Active vs Disabled)
    if (inv.customerId && inv.customerId !== 'CUST-CASH-001') {
      const cust = customerService.getCustomerById(inv.customerId) || this.state.customers.find(c => c.id === inv.customerId);
      if (cust && !cust.isSystemCashCustomer && !customerService.isCustomerActive(cust)) {
        return {
          allowed: false,
          error: 'هذا العميل معطّل ولا يمكن إنشاء فاتورة بيع له.'
        };
      }
    }

    // 0.1 Validate Warehouse Access Permission if actor role is provided
    const currentWarehouseId = this.normalizeWarehouseId(inv.warehouseId || 'WH-01');
    if (actorRole) {
      const whPerm = this.validateWarehousePermission(currentWarehouseId, actorRole, actorUsername);
      if (!whPerm.allowed) {
        return {
          allowed: false,
          error: whPerm.error || 'ليس لديك صلاحية لاستخدام هذا المخزن.'
        };
      }
    }

    // 0.2 Branch Status and Isolation Guard: Ensure warehouse belongs to the invoice's branch and an active branch
    const allWarehouses = warehouseService.getAllWarehouses();
    const rawWId = inv.warehouseId;
    const targetWh = allWarehouses.find(w => 
      (rawWId && (w.id === rawWId || w.code === rawWId || w.id.toLowerCase() === rawWId.toLowerCase())) ||
      w.id === currentWarehouseId || 
      w.code === currentWarehouseId || 
      w.id.toLowerCase() === currentWarehouseId.toLowerCase() ||
      w.code.toLowerCase() === currentWarehouseId.toLowerCase()
    );

    if (!targetWh) {
      return {
        allowed: false,
        error: `المخزن المحدد [${rawWId || currentWarehouseId}] غير موجود في النظام.`
      };
    }

    const invoiceBranchId = inv.branchId || branchService.getCurrentBranch()?.id;
    if (targetWh.branchId && invoiceBranchId && targetWh.branchId !== invoiceBranchId) {
      const whBranch = branchService.getBranchById(targetWh.branchId);
      const invBranch = branchService.getBranchById(invoiceBranchId);
      return {
        allowed: false,
        error: `لا يمكن حفظ فاتورة مبيعات على مخزن تابع لفرع آخر [${whBranch?.name || targetWh.branchId}]. الفاتورة مخصصة لفرع [${invBranch?.name || invoiceBranchId}].`
      };
    }

    if (targetWh.branchId) {
      const branch = branchService.getBranchById(targetWh.branchId);
      if (branch && branch.status === 'غير نشط') {
        return {
          allowed: false,
          error: `لا يمكن حفظ فاتورة مبيعات على مخزن تابع لفرع موقوف/غير نشط [${branch.name}].`
        };
      }
    }

    // 1. Validate Invoice structure & presence of items
    if (!inv || !inv.lineItems || inv.lineItems.length === 0) {
      return {
        allowed: false,
        error: 'يرجى إضافة أصناف إلى الفاتورة أولاً قبل الحفظ والدفع.'
      };
    }

    // 2. Validate Product Stock & Availability in the current warehouse
    let totalStockOut = 0;
    const productDemands = new Map<string, { product: ProductItem; totalQty: number; salesQty: number; bonusQty: number; productName: string }>();

    for (const line of inv.lineItems) {
      const lineQty = Math.max(0, line.quantity || 0);
      const lineBonus = Math.max(0, line.bonusQuantity || 0);
      const lineTotalOut = lineQty + lineBonus;
      totalStockOut += lineTotalOut;

      const p = this.state.products.find(prod => prod.id === line.productId || prod.code === line.productCode);
      if (!p) {
        return {
          allowed: false,
          error: `لا يمكن صرف الصنف (${line.productName || line.productCode}) لأن بياناته غير متوفرة في النظام.`
        };
      }

      // Rule 4: If item has active selling quantity, price must be valid
      if (lineQty > 0 && line.unitPrice <= 0) {
        return {
          allowed: false,
          error: `لا يمكن إتمام البيع لأن سعر الصنف (${line.productName}) غير محدد أو يساوي صفر.`
        };
      }

      const prodKey = `${p.id || p.code}_${p.batchNumber || ''}`;
      const existing = productDemands.get(prodKey);
      if (existing) {
        existing.totalQty += lineTotalOut;
        existing.salesQty += lineQty;
        existing.bonusQty += lineBonus;
      } else {
        productDemands.set(prodKey, {
          product: p,
          totalQty: lineTotalOut,
          salesQty: lineQty,
          bonusQty: lineBonus,
          productName: line.productName || p.name
        });
      }
    }

    // Rule 5: Ensure at least one unit is moving out (sales qty or bonus qty)
    if (totalStockOut <= 0) {
      return {
        allowed: false,
        error: 'يرجى تحديد كمية بيع أو كمية بونص لأصناف الفاتورة قبل الإتمام.'
      };
    }

    // Rule 2 & 3: Validate available stock against total demand (sales + bonus) for each product
    for (const [, demand] of productDemands.entries()) {
      const availableStock = this.getProductStockInWarehouse(demand.product, currentWarehouseId);

      if (availableStock <= 0) {
        return {
          allowed: false,
          error: `لا يمكن صرف الصنف (${demand.productName}) لأن رصيده غير متوفر في المخزن الحالي.`
        };
      }

      if (demand.totalQty > availableStock) {
        return {
          allowed: false,
          error: `لا يمكن صرف الكمية المطلوبة مع البونص للصنف (${demand.productName}). إجمالي المطلوب: ${demand.totalQty} (بيع: ${demand.salesQty} + بونص: ${demand.bonusQty})، والرصيد المتاح في المخزن الحالي: ${availableStock}.`
        };
      }
    }

    return { allowed: true };
  }

  public addProductToActiveInvoice(product: ProductItem, qty: number = 1, specificSerialNumber?: string): { success: boolean; error?: string } {
    const currentWId = this.normalizeWarehouseId(this.state.activeInvoice.warehouseId || 'WH-01');
    const availableStock = this.getProductStockInWarehouse(product, currentWId);

    if (availableStock <= 0) {
      return {
        success: false,
        error: 'لا يمكن بيع هذا الصنف لأن رصيده غير متوفر في المخزن الحالي.'
      };
    }

    const serialToAssign = specificSerialNumber || product.serialNumber;

    // For items tracked by serial number, each line item represents the unique serial unit
    const existingIndex = serialToAssign
      ? this.state.activeInvoice.lineItems.findIndex(
          item => item.productId === product.id && item.serialNumber === serialToAssign
        )
      : this.state.activeInvoice.lineItems.findIndex(
          item => item.productId === product.id && item.batchNumber === product.batchNumber && !item.serialNumber
        );

    const currentQty = existingIndex >= 0 ? (this.state.activeInvoice.lineItems[existingIndex].quantity || 0) : 0;
    const currentBonus = existingIndex >= 0 ? (this.state.activeInvoice.lineItems[existingIndex].bonusQuantity || 0) : 0;
    const requestedTotalQty = currentQty + currentBonus + qty;

    if (requestedTotalQty > availableStock) {
      return {
        success: false,
        error: `لا يمكن إضافة الكمية المطلوبة مع البونص (${requestedTotalQty}). الرصيد المتاح في المخزن الحالي: ${availableStock}.`
      };
    }

    if (product.unitPrice <= 0) {
      return {
        success: false,
        error: 'لا يمكن بيع صنف بسعر صفر أو أقل.'
      };
    }

    if (existingIndex >= 0) {
      this.state.activeInvoice.lineItems[existingIndex].quantity += qty;
    } else {
      const defaultDiscountType = this.state.activeInvoice.invoiceDiscountValue && this.state.activeInvoice.invoiceDiscountValue > 0
        ? (this.state.activeInvoice.invoiceDiscountType || 'percent')
        : 'percent';
      const defaultDiscountValue = this.state.activeInvoice.invoiceDiscountValue && this.state.activeInvoice.invoiceDiscountValue > 0
        ? this.state.activeInvoice.invoiceDiscountValue
        : 0;

      const lineItem: InvoiceLineItem = {
        id: `LINE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${Math.floor(Math.random() * 1000000)}`,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        barcode: product.barcode,
        serialNumber: serialToAssign,
        quantity: qty,
        subQuantity: 0,
        bonusQuantity: 0,
        unitPrice: product.unitPrice,
        discountType: defaultDiscountType,
        discountValue: defaultDiscountValue,
        discountAmount: 0,
        taxAmount: product.unitPrice * product.taxRate * qty,
        lineTotal: product.unitPrice * qty,
        warehouse: this.state.activeInvoice.warehouseName || product.warehouse,
        batchNumber: product.batchNumber,
        basicUnit: product.basicUnit || product.unit || 'عدد',
        subUnit: product.subUnit,
        conversionFactor: product.conversionFactor,
        unit: product.unit || product.basicUnit || 'عدد'
      };
      this.state.activeInvoice.lineItems.push(lineItem);
    }

    this.state.activeInvoice.scanCount += 1;
    this.recalculateInvoice();

    // Add to recently sold
    if (!this.state.recentlySoldProducts.some(p => p.id === product.id)) {
      this.state.recentlySoldProducts = [product, ...this.state.recentlySoldProducts.slice(0, 5)];
    }

    this.saveState();
    return { success: true };
  }

  public scanBarcodeOrSerial(codeQuery: string): { success: boolean; product?: ProductItem; matchedSerial?: string; error?: string } {
    const clean = codeQuery.trim().toLowerCase();
    if (!clean) {
      return {
        success: false,
        error: 'يرجى إدخال السيريال أو الباركود'
      };
    }

    let matchedSerial: string | undefined = undefined;

    // 1. Check if input matches a registered Serial Number of a product (single or multiple serials)
    let product = this.state.products.find(p => {
      if (p.serialNumber && p.serialNumber.toLowerCase() === clean) {
        matchedSerial = p.serialNumber;
        return true;
      }
      if (Array.isArray(p.serialNumbers)) {
        const found = p.serialNumbers.find(s => s.toLowerCase() === clean);
        if (found) {
          matchedSerial = found;
          return true;
        }
      }
      return false;
    });

    // 2. If not found by serial number, check by barcode or SKU code
    if (!product) {
      product = this.state.products.find(
        p => p.barcode.toLowerCase() === clean || 
             p.code.toLowerCase() === clean
      );
      if (product && product.serialNumber) {
        matchedSerial = product.serialNumber;
      }
    }

    if (product) {
      // Check if this specific physical serial number has already been scanned in this invoice
      if (matchedSerial) {
        const alreadyInInvoice = this.state.activeInvoice.lineItems.some(
          item => item.serialNumber && item.serialNumber.toLowerCase() === clean
        );
        if (alreadyInInvoice) {
          return {
            success: false,
            error: `الرقم التسلسلي '${matchedSerial}' مضاف بالفعل في هذه الفاتورة!`,
            product,
            matchedSerial
          };
        }
      }

      const addResult = this.addProductToActiveInvoice(product, 1, matchedSerial);
      if (!addResult.success) {
        return {
          success: false,
          error: addResult.error,
          product,
          matchedSerial
        };
      }
      return { success: true, product, matchedSerial };
    }

    return {
      success: false,
      error: `الرقم التسلسلي أو الباركود '${codeQuery}' غير مسجل في النظام!`
    };
  }

  public updateLineQuantity(lineId: string, quantity: number): { success: boolean; error?: string } {
    const line = this.state.activeInvoice.lineItems.find(l => l.id === lineId);
    if (!line) {
      return { success: false, error: 'البند غير موجود في الفاتورة.' };
    }

    const safeQty = isNaN(quantity) ? 0 : Math.max(0, quantity);

    if (safeQty === 0) {
      line.quantity = 0;
      this.recalculateInvoice();
      this.saveState();
      return { success: true };
    }

    const currentWId = this.normalizeWarehouseId(this.state.activeInvoice.warehouseId || 'WH-01');
    const p = this.state.products.find(prod => prod.id === line.productId || prod.code === line.productCode);
    const availableStock = p ? this.getProductStockInWarehouse(p, currentWId) : 0;

    if (availableStock <= 0) {
      return {
        success: false,
        error: 'لا يمكن صرف هذا الصنف لأن رصيده غير متوفر في المخزن الحالي.'
      };
    }

    const totalNeeded = safeQty + (line.bonusQuantity || 0);

    if (totalNeeded > availableStock) {
      return {
        success: false,
        error: `لا يمكن صرف الكمية المطلوبة مع البونص (${totalNeeded}). الرصيد المتاح في المخزن الحالي: ${availableStock}.`
      };
    }

    line.quantity = safeQty;
    this.recalculateInvoice();
    this.saveState();
    return { success: true };
  }

  public updateLineBonusQuantity(lineId: string, bonusQty: number): { success: boolean; error?: string } {
    const line = this.state.activeInvoice.lineItems.find(l => l.id === lineId);
    if (!line) {
      return { success: false, error: 'البند غير موجود في الفاتورة.' };
    }

    const safeBonus = isNaN(bonusQty) ? 0 : Math.max(0, bonusQty);

    if (safeBonus === 0) {
      line.bonusQuantity = 0;
      this.recalculateInvoice();
      this.saveState();
      return { success: true };
    }

    const currentWId = this.normalizeWarehouseId(this.state.activeInvoice.warehouseId || 'WH-01');
    const p = this.state.products.find(prod => prod.id === line.productId || prod.code === line.productCode);
    const availableStock = p ? this.getProductStockInWarehouse(p, currentWId) : 0;

    const totalNeeded = (line.quantity || 0) + safeBonus;
    if (totalNeeded > availableStock) {
      return {
        success: false,
        error: `إجمالي الكمية المطلوبة مع البونص (${totalNeeded}) يتجاوز الرصيد المتاح في المخزن الحالي (${availableStock}).`
      };
    }

    line.bonusQuantity = safeBonus;
    this.recalculateInvoice();
    this.saveState();
    return { success: true };
  }

  public updateLineSubQuantity(lineId: string, subQuantity: number): { success: boolean; error?: string } {
    const line = this.state.activeInvoice.lineItems.find(l => l.id === lineId);
    if (!line) {
      return { success: false, error: 'البند غير موجود في الفاتورة.' };
    }

    const safeSubQty = isNaN(subQuantity) ? 0 : Math.max(0, subQuantity);
    line.subQuantity = safeSubQty;
    this.saveState();
    return { success: true };
  }

  public updateLineUnitPrice(lineId: string, unitPrice: number): void {
    const line = this.state.activeInvoice.lineItems.find(l => l.id === lineId);
    if (line) {
      line.unitPrice = Math.max(0, unitPrice);
      this.recalculateInvoice();
      this.saveState();
    }
  }

  public updateLineDiscount(lineId: string, value: number | string, type?: 'fixed' | 'percent'): void {
    const line = this.state.activeInvoice.lineItems.find(l => l.id === lineId);
    if (line) {
      if (typeof value === 'string') {
        const str = value.trim();
        if (str.includes('%')) {
          const val = parseFloat(str.replace(/[%$]/g, '').trim());
          line.discountValue = isNaN(val) ? 0 : Math.max(0, val);
          line.discountType = 'percent';
        } else if (str.includes('$')) {
          const val = parseFloat(str.replace(/[%$]/g, '').trim());
          line.discountValue = isNaN(val) ? 0 : Math.max(0, val);
          line.discountType = 'fixed';
        } else {
          const val = parseFloat(str);
          line.discountValue = isNaN(val) ? 0 : Math.max(0, val);
          if (type) {
            line.discountType = type;
          }
        }
      } else {
        line.discountValue = Math.max(0, value);
        if (type) {
          line.discountType = type;
        }
      }

      // When modifying an individual item's discount, reset general invoice discount
      // so line item discounts operate independently without invoice-level stacking
      this.state.activeInvoice.invoiceDiscountValue = 0;

      this.recalculateInvoice();
      this.saveState();
    }
  }

  public removeLineItem(lineId: string): void {
    this.state.activeInvoice.lineItems = this.state.activeInvoice.lineItems.filter(l => l.id !== lineId);
    this.recalculateInvoice();
    this.saveState();
  }

  public recalculateInvoice(): void {
    const inv = this.state.activeInvoice;
    if (inv.isTaxInvoice === undefined) inv.isTaxInvoice = false;
    if (inv.taxDiscountRate === undefined) inv.taxDiscountRate = 0;
    if (inv.invoiceDiscountType === undefined) inv.invoiceDiscountType = 'percent';
    if (inv.invoiceDiscountValue === undefined) inv.invoiceDiscountValue = 0;

    let subtotalBeforeDiscount = 0;
    let totalLineDiscounts = 0;

    inv.lineItems.forEach(line => {
      if (line.bonusQuantity === undefined || isNaN(line.bonusQuantity)) {
        line.bonusQuantity = 0;
      }
      const safeQty = typeof line.quantity === 'number' && !isNaN(line.quantity) ? Math.max(0, line.quantity) : 0;
      const safePrice = typeof line.unitPrice === 'number' && !isNaN(line.unitPrice) ? Math.max(0, line.unitPrice) : 0;
      const rawTotal = safeQty * safePrice;
      const discVal = line.discountValue !== undefined && !isNaN(Number(line.discountValue)) ? Number(line.discountValue) : (line.discountAmount || 0);
      const discType = line.discountType || 'percent';

      let lineDisc = 0;
      if (discType === 'percent') {
        lineDisc = (rawTotal * Math.max(0, discVal)) / 100;
      } else {
        lineDisc = Math.max(0, discVal);
      }
      lineDisc = Math.min(rawTotal, lineDisc);

      line.discountAmount = lineDisc;
      subtotalBeforeDiscount += rawTotal;
      totalLineDiscounts += lineDisc;
    });

    // Single source of truth: No combination/stacking of invoice discount with line items
    const totalNormalDiscount = totalLineDiscounts;

    // Net Amount After Discount
    const netBeforeTax = Math.max(0, subtotalBeforeDiscount - totalNormalDiscount);

    // VAT 14% (only if VAT checkbox is enabled)
    const vatRate = inv.isTaxInvoice ? 0.14 : 0.00;
    const vatAmount = inv.isTaxInvoice ? netBeforeTax * vatRate : 0.00;

    // Tax Discount (1% or 3% applied on netBeforeTax, only if selected)
    const taxDiscountRate = inv.taxDiscountRate || 0;
    const taxDiscount = taxDiscountRate > 0 ? (netBeforeTax * taxDiscountRate) / 100 : 0;

    // Final Total = Net Amount + VAT - Tax Discount
    const grandTotal = Math.max(0, netBeforeTax + vatAmount - taxDiscount);

    inv.subtotal = subtotalBeforeDiscount;
    inv.invoiceDiscountAmount = totalNormalDiscount;
    inv.totalDiscount = totalNormalDiscount;
    inv.netBeforeTax = netBeforeTax;
    inv.taxDiscountRate = taxDiscountRate;
    inv.taxDiscount = taxDiscount;
    inv.vatRate = vatRate;
    inv.totalTax = vatAmount;
    inv.grandTotal = grandTotal;

    // Update individual line totals & tax for display
    inv.lineItems.forEach(line => {
      const safeQty = typeof line.quantity === 'number' && !isNaN(line.quantity) ? Math.max(0, line.quantity) : 0;
      const safePrice = typeof line.unitPrice === 'number' && !isNaN(line.unitPrice) ? Math.max(0, line.unitPrice) : 0;
      const netLine = Math.max(0, (safeQty * safePrice) - (line.discountAmount || 0));
      line.taxAmount = inv.isTaxInvoice ? netLine * 0.14 : 0;
      line.lineTotal = netLine + line.taxAmount;
    });
  }

  public setInvoiceDiscount(value: number | string, type?: 'fixed' | 'percent'): void {
    const inv = this.state.activeInvoice;
    let numericVal = 0;
    let chosenType: 'fixed' | 'percent' = type || inv.invoiceDiscountType || 'percent';

    if (typeof value === 'string') {
      const str = value.trim();
      if (str.includes('%')) {
        const val = parseFloat(str.replace(/[%$]/g, '').trim());
        numericVal = isNaN(val) ? 0 : Math.max(0, val);
        chosenType = 'percent';
      } else if (str.includes('$')) {
        const val = parseFloat(str.replace(/[%$]/g, '').trim());
        numericVal = isNaN(val) ? 0 : Math.max(0, val);
        chosenType = 'fixed';
      } else {
        const val = parseFloat(str);
        numericVal = isNaN(val) ? 0 : Math.max(0, val);
      }
    } else {
      numericVal = isNaN(value) ? 0 : Math.max(0, value);
    }

    inv.invoiceDiscountValue = numericVal;
    inv.invoiceDiscountType = chosenType;

    // When invoice discount is set (> 0), it becomes the authoritative discount
    // and replaces any line item discounts with this uniform discount.
    // When cancelled (= 0), all line item discounts are cleared to 0 without restoring previous ones.
    if (numericVal > 0) {
      if (chosenType === 'percent') {
        inv.lineItems.forEach(line => {
          line.discountType = 'percent';
          line.discountValue = numericVal;
        });
      } else {
        const totalGross = inv.lineItems.reduce((acc, l) => acc + (l.quantity * l.unitPrice), 0);
        inv.lineItems.forEach(line => {
          const lineGross = line.quantity * line.unitPrice;
          line.discountType = 'fixed';
          line.discountValue = totalGross > 0 ? Math.round(((lineGross / totalGross) * numericVal) * 100) / 100 : 0;
        });
      }
    } else {
      inv.lineItems.forEach(line => {
        line.discountType = chosenType;
        line.discountValue = 0;
        line.discountAmount = 0;
      });
    }

    this.recalculateInvoice();
    this.saveState();
  }

  public setTaxInvoice(isTax: boolean): void {
    this.state.activeInvoice.isTaxInvoice = isTax;
    this.recalculateInvoice();
    this.saveState();
  }

  public setTaxDiscountRate(rate: number): void {
    this.state.activeInvoice.taxDiscountRate = Math.max(0, rate);
    this.recalculateInvoice();
    this.saveState();
  }

  public holdActiveInvoice(): SalesInvoice {
    const held: SalesInvoice = {
      ...this.state.activeInvoice,
      status: 'held',
      wasHeld: true
    };

    this.ensureUniqueInvoiceNumber(held);

    const existingIdx = this.state.openInvoices.findIndex(inv => inv.id === held.id);
    if (existingIdx >= 0) {
      this.state.openInvoices[existingIdx] = held;
    } else {
      this.state.openInvoices.push(held);
    }

    const currentCustomer = this.state.customers.find(c => c.id === this.state.activeInvoice.customerId) || this.state.customers[0];
    this.state.activeInvoice = this.createNextBlankInvoice(this.state.currentMode, currentCustomer);
    this.saveState();
    return held;
  }

  public createNewInvoice(): SalesInvoice {
    const cashCustomer = customerService.getSystemCashCustomer();
    this.state.activeInvoice = this.createNextBlankInvoice(this.state.currentMode, cashCustomer);
    this.saveState();
    return this.state.activeInvoice;
  }

  public resumeHeldInvoice(invoiceId: string): void {
    const idx = this.state.openInvoices.findIndex(inv => inv.id === invoiceId);
    if (idx < 0) return;

    const heldToResume = this.state.openInvoices[idx];

    // If current active invoice has unsaved changes/items or was previously held, save it back to openInvoices before switching
    const currentActive = this.state.activeInvoice;
    if (currentActive.id !== invoiceId) {
      if (currentActive.lineItems.length > 0 || currentActive.wasHeld) {
        const currentHeld: SalesInvoice = {
          ...currentActive,
          status: 'held',
          wasHeld: true
        };
        this.ensureUniqueInvoiceNumber(currentHeld);
        const activeIdx = this.state.openInvoices.findIndex(inv => inv.id === currentActive.id);
        if (activeIdx >= 0) {
          this.state.openInvoices[activeIdx] = currentHeld;
        } else {
          this.state.openInvoices.push(currentHeld);
        }
      }
    }

    // Safely remove the target held invoice from openInvoices now that it is becoming the active invoice
    this.state.openInvoices = this.state.openInvoices.filter(inv => inv.id !== invoiceId);

    // Set active invoice to target held invoice, preserving all original metadata and serial number
    this.state.activeInvoice = {
      ...heldToResume,
      status: 'active',
      wasHeld: true
    };
    this.state.currentMode = heldToResume.mode;
    this.saveState();
  }

  public deleteHeldInvoice(invoiceId: string): void {
    this.state.openInvoices = this.state.openInvoices.filter(inv => inv.id !== invoiceId);
    this.saveState();
  }

  public deleteAllHeldInvoices(): void {
    this.state.openInvoices = [];
    this.saveState();
  }

  public loadCompletedInvoiceForEdit(invoiceId: string): void {
    const inv = this.state.completedInvoices.find(c => c.id === invoiceId);
    if (!inv) return;

    // If current active invoice has unsaved items or was held, hold it in openInvoices
    if (this.state.activeInvoice && (this.state.activeInvoice.lineItems.length > 0 || this.state.activeInvoice.wasHeld)) {
      if (
        this.state.activeInvoice.id !== invoiceId &&
        !this.state.completedInvoices.some(c => c.id === this.state.activeInvoice.id)
      ) {
        const currentHeld: SalesInvoice = {
          ...this.state.activeInvoice,
          status: 'held',
          wasHeld: true
        };
        this.ensureUniqueInvoiceNumber(currentHeld);
        const activeIdx = this.state.openInvoices.findIndex(o => o.id === currentHeld.id);
        if (activeIdx >= 0) {
          this.state.openInvoices[activeIdx] = currentHeld;
        } else {
          this.state.openInvoices.push(currentHeld);
        }
      }
    }

    // Set active invoice to deep copy of target saved invoice, preserving original ID and invoice number
    this.state.activeInvoice = {
      ...inv,
      lineItems: inv.lineItems.map(item => ({ ...item })),
      status: 'active'
    };
    this.state.currentMode = inv.mode;
    this.saveState();
  }

  public deleteCompletedInvoice(invoiceId: string): void {
    // Hard delete of completed/saved invoices is strictly forbidden by policy.
    // Redirecting any potential call to cancelCompletedInvoice instead.
    console.warn(`[POLICY ENFORCED] Hard delete of invoice ${invoiceId} is forbidden. Redirecting to cancelCompletedInvoice.`);
    this.cancelCompletedInvoice(invoiceId);
  }

  public cancelInvoice(
    invoiceId: string, 
    actorUsername: string = 'system', 
    actorRole: UserRole = 'SUPER_ADMIN'
  ): { success: boolean; message: string; invoice?: SalesInvoice } {
    // Authorization check via permissionIntegrationService
    const permResult = permissionIntegrationService.checkPermission(actorRole, 'PERM_ACT_CANCEL_SALES_INVOICE');
    if (!permResult.granted) {
      permissionIntegrationService.logSecurityEvent(
        actorUsername,
        actorRole,
        'CANCEL_SALES_INVOICE_DENIED',
        invoiceId,
        'DENIED',
        `User ${actorUsername} (${actorRole}) attempted to cancel sales invoice without required permission PERM_ACT_CANCEL_SALES_INVOICE.`
      );
      return {
        success: false,
        message: `تم رفض الإجراء: المستخدم (${actorUsername} - ${actorRole}) لا يملك الصلاحية المطلوبة (إلغاء فاتورة مبيعات / Cancel Sales Invoice).`
      };
    }

    // 1. Search in completedInvoices history first
    let inv = this.state.completedInvoices?.find(c => c.id === invoiceId);

    if (inv) {
      if (inv.status === 'cancelled') {
        return { success: false, message: `الفاتورة ${inv.invoiceNumber} ملغاة بالفعل.` };
      }

      // Restore stock for cancelled invoice
      if (inv.lineItems) {
        const currentWId = this.normalizeWarehouseId(inv.warehouseId || 'WH-01');
        inv.lineItems.forEach(item => {
          const p = this.state.products.find(prod => prod.id === item.productId || prod.code === item.productCode);
          if (p) {
            if (!p.warehouseStocks) {
              p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
              const prodWId = this.normalizeWarehouseId(p.warehouse);
              p.warehouseStocks[prodWId] = p.stockQty || 0;
            }
            const totalItemQty = (item.quantity || 0) + (item.bonusQuantity || 0);
            p.warehouseStocks[currentWId] = (p.warehouseStocks[currentWId] || 0) + totalItemQty;
            p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
          }
        });
      }

      // Revert deferred balance if invoice had deferred payment
      const deferredToRevert = inv.deferredPaid ?? (inv.paymentMethod === 'deferred' ? inv.grandTotal : 0);
      if (deferredToRevert > 0 && inv.customerId) {
        const cust = this.state.customers.find(c => c.id === inv.customerId) || customerService.getCustomerById(inv.customerId);
        if (cust) {
          cust.balanceDue = Math.max(0, (cust.balanceDue || 0) - deferredToRevert);
          customerService.updateCustomer(cust.id, { balanceDue: cust.balanceDue });
        }
      }

      inv.status = 'cancelled';
      inv.cancelledBy = actorUsername;
      inv.cancelledByRole = actorRole;
      inv.cancelledAt = new Date().toISOString();
      if (this.state.activeInvoice && this.state.activeInvoice.id === invoiceId) {
        this.createNewInvoice();
      }
    } else if (this.state.activeInvoice && (this.state.activeInvoice.id === invoiceId || this.state.activeInvoice.invoiceNumber === invoiceId)) {
      inv = this.state.activeInvoice;
      inv.status = 'cancelled';
      inv.cancelledBy = actorUsername;
      inv.cancelledByRole = actorRole;
      inv.cancelledAt = new Date().toISOString();

      if (!this.state.completedInvoices) this.state.completedInvoices = [];
      const existingIdx = this.state.completedInvoices.findIndex(c => c.id === inv.id);
      if (existingIdx >= 0) {
        this.state.completedInvoices[existingIdx] = { ...inv };
      } else {
        this.state.completedInvoices.unshift({ ...inv });
      }

      this.createNewInvoice();
    } else {
      return {
        success: false,
        message: `لم يتم العثور على الفاتورة ${invoiceId} لإلغائها.`
      };
    }

    // Audit log
    permissionIntegrationService.logSecurityEvent(
      actorUsername,
      actorRole,
      'CANCEL_SALES_INVOICE_SUCCESS',
      invoiceId,
      'ALLOWED',
      `User ${actorUsername} (${actorRole}) successfully cancelled sales invoice ${inv.invoiceNumber}.`
    );

    this.saveState();
    return {
      success: true,
      message: `تم إلغاء الفاتورة ${inv.invoiceNumber} بنجاح من قبل ${actorUsername}.`,
      invoice: inv
    };
  }

  public cancelCompletedInvoice(
    invoiceId: string, 
    actorUsername: string = 'system', 
    actorRole: UserRole = 'SUPER_ADMIN'
  ): { success: boolean; message: string; invoice?: SalesInvoice } {
    return this.cancelInvoice(invoiceId, actorUsername, actorRole);
  }

  public isInvoiceSaved(invoiceId?: string): boolean {
    if (!this.state?.completedInvoices) return false;
    const targetId = invoiceId || this.state.activeInvoice?.id;
    if (!targetId) return false;
    return this.state.completedInvoices.some(c => c.id === targetId);
  }

  public isEditingSavedInvoice(): boolean {
    if (!this.state?.activeInvoice || !this.state?.completedInvoices) return false;
    return this.state.completedInvoices.some(c => c.id === this.state.activeInvoice.id);
  }

  public getOriginalSavedInvoice(invoiceId?: string): SalesInvoice | null {
    if (!this.state?.completedInvoices) return null;
    const targetId = invoiceId || this.state.activeInvoice?.id;
    if (!targetId) return null;
    return this.state.completedInvoices.find(c => c.id === targetId) || null;
  }

  public isSavedInvoiceDirty(currentInvoice?: SalesInvoice): boolean {
    const active = currentInvoice || this.state?.activeInvoice;
    if (!active || !this.state?.completedInvoices) return false;

    const original = this.state.completedInvoices.find(c => c.id === active.id);
    if (!original) return false;

    // 1. Date comparison (normalized by date string YYYY-MM-DD)
    const activeDateStr = active.createdAt ? new Date(active.createdAt).toISOString().split('T')[0] : '';
    const originalDateStr = original.createdAt ? new Date(original.createdAt).toISOString().split('T')[0] : '';
    if (activeDateStr !== originalDateStr) return true;

    // 2. Customer
    if (active.customerId !== original.customerId || active.customerName !== original.customerName) {
      return true;
    }

    // 3. Location / Warehouse / Treasury / Bank / Seller
    if ((active.warehouseId || '') !== (original.warehouseId || '')) return true;
    if ((active.treasuryId || '') !== (original.treasuryId || '')) return true;
    if ((active.bankId || '') !== (original.bankId || '')) return true;
    if ((active.sellerId || '') !== (original.sellerId || '')) return true;

    // 4. Financial settings (Tax, Discount, VAT, Totals)
    if (Math.abs((active.invoiceDiscountValue || 0) - (original.invoiceDiscountValue || 0)) > 0.001) return true;
    if ((active.invoiceDiscountType || 'fixed') !== (original.invoiceDiscountType || 'fixed')) return true;
    if (Math.abs((active.taxDiscountRate || 0) - (original.taxDiscountRate || 0)) > 0.001) return true;
    if (Boolean(active.isTaxInvoice) !== Boolean(original.isTaxInvoice)) return true;
    if (Math.abs((active.vatRate || 0) - (original.vatRate || 0)) > 0.001) return true;
    if (Math.abs((active.grandTotal || 0) - (original.grandTotal || 0)) > 0.01) return true;
    if (Math.abs((active.subtotal || 0) - (original.subtotal || 0)) > 0.01) return true;
    if (Math.abs((active.totalDiscount || 0) - (original.totalDiscount || 0)) > 0.01) return true;
    if (Math.abs((active.totalTax || 0) - (original.totalTax || 0)) > 0.01) return true;

    // 5. Line items
    const activeItems = active.lineItems || [];
    const originalItems = original.lineItems || [];
    if (activeItems.length !== originalItems.length) return true;

    for (let i = 0; i < activeItems.length; i++) {
      const a = activeItems[i];
      const o = originalItems[i];
      if (a.productId !== o.productId || a.productCode !== o.productCode) return true;
      if (a.quantity !== o.quantity) return true;
      if (Math.abs((a.bonusQuantity || 0) - (o.bonusQuantity || 0)) > 0.001) return true;
      if (Math.abs(a.unitPrice - o.unitPrice) > 0.001) return true;
      if (Math.abs((a.discountValue || 0) - (o.discountValue || 0)) > 0.001) return true;
      if ((a.discountType || 'fixed') !== (o.discountType || 'fixed')) return true;
      if (Math.abs((a.lineTotal || 0) - (o.lineTotal || 0)) > 0.01) return true;
      if ((a.warehouse || '') !== (o.warehouse || '')) return true;
      if ((a.batchNumber || '') !== (o.batchNumber || '')) return true;
    }

    return false;
  }

  public getSavedInvoiceDifferences(currentInvoice?: SalesInvoice): { label: string; from: string; to: string }[] {
    const active = currentInvoice || this.state?.activeInvoice;
    if (!active || !this.state?.completedInvoices) return [];

    const original = this.state.completedInvoices.find(c => c.id === active.id);
    if (!original) return [];

    const diffs: { label: string; from: string; to: string }[] = [];

    // Date
    const activeDateStr = active.createdAt ? new Date(active.createdAt).toISOString().split('T')[0] : '';
    const originalDateStr = original.createdAt ? new Date(original.createdAt).toISOString().split('T')[0] : '';
    if (activeDateStr !== originalDateStr) {
      diffs.push({ label: 'تاريخ الفاتورة', from: originalDateStr, to: activeDateStr });
    }

    // Customer
    if (active.customerId !== original.customerId || active.customerName !== original.customerName) {
      diffs.push({ label: 'العميل', from: original.customerName, to: active.customerName });
    }

    // Items count / Totals
    if (active.lineItems.length !== original.lineItems.length) {
      diffs.push({ label: 'عدد الأصناف', from: `${original.lineItems.length} صنف`, to: `${active.lineItems.length} صنف` });
    }

    if (Math.abs(active.grandTotal - original.grandTotal) > 0.01) {
      diffs.push({ label: 'الإجمالي النهائي', from: `$${original.grandTotal.toFixed(2)}`, to: `$${active.grandTotal.toFixed(2)}` });
    }

    return diffs;
  }

  public validateCustomerCredit(
    customerId: string,
    invoiceAmount: number,
    paymentMethod: 'cash' | 'card' | 'mixed' | 'deferred',
    editingInvoiceId?: string
  ): CreditValidationResult {
    // Get fresh customer data from customerService or state
    const cust = customerService.getCustomerById(customerId) || this.state.customers.find(c => c.id === customerId);

    if (!cust) {
      return {
        allowed: false,
        reason: 'customer_not_found',
        message: 'العميل المحدد غير موجود بجدول العملاء',
        availableCredit: 0,
        currentOutstanding: 0,
        creditLimit: 0,
        allowCreditSales: false
      };
    }

    if (!cust.isSystemCashCustomer && cust.id !== 'CUST-CASH-001' && !customerService.isCustomerActive(cust)) {
      return {
        allowed: false,
        reason: 'disallowed',
        message: 'هذا العميل معطّل ولا يمكن إنشاء فاتورة بيع له.',
        allowCreditSales: false,
        creditLimit: cust.creditLimit || 0,
        currentOutstanding: cust.balanceDue || 0,
        availableCredit: 0,
        isLimitExceeded: false,
        invoiceAmount,
        projectedOutstanding: (cust.balanceDue || 0) + invoiceAmount
      };
    }

    let currentOutstanding = cust.balanceDue || 0;

    // If editing an existing completed invoice that was previously recorded as deferred, subtract its old deferred amount to avoid double counting
    if (editingInvoiceId) {
      const prevInv = this.state.completedInvoices?.find(c => c.id === editingInvoiceId);
      if (prevInv && prevInv.status !== 'cancelled') {
        const prevDeferred = prevInv.deferredPaid ?? (prevInv.paymentMethod === 'deferred' ? prevInv.grandTotal : 0);
        if (prevDeferred > 0) {
          currentOutstanding = Math.max(0, currentOutstanding - prevDeferred);
        }
      }
    }

    const allowCreditSales = cust.allowCreditSales ?? false;
    const creditLimit = cust.creditLimit || 0;
    const hasCreditLimit = creditLimit > 0;

    // Available Credit:
    // If creditLimit > 0 -> Credit Limit - Current Outstanding
    // If creditLimit === 0 (or unset) -> No credit limit (بلا حد ائتماني)
    const availableCredit = hasCreditLimit ? Math.max(0, creditLimit - currentOutstanding) : 999999999;
    const isLimitExceeded = hasCreditLimit ? currentOutstanding > creditLimit : false;
    const projectedOutstanding = currentOutstanding + invoiceAmount;

    // Rule 1: Check if credit sales are allowed for this customer
    if (!allowCreditSales) {
      return {
        allowed: invoiceAmount === 0,
        reason: 'disallowed',
        message: 'سبب المنع: البيع الآجل غير مسموح لهذا العميل',
        allowCreditSales: false,
        creditLimit,
        currentOutstanding,
        availableCredit,
        isLimitExceeded,
        invoiceAmount,
        projectedOutstanding
      };
    }

    // Rule 2: If customer has a defined credit limit and has already exceeded it, any new credit is blocked
    if (hasCreditLimit && invoiceAmount > 0 && isLimitExceeded) {
      return {
        allowed: false,
        reason: 'credit_limit_exceeded',
        message: 'سبب المنع: العميل متجاوز للحد الائتماني بالفعل',
        allowCreditSales: true,
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
        message: 'سبب المنع: تجاوز حد الائتمان المسموح',
        allowCreditSales: true,
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
      allowCreditSales: true,
      creditLimit,
      currentOutstanding,
      availableCredit,
      isLimitExceeded: false,
      invoiceAmount,
      projectedOutstanding
    };
  }

  public completePayment(
    paymentMethod: 'cash' | 'card' | 'mixed' | 'deferred',
    cashAmount: number = 0,
    cardAmount: number = 0,
    deferredAmount: number = 0,
    actorRole?: UserRole,
    actorUsername?: string
  ): { success: boolean; error?: string; invoice?: SalesInvoice } {
    const inv = this.state.activeInvoice;

    // Strict payment completeness guard
    const totalNeeded = Math.round(inv.grandTotal * 100) / 100;
    const totalCovered = Math.round((cashAmount + cardAmount + deferredAmount) * 100) / 100;
    const remainingAmount = Math.round((totalNeeded - totalCovered) * 100) / 100;

    if (remainingAmount > 0 || remainingAmount < 0) {
      return {
        success: false,
        error: 'المبلغ المسدد غير مكتمل'
      };
    }

    // Strict warehouse permission, pre-sale & inventory & zero-price validation
    const validation = this.validateInvoiceForSale(inv, actorRole, actorUsername);
    if (!validation.allowed) {
      return {
        success: false,
        error: validation.error || 'فشل التحقق من الفاتورة قبل إتمام البيع'
      };
    }

    // Credit limit validation MUST execute if deferredAmount > 0
    if (deferredAmount > 0) {
      const creditVal = this.validateCustomerCredit(inv.customerId, deferredAmount, paymentMethod, inv.id);
      if (!creditVal.allowed) {
        return {
          success: false,
          error: creditVal.message || 'تجاوز حد الائتمان'
        };
      }
    }

    // Deduct stock for all items in the invoice from warehouse inventory
    const currentWId = this.normalizeWarehouseId(inv.warehouseId || 'WH-01');
    inv.lineItems.forEach(item => {
      const p = this.state.products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        if (!p.warehouseStocks) {
          p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
          const prodWId = this.normalizeWarehouseId(p.warehouse);
          p.warehouseStocks[prodWId] = p.stockQty || 0;
        }
        const totalItemQty = (item.quantity || 0) + (item.bonusQuantity || 0);
        p.warehouseStocks[currentWId] = Math.max(0, (p.warehouseStocks[currentWId] || 0) - totalItemQty);
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    inv.status = 'completed';
    inv.paymentMethod = paymentMethod;
    inv.cashPaid = cashAmount;
    inv.cardPaid = cardAmount;
    inv.deferredPaid = deferredAmount;

    const totalPaid = cashAmount + cardAmount + deferredAmount;
    inv.changeDue = (cardAmount === 0 && deferredAmount === 0 && cashAmount > inv.grandTotal)
      ? (cashAmount - inv.grandTotal)
      : Math.max(0, totalPaid - inv.grandTotal);

    // Remove from openInvoices if it was listed there
    this.state.openInvoices = this.state.openInvoices.filter(openInv => openInv.id !== inv.id);

    if (!this.state.completedInvoices) {
      this.state.completedInvoices = [];
    }

    const existingIdx = this.state.completedInvoices.findIndex(c => c.id === inv.id);
    const prevInv = existingIdx >= 0 ? this.state.completedInvoices[existingIdx] : null;
    const prevDeferred = prevInv ? (prevInv.deferredPaid ?? (prevInv.paymentMethod === 'deferred' ? prevInv.grandTotal : 0)) : 0;

    if (existingIdx >= 0) {
      const diff = deferredAmount - prevDeferred;
      if (diff !== 0 && inv.customerId) {
        const cust = this.state.customers.find(c => c.id === inv.customerId) || customerService.getCustomerById(inv.customerId);
        if (cust) {
          cust.balanceDue = Math.max(0, (cust.balanceDue || 0) + diff);
          customerService.updateCustomer(cust.id, { balanceDue: cust.balanceDue });
        }
      }
    } else if (deferredAmount > 0 && inv.customerId) {
      const cust = this.state.customers.find(c => c.id === inv.customerId) || customerService.getCustomerById(inv.customerId);
      if (cust) {
        cust.balanceDue = (cust.balanceDue || 0) + deferredAmount;
        customerService.updateCustomer(cust.id, { balanceDue: cust.balanceDue });
      }
    }

    const completedInv = { ...inv };

    if (existingIdx >= 0) {
      this.state.completedInvoices[existingIdx] = completedInv;
    } else {
      this.ensureUniqueInvoiceNumber(completedInv);
      this.state.completedInvoices = [completedInv, ...this.state.completedInvoices];

      // Update metrics for new completion
      this.state.metrics.totalInvoicesCompleted += 1;
      this.state.metrics.totalRevenue += completedInv.grandTotal;

      if (completedInv.mode === 'standard') this.state.metrics.standardModeCount += 1;
      if (completedInv.mode === 'pos') this.state.metrics.posModeCount += 1;
      if (completedInv.mode === 'button') this.state.metrics.buttonModeCount += 1;
    }

    // Reset current active invoice with next number in sequence
    const defaultCustomer = customerService.getSystemCashCustomer();
    this.state.activeInvoice = this.createNextBlankInvoice(this.state.currentMode, defaultCustomer);
    this.saveState();
    return { success: true, invoice: completedInv };
  }

  public saveInvoiceWithoutPayment(
    paymentMethod: 'cash' | 'card' | 'mixed' | 'deferred',
    cashAmount: number = 0,
    cardAmount: number = 0,
    deferredAmount: number = 0,
    actorRole?: UserRole,
    actorUsername?: string
  ): { success: boolean; error?: string; invoice?: SalesInvoice } {
    const inv = this.state.activeInvoice;

    // Strict payment completeness guard
    const totalNeeded = Math.round(inv.grandTotal * 100) / 100;
    const totalCovered = Math.round((cashAmount + cardAmount + deferredAmount) * 100) / 100;
    const remainingAmount = Math.round((totalNeeded - totalCovered) * 100) / 100;

    if (remainingAmount > 0 || remainingAmount < 0) {
      return {
        success: false,
        error: 'المبلغ المسدد غير مكتمل'
      };
    }

    // Strict warehouse permission, pre-sale & inventory & zero-price validation
    const validation = this.validateInvoiceForSale(inv, actorRole, actorUsername);
    if (!validation.allowed) {
      return {
        success: false,
        error: validation.error || 'فشل التحقق من الفاتورة قبل الحفظ'
      };
    }

    // Credit limit validation MUST execute if deferredAmount > 0
    if (deferredAmount > 0) {
      const creditVal = this.validateCustomerCredit(inv.customerId, deferredAmount, paymentMethod, inv.id);
      if (!creditVal.allowed) {
        return {
          success: false,
          error: creditVal.message || 'تجاوز حد الائتمان'
        };
      }
    }

    // Deduct stock for all items in the invoice from warehouse inventory
    const currentWId = this.normalizeWarehouseId(inv.warehouseId || 'WH-01');
    inv.lineItems.forEach(item => {
      const p = this.state.products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        if (!p.warehouseStocks) {
          p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
          const prodWId = this.normalizeWarehouseId(p.warehouse);
          p.warehouseStocks[prodWId] = p.stockQty || 0;
        }
        const totalItemQty = (item.quantity || 0) + (item.bonusQuantity || 0);
        p.warehouseStocks[currentWId] = Math.max(0, (p.warehouseStocks[currentWId] || 0) - totalItemQty);
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    inv.status = 'completed';
    inv.paymentMethod = paymentMethod;
    inv.cashPaid = cashAmount;
    inv.cardPaid = cardAmount;
    inv.deferredPaid = deferredAmount;
    inv.changeDue = Math.max(0, totalCovered - inv.grandTotal);

    // Remove from openInvoices if it was listed there
    this.state.openInvoices = this.state.openInvoices.filter(openInv => openInv.id !== inv.id);

    if (!this.state.completedInvoices) {
      this.state.completedInvoices = [];
    }

    const existingIdx = this.state.completedInvoices.findIndex(c => c.id === inv.id);
    const prevInv = existingIdx >= 0 ? this.state.completedInvoices[existingIdx] : null;
    const prevDeferred = prevInv ? (prevInv.deferredPaid ?? (prevInv.paymentMethod === 'deferred' ? prevInv.grandTotal : 0)) : 0;

    if (existingIdx >= 0) {
      const diff = deferredAmount - prevDeferred;
      if (diff !== 0 && inv.customerId) {
        const cust = this.state.customers.find(c => c.id === inv.customerId) || customerService.getCustomerById(inv.customerId);
        if (cust) {
          cust.balanceDue = Math.max(0, (cust.balanceDue || 0) + diff);
          customerService.updateCustomer(cust.id, { balanceDue: cust.balanceDue });
        }
      }
    } else if (deferredAmount > 0 && inv.customerId) {
      const cust = this.state.customers.find(c => c.id === inv.customerId) || customerService.getCustomerById(inv.customerId);
      if (cust) {
        cust.balanceDue = (cust.balanceDue || 0) + deferredAmount;
        customerService.updateCustomer(cust.id, { balanceDue: cust.balanceDue });
      }
    }

    const savedInv = { ...inv };

    if (existingIdx >= 0) {
      this.state.completedInvoices[existingIdx] = savedInv;
    } else {
      this.ensureUniqueInvoiceNumber(savedInv);
      this.state.completedInvoices = [savedInv, ...this.state.completedInvoices];

      // Update metrics for new completion
      this.state.metrics.totalInvoicesCompleted += 1;
      this.state.metrics.totalRevenue += savedInv.grandTotal;

      if (savedInv.mode === 'standard') this.state.metrics.standardModeCount += 1;
      if (savedInv.mode === 'pos') this.state.metrics.posModeCount += 1;
      if (savedInv.mode === 'button') this.state.metrics.buttonModeCount += 1;
    }

    // Reset current active invoice with next number in sequence
    const defaultCustomer = customerService.getSystemCashCustomer();
    this.state.activeInvoice = this.createNextBlankInvoice(this.state.currentMode, defaultCustomer);
    this.saveState();
    return { success: true, invoice: savedInv };
  }

  public toggleFavoriteProduct(productId: string): void {
    const product = this.state.products.find(p => p.id === productId);
    if (product) {
      product.isFavorite = !product.isFavorite;
      this.saveState();
    }
  }

  public markVgf06Completed(): void {
    this.state.isVgf06Completed = true;
    this.saveState();
  }

  public calculateInvoiceProfitability(
    invoice: SalesInvoice,
    actorRole: UserRole = 'SUPER_ADMIN',
    actorUsername: string = 'system'
  ): InvoiceProfitabilityResult {
    const permResult = permissionIntegrationService.checkPermission(actorRole, 'PERM_ACT_VIEW_INVOICE_PROFIT');
    if (!permResult.granted) {
      auditEngine.logAction(
        'INVOICE_PROFIT_ACCESS_DENIED',
        'Sales Invoice Totals',
        `User ${actorUsername} (${actorRole}) attempted to view invoice profitability without required permission PERM_ACT_VIEW_INVOICE_PROFIT.`,
        'warning',
        'VGF06 Sales Entry'
      );
      return {
        allowed: false,
        error: 'Unauthorized access: user lacks PERM_ACT_VIEW_INVOICE_PROFIT permission.',
        netSales: 0,
        itemsCost: 0,
        profit: 0,
        profitMargin: 0,
        profitByAverageCost: 0,
        profitByLastPurchasePrice: 0,
        totalAverageCost: 0,
        totalLastPurchaseCost: 0,
        itemsBreakdown: []
      };
    }

    const netSales = Math.max(0, (invoice.subtotal || 0) - (invoice.totalDiscount || 0));
    let itemsCost = 0;
    let totalAverageCost = 0;
    let totalLastPurchaseCost = 0;

    const itemsBreakdown: InvoiceProfitabilityItemBreakdown[] = (invoice.lineItems || []).map(item => {
      const product = this.state.products.find(p => p.id === item.productId || p.code === item.productCode);
      const approvedCost = product ? (product.costPrice ?? 0) : 0;
      const averageCost = product ? (product.averageCost ?? product.costPrice ?? 0) : 0;
      const lastPurchasePrice = product ? (product.lastPurchasePrice ?? product.costPrice ?? 0) : 0;

      const quantity = item.quantity || 0;
      const bonusQuantity = item.bonusQuantity || 0;
      const totalQuantity = quantity + bonusQuantity;
      const unitPrice = item.unitPrice || 0;
      const lineNetSales = item.lineTotal || 0;

      // Profit uses currently approved inventory cost in the system
      const totalCost = totalQuantity * approvedCost;
      itemsCost += totalCost;
      totalAverageCost += totalQuantity * averageCost;
      totalLastPurchaseCost += totalQuantity * lastPurchasePrice;

      const itemProfit = lineNetSales - totalCost;

      return {
        productId: item.productId,
        productCode: item.productCode,
        productName: item.productName,
        quantity,
        bonusQuantity,
        totalQuantity,
        unitPrice,
        netSales: lineNetSales,
        averageCost,
        lastPurchasePrice,
        approvedCost,
        totalCost,
        profit: itemProfit
      };
    });

    const profit = netSales - itemsCost;
    const profitMargin = netSales > 0 ? (profit / netSales) * 100 : 0;

    // Profitability metrics based on Average Cost and Last Purchase Price:
    // الربح حسب متوسط التكلفة = صافي الفاتورة - إجمالي تكلفة الأصناف حسب متوسط التكلفة
    const profitByAverageCost = netSales - totalAverageCost;
    // الربح حسب آخر سعر شراء = صافي الفاتورة - إجمالي تكلفة الأصناف حسب آخر سعر شراء
    const profitByLastPurchasePrice = netSales - totalLastPurchaseCost;

    return {
      allowed: true,
      netSales,
      itemsCost,
      profit,
      profitMargin,
      profitByAverageCost,
      profitByLastPurchasePrice,
      totalAverageCost,
      totalLastPurchaseCost,
      itemsBreakdown
    };
  }

  public resetState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
  }
}

export const salesEntryService = new SalesEntryService();
