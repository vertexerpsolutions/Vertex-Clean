export type CustomerType = 'عميل دائم' | 'عميل عادي' | 'عميل نقدي' | 'Retail' | 'Corporate' | 'VIP' | 'Wholesale';
export type CustomerStatus = 'نشط' | 'غير نشط' | 'محذوف' | 'active' | 'inactive' | 'deleted';

export interface Customer {
  id: string;
  code: string;
  name: string;
  mobile: string;
  type?: CustomerType | string;
  status: CustomerStatus;
  isSystemCashCustomer?: boolean;

  // Additional enterprise financial properties for cross-module integration
  category?: 'Retail' | 'Corporate' | 'VIP' | 'Wholesale' | string;
  balanceDue?: number;
  creditLimit?: number;
  allowCreditSales?: boolean;
  discountRate?: number;
  notes?: string;
  area?: string;
  address?: string;
  specialNumber?: string;
  assignedSeller?: string;
  openingBalance?: number;
  openingBalanceType?: 'مدين' | 'دائن' | '' | 'debit' | 'credit';
  openingBalanceDate?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
}

const STORAGE_KEY = 'VERTEX_CUSTOMER_MASTER_V1';
const CLASSIFICATIONS_STORAGE_KEY = 'VERTEX_CUSTOMER_CLASSIFICATIONS_V1';
const AREAS_STORAGE_KEY = 'VERTEX_CUSTOMER_AREAS_V1';

export const DEFAULT_CUSTOMER_AREAS: string[] = [
  'القاهرة الكبرى',
  'الجيزة والدقي والمهندسين',
  'الإسكندرية والساحل الشمالي',
  'الدلتا (طنطا والمنصورة والزقازيق)',
  'القناة (الإسماعيلية وبورسعيد والسويس)',
  'شمال الصعيد (بني سويف والفيوم والمنيا)',
  'جنوب الصعيد (أسيوط وسوهاج وقنا وأسوان)',
  'منطقة حرة ولوجستية'
];

export const DEFAULT_CUSTOMER_CLASSIFICATIONS: string[] = [
  'عميل توريدات',
  'عميل منظفات',
  'عميل محافظات',
  'عميل جملة وتوزيع',
  'عميل قطاع خاص',
  'عميل جهات حكومية'
];

export const SYSTEM_CASH_CUSTOMER: Customer = {
  id: 'CUST-CASH-001',
  code: 'CUST-CASH-00',
  name: 'عميل نقدي',
  mobile: '01000000000',
  status: 'نشط',
  isSystemCashCustomer: true,
  category: 'Retail',
  balanceDue: 0,
  creditLimit: 0,
  allowCreditSales: false,
  discountRate: 0,
  createdAt: new Date().toISOString()
};

export const INITIAL_CUSTOMERS_SEED: Customer[] = [
  SYSTEM_CASH_CUSTOMER
];

class CustomerService {
  private customers: Customer[] = [];
  private classifications: string[] = [];
  private areas: string[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
    this.loadClassificationsFromStorage();
    this.loadAreasFromStorage();
  }

  private loadAreasFromStorage(): void {
    try {
      const saved = localStorage.getItem(AREAS_STORAGE_KEY);
      if (saved) {
        this.areas = JSON.parse(saved);
      } else {
        this.areas = [...DEFAULT_CUSTOMER_AREAS];
        this.saveAreasToStorage();
      }
    } catch (e) {
      console.error('Failed to load customer areas from storage:', e);
      this.areas = [...DEFAULT_CUSTOMER_AREAS];
    }
  }

