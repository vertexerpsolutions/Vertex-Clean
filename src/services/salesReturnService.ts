import { SalesInvoice, InvoiceLineItem } from './salesEntryService';

export type ReturnReason = 'تالف' | 'خطأ في البيع' | 'العميل لا يريد المنتج' | 'استبدال' | 'أخرى';
export type RefundMethod = 'cash' | 'card' | 'deferred' | 'original';

export interface ReturnLineItem {
  lineItemId: string;
  productId: string;
  productCode: string;
  productName: string;
  barcode: string;
  unitPrice: number;
  soldQuantity: number;
  previouslyReturnedQuantity: number;
  availableReturnQuantity: number;
  returnQuantity: number;
  unit: string;
  itemDiscountAmount: number;
  lineTotal: number;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  status: 'draft' | 'approved' | 'cancelled';
  reason: ReturnReason;
  customReasonDetails?: string;
  lineItems: ReturnLineItem[];
  subtotalReturn: number;
  itemDiscountsReturn: number;
  invoiceDiscountReturn: number;
  vatReturn: number;
  taxDiscountReturn: number;
  netReturnTotal: number;
  refundMethod: RefundMethod;
  createdBy: string;
  notes?: string;
}

export interface ReturnFinancialSummary {
  subtotalReturn: number;
  itemDiscountsReturn: number;
  invoiceDiscountReturn: number;
  totalDiscountReturn: number;
  netBeforeTaxReturn: number;
  vatReturn: number;
  taxDiscountReturn: number;
  netReturnTotal: number;
}

const STORAGE_KEY = 'sales_returns_records_v1';

class SalesReturnService {
  private returns: SalesReturn[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        this.returns = JSON.parse(saved);
      } else {
        // Initial sample return for demonstration/preview evaluation
        this.returns = [
          {
            id: 'RET-SAMPLE-001',
            returnNumber: 'RET-2026-0001',
            originalInvoiceId: 'INV-2026-1001',
            originalInvoiceNumber: 'INV-2026-1001',
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            customerId: 'CUST-001',
            customerName: 'عميل نقدي عام',
            status: 'approved',
            reason: 'العميل لا يريد المنتج',
            lineItems: [
              {
                lineItemId: 'sample-line-1',
                productId: 'P-101',
                productCode: 'SKU-101',
                productName: 'حليب نادك كامل الدسم 1 لتر',
                barcode: '628100700011',
                unitPrice: 7.5,
                soldQuantity: 5,
                previouslyReturnedQuantity: 0,
                availableReturnQuantity: 5,
                returnQuantity: 1,
                unit: 'كرتون',
                itemDiscountAmount: 0,
                lineTotal: 7.5
              }
            ],
            subtotalReturn: 7.5,
            itemDiscountsReturn: 0,
            invoiceDiscountReturn: 0,
            vatReturn: 1.05,
            taxDiscountReturn: 0,
            netReturnTotal: 8.55,
            refundMethod: 'cash',
            createdBy: 'alex.mercer',
            notes: 'مرتجع عينة للتأكد من سير العملية'
          }
        ];
        this.saveToStorage();
      }
    } catch (e) {
      console.error('Failed to load sales returns from storage:', e);
      this.returns = [];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.returns));
    } catch (e) {
      console.error('Failed to save sales returns to storage:', e);
    }
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
  }

  public getAllReturns(): SalesReturn[] {
    return [...this.returns];
  }

  public getReturnsForInvoice(originalInvoiceId: string): SalesReturn[] {
    return this.returns.filter(
      r => (r.originalInvoiceId === originalInvoiceId || r.originalInvoiceNumber === originalInvoiceId) && r.status !== 'cancelled'
    );
  }

  public getPreviouslyReturnedQuantity(originalInvoiceId: string, lineItemId: string): number {
    const validReturns = this.getReturnsForInvoice(originalInvoiceId);
    let total = 0;
    for (const ret of validReturns) {
      for (const item of ret.lineItems) {
        if (item.lineItemId === lineItemId) {
          total += item.returnQuantity;
        }
      }
    }
    return total;
  }

  public calculateReturnTotals(
    invoice: SalesInvoice,
    returnQuantities: Record<string, number>
  ): ReturnFinancialSummary {
    let subtotalReturn = 0;
    let itemDiscountsReturn = 0;

    const originalTotalItemDiscounts = invoice.lineItems.reduce((acc, item) => acc + (item.discountAmount || 0), 0);

    for (const item of invoice.lineItems) {
      const qty = Math.max(0, returnQuantities[item.id] || 0);
      if (qty <= 0) continue;

      const lineSubtotal = item.unitPrice * qty;
      subtotalReturn += lineSubtotal;

      const perUnitDiscount = item.quantity > 0 ? (item.discountAmount || 0) / item.quantity : 0;
      itemDiscountsReturn += perUnitDiscount * qty;
    }

    const netItemReturn = subtotalReturn - itemDiscountsReturn;

    // Invoice Discount Proportion
    let invoiceDiscountReturn = 0;
    const netOriginalSubtotal = invoice.subtotal - originalTotalItemDiscounts;
    if (netOriginalSubtotal > 0 && (invoice.invoiceDiscountAmount || 0) > 0) {
      const ratio = (invoice.invoiceDiscountAmount || 0) / netOriginalSubtotal;
      invoiceDiscountReturn = netItemReturn * ratio;
    }

    const totalDiscountReturn = itemDiscountsReturn + invoiceDiscountReturn;
    const netBeforeTaxReturn = subtotalReturn - totalDiscountReturn;

    // VAT Return
    let vatReturn = 0;
    if (invoice.isTaxInvoice) {
      const vatRate = invoice.vatRate || 0.14;
      vatReturn = netBeforeTaxReturn * vatRate;
    }

    // Tax Discount Return
    let taxDiscountReturn = 0;
    if ((invoice.taxDiscountRate || 0) > 0) {
      taxDiscountReturn = netBeforeTaxReturn * ((invoice.taxDiscountRate || 0) / 100);
    }

    const netReturnTotal = netBeforeTaxReturn + vatReturn - taxDiscountReturn;

    return {
      subtotalReturn,
      itemDiscountsReturn,
      invoiceDiscountReturn,
      totalDiscountReturn,
      netBeforeTaxReturn,
      vatReturn,
      taxDiscountReturn,
      netReturnTotal
    };
  }

  public generateReturnNumber(): string {
    const year = new Date().getFullYear();
    const count = this.returns.length + 1;
    const padded = String(count).padStart(4, '0');
    return `RET-${year}-${padded}`;
  }

  public createReturn(
    data: Omit<SalesReturn, 'id' | 'returnNumber' | 'createdAt'>
  ): SalesReturn {
    const newReturn: SalesReturn = {
      ...data,
      id: `RET-${Date.now()}`,
      returnNumber: this.generateReturnNumber(),
      createdAt: new Date().toISOString()
    };

    this.returns.unshift(newReturn);
    this.saveToStorage();
    return newReturn;
  }

  public updateReturnStatus(returnId: string, newStatus: 'draft' | 'approved' | 'cancelled'): boolean {
    const target = this.returns.find(r => r.id === returnId);
    if (!target) return false;

    target.status = newStatus;
    this.saveToStorage();
    return true;
  }

  public deleteReturn(returnId: string): boolean {
    const idx = this.returns.findIndex(r => r.id === returnId);
    if (idx === -1) return false;

    this.returns.splice(idx, 1);
    this.saveToStorage();
    return true;
  }
}

export const salesReturnService = new SalesReturnService();
