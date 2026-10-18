import { categoryService } from './categoryService';

export interface UnitOfMeasure {
  id: string;
  code: string;
  name: string;
  isSystem?: boolean;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'VERTEX_UNITS_OF_MEASURE_V1';

/**
 * Standard 18 Units of Measure preserved exactly as established in VERTEX ERP
 */
export const INITIAL_18_SYSTEM_UNITS: Array<{ code: string; name: string }> = [
  { code: 'UOM-0001', name: 'عدد' },
  { code: 'UOM-0002', name: 'قطعة' },
  { code: 'UOM-0003', name: 'حبة' },
  { code: 'UOM-0004', name: 'متر' },
  { code: 'UOM-0005', name: 'كيلو' },
  { code: 'UOM-0006', name: 'جرام' },
  { code: 'UOM-0007', name: 'طن' },
  { code: 'UOM-0008', name: 'لفة' },
  { code: 'UOM-0009', name: 'كرتونة' },
  { code: 'UOM-0010', name: 'صندوق' },
  { code: 'UOM-0011', name: 'علبة' },
  { code: 'UOM-0012', name: 'درزن' },
  { code: 'UOM-0013', name: 'مفتاح' },
  { code: 'UOM-0014', name: 'لتر' },
  { code: 'UOM-0015', name: 'شيكارة' },
  { code: 'UOM-0016', name: 'باقة' },
  { code: 'UOM-0017', name: 'طقم' },
  { code: 'UOM-0018', name: 'ساعة خدمة' }
];

class UnitOfMeasureService {
  private units: UnitOfMeasure[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.initDefaultUnits();
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: UnitOfMeasure[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.units = parsed;
          this.ensureSystemUnitsPresent();
          return;
        }
      }
      this.initDefaultUnits();
      this.saveToStorage();
    } catch (e) {
      console.warn('Failed to load units of measure from storage:', e);
      this.initDefaultUnits();
    }
  }

  private initDefaultUnits(): void {
    const now = new Date().toISOString();
    this.units = INITIAL_18_SYSTEM_UNITS.map((item, index) => ({
      id: `uom-${index + 1}`,
      code: item.code,
      name: item.name,
      isSystem: true,
      status: 'active',
      createdAt: now
    }));
  }

  /**
   * Ensures all 18 standard units exist without duplicating or altering existing records.
   * Matches by system code to prevent duplication even if names were edited.
   */
  private ensureSystemUnitsPresent(): void {
    let modified = false;
    const now = new Date().toISOString();
    const existingCodes = new Set(this.units.map(u => u.code.trim().toUpperCase()));

    INITIAL_18_SYSTEM_UNITS.forEach((sysItem, idx) => {
      if (!existingCodes.has(sysItem.code.trim().toUpperCase())) {
        this.units.push({
          id: `uom-${idx + 1}`,
          code: sysItem.code,
          name: sysItem.name,
          isSystem: true,
          status: 'active',
          createdAt: now
        });
        existingCodes.add(sysItem.code.trim().toUpperCase());
        modified = true;
      }
    });

    // Normalize any undefined status to 'active'
    this.units.forEach(u => {
      if (!u.status) {
        u.status = 'active';
        modified = true;
      }
    });

    if (modified) {
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.units));
      } catch (e) {
        console.error('Failed to save units of measure to storage:', e);
      }
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (err) {
        console.error('Error in unitOfMeasureService listener:', err);
      }
    });
  }

  public getAllUnits(): UnitOfMeasure[] {
    return [...this.units];
  }

  /**
   * Returns active unit names by default (for new item selection dropdowns).
   * If includeInactive is true, returns all unit names.
   */
  public getUnitNames(includeInactive: boolean = false): string[] {
    return this.units
      .filter(u => includeInactive || u.status !== 'inactive')
      .map(u => u.name);
  }

  public getUnitById(id: string): UnitOfMeasure | undefined {
    return this.units.find(u => u.id === id);
  }

  public getUnitByName(name: string): UnitOfMeasure | undefined {
    return this.units.find(u => u.name.trim().toLowerCase() === name.trim().toLowerCase());
  }

  public getUnitByCode(code: string): UnitOfMeasure | undefined {
    return this.units.find(u => u.code.trim().toUpperCase() === code.trim().toUpperCase());
  }

  /**
   * Count how many catalog products in categoryService are currently using this unit
   */
  public getUnitUsageCount(unitName: string): number {
    try {
      const trimmed = unitName.trim().toLowerCase();
      const products = categoryService.getProducts();
      return products.filter(p => 
        (p.basicUnit && p.basicUnit.trim().toLowerCase() === trimmed) ||
        (p.unit && p.unit.trim().toLowerCase() === trimmed) ||
        (p.subUnit && p.subUnit.trim().toLowerCase() === trimmed)
      ).length;
    } catch {
      return 0;
    }
  }

  public generateNextCode(): string {
    const maxNum = this.units.reduce((max, u) => {
      const match = u.code.match(/UOM-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `UOM-${String(maxNum + 1).padStart(4, '0')}`;
  }

  public addUnit(name: string, code?: string): { success: boolean; unit?: UnitOfMeasure; error?: string } {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم وحدة القياس مطلوب.' };
    }

    if (this.units.some(u => u.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `وحدة القياس (${trimmedName}) مسجلة بالفعل في النظام.` };
    }

    const assignedCode = code?.trim() || this.generateNextCode();
    if (this.units.some(u => u.code.trim().toUpperCase() === assignedCode.toUpperCase())) {
      return { success: false, error: `كود وحدة القياس (${assignedCode}) مستخدم بالفعل.` };
    }

    const newUnit: UnitOfMeasure = {
      id: `uom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: assignedCode,
      name: trimmedName,
      isSystem: false,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    this.units.push(newUnit);
    this.saveToStorage();
    return { success: true, unit: newUnit };
  }

  public updateUnit(id: string, name: string, code?: string): { success: boolean; unit?: UnitOfMeasure; error?: string } {
    const unit = this.units.find(u => u.id === id);
    if (!unit) {
      return { success: false, error: 'وحدة القياس غير موجودة.' };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم وحدة القياس مطلوب.' };
    }

    if (this.units.some(u => u.id !== id && u.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `اسم وحدة القياس (${trimmedName}) مستخدم بالفعل في سجل آخر.` };
    }

    // Code protection rules:
    // If unit is system unit, code can never be modified.
    if (code) {
      const trimmedCode = code.trim();
      if (unit.isSystem && trimmedCode.toUpperCase() !== unit.code.trim().toUpperCase()) {
        return { success: false, error: 'لا يمكن تعديل كود وحدات القياس النظامية الأساسية.' };
      }

      if (trimmedCode.toUpperCase() !== unit.code.trim().toUpperCase()) {
        if (this.units.some(u => u.id !== id && u.code.trim().toUpperCase() === trimmedCode.toUpperCase())) {
          return { success: false, error: `كود وحدة القياس (${trimmedCode}) مستخدم بالفعل في سجل آخر.` };
        }
        unit.code = trimmedCode;
      }
    }

    const oldName = unit.name;
    unit.name = trimmedName;
    unit.updatedAt = new Date().toISOString();

    // Cascade name update to catalog products in categoryService to prevent orphaned references
    if (oldName !== trimmedName) {
      try {
        const products = categoryService.getProducts();
        let anyModified = false;
        const updatedProducts = products.map(prod => {
          let mod = false;
          let basicUnit = prod.basicUnit;
          let unitField = prod.unit;
          let subUnit = prod.subUnit;

          if (basicUnit && basicUnit.trim().toLowerCase() === oldName.trim().toLowerCase()) {
            basicUnit = trimmedName;
            mod = true;
          }
          if (unitField && unitField.trim().toLowerCase() === oldName.trim().toLowerCase()) {
            unitField = trimmedName;
            mod = true;
          }
          if (subUnit && subUnit.trim().toLowerCase() === oldName.trim().toLowerCase()) {
            subUnit = trimmedName;
            mod = true;
          }

          if (mod) {
            anyModified = true;
            return {
              ...prod,
              basicUnit,
              unit: unitField,
              subUnit
            };
          }
          return prod;
        });

        if (anyModified) {
          categoryService.saveProducts(updatedProducts);
        }
      } catch (err) {
        console.warn('Could not cascade unit rename to products:', err);
      }
    }

    this.saveToStorage();
    return { success: true, unit };
  }

  /**
   * Check whether a unit of measure can be cancelled / deactivated.
   * Rule: Any unit (including standard 18 system units) CAN be cancelled IF AND ONLY IF
   * it is not used in ANY product (basicUnit, unit, subUnit).
   * Being a system unit is NEVER a reason to block cancellation.
   */
  public canDeactivateUnit(id: string): { canDeactivate: boolean; reason?: string; usageCount: number } {
    const unit = this.units.find(u => u.id === id);
    if (!unit) {
      return { canDeactivate: false, reason: 'وحدة القياس غير موجودة في النظام.', usageCount: 0 };
    }

    const usageCount = this.getUnitUsageCount(unit.name);
    if (usageCount > 0) {
      return {
        canDeactivate: false,
        reason: `لا يمكن إلغاء وحدة القياس (${unit.name}) لأنها مستخدمة ومرتبطة حالياً بـ (${usageCount}) صنف في شجرة الأصناف.`,
        usageCount
      };
    }

    return { canDeactivate: true, usageCount: 0 };
  }

  /**
   * Cancel / Deactivate a unit of measure (soft delete / disable).
   * Safe mechanism that preserves the record, code, name, and history,
   * but prevents it from appearing in dropdowns for new item creation.
   */
  public deactivateUnit(id: string): { success: boolean; unit?: UnitOfMeasure; error?: string; usageCount?: number } {
    const unit = this.units.find(u => u.id === id);
    if (!unit) {
      return { success: false, error: 'وحدة القياس غير موجودة في النظام.' };
    }

    const check = this.canDeactivateUnit(id);
    if (!check.canDeactivate) {
      return { success: false, error: check.reason, usageCount: check.usageCount };
    }

    unit.status = 'inactive';
    unit.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return { success: true, unit };
  }

  /**
   * Reactivate a previously cancelled unit of measure.
   */
  public reactivateUnit(id: string): { success: boolean; unit?: UnitOfMeasure; error?: string } {
    const unit = this.units.find(u => u.id === id);
    if (!unit) {
      return { success: false, error: 'وحدة القياس غير موجودة في النظام.' };
    }

    unit.status = 'active';
    unit.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return { success: true, unit };
  }

  /**
   * Check whether a unit can be deleted.
   * Safety check: Used in products CANNOT be deleted.
   * If unit is not used, it can be deleted or cancelled.
   */
  public canDeleteUnit(id: string): { canDelete: boolean; reason?: string; usageCount: number } {
    const unit = this.units.find(u => u.id === id);
    if (!unit) {
      return { canDelete: false, reason: 'وحدة القياس غير موجودة.', usageCount: 0 };
    }

    const usageCount = this.getUnitUsageCount(unit.name);
    if (usageCount > 0) {
      return { 
        canDelete: false, 
        reason: `لا يمكن إلغاء أو حذف وحدة القياس (${unit.name}) لأنها مستخدمة ومرتبطة حالياً بـ (${usageCount}) صنف في شجرة الأصناف.`,
        usageCount 
      };
    }

    return { canDelete: true, usageCount: 0 };
  }

  /**
   * Delete or deactivate unit of measure.
   * System units are deactivated (cancelled) rather than removed from array to guarantee record & code preservation.
   * Custom unused units can also be deactivated or deleted.
   */
  public deleteUnit(id: string): { success: boolean; error?: string; usageCount?: number } {
    const unit = this.units.find(u => u.id === id);
    if (!unit) {
      return { success: false, error: 'وحدة القياس غير موجودة.' };
    }

    // Safety check: Prevent cancelling or deleting units that are in use by products
    const usageCount = this.getUnitUsageCount(unit.name);
    if (usageCount > 0) {
      return { 
        success: false, 
        error: `لا يمكن إلغاء وحدة القياس (${unit.name}) لأنها مستخدمة ومرتبطة حالياً بـ (${usageCount}) صنف في شجرة الأصناف.`,
        usageCount
      };
    }

    // Preserve system units and historical records via deactivation (إلغاء / تعطيل)
    if (unit.isSystem) {
      unit.status = 'inactive';
      unit.updatedAt = new Date().toISOString();
      this.saveToStorage();
      return { success: true };
    }

    // For custom units, soft deactivation is applied to maintain history safely
    unit.status = 'inactive';
    unit.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return { success: true };
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
  }
}

export const unitOfMeasureService = new UnitOfMeasureService();
