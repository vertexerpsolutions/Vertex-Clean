import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';
import { salesEntryService, ProductItem } from './salesEntryService';
import { warehouseService, Warehouse } from './warehouseService';

export interface StockTransferItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  availableStockAtSource?: number;
  costPrice?: number;
  notes?: string;
}

export interface StockTransferRecord {
  id: string;
  transferNumber: string; // Issue code e.g. TR-OUT-1001
  receiptNumber?: string;  // Receipt code e.g. TR-IN-1001
  documentType: 'issue' | 'receipt'; // Current document mode when saved
  date: string; // YYYY-MM-DD
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  status: 'معلق' | 'مكتمل' | 'ملغي'; // 'pending' | 'completed' | 'cancelled'
  items: StockTransferItem[];
  totalQuantity: number;
  totalItems: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  completedAt?: string;
  completedBy?: string;
  referenceIssueId?: string;
  referenceIssueNumber?: string;
}

const STORAGE_KEY = 'VERTEX_STOCK_TRANSFERS_V1';

export const INITIAL_TRANSFERS: StockTransferRecord[] = [];

class StockTransferService {
  private transfers: StockTransferRecord[] = [];
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
          // Filter out legacy demo seed transfer
          this.transfers = parsed.filter((t: any) => 
            t.id !== 'ST-2026-001' && 
            t.transferNumber !== 'TR-OUT-1001' &&
            !t.toWarehouseName?.includes('لندن') &&
            !t.notes?.includes('مستودع لندن الإقليمي')
          );
          this.saveToStorage();
          return;
        }
      }
    } catch (err) {
      console.warn('Could not parse stored stock transfers:', err);
    }
    this.transfers = [];
    this.saveToStorage();
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transfers));
    } catch (err) {
      console.error('Failed to save stock transfers to localStorage', err);
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
        console.error('Error in StockTransferService listener', err);
      }
    });
  }

  public getAllTransfers(): StockTransferRecord[] {
    return [...this.transfers];
  }

  public getPendingIssueNotes(): StockTransferRecord[] {
    return this.transfers.filter(t => t.status === 'معلق');
  }

  public getTransferById(id: string): StockTransferRecord | undefined {
    return this.transfers.find(t => t.id === id);
  }

  /**
   * Generates the next sequential Issue Number (e.g. OUT2026-1, OUT2026-2, ...)
   * Tied to the current year and resets/updates automatically at the start of a new year.
   */
  public generateNextIssueNumber(year: number = new Date().getFullYear()): string {
    const prefix = `OUT${year}-`;
    const numbers = this.transfers
      .map(t => {
        if (!t.transferNumber) return null;
        if (t.transferNumber.startsWith(prefix)) {
          const numPart = t.transferNumber.slice(prefix.length);
          const parsed = parseInt(numPart, 10);
          return isNaN(parsed) ? null : parsed;
        }
        return null;
      })
      .filter((n): n is number => n !== null);

    const highest = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}${highest + 1}`;
  }

  /**
   * Generates the next sequential Receipt Number (e.g. IN2026-1, IN2026-2, ...)
   * Tied to the current year and resets/updates automatically at the start of a new year.
   */
  public generateNextReceiptNumber(year: number = new Date().getFullYear()): string {
    const prefix = `IN${year}-`;
    const numbers = this.transfers
      .map(t => {
        if (!t.receiptNumber) return null;
        if (t.receiptNumber.startsWith(prefix)) {
          const numPart = t.receiptNumber.slice(prefix.length);
          const parsed = parseInt(numPart, 10);
          return isNaN(parsed) ? null : parsed;
        }
        return null;
      })
      .filter((n): n is number => n !== null);

    const highest = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${prefix}${highest + 1}`;
  }

  /**
   * Helper to retrieve stock of a product in a given warehouse
   */
  public getProductStockInWarehouse(product: ProductItem, warehouseId: string): number {
    const wKey = salesEntryService.normalizeWarehouseId(warehouseId);
    if (product.warehouseStocks && typeof product.warehouseStocks[wKey] === 'number') {
      return product.warehouseStocks[wKey];
    }
    // Fallback if warehouseStocks not yet initialized for this key
    const defaultWKey = salesEntryService.normalizeWarehouseId(product.warehouse);
    if (defaultWKey === wKey) {
      return product.stockQty || 0;
    }
    return 0;
  }

  /**
   * Save Issue Note (إذن صرف):
   * 1. Validates warehouses and items.
   * 2. Deducts quantity from "From Warehouse" ONLY.
   * 3. Does NOT add to "To Warehouse" yet.
   * 4. Sets status = "معلق" (Pending).
   */
  public saveTransferIssue(data: {
    transferNumber?: string;
    date: string;
    fromWarehouseId: string;
    fromWarehouseName: string;
    toWarehouseId: string;
    toWarehouseName: string;
    items: StockTransferItem[];
    notes?: string;
    createdBy?: string;
  }): { success: boolean; transfer?: StockTransferRecord; error?: string } {
    if (!data.fromWarehouseId || !data.toWarehouseId) {
      return { success: false, error: 'يرجى تحديد مخزن المصدر (من) ومخزن الوجهة (إلى).' };
    }

    if (data.fromWarehouseId === data.toWarehouseId) {
      return { success: false, error: 'لا يمكن التحويل من وإلى نفس المخزن. يرجى اختيار مخزنين مختلفين.' };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'يرجى إضافة صنف واحد على الأقل لإذن الصرف.' };
    }

    // Verify all item quantities are positive
    for (const item of data.items) {
      if (!item.quantity || item.quantity <= 0) {
        return { success: false, error: `الكمية المحددة للصنف (${item.productName}) غير صالحة. يجب أن تكون أكبر من الصفر.` };
      }
    }

    const salesState = salesEntryService.getState();
    const products = salesState.products;
    const fromWKey = salesEntryService.normalizeWarehouseId(data.fromWarehouseId);

    // Validate available stock in source warehouse
    for (const item of data.items) {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        const available = this.getProductStockInWarehouse(p, data.fromWarehouseId);
        if (available < item.quantity) {
          return {
            success: false,
            error: `الرصيد المتاح للصنف (${item.productName}) في مخزن المصدر هو (${available} ${item.unit}) وهو أقل من الكمية المطلوبة تحويلها (${item.quantity}).`
          };
        }
      }
    }

    // Deduct quantity from "From Warehouse" ONLY
    data.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        if (!p.warehouseStocks) {
          p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
          const prodWId = salesEntryService.normalizeWarehouseId(p.warehouse);
          p.warehouseStocks[prodWId] = p.stockQty || 0;
        }

        p.warehouseStocks[fromWKey] = Math.max(0, (p.warehouseStocks[fromWKey] || 0) - item.quantity);
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    // Persist updated product inventory in salesEntryService
    salesEntryService.saveState();

    const transferNum = data.transferNumber?.trim() || this.generateNextIssueNumber();
    const totalQty = data.items.reduce((sum, it) => sum + (it.quantity || 0), 0);

    const newRecord: StockTransferRecord = {
      id: `ST-${Date.now()}`,
      transferNumber: transferNum,
      documentType: 'issue',
      date: data.date || new Date().toISOString().slice(0, 10),
      fromWarehouseId: data.fromWarehouseId,
      fromWarehouseName: data.fromWarehouseName,
      toWarehouseId: data.toWarehouseId,
      toWarehouseName: data.toWarehouseName,
      status: 'معلق',
      items: data.items.map(it => ({ ...it })),
      totalQuantity: totalQty,
      totalItems: data.items.length,
      notes: data.notes?.trim() || '',
      createdBy: data.createdBy || 'مسؤول المخزن',
      createdAt: new Date().toISOString()
    };

    this.transfers = [newRecord, ...this.transfers];
    this.saveToStorage();

    auditEngine.logAction(
      'STOCK_TRANSFER_ISSUE',
      `تم تسجيل إذن صرف تحويل مخزني برقم [${newRecord.transferNumber}] من (${newRecord.fromWarehouseName}) إلى (${newRecord.toWarehouseName}) بإجمالي كمية (${totalQty}) صنف. الحالة: معلق.`,
      'info'
    );

    notificationEngine.addNotification(
      'إذن صرف تحويل مخزني',
      `تم حفظ إذن الصرف [${newRecord.transferNumber}] وخصم الكميات من (${newRecord.fromWarehouseName}) بنجاح. التحويل معلق بانتظار إذن الإضافة.`,
      'info',
      'MOD-INV'
    );

    return { success: true, transfer: newRecord };
  }

  /**
   * Save Receipt Note (إذن إضافة):
   * 1. Finds the selected pending Issue Note.
   * 2. Adds the transferred quantities to "To Warehouse".
   * 3. Marks transfer as "مكتمل" (Completed).
   */
  public saveTransferReceipt(data: {
    issueTransferId: string;
    receiptNumber?: string;
    date: string;
    notes?: string;
    completedBy?: string;
  }): { success: boolean; transfer?: StockTransferRecord; error?: string } {
    const idx = this.transfers.findIndex(t => t.id === data.issueTransferId);
    if (idx === -1) {
      return { success: false, error: 'إذن الصرف المعلق المطلوب غير موجود في النظام.' };
    }

    const issueRecord = this.transfers[idx];
    if (issueRecord.status !== 'معلق') {
      return { success: false, error: `إذن الصرف المحدد ليس في حالة معلقة (الحالة الحالية: ${issueRecord.status}).` };
    }

    const salesState = salesEntryService.getState();
    const products = salesState.products;
    const toWKey = salesEntryService.normalizeWarehouseId(issueRecord.toWarehouseId);

    // Add quantity to "To Warehouse"
    issueRecord.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        if (!p.warehouseStocks) {
          p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
          const prodWId = salesEntryService.normalizeWarehouseId(p.warehouse);
          p.warehouseStocks[prodWId] = p.stockQty || 0;
        }

        p.warehouseStocks[toWKey] = (p.warehouseStocks[toWKey] || 0) + item.quantity;
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    salesEntryService.saveState();

    const receiptNum = data.receiptNumber?.trim() || this.generateNextReceiptNumber();
    const completedRecord: StockTransferRecord = {
      ...issueRecord,
      receiptNumber: receiptNum,
      status: 'مكتمل',
      completedAt: new Date().toISOString(),
      completedBy: data.completedBy || 'أمين مخزن الاستلام',
      notes: data.notes ? `${issueRecord.notes ? issueRecord.notes + ' | ' : ''}استلام: ${data.notes.trim()}` : issueRecord.notes
    };

    this.transfers[idx] = completedRecord;
    this.saveToStorage();

    auditEngine.logAction(
      'STOCK_TRANSFER_RECEIPT',
      `تم إتمام إذن إضافة تحويل مخزني برقم [${receiptNum}] استناداً لإذن الصرف [${issueRecord.transferNumber}]. تم إضافة الكميات إلى (${issueRecord.toWarehouseName}).`,
      'info'
    );

    notificationEngine.addNotification(
      'إتمام تحويل مخزني',
      `تم اعتماد إذن الإضافة [${receiptNum}] وإضافة البضاعة لمخزن (${issueRecord.toWarehouseName}) واكتمال التحويل.`,
      'success',
      'MOD-INV'
    );

    return { success: true, transfer: completedRecord };
  }

  /**
   * Delete Pending Transfer (حذف التحويل المعلق):
   * 1. Checks if transfer exists and is pending ('معلق').
   * 2. Returns deducted quantities back to source warehouse (fromWarehouseId).
   * 3. Removes the record from data source.
   */
  public deletePendingTransfer(id: string): { success: boolean; error?: string } {
    const idx = this.transfers.findIndex(t => t.id === id);
    if (idx === -1) {
      return { success: false, error: 'إذن التحويل المطلوب غير موجود.' };
    }

    const record = this.transfers[idx];
    if (record.status !== 'معلق') {
      return {
        success: false,
        error: 'لا يمكن حذف هذا التحويل لأنه مكتمل بالفعل. الحذف متاح فقط للتحويلات المعلقة.'
      };
    }

    // Restore deducted items back to source warehouse
    const salesState = salesEntryService.getState();
    const products = salesState.products;
    const fromWKey = salesEntryService.normalizeWarehouseId(record.fromWarehouseId);

    record.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        if (!p.warehouseStocks) {
          p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
          const prodWId = salesEntryService.normalizeWarehouseId(p.warehouse);
          p.warehouseStocks[prodWId] = p.stockQty || 0;
        }

        p.warehouseStocks[fromWKey] = (p.warehouseStocks[fromWKey] || 0) + item.quantity;
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    salesEntryService.saveState();

    // Remove from array
    this.transfers.splice(idx, 1);
    this.saveToStorage();

    auditEngine.logAction(
      'STOCK_TRANSFER_DELETE',
      `تم حذف إذن الصرف المعلق برقم [${record.transferNumber}] واستعادة الكميات لمخزن (${record.fromWarehouseName}).`,
      'warning'
    );

    notificationEngine.addNotification(
      'حذف تحويل معلق',
      `تم حذف إذن الصرف المعلق [${record.transferNumber}] وإلغاء حجز الكميات من (${record.fromWarehouseName}) بنجاح.`,
      'info',
      'MOD-INV'
    );

    return { success: true };
  }

  /**
   * Update Pending Transfer Issue (تعديل إذن الصرف المعلق):
   * 1. Preserves same transferNumber and status 'معلق'.
   * 2. Validates new warehouse selection and stock availability.
   * 3. Adjusts source warehouse deductions accurately.
   */
  public updateTransferIssue(
    id: string,
    data: {
      date: string;
      fromWarehouseId: string;
      fromWarehouseName: string;
      toWarehouseId: string;
      toWarehouseName: string;
      items: StockTransferItem[];
      notes?: string;
    }
  ): { success: boolean; transfer?: StockTransferRecord; error?: string } {
    const idx = this.transfers.findIndex(t => t.id === id);
    if (idx === -1) {
      return { success: false, error: 'إذن الصرف المعلق المطلوب غير موجود.' };
    }

    const record = this.transfers[idx];
    if (record.status !== 'معلق') {
      return {
        success: false,
        error: 'لا يمكن تعديل هذا التحويل لأنه مكتمل بالفعل. التعديل متاح فقط للتحويلات المعلقة.'
      };
    }

    if (!data.fromWarehouseId || !data.toWarehouseId) {
      return { success: false, error: 'يرجى تحديد مخزن المصدر (من) ومخزن الوجهة (إلى).' };
    }

    if (data.fromWarehouseId === data.toWarehouseId) {
      return { success: false, error: 'لا يمكن التحويل من وإلى نفس المخزن. يرجى اختيار مخزنين مختلفين.' };
    }

    if (!data.items || data.items.length === 0) {
      return { success: false, error: 'يرجى إضافة صنف واحد على الأقل لإذن الصرف.' };
    }

    for (const item of data.items) {
      if (!item.quantity || item.quantity <= 0) {
        return { success: false, error: `الكمية المحددة للصنف (${item.productName}) غير صالحة. يجب أن تكون أكبر من الصفر.` };
      }
    }

    const salesState = salesEntryService.getState();
    const products = salesState.products;
    const oldFromWKey = salesEntryService.normalizeWarehouseId(record.fromWarehouseId);
    const newFromWKey = salesEntryService.normalizeWarehouseId(data.fromWarehouseId);

    // Temporarily restore previous deducted quantities to old source warehouse
    record.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p && p.warehouseStocks) {
        p.warehouseStocks[oldFromWKey] = (p.warehouseStocks[oldFromWKey] || 0) + item.quantity;
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    // Validate available stock in the new source warehouse
    for (const item of data.items) {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        const available = this.getProductStockInWarehouse(p, data.fromWarehouseId);
        if (available < item.quantity) {
          // Rollback temporary restoration
          record.items.forEach(oldItem => {
            const op = products.find(prod => prod.id === oldItem.productId || prod.code === oldItem.productCode);
            if (op && op.warehouseStocks) {
              op.warehouseStocks[oldFromWKey] = Math.max(0, (op.warehouseStocks[oldFromWKey] || 0) - oldItem.quantity);
              op.stockQty = Object.values(op.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
            }
          });

          return {
            success: false,
            error: `الرصيد المتاح للصنف (${item.productName}) في مخزن المصدر هو (${available} ${item.unit}) وهو أقل من الكمية المطلوبة (${item.quantity}).`
          };
        }
      }
    }

    // Deduct newly specified quantities from the new source warehouse
    data.items.forEach(item => {
      const p = products.find(prod => prod.id === item.productId || prod.code === item.productCode);
      if (p) {
        if (!p.warehouseStocks) {
          p.warehouseStocks = { 'WH-01': 0, 'WH-02': 0, 'WH-03': 0 };
          const prodWId = salesEntryService.normalizeWarehouseId(p.warehouse);
          p.warehouseStocks[prodWId] = p.stockQty || 0;
        }

        p.warehouseStocks[newFromWKey] = Math.max(0, (p.warehouseStocks[newFromWKey] || 0) - item.quantity);
        p.stockQty = Object.values(p.warehouseStocks).reduce((sum, val) => sum + (val || 0), 0);
      }
    });

    salesEntryService.saveState();

    const totalQty = data.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const updatedRecord: StockTransferRecord = {
      ...record,
      date: data.date || record.date,
      fromWarehouseId: data.fromWarehouseId,
      fromWarehouseName: data.fromWarehouseName,
      toWarehouseId: data.toWarehouseId,
      toWarehouseName: data.toWarehouseName,
      items: data.items.map(it => ({ ...it })),
      totalQuantity: totalQty,
      totalItems: data.items.length,
      notes: data.notes?.trim() || ''
    };

    this.transfers[idx] = updatedRecord;
    this.saveToStorage();

    auditEngine.logAction(
      'STOCK_TRANSFER_UPDATE',
      `تم تعديل إذن الصرف المعلق رقم [${updatedRecord.transferNumber}] (من: ${updatedRecord.fromWarehouseName} إلى: ${updatedRecord.toWarehouseName}) بإجمالي كمية (${totalQty}).`,
      'info'
    );

    notificationEngine.addNotification(
      'تعديل إذن صرف تحويل',
      `تم تحديث بيانات إذن الصرف المعلق [${updatedRecord.transferNumber}] بنجاح وحفظ التعديلات.`,
      'info',
      'MOD-INV'
    );

    return { success: true, transfer: updatedRecord };
  }
}

export const stockTransferService = new StockTransferService();
