import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Boxes,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Package,
  Plus,
  Minus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
  AlertCircle,
  Check,
  Eye,
  Layers,
  Printer,
  Edit3,
  FileSpreadsheet,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import XLSXStyle from 'xlsx-js-style';
const XLSX = (XLSXStyle as any).default || XLSXStyle;
import { exportVertexReportToPdf, printVertexReport } from '../../utils/vertexReportRenderer';
import { warehouseService, Warehouse } from '../../services/warehouseService';
import { salesEntryService, ProductItem } from '../../services/salesEntryService';
import { setupWizardService } from '../../services/setupWizardService';
import { stockTransferService, StockTransferItem, StockTransferRecord } from '../../services/stockTransferService';
import { themeService, ThemeMode } from '../../services/themeService';

interface StockTransferViewProps {
  isDark?: boolean;
  onClose?: () => void;
  initialMode?: 'issue' | 'receipt';
  autoOpenPending?: boolean;
}

type TransferDocumentType = 'issue' | 'receipt'; // إذن صرف | إذن إضافة

export const StockTransferView: React.FC<StockTransferViewProps> = ({
  isDark: propIsDark,
  onClose,
  initialMode = 'issue',
  autoOpenPending = false
}) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => themeService.getTheme());

  useEffect(() => {
    const unsubscribeTheme = themeService.subscribe((t) => {
      setThemeMode(t);
    });
    return () => {
      unsubscribeTheme();
    };
  }, []);

  // Guarantee isDark is always dynamically in sync with current active Theme
  const isDark = propIsDark !== undefined ? propIsDark : themeMode === 'dark';

  // 1. First choice in the screen: Document Type (نوع المستند: إذن صرف / إذن إضافة)
  const [documentType, setDocumentType] = useState<TransferDocumentType>(initialMode);

  // Company Name & System Date
  const companyName = useMemo(() => {
    try {
      const cfg = setupWizardService.getConfig();
      return cfg.companyName || 'داتا اليكس للتوريدات العمومية';
    } catch {
      return 'داتا اليكس للتوريدات العمومية';
    }
  }, []);

  const todayDate = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Active Warehouses
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => warehouseService.getActiveWarehouses());

  // Products from sales & inventory system
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>(() => {
    return salesEntryService.getState().products || [];
  });

  // Re-subscribe to warehouse and sales changes
  useEffect(() => {
    const unsubWarehouse = warehouseService.subscribe(() => {
      setWarehouses(warehouseService.getActiveWarehouses());
    });
    const unsubTransfers = stockTransferService.subscribe(() => {
      setPendingIssueNotes(stockTransferService.getPendingIssueNotes());
      setAllTransfers(stockTransferService.getAllTransfers());
    });
    return () => {
      unsubWarehouse();
      unsubTransfers();
    };
  }, []);

  // ----------------------------------------------------
  // COMMON FORM STATE
  // ----------------------------------------------------
  const [transferDate, setTransferDate] = useState<string>(todayDate);
  const [notes, setNotes] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ----------------------------------------------------
  // ISSUE NOTE STATE (إذن صرف)
  // ----------------------------------------------------
  const [issueNumber, setIssueNumber] = useState<string>(() => stockTransferService.generateNextIssueNumber());
  const [fromWarehouseId, setFromWarehouseId] = useState<string>(() => {
    return warehouses[0]?.id || '';
  });
  const [toWarehouseId, setToWarehouseId] = useState<string>(() => {
    return warehouses.length > 1 ? warehouses[1]?.id : '';
  });
  const [issueItems, setIssueItems] = useState<StockTransferItem[]>([]);

  // Product search picker for Issue Note
  const [productQuery, setProductQuery] = useState<string>('');
  const [isProductPickerOpen, setIsProductPickerOpen] = useState<boolean>(false);
  const [selectedProductForAdd, setSelectedProductForAdd] = useState<ProductItem | null>(null);
  const [addQuantity, setAddQuantity] = useState<number>(1);
  const [addItemNotes, setAddItemNotes] = useState<string>('');
  const productSearchRef = useRef<HTMLDivElement>(null);

  // Inventory Browser Modal State (دليل استعراض الأصناف ورصيد المخزون - نفس البيع والشراء)
  const [isInventoryBrowserOpen, setIsInventoryBrowserOpen] = useState<boolean>(false);
  const [inventoryModalSearch, setInventoryModalSearch] = useState<string>('');
  const [inventorySelectedCategory, setInventorySelectedCategory] = useState<string>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Categories extracted from available products
  const categories = useMemo(() => {
    return ['All', ...new Set(availableProducts.map(p => p.category).filter(Boolean))];
  }, [availableProducts]);

  // Modal filtered products matching search and category
  const filteredModalProducts = useMemo(() => {
    return availableProducts.filter(p => {
      const matchesCategory =
        inventorySelectedCategory === 'All' ||
        p.category === inventorySelectedCategory ||
        p.subCategory === inventorySelectedCategory;
      if (!matchesCategory) return false;

      if (!inventoryModalSearch.trim()) return true;
      const q = inventoryModalSearch.trim().toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.warehouse && p.warehouse.toLowerCase().includes(q)) ||
        (p.batchNumber && p.batchNumber.toLowerCase().includes(q))
      );
    });
  }, [availableProducts, inventorySelectedCategory, inventoryModalSearch]);

  const isAllFilteredSelected = useMemo(() => {
    return (
      filteredModalProducts.length > 0 &&
      filteredModalProducts.every(p => selectedProductIds.has(p.id))
    );
  }, [filteredModalProducts, selectedProductIds]);

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedProductIds(new Set());
    } else {
      const newSet = new Set(selectedProductIds);
      filteredModalProducts.forEach(p => newSet.add(p.id));
      setSelectedProductIds(newSet);
    }
  };

  const toggleProductSelection = (id: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProductIds(newSet);
  };

  // ----------------------------------------------------
  // RECEIPT NOTE STATE (إذن إضافة)
  // ----------------------------------------------------
  const [receiptNumber, setReceiptNumber] = useState<string>(() => stockTransferService.generateNextReceiptNumber());
  const [selectedIssueNote, setSelectedIssueNote] = useState<StockTransferRecord | null>(null);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState<boolean>(autoOpenPending);
  const [pendingIssueNotes, setPendingIssueNotes] = useState<StockTransferRecord[]>(() =>
    stockTransferService.getPendingIssueNotes()
  );
  const [allTransfers, setAllTransfers] = useState<StockTransferRecord[]>(() =>
    stockTransferService.getAllTransfers()
  );

  // History log modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);

  // Sorting for Stock Transfers Log (دورة ثلاثية: تصاعدي -> تنازلي -> الافتراضي)
  type HistorySortKey =
    | 'transferNumber'
    | 'receiptNumber'
    | 'date'
    | 'fromWarehouseName'
    | 'toWarehouseName'
    | 'totalItems'
    | 'totalQuantity'
    | 'status';

  const [historySortConfig, setHistorySortConfig] = useState<{
    key: HistorySortKey;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Filter for Stock Transfers Log
  const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState<boolean>(false);
  const [historyFilters, setHistoryFilters] = useState<{
    status: 'all' | 'معلق' | 'مكتمل';
    type: 'all' | 'issue' | 'receipt';
    warehouseId: string;
    fromDate: string;
    toDate: string;
    searchQuery: string;
  }>({
    status: 'all',
    type: 'all',
    warehouseId: 'all',
    fromDate: '',
    toDate: '',
    searchQuery: ''
  });

  const handleHistorySort = (key: HistorySortKey) => {
    setHistorySortConfig(prev => {
      if (prev?.key === key) {
        if (prev.direction === 'asc') {
          return { key, direction: 'desc' };
        }
        return null; // العودة إلى الترتيب الافتراضي
      }
      return { key, direction: 'asc' };
    });
  };

  const renderSortIndicator = (key: HistorySortKey) => {
    if (historySortConfig?.key !== key) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40 ml-1 inline shrink-0" />;
    }
    if (historySortConfig.direction === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-[#1565C0] dark:text-blue-400 ml-1 inline shrink-0" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-[#1565C0] dark:text-blue-400 ml-1 inline shrink-0" />;
  };

  const handleResetHistoryFilters = () => {
    setHistoryFilters({
      status: 'all',
      type: 'all',
      warehouseId: 'all',
      fromDate: '',
      toDate: '',
      searchQuery: ''
    });
    setHistorySortConfig(null);
  };

  const isHistoryFilterActive = useMemo(() => {
    return (
      historyFilters.status !== 'all' ||
      historyFilters.type !== 'all' ||
      historyFilters.warehouseId !== 'all' ||
      historyFilters.fromDate !== '' ||
      historyFilters.toDate !== '' ||
      historyFilters.searchQuery.trim() !== ''
    );
  }, [historyFilters]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (historyFilters.status !== 'all') count++;
    if (historyFilters.type !== 'all') count++;
    if (historyFilters.warehouseId !== 'all') count++;
    if (historyFilters.fromDate !== '') count++;
    if (historyFilters.toDate !== '') count++;
    if (historyFilters.searchQuery.trim() !== '') count++;
    return count;
  }, [historyFilters]);

  const displayedTransfers = useMemo(() => {
    let list = [...allTransfers];

    // فلترة حسب الحالة (مكتمل / معلق)
    if (historyFilters.status !== 'all') {
      list = list.filter(tr => tr.status === historyFilters.status);
    }

    // فلترة حسب نوع المستند
    if (historyFilters.type === 'issue') {
      list = list.filter(tr => !tr.receiptNumber);
    } else if (historyFilters.type === 'receipt') {
      list = list.filter(tr => !!tr.receiptNumber);
    }

    // فلترة حسب المخزن (المصدر أو الوجهة)
    if (historyFilters.warehouseId !== 'all') {
      list = list.filter(
        tr =>
          tr.fromWarehouseId === historyFilters.warehouseId ||
          tr.toWarehouseId === historyFilters.warehouseId
      );
    }

    // فلترة من تاريخ
    if (historyFilters.fromDate) {
      list = list.filter(tr => tr.date >= historyFilters.fromDate);
    }

    // فلترة إلى تاريخ
    if (historyFilters.toDate) {
      list = list.filter(tr => tr.date <= historyFilters.toDate);
    }

    // بحث نصي سريع
    if (historyFilters.searchQuery.trim()) {
      const q = historyFilters.searchQuery.trim().toLowerCase();
      list = list.filter(tr => {
        const matchDoc = tr.transferNumber.toLowerCase().includes(q);
        const matchRec = tr.receiptNumber?.toLowerCase().includes(q) || false;
        const matchFrom = tr.fromWarehouseName.toLowerCase().includes(q);
        const matchTo = tr.toWarehouseName.toLowerCase().includes(q);
        const matchNotes = tr.notes?.toLowerCase().includes(q) || false;
        const matchProduct = tr.items.some(
          it =>
            it.productName.toLowerCase().includes(q) ||
            it.productCode.toLowerCase().includes(q)
        );
        return matchDoc || matchRec || matchFrom || matchTo || matchNotes || matchProduct;
      });
    }

    // الفرز التفاعلي
    if (historySortConfig) {
      const { key, direction } = historySortConfig;
      list.sort((a, b) => {
        let cmp = 0;
        if (key === 'date') {
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          cmp = timeA - timeB;
          if (cmp === 0) {
            cmp = a.date.localeCompare(b.date);
          }
        } else if (key === 'totalQuantity') {
          cmp = (a.totalQuantity || 0) - (b.totalQuantity || 0);
        } else if (key === 'totalItems') {
          cmp = (a.totalItems || 0) - (b.totalItems || 0);
        } else if (key === 'transferNumber') {
          cmp = a.transferNumber.localeCompare(b.transferNumber, undefined, { numeric: true });
        } else if (key === 'receiptNumber') {
          cmp = (a.receiptNumber || '').localeCompare(b.receiptNumber || '', undefined, { numeric: true });
        } else if (key === 'fromWarehouseName') {
          cmp = a.fromWarehouseName.localeCompare(b.fromWarehouseName, 'ar');
        } else if (key === 'toWarehouseName') {
          cmp = a.toWarehouseName.localeCompare(b.toWarehouseName, 'ar');
        } else if (key === 'status') {
          cmp = a.status.localeCompare(b.status, 'ar');
        }

        return direction === 'asc' ? cmp : -cmp;
      });
    }

    return list;
  }, [allTransfers, historyFilters, historySortConfig]);

  // Edit Mode state for Pending Transfer (تعديل إذن الصرف المعلق)
  const [editingTransferId, setEditingTransferId] = useState<string | null>(null);

  // Delete Confirmation state for Pending Transfer (تأكيد حذف التحويل المعلق)
  const [transferToDelete, setTransferToDelete] = useState<StockTransferRecord | null>(null);

  // Voucher preview & printable state (طباعة وتصدير PDF / Excel لإذن الصرف)
  const [voucherModalTransfer, setVoucherModalTransfer] = useState<StockTransferRecord | null>(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState<boolean>(false);

  // Close search popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setIsProductPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for quick search
  const filteredProducts = useMemo(() => {
    if (!productQuery.trim()) return availableProducts.slice(0, 15);
    const q = productQuery.toLowerCase().trim();
    return availableProducts
      .filter(p => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
        );
      })
      .slice(0, 20);
  }, [availableProducts, productQuery]);

  // Handle warehouse changes and stock updates
  const fromWarehouseObj = useMemo(() => {
    return warehouses.find(w => w.id === fromWarehouseId) || warehouses[0];
  }, [warehouses, fromWarehouseId]);

  const toWarehouseObj = useMemo(() => {
    return warehouses.find(w => w.id === toWarehouseId);
  }, [warehouses, toWarehouseId]);

  // Add Item to Issue Note
  const handleAddItemToIssue = () => {
    if (!selectedProductForAdd) {
      showToast('يرجى اختيار الصنف أولاً.', 'error');
      return;
    }

    if (addQuantity <= 0) {
      showToast('يرجى إدخال كمية صحيحة أكبر من الصفر.', 'error');
      return;
    }

    const availableStock = stockTransferService.getProductStockInWarehouse(
      selectedProductForAdd,
      fromWarehouseId
    );

    if (addQuantity > availableStock) {
      showToast(
        `الكمية المطلوبة (${addQuantity}) تتجاوز الرصيد المتاح بالمخزن (${availableStock} ${selectedProductForAdd.unit || 'عدد'}).`,
        'error'
      );
      return;
    }

    const existingIndex = issueItems.findIndex(
      it => it.productId === selectedProductForAdd.id || it.productCode === selectedProductForAdd.code
    );

    if (existingIndex >= 0) {
      const updated = [...issueItems];
      const newQty = updated[existingIndex].quantity + addQuantity;
      if (newQty > availableStock) {
        showToast(`إجمالي الكمية (${newQty}) يتجاوز الرصيد المتاح بالمخزن (${availableStock}).`, 'error');
        return;
      }
      updated[existingIndex].quantity = newQty;
      if (addItemNotes.trim()) {
        updated[existingIndex].notes = addItemNotes.trim();
      }
      setIssueItems(updated);
    } else {
      const newItem: StockTransferItem = {
        productId: selectedProductForAdd.id,
        productCode: selectedProductForAdd.code,
        productName: selectedProductForAdd.name,
        unit: selectedProductForAdd.unit || selectedProductForAdd.basicUnit || 'عدد',
        quantity: addQuantity,
        availableStockAtSource: availableStock,
        costPrice: selectedProductForAdd.costPrice || selectedProductForAdd.averageCost || 0,
        notes: addItemNotes.trim()
      };
      setIssueItems(prev => [...prev, newItem]);
    }

    // Reset picker inputs
    setSelectedProductForAdd(null);
    setProductQuery('');
    setAddQuantity(1);
    setAddItemNotes('');
    setIsProductPickerOpen(false);
  };

  const handleRemoveIssueItem = (index: number) => {
    setIssueItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, newQty: number) => {
    if (newQty < 0) return;
    const item = issueItems[index];
    if (!item) return;
    const p = availableProducts.find(prod => prod.id === item.productId || prod.code === item.productCode);
    const available = p
      ? stockTransferService.getProductStockInWarehouse(p, fromWarehouseId)
      : (item.availableStockAtSource ?? Infinity);

    if (newQty > available) {
      showToast(`الكمية المطلوبة (${newQty}) تتجاوز الرصيد المتاح (${available} ${item.unit || 'عدد'}).`, 'error');
      return;
    }
    setIssueItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleStepItemQuantity = (index: number, step: 1 | -1) => {
    const item = issueItems[index];
    if (!item) return;
    const currentQty = Number(item.quantity) || 0;
    const newQty = currentQty + step;

    if (newQty < 0) return; // لا يسمح بالنزول إلى أقل من صفر

    if (step > 0) {
      const p = availableProducts.find(prod => prod.id === item.productId || prod.code === item.productCode);
      const available = p
        ? stockTransferService.getProductStockInWarehouse(p, fromWarehouseId)
        : (item.availableStockAtSource ?? Infinity);

      if (newQty > available) {
        showToast(`لا يمكن تجاوز الرصيد المتاح للصنف بالمخزن (${available} ${item.unit || 'عدد'}).`, 'error');
        return;
      }
    }

    setIssueItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: newQty };
      return updated;
    });
  };

  const handleStepReceiptItemQuantity = (index: number, step: 1 | -1) => {
    if (!selectedIssueNote || !selectedIssueNote.items[index]) return;
    const updated = [...selectedIssueNote.items];
    const current = Number(updated[index].quantity) || 0;
    const newQty = Math.max(0, current + step);
    updated[index] = { ...updated[index], quantity: newQty };
    const totalQty = updated.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setSelectedIssueNote({
      ...selectedIssueNote,
      items: updated,
      totalQuantity: totalQty
    });
  };

  const handleUpdateReceiptItemQuantity = (index: number, newQty: number) => {
    if (!selectedIssueNote || !selectedIssueNote.items[index]) return;
    const updated = [...selectedIssueNote.items];
    updated[index] = { ...updated[index], quantity: Math.max(0, newQty) };
    const totalQty = updated.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setSelectedIssueNote({
      ...selectedIssueNote,
      items: updated,
      totalQuantity: totalQty
    });
  };

  // ----------------------------------------------------
  // PRODUCT SELECTION HANDLERS (نفس آليات البيع والشراء)
  // ----------------------------------------------------
  // Add a product with quantity validation
  const addProductToTransfer = (
    product: ProductItem,
    qty: number = 1,
    notify: boolean = true
  ): boolean => {
    const availableStock = stockTransferService.getProductStockInWarehouse(
      product,
      fromWarehouseId
    );

    if (availableStock <= 0) {
      if (notify) {
        showToast(
          `الصنف [${product.name}] ليس له رصيد متاح في مخزن المصدر (${availableStock}).`,
          'error'
        );
      }
      return false;
    }

    const requestedQty = Math.max(1, qty);

    let success = true;
    setIssueItems(prev => {
      const existingIndex = prev.findIndex(
        it => it.productId === product.id || it.productCode === product.code
      );

      if (existingIndex >= 0) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = currentQty + requestedQty;
        if (newQty > availableStock) {
          if (notify) {
            showToast(
              `إجمالي الكمية المطلوبة للصنف [${product.name}] (${newQty}) يتجاوز الرصيد المتاح بالمخزن (${availableStock}).`,
              'error'
            );
          }
          success = false;
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          availableStockAtSource: availableStock
        };
        if (notify) {
          showToast(`تمت زيادة كمية [${product.name}] إلى ${newQty}.`, 'success');
        }
        return updated;
      } else {
        if (requestedQty > availableStock) {
          if (notify) {
            showToast(
              `الكمية المطلوبة للصنف [${product.name}] تتجاوز الرصيد المتاح بالمخزن (${availableStock}).`,
              'error'
            );
          }
          success = false;
          return prev;
        }
        const newItem: StockTransferItem = {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit || product.basicUnit || 'عدد',
          quantity: requestedQty,
          availableStockAtSource: availableStock,
          costPrice: product.costPrice || product.averageCost || 0
        };
        if (notify) {
          showToast(`تمت إضافة الصنف [${product.name}] بنجاح.`, 'success');
        }
        return [...prev, newItem];
      }
    });

    return success;
  };

  // Add all selected products from the Inventory Browser Modal
  const handleAddSelectedProducts = () => {
    if (selectedProductIds.size === 0) {
      showToast('يرجى تحديد صنف واحد على الأقل للإضافة.', 'info');
      return;
    }

    const selectedList = availableProducts.filter(p => selectedProductIds.has(p.id));
    let addedCount = 0;
    let outOfStockCount = 0;

    for (const p of selectedList) {
      const stock = stockTransferService.getProductStockInWarehouse(p, fromWarehouseId);
      if (stock > 0) {
        addProductToTransfer(p, 1, false);
        addedCount++;
      } else {
        outOfStockCount++;
      }
    }

    if (outOfStockCount > 0 && addedCount === 0) {
      showToast('كافة الأصناف المحددة ليس لها رصيد متاح في مخزن المصدر.', 'error');
    } else if (outOfStockCount > 0) {
      showToast(
        `تمت إضافة ${addedCount} صنف، وتعذر إضافة ${outOfStockCount} صنف لعدم توفر رصيد متاح بالمصدر.`,
        'info'
      );
    } else {
      showToast(`تمت إضافة ${addedCount} صنف بنجاح إلى إذن الصرف.`, 'success');
    }

    setSelectedProductIds(new Set());
    setIsInventoryBrowserOpen(false);
  };

  // «إضافة كامل المخزن» - Add full warehouse stock
  const handleAddEntireWarehouse = () => {
    if (!fromWarehouseId) {
      showToast('يرجى تحديد مخزن المصدر (من) أولاً.', 'error');
      return;
    }

    const productsWithStock = availableProducts
      .map(p => {
        const stock = stockTransferService.getProductStockInWarehouse(p, fromWarehouseId);
        return { product: p, stock };
      })
      .filter(item => item.stock > 0);

    if (productsWithStock.length === 0) {
      showToast('لا توجد أصناف ذات رصيد متاح في المخزن المصدر المحدد.', 'error');
      return;
    }

    const newItems: StockTransferItem[] = productsWithStock.map(({ product, stock }) => ({
      productId: product.id,
      productCode: product.code,
      productName: product.name,
      unit: product.unit || product.basicUnit || 'عدد',
      quantity: stock, // Transferred quantity strictly matches available balance (<= available stock)
      availableStockAtSource: stock,
      costPrice: product.costPrice || product.averageCost || 0,
      notes: 'تحويل كامل رصيد المخزن'
    }));

    setIssueItems(newItems);
    showToast(
      `تمت إضافة كامل أصناف المخزن (${newItems.length} صنف) بإجمالي كمية (${newItems.reduce(
        (sum, it) => sum + it.quantity,
        0
      )}) بنجاح.`,
      'success'
    );
    setIsInventoryBrowserOpen(false);
  };

  // ----------------------------------------------------
  // SAVE / UPDATE ISSUE NOTE (إذن صرف)
  // ----------------------------------------------------
  const handleSaveIssue = () => {
    if (!fromWarehouseId || !toWarehouseId) {
      showToast('يرجى تحديد مخزن المصدر ومخزن الوجهة.', 'error');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      showToast('لا يمكن التحويل لنفس المخزن. يرجى اختيار مخزن وجهة مختلف.', 'error');
      return;
    }

    if (issueItems.length === 0) {
      showToast('يرجى إضافة صنف واحد على الأقل لإذن الصرف.', 'error');
      return;
    }

    for (const it of issueItems) {
      if (!it.quantity || it.quantity <= 0) {
        showToast(`الكمية المحددة للصنف (${it.productName}) يجب أن تكون أكبر من الصفر.`, 'error');
        return;
      }
    }

    const fromWh = warehouses.find(w => w.id === fromWarehouseId);
    const toWh = warehouses.find(w => w.id === toWarehouseId);

    // If we are currently editing an existing pending transfer note:
    if (editingTransferId) {
      const result = stockTransferService.updateTransferIssue(editingTransferId, {
        date: transferDate,
        fromWarehouseId,
        fromWarehouseName: fromWh?.name || 'مخزن المصدر',
        toWarehouseId,
        toWarehouseName: toWh?.name || 'مخزن الوجهة',
        items: issueItems,
        notes
      });

      if (!result.success) {
        showToast(result.error || 'فشل حفظ تعديلات إذن الصرف.', 'error');
        return;
      }

      showToast(`تم حفظ تعديلات إذن الصرف المعلق [${result.transfer?.transferNumber}] بنجاح!`, 'success');

      // Reset Form & Edit mode
      setEditingTransferId(null);
      setIssueItems([]);
      setNotes('');
      setIssueNumber(stockTransferService.generateNextIssueNumber());
      setAvailableProducts([...salesEntryService.getState().products]);
      setAllTransfers(stockTransferService.getAllTransfers());
      setPendingIssueNotes(stockTransferService.getPendingIssueNotes());
      return;
    }

    const result = stockTransferService.saveTransferIssue({
      transferNumber: issueNumber,
      date: transferDate,
      fromWarehouseId,
      fromWarehouseName: fromWh?.name || 'مخزن المصدر',
      toWarehouseId,
      toWarehouseName: toWh?.name || 'مخزن الوجهة',
      items: issueItems,
      notes,
      createdBy: 'أمين المخزن'
    });

    if (!result.success) {
      showToast(result.error || 'فشل حفظ إذن الصرف.', 'error');
      return;
    }

    showToast(`تم حفظ إذن الصرف [${result.transfer?.transferNumber}] بنجاح! الحالة: معلق`, 'success');

    // Reset Form for next entry
    setIssueItems([]);
    setNotes('');
    setIssueNumber(stockTransferService.generateNextIssueNumber());
    setAvailableProducts([...salesEntryService.getState().products]);
    setAllTransfers(stockTransferService.getAllTransfers());
    setPendingIssueNotes(stockTransferService.getPendingIssueNotes());
  };

  // ----------------------------------------------------
  // EDIT PENDING TRANSFER (تعديل إذن الصرف المعلق)
  // ----------------------------------------------------
  const handleStartEditTransfer = (record: StockTransferRecord) => {
    if (record.status !== 'معلق') {
      showToast('لا يمكن تعديل هذا التحويل لأنه مكتمل بالفعل.', 'error');
      return;
    }

    // Switch to issue view
    setDocumentType('issue');
    setEditingTransferId(record.id);
    setIssueNumber(record.transferNumber);
    setTransferDate(record.date);
    setFromWarehouseId(record.fromWarehouseId);
    setToWarehouseId(record.toWarehouseId);
    setNotes(record.notes || '');

    // Map items with updated available stock considering current deduction
    const currentProducts = salesEntryService.getState().products;
    const updatedItems: StockTransferItem[] = record.items.map(it => {
      const p = currentProducts.find(prod => prod.id === it.productId || prod.code === it.productCode);
      let available = it.availableStockAtSource || it.quantity;
      if (p) {
        const whStock = stockTransferService.getProductStockInWarehouse(p, record.fromWarehouseId);
        available = whStock + it.quantity;
      }
      return {
        ...it,
        availableStockAtSource: available
      };
    });

    setIssueItems(updatedItems);
    setIsHistoryModalOpen(false);
    showToast(`تم تحميل بيانات إذن الصرف المعلق [${record.transferNumber}] في شاشة التحويل لتعديلها.`, 'info');
  };

  const handleCancelEdit = () => {
    setEditingTransferId(null);
    setIssueItems([]);
    setNotes('');
    setIssueNumber(stockTransferService.generateNextIssueNumber());
    showToast('تم إلغاء وضع التعديل والعودة لإدخال إذن صرف جديد.', 'info');
  };

  // ----------------------------------------------------
  // DELETE PENDING TRANSFER (حذف إذن الصرف المعلق)
  // ----------------------------------------------------
  const handleConfirmDelete = () => {
    if (!transferToDelete) return;

    const res = stockTransferService.deletePendingTransfer(transferToDelete.id);
    if (!res.success) {
      showToast(res.error || 'فشل حذف التحويل المعلق.', 'error');
      return;
    }

    // If currently editing this transfer in form, reset it
    if (editingTransferId === transferToDelete.id) {
      handleCancelEdit();
    }

    setAllTransfers(stockTransferService.getAllTransfers());
    setPendingIssueNotes(stockTransferService.getPendingIssueNotes());
    setAvailableProducts([...salesEntryService.getState().products]);
    showToast(
      `تم حذف إذن الصرف المعلق [${transferToDelete.transferNumber}] واستعادة الكميات لمخزن (${transferToDelete.fromWarehouseName}) بنجاح.`,
      'success'
    );
    setTransferToDelete(null);
  };

  // ----------------------------------------------------
  // EXCEL EXPORT (تصدير إذن الصرف كفورمة رسمية مطابقة للـ PDF)
  // ----------------------------------------------------
  const handleExportTransferExcel = (transfer: StockTransferRecord) => {
    try {
      const ws: any = {};
      const merges: any[] = [];
      const rows: any[] = [];
      let currentRow = 0;
      const lastColIdx = 5; // 6 أعمدة: (0: م، 1: كود الصنف، 2: اسم وبيان الصنف، 3: الوحدة، 4: الكمية، 5: ملاحظات الصنف)

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

      const defaultFont = 'Segoe UI';

      // 1. ترويسة التقرير العليا (اسم الشركة + عنوان الإذن الرسمي)
      // اليمين: اسم الشركة
      mergeAndStyle(currentRow, 0, currentRow, 2, companyName || 'شركة صيدليات الندى', 's', {
        font: { name: defaultFont, bold: true, sz: 14, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '0F172A' } },
          right: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } }
        }
      });

      // اليسار: عنوان الإذن الرسمي
      mergeAndStyle(currentRow, 3, currentRow, lastColIdx, 'إذن صرف بإضافة تحويل مخزني', 's', {
        font: { name: defaultFont, bold: true, sz: 13, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1565C0' } }, // هوية VERTEX الزرقاء
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '0D47A1' } },
          left: { style: 'medium', color: { rgb: '0D47A1' } },
          bottom: { style: 'thin', color: { rgb: '0D47A1' } }
        }
      });
      rows.push({ hpt: 30 });
      currentRow++;

      // 2. سطر التعريف بالنظام والتاريخ
      mergeAndStyle(currentRow, 0, currentRow, 2, 'نظام فيرتكس لإدارة المخازن والمستودعات', 's', {
        font: { name: defaultFont, bold: false, sz: 9.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          right: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } }
        }
      });

      mergeAndStyle(currentRow, 3, currentRow, lastColIdx, `تاريخ الإذن: ${transfer.date}`, 's', {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '1E293B' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          left: { style: 'medium', color: { rgb: '0F172A' } },
          bottom: { style: 'medium', color: { rgb: '0F172A' } }
        }
      });
      rows.push({ hpt: 22 });
      currentRow++;

      // سطر فاصل
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 10 });
      currentRow++;

      // 3. بوكس بيانات الإذن المخزني (Metadata Information Box)
      const labelStyle = {
        font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '475569' } },
        fill: { fgColor: { rgb: 'F1F5F9' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      const valueStyle = {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'right', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: 'CBD5E1' } },
          bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      // السطر 1: مسلسل إذن الصرف + حالة الإذن
      setCell(currentRow, 0, 'مسلسل إذن الصرف:', 's', labelStyle);
      mergeAndStyle(currentRow, 1, currentRow, 2, transfer.transferNumber, 's', {
        ...valueStyle,
        font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '1565C0' } }
      });

      setCell(currentRow, 3, 'حالة الإذن:', 's', labelStyle);
      const isPending = transfer.status === 'معلق';
      mergeAndStyle(
        currentRow,
        4,
        currentRow,
        lastColIdx,
        isPending ? 'معلق (بانتظار إذن الإضافة بالاستلام)' : 'مكتمل ومستلم',
        's',
        {
          ...valueStyle,
          font: {
            name: defaultFont,
            bold: true,
            sz: 10,
            color: { rgb: isPending ? 'B45309' : '047857' }
          },
          fill: { fgColor: { rgb: isPending ? 'FEF3C7' : 'D1FAE5' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      );
      rows.push({ hpt: 24 });
      currentRow++;

      // السطر 2: مخزن المصدر (من) + مخزن الوجهة (إلى)
      setCell(currentRow, 0, 'مخزن المصدر (من):', 's', labelStyle);
      mergeAndStyle(currentRow, 1, currentRow, 2, transfer.fromWarehouseName, 's', valueStyle);

      setCell(currentRow, 3, 'مخزن الوجهة (إلى):', 's', labelStyle);
      mergeAndStyle(currentRow, 4, currentRow, lastColIdx, transfer.toWarehouseName, 's', valueStyle);
      rows.push({ hpt: 24 });
      currentRow++;

      // السطر 3: رقم إذن الإضافة المقابل + المسؤول
      setCell(currentRow, 0, 'إذن الإضافة المقابل:', 's', labelStyle);
      mergeAndStyle(
        currentRow,
        1,
        currentRow,
        2,
        transfer.receiptNumber || '— (لم يتم إنشاء إذن إضافة بعد)',
        's',
        {
          ...valueStyle,
          font: {
            name: defaultFont,
            bold: true,
            sz: 10.5,
            color: { rgb: transfer.receiptNumber ? '047857' : '94A3B8' }
          }
        }
      );

      setCell(currentRow, 3, 'المسؤول المنفذ:', 's', labelStyle);
      mergeAndStyle(currentRow, 4, currentRow, lastColIdx, transfer.createdBy || 'أمين المخزن', 's', valueStyle);
      rows.push({ hpt: 24 });
      currentRow++;

      // السطر 4: الملاحظات (إن وجدت)
      if (transfer.notes) {
        setCell(currentRow, 0, 'ملاحظات الإذن:', 's', labelStyle);
        mergeAndStyle(currentRow, 1, currentRow, lastColIdx, transfer.notes, 's', {
          ...valueStyle,
          font: { name: defaultFont, bold: false, sz: 10, color: { rgb: '334155' } }
        });
        rows.push({ hpt: 24 });
        currentRow++;
      }

      // سطر فاصل قبل الجدول
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 12 });
      currentRow++;

      // 4. ترويسة جدول الأصناف
      const thStyle = {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1565C0' } }, // هوية VERTEX الزرقاء
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'medium', color: { rgb: '0D47A1' } },
          bottom: { style: 'medium', color: { rgb: '0D47A1' } },
          left: { style: 'thin', color: { rgb: '90CAF9' } },
          right: { style: 'thin', color: { rgb: '90CAF9' } }
        }
      };

      setCell(currentRow, 0, 'م', 's', thStyle);
      setCell(currentRow, 1, 'كود الصنف', 's', thStyle);
      setCell(currentRow, 2, 'اسم وبيان الصنف', 's', thStyle);
      setCell(currentRow, 3, 'الوحدة', 's', thStyle);
      setCell(currentRow, 4, 'الكمية', 's', thStyle);
      setCell(currentRow, 5, 'ملاحظات الصنف', 's', thStyle);
      rows.push({ hpt: 26 });
      currentRow++;

      // 5. صفوف الأصناف
      let col0W = 8;
      let col1W = 18;
      let col2W = 40;
      let col3W = 14;
      let col4W = 16;
      let col5W = 28;

      transfer.items.forEach((item, idx) => {
        const isEven = idx % 2 === 0;
        const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';

        const cellBorder = {
          top: { style: 'thin', color: { rgb: 'E2E8F0' } },
          bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
          left: { style: 'thin', color: { rgb: 'E2E8F0' } },
          right: { style: 'thin', color: { rgb: 'E2E8F0' } }
        };

        // م
        setCell(currentRow, 0, idx + 1, 'n', {
          font: { name: defaultFont, bold: true, sz: 9.5, color: { rgb: '475569' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: cellBorder
        });

        // كود الصنف
        setCell(currentRow, 1, item.productCode, 's', {
          font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: cellBorder
        });

        // اسم وبيان الصنف
        setCell(currentRow, 2, item.productName, 's', {
          font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'right', vertical: 'center' },
          border: cellBorder
        });

        // الوحدة
        setCell(currentRow, 3, item.unit || 'عدد', 's', {
          font: { name: defaultFont, bold: false, sz: 9.5, color: { rgb: '334155' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: cellBorder
        });

        // الكمية
        setCell(currentRow, 4, item.quantity, 'n', {
          font: { name: defaultFont, bold: true, sz: 11, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: cellBorder
        });

        // ملاحظات الصنف
        setCell(currentRow, 5, item.notes || '—', 's', {
          font: { name: defaultFont, bold: false, sz: 9, color: { rgb: '64748B' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { horizontal: 'right', vertical: 'center' },
          border: cellBorder
        });

        // حساب العرض التلقائي
        col1W = Math.max(col1W, (item.productCode || '').length + 4);
        col2W = Math.max(col2W, (item.productName || '').length + 6);
        col3W = Math.max(col3W, (item.unit || '').length + 4);
        col4W = Math.max(col4W, String(item.quantity || '').length + 6);
        if (item.notes) {
          col5W = Math.max(col5W, item.notes.length + 4);
        }

        rows.push({ hpt: 22 });
        currentRow++;
      });

      // 6. صف الإجماليات (Totals Row)
      const totalBorderStyle = {
        top: { style: 'medium', color: { rgb: '475569' } },
        bottom: { style: 'double', color: { rgb: '1E293B' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } }
      };

      // إجمالي الأصناف (مدمج للأعمدة 0-2)
      mergeAndStyle(
        currentRow,
        0,
        currentRow,
        2,
        `إجمالي الأصناف: ${transfer.totalItems} صنف`,
        's',
        {
          font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '0F172A' } },
          fill: { fgColor: { rgb: 'F1F5F9' } },
          alignment: { horizontal: 'right', vertical: 'center' },
          border: totalBorderStyle
        }
      );

      // خانة الإجمالي
      setCell(currentRow, 3, 'الإجمالي:', 's', {
        font: { name: defaultFont, bold: true, sz: 10.5, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: totalBorderStyle
      });

      // إجمالي الكمية
      setCell(currentRow, 4, transfer.totalQuantity, 'n', {
        font: { name: defaultFont, bold: true, sz: 12, color: { rgb: '1565C0' } },
        fill: { fgColor: { rgb: 'E2E8F0' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: totalBorderStyle
      });

      // عمود الملاحظات خالي في سطر الإجمالي
      setCell(currentRow, 5, '', 's', {
        fill: { fgColor: { rgb: 'F1F5F9' } },
        border: totalBorderStyle
      });

      rows.push({ hpt: 26 });
      currentRow++;

      // سطر فاصل قبل خانات الاعتماد
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 16 });
      currentRow++;

      // 7. خانات الاعتماد والتوقيعات (Signatures Section)
      // نفس المربعات الأربعة الموجودة في PDF:
      // (1) أمين مخزن الصرف (الأعمدة 0-1)
      // (2) مندوب / سائق النقل (العمود 2)
      // (3) أمين مخزن الاستلام (الأعمدة 3-4)
      // (4) اعتماد إدارة المخازن (العمود 5)

      // سطر أسماء المناصب
      const sigHeaderStyle = {
        font: { name: defaultFont, bold: true, sz: 10, color: { rgb: '1E293B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '64748B' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      mergeAndStyle(currentRow, 0, currentRow, 1, 'أمين مخزن الصرف', 's', sigHeaderStyle);
      setCell(currentRow, 2, 'مندوب / سائق النقل', 's', sigHeaderStyle);
      mergeAndStyle(currentRow, 3, currentRow, 4, 'أمين مخزن الاستلام', 's', sigHeaderStyle);
      setCell(currentRow, 5, 'اعتماد إدارة المخازن', 's', sigHeaderStyle);
      rows.push({ hpt: 22 });
      currentRow++;

      // سطر التوقيع الفعلي (مساحة كافية للتوقيع أو الختم)
      const sigAreaStyle = {
        font: { name: defaultFont, bold: false, sz: 9, color: { rgb: '94A3B8' } },
        fill: { fgColor: { rgb: 'FFFFFF' } },
        alignment: { horizontal: 'center', vertical: 'bottom' },
        border: {
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      mergeAndStyle(currentRow, 0, currentRow, 1, '................................', 's', sigAreaStyle);
      setCell(currentRow, 2, '................................', 's', sigAreaStyle);
      mergeAndStyle(currentRow, 3, currentRow, 4, '................................', 's', sigAreaStyle);
      setCell(currentRow, 5, '................................', 's', sigAreaStyle);
      rows.push({ hpt: 30 });
      currentRow++;

      // سطر بيان التوقيع أسفل خانة التوقيع
      const sigFooterStyle = {
        font: { name: defaultFont, bold: false, sz: 8.5, color: { rgb: '64748B' } },
        fill: { fgColor: { rgb: 'F8FAFC' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          bottom: { style: 'thin', color: { rgb: '64748B' } },
          left: { style: 'thin', color: { rgb: 'CBD5E1' } },
          right: { style: 'thin', color: { rgb: 'CBD5E1' } }
        }
      };

      mergeAndStyle(currentRow, 0, currentRow, 1, 'التوقيع والتاريخ', 's', sigFooterStyle);
      setCell(currentRow, 2, 'التوقيع ورقم المركبة', 's', sigFooterStyle);
      mergeAndStyle(currentRow, 3, currentRow, 4, 'التوقيع والتاريخ', 's', sigFooterStyle);
      setCell(currentRow, 5, 'الختم والاعتماد', 's', sigFooterStyle);
      rows.push({ hpt: 18 });
      currentRow++;

      // سطر فاصل أخير
      for (let c = 0; c <= lastColIdx; c++) setCell(currentRow, c, '', 's');
      rows.push({ hpt: 8 });
      currentRow++;

      // سطر تذييل المستند
      mergeAndStyle(
        currentRow,
        0,
        currentRow,
        lastColIdx,
        `تم استخراج إذن التحويل المخزني عبر نظام فيرتكس لإدارة المخازن - تاريخ التصدير: ${transfer.date}`,
        's',
        {
          font: { name: defaultFont, italic: true, sz: 8, color: { rgb: '94A3B8' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        }
      );
      rows.push({ hpt: 16 });
      currentRow++;

      // 8. إعداد أبعاد الشيت والطباعة والـ RTL
      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: currentRow - 1, c: lastColIdx }
      });
      ws['!merges'] = merges;
      ws['!rows'] = rows;
      ws['!cols'] = [
        { wch: Math.min(Math.max(col0W, 8), 12) },   // م
        { wch: Math.min(Math.max(col1W, 16), 26) },  // كود الصنف
        { wch: Math.min(Math.max(col2W, 36), 55) },  // اسم وبيان الصنف
        { wch: Math.min(Math.max(col3W, 12), 18) },  // الوحدة
        { wch: Math.min(Math.max(col4W, 14), 22) },  // الكمية
        { wch: Math.min(Math.max(col5W, 24), 45) }   // ملاحظات الصنف
      ];

      // إعدادات العرض بالاتجاه من اليمين لليسار (RTL)
      ws['!views'] = [{ rightToLeft: true, RTL: true }];

      // إعدادات الطباعة داخل Excel
      ws['!margins'] = { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 };
      ws['!pageSetup'] = {
        orientation: 'portrait',
        paperSize: 9, // A4
        fitToWidth: 1,
        fitToHeight: 0
      };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'إذن صرف بإضافة تحويل');
      wb.Workbook = { Views: [{ RTL: true }] };

      const filename = `إذن_تحويل_مخزني_${transfer.transferNumber}_${transfer.date}.xlsx`;
      XLSX.writeFile(wb, filename);

      showToast(`تم تصدير إذن التحويل [${transfer.transferNumber}] كفورمة Excel رسمية بنجاح.`, 'success');
    } catch (err) {
      console.error('Error exporting transfer to Excel:', err);
      showToast('حدث خطأ أثناء تصدير ملف Excel.', 'error');
    }
  };

  // ----------------------------------------------------
  // PDF EXPORT (تصدير إذن الصرف إلى PDF)
  // ----------------------------------------------------
  const handleExportTransferPdf = async (transfer: StockTransferRecord) => {
    try {
      setVoucherModalTransfer(transfer);
      showToast(`جاري تجهيز وتصدير إذن الصرف [${transfer.transferNumber}] كملف PDF...`, 'info');

      setTimeout(async () => {
        const el = document.getElementById('stock-transfer-voucher-printable-area');
        if (el) {
          await exportVertexReportToPdf(el, {
            filename: `إذن_صرف_تحويل_${transfer.transferNumber}.pdf`,
            orientation: 'portrait',
            scale: 2
          });
          showToast(`تم تصدير إذن الصرف [${transfer.transferNumber}] إلى PDF بنجاح.`, 'success');
        } else {
          showToast('تعذر العثور على منطقة الطباعة.', 'error');
        }
      }, 350);
    } catch (err) {
      console.error('Error exporting transfer to PDF:', err);
      showToast('حدث خطأ أثناء تصدير ملف PDF.', 'error');
    }
  };

  // ----------------------------------------------------
  // PRINT TRANSFER (طباعة إذن الصرف)
  // ----------------------------------------------------
  const handlePrintTransfer = (transfer: StockTransferRecord) => {
    setVoucherModalTransfer(transfer);
    setIsVoucherModalOpen(true);
  };

  // ----------------------------------------------------
  // SELECT PENDING ISSUE NOTE FOR RECEIPT (إذن إضافة)
  // ----------------------------------------------------
  const handleSelectPendingIssue = (transfer: StockTransferRecord) => {
    setSelectedIssueNote(transfer);
    setIsPendingModalOpen(false);
    showToast(`تم تحميل بيانات إذن الصرف رقم [${transfer.transferNumber}] بنجاح.`, 'info');
  };

  // ----------------------------------------------------
  // SAVE RECEIPT NOTE (إذن إضافة)
  // ----------------------------------------------------
  const handleSaveReceipt = () => {
    if (!selectedIssueNote) {
      showToast('يرجى الضغط على زر "إذن" واختيار إذن الصرف المعلق أولاً.', 'error');
      return;
    }

    // Sync any user-adjusted receipt item quantities before completing transfer
    const allTransfers = stockTransferService.getAllTransfers();
    const targetTransfer = allTransfers.find(t => t.id === selectedIssueNote.id);
    if (targetTransfer && selectedIssueNote.items) {
      targetTransfer.items = selectedIssueNote.items.map(it => ({ ...it }));
      targetTransfer.totalQuantity = selectedIssueNote.items.reduce((sum, it) => sum + (it.quantity || 0), 0);
    }

    const result = stockTransferService.saveTransferReceipt({
      issueTransferId: selectedIssueNote.id,
      receiptNumber,
      date: transferDate,
      notes,
      completedBy: 'أمين مخزن الاستلام'
    });

    if (!result.success) {
      showToast(result.error || 'فشل حفظ إذن الإضافة.', 'error');
      return;
    }

    showToast(`تم حفظ إذن الإضافة [${result.transfer?.receiptNumber}] واعتماد التحويل بنجاح!`, 'success');

    // Reset Receipt Form
    setSelectedIssueNote(null);
    setNotes('');
    setReceiptNumber(stockTransferService.generateNextReceiptNumber());
    setAvailableProducts([...salesEntryService.getState().products]);
  };

  return (
    <div
      className={`w-full h-full flex flex-col overflow-y-auto font-sans select-none transition-colors duration-200 ${
        isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
      dir="rtl"
    >
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center space-x-3 space-x-reverse border text-sm font-semibold transition-all animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
              : toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
              : 'bg-[#1565C0] text-white border-blue-500 shadow-blue-600/30'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
          {toast.type === 'info' && <Boxes className="w-5 h-5 shrink-0" />}
          <span>{toast.text}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="hover:opacity-75 transition-opacity mr-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Screen Header - Same single-line compact header format */}
      <div
        className={`px-5 py-3.5 border-b shrink-0 flex items-center justify-between ${
          isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white shadow-sm'
        }`}
      >
        {/* Right side: Company Name */}
        <div className="flex items-center space-x-2.5 space-x-reverse min-w-[200px]">
          <Building2 className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-[#1565C0]'}`} />
          <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100">
            {companyName}
          </span>
        </div>

        {/* Center: Title on same line */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-blue-950 border border-blue-800' : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <ArrowRightLeft className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-[#1565C0]'}`} />
          </div>
          <h1 className="text-base sm:text-lg font-black text-[#1565C0] dark:text-blue-400 tracking-tight">
            إجراء تحويل مخزني
          </h1>
        </div>

        {/* Left side: Close Button (if provided) */}
        <div className="flex items-center space-x-3 space-x-reverse min-w-[200px] justify-end">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
              title="إغلاق الشاشة"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Form Container */}
      <div className="p-4 sm:p-5 space-y-4 max-w-6xl mx-auto w-full">
        {/* ============================================================== */}
        {/* 1. DOCUMENT TYPE SELECTOR & TOP CONTROLS (المنطقة العلوية)     */}
        {/* ============================================================== */}
        <div
          className={`p-2.5 sm:p-3 rounded-xl border transition-all ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-3">
            {/* يمين: منطقة نوع المستند واضحة ومميزة في إطار بصري أنيق */}
            <div className="flex items-center space-x-2.5 space-x-reverse shrink-0">
              <div
                className={`flex items-center space-x-1.5 space-x-reverse px-2.5 py-1.5 rounded-lg border text-xs sm:text-sm font-bold ${
                  isDark
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                    : 'bg-slate-100/90 border-slate-200 text-slate-700'
                }`}
              >
                <Layers className="w-4 h-4 text-[#1565C0] dark:text-blue-400 ml-1.5" />
                <span>نوع المستند:</span>
              </div>
              <div
                className={`inline-flex rounded-lg p-1 border shadow-2xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-300/80'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDocumentType('issue')}
                  className={`px-4 sm:px-5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    documentType === 'issue'
                      ? 'bg-[#1565C0] text-white shadow-sm'
                      : isDark
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  إذن صرف
                </button>
                <button
                  type="button"
                  onClick={() => setDocumentType('receipt')}
                  className={`px-4 sm:px-5 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    documentType === 'receipt'
                      ? 'bg-[#1565C0] text-white shadow-sm'
                      : isDark
                      ? 'text-slate-300 hover:text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  إذن إضافة
                </button>
              </div>
            </div>

            {/* فاصل بصري واضح ومحدد بين مجموعة نوع المستند ومجموعة سجل التحويلات والتاريخ */}
            <div className="hidden sm:block h-7 w-px bg-slate-300 dark:bg-slate-700 mx-2" />

            {/* يسار منطقة نوع المستند: سجل التحويلات والتاريخ مع الـ Symmetry والـ Spacing */}
            <div className="flex items-center space-x-2.5 space-x-reverse sm:space-x-3 shrink-0">
              {/* زر «سجل التحويلات» */}
              <button
                type="button"
                id="btn-stock-transfer-history"
                onClick={() => setIsHistoryModalOpen(true)}
                className={`px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center space-x-1.5 space-x-reverse border transition-all cursor-pointer active:scale-95 shadow-2xs ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title="سجل التحويلات السابقة"
              >
                <Clock className="w-4 h-4 text-[#1565C0] dark:text-blue-400 ml-1.5" />
                <span>سجل التحويلات</span>
              </button>

              <div className="h-5 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

              {/* التاريخ */}
              <div
                className={`flex items-center space-x-1.5 space-x-reverse px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold border ${
                  isDark
                    ? 'bg-slate-950/80 border-slate-800 text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title="تاريخ اليوم"
              >
                <Calendar className="w-4 h-4 text-slate-400 ml-1.5" />
                <span>{todayDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 2. CONDITIONAL VIEW BASED ON DOCUMENT TYPE                      */}
        {/* ============================================================== */}
        {documentType === 'issue' ? (
          /* ============================================================ */
          /* إذن صرف                                                      */
          /* ============================================================ */
          <>
            {/* شريط حالة التعديل عند تحميل إذن صرف معلق */}
            {editingTransferId && (
              <div
                className={`mb-4 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in ${
                  isDark
                    ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center space-x-2.5 space-x-reverse">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shrink-0">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm flex items-center space-x-2 space-x-reverse">
                      <span>أنت الآن في وضع تعديل إذن الصرف المعلق:</span>
                      <span className="font-mono font-black underline text-amber-700 dark:text-amber-300">
                        {issueNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                        معلق
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      يمكنك تعديل المخازن والأصناف والكميات. سيتم تحديث نفس الإذن دون إنشاء مسلسل جديد مع بقائه بحالة معلق.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    isDark
                      ? 'border-amber-700 bg-amber-900/40 hover:bg-amber-800 text-amber-100'
                      : 'border-amber-300 bg-white hover:bg-amber-100 text-amber-900'
                  }`}
                >
                  إلغاء التعديل
                </button>
              </div>
            )}

            {/* المخازن ومسلسل إذن الصرف */}
            <div
              className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* مسلسل إذن الصرف */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                      مسلسل إذن الصرف:
                    </label>
                    {editingTransferId && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        (نفس رقم الإذن الأصلي)
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex items-center px-3.5 py-2.5 rounded-lg border font-mono font-bold text-xs sm:text-sm ${
                      editingTransferId
                        ? isDark
                          ? 'bg-amber-950/40 border-amber-800/80 text-amber-300'
                          : 'bg-amber-50 border-amber-300 text-amber-900'
                        : isDark
                        ? 'bg-slate-950 border-blue-900/60 text-blue-400'
                        : 'bg-blue-50/70 border-blue-200 text-[#1565C0]'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5 space-x-reverse">
                      <FileText className={`w-4 h-4 ml-1.5 ${editingTransferId ? 'text-amber-500' : 'text-blue-500'}`} />
                      <span>{issueNumber}</span>
                    </span>
                  </div>
                </div>

                {/* مخزن من */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    <span className="text-rose-500 ml-0.5">*</span>
                    مخزن من:
                  </label>
                  <select
                    value={fromWarehouseId}
                    onChange={e => {
                      setFromWarehouseId(e.target.value);
                      if (issueItems.length > 0) {
                        setIssueItems([]);
                        showToast('تم تغيير مخزن المصدر، يرجى إعادة اختيار الأصناف.', 'info');
                      }
                    }}
                    className={`w-full text-xs font-bold rounded-lg px-3 py-2.5 border transition-colors ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* مخزن إلى */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    <span className="text-rose-500 ml-0.5">*</span>
                    مخزن إلى:
                  </label>
                  <select
                    value={toWarehouseId}
                    onChange={e => setToWarehouseId(e.target.value)}
                    className={`w-full text-xs font-bold rounded-lg px-3 py-2.5 border transition-colors ${
                      toWarehouseId === fromWarehouseId
                        ? 'border-rose-500 bg-rose-50/30'
                        : isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    <option value="">-- اختر مخزن الوجهة --</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} disabled={w.id === fromWarehouseId}>
                        {w.name} ({w.code}) {w.id === fromWarehouseId ? '(نفس المصدر)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* اختيار الأصناف والكميات */}
            <div
              className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-end gap-3 mb-4">
                {/* Product Search & Autocomplete with "استعراض الأصناف" button */}
                <div className="flex-1 relative" ref={productSearchRef}>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    اختيار الأصناف ورصيد المخزون:
                  </label>
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      id="transfer-browse-products-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setInventoryModalSearch('');
                        setIsInventoryBrowserOpen(true);
                      }}
                      title="فتح كل الأصناف واستعراض رصيد المخزون"
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-blue-500/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer z-10 flex items-center space-x-1.5 space-x-reverse text-xs"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hidden sm:inline">
                        استعراض الأصناف
                      </span>
                    </button>

                    <input
                      type="text"
                      placeholder="ابحث عن صنف بالاسم أو الكود..."
                      value={productQuery}
                      onChange={e => {
                        setProductQuery(e.target.value);
                        setIsProductPickerOpen(true);
                      }}
                      onFocus={() => setIsProductPickerOpen(true)}
                      className={`w-full text-xs rounded-lg pr-9 pl-10 sm:pl-36 py-2.5 border transition-colors font-medium ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-blue-500'
                          : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                      }`}
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>

                  {/* Autocomplete dropdown */}
                  {isProductPickerOpen && (
                    <div
                      className={`absolute z-30 right-0 left-0 mt-1 max-h-64 overflow-y-auto rounded-xl border shadow-xl ${
                        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                      }`}
                    >
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-400">
                          لا توجد أصناف مطابقة للبحث
                        </div>
                      ) : (
                        <div className="p-1.5 space-y-1">
                          {filteredProducts.map(p => {
                            const stockInWh = stockTransferService.getProductStockInWarehouse(
                              p,
                              fromWarehouseId
                            );
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  setSelectedProductForAdd(p);
                                  setIsProductPickerOpen(false);
                                  setProductQuery(`${p.code} - ${p.name}`);
                                }}
                                className={`w-full text-right p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="font-bold">
                                  <span className="font-mono text-slate-400 ml-1">[{p.code}]</span>
                                  <span>{p.name}</span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    stockInWh > 0
                                      ? isDark
                                        ? 'bg-emerald-950/60 text-emerald-400'
                                        : 'bg-emerald-50 text-emerald-700'
                                      : 'bg-rose-50 text-rose-600'
                                  }`}
                                >
                                  متاح بالمصدر: {stockInWh} {p.unit || 'عدد'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* الرصيد المتاح بالمصدر للصنف المختار */}
                <div className="w-28 shrink-0">
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    الرصيد المتاح:
                  </label>
                  <div
                    className={`text-xs font-bold rounded-lg px-2 py-2.5 border text-center ${
                      selectedProductForAdd
                        ? isDark
                          ? 'bg-slate-950 border-blue-900/60 text-blue-400'
                          : 'bg-blue-50/50 border-blue-200 text-[#1565C0]'
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {selectedProductForAdd
                      ? `${stockTransferService.getProductStockInWarehouse(
                          selectedProductForAdd,
                          fromWarehouseId
                        )} ${selectedProductForAdd.unit || 'عدد'}`
                      : '—'}
                  </div>
                </div>

                {/* الكمية */}
                <div className="w-32 shrink-0">
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    الكمية:
                  </label>
                  <div className={`flex items-center rounded-lg border p-0.5 shadow-xs ${
                    isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setAddQuantity(prev => Math.max(1, prev - 1))}
                      disabled={addQuantity <= 1}
                      className={`w-7 h-8 flex items-center justify-center rounded disabled:opacity-40 cursor-pointer ${
                        isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="إنقاص الكمية (-1)"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={addQuantity}
                      onChange={e => setAddQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className={`w-full text-center font-black text-sm py-1 bg-transparent border-0 focus:outline-none ${
                        isDark ? 'text-slate-100' : 'text-slate-800'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setAddQuantity(prev => prev + 1)}
                      className={`w-7 h-8 flex items-center justify-center rounded cursor-pointer ${
                        isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                      title="زيادة الكمية (+1)"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* زر إضافة الصنف */}
                <div className="w-12 shrink-0">
                  <button
                    type="button"
                    onClick={handleAddItemToIssue}
                    disabled={!selectedProductForAdd}
                    className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center transition-all shadow-sm ${
                      selectedProductForAdd
                        ? 'bg-[#1565C0] hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                        : isDark
                        ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    title="إضافة الصنف"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* جدول الأصناف المصروفة */}
              <div
                className={`overflow-x-auto rounded-lg border transition-colors ${
                  isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                }`}
              >
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr
                      className={`font-extrabold border-b text-sm transition-colors ${
                        isDark ? 'bg-slate-800/90 border-slate-700 text-slate-100' : 'bg-slate-100/90 border-slate-300 text-slate-800'
                      }`}
                    >
                      <th className={`py-3 px-3 w-12 text-center align-middle text-sm font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        م
                      </th>
                      <th className={`py-3 px-3 w-28 text-center align-middle text-sm font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        كود الصنف
                      </th>
                      <th className={`py-3 px-3 text-center align-middle text-sm font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        اسم الصنف
                      </th>
                      <th className={`py-3 px-3 w-24 text-center align-middle text-sm font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        الوحدة
                      </th>
                      <th className={`py-3 px-3 w-44 text-center align-middle text-sm font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        الكمية
                      </th>
                      <th className={`py-3 px-3 w-16 text-center align-middle text-sm font-bold ${
                        isDark ? 'text-slate-200' : 'text-slate-700'
                      }`}>
                        حذف
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${
                    isDark ? 'divide-slate-800' : 'divide-slate-200'
                  }`}>
                    {issueItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className={`p-6 text-center align-middle text-sm font-medium ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          لا توجد أصناف مضافة حتى الآن.
                        </td>
                      </tr>
                    ) : (
                      issueItems.map((it, idx) => (
                        <tr
                          key={it.productId || it.productCode}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-slate-800/50 text-slate-100' : 'hover:bg-blue-50/40 text-slate-800'
                          }`}
                        >
                          <td className={`p-3 text-center align-middle font-bold text-sm ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {idx + 1}
                          </td>
                          <td className={`p-3 text-center align-middle font-mono font-bold text-sm ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {it.productCode}
                          </td>
                          <td className={`p-3 text-center align-middle font-bold text-base leading-snug ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {it.productName}
                          </td>
                          <td className={`p-3 text-center align-middle text-sm font-semibold ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {it.unit || 'عدد'}
                          </td>
                          <td className="p-2 text-center align-middle">
                            <div
                              className={`inline-flex items-center justify-center rounded-lg border p-0.5 shadow-xs transition-colors ${
                                isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {/* زر تنقيص (-) */}
                              <button
                                type="button"
                                onClick={() => handleStepItemQuantity(idx, -1)}
                                disabled={it.quantity <= 0}
                                className={`w-8 h-8 flex items-center justify-center rounded-md font-black transition-all ${
                                  it.quantity <= 0
                                    ? isDark ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                                    : isDark
                                    ? 'text-slate-200 hover:bg-slate-800 hover:text-white active:scale-90 cursor-pointer'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-90 cursor-pointer'
                                }`}
                                title="إنقاص الكمية (-1)"
                                aria-label="إنقاص الكمية"
                              >
                                <Minus className="w-4 h-4" />
                              </button>

                              {/* حقل إدخال الكمية بالكيبورد بخط كبير وواضح */}
                              <input
                                type="number"
                                min={0}
                                max={it.availableStockAtSource}
                                value={it.quantity}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    handleUpdateItemQuantity(idx, Math.max(0, val));
                                  }
                                }}
                                className={`w-16 sm:w-20 text-center font-black text-base sm:text-lg py-1 px-1 border-0 bg-transparent focus:ring-0 focus:outline-none transition-colors ${
                                  isDark ? 'text-blue-400' : 'text-[#1565C0]'
                                }`}
                                title="الكمية المطلوبة للتحويل (يمكن إدخالها بالكيبورد)"
                              />

                              {/* زر زيادة (+) */}
                              <button
                                type="button"
                                onClick={() => handleStepItemQuantity(idx, 1)}
                                disabled={it.quantity >= (it.availableStockAtSource ?? Infinity)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md font-black transition-all ${
                                  it.quantity >= (it.availableStockAtSource ?? Infinity)
                                    ? isDark
                                      ? 'text-slate-700 cursor-not-allowed opacity-50'
                                      : 'text-slate-300 cursor-not-allowed opacity-50'
                                    : isDark
                                    ? 'text-slate-200 hover:bg-slate-800 hover:text-white active:scale-90 cursor-pointer'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-90 cursor-pointer'
                                }`}
                                title={
                                  it.quantity >= (it.availableStockAtSource ?? Infinity)
                                    ? `تم الوصول للحد الأقصى المتاح بالمخزن (${it.availableStockAtSource})`
                                    : 'زيادة الكمية (+1)'
                                }
                                aria-label="زيادة الكمية"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleRemoveIssueItem(idx)}
                              className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-rose-400 hover:bg-rose-950/50 hover:text-rose-300'
                                  : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700'
                              }`}
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {issueItems.length > 0 && (
                    <tfoot>
                      <tr
                        className={`font-bold border-t-2 text-sm transition-colors ${
                          isDark
                            ? 'bg-slate-950/90 border-slate-700 text-slate-100'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <td colSpan={3} className={`p-3.5 text-center align-middle ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          عدد الأصناف: <strong className={`text-base font-black ${
                            isDark ? 'text-blue-400' : 'text-[#1565C0]'
                          }`}>{issueItems.length}</strong>
                        </td>
                        <td className={`p-3.5 text-center align-middle font-bold text-sm ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          إجمالي الكمية:
                        </td>
                        <td className={`p-3.5 text-center align-middle text-base sm:text-lg font-black ${
                          isDark ? 'text-blue-400' : 'text-[#1565C0]'
                        }`}>
                          {issueItems.reduce((sum, it) => sum + (it.quantity || 0), 0)}
                        </td>
                        <td className="p-3.5 text-center align-middle"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {/* حفظ إذن الصرف */}
            <div
              className={`p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-semibold">
                {editingTransferId ? (
                  <div className="flex items-center space-x-2 space-x-reverse text-amber-600 dark:text-amber-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>
                      تعديل الإذن المعلق: <strong>{issueNumber}</strong> (سيتم حفظ التعديلات على نفس السجل وحالته معلق)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 space-x-reverse text-blue-600 dark:text-blue-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>
                      حالة الإذن: <strong>معلق</strong> (يتم خصم الكمية من مخزن المصدر فقط)
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2.5 space-x-reverse">
                {editingTransferId ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      isDark
                        ? 'border-amber-700 text-amber-300 hover:bg-amber-950/40'
                        : 'border-amber-300 text-amber-800 hover:bg-amber-50'
                    }`}
                  >
                    <X className="w-3.5 h-3.5 inline ml-1.5" />
                    إلغاء التعديل
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIssueItems([]);
                      setNotes('');
                    }}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                      isDark
                        ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline ml-1.5" />
                    إفراغ
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveIssue}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow transition-all active:scale-95 flex items-center space-x-2 space-x-reverse cursor-pointer ${
                    editingTransferId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#1565C0] hover:bg-blue-700'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTransferId ? 'حفظ تعديلات إذن الصرف' : 'حفظ إذن الصرف'}</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ============================================================ */
          /* إذن إضافة                                                     */
          /* ============================================================ */
          <>
            {/* المخازن وزر «إذن» ومسلسل إذن الإضافة */}
            <div
              className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                {/* مسلسل إذن الإضافة */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    مسلسل إذن الإضافة:
                  </label>
                  <div
                    className={`flex items-center px-3.5 py-2.5 rounded-lg border font-mono font-bold text-xs sm:text-sm ${
                      isDark
                        ? 'bg-slate-950 border-emerald-900/60 text-emerald-400'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5 space-x-reverse">
                      <FileText className="w-4 h-4 ml-1.5 text-emerald-500" />
                      <span>{receiptNumber}</span>
                    </span>
                  </div>
                </div>

                {/* مخزن من */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    مخزن من:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedIssueNote ? selectedIssueNote.fromWarehouseName : '—'}
                    placeholder="—"
                    className={`w-full text-xs font-bold rounded-lg px-3 py-2.5 border cursor-not-allowed ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-300'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  />
                </div>

                {/* مخزن إلى */}
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    مخزن إلى:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={selectedIssueNote ? selectedIssueNote.toWarehouseName : '—'}
                    placeholder="—"
                    className={`w-full text-xs font-bold rounded-lg px-3 py-2.5 border cursor-not-allowed ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-300'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                    }`}
                  />
                </div>

                {/* زر التحويلات المعلقة */}
                <div className="sm:col-span-3 flex items-center space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => setIsPendingModalOpen(true)}
                    className="flex-1 py-2.5 rounded-lg bg-[#1565C0] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow flex items-center justify-center space-x-1.5 space-x-reverse transition-all cursor-pointer active:scale-95"
                  >
                    <FileText className="w-4 h-4" />
                    <span>التحويلات المعلقة</span>
                    {pendingIssueNotes.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px] font-mono">
                        ({pendingIssueNotes.length})
                      </span>
                    )}
                  </button>

                  {selectedIssueNote && (
                    <button
                      type="button"
                      onClick={() => setSelectedIssueNote(null)}
                      className="px-3 py-2.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 transition-colors"
                      title="إلغاء الاختيار"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </div>

              {selectedIssueNote && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 space-x-reverse text-emerald-600 dark:text-emerald-400 font-bold">
                    <span>إذن الصرف المحمّل:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-100">
                      {selectedIssueNote.transferNumber}
                    </span>
                    <span className="text-slate-400 font-normal">({selectedIssueNote.date})</span>
                  </div>
                </div>
              )}
            </div>

            {/* جدول الأصناف المحملة */}
            <div
              className={`p-4 rounded-xl border shadow-sm ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              {!selectedIssueNote ? (
                <div className="p-8 text-center text-slate-400">
                  <p className="text-xs sm:text-sm font-semibold mb-3">
                    اضغط على زر «التحويلات المعلقة» لاختيار إذن الصرف المعلق وتحميل بياناته.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPendingModalOpen(true)}
                    className="px-4 py-2 rounded-lg bg-[#1565C0] text-white font-bold text-xs shadow hover:bg-blue-700 transition-colors inline-flex items-center space-x-1.5 space-x-reverse"
                  >
                    <FileText className="w-4 h-4" />
                    <span>فتح أذون الصرف المعلقة</span>
                  </button>
                </div>
              ) : (
                <div
                  className={`overflow-x-auto rounded-lg border transition-colors ${
                    isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                  }`}
                >
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr
                        className={`font-extrabold border-b text-sm transition-colors ${
                          isDark ? 'bg-slate-800/90 border-slate-700 text-slate-100' : 'bg-slate-100/90 border-slate-300 text-slate-800'
                        }`}
                      >
                        <th className={`py-3 px-3 w-12 text-center align-middle text-sm font-bold ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                          م
                        </th>
                        <th className={`py-3 px-3 w-28 text-center align-middle text-sm font-bold ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                          كود الصنف
                        </th>
                        <th className={`py-3 px-3 text-center align-middle text-sm font-bold ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                          اسم الصنف
                        </th>
                        <th className={`py-3 px-3 w-24 text-center align-middle text-sm font-bold ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                          الوحدة
                        </th>
                        <th className={`py-3 px-3 w-44 text-center align-middle text-sm font-bold ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                          الكمية المستلمة
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y transition-colors ${
                      isDark ? 'divide-slate-800' : 'divide-slate-200'
                    }`}>
                      {selectedIssueNote.items.map((it, idx) => (
                        <tr
                          key={it.productId || it.productCode}
                          className={`transition-colors ${
                            isDark ? 'hover:bg-slate-800/50 text-slate-100' : 'hover:bg-emerald-50/40 text-slate-800'
                          }`}
                        >
                          <td className={`p-3 text-center align-middle font-bold text-sm ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {idx + 1}
                          </td>
                          <td className={`p-3 text-center align-middle font-mono font-bold text-sm ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {it.productCode}
                          </td>
                          <td className={`p-3 text-center align-middle font-bold text-base leading-snug ${
                            isDark ? 'text-slate-100' : 'text-slate-900'
                          }`}>
                            {it.productName}
                          </td>
                          <td className={`p-3 text-center align-middle text-sm font-semibold ${
                            isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {it.unit || 'عدد'}
                          </td>
                          <td className="p-2 text-center align-middle">
                            <div
                              className={`inline-flex items-center justify-center rounded-lg border p-0.5 shadow-xs transition-colors ${
                                isDark ? 'border-slate-700 bg-slate-950' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {/* زر تنقيص (-) */}
                              <button
                                type="button"
                                onClick={() => handleStepReceiptItemQuantity(idx, -1)}
                                disabled={it.quantity <= 0}
                                className={`w-8 h-8 flex items-center justify-center rounded-md font-black transition-all ${
                                  it.quantity <= 0
                                    ? isDark ? 'text-slate-700 cursor-not-allowed' : 'text-slate-300 cursor-not-allowed'
                                    : isDark
                                    ? 'text-slate-200 hover:bg-slate-800 hover:text-white active:scale-90 cursor-pointer'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:scale-90 cursor-pointer'
                                }`}
                                title="إنقاص الكمية (-1)"
                                aria-label="إنقاص الكمية"
                              >
                                <Minus className="w-4 h-4" />
                              </button>

                              {/* حقل إدخال الكمية بالكيبورد بخط كبير وواضح */}
                              <input
                                type="number"
                                min={0}
                                value={it.quantity}
                                onChange={e => {
                                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    handleUpdateReceiptItemQuantity(idx, Math.max(0, val));
                                  }
                                }}
                                className={`w-16 sm:w-20 text-center font-black text-base sm:text-lg py-1 px-1 border-0 bg-transparent focus:ring-0 focus:outline-none transition-colors ${
                                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                                }`}
                                title="الكمية المستلمة (يمكن إدخالها بالكيبورد)"
                              />

                              {/* زر زيادة (+) */}
                              <button
                                type="button"
                                onClick={() => handleStepReceiptItemQuantity(idx, 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-md font-black active:scale-90 cursor-pointer transition-all ${
                                  isDark
                                    ? 'text-slate-200 hover:bg-slate-800 hover:text-white'
                                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                                title="زيادة الكمية (+1)"
                                aria-label="زيادة الكمية"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr
                        className={`font-bold border-t-2 text-sm transition-colors ${
                          isDark
                            ? 'bg-slate-950/90 border-slate-700 text-slate-100'
                            : 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                        }`}
                      >
                        <td colSpan={3} className={`p-3.5 text-center align-middle ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          عدد الأصناف:{' '}
                          <strong className={`text-base font-black ${
                            isDark ? 'text-emerald-400' : 'text-emerald-600'
                          }`}>
                            {selectedIssueNote.items.length}
                          </strong>
                        </td>
                        <td className={`p-3.5 text-center align-middle font-bold text-sm ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          إجمالي الكمية:
                        </td>
                        <td className={`p-3.5 text-center align-middle text-base sm:text-lg font-black ${
                          isDark ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          {selectedIssueNote.totalQuantity}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* حفظ إذن الإضافة */}
            <div
              className={`p-4 rounded-xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  حالة التحويل بعد الحفظ: <strong>مكتمل</strong> (تضاف الكمية لمخزن الوجهة)
                </span>
              </div>

              <div className="flex items-center space-x-2.5 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setSelectedIssueNote(null)}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-colors ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 inline ml-1.5" />
                  إلغاء
                </button>

                <button
                  type="button"
                  onClick={handleSaveReceipt}
                  disabled={!selectedIssueNote}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow transition-all active:scale-95 flex items-center space-x-2 space-x-reverse ${
                    selectedIssueNote
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ إذن الإضافة</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL: زر «إذن» - قائمة أذون الصرف المعلقة                     */}
      {/* ============================================================== */}
      {isPendingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-3xl rounded-2xl shadow-2xl border flex flex-col max-h-[85vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-4 sm:p-5 border-b flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/60 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-[#1565C0] text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    قائمة أذون الصرف المعلقة (بانتظار إذن الإضافة)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    اختر إذن الصرف الذي ترغب في استلامه لإضافته لمخزن الوجهة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPendingModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
              {pendingIssueNotes.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
                  <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
                    لا توجد أذون صرف معلقة حالياً
                  </h4>
                  <p className="text-xs text-slate-500">
                    جميع التحويلات المخزنية مكتملة ومستلمة. يمكنك تسجيل إذن صرف جديد عبر اختيار «إذن صرف».
                  </p>
                </div>
              ) : (
                pendingIssueNotes.map(note => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-xl border transition-all hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 hover:border-blue-700'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <span className="font-black text-sm text-[#1565C0] dark:text-blue-400 font-mono">
                          {note.transferNumber}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold">
                          معلق
                        </span>
                        <span className="text-xs text-slate-400">بتاريخ: {note.date}</span>
                      </div>

                      <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center space-x-2 space-x-reverse">
                        <span>من: <strong className="font-bold">{note.fromWarehouseName}</strong></span>
                        <span className="text-slate-400">⟵</span>
                        <span>إلى: <strong className="font-bold">{note.toWarehouseName}</strong></span>
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        الأصناف ({note.totalItems} أصناف) — إجمالي الكمية: <strong className="text-slate-800 dark:text-slate-200">{note.totalQuantity}</strong>
                        {note.notes && <span className="mr-2">| {note.notes}</span>}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPendingIssue(note)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition-all active:scale-95 flex items-center justify-center space-x-1.5 space-x-reverse shrink-0 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>تحميل الإذن للاستلام</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div
              className={`p-3.5 border-t text-left ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setIsPendingModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: سجل التحويلات المخزنية الأخيرة                           */}
      {/* ============================================================== */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[96vw] xl:max-w-[95vw] 2xl:max-w-[1420px] rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <div className="w-9 h-9 rounded-xl bg-slate-700 text-white flex items-center justify-center shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">
                    سجل التحويلات المخزنية (الصادرة والمستلمة)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إدارة وأرشفة أذون الصرف والإضافة، تعديل وحذف الأذون المعلقة، والطباعة والتصدير
                  </p>
                </div>
              </div>

              {/* أدوات التحكم العلوية في السجل: الفلتر والإغلاق */}
              <div className="flex items-center space-x-2 space-x-reverse">
                {/* زر الفلترة */}
                <button
                  type="button"
                  onClick={() => setIsHistoryFilterOpen(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer shadow-2xs ${
                    isHistoryFilterOpen || isHistoryFilterActive
                      ? 'bg-[#1565C0] text-white border-[#1565C0]'
                      : isDark
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                  title="فلترة وتصفية السجل"
                >
                  <Filter className="w-3.5 h-3.5 ml-1" />
                  <span>تصفية وفلترة</span>
                  {activeFiltersCount > 0 && (
                    <span className="mr-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white text-[#1565C0]">
                      {activeFiltersCount}
                    </span>
                  )}
                </button>

                {/* زر تفريغ الفلاتر في حال كانت مفعلة */}
                {isHistoryFilterActive && (
                  <button
                    type="button"
                    onClick={handleResetHistoryFilters}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center space-x-1 space-x-reverse transition-all cursor-pointer ${
                      isDark
                        ? 'bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/60'
                        : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                    }`}
                    title="إلغاء الفلتر وعرض جميع السجلات"
                  >
                    <RotateCcw className="w-3 h-3 ml-1" />
                    <span>إلغاء الفلتر</span>
                  </button>
                )}

                {/* زر الإغلاق */}
                <button
                  type="button"
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  title="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* لوحة الفلترة المنسدلة (Filter Panel) */}
            {isHistoryFilterOpen && (
              <div
                className={`p-3.5 sm:p-4 border-b transition-all ${
                  isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {/* فلترة حسب الحالة */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      حالة المستند:
                    </label>
                    <select
                      value={historyFilters.status}
                      onChange={e =>
                        setHistoryFilters(prev => ({
                          ...prev,
                          status: e.target.value as 'all' | 'معلق' | 'مكتمل'
                        }))
                      }
                      className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="all">الكل (معلق ومكتمل)</option>
                      <option value="معلق">معلق فقط</option>
                      <option value="مكتمل">مكتمل فقط</option>
                    </select>
                  </div>

                  {/* فلترة حسب نوع المستند */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      نوع المستند:
                    </label>
                    <select
                      value={historyFilters.type}
                      onChange={e =>
                        setHistoryFilters(prev => ({
                          ...prev,
                          type: e.target.value as 'all' | 'issue' | 'receipt'
                        }))
                      }
                      className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="all">الكل (صرف وإضافة)</option>
                      <option value="issue">إذن صرف فقط</option>
                      <option value="receipt">إذن إضافة مستلم فقط</option>
                    </select>
                  </div>

                  {/* فلترة حسب المخزن */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      المخزن (المصدر / الوجهة):
                    </label>
                    <select
                      value={historyFilters.warehouseId}
                      onChange={e =>
                        setHistoryFilters(prev => ({ ...prev, warehouseId: e.target.value }))
                      }
                      className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="all">جميع المخازن</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* من تاريخ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      من تاريخ:
                    </label>
                    <input
                      type="date"
                      value={historyFilters.fromDate}
                      onChange={e =>
                        setHistoryFilters(prev => ({ ...prev, fromDate: e.target.value }))
                      }
                      className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* إلى تاريخ */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      إلى تاريخ:
                    </label>
                    <input
                      type="date"
                      value={historyFilters.toDate}
                      onChange={e =>
                        setHistoryFilters(prev => ({ ...prev, toDate: e.target.value }))
                      }
                      className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* بحث سريع */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                      بحث سريع:
                    </label>
                    <input
                      type="text"
                      placeholder="رقم الإذن، صنف، ملاحظة..."
                      value={historyFilters.searchQuery}
                      onChange={e =>
                        setHistoryFilters(prev => ({ ...prev, searchQuery: e.target.value }))
                      }
                      className={`w-full text-xs font-semibold rounded-lg px-2.5 py-2 border transition-colors ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100'
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* مؤشر النتائج وتفريغ الفلتر */}
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    عدد النتائج المعروضة:{' '}
                    <strong className="text-[#1565C0] dark:text-blue-400 font-mono text-sm">
                      {displayedTransfers.length}
                    </strong>{' '}
                    من أصل <strong className="font-mono">{allTransfers.length}</strong> سجل
                  </span>
                  {isHistoryFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetHistoryFilters}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      إعادة ضبط جميع الفلاتر
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Content Table */}
            <div className="p-3 sm:p-4 overflow-y-auto flex-1">
              <div
                className={`w-full overflow-x-auto rounded-xl border ${
                  isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white'
                }`}
              >
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr
                      className={`font-bold border-b transition-colors select-none ${
                        isDark
                          ? 'bg-slate-800/90 text-slate-100 border-slate-700'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {/* 1. رقم إذن الصرف */}
                      <th
                        onClick={() => handleHistorySort('transferNumber')}
                        className={`w-[10%] min-w-[95px] px-2.5 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب رقم إذن الصرف (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>رقم إذن الصرف</span>
                          {renderSortIndicator('transferNumber')}
                        </div>
                      </th>

                      {/* 2. رقم إذن الإضافة */}
                      <th
                        onClick={() => handleHistorySort('receiptNumber')}
                        className={`w-[10%] min-w-[95px] px-2.5 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب رقم إذن الإضافة (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>رقم إذن الإضافة</span>
                          {renderSortIndicator('receiptNumber')}
                        </div>
                      </th>

                      {/* 3. التاريخ */}
                      <th
                        onClick={() => handleHistorySort('date')}
                        className={`w-[9%] min-w-[90px] px-2.5 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب التاريخ (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>التاريخ</span>
                          {renderSortIndicator('date')}
                        </div>
                      </th>

                      {/* 4. مخزن المصدر - عمود نصي بمساحة موسعة */}
                      <th
                        onClick={() => handleHistorySort('fromWarehouseName')}
                        className={`w-[18%] min-w-[140px] px-3 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب مخزن المصدر (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>مخزن المصدر (من)</span>
                          {renderSortIndicator('fromWarehouseName')}
                        </div>
                      </th>

                      {/* 5. مخزن الوجهة - عمود نصي بمساحة موسعة */}
                      <th
                        onClick={() => handleHistorySort('toWarehouseName')}
                        className={`w-[18%] min-w-[140px] px-3 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب مخزن الوجهة (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>مخزن الوجهة (إلى)</span>
                          {renderSortIndicator('toWarehouseName')}
                        </div>
                      </th>

                      {/* 6. عدد الأصناف */}
                      <th
                        onClick={() => handleHistorySort('totalItems')}
                        className={`w-[7%] min-w-[70px] px-2.5 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب عدد الأصناف (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>عدد الأصناف</span>
                          {renderSortIndicator('totalItems')}
                        </div>
                      </th>

                      {/* 7. إجمالي الكمية */}
                      <th
                        onClick={() => handleHistorySort('totalQuantity')}
                        className={`w-[7%] min-w-[75px] px-2.5 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب إجمالي الكمية (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>إجمالي الكمية</span>
                          {renderSortIndicator('totalQuantity')}
                        </div>
                      </th>

                      {/* 8. الحالة */}
                      <th
                        onClick={() => handleHistorySort('status')}
                        className={`w-[7%] min-w-[75px] px-2.5 py-3 text-center cursor-pointer transition-colors whitespace-nowrap text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                        title="ترتيب حسب الحالة (تصاعدي / تنازلي / افتراضي)"
                      >
                        <div className="flex items-center justify-center space-x-1 space-x-reverse">
                          <span>الحالة</span>
                          {renderSortIndicator('status')}
                        </div>
                      </th>

                      {/* 9. الإجراءات - عرض ثابت ومحاذاة موحدة لجميع الصفوف */}
                      <th
                        className={`w-[290px] min-w-[290px] max-w-[290px] px-2 py-3 text-center whitespace-nowrap text-xs font-bold ${
                          isDark ? 'text-slate-200' : 'text-slate-700'
                        }`}
                      >
                        الإجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${isDark ? 'divide-slate-800' : 'divide-slate-200'}`}>
                    {displayedTransfers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {allTransfers.length === 0 ? (
                            <div className="py-4">
                              <p className="font-semibold text-sm">لا توجد تحويلات مسجلة حتى الآن</p>
                            </div>
                          ) : (
                            <div className="py-4 space-y-2">
                              <p className="font-semibold text-sm">لا توجد نتائج مطابقة لشروط الفلترة المحددة</p>
                              <button
                                type="button"
                                onClick={handleResetHistoryFilters}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#1565C0] dark:text-blue-400 hover:underline cursor-pointer"
                              >
                                تفريغ الفلاتر وعرض جميع السجلات
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      displayedTransfers.map(tr => (
                        <tr
                          key={tr.id}
                          className={`h-13 transition-colors whitespace-nowrap ${
                            isDark ? 'hover:bg-slate-800/50 text-slate-100' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          {/* رقم إذن الصرف */}
                          <td className={`px-2.5 py-3 text-center align-middle font-mono font-bold text-xs sm:text-sm whitespace-nowrap ${
                            isDark ? 'text-blue-400' : 'text-[#1565C0]'
                          }`}>
                            {tr.transferNumber}
                          </td>

                          {/* رقم إذن الإضافة */}
                          <td className={`px-2.5 py-3 text-center align-middle font-mono font-bold text-xs sm:text-sm whitespace-nowrap ${
                            tr.receiptNumber
                              ? isDark ? 'text-emerald-400' : 'text-emerald-600'
                              : 'text-slate-400'
                          }`}>
                            {tr.receiptNumber || '—'}
                          </td>

                          {/* التاريخ */}
                          <td className={`px-2.5 py-3 text-center align-middle text-xs font-semibold whitespace-nowrap ${
                            isDark ? 'text-slate-300' : 'text-slate-600'
                          }`}>
                            {tr.date}
                          </td>

                          {/* مخزن المصدر */}
                          <td className={`px-3 py-3 text-center align-middle text-xs sm:text-sm font-bold whitespace-nowrap ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {tr.fromWarehouseName}
                          </td>

                          {/* مخزن الوجهة */}
                          <td className={`px-3 py-3 text-center align-middle text-xs sm:text-sm font-bold whitespace-nowrap ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {tr.toWarehouseName}
                          </td>

                          {/* عدد الأصناف */}
                          <td className={`px-2.5 py-3 text-center align-middle font-mono font-bold text-xs sm:text-sm whitespace-nowrap ${
                            isDark ? 'text-slate-200' : 'text-slate-800'
                          }`}>
                            {tr.totalItems}
                          </td>

                          {/* إجمالي الكمية */}
                          <td className={`px-2.5 py-3 text-center align-middle font-mono font-black text-xs sm:text-sm whitespace-nowrap ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>
                            {tr.totalQuantity}
                          </td>

                          {/* الحالة */}
                          <td className="px-2.5 py-3 text-center align-middle whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-black inline-block whitespace-nowrap ${
                                tr.status === 'معلق'
                                  ? isDark
                                    ? 'bg-amber-950/70 text-amber-400 border border-amber-800'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : isDark
                                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {tr.status}
                            </span>
                          </td>

                          {/* الإجراءات: عرض ثابت 290px مع محاذاة متطابقة دقيقة لجميع الصفوف */}
                          <td className="px-2 py-3 text-center align-middle whitespace-nowrap w-[290px] min-w-[290px] max-w-[290px]">
                            <div className="flex items-center justify-center space-x-1 space-x-reverse w-[280px] mx-auto">
                              {/* الخانة 1: زر تعديل (للمعلق فقط، محجوز ومحاذى للمكتمل) */}
                              {tr.status === 'معلق' ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditTransfer(tr)}
                                  className={`w-[54px] h-[28px] rounded-md text-[11px] font-bold border flex items-center justify-center space-x-1 space-x-reverse transition-colors cursor-pointer shadow-2xs shrink-0 ${
                                    isDark
                                      ? 'bg-amber-950/60 border-amber-800 text-amber-300 hover:bg-amber-900/80'
                                      : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                                  }`}
                                  title="تعديل بيانات إذن الصرف المعلق"
                                >
                                  <Edit3 className="w-3 h-3 ml-0.5" />
                                  <span>تعديل</span>
                                </button>
                              ) : (
                                <div className="w-[54px] h-[28px] shrink-0" aria-hidden="true" />
                              )}

                              {/* الخانة 2: زر حذف (للمعلق فقط، محجوز ومحاذى للمكتمل) */}
                              {tr.status === 'معلق' ? (
                                <button
                                  type="button"
                                  onClick={() => setTransferToDelete(tr)}
                                  className={`w-[50px] h-[28px] rounded-md text-[11px] font-bold border flex items-center justify-center space-x-1 space-x-reverse transition-colors cursor-pointer shadow-2xs shrink-0 ${
                                    isDark
                                      ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/80'
                                      : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
                                  }`}
                                  title="حذف إذن الصرف المعلق واستعادة الكميات"
                                >
                                  <Trash2 className="w-3 h-3 ml-0.5" />
                                  <span>حذف</span>
                                </button>
                              ) : (
                                <div className="w-[50px] h-[28px] shrink-0" aria-hidden="true" />
                              )}

                              {/* الخانة 3: زر طباعة (متاح للمعلق والمكتمل) */}
                              <button
                                type="button"
                                onClick={() => handlePrintTransfer(tr)}
                                className={`w-[54px] h-[28px] rounded-md text-[11px] font-semibold border flex items-center justify-center space-x-1 space-x-reverse transition-colors cursor-pointer shrink-0 ${
                                  isDark
                                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                                }`}
                                title="معاينة وطباعة إذن التحويل"
                              >
                                <Printer className="w-3 h-3 ml-0.5" />
                                <span>طباعة</span>
                              </button>

                              {/* الخانة 4: زر Excel (متاح للمعلق والمكتمل) */}
                              <button
                                type="button"
                                onClick={() => handleExportTransferExcel(tr)}
                                className={`w-[56px] h-[28px] rounded-md text-[11px] font-semibold border flex items-center justify-center space-x-1 space-x-reverse transition-colors cursor-pointer shrink-0 ${
                                  isDark
                                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300 hover:bg-emerald-900/80'
                                    : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                }`}
                                title="تصدير إذن التحويل إلى Excel"
                              >
                                <FileSpreadsheet className="w-3 h-3 ml-0.5" />
                                <span>Excel</span>
                              </button>

                              {/* الخانة 5: زر PDF (متاح للمعلق والمكتمل) */}
                              <button
                                type="button"
                                onClick={() => handleExportTransferPdf(tr)}
                                className={`w-[50px] h-[28px] rounded-md text-[11px] font-semibold border flex items-center justify-center space-x-1 space-x-reverse transition-colors cursor-pointer shrink-0 ${
                                  isDark
                                    ? 'bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900/80'
                                    : 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100'
                                }`}
                                title="تصدير إذن التحويل إلى PDF"
                              >
                                <FileText className="w-3 h-3 ml-0.5" />
                                <span>PDF</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div
              className={`p-3.5 border-t flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span>
                  إجمالي السجلات المعروضة: <strong className="text-slate-800 dark:text-slate-100 font-mono text-sm">{displayedTransfers.length}</strong>
                </span>
                {isHistoryFilterActive && (
                  <span>
                    (من أصل <strong className="font-mono">{allTransfers.length}</strong> سجل مسجل)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: تأكيد حذف إذن الصرف المعلق                               */}
      {/* ============================================================== */}
      {transferToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 flex flex-col ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-3 space-x-reverse text-rose-500 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  تأكيد حذف إذن الصرف المعلق
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  سيتم حذف السجل وإلغاء خصم الكميات من المخزن
                </p>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border my-3 text-xs leading-relaxed space-y-2 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="flex justify-between">
                <span className="text-slate-500">رقم الإذن:</span>
                <strong className="font-mono text-blue-500">{transferToDelete.transferNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">مخزن المصدر:</span>
                <strong>{transferToDelete.fromWarehouseName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">مخزن الوجهة:</span>
                <strong>{transferToDelete.toWarehouseName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">عدد الأصناف / الكمية:</span>
                <strong>{transferToDelete.totalItems} أصناف ({transferToDelete.totalQuantity} وحدة)</strong>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-rose-600 dark:text-rose-400 font-semibold">
                سيتم استعادة كافة الكميات المخصومة فورًا إلى رصيد مخزن ({transferToDelete.fromWarehouseName}) وحذف الإذن نهائيًا.
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2.5 space-x-reverse mt-2">
              <button
                type="button"
                onClick={() => setTransferToDelete(null)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDark
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center space-x-1.5 space-x-reverse cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                <span>تأكيد الحذف الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: معاينة وطباعة إذن صرف التحويل المخزني                       */}
      {/* ============================================================== */}
      {isVoucherModalOpen && voucherModalTransfer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div
            className={`w-full max-w-3xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-[#1565C0] text-white flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold">
                    معاينة وطباعة إذن صرف تحويل مخزني
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    إذن رقم: <span className="font-mono font-bold text-blue-500">{voucherModalTransfer.transferNumber}</span> — الحالة: <span className="font-bold">{voucherModalTransfer.status}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => handleExportTransferExcel(voucherModalTransfer)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center space-x-1 space-x-reverse cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 ml-1" />
                  <span>Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportTransferPdf(voucherModalTransfer)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center space-x-1 space-x-reverse cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 ml-1" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('stock-transfer-voucher-printable-area');
                    if (el) {
                      printVertexReport(el, { title: `إذن صرف تحويل ${voucherModalTransfer.transferNumber}` });
                    }
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1565C0] hover:bg-blue-700 text-white flex items-center space-x-1 space-x-reverse cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 ml-1" />
                  <span>طباعة فورية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsVoucherModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950/60 flex justify-center">
              {/* The Printable Area for this Voucher */}
              <div
                id="stock-transfer-voucher-printable-area"
                className="w-full max-w-2xl bg-white text-slate-900 p-6 sm:p-8 rounded-xl shadow border border-slate-200 text-right"
                dir="rtl"
              >
                {/* Header */}
                <div className="border-b-2 border-slate-800 pb-4 mb-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-black text-slate-900">{companyName}</h2>
                      <p className="text-xs text-slate-500 mt-0.5">نظام فيرتكس لإدارة المخازن والمستودعات</p>
                    </div>
                    <div className="text-left">
                      <div className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white font-bold text-xs">
                        إذن صرف بضاعة تحويل مخزني
                      </div>
                      <div className="mt-1 text-xs text-slate-500 font-mono">
                        {voucherModalTransfer.date}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Meta Info Box */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-5">
                  <div>
                    <span className="text-slate-500">مسلسل إذن الصرف:</span>{' '}
                    <strong className="font-mono text-slate-900 font-bold">{voucherModalTransfer.transferNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">حالة الإذن:</span>{' '}
                    <strong className={`font-bold ${voucherModalTransfer.status === 'معلق' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {voucherModalTransfer.status === 'معلق' ? 'معلق (بانتظار إذن الإضافة بالاستلام)' : 'مكتمل ومستلم'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500">مخزن المصدر (من):</span>{' '}
                    <strong className="text-slate-900 font-bold">{voucherModalTransfer.fromWarehouseName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">مخزن الوجهة (إلى):</span>{' '}
                    <strong className="text-slate-900 font-bold">{voucherModalTransfer.toWarehouseName}</strong>
                  </div>
                  {voucherModalTransfer.receiptNumber && (
                    <div>
                      <span className="text-slate-500">رقم إذن الإضافة المقابل:</span>{' '}
                      <strong className="font-mono text-emerald-700 font-bold">{voucherModalTransfer.receiptNumber}</strong>
                    </div>
                  )}
                  {voucherModalTransfer.notes && (
                    <div className="col-span-2">
                      <span className="text-slate-500">ملاحظات:</span>{' '}
                      <span>{voucherModalTransfer.notes}</span>
                    </div>
                  )}
                </div>

                {/* Items Table */}
                <table className="w-full text-xs border-collapse border border-slate-300 mb-6">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                      <th className="p-2 border border-slate-300 text-center w-10">م</th>
                      <th className="p-2 border border-slate-300 text-right w-24">كود الصنف</th>
                      <th className="p-2 border border-slate-300 text-right">اسم وبيان الصنف</th>
                      <th className="p-2 border border-slate-300 text-center w-16">الوحدة</th>
                      <th className="p-2 border border-slate-300 text-center w-20">الكمية</th>
                      <th className="p-2 border border-slate-300 text-right">ملاحظات الصنف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voucherModalTransfer.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-mono font-bold text-right">{it.productCode}</td>
                        <td className="p-2 border border-slate-300 font-bold text-right">{it.productName}</td>
                        <td className="p-2 border border-slate-300 text-center">{it.unit || 'عدد'}</td>
                        <td className="p-2 border border-slate-300 text-center font-bold text-sm">{it.quantity}</td>
                        <td className="p-2 border border-slate-300 text-right text-slate-600">{it.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                      <td colSpan={3} className="p-2 border border-slate-300 text-right">
                        إجمالي الأصناف: <strong>{voucherModalTransfer.totalItems} صنف</strong>
                      </td>
                      <td className="p-2 border border-slate-300 text-center">الإجمالي:</td>
                      <td className="p-2 border border-slate-300 text-center font-black text-sm">
                        {voucherModalTransfer.totalQuantity}
                      </td>
                      <td className="p-2 border border-slate-300"></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="grid grid-cols-4 gap-4 text-center text-xs pt-4 border-t border-dashed border-slate-300">
                  <div>
                    <p className="font-bold text-slate-700">أمين مخزن الصرف</p>
                    <div className="h-10 mt-2 border-b border-dotted border-slate-400"></div>
                    <p className="text-[10px] text-slate-400 mt-1">التوقيع والتاريخ</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">مندوب / سائق النقل</p>
                    <div className="h-10 mt-2 border-b border-dotted border-slate-400"></div>
                    <p className="text-[10px] text-slate-400 mt-1">التوقيع ورقم المركبة</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">أمين مخزن الاستلام</p>
                    <div className="h-10 mt-2 border-b border-dotted border-slate-400"></div>
                    <p className="text-[10px] text-slate-400 mt-1">التوقيع والتاريخ</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">اعتماد إدارة المخازن</p>
                    <div className="h-10 mt-2 border-b border-dotted border-slate-400"></div>
                    <p className="text-[10px] text-slate-400 mt-1">الختم والاعتماد</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden container for PDF export if voucher modal is closed */}
      {voucherModalTransfer && !isVoucherModalOpen && (
        <div className="hidden">
          <div
            id="stock-transfer-voucher-printable-area"
            className="w-full max-w-2xl bg-white text-slate-900 p-8 text-right"
            dir="rtl"
          >
            <div className="border-b-2 border-slate-800 pb-4 mb-5">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-slate-900">{companyName}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">نظام فيرتكس لإدارة المخازن والمستودعات</p>
                </div>
                <div className="text-left">
                  <div className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white font-bold text-xs">
                    إذن صرف بضاعة تحويل مخزني
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-mono">
                    {voucherModalTransfer.date}
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs mb-5">
              <div>
                <span className="text-slate-500">مسلسل إذن الصرف:</span>{' '}
                <strong className="font-mono text-slate-900 font-bold">{voucherModalTransfer.transferNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">حالة الإذن:</span>{' '}
                <strong className={`font-bold ${voucherModalTransfer.status === 'معلق' ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {voucherModalTransfer.status === 'معلق' ? 'معلق (بانتظار إذن الإضافة بالاستلام)' : 'مكتمل ومستلم'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">مخزن المصدر (من):</span>{' '}
                <strong className="text-slate-900 font-bold">{voucherModalTransfer.fromWarehouseName}</strong>
              </div>
              <div>
                <span className="text-slate-500">مخزن الوجهة (إلى):</span>{' '}
                <strong className="text-slate-900 font-bold">{voucherModalTransfer.toWarehouseName}</strong>
              </div>
            </div>
            <table className="w-full text-xs border-collapse border border-slate-300 mb-6">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <th className="p-2 border border-slate-300 text-center w-10">م</th>
                  <th className="p-2 border border-slate-300 text-right w-24">كود الصنف</th>
                  <th className="p-2 border border-slate-300 text-right">اسم وبيان الصنف</th>
                  <th className="p-2 border border-slate-300 text-center w-16">الوحدة</th>
                  <th className="p-2 border border-slate-300 text-center w-20">الكمية</th>
                </tr>
              </thead>
              <tbody>
                {voucherModalTransfer.items.map((it, idx) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                    <td className="p-2 border border-slate-300 font-mono font-bold text-right">{it.productCode}</td>
                    <td className="p-2 border border-slate-300 font-bold text-right">{it.productName}</td>
                    <td className="p-2 border border-slate-300 text-center">{it.unit || 'عدد'}</td>
                    <td className="p-2 border border-slate-300 text-center font-bold">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400">
                  <td colSpan={3} className="p-2 border border-slate-300 text-right">
                    إجمالي الأصناف: <strong>{voucherModalTransfer.totalItems} صنف</strong>
                  </td>
                  <td className="p-2 border border-slate-300 text-center">الإجمالي:</td>
                  <td className="p-2 border border-slate-300 text-center font-black">
                    {voucherModalTransfer.totalQuantity}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: دليل استعراض الأصناف ورصيد المخزون (نفس البيع والشراء)      */}
      {/* ============================================================== */}
      {isInventoryBrowserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-5xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div
              className={`p-4 sm:p-5 border-b flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/70 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-10 h-10 rounded-xl bg-[#1565C0] text-white flex items-center justify-center shadow-md">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      دليل استعراض الأصناف ورصيد المخزون
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {availableProducts.length} صنف مسجل
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2 space-x-reverse">
                    <span>مخزن المصدر:</span>
                    <strong className="text-slate-700 dark:text-slate-200 font-bold">
                      {fromWarehouseObj?.name || 'غير محدد'} ({fromWarehouseObj?.code})
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                {/* زر إضافة كامل المخزن من الهيدر */}
                <button
                  type="button"
                  onClick={handleAddEntireWarehouse}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer shadow-sm"
                  title="إضافة كافة أصناف هذا المخزن ذات الرصيد المتاح دفعة واحدة"
                >
                  <Boxes className="w-3.5 h-3.5 text-amber-500" />
                  <span>إضافة كامل المخزن</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInventoryBrowserOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search & Category Filter Toolbar */}
            <div
              className={`p-3.5 border-b space-y-3 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                {/* Search Input */}
                <div className="flex-1 relative w-full">
                  <input
                    type="text"
                    value={inventoryModalSearch}
                    onChange={e => setInventoryModalSearch(e.target.value)}
                    placeholder="ابحث بالاسم، الكود SKU، الباركود، التصنيف..."
                    className={`w-full text-xs rounded-xl pr-9 pl-4 py-2.5 border transition-colors font-medium ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-blue-500'
                        : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                    }`}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  {inventoryModalSearch && (
                    <button
                      type="button"
                      onClick={() => setInventoryModalSearch('')}
                      className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="w-full sm:w-56">
                  <select
                    value={inventorySelectedCategory}
                    onChange={e => setInventorySelectedCategory(e.target.value)}
                    className={`w-full text-xs font-bold rounded-xl px-3 py-2.5 border transition-colors ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'All' ? 'جميع التصنيفات' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Quick Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {categories.slice(0, 8).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setInventorySelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                      inventorySelectedCategory === cat
                        ? 'bg-[#1565C0] text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat === 'All' ? 'الكل' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-5">
              <div className={`rounded-xl border overflow-hidden shadow-xs ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <table className="w-full text-xs text-right border-collapse">
                  <thead>
                    <tr
                      className={`font-bold border-b transition-colors ${
                        isDark ? 'bg-slate-800/90 text-slate-100 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isAllFilteredSelected}
                          onChange={toggleSelectAllFiltered}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title="تحديد / إلغاء تحديد الكل"
                        />
                      </th>
                      <th className={`p-3 w-28 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>كود الصنف</th>
                      <th className={`p-3 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>اسم الصنف</th>
                      <th className={`p-3 w-28 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>التصنيف</th>
                      <th className={`p-3 w-36 text-center ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>الرصيد المتاح بالمصدر</th>
                      <th className={`p-3 w-28 text-center ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>السعر / التكلفة</th>
                      <th className={`p-3 w-24 text-center ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>إضافة</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${
                    isDark ? 'divide-slate-800' : 'divide-slate-100'
                  }`}>
                    {filteredModalProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className={`p-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          لا توجد أصناف مطابقة لمعايير البحث الحالية.
                        </td>
                      </tr>
                    ) : (
                      filteredModalProducts.map(p => {
                        const isChecked = selectedProductIds.has(p.id);
                        const stockInSource = stockTransferService.getProductStockInWarehouse(
                          p,
                          fromWarehouseId
                        );
                        const hasStock = stockInSource > 0;
                        const isAlreadyAdded = issueItems.some(
                          it => it.productId === p.id || it.productCode === p.code
                        );

                        return (
                          <tr
                            key={p.id}
                            onClick={() => toggleProductSelection(p.id)}
                            className={`transition-colors cursor-pointer ${
                              isChecked
                                ? isDark
                                  ? 'bg-blue-950/40 hover:bg-blue-950/60'
                                  : 'bg-blue-50/70 hover:bg-blue-100/70'
                                : isDark
                                ? 'hover:bg-slate-800/50'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td
                              className="p-3 text-center"
                              onClick={e => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleProductSelection(p.id)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                            <td className={`p-3 font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {p.code}
                            </td>
                            <td className="p-3">
                              <div className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                                {p.name}
                              </div>
                              {p.barcode && (
                                <div className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  باركود: {p.barcode}
                                </div>
                              )}
                            </td>
                            <td className={`p-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                              {p.category || 'عام'}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  hasStock
                                    ? isDark
                                      ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : isDark
                                    ? 'bg-rose-950/70 text-rose-400 border border-rose-800'
                                    : 'bg-rose-50 text-rose-600 border border-rose-200'
                                }`}
                              >
                                {hasStock ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>
                                    <span>
                                      متاح: {stockInSource} {p.unit || 'عدد'}
                                    </span>
                                  </>
                                ) : (
                                  <span>نفد (0)</span>
                                )}
                              </span>
                            </td>
                            <td className={`p-3 text-center font-mono font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {(p.costPrice || p.averageCost || p.salePrice || 0).toLocaleString()} ر.س
                            </td>
                            <td
                              className="p-3 text-center"
                              onClick={e => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => addProductToTransfer(p, 1)}
                                disabled={!hasStock}
                                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all shadow-xs ${
                                  !hasStock
                                    ? isDark
                                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : isAlreadyAdded
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                                    : 'bg-[#1565C0] hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                                }`}
                                title={
                                  !hasStock
                                    ? 'لا يوجد رصيد متاح في مخزن المصدر'
                                    : isAlreadyAdded
                                    ? 'تمت إضافته بالفعل (انقر لزيادة الكمية +1)'
                                    : 'إضافة لإذن الصرف'
                                }
                              >
                                {isAlreadyAdded ? '+ إضافة أخرى' : '+ إضافة'}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-3 space-x-reverse text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  تم تحديد:{' '}
                  <strong className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                    {selectedProductIds.size}
                  </strong>{' '}
                  صنف
                </span>
                {selectedProductIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds(new Set())}
                    className="text-xs text-rose-500 hover:underline cursor-pointer font-semibold"
                  >
                    إلغاء التحديد
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                {/* زر إضافة كامل المخزن */}
                <button
                  type="button"
                  onClick={handleAddEntireWarehouse}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center space-x-1.5 space-x-reverse"
                >
                  <Boxes className="w-4 h-4 text-amber-500" />
                  <span>«إضافة كامل المخزن»</span>
                </button>

                {/* زر إضافة المحدد دفعة واحدة */}
                <button
                  type="button"
                  onClick={handleAddSelectedProducts}
                  disabled={selectedProductIds.size === 0}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 space-x-reverse ${
                    selectedProductIds.size > 0
                      ? 'bg-[#1565C0] hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة المحدد ({selectedProductIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInventoryBrowserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
