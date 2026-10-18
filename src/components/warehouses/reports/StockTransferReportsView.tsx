import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Building2,
  Search,
  RotateCcw,
  ArrowRight,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  X,
  Layers,
  Boxes,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Check
} from 'lucide-react';
import XLSXStyle from 'xlsx-js-style';
const XLSX = (XLSXStyle as any).default || XLSXStyle;
import { warehouseService, Warehouse } from '../../../services/warehouseService';
import { stockTransferService, StockTransferRecord, StockTransferItem } from '../../../services/stockTransferService';
import { setupWizardService } from '../../../services/setupWizardService';
import { themeService, ThemeMode } from '../../../services/themeService';
import { ReportSortHeaderCell, SortDirection } from '../../reports/ReportSortHeaderCell';
import { exportVertexReportToPdf, printVertexReport } from '../../../utils/vertexReportRenderer';

export type TransferReportType = 'issue' | 'receipt' | 'pending';

export interface StockTransferReportsViewProps {
  isDark?: boolean;
  initialReportType?: TransferReportType;
  onClose?: () => void;
}

interface FilterState {
  reportType: TransferReportType;
  fromWarehouseId: string;
  toWarehouseId: string;
  fromDate: string;
  toDate: string;
  searchQuery: string;
}

export const StockTransferReportsView: React.FC<StockTransferReportsViewProps> = ({
  isDark: propIsDark,
  initialReportType = 'issue',
  onClose
}) => {
  // Theme sync
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => themeService.getTheme());
  useEffect(() => {
    const unsub = themeService.subscribe(t => setThemeMode(t));
    return () => unsub();
  }, []);
  const isDark = propIsDark !== undefined ? propIsDark : themeMode === 'dark';

  // Company Name
  const companyName = useMemo(() => {
    try {
      const cfg = setupWizardService.getConfig();
      return cfg?.companyName || 'داتا اليكس للتوريدات العمومية';
    } catch {
      return 'داتا اليكس للتوريدات العمومية';
    }
  }, []);

  // System Warehouses
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => warehouseService.getActiveWarehouses());

  // System Transfers Data
  const [transfers, setTransfers] = useState<StockTransferRecord[]>(() => stockTransferService.getAllTransfers());

  useEffect(() => {
    const unsubWarehouse = warehouseService.subscribe(() => {
      setWarehouses(warehouseService.getActiveWarehouses());
    });
    const unsubTransfers = stockTransferService.subscribe(() => {
      setTransfers(stockTransferService.getAllTransfers());
    });
    return () => {
      unsubWarehouse();
      unsubTransfers();
    };
  }, []);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    reportType: initialReportType,
    fromWarehouseId: 'all',
    toWarehouseId: 'all',
    fromDate: '',
    toDate: '',
    searchQuery: ''
  });

  // Keep report type in sync if prop changes
  useEffect(() => {
    if (initialReportType) {
      setFilters(prev => ({ ...prev, reportType: initialReportType }));
    }
  }, [initialReportType]);

  // Snapshot of applied filters (only updated when user clicks "عرض التقرير")
  const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);

  // Requirement: "عند فتح الشاشة لا تعرض نتائج حتى يضغط المستخدم «عرض التقرير»"
  const [hasExecuted, setHasExecuted] = useState<boolean>(false);

  // Selected transfer record for details modal
  const [selectedTransferForDetails, setSelectedTransferForDetails] = useState<StockTransferRecord | null>(null);

  // Print Preview Modal State
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState<boolean>(false);

  // PDF Export loading state
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Toast / notification feedback
  const [notification, setNotification] = useState<string | null>(null);

  // Today date formatted
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Warehouse labels for filters display
  const fromWarehouseLabel = useMemo(() => {
    if (!appliedFilters || appliedFilters.fromWarehouseId === 'all') return 'جميع المخازن (الكل)';
    const found = warehouses.find(w => w.id === appliedFilters.fromWarehouseId);
    return found ? found.name : appliedFilters.fromWarehouseId;
  }, [appliedFilters, warehouses]);

  const toWarehouseLabel = useMemo(() => {
    if (!appliedFilters || appliedFilters.toWarehouseId === 'all') return 'جميع المخازن (الكل)';
    const found = warehouses.find(w => w.id === appliedFilters.toWarehouseId);
    return found ? found.name : appliedFilters.toWarehouseId;
  }, [appliedFilters, warehouses]);

  // Sorting State
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Sorting Handler: 3-state (asc -> desc -> null)
  const handleSort = (key: string) => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      setSortDirection('desc');
    } else {
      setSortKey(null);
      setSortDirection(null);
    }
  };

  // Execution: Click "عرض التقرير"
  const handleExecuteReport = () => {
    setAppliedFilters({ ...filters });
    setHasExecuted(true);
  };

  // Reset Filters
  const handleResetFilters = () => {
    const resetState: FilterState = {
      reportType: filters.reportType,
      fromWarehouseId: 'all',
      toWarehouseId: 'all',
      fromDate: '',
      toDate: '',
      searchQuery: ''
    };
    setFilters(resetState);
    if (hasExecuted) {
      setAppliedFilters(resetState);
    }
  };

  // Compute Filtered & Sorted Transfers
  const displayedTransfers = useMemo(() => {
    if (!hasExecuted || !appliedFilters) return [];

    let result = transfers.filter(record => {
      // 1. Report Type Filter
      if (appliedFilters.reportType === 'pending') {
        if (record.status !== 'معلق') return false;
      } else if (appliedFilters.reportType === 'receipt') {
        // Receipt reports show received/completed transfers or items with receiptNumber
        if (record.status !== 'مكتمل' && !record.receiptNumber) return false;
      } else {
        // Issue report shows issue notes (all transfers originate from issue)
        // Kept visible for all issue operations
      }

      // 2. From Warehouse Filter
      if (appliedFilters.fromWarehouseId !== 'all') {
        if (record.fromWarehouseId !== appliedFilters.fromWarehouseId) return false;
      }

      // 3. To Warehouse Filter
      if (appliedFilters.toWarehouseId !== 'all') {
        if (record.toWarehouseId !== appliedFilters.toWarehouseId) return false;
      }

      // 4. From Date Filter
      if (appliedFilters.fromDate && record.date < appliedFilters.fromDate) {
        return false;
      }

      // 5. To Date Filter
      if (appliedFilters.toDate && record.date > appliedFilters.toDate) {
        return false;
      }

      // 6. Search by Voucher Number or general query
      if (appliedFilters.searchQuery.trim()) {
        const q = appliedFilters.searchQuery.trim().toLowerCase();
        const matchesTransferNum = (record.transferNumber || '').toLowerCase().includes(q);
        const matchesReceiptNum = (record.receiptNumber || '').toLowerCase().includes(q);
        const matchesFrom = (record.fromWarehouseName || '').toLowerCase().includes(q);
        const matchesTo = (record.toWarehouseName || '').toLowerCase().includes(q);
        const matchesNotes = (record.notes || '').toLowerCase().includes(q);
        const matchesItems = record.items?.some(
          it =>
            (it.productName || '').toLowerCase().includes(q) ||
            (it.productCode || '').toLowerCase().includes(q)
        );

        if (
          !matchesTransferNum &&
          !matchesReceiptNum &&
          !matchesFrom &&
          !matchesTo &&
          !matchesNotes &&
          !matchesItems
        ) {
          return false;
        }
      }

      return true;
    });

    // Apply Sorting
    if (sortKey && sortDirection) {
      result = [...result].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        switch (sortKey) {
          case 'docNumber':
            valA = appliedFilters.reportType === 'receipt' ? a.receiptNumber || a.transferNumber : a.transferNumber;
            valB = appliedFilters.reportType === 'receipt' ? b.receiptNumber || b.transferNumber : b.transferNumber;
            break;
          case 'date':
            valA = a.date || '';
            valB = b.date || '';
            break;
          case 'fromWarehouse':
            valA = a.fromWarehouseName || '';
            valB = b.fromWarehouseName || '';
            break;
          case 'toWarehouse':
            valA = a.toWarehouseName || '';
            valB = b.toWarehouseName || '';
            break;
          case 'totalItems':
            valA = a.totalItems || 0;
            valB = b.totalItems || 0;
            break;
          case 'totalQuantity':
            valA = a.totalQuantity || 0;
            valB = b.totalQuantity || 0;
            break;
          case 'status':
            valA = a.status || '';
            valB = b.status || '';
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [transfers, hasExecuted, appliedFilters, sortKey, sortDirection]);

  // Totals for Summary
  const summaryTotals = useMemo(() => {
    const totalDocs = displayedTransfers.length;
    const totalQty = displayedTransfers.reduce((sum, tr) => sum + (tr.totalQuantity || 0), 0);
    const totalItemRows = displayedTransfers.reduce((sum, tr) => sum + (tr.totalItems || 0), 0);
    const pendingCount = displayedTransfers.filter(tr => tr.status === 'معلق').length;
    const completedCount = displayedTransfers.filter(tr => tr.status === 'مكتمل').length;

    return { totalDocs, totalQty, totalItemRows, pendingCount, completedCount };
  }, [displayedTransfers]);

  // Report Label based on Report Type
  const reportTypeLabels: Record<TransferReportType, { title: string; desc: string; badgeColor: string }> = {
    issue: {
      title: 'تقرير الصرف',
      desc: 'سجل أذون صرف البضائع المحولة بين المخازن والمستودعات',
      badgeColor: 'bg-blue-500'
    },
    receipt: {
      title: 'تقرير الإضافة',
      desc: 'سجل أذون إضافة البضائع المستلمة والمكتمل تحويلها',
      badgeColor: 'bg-emerald-500'
    },
    pending: {
      title: 'تقرير التحويلات المعلقة',
      desc: 'حركات التحويل المخزني الجارية بانتظار الاستلام وتأكيد إذن الإضافة',
      badgeColor: 'bg-amber-500'
    }
  };

  const currentReportMeta = reportTypeLabels[filters.reportType];

  // Export to Excel handler (Professional Form matching approved VERTEX reports)
  const handleExportExcel = () => {
    if (displayedTransfers.length === 0) return;

    try {
      const defaultFont = 'Segoe UI';
      const numCols = 10;
      const lastColIdx = numCols - 1;

      // -------------------------------------------------------------
      // SHEET 1: ملخص التحويلات المخزنية
      // -------------------------------------------------------------
      const ws: Record<string, any> = {};
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const rows: { hpt: number }[] = [];
      let currentRow = 0;

      const setCell = (r: number, c: number, val: any, type?: string, style?: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        ws[addr] = {
          v: val ?? '',
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

      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      const borderDoubleBottom = {
        top: { style: 'thin', color: { rgb: '94A3B8' } },
        bottom: { style: 'double', color: { rgb: '0F172A' } },
        left: { style: 'thin', color: { rgb: '94A3B8' } },
        right: { style: 'thin', color: { rgb: '94A3B8' } }
      };

      // 1. الشركة والعنوان الرئيسي
      mergeAndStyle(currentRow, 0, currentRow, 4, companyName, 's', {
        font: { name: defaultFont, bold: true, sz: 14, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '0F172A' } },
          right: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } }
        }
      });

      mergeAndStyle(currentRow, 5, currentRow, lastColIdx, `تقارير التحويلات المخزنية — ${currentReportMeta.title}`, 's', {
        font: { name: defaultFont, bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1565C0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '0D47A1' } },
          left: { style: 'medium', color: { rgb: '0D47A1' } },
          bottom: { style: 'thin', color: { rgb: '0D47A1' } }
        }
      });
      rows.push({ hpt: 30 });
      currentRow++;

      // 2. سطر النظام وتاريخ الاستخراج
      mergeAndStyle(currentRow, 0, currentRow, 4, 'نظام فيرتكس لإدارة المخازن والمستودعات', 's', {
        font: { name: defaultFont, bold: false, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          right: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } }
        }
      });

      mergeAndStyle(currentRow, 5, currentRow, lastColIdx, `تاريخ استخراج التقرير: ${todayDate}`, 's', {
        font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '1E293B' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          left: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } }
        }
      });
      rows.push({ hpt: 20 });
      currentRow++;

      // فاصل
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // 3. صندوق معايير الفلترة والإجماليات (Metadata Box)
      const lblStyle = {
        font: { name: defaultFont, bold: true, sz: 9.5, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      };
      const valStyle = {
        font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      };

      // السطر 1: نوع التقرير + نطاق المخازن
      mergeAndStyle(currentRow, 0, currentRow, 1, 'نوع التقرير:', 's', lblStyle);
      mergeAndStyle(currentRow, 2, currentRow, 4, currentReportMeta.title, 's', {
        ...valStyle,
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '1565C0' } }
      });
      mergeAndStyle(currentRow, 5, currentRow, 6, 'نطاق المخازن:', 's', lblStyle);
      mergeAndStyle(currentRow, 7, currentRow, lastColIdx, `من: ${fromWarehouseLabel}  ⟵  إلى: ${toWarehouseLabel}`, 's', valStyle);
      rows.push({ hpt: 22 });
      currentRow++;

      // السطر 2: الفترة الزمنية + عدد المستندات
      mergeAndStyle(currentRow, 0, currentRow, 1, 'الفترة الزمنية:', 's', lblStyle);
      const periodStr = appliedFilters?.fromDate || appliedFilters?.toDate
        ? `من ${appliedFilters?.fromDate || 'البداية'} إلى ${appliedFilters?.toDate || 'اليوم'}`
        : 'كافة الفترات المسجلة';
      mergeAndStyle(currentRow, 2, currentRow, 4, periodStr, 's', valStyle);
      mergeAndStyle(currentRow, 5, currentRow, 6, 'إجمالي المستندات:', 's', lblStyle);
      mergeAndStyle(currentRow, 7, currentRow, lastColIdx, `${summaryTotals.totalDocs} مستند (${summaryTotals.pendingCount} معلق • ${summaryTotals.completedCount} مكتمل)`, 's', valStyle);
      rows.push({ hpt: 22 });
      currentRow++;

      // السطر 3: إجمالي الكميات + إجمالي الأصناف
      mergeAndStyle(currentRow, 0, currentRow, 1, 'إجمالي الكميات:', 's', lblStyle);
      mergeAndStyle(currentRow, 2, currentRow, 4, `${summaryTotals.totalQty} وحدة`, 's', {
        ...valStyle,
        font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '047857' } }
      });
      mergeAndStyle(currentRow, 5, currentRow, 6, 'إجمالي عدد الأصناف:', 's', lblStyle);
      mergeAndStyle(currentRow, 7, currentRow, lastColIdx, `${summaryTotals.totalItemRows} صنف مسجل`, 's', {
        ...valStyle,
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '1565C0' } }
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // فاصل
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 10 });
      currentRow++;

      // 4. ترويسة جدول التحويلات
      const headers = [
        'م',
        'رقم إذن الصرف',
        'إذن الإضافة المقابل',
        'التاريخ',
        'مخزن المصدر (من)',
        'مخزن الوجهة (إلى)',
        'عدد الأصناف',
        'إجمالي الكمية',
        'الحالة',
        'ملاحظات وبيان المستند'
      ];

      const thStyle = {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1565C0' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderThin
      };

      headers.forEach((h, colIdx) => {
        setCell(currentRow, colIdx, h, 's', thStyle);
      });
      rows.push({ hpt: 28 });
      currentRow++;

      // 5. صفوف البيانات
      displayedTransfers.forEach((tr, idx) => {
        const isPending = tr.status === 'معلق';
        const rowBg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
        const cellBase = {
          font: { name: defaultFont, sz: 10, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: rowBg } },
          border: borderThin,
          alignment: { horizontal: 'center', vertical: 'center' }
        };

        // م
        setCell(currentRow, 0, idx + 1, 'n', {
          ...cellBase,
          font: { name: defaultFont, bold: true, sz: 9.5, color: { rgb: '64748B' } }
        });

        // رقم إذن الصرف
        setCell(currentRow, 1, tr.transferNumber, 's', {
          ...cellBase,
          font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '1565C0' } }
        });

        // إذن الإضافة المقابل
        setCell(currentRow, 2, tr.receiptNumber || '—', 's', {
          ...cellBase,
          font: {
            name: defaultFont,
            bold: !!tr.receiptNumber,
            sz: 10,
            color: { rgb: tr.receiptNumber ? '047857' : '94A3B8' }
          }
        });

        // التاريخ
        setCell(currentRow, 3, tr.date, 's', cellBase);

        // مخزن المصدر
        setCell(currentRow, 4, tr.fromWarehouseName, 's', {
          ...cellBase,
          font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0F172A' } }
        });

        // مخزن الوجهة
        setCell(currentRow, 5, tr.toWarehouseName, 's', {
          ...cellBase,
          font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0F172A' } }
        });

        // عدد الأصناف
        setCell(currentRow, 6, tr.totalItems, 'n', {
          ...cellBase,
          font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '334155' } }
        });

        // إجمالي الكمية
        setCell(currentRow, 7, tr.totalQuantity, 'n', {
          ...cellBase,
          font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '0F172A' } }
        });

        // الحالة
        setCell(currentRow, 8, tr.status, 's', {
          ...cellBase,
          font: {
            name: defaultFont,
            bold: true,
            sz: 10,
            color: { rgb: isPending ? 'B45309' : '047857' }
          },
          fill: { fgColor: { rgb: isPending ? 'FEF3C7' : 'D1FAE5' } }
        });

        // ملاحظات
        setCell(currentRow, 9, tr.notes || '', 's', {
          ...cellBase,
          alignment: { horizontal: 'right', vertical: 'center' }
        });

        rows.push({ hpt: 22 });
        currentRow++;
      });

      // 6. سطر الإجماليات الختامي
      const totalFooterStyle = {
        font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'DBEAFE' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderDoubleBottom
      };

      mergeAndStyle(currentRow, 0, currentRow, 5, `الإجمالي العام للتقرير (${summaryTotals.totalDocs} مستند)`, 's', {
        ...totalFooterStyle,
        alignment: { horizontal: 'right', vertical: 'center' }
      });

      setCell(currentRow, 6, summaryTotals.totalItemRows, 'n', totalFooterStyle);
      setCell(currentRow, 7, summaryTotals.totalQty, 'n', {
        ...totalFooterStyle,
        font: { name: defaultFont, bold: true, sz: 12, color: { rgb: '1565C0' } }
      });
      mergeAndStyle(currentRow, 8, currentRow, 9, `المعلق: ${summaryTotals.pendingCount}  |  المكتمل: ${summaryTotals.completedCount}`, 's', {
        ...totalFooterStyle,
        font: { name: defaultFont, bold: true, sz: 9.5, color: { rgb: '1E3A8A' } }
      });

      rows.push({ hpt: 26 });
      currentRow++;

      // سطر فاصل
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 14 });
      currentRow++;

      // 7. خانات التوقيع والاعتماد الرسمية
      const sigHeaderStyle = {
        font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '334155' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      };
      const sigBoxStyle = {
        font: { name: defaultFont, sz: 9.5, color: { rgb: '94A3B8' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'bottom' },
        border: borderThin
      };

      mergeAndStyle(currentRow, 0, currentRow, 2, 'منظم التقرير', 's', sigHeaderStyle);
      mergeAndStyle(currentRow, 3, currentRow, 4, 'أمين المخزن', 's', sigHeaderStyle);
      mergeAndStyle(currentRow, 5, currentRow, 7, 'مدير إدارة المخازن', 's', sigHeaderStyle);
      mergeAndStyle(currentRow, 8, currentRow, 9, 'الاعتماد المالي والإداري', 's', sigHeaderStyle);
      rows.push({ hpt: 22 });
      currentRow++;

      mergeAndStyle(currentRow, 0, currentRow, 2, 'التوقيع: .....................', 's', sigBoxStyle);
      mergeAndStyle(currentRow, 3, currentRow, 4, 'التوقيع: .....................', 's', sigBoxStyle);
      mergeAndStyle(currentRow, 5, currentRow, 7, 'التوقيع: .....................', 's', sigBoxStyle);
      mergeAndStyle(currentRow, 8, currentRow, 9, 'الاعتماد: .....................', 's', sigBoxStyle);
      rows.push({ hpt: 40 });

      // ضبط نطاق البيانات وأحجام الأعمدة والخصائص لـ Sheet 1
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: currentRow, c: lastColIdx } });
      ws['!merges'] = merges;
      ws['!rows'] = rows;
      ws['!cols'] = [
        { wch: 6 },   // 0: م
        { wch: 18 },  // 1: رقم إذن الصرف
        { wch: 18 },  // 2: إذن الإضافة المقابل
        { wch: 14 },  // 3: التاريخ
        { wch: 22 },  // 4: مخزن المصدر
        { wch: 22 },  // 5: مخزن الوجهة
        { wch: 12 },  // 6: عدد الأصناف
        { wch: 15 },  // 7: إجمالي الكمية
        { wch: 14 },  // 8: الحالة
        { wch: 30 }   // 9: الملاحظات
      ];
      ws['!views'] = [{ rightToLeft: true, RTL: true }];

      // -------------------------------------------------------------
      // SHEET 2: جدول تفاصيل الأصناف المحولة كاملًا
      // -------------------------------------------------------------
      const wsDetails: Record<string, any> = {};
      const merges2: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const rows2: { hpt: number }[] = [];
      let rowD = 0;
      const lastColD = 10;

      const setCellD = (r: number, c: number, val: any, type?: string, style?: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        wsDetails[addr] = {
          v: val ?? '',
          t: type || (typeof val === 'number' ? 'n' : 's')
        };
        if (style) wsDetails[addr].s = style;
      };

      const mergeAndStyleD = (r1: number, c1: number, r2: number, c2: number, val: any, type?: string, style?: any) => {
        merges2.push({ s: { r: r1, c: c1 }, e: { r: r2, c: c2 } });
        for (let r = r1; r <= r2; r++) {
          for (let c = c1; c <= c2; c++) {
            const isPrimary = (r === r1 && c === c1);
            setCellD(r, c, isPrimary ? val : '', isPrimary ? type : 's', style);
          }
        }
      };

      // Header Sheet 2
      mergeAndStyleD(rowD, 0, rowD, 4, companyName, 's', {
        font: { name: defaultFont, bold: true, sz: 13, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      });
      mergeAndStyleD(rowD, 5, rowD, lastColD, `تفاصيل أصناف التحويلات — ${currentReportMeta.title}`, 's', {
        font: { name: defaultFont, bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1565C0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      rows2.push({ hpt: 26 });
      rowD++;

      // تفريغ الفاصل
      for (let c = 0; c <= lastColD; c++) setCellD(rowD, c, '', 's');
      rows2.push({ hpt: 6 });
      rowD++;

      // ترويسة أعمدة الأصناف
      const headersD = [
        'م',
        'رقم الإذن',
        'التاريخ',
        'مخزن المصدر (من)',
        'مخزن الوجهة (إلى)',
        'كود الصنف',
        'اسم وبيان الصنف',
        'الوحدة',
        'الكمية',
        'الحالة',
        'ملاحظات الصنف'
      ];
      headersD.forEach((hd, colIdx) => {
        setCellD(rowD, colIdx, hd, 's', thStyle);
      });
      rows2.push({ hpt: 26 });
      rowD++;

      let itemCounter = 0;
      let totalDetailedQty = 0;

      displayedTransfers.forEach(tr => {
        (tr.items || []).forEach(it => {
          itemCounter++;
          const qty = Number(it.quantity) || 0;
          totalDetailedQty += qty;
          const bg = itemCounter % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
          const cellD = {
            font: { name: defaultFont, sz: 9.5, color: { rgb: '1E293B' } },
            fill: { fgColor: { rgb: bg } },
            border: borderThin,
            alignment: { horizontal: 'center', vertical: 'center' }
          };

          setCellD(rowD, 0, itemCounter, 'n', cellD);
          setCellD(rowD, 1, tr.transferNumber, 's', {
            ...cellD,
            font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '1565C0' } }
          });
          setCellD(rowD, 2, tr.date, 's', cellD);
          setCellD(rowD, 3, tr.fromWarehouseName, 's', cellD);
          setCellD(rowD, 4, tr.toWarehouseName, 's', cellD);
          setCellD(rowD, 5, it.productCode || '—', 's', {
            ...cellD,
            font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0284C7' } }
          });
          setCellD(rowD, 6, it.productName || '—', 's', {
            ...cellD,
            font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0F172A' } },
            alignment: { horizontal: 'right', vertical: 'center' }
          });
          setCellD(rowD, 7, it.unit || 'عدد', 's', cellD);
          setCellD(rowD, 8, qty, 'n', {
            ...cellD,
            font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '0F172A' } }
          });
          setCellD(rowD, 9, tr.status, 's', {
            ...cellD,
            font: {
              name: defaultFont,
              bold: true,
              sz: 9.5,
              color: { rgb: tr.status === 'معلق' ? 'B45309' : '047857' }
            },
            fill: { fgColor: { rgb: tr.status === 'معلق' ? 'FEF3C7' : 'D1FAE5' } }
          });
          setCellD(rowD, 10, it.notes || tr.notes || '', 's', {
            ...cellD,
            alignment: { horizontal: 'right', vertical: 'center' }
          });

          rows2.push({ hpt: 20 });
          rowD++;
        });
      });

      // سطر إجمالي الأصناف
      mergeAndStyleD(rowD, 0, rowD, 7, `إجمالي عدد سطور الأصناف: ${itemCounter} صنف`, 's', {
        ...totalFooterStyle,
        alignment: { horizontal: 'right', vertical: 'center' }
      });
      setCellD(rowD, 8, totalDetailedQty, 'n', {
        ...totalFooterStyle,
        font: { name: defaultFont, bold: true, sz: 12, color: { rgb: '1565C0' } }
      });
      mergeAndStyleD(rowD, 9, rowD, lastColD, '', 's', totalFooterStyle);
      rows2.push({ hpt: 24 });

      // ضبط نطاق البيانات وأحجام الأعمدة لـ Sheet 2
      wsDetails['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rowD, c: lastColD } });
      wsDetails['!merges'] = merges2;
      wsDetails['!rows'] = rows2;
      wsDetails['!cols'] = [
        { wch: 6 },   // م
        { wch: 16 },  // رقم الإذن
        { wch: 13 },  // التاريخ
        { wch: 20 },  // مخزن المصدر
        { wch: 20 },  // مخزن الوجهة
        { wch: 14 },  // كود الصنف
        { wch: 28 },  // اسم وبيان الصنف
        { wch: 10 },  // الوحدة
        { wch: 12 },  // الكمية
        { wch: 13 },  // الحالة
        { wch: 25 }   // ملاحظات
      ];
      wsDetails['!views'] = [{ rightToLeft: true, RTL: true }];

      // تجميع الملف
      const wb = XLSX.utils.book_new();
      wb.Workbook = { Views: [{ RTL: true }] };
      XLSX.utils.book_append_sheet(wb, ws, 'ملخص التحويلات');
      XLSX.utils.book_append_sheet(wb, wsDetails, 'تفاصيل الأصناف');

      const fileName = `تقرير_التحويلات_${currentReportMeta.title.replace(/\s+/g, '_')}_${todayDate}.xlsx`;
      XLSX.writeFile(wb, fileName);

      setNotification(`تم تصدير تقرير (${currentReportMeta.title}) إلى ملف Excel بنجاح.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      setNotification('حدث خطأ أثناء تصدير ملف Excel.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // PDF Export using standardized vertexReportRenderer
  const handleExportPdf = async () => {
    if (displayedTransfers.length === 0) return;
    setIsExportingPdf(true);
    try {
      const element = (isPrintPreviewOpen ? document.getElementById('stock-transfer-modal-printable-sheet') : null)
        || document.getElementById('stock-transfer-report-printable-area')
        || document.getElementById('stock-transfer-report-printable-table');

      if (!element) {
        setIsPrintPreviewOpen(true);
        setTimeout(() => {
          handleExportPdf();
        }, 300);
        return;
      }

      await exportVertexReportToPdf(element, {
        filename: `تقرير_التحويلات_${currentReportMeta.title.replace(/\s+/g, '_')}_${todayDate}.pdf`,
        title: `تقارير التحويلات المخزنية - ${currentReportMeta.title}`,
        orientation: 'landscape',
        onComplete: () => {
          setNotification(`تم تصدير تقرير (${currentReportMeta.title}) إلى ملف PDF بنجاح.`);
          setTimeout(() => setNotification(null), 3500);
        },
        onError: (err) => {
          console.error('Error generating PDF, opening print dialog:', err);
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

  // Print Report Handler -> Opens Print Preview Modal
  const handlePrintReport = () => {
    setIsPrintPreviewOpen(true);
  };

  // Single Voucher Excel Export for Details Modal
  const handleExportSingleTransferExcel = (transfer: StockTransferRecord) => {
    try {
      const defaultFont = 'Segoe UI';
      const ws: Record<string, any> = {};
      const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
      const rows: { hpt: number }[] = [];
      let currentRow = 0;
      const lastColIdx = 5;

      const setCell = (r: number, c: number, val: any, type?: string, style?: any) => {
        const addr = XLSX.utils.encode_cell({ r, c });
        ws[addr] = { v: val ?? '', t: type || (typeof val === 'number' ? 'n' : 's') };
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

      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      // Header
      mergeAndStyle(currentRow, 0, currentRow, 2, companyName, 's', {
        font: { name: defaultFont, bold: true, sz: 14, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      });
      mergeAndStyle(currentRow, 3, currentRow, lastColIdx, 'إذن صرف بإضافة تحويل مخزني', 's', {
        font: { name: defaultFont, bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1565C0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      rows.push({ hpt: 30 });
      currentRow++;

      // Subtitle
      mergeAndStyle(currentRow, 0, currentRow, 2, 'نظام فيرتكس لإدارة المخازن والمستودعات', 's', {
        font: { name: defaultFont, bold: false, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      });
      mergeAndStyle(currentRow, 3, currentRow, lastColIdx, `تاريخ الإذن: ${transfer.date}`, 's', {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '1E293B' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // Spacer
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      const labelStyle = {
        font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      };
      const valueStyle = {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: borderThin
      };

      setCell(currentRow, 0, 'مسلسل إذن الصرف:', 's', labelStyle);
      mergeAndStyle(currentRow, 1, currentRow, 2, transfer.transferNumber, 's', {
        ...valueStyle,
        font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '1565C0' } }
      });
      setCell(currentRow, 3, 'حالة الإذن:', 's', labelStyle);
      const isPending = transfer.status === 'معلق';
      mergeAndStyle(currentRow, 4, currentRow, lastColIdx, transfer.status, 's', {
        ...valueStyle,
        font: { name: defaultFont, bold: true, sz: 10, color: { rgb: isPending ? 'B45309' : '047857' } },
        fill: { fgColor: { rgb: isPending ? 'FEF3C7' : 'D1FAE5' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      });
      rows.push({ hpt: 24 });
      currentRow++;

      setCell(currentRow, 0, 'مخزن المصدر (من):', 's', labelStyle);
      mergeAndStyle(currentRow, 1, currentRow, 2, transfer.fromWarehouseName, 's', valueStyle);
      setCell(currentRow, 3, 'مخزن الوجهة (إلى):', 's', labelStyle);
      mergeAndStyle(currentRow, 4, currentRow, lastColIdx, transfer.toWarehouseName, 's', valueStyle);
      rows.push({ hpt: 24 });
      currentRow++;

      if (transfer.receiptNumber) {
        setCell(currentRow, 0, 'إذن الإضافة المقابل:', 's', labelStyle);
        mergeAndStyle(currentRow, 1, currentRow, 2, transfer.receiptNumber, 's', {
          ...valueStyle,
          font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '047857' } }
        });
        setCell(currentRow, 3, 'المسؤول المنفذ:', 's', labelStyle);
        mergeAndStyle(currentRow, 4, currentRow, lastColIdx, transfer.createdBy || 'أمين المخزن', 's', valueStyle);
        rows.push({ hpt: 24 });
        currentRow++;
      }

      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // Items Headers
      const itemHeaders = ['م', 'كود الصنف', 'اسم وبيان الصنف', 'الوحدة', 'الكمية', 'ملاحظات الصنف'];
      const thStyle = {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1565C0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      };
      itemHeaders.forEach((h, c) => setCell(currentRow, c, h, 's', thStyle));
      rows.push({ hpt: 26 });
      currentRow++;

      // Items Rows
      (transfer.items || []).forEach((it, idx) => {
        const bg = idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
        const rowStyle = {
          font: { name: defaultFont, sz: 10, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: bg } },
          border: borderThin,
          alignment: { horizontal: 'center', vertical: 'center' }
        };

        setCell(currentRow, 0, idx + 1, 'n', rowStyle);
        setCell(currentRow, 1, it.productCode || '—', 's', { ...rowStyle, font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0284C7' } } });
        setCell(currentRow, 2, it.productName || '—', 's', { ...rowStyle, alignment: { horizontal: 'right', vertical: 'center' }, font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0F172A' } } });
        setCell(currentRow, 3, it.unit || 'عدد', 's', rowStyle);
        setCell(currentRow, 4, Number(it.quantity) || 0, 'n', { ...rowStyle, font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '0F172A' } } });
        setCell(currentRow, 5, it.notes || '', 's', { ...rowStyle, alignment: { horizontal: 'right', vertical: 'center' } });
        rows.push({ hpt: 22 });
        currentRow++;
      });

      // Totals
      const totalStyle = {
        font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '1E3A8A' } },
        fill: { fgColor: { rgb: 'DBEAFE' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin
      };
      mergeAndStyle(currentRow, 0, currentRow, 3, `إجمالي عدد الأصناف: ${transfer.items?.length || 0}`, 's', { ...totalStyle, alignment: { horizontal: 'right', vertical: 'center' } });
      setCell(currentRow, 4, transfer.totalQuantity, 'n', { ...totalStyle, font: { name: defaultFont, bold: true, sz: 12, color: { rgb: '1565C0' } } });
      setCell(currentRow, 5, '', 's', totalStyle);
      rows.push({ hpt: 26 });

      // ضبط نطاق البيانات وأحجام الأعمدة
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: currentRow, c: lastColIdx } });
      ws['!merges'] = merges;
      ws['!rows'] = rows;
      ws['!cols'] = [{ wch: 6 }, { wch: 16 }, { wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 25 }];
      ws['!views'] = [{ rightToLeft: true, RTL: true }];

      const wb = XLSX.utils.book_new();
      wb.Workbook = { Views: [{ RTL: true }] };
      XLSX.utils.book_append_sheet(wb, ws, `إذن_${transfer.transferNumber}`);
      XLSX.writeFile(wb, `إذن_تحويل_${transfer.transferNumber}_${todayDate}.xlsx`);

      setNotification(`تم تصدير إذن التحويل (${transfer.transferNumber}) إلى ملف Excel بنجاح.`);
      setTimeout(() => setNotification(null), 3500);
    } catch (err) {
      console.error('Error exporting single voucher Excel:', err);
      setNotification('حدث خطأ أثناء تصدير إذن التحويل إلى Excel.');
      setTimeout(() => setNotification(null), 3500);
    }
  };

  // Single Voucher Print / PDF Handler
  const handlePrintSingleTransfer = (transfer: StockTransferRecord) => {
    window.print();
  };

  return (
    <div className="w-full h-full flex flex-col min-w-0 select-text overflow-hidden font-sans" dir="rtl">
      {/* 1. Header مختصر وأنيق */}
      <div
        className={`pb-3 mb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center space-x-3 space-x-reverse">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-blue-950/60 border border-blue-800/60 text-blue-400'
                : 'bg-blue-50 border border-blue-100 text-[#1565C0]'
            }`}
          >
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>المخازن</span>
              <span>/</span>
              <span>تقارير التحويلات</span>
              <span>/</span>
              <span className={`font-bold ${isDark ? 'text-blue-400' : 'text-[#1565C0]'}`}>
                {currentReportMeta.title}
              </span>
            </div>
            <h1 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              تقارير التحويلات المخزنية
            </h1>
          </div>
        </div>

        {/* Action Buttons: Print / Excel / PDF / Return */}
        <div className="flex items-center space-x-2 space-x-reverse self-end sm:self-auto">
          {hasExecuted && displayedTransfers.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportExcel}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                }`}
                title="تصدير النتائج إلى Excel رسمي منسق"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 ml-1" />
                <span>Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-rose-950/50 border-rose-800 text-rose-300 hover:bg-rose-900/60 disabled:opacity-50'
                    : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 disabled:opacity-50'
                }`}
                title="تصدير النتائج إلى ملف PDF رسمي معتمد"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5 ml-1" />
                )}
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handlePrintReport}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
                title="معاينة وطباعة التقرير"
              >
                <Printer className="w-3.5 h-3.5 ml-1" />
                <span>طباعة</span>
              </button>
            </>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="إغلاق التقرير والعودة للرئيسية"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>الرئيسية</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-3 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Check className="w-4 h-4 ml-1" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. شريط الفلاتر الموحد والمنظم */}
      <div
        className={`p-3.5 sm:p-4 rounded-xl border mb-3.5 transition-colors shrink-0 shadow-xs ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Dropdown 1: نوع التقرير (المطلوب الرئيسي) */}
          <div className="lg:col-span-1">
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              نوع التقرير:
            </label>
            <div className="relative">
              <select
                value={filters.reportType}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    reportType: e.target.value as TransferReportType
                  }))
                }
                className={`w-full text-xs font-bold rounded-lg px-2.5 py-2 border transition-all appearance-none cursor-pointer ${
                  isDark
                    ? 'bg-slate-800 border-blue-500/70 text-blue-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-500'
                    : 'bg-blue-50/70 border-blue-300 text-blue-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-400'
                }`}
              >
                <option value="issue" className={isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}>تقرير الصرف</option>
                <option value="receipt" className={isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}>تقرير الإضافة</option>
                <option value="pending" className={isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}>تقرير التحويلات المعلقة</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Filter 2: مخزن من (Source Warehouse) */}
          <div className="lg:col-span-1">
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              مخزن من:
            </label>
            <select
              value={filters.fromWarehouseId}
              onChange={e => setFilters(prev => ({ ...prev, fromWarehouseId: e.target.value }))}
              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="all" className={isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}>جميع المخازن (الكل)</option>
              {warehouses.map(w => (
                <option key={`from-${w.id}`} value={w.id} className={isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 3: مخزن إلى (Destination Warehouse) */}
          <div className="lg:col-span-1">
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              مخزن إلى:
            </label>
            <select
              value={filters.toWarehouseId}
              onChange={e => setFilters(prev => ({ ...prev, toWarehouseId: e.target.value }))}
              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-blue-500'
                  : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
              }`}
            >
              <option value="all" className={isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}>جميع المخازن (الكل)</option>
              {warehouses.map(w => (
                <option key={`to-${w.id}`} value={w.id} className={isDark ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter 4: من تاريخ */}
          <div className="lg:col-span-1">
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              من تاريخ:
            </label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={e => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              style={{ colorScheme: isDark ? 'dark' : 'light' }}
              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Filter 5: إلى تاريخ */}
          <div className="lg:col-span-1">
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              إلى تاريخ:
            </label>
            <input
              type="date"
              value={filters.toDate}
              onChange={e => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
              style={{ colorScheme: isDark ? 'dark' : 'light' }}
              className={`w-full text-xs font-semibold rounded-lg px-2.5 py-1.5 border transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            />
          </div>

          {/* Filter 6: بحث برقم الإذن */}
          <div className="lg:col-span-1">
            <label className={`block text-xs font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              بحث برقم الإذن / الصنف:
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="رقم الإذن أو الصنف..."
                value={filters.searchQuery}
                onChange={e => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleExecuteReport();
                  }
                }}
                className={`w-full text-xs font-semibold rounded-lg pl-7 pr-2.5 py-2 border transition-colors ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500'
                    : 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400'
                }`}
              />
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Buttons Row: عرض التقرير + إعادة ضبط */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={handleExecuteReport}
              className="px-6 py-2 rounded-lg bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center space-x-2 space-x-reverse cursor-pointer"
            >
              <FileText className="w-4 h-4 ml-1" />
              <span>عرض التقرير</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className={`px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors flex items-center space-x-1.5 space-x-reverse cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title="إعادة ضبط الفلاتر"
            >
              <RotateCcw className="w-3.5 h-3.5 ml-1" />
              <span>إعادة ضبط</span>
            </button>
          </div>

          {/* نطاق وتفاصيل التقرير المفعل */}
          {hasExecuted && (
            <div className="flex items-center space-x-3 space-x-reverse text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>
                إجمالي النتائج:{' '}
                <strong className="text-[#1565C0] dark:text-blue-400 font-mono text-sm">
                  {displayedTransfers.length}
                </strong>{' '}
                مستند
              </span>
              <span>•</span>
              <span>
                إجمالي الكميات:{' '}
                <strong className="text-slate-800 dark:text-slate-100 font-mono text-sm">
                  {summaryTotals.totalQty}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. حاوية النتائج والجدول (تستغل كامل المساحة) */}
      <div
        className={`flex-1 rounded-xl border flex flex-col min-h-0 overflow-hidden shadow-xs ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {!hasExecuted ? (
          /* Initial Screen Prompt: "عند فتح الشاشة لا تعرض نتائج حتى يضغط المستخدم «عرض التقرير»" */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none animate-in fade-in duration-200">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner ${
                isDark ? 'bg-slate-800/80 text-blue-400 border border-slate-700' : 'bg-blue-50 text-[#1565C0] border border-blue-100'
              }`}
            >
              <SlidersHorizontal className="w-8 h-8" />
            </div>
            <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
              جاهز لاستعراض {currentReportMeta.title}
            </h3>
            <p className={`text-xs sm:text-sm max-w-md leading-relaxed mb-5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              قم بضبط الفلاتر المطلوبة (نوع التقرير، المخازن، التواريخ) ثم اضغط على زر{' '}
              <strong className="text-[#1565C0] dark:text-blue-400">«عرض التقرير»</strong> لاستخراج البيانات.
            </p>
            <button
              type="button"
              onClick={handleExecuteReport}
              className="px-6 py-2.5 rounded-xl bg-[#1565C0] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center space-x-2 space-x-reverse cursor-pointer"
            >
              <FileText className="w-4 h-4 ml-1" />
              <span>عرض التقرير الآن</span>
            </button>
          </div>
        ) : displayedTransfers.length === 0 ? (
          /* Empty Search Results */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                isDark ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Filter className="w-7 h-7" />
            </div>
            <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              لا توجد بيانات مطابقة
            </h3>
            <p className={`text-xs max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'} mb-4`}>
              لم يتم العثور على أذون تحويل مخزني مطابقة لمعايير الفلترة المحددة.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              إعادة ضبط الفلاتر وعرض الكل
            </button>
          </div>
        ) : (
          /* The Full-Width Clean Report Table */
          <div className="flex-1 flex flex-col min-h-0">
            <div
              id="stock-transfer-report-printable-table"
              className="flex-1 overflow-x-auto overflow-y-auto"
            >
              <table className="w-full text-center border-collapse text-xs select-text">
                <thead
                  className={`sticky top-0 z-10 font-bold border-b transition-colors select-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-300 text-slate-700'
                  }`}
                >
                  <tr>
                    {/* م (Index) */}
                    <th className="w-12 py-3 px-2 text-center text-xs font-bold">#</th>

                    {/* رقم المستند (Document Number) */}
                    <ReportSortHeaderCell
                      title={appliedFilters?.reportType === 'receipt' ? 'رقم إذن الإضافة' : 'رقم إذن الصرف'}
                      columnKey="docNumber"
                      activeSortKey={sortKey}
                      activeSortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                      className="w-[12%] min-w-[110px]"
                    />

                    {/* رقم الإذن المقابل (إن وجد) */}
                    <th className="w-[11%] min-w-[100px] py-3 px-2 text-center text-xs font-bold">
                      {appliedFilters?.reportType === 'receipt' ? 'إذن الصرف المقابل' : 'إذن الإضافة المقابل'}
                    </th>

                    {/* التاريخ */}
                    <ReportSortHeaderCell
                      title="التاريخ"
                      columnKey="date"
                      activeSortKey={sortKey}
                      activeSortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                      className="w-[10%] min-w-[95px]"
                    />

                    {/* مخزن المصدر */}
                    <ReportSortHeaderCell
                      title="مخزن المصدر (من)"
                      columnKey="fromWarehouse"
                      activeSortKey={sortKey}
                      activeSortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                      className="w-[17%] min-w-[130px]"
                    />

                    {/* مخزن الوجهة */}
                    <ReportSortHeaderCell
                      title="مخزن الوجهة (إلى)"
                      columnKey="toWarehouse"
                      activeSortKey={sortKey}
                      activeSortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                      className="w-[17%] min-w-[130px]"
                    />

                    {/* عدد الأصناف */}
                    <ReportSortHeaderCell
                      title="الأصناف"
                      columnKey="totalItems"
                      activeSortKey={sortKey}
                      activeSortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                      className="w-[8%] min-w-[70px]"
                    />

                    {/* إجمالي الكمية */}
                    <ReportSortHeaderCell
                      title="إجمالي الكمية"
                      columnKey="totalQuantity"
                      activeSortKey={sortKey}
                      activeSortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                      className="w-[9%] min-w-[80px]"
                    />

                    {/* الحالة */}
                    <ReportSortHeaderCell
                      title="الحالة"
                      columnKey="status"
                      activeSortKey={sortKey}
                      activeSortDirection={sortDirection}
                      onSort={handleSort}
                      align="center"
                      className="w-[8%] min-w-[80px]"
                    />

                    {/* الإجراءات / تفاصيل المستند */}
                    <th className="w-[100px] min-w-[90px] py-3 px-2 text-center text-xs font-bold">
                      التفاصيل
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {displayedTransfers.map((tr, idx) => (
                    <tr
                      key={tr.id}
                      onClick={() => setSelectedTransferForDetails(tr)}
                      className={`h-11 transition-colors cursor-pointer whitespace-nowrap ${
                        isDark
                          ? 'hover:bg-slate-800/60 text-slate-200'
                          : 'hover:bg-blue-50/50 text-slate-800'
                      }`}
                      title="اضغط لعرض تفاصيل المستند بالكامل"
                    >
                      {/* م */}
                      <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* رقم المستند الأساسي */}
                      <td
                        className={`py-2.5 px-2 text-center font-mono font-bold text-xs sm:text-sm ${
                          appliedFilters?.reportType === 'receipt'
                            ? isDark
                              ? 'text-emerald-400'
                              : 'text-emerald-600'
                            : isDark
                            ? 'text-blue-400'
                            : 'text-[#1565C0]'
                        }`}
                      >
                        {appliedFilters?.reportType === 'receipt'
                          ? tr.receiptNumber || tr.transferNumber
                          : tr.transferNumber}
                      </td>

                      {/* رقم المستند المقابل */}
                      <td className="py-2.5 px-2 text-center font-mono font-semibold text-xs">
                        {appliedFilters?.reportType === 'receipt' ? (
                          <span className={isDark ? 'text-blue-400' : 'text-[#1565C0]'}>
                            {tr.transferNumber}
                          </span>
                        ) : tr.receiptNumber ? (
                          <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>
                            {tr.receiptNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">بانتظار الإضافة</span>
                        )}
                      </td>

                      {/* التاريخ */}
                      <td className={`py-2.5 px-2 text-center font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        {tr.date}
                      </td>

                      {/* مخزن المصدر */}
                      <td className={`py-2.5 px-3 text-center font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {tr.fromWarehouseName}
                      </td>

                      {/* مخزن الوجهة */}
                      <td className={`py-2.5 px-3 text-center font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {tr.toWarehouseName}
                      </td>

                      {/* عدد الأصناف */}
                      <td className={`py-2.5 px-2 text-center font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {tr.totalItems}
                      </td>

                      {/* إجمالي الكمية */}
                      <td className={`py-2.5 px-2 text-center font-mono font-black text-xs sm:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {tr.totalQuantity}
                      </td>

                      {/* الحالة */}
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black inline-block whitespace-nowrap ${
                            tr.status === 'معلق'
                              ? isDark
                                ? 'bg-amber-950/70 text-amber-400 border border-amber-800'
                                : 'bg-amber-50 text-amber-800 border border-amber-300'
                              : isDark
                              ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {tr.status}
                        </span>
                      </td>

                      {/* زر عرض التفاصيل */}
                      <td className="py-2.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedTransferForDetails(tr);
                          }}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors flex items-center justify-center space-x-1 space-x-reverse mx-auto cursor-pointer ${
                            isDark
                              ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-blue-400'
                              : 'bg-white hover:bg-slate-100 border-slate-200 text-[#1565C0]'
                          }`}
                          title="عرض تفاصيل المستند والأصناف"
                        >
                          <Eye className="w-3 h-3 ml-0.5" />
                          <span>عرض</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Footer Totals Row */}
                <tfoot
                  className={`border-t-2 font-bold select-none ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-300 text-slate-800'
                  }`}
                >
                  <tr>
                    <td colSpan={4} className="py-3 px-3 text-right">
                      <span className="font-bold">
                        إجمالي عدد المستندات في التقرير:{' '}
                        <strong className="text-[#1565C0] dark:text-blue-400 font-mono text-sm">
                          {summaryTotals.totalDocs}
                        </strong>{' '}
                        مستند ({summaryTotals.pendingCount} معلق • {summaryTotals.completedCount} مكتمل)
                      </span>
                    </td>
                    <td colSpan={2} className="py-3 px-2 text-center">
                      المجموع الإجمالي:
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-black text-sm">
                      {summaryTotals.totalItemRows}
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-black text-sm text-[#1565C0] dark:text-blue-400">
                      {summaryTotals.totalQty}
                    </td>
                    <td colSpan={2} className="py-3 px-2 text-center text-slate-400 font-normal">
                      —
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. MODAL: عرض تفاصيل المستند (عند الضغط على أي مستند) */}
      {selectedTransferForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-3xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                    selectedTransferForDetails.status === 'معلق' ? 'bg-amber-600' : 'bg-[#1565C0]'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    تفاصيل مستند التحويل المخزني
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إذن صرف: <strong className="font-mono text-blue-500">{selectedTransferForDetails.transferNumber}</strong>
                    {selectedTransferForDetails.receiptNumber && (
                      <>
                        {' • '}إذن إضافة:{' '}
                        <strong className="font-mono text-emerald-500">
                          {selectedTransferForDetails.receiptNumber}
                        </strong>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransferForDetails(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              {/* Document Metadata Grid */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span className="text-slate-400 block mb-0.5">تاريخ الحركة:</span>
                  <strong className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {selectedTransferForDetails.date}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">حالة التحويل:</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] inline-block ${
                      selectedTransferForDetails.status === 'معلق'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    }`}
                  >
                    {selectedTransferForDetails.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">مخزن المصدر (من):</span>
                  <strong className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {selectedTransferForDetails.fromWarehouseName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">مخزن الوجهة (إلى):</span>
                  <strong className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    {selectedTransferForDetails.toWarehouseName}
                  </strong>
                </div>
                {selectedTransferForDetails.createdBy && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">تم الإنشاء بواسطة:</span>
                    <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {selectedTransferForDetails.createdBy}
                    </span>
                  </div>
                )}
                {selectedTransferForDetails.completedBy && (
                  <div>
                    <span className="text-slate-400 block mb-0.5">تم الاستلام بواسطة:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {selectedTransferForDetails.completedBy}
                    </span>
                  </div>
                )}
                {selectedTransferForDetails.notes && (
                  <div className={`col-span-2 sm:col-span-4 pt-1 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <span className="text-slate-400 block mb-0.5">البيان والملاحظات:</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                      {selectedTransferForDetails.notes}
                    </span>
                  </div>
                )}
              </div>

              {/* Items List Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    الأصناف المشمولة في المستند ({selectedTransferForDetails.items?.length || 0} صنف):
                  </h4>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    إجمالي الكمية: {selectedTransferForDetails.totalQuantity} وحدة
                  </span>
                </div>

                <div
                  className={`rounded-xl border overflow-hidden ${
                    isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
                  }`}
                >
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr
                        className={`font-bold border-b ${
                          isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <th className="p-2.5 text-center w-10">م</th>
                        <th className="p-2.5 text-right w-24">كود الصنف</th>
                        <th className="p-2.5 text-right">اسم الصنف</th>
                        <th className="p-2.5 text-center w-16">الوحدة</th>
                        <th className="p-2.5 text-center w-20">الكمية</th>
                        <th className="p-2.5 text-right">ملاحظات الصنف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {selectedTransferForDetails.items?.map((it, idx) => (
                        <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                          <td className="p-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-500">{it.productCode}</td>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                            {it.productName}
                          </td>
                          <td className="p-2.5 text-center text-slate-600 dark:text-slate-400">{it.unit || 'عدد'}</td>
                          <td className="p-2.5 text-center font-mono font-black text-sm text-slate-900 dark:text-white">
                            {it.quantity}
                          </td>
                          <td className="p-2.5 text-slate-500 text-[11px]">{it.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot
                      className={`font-bold border-t ${
                        isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}
                    >
                      <tr>
                        <td colSpan={4} className="p-2.5 text-right">
                          الإجمالي:
                        </td>
                        <td className="p-2.5 text-center font-mono font-black text-sm text-[#1565C0] dark:text-blue-400">
                          {selectedTransferForDetails.totalQuantity}
                        </td>
                        <td className="p-2.5"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer with Single Voucher Excel & Print Actions */}
            <div
              className={`p-3.5 border-t flex flex-wrap items-center justify-between gap-2 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => handleExportSingleTransferExcel(selectedTransferForDetails)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="تصدير إذن التحويل إلى Excel رسمي"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 ml-1" />
                  <span>تصدير Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintSingleTransfer(selectedTransferForDetails)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="طباعة إذن التحويل"
                >
                  <Printer className="w-3.5 h-3.5 ml-1" />
                  <span>طباعة الإذن</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransferForDetails(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: معاينة الطباعة الاحترافية (Print Preview Modal) */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-5xl rounded-2xl shadow-2xl border flex flex-col h-[94vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {/* Modal Header & Controls */}
            <div
              className={`p-3.5 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-9 h-9 rounded-xl bg-[#1565C0] flex items-center justify-center text-white">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    معاينة طباعة: تقارير التحويلات المخزنية
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {currentReportMeta.title} • {companyName} • {todayDate}
                  </p>
                </div>
              </div>

              {/* Action Buttons in Preview */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#1565C0] hover:bg-blue-700 text-white flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer shadow-xs"
                  title="إرسال إلى الطابعة مباشرة"
                >
                  <Printer className="w-3.5 h-3.5 ml-1" />
                  <span>طباعة الآن</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isExportingPdf}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-rose-950/50 border-rose-800 text-rose-300 hover:bg-rose-900/60 disabled:opacity-50'
                      : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100 disabled:opacity-50'
                  }`}
                  title="حفظ كملف PDF"
                >
                  {isExportingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 ml-1" />
                  )}
                  <span>تصدير PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer ${
                    isDark
                      ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300 hover:bg-emerald-900/60'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  }`}
                  title="حفظ كملف Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 ml-1" />
                  <span>Excel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                  title="إغلاق المعاينة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: A4 Paper Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/70 dark:bg-slate-950/80 flex justify-center">
              <div
                id="stock-transfer-modal-printable-sheet"
                className="w-full max-w-4xl bg-white text-slate-900 shadow-xl rounded-lg p-6 sm:p-8 font-sans border border-slate-300 text-xs flex flex-col"
                style={{ minHeight: '1000px' }}
                dir="rtl"
              >
                {/* 1. Header الرسمي للتقرير */}
                <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
                  <div className="text-right">
                    <h2 className="text-base sm:text-lg font-black text-slate-950 mb-0.5">
                      {companyName}
                    </h2>
                    <p className="text-[11px] text-slate-600">
                      نظام فيرتكس لإدارة المخازن والمستودعات
                    </p>
                  </div>
                  <div className="text-center px-4 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                    <h1 className="text-sm sm:text-base font-black text-[#1565C0]">
                      تقارير التحويلات المخزنية
                    </h1>
                    <span className="text-[11px] font-bold text-slate-700">
                      {currentReportMeta.title}
                    </span>
                  </div>
                  <div className="text-left text-[11px] text-slate-600">
                    <div>
                      <strong>تاريخ التقرير:</strong> {todayDate}
                    </div>
                    <div>
                      <strong>عدد المستندات:</strong> {summaryTotals.totalDocs}
                    </div>
                  </div>
                </div>

                {/* 2. Metadata Box */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-300 rounded-md p-3 mb-4 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">نطاق المخازن:</span>
                    <strong className="text-slate-900">
                      من: {fromWarehouseLabel} ⟵ إلى: {toWarehouseLabel}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">الفترة المحددة:</span>
                    <strong className="text-slate-900">
                      {appliedFilters?.fromDate || appliedFilters?.toDate
                        ? `من ${appliedFilters?.fromDate || 'البداية'} إلى ${appliedFilters?.toDate || 'اليوم'}`
                        : 'كافة الفترات المسجلة'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">إجمالي الكميات المحولة:</span>
                    <strong className="text-emerald-700 font-mono font-black text-xs">
                      {summaryTotals.totalQty} وحدة ({summaryTotals.totalItemRows} صنف)
                    </strong>
                  </div>
                </div>

                {/* 3. Table of Transfers */}
                <div className="flex-1 overflow-x-auto mb-6">
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-bold border border-slate-400">
                        <th className="py-2 px-1 border border-slate-300 w-8">#</th>
                        <th className="py-2 px-2 border border-slate-300">رقم إذن الصرف</th>
                        <th className="py-2 px-2 border border-slate-300">إذن الإضافة المقابل</th>
                        <th className="py-2 px-2 border border-slate-300">التاريخ</th>
                        <th className="py-2 px-2 border border-slate-300">مخزن المصدر</th>
                        <th className="py-2 px-2 border border-slate-300">مخزن الوجهة</th>
                        <th className="py-2 px-1 border border-slate-300">الأصناف</th>
                        <th className="py-2 px-1 border border-slate-300">الكمية</th>
                        <th className="py-2 px-2 border border-slate-300">الحالة</th>
                        <th className="py-2 px-2 border border-slate-300">الملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedTransfers.map((tr, idx) => (
                        <tr
                          key={tr.id}
                          className={`border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}
                        >
                          <td className="py-1.5 px-1 border border-slate-300 font-mono text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 font-mono font-bold text-[#1565C0]">
                            {tr.transferNumber}
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 font-mono font-semibold text-emerald-700">
                            {tr.receiptNumber || '—'}
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 whitespace-nowrap">
                            {tr.date}
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 font-bold">
                            {tr.fromWarehouseName}
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 font-bold">
                            {tr.toWarehouseName}
                          </td>
                          <td className="py-1.5 px-1 border border-slate-300 font-mono">
                            {tr.totalItems}
                          </td>
                          <td className="py-1.5 px-1 border border-slate-300 font-mono font-black text-slate-900">
                            {tr.totalQuantity}
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                tr.status === 'معلق'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {tr.status}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 border border-slate-300 text-right text-slate-600 max-w-[140px] truncate">
                            {tr.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-2 border-slate-400">
                        <td colSpan={6} className="py-2 px-3 border border-slate-300 text-right">
                          الإجمالي العام: ({summaryTotals.totalDocs} مستند — {summaryTotals.pendingCount} معلق • {summaryTotals.completedCount} مكتمل)
                        </td>
                        <td className="py-2 px-1 border border-slate-300 font-mono font-black">
                          {summaryTotals.totalItemRows}
                        </td>
                        <td className="py-2 px-1 border border-slate-300 font-mono font-black text-[#1565C0] text-xs">
                          {summaryTotals.totalQty}
                        </td>
                        <td colSpan={2} className="py-2 px-2 border border-slate-300 text-slate-400">
                          —
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* 4. خانات التوقيع والاعتماد الرسمية */}
                <div className="grid grid-cols-4 gap-4 mt-auto pt-4 border-t border-slate-300 text-center text-[11px]">
                  <div className="border border-slate-300 rounded p-2">
                    <strong className="block mb-6 text-slate-800">منظم التقرير</strong>
                    <span className="text-slate-400">التوقيع: ..................</span>
                  </div>
                  <div className="border border-slate-300 rounded p-2">
                    <strong className="block mb-6 text-slate-800">أمين المخزن</strong>
                    <span className="text-slate-400">التوقيع: ..................</span>
                  </div>
                  <div className="border border-slate-300 rounded p-2">
                    <strong className="block mb-6 text-slate-800">مدير المخازن</strong>
                    <span className="text-slate-400">التوقيع: ..................</span>
                  </div>
                  <div className="border border-slate-300 rounded p-2">
                    <strong className="block mb-6 text-slate-800">الاعتماد المالي</strong>
                    <span className="text-slate-400">التوقيع: ..................</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Off-Screen Printable Area for Direct PDF Generation (Hidden from view) */}
      <div
        id="stock-transfer-report-printable-area"
        className="fixed -left-[9999px] top-0 w-[1120px] bg-white text-slate-900 p-8 font-sans text-xs"
        dir="rtl"
      >
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-4 flex items-center justify-between">
          <div className="text-right">
            <h2 className="text-lg font-black text-slate-950 mb-0.5">{companyName}</h2>
            <p className="text-xs text-slate-600">نظام فيرتكس لإدارة المخازن والمستودعات</p>
          </div>
          <div className="text-center px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
            <h1 className="text-base font-black text-[#1565C0]">تقارير التحويلات المخزنية</h1>
            <span className="text-xs font-bold text-slate-700">{currentReportMeta.title}</span>
          </div>
          <div className="text-left text-xs text-slate-600">
            <div><strong>تاريخ الاستخراج:</strong> {todayDate}</div>
            <div><strong>عدد المستندات:</strong> {summaryTotals.totalDocs}</div>
          </div>
        </div>

        {/* Filters Box */}
        <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-300 rounded-md p-3 mb-4 text-xs">
          <div>
            <span className="text-slate-500 block">نطاق المخازن:</span>
            <strong className="text-slate-900">من: {fromWarehouseLabel} ⟵ إلى: {toWarehouseLabel}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">الفترة المحددة:</span>
            <strong className="text-slate-900">
              {appliedFilters?.fromDate || appliedFilters?.toDate
                ? `من ${appliedFilters?.fromDate || 'البداية'} إلى ${appliedFilters?.toDate || 'اليوم'}`
                : 'كافة الفترات المسجلة'}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">إجمالي الكميات المحولة:</span>
            <strong className="text-emerald-700 font-mono font-black text-sm">
              {summaryTotals.totalQty} وحدة ({summaryTotals.totalItemRows} صنف)
            </strong>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-center border-collapse text-xs mb-6">
          <thead>
            <tr className="bg-slate-100 text-slate-900 font-bold border border-slate-400">
              <th className="py-2 px-1 border border-slate-300 w-8">#</th>
              <th className="py-2 px-2 border border-slate-300">رقم إذن الصرف</th>
              <th className="py-2 px-2 border border-slate-300">إذن الإضافة المقابل</th>
              <th className="py-2 px-2 border border-slate-300">التاريخ</th>
              <th className="py-2 px-2 border border-slate-300">مخزن المصدر</th>
              <th className="py-2 px-2 border border-slate-300">مخزن الوجهة</th>
              <th className="py-2 px-1 border border-slate-300">الأصناف</th>
              <th className="py-2 px-1 border border-slate-300">الكمية</th>
              <th className="py-2 px-2 border border-slate-300">الحالة</th>
              <th className="py-2 px-2 border border-slate-300">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {displayedTransfers.map((tr, idx) => (
              <tr
                key={tr.id}
                className={`border-b border-slate-200 ${idx % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}
              >
                <td className="py-1.5 px-1 border border-slate-300 font-mono text-slate-500">{idx + 1}</td>
                <td className="py-1.5 px-2 border border-slate-300 font-mono font-bold text-[#1565C0]">{tr.transferNumber}</td>
                <td className="py-1.5 px-2 border border-slate-300 font-mono font-semibold text-emerald-700">{tr.receiptNumber || '—'}</td>
                <td className="py-1.5 px-2 border border-slate-300">{tr.date}</td>
                <td className="py-1.5 px-2 border border-slate-300 font-bold">{tr.fromWarehouseName}</td>
                <td className="py-1.5 px-2 border border-slate-300 font-bold">{tr.toWarehouseName}</td>
                <td className="py-1.5 px-1 border border-slate-300 font-mono">{tr.totalItems}</td>
                <td className="py-1.5 px-1 border border-slate-300 font-mono font-black">{tr.totalQuantity}</td>
                <td className="py-1.5 px-2 border border-slate-300 font-bold">{tr.status}</td>
                <td className="py-1.5 px-2 border border-slate-300 text-right text-slate-600">{tr.notes || '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-2 border-slate-400">
              <td colSpan={6} className="py-2 px-3 border border-slate-300 text-right">
                الإجمالي العام: ({summaryTotals.totalDocs} مستند — {summaryTotals.pendingCount} معلق • {summaryTotals.completedCount} مكتمل)
              </td>
              <td className="py-2 px-1 border border-slate-300 font-mono font-black">{summaryTotals.totalItemRows}</td>
              <td className="py-2 px-1 border border-slate-300 font-mono font-black text-[#1565C0]">{summaryTotals.totalQty}</td>
              <td colSpan={2} className="py-2 px-2 border border-slate-300 text-slate-400">—</td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-4 gap-4 pt-6 border-t border-slate-300 text-center text-xs">
          <div className="border border-slate-300 rounded p-2">
            <strong className="block mb-6 text-slate-800">منظم التقرير</strong>
            <span className="text-slate-400">التوقيع: ..................</span>
          </div>
          <div className="border border-slate-300 rounded p-2">
            <strong className="block mb-6 text-slate-800">أمين المخزن</strong>
            <span className="text-slate-400">التوقيع: ..................</span>
          </div>
          <div className="border border-slate-300 rounded p-2">
            <strong className="block mb-6 text-slate-800">مدير المخازن</strong>
            <span className="text-slate-400">التوقيع: ..................</span>
          </div>
          <div className="border border-slate-300 rounded p-2">
            <strong className="block mb-6 text-slate-800">الاعتماد المالي</strong>
            <span className="text-slate-400">التوقيع: ..................</span>
          </div>
        </div>
      </div>

      {/* 7. Print CSS Styles for clean paper output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #stock-transfer-modal-printable-sheet,
          #stock-transfer-modal-printable-sheet * {
            visibility: visible !important;
          }
          #stock-transfer-modal-printable-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
};
