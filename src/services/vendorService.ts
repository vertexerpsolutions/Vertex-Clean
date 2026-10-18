export type VendorType = 'مورد مواد خام' | 'مورد قطع غيار' | 'مورد خدمات ولوجستيات' | 'مورد تعبئة وتغليف' | 'مورد تكنولوجيا' | 'مورد رئيسي' | 'مورد عام';
export type VendorStatus = 'نشط' | 'غير نشط' | 'محذوف' | 'active' | 'inactive' | 'deleted';
export type VendorCategory = 'Local' | 'Import' | 'Primary' | 'Corporate' | 'Wholesale';

export interface Vendor {
  id: string;
  code: string;
  name: string;
  mobile: string;
  phone2?: string;
  type?: VendorType | string;
  status: VendorStatus;
  isSystemCashVendor?: boolean;

  // Enterprise financial & procurement properties
  category?: VendorCategory;
  taxNumber?: string;
  commercialRegister?: string;
  balanceDue?: number; // Positive = Payable to vendor (دائن), Negative = Advance paid (مدين)
  creditLimit?: number; // Credit limit granted by vendor
  allowCreditPurchases?: boolean;
  paymentTerms?: string; // e.g., 'نقدي فور التوريد', 'آجل 30 يوم', 'آجل 60 يوم', 'آجل 90 يوم'
  discountRate?: number; // Standard purchase discount percentage %
  notes?: string;
  area?: string;
  address?: string;
  specialNumber?: string;
  assignedPurchaser?: string; // Procurement Officer / مسؤول المشتريات
  openingBalance?: number;
  openingBalanceType?: 'دائن' | 'مدين' | '' | 'credit' | 'debit';
  openingBalanceDate?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
}

const STORAGE_KEY = 'VERTEX_VENDOR_MASTER_V1';
const CLASSIFICATIONS_STORAGE_KEY = 'VERTEX_VENDOR_CLASSIFICATIONS_V1';
const AREAS_STORAGE_KEY = 'VERTEX_VENDOR_AREAS_V1';

export const DEFAULT_VENDOR_AREAS: string[] = [
  'القاهرة الكبرى والمنطقة الصناعية (العاشر من رمضان)',
  'السادس من أكتوبر والشيخ زايد',
  'برج العرب والمنطقة الحرة بالإسكندرية',
  'مدينة السادات والمنوفية الصناعية',
  'العين السخنة ومنطقة قناة السويس الاقتصادية',
  'الدلتا ووسط الدلتا (المحلة وطنطا)',
  'صعيد مصر والمناطق الصناعية (بني سويف وأسيوط)',
  'مورد دولي / استيراد خارجي'
];

export const DEFAULT_VENDOR_CLASSIFICATIONS: string[] = [
  'مورد مواد خام وإنتاج',
  'مورد قطع غيار ومعدات',
  'مورد تعبئة وتغليف',
  'مورد خدمات وصيانة ولوجستيات',
  'مورد تكنولوجيا وبرمجيات',
  'مورد أدوات ومستهلكات تشغيل',
  'مورد بضائع تامة الصنع'
];

export const DEFAULT_PURCHASERS: string[] = [
  'م. أحمد فؤاد (مدير المشتريات)',
  'أ. سامح عبد العزيز (مسؤول مشتريات الخامات)',
  'أ. محمود عبد الرحمن (مسؤول مشتريات التعبئة)',
  'م. طارق كمال (مشتريات المعدات وقطع الغيار)',
  'أ. هاني سليم (مشتريات الخدمات واللوجستيات)'
];

export const DEFAULT_PAYMENT_TERMS: string[] = [
  'نقدي فور الاستلام (COD)',
  'آجل 15 يوم من الفاتورة',
  'آجل 30 يوم من الفاتورة',
  'آجل 45 يوم من الفاتورة',
  'آجل 60 يوم من الفاتورة',
  'آجل 90 يوم من الفاتورة',
  'دفعة مقدمة 50% والباقي عند التوريد'
];

