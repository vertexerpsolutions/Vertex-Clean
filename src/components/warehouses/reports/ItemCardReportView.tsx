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
  Loader2,
  Eye,
  ArrowDownCircle, 
  ArrowUpCircle, 
  Database,
  Package,
  Layers,
  Filter,
  Warehouse as WarehouseIcon,
  Check,
  Tag
} from 'lucide-react';
import { setupWizardService } from '../../../services/setupWizardService';
import { warehouseService, Warehouse } from '../../../services/warehouseService';
import { salesEntryService, ProductItem } from '../../../services/salesEntryService';
import { purchaseService } from '../../../services/purchaseService';
import { salesReturnService } from '../../../services/salesReturnService';
import { categoryService } from '../../../services/categoryService';
import { BranchItem } from '../../../types';
import { VertexReportHeader } from '../../reports/VertexReportHeader';
import { exportVertexReportToPdf } from '../../../utils/vertexReportRenderer';

interface ItemCardReportViewProps {
  isDark: boolean;
  onClose?: () => void;
}

export interface CardMovement {
  id: number;
  date: string;
  type: string;
  typeColor: string;
  docNum: string;
  entity?: string;
  inQty: number | null;
  inPrice: number | null;
  inTotal: number | null;
  outQty: number | null;
  outPrice: number | null;
  outTotal: number | null;
  balQty: number;
  balAvgCost: number;
  balTotal: number;
  notes?: string;
}

export interface MasterCatalogProduct {
  id: string;
  code: string;
  name: string;
  barcode?: string;
  unit: string;
  category: string;
  subCategory?: string;
  avgCost: number;
  actualBalance: number;
  warehouse?: string;
  branch?: string;
}

// System catalog products from enterprise master data
const INITIAL_SYSTEM_ITEMS: MasterCatalogProduct[] = [
  { id: '1', code: '004004001', name: 'Convert Display Port Cable to HDMI 2B (DC137)', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 5.0, avgCost: 750.0 },
  { id: '2', code: '005002001', name: 'Hard 500g seagate u', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'أقراص صلبة HDD ووحدات تخزين ميكانيكية', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 1.0, avgCost: 550.0 },
  { id: '3', code: '004003002', name: 'Keyboard Original', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 3.0, avgCost: 150.0 },
  { id: '4', code: '004003005', name: 'Mouse USB Dell Optical', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 12.0, avgCost: 85.0 },
  { id: '5', code: '004004006', name: 'Switch D-Link 16 Port Gigabit', unit: 'جهاز', category: 'شبكات واتصالات', subCategory: 'سويتشات وراوترات وشبكات LAN', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 4.0, avgCost: 1200.0 },
  { id: '6', code: '004004010', name: 'Power Supply 500W CoolerMaster', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'مزودات طاقة وصناديق تجميع', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 6.0, avgCost: 950.0 },
  { id: '7', code: '007001002', name: 'Patch Cord Cat6 3M Blue', unit: 'قطعة', category: 'شبكات واتصالات', subCategory: 'كابلات شبكات وتوصيلات إيثرنت', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 45.0, avgCost: 35.0 },
  { id: '8', code: '006002001', name: 'SSD Kingston 240GB A400', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'أقراص SSD ووحدات تخزين سريعة', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 8.0, avgCost: 650.0 },
  { id: '9', code: '006003003', name: 'HDMI Cable 5M 4K UltraHD', unit: 'قطعة', category: 'كابلات وملحقات', subCategory: 'كابلات شاشات VGA وHDMI', warehouse: 'مخزن العجمي', branch: 'داتا اليكس للتوريدات العمومية', actualBalance: 18.0, avgCost: 120.0 },
  { id: '10', code: '008001004', name: 'Wireless Router TP-Link Archer C6', unit: 'جهاز', category: 'شبكات واتصالات', subCategory: 'سويتشات وراوترات وشبكات LAN', warehouse: 'المستودع الإقليمي لندن', branch: 'EMEA Regional Hub - London', actualBalance: 10.0, avgCost: 1450.0 },
  { id: '11', code: '009001001', name: 'RAM Crucial 8GB DDR4 3200MHz', unit: 'قطعة', category: 'معدات كمبيوتر', subCategory: 'ذواكر عشوائية RAM', warehouse: 'مستودع المنطقة الحرة دبي', branch: 'MENA Logistics Center - Dubai', actualBalance: 15.0, avgCost: 800.0 }
];

