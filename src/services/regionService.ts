// ============================================================================
// VERTEX ERP — Region Master Data Service (شجرة التوزيع الجغرافي - المناطق)
// Unified Single Source of Truth for Hierarchical Geographic Regions
// ============================================================================

export interface Region {
  id: string; // Unique Internal ID (e.g. "REG-0101" or UUID)
  code: string; // Hierarchical Display Code (e.g. "01", "0101", "0102")
  name: string; // Region Name (e.g. "سيدي جابر")
  parentId: string | null; // Parent Region ID (null for Root regions)
  parentCode?: string; // Cached parent code for fast lookup
  parentName?: string; // Cached parent name
  classification: string; // التصنيف التحليلي (e.g. "تصنيف تحليلي")
  status: 'نشط' | 'غير نشط' | 'active' | 'inactive';
  notes?: string;
  transactionCount: number; // Linked transactions / operations
  childrenCount: number; // Number of direct children
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegionDTO {
  name: string;
  parentId: string | null;
  classification?: string;
  status?: 'نشط' | 'غير نشط';
  notes?: string;
}

export interface UpdateRegionDTO {
  name?: string;
  parentId?: string | null;
  classification?: string;
  status?: 'نشط' | 'غير نشط';
  notes?: string;
}

export interface RegionTreeNode extends Region {
  children: RegionTreeNode[];
  level: number;
}

const STORAGE_KEY = 'vertex_master_regions_v1';

export const INITIAL_REGIONS: Region[] = [];

class RegionService {
  private regions: Region[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy demo seed regions
          const filtered = parsed.filter((r: any) => 
            !(r.id?.startsWith('REG-01') && (r.notes?.includes('محافظة الإسكندرية والقطاع الساحلي') || r.notes?.includes('سيدي جابر وسموحة') || r.notes?.includes('شارع اللاجتيه') || r.notes?.includes('منطقة الدخيلة والعجمي'))) &&
            !(r.id?.startsWith('REG-02') && (r.notes?.includes('محافظة القاهرة والمناطق المركزية') || r.notes?.includes('مدينة نصر والمنطقة الحرة') || r.notes?.includes('مصر الجديدة والنزهة') || r.notes?.includes('المعادي والقرية الذكية'))) &&
            !(r.id?.startsWith('REG-03') && (r.notes?.includes('محافظة الجيزة والمناطق الصناعية') || r.notes?.includes('حي الدقي والمهندسين') || r.notes?.includes('المنطقة الصناعية بـ 6 أكتوبر')))
          );
          this.regions = filtered;
          this.saveToStorage();
          this.recalculateChildrenCounts();
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load regions from storage', e);
    }
    this.regions = [];
    this.saveToStorage();
    this.recalculateChildrenCounts();
  }

