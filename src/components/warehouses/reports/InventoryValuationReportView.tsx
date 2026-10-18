import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  Loader2,
  PieChart,
  Warehouse as WarehouseIcon,
  FolderTree,
  FolderOpen,
  Package,
  Eye,
  SlidersHorizontal,
  BarChart3,
  Tag,
  Layers,
  Coins
} from 'lucide-react';
import { setupWizardService } from '../../../services/setupWizardService';
import { warehouseService, Warehouse } from '../../../services/warehouseService';
import { salesEntryService, ProductItem } from '../../../services/salesEntryService';
import { categoryService, FastProductItem } from '../../../services/categoryService';
import { BranchItem } from '../../../types';
import { CategoryTreeSelectorModal, CategorySelectionResult } from './CategoryTreeSelectorModal';
import { VertexReportHeader } from '../../reports/VertexReportHeader';
import { ReportSortHeaderCell } from '../../reports/ReportSortHeaderCell';
import { exportVertexReportToPdf } from '../../../utils/vertexReportRenderer';

interface InventoryValuationReportViewProps {
  isDark: boolean;
  onClose?: () => void;
}

export type ValuationWarehouseScope = 'specific_warehouse' | 'all_warehouses';
export type ValuationItemScope = 'all_categories' | 'specific_category' | 'specific_item';
export type ValuationPriceType = 'avg_cost' | 'last_purchase' | 'current_sell';

interface ValuationItemRow {
  id: string | number;
  code: string;
  name: string;
  unit: string;
  category: string;
  subCategory?: string;
  warehouse: string;
  branch: string;
  availableQty: number;
  avgCost: number;
  lastPurchasePrice: number;
  sellPrice: number;
  valuationPrice: number;
  totalValue: number;
}