export const ItemCardReportView: React.FC<ItemCardReportViewProps> = ({ isDark, onClose }) => {
  // 1. Live Enterprise System Metadata
  const companyName = useMemo(() => {
    try {
      const cfg = setupWizardService.getConfig();
      if (cfg?.companyName && cfg.companyName !== 'Vertex Global Enterprises Corp') {
        return cfg.companyName;
      }
    } catch {}
    return 'شركة داتا اليكس للتوريدات العمومية';
  }, []);

  // 2. Real System Live Date from Device
  const todayDate = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 3. Master Branches and Warehouses from System
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
    const unsubWh = warehouseService.subscribe(() => {
      try {
        setAllWarehouses(warehouseService.getAllWarehouses());
        setAllBranches(warehouseService.getAvailableBranches());
      } catch {}
    });
    return unsubWh;
  }, []);

  // 4. Products Master Catalog Loader (Unified from Sales, Purchases, Categories & Initial Catalog)
  const masterProducts = useMemo<MasterCatalogProduct[]>(() => {
    const map = new Map<string, MasterCatalogProduct>();

    // Initial Catalog Items
    INITIAL_SYSTEM_ITEMS.forEach(it => {
      map.set(it.code, { ...it });
    });

    // Merge from salesEntryService
    try {
      const salesProds = salesEntryService.getState().products || [];
      salesProds.forEach(p => {
        const c = p.code || p.id;
        const existing = map.get(c);
        if (existing) {
          if (p.name) existing.name = p.name;
          if (p.barcode) existing.barcode = p.barcode;
          if (p.unit || p.basicUnit) existing.unit = p.unit || p.basicUnit || 'قطعة';
          if (p.category) existing.category = p.category;
          if (p.costPrice) existing.avgCost = p.costPrice;
          if (typeof p.stockQty === 'number') existing.actualBalance = p.stockQty;
        } else {
          map.set(c, {
            id: p.id,
            code: c,
            name: p.name,
            barcode: p.barcode,
            unit: p.unit || p.basicUnit || 'قطعة',
            category: p.category || 'عام',
            subCategory: p.subCategory,
            avgCost: p.costPrice || 0,
            actualBalance: p.stockQty || 0,
            warehouse: p.warehouse || 'مخزن العجمي',
            branch: 'داتا اليكس للتوريدات العمومية'
          });
        }
      });
    } catch {}

    // Merge from categoryService
    try {
      const catProds = categoryService.getProducts() || [];
      catProds.forEach(cp => {
        const c = cp.code || cp.id;
        const existing = map.get(c);
        if (existing) {
          if (cp.name) existing.name = cp.name;
          if (cp.basicUnit) existing.unit = cp.basicUnit;
        } else {
          map.set(c, {
            id: cp.id,
            code: c,
            name: cp.name,
            unit: cp.basicUnit || 'قطعة',
            category: cp.category || 'عام',
            subCategory: cp.subCategory,
            avgCost: cp.costPrice || 0,
            actualBalance: cp.stockQty || 0,
            warehouse: 'مخزن العجمي',
            branch: 'داتا اليكس للتوريدات العمومية'
          });
        }
      });
    } catch {}

    return Array.from(map.values());
  }, []);

  // 5. Selected Product State (Default to null on load as requested)
  const [selectedProduct, setSelectedProduct] = useState<MasterCatalogProduct | null>(null);

  // Modal State for Item Search & Selection
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [modalItemSearch, setModalItemSearch] = useState<string>('');
  const [modalSelectedCategory, setModalSelectedCategory] = useState<string>('all');

  // 6. Current Logged-in Branch (Derived strictly from Session / Setup / Warehouse Service)
  const currentBranch = useMemo(() => {
    try {
      const branches = warehouseService.getAvailableBranches();
      const main = branches.find(b => b.isMain) || branches[0];
      return main || { id: 'BR-01', code: 'HQ-NY', name: 'داتا اليكس للتوريدات العمومية', isMain: true };
    } catch {
      return { id: 'BR-01', code: 'HQ-NY', name: 'داتا اليكس للتوريدات العمومية', isMain: true };
    }
  }, []);
  const currentBranchName = currentBranch.name;

  // Warehouses belonging strictly to the current logged-in branch (No other branches shown)
  const branchWarehouses = useMemo(() => {
    return allWarehouses.filter(w =>
      w.branchId === currentBranch.id ||
      w.branchName === currentBranch.name ||
      w.branchName === currentBranchName
    );
  }, [allWarehouses, currentBranch, currentBranchName]);

  const branchWarehouseNames = useMemo(() => {
    return branchWarehouses.map(w => w.name);
  }, [branchWarehouses]);

  // Default Warehouse: User's linked warehouse or first warehouse of current branch
  const defaultUserWarehouse = useMemo(() => {
    try {
      const activeWhId = salesEntryService.getState()?.activeInvoice?.warehouseId;
      if (activeWhId) {
        const found = branchWarehouses.find(w => w.id === activeWhId || w.code === activeWhId || w.name === activeWhId);
        if (found) return found.name;
      }
    } catch {}
    return branchWarehouses[0]?.name || 'مخزن العجمي';
  }, [branchWarehouses]);

  // 7. Filter States
  // نوع التقرير: بالكميات أو بالأسعار فقط (Default: بالأسعار)
  const [reportType, setReportType] = useState<'by_prices' | 'by_quantities'>('by_prices');
  
  // المخزن: قائمة واحدة تحتوي على مخازن الفرع الحالي + خيار «جميع مخازن الفرع»
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(defaultUserWarehouse);

  // التاريخ: تاريخ اليوم افتراضيًا + خيار «خلال فترة»
  const [isPeriodEnabled, setIsPeriodEnabled] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(todayDate);
  const [endDate, setEndDate] = useState<string>(todayDate);
  const [dateError, setDateError] = useState<string | null>(null);

  // Execution & Live Search states
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Executed filter snapshot to display current rendered scope
  const [executedFilters, setExecutedFilters] = useState<{
    product: MasterCatalogProduct | null;
    reportType: 'by_prices' | 'by_quantities';
    warehouse: string;
    isPeriodEnabled: boolean;
    startDate: string;
    endDate: string;
  }>({
    product: null,
    reportType: 'by_prices',
    warehouse: defaultUserWarehouse,
    isPeriodEnabled: false,
    startDate: todayDate,
    endDate: todayDate
  });

  // Check if current user selections deviate from the executed report snapshot
  const hasFilterChanges = useMemo<boolean>(() => {
    if (!hasExecuted || !executedFilters.product || !selectedProduct) return false;
    return (
      selectedProduct.code !== executedFilters.product.code ||
      reportType !== executedFilters.reportType ||
      selectedWarehouse !== executedFilters.warehouse ||
      isPeriodEnabled !== executedFilters.isPeriodEnabled ||
      (isPeriodEnabled && (startDate !== executedFilters.startDate || endDate !== executedFilters.endDate))
    );
  }, [
    hasExecuted,
    selectedProduct,
    reportType,
    selectedWarehouse,
    isPeriodEnabled,
    startDate,
    endDate,
    executedFilters
  ]);

  // Date Change Handlers with strict validation (من تاريخ <= إلى تاريخ)
  const handleStartDateChange = (val: string) => {
    if (endDate && val > endDate) {
      setDateError(`لا يمكن اختيار «من تاريخ» (${val}) أكبر من «إلى تاريخ» (${endDate}). تم منع الاختيار.`);
      return;
    }
    setDateError(null);
    setStartDate(val);
  };

  const handleEndDateChange = (val: string) => {
    if (startDate && val < startDate) {
      setDateError(`لا يمكن اختيار «إلى تاريخ» (${val}) أصغر من «من تاريخ» (${startDate}). تم منع الاختيار.`);
      return;
    }
    setDateError(null);
    setEndDate(val);
  };

  // 8. Core Item Movements Generator (Sales, Purchases, Returns & Stock Ledger)
  const computedMovements = useMemo<CardMovement[]>(() => {
    if (!hasExecuted || !executedFilters.product) {
      return [];
    }
    const { product, warehouse, isPeriodEnabled, startDate: fStart, endDate: fEnd } = executedFilters;
    const isAllWarehouses = warehouse === 'جميع مخازن الفرع' || warehouse === 'جميع المخازن';

    const rawMovements: {
      date: string;
      type: string;
      typeColor: string;
      docNum: string;
      entity: string;
      inQty: number | null;
      inPrice: number | null;
      inTotal: number | null;
      outQty: number | null;
      outPrice: number | null;
      outTotal: number | null;
      notes: string;
    }[] = [];

    // A. Real Initial Stock / Opening Balance from Master Catalog
    if (product.actualBalance > 0) {
      const prodWh = product.warehouse || 'مخزن العجمي';
      const whMatch = isAllWarehouses
        ? branchWarehouseNames.includes(prodWh)
        : prodWh === warehouse;
      if (whMatch) {
        rawMovements.push({
          date: '2026-08-01',
          type: 'جرد',
          typeColor: 'text-blue-700 dark:text-blue-400 font-bold',
          docNum: '1',
          entity: 'جرد',
          inQty: product.actualBalance,
          inPrice: product.avgCost || 0,
          inTotal: (product.actualBalance || 0) * (product.avgCost || 0),
          outQty: null,
          outPrice: null,
          outTotal: null,
          notes: `رصيد افتتاحي معتمد - ${prodWh}`
        });
      }
    }

    // B. Live Sales Invoices from salesEntryService
    try {
      const completedSales = salesEntryService.getState().completedInvoices || [];
      completedSales.forEach(inv => {
        if (inv.status === 'cancelled') return;
        // Check warehouse filter
        if (!isAllWarehouses) {
          const invWh = inv.warehouseName || inv.warehouseId;
          if (invWh && invWh !== warehouse) return;
        } else {
          const invWh = inv.warehouseName || inv.warehouseId;
          if (invWh && !branchWarehouseNames.includes(invWh)) return;
        }
        // Check line items matching product
        (inv.lineItems || []).forEach(line => {
          if (
            line.productId === product.id ||
            line.productCode === product.code ||
            (line.productName && line.productName.trim() === product.name.trim())
          ) {
            const dateStr = inv.createdAt ? inv.createdAt.slice(0, 10) : todayDate;
            rawMovements.push({
              date: dateStr,
              type: 'مبيعات',
              typeColor: 'text-rose-600 dark:text-rose-400',
              docNum: inv.invoiceNumber || String(inv.id),
              entity: inv.customerName || 'عميل نقدي',
              inQty: null,
              inPrice: null,
              inTotal: null,
              outQty: line.quantity,
              outPrice: line.unitPrice,
              outTotal: line.quantity * line.unitPrice,
              notes: `فاتورة مبيعات رقم ${inv.invoiceNumber || inv.id}`
            });
          }
        });
      });
    } catch {}

    // C. Live Purchases Invoices from purchaseService
    try {
      const completedPurchases = purchaseService.getCompletedInvoices() || [];
      completedPurchases.forEach(pinv => {
        if (!isAllWarehouses) {
          if (pinv.warehouseName && pinv.warehouseName !== warehouse && pinv.warehouseId !== warehouse) return;
        } else {
          const pinvWh = pinv.warehouseName || pinv.warehouseId;
          if (pinvWh && !branchWarehouseNames.includes(pinvWh)) return;
        }
        (pinv.lineItems || []).forEach(line => {
          if (
            line.productId === product.id ||
            line.productCode === product.code ||
            (line.productName && line.productName.trim() === product.name.trim())
          ) {
            const dateStr = pinv.createdAt ? pinv.createdAt.slice(0, 10) : todayDate;
            rawMovements.push({
              date: dateStr,
              type: 'مشتريات',
              typeColor: 'text-emerald-600 dark:text-emerald-400',
              docNum: pinv.invoiceNumber || String(pinv.id),
              entity: pinv.vendorName || 'مورد عام',
              inQty: line.quantity,
              inPrice: line.unitPrice,
              inTotal: line.quantity * line.unitPrice,
              outQty: null,
              outPrice: null,
              outTotal: null,
              notes: `فاتورة شراء رقم ${pinv.invoiceNumber || pinv.id}`
            });
          }
        });
      });
    } catch {}

    // D. Live Sales Returns from salesReturnService
    try {
      const allReturns = salesReturnService.getAllReturns() || [];
      allReturns.forEach(ret => {
        if (ret.status === 'cancelled') return;
        const dateStr = ret.createdAt ? ret.createdAt.slice(0, 10) : todayDate;
        const itemsList = ret.lineItems || (ret as any).items || [];
        itemsList.forEach((item: any) => {
          if (
            item.productId === product.id ||
            item.productCode === product.code ||
            ((item.productName || item.name) && (item.productName || item.name).trim() === product.name.trim())
          ) {
            const retQty = item.returnQuantity ?? item.quantity ?? 1;
            const retPrice = item.unitPrice ?? item.price ?? product.avgCost;
            rawMovements.push({
              date: dateStr,
              type: 'مرتجع مبيعات',
              typeColor: 'text-amber-600 dark:text-amber-400',
              docNum: ret.returnNumber || String(ret.id),
              entity: ret.customerName || 'عميل',
              inQty: retQty,
              inPrice: retPrice,
              inTotal: retQty * retPrice,
              outQty: null,
              outPrice: null,
              outTotal: null,
              notes: `مرتجع مبيعات رقم ${ret.returnNumber || ret.id}`
            });
          }
        });
      });
    } catch {}

    // Sort chronologically
    rawMovements.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate sequential running balance
    let runningQty = 0;
    let runningTotalVal = 0;
    let runningAvgCost = product.avgCost || 0;

    const fullHistory: CardMovement[] = [];
    let idxCounter = 1;

    for (const m of rawMovements) {
      const inQ = m.inQty || 0;
      const inTot = m.inTotal || (inQ * (m.inPrice || 0));
      const outQ = m.outQty || 0;

      if (inQ > 0) {
        runningTotalVal += inTot;
        runningQty += inQ;
        runningAvgCost = runningQty > 0 ? (runningTotalVal / runningQty) : 0;
      } else if (outQ > 0) {
        const costDeducted = outQ * runningAvgCost;
        runningTotalVal = Math.max(0, runningTotalVal - costDeducted);
        runningQty = Math.max(0, runningQty - outQ);
      }

      fullHistory.push({
        id: idxCounter++,
        date: m.date,
        type: m.type,
        typeColor: m.typeColor,
        docNum: m.docNum,
        entity: m.entity,
        inQty: m.inQty,
        inPrice: m.inPrice,
        inTotal: m.inTotal,
        outQty: m.outQty,
        outPrice: m.outPrice,
        outTotal: m.outTotal,
        balQty: Number(runningQty.toFixed(2)),
        balAvgCost: Number(runningAvgCost.toFixed(2)),
        balTotal: Number((runningQty * runningAvgCost).toFixed(2)),
        notes: m.notes
      });
    }

    // Now apply Date Filtering:
    // If «خلال فترة» is enabled: show opening balance before startDate, plus movements between startDate and endDate
    // If «خلال فترة» is NOT enabled: report is for todayDate only!
    if (!isPeriodEnabled) {
      // Filter for today's date
      const todayMovements = fullHistory.filter(m => m.date === todayDate);

      // Movements prior to todayDate
      const priorMovements = fullHistory.filter(m => m.date < todayDate);
      const priorLast = priorMovements[priorMovements.length - 1];
      const prevQty = priorLast ? priorLast.balQty : (fullHistory[0]?.balQty || product.actualBalance);
      const prevAvgCost = priorLast ? priorLast.balAvgCost : (fullHistory[0]?.balAvgCost || product.avgCost);
      const prevTotal = priorLast ? priorLast.balTotal : (prevQty * prevAvgCost);

      const result: CardMovement[] = [];
      if (fullHistory.length > 0 && todayMovements.length < fullHistory.length) {
        result.push({
          id: 1,
          date: todayDate,
          type: 'رصيد سابق',
          typeColor: 'text-blue-700 dark:text-blue-400 font-bold',
          docNum: '-',
          entity: 'رصيد سابق حتى بداية اليوم',
          inQty: null,
          inPrice: null,
          inTotal: null,
          outQty: null,
          outPrice: null,
          outTotal: null,
          balQty: prevQty,
          balAvgCost: prevAvgCost,
          balTotal: prevTotal,
          notes: 'رصيد الصنف المنقول حتى بداية اليوم'
        });
      }

      todayMovements.forEach((tm, i) => {
        result.push({
          ...tm,
          id: result.length + 1
        });
      });

      // If no movements occurred today and no prior history, show starting balance row
      if (result.length === 0) {
        result.push({
          id: 1,
          date: todayDate,
          type: 'جرد',
          typeColor: 'text-blue-700 dark:text-blue-400 font-bold',
          docNum: '1',
          entity: 'جرد',
          inQty: product.actualBalance,
          inPrice: product.avgCost,
          inTotal: product.actualBalance * product.avgCost,
          outQty: null,
          outPrice: null,
          outTotal: null,
          balQty: product.actualBalance,
          balAvgCost: product.avgCost,
          balTotal: product.actualBalance * product.avgCost,
          notes: 'رصيد الصنف المعتمد حالياً'
        });
      }

      return result;
    } else {
      // Period mode: startDate to endDate
      const periodMovements = fullHistory.filter(m => m.date >= fStart && m.date <= fEnd);
      const priorMovements = fullHistory.filter(m => m.date < fStart);
      const priorLast = priorMovements[priorMovements.length - 1];

      const result: CardMovement[] = [];
      let rowIdx = 1;

      if (priorLast) {
        result.push({
          id: rowIdx++,
          date: fStart,
          type: 'رصيد سابق',
          typeColor: 'text-blue-700 dark:text-blue-400 font-bold',
          docNum: '-',
          entity: `رصيد سابق منقول حتى ${fStart}`,
          inQty: null,
          inPrice: null,
          inTotal: null,
          outQty: null,
          outPrice: null,
          outTotal: null,
          balQty: priorLast.balQty,
          balAvgCost: priorLast.balAvgCost,
          balTotal: priorLast.balTotal,
          notes: `رصيد الصنف المنقول حتى تاريخ ${fStart}`
        });
      } else if (periodMovements.length === 0) {
        // If nothing in period, show current balance row
        result.push({
          id: rowIdx++,
          date: fStart,
          type: 'جرد',
          typeColor: 'text-blue-700 dark:text-blue-400 font-bold',
          docNum: '1',
          entity: 'جرد',
          inQty: product.actualBalance,
          inPrice: product.avgCost,
          inTotal: product.actualBalance * product.avgCost,
          outQty: null,
          outPrice: null,
          outTotal: null,
          balQty: product.actualBalance,
          balAvgCost: product.avgCost,
          balTotal: product.actualBalance * product.avgCost,
          notes: 'لا توجد حركات مسجلة خلال الفترة المحددة'
        });
      }

      periodMovements.forEach(pm => {
        result.push({
          ...pm,
          id: rowIdx++
        });
      });

      return result;
    }
  }, [executedFilters, todayDate, hasExecuted, branchWarehouseNames]);

  // Calculations for Footer Totals
  const totalInQty = useMemo(() => computedMovements.reduce((acc, m) => acc + (m.inQty || 0), 0), [computedMovements]);
  const totalInValue = useMemo(() => computedMovements.reduce((acc, m) => acc + (m.inTotal || 0), 0), [computedMovements]);
  const totalOutQty = useMemo(() => computedMovements.reduce((acc, m) => acc + (m.outQty || 0), 0), [computedMovements]);
  const totalOutValue = useMemo(() => computedMovements.reduce((acc, m) => acc + (m.outTotal || 0), 0), [computedMovements]);
  
  const lastMovement = computedMovements[computedMovements.length - 1];
  const finalBalanceQty = lastMovement ? lastMovement.balQty : (executedFilters.product?.actualBalance || 0);
  const finalAvgCost = lastMovement ? lastMovement.balAvgCost : (executedFilters.product?.avgCost || 0);
  const finalBalanceValue = lastMovement ? lastMovement.balTotal : (finalBalanceQty * finalAvgCost);

  const formatNumber = (num: number | null, decimals: number = 2) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Instant Live Search Filter across rendered table
  const filteredMovements = useMemo(() => {
    if (!searchQuery.trim()) return computedMovements;
    const q = searchQuery.toLowerCase().trim();
    return computedMovements.filter(m => 
      m.docNum.toLowerCase().includes(q) ||
      m.type.toLowerCase().includes(q) ||
      m.date.includes(q) ||
      (m.entity && m.entity.toLowerCase().includes(q)) ||
      (m.notes && m.notes.toLowerCase().includes(q))
    );
  }, [computedMovements, searchQuery]);

  // Execute Report Handler
  const handleExecuteReport = () => {
    if (!selectedProduct) {
      setDateError('يرجى اختيار صنف أولاً لعرض التقرير.');
      setIsItemModalOpen(true);
      return;
    }
    if (isPeriodEnabled && startDate > endDate) {
      setDateError(`لا يمكن تنفيذ التقرير: «من تاريخ» (${startDate}) أكبر من «إلى تاريخ» (${endDate}).`);
      return;
    }
    setDateError(null);
    setIsExecuting(true);
    setTimeout(() => {
      setExecutedFilters({
        product: selectedProduct,
        reportType,
        warehouse: selectedWarehouse,
        isPeriodEnabled,
        startDate,
        endDate
      });
      setHasExecuted(true);
      setIsExecuting(false);
    }, 200);
  };

  // Products filtered inside the Item Selector Modal
  const modalFilteredProducts = useMemo(() => {
    let list = masterProducts;
    if (modalSelectedCategory !== 'all') {
      list = list.filter(p => p.category === modalSelectedCategory);
    }
    if (modalItemSearch.trim()) {
      const q = modalItemSearch.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [masterProducts, modalItemSearch, modalSelectedCategory]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    masterProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [masterProducts]);

  // Excel Export: Professional Corporate Report matching the PDF Item Card format identically
  const handleExportExcel = () => {
    try {
      const isByPrices = executedFilters.reportType === 'by_prices';
      const numCols = isByPrices ? 9 : 8;
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

      const borderTeal = {
        top: { style: 'thin', color: { rgb: '99F6E4' } },
        bottom: { style: 'thin', color: { rgb: '99F6E4' } },
        left: { style: 'thin', color: { rgb: '99F6E4' } },
        right: { style: 'thin', color: { rgb: '99F6E4' } }
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

      // 1. Enterprise Company Name
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, companyName, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 14, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } }
      });
      rows.push({ hpt: 26 });
      currentRow++;

      // 2. Enterprise Subtitle
      const subTitle = `نظام إدارة المخازن والمستودعات - الفرع: ${currentBranchName}`;
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, subTitle, 's', {
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

      // 4. Official Report Title Banner: «تقرير كارتة صنف»
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, `تقرير كارتة صنف (${isByPrices ? 'بالأسعار والتكلفة' : 'بالكميات'})`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '0F766E' } }, // Teal-700
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 28 });
      currentRow++;

      // 5. Spacing
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 6 });
      currentRow++;

      // 6. Item Details Card (مطابق للبرواز الأخضر المزرق في الـPDF)
      // Line A: اسم الصنف (Bold)
      mergeAndStyle(currentRow, 0, currentRow, 3, `اسم الصنف:  ${executedFilters.product.name}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 11.5, color: { rgb: '042F2E' } },
        fill: { fgColor: { rgb: 'F0FDFA' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderTeal
      });
      mergeAndStyle(currentRow, 4, currentRow, 5, `كود الصنف:  ${executedFilters.product.code}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: '0F766E' } },
        fill: { fgColor: { rgb: 'F0FDFA' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderTeal
      });
      mergeAndStyle(currentRow, 6, currentRow, lastColIdx, `الوحدة:  ${executedFilters.product.unit}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F0FDFA' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderTeal
      });
      rows.push({ hpt: 24 });
      currentRow++;

      // Line B: المجموعة، المخزن، الفرع
      mergeAndStyle(currentRow, 0, currentRow, 3, `المجموعة:  ${executedFilters.product.category || 'عام'}`, 's', {
        font: { name: 'Segoe UI', bold: false, sz: 10, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F0FDFA' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderTeal
      });
      mergeAndStyle(currentRow, 4, currentRow, 5, `المخزن:  ${executedFilters.warehouse}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: '0F766E' } },
        fill: { fgColor: { rgb: 'F0FDFA' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderTeal
      });
      mergeAndStyle(currentRow, 6, currentRow, lastColIdx, `الفرع:  ${currentBranchName}`, 's', {
        font: { name: 'Segoe UI', bold: false, sz: 10, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F0FDFA' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderTeal
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // Line C: نطاق التاريخ / الفترة
      const dateScopeText = executedFilters.isPeriodEnabled 
        ? `نطاق التاريخ: من تاريخ: ${executedFilters.startDate} إلى تاريخ: ${executedFilters.endDate}`
        : `تاريخ التقرير: ${todayDate}`;
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, dateScopeText, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 9.5, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F0FDFA' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderTeal
      });
      rows.push({ hpt: 20 });
      currentRow++;

      // 7. Spacing
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // 8. Column Headers (الجدول الرأسي المنظم)
      const colHeaders = [
        'م',
        'رقم المستند',
        'التاريخ',
        'نوع الحركة',
        'الجهة / البيان',
        'الوارد',
        'المنصرف',
        'رصيد الكمية',
        ...(isByPrices ? ['السعر'] : [])
      ];

      colHeaders.forEach((h, c) => {
        setCell(currentRow, c, h, 's', {
          font: { name: 'Segoe UI', bold: true, sz: 10, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0F172A' } }, // Slate-900
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
      });
      rows.push({ hpt: 24 });
      currentRow++;

      // 9. Movement Data Rows
      if (filteredMovements.length === 0) {
        mergeAndStyle(currentRow, 0, currentRow, lastColIdx, 'لا توجد حركات مسجلة لهذا الصنف تطابق شروط الفلترة المحددة.', 's', {
          font: { name: 'Segoe UI', sz: 10, color: { rgb: '64748B' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: borderThin
        });
        rows.push({ hpt: 30 });
        currentRow++;
      } else {
        filteredMovements.forEach((m, idx) => {
          const isEven = idx % 2 === 0;
          const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';

          // م
          setCell(currentRow, 0, m.id, 'n', { alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: rowBg } }, border: borderThin });
          // رقم المستند
          setCell(currentRow, 1, m.docNum, 's', { font: { bold: true }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: rowBg } }, border: borderThin });
          // التاريخ
          setCell(currentRow, 2, m.date, 's', { alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: rowBg } }, border: borderThin });
          // نوع الحركة
          setCell(currentRow, 3, m.type, 's', { font: { bold: true }, alignment: { horizontal: 'center' }, fill: { fgColor: { rgb: rowBg } }, border: borderThin });
          // الجهة / البيان
          setCell(currentRow, 4, m.entity || m.notes || '-', 's', { alignment: { horizontal: 'right' }, fill: { fgColor: { rgb: rowBg } }, border: borderThin });
          // الوارد (لون أخضر مميز)
          setCell(currentRow, 5, m.inQty !== null ? m.inQty : '-', typeof m.inQty === 'number' ? 'n' : 's', {
            font: { bold: true, color: { rgb: '047857' } },
            alignment: { horizontal: 'center' },
            fill: { fgColor: { rgb: rowBg } },
            border: borderThin
          });
          // المنصرف (لون أحمر مميز)
          setCell(currentRow, 6, m.outQty !== null ? m.outQty : '-', typeof m.outQty === 'number' ? 'n' : 's', {
            font: { bold: true, color: { rgb: 'BE123C' } },
            alignment: { horizontal: 'center' },
            fill: { fgColor: { rgb: rowBg } },
            border: borderThin
          });
          // رصيد الكمية (لون أزرق داكن مميز)
          setCell(currentRow, 7, m.balQty, 'n', {
            font: { bold: true, color: { rgb: '1D4ED8' } },
            alignment: { horizontal: 'center' },
            fill: { fgColor: { rgb: rowBg } },
            border: borderThin
          });
          // السعر إن وجد
          if (isByPrices) {
            const priceVal = m.inPrice ? m.inPrice : m.outPrice ? m.outPrice : m.balAvgCost;
            setCell(currentRow, 8, priceVal, 'n', {
              font: { bold: true, color: { rgb: 'BE123C' } },
              alignment: { horizontal: 'center' },
              fill: { fgColor: { rgb: rowBg } },
              border: borderThin
            });
          }

          rows.push({ hpt: 20 });
          currentRow++;
        });
      }

      // 10. Blank row
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // 11. Summary Box Header ("بالعدد (إجماليات حركة الصنف)")
      mergeAndStyle(currentRow, 0, currentRow, lastColIdx, `بالعدد (إجماليات حركة الصنف)  -  الوحدة: ${executedFilters.product.unit}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 10.5, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // 12. Summary Box Totals (الوارد / الصادر / الرصيد النهائي)
      // إجمالي الوارد
      mergeAndStyle(currentRow, 0, currentRow, 2, `اجمالي الوارد:  ${formatNumber(totalInQty)} ${executedFilters.product.unit}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '047857' } },
        fill: { fgColor: { rgb: 'ECFDF5' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      // إجمالي الصادر
      mergeAndStyle(currentRow, 3, currentRow, 4, `اجمالي الصادر:  ${formatNumber(totalOutQty)} ${executedFilters.product.unit}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: 'BE123C' } },
        fill: { fgColor: { rgb: 'FFF1F2' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      // الرصيد النهائي
      mergeAndStyle(currentRow, 5, currentRow, lastColIdx, `الرصيد النهائي:  ${formatNumber(finalBalanceQty)} ${executedFilters.product.unit}`, 's', {
        font: { name: 'Segoe UI', bold: true, sz: 11.5, color: { rgb: '1D4ED8' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      rows.push({ hpt: 26 });
      currentRow++;

      // 13. Blank Spacing Row before signatures
      for (let c = 0; c < numCols; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 18 });
      currentRow++;

      // 14. Signatures (فقط خانتا: اعتمده / أعده)
      mergeAndStyle(currentRow, 0, currentRow, 2, 'اعتمده', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeAndStyle(currentRow, lastColIdx - 2, currentRow, lastColIdx, 'أعده', 's', {
        font: { name: 'Segoe UI', bold: true, sz: 11, color: { rgb: '334155' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 20 });
      currentRow++;

      // Signature dotted line
      mergeAndStyle(currentRow, 0, currentRow, 2, '..............................', 's', {
        font: { name: 'Segoe UI', sz: 10, color: { rgb: '94A3B8' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      mergeAndStyle(currentRow, lastColIdx - 2, currentRow, lastColIdx, '..............................', 's', {
        font: { name: 'Segoe UI', sz: 10, color: { rgb: '94A3B8' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 20 });

      // Column widths
      const cols = [
        { wch: 6 },  // م
        { wch: 15 }, // رقم المستند
        { wch: 13 }, // التاريخ
        { wch: 18 }, // نوع الحركة
        { wch: 32 }, // الجهة / البيان
        { wch: 14 }, // الوارد
        { wch: 14 }, // المنصرف
        { wch: 16 }, // رصيد الكمية
        ...(isByPrices ? [{ wch: 14 }] : []) // السعر
      ];

      ws['!merges'] = merges;
      ws['!rows'] = rows;
      ws['!cols'] = cols;
      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: currentRow, c: lastColIdx }
      });

      // RTL & Page Setup for Professional Corporate Excel Sheet
      ws['!views'] = [{ rightToLeft: true, RTL: true }];
      ws['!margins'] = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'تقرير كارتة صنف');
      wb.Workbook = { Views: [{ RTL: true }] };

      const filename = `تقرير_كارتة_صنف_${executedFilters.product.code}_${todayDate}.xlsx`;
      XLSX.writeFile(wb, filename);

      setNotification(`تم تصدير تقرير كارتة صنف (${executedFilters.product.name}) إلى ملف Excel بنجاح.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Error generating Excel file:', err);
      setNotification('حدث خطأ أثناء تصدير ملف Excel.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // PDF Export using centralized vertexReportRenderer
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const element = (isPrintPreviewOpen ? document.getElementById('item-card-printable-modal-sheet') : null)
        || document.getElementById('item-card-printable-area');

      if (!element) {
        setIsPrintPreviewOpen(true);
        setTimeout(() => {
          handleExportPdf();
        }, 300);
        return;
      }

      await exportVertexReportToPdf(element, {
        filename: `تقرير_كارتة_صنف_${executedFilters.product.code}_${todayDate}.pdf`,
        title: 'تقرير كارتة صنف',
        onComplete: () => {
          setNotification(`تم تصدير تقرير كارتة صنف (${executedFilters.product.name}) إلى ملف PDF بنجاح.`);
          setTimeout(() => setNotification(null), 3500);
        },
        onError: (err) => {
          console.error('Error generating PDF, falling back to print dialog:', err);
          window.print();
        }
      });
    } catch (err) {
      console.error('Error in PDF export:', err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full select-none text-right font-sans transition-colors duration-150 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`} dir="rtl">

      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-3 space-x-reverse text-xs sm:text-sm font-bold animate-bounce">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-white hover:opacity-80 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action Bar (Print, Excel, PDF, Close) */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b shadow-2xs ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center space-x-2 space-x-reverse text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">
          <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{companyName}</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-purple-700 dark:text-purple-400 font-bold">تقرير كارتة صنف</span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-500 font-mono text-xs">{todayDate}</span>
        </div>

        <div className="flex items-center space-x-2 space-x-reverse text-xs sm:text-sm">
          <button 
            type="button"
            id="itemCardPrintBtn"
            onClick={() => {
              if (!hasExecuted) {
                setNotification('يرجى الضغط على زر «عرض التقرير» أولاً لاستخراج البيانات قبل معاينة الطباعة.');
                setTimeout(() => setNotification(null), 3500);
                return;
              }
              setIsPrintPreviewOpen(true);
            }}
            className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-medium transition-colors cursor-pointer"
            title="طباعة تقرير كارتة صنف"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة</span>
          </button>
          <button 
            type="button"
            id="itemCardExportExcelBtn"
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
          <button 
            type="button"
            id="itemCardExportPdfBtn"
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
          {onClose && (
            <button 
              type="button"
              id="itemCardCloseBtn"
              onClick={onClose}
              className="flex items-center space-x-1 space-x-reverse px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>إغلاق</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 flex flex-col">
        {/* Top Details & Report Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 px-1">
          {/* Right (in RTL): Title */}
          <div className="flex items-center space-x-2.5 space-x-reverse self-start md:self-center shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight">
                تقرير كارتة صنف
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                حركة كارتة الصنف المخزنية
              </p>
            </div>
          </div>

          {/* Center: Prominent Item Name (العنصر البصري الأبرز في تعريف الصنف) */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2 min-w-0">
            {hasExecuted && executedFilters.product ? (
              <>
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {executedFilters.product.name}
                </h2>
                <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-300 font-mono font-bold border border-blue-200/80 dark:border-blue-800/60">
                    كود: {executedFilters.product.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                    الوحدة: {executedFilters.product.unit}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                    التصنيف: {executedFilters.product.category}
                  </span>
                </div>
              </>
            ) : selectedProduct ? (
              <>
                <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  {selectedProduct.name}
                </h2>
                <div className="flex items-center justify-center flex-wrap gap-1.5 sm:gap-2 mt-1">
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#1565C0] dark:text-blue-300 font-mono font-bold border border-blue-200/80 dark:border-blue-800/60">
                    كود: {selectedProduct.code}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700">
                    الوحدة: {selectedProduct.unit}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                    التصنيف: {selectedProduct.category}
                  </span>
                </div>
              </>
            ) : (
              <div className="py-1">
                <h2 className="text-sm sm:text-base font-bold text-slate-400 dark:text-slate-500">
                  — لم يتم اختيار أي صنف بعد —
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  اضغط على «اختيار صنف» لتحديد الصنف واستخراج كارتة الصنف
                </p>
              </div>
            )}
          </div>

          {/* Left (in RTL): Item Selection Button */}
          <div className="flex items-center space-x-2 space-x-reverse self-end md:self-center shrink-0">
            <button
              type="button"
              id="itemCardOpenSelectModalBtn"
              onClick={() => setIsItemModalOpen(true)}
              className="flex items-center space-x-1.5 space-x-reverse px-3.5 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-[#1565C0] dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-700/80 font-bold text-xs sm:text-sm shadow-2xs transition-all duration-150 cursor-pointer"
              title="فتح نافذة بحث واختيار الصنف"
            >
              <Search className="w-4 h-4 text-[#1565C0] dark:text-blue-400" />
              <span>{selectedProduct ? `تغيير الصنف (${selectedProduct.code})` : 'اختيار / بحث صنف'}</span>
            </button>
            {selectedProduct && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setHasExecuted(false);
                  setExecutedFilters(prev => ({ ...prev, product: null }));
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="إلغاء اختيار الصنف وتفريغ التقرير"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Options: Compact, Non-Stretching Dashboard Layout */}
        <div className={`p-3 sm:p-3.5 rounded-xl border shadow-xs space-y-2.5 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-[#f8fafc] border-slate-200/90'
        }`}>
          {/* صف الفلاتر المدمج بأضيق وأبسط شكل ممكن */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            {/* 1. نوع التقرير (Dropdown واحد فقط: بالكميات / بالأسعار) */}
            <div className="space-y-1">
              <label htmlFor="itemCardReportTypeSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                نوع التقرير
              </label>
              <select
                id="itemCardReportTypeSelect"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'by_prices' | 'by_quantities')}
                className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-semibold transition-colors shadow-2xs cursor-pointer ${
                  isDark 
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' 
                    : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
                }`}
              >
                <option value="by_quantities">بالكميات</option>
                <option value="by_prices">بالأسعار</option>
              </select>
            </div>

            {/* 2. المخزن (Dropdown واحد فقط: مخازن الفرع الحالي + خيار أخير «جميع مخازن الفرع») */}
            <div className="space-y-1">
              <label htmlFor="itemCardWarehouseSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المخزن
              </label>
              <select 
                id="itemCardWarehouseSelect"
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className={`w-full h-9 text-xs sm:text-[13px] rounded-lg px-3 border outline-none font-medium transition-colors shadow-2xs cursor-pointer ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-300 text-slate-800 focus:border-[#1565C0]'
                }`}
              >
                {branchWarehouses.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
                {branchWarehouses.length === 0 && (
                  <option value="مخزن العجمي">مخزن العجمي</option>
                )}
                <option value="جميع مخازن الفرع">جميع مخازن الفرع</option>
              </select>
            </div>

            {/* 3. التاريخ: نفس منطق تقرير أرصدة الأصناف (تاريخ اليوم من الجهاز + خيار خلال فترة) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between h-4">
                <div className="flex items-center space-x-1.5 space-x-reverse">
                  <input 
                    type="checkbox" 
                    id="enablePeriodCheckbox"
                    checked={isPeriodEnabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsPeriodEnabled(checked);
                      if (!checked) {
                        setStartDate(todayDate);
                        setEndDate(todayDate);
                        setDateError(null);
                      }
                    }}
                    className="w-3.5 h-3.5 text-[#1565C0] rounded cursor-pointer border-slate-300 focus:ring-[#1565C0] accent-[#1565C0]" 
                  />
                  <label htmlFor="enablePeriodCheckbox" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    خلال فترة
                  </label>
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {!isPeriodEnabled ? 'تاريخ اليوم (الجهاز)' : 'الفترة الزمنية'}
                </span>
              </div>

              {!isPeriodEnabled ? (
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
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input 
                      type="date"
                      value={startDate}
                      max={endDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      title="من تاريخ"
                      aria-label="من تاريخ"
                      className={`w-full h-9 text-xs sm:text-[12px] rounded-lg pl-6 pr-2 border font-mono outline-none transition-all shadow-2xs ${
                        isDark ? 'bg-slate-850 border-blue-500 text-slate-100 ring-1 ring-blue-500/20' : 'bg-white border-[#1565C0] text-slate-800 ring-1 ring-[#1565C0]/20'
                      }`}
                    />
                    <Calendar className="w-3.5 h-3.5 text-[#1565C0] dark:text-blue-400 absolute left-1.5 top-2.5 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <input 
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => handleEndDateChange(e.target.value)}
                      title="إلى تاريخ"
                      aria-label="إلى تاريخ"
                      className={`w-full h-9 text-xs sm:text-[12px] rounded-lg pl-6 pr-2 border font-mono outline-none transition-all shadow-2xs ${
                        isDark ? 'bg-slate-850 border-blue-500 text-slate-100 ring-1 ring-blue-500/20' : 'bg-white border-[#1565C0] text-slate-800 ring-1 ring-[#1565C0]/20'
                      }`}
                    />
                    <Calendar className="w-3.5 h-3.5 text-[#1565C0] dark:text-blue-400 absolute left-1.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* تنبيه خطأ التاريخ إن وجد */}
          {dateError && (
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-2 h-2 rounded-full bg-rose-600 dark:bg-rose-400 shrink-0" />
                <span>{dateError}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setDateError(null)} 
                className="text-rose-500 hover:text-rose-800 dark:hover:text-rose-200 font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* زر عرض التقرير في المنتصف أسفل الفلاتر */}
          <div className="flex flex-col items-center justify-center pt-1">
            <button 
              type="button"
              id="itemCardExecuteReportBtn"
              onClick={handleExecuteReport}
              disabled={isExecuting}
              className={`h-9 px-8 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center space-x-2 space-x-reverse min-w-[190px] sm:min-w-[220px] cursor-pointer ${
                isExecuting 
                  ? 'bg-blue-800 opacity-80 cursor-wait text-white' 
                  : hasFilterChanges
                    ? 'bg-[#1565C0] hover:bg-[#0D47A1] text-white ring-4 ring-blue-400/30 shadow-md'
                    : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white hover:shadow-md'
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
                <span>تم تعديل الخيارات أو الصنف — اضغط للعرض والتحديث</span>
              </p>
            )}
          </div>
        </div>

        {/* Results Area: Renders empty prompt before execution, and vertical professional report after execution */}
        {!hasExecuted || !executedFilters.product ? (
          <div className={`flex-1 border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center my-4 ${
            isDark ? 'border-slate-800 bg-slate-900/40' : 'border-slate-300 bg-white'
          }`}>
            {!selectedProduct ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-[#1565C0] dark:text-blue-400 mb-4 border border-blue-200 dark:border-blue-800 shadow-xs">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  لم يتم اختيار صنف بعد
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
                  حقل الصنف فارغ حالياً. يرجى اختيار صنف من قائمة الأصناف أولاً، ثم الضغط على زر <strong className="text-[#1565C0] dark:text-blue-400">«عرض التقرير»</strong> لاستعراض كارتة الصنف.
                </p>
                <button
                  type="button"
                  id="itemCardEmptySelectBtn"
                  onClick={() => setIsItemModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center space-x-2 space-x-reverse"
                >
                  <Search className="w-4 h-4" />
                  <span>اختيار صنف الآن</span>
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
                  تم تحديد الصنف: {selectedProduct.name}
                </h3>
                <div className="flex items-center justify-center space-x-2 space-x-reverse text-xs font-mono text-blue-700 dark:text-blue-300 font-bold mb-3">
                  <span>كود: {selectedProduct.code}</span>
                  <span>•</span>
                  <span>الوحدة: {selectedProduct.unit}</span>
                  <span>•</span>
                  <span>المخزن: {selectedWarehouse}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed mb-6">
                  اضغط على زر <strong className="text-[#1565C0] dark:text-blue-400">«عرض التقرير»</strong> لاستخراج وعرض كارتة الصنف المخزنية وسجل الحركات والإجماليات.
                </p>
                <button
                  type="button"
                  id="itemCardExecuteReportPromptBtn"
                  onClick={handleExecuteReport}
                  disabled={isExecuting}
                  className="px-8 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center space-x-2 space-x-reverse"
                >
                  {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>{isExecuting ? 'جاري الاستخراج...' : 'عرض التقرير الآن'}</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-3 pb-8">
            {/* Quick Actions & Live Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="relative w-full sm:w-80">
                <input 
                  type="text"
                  id="itemCardSearchInput"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث سريع برقم المستند أو الجهة أو التاريخ..."
                  className={`w-full text-xs rounded-lg pl-14 pr-3 py-2 border outline-none font-medium ${
                    isDark 
                      ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-400 focus:border-blue-500' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-[#1565C0]'
                  }`}
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-slate-400 hover:text-slate-600 absolute left-2.5 top-2 cursor-pointer"
                  >
                    مسح
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 space-x-reverse text-xs font-semibold self-end sm:self-center">
                <span className="text-slate-500 dark:text-slate-400">
                  عدد الحركات: <strong className="text-blue-700 dark:text-blue-400 font-mono">{filteredMovements.length}</strong>
                </span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(true)}
                  className="flex items-center space-x-1 space-x-reverse px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  title="معاينة قبل الطباعة"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  <span>معاينة الطباعة</span>
                </button>
              </div>
            </div>

            {/* Vertical Professional Item Card Sheet (مطابق للصورة المرجعية تماماً) */}
            <div className="flex justify-center w-full">
              <div 
                id="item-card-printable-area" 
                className={`w-full max-w-4xl rounded-xl border p-5 sm:p-7 shadow-xs font-sans text-right transition-colors ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {/* Central Unified VERTEX Report Header */}
                <VertexReportHeader
                  companyName={companyName}
                  systemSubtitle={`نظام إدارة المخازن والمستودعات — الفرع: ${currentBranchName}`}
                  reportTitle="تقرير كارتة صنف"
                  reportSubtitle={executedFilters.reportType === 'by_prices' ? 'بالأسعار والتكلفة' : 'بالكميات'}
                  themeColor="teal"
                  isDark={isDark}
                  metadataItems={[
                    { label: 'اسم الصنف', value: executedFilters.product.name, highlight: 'teal' },
                    { label: 'كود الصنف', value: executedFilters.product.code, isMono: true, highlight: 'blue' },
                    { label: 'المخزن', value: executedFilters.warehouse },
                    { label: 'الفرع', value: currentBranchName },
                    { label: 'الوحدة', value: executedFilters.product.unit },
                    { label: 'المجموعة', value: executedFilters.product.category || 'عام' },
                    {
                      label: 'نطاق التاريخ',
                      value: executedFilters.isPeriodEnabled 
                        ? `من: ${executedFilters.startDate} إلى: ${executedFilters.endDate}`
                        : `تاريخ اليوم: ${todayDate}`,
                      isMono: true
                    }
                  ]}
                />

                {/* 2. Movements Table (رأسي، احترافي، أعمدة محددة ومنظمة) */}
                <div className="overflow-x-auto mb-4 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs">
                  <table className="w-full text-xs text-right border-collapse select-text">
                    <thead>
                      <tr className="bg-slate-900 text-white font-bold text-[11px] sm:text-xs">
                        <th className="py-2 px-2 text-center border-r border-slate-700 w-10">م</th>
                        <th className="py-2 px-2.5 text-center border-r border-slate-700">رقم المستند</th>
                        <th className="py-2 px-2.5 text-center border-r border-slate-700">التاريخ</th>
                        <th className="py-2 px-3 text-center border-r border-slate-700">النوع</th>
                        <th className="py-2 px-3 text-right border-r border-slate-700">الجهة</th>
                        <th className="py-2 px-3 text-center border-r border-slate-700 bg-emerald-950/80 text-emerald-300">الوارد</th>
                        <th className="py-2 px-3 text-center border-r border-slate-700 bg-rose-950/80 text-rose-300">المنصرف</th>
                        <th className="py-2 px-3 text-center border-r border-slate-700 bg-blue-950/80 text-blue-300">رصيد الكمية</th>
                        {executedFilters.reportType === 'by_prices' && (
                          <th className="py-2 px-3 text-center bg-amber-950/80 text-amber-300">السعر</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px] sm:text-xs">
                      {filteredMovements.length === 0 ? (
                        <tr>
                          <td colSpan={executedFilters.reportType === 'by_prices' ? 9 : 8} className="py-8 text-center text-slate-500">
                            لا توجد حركات مسجلة لهذا الصنف تطابق شروط الفلترة المحددة.
                          </td>
                        </tr>
                      ) : (
                        filteredMovements.map((m) => (
                          <tr 
                            key={m.id}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                              m.type.includes('رصيد') ? (isDark ? 'bg-blue-950/20' : 'bg-blue-50/30') : ''
                            }`}
                          >
                            <td className="py-2 px-2 text-center text-slate-400 font-mono border-r border-slate-200 dark:border-slate-800">{m.id}</td>
                            <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">{m.docNum}</td>
                            <td className="py-2 px-2.5 text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{m.date}</td>
                            <td className="py-2 px-3 text-center border-r border-slate-200 dark:border-slate-800">
                              <span className={`font-bold ${m.typeColor}`}>{m.type}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                              {m.entity || m.notes || '-'}
                            </td>
                            {/* الوارد: تمييز بخلفية خضراء هادئة وأرقام واضحة */}
                            <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 border-r border-slate-200 dark:border-slate-800">
                              {m.inQty !== null ? formatNumber(m.inQty) : '-'}
                            </td>
                            {/* المنصرف: تمييز بخلفية حمراء هادئة وأرقام واضحة */}
                            <td className="py-2 px-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20 border-r border-slate-200 dark:border-slate-800">
                              {m.outQty !== null ? formatNumber(m.outQty) : '-'}
                            </td>
                            {/* رصيد الكمية: خط عريض أزرق داكن ومميز */}
                            <td className="py-2 px-3 text-center font-mono font-black text-blue-800 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/20 border-r border-slate-200 dark:border-slate-800">
                              {formatNumber(m.balQty)}
                            </td>
                            {/* السعر إن كان بالأسعار: أرقام حمراء بارزة كما في المرجع */}
                            {executedFilters.reportType === 'by_prices' && (
                              <td className="py-2 px-3 text-center font-mono font-bold text-rose-600 dark:text-rose-400">
                                {m.inPrice ? formatNumber(m.inPrice) : m.outPrice ? formatNumber(m.outPrice) : formatNumber(m.balAvgCost)}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Bottom Summary Box (مطابق لخانة بالعدد والإجماليات في الصورة المرجعية) */}
                <div className="border border-slate-300 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-850 mb-5">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center justify-between">
                    <span>بالعدد (إجماليات حركة الصنف)</span>
                    <span className="text-[11px] font-normal text-slate-500">الوحدة: {executedFilters.product.unit}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">اجمالي الوارد</div>
                      <div className="text-base sm:text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {formatNumber(totalInQty)}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">اجمالي الصادر</div>
                      <div className="text-base sm:text-lg font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                        {formatNumber(totalOutQty)}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">رصيد الكمية</div>
                      <div className="text-base sm:text-lg font-mono font-black text-blue-800 dark:text-blue-300 mt-0.5">
                        {formatNumber(finalBalanceQty)}
                      </div>
                    </div>
                  </div>

                  {/* في حالة التقرير بالأسعار: عرض الملخص المالي */}
                  {executedFilters.reportType === 'by_prices' && (
                    <div className="grid grid-cols-3 gap-3 text-center mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[11px] text-slate-500">قيمة الوارد: </span>
                        <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">{formatNumber(totalInValue)} ج.م</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">قيمة الصادر: </span>
                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">{formatNumber(totalOutValue)} ج.م</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">قيمة الرصيد: </span>
                        <span className="text-xs font-mono font-black text-blue-800 dark:text-blue-300">{formatNumber(finalBalanceValue)} ج.م</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Signatures (اعتمده / أعده) */}
                <div className="pt-4 border-t border-slate-300 dark:border-slate-700 flex items-center justify-around text-xs font-bold text-slate-700 dark:text-slate-300">
                  <div className="text-center">
                    <div className="mb-6">اعتمده</div>
                    <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-1 font-mono text-[11px] text-slate-400">
                      ....................
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-6">أعده</div>
                    <div className="border-t border-dashed border-slate-400 dark:border-slate-600 pt-1 font-mono text-[11px] text-slate-400">
                      ....................
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Item Selection & Search Modal - Point 1 */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className={`w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-blue-900 text-white">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Package className="w-5 h-5 text-blue-300" />
                <span className="font-bold text-base">بحث واختيار صنف لكارتة الصنف</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-800 text-blue-200 font-mono">
                  ({modalFilteredProducts.length} صنف متاح)
                </span>
              </div>
              <button 
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="p-1 rounded-lg hover:bg-blue-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Controls */}
            <div className={`p-4 border-b space-y-3 ${
              isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                  <input 
                    type="text"
                    value={modalItemSearch}
                    onChange={(e) => setModalItemSearch(e.target.value)}
                    placeholder="ابحث باسم الصنف، الكود، الباركود، أو التصنيف..."
                    autoFocus
                    className={`w-full text-xs sm:text-sm rounded-xl pl-8 pr-9 py-2 border outline-none font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-[#1565C0]'
                    }`}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  {modalItemSearch && (
                    <button 
                      type="button"
                      onClick={() => setModalItemSearch('')}
                      className="text-xs text-slate-400 hover:text-slate-600 absolute left-2.5 top-2.5"
                    >
                      مسح
                    </button>
                  )}
                </div>

                <div>
                  <select
                    value={modalSelectedCategory}
                    onChange={(e) => setModalSelectedCategory(e.target.value)}
                    className={`w-full text-xs sm:text-sm rounded-xl px-3 py-2 border outline-none font-medium ${
                      isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    <option value="all">كافة التصنيفات</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Products Table List */}
            <div className="flex-1 overflow-y-auto p-2">
              <table className="w-full text-xs sm:text-sm text-right border-collapse">
                <thead>
                  <tr className={`border-b ${isDark ? 'bg-slate-800 text-blue-300 border-slate-700' : 'bg-blue-50 text-blue-900 border-blue-100'}`}>
                    <th className="py-2.5 px-3 font-bold w-28">كود الصنف</th>
                    <th className="py-2.5 px-3 font-bold">اسم الصنف</th>
                    <th className="py-2.5 px-2 font-bold text-center w-20">الوحدة</th>
                    <th className="py-2.5 px-3 font-bold text-center w-28">الرصيد / الكمية المتاحة</th>
                    <th className="py-2.5 px-3 font-bold text-center w-24">زر اختيار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {modalFilteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        لم يتم العثور على أصناف تطابق عبارة البحث
                      </td>
                    </tr>
                  ) : (
                    modalFilteredProducts.map((prod) => {
                      const isCurrentlySelected = selectedProduct ? selectedProduct.code === prod.code : false;
                      return (
                        <tr 
                          key={prod.code}
                          onClick={() => {
                            setSelectedProduct(prod);
                            setIsItemModalOpen(false);
                          }}
                          className={`cursor-pointer transition-colors ${
                            isCurrentlySelected 
                              ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50')
                              : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700 dark:text-blue-400">
                            {prod.code}
                          </td>
                          <td className="py-2.5 px-3 font-medium">
                            {prod.name}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-500">
                            {prod.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                            {formatNumber(prod.actualBalance)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProduct(prod);
                                setIsItemModalOpen(false);
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                                isCurrentlySelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-[#1565C0] hover:bg-[#0D47A1] text-white'
                              }`}
                            >
                              {isCurrentlySelected ? 'محدد' : 'اختيار'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className={`p-3 border-t flex items-center justify-between text-xs ${
              isDark ? 'bg-slate-850 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              <span>اضغط على أي صنف لاختياره، ثم اضغط على زر «عرض التقرير» للتنفيذ</span>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300">
            {/* Modal Action Header */}
            <div className="no-print flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="font-bold text-sm">معاينة طباعة — تقرير كارتة صنف ({executedFilters.reportType === 'by_quantities' ? 'بالكميات' : 'بالأسعار'})</span>
                <span className="text-xs text-slate-400">({filteredMovements.length} حركة)</span>
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

            {/* Scoped Print Style to ensure clean printing and repeating table headers on every page */}
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 12mm 10mm;
                }
                body * {
                  visibility: hidden !important;
                }
                #item-card-printable-modal-sheet, #item-card-printable-modal-sheet * {
                  visibility: visible !important;
                }
                #item-card-printable-modal-sheet {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  border: none !important;
                  box-shadow: none !important;
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
                table {
                  page-break-inside: auto;
                  width: 100% !important;
                }
                thead {
                  display: table-header-group !important;
                }
                tfoot {
                  display: table-footer-group !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  page-break-after: auto;
                }
              }
            `}</style>

            {/* Printable Document Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100 flex justify-center">
              <div 
                id="item-card-printable-modal-sheet" 
                className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-300 text-slate-900 font-sans text-right"
              >
                {/* Central Unified VERTEX Report Header */}
                <VertexReportHeader
                  companyName={companyName}
                  systemSubtitle={`نظام إدارة المخازن والمستودعات — الفرع: ${currentBranchName}`}
                  reportTitle="تقرير كارتة صنف"
                  reportSubtitle={executedFilters.reportType === 'by_prices' ? 'بالأسعار والتكلفة' : 'بالكميات'}
                  themeColor="teal"
                  isPrintVersion={true}
                  metadataItems={[
                    { label: 'اسم الصنف', value: executedFilters.product.name, highlight: 'teal' },
                    { label: 'كود الصنف', value: executedFilters.product.code, isMono: true, highlight: 'blue' },
                    { label: 'المخزن', value: executedFilters.warehouse },
                    { label: 'الفرع', value: currentBranchName },
                    { label: 'الوحدة', value: executedFilters.product.unit },
                    { label: 'المجموعة', value: executedFilters.product.category || 'عام' },
                    {
                      label: 'نطاق التاريخ',
                      value: executedFilters.isPeriodEnabled 
                        ? `من: ${executedFilters.startDate} إلى: ${executedFilters.endDate}`
                        : `تاريخ اليوم: ${todayDate}`,
                      isMono: true
                    }
                  ]}
                />

                {/* 2. Movements Table with repeating header across printed pages */}
                <div className="overflow-x-auto border border-slate-300 rounded-lg mb-4">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead className="bg-slate-900 text-white font-bold print:table-header-group">
                      <tr className="border-b border-slate-700">
                        <th className="p-2 border border-slate-400 text-center w-10">م</th>
                        <th className="p-2 border border-slate-400 text-center w-24">رقم المستند</th>
                        <th className="p-2 border border-slate-400 text-center w-24">التاريخ</th>
                        <th className="p-2 border border-slate-400 text-center w-28">النوع</th>
                        <th className="p-2 border border-slate-400 text-right">الجهة / البيان</th>
                        <th className="p-2 border border-slate-400 text-center w-20 bg-emerald-900">الوارد</th>
                        <th className="p-2 border border-slate-400 text-center w-20 bg-rose-900">المنصرف</th>
                        <th className="p-2 border border-slate-400 text-center w-24 bg-blue-900">رصيد الكمية</th>
                        {executedFilters.reportType === 'by_prices' && (
                          <th className="p-2 border border-slate-400 text-center w-20 bg-amber-900">السعر</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMovements.length === 0 ? (
                        <tr>
                          <td colSpan={executedFilters.reportType === 'by_prices' ? 9 : 8} className="p-6 text-center text-slate-500">
                            لا توجد حركات مسجلة لهذا الصنف خلال الفترة المحددة
                          </td>
                        </tr>
                      ) : (
                        filteredMovements.map((m) => (
                          <tr key={m.id} className="border-b border-slate-200">
                            <td className="p-2 border border-slate-300 text-center font-mono">{m.id}</td>
                            <td className="p-2 border border-slate-300 text-center font-mono font-bold">{m.docNum}</td>
                            <td className="p-2 border border-slate-300 text-center font-mono">{m.date}</td>
                            <td className="p-2 border border-slate-300 text-center font-semibold">{m.type}</td>
                            <td className="p-2 border border-slate-300 text-right">{m.entity || m.notes || '-'}</td>
                            <td className="p-2 border border-slate-300 text-center font-mono font-bold text-emerald-800">
                              {m.inQty !== null ? formatNumber(m.inQty) : '-'}
                            </td>
                            <td className="p-2 border border-slate-300 text-center font-mono font-bold text-rose-700">
                              {m.outQty !== null ? formatNumber(m.outQty) : '-'}
                            </td>
                            <td className="p-2 border border-slate-300 text-center font-mono font-black text-blue-900">
                              {formatNumber(m.balQty)}
                            </td>
                            {executedFilters.reportType === 'by_prices' && (
                              <td className="p-2 border border-slate-300 text-center font-mono font-bold text-amber-900">
                                {m.inPrice ? formatNumber(m.inPrice) : m.outPrice ? formatNumber(m.outPrice) : formatNumber(m.balAvgCost)}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 3. Bottom Summary Box (مطابق لخانة بالعدد والإجماليات في الـPDF) */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 mb-5">
                  <div className="text-xs font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1 flex items-center justify-between">
                    <span>بالعدد (إجماليات حركة الصنف)</span>
                    <span className="text-[11px] font-normal text-slate-500">الوحدة: {executedFilters.product.unit}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded bg-white border border-emerald-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">اجمالي الوارد</div>
                      <div className="text-base sm:text-lg font-mono font-bold text-emerald-700 mt-0.5">
                        {formatNumber(totalInQty)}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-white border border-rose-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">اجمالي الصادر</div>
                      <div className="text-base sm:text-lg font-mono font-bold text-rose-600 mt-0.5">
                        {formatNumber(totalOutQty)}
                      </div>
                    </div>

                    <div className="p-2 rounded bg-white border border-blue-200 shadow-2xs">
                      <div className="text-[11px] font-semibold text-slate-500">رصيد الكمية</div>
                      <div className="text-base sm:text-lg font-mono font-black text-blue-800 mt-0.5">
                        {formatNumber(finalBalanceQty)}
                      </div>
                    </div>
                  </div>

                  {/* في حالة التقرير بالأسعار: عرض الملخص المالي */}
                  {executedFilters.reportType === 'by_prices' && (
                    <div className="grid grid-cols-3 gap-3 text-center mt-2.5 pt-2.5 border-t border-slate-200">
                      <div>
                        <span className="text-[11px] text-slate-500">قيمة الوارد: </span>
                        <span className="text-xs font-mono font-bold text-emerald-700">{formatNumber(totalInValue)} ج.م</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">قيمة الصادر: </span>
                        <span className="text-xs font-mono font-bold text-rose-600">{formatNumber(totalOutValue)} ج.م</span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500">قيمة الرصيد: </span>
                        <span className="text-xs font-mono font-black text-blue-800">{formatNumber(finalBalanceValue)} ج.م</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Signatures (فقط اعتمده / أعده) */}
                <div className="pt-4 border-t border-slate-300 flex items-center justify-around text-xs font-bold text-slate-700">
                  <div className="text-center">
                    <div className="mb-6">اعتمده</div>
                    <div className="border-t border-dashed border-slate-400 pt-1 font-mono text-[11px] text-slate-400">
                      ....................
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="mb-6">أعده</div>
                    <div className="border-t border-dashed border-slate-400 pt-1 font-mono text-[11px] text-slate-400">
                      ....................
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
