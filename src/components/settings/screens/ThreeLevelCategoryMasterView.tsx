import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FolderTree, 
  Trash2, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderOpen,
  Package,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UnifiedMessageOverlay } from '../../common/UnifiedMessageOverlay';
import { 
  categoryService, 
  FastProductItem, 
  CategoryTreeNode, 
  SubCategoryTreeNode,
  detectClassificationMode
} from '../../../services/categoryService';
import { ProductTreeViewModal } from './ProductTreeViewModal';
import { ClassificationMethodSelectorModal } from './ClassificationMethodSelectorModal';
import { unitOfMeasureService } from '../../../services/unitOfMeasureService';

interface ThreeLevelCategoryMasterViewProps {
  products: FastProductItem[];
  setProducts: React.Dispatch<React.SetStateAction<FastProductItem[]>>;
  categoryTree: CategoryTreeNode[];
  setCategoryTree: React.Dispatch<React.SetStateAction<CategoryTreeNode[]>>;
  onDirtyChange?: (isDirty: boolean) => void;
  showNotice?: (msg: string) => void;
}

export const ThreeLevelCategoryMasterView: React.FC<ThreeLevelCategoryMasterViewProps> = ({
  products,
  setProducts,
  categoryTree,
  setCategoryTree,
  onDirtyChange,
  showNotice
}) => {
  // Navigation State:
  // Level 1: activeMainCategoryId === null (Main Groups List)
  // Level 2: activeMainCategoryId !== null && activeSubCategoryId === null (Sub Groups List)
  // Level 3: activeMainCategoryId !== null && activeSubCategoryId !== null (Products List)
  const [activeMainCategoryId, setActiveMainCategoryId] = useState<string | null>(null);
  const [activeSubCategoryId, setActiveSubCategoryId] = useState<string | null>(null);

  // Tree View Classification Mode Selector Modal State
  const [isClassificationSelectorOpen, setIsClassificationSelectorOpen] = useState<boolean>(false);
  const [treeLevelMode, setTreeLevelMode] = useState<'2-level' | '3-level'>('3-level');

  // Tree View Modal State
  const [isTreeViewOpen, setIsTreeViewOpen] = useState<boolean>(false);

  const handleOpenTreeView = () => {
    const mode = detectClassificationMode(categoryTree, products);
    if (mode === '3-level') {
      setTreeLevelMode('3-level');
      setIsClassificationSelectorOpen(false);
      setIsTreeViewOpen(true);
    } else if (mode === '2-level') {
      setTreeLevelMode('2-level');
      setIsClassificationSelectorOpen(false);
      setIsTreeViewOpen(true);
    } else {
      // Mode is 'ask-user' (no products and no sub-groups)
      setIsClassificationSelectorOpen(true);
    }
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dynamic Units of Measure sourced centrally from unitOfMeasureService
  const [availableUnits, setAvailableUnits] = useState<string[]>(() => unitOfMeasureService.getUnitNames());

  useEffect(() => {
    const unsubscribe = unitOfMeasureService.subscribe(() => {
      setAvailableUnits(unitOfMeasureService.getUnitNames());
    });
    return unsubscribe;
  }, []);

  // Ensures current unit is preserved in dropdown even if not in central list
  const getDropdownUnits = (selectedUnit?: string) => {
    if (!selectedUnit) return availableUnits;
    if (availableUnits.includes(selectedUnit)) return availableUnits;
    return [selectedUnit, ...availableUnits];
  };

  // Center Screen Toast
  const [centerToast, setCenterToast] = useState<{
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  } | null>(null);

  const showCenterToast = (
    message: string,
    type: 'error' | 'success' | 'warning' | 'info' = 'error'
  ) => {
    setCenterToast({ message, type });
  };

  // Active Main Category Object
  const activeMainCategory = useMemo(() => {
    if (!activeMainCategoryId) return null;
    return categoryTree.find(c => c.id === activeMainCategoryId) || null;
  }, [categoryTree, activeMainCategoryId]);

  // Active Sub Category Object
  const activeSubCategory = useMemo(() => {
    if (!activeMainCategory || !activeSubCategoryId) return null;
    return activeMainCategory.children?.find(s => s.id === activeSubCategoryId) || null;
  }, [activeMainCategory, activeSubCategoryId]);

  // Sub Group counts & Product Counts per main category
  const mainCategoryStats = useMemo(() => {
    const stats: Record<string, { subCount: number; prodCount: number }> = {};
    categoryTree.forEach(cat => {
      const subCount = cat.children?.length || 0;
      const prodCount = products.filter(p => p.category === cat.name || p.code.startsWith(cat.id)).length;
      stats[cat.id] = { subCount, prodCount };
    });
    return stats;
  }, [categoryTree, products]);

  // Product Counts per sub category
  const subCategoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (activeMainCategory?.children) {
      activeMainCategory.children.forEach(sub => {
        counts[sub.id] = products.filter(p => 
          (p.category === activeMainCategory.name && p.subCategory === sub.name) ||
          p.code.startsWith(sub.id)
        ).length;
      });
    }
    return counts;
  }, [activeMainCategory, products]);

  // Filtered Main Categories (Level 1)
  const filteredMainCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoryTree;
    const q = searchQuery.toLowerCase().trim();
    return categoryTree.filter(cat => 
      cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q)
    );
  }, [categoryTree, searchQuery]);

  // Filtered Sub Categories (Level 2)
  const filteredSubCategories = useMemo(() => {
    if (!activeMainCategory) return [];
    const children = activeMainCategory.children || [];
    if (!searchQuery.trim()) return children;
    const q = searchQuery.toLowerCase().trim();
    return children.filter(sub => 
      sub.name.toLowerCase().includes(q) || sub.id.toLowerCase().includes(q)
    );
  }, [activeMainCategory, searchQuery]);

  // Filtered Products for Active Sub Category (Level 3)
  const filteredProducts = useMemo(() => {
    if (!activeMainCategory || !activeSubCategory) return [];
    const subProds = products.filter(p => 
      (p.category === activeMainCategory.name && p.subCategory === activeSubCategory.name) ||
      p.code.startsWith(activeSubCategory.id)
    );
    if (!searchQuery.trim()) return subProds;
    const q = searchQuery.toLowerCase().trim();
    return subProds.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.code.toLowerCase().includes(q) || 
      p.barcode?.toLowerCase().includes(q)
    );
  }, [products, activeMainCategory, activeSubCategory, searchQuery]);

  // ==========================================
  // LEVEL 1: 3-DIGIT MAIN GROUP CODE GENERATION (001, 002, ...)
  // ==========================================
  const getNextMainGroupCode = (tree: CategoryTreeNode[] = categoryTree): string => {
    let maxNum = 0;
    for (const cat of tree) {
      const digits = cat.id.replace(/\D/g, '');
      const num = parseInt(digits, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    const nextNum = maxNum > 0 ? maxNum + 1 : tree.length + 1;
    let candidate = String(nextNum).padStart(3, '0');
    let cur = nextNum;
    while (tree.some(c => c.id === candidate)) {
      cur++;
      candidate = String(cur).padStart(3, '0');
    }
    return candidate;
  };

  const getMainGroup3DigitCode = (cat: CategoryTreeNode): string => {
    const digits = cat.id.replace(/\D/g, '');
    if (digits && digits.length <= 3) {
      return digits.padStart(3, '0');
    }
    return cat.id.slice(0, 3).padStart(3, '0');
  };

  // ==========================================
  // LEVEL 2: 6-DIGIT SUB GROUP CODE GENERATION (001001, 001002, ...)
  // ==========================================
  const getNextSubGroupCode = (mainCat: CategoryTreeNode): string => {
    const mainCode = getMainGroup3DigitCode(mainCat);
    const children = mainCat.children || [];
    let maxSeq = 0;
    for (const sub of children) {
      if (sub.id.startsWith(mainCode) && sub.id.length === 6) {
        const seq = parseInt(sub.id.slice(3), 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else {
        const digits = sub.id.replace(/\D/g, '');
        if (digits.length >= 3) {
          const last3 = parseInt(digits.slice(-3), 10);
          if (!isNaN(last3) && last3 > maxSeq) maxSeq = last3;
        }
      }
    }
    const nextSeq = maxSeq > 0 ? maxSeq + 1 : children.length + 1;
    let candidate = `${mainCode}${String(nextSeq).padStart(3, '0')}`;
    let cur = nextSeq;
    while (children.some(s => s.id === candidate)) {
      cur++;
      candidate = `${mainCode}${String(cur).padStart(3, '0')}`;
    }
    return candidate;
  };

  // ==========================================
  // LEVEL 3: 9-DIGIT PRODUCT CODE GENERATION (001001001, 001001002, ...)
  // ==========================================
  const getNextProductCode = (
    mainCat: CategoryTreeNode,
    subCat: SubCategoryTreeNode,
    prods: FastProductItem[] = products
  ): string => {
    const subCode = subCat.id.padStart(6, '0').slice(-6);
    const subProds = prods.filter(p => 
      (p.category === mainCat.name && p.subCategory === subCat.name) ||
      p.code.startsWith(subCode)
    );
    let maxSeq = 0;
    for (const p of subProds) {
      if (p.code && p.code.startsWith(subCode) && p.code.length === 9) {
        const seq = parseInt(p.code.slice(6), 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else if (p.code) {
        const digits = p.code.replace(/\D/g, '');
        if (digits.length >= 3) {
          const last3 = parseInt(digits.slice(-3), 10);
          if (!isNaN(last3) && last3 > maxSeq) maxSeq = last3;
        }
      }
    }
    const nextSeq = maxSeq > 0 ? maxSeq + 1 : subProds.length + 1;
    let candidate = `${subCode}${String(nextSeq).padStart(3, '0')}`;
    let cur = nextSeq;
    while (prods.some(p => p.code === candidate)) {
      cur++;
      candidate = `${subCode}${String(cur).padStart(3, '0')}`;
    }
    return candidate;
  };

  // ==========================================
  // LEVEL 1: INLINE ENTRY STATE (MAIN GROUPS)
  // ==========================================
  const [newMainGroupCode, setNewMainGroupCode] = useState<string>(getNextMainGroupCode());
  const [newMainGroupName, setNewMainGroupName] = useState<string>('');
  const newMainGroupNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeMainCategoryId) {
      setNewMainGroupCode(getNextMainGroupCode(categoryTree));
      setTimeout(() => {
        newMainGroupNameInputRef.current?.focus();
      }, 100);
    }
  }, [activeMainCategoryId, categoryTree.length]);

  const handleSaveInlineMainGroup = async () => {
    const trimmedName = newMainGroupName.trim();
    if (!trimmedName) return;

    const exists = categoryTree.some(
      c => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      showCenterToast('اسم المجموعة الرئيسية موجود بالفعل', 'error');
      return;
    }

    const code = getNextMainGroupCode(categoryTree);
    const newCategory: CategoryTreeNode = {
      id: code,
      name: trimmedName,
      level: 1,
      itemCount: 0,
      children: []
    };

    const result = await categoryService.saveCategory(newCategory);
    if (!result.success) {
      showCenterToast(result.error || 'تعذر حفظ المجموعة في قاعدة البيانات', 'error');
      return;
    }

    const updatedTree = categoryService.getCategoryTree();
    setCategoryTree(updatedTree);
    setNewMainGroupName('');
    setNewMainGroupCode(getNextMainGroupCode(updatedTree));

    setTimeout(() => {
      newMainGroupNameInputRef.current?.focus();
    }, 50);
  };

  const handleInlineMainGroupKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineMainGroup();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCenterToast(null);
      if (newMainGroupName.trim() !== '') {
        setNewMainGroupName('');
      } else {
        newMainGroupNameInputRef.current?.blur();
      }
    }
  };

  const handleUpdateMainGroupName = async (catId: string, updatedName: string) => {
    const trimmed = updatedName.trim();
    if (!trimmed) return;

    const oldCat = categoryTree.find(c => c.id === catId);
    if (!oldCat || oldCat.name === trimmed) return;

    const duplicate = categoryTree.some(
      c => c.id !== catId && c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      showCenterToast('اسم المجموعة الرئيسية موجود بالفعل', 'error');
      return;
    }

    const res = await categoryService.updateCategory(catId, trimmed);
    if (!res.success) {
      showCenterToast(res.error || 'تعذر تحديث اسم المجموعة', 'error');
      return;
    }

    setCategoryTree(categoryService.getCategoryTree());
    setProducts(categoryService.getProducts());
  };

  // ==========================================
  // LEVEL 2: INLINE ENTRY STATE (SUB GROUPS)
  // ==========================================
  const [newSubGroupCode, setNewSubGroupCode] = useState<string>('');
  const [newSubGroupName, setNewSubGroupName] = useState<string>('');
  const newSubGroupNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeMainCategory && !activeSubCategoryId) {
      setNewSubGroupCode(getNextSubGroupCode(activeMainCategory));
      setTimeout(() => {
        newSubGroupNameInputRef.current?.focus();
      }, 100);
    }
  }, [activeMainCategoryId, activeSubCategoryId, activeMainCategory?.children?.length]);

  const handleSaveInlineSubGroup = async () => {
    const trimmedName = newSubGroupName.trim();
    if (!trimmedName || !activeMainCategory) return;

    const children = activeMainCategory.children || [];
    const exists = children.some(
      s => s.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      showCenterToast('اسم المجموعة الفرعية موجود بالفعل في هذه المجموعة', 'error');
      return;
    }

    const code = getNextSubGroupCode(activeMainCategory);
    const newSub: SubCategoryTreeNode = {
      id: code,
      name: trimmedName,
      level: 2,
      itemCount: 0
    };

    const result = await categoryService.saveSubCategory(activeMainCategory.id, newSub);
    if (!result.success) {
      showCenterToast(result.error || 'تعذر حفظ المجموعة الفرعية', 'error');
      return;
    }

    const updatedTree = categoryService.getCategoryTree();
    setCategoryTree(updatedTree);
    setNewSubGroupName('');

    const refreshedMain = updatedTree.find(c => c.id === activeMainCategory.id);
    if (refreshedMain) {
      setNewSubGroupCode(getNextSubGroupCode(refreshedMain));
    }

    setTimeout(() => {
      newSubGroupNameInputRef.current?.focus();
    }, 50);
  };

  const handleInlineSubGroupKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineSubGroup();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCenterToast(null);
      if (newSubGroupName.trim() !== '') {
        setNewSubGroupName('');
      } else {
        newSubGroupNameInputRef.current?.blur();
      }
    }
  };

  const handleUpdateSubGroupName = async (subCatId: string, updatedName: string) => {
    const trimmed = updatedName.trim();
    if (!trimmed || !activeMainCategory) return;

    const children = activeMainCategory.children || [];
    const oldSub = children.find(s => s.id === subCatId);
    if (!oldSub || oldSub.name === trimmed) return;

    const duplicate = children.some(
      s => s.id !== subCatId && s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) {
      showCenterToast('اسم المجموعة الفرعية موجود بالفعل في هذه المجموعة', 'error');
      return;
    }

    const res = await categoryService.updateSubCategory(activeMainCategory.id, subCatId, trimmed);
    if (!res.success) {
      showCenterToast(res.error || 'تعذر تحديث اسم المجموعة الفرعية', 'error');
      return;
    }

    setCategoryTree(categoryService.getCategoryTree());
    setProducts(categoryService.getProducts());
  };

  // ==========================================
  // LEVEL 3: INLINE ENTRY STATE (PRODUCTS)
  // ==========================================
  const [newProdCode, setNewProdCode] = useState<string>('');
  const [newProdName, setNewProdName] = useState<string>('');
  const [newProdBasicUnit, setNewProdBasicUnit] = useState<string>('عدد');
  const [newProdSubUnit, setNewProdSubUnit] = useState<string>('');
  const [newProdConversionFactor, setNewProdConversionFactor] = useState<string>('');
  const [newProdType, setNewProdType] = useState<'stockable' | 'service'>('stockable');
  const [newProdBarcode, setNewProdBarcode] = useState<string>('');

  const newProdNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeMainCategory && activeSubCategory) {
      setNewProdCode(getNextProductCode(activeMainCategory, activeSubCategory, products));
      setTimeout(() => {
        newProdNameInputRef.current?.focus();
      }, 100);
    }
  }, [activeMainCategoryId, activeSubCategoryId, products.length]);

  const handleSaveInlineProduct = async () => {
    const trimmedName = newProdName.trim();
    if (!trimmedName || !activeMainCategory || !activeSubCategory) return;

    // 1. Check duplicate product name within the same sub category
    const isDuplicateName = products.some(
      p => p.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
           p.category === activeMainCategory.name &&
           p.subCategory === activeSubCategory.name
    );
    if (isDuplicateName) {
      showCenterToast('اسم الصنف موجود بالفعل داخل هذه المجموعة الفرعية', 'error');
      return;
    }

    // 2. Sub Unit & Conversion Factor Validation
    const trimmedSubUnit = newProdSubUnit.trim();
    let parsedFactor: number | undefined = undefined;

    if (trimmedSubUnit) {
      const rawFactor = newProdConversionFactor.trim();
      if (!rawFactor) {
        showCenterToast('يجب إدخال معامل التحويل للوحدة الفرعية', 'error');
        return;
      }
      const num = parseFloat(rawFactor);
      if (isNaN(num) || num <= 0) {
        showCenterToast('يجب أن يكون معامل التحويل أكبر من صفر', 'error');
        return;
      }
      parsedFactor = num;
    }

    // 3. Barcode is optional. If provided, check duplicate barcode
    const trimmedBarcode = newProdBarcode.trim();
    if (trimmedBarcode) {
      const isDuplicateBarcode = products.some(
        p => p.barcode && p.barcode.trim().toLowerCase() === trimmedBarcode.toLowerCase()
      );
      if (isDuplicateBarcode) {
        showCenterToast('الباركود مستخدم بالفعل', 'error');
        return;
      }
    }

    const code = getNextProductCode(activeMainCategory, activeSubCategory, products);

    const newProduct: FastProductItem = {
      id: code,
      code: code,
      name: trimmedName,
      category: activeMainCategory.name,
      subCategory: activeSubCategory.name,
      type: newProdType,
      unit: newProdBasicUnit || 'عدد',
      basicUnit: newProdBasicUnit || 'عدد',
      subUnit: trimmedSubUnit || undefined,
      conversionFactor: parsedFactor,
      barcode: trimmedBarcode,
      sellingPrice: 0,
      costPrice: 0,
      stockQty: 0
    };

    const result = await categoryService.saveProduct(newProduct);
    if (!result.success) {
      showCenterToast(result.error || 'تعذر حفظ الصنف في قاعدة البيانات', 'error');
      return;
    }

    const updatedProducts = categoryService.getProducts();
    setProducts(updatedProducts);
    
    setNewProdName('');
    setNewProdBarcode('');
    setNewProdBasicUnit('عدد');
    setNewProdSubUnit('');
    setNewProdConversionFactor('');
    setNewProdCode(getNextProductCode(activeMainCategory, activeSubCategory, updatedProducts));

    setTimeout(() => {
      newProdNameInputRef.current?.focus();
    }, 50);
  };

  const handleInlineProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveInlineProduct();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCenterToast(null);
      const hasDraft = Boolean(
        newProdName.trim() !== '' ||
        newProdBarcode.trim() !== '' ||
        newProdSubUnit.trim() !== '' ||
        newProdConversionFactor.trim() !== ''
      );

      if (hasDraft) {
        setNewProdName('');
        setNewProdBarcode('');
        setNewProdBasicUnit('عدد');
        setNewProdSubUnit('');
        setNewProdConversionFactor('');
        setNewProdType('stockable');
        if (activeMainCategory && activeSubCategory) {
          setNewProdCode(getNextProductCode(activeMainCategory, activeSubCategory, products));
        }
      } else {
        newProdNameInputRef.current?.blur();
      }
    }
  };

  const handleUpdateProductField = async (
    productId: string, 
    field: keyof FastProductItem, 
    value: any
  ) => {
    if (field === 'name') {
      const trimmed = String(value || '').trim();
      if (trimmed && activeMainCategory && activeSubCategory) {
        const isDuplicate = products.some(
          p => p.id !== productId && 
               p.name.trim().toLowerCase() === trimmed.toLowerCase() &&
               p.category === activeMainCategory.name &&
               p.subCategory === activeSubCategory.name
        );
        if (isDuplicate) {
          showCenterToast('اسم الصنف موجود بالفعل داخل هذه المجموعة الفرعية', 'error');
          return;
        }
      }
    } else if (field === 'barcode') {
      const trimmed = String(value || '').trim();
      if (trimmed) {
        const isDuplicate = products.some(
          p => p.id !== productId && p.barcode && p.barcode.trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (isDuplicate) {
          showCenterToast('الباركود مستخدم بالفعل', 'error');
          return;
        }
      }
    } else if (field === 'conversionFactor') {
      const prod = products.find(p => p.id === productId);
      if (prod?.subUnit) {
        const valNum = parseFloat(value);
        if (isNaN(valNum) || valNum <= 0) {
          showCenterToast('يجب أن يكون معامل التحويل أكبر من صفر', 'error');
          return;
        }
      }
    }

    const updates: Partial<FastProductItem> = { [field]: value };
    if (field === 'basicUnit') {
      updates.unit = value;
    } else if (field === 'subUnit' && !value) {
      updates.conversionFactor = undefined;
    }

    const res = await categoryService.updateProduct(productId, updates);
    if (!res.success) {
      showCenterToast(res.error || 'تعذر تعديل الصنف', 'error');
      return;
    }
    setProducts(categoryService.getProducts());
  };

  // ==========================================
  // UNCOMMITTED / DIRTY TRACKING
  // ==========================================
  const hasUncommittedData = useMemo(() => {
    return Boolean(
      newMainGroupName.trim().length > 0 ||
      newSubGroupName.trim().length > 0 ||
      newProdName.trim().length > 0 ||
      newProdBarcode.trim().length > 0 ||
      newProdSubUnit.trim().length > 0 ||
      newProdConversionFactor.trim().length > 0
    );
  }, [newMainGroupName, newSubGroupName, newProdName, newProdBarcode, newProdSubUnit, newProdConversionFactor]);

  useEffect(() => {
    onDirtyChange?.(hasUncommittedData);
  }, [hasUncommittedData, onDirtyChange]);

  // ==========================================
  // SAFE DELETE GUARDS & DIALOGS
  // ==========================================
  const [guardModal, setGuardModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [confirmDeleteModal, setConfirmDeleteModal] = useState<{
    isOpen: boolean;
    type: 'main_group' | 'sub_group' | 'product';
    id: string;
    name: string;
  }>({
    isOpen: false,
    type: 'main_group',
    id: '',
    name: ''
  });

  const handleDeleteMainGroupClick = (cat: CategoryTreeNode) => {
    const stats = mainCategoryStats[cat.id] || { subCount: 0, prodCount: 0 };
    if (stats.subCount > 0) {
      setGuardModal({
        isOpen: true,
        title: 'لا يمكن حذف المجموعة الرئيسية',
        message: `المجموعة الرئيسية (${cat.name}) تحتوي على (${stats.subCount}) مجموعة فرعية مسجلة. يرجى حذف المجموعات الفرعية التابعة أولاً للحفاظ على سلامة البيانات.`
      });
      return;
    }
    if (stats.prodCount > 0) {
      setGuardModal({
        isOpen: true,
        title: 'لا يمكن حذف المجموعة الرئيسية',
        message: `المجموعة الرئيسية (${cat.name}) تحتوي على (${stats.prodCount}) صنف مسجل. يرجى حذف أو نقل الأصناف التابعة أولاً.`
      });
      return;
    }

    setConfirmDeleteModal({
      isOpen: true,
      type: 'main_group',
      id: cat.id,
      name: cat.name
    });
  };

  const handleDeleteSubGroupClick = (sub: SubCategoryTreeNode) => {
    const count = subCategoryProductCounts[sub.id] || 0;
    if (count > 0) {
      setGuardModal({
        isOpen: true,
        title: 'لا يمكن حذف المجموعة الفرعية',
        message: `المجموعة الفرعية (${sub.name}) تحتوي على (${count}) صنف مسجل. يرجى حذف أو نقل الأصناف التابعة أولاً للحفاظ على سلامة البيانات.`
      });
      return;
    }

    setConfirmDeleteModal({
      isOpen: true,
      type: 'sub_group',
      id: sub.id,
      name: sub.name
    });
  };

  const handleDeleteProductClick = (prod: FastProductItem) => {
    if (prod.stockQty > 0) {
      setGuardModal({
        isOpen: true,
        title: 'لا يمكن حذف الصنف',
        message: `الصنف (${prod.name}) لديه رصيد مخزني فعلي (${prod.stockQty} ${prod.unit}). يجب تصفية المخزون أولاً قبل الحذف.`
      });
      return;
    }

    setConfirmDeleteModal({
      isOpen: true,
      type: 'product',
      id: prod.id,
      name: prod.name
    });
  };

  const handleExecuteDelete = async () => {
    const { type, id, name } = confirmDeleteModal;
    if (type === 'main_group') {
      const res = await categoryService.deleteCategory(id);
      if (!res.success) {
        showCenterToast(res.error || 'تعذر حذف المجموعة الرئيسية', 'error');
        setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        return;
      }
      setCategoryTree(categoryService.getCategoryTree());
      if (activeMainCategoryId === id) {
        setActiveMainCategoryId(null);
        setActiveSubCategoryId(null);
      }
      showNotice?.(`تم حذف المجموعة الرئيسية (${name})`);
    } else if (type === 'sub_group') {
      if (!activeMainCategory) return;
      const res = await categoryService.deleteSubCategory(activeMainCategory.id, id);
      if (!res.success) {
        showCenterToast(res.error || 'تعذر حذف المجموعة الفرعية', 'error');
        setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        return;
      }
      setCategoryTree(categoryService.getCategoryTree());
      if (activeSubCategoryId === id) {
        setActiveSubCategoryId(null);
      }
      showNotice?.(`تم حذف المجموعة الفرعية (${name})`);
    } else if (type === 'product') {
      const res = await categoryService.deleteProduct(id);
      if (!res.success) {
        showCenterToast(res.error || 'تعذر حذف الصنف', 'error');
        setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
        return;
      }
      setProducts(categoryService.getProducts());
      showNotice?.(`تم حذف الصنف (${name})`);
    }
    setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div id="category-products-3level-container" className="space-y-3.5 animate-fadeIn" dir="rtl">
      
      {/* ========================================================================= */}
      {/* TOP BAR / BREADCRUMB HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            {activeSubCategory ? (
              <Package className="w-5 h-5" />
            ) : activeMainCategory ? (
              <FolderOpen className="w-5 h-5" />
            ) : (
              <FolderTree className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse flex-wrap gap-y-1">
              {/* Level 1: Main Groups */}
              <button 
                type="button"
                onClick={() => {
                  setActiveMainCategoryId(null);
                  setActiveSubCategoryId(null);
                  setSearchQuery('');
                }}
                className={`text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  !activeMainCategory ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-amber-400'
                }`}
              >
                المجموعات الرئيسية
              </button>

              {/* Level 2: Sub Groups */}
              {activeMainCategory && (
                <>
                  <span className="text-slate-600 text-xs font-mono">›</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSubCategoryId(null);
                      setSearchQuery('');
                    }}
                    className={`text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center space-x-1 space-x-reverse ${
                      !activeSubCategory ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-amber-400'
                    }`}
                  >
                    <span>{activeMainCategory.name}</span>
                    <span className="text-[11px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800 font-mono font-normal">
                      ({activeMainCategory.id})
                    </span>
                  </button>
                </>
              )}

              {/* Level 3: Products */}
              {activeSubCategory && (
                <>
                  <span className="text-slate-600 text-xs font-mono">›</span>
                  <h3 className="text-xs sm:text-sm font-black text-emerald-400 flex items-center space-x-1 space-x-reverse">
                    <span>{activeSubCategory.name}</span>
                    <span className="text-[11px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800 font-mono font-normal">
                      ({filteredProducts.length} صنف)
                    </span>
                  </h3>
                </>
              )}
            </div>
            
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeSubCategory ? (
                <>إدارة الأصناف المسجلة داخل المجموعة الفرعية <strong className="text-slate-200">"{activeSubCategory.name}"</strong> (هيكل 3 مستويات)</>
              ) : activeMainCategory ? (
                <>إدارة المجموعات الفرعية التابعة للمجموعة الرئيسية <strong className="text-slate-200">"{activeMainCategory.name}"</strong></>
              ) : (
                <>إدارة هيكل 3 مستويات: مجموعة رئيسية (Level 1) ← مجموعة فرعية (Level 2) ← أصناف (Level 3)</>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls & Global Search */}
        <div className="flex items-center space-x-2.5 space-x-reverse">
          {/* Back Button when deep in hierarchy */}
          {activeSubCategory ? (
            <button
              type="button"
              onClick={() => {
                setActiveSubCategoryId(null);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer"
              title="العودة للمجموعات الفرعية"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة للمجموعات الفرعية</span>
            </button>
          ) : activeMainCategory ? (
            <button
              type="button"
              onClick={() => {
                setActiveMainCategoryId(null);
                setSearchQuery('');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer"
              title="العودة للمجموعات الرئيسية"
            >
              <ChevronRight className="w-4 h-4" />
              <span>العودة للمجموعات الرئيسية</span>
            </button>
          ) : null}

          {/* Search box */}
          <div className="w-48 sm:w-60 relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubCategory 
                  ? "بحث في أصناف المجموعة..." 
                  : activeMainCategory 
                    ? "بحث في المجموعات الفرعية..." 
                    : "بحث في المجموعات الرئيسية..."
              }
              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pr-9 pl-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-2.5 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Tree View Trigger Modal Button */}
          <button
            type="button"
            onClick={handleOpenTreeView}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center space-x-1.5 space-x-reverse shadow-sm cursor-pointer transition-all shrink-0"
            title="عرض وتصدير وطباعة شجرة الأصناف الكاملة"
          >
            <FolderTree className="w-4 h-4 text-amber-400" />
            <span>شجرة الأصناف</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: MAIN GROUPS LIST */}
      {/* ========================================================================= */}
      {!activeMainCategory && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-sm animate-fadeIn">
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Folder className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">
                المجموعات الرئيسية (المستوى الأول) — ({filteredMainCategories.length} مجموعة)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              انقر على اسم المجموعة أو زر <strong className="text-amber-400">المجموعات الفرعية</strong> للدخول للمستوى التالي
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold">
                  <th className="p-3 pr-4 w-28 text-right">كود المجموعة</th>
                  <th className="p-3 text-center">اسم المجموعة الرئيسية</th>
                  <th className="p-3 w-32 text-center">المجموعات الفرعية</th>
                  <th className="p-3 w-28 text-center">الأصناف</th>
                  <th className="p-3 w-36 text-center">إجراء "المجموعات الفرعية"</th>
                  <th className="p-3 w-16 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredMainCategories.map((cat) => {
                  const stats = mainCategoryStats[cat.id] || { subCount: 0, prodCount: 0 };
                  return (
                    <tr 
                      key={cat.id} 
                      className="hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* Code */}
                      <td className="p-3 pr-4 font-mono font-bold text-amber-400 text-xs">
                        {cat.id}
                      </td>

                      {/* Name - Inline Editable (Prominent, Centered & Expanded) */}
                      <td className="p-2">
                        <input
                          type="text"
                          defaultValue={cat.name}
                          onBlur={(e) => handleUpdateMainGroupName(cat.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 border border-transparent focus:border-amber-500 rounded-lg px-3 py-2 text-sm sm:text-base text-center font-bold text-slate-100 focus:outline-none transition-colors"
                          title="انقر لتعديل اسم المجموعة واضغط Enter"
                        />
                      </td>

                      {/* Sub Category Count badge */}
                      <td className="p-2.5 text-center font-mono">
                        <span className="bg-slate-900 text-blue-300 px-2.5 py-0.5 rounded-full border border-slate-800 text-[11px] font-bold">
                          {stats.subCount} مجموعات فرعية
                        </span>
                      </td>

                      {/* Product Count badge */}
                      <td className="p-2.5 text-center font-mono">
                        <span className="bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-800 text-[11px]">
                          {stats.prodCount} صنف
                        </span>
                      </td>

                      {/* Action to open Level 2 Sub Groups */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMainCategoryId(cat.id);
                            setActiveSubCategoryId(null);
                            setSearchQuery('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 space-x-reverse w-full transition-all cursor-pointer shadow-sm"
                        >
                          <span>فتح المجموعات الفرعية</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteMainGroupClick(cat)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="حذف المجموعة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* ========================================================================= */}
                {/* INLINE ENTRY ROW: NEW MAIN GROUP */}
                {/* ========================================================================= */}
                <tr className="bg-amber-950/20 border-t-2 border-amber-500/30">
                  {/* Next Auto Code (3 digits) */}
                  <td className="p-2 pr-4 font-mono font-bold text-amber-400 text-xs">
                    <input
                      type="text"
                      value={newMainGroupCode}
                      disabled
                      className="w-20 bg-slate-900/90 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-amber-400 cursor-not-allowed text-center"
                    />
                  </td>

                  {/* Name (Prominent, Centered & Expanded) */}
                  <td className="p-2">
                    <input
                      ref={newMainGroupNameInputRef}
                      type="text"
                      value={newMainGroupName}
                      onChange={(e) => setNewMainGroupName(e.target.value)}
                      onKeyDown={handleInlineMainGroupKeyDown}
                      placeholder="اكتب اسم المجموعة الرئيسية واضغط Enter..."
                      className="w-full bg-slate-900 border border-amber-500/50 focus:border-amber-500 rounded-lg px-3 py-2 text-sm sm:text-base text-center text-slate-100 placeholder-slate-500 focus:outline-none ring-1 ring-amber-500/20 font-bold"
                    />
                  </td>

                  {/* Sub Groups Placeholder */}
                  <td className="p-2 text-center text-slate-500 text-xs">
                    —
                  </td>

                  {/* Count Placeholder */}
                  <td className="p-2 text-center text-slate-500 text-xs">
                    —
                  </td>

                  {/* Commit Helper */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={handleSaveInlineMainGroup}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs w-full cursor-pointer transition-colors shadow-sm"
                    >
                      حفظ (Enter)
                    </button>
                  </td>

                  {/* Cancel helper */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => setNewMainGroupName('')}
                      className="text-slate-500 hover:text-slate-300 p-1.5 rounded"
                      title="مسح المسودة (ESC)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: SUB GROUPS LIST (For Active Main Category) */}
      {/* ========================================================================= */}
      {activeMainCategory && !activeSubCategory && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-sm animate-fadeIn">
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <FolderOpen className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">
                المجموعات الفرعية (المستوى الثاني) تحت <span className="text-amber-400">[{activeMainCategory.id} — {activeMainCategory.name}]</span> — ({filteredSubCategories.length} مجموعة فرعية)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              انقر على اسم المجموعة الفرعية أو زر <strong className="text-emerald-400">الأصناف</strong> للانتقال للأصناف
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold">
                  <th className="p-3 pr-4 w-32 text-right">كود المجموعة الفرعية</th>
                  <th className="p-3 text-center">اسم المجموعة الفرعية</th>
                  <th className="p-3 w-28 text-center">الأصناف</th>
                  <th className="p-3 w-32 text-center">إجراء "الأصناف"</th>
                  <th className="p-3 w-16 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredSubCategories.map((sub) => {
                  const pCount = subCategoryProductCounts[sub.id] || 0;
                  return (
                    <tr 
                      key={sub.id} 
                      className="hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* Code (6 digits) */}
                      <td className="p-3 pr-4 font-mono font-bold text-blue-400 text-xs">
                        {sub.id}
                      </td>

                      {/* Name - Inline Editable (Prominent, Centered & Expanded) */}
                      <td className="p-2">
                        <input
                          type="text"
                          defaultValue={sub.name}
                          onBlur={(e) => handleUpdateSubGroupName(sub.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full bg-transparent hover:bg-slate-900/80 focus:bg-slate-900 border border-transparent focus:border-blue-500 rounded-lg px-3 py-2 text-sm sm:text-base text-center font-bold text-slate-100 focus:outline-none transition-colors"
                          title="انقر لتعديل اسم المجموعة الفرعية واضغط Enter"
                        />
                      </td>

                      {/* Product Count badge */}
                      <td className="p-2.5 text-center font-mono">
                        <span className="bg-slate-900 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-800 text-[11px]">
                          {pCount} صنف
                        </span>
                      </td>

                      {/* Action to open Level 3 Products */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSubCategoryId(sub.id);
                            setSearchQuery('');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center justify-center space-x-1.5 space-x-reverse w-full transition-all cursor-pointer shadow-sm"
                        >
                          <span>فتح الأصناف</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Delete */}
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteSubGroupClick(sub)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="حذف المجموعة الفرعية"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* ========================================================================= */}
                {/* INLINE ENTRY ROW: NEW SUB GROUP */}
                {/* ========================================================================= */}
                <tr className="bg-blue-950/20 border-t-2 border-blue-500/30">
                  {/* Next Auto Code (6 digits) */}
                  <td className="p-2 pr-4 font-mono font-bold text-blue-400 text-xs">
                    <input
                      type="text"
                      value={newSubGroupCode}
                      disabled
                      className="w-24 bg-slate-900/90 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-blue-400 cursor-not-allowed text-center"
                    />
                  </td>

                  {/* Name (Prominent, Centered & Expanded) */}
                  <td className="p-2">
                    <input
                      ref={newSubGroupNameInputRef}
                      type="text"
                      value={newSubGroupName}
                      onChange={(e) => setNewSubGroupName(e.target.value)}
                      onKeyDown={handleInlineSubGroupKeyDown}
                      placeholder="اكتب اسم المجموعة الفرعية واضغط Enter..."
                      className="w-full bg-slate-900 border border-blue-500/50 focus:border-blue-500 rounded-lg px-3 py-2 text-sm sm:text-base text-center text-slate-100 placeholder-slate-500 focus:outline-none ring-1 ring-blue-500/20 font-bold"
                    />
                  </td>

                  {/* Count Placeholder */}
                  <td className="p-2 text-center text-slate-500 text-xs">
                    —
                  </td>

                  {/* Commit Helper */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={handleSaveInlineSubGroup}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs w-full cursor-pointer transition-colors shadow-sm"
                    >
                      حفظ (Enter)
                    </button>
                  </td>

                  {/* Cancel helper */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={() => setNewSubGroupName('')}
                      className="text-slate-500 hover:text-slate-300 p-1.5 rounded"
                      title="مسح المسودة (ESC)"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: PRODUCTS LIST (For Active Sub Category) */}
      {/* ========================================================================= */}
      {activeMainCategory && activeSubCategory && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden shadow-sm animate-fadeIn">
          <div className="p-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Package className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                أصناف المجموعة الفرعية <span className="text-emerald-400">[{activeSubCategory.id} — {activeSubCategory.name}]</span> — ({filteredProducts.length} صنف)
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              الإدخال السريع للأصناف: اكتب اسم الصنف واضغط <kbd className="px-1 py-0.5 bg-slate-800 rounded text-emerald-400 font-mono font-bold">Enter</kbd>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold">
                  <th className="p-3 pr-4 w-28 text-right">كود الصنف</th>
                  <th className="p-3 text-center">اسم الصنف</th>
                  <th className="p-3 w-28 text-center">الوحدة الأساسية</th>
                  <th className="p-3 w-32 text-center">الوحدة الفرعية</th>
                  <th className="p-3 w-20 text-center">المعامل</th>
                  <th className="p-3 w-24 text-center">النوع</th>
                  <th className="p-3 w-32 text-center">الباركود</th>
                  <th className="p-3 w-14 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredProducts.map((prod) => {
                  const currentBasicUnit = prod.basicUnit || prod.unit || 'عدد';
                  const currentSubUnit = prod.subUnit || '';
                  const currentFactor = prod.conversionFactor || '';

                  return (
                    <tr 
                      key={prod.id} 
                      className="hover:bg-slate-900/50 transition-colors group"
                    >
                      {/* 9-digit Code */}
                      <td className="p-3 pr-4 font-mono font-bold text-emerald-400 text-xs">
                        {prod.code}
                      </td>

                      {/* Name - Inline Editable (Prominent, Centered & Expanded) */}
                      <td className="p-2">
                        <input
                          type="text"
                          defaultValue={prod.name}
                          onBlur={(e) => handleUpdateProductField(prod.id, 'name', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full bg-transparent hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-emerald-500 rounded-lg px-3 py-1.5 font-bold text-slate-100 focus:outline-none text-sm text-center transition-colors"
                        />
                      </td>

                      {/* Basic Unit */}
                      <td className="p-2">
                        <select
                          value={currentBasicUnit}
                          onChange={(e) => handleUpdateProductField(prod.id, 'basicUnit', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 text-center"
                        >
                          {getDropdownUnits(currentBasicUnit).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>

                      {/* Sub Unit */}
                      <td className="p-2">
                        <select
                          value={currentSubUnit}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateProductField(prod.id, 'subUnit', val);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 text-center"
                        >
                          <option value="">— بدون —</option>
                          {getDropdownUnits(currentSubUnit).map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>

                      {/* Conversion Factor */}
                      <td className="p-2">
                        <input
                          type="number"
                          disabled={!currentSubUnit}
                          defaultValue={currentFactor}
                          placeholder={currentSubUnit ? 'المعامل' : '—'}
                          onBlur={(e) => {
                            if (currentSubUnit) {
                              handleUpdateProductField(prod.id, 'conversionFactor', e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                          className={`w-full bg-transparent hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-emerald-500 rounded px-2 py-1 font-mono text-[11px] text-center focus:outline-none ${
                            currentSubUnit ? 'text-emerald-400 font-bold' : 'text-slate-600 cursor-not-allowed select-none'
                          }`}
                        />
                      </td>

                      {/* Type */}
                      <td className="p-2">
                        <select
                          value={prod.type}
                          onChange={(e) => handleUpdateProductField(prod.id, 'type', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 text-center"
                        >
                          <option value="stockable">مخزني</option>
                          <option value="service">خدمي</option>
                        </select>
                      </td>

                      {/* Barcode */}
                      <td className="p-2">
                        <input
                          type="text"
                          defaultValue={prod.barcode || ''}
                          placeholder="الباركود"
                          onBlur={(e) => handleUpdateProductField(prod.id, 'barcode', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-full bg-transparent hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-emerald-500 rounded px-2 py-1 font-mono text-[11px] text-center text-slate-300 focus:outline-none placeholder-slate-600"
                        />
                      </td>

                      {/* Delete */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteProductClick(prod)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* ========================================================================= */}
                {/* INLINE ENTRY ROW: NEW PRODUCT */}
                {/* ========================================================================= */}
                <tr className="bg-emerald-950/20 border-t-2 border-emerald-500/30">
                  {/* Next Auto Code (9 digits) */}
                  <td className="p-2 pr-4 font-mono font-bold text-emerald-400 text-xs">
                    <input
                      type="text"
                      value={newProdCode}
                      disabled
                      className="w-28 bg-slate-900/90 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400 cursor-not-allowed text-center"
                    />
                  </td>

                  {/* Name (Prominent, Centered & Expanded) */}
                  <td className="p-2">
                    <input
                      ref={newProdNameInputRef}
                      type="text"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      onKeyDown={handleInlineProductKeyDown}
                      placeholder="اكتب اسم الصنف واضغط Enter..."
                      className="w-full bg-slate-900 border border-emerald-500/50 focus:border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-center text-slate-100 placeholder-slate-500 focus:outline-none ring-1 ring-emerald-500/20 font-bold"
                    />
                  </td>

                  {/* Basic Unit */}
                  <td className="p-2">
                    <select
                      value={newProdBasicUnit}
                      onChange={(e) => setNewProdBasicUnit(e.target.value)}
                      onKeyDown={handleInlineProductKeyDown}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 text-center"
                    >
                      {availableUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>

                  {/* Sub Unit */}
                  <td className="p-2">
                    <select
                      value={newProdSubUnit}
                      onChange={(e) => {
                        setNewProdSubUnit(e.target.value);
                        if (!e.target.value) {
                          setNewProdConversionFactor('');
                        }
                      }}
                      onKeyDown={handleInlineProductKeyDown}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 text-center"
                    >
                      <option value="">— بدون —</option>
                      {availableUnits.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </td>

                  {/* Conversion Factor */}
                  <td className="p-2">
                    <input
                      type="number"
                      disabled={!newProdSubUnit}
                      value={newProdConversionFactor}
                      onChange={(e) => setNewProdConversionFactor(e.target.value)}
                      onKeyDown={handleInlineProductKeyDown}
                      placeholder={newProdSubUnit ? 'مثال: 12' : '—'}
                      className={`w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 font-mono text-xs text-center focus:outline-none ${
                        newProdSubUnit 
                          ? 'text-emerald-400 font-bold focus:border-emerald-500 placeholder-slate-500' 
                          : 'text-slate-600 bg-slate-950/60 cursor-not-allowed placeholder-slate-700 select-none'
                      }`}
                    />
                  </td>

                  {/* Type */}
                  <td className="p-2">
                    <select
                      value={newProdType}
                      onChange={(e) => setNewProdType(e.target.value as any)}
                      onKeyDown={handleInlineProductKeyDown}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 text-center"
                    >
                      <option value="stockable">مخزني</option>
                      <option value="service">خدمي</option>
                    </select>
                  </td>

                  {/* Barcode (Optional) */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={newProdBarcode}
                      onChange={(e) => setNewProdBarcode(e.target.value)}
                      onKeyDown={handleInlineProductKeyDown}
                      placeholder="الباركود (اختياري)"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded px-2 py-1.5 font-mono text-[11px] text-center text-slate-300 focus:outline-none placeholder-slate-600"
                    />
                  </td>

                  {/* Commit helper */}
                  <td className="p-2 text-center">
                    <button
                      type="button"
                      onClick={handleSaveInlineProduct}
                      className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded font-bold"
                      title="حفظ الصنف (Enter)"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GUARD MODAL (PROTECTION PREVENTING INVALID DELETION) */}
      {/* ========================================================================= */}
      {guardModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-100">{guardModal.title}</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {guardModal.message}
            </p>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setGuardModal({ isOpen: false, title: '', message: '' })}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-colors"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM DELETE MODAL */}
      {/* ========================================================================= */}
      {confirmDeleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" dir="rtl">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-100">
                {confirmDeleteModal.type === 'main_group'
                  ? 'تأكيد حذف المجموعة الرئيسية'
                  : confirmDeleteModal.type === 'sub_group'
                    ? 'تأكيد حذف المجموعة الفرعية'
                    : 'تأكيد حذف الصنف'}
              </h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف{' '}
              <strong className="text-rose-400">({confirmDeleteModal.name})</strong>؟ لا يمكن التراجع عن هذه العملية بعد التأكيد.
            </p>

            <div className="pt-3 flex items-center justify-end space-x-2.5 space-x-reverse">
              <button
                type="button"
                onClick={() => setConfirmDeleteModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-md shadow-rose-600/30 transition-colors"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CLASSIFICATION METHOD SELECTOR MODAL (2 Levels vs 3 Levels) */}
      {/* ========================================================================= */}
      {isClassificationSelectorOpen && (
        <ClassificationMethodSelectorModal
          isOpen={isClassificationSelectorOpen}
          initialMode="3-level"
          onClose={() => setIsClassificationSelectorOpen(false)}
          onConfirm={(selectedMode) => {
            setTreeLevelMode(selectedMode);
            setIsClassificationSelectorOpen(false);
            setIsTreeViewOpen(true);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 2. PRODUCT TREE VIEW MODAL (2-Level or 3-Level) */}
      {/* ========================================================================= */}
      {isTreeViewOpen && (
        <ProductTreeViewModal
          isOpen={isTreeViewOpen}
          onClose={() => setIsTreeViewOpen(false)}
          categoryTree={categoryTree}
          products={products}
          levelMode={treeLevelMode}
        />
      )}

      {/* Center Screen Toast Overlay */}
      {centerToast && (
        <UnifiedMessageOverlay
          isOpen={Boolean(centerToast)}
          type={centerToast.type}
          message={centerToast.message}
          autoCloseDuration={1000}
          onClose={() => setCenterToast(null)}
        />
      )}
    </div>
  );
};