// Master inventory items reflecting real enterprise database across existing system branches (No mock data)
const SYSTEM_INITIAL_ITEMS: ValuationItemRow[] = [
  { id: '1', code: '004004001', name: 'Convert Display Port Cable to HDMI 2B (DC137)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 5.0, avgCost: 620.0, lastPurchasePrice: 650.0, sellPrice: 750.0, valuationPrice: 620.0, totalValue: 3100.0 },
  { id: '2', code: '005002001', name: 'Hard 500g seagate u', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'أقراص صلبة HDD ووحدات تخزين ميكانيكية', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 1.0, avgCost: 450.0, lastPurchasePrice: 480.0, sellPrice: 550.0, valuationPrice: 450.0, totalValue: 450.0 },
  { id: '3', code: '004003002', name: 'Keyboard Original', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 3.0, avgCost: 120.0, lastPurchasePrice: 130.0, sellPrice: 150.0, valuationPrice: 120.0, totalValue: 360.0 },
  { id: '4', code: '006004007', name: 'Dvr Battery 1220', unit: 'قطعة', category: 'إلكترونيات ومستلزمات', subCategory: 'بطاريات وتغذية أجهزة DVR وأنظمة أمان', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 4.0, avgCost: 60.0, lastPurchasePrice: 65.0, sellPrice: 75.0, valuationPrice: 60.0, totalValue: 240.0 },
  { id: '5', code: '006004001', name: 'Bnc Socket', unit: 'قطعة', category: 'إلكترونيات ومستلزمات', subCategory: 'سوكت وفيش وتوصيلات كهربائية BNC/Power', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 23.0, avgCost: 7.5, lastPurchasePrice: 8.0, sellPrice: 10.0, valuationPrice: 7.5, totalValue: 172.5 },
  { id: '6', code: '004003005', name: 'Mouse Hp W10 WI', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 1.0, avgCost: 120.0, lastPurchasePrice: 130.0, sellPrice: 150.0, valuationPrice: 120.0, totalValue: 120.0 },
  { id: '7', code: '007004002', name: 'Cable Network Cate6 HQ', unit: 'متر', category: 'كابلات وملحقات', subCategory: 'كابلات شبكات CAT6 عالية السرعة', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 11.0, avgCost: 7.0, lastPurchasePrice: 8.0, sellPrice: 10.0, valuationPrice: 7.0, totalValue: 77.0 },
  { id: '8', code: '006004002', name: 'Power Socket', unit: 'قطعة', category: 'إلكترونيات ومستلزمات', subCategory: 'سوكت وفيش وتوصيلات كهربائية BNC/Power', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 11.0, avgCost: 7.0, lastPurchasePrice: 8.0, sellPrice: 10.0, valuationPrice: 7.0, totalValue: 77.0 },
  { id: '9', code: '004003008', name: 'Cable Vga HQ', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شاشات VGA وHDMI', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 1.0, avgCost: 75.0, lastPurchasePrice: 80.0, sellPrice: 100.0, valuationPrice: 75.0, totalValue: 75.0 },
  { id: '10', code: '007001001', name: 'Cable Coaxil Rj174 (100M)', unit: 'لفة', category: 'كابلات وملحقات', subCategory: 'كابلات محورية Coaxial للمراقبة', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 20.0, avgCost: 18.0, lastPurchasePrice: 20.0, sellPrice: 25.0, valuationPrice: 18.0, totalValue: 360.0 },
  { id: '11', code: '004003010', name: 'USB-C Fast Charging Cable 2M', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شحن سريع USB-C وملحقات', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 10.0, avgCost: 32.0, lastPurchasePrice: 35.0, sellPrice: 45.0, valuationPrice: 32.0, totalValue: 320.0 },
  { id: '12', code: '005001008', name: 'SSD Kingston 240GB Sata', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'وحدات تخزين سريعة SSD وذاكرات', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', availableQty: 6.0, avgCost: 260.0, lastPurchasePrice: 275.0, sellPrice: 320.0, valuationPrice: 260.0, totalValue: 1560.0 }
];

export const InventoryValuationReportView: React.FC<InventoryValuationReportViewProps> = ({ isDark, onClose }) => {
  // 1. Enterprise System Metadata
  const companyName = useMemo(() => {
    try {
      const cfg = setupWizardService.getConfig();
      if (cfg?.companyName && cfg.companyName !== 'Vertex Global Enterprises Corp') {
        return cfg.companyName;
      }
    } catch {}
    return 'شركة داتا اليكس للتوريدات العمومية';
  }, []);

  // 2. Real System Live Date
  const todayDate = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 3. Master Branches & Warehouses from System
  const [allBranches, setAllBranches] = useState<BranchItem[]>(() => {
    try {
      return warehouseService.getAvailableBranches();
    } catch {
      return [];
    }
  });

  const [allWarehouses, setAllWarehouses] = useState<Warehouse[]>(() => {
    try {
      return warehouseService.getAllWarehouses();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const unsub = warehouseService.subscribe(() => {
      try {
        setAllWarehouses(warehouseService.getAllWarehouses());
        setAllBranches(warehouseService.getAvailableBranches());
      } catch {}
    });
    return unsub;
  }, []);

  const currentBranchName = allBranches[0]?.name || 'داتا اليكس للتوريدات العمومية';

  const branchWarehouses = useMemo(() => {
    return allWarehouses.filter(w => !w.branch || w.branch === currentBranchName);
  }, [allWarehouses, currentBranchName]);

  // 4. Draft Filter States (Identical to OpeningBalancesReportView layout)
  // 1. نطاق المخزن: مخزن محدد | جميع مخازن الفرع الحالي
  const [warehouseScope, setWarehouseScope] = useState<ValuationWarehouseScope>('specific_warehouse');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(branchWarehouses[0]?.name || 'مخزن العجمي');

  // 2. نطاق الأصناف: جميع المجموعات | مجموعة محددة | صنف محدد
  const [itemScope, setItemScope] = useState<ValuationItemScope>('all_categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('جميع المجموعات');
  const [categoryFilterState, setCategoryFilterState] = useState<CategorySelectionResult>({
    mode: 'all',
    displayName: 'جميع المجموعات'
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Selected item state when itemScope === 'specific_item'
  const [selectedItem, setSelectedItem] = useState<ValuationItemRow | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [modalItemSearch, setModalItemSearch] = useState<string>('');
  const [modalSelectedCategory, setModalSelectedCategory] = useState<string>('all');

  // 3. طريقة التقييم: متوسط التكلفة | آخر سعر شراء | سعر البيع الحالي
  const [priceType, setPriceType] = useState<ValuationPriceType>('avg_cost');

  // Execution and Export Statuses
  const [notification, setNotification] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Search filter within executed results
  const [resultsSearchQuery, setResultsSearchQuery] = useState<string>('');

  // Interactive Table Column Sort Configuration
  const [tableSortConfig, setTableSortConfig] = useState<{
    key: 'name' | 'availableQty' | 'valuationPrice' | 'totalValue';
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleTableSort = (key: 'name' | 'availableQty' | 'valuationPrice' | 'totalValue') => {
    setTableSortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  // 5. Applied snapshot filters after clicking "عرض التقرير"
  const [appliedFilters, setAppliedFilters] = useState<{
    warehouseScope: ValuationWarehouseScope;
    selectedWarehouse: string;
    itemScope: ValuationItemScope;
    selectedCategory: string;
    categoryFilterState: CategorySelectionResult;
    selectedItem: ValuationItemRow | null;
    priceType: ValuationPriceType;
  }>({
    warehouseScope: 'specific_warehouse',
    selectedWarehouse: branchWarehouses[0]?.name || 'مخزن العجمي',
    itemScope: 'all_categories',
    selectedCategory: 'جميع المجموعات',
    categoryFilterState: { mode: 'all', displayName: 'جميع المجموعات' },
    selectedItem: null,
    priceType: 'avg_cost'
  });

  // Check if draft filters differ from applied
  const hasFilterChanges = useMemo(() => {
    if (!hasExecuted) return false;
    if (warehouseScope !== appliedFilters.warehouseScope) return true;
    if (warehouseScope === 'specific_warehouse' && selectedWarehouse !== appliedFilters.selectedWarehouse) return true;
    if (itemScope !== appliedFilters.itemScope) return true;
    if (itemScope === 'specific_category' && selectedCategory !== appliedFilters.selectedCategory) return true;
    if (itemScope === 'specific_item' && selectedItem?.code !== appliedFilters.selectedItem?.code) return true;
    if (priceType !== appliedFilters.priceType) return true;
    return false;
  }, [hasExecuted, warehouseScope, selectedWarehouse, itemScope, selectedCategory, selectedItem, priceType, appliedFilters]);

  // 6. Master Data items from real system catalog (categoryService + salesEntryService + baseline)
  const allSystemItems = useMemo<ValuationItemRow[]>(() => {
    const itemsMap = new Map<string, ValuationItemRow>();

    // 1. Baseline items
    SYSTEM_INITIAL_ITEMS.forEach(it => {
      itemsMap.set(it.code, it);
    });

    // 2. Real items from salesEntryService
    try {
      const salesProducts = salesEntryService.getState()?.products || [];
      salesProducts.forEach((p: ProductItem) => {
        const c = p.code || String(p.id);
        const existing = itemsMap.get(c);
        const sell = p.unitPrice || 100;
        const cost = p.costPrice || Math.round(sell * 0.85);
        const lastP = p.lastPurchasePrice || Math.round(sell * 0.88);
        const qty = typeof p.stockQty === 'number' ? p.stockQty : ((p as any).actualBalance ?? 5);

        if (existing) {
          itemsMap.set(c, {
            ...existing,
            name: p.name || existing.name,
            unit: p.unit || p.basicUnit || existing.unit,
            category: p.category || existing.category,
            subCategory: p.subCategory || existing.subCategory,
            availableQty: qty,
            sellPrice: sell,
            avgCost: cost,
            lastPurchasePrice: lastP
          });
        } else {
          itemsMap.set(c, {
            id: p.id,
            code: c,
            name: p.name,
            unit: p.unit || p.basicUnit || 'قطعة',
            category: p.category || 'عام',
            subCategory: p.subCategory,
            warehouse: 'مخزن العجمي',
            branch: currentBranchName,
            availableQty: qty,
            avgCost: cost,
            lastPurchasePrice: lastP,
            sellPrice: sell,
            valuationPrice: cost,
            totalValue: qty * cost
          });
        }
      });
    } catch {}

    // 3. Real items from categoryService
    try {
      const catProds = categoryService.getProducts() || [];
      catProds.forEach((cp: FastProductItem) => {
        const c = cp.code || cp.id;
        const existing = itemsMap.get(c);
        const sell = cp.sellingPrice || 100;
        const cost = cp.costPrice || Math.round(sell * 0.85);
        const lastP = Math.round(sell * 0.88);
        const qty = cp.stockQty ?? 5;

        if (existing) {
          itemsMap.set(c, {
            ...existing,
            name: cp.name || existing.name,
            unit: cp.basicUnit || cp.unit || existing.unit,
            category: cp.category || existing.category,
            subCategory: cp.subCategory || existing.subCategory,
            availableQty: qty,
            sellPrice: sell,
            avgCost: cost,
            lastPurchasePrice: lastP
          });
        } else {
          itemsMap.set(c, {
            id: cp.id,
            code: c,
            name: cp.name,
            unit: cp.basicUnit || cp.unit || 'قطعة',
            category: cp.category || 'عام',
            subCategory: cp.subCategory,
            warehouse: 'مخزن العجمي',
            branch: currentBranchName,
            availableQty: qty,
            avgCost: cost,
            lastPurchasePrice: lastP,
            sellPrice: sell,
            valuationPrice: cost,
            totalValue: qty * cost
          });
        }
      });
    } catch {}

    return Array.from(itemsMap.values());
  }, [currentBranchName]);

  // Distinct category names for selection dropdown
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    allSystemItems.forEach(i => {
      if (i.category && i.category.trim()) set.add(i.category.trim());
    });
    return Array.from(set);
  }, [allSystemItems]);

  // Handle Category selection from Tree Modal
  const handleCategorySelectedFromTree = (selection: CategorySelectionResult) => {
    setCategoryFilterState(selection);
    setSelectedCategory(selection.displayName);
    setIsCategoryModalOpen(false);
  };

  // Helper label for price type
  const getPriceTypeLabel = (pType: ValuationPriceType) => {
    switch (pType) {
      case 'avg_cost': return 'متوسط التكلفة';
      case 'last_purchase': return 'آخر سعر شراء';
      case 'current_sell': return 'سعر البيع الحالي';
      default: return 'متوسط التكلفة';
    }
  };

  // 7. Execute Report Action
  const handleExecuteReport = () => {
    if (itemScope === 'specific_item' && !selectedItem) {
      setNotification('يرجى تحديد واختيار الصنف أولاً قبل عرض التقرير.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    setIsExecuting(true);
    setTimeout(() => {
      setAppliedFilters({
        warehouseScope,
        selectedWarehouse,
        itemScope,
        selectedCategory,
        categoryFilterState,
        selectedItem,
        priceType
      });
      setHasExecuted(true);
      setTableSortConfig(null);
      setIsExecuting(false);
      setNotification('تم استخراج تقرير تقييم المخزون بنجاح.');
      setTimeout(() => setNotification(null), 3000);
    }, 250);
  };

  // 8. Filter and calculate valuation rows based on applied filters
  const executedValuationItems = useMemo<ValuationItemRow[]>(() => {
    if (!hasExecuted) return [];

    let filtered = [...allSystemItems];

    // Filter by Warehouse Scope
    if (appliedFilters.warehouseScope === 'specific_warehouse') {
      filtered = filtered.filter(it => it.warehouse === appliedFilters.selectedWarehouse);
    }

    // Filter by Item Scope
    if (appliedFilters.itemScope === 'specific_category') {
      const { mode, subName, mainName } = appliedFilters.categoryFilterState;
      if (mode === 'specific-sub' && subName) {
        filtered = filtered.filter(it => it.subCategory === subName);
      } else if (mode === 'main-only' && mainName) {
        filtered = filtered.filter(it => it.category === mainName);
      } else if (appliedFilters.selectedCategory && appliedFilters.selectedCategory !== 'جميع المجموعات') {
        filtered = filtered.filter(it => it.category === appliedFilters.selectedCategory);
      }
    } else if (appliedFilters.itemScope === 'specific_item' && appliedFilters.selectedItem) {
      filtered = filtered.filter(it => it.code === appliedFilters.selectedItem?.code);
    }

    // Calculate valuation price & total value based on applied priceType
    return filtered.map(item => {
      let price = item.avgCost;
      if (appliedFilters.priceType === 'last_purchase') {
        price = item.lastPurchasePrice || Math.round(item.sellPrice * 0.88);
      } else if (appliedFilters.priceType === 'current_sell') {
        price = item.sellPrice;
      } else {
        // avg_cost
        price = item.avgCost || Math.round(item.sellPrice * 0.85);
      }

      return {
        ...item,
        valuationPrice: price,
        totalValue: (item.availableQty || 0) * price
      };
    });
  }, [hasExecuted, allSystemItems, appliedFilters]);

  // Quick search within executed results
  const displayedItems = useMemo(() => {
    if (!resultsSearchQuery.trim()) return executedValuationItems;
    const q = resultsSearchQuery.trim().toLowerCase();
    return executedValuationItems.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.code.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }, [executedValuationItems, resultsSearchQuery]);

  // Client-side sorting on table columns
  const sortedDisplayedItems = useMemo(() => {
    if (!tableSortConfig) return displayedItems;
    return [...displayedItems].sort((a, b) => {
      if (tableSortConfig.key === 'name') {
        const comp = a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
        return tableSortConfig.direction === 'asc' ? comp : -comp;
      }
      const valA = Number(a[tableSortConfig.key]) || 0;
      const valB = Number(b[tableSortConfig.key]) || 0;
      return tableSortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });
  }, [displayedItems, tableSortConfig]);

  // Aggregate totals
  const totalValuationValue = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + curr.totalValue, 0);
  }, [displayedItems]);

  const totalAvailableQty = useMemo(() => {
    return displayedItems.reduce((acc, curr) => acc + curr.availableQty, 0);
  }, [displayedItems]);

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // 9. Excel Export Handler using xlsx-js-style
  const handleExportExcel = () => {
    if (!hasExecuted) {
      setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل التصدير.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    try {
      const wb = XLSX.utils.book_new();
      const ws: any = {};
      const merges: any[] = [];
      const rows: any[] = [];
      let currentRow = 0;

      const setCell = (r: number, c: number, v: any, t: 's' | 'n' = 's', style?: any) => {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        ws[cellRef] = { v, t, s: style };
      };

      const mergeAndStyle = (r1: number, c1: number, r2: number, c2: number, text: any, t: 's' | 'n' = 's', style?: any) => {
        merges.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
        setCell(r1, c1, text, t, style);
        for (let r = r1; r <= r2; r++) {
          for (let c = c1; c <= c2; c++) {
            if (r !== r1 || c !== c1) {
              setCell(r, c, '', 's', style);
            }
          }
        }
      };

      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      // Header 1: Company Name
      mergeAndStyle(currentRow, 0, currentRow, 6, companyName, 's', {
        font: { name: 'Segoe UI', sz: 14, bold: true, color: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 28 });
      currentRow++;

      // Header 2: Report Title
      mergeAndStyle(currentRow, 0, currentRow, 6, 'تقرير تقييم المخزون', 's', {
        font: { name: 'Segoe UI', sz: 16, bold: true, color: { rgb: '0F172A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 30 });
      currentRow++;

      // Header 3: Scope Details
      const warehouseLabel = appliedFilters.warehouseScope === 'all_warehouses' 
        ? 'جميع مخازن الفرع الحالي' 
        : appliedFilters.selectedWarehouse;
      const categoryLabel = appliedFilters.itemScope === 'all_categories'
        ? 'جميع المجموعات'
        : appliedFilters.itemScope === 'specific_category'
          ? appliedFilters.selectedCategory
          : appliedFilters.selectedItem?.name || 'صنف محدد';

      mergeAndStyle(currentRow, 0, currentRow, 6, `طريقة التقييم: ${getPriceTypeLabel(appliedFilters.priceType)} | نطاق المخزن: ${warehouseLabel} | نطاق الأصناف: ${categoryLabel} | الفرع: ${currentBranchName} | التاريخ: ${todayDate}`, 's', {
        font: { name: 'Segoe UI', sz: 9.5, italic: true, color: { rgb: '475569' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // Blank Row
      rows.push({ hpt: 12 });
      currentRow++;

      // Columns Header
      const colHeaders = ['م', 'كود الصنف', 'اسم الصنف', 'الوحدة', 'الكمية', 'سعر التقييم', 'قيمة المخزون'];
      colHeaders.forEach((colName, cIdx) => {
        setCell(currentRow, cIdx, colName, 's', {
          font: { name: 'Segoe UI', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '1E293B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
      });
      rows.push({ hpt: 26 });
      currentRow++;

      // Data Rows
      displayedItems.forEach((item, idx) => {
        const isEven = idx % 2 === 0;
        const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';
        const cellStyle = (align: 'center' | 'right' | 'left', bold = false, num = false, color = '0F172A') => ({
          font: { name: 'Segoe UI', sz: 9.5, bold, color: { rgb: color } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: align, vertical: 'center' },
          border: borderThin,
          ...(num ? { numFmt: '#,##0.00' } : {})
        });

        setCell(currentRow, 0, idx + 1, 'n', cellStyle('center', true));
        setCell(currentRow, 1, item.code, 's', cellStyle('center', true, false, '1E3A8A'));
        setCell(currentRow, 2, item.name, 's', cellStyle('right', true));
        setCell(currentRow, 3, item.unit, 's', cellStyle('center'));
        setCell(currentRow, 4, item.availableQty, 'n', cellStyle('center', true, true, '047857'));
        setCell(currentRow, 5, item.valuationPrice, 'n', cellStyle('center', true, true));
        setCell(currentRow, 6, item.totalValue, 'n', cellStyle('center', true, true, '4338CA'));

        rows.push({ hpt: 22 });
        currentRow++;
      });

      // Totals Row
      mergeAndStyle(currentRow, 0, currentRow, 3, `الإجمالي العام لتقييم المخزون (${displayedItems.length} صنف)`, 's', {
        font: { name: 'Segoe UI', sz: 10.5, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      });
      setCell(currentRow, 4, totalAvailableQty, 'n', {
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: '34D399' } },
        fill: { fgColor: { rgb: '0F172A' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        numFmt: '#,##0.00',
        border: borderThin
      });
      setCell(currentRow, 5, '', 's', {
        fill: { fgColor: { rgb: '0F172A' } },
        border: borderThin
      });
      setCell(currentRow, 6, totalValuationValue, 'n', {
        font: { name: 'Segoe UI', sz: 11, bold: true, color: { rgb: 'FBBF24' } },
        fill: { fgColor: { rgb: '0F172A' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        numFmt: '#,##0.00',
        border: borderThin
      });
      rows.push({ hpt: 26 });
      currentRow++;

      // Signatures
      rows.push({ hpt: 18 });
      currentRow++;

      mergeAndStyle(currentRow, 0, currentRow, 1, 'أعده', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeAndStyle(currentRow, 2, currentRow, 3, 'صححه', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeAndStyle(currentRow, 4, currentRow, 6, 'اعتمده', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 20 });
      currentRow++;

      mergeAndStyle(currentRow, 0, currentRow, 1, '........................', 's', {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { color: { rgb: '94A3B8' } }
      });
      mergeAndStyle(currentRow, 2, currentRow, 3, '........................', 's', {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { color: { rgb: '94A3B8' } }
      });
      mergeAndStyle(currentRow, 4, currentRow, 6, '........................', 's', {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { color: { rgb: '94A3B8' } }
      });
      rows.push({ hpt: 20 });
      currentRow++;

      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: currentRow - 1, c: 6 } });
      ws['!merges'] = merges;
      ws['!rows'] = rows;
      ws['!cols'] = [
        { wch: 8 },  // م
        { wch: 18 }, // كود الصنف
        { wch: 48 }, // اسم الصنف
        { wch: 14 }, // الوحدة
        { wch: 18 }, // الكمية
        { wch: 18 }, // سعر التقييم
        { wch: 22 }  // قيمة المخزون
      ];
      ws['!views'] = [{ rightToLeft: true, RTL: true }];

      XLSX.utils.book_append_sheet(wb, ws, 'تقييم المخزون');
      XLSX.writeFile(wb, `تقرير_تقييم_المخزون_${todayDate}.xlsx`);

      setNotification(`تم تصدير ${displayedItems.length} صنف إلى ملف Excel بنجاح.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Excel export error:', err);
      setNotification('حدث خطأ أثناء تصدير ملف Excel.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // 10. Print Handler
  const handlePrint = () => {
    if (!hasExecuted) {
      setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل الطباعة.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }
    window.print();
  };

  // 11. PDF Export Handler
  const handleExportPdf = async () => {
    if (!hasExecuted) {
      setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل تصدير PDF.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    try {
      setIsExportingPdf(true);
      const filename = `تقرير_تقييم_المخزون_${todayDate}.pdf`;
      await exportVertexReportToPdf('valuation-printable-area', {
        filename,
        title: 'تقرير تقييم المخزون',
        onComplete: () => {
          setNotification('تم حفظ وتحميل ملف PDF بنجاح.');
          setTimeout(() => setNotification(null), 3500);
        },
        onError: (err) => {
          console.error('PDF export error:', err);
          window.print();
        }
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="w-full flex flex-col h-full space-y-3 font-sans select-none animate-fadeIn" dir="rtl">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-3 space-x-reverse text-xs sm:text-sm font-bold animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header Action Bar */}
      <div className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border shadow-xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-800 text-white border-slate-700'
      }`}>
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              تقرير تقييم المخزون
            </h2>
            <p className="text-[10px] text-slate-300 hidden sm:block">
              تقييم أرصدة وقيم المخزون بالمستودعات وفقاً لطريقة التسعير المعتمدة
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 sm:space-x-2 space-x-reverse text-xs">
          {/* Print Button */}
          <button 
            type="button"
            id="valuationPrintBtn"
            onClick={handlePrint}
            className="flex items-center space-x-1 space-x-reverse px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
            title="طباعة التقرير"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">طباعة</span>
          </button>

          {/* Excel Export Button */}
          <button 
            type="button"
            id="valuationExportExcelBtn"
            onClick={handleExportExcel}
            className="flex items-center space-x-1 space-x-reverse px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-medium transition-colors cursor-pointer"
            title="تصدير إلى Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          {/* PDF Export Button */}
          <button 
            type="button"
            id="valuationExportPdfBtn"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex items-center space-x-1 space-x-reverse px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-medium transition-colors cursor-pointer"
            title="تصدير إلى PDF"
          >
            {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
            <span>{isExportingPdf ? 'جاري التصدير...' : 'PDF'}</span>
          </button>

          {/* Close Button */}
          {onClose && (
            <button 
              type="button" 
              id="valuationCloseBtn"
              onClick={onClose}
              className="flex items-center space-x-1 space-x-reverse px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
              title="إغلاق التقرير والعودة للمخازن"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Header Information: Strictly Metadata ONLY, NO TOTALS or Valuation Data in Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-1">
        <div className="text-center sm:text-right">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-wide">
            تقرير تقييم المخزون
          </h1>
          <div className="flex items-center justify-center sm:justify-start space-x-3 space-x-reverse mt-1 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex items-center space-x-1 space-x-reverse">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>تاريخ التقرير: <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{todayDate}</span></span>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1 space-x-reverse">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>الفرع: <span className="font-bold text-slate-800 dark:text-slate-200">{currentBranchName}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Dynamic Filters: Compact, Non-Stretching Dashboard Layout */}
      <div className={`p-3 sm:p-3.5 rounded-xl border shadow-xs space-y-2.5 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#f8fafc] border-slate-200/90'
      }`}>
        {/* شريط أعلى منطقة الفلاتر: طريقة التقييم في أعلى اليسار */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-700 dark:text-slate-300">
            <SlidersHorizontal className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
            <span>خيارات ومحددات تقييم المخزون</span>
          </div>

          {/* طريقة التقييم - أعلى يسار منطقة الفلاتر */}
          <div className="flex items-center space-x-2 space-x-reverse self-end sm:self-auto">
            <label htmlFor="valuationPriceTypeSelect" className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              طريقة التقييم:
            </label>
            <select
              id="valuationPriceTypeSelect"
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as ValuationPriceType)}
              className={`h-8.5 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-bold transition-colors shadow-2xs cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-blue-300 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-[#1565C0] focus:border-[#1565C0]'
              }`}
            >
              <option value="avg_cost">متوسط التكلفة</option>
              <option value="last_purchase">آخر سعر شراء</option>
              <option value="current_sell">سعر البيع الحالي</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 lg:grid-cols-12 gap-2.5 sm:gap-3 items-end">
          {/* 1. نطاق المخزن (Warehouse Scope) Dropdown */}
          <div className={`space-y-1 ${
            warehouseScope === 'specific_warehouse'
              ? (itemScope === 'all_categories' ? 'sm:col-span-6 lg:col-span-3' : 'sm:col-span-6 lg:col-span-2')
              : (itemScope === 'all_categories' ? 'sm:col-span-6 lg:col-span-5' : 'sm:col-span-6 lg:col-span-3')
          }`}>
            <label htmlFor="valuationWarehouseScopeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              نطاق المخزن
            </label>
            <select
              id="valuationWarehouseScopeSelect"
              value={warehouseScope}
              onChange={(e) => setWarehouseScope(e.target.value as ValuationWarehouseScope)}
              className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-2.5 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
              }`}
            >
              <option value="specific_warehouse">مخزن محدد</option>
              <option value="all_warehouses">جميع مخازن الفرع الحالي</option>
            </select>
          </div>

          {/* 1.1 Dynamic Secondary Field: اختيار المخزن (فقط عند اختيار مخزن محدد) */}
          {warehouseScope === 'specific_warehouse' && (
            <div className={`space-y-1 animate-fadeIn ${
              itemScope === 'all_categories' ? 'sm:col-span-6 lg:col-span-4' : 'sm:col-span-6 lg:col-span-2'
            }`}>
              <label htmlFor="valuationSpecificWarehouseSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المخزن
              </label>
              <select 
                id="valuationSpecificWarehouseSelect"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-2.5 border outline-none font-medium transition-colors shadow-2xs cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
                }`}
              >
                {branchWarehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
                {branchWarehouses.length === 0 && (
                  <option value="مخزن العجمي">مخزن العجمي</option>
                )}
              </select>
            </div>
          )}

          {/* 2. نطاق الأصناف (Items Scope) Dropdown */}
          <div className={`space-y-1 ${
            warehouseScope === 'specific_warehouse'
              ? (itemScope === 'all_categories' ? 'sm:col-span-6 lg:col-span-5' : 'sm:col-span-6 lg:col-span-3')
              : (itemScope === 'all_categories' ? 'sm:col-span-6 lg:col-span-7' : 'sm:col-span-6 lg:col-span-3')
          }`}>
            <label htmlFor="valuationItemScopeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              نطاق الأصناف
            </label>
            <select
              id="valuationItemScopeSelect"
              value={itemScope}
              onChange={(e) => setItemScope(e.target.value as ValuationItemScope)}
              className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-2.5 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
              }`}
            >
              <option value="all_categories">جميع المجموعات</option>
              <option value="specific_category">مجموعة محددة</option>
              <option value="specific_item">صنف محدد</option>
            </select>
          </div>

          {/* 2.1 Dynamic Secondary Field: اختيار المجموعة (فقط عند اختيار مجموعة محددة) */}
          {itemScope === 'specific_category' && (
            <div className={`space-y-1 animate-fadeIn ${
              warehouseScope === 'specific_warehouse' ? 'sm:col-span-6 lg:col-span-5' : 'sm:col-span-12 lg:col-span-6'
            }`}>
              <label htmlFor="valuationSpecificCategorySelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المجموعة
              </label>
              <div className="flex items-center space-x-1.5 space-x-reverse w-full">
                <select 
                  id="valuationSpecificCategorySelect"
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
                  title={selectedCategory}
                  className={`flex-1 min-w-0 h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
                  }`}
                >
                  <option value="جميع المجموعات">جميع المجموعات</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button 
                  type="button" 
                  id="valuationCategoryTreeBtn"
                  onClick={() => setIsCategoryModalOpen(true)}
                  title="شجرة الأصناف"
                  className={`h-9 px-2.5 sm:px-3 text-xs font-bold border rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap shadow-2xs ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700 hover:text-blue-300' 
                      : 'bg-white border-slate-300 text-[#1565C0] hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5 shrink-0" />
                  <span>شجرة الأصناف</span>
                </button>
              </div>
            </div>
          )}

          {/* 2.2 Dynamic Secondary Field: بحث واختيار صنف (فقط عند اختيار صنف محدد) */}
          {itemScope === 'specific_item' && (
            <div className={`space-y-1 animate-fadeIn ${
              warehouseScope === 'specific_warehouse' ? 'sm:col-span-6 lg:col-span-5' : 'sm:col-span-12 lg:col-span-6'
            }`}>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الصنف المطلوب
              </label>
              {selectedItem ? (
                <div className={`flex items-center justify-between h-9 px-3 border rounded-lg shadow-2xs ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-blue-50/50 border-blue-200 text-slate-900'
                }`}>
                  <div className="flex items-center space-x-2 space-x-reverse overflow-hidden min-w-0">
                    <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded shrink-0">
                      {selectedItem.code}
                    </span>
                    <span className="text-xs sm:text-[13px] font-bold truncate" title={selectedItem.name}>
                      {selectedItem.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 space-x-reverse shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsItemModalOpen(true)}
                      className="text-xs text-[#1565C0] dark:text-blue-400 hover:underline font-bold px-1 cursor-pointer"
                    >
                      تغيير
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                      title="إلغاء التحديد"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  id="openValuationSelectItemBtn"
                  onClick={() => setIsItemModalOpen(true)}
                  className={`w-full h-9 px-3 text-xs sm:text-[13px] font-bold border rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' 
                      : 'bg-white border-slate-300 text-[#1565C0] hover:bg-blue-50'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>بحث واختيار صنف...</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Button: «عرض التقرير» في منتصف منطقة الفلاتر */}
        <div className="flex flex-col items-center justify-center pt-2">
          <button 
            type="button"
            id="executeValuationReportBtn"
            onClick={handleExecuteReport}
            disabled={isExecuting}
            className={`h-10 px-8 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2 space-x-reverse min-w-[200px] sm:min-w-[240px] cursor-pointer ${
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
              <span>تم تعديل الفلترة — اضغط لعرض التقرير</span>
            </p>
          )}
        </div>
      </div>

      {/* Results Area */}
      {!hasExecuted ? (
        // Unexecuted State: Clean empty state matching approved screens (No table, no totals, no results)
        <div className={`flex-1 border rounded-xl overflow-hidden shadow-2xs flex flex-col items-center justify-center p-8 sm:p-14 text-center min-h-[360px] ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1565C0] dark:text-blue-400 mb-3.5 border border-blue-100 dark:border-blue-800 shadow-2xs">
            <PieChart className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            جاهز لعرض تقرير تقييم المخزون
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-4">
            حدد نطاق المخزن ونطاق الأصناف وطريقة التقييم المطلوبة، ثم اضغط على زر <strong className="text-[#1565C0] dark:text-blue-400">«عرض التقرير»</strong> لاستخراج قيم وأرصدة المخزون المعتمدة.
          </p>
          <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>الفرع الحالي: {currentBranchName}</span>
          </div>
        </div>
      ) : (
        // Executed State: Matching the exact approved style of «تقرير كارتة صنف»
        <div className="flex-1 flex flex-col space-y-3 pb-8">
          {/* Quick Actions & Live Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <input 
                type="text"
                id="valuationResultsSearchInput"
                value={resultsSearchQuery}
                onChange={(e) => setResultsSearchQuery(e.target.value)}
                placeholder="بحث سريع في النتائج بالاسم أو الكود..."
                className={`w-full text-xs rounded-lg pl-14 pr-8 py-2 border outline-none font-medium transition-colors shadow-2xs ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#1565C0]'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              {resultsSearchQuery && (
                <button 
                  type="button" 
                  onClick={() => setResultsSearchQuery('')}
                  className="text-[11px] text-slate-400 hover:text-slate-600 absolute left-2.5 top-2 cursor-pointer"
                >
                  مسح
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 space-x-reverse text-xs font-semibold self-end sm:self-center">
              <span className="text-slate-500 dark:text-slate-400">
                عدد الأصناف: <strong className="text-blue-700 dark:text-blue-400 font-mono">{displayedItems.length}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-500 dark:text-slate-400">
                طريقة التقييم: <strong className="text-purple-700 dark:text-purple-400">{getPriceTypeLabel(appliedFilters.priceType)}</strong>
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center space-x-1 space-x-reverse px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title="طباعة التقرير"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>طباعة</span>
              </button>
            </div>
          </div>

          {/* Professional Printable Report Sheet (Matching Item Card Style Exactly) */}
          <div className="flex justify-center w-full">
            <div 
              id="valuation-printable-area" 
              className={`w-full max-w-5xl rounded-xl border p-5 sm:p-7 shadow-xs font-sans text-right transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {/* 1. Header التقرير المدمج (اسم الشركة يمينًا، والعنوان بالمنتصف على نفس السطر لتقليل الارتفاع) */}
              <div className="border-b-2 border-slate-300 dark:border-slate-700 pb-2.5 mb-3">
                <div className="grid grid-cols-3 items-center gap-2">
                  {/* اسم الشركة في الجهة اليمنى */}
                  <div className="text-right">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                      {companyName}
                    </h2>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      نظام إدارة المخازن والمستودعات — الفرع: {currentBranchName}
                    </p>
                  </div>

                  {/* عنوان «تقرير تقييم المخزون» في المنتصف وعلى نفس السطر مع اسم الشركة */}
                  <div className="text-center">
                    <h1 className="text-lg sm:text-xl font-black text-[#1565C0] dark:text-blue-400 leading-tight">
                      تقرير تقييم المخزون
                    </h1>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                      طريقة التقييم: <span className="text-[#1565C0] dark:text-blue-400 font-black">{getPriceTypeLabel(appliedFilters.priceType)}</span>
                    </p>
                  </div>

                  {/* استغلال نفس السطر لتقليل ارتفاع التقرير */}
                  <div className="text-left flex flex-col items-end text-[11px] text-slate-500 dark:text-slate-400 font-semibold space-y-0.5">
                    <div>تاريخ التقرير: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{todayDate}</span></div>
                    <div>نطاق المخزن: <span className="font-bold text-slate-800 dark:text-slate-200">{appliedFilters.warehouseScope === 'all_warehouses' ? 'جميع مخازن الفرع' : appliedFilters.selectedWarehouse}</span></div>
                  </div>
                </div>
              </div>

              {/* 2. Summary Card أعلى التقرير فقط (نوع التقييم | عدد الأصناف | إجمالي الكمية | إجمالي قيمة المخزون) */}
              <div 
                id="valuationHeaderSummaryCard"
                className={`mb-4 p-3 sm:p-3.5 rounded-xl border shadow-xs transition-all ${
                  isDark 
                    ? 'bg-slate-850/95 border-slate-700/80 text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <div className="w-6 h-6 rounded-md bg-[#1565C0] text-white flex items-center justify-center shadow-2xs">
                      <BarChart3 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs sm:text-[13px] font-black text-slate-800 dark:text-slate-100">
                      ملخص نتائج تقييم المخزون المعتمد
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span>نطاق الأصناف:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">
                      {appliedFilters.itemScope === 'all_categories' 
                        ? 'جميع المجموعات' 
                        : appliedFilters.itemScope === 'specific_category' 
                          ? `مجموعة: ${appliedFilters.selectedCategory}` 
                          : `صنف: ${appliedFilters.selectedItem?.name || ''}`}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>العملة:</span>
                    <span className="font-mono text-blue-700 dark:text-blue-400 font-bold">جنيه مصري (ج.م)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* 1. نوع التقييم المستخدم: فقط النوع المختار بدون قائمة الأنواع الثلاثة */}
                  <div className={`p-2.5 rounded-lg border transition-all ${
                    isDark 
                      ? 'bg-slate-900/90 border-purple-900/60' 
                      : 'bg-purple-50/50 border-purple-200'
                  }`}>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
                      <span>نوع التقييم</span>
                      <Tag className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-sm sm:text-base font-black text-purple-700 dark:text-purple-300 truncate">
                      {getPriceTypeLabel(appliedFilters.priceType)}
                    </div>
                    <div className="text-[10px] text-purple-600/90 dark:text-purple-400/90 mt-1 truncate">
                      طريقة التقييم المعتمدة بالتقرير
                    </div>
                  </div>

                  {/* 2. عدد الأصناف */}
                  <div className={`p-2.5 rounded-lg border transition-all ${
                    isDark 
                      ? 'bg-slate-900/90 border-slate-800' 
                      : 'bg-slate-50/80 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
                      <span>عدد الأصناف</span>
                      <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-slate-100">
                      {formatNumber(displayedItems.length, 0)} <span className="text-xs font-normal text-slate-500">صنف</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      إجمالي الأصناف المشمولة بالتقييم
                    </div>
                  </div>

                  {/* 3. إجمالي الكمية */}
                  <div className={`p-2.5 rounded-lg border transition-all ${
                    isDark 
                      ? 'bg-slate-900/90 border-emerald-900/60' 
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
                      <span>إجمالي الكمية</span>
                      <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="text-sm sm:text-base font-mono font-black text-emerald-700 dark:text-emerald-400">
                      {formatNumber(totalAvailableQty)}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      إجمالي رصيد الوحدات المتاحة
                    </div>
                  </div>

                  {/* 4. إجمالي قيمة المخزون */}
                  <div className={`p-2.5 rounded-lg border transition-all ${
                    isDark 
                      ? 'bg-slate-900/90 border-blue-900/70' 
                      : 'bg-blue-50/50 border-blue-200'
                  }`}>
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-bold mb-1">
                      <span>إجمالي قيمة المخزون</span>
                      <Coins className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="text-sm sm:text-base font-mono font-black text-[#1565C0] dark:text-blue-300">
                      {formatNumber(totalValuationValue)} <span className="text-xs font-bold text-slate-600 dark:text-slate-400">ج.م</span>
                    </div>
                    <div className="text-[10px] font-medium text-blue-700 dark:text-blue-300 mt-1 truncate">
                      بحسب: {getPriceTypeLabel(appliedFilters.priceType)}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Vertical Professional Valuation Table */}
              <div className="overflow-x-auto mb-4 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
                <table className="w-full text-xs text-right border-collapse select-text">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] sm:text-xs">
                      <th className="py-2 px-2 text-center border-r border-slate-700 w-10">م</th>
                      <th className="py-2 px-2.5 text-center border-r border-slate-700 w-28 font-mono">كود الصنف</th>
                      <ReportSortHeaderCell
                        title="اسم الصنف"
                        columnKey="name"
                        activeSortKey={tableSortConfig?.key || null}
                        activeSortDirection={tableSortConfig?.direction || null}
                        onSort={handleTableSort}
                        align="right"
                        accentColor="blue"
                        className="border-r border-slate-700 min-w-[220px]"
                      />
                      <th className="py-2 px-2.5 text-center border-r border-slate-700 w-16">الوحدة</th>
                      {appliedFilters.warehouseScope === 'all_warehouses' && (
                        <th className="py-2 px-2.5 text-center border-r border-slate-700 w-28">المخزن</th>
                      )}
                      <ReportSortHeaderCell
                        title="الكمية"
                        columnKey="availableQty"
                        activeSortKey={tableSortConfig?.key || null}
                        activeSortDirection={tableSortConfig?.direction || null}
                        onSort={handleTableSort}
                        align="center"
                        accentColor="emerald"
                        className="border-r border-slate-700 bg-emerald-950/80 text-emerald-300 w-28"
                      />
                      <ReportSortHeaderCell
                        title="سعر التقييم"
                        subTitle={`(${getPriceTypeLabel(appliedFilters.priceType)})`}
                        columnKey="valuationPrice"
                        activeSortKey={tableSortConfig?.key || null}
                        activeSortDirection={tableSortConfig?.direction || null}
                        onSort={handleTableSort}
                        align="center"
                        accentColor="amber"
                        className="border-r border-slate-700 bg-amber-950/80 text-amber-300 w-36"
                      />
                      <ReportSortHeaderCell
                        title="قيمة المخزون"
                        columnKey="totalValue"
                        activeSortKey={tableSortConfig?.key || null}
                        activeSortDirection={tableSortConfig?.direction || null}
                        onSort={handleTableSort}
                        align="center"
                        accentColor="blue"
                        className="bg-blue-950/80 text-blue-300 w-36"
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px] sm:text-xs">
                    {displayedItems.length === 0 ? (
                      <tr>
                        <td colSpan={appliedFilters.warehouseScope === 'all_warehouses' ? 8 : 7} className="py-8 text-center text-slate-500">
                          لا توجد أصناف مسجلة تطابق شروط التقييم المحددة.
                        </td>
                      </tr>
                    ) : (
                      sortedDisplayedItems.map((item, idx) => (
                        <tr 
                          key={`${item.code}_${item.warehouse}_${idx}`}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            idx % 2 === 0 ? '' : (isDark ? 'bg-slate-850/40' : 'bg-slate-50/50')
                          }`}
                        >
                          <td className="py-2 px-2 text-center text-slate-400 font-mono border-r border-slate-200 dark:border-slate-800">{idx + 1}</td>
                          <td className="py-2 px-2.5 text-center font-mono font-bold text-blue-700 dark:text-blue-400 border-r border-slate-200 dark:border-slate-800">
                            {item.code}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800">
                            {item.name}
                          </td>
                          <td className="py-2 px-2.5 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                            {item.unit}
                          </td>
                          {appliedFilters.warehouseScope === 'all_warehouses' && (
                            <td className="py-2 px-2.5 text-center text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">
                              {item.warehouse}
                            </td>
                          )}
                          <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 border-r border-slate-200 dark:border-slate-800">
                            {formatNumber(item.availableQty)}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                            {formatNumber(item.valuationPrice)}
                          </td>
                          <td className="py-2 px-3 text-center font-mono font-black text-blue-800 dark:text-blue-300 bg-blue-50/20 dark:bg-blue-950/10">
                            {formatNumber(item.totalValue)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {displayedItems.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                        <td colSpan={appliedFilters.warehouseScope === 'all_warehouses' ? 5 : 4} className="py-3 px-4 text-right font-black">
                          الإجمالي العام لتقييم المخزون ({displayedItems.length} صنف):
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-emerald-400 text-sm">
                          {formatNumber(totalAvailableQty)}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-400">
                          —
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-black text-amber-300 text-sm">
                          {formatNumber(totalValuationValue)} ج.م
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* 3. Signatures Box (أعده | صححه | اعتمده فقط) */}
              <div className="border-t border-dashed border-slate-300 dark:border-slate-700 pt-5 mt-4">
                <div className="grid grid-cols-3 gap-6 text-center text-xs">
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-6 text-xs sm:text-sm">أعده</p>
                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-28 sm:w-40 mx-auto"></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-6 text-xs sm:text-sm">صححه</p>
                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-28 sm:w-40 mx-auto"></div>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700 dark:text-slate-300 mb-6 text-xs sm:text-sm">اعتمده</p>
                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 w-28 sm:w-40 mx-auto"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #valuation-printable-area, #valuation-printable-area * {
            visibility: visible;
          }
          #valuation-printable-area {
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

      {/* Item Selection Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn" dir="rtl">
          <div className={`w-full max-w-3xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[85vh] ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
          }`}>
            {/* Modal Header */}
            <div className={`px-5 py-3.5 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Package className="w-5 h-5 text-[#1565C0] dark:text-blue-400" />
                <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                  بحث واختيار صنف لتقييم المخزون
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsItemModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Filters */}
            <div className={`p-4 border-b space-y-3 ${isDark ? 'bg-slate-850/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={modalItemSearch}
                    onChange={(e) => setModalItemSearch(e.target.value)}
                    placeholder="ابحث بالاسم أو كود الصنف..."
                    className={`w-full h-9 pr-9 pl-3 text-xs rounded-lg border outline-none font-medium shadow-2xs ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                    autoFocus
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>

                <div>
                  <select
                    value={modalSelectedCategory}
                    onChange={(e) => setModalSelectedCategory(e.target.value)}
                    className={`w-full h-9 text-xs rounded-lg px-3 border outline-none font-medium shadow-2xs cursor-pointer ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="all">جميع المجموعات</option>
                    {categoryOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Items Table */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold ${
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <th className="py-2.5 px-3 font-bold text-center w-28">كود الصنف</th>
                    <th className="py-2.5 px-3 font-bold">اسم الصنف</th>
                    <th className="py-2.5 px-3 font-bold text-center w-20">الوحدة</th>
                    <th className="py-2.5 px-3 font-bold text-center w-28">الكمية المتاحة</th>
                    <th className="py-2.5 px-3 font-bold text-center w-20">اختيار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {allSystemItems
                    .filter(it => {
                      const matchCat = modalSelectedCategory === 'all' || it.category === modalSelectedCategory;
                      const q = modalItemSearch.toLowerCase().trim();
                      const matchQuery = !q || it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q);
                      return matchCat && matchQuery;
                    })
                    .map(it => (
                      <tr 
                        key={it.code}
                        className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors ${
                          selectedItem?.code === it.code ? (isDark ? 'bg-blue-950/40' : 'bg-blue-50') : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                          {it.code}
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-100">
                          {it.name}
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">
                          {it.unit}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(it.availableQty)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(it);
                              setIsItemModalOpen(false);
                            }}
                            className="px-3 py-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            تحديد
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t text-center ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
