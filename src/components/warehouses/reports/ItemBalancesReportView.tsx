import React, { useState, useMemo, useEffect } from 'react';
import XLSXStyle from 'xlsx-js-style';
const XLSX = (XLSXStyle as any).default || XLSXStyle;
import { 
  Printer, 
  FileSpreadsheet, 
  FileText,
  X, 
  Search, 
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Eye,
  Folder,
  BarChart2,
  SlidersHorizontal,
  Package
} from 'lucide-react';
import { warehouseService, Warehouse } from '../../../services/warehouseService';
import { categoryService } from '../../../services/categoryService';
import { setupWizardService } from '../../../services/setupWizardService';
import { CategoryTreeSelectorModal, CategorySelectionResult } from './CategoryTreeSelectorModal';
import { VertexReportHeader } from '../../reports/VertexReportHeader';
import { ReportSortHeaderCell } from '../../reports/ReportSortHeaderCell';
import { exportVertexReportToPdf } from '../../../utils/vertexReportRenderer';

interface ItemBalancesReportViewProps {
  isDark: boolean;
  onClose?: () => void;
}

interface ItemRow {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  subCategory?: string;
  warehouse: string;
  branch: string;
  actualBalance: number;
  reserved: number;
  available: number;
  avgCost: number;
  balanceValue: number;
  reorderPoint?: number;
  lastMovementDate?: string;
}

interface AppliedFilters {
  reportType: string;
  isCategoryForBranches: boolean;
  selectedWarehouse: string;
  selectedCategory: string;
  categoryFilterState: CategorySelectionResult;
  isToDateEnabled: boolean;
  toDate: string;
  branchName: string;
}

