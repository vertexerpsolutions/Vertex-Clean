import { auditEngine } from './auditEngine';

export interface FastProductItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  basicUnit?: string;
  subUnit?: string;
  conversionFactor?: number;
  type: 'stockable' | 'service';
  barcode: string;
  serialNumber?: string;
  serialNumbers?: string[];
  sellingPrice: number;
  costPrice: number;
  category: string;
  subCategory?: string;
  subSubCategory?: string;
  stockQty: number;
}

export interface SubCategoryTreeNode {
  id: string;
  name: string;
  level: 2;
  itemCount: number;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  level: 1;
  children?: SubCategoryTreeNode[];
  itemCount: number;
}

/**
 * Strict Classification Mode Detection Rule:
 * 1. If at least 1 sub-group exists -> '3-level' (Automatic)
 * 2. If at least 1 product exists without sub-groups -> '2-level' (Automatic)
 * 3. If no products and no sub-groups exist -> 'ask-user' (Ask user choice)
 * 4. If all products and sub-groups are removed -> Reverts to 'ask-user'
 */
export function detectClassificationMode(
  categoryTree: CategoryTreeNode[] = [],
  products: FastProductItem[] = []
): '2-level' | '3-level' | 'ask-user' {
  const hasSubGroups = (categoryTree || []).some(
    cat => Array.isArray(cat.children) && cat.children.length > 0
  );
  if (hasSubGroups) {
    return '3-level';
  }

  const hasProducts = Array.isArray(products) && products.length > 0;
  if (hasProducts) {
    return '2-level';
  }

  return 'ask-user';
}

const CATEGORY_STORAGE_KEY = 'VERTEX_CATEGORY_TREE_MASTER_V1';
const PRODUCTS_STORAGE_KEY = 'VERTEX_PRODUCTS_MASTER_V1';

const INITIAL_CATEGORY_TREE: CategoryTreeNode[] = [];

const INITIAL_PRODUCTS: FastProductItem[] = [];

class CategoryService {
  private categories: CategoryTreeNode[] = [];
  private products: FastProductItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private normalizeAndMigrateData(cats: CategoryTreeNode[], prods: FastProductItem[]) {
    // 1. Ensure categories have valid 3-digit IDs and their children have 6-digit hierarchical IDs
    const normalizedCats: CategoryTreeNode[] = cats.map((cat, catIdx) => {
      let mainId = cat.id;
      const digitsOnly = mainId.replace(/\D/g, '');
      if (digitsOnly.length > 0 && digitsOnly.length <= 3) {
        mainId = digitsOnly.padStart(3, '0');
      } else if (!mainId || digitsOnly.length === 0) {
        mainId = String(catIdx + 1).padStart(3, '0');
      }

      const rawChildren = Array.isArray(cat.children) ? cat.children : [];
      let subIndex = 1;
      const normalizedChildren: SubCategoryTreeNode[] = rawChildren.map(sub => {
        let subId = sub.id;
        const subDigits = subId.replace(/\D/g, '');
        if (subDigits.length === 6 && subDigits.startsWith(mainId)) {
          subId = subDigits;
        } else if (subDigits.length === 3) {
          subId = `${mainId}${subDigits}`;
        } else {
          subId = `${mainId}${String(subIndex).padStart(3, '0')}`;
        }
        subIndex++;
        return {
          id: subId,
          name: sub.name || `مجموعة فرعية ${subIndex}`,
          level: 2,
          itemCount: sub.itemCount || 0
        };
      });

      return {
        id: mainId,
        name: cat.name || `مجموعة رئيسية ${catIdx + 1}`,
        level: 1,
        children: normalizedChildren,
        itemCount: cat.itemCount || 0
      };
    });

    // 2. Ensure products have valid 9-digit hierarchical codes and proper subCategory
    const normalizedProds: FastProductItem[] = prods.map((prod, pIdx) => {
      let mainCat = normalizedCats.find(c => c.name === prod.category || c.id === prod.category);
      if (!mainCat && normalizedCats.length > 0) {
        mainCat = normalizedCats[0];
      }
      const catName = mainCat ? mainCat.name : (prod.category || 'عام');
      const catId = mainCat ? mainCat.id : '001';

      // Find or ensure sub category
      let subCatName = prod.subCategory;
      let targetSubNode = mainCat?.children?.find(s => s.name === subCatName || s.id === subCatName);
      if (!targetSubNode && mainCat?.children && mainCat.children.length > 0) {
        targetSubNode = mainCat.children[0];
        subCatName = targetSubNode.name;
      }

      const subId = targetSubNode ? targetSubNode.id : `${catId}001`;

      let prodCode = prod.code || prod.id || '';
      const prodDigits = prodCode.replace(/\D/g, '');
      if (prodDigits.length === 9 || prodDigits.length === 6) {
        prodCode = prodDigits;
      } else if (prodDigits.length === 3) {
        prodCode = `${catId}${prodDigits}`;
      } else if (prodDigits.length > 0) {
        prodCode = prodDigits;
      } else {
        prodCode = `${catId}${String(pIdx + 1).padStart(3, '0')}`;
      }

      return {
        ...prod,
        id: prodCode,
        code: prodCode,
        category: catName,
        subCategory: subCatName || (targetSubNode ? targetSubNode.name : 'عام'),
        basicUnit: prod.basicUnit || prod.unit || 'عدد',
        unit: prod.basicUnit || prod.unit || 'عدد',
        type: prod.type || 'stockable',
        barcode: prod.barcode || '',
        stockQty: typeof prod.stockQty === 'number' ? prod.stockQty : 0,
        sellingPrice: typeof prod.sellingPrice === 'number' ? prod.sellingPrice : 0,
        costPrice: typeof prod.costPrice === 'number' ? prod.costPrice : 0
      };
    });

    return { normalizedCats, normalizedProds };
  }

