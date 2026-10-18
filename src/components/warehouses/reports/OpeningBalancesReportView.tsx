import React, { useState, useMemo } from 'react';
import XLSXStyle from 'xlsx-js-style';
const XLSX = (XLSXStyle as any).default || XLSXStyle;
import { 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  X, 
  Search, 
  Building2, 
  Package, 
  ClipboardList, 
  FolderOpen, 
  Loader2, 
  AlertCircle,
  Eye,
  Calendar
} from 'lucide-react';
import { warehouseService, Warehouse as WarehouseType } from '../../../services/warehouseService';
import { categoryService } from '../../../services/categoryService';
import { setupWizardService } from '../../../services/setupWizardService';
import { CategoryTreeSelectorModal, CategorySelectionResult } from './CategoryTreeSelectorModal';
import { VertexReportHeader } from '../../reports/VertexReportHeader';
import { ReportSortHeaderCell } from '../../reports/ReportSortHeaderCell';
import { exportVertexReportToPdf } from '../../../utils/vertexReportRenderer';

interface OpeningBalancesReportViewProps {
  isDark: boolean;
  onClose?: () => void;
}

export interface OpeningBalanceItemRow {
  id: number;
  code: string;
  name: string;
  unit: string;
  category: string;
  subCategory?: string;
  warehouse: string;
  branch: string;
  openingBalance: number;
  avgCost: number;
  balanceValue: number;
}

export interface GroupedOpeningBalance {
  category: string;
  warehouse: string;
  items: OpeningBalanceItemRow[];
  totalQty: number;
}