export const SYSTEM_CASH_VENDOR: Vendor = {
  id: 'VEND-CASH-001',
  code: 'VEND-CASH-00',
  name: 'مورد نقدي عام',
  mobile: '01000000000',
  status: 'نشط',
  isSystemCashVendor: true,
  category: 'Local',
  balanceDue: 0,
  creditLimit: 0,
  allowCreditPurchases: false,
  paymentTerms: 'نقدي فور الاستلام (COD)',
  discountRate: 0,
  createdAt: new Date().toISOString()
};

export const INITIAL_VENDORS_SEED: Vendor[] = [
  SYSTEM_CASH_VENDOR
];

class VendorService {
  private vendors: Vendor[] = [];
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
        this.areas = [...DEFAULT_VENDOR_AREAS];
        this.saveAreasToStorage();
      }
    } catch (e) {
      console.error('Failed to load vendor areas from storage:', e);
      this.areas = [...DEFAULT_VENDOR_AREAS];
    }
  }

  private saveAreasToStorage(): void {
    try {
      localStorage.setItem(AREAS_STORAGE_KEY, JSON.stringify(this.areas));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save vendor areas to storage:', e);
    }
  }

  public getVendorAreas(): string[] {
    const set = new Set<string>(this.areas);
    this.vendors.forEach(v => {
      if (v.area && v.area.trim()) {
        set.add(v.area.trim());
      }
    });
    return Array.from(set);
  }

  public addVendorArea(name: string): void {
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
        this.classifications = [...DEFAULT_VENDOR_CLASSIFICATIONS];
        this.saveClassificationsToStorage();
      }
    } catch (e) {
      console.error('Failed to load vendor classifications from storage:', e);
      this.classifications = [...DEFAULT_VENDOR_CLASSIFICATIONS];
    }
  }

  private saveClassificationsToStorage(): void {
    try {
      localStorage.setItem(CLASSIFICATIONS_STORAGE_KEY, JSON.stringify(this.classifications));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save vendor classifications to storage:', e);
    }
  }

  public getVendorClassifications(): string[] {
    const set = new Set<string>(this.classifications);
    this.vendors.forEach(v => {
      if (v.type && v.type.trim()) {
        set.add(v.type.trim());
      }
    });
    return Array.from(set);
  }

  public addVendorClassification(name: string): void {
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
        const parsed: Vendor[] = JSON.parse(saved);
        const hasCashVend = parsed.some(v => v.isSystemCashVendor || v.id === SYSTEM_CASH_VENDOR.id || v.id === 'VEND-CASH' || v.code === SYSTEM_CASH_VENDOR.code);
        if (!hasCashVend) {
          parsed.unshift(SYSTEM_CASH_VENDOR);
        }
        this.vendors = parsed;
      } else {
        this.vendors = [...INITIAL_VENDORS_SEED];
        this.saveToStorage();
      }
    } catch (e) {
      console.error('Failed to load vendors from storage:', e);
      this.vendors = [...INITIAL_VENDORS_SEED];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.vendors));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save vendors to storage:', e);
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

  public getAllVendors(includeDeleted: boolean = false): Vendor[] {
    if (includeDeleted) {
      return [...this.vendors];
    }
    return this.vendors.filter(v => v.status !== 'محذوف' && v.status !== 'deleted');
  }

  public getActiveVendors(): Vendor[] {
    return this.vendors.filter(v => v.status === 'نشط' || v.status === 'active');
  }

  public isVendorActive(vendorOrId: Vendor | string): boolean {
    if (typeof vendorOrId === 'string') {
      const v = this.getVendorById(vendorOrId);
      if (!v) return false;
      return v.status === 'نشط' || v.status === 'active';
    }
    return vendorOrId.status === 'نشط' || vendorOrId.status === 'active';
  }

  public getVendorById(id: string): Vendor | undefined {
    return this.vendors.find(v => v.id === id || (id === 'VEND-CASH' && (v.id === SYSTEM_CASH_VENDOR.id || v.isSystemCashVendor)));
  }

  public getSystemCashVendor(): Vendor {
    const found = this.vendors.find(v => v.isSystemCashVendor || v.id === SYSTEM_CASH_VENDOR.id || v.id === 'VEND-CASH' || v.code === SYSTEM_CASH_VENDOR.code);
    return found || SYSTEM_CASH_VENDOR;
  }

  public getVendorByCode(code: string): Vendor | undefined {
    const norm = code.trim().toUpperCase();
    return this.vendors.find(v => v.code.toUpperCase() === norm);
  }

  public generateUniqueVendorCode(): string {
    const year = new Date().getFullYear();
    const prefix = `VEND-${year}-`;
    
    let maxNum = 0;
    for (const v of this.vendors) {
      if (v.code && v.code.startsWith(prefix)) {
        const numPart = v.code.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(4, '0')}`;
  }

  public getPurchasersList(): string[] {
    const purchasers = new Set<string>(DEFAULT_PURCHASERS);
    this.vendors.forEach(v => {
      if (v.assignedPurchaser && v.assignedPurchaser.trim()) {
        purchasers.add(v.assignedPurchaser.trim());
      }
    });
    return Array.from(purchasers);
  }

  public getPaymentTermsList(): string[] {
    return [...DEFAULT_PAYMENT_TERMS];
  }

  public checkDuplicateTaxNumber(
    taxNumber?: string,
    excludeVendorId?: string
  ): boolean {
    if (!taxNumber) return false;
    const cleanTax = taxNumber.trim().replace(/[\s\-\.]/g, '');
    if (!cleanTax) return false;

    for (const vend of this.vendors) {
      if (excludeVendorId && vend.id === excludeVendorId) continue;
      if (vend.status === 'محذوف' || vend.status === 'deleted') continue;
      if (vend.taxNumber) {
        const existingTax = vend.taxNumber.trim().replace(/[\s\-\.]/g, '');
        if (existingTax && existingTax === cleanTax) {
          return true;
        }
      }
    }
    return false;
  }

  public checkDuplicateCommercialRegister(
    commercialRegister?: string,
    excludeVendorId?: string
  ): boolean {
    if (!commercialRegister) return false;
    const cleanCR = commercialRegister.trim().replace(/[\s\-\.]/g, '');
    if (!cleanCR) return false;

    for (const vend of this.vendors) {
      if (excludeVendorId && vend.id === excludeVendorId) continue;
      if (vend.status === 'محذوف' || vend.status === 'deleted') continue;
      if (vend.commercialRegister) {
        const existingCR = vend.commercialRegister.trim().replace(/[\s\-\.]/g, '');
        if (existingCR && existingCR === cleanCR) {
          return true;
        }
      }
    }
    return false;
  }

  public checkDuplicateVendor(
    name: string,
    mobile?: string,
    excludeVendorId?: string
  ): { isNameDuplicate: boolean; isPhoneDuplicate: boolean } {
    const normName = name ? name.trim().toLowerCase() : '';
    const normPhone = mobile ? mobile.replace(/[\s\-\(\)\+\.]/g, '').toLowerCase() : '';

    let isNameDuplicate = false;
    let isPhoneDuplicate = false;

    for (const vend of this.vendors) {
      if (excludeVendorId && vend.id === excludeVendorId) continue;
      if (vend.status === 'محذوف' || vend.status === 'deleted') continue;

      if (normName && vend.name.trim().toLowerCase() === normName) {
        isNameDuplicate = true;
      }

      if (normPhone) {
        const existingPhone = vend.mobile ? vend.mobile.replace(/[\s\-\(\)\+\.]/g, '').toLowerCase() : '';
        if (existingPhone && existingPhone === normPhone) {
          isPhoneDuplicate = true;
        }
      }
    }

    return { isNameDuplicate, isPhoneDuplicate };
  }

  public addVendor(data: {
    code?: string;
    name: string;
    mobile?: string;
    phone2?: string;
    type?: VendorType | string;
    status?: VendorStatus;
    category?: VendorCategory;
    taxNumber?: string;
    commercialRegister?: string;
    creditLimit?: number;
    allowCreditPurchases?: boolean;
    paymentTerms?: string;
    discountRate?: number;
    assignedPurchaser?: string;
    notes?: string;
    area?: string;
    address?: string;
    specialNumber?: string;
    openingBalance?: number;
    openingBalanceType?: 'دائن' | 'مدين' | '' | 'credit' | 'debit';
    openingBalanceDate?: string;
  }): { success: boolean; vendor?: Vendor; error?: string } {
    // 1. Validation: Name is required
    const nameTrimmed = data.name ? data.name.trim() : '';
    if (!nameTrimmed) {
      return { success: false, error: 'اسم المورد مطلوب ولا يمكن أن يكون فارغاً' };
    }

    // 1b. Duplicate validation
    const { isNameDuplicate, isPhoneDuplicate } = this.checkDuplicateVendor(nameTrimmed, data.mobile);
    if (isNameDuplicate && isPhoneDuplicate) {
      return { success: false, error: 'لا يمكن إنشاء المورد: اسم المورد ورقم الهاتف مسجلان بالفعل لمورد آخر.' };
    }
    if (isNameDuplicate) {
      return { success: false, error: 'لا يمكن إنشاء المورد: اسم المورد موجود بالفعل في سجلات الموردين.' };
    }
    if (isPhoneDuplicate) {
      return { success: false, error: 'لا يمكن إنشاء المورد: رقم الهاتف مسجل بالفعل لمورد آخر.' };
    }

    // 1c. Tax Number duplicate check
    if (data.taxNumber && this.checkDuplicateTaxNumber(data.taxNumber)) {
      return { success: false, error: 'الرقم الضريبي المدخل مسجل بالفعل لمورد آخر.' };
    }

    // 1d. Commercial Register duplicate check
    if (data.commercialRegister && this.checkDuplicateCommercialRegister(data.commercialRegister)) {
      return { success: false, error: 'السجل التجاري المدخل مسجل بالفعل لمورد آخر.' };
    }

    // 2. Code generation & check
    let finalCode = data.code ? data.code.trim() : '';
    if (!finalCode) {
      finalCode = this.generateUniqueVendorCode();
    } else {
      const existing = this.getVendorByCode(finalCode);
      if (existing) {
        return { success: false, error: `كود المورد (${finalCode}) مستخدم بالفعل لمورد آخر` };
      }
    }

    const creditLimitVal = data.creditLimit !== undefined && data.creditLimit >= 0 ? data.creditLimit : 0;
    const allowCreditVal = data.allowCreditPurchases ?? false;
    const openingBalVal = data.openingBalance !== undefined && !isNaN(data.openingBalance) ? data.openingBalance : 0;

    // For vendors: 'دائن' (Credit) means company owes vendor money (+ payable), 'مدين' (Debit) means advance payment from company (- payable)
    const initialBalanceDue = data.openingBalanceType === 'مدين' || data.openingBalanceType === 'debit'
      ? -openingBalVal 
      : openingBalVal;

    const newVendor: Vendor = {
      id: `VEND-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      code: finalCode,
      name: nameTrimmed,
      mobile: data.mobile ? data.mobile.trim() : '',
      phone2: data.phone2 ? data.phone2.trim() : undefined,
      type: data.type || undefined,
      status: data.status || 'نشط',
      isSystemCashVendor: false,
      category: data.category || 'Local',
      taxNumber: data.taxNumber ? data.taxNumber.trim() : undefined,
      commercialRegister: data.commercialRegister ? data.commercialRegister.trim() : undefined,
      balanceDue: initialBalanceDue,
      creditLimit: creditLimitVal,
      allowCreditPurchases: allowCreditVal,
      paymentTerms: data.paymentTerms || 'آجل 30 يوم من الفاتورة',
      discountRate: data.discountRate !== undefined && !isNaN(data.discountRate) ? Math.max(0, data.discountRate) : 0,
      assignedPurchaser: data.assignedPurchaser || undefined,
      notes: data.notes || '',
      area: data.area || undefined,
      address: data.address || undefined,
      specialNumber: data.specialNumber ? data.specialNumber.trim() : undefined,
      openingBalance: data.openingBalance,
      openingBalanceType: data.openingBalanceType || 'دائن',
      openingBalanceDate: data.openingBalanceDate || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.vendors.unshift(newVendor);
    this.saveToStorage();

    return { success: true, vendor: newVendor };
  }

  public updateVendor(
    id: string,
    updates: {
      name?: string;
      mobile?: string;
      phone2?: string;
      type?: VendorType | string;
      status?: VendorStatus;
      category?: VendorCategory;
      taxNumber?: string;
      commercialRegister?: string;
      balanceDue?: number;
      creditLimit?: number;
      allowCreditPurchases?: boolean;
      paymentTerms?: string;
      discountRate?: number;
      assignedPurchaser?: string;
      notes?: string;
      area?: string;
      address?: string;
      specialNumber?: string;
      openingBalance?: number;
      openingBalanceType?: 'دائن' | 'مدين' | '' | 'credit' | 'debit';
      openingBalanceDate?: string;
    }
  ): { success: boolean; vendor?: Vendor; error?: string } {
    const idx = this.vendors.findIndex(v => v.id === id);
    if (idx === -1) {
      return { success: false, error: 'سجل المورد غير موجود' };
    }

    const current = this.vendors[idx];

    if (current.isSystemCashVendor) {
      if (updates.status === 'غير نشط' || updates.status === 'inactive' || updates.status === 'محذوف' || updates.status === 'deleted') {
        return { success: false, error: 'لا يمكن تعطيل أو حذف المورد النقدي النظامي' };
      }
    }

    if (current.status === 'محذوف' || current.status === 'deleted') {
      if (updates.status && updates.status !== 'محذوف' && updates.status !== 'deleted') {
        return { success: false, error: 'لا يمكن إعادة تفعيل أو تعديل مورد محذوف منطقياً' };
      }
    }

    if (updates.name !== undefined) {
      const nameTrimmed = updates.name.trim();
      if (!nameTrimmed) {
        return { success: false, error: 'اسم المورد مطلوب ولا يمكن أن يكون فارغاً' };
      }

      const mobileToCheck = updates.mobile !== undefined ? updates.mobile : current.mobile;
      const { isNameDuplicate, isPhoneDuplicate } = this.checkDuplicateVendor(nameTrimmed, mobileToCheck, id);
      if (isNameDuplicate) {
        return { success: false, error: 'اسم المورد مكرر ومستخدم لمورد آخر' };
      }
      if (isPhoneDuplicate) {
        return { success: false, error: 'رقم الهاتف مكرر ومستخدم لمورد آخر' };
      }
    }

    if (updates.taxNumber !== undefined && updates.taxNumber.trim()) {
      if (this.checkDuplicateTaxNumber(updates.taxNumber, id)) {
        return { success: false, error: 'الرقم الضريبي مكرر ومستخدم لمورد آخر' };
      }
    }

    if (updates.commercialRegister !== undefined && updates.commercialRegister.trim()) {
      if (this.checkDuplicateCommercialRegister(updates.commercialRegister, id)) {
        return { success: false, error: 'السجل التجاري مكرر ومستخدم لمورد آخر' };
      }
    }

    let nextBalanceDue = current.balanceDue || 0;
    if (updates.openingBalance !== undefined || updates.openingBalanceType !== undefined) {
      const newBal = updates.openingBalance !== undefined ? (Number(updates.openingBalance) || 0) : (current.openingBalance || 0);
      const newType = updates.openingBalanceType !== undefined ? updates.openingBalanceType : (current.openingBalanceType || 'دائن');
      const oldBal = current.openingBalance || 0;
      const oldType = current.openingBalanceType || 'دائن';
      const oldContribution = (oldType === 'مدين' || oldType === 'debit') ? -oldBal : oldBal;
      const newContribution = (newType === 'مدين' || newType === 'debit') ? -newBal : newBal;
      nextBalanceDue = (current.balanceDue || 0) - oldContribution + newContribution;
    }

    const updatedVendor: Vendor = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      mobile: updates.mobile !== undefined ? updates.mobile.trim() : current.mobile,
      phone2: updates.phone2 !== undefined ? updates.phone2.trim() : current.phone2,
      type: updates.type !== undefined ? updates.type : current.type,
      status: updates.status !== undefined ? updates.status : current.status,
      category: updates.category !== undefined ? updates.category : current.category,
      taxNumber: updates.taxNumber !== undefined ? updates.taxNumber.trim() : current.taxNumber,
      commercialRegister: updates.commercialRegister !== undefined ? updates.commercialRegister.trim() : current.commercialRegister,
      creditLimit: updates.creditLimit !== undefined ? Math.max(0, updates.creditLimit) : current.creditLimit,
      allowCreditPurchases: updates.allowCreditPurchases !== undefined ? updates.allowCreditPurchases : current.allowCreditPurchases,
      paymentTerms: updates.paymentTerms !== undefined ? updates.paymentTerms : current.paymentTerms,
      discountRate: updates.discountRate !== undefined ? Math.max(0, updates.discountRate) : current.discountRate,
      assignedPurchaser: updates.assignedPurchaser !== undefined ? updates.assignedPurchaser : current.assignedPurchaser,
      notes: updates.notes !== undefined ? updates.notes : current.notes,
      area: updates.area !== undefined ? updates.area : current.area,
      address: updates.address !== undefined ? updates.address : current.address,
      specialNumber: updates.specialNumber !== undefined ? updates.specialNumber.trim() : current.specialNumber,
      openingBalance: updates.openingBalance !== undefined ? updates.openingBalance : current.openingBalance,
      openingBalanceType: updates.openingBalanceType !== undefined ? updates.openingBalanceType : current.openingBalanceType,
      openingBalanceDate: updates.openingBalanceDate !== undefined ? updates.openingBalanceDate : current.openingBalanceDate,
      balanceDue: updates.balanceDue !== undefined ? updates.balanceDue : nextBalanceDue,
      updatedAt: new Date().toISOString()
    };

    this.vendors[idx] = updatedVendor;
    this.saveToStorage();

    return { success: true, vendor: updatedVendor };
  }

  public toggleVendorStatus(id: string): { success: boolean; vendor?: Vendor; error?: string } {
    const v = this.getVendorById(id);
    if (!v) {
      return { success: false, error: 'سجل المورد غير موجود' };
    }
    if (v.isSystemCashVendor) {
      return { success: false, error: 'لا يمكن تغيير حالة المورد النقدي العام للنظام' };
    }
    if (v.status === 'محذوف' || v.status === 'deleted') {
      return { success: false, error: 'لا يمكن تفعيل مورد محذوف' };
    }

    const newStatus: VendorStatus = (v.status === 'نشط' || v.status === 'active') ? 'غير نشط' : 'نشط';
    return this.updateVendor(id, { status: newStatus });
  }

  public softDeleteVendor(id: string, deletedBy: string = 'SUPER_ADMIN'): { success: boolean; error?: string } {
    const v = this.getVendorById(id);
    if (!v) {
      return { success: false, error: 'سجل المورد غير موجود' };
    }
    if (v.isSystemCashVendor) {
      return { success: false, error: 'لا يمكن حذف المورد النقدي العام للنظام' };
    }

    const idx = this.vendors.findIndex(item => item.id === id);
    if (idx !== -1) {
      this.vendors[idx] = {
        ...this.vendors[idx],
        status: 'محذوف',
        deletedAt: new Date().toISOString(),
        deletedBy,
        updatedAt: new Date().toISOString()
      };
      this.saveToStorage();
      return { success: true };
    }
    return { success: false, error: 'تعذر العثور على السجل' };
  }

  /**
   * Retrieves outstanding indebtedness from vendor statement / transactions ledger:
   * Net deferred purchases from completed invoices
   */
  public getVendorStatementDebt(vendorId?: string, vendorCode?: string): number {
    if (!vendorId && !vendorCode) return 0;
    let statementDebt = 0;
    let foundInvoices = false;

    // 1. Completed purchase invoices (deferred/credit portions)
    try {
      const rawPurchases = localStorage.getItem('VERTEX_PURCHASE_INVOICES_V1');
      if (rawPurchases) {
        const parsed = JSON.parse(rawPurchases);
        const completed = (Array.isArray(parsed) ? parsed : (parsed.completedInvoices || [])) as any[];
        for (const inv of completed) {
          if (
            inv.status !== 'cancelled' &&
            (
              (vendorId && inv.vendorId === vendorId) ||
              (vendorCode && inv.vendorId && inv.vendorId.toLowerCase() === vendorCode.toLowerCase())
            )
          ) {
            foundInvoices = true;
            const deferred = inv.creditPaid !== undefined
              ? inv.creditPaid
              : (inv.paymentMethod === 'آجل' || inv.paymentMethod === 'deferred' ? (inv.grandTotal || 0) : 0);
            statementDebt += (deferred || 0);
          }
        }
      }
    } catch (e) {
      console.error('Error calculating vendor statement debt from purchase invoices:', e);
    }

    // 2. Treasury Cash Payments & Receipts (معاملات الخزينة - سندات الصرف والقبض للمورد)
    try {
      const rawTx = localStorage.getItem('VERTEX_INCOME_TRANSACTIONS_V1');
      if (rawTx) {
        const txList = JSON.parse(rawTx) as any[];
        for (const tx of txList) {
          if (tx.status === 'ملغي') continue;
          let vendorTxAmount = 0;
          if (tx.lines && Array.isArray(tx.lines)) {
            for (const l of tx.lines) {
              if (
                (l.accountType === 'vendors' || tx.accountType === 'vendors') &&
                (
                  (vendorId && l.accountId === vendorId) ||
                  (vendorCode && (l.accountCode === vendorCode || l.accountId === vendorCode))
                )
              ) {
                vendorTxAmount += (Number(l.amount) || 0);
              }
            }
          } else if (
            tx.accountType === 'vendors' &&
            (
              (vendorId && tx.accountId === vendorId) ||
              (vendorCode && (tx.accountCode === vendorCode || tx.accountId === vendorCode))
            )
          ) {
            vendorTxAmount += (Number(tx.amount) || 0);
          }

          if (vendorTxAmount > 0) {
            foundInvoices = true;
            if (tx.type === 'outward') {
              // صادر خزينة = سداد نقدي للمورد (يقلل رصيد المستحق للمورد)
              statementDebt -= vendorTxAmount;
            } else if (tx.type === 'inward') {
              // وارد خزينة = استرداد نقدي من المورد أو دفعة عكسية
              statementDebt += vendorTxAmount;
            }
          }
        }
      }
    } catch (e) {
      console.error('Error calculating vendor statement debt from income transactions:', e);
    }

    // 3. If no specific invoices or treasury transactions recorded in store yet, check pre-seeded balanceDue
    if (!foundInvoices && vendorId) {
      const vend = this.getVendorById(vendorId);
      if (vend && vend.balanceDue) {
        const opening = vend.openingBalance || 0;
        return Math.max(0, vend.balanceDue > opening ? vend.balanceDue - opening : vend.balanceDue);
      }
    }

    return Math.max(0, statementDebt);
  }

  /**
   * Calculates real actual vendor balance:
   * Real Actual Balance = Opening Balance (رصيد أول المدة) + Statement Debt (مديونية المورد)
   */
  public getVendorActualBalance(
    vendorOrId?: Vendor | string,
    overrideOpeningBalance?: number
  ): {
    openingBalance: number;
    statementDebt: number;
    actualBalance: number;
    creditLimit: number;
    availableCredit: number;
    isLimitExceeded: boolean;
  } {
    let vend: Vendor | undefined;
    if (typeof vendorOrId === 'string') {
      vend = this.getVendorById(vendorOrId);
    } else if (vendorOrId) {
      vend = vendorOrId;
    }

    const openingBalance = overrideOpeningBalance !== undefined
      ? overrideOpeningBalance
      : (vend?.openingBalance || 0);

    const statementDebt = vend ? this.getVendorStatementDebt(vend.id, vend.code) : 0;
    const actualBalance = (vend?.balanceDue !== undefined && vend.balanceDue !== 0) 
      ? vend.balanceDue 
      : (openingBalance + statementDebt);
    const creditLimit = vend?.creditLimit || 0;
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
   * Calculates real available credit for a vendor based on:
   * Available Credit = Credit Limit - Real Actual Balance
   */
  public getVendorAvailableCredit(vendorOrId: Vendor | string): {
    creditLimit: number;
    currentOutstanding: number;
    availableCredit: number;
    isLimitExceeded: boolean;
    isLimitReached: boolean;
    allowCreditPurchases: boolean;
  } {
    const vend = typeof vendorOrId === 'string'
      ? this.getVendorById(vendorOrId)
      : vendorOrId;

    const creditLimit = vend?.creditLimit || 0;
    const allowCreditPurchases = vend?.allowCreditPurchases ?? false;

    const calc = this.getVendorActualBalance(vend);
    const currentOutstanding = calc.actualBalance;

    // Available Credit = Credit Limit - Current Outstanding (if creditLimit > 0)
    // If creditLimit === 0 (or not set), vendor has NO credit limit ceiling
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
      allowCreditPurchases
    };
  }
}

export const vendorService = new VendorService();
