export interface PriceTier {
  id: string;
  code: string;
  name: string;
  isSystem?: boolean;
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'VERTEX_PRICE_TIERS_V1';

export const INITIAL_PRICE_TIERS: Array<{ code: string; name: string; isSystem: boolean }> = [
  { code: 'TIER-01', name: 'تجزئة', isSystem: true },
  { code: 'TIER-02', name: 'جملة', isSystem: true }
];

class PriceTierService {
  private tiers: PriceTier[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.initDefaultTiers();
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: PriceTier[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tiers = parsed;
          this.ensureSystemTiersPresent();
          return;
        }
      }
      this.initDefaultTiers();
      this.saveToStorage();
    } catch (e) {
      console.warn('Failed to load price tiers from storage:', e);
      this.initDefaultTiers();
    }
  }

  private initDefaultTiers(): void {
    const now = new Date().toISOString();
    this.tiers = INITIAL_PRICE_TIERS.map((tier, idx) => ({
      id: `tier-${idx + 1}`,
      code: tier.code,
      name: tier.name,
      isSystem: tier.isSystem,
      createdAt: now
    }));
  }

  private ensureSystemTiersPresent(): void {
    let modified = false;
    const now = new Date().toISOString();
    const existingNames = new Set(this.tiers.map(t => t.name.trim()));

    INITIAL_PRICE_TIERS.forEach((sysTier, idx) => {
      if (!existingNames.has(sysTier.name.trim())) {
        this.tiers.push({
          id: `tier-${Date.now()}-${idx}`,
          code: sysTier.code,
          name: sysTier.name,
          isSystem: true,
          createdAt: now
        });
        existingNames.add(sysTier.name.trim());
        modified = true;
      }
    });

    if (modified) {
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tiers));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save price tiers to storage:', e);
    }
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
        console.error('Error in priceTierService listener:', err);
      }
    });
  }

  public getAllTiers(): PriceTier[] {
    return [...this.tiers];
  }

  public getTierById(id: string): PriceTier | undefined {
    return this.tiers.find(t => t.id === id);
  }

  public generateNextCode(): string {
    const maxNum = this.tiers.reduce((max, t) => {
      const match = t.code.match(/TIER-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `TIER-${String(maxNum + 1).padStart(2, '0')}`;
  }

  public addTier(name: string, code?: string): { success: boolean; tier?: PriceTier; error?: string } {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم شريحة السعر مطلوب.' };
    }

    if (this.tiers.some(t => t.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `شريحة السعر (${trimmedName}) موجودة بالفعل.` };
    }

    const assignedCode = code?.trim() || this.generateNextCode();
    if (this.tiers.some(t => t.code.trim().toUpperCase() === assignedCode.toUpperCase())) {
      return { success: false, error: `كود شريحة السعر (${assignedCode}) مستخدم بالفعل.` };
    }

    const newTier: PriceTier = {
      id: `tier-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: assignedCode,
      name: trimmedName,
      isSystem: false,
      createdAt: new Date().toISOString()
    };

    this.tiers.push(newTier);
    this.saveToStorage();
    return { success: true, tier: newTier };
  }

  public updateTier(id: string, name: string, code?: string): { success: boolean; tier?: PriceTier; error?: string } {
    const tier = this.tiers.find(t => t.id === id);
    if (!tier) {
      return { success: false, error: 'شريحة السعر غير موجودة.' };
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم شريحة السعر مطلوب.' };
    }

    if (this.tiers.some(t => t.id !== id && t.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `اسم شريحة السعر (${trimmedName}) مستخدم بالفعل في شريحة أخرى.` };
    }

    if (code) {
      const trimmedCode = code.trim();
      if (trimmedCode.toUpperCase() !== tier.code.trim().toUpperCase()) {
        if (tier.isSystem) {
          return { success: false, error: 'لا يمكن تعديل كود شرائح الأسعار الأساسية للنظام.' };
        }
        return { success: false, error: 'لا يمكن تعديل الكود المرجعي لشريحة سعر مسجلة.' };
      }
    }

    tier.name = trimmedName;
    tier.updatedAt = new Date().toISOString();

    this.saveToStorage();
    return { success: true, tier };
  }

  public deleteTier(id: string): { success: boolean; error?: string } {
    const tier = this.tiers.find(t => t.id === id);
    if (!tier) {
      return { success: false, error: 'شريحة السعر غير موجودة.' };
    }

    if (tier.isSystem) {
      return { success: false, error: 'لا يمكن حذف شرائح الأسعار الأساسية للنظام (تجزئة / جملة).' };
    }

    this.tiers = this.tiers.filter(t => t.id !== id);
    this.saveToStorage();
    return { success: true };
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
  }
}

export const priceTierService = new PriceTierService();