  private saveToStorage() {
    try {
      this.recalculateChildrenCounts();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.regions));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save regions to storage', e);
    }
  }

  private recalculateChildrenCounts() {
    const countsMap = new Map<string, number>();
    for (const r of this.regions) {
      if (r.parentId) {
        countsMap.set(r.parentId, (countsMap.get(r.parentId) || 0) + 1);
      }
    }
    for (const r of this.regions) {
      r.childrenCount = countsMap.get(r.id) || 0;
      if (r.parentId) {
        const parent = this.regions.find(p => p.id === r.parentId);
        if (parent) {
          r.parentCode = parent.code;
          r.parentName = parent.name;
        }
      }
    }
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

  private notifyListeners() {
    this.listeners.forEach(l => {
      try {
        l();
      } catch (err) {
        console.error('Region listener error', err);
      }
    });
  }

  // ============================================================================
  // QUERIES
  // ============================================================================

  public getAllRegions(): Region[] {
    return [...this.regions].sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }

  public getActiveRegions(): Region[] {
    return this.getAllRegions().filter(r => r.status === 'نشط' || r.status === 'active');
  }

  public getRegionById(id: string): Region | undefined {
    return this.regions.find(r => r.id === id);
  }

  public getRegionByCode(code: string): Region | undefined {
    return this.regions.find(r => r.code === code);
  }

  public getDirectChildren(parentId: string | null): Region[] {
    return this.regions
      .filter(r => (parentId === null || parentId === '' ? !r.parentId : r.parentId === parentId))
      .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }

  // ============================================================================
  // HIERARCHICAL CODE GENERATION
  // ============================================================================

  /**
   * Generates the next sequential hierarchical code based on parent.
   * - If Root (parentId = null): "01", "02", "03", etc.
   * - If Child of Parent with code "01": "0101", "0102", "0103", etc.
   * - If Child of Parent with code "0101": "010101", "010102", etc.
   */
  public getNextHierarchicalCode(parentId: string | null): string {
    if (!parentId) {
      // Root Level: 2-digit format "01", "02", ...
      const rootRegions = this.regions.filter(r => !r.parentId);
      let maxNum = 0;
      for (const r of rootRegions) {
        const num = parseInt(r.code, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
      const nextNum = maxNum + 1;
      return String(nextNum).padStart(2, '0');
    }

    const parent = this.getRegionById(parentId);
    if (!parent) {
      return this.getNextHierarchicalCode(null);
    }

    const parentCode = parent.code;
    const directChildren = this.regions.filter(r => r.parentId === parentId);

    let maxChildSuffix = 0;
    for (const child of directChildren) {
      if (child.code.startsWith(parentCode)) {
        const suffix = child.code.substring(parentCode.length);
        const num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxChildSuffix) {
          maxChildSuffix = num;
        }
      }
    }

    const nextSuffix = maxChildSuffix + 1;
    return `${parentCode}${String(nextSuffix).padStart(2, '0')}`;
  }

  // ============================================================================
  // HIERARCHICAL TREE BUILDER
  // ============================================================================

  public getRegionTree(): RegionTreeNode[] {
    const all = this.getAllRegions();
    const map = new Map<string, RegionTreeNode>();

    // 1. Create nodes
    all.forEach(r => {
      map.set(r.id, {
        ...r,
        children: [],
        level: 0
      });
    });

    const roots: RegionTreeNode[] = [];

    // 2. Assemble hierarchy
    all.forEach(r => {
      const node = map.get(r.id)!;
      if (r.parentId && map.has(r.parentId)) {
        const parentNode = map.get(r.parentId)!;
        node.level = parentNode.level + 1;
        parentNode.children.push(node);
      } else {
        node.level = 0;
        roots.push(node);
      }
    });

    // 3. Sort children recursively by code
    const sortTree = (nodes: RegionTreeNode[]) => {
      nodes.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      nodes.forEach(n => sortTree(n.children));
    };

    sortTree(roots);
    return roots;
  }

  /**
   * Helper to collect all descendant IDs of a region to prevent circular parents
   */
  public getDescendantIds(regionId: string): string[] {
    const descendants: string[] = [];
    const traverse = (pId: string) => {
      const children = this.regions.filter(r => r.parentId === pId);
      for (const child of children) {
        descendants.push(child.id);
        traverse(child.id);
      }
    };
    traverse(regionId);
    return descendants;
  }

  // ============================================================================
  // MUTATIONS (Create, Update, Delete)
  // ============================================================================

  public createRegion(data: CreateRegionDTO): { success: boolean; region?: Region; error?: string } {
    if (!data.name || !data.name.trim()) {
      return { success: false, error: 'اسم المنطقة حقل إجباري مطلوب.' };
    }

    const cleanParentId = data.parentId && data.parentId.trim() ? data.parentId.trim() : null;
    let parent: Region | undefined;

    if (cleanParentId) {
      parent = this.getRegionById(cleanParentId);
      if (!parent) {
        return { success: false, error: 'المنطقة الأب المحددة غير موجودة في النظام.' };
      }
    }

    const code = this.getNextHierarchicalCode(cleanParentId);
    const internalId = `REG-${code}`;

    const newRegion: Region = {
      id: internalId,
      code,
      name: data.name.trim(),
      parentId: cleanParentId,
      parentCode: parent?.code,
      parentName: parent?.name,
      classification: data.classification || 'تصنيف تحليلي',
      status: data.status || 'نشط',
      notes: data.notes?.trim() || '',
      transactionCount: 0,
      childrenCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.regions.push(newRegion);
    this.saveToStorage();

    return { success: true, region: newRegion };
  }

  public updateRegion(id: string, data: UpdateRegionDTO): { success: boolean; region?: Region; error?: string } {
    const index = this.regions.findIndex(r => r.id === id);
    if (index === -1) {
      return { success: false, error: 'المنطقة المطلوبة غير موجودة في قاعدة البيانات.' };
    }

    const current = this.regions[index];

    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: 'اسم المنطقة حقل إجباري ولا يمكن تركه فارغاً.' };
    }

    const newParentId = data.parentId !== undefined 
      ? (data.parentId && data.parentId.trim() ? data.parentId.trim() : null)
      : current.parentId;

    // Check for circular dependency
    if (newParentId) {
      if (newParentId === id) {
        return { success: false, error: 'لا يمكن تعيين المنطقة كأب لنفسها.' };
      }
      const descendants = this.getDescendantIds(id);
      if (descendants.includes(newParentId)) {
        return { success: false, error: 'لا يمكن تعيين منطقة فرعية كأب لمنطقة رئيسية لتجنب الحلقات المغلقة.' };
      }
    }

    let parent: Region | undefined;
    if (newParentId) {
      parent = this.getRegionById(newParentId);
    }

    let updatedCode = current.code;
    // If parent changed, we can recalculate hierarchical code or keep current
    if (data.parentId !== undefined && data.parentId !== current.parentId) {
      updatedCode = this.getNextHierarchicalCode(newParentId);
    }

    const updatedRegion: Region = {
      ...current,
      code: updatedCode,
      name: data.name !== undefined ? data.name.trim() : current.name,
      parentId: newParentId,
      parentCode: parent?.code,
      parentName: parent?.name,
      classification: data.classification !== undefined ? data.classification : current.classification,
      status: data.status || current.status,
      notes: data.notes !== undefined ? data.notes.trim() : current.notes,
      updatedAt: new Date().toISOString()
    };

    this.regions[index] = updatedRegion;
    this.saveToStorage();

    return { success: true, region: updatedRegion };
  }

  public deleteRegion(id: string): { success: boolean; error?: string; childrenCount?: number; txCount?: number } {
    const region = this.getRegionById(id);
    if (!region) {
      return { success: false, error: 'المنطقة غير موجودة في النظام.' };
    }

    // 1. Check if region has children (Hierarchy protection)
    const directChildren = this.getDirectChildren(id);
    if (directChildren.length > 0) {
      return {
        success: false,
        error: 'لا يمكن حذف المنطقة لأنها تحتوي على مناطق فرعية.',
        childrenCount: directChildren.length
      };
    }

    // 2. Check if region has linked transactions/operations
    if (region.transactionCount > 0) {
      return {
        success: false,
        error: `لا يمكن حذف المنطقة (${region.name}) لوجود (${region.transactionCount}) حركة وعملية جغرافية مسجلة عليها في النظام. يمكنك تعديل حالتها إلى "غير نشط" بدلاً من الحذف.`,
        txCount: region.transactionCount
      };
    }

    this.regions = this.regions.filter(r => r.id !== id);
    this.saveToStorage();

    return { success: true };
  }

  public toggleStatus(id: string): { success: boolean; status?: string; error?: string } {
    const region = this.getRegionById(id);
    if (!region) {
      return { success: false, error: 'المنطقة غير موجودة.' };
    }

    const newStatus = (region.status === 'نشط' || region.status === 'active') ? 'غير نشط' : 'نشط';
    return this.updateRegion(id, { status: newStatus as any });
  }
}

export const regionService = new RegionService();