  private saveAreasToStorage(): void {
    try {
      localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(this.areas));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save customer areas to storage:', e);
    }
  }

  public getCustomerAreas(): string[] {
    const set = new Set<string>(this.areas);
    this.customers.forEach(c => {
      if (c.area && c.area.trim()) {
        set.add(c.area.trim());
      }
    });
    return Array.from(set);
  }

  public addCustomerArea(name: string): void {
    const trimmed = name.trim();
    if (trimmed && !this.areas.includes(trimmed)) {
      this.areas.push(trimmed);
      this.saveAreasToStorage();
    }
  }

  private loadClassificationsFromStorage(): void {
    try {
      const saved = localStorage.getItem(CLASSIFICATIONS_STORAGE_KEY);
      if (saved) {
        this.classifications = JSON.parse(saved);
      } else {
        this.classifications = [...DEFAULT_CUSTOMER_CLASSIFICATIONS];
        this.saveClassificationsToStorage();
      }
    } catch (e) {
      console.error('Failed to load customer classifications from storage:', e);
      this.classifications = [...DEFAULT_CUSTOMER_CLASSIFICATIONS];
    }
  }

  private saveClassificationsToStorage(): void {
    try {
      localStorage.setItem(CLASSIFICATIONS_STORAGE_KEY, JSON.stringify(this.classifications));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save customer classifications to storage:', e);
    }
  }

  public getCustomerClassifications(): string[] {
    const set = new Set<string>(this.classifications);
    this.customers.forEach(c => {
      if (c.type && c.type.trim() && c.type !== 'عميل نقدي' && c.type !== 'عميل دائم' && c.type !== 'عميل عادي') {
        set.add(c.type.trim());
      }
    });
    return Array.from(set);
  }

  public addCustomerClassification(name: string): void {
    const trimmed = name.trim();
    if (trimmed && !this.classifications.includes(trimmed)) {
      this.classifications.push(trimmed);
      this.saveClassificationsToStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: Customer[] = JSON.parse(saved);
        // Ensure system cash customer exists
        const hasCashCust = parsed.some(c => c.isSystemCashCustomer || c.id === SYSTEM_CASH_CUSTOMER.id || c.name === 'عميل نقدي');
        if (!hasCashCust) {
          parsed.unshift(SYSTEM_CASH_CUSTOMER);
        }
        this.customers = parsed;
      } else {
        this.customers = [...INITIAL_CUSTOMERS_SEED];
        this.saveToStorage();
      }
    } catch (e) {
      console.error('Failed to load customer master from storage:', e);
      this.customers = [...INITIAL_CUSTOMERS_SEED];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customers));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save customer master to storage:', e);
    }
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
    this.loadClassificationsFromStorage();
    this.loadAreasFromStorage();
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }

  public getAllCustomers(): Customer[] {
    return [...this.customers];
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.customers.find(c => c.id === id);
  }

  public getCustomerByCode(code: string): Customer | undefined {
    return this.customers.find(c => c.code.trim().toLowerCase() === code.trim().toLowerCase());
  }

  public getSystemCashCustomer(): Customer {
    const found = this.customers.find(c => c.isSystemCashCustomer || c.id === SYSTEM_CASH_CUSTOMER.id || c.name === 'عميل نقدي');
    return found || SYSTEM_CASH_CUSTOMER;
  }

  public generateUniqueCustomerCode(): string {
    const year = new Date().getFullYear();
    let counter = 1;
    let candidate = `CUST-${year}-${String(counter).padStart(4, '0')}`;

    const existingCodes = new Set(this.customers.map(c => c.code.trim().toLowerCase()));

    while (existingCodes.has(candidate.toLowerCase())) {
      counter++;
      candidate = `CUST-${year}-${String(counter).padStart(4, '0')}`;
    }

    return candidate;
  }

  public getSellersList(): string[] {
    const sellers = new Set<string>();
    try {
      const stored = localStorage.getItem('VERTEX_SELLER_MASTER_V1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((s: any) => {
            if ((s.status === 'نشط' || s.status === 'active') && s.name && s.name.trim()) {
              sellers.add(s.name.trim());
            }
          });
        }
      }
    } catch {
      // ignore
    }
    this.customers.forEach(c => {
      if (c.assignedSeller && c.assignedSeller.trim()) {
        sellers.add(c.assignedSeller.trim());
      }
    });
    return Array.from(sellers);
  }

  public checkDuplicateSpecialNumber(
    specialNumber?: string,
    excludeCustomerId?: string
  ): boolean {
    if (!specialNumber) return false;
    const cleanNum = specialNumber.trim();
    if (!cleanNum) return false;

    for (const cust of this.customers) {
      if (excludeCustomerId && cust.id === excludeCustomerId) {
        continue;
      }
      if (cust.status === 'محذوف' || cust.status === 'deleted') {
        continue;
      }
      if (cust.specialNumber && cust.specialNumber.trim() === cleanNum) {
        return true;
      }
    }
    return false;
  }

  public checkDuplicateCustomer(
    name: string,
    mobile?: string,
    excludeCustomerId?: string
  ): { isNameDuplicate: boolean; isPhoneDuplicate: boolean } {
    const normName = name ? name.trim().toLowerCase() : '';
    const normPhone = mobile ? mobile.replace(/[\s\-\(\)\+\.]/g, '').toLowerCase() : '';

    let isNameDuplicate = false;
    let isPhoneDuplicate = false;

    for (const cust of this.customers) {
      if (excludeCustomerId && cust.id === excludeCustomerId) {
        continue;
      }
      if (cust.status === 'محذوف' || cust.status === 'deleted') {
        continue;
      }

      if (normName && cust.name.trim().toLowerCase() === normName) {
        isNameDuplicate = true;
      }

      if (normPhone) {
        const existingNormPhone = cust.mobile ? cust.mobile.replace(/[\s\-\(\)\+\.]/g, '').toLowerCase() : '';
        if (existingNormPhone && existingNormPhone === normPhone) {
          isPhoneDuplicate = true;
        }
      }
    }

    return { isNameDuplicate, isPhoneDuplicate };
  }

  public addCustomer(data: {
    code?: string;
    name: string;
    mobile?: string;
    type?: CustomerType | string;
    status?: CustomerStatus;
    notes?: string;
    area?: string;
    address?: string;
    specialNumber?: string;
    category?: 'Retail' | 'Corporate' | 'VIP' | 'Wholesale';
    creditLimit?: number;
    allowCreditSales?: boolean;
    discountRate?: number;
    assignedSeller?: string;
    openingBalance?: number;
    openingBalanceType?: 'مدين' | 'دائن' | '' | 'debit' | 'credit';
    openingBalanceDate?: string;
  }): { success: boolean; customer?: Customer; error?: string } {
    // 1. Validation: Name is required
    const nameTrimmed = data.name ? data.name.trim() : '';
    if (!nameTrimmed) {
      return { success: false, error: 'اسم العميل مطلوب ولا يمكن أن يكون فارغاً' };
    }

    // 1b. Validation: Duplicate Check
    const { isNameDuplicate, isPhoneDuplicate } = this.checkDuplicateCustomer(nameTrimmed, data.mobile);
    if (isNameDuplicate && isPhoneDuplicate) {
      return { success: false, error: 'لا يمكن إنشاء العميل: اسم العميل ورقم الهاتف مستخدمان بالفعل.' };
    }
    if (isNameDuplicate) {
      return { success: false, error: 'لا يمكن إنشاء العميل: اسم العميل موجود بالفعل.' };
    }
    if (isPhoneDuplicate) {
      return { success: false, error: 'لا يمكن إنشاء العميل: رقم الهاتف مستخدم بالفعل.' };
    }

    // 1c. Validation: Special Number Duplicate Check
    const cleanSpecialNumber = data.specialNumber ? data.specialNumber.trim() : '';
    if (cleanSpecialNumber) {
      if (this.checkDuplicateSpecialNumber(cleanSpecialNumber)) {
        return { success: false, error: 'رقم خاص للعميل مستخدم بالفعل.' };
      }
    }

    // 2. Determine and validate unique customer code
    let finalCode = data.code ? data.code.trim() : '';
    if (!finalCode) {
      finalCode = this.generateUniqueCustomerCode();
    } else {
      // Check code uniqueness
      const existing = this.getCustomerByCode(finalCode);
      if (existing) {
        return { success: false, error: `كود العميل (${finalCode}) مستخدم بالفعل لعميل آخر` };
      }
    }

    // 3. Create customer record
    const creditLimitVal = data.creditLimit !== undefined && data.creditLimit >= 0 ? data.creditLimit : 0;
    const allowCreditSalesVal = data.allowCreditSales ?? false;
    const openingBalVal = data.openingBalance !== undefined && !isNaN(data.openingBalance) ? data.openingBalance : 0;

    const newCustomer: Customer = {
      id: `CUST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: finalCode,
      name: nameTrimmed,
      mobile: data.mobile ? data.mobile.trim() : '',
      type: data.type || undefined,
      status: data.status || 'نشط',
      isSystemCashCustomer: false,
      category: data.category || 'Retail',
      balanceDue: data.openingBalanceType === 'دائن' || data.openingBalanceType === 'credit' ? -openingBalVal : openingBalVal,
      creditLimit: creditLimitVal,
      allowCreditSales: allowCreditSalesVal,
      discountRate: data.discountRate !== undefined && !isNaN(data.discountRate) ? Math.max(0, data.discountRate) : 0,
      notes: data.notes || '',
      area: data.area || undefined,
      address: data.address || undefined,
      specialNumber: data.specialNumber ? data.specialNumber.trim() : undefined,
      assignedSeller: data.assignedSeller || undefined,
      openingBalance: data.openingBalance,
      openingBalanceType: data.openingBalanceType || undefined,
      openingBalanceDate: data.openingBalanceDate || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.customers.unshift(newCustomer);
    this.saveToStorage();

    return { success: true, customer: newCustomer };
  }

  public updateCustomer(
    id: string,
    updates: {
      name?: string;
      mobile?: string;
      type?: CustomerType | string;
      status?: CustomerStatus;
      notes?: string;
      area?: string;
      address?: string;
      specialNumber?: string;
      category?: 'Retail' | 'Corporate' | 'VIP' | 'Wholesale';
      balanceDue?: number;
      creditLimit?: number;
      allowCreditSales?: boolean;
      discountRate?: number;
      assignedSeller?: string;
      openingBalance?: number;
      openingBalanceType?: 'مدين' | 'دائن' | '' | 'debit' | 'credit';
      openingBalanceDate?: string;
    }
  ): { success: boolean; customer?: Customer; error?: string } {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx === -1) {
      return { success: false, error: 'سجل العميل غير موجود' };
    }

    const current = this.customers[idx];

    // System cash customer protection
    if (current.isSystemCashCustomer) {
      if (updates.status === 'غير نشط' || updates.status === 'inactive' || updates.status === 'محذوف' || updates.status === 'deleted') {
        return { success: false, error: 'لا يمكن تعطيل أو حذف العميل النقدي النظامي' };
      }
    }

    // Protection against reactivating or changing status of logically deleted customers
    if (current.status === 'محذوف' || current.status === 'deleted') {
      if (updates.status && updates.status !== 'محذوف' && updates.status !== 'deleted') {
        return { success: false, error: 'لا يمكن إعادة تفعيل أو تغيير حالة عميل محذوف منطقياً' };
      }
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      const nameTrimmed = updates.name.trim();
      if (!nameTrimmed) {
        return { success: false, error: 'اسم العميل مطلوب ولا يمكن أن يكون فارغاً' };
      }
    }

    // Duplicate Check for update
    const targetName = updates.name !== undefined ? updates.name.trim() : current.name;
    const targetMobile = updates.mobile !== undefined ? updates.mobile.trim() : current.mobile;

    const { isNameDuplicate, isPhoneDuplicate } = this.checkDuplicateCustomer(targetName, targetMobile, id);
    if (isNameDuplicate && isPhoneDuplicate) {
      return { success: false, error: 'لا يمكن حفظ التعديلات: اسم العميل ورقم الهاتف مستخدمان بالفعل لعميل آخر.' };
    }
    if (isNameDuplicate) {
      return { success: false, error: 'لا يمكن حفظ التعديلات: اسم العميل موجود بالفعل لعميل آخر.' };
    }
    if (isPhoneDuplicate) {
      return { success: false, error: 'لا يمكن حفظ التعديلات: رقم الهاتف مستخدم بالفعل لعميل آخر.' };
    }

    // Special Number Duplicate Check for update
    if (updates.specialNumber !== undefined) {
      const cleanSpecialNumber = updates.specialNumber.trim();
      if (cleanSpecialNumber) {
        if (this.checkDuplicateSpecialNumber(cleanSpecialNumber, id)) {
          return { success: false, error: 'رقم خاص للعميل مستخدم بالفعل.' };
        }
      }
    }

    // Update fields without creating duplicates or modifying code automatically
    const updatedCustomer: Customer = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      mobile: updates.mobile !== undefined ? updates.mobile.trim() : current.mobile,
      type: updates.type !== undefined ? updates.type : current.type,
      status: updates.status !== undefined ? updates.status : current.status,
      notes: updates.notes !== undefined ? updates.notes : current.notes,
      area: updates.area !== undefined ? updates.area : current.area,
      address: updates.address !== undefined ? updates.address : current.address,
      specialNumber: updates.specialNumber !== undefined ? (updates.specialNumber.trim() || undefined) : current.specialNumber,
      category: updates.category !== undefined ? updates.category : current.category,
      balanceDue: updates.balanceDue !== undefined ? Math.max(0, updates.balanceDue) : (current.balanceDue ?? 0),
      creditLimit: updates.creditLimit !== undefined ? Math.max(0, updates.creditLimit) : (current.creditLimit ?? 0),
      allowCreditSales: updates.allowCreditSales !== undefined ? updates.allowCreditSales : (current.allowCreditSales ?? false),
      discountRate: updates.discountRate !== undefined ? (isNaN(updates.discountRate) ? 0 : Math.max(0, updates.discountRate)) : current.discountRate,
      assignedSeller: updates.assignedSeller !== undefined ? updates.assignedSeller : current.assignedSeller,
      openingBalance: updates.openingBalance !== undefined ? updates.openingBalance : current.openingBalance,
      openingBalanceType: updates.openingBalanceType !== undefined ? updates.openingBalanceType : current.openingBalanceType,
      openingBalanceDate: updates.openingBalanceDate !== undefined ? updates.openingBalanceDate : current.openingBalanceDate,
      updatedAt: new Date().toISOString()
    };

    this.customers[idx] = updatedCustomer;
    this.saveToStorage();

    return { success: true, customer: updatedCustomer };
  }

  public getCustomerInvoiceCount(customerId: string, customerCode?: string): number {
    try {
      const rawSales = localStorage.getItem('VERTEX_VGF06_SALES_ENTRY');
      if (!rawSales) return 0;
      const parsed = JSON.parse(rawSales);
      const completed = parsed.completedInvoices || [];
      const open = parsed.openInvoices || [];
      let count = 0;
      for (const inv of [...completed, ...open]) {
        if (
          inv.customerId === customerId ||
          (customerCode && inv.customerId && inv.customerId.toLowerCase() === customerCode.toLowerCase())
        ) {
          count++;
        }
      }
      return count;
    } catch (e) {
      return 0;
    }
  }

  public hasCustomerTransactions(customer: Customer): boolean {
    if (!customer) return false;
    // Check non-zero balance
    if (Math.abs(customer.balanceDue || 0) > 0.001) {
      return true;
    }
    // Check invoices in sales entry storage
    const invCount = this.getCustomerInvoiceCount(customer.id, customer.code);
    return invCount > 0;
  }

  /**
   * Retrieves outstanding indebtedness from customer statement / transaction ledger:
   * Net deferred sales from completed invoices - deferred sales returns
   */
  public getCustomerStatementDebt(customerId?: string, customerCode?: string): number {
    if (!customerId && !customerCode) return 0;
    let statementDebt = 0;
    let foundInvoices = false;

    // 1. Completed sales invoices (deferred portions)
    try {
      const rawSales = localStorage.getItem('VERTEX_VGF06_SALES_ENTRY');
      if (rawSales) {
        const parsed = JSON.parse(rawSales);
        const completed = (parsed.completedInvoices || []) as any[];
        for (const inv of completed) {
          if (
            inv.status !== 'cancelled' &&
            (
              (customerId && inv.customerId === customerId) ||
              (customerCode && inv.customerId && inv.customerId.toLowerCase() === customerCode.toLowerCase())
            )
          ) {
            foundInvoices = true;
            const deferred = inv.deferredPaid !== undefined
              ? inv.deferredPaid
              : (inv.paymentMethod === 'deferred' ? (inv.grandTotal || 0) : 0);
            statementDebt += (deferred || 0);
          }
        }
      }
    } catch (e) {
      console.error('Error calculating customer statement debt from sales entry:', e);
    }

    // 2. Sales returns (deferred refunds deducting debt)
    try {
      const rawReturns = localStorage.getItem('sales_returns_records_v1');
      if (rawReturns) {
        const parsedReturns = JSON.parse(rawReturns) as any[];
        for (const ret of parsedReturns) {
          if (
            ret.status === 'approved' &&
            (
              (customerId && ret.customerId === customerId) ||
              (customerCode && ret.customerId && ret.customerId.toLowerCase() === customerCode.toLowerCase())
            )
          ) {
            if (ret.refundMethod === 'deferred') {
              statementDebt -= (ret.netReturnTotal || 0);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error calculating customer statement debt from returns:', e);
    }

    // 3. Treasury Income / Disbursement Transactions (سندات القبض والصرف)
    try {
      const rawTx = localStorage.getItem('VERTEX_INCOME_TRANSACTIONS_V1');
      if (rawTx) {
        const txList = JSON.parse(rawTx) as any[];
        for (const tx of txList) {
          if (tx.status === 'ملغي') continue;
          let customerTxAmount = 0;
          if (tx.lines && Array.isArray(tx.lines)) {
            for (const l of tx.lines) {
              if (
                (l.accountType === 'customers' || tx.accountType === 'customers') &&
                (
                  (customerId && l.accountId === customerId) ||
                  (customerCode && (l.accountCode === customerCode || l.accountId === customerCode))
                )
              ) {
                customerTxAmount += (Number(l.amount) || 0);
              }
            }
          } else if (
            tx.accountType === 'customers' &&
            (
              (customerId && tx.accountId === customerId) ||
              (customerCode && (tx.accountCode === customerCode || tx.accountId === customerCode))
            )
          ) {
            customerTxAmount += (Number(tx.amount) || 0);
          }

          if (customerTxAmount > 0) {
            foundInvoices = true;
            if (tx.type === 'inward') {
              // وارد خزينة = سند قبض من العميل (يقلل مديونيته)
              statementDebt -= customerTxAmount;
            } else if (tx.type === 'outward') {
              // صادر خزينة = سند صرف للعميل (يزيد رصيده / مديونيته)
              statementDebt += customerTxAmount;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error calculating customer statement debt from income transactions:', e);
    }

    // 4. If no specific invoices or treasury transactions are recorded yet, check pre-seeded balanceDue
    if (!foundInvoices && customerId) {
      const cust = this.getCustomerById(customerId);
      if (cust && cust.balanceDue) {
        const opening = cust.openingBalance || 0;
        // If balanceDue includes or differs from opening balance, take the non-opening transaction part or balanceDue
        return Math.max(0, cust.balanceDue > opening ? cust.balanceDue - opening : cust.balanceDue);
      }
    }

    return Math.max(0, statementDebt);
  }

  /**
   * Calculates real actual customer balance:
   * Real Actual Balance = Opening Balance (رصيد أول المدة) + Statement Debt (مديونية كشف الحساب)
   */
  public getCustomerActualBalance(
    customerOrId?: Customer | string,
    overrideOpeningBalance?: number
  ): {
    openingBalance: number;
    statementDebt: number;
    actualBalance: number;
    creditLimit: number;
    availableCredit: number;
    isLimitExceeded: boolean;
  } {
    let cust: Customer | undefined;
    if (typeof customerOrId === 'string') {
      cust = this.getCustomerById(customerOrId);
    } else if (customerOrId) {
      cust = customerOrId;
    }

    const openingBalance = overrideOpeningBalance !== undefined
      ? overrideOpeningBalance
      : (cust?.openingBalance || 0);

    const statementDebt = cust ? this.getCustomerStatementDebt(cust.id, cust.code) : 0;
    const actualBalance = openingBalance + statementDebt;
    const creditLimit = cust?.creditLimit || 0;
    const hasCreditLimit = creditLimit > 0;
    const availableCredit = hasCreditLimit ? Math.max(0, creditLimit - actualBalance) : 999999999;
    const isLimitExceeded = hasCreditLimit ? actualBalance > creditLimit : false;

    return {
      openingBalance,
      statementDebt,
      actualBalance,
      creditLimit,
      availableCredit,
      isLimitExceeded
    };
  }

  /**
   * Calculates real available credit for a customer based on:
   * Available Credit = Credit Limit - Real Actual Balance
   */
  public getCustomerAvailableCredit(customerOrId: Customer | string): {
    creditLimit: number;
    currentOutstanding: number;
    availableCredit: number;
    isLimitExceeded: boolean;
    isLimitReached: boolean;
    allowCreditSales: boolean;
  } {
    const cust = typeof customerOrId === 'string'
      ? this.getCustomerById(customerOrId)
      : customerOrId;

    const creditLimit = cust?.creditLimit || 0;
    const allowCreditSales = cust?.allowCreditSales ?? false;

    const calc = this.getCustomerActualBalance(cust);
    const currentOutstanding = calc.actualBalance;

    // Available Credit = Credit Limit - Current Outstanding (if creditLimit > 0)
    // If creditLimit === 0 (or not set), customer has NO credit limit ceiling
    const hasCreditLimit = creditLimit > 0;
    const availableCredit = hasCreditLimit ? Math.max(0, creditLimit - currentOutstanding) : 999999999;
    const isLimitExceeded = hasCreditLimit ? currentOutstanding > creditLimit : false;
    const isLimitReached = hasCreditLimit ? currentOutstanding >= creditLimit : false;

    return {
      creditLimit,
      currentOutstanding,
      availableCredit,
      isLimitExceeded,
      isLimitReached,
      allowCreditSales
    };
  }

  public deleteCustomerLogically(
    id: string,
    deletedByUsername?: string
  ): { success: boolean; customer?: Customer; error?: string } {
    const idx = this.customers.findIndex(c => c.id === id);
    if (idx === -1) {
      return { success: false, error: 'سجل العميل غير موجود' };
    }

    const current = this.customers[idx];

    // System cash customer protection
    if (current.isSystemCashCustomer) {
      return { success: false, error: 'العميل النقدي النظامي محمي ولا يمكن حذفه' };
    }

    // Check historical transactions
    if (this.hasCustomerTransactions(current)) {
      return {
        success: false,
        error: 'لا يمكن حذف هذا العميل لوجود فواتير أو تعاملات سابقة مرتبطة به. يجب الاحتفاظ بالعميل للحفاظ على السجل التاريخي.'
      };
    }

    // Set status to 'محذوف'
    const updatedCustomer: Customer = {
      ...current,
      status: 'محذوف',
      deletedAt: new Date().toISOString(),
      deletedBy: deletedByUsername || 'SUPER_ADMIN',
      updatedAt: new Date().toISOString()
    };

    this.customers[idx] = updatedCustomer;
    this.saveToStorage();

    return { success: true, customer: updatedCustomer };
  }

  public toggleCustomerStatus(id: string): { success: boolean; customer?: Customer; error?: string } {
    const target = this.getCustomerById(id);
    if (!target) {
      return { success: false, error: 'سجل العميل غير موجود' };
    }

    if (target.isSystemCashCustomer) {
      return { success: false, error: 'لا يمكن تعطيل العميل النقدي النظامي' };
    }

    if (target.status === 'محذوف' || target.status === 'deleted') {
      return { success: false, error: 'لا يمكن إعادة تفعيل عميل محذوف منطقياً' };
    }

    const newStatus: CustomerStatus = (target.status === 'نشط' || target.status === 'active') ? 'غير نشط' : 'نشط';
    return this.updateCustomer(id, { status: newStatus });
  }

  public isCustomerActive(customerOrId: Customer | string | undefined | null): boolean {
    if (!customerOrId) return false;
    const cust = typeof customerOrId === 'string' ? this.getCustomerById(customerOrId) : customerOrId;
    if (!cust) return false;
    if (cust.isSystemCashCustomer || cust.id === 'CUST-CASH-001') return true;
    return cust.status === 'نشط' || cust.status === 'active';
  }

  public filterCustomers(params: {
    searchTerm?: string;
    type?: string;
    status?: string;
  }): Customer[] {
    return this.customers.filter(c => {
      // Hide deleted customers unless explicitly requested via status === 'deleted' or 'محذوف'
      if (c.status === 'محذوف' || c.status === 'deleted') {
        if (params.status !== 'deleted' && params.status !== 'محذوف') {
          return false;
        }
      }

      // Search term matching code, name, mobile, or specialNumber
      if (params.searchTerm && params.searchTerm.trim() !== '') {
        const q = params.searchTerm.trim().toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(q);
        const nameMatch = c.name.toLowerCase().includes(q);
        const mobileMatch = c.mobile.toLowerCase().includes(q);
        const specialMatch = c.specialNumber ? c.specialNumber.toLowerCase().includes(q) : false;
        if (!codeMatch && !nameMatch && !mobileMatch && !specialMatch) {
          return false;
        }
      }

      // Filter by Type
      if (params.type && params.type !== 'all') {
        if (c.type !== params.type) return false;
      }

      // Filter by Status
      if (params.status && params.status !== 'all') {
        if (params.status === 'active' && c.status !== 'نشط' && c.status !== 'active') return false;
        if (params.status === 'inactive' && c.status !== 'غير نشط' && c.status !== 'inactive') return false;
        if ((params.status === 'deleted' || params.status === 'محذوف') && c.status !== 'محذوف' && c.status !== 'deleted') return false;
      }

      return true;
    });
  }
}

export const customerService = new CustomerService();