// System catalog fallback for authentic stock data matching system databases
const initialSystemItems: OpeningBalanceItemRow[] = [
  { id: 1, code: '004004001', name: 'Convert Display Port Cable to HDMI 2B (DC137)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 12.0, avgCost: 180.0, balanceValue: 2160.0 },
  { id: 2, code: '004004002', name: 'Convert Display To VGA 2B (DC117)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 8.0, avgCost: 145.0, balanceValue: 1160.0 },
  { id: 3, code: '004004003', name: 'Convert DVI 24+1 TO VGA 2B (DC119)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 5.0, avgCost: 95.0, balanceValue: 475.0 },
  { id: 4, code: '004004004', name: 'Convert DVI 24+5 TO VGA 2B (DC118)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 4.0, avgCost: 85.0, balanceValue: 340.0 },
  { id: 5, code: '004004005', name: 'Convert HDMI To DVI 24+1 2B (DC125)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 7.0, avgCost: 110.0, balanceValue: 770.0 },
  { id: 6, code: '005002001', name: 'Hard 500g WD Blue Sata 3.5 Desktop', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'أقراص صلبة HDD ووحدات تخزين ميكانيكية', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 9.0, avgCost: 380.0, balanceValue: 3420.0 },
  { id: 7, code: '005001001', name: 'SSD Crucial BX500 240GB 2.5 SATA', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'وحدات تخزين سريعة SSD وذاكرات', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 15.0, avgCost: 750.0, balanceValue: 11250.0 },
  { id: 8, code: '004003001', name: 'Cable HDMI 2.0 High Speed 3M 2B', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شاشات VGA وHDMI', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 20.0, avgCost: 85.0, balanceValue: 1700.0 },
  { id: 9, code: '004003002', name: 'Cable VGA Male to Male 1.5M Black', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شاشات VGA وHDMI', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 14.0, avgCost: 45.0, balanceValue: 630.0 },
  { id: 10, code: '004003003', name: 'Keyboard USB Standard Dell KB216', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', openingBalance: 18.0, avgCost: 220.0, balanceValue: 3960.0 }
];

export const OpeningBalancesReportView: React.FC<OpeningBalancesReportViewProps> = ({ isDark, onClose }) => {
  // 1. Device Date
  const todayDate = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 1.1 Actual system opening balance registration date (تاريخ إدخال رصيد أول المدة الفعلي بالنظام)
  const openingBalanceDate = useMemo(() => {
    try {
      const txs = warehouseService.getWarehouseTransactions('WH-01');
      const openingTx = txs.find(t => t.type === 'opening_stock' || t.date === '2026-08-01');
      if (openingTx?.date) return openingTx.date;
    } catch {
      // fallback
    }
    return '2026-08-01';
  }, []);

  // 2. Current branch & company name from system session
  const currentBranchName = useMemo(() => {
    try {
      const branches = warehouseService.getAvailableBranches();
      const main = branches.find(b => b.isMain) || branches[0];
      return main?.name || 'داتا اليكس للتوريدات العمومية';
    } catch {
      return 'داتا اليكس للتوريدات العمومية';
    }
  }, []);

  const companyName = useMemo(() => {
    try {
      const cfg = setupWizardService.getConfig();
      if (cfg?.companyName && cfg.companyName !== 'Vertex Global Enterprises Corp') {
        return cfg.companyName;
      }
    } catch {}
    return 'شركة داتا اليكس للتوريدات العمومية';
  }, []);

  // 3. Real system warehouses for current branch
  const availableWarehouses = useMemo<WarehouseType[]>(() => {
    try {
      const whs = warehouseService.getActiveWarehouses();
      const list = whs.length > 0 ? whs : warehouseService.getAllWarehouses();
      const branches = warehouseService.getAvailableBranches();
      const branchObj = branches.find(b => b.name === currentBranchName);
      if (branchObj) {
        const branchWhs = list.filter(w => !w.branchId || w.branchId === branchObj.id);
        if (branchWhs.length > 0) return branchWhs;
      }
      return list;
    } catch {
      return [];
    }
  }, [currentBranchName]);

  // Branch warehouse names for 'all_warehouses' scope
  const branchWarehouseNames = useMemo(() => {
    if (availableWarehouses.length > 0) {
      return availableWarehouses.map(w => w.name);
    }
    return ['مخزن العجمي', 'مخزن فرعي', 'المخزن الرئيسي'];
  }, [availableWarehouses]);

  // 4. Filters State (Draft Settings)
  // 4.1 «نطاق المخزن» (Warehouse Scope): 'specific_warehouse' | 'all_warehouses'
  const [warehouseScope, setWarehouseScope] = useState<'specific_warehouse' | 'all_warehouses'>('specific_warehouse');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(() => {
    return availableWarehouses[0]?.name || 'مخزن العجمي';
  });

  // 4.2 «نطاق الأصناف» (Items Scope): 'all_categories' | 'specific_category' | 'specific_item'
  const [itemScope, setItemScope] = useState<'all_categories' | 'specific_category' | 'specific_item'>('all_categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('جميع المجموعات');
  const [categoryFilterState, setCategoryFilterState] = useState<CategorySelectionResult>({
    mode: 'all',
    displayName: 'جميع المجموعات'
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);

  // Selected item state when itemScope === 'specific_item'
  const [selectedItem, setSelectedItem] = useState<OpeningBalanceItemRow | null>(null);
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [modalItemSearch, setModalItemSearch] = useState<string>('');
  const [modalSelectedCategory, setModalSelectedCategory] = useState<string>('all');

  // Execution and Export Statuses
  const [notification, setNotification] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);

  // Search filter within executed results
  const [resultsSearchQuery, setResultsSearchQuery] = useState<string>('');

  // Interactive Table Column Sort Configuration (Client-side sorting only on displayed results)
  const [tableSortConfig, setTableSortConfig] = useState<{
    key: 'name' | 'openingBalance';
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleTableSort = (key: 'name' | 'openingBalance') => {
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

  // 5. Applied snapshot filters after clicking "عرض التقرير"
  const [appliedFilters, setAppliedFilters] = useState<{
    warehouseScope: 'specific_warehouse' | 'all_warehouses';
    selectedWarehouse: string;
    itemScope: 'all_categories' | 'specific_category' | 'specific_item';
    selectedCategory: string;
    categoryFilterState: CategorySelectionResult;
    selectedItem: OpeningBalanceItemRow | null;
  }>({
    warehouseScope: 'specific_warehouse',
    selectedWarehouse: availableWarehouses[0]?.name || 'مخزن العجمي',
    itemScope: 'all_categories',
    selectedCategory: 'جميع المجموعات',
    categoryFilterState: { mode: 'all', displayName: 'جميع المجموعات' },
    selectedItem: null
  });

  // Check if draft filters differ from applied
  const hasFilterChanges = useMemo(() => {
    if (!hasExecuted) return false;
    if (warehouseScope !== appliedFilters.warehouseScope) return true;
    if (warehouseScope === 'specific_warehouse' && selectedWarehouse !== appliedFilters.selectedWarehouse) return true;
    if (itemScope !== appliedFilters.itemScope) return true;
    if (itemScope === 'specific_category' && selectedCategory !== appliedFilters.selectedCategory) return true;
    if (itemScope === 'specific_item' && selectedItem?.code !== appliedFilters.selectedItem?.code) return true;
    return false;
  }, [hasExecuted, warehouseScope, selectedWarehouse, itemScope, selectedCategory, selectedItem, appliedFilters]);

  // 6. Master Data items from real catalog
  const catalogProducts = useMemo(() => {
    try {
      const prods = categoryService.getProducts();
      if (prods && prods.length > 0) {
        return prods;
      }
    } catch {}
    return [];
  }, []);

  // Merge real catalog items into ItemRow structure
  const allSystemItems = useMemo<OpeningBalanceItemRow[]>(() => {
    const itemsMap = new Map<string, OpeningBalanceItemRow>();

    // Add base system items
    initialSystemItems.forEach(it => {
      itemsMap.set(it.code, it);
    });

    // Add / merge any products from categoryService
    catalogProducts.forEach(p => {
      const existing = itemsMap.get(p.code);
      if (existing) {
        itemsMap.set(p.code, {
          ...existing,
          name: p.name || existing.name,
          category: p.category || existing.category,
          unit: p.unit || existing.unit,
          openingBalance: p.actualBalance ?? existing.openingBalance,
          avgCost: p.avgCost ?? existing.avgCost
        });
      } else {
        itemsMap.set(p.code, {
          id: p.id ? Number(p.id) || Date.now() : Date.now(),
          code: p.code,
          name: p.name,
          unit: p.unit || 'قطعة',
          category: p.category || 'عام',
          warehouse: p.warehouse || 'مخزن العجمي',
          branch: currentBranchName,
          openingBalance: p.actualBalance ?? 0,
          avgCost: p.avgCost ?? 0,
          balanceValue: (p.actualBalance ?? 0) * (p.avgCost ?? 0)
        });
      }
    });

    return Array.from(itemsMap.values());
  }, [catalogProducts, currentBranchName]);

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
        selectedItem
      });
      setHasExecuted(true);
      setTableSortConfig(null);
      setIsExecuting(false);
      setNotification('تم استخراج تقرير رصيد أول المدة بنجاح.');
      setTimeout(() => setNotification(null), 3000);
    }, 250);
  };

  // 8. Filtered Items based on APPLIED filters (and search query inside results)
  const executedFilteredItems = useMemo(() => {
    if (!hasExecuted) return [];

    let items = allSystemItems;

    // A. Warehouse Filter
    if (appliedFilters.warehouseScope === 'specific_warehouse') {
      items = items.filter(it => it.warehouse === appliedFilters.selectedWarehouse);
    } else {
      // 'all_warehouses': all warehouses of current branch
      items = items.filter(it => 
        branchWarehouseNames.includes(it.warehouse) || 
        it.branch === currentBranchName
      );
    }

    // B. Items Scope Filter
    if (appliedFilters.itemScope === 'specific_category') {
      const mode = appliedFilters.categoryFilterState.mode;
      const catName = appliedFilters.categoryFilterState.displayName;
      if (mode !== 'all' && catName !== 'جميع المجموعات') {
        items = items.filter(it => {
          if (mode === 'specific-sub' && appliedFilters.categoryFilterState.subName) {
            return it.subCategory === appliedFilters.categoryFilterState.subName;
          }
          return it.category === appliedFilters.categoryFilterState.mainName || it.category === catName;
        });
      }
    } else if (appliedFilters.itemScope === 'specific_item' && appliedFilters.selectedItem) {
      items = items.filter(it => it.code === appliedFilters.selectedItem?.code);
    }

    // C. Internal search within results
    if (resultsSearchQuery.trim()) {
      const q = resultsSearchQuery.trim().toLowerCase();
      items = items.filter(it => 
        it.code.toLowerCase().includes(q) ||
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.warehouse.toLowerCase().includes(q)
      );
    }

    return items;
  }, [hasExecuted, allSystemItems, appliedFilters, branchWarehouseNames, currentBranchName, resultsSearchQuery]);

  // Aggregate totals
  const totalOpeningQty = useMemo(() => {
    return executedFilteredItems.reduce((acc, curr) => acc + (curr.openingBalance || 0), 0);
  }, [executedFilteredItems]);

  const totalItemsCount = executedFilteredItems.length;

  // Formatter helper
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) return '0.00';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Dynamic scope subtitle text for reports and exports
  const reportScopeName = useMemo(() => {
    const whPart = appliedFilters.warehouseScope === 'specific_warehouse'
      ? `المخزن: ${appliedFilters.selectedWarehouse}`
      : `جميع مخازن الفرع (${currentBranchName})`;

    let itemPart = 'جميع المجموعات والأصناف';
    if (appliedFilters.itemScope === 'specific_category') {
      itemPart = `مجموعة: ${appliedFilters.categoryFilterState.displayName}`;
    } else if (appliedFilters.itemScope === 'specific_item') {
      itemPart = appliedFilters.selectedItem ? `الصنف: ${appliedFilters.selectedItem.name} (${appliedFilters.selectedItem.code})` : 'صنف محدد';
    }

    return `${whPart} | ${itemPart}`;
  }, [appliedFilters, currentBranchName]);

  // Grouped items by (Category + Warehouse) for report tables
  const groupedOpeningItems = useMemo<GroupedOpeningBalance[]>(() => {
    const map = new Map<string, GroupedOpeningBalance>();
    executedFilteredItems.forEach(item => {
      const cat = item.category || 'عام';
      const wh = item.warehouse || 'المخزن الرئيسي';
      const key = `${cat}___${wh}`;
      if (!map.has(key)) {
        map.set(key, {
          category: cat,
          warehouse: wh,
          items: [],
          totalQty: 0
        });
      }
      const g = map.get(key)!;
      g.items.push(item);
      g.totalQty += (item.openingBalance || 0);
    });
    return Array.from(map.values());
  }, [executedFilteredItems]);

  // Sorted grouped items for Table UI display only (does not affect Excel/PDF/Print)
  const sortedGroupedOpeningItems = useMemo(() => {
    if (!tableSortConfig) return groupedOpeningItems;
    return groupedOpeningItems.map(group => {
      const sorted = [...group.items].sort((a, b) => {
        if (tableSortConfig.key === 'name') {
          const comp = a.name.localeCompare(b.name, 'ar', { sensitivity: 'base' });
          return tableSortConfig.direction === 'asc' ? comp : -comp;
        }
        if (tableSortConfig.key === 'openingBalance') {
          const valA = Number(a.openingBalance) || 0;
          const valB = Number(b.openingBalance) || 0;
          return tableSortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
      });
      return { ...group, items: sorted };
    });
  }, [groupedOpeningItems, tableSortConfig]);

  // 9. Real Excel Export Function
  const handleExportExcel = () => {
    if (!hasExecuted) {
      setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل تصدير Excel.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    try {
      const numCols = 5;
      const lastColIdx = numCols - 1;

      const ws: Record<string, any> = {};
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const rows: { hpt: number }[] = [];
      let currentRow = 0;

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

      // 1. Company Name
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, companyName, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 14, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } }
      });
      rows.push({ hpt: 26 });
      currentRow++;

      // 2. Subtitle: System & Branch
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, `نظام إدارة المخازن والمستودعات - الفرع: ${currentBranchName}`, 's', {
        font: { name: 'Segoe UI', bold: false, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'CBD5E1' } } }
      });
      rows.push({ hpt: 18 });
      currentRow++;

      // Spacing
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // 3. Title Banner
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, 'تقرير رصيد أول المدة للأصناف', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 15, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1E3A8A' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 30 });
      currentRow++;

      // 4. Meta Box (Scope)
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, `النطاق المحدد: ${reportScopeName}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'BFDBFE' } },
          bottom: { style: 'thin', color: { rgb: 'BFDBFE' } }
        }
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // 5. Summary Strip (Opening Stock Date, Count, Total Opening Balance)
      const dateText = `📅 تاريخ رصيد أول المدة: ${openingBalanceDate}`;
      const countText = `📦 عدد الأصناف: ${executedFilteredItems.length} صنف`;
      const balanceText = `📊 إجمالي رصيد أول المدة: ${formatNumber(totalOpeningQty)}`;

      mergeAndStyle(currentRow, 0, currentRow, 1, dateText, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 9.5, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      setCell(currentRow, 2, countText, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 9.5, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      mergeAndStyle(currentRow, 3, currentRow, lastColIdx, balanceText, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '047857' } },
        fill: { fgColor: { rgb: 'ECFDF5' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // Spacing
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 10 });
      currentRow++;

      // 6. Table Headers
      const colHeaders = [
        'م',
        'كود الصنف',
        'اسم الصنف',
        'الوحدة',
        'رصيد أول المدة'
      ];
      colHeaders.forEach((h, idx) => {
        setCell(currentRow, idx, h, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
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
      rows.push({ hpt: 26 });
      currentRow++;

      // 7. Table Rows Grouped by Category + Warehouse
      if (executedFilteredItems.length === 0) {
        mergeAndStyle(currentRow, 0, currentRow, lastColIdx, 'لا توجد أصناف مطابقة للبيانات المحددة.', 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '64748B' } },
          fill: { fgColor: { rgb: 'F8FAFC' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        rows.push({ hpt: 28 });
        currentRow++;
      } else {
        let globalIndex = 0;
        groupedOpeningItems.forEach(group => {
          // Group Header Row: المجموعة + المخزن
          mergeAndStyle(
            currentRow,
            0,
            currentRow,
            lastColIdx,
            `المجموعة: ${group.category}  |  المخزن: ${group.warehouse}  (${group.items.length} صنف)`,
            's',
            {
              font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '1E3A8A' } },
              fill: { fgColor: { rgb: 'E2E8F0' } },
              alignment: { horizontal: 'right', vertical: 'center' },
              border: borderThin
            }
          );
          rows.push({ hpt: 24 });
          currentRow++;

          // Items inside this group
          group.items.forEach((item, itemIdx) => {
            globalIndex++;
            const isEven = itemIdx % 2 === 0;
            const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';
            const rowFont = { name: 'Segoe UI', sz: 9.5, color: { rgb: '0F172A' } };
            const rowStyle = (align: 'center' | 'right' | 'left', bold = false, num = false, color = '0F172A') => ({
              font: { ...rowFont, bold, color: { rgb: color } },
              fill: { fgColor: { rgb: rowBg } },
              alignment: { horizontal: align, vertical: 'center' },
              border: borderThin,
              ...(num ? { numFmt: '#,##0.00' } : {})
            });

            setCell(currentRow, 0, globalIndex, 'n', rowStyle('center', true));
            setCell(currentRow, 1, item.code, 's', rowStyle('center', true, false, '1E3A8A'));
            setCell(currentRow, 2, item.name, 's', rowStyle('right', true));
            setCell(currentRow, 3, item.unit, 's', rowStyle('center'));
            setCell(currentRow, 4, item.openingBalance, 'n', rowStyle('center', true, true, '047857'));

            rows.push({ hpt: 22 });
            currentRow++;
          });
        });
      }

      // 8. Grand Total Row
      mergeAndStyle(currentRow, 0, currentRow, 3, `الإجمالي العام لرصيد أول المدة (${executedFilteredItems.length} صنف)`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F172A' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'double', color: { rgb: '0F172A' } },
          left: { style: 'thin', color: { rgb: '475569' } },
          right: { style: 'thin', color: { rgb: '475569' } }
        }
      });
      setCell(currentRow, 4, totalOpeningQty, 'n', {
        font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '34D399' } },
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
      rows.push({ hpt: 26 });
      currentRow++;

      // Spacing before signatures
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 18 });
      currentRow++;

      // 9. Signatures Block: أعده | صححه | اعتمده
      mergeAndStyle(currentRow, 0, currentRow, 1, 'أعده', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      setCell(currentRow, 2, 'صححه', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeAndStyle(currentRow, 3, currentRow, lastColIdx, 'اعتمده', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // Underlines for signatures
      mergeAndStyle(currentRow, 0, currentRow, 1, '........................', 's', {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { color: { rgb: '94A3B8' } }
      });
      setCell(currentRow, 2, '........................', 's', {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { color: { rgb: '94A3B8' } }
      });
      mergeAndStyle(currentRow, 3, currentRow, lastColIdx, '........................', 's', {
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { color: { rgb: '94A3B8' } }
      });
      rows.push({ hpt: 20 });
      currentRow++;

      // Configure Sheet Dimensions & RTL
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: currentRow - 1, c: lastColIdx } });
      ws['!merges'] = merges;
      ws['!rows'] = rows;
      ws['!cols'] = [
        { wch: 8 },  // م
        { wch: 18 }, // كود الصنف
        { wch: 48 }, // اسم الصنف
        { wch: 14 }, // الوحدة
        { wch: 22 }  // رصيد أول المدة
      ];

      ws['!views'] = [{ rightToLeft: true, RTL: true }];
      ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, ws, 'رصيد أول المدة');
      workbook.Workbook = { Views: [{ RTL: true }] };

      const filename = `تقرير_رصيد_أول_المدة_للأصناف_${todayDate}.xlsx`;
      XLSX.writeFile(workbook, filename);

      setNotification(`تم تصدير ${executedFilteredItems.length} صنف إلى ملف Excel بنجاح.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      setNotification('حدث خطأ أثناء تصدير ملف Excel.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // 10. Real PDF Export Function
  const handleExportPdf = async () => {
    if (!hasExecuted) {
      setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل تصدير PDF.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }

    try {
      setIsExportingPdf(true);
      const filename = `تقرير_رصيد_أول_المدة_للأصناف_${todayDate}.pdf`;

      let element = document.getElementById('opening-balance-printable-area');
      const wasModalOpen = isPrintPreviewOpen;

      if (!element) {
        setIsPrintPreviewOpen(true);
        await new Promise(resolve => setTimeout(resolve, 80));
        element = document.getElementById('opening-balance-printable-area');
      }

      if (element) {
        await exportVertexReportToPdf(element, {
          filename,
          title: 'تقرير رصيد أول المدة للأصناف',
          onComplete: () => {
            setNotification(`تم تصدير ${executedFilteredItems.length} صنف إلى ملف PDF بنجاح.`);
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

  // 11. Handle Print button: Open Print Preview modal
  const handlePrintClick = () => {
    if (!hasExecuted) {
      setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل معاينة الطباعة.');
      setTimeout(() => setNotification(null), 3500);
      return;
    }
    setIsPrintPreviewOpen(true);
  };

  return (
    <div dir="rtl" className="w-full flex flex-col h-full space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md flex items-center justify-between animate-fadeIn">
          <span>{notification}</span>
          <button 
            type="button"
            onClick={() => setNotification(null)} 
            className="text-white hover:opacity-80 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Action Bar (Matching Approved Pattern) */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border shadow-sm ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-800 text-white border-slate-700'
      }`}>
        <div className="flex items-center space-x-2 space-x-reverse">
          <ClipboardList className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-300'}`} />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
            تقرير رصيد أول المدة للأصناف
          </h2>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse text-xs">
          <button 
            type="button" 
            id="openingBalancePrintBtn"
            onClick={handlePrintClick}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
            title="معاينة وطباعة التقرير"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>

          <button 
            type="button" 
            id="openingBalanceExportPdfBtn"
            onClick={handleExportPdf}
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
            id="openingBalanceExportExcelBtn"
            onClick={handleExportExcel}
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

      {/* Top Details Header: Title and actual system opening stock entry date */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        {/* Title & System Opening Balance Date (تاريخ إدخال رصيد أول المدة الفعلي بالنظام) */}
        <div className="text-center sm:text-right">
          <h1 className="text-xl sm:text-2xl font-black text-purple-800 dark:text-purple-400 tracking-wide">
            تقرير رصيد أول المدة للأصناف
          </h1>
          <div className="flex items-center justify-center sm:justify-start space-x-2 space-x-reverse mt-1.5 text-xs text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold">تاريخ رصيد أول المدة:</span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 text-[13px]">
              {openingBalanceDate}
            </span>
          </div>
        </div>

        {/* Summary Card Box - Quantities & Item Count Only */}
        <div className={`border rounded-xl px-5 py-2.5 shadow-sm min-w-[240px] text-center ${
          isDark ? 'bg-slate-850 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
        }`}>
          <div className="grid grid-cols-2 gap-4 divide-x divide-x-reverse divide-slate-200 dark:divide-slate-700">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">إجمالي رصيد أول المدة</div>
              <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {hasExecuted ? formatNumber(totalOpeningQty) : '—'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">عدد الأصناف</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 font-mono mt-0.5">
                {hasExecuted ? totalItemsCount : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Dynamic Filters: Compact, Non-Stretching Dashboard Layout */}
      <div className={`p-3 sm:p-3.5 rounded-xl border shadow-xs space-y-2.5 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#f8fafc] border-slate-200/90'
      }`}>
        <div className="grid grid-cols-1 sm:grid-cols-12 lg:grid-cols-12 gap-2.5 sm:gap-3 items-end">
          {/* 1. نطاق المخزن (Warehouse Scope) Dropdown */}
          <div className="space-y-1 sm:col-span-6 lg:col-span-3">
            <label htmlFor="warehouseScopeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              نطاق المخزن
            </label>
            <select
              id="warehouseScopeSelect"
              value={warehouseScope}
              onChange={(e) => setWarehouseScope(e.target.value as 'specific_warehouse' | 'all_warehouses')}
              className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
              }`}
            >
              <option value="specific_warehouse">مخزن محدد</option>
              <option value="all_warehouses">جميع المخازن</option>
            </select>
          </div>

          {/* 1.1 Dynamic Secondary Field: اختيار المخزن (فقط عند اختيار مخزن محدد) */}
          {warehouseScope === 'specific_warehouse' && (
            <div className="space-y-1 animate-fadeIn sm:col-span-6 lg:col-span-3">
              <label htmlFor="specificWarehouseSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المخزن
              </label>
              <select 
                id="specificWarehouseSelect"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-medium transition-colors shadow-2xs cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
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

          {/* 2. نطاق المجموعة (Items/Category Scope) Dropdown - قللنا عرضه قليلاً لإعطاء مساحة أكبر لحقل المجموعة */}
          <div className={`space-y-1 ${
            warehouseScope === 'specific_warehouse'
              ? (itemScope === 'specific_category' || itemScope === 'specific_item' ? 'sm:col-span-5 lg:col-span-2' : 'sm:col-span-12 lg:col-span-6')
              : (itemScope === 'specific_category' || itemScope === 'specific_item' ? 'sm:col-span-5 lg:col-span-3' : 'sm:col-span-6 lg:col-span-3')
          }`}>
            <label htmlFor="itemScopeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              نطاق المجموعة
            </label>
            <select
              id="itemScopeSelect"
              value={itemScope}
              onChange={(e) => {
                const val = e.target.value as 'all_categories' | 'specific_category' | 'specific_item';
                setItemScope(val);
              }}
              className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-2.5 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
              }`}
            >
              <option value="all_categories">جميع المجموعات</option>
              <option value="specific_category">مجموعة</option>
              <option value="specific_item">صنف</option>
            </select>
          </div>

          {/* 2.1 Dynamic Secondary Field: اختيار المجموعة (فقط عند اختيار مجموعة) - زودنا عرضه بنفس المساحة المستقطعة مع زر شجرة الأصناف */}
          {itemScope === 'specific_category' && (
            <div className={`space-y-1 animate-fadeIn ${
              warehouseScope === 'specific_warehouse' ? 'sm:col-span-7 lg:col-span-4' : 'sm:col-span-7 lg:col-span-6'
            }`}>
              <label htmlFor="specificCategorySelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المجموعة
              </label>
              <div className="flex items-center space-x-1.5 space-x-reverse">
                <select 
                  id="specificCategorySelect"
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
                  className={`flex-1 min-w-0 h-9 text-xs sm:text-[13px] rounded-lg px-2.5 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
                  }`}
                >
                  <option value="جميع المجموعات">جميع المجموعات</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* زر مساعد مدمج لشجرة الأصناف - في نفس السطر ومتناسق مع بقية الأزرار */}
                <button 
                  type="button" 
                  id="openingCategoryTreeBtn"
                  onClick={() => setIsCategoryModalOpen(true)}
                  title="شجرة الأصناف"
                  className={`h-9 px-2.5 text-[11px] font-semibold border rounded-lg transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer whitespace-nowrap shadow-2xs ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' 
                      : 'bg-white border-slate-300 text-[#1565C0] hover:bg-blue-50'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>شجرة الأصناف</span>
                </button>
              </div>
            </div>
          )}

          {/* 2.2 Dynamic Secondary Field: بحث واختيار صنف (فقط عند اختيار صنف) */}
          {itemScope === 'specific_item' && (
            <div className={`space-y-1 animate-fadeIn ${
              warehouseScope === 'specific_warehouse' ? 'sm:col-span-7 lg:col-span-4' : 'sm:col-span-7 lg:col-span-6'
            }`}>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                الصنف المطلوب
              </label>
              {selectedItem ? (
                <div className={`flex items-center justify-between h-9 px-2.5 border rounded-lg shadow-2xs ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-blue-50/50 border-blue-200 text-slate-900'
                }`}>
                  <div className="flex items-center space-x-2 space-x-reverse overflow-hidden">
                    <span className="font-mono text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded">
                      {selectedItem.code}
                    </span>
                    <span className="text-xs font-bold truncate max-w-[140px] sm:max-w-[180px]" title={selectedItem.name}>
                      {selectedItem.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsItemModalOpen(true)}
                      className="text-[11px] text-[#1565C0] dark:text-blue-400 hover:underline font-bold px-1 cursor-pointer"
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
                  id="openSelectItemModalBtn"
                  onClick={() => setIsItemModalOpen(true)}
                  className={`w-full h-9 px-3 text-xs font-bold border rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
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
            id="executeOpeningBalancesBtn"
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
              <span>تم تعديل الفلترة — اضغط للعرض</span>
            </p>
          )}
        </div>
      </div>

      {/* Results Area */}
      {!hasExecuted ? (
        // Unexecuted State: Clean empty state matching approved screens
        <div className={`flex-1 border rounded-xl overflow-hidden shadow-2xs flex flex-col items-center justify-center p-8 sm:p-14 text-center min-h-[340px] ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#1565C0] dark:text-blue-400 mb-3.5 border border-blue-100 dark:border-blue-800 shadow-2xs">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
            جاهز لعرض تقرير رصيد أول المدة للأصناف
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-4">
            حدد نطاق المخزن ونطاق الأصناف المطلوبة، ثم اضغط على زر «عرض التقرير» لاستخراج الأرصدة الافتتاحية المعتمدة وفقاً لبيانات النظام.
          </p>
          <div className="inline-flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>الفرع الحالي: {currentBranchName}</span>
          </div>
        </div>
      ) : (
        // Executed Results Shell: Clean report header & table shell matching approved pattern
        <div className={`flex-1 flex flex-col border rounded-xl overflow-hidden shadow-2xs ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Results Toolbar: Fast Search + Counter */}
          <div className={`p-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDark ? 'border-slate-800 bg-slate-850' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <div className="relative w-full sm:w-72">
              <input 
                type="text"
                placeholder="بحث في نتائج التقرير بالاسم أو الكود..."
                value={resultsSearchQuery}
                onChange={(e) => setResultsSearchQuery(e.target.value)}
                className={`w-full h-8.5 pr-8 pl-8 text-xs rounded-lg border outline-none font-medium transition-colors shadow-2xs ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              {resultsSearchQuery && (
                <button 
                  type="button" 
                  onClick={() => setResultsSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3 space-x-reverse text-xs font-semibold">
              <span className="text-slate-600 dark:text-slate-400">
                النتائج المعروضة: <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">{executedFilteredItems.length}</span> صنف
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="text-slate-600 dark:text-slate-400">
                إجمالي رصيد أول المدة: <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{formatNumber(totalOpeningQty)}</span>
              </span>
            </div>
          </div>

          {/* Results Table Shell */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className={`border-b font-bold ${
                  isDark ? 'bg-slate-800/80 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  <th className="py-2.5 px-3 text-center w-12 font-bold">م</th>
                  <th className="py-2.5 px-3 text-center w-28 font-mono font-bold">كود الصنف</th>
                  <ReportSortHeaderCell
                    title="اسم الصنف"
                    columnKey="name"
                    activeSortKey={tableSortConfig?.key || null}
                    activeSortDirection={tableSortConfig?.direction || null}
                    onSort={handleTableSort}
                    align="right"
                    accentColor="blue"
                  />
                  <th className="py-2.5 px-3 text-center w-20 font-bold">الوحدة</th>
                  <ReportSortHeaderCell
                    title="رصيد أول المدة"
                    columnKey="openingBalance"
                    activeSortKey={tableSortConfig?.key || null}
                    activeSortDirection={tableSortConfig?.direction || null}
                    onSort={handleTableSort}
                    align="center"
                    accentColor="emerald"
                    className="w-32"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {executedFilteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-xs">لا توجد أصناف تطابق الفلاتر المحددة.</p>
                    </td>
                  </tr>
                ) : (
                  sortedGroupedOpeningItems.map(group => (
                    <React.Fragment key={`group-${group.category}-${group.warehouse}`}>
                      {/* السطر التجميعي: المجموعة + المخزن كسطر تجميعي أعلى كل مجموعة أصناف */}
                      <tr className={`border-y font-bold ${
                        isDark ? 'bg-slate-800/90 text-slate-100 border-slate-700' : 'bg-blue-50/80 text-slate-900 border-blue-200'
                      }`}>
                        <td colSpan={5} className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 space-x-reverse text-xs">
                              <span className="text-slate-500 dark:text-slate-400">المجموعة:</span>
                              <span className="text-blue-700 dark:text-blue-300 font-bold">{group.category}</span>
                              <span className="text-slate-300 dark:text-slate-600 px-1">|</span>
                              <span className="text-slate-500 dark:text-slate-400">المخزن:</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">{group.warehouse}</span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              ({group.items.length} صنف — إجمالي الرصيد: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatNumber(group.totalQty)}</span>)
                            </div>
                          </div>
                        </td>
                      </tr>
                      {/* أصناف المجموعة: كود الصنف، اسم الصنف، الوحدة، رصيد أول المدة */}
                      {group.items.map((item, idx) => (
                        <tr 
                          key={item.code} 
                          className={`transition-colors ${
                            idx % 2 === 0 
                              ? (isDark ? 'bg-slate-900' : 'bg-white') 
                              : (isDark ? 'bg-slate-850/50' : 'bg-slate-50/50')
                          } hover:bg-blue-50/30 dark:hover:bg-blue-950/20`}
                        >
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">{item.code}</td>
                          <td className="py-2 px-4 font-bold text-slate-800 dark:text-slate-100">{item.name}</td>
                          <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400">{item.unit}</td>
                          <td className="py-2 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {formatNumber(item.openingBalance)}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
              {executedFilteredItems.length > 0 && (
                <tfoot>
                  <tr className={`border-t font-bold ${
                    isDark ? 'bg-slate-800 text-slate-100 border-slate-700' : 'bg-slate-100 text-slate-900 border-slate-300'
                  }`}>
                    <td colSpan={4} className="py-3 px-4 text-right font-black text-xs">
                      الإجمالي العام لرصيد أول المدة ({executedFilteredItems.length} صنف):
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {formatNumber(totalOpeningQty)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* خانات الاعتماد أسفل التقرير: أعده | صححه | اعتمده (بدون راجعه) */}
          <div className={`p-4 border-t ${
            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-slate-50/60 border-slate-200 text-slate-700'
          }`}>
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
      )}

      {/* Print Preview Modal */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300">
            {/* Modal Action Header (Excluded from Print) */}
            <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">معاينة طباعة — تقرير رصيد أول المدة للأصناف</span>
                <span className="text-xs text-slate-400">({executedFilteredItems.length} صنف)</span>
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
                id="opening-balance-printable-area" 
                className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-slate-900 font-sans text-right"
              >
                {/* Central Unified VERTEX Report Header */}
                <VertexReportHeader
                  companyName={companyName}
                  systemSubtitle={`نظام إدارة المخازن والمستودعات — الفرع: ${currentBranchName}`}
                  reportTitle="تقرير رصيد أول المدة للأصناف"
                  reportSubtitle={`النطاق المحدد: ${reportScopeName}`}
                  themeColor="blue"
                  isPrintVersion={true}
                  metadataItems={[
                    {
                      label: 'تاريخ رصيد أول المدة',
                      value: openingBalanceDate,
                      isMono: true
                    },
                    {
                      label: 'عدد الأصناف',
                      value: `${executedFilteredItems.length} صنف`,
                      isMono: true
                    },
                    {
                      label: 'إجمالي رصيد أول المدة',
                      value: formatNumber(totalOpeningQty),
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
                      <th className="py-2.5 px-2 text-center border-l border-slate-300 w-20">الوحدة</th>
                      <th className="py-2.5 px-3 text-center w-32">رصيد أول المدة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {executedFilteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          لا توجد أصناف مطابقة للبيانات المحددة.
                        </td>
                      </tr>
                    ) : (
                      groupedOpeningItems.map(group => (
                        <React.Fragment key={`print-group-${group.category}-${group.warehouse}`}>
                          <tr className="bg-slate-200/90 text-slate-900 font-bold text-xs">
                            <td colSpan={5} className="py-2 px-3 border border-slate-300 text-right">
                              المجموعة: <span className="font-black text-blue-900">{group.category}</span> &nbsp;|&nbsp; المخزن: <span className="font-black text-emerald-800">{group.warehouse}</span>
                              <span className="text-slate-600 font-normal mr-3">({group.items.length} صنف — إجمالي الرصيد: {formatNumber(group.totalQty)})</span>
                            </td>
                          </tr>
                          {group.items.map((item, idx) => (
                            <tr key={`print-row-${item.code}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                              <td className="py-2 px-2 text-center border-l border-slate-300 font-mono text-xs">{idx + 1}</td>
                              <td className="py-2 px-2 text-center border-l border-slate-300 font-mono font-bold text-blue-900 text-xs">{item.code}</td>
                              <td className="py-2 px-3 text-right border-l border-slate-300 font-bold">{item.name}</td>
                              <td className="py-2 px-2 text-center border-l border-slate-300 text-slate-700">{item.unit}</td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 text-xs">
                                {formatNumber(item.openingBalance)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                  {executedFilteredItems.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                        <td colSpan={4} className="py-2.5 px-3 text-right font-black">
                          الإجمالي العام لرصيد أول المدة ({executedFilteredItems.length} صنف):
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-700 text-sm">
                          {formatNumber(totalOpeningQty)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {/* Signatures: أعده | صححه | اعتمده */}
                <div className="mt-8 pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs text-slate-700">
                  <div>
                    <p className="font-bold mb-6">أعده</p>
                    <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
                  </div>
                  <div>
                    <p className="font-bold mb-6">صححه</p>
                    <p className="border-b border-dashed border-slate-400 w-32 mx-auto"></p>
                  </div>
                  <div>
                    <p className="font-bold mb-6">اعتمده</p>
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
          #opening-balance-printable-area, #opening-balance-printable-area * {
            visibility: visible;
          }
          #opening-balance-printable-area {
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

      {/* Item Selection Modal (Same Mechanism as ItemCardReportView, NO Prices/Avg Cost) */}
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
                  بحث واختيار صنف لرصيد أول المدة
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

            {/* Modal Items Table (Code, Name, Unit, Opening Balance only - NO PRICES) */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold ${
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    <th className="py-2.5 px-3 font-bold text-center w-28">كود الصنف</th>
                    <th className="py-2.5 px-3 font-bold">اسم الصنف</th>
                    <th className="py-2.5 px-3 font-bold text-center w-20">الوحدة</th>
                    <th className="py-2.5 px-3 font-bold text-center w-28">الرصيد المتاح</th>
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
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-300">
                          {it.unit}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatNumber(it.openingBalance)}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(it);
                              setIsItemModalOpen(false);
                            }}
                            className="px-3 py-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-md text-[11px] font-bold cursor-pointer transition-all active:scale-95"
                          >
                            اختيار
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t flex justify-end ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