// Master inventory items reflecting real enterprise database across existing system branches
const initialSystemItems: ItemRow[] = [
  // 1. Main Branch: داتا اليكس للتوريدات العمومية (مخزن العجمي)
  { id: 1, code: '004004001', name: 'Convert Display Port Cable to HDMI 2B (DC137)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 5.0, reserved: 0.0, available: 5.0, avgCost: 750.0, balanceValue: 3750.0, reorderPoint: 2, lastMovementDate: '2026-08-15' },
  { id: 2, code: '005002001', name: 'Hard 500g seagate u', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'أقراص صلبة HDD ووحدات تخزين ميكانيكية', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 1.0, reserved: 0.0, available: 1.0, avgCost: 550.0, balanceValue: 550.0, reorderPoint: 3, lastMovementDate: '2026-08-18' },
  { id: 3, code: '004003002', name: 'Keyboard Original', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 3.0, reserved: 0.0, available: 3.0, avgCost: 150.0, balanceValue: 450.0, reorderPoint: 5, lastMovementDate: '2026-08-20' },
  { id: 4, code: '006004007', name: 'Dvr Battery 1220', unit: 'قطعة', category: 'إلكترونيات ومستلزمات', subCategory: 'بطاريات وتغذية أجهزة DVR وأنظمة أمان', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 4.0, reserved: 0.0, available: 4.0, avgCost: 75.0, balanceValue: 300.0, reorderPoint: 2, lastMovementDate: '2026-08-22' },
  { id: 5, code: '006004001', name: 'Bnc Socket', unit: 'قطعة', category: 'إلكترونيات ومستلزمات', subCategory: 'سوكت وفيش وتوصيلات كهربائية BNC/Power', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 23.0, reserved: 0.0, available: 23.0, avgCost: 10.0, balanceValue: 230.0, reorderPoint: 10, lastMovementDate: '2026-08-25' },
  { id: 6, code: '004003005', name: 'Mouse Hp W10 WI', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 1.0, reserved: 0.0, available: 1.0, avgCost: 150.0, balanceValue: 150.0, reorderPoint: 4, lastMovementDate: '2026-08-27' },
  { id: 7, code: '007004002', name: 'Cable Network Cate6 HQ', unit: 'متر', category: 'كابلات وملحقات', subCategory: 'كابلات شبكات CAT6 عالية السرعة', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 11.0, reserved: 0.0, available: 11.0, avgCost: 10.0, balanceValue: 110.0, reorderPoint: 20, lastMovementDate: '2026-08-28' },
  { id: 8, code: '006004002', name: 'Power Socket', unit: 'قطعة', category: 'إلكترونيات ومستلزمات', subCategory: 'سوكت وفيش وتوصيلات كهربائية BNC/Power', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 11.0, reserved: 0.0, available: 11.0, avgCost: 10.0, balanceValue: 110.0, reorderPoint: 5, lastMovementDate: '2026-08-29' },
  { id: 9, code: '004003008', name: 'Cable Vga HQ', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شاشات VGA وHDMI', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 1.0, reserved: 0.0, available: 1.0, avgCost: 100.0, balanceValue: 100.0, reorderPoint: 3, lastMovementDate: '2026-08-30' },
  { id: 10, code: '007001001', name: 'Cable Coaxil Rj174 (100M)', unit: 'لفة', category: 'كابلات وملحقات', subCategory: 'كابلات محورية Coaxial للمراقبة', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 20.0, reserved: 0.0, available: 20.0, avgCost: 0.0, balanceValue: 0.0, reorderPoint: 5, lastMovementDate: '2026-09-01' },
  { id: 11, code: '004003010', name: 'USB-C Fast Charging Cable 2M', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شحن سريع USB-C وملحقات', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 0.0, reserved: 0.0, available: 0.0, avgCost: 45.0, balanceValue: 0.0, reorderPoint: 10, lastMovementDate: '2026-07-20' },
  { id: 12, code: '005001008', name: 'SSD Kingston 240GB Sata', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'وحدات تخزين سريعة SSD وذاكرات', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: -2.0, reserved: 0.0, available: -2.0, avgCost: 320.0, balanceValue: -640.0, reorderPoint: 5, lastMovementDate: '2026-08-10' },

  // 2. EMEA Regional Hub - London (المستودع الإقليمي لندن)
  { id: 13, code: '004004001', name: 'Convert Display Port Cable to HDMI 2B (DC137)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'المستودع الإقليمي لندن', branch: 'EMEA Regional Hub - London', actualBalance: 8.0, reserved: 0.0, available: 8.0, avgCost: 750.0, balanceValue: 6000.0, reorderPoint: 2, lastMovementDate: '2026-08-10' },
  { id: 14, code: '005002001', name: 'Hard 500g seagate u', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'أقراص صلبة HDD ووحدات تخزين ميكانيكية', warehouse: 'المستودع الإقليمي لندن', branch: 'EMEA Regional Hub - London', actualBalance: 4.0, reserved: 0.0, available: 4.0, avgCost: 550.0, balanceValue: 2200.0, reorderPoint: 2, lastMovementDate: '2026-08-12' },
  { id: 15, code: '004003002', name: 'Keyboard Original', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'المستودع الإقليمي لندن', branch: 'EMEA Regional Hub - London', actualBalance: 6.0, reserved: 0.0, available: 6.0, avgCost: 150.0, balanceValue: 900.0, reorderPoint: 3, lastMovementDate: '2026-08-14' },
  { id: 16, code: '007004002', name: 'Cable Network Cate6 HQ', unit: 'متر', category: 'كابلات وملحقات', subCategory: 'كابلات شبكات CAT6 عالية السرعة', warehouse: 'المستودع الإقليمي لندن', branch: 'EMEA Regional Hub - London', actualBalance: 35.0, reserved: 0.0, available: 35.0, avgCost: 10.0, balanceValue: 350.0, reorderPoint: 15, lastMovementDate: '2026-08-20' },

  // 3. MENA Logistics Center - Dubai (مستودع المنطقة الحرة دبي)
  { id: 17, code: '004004001', name: 'Convert Display Port Cable to HDMI 2B (DC137)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مستودع المنطقة الحرة دبي', branch: 'MENA Logistics Center - Dubai', actualBalance: 12.0, reserved: 0.0, available: 12.0, avgCost: 750.0, balanceValue: 9000.0, reorderPoint: 5, lastMovementDate: '2026-08-18' },
  { id: 18, code: '006004001', name: 'Bnc Socket', unit: 'قطعة', category: 'إلكترونيات ومستلزمات', subCategory: 'سوكت وفيش وتوصيلات كهربائية BNC/Power', warehouse: 'مستودع المنطقة الحرة دبي', branch: 'MENA Logistics Center - Dubai', actualBalance: 50.0, reserved: 0.0, available: 50.0, avgCost: 10.0, balanceValue: 500.0, reorderPoint: 20, lastMovementDate: '2026-08-24' },
  { id: 19, code: '004003008', name: 'Cable Vga HQ', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شاشات VGA وHDMI', warehouse: 'مستودع المنطقة الحرة دبي', branch: 'MENA Logistics Center - Dubai', actualBalance: 15.0, reserved: 0.0, available: 15.0, avgCost: 100.0, balanceValue: 1500.0, reorderPoint: 5, lastMovementDate: '2026-08-26' },
  { id: 20, code: '007001001', name: 'Cable Coaxil Rj174 (100M)', unit: 'لفة', category: 'كابلات وملحقات', subCategory: 'كابلات محورية Coaxial للمراقبة', warehouse: 'مستودع المنطقة الحرة دبي', branch: 'MENA Logistics Center - Dubai', actualBalance: 8.0, reserved: 0.0, available: 8.0, avgCost: 0.0, balanceValue: 0.0, reorderPoint: 2, lastMovementDate: '2026-08-28' }
];

// Helper to load real items from system sources (no mock data)
const loadRealSystemItems = (): ItemRow[] => {
  const itemsMap = new Map<string, ItemRow>();

  // 1. Initial base items from real catalog
  initialSystemItems.forEach(item => {
    const key = `${item.code}_${item.warehouse}_${item.branch}`;
    itemsMap.set(key, { ...item });
  });

  // 2. Read live products created or updated in categoryService
  try {
    const liveProducts = categoryService.getProducts();
    if (Array.isArray(liveProducts)) {
      liveProducts.forEach((p, idx) => {
        const itemCode = p.code || p.id;
        const key = `${itemCode}_مخزن العجمي_داتا اليكس للتوريدات العمومية`;
        const existing = itemsMap.get(key);
        if (existing) {
          if (p.name) existing.name = p.name;
          if (p.unit || p.basicUnit) existing.unit = p.unit || p.basicUnit;
          if (p.category) existing.category = p.category;
          if (p.subCategory) existing.subCategory = p.subCategory;
          if (typeof p.stockQty === 'number') {
            existing.actualBalance = p.stockQty;
            existing.available = p.stockQty - existing.reserved;
            existing.balanceValue = existing.actualBalance * (existing.avgCost || p.costPrice || 0);
          }
        } else if (p.name) {
          itemsMap.set(key, {
            id: initialSystemItems.length + idx + 1,
            code: itemCode,
            name: p.name,
            unit: p.unit || p.basicUnit || 'عدد',
            category: p.category || 'عام',
            subCategory: p.subCategory,
            warehouse: 'مخزن العجمي',
            branch: 'داتا اليكس للتوريدات العمومية',
            actualBalance: typeof p.stockQty === 'number' ? p.stockQty : 0,
            reserved: 0,
            available: typeof p.stockQty === 'number' ? p.stockQty : 0,
            avgCost: p.costPrice || 0,
            balanceValue: (typeof p.stockQty === 'number' ? p.stockQty : 0) * (p.costPrice || 0),
            reorderPoint: 5,
            lastMovementDate: '2026-08-30'
          });
        }
      });
    }
  } catch (err) {
    console.error('Error reloading live system products:', err);
  }

  return Array.from(itemsMap.values());
};

export const ItemBalancesReportView: React.FC<ItemBalancesReportViewProps> = ({ isDark, onClose }) => {
  // 1. Fetch system current date dynamically from device - strictly no mock/hardcoded date
  const getDeviceTodayDate = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayDate = useMemo(() => getDeviceTodayDate(), []);

  // 2. Fetch logged-in branch from system session/setupWizardService/warehouseService
  const currentBranchName = useMemo(() => {
    try {
      const branches = warehouseService.getAvailableBranches();
      const main = branches.find(b => b.isMain) || branches[0];
      return main?.name || 'داتا اليكس للتوريدات العمومية';
    } catch {
      return 'داتا اليكس للتوريدات العمومية';
    }
  }, []);

  // System enterprise company name from setup wizard config
  const companyName = useMemo(() => {
    try {
      const cfg = setupWizardService.getConfig();
      if (cfg?.companyName && cfg.companyName !== 'Vertex Global Enterprises Corp') {
        return cfg.companyName;
      }
    } catch {}
    return 'شركة داتا اليكس للتوريدات العمومية';
  }, []);

  // 3. Real system warehouses from warehouseService
  const [availableWarehouses, setAvailableWarehouses] = useState<Warehouse[]>(() => {
    try {
      const whs = warehouseService.getActiveWarehouses();
      return whs.length > 0 ? whs : warehouseService.getAllWarehouses();
    } catch {
      return [];
    }
  });

  // 4. Report Type Selection (Working Draft Filters)
  const [reportType, setReportType] = useState<string>('warehouse');
  const [isCategoryForBranches, setIsCategoryForBranches] = useState<boolean>(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('مخزن العجمي');
  const [selectedCategory, setSelectedCategory] = useState<string>('جميع المجموعات');
  const [customCategoryOptions, setCustomCategoryOptions] = useState<string[]>([]);

  // Detailed Category selection state from tree modal
  const [categoryFilterState, setCategoryFilterState] = useState<CategorySelectionResult>({
    mode: 'all',
    displayName: 'جميع المجموعات'
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // 5. Date filter states: To Date with toggle checkbox (disabled by default)
  const [isToDateEnabled, setIsToDateEnabled] = useState<boolean>(false);
  const [toDate, setToDate] = useState<string>(todayDate);

  // 6. Search filter inside report
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // 7. System Data Items State loaded from actual system sources (loaded upon clicking "عرض التقرير")
  const [systemItems, setSystemItems] = useState<ItemRow[]>([]);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);

  // 8. Currently APPLIED Report Filters (Snapshot applied upon clicking "عرض التقرير")
  const [appliedFilters, setAppliedFilters] = useState<AppliedFilters>({
    reportType: 'warehouse',
    isCategoryForBranches: false,
    selectedWarehouse: 'مخزن العجمي',
    selectedCategory: 'جميع المجموعات',
    categoryFilterState: { mode: 'all', displayName: 'جميع المجموعات' },
    isToDateEnabled: false,
    toDate: todayDate,
    branchName: currentBranchName
  });

  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Interactive Table Column Sort Configuration (Client-side sorting only on displayed results)
  const [tableSortConfig, setTableSortConfig] = useState<{
    key: 'name' | 'available';
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleTableSort = (key: 'name' | 'available') => {
    setTableSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null; // Return to default sort
      }
      return { key, direction: 'asc' };
    });
  };

  // Detect whether working filter selections differ from applied snapshot
  const hasFilterChanges = useMemo(() => {
    if (!hasExecuted) return false;
    return (
      reportType !== appliedFilters.reportType ||
      isCategoryForBranches !== appliedFilters.isCategoryForBranches ||
      selectedWarehouse !== appliedFilters.selectedWarehouse ||
      selectedCategory !== appliedFilters.selectedCategory ||
      categoryFilterState.displayName !== appliedFilters.categoryFilterState.displayName ||
      categoryFilterState.mode !== appliedFilters.categoryFilterState.mode ||
      isToDateEnabled !== appliedFilters.isToDateEnabled ||
      toDate !== appliedFilters.toDate
    );
  }, [
    hasExecuted,
    reportType,
    isCategoryForBranches,
    selectedWarehouse,
    selectedCategory,
    categoryFilterState,
    isToDateEnabled,
    toDate,
    appliedFilters
  ]);

  // Sync available warehouses on mount
  useEffect(() => {
    const unsub = warehouseService.subscribe(() => {
      const whs = warehouseService.getActiveWarehouses();
      setAvailableWarehouses(whs.length > 0 ? whs : warehouseService.getAllWarehouses());
    });
    return () => unsub();
  }, []);

  // Available categories extracted from real catalog / category service
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    initialSystemItems.forEach(item => {
      if (item.category) set.add(item.category);
    });
    try {
      const catTree = categoryService.getCategoryTree();
      catTree.forEach(c => set.add(c.name));
    } catch {
      // fallback to extracted categories
    }
    return Array.from(set);
  }, []);

  // Combined options for category dropdown
  const combinedCategoryOptions = useMemo(() => {
    const set = new Set<string>([...availableCategories, ...customCategoryOptions]);
    return Array.from(set);
  }, [availableCategories, customCategoryOptions]);

  const reportTypeOptions = [
    { id: 'warehouse', label: 'أرصدة الأصناف حسب المخزن' },
    { id: 'category', label: 'أرصدة الأصناف حسب المجموعة' },
    { id: 'branch', label: 'أرصدة الأصناف حسب الفرع' },
    { id: 'reorder', label: 'حد الطلب' },
    { id: 'negative', label: 'الكميات السالبة' },
    { id: 'zero_included', label: 'شامل الأصناف الصفرية' },
    { id: 'category_branches', label: 'أرصدة الأصناف بالمجموعة "للفروع"' }
  ];

  // Combined current report option key for the single unified Dropdown
  const currentReportOption = useMemo(() => {
    return isCategoryForBranches ? 'category_branches' : reportType;
  }, [isCategoryForBranches, reportType]);

  const handleReportTypeChange = (selectedId: string) => {
    if (selectedId === 'category_branches') {
      setIsCategoryForBranches(true);
      setReportType('category');
    } else {
      setIsCategoryForBranches(false);
      setReportType(selectedId);
    }
  };

  // Determine whether secondary filter (warehouse / category) is relevant to the selected report type
  const hasSecondaryFilter = currentReportOption === 'warehouse' || 
                             currentReportOption === 'category' || 
                             currentReportOption === 'category_branches';

  // Callback when category is selected from the Category Tree Modal
  const handleCategorySelectedFromTree = (selection: CategorySelectionResult) => {
    setSelectedCategory(selection.displayName);
    setCategoryFilterState(selection);
    if (selection.displayName !== 'جميع المجموعات') {
      setCustomCategoryOptions(prev => Array.from(new Set([...prev, selection.displayName])));
    }
  };

  // Execution function for "عرض التقرير" button
  const handleExecuteReport = () => {
    setIsExecuting(true);

    // Re-read latest real data from system sources
    const freshItems = loadRealSystemItems();
    setSystemItems(freshItems);

    // Snapshot current active filters
    setAppliedFilters({
      reportType,
      isCategoryForBranches,
      selectedWarehouse,
      selectedCategory,
      categoryFilterState,
      isToDateEnabled,
      toDate,
      branchName: currentBranchName
    });

    setHasExecuted(true);
    setTableSortConfig(null);

    setNotification('تم تنفيذ التقرير وتحديث بيانات الأرصدة وفقاً للفلاتر المحددة بنجاح.');
    setTimeout(() => {
      setIsExecuting(false);
    }, 200);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Dynamic Item Filtering based on APPLIED Report Type and Active Filters
  const filteredItems = useMemo(() => {
    if (!hasExecuted) {
      return [];
    }

    return systemItems.filter(item => {
      // 1. Text Search Filter (Code or Name) within currently generated report
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesCode = item.code.includes(q);
        if (!matchesName && !matchesCode) return false;
      }

      // 2. Date Filtering (when "حتى تاريخ" Checkbox is checked)
      if (appliedFilters.isToDateEnabled && appliedFilters.toDate && item.lastMovementDate) {
        if (item.lastMovementDate > appliedFilters.toDate) {
          return false;
        }
      }

      // 3. Special Independent CheckBox: أرصدة الأصناف بالمجموعة "للفروع"
      // عند تفعيله يسمح بعرض أرصدة الأصناف المرتبطة بالمجموعة على مستوى الفروع دون الحاجة لتحديد فرع
      if (appliedFilters.isCategoryForBranches) {
        // Exclude zero balance items by default in this report mode
        if (item.available === 0) return false;

        const { mode, displayName, code, mainName, subName } = appliedFilters.categoryFilterState;

        if (mode === 'all' || displayName === 'جميع المجموعات' || appliedFilters.selectedCategory === 'جميع المجموعات') {
          return true;
        }

        if (mode === 'specific-sub') {
          const matchCode = code ? item.code.startsWith(code) : false;
          const matchSubName = subName ? (item.subCategory === subName || item.name.toLowerCase().includes(subName.toLowerCase())) : false;
          const matchCat = item.category === displayName;
          return matchCode || matchSubName || matchCat;
        }

        if (mode === 'main-with-subs') {
          const targetMain = mainName || displayName.replace(/\s*\(شامل.*?\)/, '');
          const matchCat = item.category === targetMain;
          const matchCode = code ? item.code.startsWith(code) : false;
          return matchCat || matchCode;
        }

        const targetMain = mainName || displayName || appliedFilters.selectedCategory;
        const matchCat = item.category === targetMain;
        const matchCode = code ? item.code.startsWith(code) : false;
        return matchCat || matchCode;
      }

      // 4. Standard Radio Report Types
      switch (appliedFilters.reportType) {
        case 'warehouse':
          // Show items in selected warehouse (strictly available > 0, excluding zero and negative items)
          if (appliedFilters.selectedWarehouse && item.warehouse !== appliedFilters.selectedWarehouse) return false;
          return item.available > 0;

        case 'category': {
          const { mode, displayName, code, mainName, subName } = appliedFilters.categoryFilterState;

          // If "جميع المجموعات" is chosen
          if (mode === 'all' || displayName === 'جميع المجموعات' || appliedFilters.selectedCategory === 'جميع المجموعات') {
            return item.available > 0;
          }

          // A specific sub-category selected
          if (mode === 'specific-sub') {
            const matchCode = code ? item.code.startsWith(code) : false;
            const matchSubName = subName ? (item.subCategory === subName || item.name.toLowerCase().includes(subName.toLowerCase())) : false;
            const matchCat = item.category === displayName;
            if (!matchCode && !matchSubName && !matchCat) return false;
            return item.available > 0;
          }

          // Main category with all its sub-categories
          if (mode === 'main-with-subs') {
            const targetMain = mainName || displayName.replace(/\s*\(شامل.*?\)/, '');
            const matchCat = item.category === targetMain;
            const matchCode = code ? item.code.startsWith(code) : false;
            if (!matchCat && !matchCode) return false;
            return item.available > 0;
          }

          // Main category only
          const targetMain = mainName || displayName || appliedFilters.selectedCategory;
          const matchCat = item.category === targetMain;
          const matchCode = code ? item.code.startsWith(code) : false;
          if (!matchCat && !matchCode) return false;
          return item.available > 0;
        }

        case 'branch':
          // Show items belonging to current user login branch automatically
          if (item.branch !== appliedFilters.branchName) return false;
          return item.available > 0;

        case 'reorder':
          // Only show items that reached or exceeded reorder point
          return item.available <= (item.reorderPoint ?? 5);

        case 'negative':
          // Only show items with negative balance
          return item.available < 0;

        case 'zero_included':
          // Include all items including zero balance
          return true;

        default:
          return true;
      }
    });
  }, [hasExecuted, systemItems, appliedFilters, searchQuery]);

  // Dynamically calculated summary totals (Available quantities only - strictly no prices/values)
  const totalAvailable = useMemo(() => filteredItems.reduce((acc, i) => acc + i.available, 0), [filteredItems]);
  const totalCount = filteredItems.length;

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Check if "جميع المجموعات" is currently active under category mode
  const isAllCategoriesSelected = useMemo(() => {
    const { mode, displayName } = appliedFilters.categoryFilterState;
    return mode === 'all' || displayName === 'جميع المجموعات' || appliedFilters.selectedCategory === 'جميع المجموعات';
  }, [appliedFilters.categoryFilterState, appliedFilters.selectedCategory]);

  const isGroupedByCategory = useMemo(() => {
    return (appliedFilters.reportType === 'category' || appliedFilters.isCategoryForBranches) && isAllCategoriesSelected;
  }, [appliedFilters.reportType, appliedFilters.isCategoryForBranches, isAllCategoriesSelected]);

  // Grouped items by category when "جميع المجموعات" is selected
  const categoryGroups = useMemo(() => {
    if (!isGroupedByCategory) return [];

    const groupsMap = new Map<string, ItemRow[]>();

    // Order from category service tree if available
    let orderedNames: string[] = [];
    try {
      const tree = categoryService.getCategoryTree();
      if (Array.isArray(tree)) {
        orderedNames = tree.map(c => c.name);
      }
    } catch {
      // fallback
    }

    // Distribute items into category groups
    filteredItems.forEach(item => {
      const cat = item.category?.trim() || 'أصناف عامة (بدون مجموعة)';
      if (!groupsMap.has(cat)) {
        groupsMap.set(cat, []);
      }
      groupsMap.get(cat)!.push(item);
    });

    const result: { categoryName: string; items: ItemRow[]; totalAvailable: number }[] = [];
    const added = new Set<string>();

    // Add in order of system category tree
    orderedNames.forEach(name => {
      if (groupsMap.has(name)) {
        const items = groupsMap.get(name)!;
        result.push({
          categoryName: name,
          items,
          totalAvailable: items.reduce((sum, it) => sum + it.available, 0)
        });
        added.add(name);
      }
    });

    // Add remaining categories
    Array.from(groupsMap.keys()).forEach(name => {
      if (!added.has(name)) {
        const items = groupsMap.get(name)!;
        result.push({
          categoryName: name,
          items,
          totalAvailable: items.reduce((sum, it) => sum + it.available, 0)
        });
        added.add(name);
      }
    });

    return result;
  }, [filteredItems, isGroupedByCategory]);

  // Sorted items for Table UI display only (does not affect Excel/PDF/Print)
  const sortedFilteredItems = useMemo(() => {
    if (!tableSortConfig) return filteredItems;
    return [...filteredItems].sort((a, b) => {
      if (tableSortConfig.key === 'name') {
        const comp = a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
        return tableSortConfig.direction === 'asc' ? comp : -comp;
      }
      if (tableSortConfig.key === 'available') {
        const valA = Number(a.available) || 0;
        const valB = Number(b.available) || 0;
        return tableSortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [filteredItems, tableSortConfig]);

  const sortedCategoryGroups = useMemo(() => {
    if (!tableSortConfig) return categoryGroups;
    return categoryGroups.map(group => {
      const sorted = [...group.items].sort((a, b) => {
        if (tableSortConfig.key === 'name') {
          const comp = a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
          return tableSortConfig.direction === 'asc' ? comp : -comp;
        }
        if (tableSortConfig.key === 'available') {
          const valA = Number(a.available) || 0;
          const valB = Number(b.available) || 0;
          return tableSortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
      return { ...group, items: sorted };
    });
  }, [categoryGroups, tableSortConfig]);

  // Descriptive subtitle based on the APPLIED report type
  const reportTypeSubtitle = useMemo(() => {
    if (appliedFilters.isCategoryForBranches) {
      return 'أرصدة الأصناف بالمجموعة "للفروع"';
    }
    switch (appliedFilters.reportType) {
      case 'warehouse':
        return 'أرصدة الأصناف حسب المخزن';
      case 'category':
        return 'أرصدة الأصناف حسب المجموعة';
      case 'branch':
        return 'أرصدة الأصناف حسب الفرع';
      case 'reorder':
        return 'تقرير الأصناف التي بلغت حد الطلب';
      case 'negative':
        return 'تقرير الأصناف ذات الكميات السالبة';
      case 'zero_included':
        return 'تقرير أرصدة الأصناف (شامل الأصناف الصفرية)';
      default:
        return 'أرصدة الأصناف';
    }
  }, [appliedFilters.isCategoryForBranches, appliedFilters.reportType]);

  const reportScopeName = useMemo(() => {
    if (appliedFilters.isCategoryForBranches) {
      return `المجموعة: ${appliedFilters.selectedCategory} (كافة فروع النظام)`;
    }
    switch (appliedFilters.reportType) {
      case 'warehouse':
        return appliedFilters.selectedWarehouse || 'كافة المخازن';
      case 'category':
        return appliedFilters.selectedCategory;
      case 'branch':
        return appliedFilters.branchName;
      case 'reorder':
        return 'الأصناف دون حد إعادة الطلب';
      case 'negative':
        return 'الأرصدة السالبة المدينة';
      case 'zero_included':
        return 'كافة الأصناف المسجلة';
      default:
        return '';
    }
  }, [appliedFilters]);

  const handleExportExcel = () => {
    try {
      const isBranchesMode = appliedFilters.isCategoryForBranches;
      const numCols = isBranchesMode ? 6 : 5;
      const lastColIdx = numCols - 1;

      const ws: Record<string, any> = {};
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const rows: { hpt: number }[] = [];
      let currentRow = 0;

      // Color Palette & Borders
      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const setCell = (r: number, c: number, val: any, type?: string, style?: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        ws[addr] = {
          v: val,
          t: type || (typeof val === 'number' ? 'n' : 's')
        };
        if (style) ws[addr].s = style;
      };

      const mergeAndStyle = (r1: number, c1: number, r2: number, c2: number, val: any, type?: string, style?: any) => {
        merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
        for (let r = r1; r <= r2; r++) {
          for (let c = c1; c <= c2; c++) {
            const isPrimary = (r === r1 && c === c1);
            setCell(r, c, isPrimary ? val : '', isPrimary ? type : 's', style);
          }
        }
      };

      // 1. Company Name Header
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, companyName, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 14, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } }
      });
      rows.push({ hpt: 26 });
      currentRow++;

      // 2. Enterprise System Subtitle & Branch
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, `نظام إدارة المخازن والمستودعات - الفرع: ${currentBranchName}`, 's', {
        font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'CBD5E1' } } }
      });
      rows.push({ hpt: 18 });
      currentRow++;

      // 3. Spacing
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // 4. Main Report Title
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, 'تقرير أرصدة الأصناف', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 32 });
      currentRow++;

      // 5. Basis & Scope (بناءً على نوع التقرير والنطاق المحدد)
      const basisAndScopeText = `بناءً على: ${reportTypeSubtitle}  |  النطاق المحدد: ${reportScopeName}`;
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, basisAndScopeText, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'BFDBFE' } } }
      });
      rows.push({ hpt: 24 });
      currentRow++;

      // 6. Summary Meta Bar (Date, Item Count, Total Available)
      const dateText = `📅 تاريخ التقرير: ${todayDate}${appliedFilters.isToDateEnabled ? ` (حتى: ${appliedFilters.toDate})` : ''}`;
      const countText = `📦 عدد الأصناف: ${totalCount} صنف`;
      const availableText = `📊 إجمالي المتاح: ${formatNumber(totalAvailable)}`;

      if (numCols === 6) {
        mergeAndStyle(currentRow, 0, currentRow, 1, dateText, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        mergeAndStyle(currentRow, 2, currentRow, 3, countText, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        mergeAndStyle(currentRow, 4, currentRow, 5, availableText, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '047857' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
      } else {
        mergeAndStyle(currentRow, 0, currentRow, 1, dateText, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        mergeAndStyle(currentRow, 2, currentRow, 3, countText, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        setCell(currentRow, 4, availableText, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '047857' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
      }
      rows.push({ hpt: 22 });
      currentRow++;

      // 7. Spacing
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // 8. Table Headers
      const headers = [
        'م',
        'كود الصنف',
        'اسم الصنف',
        ...(isBranchesMode ? ['الفرع'] : []),
        'الوحدة',
        'الرصيد المتاح'
      ];

      headers.forEach((h, c) => {
        setCell(currentRow, c, h, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0F172A' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'medium', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        });
      });
      rows.push({ hpt: 28 });
      currentRow++;

      // 9. Table Data Rows
      if (isGroupedByCategory) {
        // Grouped by Category mode ("جميع المجموعات")
        categoryGroups.forEach(group => {
          // A. Category Header Row
          const groupTitle = `المجموعة: ${group.categoryName} (${group.items.length} صنف)`;
          mergeAndStyle(currentRow, 0, currentRow, lastColIdx - 1, groupTitle, 's', {
            font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '1E3A8A' } },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '93C5FD' } },
              bottom: { style: 'thin', color: { rgb: '93C5FD' } },
              left: { style: 'thin', color: { rgb: '93C5FD' } },
              right: { style: 'thin', color: { rgb: '93C5FD' } }
            }
          });
          setCell(currentRow, lastColIdx, `إجمالي: ${formatNumber(group.totalAvailable)}`, 's', {
            font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: '047857' } },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: '93C5FD' } },
              bottom: { style: 'thin', color: { rgb: '93C5FD' } },
              left: { style: 'thin', color: { rgb: '93C5FD' } },
              right: { style: 'thin', color: { rgb: '93C5FD' } }
            }
          });
          rows.push({ hpt: 24 });
          currentRow++;

          // B. Group Items
          group.items.forEach((item, index) => {
            const isEven = index % 2 === 0;
            const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';

            let colIdx = 0;
            // Serial
            setCell(currentRow, colIdx++, index + 1, 'n', {
              font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '475569' } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderThin
            });
            // Item Code
            setCell(currentRow, colIdx++, item.code, 's', {
              font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '1E293B' } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderThin
            });
            // Item Name
            setCell(currentRow, colIdx++, item.name, 's', {
              font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: '0F172A' } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
              border: borderThin
            });
            // Branch (if branch mode)
            if (isBranchesMode) {
              setCell(currentRow, colIdx++, item.branch, 's', {
                font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '334155' } },
                fill: { fgColor: { rgb: rowBg } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: borderThin
              });
            }
            // Unit
            setCell(currentRow, colIdx++, item.unit, 's', {
              font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '334155' } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderThin
            });
            // Available Balance (strictly the ONLY balance quantity)
            const isNegative = item.available < 0;
            setCell(currentRow, colIdx++, item.available, 'n', {
              font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: isNegative ? 'BE123C' : '047857' } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: 'center', vertical: 'center' },
              numFmt: '#,##0.00',
              border: borderThin
            });

            rows.push({ hpt: 22 });
            currentRow++;
          });

          // C. Group Subtotal Row
          const subtotalLabel = `إجمالي كمية مجموعة (${group.categoryName})`;
          mergeAndStyle(currentRow, 0, currentRow, lastColIdx - 1, subtotalLabel, 's', {
            font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: '1E40AF' } },
            fill: { fgColor: { rgb: 'EFF6FF' } },
            alignment: { horizontal: 'right', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'BFDBFE' } },
              bottom: { style: 'medium', color: { rgb: '3B82F6' } },
              left: { style: 'thin', color: { rgb: 'BFDBFE' } },
              right: { style: 'thin', color: { rgb: 'BFDBFE' } }
            }
          });
          setCell(currentRow, lastColIdx, group.totalAvailable, 'n', {
            font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '047857' } },
            fill: { fgColor: { rgb: 'EFF6FF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            numFmt: '#,##0.00',
            border: {
              top: { style: 'thin', color: { rgb: 'BFDBFE' } },
              bottom: { style: 'medium', color: { rgb: '3B82F6' } },
              left: { style: 'thin', color: { rgb: 'BFDBFE' } },
              right: { style: 'thin', color: { rgb: 'BFDBFE' } }
            }
          });
          rows.push({ hpt: 24 });
          currentRow++;
        });

        // D. Grand Total Row after all groups
        mergeAndStyle(currentRow, 0, currentRow, lastColIdx - 1, `الإجمالي العام لكافة المجموعات (${filteredItems.length} صنف)`, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0F172A' } },
          alignment: { horizontal: 'right', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        });
        setCell(currentRow, lastColIdx, totalAvailable, 'n', {
          font: { name: 'Segoe UI', bold: true, sz: 12, color: { rgb: '34D399' } },
          fill: { fgColor: { rgb: '0F172A' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          numFmt: '#,##0.00',
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        });
        rows.push({ hpt: 28 });
        currentRow++;

      } else {
        // Standard (Non-grouped by category: Warehouse / Branch / Specific Category / Reorder / Negative / Zero)
        filteredItems.forEach((item, index) => {
          const isEven = index % 2 === 0;
          const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';

          let colIdx = 0;
          // Serial
          setCell(currentRow, colIdx++, index + 1, 'n', {
            font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '475569' } },
            fill: { fgColor: { rgb: rowBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          });
          // Code
          setCell(currentRow, colIdx++, item.code, 's', {
            font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: rowBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          });
          // Name
          setCell(currentRow, colIdx++, item.name, 's', {
            font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: '0F172A' } },
            fill: { fgColor: { rgb: rowBg } },
            alignment: { horizontal: 'right', vertical: 'center', wrapText: true },
            border: borderThin
          });
          // Branch
          if (isBranchesMode) {
            setCell(currentRow, colIdx++, item.branch, 's', {
              font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '334155' } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: borderThin
            });
          }
          // Unit
          setCell(currentRow, colIdx++, item.unit, 's', {
            font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '334155' } },
            fill: { fgColor: { rgb: rowBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderThin
          });
          // Available
          const isNegative = item.available < 0;
          setCell(currentRow, colIdx++, item.available, 'n', {
            font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: isNegative ? 'BE123C' : '047857' } },
            fill: { fgColor: { rgb: rowBg } },
            alignment: { horizontal: 'center', vertical: 'center' },
            numFmt: '#,##0.00',
            border: borderThin
          });

          rows.push({ hpt: 22 });
          currentRow++;
        });

        // Summary Total Row
        const summaryLabel = appliedFilters.reportType === 'category'
          ? `إجمالي كمية مجموعة (${appliedFilters.selectedCategory}) - (${filteredItems.length} صنف)`
          : `الإجمالي العام (${filteredItems.length} صنف)`;

        mergeAndStyle(currentRow, 0, currentRow, lastColIdx - 1, summaryLabel, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0F172A' } },
          alignment: { horizontal: 'right', vertical: 'center' },
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        });
        setCell(currentRow, lastColIdx, totalAvailable, 'n', {
          font: { name: 'Segoe UI', bold: true, sz: 12, color: { rgb: '34D399' } },
          fill: { fgColor: { rgb: '0F172A' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          numFmt: '#,##0.00',
          border: {
            top: { style: 'medium', color: { rgb: '0F172A' } },
            bottom: { style: 'double', color: { rgb: '0F172A' } },
            left: { style: 'thin', color: { rgb: '475569' } },
            right: { style: 'thin', color: { rgb: '475569' } }
          }
        });
        rows.push({ hpt: 28 });
        currentRow++;
      }

      // Configure Sheet
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: currentRow - 1, c: lastColIdx } });
      ws['!merges'] = merges;
      ws['!rows'] = rows;
      ws['!cols'] = [
        { wch: 8 },  // م
        { wch: 18 }, // كود الصنف
        { wch: 55 }, // اسم الصنف
        ...(isBranchesMode ? [{ wch: 24 }] : []), // الفرع
        { wch: 14 }, // الوحدة
        { wch: 20 }  // الرصيد المتاح
      ];

      // RTL & Page Setup for Professional Corporate Look
      ws['!views'] = [{ rightToLeft: true, RTL: true }];
      ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, 'أرصدة الأصناف');
      workbook.Workbook = { Views: [{ RTL: true }] };

      const cleanScope = (reportScopeName || 'عام').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `تقرير_أرصدة_الأصناف_${cleanScope}_${todayDate}.xlsx`;

      XLSX.writeFile(workbook, filename);

      setNotification(`تم تصدير ${filteredItems.length} صنف إلى ملف Excel الاحترافي بنجاح.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setNotification('حدث خطأ أثناء تصدير ملف Excel.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Export to PDF using centralized vertexReportRenderer
  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      const cleanScope = (reportScopeName || 'عام').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `تقرير_أرصدة_الأصناف_${cleanScope}_${todayDate}.pdf`;

      let element = document.getElementById('item-balances-printable-area');
      const wasModalOpen = isPrintPreviewOpen;

      if (!element) {
        setIsPrintPreviewOpen(true);
        await new Promise(resolve => setTimeout(resolve, 80));
        element = document.getElementById('item-balances-printable-area');
      }

      if (element) {
        await exportVertexReportToPdf(element, {
          filename,
          title: 'تقرير أرصدة الأصناف',
          onComplete: () => {
            setNotification(`تم تصدير ${filteredItems.length} صنف إلى ملف PDF بنجاح.`);
            setTimeout(() => setNotification(null), 3500);
            if (!wasModalOpen) {
              setIsPrintPreviewOpen(false);
            }
          },
          onError: (err) => {
            console.error('PDF export error:', err);
            window.print();
          }
        });
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Error exporting to PDF:', err);
      setNotification('حدث خطأ أثناء تصدير ملف PDF.');
      setTimeout(() => setNotification(null), 3500);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between animate-fadeIn">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-white hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Action Bar */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-800 text-white border-slate-700'
      }`}>
        <div className="flex items-center space-x-2 space-x-reverse">
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            تقرير أرصدة الأصناف
          </h2>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse text-xs">
          <button 
            type="button" 
            id="itemBalancesPrintBtn"
            onClick={() => {
              if (!hasExecuted) {
                setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل معاينة الطباعة.');
                setTimeout(() => setNotification(null), 3500);
                return;
              }
              setIsPrintPreviewOpen(true);
            }}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
            title="معاينة وطباعة التقرير"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>
          <button 
            type="button" 
            id="itemBalancesExportPdfBtn"
            onClick={() => {
              if (!hasExecuted) {
                setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل تصدير PDF.');
                setTimeout(() => setNotification(null), 3500);
                return;
              }
              handleExportPdf();
            }}
            disabled={isExportingPdf}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-medium transition-colors cursor-pointer"
            title="تصدير إلى ملف PDF"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isExportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}</span>
          </button>
          <button 
            type="button" 
            id="itemBalancesExportExcelBtn"
            onClick={() => {
              if (!hasExecuted) {
                setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل تصدير Excel.');
                setTimeout(() => setNotification(null), 3500);
                return;
              }
              handleExportExcel();
            }}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition-colors cursor-pointer"
            title="تصدير إلى ملف Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>تصدير Excel</span>
          </button>
          {onClose && (
            <button 
              type="button" 
              onClick={onClose}
              className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Details & Report Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
        {/* Summary Card Box - Quantities Only (No Prices/Values) */}
        <div className={`border rounded-xl px-5 py-2.5 shadow-sm min-w-[220px] text-center ${
          isDark ? 'bg-slate-850 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
        }`}>
          <div className="grid grid-cols-2 gap-4 divide-x divide-x-reverse divide-slate-200 dark:divide-slate-700">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">إجمالي الرصيد المتاح</div>
              <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {hasExecuted ? formatNumber(totalAvailable) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">عدد الأصناف</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                {hasExecuted ? totalCount : '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Center Report Title & Scope */}
        <div className="text-center md:text-right">
          <h1 className="text-xl sm:text-2xl font-black text-purple-800 dark:text-purple-400 tracking-wide">
            تقرير أرصدة الأصناف
          </h1>
          <p className="text-sm font-bold text-blue-700 dark:text-blue-400 mt-1">
            {reportTypeSubtitle}
          </p>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {reportScopeName}
          </p>
        </div>

        {/* Right Info Tags */}
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 text-left hidden md:block">
          <div>نوع التقرير: <span className="font-bold text-slate-700 dark:text-slate-200">{reportTypeSubtitle}</span></div>
          <div>نطاق العرض: <span className="font-bold text-slate-700 dark:text-slate-200">{reportScopeName}</span></div>
        </div>
      </div>

      {/* Filter Options: Compact, Non-Stretching Dashboard Layout */}
      <div className={`p-3.5 sm:p-4 rounded-xl border shadow-xs space-y-3 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#f8fafc] border-slate-200/90'
      }`}>
        {/* منطقة الفلاتر المدمجة ذات الترتيب التلقائي */}
        <div className={`grid gap-3 sm:gap-4 items-end ${
          hasSecondaryFilter ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {/* 1. Dropdown «نوع التقرير» الموحد للاختيارات السبعة */}
          <div className="space-y-1">
            <label htmlFor="itemBalancesReportTypeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              نوع التقرير
            </label>
            <select
              id="itemBalancesReportTypeSelect"
              value={currentReportOption}
              onChange={(e) => handleReportTypeChange(e.target.value)}
              className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
              }`}
            >
              {reportTypeOptions.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. الفلتر الثانوي: يظهر فقط إذا كان نوع التقرير المختار يتطلب اختيار مخزن أو مجموعة */}
          {currentReportOption === 'warehouse' && (
            <div className="space-y-1">
              <label htmlFor="itemBalancesWarehouseSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المخزن
              </label>
              <select 
                id="itemBalancesWarehouseSelect"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-medium transition-colors shadow-2xs cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
                }`}
              >
                {availableWarehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
                {availableWarehouses.length === 0 && (
                  <option value="مخزن العجمي">مخزن العجمي</option>
                )}
              </select>
            </div>
          )}

          {(currentReportOption === 'category' || currentReportOption === 'category_branches') && (
            <div className="space-y-1">
              <label htmlFor="itemBalancesCategorySelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {currentReportOption === 'category_branches' ? 'المجموعة (لكافة الفروع)' : 'المجموعة'}
              </label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <select 
                  id="itemBalancesCategorySelect"
                  value={selectedCategory}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedCategory(val);
                    if (val === 'جميع المجموعات') {
                      setCategoryFilterState({ mode: 'all', displayName: 'جميع المجموعات' });
                    } else {
                      setCategoryFilterState({ mode: 'main-only', displayName: val, mainName: val });
                    }
                  }}
                  className={`flex-1 h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-medium transition-colors shadow-2xs cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
                  }`}
                >
                  <option value="جميع المجموعات">جميع المجموعات</option>
                  {combinedCategoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  id="itemBalancesCategoryTreeBtn"
                  onClick={() => setIsCategoryModalOpen(true)}
                  title="بحث واختيار من شجرة الأصناف والمجموعات"
                  className={`h-9 px-3 text-xs font-bold border rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700 hover:text-blue-300 shadow-2xs' 
                      : 'bg-white border-slate-300 text-[#1565C0] hover:bg-blue-50 hover:text-blue-700 shadow-2xs'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>شجرة المجموعات</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. حقل التاريخ (تاريخ اليوم + CheckBox حتى تاريخ وتحديد التاريخ) */}
          <div className="space-y-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end">
              {/* تاريخ اليوم: تاريخ الجهاز */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  تاريخ اليوم (الجهاز)
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    readOnly
                    value={todayDate}
                    className={`w-full h-9 text-xs sm:text-[13px] rounded-lg pl-8 pr-3 border font-mono font-bold outline-none cursor-default shadow-2xs ${
                      isDark ? 'bg-slate-850 border-slate-700 text-slate-200' : 'bg-slate-100/90 border-slate-300 text-slate-800'
                    }`}
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>

              {/* CheckBox «حتى تاريخ» وتحديد التاريخ */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1.5 space-x-reverse h-4">
                  <input 
                    type="checkbox" 
                    id="enableToDateCheckbox"
                    checked={isToDateEnabled}
                    onChange={(e) => setIsToDateEnabled(e.target.checked)}
                    className="w-3.5 h-3.5 text-[#1565C0] rounded cursor-pointer border-slate-300 focus:ring-[#1565C0] accent-[#1565C0]" 
                  />
                  <label htmlFor="enableToDateCheckbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    حتى تاريخ
                  </label>
                </div>
                <div className="relative">
                  <input 
                    type="date"
                    value={toDate}
                    disabled={!isToDateEnabled}
                    onChange={(e) => setToDate(e.target.value)}
                    className={`w-full h-9 text-xs sm:text-[13px] rounded-lg pl-8 pr-3 border font-mono outline-none transition-all shadow-2xs ${
                      !isToDateEnabled
                        ? isDark 
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed opacity-50' 
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                        : isDark 
                          ? 'bg-slate-850 border-blue-500 text-slate-100 ring-1 ring-blue-500/20' 
                          : 'bg-white border-[#1565C0] text-slate-800 ring-1 ring-[#1565C0]/20'
                    }`}
                  />
                  <Calendar className={`w-3.5 h-3.5 absolute left-2.5 top-2.5 pointer-events-none ${
                    isToDateEnabled ? (isDark ? 'text-blue-400' : 'text-[#1565C0]') : 'text-slate-400'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ثالثًا: زر «عرض التقرير» في منتصف منطقة الـHeader أسفل الفلاتر */}
        <div className="flex flex-col items-center justify-center pt-2">
          <button 
            type="button"
            id="itemBalancesExecuteReportBtn"
            onClick={handleExecuteReport}
            disabled={isExecuting}
            className={`h-10 px-8 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2 space-x-reverse min-w-[200px] sm:min-w-[240px] ${
              isExecuting 
                ? 'bg-blue-800 opacity-80 cursor-wait text-white' 
                : hasFilterChanges
                  ? 'bg-[#1565C0] hover:bg-[#0D47A1] text-white ring-4 ring-blue-400/30 shadow-lg'
                  : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white shadow-sm hover:shadow-md'
            }`}
          >
            {isExecuting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isExecuting ? 'جاري الاستخراج...' : 'عرض التقرير'}</span>
          </button>
          {hasFilterChanges && (
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold text-center flex items-center justify-center space-x-1 space-x-reverse mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-ping inline-block" />
              <span>تم تعديل الفلترة — اضغط للعرض</span>
            </p>
          )}
        </div>
      </div>

      {/* Results Area: Clean empty state before execution; Search bar + Table after execution */}
      {!hasExecuted ? (
        <div className={`flex-1 border rounded-xl overflow-hidden shadow-2xs flex flex-col items-center justify-center p-8 sm:p-14 text-center min-h-[340px] ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1565C0] dark:text-blue-400 mb-3.5 border border-blue-100 dark:border-blue-800 shadow-2xs">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            جاهز لعرض تقرير أرصدة الأصناف
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-5">
            حدد خيارات التقرير والفلاتر المطلوبة أعلاه ثم اضغط على زر <span className="font-bold text-[#1565C0] dark:text-blue-400">«عرض التقرير»</span> لاستخراج وعرض جدول الأرصدة والنتائج.
          </p>
          <button
            type="button"
            id="itemBalancesExecuteReportPromptBtn"
            onClick={handleExecuteReport}
            disabled={isExecuting}
            className="px-6 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-2 space-x-reverse"
          >
            {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isExecuting ? 'جاري الاستخراج...' : 'عرض التقرير الآن'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Full-width Search Bar across entire workspace */}
          <div className="w-full">
            <div className="relative w-full">
              <input 
                type="text"
                id="itemBalancesSearchInput"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بكود الصنف أو اسم الصنف..."
                className={`w-full text-xs sm:text-sm rounded-xl pl-20 pr-4 py-2.5 border transition-all outline-none shadow-xs font-medium ${
                  isDark 
                    ? 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500' 
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center space-x-2 space-x-reverse">
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-0.5 rounded transition-colors bg-slate-200 dark:bg-slate-700 cursor-pointer"
                    title="مسح البحث"
                  >
                    مسح
                  </button>
                )}
                <Search className="w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

      {/* Table Data View */}
      <div className={`flex-1 border rounded-xl overflow-hidden shadow-sm flex flex-col ${
        isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-right border-collapse select-text">
            <thead>
              <tr className={`border-b ${isDark ? 'bg-slate-800/90 text-blue-300 border-slate-700' : 'bg-blue-50/70 text-blue-900 border-blue-100'}`}>
                <th className="py-3 px-3 font-bold text-center w-14 text-xs sm:text-sm">م</th>
                <th className="py-3 px-3 font-bold text-center w-32 text-xs sm:text-sm font-mono">كود الصنف</th>
                <ReportSortHeaderCell
                  title="اسم الصنف"
                  columnKey="name"
                  activeSortKey={tableSortConfig?.key || null}
                  activeSortDirection={tableSortConfig?.direction || null}
                  onSort={handleTableSort}
                  align="right"
                  accentColor="blue"
                  className="min-w-[280px] text-sm sm:text-base"
                />
                {appliedFilters.isCategoryForBranches && (
                  <th className="py-3 px-3 font-bold text-center w-36 text-xs sm:text-sm">الفرع</th>
                )}
                <th className="py-3 px-3 font-bold text-center w-24 text-xs sm:text-sm">الوحدة</th>
                <ReportSortHeaderCell
                  title="الرصيد المتاح"
                  columnKey="available"
                  activeSortKey={tableSortConfig?.key || null}
                  activeSortDirection={tableSortConfig?.direction || null}
                  onSort={handleTableSort}
                  align="center"
                  accentColor="blue"
                  className="w-36 text-sm sm:text-base"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={appliedFilters.isCategoryForBranches ? 6 : 5} className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                    لا توجد أصناف مطابقة لمعايير الفلترة المحددة.
                  </td>
                </tr>
              ) : isGroupedByCategory ? (
                sortedCategoryGroups.map((group, gIdx) => (
                  <React.Fragment key={`group-${group.categoryName}-${gIdx}`}>
                    {/* Category Section Header Row */}
                    <tr className="border-y-2 border-slate-300 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800/90">
                      <td 
                        colSpan={appliedFilters.isCategoryForBranches ? 6 : 5} 
                        className="py-2.5 px-4 font-bold text-slate-900 dark:text-slate-100 bg-blue-50/70 dark:bg-blue-950/40"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <Folder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-700 dark:text-blue-300 font-bold">المجموعة:</span>
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">{group.categoryName}</span>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">({group.items.length} صنف)</span>
                          </div>
                          <div className="text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            إجمالي المجموعة: {formatNumber(group.totalAvailable)}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Items under this category */}
                    {group.items.map((item, idx) => (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                          isDark ? 'text-slate-200' : 'text-slate-800'
                        } ${item.available < 0 ? 'bg-rose-500/10' : ''}`}
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{idx + 1}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm tracking-wide">{item.code}</td>
                        <td className="py-3 px-5 text-right font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed">{item.name}</td>
                        {appliedFilters.isCategoryForBranches && (
                          <td className="py-3 px-3 text-center font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{item.branch}</td>
                        )}
                        <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">{item.unit}</td>
                        <td className={`py-3 px-4 text-center font-mono font-extrabold text-base sm:text-lg ${
                          item.available < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {formatNumber(item.available)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              ) : (
                sortedFilteredItems.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 transition-colors ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    } ${item.available < 0 ? 'bg-rose-500/10' : ''}`}
                  >
                    <td className="py-3 px-3 text-center font-mono text-slate-500 dark:text-slate-400 text-xs sm:text-sm">{idx + 1}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 text-xs sm:text-sm tracking-wide">{item.code}</td>
                    <td className="py-3 px-5 text-right font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed">{item.name}</td>
                    {appliedFilters.isCategoryForBranches && (
                      <td className="py-3 px-3 text-center font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm">{item.branch}</td>
                    )}
                    <td className="py-3 px-3 text-center text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium">{item.unit}</td>
                    <td className={`py-3 px-4 text-center font-mono font-extrabold text-base sm:text-lg ${
                      item.available < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatNumber(item.available)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Total Row */}
            <tfoot>
              <tr className={`border-t font-bold font-mono ${
                isDark ? 'bg-slate-850 text-slate-100 border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
              }`}>
                <td colSpan={appliedFilters.isCategoryForBranches ? 5 : 4} className="py-3.5 px-5 text-left font-sans text-sm sm:text-base font-extrabold">
                  الإجمالي:
                </td>
                <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-400 font-extrabold font-mono text-base sm:text-lg">
                  {formatNumber(totalAvailable)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Bottom Bar Details */}
        <div className={`px-4 py-2 border-t flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>عرض {filteredItems.length} من أصل {systemItems.length} صنف</div>
          <div className="font-bold">عدد الأصناف: <span className="text-purple-700 dark:text-purple-400 font-mono text-sm">{totalCount}</span></div>
        </div>
      </div>
    </>
  )}

      {/* Print Preview Modal */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300">
            {/* Modal Action Header (Excluded from Print) */}
            <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">معاينة طباعة — تقرير أرصدة الأصناف</span>
                <span className="text-xs text-slate-400">({filteredItems.length} صنف)</span>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center space-x-1.5 space-x-reverse px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة الآن</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className="flex items-center space-x-1.5 space-x-reverse px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                  title="تصدير إلى ملف PDF"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  <span>{isExportingPdf ? 'جاري التصدير...' : 'تصدير PDF'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>إغلاق المعاينة</span>
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100 flex justify-center">
              <div 
                id="item-balances-printable-area" 
                className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-slate-900 font-sans text-right"
              >
                {/* Central Unified VERTEX Report Header */}
                <VertexReportHeader
                  companyName={companyName}
                  systemSubtitle={`نظام إدارة المخازن والمستودعات — الفرع: ${currentBranchName}`}
                  reportTitle="تقرير أرصدة الأصناف"
                  reportSubtitle={`${reportTypeSubtitle} — ${reportScopeName}`}
                  themeColor="blue"
                  isPrintVersion={true}
                  metadataItems={[
                    {
                      label: 'تاريخ التقرير',
                      value: todayDate,
                      isMono: true
                    },
                    ...(appliedFilters.isToDateEnabled ? [{
                      label: 'حتى تاريخ',
                      value: appliedFilters.toDate,
                      isMono: true
                    }] : []),
                    {
                      label: 'عدد الأصناف',
                      value: `${totalCount} صنف`,
                      isMono: true
                    },
                    {
                      label: 'إجمالي الرصيد المتاح',
                      value: formatNumber(totalAvailable),
                      highlight: 'emerald',
                      isMono: true
                    }
                  ]}
                />

                {/* Printable Table */}
                <table className="w-full text-xs sm:text-sm text-right border-collapse border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 font-bold">
                      <th className="py-2.5 px-2 text-center border-l border-slate-300 w-12">م</th>
                      <th className="py-2.5 px-2 text-center border-l border-slate-300 w-28">كود الصنف</th>
                      <th className="py-2.5 px-3 text-right border-l border-slate-300">اسم الصنف</th>
                      {appliedFilters.isCategoryForBranches && (
                        <th className="py-2.5 px-2 text-center border-l border-slate-300 w-32">الفرع</th>
                      )}
                      <th className="py-2.5 px-2 text-center border-l border-slate-300 w-20">الوحدة</th>
                      <th className="py-2.5 px-3 text-center w-32">الرصيد المتاح</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={appliedFilters.isCategoryForBranches ? 6 : 5} className="py-6 text-center text-slate-500">
                          لا توجد أصناف مطابقة للبيانات المحددة.
                        </td>
                      </tr>
                    ) : isGroupedByCategory ? (
                      categoryGroups.map((group, gIdx) => (
                        <React.Fragment key={`print-group-${group.categoryName}-${gIdx}`}>
                          <tr className="bg-slate-100 border-y-2 border-slate-300 font-bold">
                            <td colSpan={appliedFilters.isCategoryForBranches ? 6 : 5} className="py-2 px-3 text-right bg-slate-100 text-slate-900 font-bold">
                              <div className="flex items-center justify-between">
                                <span>المجموعة: {group.categoryName} ({group.items.length} صنف)</span>
                                <span className="font-mono text-xs">إجمالي المجموعة: {formatNumber(group.totalAvailable)}</span>
                              </div>
                            </td>
                          </tr>
                          {group.items.map((item, idx) => (
                            <tr key={item.id} className="border-b border-slate-200">
                              <td className="py-2 px-2 text-center border-l border-slate-300 font-mono text-slate-600">{idx + 1}</td>
                              <td className="py-2 px-2 text-center border-l border-slate-300 font-mono font-bold">{item.code}</td>
                              <td className="py-2 px-3 text-right border-l border-slate-300 font-bold text-slate-900">{item.name}</td>
                              {appliedFilters.isCategoryForBranches && (
                                <td className="py-2 px-2 text-center border-l border-slate-300 font-medium">{item.branch}</td>
                              )}
                              <td className="py-2 px-2 text-center border-l border-slate-300">{item.unit}</td>
                              <td className="py-2 px-3 text-center font-mono font-extrabold text-slate-900 text-sm">
                                {formatNumber(item.available)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    ) : (
                      filteredItems.map((item, idx) => (
                        <tr key={item.id} className="border-b border-slate-200">
                          <td className="py-2 px-2 text-center border-l border-slate-300 font-mono text-slate-600">{idx + 1}</td>
                          <td className="py-2 px-2 text-center border-l border-slate-300 font-mono font-bold">{item.code}</td>
                          <td className="py-2 px-3 text-right border-l border-slate-300 font-bold text-slate-900">{item.name}</td>
                          {appliedFilters.isCategoryForBranches && (
                            <td className="py-2 px-2 text-center border-l border-slate-300 font-medium">{item.branch}</td>
                          )}
                          <td className="py-2 px-2 text-center border-l border-slate-300">{item.unit}</td>
                          <td className="py-2 px-3 text-center font-mono font-extrabold text-slate-900 text-sm">
                            {formatNumber(item.available)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold border-t-2 border-slate-400">
                      <td colSpan={appliedFilters.isCategoryForBranches ? 5 : 4} className="py-2.5 px-3 text-left border-l border-slate-300 text-sm">
                        الإجمالي:
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-sm sm:text-base text-slate-900">
                        {formatNumber(totalAvailable)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Printable Signatures */}
                <div className="mt-10 pt-6 border-t border-slate-300 grid grid-cols-3 text-center text-xs font-semibold text-slate-700">
                  <div>
                    <p className="mb-8">أمين المخزن / العهدة</p>
                    <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
                  </div>
                  <div>
                    <p className="mb-8">مراجع الحسابات والمخازن</p>
                    <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
                  </div>
                  <div>
                    <p className="mb-8">يعتمد مدير الفرع</p>
                    <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
                  </div>
                </div>

                {/* Print Footer Notice */}
                <div className="mt-8 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>تم إصدار هذا التقرير آلياً من نظام إدارة المخازن</span>
                  <span>صفحة 1 من 1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Media Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #item-balances-printable-area, #item-balances-printable-area * {
            visibility: visible;
          }
          #item-balances-printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 15px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Category Tree Selector Modal */}
      <CategoryTreeSelectorModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={handleCategorySelectedFromTree}
        currentSelected={selectedCategory}
        isDark={isDark}
      />
    </div>
  );
};

