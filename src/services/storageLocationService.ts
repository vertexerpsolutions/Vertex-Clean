export interface StorageLocation {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'VERTEX_STORAGE_LOCATIONS_V1';

export const INITIAL_STORAGE_LOCATIONS: StorageLocation[] = [
  {
    id: 'loc-1',
    code: 'LOC-01',
    name: 'الرف الرئيسي (A-01)',
    isDefault: true,
    notes: 'الموقع الافتراضي لاستلام وتخزين البضائع السريعة',
    createdAt: new Date().toISOString()
  },
  {
    id: 'loc-2',
    code: 'LOC-02',
    name: 'المنطقة الخلفية (B-02)',
    isDefault: false,
    notes: 'موقع تخزين احتياطي للبضائع كبيرة الحجم',
    createdAt: new Date().toISOString()
  }
];

class StorageLocationService {
  private locations: StorageLocation[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.locations = [...INITIAL_STORAGE_LOCATIONS];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: StorageLocation[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.locations = parsed;
          return;
        }
      }
      this.locations = [...INITIAL_STORAGE_LOCATIONS];
      this.saveToStorage();
    } catch (e) {
      console.warn('Failed to load storage locations from storage:', e);
      this.locations = [...INITIAL_STORAGE_LOCATIONS];
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.locations));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save storage locations to storage:', e);
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
        console.error('Error in storageLocationService listener:', err);
      }
    });
  }

  public getAllLocations(): StorageLocation[] {
    return [...this.locations];
  }

  public getDefaultLocation(): StorageLocation | undefined {
    return this.locations.find(l => l.isDefault) || this.locations[0];
  }

  public generateNextCode(): string {
    const maxNum = this.locations.reduce((max, l) => {
      const match = l.code.match(/LOC-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    return `LOC-${String(maxNum + 1).padStart(2, '0')}`;
  }

  public addLocation(data: {
    name: string;
    code?: string;
    isDefault?: boolean;
    notes?: string;
  }): { success: boolean; location?: StorageLocation; error?: string } {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم مكان التخزين مطلوب.' };
    }

    if (this.locations.some(l => l.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `مكان التخزين (${trimmedName}) موجود بالفعل.` };
    }

    const assignedCode = data.code?.trim() || this.generateNextCode();
    if (this.locations.some(l => l.code.trim().toUpperCase() === assignedCode.toUpperCase())) {
      return { success: false, error: `كود مكان التخزين (${assignedCode}) مستخدم بالفعل.` };
    }

    const isFirst = this.locations.length === 0;
    const shouldBeDefault = isFirst || Boolean(data.isDefault);

    if (shouldBeDefault) {
      this.locations.forEach(l => {
        l.isDefault = false;
      });
    }

    const newLocation: StorageLocation = {
      id: `loc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: assignedCode,
      name: trimmedName,
      isDefault: shouldBeDefault,
      notes: data.notes?.trim() || '',
      createdAt: new Date().toISOString()
    };

    this.locations.push(newLocation);
    this.saveToStorage();
    return { success: true, location: newLocation };
  }

  public updateLocation(
    id: string,
    data: { name: string; code?: string; isDefault?: boolean; notes?: string }
  ): { success: boolean; location?: StorageLocation; error?: string } {
    const loc = this.locations.find(l => l.id === id);
    if (!loc) {
      return { success: false, error: 'مكان التخزين غير موجود.' };
    }

    const trimmedName = data.name.trim();
    if (!trimmedName) {
      return { success: false, error: 'اسم مكان التخزين مطلوب.' };
    }

    if (this.locations.some(l => l.id !== id && l.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
      return { success: false, error: `اسم مكان التخزين (${trimmedName}) مستخدم بالفعل في سجل آخر.` };
    }

    if (data.code) {
      const trimmedCode = data.code.trim();
      if (this.locations.some(l => l.id !== id && l.code.trim().toUpperCase() === trimmedCode.toUpperCase())) {
        return { success: false, error: `كود مكان التخزين (${trimmedCode}) مستخدم بالفعل في سجل آخر.` };
      }
      loc.code = trimmedCode;
    }

    if (data.isDefault) {
      this.locations.forEach(l => {
        l.isDefault = false;
      });
      loc.isDefault = true;
    }

    loc.name = trimmedName;
    if (data.notes !== undefined) {
      loc.notes = data.notes.trim();
    }
    loc.updatedAt = new Date().toISOString();

    this.saveToStorage();
    return { success: true, location: loc };
  }

  public setDefaultLocation(id: string): { success: boolean; error?: string } {
    const target = this.locations.find(l => l.id === id);
    if (!target) {
      return { success: false, error: 'مكان التخزين غير موجود.' };
    }

    this.locations.forEach(l => {
      l.isDefault = l.id === id;
    });

    this.saveToStorage();
    return { success: true };
  }

  public deleteLocation(id: string): { success: boolean; error?: string } {
    const loc = this.locations.find(l => l.id === id);
    if (!loc) {
      return { success: false, error: 'مكان التخزين غير موجود.' };
    }

    if (this.locations.length <= 1) {
      return { success: false, error: 'يجب الإبقاء على مكان تخزين واحد على الأقل في النظام.' };
    }

    const wasDefault = loc.isDefault;
    this.locations = this.locations.filter(l => l.id !== id);

    if (wasDefault && this.locations.length > 0) {
      this.locations[0].isDefault = true;
    }

    this.saveToStorage();
    return { success: true };
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
  }
}

export const storageLocationService = new StorageLocationService();