  private loadFromStorage() {
    try {
      const storedCategories = localStorage.getItem(CATEGORY_STORAGE_KEY);
      const storedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);

      let parsedCats: CategoryTreeNode[] | null = null;
      let parsedProds: FastProductItem[] | null = null;

      if (storedCategories) {
        try {
          const parsed = JSON.parse(storedCategories);
          if (Array.isArray(parsed)) {
            // Purge dummy test categories if found from previous sessions
            parsedCats = parsed.filter(
              c => c.name !== 'أجهزة وحواسيب' && c.name !== 'طابعات وماكينات تصوير' && c.name !== 'خدمات واستشارات تقنية'
            );
          }
        } catch {
          parsedCats = [];
        }
      }

      if (storedProducts) {
        try {
          const parsed = JSON.parse(storedProducts);
          if (Array.isArray(parsed)) {
            // Purge dummy test products if found from previous sessions
            parsedProds = parsed.filter(
              p => !p.id.startsWith('001001') && !p.id.startsWith('001002') && !p.id.startsWith('002001') && !p.id.startsWith('003001') && !p.id.startsWith('003002') &&
                   p.name !== 'HP ProBook 450 G9' && p.name !== 'HP ProBook 450 G10' && p.name !== 'Dell Latitude 5420'
            );
          }
        } catch {
          parsedProds = [];
        }
      }

      if (parsedCats && parsedCats.length > 0) {
        const { normalizedCats, normalizedProds } = this.normalizeAndMigrateData(
          parsedCats,
          parsedProds || []
        );
        this.categories = normalizedCats;
        this.products = normalizedProds;
      } else {
        this.categories = [];
        this.products = [];
      }
      this.persistCategories();
      this.persistProducts();
    } catch (e) {
      console.error('Failed to load categories & products from storage:', e);
      this.categories = [];
      this.products = [];
      this.persistCategories();
      this.persistProducts();
    }
  }

  public clearAllClassificationData(): { deletedMainGroups: number; deletedSubGroups: number; deletedProducts: number } {
    const deletedMainGroups = this.categories.length;
    const deletedSubGroups = this.categories.reduce((acc, cat) => acc + (cat.children?.length || 0), 0);
    const deletedProducts = this.products.length;

    this.categories = [];
    this.products = [];
    this.persistCategories();
    this.persistProducts();
    this.notify();

    return {
      deletedMainGroups,
      deletedSubGroups,
      deletedProducts
    };
  }

  private persistCategories(): boolean {
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(this.categories));
      return true;
    } catch (e) {
      console.error('Failed to persist categories to localStorage', e);
      return false;
    }
  }

  private persistProducts(): boolean {
    try {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(this.products));
      return true;
    } catch (e) {
      console.error('Failed to persist products to localStorage', e);
      return false;
    }
  }

  public reloadFromStorage(): void {
    this.loadFromStorage();
    this.notify();
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (err) {
        console.error('Listener callback error in categoryService:', err);
      }
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // ==========================================
  // LEVEL 1: MAIN GROUPS
  // ==========================================
  public getCategoryTree(): CategoryTreeNode[] {
    return [...this.categories];
  }

  public async saveCategory(newCategory: CategoryTreeNode): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate uniqueness of Main Group Name
      const exists = this.categories.some(
        c => c.name.trim().toLowerCase() === newCategory.name.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: 'اسم المجموعة الرئيسية موجود بالفعل' };
      }

      this.categories = [...this.categories, {
        ...newCategory,
        children: newCategory.children || []
      }];
      const saved = this.persistCategories();
      if (!saved) {
        return { success: false, error: 'تعذر حفظ المجموعة في قاعدة البيانات المحلية' };
      }

      auditEngine.logAction(
        'CATEGORY_CREATE',
        `إنشاء مجموعة رئيسية جديدة (${newCategory.name}) بكود [${newCategory.id}]`,
        'info'
      );

      this.notify();
      return { success: true };
    } catch (err: any) {
      console.error('Error saving category:', err);
      return { success: false, error: err.message || 'حدث خطأ أثناء حفظ المجموعة' };
    }
  }

  public async saveCategoryTree(updatedTree: CategoryTreeNode[]): Promise<{ success: boolean; error?: string }> {
    try {
      this.categories = [...updatedTree];
      const saved = this.persistCategories();
      if (!saved) {
        return { success: false, error: 'تعذر حفظ المجموعات' };
      }
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'خطأ في حفظ المجموعات' };
    }
  }

  public async updateCategory(catId: string, updatedName: string): Promise<{ success: boolean; error?: string }> {
    const trimmed = updatedName.trim();
    if (!trimmed) return { success: false, error: 'اسم المجموعة لا يمكن أن يكون فارغاً' };

    const oldCat = this.categories.find(c => c.id === catId);
    if (!oldCat) return { success: false, error: 'المجموعة غير موجودة' };

    const duplicate = this.categories.some(
      c => c.id !== catId && c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: 'اسم المجموعة الرئيسية موجود بالفعل' };
    }

    const oldName = oldCat.name;
    this.categories = this.categories.map(c => c.id === catId ? { ...c, name: trimmed } : c);
    // Sync category name in products
    this.products = this.products.map(p => p.category === oldName ? { ...p, category: trimmed } : p);

    this.persistCategories();
    this.persistProducts();

    auditEngine.logAction(
      'CATEGORY_UPDATE',
      `تعديل اسم المجموعة الرئيسية من (${oldName}) إلى (${trimmed})`,
      'info'
    );

    this.notify();
    return { success: true };
  }

  public async deleteCategory(catId: string): Promise<{ success: boolean; error?: string }> {
    const cat = this.categories.find(c => c.id === catId);
    if (!cat) return { success: false, error: 'المجموعة غير موجودة' };

    // Check if sub categories exist
    if (cat.children && cat.children.length > 0) {
      return { success: false, error: 'لا يمكن حذف مجموعة رئيسية تحتوي على مجموعات فرعية' };
    }

    // Check if products exist in this category
    const hasProducts = this.products.some(p => p.category === cat.name || p.code.startsWith(cat.id));
    if (hasProducts) {
      return { success: false, error: 'لا يمكن حذف مجموعة تحتوي على أصناف مسجلة' };
    }

    this.categories = this.categories.filter(c => c.id !== catId);
    this.persistCategories();

    auditEngine.logAction(
      'CATEGORY_DELETE',
      `حذف المجموعة الرئيسية (${cat.name})`,
      'warning'
    );

    this.notify();
    return { success: true };
  }

  // ==========================================
  // LEVEL 2: SUB GROUPS
  // ==========================================
  public async saveSubCategory(
    mainCatId: string, 
    newSubCategory: SubCategoryTreeNode
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const mainCat = this.categories.find(c => c.id === mainCatId);
      if (!mainCat) return { success: false, error: 'المجموعة الرئيسية غير موجودة' };

      const children = mainCat.children || [];
      // Validate uniqueness within the same main group
      const exists = children.some(
        s => s.name.trim().toLowerCase() === newSubCategory.name.trim().toLowerCase()
      );
      if (exists) {
        return { success: false, error: 'اسم المجموعة الفرعية موجود بالفعل في هذه المجموعة' };
      }

      const updatedChildren = [...children, newSubCategory];
      this.categories = this.categories.map(c => 
        c.id === mainCatId ? { ...c, children: updatedChildren } : c
      );

      this.persistCategories();

      auditEngine.logAction(
        'SUB_CATEGORY_CREATE',
        `إنشاء مجموعة فرعية جديدة (${newSubCategory.name}) بكود [${newSubCategory.id}] تحت المجموعة [${mainCat.name}]`,
        'info'
      );

      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'حدث خطأ أثناء حفظ المجموعة الفرعية' };
    }
  }

  public async updateSubCategory(
    mainCatId: string, 
    subCatId: string, 
    updatedName: string
  ): Promise<{ success: boolean; error?: string }> {
    const trimmed = updatedName.trim();
    if (!trimmed) return { success: false, error: 'اسم المجموعة الفرعية لا يمكن أن يكون فارغاً' };

    const mainCat = this.categories.find(c => c.id === mainCatId);
    if (!mainCat) return { success: false, error: 'المجموعة الرئيسية غير موجودة' };

    const children = mainCat.children || [];
    const oldSub = children.find(s => s.id === subCatId);
    if (!oldSub) return { success: false, error: 'المجموعة الفرعية غير موجودة' };

    // Duplicate check within same main group
    const duplicate = children.some(
      s => s.id !== subCatId && s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      return { success: false, error: 'اسم المجموعة الفرعية موجود بالفعل في هذه المجموعة' };
    }

    const oldName = oldSub.name;
    const updatedChildren = children.map(s => s.id === subCatId ? { ...s, name: trimmed } : s);
    this.categories = this.categories.map(c => 
      c.id === mainCatId ? { ...c, children: updatedChildren } : c
    );

    // Sync subCategory name in products of this main category
    this.products = this.products.map(p => {
      if (p.category === mainCat.name && (p.subCategory === oldName || p.code.startsWith(subCatId))) {
        return { ...p, subCategory: trimmed };
      }
      return p;
    });

    this.persistCategories();
    this.persistProducts();

    auditEngine.logAction(
      'SUB_CATEGORY_UPDATE',
      `تعديل اسم المجموعة الفرعية من (${oldName}) إلى (${trimmed})`,
      'info'
    );

    this.notify();
    return { success: true };
  }

  public async deleteSubCategory(mainCatId: string, subCatId: string): Promise<{ success: boolean; error?: string }> {
    const mainCat = this.categories.find(c => c.id === mainCatId);
    if (!mainCat) return { success: false, error: 'المجموعة الرئيسية غير موجودة' };

    const children = mainCat.children || [];
    const subCat = children.find(s => s.id === subCatId);
    if (!subCat) return { success: false, error: 'المجموعة الفرعية غير موجودة' };

    // Check if products exist in this sub category
    const hasProducts = this.products.some(
      p => (p.category === mainCat.name && p.subCategory === subCat.name) || p.code.startsWith(subCatId)
    );
    if (hasProducts) {
      return { success: false, error: 'لا يمكن حذف مجموعة فرعية تحتوي على أصناف مسجلة' };
    }

    const updatedChildren = children.filter(s => s.id !== subCatId);
    this.categories = this.categories.map(c => 
      c.id === mainCatId ? { ...c, children: updatedChildren } : c
    );

    this.persistCategories();

    auditEngine.logAction(
      'SUB_CATEGORY_DELETE',
      `حذف المجموعة الفرعية (${subCat.name})`,
      'warning'
    );

    this.notify();
    return { success: true };
  }

  // ==========================================
  // LEVEL 3: PRODUCTS
  // ==========================================
  public getProducts(): FastProductItem[] {
    return [...this.products];
  }

  public async saveProduct(newProduct: FastProductItem): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate unique product name within the same category/sub category
      const isDuplicateName = this.products.some(
        p => p.name.trim().toLowerCase() === newProduct.name.trim().toLowerCase() &&
             p.category === newProduct.category &&
             (!newProduct.subCategory || !p.subCategory || p.subCategory === newProduct.subCategory)
      );
      if (isDuplicateName) {
        return { success: false, error: 'اسم الصنف موجود بالفعل داخل هذه المجموعة' };
      }

      if (newProduct.barcode) {
        const isDuplicateBarcode = this.products.some(
          p => p.barcode && p.barcode.trim().toLowerCase() === newProduct.barcode.trim().toLowerCase()
        );
        if (isDuplicateBarcode) {
          return { success: false, error: 'الباركود مستخدم بالفعل' };
        }
      }

      this.products = [...this.products, newProduct];
      this.persistProducts();

      auditEngine.logAction(
        'PRODUCT_CREATE',
        `إضافة صنف جديد (${newProduct.name}) بكود [${newProduct.code}] تحت [${newProduct.category} / ${newProduct.subCategory}]`,
        'info'
      );

      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'تعذر حفظ الصنف' };
    }
  }

  public async saveProducts(updatedProducts: FastProductItem[]): Promise<{ success: boolean; error?: string }> {
    try {
      this.products = [...updatedProducts];
      this.persistProducts();
      this.notify();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'تعذر حفظ الأصناف' };
    }
  }

  public async updateProduct(productId: string, updates: Partial<FastProductItem>): Promise<{ success: boolean; error?: string }> {
    const existing = this.products.find(p => p.id === productId);
    if (!existing) return { success: false, error: 'الصنف غير موجود' };

    if (updates.name) {
      const isDuplicate = this.products.some(
        p => p.id !== productId && 
             p.name.trim().toLowerCase() === updates.name!.trim().toLowerCase() &&
             p.category === (updates.category || existing.category) &&
             (!updates.subCategory || !existing.subCategory || !p.subCategory || p.subCategory === (updates.subCategory || existing.subCategory))
      );
      if (isDuplicate) return { success: false, error: 'اسم الصنف موجود بالفعل' };
    }

    if (updates.barcode) {
      const isDuplicate = this.products.some(
        p => p.id !== productId && p.barcode && p.barcode.trim().toLowerCase() === updates.barcode!.trim().toLowerCase()
      );
      if (isDuplicate) return { success: false, error: 'الباركود مستخدم بالفعل' };
    }

    this.products = this.products.map(p => p.id === productId ? { ...p, ...updates } : p);
    this.persistProducts();
    this.notify();
    return { success: true };
  }

  public async deleteProduct(productId: string): Promise<{ success: boolean; error?: string }> {
    const prod = this.products.find(p => p.id === productId);
    if (!prod) return { success: false, error: 'الصنف غير موجود' };

    if (prod.stockQty > 0) {
      return { success: false, error: 'لا يمكن حذف صنف لديه رصيد مخزني' };
    }

    this.products = this.products.filter(p => p.id !== productId);
    this.persistProducts();

    auditEngine.logAction(
      'PRODUCT_DELETE',
      `حذف الصنف (${prod.name})`,
      'warning'
    );

    this.notify();
    return { success: true };
  }
}

export const categoryService = new CategoryService();
