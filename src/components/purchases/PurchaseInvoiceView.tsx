import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Calendar, 
  Clock, 
  Building2, 
  Warehouse as WarehouseIcon, 
  CreditCard, 
  DollarSign, 
  Tag, 
  Package, 
  Boxes, 
  Wallet, 
  ChevronDown, 
  Check, 
  X, 
  Barcode, 
  Keyboard, 
  Grid, 
  RotateCcw, 
  FileText,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Printer,
  Gift,
  HelpCircle,
  Layers,
  User,
  Users,
  UserCheck,
  UserPlus,
  Phone,
  Eye,
  Edit3,
  Ban,
  Receipt,
  Play,
  PauseCircle,
  Archive,
  RefreshCw,
  FileCheck,
  Banknote,
  Landmark,
  Save
} from 'lucide-react';
import { vendorService, Vendor } from '../../services/vendorService';
import { warehouseService, Warehouse } from '../../services/warehouseService';
import { treasuryService, Treasury } from '../../services/treasuryService';
import { salesEntryService, ProductItem } from '../../services/salesEntryService';
import { purchaseService, PurchaseInvoiceData, PurchaseLineItem } from '../../services/purchaseService';
import { setupWizardService } from '../../services/setupWizardService';
import { branchService } from '../../services/branchService';
import { bankAccountService } from '../../services/bankAccountService';
import { StandardActionBar } from '../common/StandardActionBar';
import { PlatformSection, BankAccountItem } from '../../types';
import { VendorRecordsModal } from '../vendors/VendorRecordsModal';

interface PurchaseInvoiceViewProps {
  onClose?: () => void;
  onNavigateSection?: (section: PlatformSection) => void;
  onOpenVendorMaster?: () => void;
}

export const PurchaseInvoiceView: React.FC<PurchaseInvoiceViewProps> = ({
  onClose,
  onNavigateSection,
  onOpenVendorMaster
}) => {
  // Master data sources
  const [vendors, setVendors] = useState<Vendor[]>(() => vendorService.getAllVendors());
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => warehouseService.getAllWarehouses());
  const [treasuries, setTreasuries] = useState<Treasury[]>(() => treasuryService.getAllTreasuries());
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>(() => salesEntryService.getState().products || []);

  // Subscribe to updates in master data
  useEffect(() => {
    const unsubVendors = vendorService.subscribe(() => setVendors(vendorService.getAllVendors()));
    const unsubWarehouses = warehouseService.subscribe(() => setWarehouses(warehouseService.getAllWarehouses()));
    const unsubTreasuries = treasuryService.subscribe(() => setTreasuries(treasuryService.getAllTreasuries()));
    const unsubProducts = salesEntryService.subscribe(() => {
      setAvailableProducts(salesEntryService.getState().products || []);
    });
    return () => {
      unsubVendors();
      unsubWarehouses();
      unsubTreasuries();
      unsubProducts();
    };
  }, []);

  // Entry Mode: 'standard' (Manual/keyboard), 'pos' (Barcode scanner), 'button' (Grid picker)
  const [entryMode, setEntryMode] = useState<'standard' | 'pos' | 'button'>('standard');
  const [isEntryModeDropdownOpen, setIsEntryModeDropdownOpen] = useState(false);
  const entryModeDropdownRef = useRef<HTMLDivElement>(null);

  // Active Purchase Invoice State
  const [activeInvoice, setActiveInvoice] = useState<PurchaseInvoiceData>(() => {
    const curBranch = branchService.getCurrentBranch();
    const branchId = curBranch?.id || 'BR-01';
    const allWhs = warehouseService.getActiveWarehouses();
    const branchWhs = allWhs.filter(w => w.branchId === branchId);
    const defaultWarehouse = branchWhs[0] || allWhs[0] || { id: 'WH-01', name: 'المخزن الرئيسي', branchId };
    const allTrs = treasuryService.getActiveTreasuries();
    const branchTrs = allTrs.filter(t => t.branchId === branchId);
    const defaultTreasury = branchTrs[0] || allTrs[0] || { id: 'TR-01', name: 'الخزينة الرئيسية', branchId };
    const cashVendor = vendorService.getSystemCashVendor();
    return {
      id: `PUR-INV-${Date.now()}`,
      invoiceNumber: purchaseService.generateNextInvoiceNumber(),
      createdAt: new Date().toISOString(),
      branchId: branchId,
      branchName: curBranch?.name || 'الفرع الرئيسي',
      vendorType: 'cash',
      vendorId: cashVendor.id,
      vendorName: cashVendor.name,
      warehouseId: defaultWarehouse.id,
      warehouseName: defaultWarehouse.name,
      paymentMethod: 'نقدي',
      treasuryId: defaultTreasury.id,
      treasuryName: defaultTreasury.name,
      lineItems: [],
      subtotal: 0,
      invoiceDiscountType: 'fixed',
      invoiceDiscountValue: 0,
      totalDiscount: 0,
      isTaxInvoice: false,
      taxRate: 14,
      totalTax: 0,
      taxDiscountRate: 0,
      taxDiscount: 0,
      grandTotal: 0,
      notes: '',
      status: 'draft'
    };
  });

  // Effective branch of the invoice
  const invoiceBranchId = activeInvoice.branchId || branchService.getCurrentBranch()?.id || 'BR-01';

  // Isolated active warehouses belonging strictly to the invoice's current branch
  const branchWarehouses = useMemo<Warehouse[]>(() => {
    const active = warehouseService.getActiveWarehouses();
    const filtered = active.filter(w => w.branchId === invoiceBranchId);
    const seen = new Set<string>();
    return filtered.filter(w => {
      if (!w || !w.id) return false;
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
  }, [warehouses, invoiceBranchId]);

  // Keep active warehouse aligned with current branch warehouses
  useEffect(() => {
    if (branchWarehouses.length > 0 && !branchWarehouses.some(w => w.id === activeInvoice.warehouseId)) {
      setActiveInvoice(prev => ({
        ...prev,
        warehouseId: branchWarehouses[0].id,
        warehouseName: branchWarehouses[0].name
      }));
    }
  }, [branchWarehouses, activeInvoice.warehouseId]);

  // Custom cash vendor name
  const [customCashVendorName, setCustomCashVendorName] = useState<string>('');

  // Dropdown & Search popover states
  const [isVendorQuickDropdownOpen, setIsVendorQuickDropdownOpen] = useState(false);
  const [vendorQuickSearchQuery, setVendorQuickSearchQuery] = useState('');
  const vendorQuickSearchInputRef = useRef<HTMLInputElement>(null);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);
  const [isVendorRecordsModalOpen, setIsVendorRecordsModalOpen] = useState(false);

  // Bonus Mode & Product Browse Modal (Matching Sales Invoice modal)
  const [isBonusMode, setIsBonusMode] = useState(false);
  const [isProductBrowseModalOpen, setIsProductBrowseModalOpen] = useState(false);
  const [inventoryModalSearch, setInventoryModalSearch] = useState('');
  const [inventorySelectedCategory, setInventorySelectedCategory] = useState<string>('All');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [focusedProductInBrowser, setFocusedProductInBrowser] = useState<ProductItem | null>(null);

  // All Warehouses Stock Balance Query Modal State
  const [isAllWarehousesStockModalOpen, setIsAllWarehousesStockModalOpen] = useState<boolean>(false);
  const [selectedProductForWarehouseQuery, setSelectedProductForWarehouseQuery] = useState<ProductItem | null>(null);

  const [isInvoiceSearchOpen, setIsInvoiceSearchOpen] = useState(false);
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const invoiceSearchRef = useRef<HTMLDivElement>(null);

  // Product quick search
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);

  // Quick filtered vendors for quick dropdown
  const quickFilteredVendors = vendors.filter(v => {
    if (!vendorService.isVendorActive(v)) return false;
    if (!vendorQuickSearchQuery.trim()) return true;
    const q = vendorQuickSearchQuery.toLowerCase();
    return (
      v.name.toLowerCase().includes(q) ||
      v.code.toLowerCase().includes(q) ||
      (v.mobile && v.mobile.includes(q)) ||
      (v.phone && v.phone.includes(q))
    );
  });

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' | 'warning' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Purchase invoices state from purchaseService
  const [completedInvoices, setCompletedInvoices] = useState<PurchaseInvoiceData[]>(() => purchaseService.getCompletedInvoices());
  const [heldInvoices, setHeldInvoices] = useState<PurchaseInvoiceData[]>(() => purchaseService.getHeldInvoices());

  useEffect(() => {
    const unsub = purchaseService.subscribe(() => {
      setCompletedInvoices(purchaseService.getCompletedInvoices());
      setHeldInvoices(purchaseService.getHeldInvoices());
    });
    // Ensure fresh new draft invoice has the canonical next sequential number
    if (activeInvoice.status === 'draft' && activeInvoice.lineItems.length === 0 && (!activeInvoice.notes || !activeInvoice.notes.trim())) {
      const nextNumber = purchaseService.generateNextInvoiceNumber();
      if (activeInvoice.invoiceNumber !== nextNumber) {
        setActiveInvoice(prev => ({
          ...prev,
          invoiceNumber: nextNumber
        }));
      }
    }
    return () => unsub();
  }, []);

  // Modal states for action buttons
  const [completedReceipt, setCompletedReceipt] = useState<PurchaseInvoiceData | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [cashAmountPaid, setCashAmountPaid] = useState<string>('');
  const [cardAmountPaid, setCardAmountPaid] = useState<string>('');
  const [creditAmountPaid, setCreditAmountPaid] = useState<string>('');
  const [calcReceivedAmount, setCalcReceivedAmount] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>('BK-01');

  // Available Bank Accounts data source scoped to branch
  const availableBankAccounts = useMemo<BankAccountItem[]>(() => {
    try {
      const wh = warehouses.find(w => w.id === activeInvoice.warehouseId);
      const branchId = wh?.branchId || 'BR-01';
      return bankAccountService.getBankAccounts(branchId);
    } catch {
      return bankAccountService.getBankAccounts('BR-01');
    }
  }, [activeInvoice.warehouseId, warehouses]);

  // Selected vendor reference and credit eligibility based on existing vendor master data
  const currentSelectedVendor = useMemo<Vendor | null>(() => {
    if (activeInvoice.vendorId) {
      const found = vendors.find(v => v.id === activeInvoice.vendorId);
      if (found) return found;
    }
    if (activeInvoice.vendorType === 'cash') {
      return vendorService.getSystemCashVendor();
    }
    return null;
  }, [vendors, activeInvoice.vendorType, activeInvoice.vendorId]);

  const isCreditPurchasesAllowed = useMemo<boolean>(() => {
    if (activeInvoice.vendorType === 'cash') return false;
    if (!currentSelectedVendor) return false;
    return currentSelectedVendor.allowCreditPurchases === true;
  }, [activeInvoice.vendorType, currentSelectedVendor]);

  const [isPurchaseHistoryModalOpen, setIsPurchaseHistoryModalOpen] = useState(false);
  const [historyActiveTab, setHistoryActiveTab] = useState<'held' | 'completed'>('completed');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [historyDateFrom, setHistoryDateFrom] = useState('');
  const [historyDateTo, setHistoryDateTo] = useState('');

  const [isNewConfirmModalOpen, setIsNewConfirmModalOpen] = useState(false);
  const [isCancelConfirmModalOpen, setIsCancelConfirmModalOpen] = useState(false);
  const [isCloseConfirmModalOpen, setIsCloseConfirmModalOpen] = useState(false);
  const [cancelInvoiceConfirmModal, setCancelInvoiceConfirmModal] = useState<{ isOpen: boolean; invoice?: PurchaseInvoiceData }>({ isOpen: false });
  const [editInvoiceConfirmModal, setEditInvoiceConfirmModal] = useState<{ isOpen: boolean; invoice?: PurchaseInvoiceData }>({ isOpen: false });
  const [deleteHeldConfirmModal, setDeleteHeldConfirmModal] = useState<{ isOpen: boolean; invoiceId?: string; isAll?: boolean }>({ isOpen: false });

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (entryModeDropdownRef.current && !entryModeDropdownRef.current.contains(e.target as Node)) {
        setIsEntryModeDropdownOpen(false);
      }
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setIsVendorQuickDropdownOpen(false);
      }
      if (invoiceSearchRef.current && !invoiceSearchRef.current.contains(e.target as Node)) {
        setIsInvoiceSearchOpen(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setIsProductSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    if (!productSearchQuery.trim()) {
      setFilteredProducts([]);
      setIsProductSearchOpen(false);
      return;
    }
    const q = productSearchQuery.toLowerCase().trim();
    const results = availableProducts.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    ).slice(0, 10);
    setFilteredProducts(results);
    setIsProductSearchOpen(results.length > 0);
  }, [productSearchQuery, availableProducts]);

  // Current Warehouse for Invoice
  const currentInvoiceWarehouse = useMemo<Warehouse | { id?: string; code?: string; name?: string }>(() => {
    const wId = activeInvoice.warehouseId;
    const found = branchWarehouses.find(w => w.id === wId || w.code === wId);
    if (found) return found;
    if (branchWarehouses.length > 0) return branchWarehouses[0];
    return { id: 'WH-01', code: 'WH-MAIN-NY', name: 'المستودع الرئيسي' };
  }, [activeInvoice.warehouseId, branchWarehouses]);

  // Stock helpers
  const getProductStockInSpecificWarehouse = useCallback((p: ProductItem, targetWarehouse: Warehouse | { id?: string; code?: string; name?: string }) => {
    return salesEntryService.getProductStockInWarehouse(p, targetWarehouse);
  }, []);

  const getProductWarehouseStock = useCallback((p: ProductItem) => {
    return getProductStockInSpecificWarehouse(p, currentInvoiceWarehouse);
  }, [getProductStockInSpecificWarehouse, currentInvoiceWarehouse]);

  // Categories list
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(availableProducts.map(p => p.category).filter(Boolean)))];
  }, [availableProducts]);

  // All Warehouses Stock Modal Handler
  const handleOpenAllWarehousesStockModal = useCallback(() => {
    let target: ProductItem | null = focusedProductInBrowser;
    if (!target && selectedProductIds.size > 0) {
      const firstId = Array.from(selectedProductIds)[0];
      target = availableProducts.find(p => p.id === firstId) || null;
    }

    if (!target) {
      showToast('اختر صنفًا أولًا لعرض أرصدته في جميع المخازن.');
      return;
    }

    setSelectedProductForWarehouseQuery(target);
    setIsAllWarehousesStockModalOpen(true);
  }, [focusedProductInBrowser, selectedProductIds, availableProducts]);

  // Add multiple selected products to purchase invoice
  const handleAddSelectedProducts = () => {
    if (selectedProductIds.size === 0) return;
    const selectedList = availableProducts.filter(p => selectedProductIds.has(p.id));
    
    let updatedLines = [...activeInvoice.lineItems];
    const currentInvDiscVal = activeInvoice.invoiceDiscountValue || 0;
    const currentInvDiscType = activeInvoice.invoiceDiscountType || 'percent';

    for (const product of selectedList) {
      const purchaseCost = product.costPrice || product.lastPurchasePrice || product.unitPrice || 10;
      const existingIndex = updatedLines.findIndex(item => item.productId === product.id);
      if (existingIndex >= 0) {
        const item = updatedLines[existingIndex];
        const newQty = item.quantity + 1;
        const gross = newQty * item.unitPrice;
        let discVal = item.discountValue;
        let discType = item.discountType;
        if (currentInvDiscVal > 0 && currentInvDiscType === 'percent') {
          discVal = currentInvDiscVal;
          discType = 'percent';
        }
        let discAmount = 0;
        if (discType === 'percent') {
          discAmount = (gross * Math.min(100, discVal)) / 100;
        } else {
          discAmount = Math.min(gross, discVal);
        }
        updatedLines[existingIndex] = {
          ...item,
          quantity: newQty,
          discountType: discType,
          discountValue: discVal,
          discountAmount: discAmount,
          lineTotal: Math.max(0, gross - discAmount)
        };
      } else {
        let initialDiscVal = 0;
        let initialDiscType: 'percent' | 'fixed' = 'percent';
        if (currentInvDiscVal > 0 && currentInvDiscType === 'percent') {
          initialDiscVal = currentInvDiscVal;
          initialDiscType = 'percent';
        }
        const gross = purchaseCost;
        const discAmount = initialDiscType === 'percent' ? (gross * Math.min(100, initialDiscVal)) / 100 : Math.min(gross, initialDiscVal);
        const newLine: PurchaseLineItem = {
          id: `PUR-LINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit || product.basicUnit || 'قطعة',
          quantity: 1,
          bonusQuantity: 0,
          unitPrice: purchaseCost,
          discountType: initialDiscType,
          discountValue: initialDiscVal,
          discountAmount: discAmount,
          lineTotal: Math.max(0, gross - discAmount)
        };
        updatedLines.push(newLine);
      }
    }

    if (currentInvDiscVal > 0 && currentInvDiscType === 'fixed') {
      const totalGross = updatedLines.reduce((acc, l) => acc + ((l.quantity || 0) * l.unitPrice), 0);
      updatedLines = updatedLines.map(line => {
        const lineGross = (line.quantity || 0) * line.unitPrice;
        const lineDiscVal = totalGross > 0 ? Math.round(((lineGross / totalGross) * currentInvDiscVal) * 100) / 100 : 0;
        const discAmount = Math.min(lineGross, lineDiscVal);
        return {
          ...line,
          discountType: 'fixed' as const,
          discountValue: lineDiscVal,
          discountAmount: discAmount,
          lineTotal: Math.max(0, lineGross - discAmount)
        };
      });
    }

    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));

    setSelectedProductIds(new Set());
    setIsProductBrowseModalOpen(false);
    showToast(`تمت إضافة ${selectedList.length} أصناف إلى فاتورة الشراء`, 'success');
  };

  // Recalculate totals whenever lines or discounts change (Matches Sales Invoice logic)
  const recalculateInvoice = (
    lines: PurchaseLineItem[], 
    invDiscountVal = activeInvoice.invoiceDiscountValue,
    invDiscountType = activeInvoice.invoiceDiscountType,
    isTax = activeInvoice.isTaxInvoice,
    taxDiscRate = activeInvoice.taxDiscountRate
  ) => {
    let subtotalBeforeDiscount = 0;
    let totalLineDiscounts = 0;

    lines.forEach(line => {
      const safeQty = typeof line.quantity === 'number' && !isNaN(line.quantity) ? Math.max(0, line.quantity) : 0;
      const safePrice = typeof line.unitPrice === 'number' && !isNaN(line.unitPrice) ? Math.max(0, line.unitPrice) : 0;
      const rawTotal = safeQty * safePrice;
      const discVal = line.discountValue !== undefined && !isNaN(Number(line.discountValue)) ? Number(line.discountValue) : (line.discountAmount || 0);
      const discType = line.discountType || 'percent';

      let lineDisc = 0;
      if (discType === 'percent') {
        lineDisc = (rawTotal * Math.min(100, Math.max(0, discVal))) / 100;
      } else {
        lineDisc = Math.max(0, discVal);
      }
      lineDisc = Math.min(rawTotal, lineDisc);

      line.discountAmount = lineDisc;
      line.lineTotal = Math.max(0, rawTotal - lineDisc);
      subtotalBeforeDiscount += rawTotal;
      totalLineDiscounts += lineDisc;
    });

    const totalDiscount = totalLineDiscounts;
    const netBeforeTax = Math.max(0, subtotalBeforeDiscount - totalDiscount);
    const totalTax = isTax ? (netBeforeTax * 0.14) : 0;
    const taxDiscount = (taxDiscRate > 0) ? (netBeforeTax * (taxDiscRate / 100)) : 0;
    const grandTotal = Math.max(0, netBeforeTax + totalTax - taxDiscount);

    return {
      subtotal: subtotalBeforeDiscount,
      totalDiscount,
      totalTax,
      taxDiscount,
      grandTotal
    };
  };

  // Set Invoice Level (Additional) Discount - Identical to Sales Invoice Logic
  const handleSetInvoiceDiscount = (value: number | string, type?: 'fixed' | 'percent') => {
    let numericVal = 0;
    let chosenType: 'fixed' | 'percent' = type || activeInvoice.invoiceDiscountType || 'percent';

    if (typeof value === 'string') {
      const str = value.trim();
      if (str.includes('%')) {
        const val = parseFloat(str.replace(/[%$]/g, '').trim());
        numericVal = isNaN(val) ? 0 : Math.max(0, val);
        chosenType = 'percent';
      } else if (str.includes('$')) {
        const val = parseFloat(str.replace(/[%$]/g, '').trim());
        numericVal = isNaN(val) ? 0 : Math.max(0, val);
        chosenType = 'fixed';
      } else {
        const val = parseFloat(str);
        numericVal = isNaN(val) ? 0 : Math.max(0, val);
      }
    } else {
      numericVal = isNaN(value) ? 0 : Math.max(0, value);
    }

    let updatedLines = [...activeInvoice.lineItems];

    if (numericVal > 0) {
      if (chosenType === 'percent') {
        updatedLines = updatedLines.map(line => {
          const gross = (line.quantity || 0) * line.unitPrice;
          const discAmount = (gross * Math.min(100, numericVal)) / 100;
          return {
            ...line,
            discountType: 'percent' as const,
            discountValue: numericVal,
            discountAmount: discAmount,
            lineTotal: Math.max(0, gross - discAmount)
          };
        });
      } else {
        const totalGross = updatedLines.reduce((acc, l) => acc + ((l.quantity || 0) * l.unitPrice), 0);
        updatedLines = updatedLines.map(line => {
          const lineGross = (line.quantity || 0) * line.unitPrice;
          const lineDiscVal = totalGross > 0 ? Math.round(((lineGross / totalGross) * numericVal) * 100) / 100 : 0;
          const discAmount = Math.min(lineGross, lineDiscVal);
          return {
            ...line,
            discountType: 'fixed' as const,
            discountValue: lineDiscVal,
            discountAmount: discAmount,
            lineTotal: Math.max(0, lineGross - discAmount)
          };
        });
      }
    } else {
      updatedLines = updatedLines.map(line => ({
        ...line,
        discountType: chosenType,
        discountValue: 0,
        discountAmount: 0,
        lineTotal: (line.quantity || 0) * line.unitPrice
      }));
    }

    const calc = recalculateInvoice(updatedLines, numericVal, chosenType, activeInvoice.isTaxInvoice, activeInvoice.taxDiscountRate);

    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      invoiceDiscountValue: numericVal,
      invoiceDiscountType: chosenType,
      ...calc
    }));
  };

  // Add Product to Purchase Line Items
  const handleAddProduct = (product: ProductItem) => {
    const purchaseCost = product.costPrice || product.lastPurchasePrice || product.unitPrice || 10;
    const existingIndex = activeInvoice.lineItems.findIndex(item => item.productId === product.id);
    const currentInvDiscVal = activeInvoice.invoiceDiscountValue || 0;
    const currentInvDiscType = activeInvoice.invoiceDiscountType || 'percent';

    let updatedLines: PurchaseLineItem[] = [];

    if (existingIndex >= 0) {
      // Increment quantity
      updatedLines = activeInvoice.lineItems.map((item, idx) => {
        if (idx === existingIndex) {
          const newQty = item.quantity + 1;
          const gross = newQty * item.unitPrice;
          let discVal = item.discountValue;
          let discType = item.discountType;
          if (currentInvDiscVal > 0 && currentInvDiscType === 'percent') {
            discVal = currentInvDiscVal;
            discType = 'percent';
          }
          let discAmount = 0;
          if (discType === 'percent') {
            discAmount = (gross * Math.min(100, discVal)) / 100;
          } else {
            discAmount = Math.min(gross, discVal);
          }
          return {
            ...item,
            quantity: newQty,
            discountType: discType,
            discountValue: discVal,
            discountAmount: discAmount,
            lineTotal: Math.max(0, gross - discAmount)
          };
        }
        return item;
      });
    } else {
      // Add new line
      let initialDiscVal = 0;
      let initialDiscType: 'percent' | 'fixed' = 'percent';
      if (currentInvDiscVal > 0 && currentInvDiscType === 'percent') {
        initialDiscVal = currentInvDiscVal;
        initialDiscType = 'percent';
      }
      const gross = purchaseCost;
      const discAmount = initialDiscType === 'percent' ? (gross * Math.min(100, initialDiscVal)) / 100 : Math.min(gross, initialDiscVal);
      const newLine: PurchaseLineItem = {
        id: `PUR-LINE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit || product.basicUnit || 'قطعة',
        quantity: 1,
        bonusQuantity: 0,
        unitPrice: purchaseCost,
        discountType: initialDiscType,
        discountValue: initialDiscVal,
        discountAmount: discAmount,
        lineTotal: Math.max(0, gross - discAmount)
      };
      updatedLines = [...activeInvoice.lineItems, newLine];
    }

    if (currentInvDiscVal > 0 && currentInvDiscType === 'fixed') {
      const totalGross = updatedLines.reduce((acc, l) => acc + ((l.quantity || 0) * l.unitPrice), 0);
      updatedLines = updatedLines.map(line => {
        const lineGross = (line.quantity || 0) * line.unitPrice;
        const lineDiscVal = totalGross > 0 ? Math.round(((lineGross / totalGross) * currentInvDiscVal) * 100) / 100 : 0;
        const discAmount = Math.min(lineGross, lineDiscVal);
        return {
          ...line,
          discountType: 'fixed' as const,
          discountValue: lineDiscVal,
          discountAmount: discAmount,
          lineTotal: Math.max(0, lineGross - discAmount)
        };
      });
    }

    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));

    setProductSearchQuery('');
    setIsProductSearchOpen(false);
    showToast(`تمت إضافة "${product.name}" إلى فاتورة الشراء`, 'success');
  };

  // Update line quantity
  const handleUpdateQty = (lineId: string, delta: number) => {
    const updatedLines = activeInvoice.lineItems.map(item => {
      if (item.id === lineId) {
        const newQty = Math.max(0, item.quantity + delta);
        const gross = newQty * item.unitPrice;
        let discAmount = 0;
        if (item.discountType === 'percent') {
          discAmount = (gross * item.discountValue) / 100;
        } else {
          discAmount = Math.min(gross, item.discountValue);
        }
        return {
          ...item,
          quantity: newQty,
          discountAmount: discAmount,
          lineTotal: Math.max(0, gross - discAmount)
        };
      }
      return item;
    });

    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));
  };

  // Direct quantity input change
  const handleDirectQtyChange = (lineId: string, val: string) => {
    const parsed = parseInt(val, 10);
    const newQty = isNaN(parsed) ? 0 : Math.max(0, parsed);

    const updatedLines = activeInvoice.lineItems.map(item => {
      if (item.id === lineId) {
        const gross = newQty * item.unitPrice;
        let discAmount = 0;
        if (item.discountType === 'percent') {
          discAmount = (gross * item.discountValue) / 100;
        } else {
          discAmount = Math.min(gross, item.discountValue);
        }
        return {
          ...item,
          quantity: newQty,
          discountAmount: discAmount,
          lineTotal: Math.max(0, gross - discAmount)
        };
      }
      return item;
    });

    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));
  };

  // Update unit purchase price
  const handleUpdatePrice = (lineId: string, val: string) => {
    const parsed = parseFloat(val);
    const newPrice = isNaN(parsed) ? 0 : Math.max(0, parsed);

    const updatedLines = activeInvoice.lineItems.map(item => {
      if (item.id === lineId) {
        const gross = (item.quantity || 0) * newPrice;
        let discAmount = 0;
        if (item.discountType === 'percent') {
          discAmount = (gross * item.discountValue) / 100;
        } else {
          discAmount = Math.min(gross, item.discountValue);
        }
        return {
          ...item,
          unitPrice: newPrice,
          discountAmount: discAmount,
          lineTotal: Math.max(0, gross - discAmount)
        };
      }
      return item;
    });

    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));
  };

  // Update line discount
  const handleUpdateLineDiscount = (lineId: string, val: string) => {
    const parsed = parseFloat(val);
    const discVal = isNaN(parsed) ? 0 : Math.max(0, parsed);

    const updatedLines = activeInvoice.lineItems.map(item => {
      if (item.id === lineId) {
        const gross = (item.quantity || 0) * item.unitPrice;
        let discAmount = 0;
        if (item.discountType === 'percent') {
          discAmount = (gross * Math.min(100, discVal)) / 100;
        } else {
          discAmount = Math.min(gross, discVal);
        }
        return {
          ...item,
          discountValue: discVal,
          discountAmount: discAmount,
          lineTotal: Math.max(0, gross - discAmount)
        };
      }
      return item;
    });

    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));
  };

  // Toggle line discount type
  const handleToggleLineDiscountType = (lineId: string) => {
    const updatedLines = activeInvoice.lineItems.map(item => {
      if (item.id === lineId) {
        const newType: 'percent' | 'fixed' = item.discountType === 'percent' ? 'fixed' : 'percent';
        const gross = (item.quantity || 0) * item.unitPrice;
        let discAmount = 0;
        if (newType === 'percent') {
          discAmount = (gross * Math.min(100, item.discountValue)) / 100;
        } else {
          discAmount = Math.min(gross, item.discountValue);
        }
        return {
          ...item,
          discountType: newType,
          discountAmount: discAmount,
          lineTotal: Math.max(0, gross - discAmount)
        };
      }
      return item;
    });

    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));
  };

  // Update line bonus quantity (Bonus is free: doesn't alter monetary totals)
  const handleUpdateBonusQty = (lineId: string, delta: number) => {
    const updatedLines = activeInvoice.lineItems.map(item => {
      if (item.id === lineId) {
        const currentBonus = item.bonusQuantity || 0;
        const newBonus = Math.max(0, currentBonus + delta);
        return {
          ...item,
          bonusQuantity: newBonus
        };
      }
      return item;
    });

    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines
    }));
  };

  const handleDirectBonusQtyChange = (lineId: string, value: string) => {
    const parsed = parseInt(value, 10);
    const newBonus = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const updatedLines = activeInvoice.lineItems.map(item => {
      if (item.id === lineId) {
        return {
          ...item,
          bonusQuantity: newBonus
        };
      }
      return item;
    });

    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines
    }));
  };

  // Remove line item
  const handleRemoveLine = (lineId: string) => {
    const updatedLines = activeInvoice.lineItems.filter(item => item.id !== lineId);
    const calc = recalculateInvoice(updatedLines);
    setActiveInvoice(prev => ({
      ...prev,
      lineItems: updatedLines,
      ...calc
    }));
    showToast('تم حذف الصنف من الفاتورة', 'info');
  };

  // Handle Select Vendor
  const handleSelectVendor = (vendor: Vendor) => {
    if (vendor.isSystemCashVendor || vendor.id === 'VEND-CASH' || vendor.id === 'VEND-CASH-001') {
      const systemCashVendor = vendorService.getSystemCashVendor();
      setActiveInvoice(prev => ({
        ...prev,
        vendorType: 'cash',
        vendorId: systemCashVendor.id,
        vendorName: customCashVendorName ? `مورد نقدي (${customCashVendorName})` : systemCashVendor.name,
        paymentMethod: prev.paymentMethod === 'آجل' ? 'نقدي' : prev.paymentMethod
      }));
      setIsVendorQuickDropdownOpen(false);
      showToast(`تم تحديد المورد: ${systemCashVendor.name}`, 'info');
      return;
    }

    const allowsCredit = vendor.allowCreditPurchases === true;
    let vendDiscountPercent = 0;
    if (vendor.discountRate !== undefined && vendor.discountRate !== null && vendor.discountRate > 0) {
      vendDiscountPercent = vendor.discountRate <= 1 ? Math.round(vendor.discountRate * 10000) / 100 : vendor.discountRate;
    }

    setActiveInvoice(prev => {
      let updatedLines = prev.lineItems;
      let invDiscVal = prev.invoiceDiscountValue;
      let invDiscType = prev.invoiceDiscountType;

      if (vendDiscountPercent > 0) {
        invDiscVal = vendDiscountPercent;
        invDiscType = 'percent';
        updatedLines = updatedLines.map(line => {
          const rawTotal = (line.quantity || 0) * line.unitPrice;
          const discAmount = (rawTotal * Math.min(100, vendDiscountPercent)) / 100;
          return {
            ...line,
            discountType: 'percent',
            discountValue: vendDiscountPercent,
            discountAmount: discAmount,
            lineTotal: Math.max(0, rawTotal - discAmount)
          };
        });
      }

      const calc = recalculateInvoice(updatedLines, invDiscVal, invDiscType, prev.isTaxInvoice, prev.taxDiscountRate);

      return {
        ...prev,
        vendorType: 'permanent',
        vendorId: vendor.id,
        vendorName: vendor.name,
        paymentMethod: (!allowsCredit && prev.paymentMethod === 'آجل') ? 'نقدي' : prev.paymentMethod,
        invoiceDiscountValue: invDiscVal,
        invoiceDiscountType: invDiscType,
        lineItems: updatedLines,
        ...calc
      };
    });

    setIsVendorQuickDropdownOpen(false);
    if (!allowsCredit && activeInvoice.paymentMethod === 'آجل') {
      showToast(`المورد (${vendor.name}) لا يسمح بالتعامل الآجل وفقاً لبياناته، تم تعيين السداد نقدي`, 'warning');
    } else {
      showToast(`تم تحديد المورد: ${vendor.name}`, 'info');
    }
  };

  // Handle Select Cash Vendor
  const handleSelectCashVendor = () => {
    const systemCashVendor = vendorService.getSystemCashVendor();
    setActiveInvoice(prev => ({
      ...prev,
      vendorType: 'cash',
      vendorId: systemCashVendor.id,
      vendorName: customCashVendorName ? `مورد نقدي (${customCashVendorName})` : systemCashVendor.name,
      paymentMethod: prev.paymentMethod === 'آجل' ? 'نقدي' : prev.paymentMethod
    }));
    setIsVendorQuickDropdownOpen(false);
  };

  // Unsaved changes check helper
  const checkHasUnsavedData = useCallback(() => {
    const systemCashVendor = vendorService.getSystemCashVendor();
    return (
      activeInvoice.lineItems.length > 0 ||
      (activeInvoice.notes && activeInvoice.notes.trim().length > 0) ||
      activeInvoice.invoiceDiscountValue > 0 ||
      activeInvoice.totalDiscount > 0 ||
      customCashVendorName.trim().length > 0 ||
      (activeInvoice.vendorId !== systemCashVendor.id && activeInvoice.vendorId !== 'VEND-CASH' && activeInvoice.vendorId !== 'VEND-CASH-001')
    );
  }, [activeInvoice, customCashVendorName]);

  // Execute Blank New Invoice
  const executeNewInvoice = useCallback(() => {
    const curBranch = branchService.getCurrentBranch();
    const branchId = curBranch?.id || 'BR-01';
    const allWhs = warehouseService.getActiveWarehouses();
    const bWhs = allWhs.filter(w => w.branchId === branchId);
    const defaultWarehouse = bWhs[0] || allWhs[0] || { id: 'WH-01', name: 'المخزن الرئيسي', branchId };
    const allTrs = treasuryService.getActiveTreasuries();
    const bTrs = allTrs.filter(t => t.branchId === branchId);
    const defaultTreasury = bTrs[0] || allTrs[0] || { id: 'TR-01', name: 'الخزينة الرئيسية', branchId };
    const systemCashVendor = vendorService.getSystemCashVendor();
    setActiveInvoice({
      id: `PUR-INV-${Date.now()}`,
      invoiceNumber: purchaseService.generateNextInvoiceNumber(),
      createdAt: new Date().toISOString(),
      branchId: branchId,
      branchName: curBranch?.name || 'الفرع الرئيسي',
      vendorType: 'cash',
      vendorId: systemCashVendor.id,
      vendorName: systemCashVendor.name,
      warehouseId: defaultWarehouse.id,
      warehouseName: defaultWarehouse.name,
      paymentMethod: 'نقدي',
      treasuryId: defaultTreasury.id,
      treasuryName: defaultTreasury.name,
      lineItems: [],
      subtotal: 0,
      invoiceDiscountType: 'fixed',
      invoiceDiscountValue: 0,
      totalDiscount: 0,
      isTaxInvoice: false,
      taxRate: 14,
      totalTax: 0,
      taxDiscountRate: 0,
      taxDiscount: 0,
      grandTotal: 0,
      notes: '',
      status: 'draft'
    });
    setCustomCashVendorName('');
  }, []);

  // 1. New Invoice Action (F1)
  const handleNewInvoiceAction = useCallback(() => {
    if (checkHasUnsavedData()) {
      setIsNewConfirmModalOpen(true);
    } else {
      executeNewInvoice();
      showToast('تم إنشاء مسودة فاتورة شراء جديدة (F1)', 'info');
    }
  }, [checkHasUnsavedData, executeNewInvoice]);

  // 2. Open Checkout & Payment Handlers (F2 & Save Action)
  const handleOpenCheckout = useCallback(() => {
    if (activeInvoice.lineItems.length === 0) {
      showToast('يرجى إضافة أصناف أولاً قبل حفظ وإنهاء فاتورة الشراء', 'error');
      return;
    }

    // Validation: Check if warehouse belongs to the current invoice's active branch
    const invBranchId = activeInvoice.branchId || branchService.getCurrentBranch()?.id || 'BR-01';
    const allWhs = warehouseService.getAllWarehouses();
    const currentWh = allWhs.find(w => w.id === activeInvoice.warehouseId || w.code === activeInvoice.warehouseId);
    
    if (!currentWh) {
      showToast('المخزن المحدد غير موجود في النظام.', 'error');
      return;
    }
    
    if (currentWh.branchId && invBranchId && currentWh.branchId !== invBranchId) {
      const whBranch = branchService.getBranchById(currentWh.branchId);
      const invBranch = branchService.getBranchById(invBranchId);
      showToast(`لا يمكن حفظ فاتورة الشراء على مخزن تابع لفرع آخر [${whBranch?.name || currentWh.branchId}]. الفاتورة تتبع فرع [${invBranch?.name || invBranchId}].`, 'error');
      return;
    }

    if (currentWh.branchId) {
      const branch = branchService.getBranchById(currentWh.branchId);
      if (branch && branch.status === 'غير نشط') {
        showToast(`لا يمكن حفظ فاتورة الشراء على مخزن تابع لفرع موقوف/غير نشط [${branch.name}].`, 'error');
        return;
      }
    }

    // Validation:
    // Without Bonus -> base quantity must be > 0. If base quantity = 0, show "يوجد صنف غير مسجل كمية له"
    // With Bonus -> Bonus quantity suffices as effective quantity even if base quantity is 0 (no error)
    const hasUnassignedQtyItem = activeInvoice.lineItems.some(item => {
      const bonusQty = item.bonusQuantity || 0;
      const baseQty = item.quantity || 0;
      return bonusQty <= 0 && baseQty <= 0;
    });

    if (hasUnassignedQtyItem) {
      showToast('يوجد صنف غير مسجل كمية له', 'error');
      return;
    }

    const total = activeInvoice.grandTotal;
    if (activeInvoice.paymentMethod === 'آجل') {
      if (isCreditPurchasesAllowed) {
        setCashAmountPaid('0.00');
        setCardAmountPaid('0.00');
        setCreditAmountPaid(total.toFixed(2));
      } else {
        setCashAmountPaid(total.toFixed(2));
        setCardAmountPaid('0.00');
        setCreditAmountPaid('0.00');
        showToast(`المورد (${currentSelectedVendor?.name || activeInvoice.vendorName}) لا يسمح بالتعامل الآجل، تم تعيين السداد نقدي`, 'warning');
      }
    } else if (activeInvoice.paymentMethod === 'تحويل بنكي' || activeInvoice.paymentMethod === 'card') {
      setCashAmountPaid('0.00');
      setCardAmountPaid(total.toFixed(2));
      setCreditAmountPaid('0.00');
    } else {
      setCashAmountPaid(total.toFixed(2));
      setCardAmountPaid('0.00');
      setCreditAmountPaid('0.00');
    }

    setCalcReceivedAmount('');
    setIsPaymentModalOpen(true);
  }, [activeInvoice, isCreditPurchasesAllowed, currentSelectedVendor]);

  const handleSaveInvoiceAction = useCallback(() => {
    handleOpenCheckout();
  }, [handleOpenCheckout]);

  const handleCashChange = (valStr: string) => {
    setCashAmountPaid(valStr);
    const newCash = parseFloat(valStr) || 0;
    const cardVal = parseFloat(cardAmountPaid) || 0;
    const creditVal = parseFloat(creditAmountPaid) || 0;
    const total = activeInvoice.grandTotal;

    if (cardVal > 0 || creditVal > 0) {
      const remainingSpaceForCredit = isCreditPurchasesAllowed ? Math.max(0, total - newCash - cardVal) : 0;
      if (creditVal > remainingSpaceForCredit) {
        setCreditAmountPaid(remainingSpaceForCredit > 0 ? remainingSpaceForCredit.toFixed(2) : '0.00');
      }
    }
  };

  const handleCardChange = (valStr: string) => {
    setCardAmountPaid(valStr);
    const newCard = parseFloat(valStr) || 0;
    const cashVal = parseFloat(cashAmountPaid) || 0;
    const creditVal = parseFloat(creditAmountPaid) || 0;
    const total = activeInvoice.grandTotal;

    const maxSpace = Math.max(0, total - cashVal);
    let effectiveCard = newCard;
    if (effectiveCard > maxSpace) {
      effectiveCard = maxSpace;
      setCardAmountPaid(effectiveCard.toFixed(2));
    }

    const remainingSpaceForCredit = isCreditPurchasesAllowed ? Math.max(0, total - cashVal - effectiveCard) : 0;
    if (creditVal > remainingSpaceForCredit) {
      setCreditAmountPaid(remainingSpaceForCredit > 0 ? remainingSpaceForCredit.toFixed(2) : '0.00');
    }
  };

  const handleCreditChange = (valStr: string) => {
    if (!isCreditPurchasesAllowed) {
      setCreditAmountPaid('0.00');
      showToast(`المورد (${currentSelectedVendor?.name || activeInvoice.vendorName}) لا يسمح بالتعامل الآجل وفقاً لبيانات المورد`, 'warning');
      return;
    }
    const newCredit = parseFloat(valStr) || 0;
    const cashVal = parseFloat(cashAmountPaid) || 0;
    const cardVal = parseFloat(cardAmountPaid) || 0;
    const total = activeInvoice.grandTotal;

    const maxAllowedCredit = Math.max(0, total - cashVal - cardVal);
    let effectiveCredit = newCredit;
    if (effectiveCredit > maxAllowedCredit) {
      effectiveCredit = maxAllowedCredit;
      setCreditAmountPaid(effectiveCredit > 0 ? effectiveCredit.toFixed(2) : '0.00');
    } else {
      setCreditAmountPaid(valStr);
    }
  };

  const handleDoubleClickPayment = (targetMethod: 'cash' | 'card' | 'credit') => {
    if (targetMethod === 'credit' && !isCreditPurchasesAllowed) {
      showToast(`المورد (${currentSelectedVendor?.name || activeInvoice.vendorName}) لا يسمح بالشراء الآجل وفقاً لبيانات المورد`, 'warning');
      return;
    }
    const total = activeInvoice.grandTotal;
    const formattedTotal = total.toFixed(2);
    setCashAmountPaid(targetMethod === 'cash' ? formattedTotal : '0.00');
    setCardAmountPaid(targetMethod === 'card' ? formattedTotal : '0.00');
    setCreditAmountPaid(targetMethod === 'credit' ? formattedTotal : '0.00');
  };

  const handleEnterOnPaymentInput = (source: 'cash' | 'card') => {
    if (!isCreditPurchasesAllowed) {
      return;
    }
    const cashVal = parseFloat(cashAmountPaid) || 0;
    const cardVal = parseFloat(cardAmountPaid) || 0;
    const total = activeInvoice.grandTotal;
    const remaining = Math.max(0, total - cashVal - cardVal);
    if (remaining > 0) {
      setCreditAmountPaid(remaining.toFixed(2));
    }
  };

  const derivePaymentMethod = (cash: number, card: number, credit: number): 'نقدي' | 'آجل' | 'تحويل بنكي' => {
    if (credit > 0 && cash === 0 && card === 0) return 'آجل';
    if (card > 0 && cash === 0 && credit === 0) return 'تحويل بنكي';
    return 'نقدي';
  };

  const triggerPrintExecution = () => {
    try {
      if (typeof window !== 'undefined') {
        window.focus();
        setTimeout(() => {
          window.print();
        }, 50);
      }
    } catch (err) {
      console.error('Failed to trigger window.print():', err);
    }
  };

  const handleSaveInvoiceOnly = () => {
    const cash = parseFloat(cashAmountPaid) || 0;
    const card = parseFloat(cardAmountPaid) || 0;
    const credit = parseFloat(creditAmountPaid) || 0;

    const totalNeeded = Math.round(activeInvoice.grandTotal * 100) / 100;
    const totalPaid = Math.round((cash + card + credit) * 100) / 100;
    const remainingAmount = Math.round((totalNeeded - totalPaid) * 100) / 100;

    if (remainingAmount > 0 || remainingAmount < 0) {
      showToast('المبلغ المسدد غير مكتمل', 'error');
      return;
    }

    const pMethod = derivePaymentMethod(cash, card, credit);

    // Credit limit validation matching Sales Entry exactly
    if (credit > 0) {
      const creditValResult = purchaseService.validateVendorCredit(
        activeInvoice.vendorId,
        credit,
        pMethod,
        activeInvoice.id
      );
      if (!creditValResult.allowed) {
        showToast(creditValResult.message || 'لا يمكن حفظ الفاتورة كآجل: تجاوز حد الائتمان أو الآجل غير مسموح للمورد', 'error');
        return;
      }
    } else if (pMethod === 'آجل' && !isCreditPurchasesAllowed) {
      showToast(`لا يمكن حفظ الفاتورة كآجل: المورد (${currentSelectedVendor?.name || activeInvoice.vendorName}) لا يسمح بالشراء الآجل وفقاً لبيانات المورد`, 'error');
      return;
    }

    const selectedBank = availableBankAccounts.find(b => b.id === selectedBankId);

    const saveResult = purchaseService.savePurchaseInvoice({
      ...activeInvoice,
      paymentMethod: pMethod,
      cashPaid: cash,
      cardPaid: card,
      creditPaid: credit,
      bankId: selectedBank?.id,
      bankName: selectedBank?.bankName,
      paidAmount: cash + card,
      remainingAmount: credit,
      status: 'completed'
    });

    if (!saveResult.success) {
      showToast(saveResult.error || 'تعذر حفظ الفاتورة', 'error');
      return;
    }

    setIsPaymentModalOpen(false);
    showToast(`تم حفظ فاتورة المشتريات رقم ${saveResult.invoice!.invoiceNumber} بنجاح`, 'success');
    executeNewInvoice();
  };

  const handleCompletePaymentAndPrint = (format: 'a4' | 'receipt' = 'a4') => {
    const cash = parseFloat(cashAmountPaid) || 0;
    const card = parseFloat(cardAmountPaid) || 0;
    const credit = parseFloat(creditAmountPaid) || 0;

    const totalNeeded = Math.round(activeInvoice.grandTotal * 100) / 100;
    const totalPaid = Math.round((cash + card + credit) * 100) / 100;
    const remainingAmount = Math.round((totalNeeded - totalPaid) * 100) / 100;

    if (remainingAmount > 0 || remainingAmount < 0) {
      showToast('المبلغ المسدد غير مكتمل', 'error');
      return;
    }

    const pMethod = derivePaymentMethod(cash, card, credit);

    // Credit limit validation matching Sales Entry exactly
    if (credit > 0) {
      const creditValResult = purchaseService.validateVendorCredit(
        activeInvoice.vendorId,
        credit,
        pMethod,
        activeInvoice.id
      );
      if (!creditValResult.allowed) {
        showToast(creditValResult.message || 'لا يمكن حفظ الفاتورة كآجل: تجاوز حد الائتمان أو الآجل غير مسموح للمورد', 'error');
        return;
      }
    } else if (pMethod === 'آجل' && !isCreditPurchasesAllowed) {
      showToast(`لا يمكن حفظ الفاتورة كآجل: المورد (${currentSelectedVendor?.name || activeInvoice.vendorName}) لا يسمح بالشراء الآجل وفقاً لبيانات المورد`, 'error');
      return;
    }

    const selectedBank = availableBankAccounts.find(b => b.id === selectedBankId);

    const saveResult = purchaseService.savePurchaseInvoice({
      ...activeInvoice,
      paymentMethod: pMethod,
      cashPaid: cash,
      cardPaid: card,
      creditPaid: credit,
      bankId: selectedBank?.id,
      bankName: selectedBank?.bankName,
      paidAmount: cash + card,
      remainingAmount: credit,
      printFormat: format,
      status: 'completed'
    });

    if (!saveResult.success) {
      showToast(saveResult.error || 'تعذر إتمام الدفع وحفظ الفاتورة', 'error');
      return;
    }

    const saved = saveResult.invoice || activeInvoice;
    setCompletedReceipt(saved);
    setIsPaymentModalOpen(false);
    showToast(`تم حفظ فاتورة الشراء رقم ${saved.invoiceNumber} بنجاح`, 'success');
    executeNewInvoice();
    setTimeout(() => {
      triggerPrintExecution();
    }, 150);
  };

  // 3. Hold Invoice Action (F3)
  const handleHoldInvoiceAction = useCallback(() => {
    if (activeInvoice.lineItems.length === 0) {
      showToast('لا يمكن تعليق فاتورة فارغة', 'error');
      return;
    }
    const held = purchaseService.holdPurchaseInvoice(activeInvoice);
    showToast(`تم تعليق فاتورة الشراء [${held.invoiceNumber}] بنجاح (F3)`, 'info');
    executeNewInvoice();
  }, [activeInvoice, executeNewInvoice]);

  // 4. View History / Records Action (F4)
  const handleViewHistoryAction = useCallback(() => {
    setIsPurchaseHistoryModalOpen(true);
  }, []);

  // 5. Print Invoice Action (F5)
  const handlePrintInvoiceAction = useCallback(() => {
    if (activeInvoice.lineItems.length === 0) {
      showToast('لا توجد أصناف للطباعة', 'error');
      return;
    }
    const isSaved = purchaseService.isInvoiceSaved(activeInvoice.id);
    if (!isSaved) {
      showToast('يجب حفظ الفاتورة أولًا قبل طباعتها.', 'error');
      return;
    }
    setCompletedReceipt(activeInvoice);
    setTimeout(() => {
      window.print();
    }, 150);
  }, [activeInvoice]);

  // 6. Cancel Draft Action (F6)
  const handleCancelInvoiceAction = useCallback(() => {
    if (activeInvoice.lineItems.length > 0) {
      setIsCancelConfirmModalOpen(true);
    } else {
      executeNewInvoice();
      showToast('تم تفريغ مسودة فاتورة الشراء الحالية', 'info');
    }
  }, [activeInvoice.lineItems.length, executeNewInvoice]);

  // 7. Close Screen Action (F7)
  const handleCloseScreenAction = useCallback(() => {
    if (checkHasUnsavedData()) {
      setIsCloseConfirmModalOpen(true);
    } else {
      onClose?.();
    }
  }, [checkHasUnsavedData, onClose]);

  // Resume Held Invoice Handler
  const handleResumeHeldInvoice = (invoiceId: string) => {
    const resumed = purchaseService.resumeHeldInvoice(invoiceId);
    if (resumed) {
      setActiveInvoice(resumed);
      if (resumed.vendorType === 'cash' && resumed.vendorName.includes('(')) {
        const match = resumed.vendorName.match(/\((.*?)\)/);
        if (match) setCustomCashVendorName(match[1]);
      }
      setIsPurchaseHistoryModalOpen(false);
      showToast(`تم استئناف فاتورة الشراء [${resumed.invoiceNumber}] بنجاح`, 'success');
    }
  };

  // Edit Completed Invoice Handler
  const handleEditCompletedInvoice = (inv: PurchaseInvoiceData) => {
    setEditInvoiceConfirmModal({ isOpen: false });
    setActiveInvoice({
      ...inv,
      status: 'draft',
      isEdited: true
    });
    if (inv.vendorType === 'cash' && inv.vendorName.includes('(')) {
      const match = inv.vendorName.match(/\((.*?)\)/);
      if (match) setCustomCashVendorName(match[1]);
    }
    setIsPurchaseHistoryModalOpen(false);
    showToast(`تم تحميل فاتورة الشراء [${inv.invoiceNumber}] للتعديل`, 'info');
  };

  // Cancel Completed Invoice Handler
  const handleExecuteCancelInvoice = (inv: PurchaseInvoiceData) => {
    const res = purchaseService.cancelPurchaseInvoice(inv.id);
    setCancelInvoiceConfirmModal({ isOpen: false });
    if (res.success) {
      showToast(`تم إلغاء فاتورة الشراء [${inv.invoiceNumber}] وعكس الأرصدة بالمخزن`, 'warning');
    } else {
      showToast(res.error || 'فشل إلغاء الفاتورة', 'error');
    }
  };

  // Keyboard shortcut listener (F1 to F7)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        isProductBrowseModalOpen ||
        isAllWarehousesStockModalOpen ||
        isVendorRecordsModalOpen ||
        isPurchaseHistoryModalOpen ||
        isPaymentModalOpen ||
        completedReceipt !== null ||
        isNewConfirmModalOpen ||
        isCancelConfirmModalOpen ||
        isCloseConfirmModalOpen ||
        cancelInvoiceConfirmModal.isOpen ||
        editInvoiceConfirmModal.isOpen ||
        deleteHeldConfirmModal.isOpen
      ) {
        return;
      }

      if (e.key === 'F1') {
        e.preventDefault();
        handleNewInvoiceAction();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleSaveInvoiceAction();
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleHoldInvoiceAction();
      } else if (e.key === 'F4') {
        e.preventDefault();
        handleViewHistoryAction();
      } else if (e.key === 'F5') {
        e.preventDefault();
        handlePrintInvoiceAction();
      } else if (e.key === 'F6') {
        e.preventDefault();
        handleCancelInvoiceAction();
      } else if (e.key === 'F7') {
        e.preventDefault();
        handleCloseScreenAction();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isProductBrowseModalOpen,
    isAllWarehousesStockModalOpen,
    isVendorRecordsModalOpen,
    isPurchaseHistoryModalOpen,
    completedReceipt,
    isNewConfirmModalOpen,
    isCancelConfirmModalOpen,
    isCloseConfirmModalOpen,
    cancelInvoiceConfirmModal.isOpen,
    editInvoiceConfirmModal.isOpen,
    deleteHeldConfirmModal.isOpen,
    handleNewInvoiceAction,
    handleSaveInvoiceAction,
    handleHoldInvoiceAction,
    handleViewHistoryAction,
    handlePrintInvoiceAction,
    handleCancelInvoiceAction,
    handleCloseScreenAction
  ]);

  return (
    <div className="space-y-4 animate-fade-in text-right select-none" dir="rtl">
      {/* Toast Notification Floating Banner */}
      {toastMessage && (
        <div 
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-bold flex items-center space-x-2 space-x-reverse transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
              : 'bg-slate-900/95 border-blue-500/50 text-blue-200'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Container Card */}
      <div className="space-y-4">
        {/* TOP HEADER CONTROLS (Row 1: Entry Mode, Invoice #, Date, Time) */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
          <div className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-center">
              {/* 1. نوع الإدخال */}
              <div className="flex flex-col space-y-1 relative" ref={entryModeDropdownRef}>
                <label className="text-[11px] font-bold text-slate-400 text-center">نوع الإدخال</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEntryModeDropdownOpen(prev => !prev)}
                    className="relative w-full h-9 px-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-center space-x-1.5 space-x-reverse truncate font-bold text-center">
                      {entryMode === 'standard' && <Keyboard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      {entryMode === 'pos' && <Barcode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      {entryMode === 'button' && <Grid className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      <span className="truncate font-bold">
                        {entryMode === 'standard' ? 'قياسي' : entryMode === 'pos' ? 'ماسح الباركود' : 'أزرار سريعة'}
                      </span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 absolute left-2.5 top-2.5 pointer-events-none ${isEntryModeDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isEntryModeDropdownOpen && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 divide-y divide-slate-800" dir="rtl">
                      <button
                        type="button"
                        onClick={() => { setEntryMode('standard'); setIsEntryModeDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-right transition-colors cursor-pointer ${
                          entryMode === 'standard' ? 'bg-orange-500/15 text-orange-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
                          <span>قياسي</span>
                        </div>
                        {entryMode === 'standard' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setEntryMode('pos'); setIsEntryModeDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-right transition-colors cursor-pointer ${
                          entryMode === 'pos' ? 'bg-orange-500/15 text-orange-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Barcode className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ماسح الباركود</span>
                        </div>
                        {entryMode === 'pos' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => { setEntryMode('button'); setIsEntryModeDropdownOpen(false); }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs text-right transition-colors cursor-pointer ${
                          entryMode === 'button' ? 'bg-orange-500/15 text-orange-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Grid className="w-3.5 h-3.5 text-amber-400" />
                          <span>أزرار سريعة</span>
                        </div>
                        {entryMode === 'button' && <Check className="w-3.5 h-3.5 text-orange-400" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. رقم الفاتورة */}
              <div className="flex flex-col space-y-1 relative" ref={invoiceSearchRef}>
                <label className="text-[11px] font-bold text-slate-400 text-center">رقم الفاتورة</label>
                <div className="relative h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-mono text-xs font-bold">
                  <span className="text-slate-100 truncate text-center font-mono font-bold">{activeInvoice.invoiceNumber}</span>
                  <button
                    type="button"
                    onClick={() => setIsInvoiceSearchOpen(prev => !prev)}
                    title="بحث برقم الفاتورة"
                    className="absolute left-1.5 top-1.5 p-1 rounded-lg text-slate-400 hover:text-orange-300 hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
                  >
                    <Search className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isInvoiceSearchOpen && (
                  <div className="absolute top-full right-0 mt-1 w-80 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3" dir="rtl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 space-x-reverse text-xs font-bold text-slate-200">
                        <Search className="w-4 h-4 text-orange-400" />
                        <span>بحث في فواتير الشراء</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsInvoiceSearchOpen(false)}
                        className="text-slate-400 hover:text-slate-200 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="أدخل رقم فاتورة الشراء..."
                      value={invoiceSearchQuery}
                      onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                      className="w-full h-8.5 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                    />
                    {invoiceSearchQuery.trim() ? (
                      <div className="mt-2 max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-800">
                        {[...completedInvoices, ...heldInvoices]
                          .filter(inv => inv.invoiceNumber?.toLowerCase().includes(invoiceSearchQuery.toLowerCase()) || inv.vendorName?.toLowerCase().includes(invoiceSearchQuery.toLowerCase()))
                          .slice(0, 5)
                          .map(inv => (
                            <div key={inv.id} className="pt-1.5 flex items-center justify-between text-[11px] text-slate-300">
                              <div>
                                <span className="font-mono font-bold text-orange-400">{inv.invoiceNumber}</span>
                                <span className="text-slate-400 mr-2">({inv.vendorName})</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (inv.status === 'held') {
                                    handleResumeHeldInvoice(inv.id);
                                  } else {
                                    setCompletedReceipt(inv);
                                  }
                                  setIsInvoiceSearchOpen(false);
                                }}
                                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold transition-colors cursor-pointer"
                              >
                                {inv.status === 'held' ? 'استئناف' : 'معاينة'}
                              </button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="mt-2 text-center py-2 text-[11px] text-slate-400">
                        الفاتورة الحالية: <span className="font-mono font-bold text-slate-200">{activeInvoice.invoiceNumber}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. التاريخ */}
              <div className="flex flex-col space-y-1 relative">
                <label className="text-[11px] font-bold text-slate-400 text-center">التاريخ</label>
                <div className="relative h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-mono text-xs text-slate-200 font-bold hover:border-slate-700 transition-colors">
                  <span className="truncate select-none cursor-default text-center font-mono font-bold">
                    {new Date(activeInvoice.createdAt).toISOString().split('T')[0]}
                  </span>
                  <div className="absolute left-1.5 top-1.5 flex items-center justify-center p-1 rounded-lg pointer-events-none shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={new Date(activeInvoice.createdAt).toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        setActiveInvoice(prev => ({ ...prev, createdAt: new Date(e.target.value).toISOString() }));
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10 [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* 4. الوقت */}
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-slate-400 text-center">الوقت</label>
                <div className="relative h-9 px-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-mono text-xs text-slate-200 font-bold">
                  <span className="truncate text-center font-mono font-bold">
                    {new Date(activeInvoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: OPERATIONAL FIELDS (المورد، المخزن المستلم، الخزينة/طريقة الدفع) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-stretch">
            {/* 1. قسم بيانات المورد */}
            <div className="flex flex-col space-y-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 justify-between">
              {/* الصف العلوي للمورد: يمين: نوع المورد | يسار: طريقة السداد */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* يمين في RTL: نوع المورد */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 text-center">نوع المورد</label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    <select
                      id="purchases-vendor-type-select"
                      value={activeInvoice.vendorType === 'cash' ? 'cash' : 'permanent'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'cash') {
                          handleSelectCashVendor();
                        } else {
                          const permanentVendors = vendors.filter(
                            v => !v.isSystemCashVendor && v.id !== 'VEND-CASH' && v.id !== 'VEND-CASH-001' && v.type !== 'مورد نقدي' && vendorService.isVendorActive(v)
                          );
                          if (permanentVendors.length > 0) {
                            handleSelectVendor(permanentVendors[0]);
                          } else {
                            setIsVendorRecordsModalOpen(true);
                          }
                        }
                      }}
                      className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-center"
                    >
                      <option value="cash" className="bg-slate-900 text-slate-100 font-bold">
                        مورد نقدي (Cash Vendor)
                      </option>
                      <option value="permanent" className="bg-slate-900 text-slate-100 font-bold">
                        مورد دائم
                      </option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* يسار في RTL: طريقة السداد للمورد */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 text-center">طريقة السداد</label>
                  <div className="relative">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    <select
                      value={activeInvoice.paymentMethod}
                      onChange={(e) => {
                        const newMethod = e.target.value as any;
                        if (newMethod === 'آجل' && !isCreditPurchasesAllowed) {
                          showToast(`المورد (${currentSelectedVendor?.name || activeInvoice.vendorName}) لا يسمح بالتعامل الآجل وفقاً لبيانات المورد`, 'warning');
                          return;
                        }
                        setActiveInvoice(prev => ({ ...prev, paymentMethod: newMethod }));
                      }}
                      className="w-full h-9 pr-7 pl-6 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none text-center"
                    >
                      <option value="نقدي" className="bg-slate-900 text-slate-100 font-bold">نقدي (Cash)</option>
                      <option value="آجل" disabled={!isCreditPurchasesAllowed} className={`bg-slate-900 font-bold ${!isCreditPurchasesAllowed ? 'text-slate-500' : 'text-slate-100'}`}>
                        آجل (Credit) {!isCreditPurchasesAllowed ? '— غير متاح للمورد' : ''}
                      </option>
                      <option value="تحويل بنكي" className="bg-slate-900 text-slate-100 font-bold">تحويل بنكي</option>
                      <option value="شيك" className="bg-slate-900 text-slate-100 font-bold">شيك مصرفي</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* الصف السفلي للمورد: إما مورد نقدي أو مورد مسجل مع زر تغيير المورد وزر مورد جديد */}
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-slate-400 text-center">
                  {activeInvoice.vendorType === 'cash' ? 'المورد' : 'المورد المسجل'}
                </label>
                {activeInvoice.vendorType === 'cash' ? (
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="مورد نقدي (Cash Vendor)"
                      value={customCashVendorName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomCashVendorName(val);
                        setActiveInvoice(prev => ({
                          ...prev,
                          vendorName: val.trim() ? `مورد نقدي (${val.trim()})` : 'مورد نقدي'
                        }));
                      }}
                      className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 text-center"
                    />
                  </div>
                ) : (
                  <div className="relative" ref={vendorDropdownRef}>
                    <div className="flex items-center space-x-1.5 space-x-reverse">
                      <div
                        id="purchases-permanent-vendor-select-box"
                        onClick={() => {
                          setIsVendorQuickDropdownOpen(prev => !prev);
                          setVendorQuickSearchQuery('');
                        }}
                        className={`relative flex-1 h-9 px-3 bg-slate-950 border ${
                          isVendorQuickDropdownOpen ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-blue-900/60 hover:border-blue-500'
                        } rounded-xl text-xs text-blue-300 font-bold flex items-center justify-center transition-all cursor-pointer group shadow-sm select-none`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-400 shrink-0 group-hover:scale-110 transition-transform absolute right-2.5 top-2.5 pointer-events-none" />
                        <div className="flex items-center justify-center truncate max-w-[calc(100%-140px)] text-center">
                          <span className="truncate text-slate-100 font-bold text-center">
                            {(() => {
                              const selected = vendors.find(v => v.id === activeInvoice.vendorId);
                              if (selected) {
                                return `${selected.name} (${selected.code})`;
                              }
                              return activeInvoice.vendorName || 'اختر المورد المسجل...';
                            })()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1.5 space-x-reverse shrink-0 absolute left-2 top-1.5">
                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-blue-300 transition-transform duration-200 ${isVendorQuickDropdownOpen ? 'rotate-180 text-blue-400' : ''}`} />
                          <button
                            type="button"
                            id="purchases-change-vendor-records-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsVendorQuickDropdownOpen(false);
                              setIsVendorRecordsModalOpen(true);
                            }}
                            title="فتح سجلات الموردين الكاملة (تغيير المورد)"
                            className="text-[10px] text-blue-300 bg-blue-950/90 hover:bg-blue-800 hover:text-white px-2 py-0.5 rounded border border-blue-700/50 font-bold transition-colors cursor-pointer"
                          >
                            تغيير المورد
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        id="purchases-new-vendor-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsVendorQuickDropdownOpen(false);
                          if (onOpenVendorMaster) {
                            onOpenVendorMaster();
                          } else if (onNavigateSection) {
                            onNavigateSection('vendors');
                          }
                        }}
                        title="مورد جديد (فتح شاشة بيانات الموردين)"
                        className="h-9 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center shrink-0 cursor-pointer transition-colors shadow"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Vendor Dropdown Popover */}
                    {isVendorQuickDropdownOpen && (
                      <div 
                        className="absolute top-full right-0 left-0 mt-1 z-50 bg-slate-900 border border-slate-700/90 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md"
                        onClick={(e) => e.stopPropagation()}
                        dir="rtl"
                      >
                        {/* Search Input Box */}
                        <div className="p-2 border-b border-slate-800/80 bg-slate-950/60">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                            <input
                              ref={vendorQuickSearchInputRef}
                              type="text"
                              autoFocus
                              placeholder="ابحث بالاسم، الكود، أو الهاتف..."
                              value={vendorQuickSearchQuery}
                              onChange={(e) => setVendorQuickSearchQuery(e.target.value)}
                              className="w-full h-8 pr-8 pl-7 bg-slate-900 border border-slate-700/70 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
                            />
                            {vendorQuickSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setVendorQuickSearchQuery('')}
                                className="absolute left-2 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Vendor List */}
                        <div className="max-h-56 overflow-y-auto divide-y divide-slate-800/40">
                          {quickFilteredVendors.length === 0 ? (
                            <div className="py-6 px-3 text-center text-xs text-slate-500">
                              لا يوجد موردون مطابقون للبحث
                            </div>
                          ) : (
                            quickFilteredVendors.map((vend) => {
                              const isSelected = vend.id === activeInvoice.vendorId;
                              return (
                                <button
                                  key={vend.id}
                                  type="button"
                                  onClick={() => {
                                    handleSelectVendor(vend);
                                    setIsVendorQuickDropdownOpen(false);
                                    setVendorQuickSearchQuery('');
                                  }}
                                  className={`w-full px-3 py-2 text-right flex items-center justify-between transition-colors text-xs cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-600/20 text-blue-200 font-bold border-r-2 border-blue-500'
                                      : 'text-slate-200 hover:bg-slate-800/70'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                      isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="truncate text-right">
                                      <div className="font-bold text-slate-100 truncate flex items-center gap-1.5">
                                        <span>{vend.name}</span>
                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono font-normal">
                                          {vend.code}
                                        </span>
                                      </div>
                                      {vend.phone && (
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5" dir="ltr">
                                          <Phone className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                          <span>{vend.phone}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-blue-400 shrink-0 ml-1" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2. قسم المخزن المستلم والخزينة */}
            <div className="flex flex-col space-y-2.5 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 justify-between">
              {/* المخزن المستلم */}
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-slate-400 text-center">المخزن المستلم للبضاعة</label>
                <div className="relative">
                  <WarehouseIcon className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  <select
                    value={activeInvoice.warehouseId}
                    onChange={(e) => {
                      const selected = branchWarehouses.find(w => w.id === e.target.value);
                      if (selected) {
                        setActiveInvoice(prev => ({
                          ...prev,
                          warehouseId: selected.id,
                          warehouseName: selected.name
                        }));
                      }
                    }}
                    className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer appearance-none text-center"
                  >
                    {branchWarehouses.map((w, idx) => (
                      <option key={`purch-wh-${w.id || idx}-${idx}`} value={w.id} className="bg-slate-900 text-slate-100 font-bold">
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                </div>
              </div>

              {/* الخزينة المنصرف منها */}
              <div className="flex flex-col space-y-1">
                <label className="text-[11px] font-bold text-slate-400 text-center">الخزينة المنصرف منها (للمشتريات النقدية)</label>
                <div className="relative">
                  <Wallet className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                  <select
                    value={activeInvoice.treasuryId}
                    onChange={(e) => {
                      const selected = treasuries.find(t => t.id === e.target.value);
                      if (selected) {
                        setActiveInvoice(prev => ({
                          ...prev,
                          treasuryId: selected.id,
                          treasuryName: selected.name
                        }));
                      }
                    }}
                    className="w-full h-9 pr-8 pl-7 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer appearance-none text-center"
                  >
                    {treasuries.map(t => (
                      <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100 font-bold">
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-3 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PRODUCT SEARCH / BARCODE FAST INPUT BAR (Standard Tabular Mode with Bonus Mode, Browse button, and Instructions - Identical to Sales Mode) */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3 relative">
          {/* Header row above search bar (identical to sales invoice standard mode header) */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <span className="text-xs font-bold text-slate-300">أصناف الفاتورة</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 text-[11px] font-mono border border-slate-800">
                {activeInvoice.lineItems.length} صنف
              </span>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <button
                type="button"
                id="purchases-bonus-mode-toggle"
                onClick={() => setIsBonusMode(prev => !prev)}
                className={`flex items-center space-x-1.5 space-x-reverse px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  isBonusMode
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
                title={isBonusMode ? 'العودة لعرض الخصم والإجمالي القياسي' : 'تفعيل وضع البونص وإدخال كميات البونص'}
              >
                <Gift className={`w-3.5 h-3.5 ${isBonusMode ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{isBonusMode ? 'وضع البونص نشط' : 'وضع البونص (Bonus Mode)'}</span>
              </button>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">التنقل بلوحة المفاتيح نشط (Tab/Enter)</span>
            </div>
          </div>

          {/* Search / Add Item Bar */}
          <div className="relative">
            <div className="relative flex items-center">
              <button
                type="button"
                id="purchases-browse-products-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setInventoryModalSearch('');
                  setIsProductBrowseModalOpen(true);
                }}
                title="استعراض الأصناف ورصيد المخزون"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer z-10 flex items-center space-x-1.5 space-x-reverse text-xs"
              >
                <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-[11px] font-bold text-blue-300 hidden sm:inline">استعراض الأصناف</span>
              </button>
              <input
                type="text"
                placeholder="ابحث عن صنف بالاسم أو الكود (F2)..."
                value={productSearchQuery}
                onChange={e => setProductSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-36 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-slate-500"
              />
            </div>

            {/* Autocomplete Dropdown */}
            {productSearchQuery.trim() && (
              <div className="absolute left-0 right-0 top-12 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                {availableProducts
                  .filter(p => {
                    const q = productSearchQuery.toLowerCase();
                    return (
                      p.name.toLowerCase().includes(q) ||
                      p.code.toLowerCase().includes(q) ||
                      (p.barcode && p.barcode.includes(q)) ||
                      (p.serialNumber && p.serialNumber.toLowerCase().includes(q)) ||
                      (Array.isArray(p.serialNumbers) && p.serialNumbers.some(s => s.toLowerCase().includes(q)))
                    );
                  })
                  .slice(0, 5)
                  .map((p, idx) => (
                    <button
                      key={p.id ? `${p.id}-${idx}` : `auto-p-${idx}`}
                      type="button"
                      onClick={() => {
                        handleAddProduct(p);
                        setProductSearchQuery('');
                      }}
                      className="w-full p-2.5 text-right hover:bg-slate-900 flex items-center justify-between text-xs cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="font-bold text-slate-100">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {p.code} • باركود: {p.barcode || '—'} • الشحنة: {p.batchNumber || 'افتراضية'} • المخزون: {getProductWarehouseStock(p)}
                        </div>
                      </div>
                      <span className="font-mono text-emerald-400 font-bold">
                        ${(p.costPrice || p.lastPurchasePrice || p.unitPrice || 0).toFixed(2)}
                      </span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* LINE ITEMS TABLE */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40 mt-3">
            <table className="w-full text-right text-xs table-fixed min-w-[780px]" dir="rtl">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400 font-bold text-xs">
                  <th className="w-[4%] py-3 px-2 text-center text-slate-500 font-mono">#</th>
                  <th className={`${isBonusMode ? 'w-[26%]' : 'w-[32%]'} py-3 px-3 text-right text-slate-200`}>الصنف</th>
                  <th className={`${isBonusMode ? 'w-[15%]' : 'w-[18%]'} py-3 px-2 text-center text-slate-300`}>الكمية</th>
                  {isBonusMode && (
                    <th className="w-[12%] py-3 px-2 text-center text-amber-300">بونص (Bonus)</th>
                  )}
                  <th className="w-[14%] py-3 px-2 text-center text-slate-300">سعر الشراء</th>
                  <th className="w-[11%] py-3 px-2 text-center text-slate-300">الخصم %</th>
                  <th className="w-[10%] py-3 px-2 text-center text-slate-300">قيمة الخصم</th>
                  <th className="w-[11%] py-3 px-2 text-center text-slate-200 font-bold">الإجمالي</th>
                  <th className="w-[4%] py-3 px-2 text-center text-slate-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeInvoice.lineItems.length === 0 ? (
                  <tr>
                    <td colSpan={isBonusMode ? 9 : 8} className="py-12 text-center text-slate-500 italic text-xs">
                      لم يتم إضافة أصناف إلى فاتورة الشراء بعد. ابحث أعلاه أو اكتب اسم الصنف لإضافته.
                    </td>
                  </tr>
                ) : (
                  activeInvoice.lineItems.map((line, idx) => (
                    <tr key={line.id} className="hover:bg-slate-900/50 transition-colors group">
                      {/* 1. Row Index */}
                      <td className="py-3 px-2 text-center text-slate-500 font-mono text-xs">
                        {idx + 1}
                      </td>

                      {/* 2. Product Name & Code */}
                      <td className="py-3 px-3 text-right">
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-100 group-hover:text-orange-300 transition-colors">
                            {line.productName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {line.productCode} • {line.unit}
                          </div>
                        </div>
                      </td>

                      {/* 3. Quantity Controller */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center justify-center space-x-1.5 space-x-reverse bg-slate-900/90 border border-slate-800 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(line.id, -1)}
                            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                            title="إنقاص الكمية"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            value={line.quantity !== undefined && line.quantity !== null ? line.quantity : ''}
                            onChange={(e) => handleDirectQtyChange(line.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            className="w-10 text-center bg-transparent border-0 text-slate-100 font-mono text-xs font-bold focus:outline-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(line.id, 1)}
                            className="w-6 h-6 rounded-md bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-slate-100 cursor-pointer shrink-0 transition-all"
                            title="زيادة الكمية"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Bonus Quantity Controller (when Bonus Mode is active) */}
                      {isBonusMode && (
                        <td className="py-3 px-2 text-center">
                          <div className="inline-flex items-center justify-center space-x-1 space-x-reverse bg-amber-950/30 border border-amber-500/40 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateBonusQty(line.id, -1)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-amber-300 cursor-pointer shrink-0 transition-all"
                              title="إنقاص كمية البونص"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={0}
                              value={line.bonusQuantity || 0}
                              onChange={(e) => handleDirectBonusQtyChange(line.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              className="w-8 text-center bg-transparent border-0 text-amber-300 font-mono text-xs font-bold focus:outline-none p-0"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateBonusQty(line.id, 1)}
                              className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-amber-300 cursor-pointer shrink-0 transition-all"
                              title="زيادة كمية البونص"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* 4. Unit Purchase Price */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center justify-center bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
                          <span className="text-slate-400 font-mono text-[11px] ml-1">$</span>
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={line.unitPrice}
                            onChange={(e) => handleUpdatePrice(line.id, e.target.value)}
                            className="w-14 text-center bg-transparent border-0 text-slate-100 font-mono text-xs font-bold focus:outline-none p-0"
                          />
                        </div>
                      </td>

                      {/* 5. Discount Controller */}
                      <td className="py-3 px-2 text-center">
                        <div className="inline-flex items-center justify-center space-x-1 space-x-reverse bg-slate-900/90 border border-slate-800 rounded-lg px-1.5 py-1">
                          <input
                            type="number"
                            min={0}
                            value={line.discountValue || 0}
                            onChange={(e) => handleUpdateLineDiscount(line.id, e.target.value)}
                            className="w-8 text-center bg-transparent border-0 text-rose-400 font-mono text-xs font-bold focus:outline-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleToggleLineDiscountType(line.id)}
                            className="text-slate-400 hover:text-slate-200 font-mono text-[11px] cursor-pointer font-bold select-none"
                            title="تبديل نوع الخصم"
                          >
                            {line.discountType === 'percent' ? '%' : '$'} ▾
                          </button>
                        </div>
                      </td>

                      {/* 6. Discount Amount */}
                      <td className="py-3 px-2 font-mono text-center text-xs font-bold">
                        {line.discountAmount > 0 ? (
                          <span className="text-rose-400">-${line.discountAmount.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-400">$0.00</span>
                        )}
                      </td>

                      {/* 7. Final Line Total */}
                      <td className="py-3 px-2 font-mono text-slate-100 font-bold text-xs text-center">
                        ${line.lineTotal.toFixed(2)}
                      </td>

                      {/* 8. Delete Line */}
                      <td className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.id)}
                          className="text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 4 SUMMARY CARDS BELOW ITEMS TABLE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-3 border-t border-slate-800 text-right items-stretch" dir="rtl">
            {/* CARD 1 — إجمالي الأصناف + إجمالي عدد القطع */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-1 text-center">
              <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                  <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي الأصناف</span>
                </div>
                <span className="text-base font-black font-mono text-slate-100 leading-none">
                  {activeInvoice.lineItems.length}
                </span>
              </div>
              <div className="border-t border-slate-800/80 w-full" />
              <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                  <Boxes className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي عدد القطع</span>
                </div>
                <div className="inline-flex items-center justify-center space-x-1.5 space-x-reverse leading-none">
                  <span className="text-base font-black font-mono text-slate-100">
                    {activeInvoice.lineItems.reduce((acc, l) => acc + (l.quantity || 0) + (l.bonusQuantity || 0), 0)}
                  </span>
                  {activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0) > 0 && (
                    <span
                      className="px-1.5 py-0.5 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded leading-none"
                      title={`إجمالي البونص: ${activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0)}`}
                    >
                      {activeInvoice.lineItems.reduce((acc, l) => acc + (l.bonusQuantity || 0), 0)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CARD 2 — إجمالي المبلغ + الصافي */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
              <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                  <DollarSign className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي المشتريات</span>
                </div>
                <span className="text-base font-black font-mono text-orange-400 leading-none">
                  ${activeInvoice.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="border-t border-slate-800/80 w-full" />
              <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">الصافي النهائي</span>
                </div>
                <span className="text-base font-black font-mono text-emerald-400 leading-none">
                  ${activeInvoice.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* CARD 3 — الخصم الإضافي */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
              {/* القسم العلوي: إعدادات الخصم (العنوان + نوع الخصم + زر بدون + الإدخال) */}
              <div className="flex-1 flex flex-col items-center justify-center space-y-1.5 pb-1.5">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-1.5 space-x-reverse text-slate-400">
                    <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-300 whitespace-nowrap">الخصم الإضافي</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleSetInvoiceDiscount(activeInvoice.invoiceDiscountValue || 0, 'fixed')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                        (activeInvoice.invoiceDiscountType || 'fixed') === 'fixed'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      مبلغ ($)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetInvoiceDiscount(activeInvoice.invoiceDiscountValue || 0, 'percent')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                        activeInvoice.invoiceDiscountType === 'percent'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                      }`}
                    >
                      نسبة (%)
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 space-x-reverse w-full">
                  <button
                    type="button"
                    onClick={() => handleSetInvoiceDiscount(0, activeInvoice.invoiceDiscountType || 'percent')}
                    className={`py-0.5 px-2 rounded text-[10px] font-bold cursor-pointer transition-all text-center whitespace-nowrap ${
                      !activeInvoice.invoiceDiscountValue || activeInvoice.invoiceDiscountValue === 0
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    بدون
                  </button>

                  <input
                    type="text"
                    placeholder={activeInvoice.invoiceDiscountType === 'fixed' ? 'أدخل المبلغ ($)' : 'أدخل النسبة (%)'}
                    value={
                      activeInvoice.invoiceDiscountValue !== undefined &&
                      activeInvoice.invoiceDiscountValue !== 0
                        ? activeInvoice.invoiceDiscountValue
                        : ''
                    }
                    onChange={(e) => handleSetInvoiceDiscount(e.target.value, activeInvoice.invoiceDiscountType || 'percent')}
                    className="flex-1 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-center text-rose-400 font-mono text-xs font-bold focus:outline-none focus:border-blue-500 placeholder-slate-600"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/80 w-full" />

              <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                <div className="flex items-center justify-center space-x-1.5 space-x-reverse text-slate-400">
                  <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">إجمالي قيمة الخصم</span>
                </div>
                <span className="text-base font-black font-mono text-rose-400 leading-none">
                  -${activeInvoice.totalDiscount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* CARD 4 — ضريبة القيمة المضافة */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between h-full lg:col-span-2 text-center">
              <div className="flex-1 flex flex-col items-center justify-center space-y-1 pb-1.5">
                <label className="flex items-center justify-center space-x-2 space-x-reverse text-xs font-bold text-slate-200 cursor-pointer select-none w-full">
                  <input
                    type="checkbox"
                    checked={activeInvoice.isTaxInvoice}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const calc = recalculateInvoice(activeInvoice.lineItems, activeInvoice.invoiceDiscountValue, activeInvoice.invoiceDiscountType, checked);
                      setActiveInvoice(prev => ({ ...prev, isTaxInvoice: checked, ...calc }));
                    }}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-orange-600 focus:ring-orange-500 cursor-pointer accent-orange-600"
                  />
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                    القيمة المضافة (ضريبة 14%)
                  </span>
                </label>
                <span className="text-base font-black font-mono text-orange-400 leading-none">
                  +${activeInvoice.totalTax.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-slate-800/80 w-full" />

              <div className="flex-1 flex flex-col items-center justify-center space-y-1 pt-1.5">
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-300 whitespace-nowrap">خصم ضريبي:</span>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {[0, 1, 3].map(rate => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => {
                          const calc = recalculateInvoice(activeInvoice.lineItems, activeInvoice.invoiceDiscountValue, activeInvoice.invoiceDiscountType, activeInvoice.isTaxInvoice, rate);
                          setActiveInvoice(prev => ({ ...prev, taxDiscountRate: rate, ...calc }));
                        }}
                        className={`py-0.5 px-1.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer text-center whitespace-nowrap ${
                          activeInvoice.taxDiscountRate === rate
                            ? 'bg-orange-600 text-white font-bold shadow-sm'
                            : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {rate === 0 ? 'بدون' : `${rate}%`}
                      </button>
                    ))}
                  </div>
                </div>
                <span className={`text-base font-black font-mono leading-none ${activeInvoice.taxDiscount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                  {activeInvoice.taxDiscount > 0 ? `-$${activeInvoice.taxDiscount.toFixed(2)}` : '$0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (Matching Sales Terminal exactly) */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl" dir="rtl">
          <StandardActionBar
            hasHold={true}
            gridCols={7}
            onNew={handleNewInvoiceAction}
            onSave={handleSaveInvoiceAction}
            onHold={handleHoldInvoiceAction}
            onView={handleViewHistoryAction}
            onPrint={handlePrintInvoiceAction}
            onCancel={handleCancelInvoiceAction}
            onClose={handleCloseScreenAction}
            newLabel="فاتورة جديدة F1"
            saveLabel="حفظ الفاتورة F2"
            holdLabel="تعليق F3"
            viewLabel="عرض السجل F4"
            printLabel="طباعة F5"
            cancelLabel="إلغاء F6"
            closeLabel="إغلاق F7"
          />
        </div>
      </div>

      {/* 1. VENDOR RECORDS MODAL (تغيير المورد - استدعاء نفس شاشة وسجلات الموردين الموجودة أصلًا في النظام) */}
      <VendorRecordsModal
        isOpen={isVendorRecordsModalOpen}
        onClose={() => setIsVendorRecordsModalOpen(false)}
        onSelectVendor={(v) => {
          handleSelectVendor(v);
          setIsVendorRecordsModalOpen(false);
        }}
        selectedVendorId={activeInvoice.vendorId}
        isSelectionOnlyMode={true}
      />

      {/* 2. INVENTORY / PRODUCTS STOCK BROWSER MODAL (Identical to Sales Invoice Browser Modal) */}
      {isProductBrowseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl h-[92vh] max-h-[960px] flex flex-col shadow-2xl overflow-hidden text-right">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="erp-modal-title text-slate-100 flex items-center space-x-2 space-x-reverse">
                    <span>دليل استعراض الأصناف ورصيد المخزون</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                      {availableProducts.length} صنف مسجل
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    اختر صنفاً لإضافته مباشرة إلى الفاتورة الحالية مع عرض تفاصيل الأرصدة والكميات بالمستودع المحدد
                  </p>
                </div>
              </div>

              {/* READ-ONLY WAREHOUSE DISPLAY IN HEADER + QUERY BUTTON */}
              <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-2.5">
                <div 
                  id="inventory-modal-warehouse-readonly-badge"
                  className="flex items-center space-x-3 space-x-reverse px-5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-inner select-none pointer-events-none"
                  title="المخزن المرتبط بالفاتورة الحالية (للقراءة فقط)"
                >
                  <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="flex flex-col text-right">
                    <span className="text-xs text-slate-400 font-semibold leading-tight">المخزن الحالي:</span>
                    <span className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                      {currentInvoiceWarehouse.name} {currentInvoiceWarehouse.code ? `(${currentInvoiceWarehouse.code})` : ''}
                    </span>
                  </div>
                </div>

                {/* BUTTON: عرض رصيد الصنف في جميع المخازن */}
                <button
                  type="button"
                  id="btn-view-all-warehouses-stock"
                  onClick={handleOpenAllWarehousesStockModal}
                  className="flex items-center space-x-2 space-x-reverse px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-300 border border-amber-500/35 text-sm font-bold transition-all shadow-sm cursor-pointer"
                  title="استعلام عن رصيد الصنف المحدد في جميع مستودعات النظام"
                >
                  <Boxes className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>عرض الرصيد بجميع المخازن</span>
                </button>
              </div>
            </div>

            {/* Controls & Filter Bar */}
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 space-y-2.5 shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Search Bar within Modal */}
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                  <input
                    type="text"
                    placeholder="تصفية بالاسم، الكود SKU، الباركود، أو المستودع..."
                    value={inventoryModalSearch}
                    onChange={(e) => setInventoryModalSearch(e.target.value)}
                    className="w-full pr-9 pl-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {inventoryModalSearch && (
                    <button
                      type="button"
                      onClick={() => setInventoryModalSearch('')}
                      className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Category Filter Dropdown */}
                <div>
                  <select
                    value={inventorySelectedCategory}
                    onChange={(e) => setInventorySelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="All">جميع الفئات والتصنيفات</option>
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Categories Quick Filter Pills */}
              <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto custom-scrollbar pb-1 text-xs">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setInventorySelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
                      inventorySelectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat === 'All' ? 'جميع الأصناف' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid / Table Body */}
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {(() => {
                const filtered = availableProducts.filter(p => {
                  const matchesCategory = inventorySelectedCategory === 'All' || p.category === inventorySelectedCategory || p.subCategory === inventorySelectedCategory;
                  if (!matchesCategory) return false;

                  if (!inventoryModalSearch.trim()) return true;
                  const q = inventoryModalSearch.trim().toLowerCase();
                  return (
                    p.name.toLowerCase().includes(q) ||
                    p.code.toLowerCase().includes(q) ||
                    (p.barcode && p.barcode.includes(q)) ||
                    (p.warehouse && p.warehouse.toLowerCase().includes(q)) ||
                    (p.batchNumber && p.batchNumber.toLowerCase().includes(q))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800/80 my-auto">
                      <Package className="w-10 h-10 text-slate-600 mx-auto" />
                      <p className="text-slate-400 font-bold text-xs">لم يتم العثور على أصناف تطابق شروط البحث أو الفئة المحددة.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setInventoryModalSearch('');
                          setInventorySelectedCategory('All');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner flex-1 flex flex-col">
                    <div className="w-full flex-1 overflow-y-auto custom-scrollbar">
                      <table className="w-full table-fixed text-right text-xs">
                        <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                          <tr>
                            <th className="py-3 px-3.5 text-center w-[4%]">
                              <input
                                type="checkbox"
                                checked={filtered.length > 0 && filtered.every(p => selectedProductIds.has(p.id))}
                                onChange={() => {
                                  const allSelected = filtered.length > 0 && filtered.every(p => selectedProductIds.has(p.id));
                                  setSelectedProductIds(prev => {
                                    const next = new Set(prev);
                                    if (allSelected) {
                                      filtered.forEach(p => next.delete(p.id));
                                    } else {
                                      filtered.forEach(p => next.add(p.id));
                                    }
                                    return next;
                                  });
                                }}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer accent-amber-500"
                                title="تحديد الكل / إلغاء تحديد الكل"
                              />
                            </th>
                            <th className="py-3 px-4 w-[46%] text-right font-bold text-slate-200 text-sm">اسم الصنف</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">الرصيد المتاح</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">سعر الشراء</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">التصنيف</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">كود / SKU</th>
                            <th className="py-3 px-3 text-center w-[10%] whitespace-nowrap">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filtered.map((p, idx) => {
                            const warehouseStock = getProductWarehouseStock(p);
                            const isOutOfStock = warehouseStock <= 0;
                            const isLowStock = warehouseStock > 0 && warehouseStock <= (p.reorderPoint || 10);
                            const isSelected = selectedProductIds.has(p.id);
                            const isFocused = focusedProductInBrowser?.id === p.id;

                            return (
                              <tr
                                key={p.id ? `${p.id}-${idx}` : `inv-modal-p-${idx}`}
                                className={`transition-colors group cursor-pointer ${
                                  isSelected 
                                    ? 'bg-amber-500/15' 
                                    : isFocused 
                                    ? 'bg-slate-800/90 ring-1 ring-amber-500/40' 
                                    : 'hover:bg-slate-900/80'
                                }`}
                                onClick={() => {
                                  setFocusedProductInBrowser(p);
                                  setSelectedProductIds(prev => {
                                    const next = new Set(prev);
                                    if (next.has(p.id)) next.delete(p.id);
                                    else next.add(p.id);
                                    return next;
                                  });
                                }}
                              >
                                <td className="py-3 px-3.5 text-center w-[4%]" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setFocusedProductInBrowser(p);
                                      setSelectedProductIds(prev => {
                                        const next = new Set(prev);
                                        if (next.has(p.id)) next.delete(p.id);
                                        else next.add(p.id);
                                        return next;
                                      });
                                    }}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer accent-amber-500"
                                  />
                                </td>
                                <td className="py-3 px-4 w-[46%] font-bold text-slate-100 text-base break-words leading-relaxed text-right">
                                  <span className="font-bold text-slate-100 text-base">{p.name}</span>
                                </td>
                                <td className="py-3 px-3 text-center w-[10%] whitespace-nowrap">
                                  <span className={`inline-block text-base font-black px-3 py-1.5 rounded-full leading-tight ${
                                    isOutOfStock
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                      : isLowStock
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  }`}>
                                    {isOutOfStock ? 'نفد (0)' : `${warehouseStock} متاح`}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center w-[10%] whitespace-nowrap">
                                  <span className="inline-block text-base font-black font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-full leading-tight">
                                    ${(p.costPrice || p.lastPurchasePrice || p.unitPrice || 0).toFixed(2)}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center text-slate-300 whitespace-nowrap w-[10%]">
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium inline-block max-w-full truncate">
                                    {p.category}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400 whitespace-nowrap w-[10%]">
                                  <div className="flex flex-col items-center">
                                    <span className="font-medium text-slate-300">{p.code}</span>
                                    {p.barcode && <span className="text-[10px] text-slate-500">{p.barcode}</span>}
                                  </div>
                                </td>
                                <td className="py-3 px-3 text-center whitespace-nowrap w-[10%]" onClick={e => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleAddProduct(p);
                                      setIsProductBrowseModalOpen(false);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center space-x-1 space-x-reverse transition-all cursor-pointer shadow-sm shadow-amber-500/10 active:scale-95 w-full max-w-[110px]"
                                  >
                                    <Plus className="w-3.5 h-3.5 shrink-0" />
                                    <span>إضافة +</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-2">
                {selectedProductIds.size > 0 ? (
                  <span className="text-amber-300 font-black text-sm bg-amber-500/15 border border-amber-500/30 px-5 py-2.5 rounded-xl shadow-sm">
                    تم تحديد {selectedProductIds.size} {selectedProductIds.size === 1 ? 'صنف' : selectedProductIds.size === 2 ? 'صنفين' : 'أصناف'}
                  </span>
                ) : (
                  <span className="text-sm">استخدم Checkbox لتحديد أصناف متعددة، أو زر "إضافة +" للإضافة المباشرة.</span>
                )}

                {selectedProductIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProductIds(new Set())}
                    className="text-slate-300 hover:text-rose-400 font-bold underline cursor-pointer text-sm px-3 py-2 transition-colors"
                  >
                    إلغاء التحديد
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-3 space-x-reverse w-full sm:w-auto justify-end">
                <button
                  type="button"
                  disabled={selectedProductIds.size === 0}
                  onClick={handleAddSelectedProducts}
                  className={`px-6 py-3 rounded-xl font-black text-sm flex items-center space-x-2 space-x-reverse transition-all shadow-md ${
                    selectedProductIds.size > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span>
                    {selectedProductIds.size > 0
                      ? `إضافة المحدد (${selectedProductIds.size})`
                      : 'إضافة المحدد'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsProductBrowseModalOpen(false)}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition-colors text-sm shadow-sm active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ALL WAREHOUSES STOCK QUERY MODAL */}
      {isAllWarehousesStockModalOpen && selectedProductForWarehouseQuery && (
        <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl h-[88vh] max-h-[860px] shadow-2xl overflow-hidden text-right flex flex-col">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/70 shrink-0">
              <div className="flex items-center space-x-3.5 space-x-reverse w-[80%] min-w-0">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
                  <Boxes className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-100 whitespace-nowrap truncate tracking-tight">
                    رصيد الصنف في جميع المخازن
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap truncate">
                    استعلام تفصيلي فوري عن كميات الصنف المتاحة بكل مستودع (للقراءة فقط)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAllWarehousesStockModalOpen(false)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer shrink-0"
                title="إغلاق نافذة الأرصدة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Product Summary Header Card */}
            <div className="px-6 py-5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-6 shrink-0">
              <div className="w-[60%] space-y-1.5 text-right">
                <h4 className="text-xl font-black text-amber-300 break-words leading-relaxed">
                  {selectedProductForWarehouseQuery.name}
                </h4>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-mono">
                  <span>كود: <strong className="text-slate-300 font-semibold">{selectedProductForWarehouseQuery.code}</strong></span>
                  {selectedProductForWarehouseQuery.barcode && (
                    <span>• باركود: <strong className="text-slate-300 font-semibold">{selectedProductForWarehouseQuery.barcode}</strong></span>
                  )}
                  <span>• <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-sans">{selectedProductForWarehouseQuery.category}</span></span>
                </div>
              </div>
              <div className="w-[33%] flex flex-col items-end justify-center text-left">
                <span className="text-xs font-semibold text-slate-400 block mb-1">سعر الشراء:</span>
                <span className="inline-block text-lg font-black font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-4 py-1.5 rounded-full leading-tight shadow-sm shadow-emerald-500/10">
                  ${(selectedProductForWarehouseQuery.costPrice || selectedProductForWarehouseQuery.lastPurchasePrice || selectedProductForWarehouseQuery.unitPrice || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Warehouses Stock Table */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner flex-1 flex flex-col">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-800 sticky top-0 z-10 backdrop-blur-sm">
                    <tr>
                      <th className="py-4 px-6 text-sm font-bold text-slate-200">المخزن</th>
                      <th className="py-4 px-6 text-center text-sm font-bold text-slate-200 w-48">رصيد الصنف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {branchWarehouses.map((w, idx) => {
                      const stock = getProductStockInSpecificWarehouse(selectedProductForWarehouseQuery, w);
                      const isCurrentInvoiceWarehouse = w.id === currentInvoiceWarehouse.id || w.code === currentInvoiceWarehouse.code || w.name === currentInvoiceWarehouse.name;

                      return (
                        <tr key={w.id || `wh-${idx}`} className={`hover:bg-slate-900/50 transition-colors ${isCurrentInvoiceWarehouse ? 'bg-amber-500/5' : ''}`}>
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3 space-x-reverse">
                              <Building2 className={`w-5 h-5 shrink-0 ${isCurrentInvoiceWarehouse ? 'text-amber-400' : 'text-slate-500'}`} />
                              <div>
                                <span className="text-slate-100 font-bold text-base block">{w.name}</span>
                                <span className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-1.5 space-x-reverse">
                                  <span>{w.code || w.id}</span>
                                  {isCurrentInvoiceWarehouse && (
                                    <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded text-[10px]">
                                      (المخزن الحالي للفاتورة)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-mono">
                            <span className={`inline-block px-4 py-1.5 rounded-full text-base font-black leading-tight ${
                              stock > 0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                            }`}>
                              {stock}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsAllWarehousesStockModalOpen(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors cursor-pointer text-sm"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2.5 PAYMENT / FINALIZATION MODAL (إنهاء الفاتورة ومعالجة الدفع للمورد) */}
      {isPaymentModalOpen && (() => {
        const cashVal = parseFloat(cashAmountPaid) || 0;
        const cardVal = parseFloat(cardAmountPaid) || 0;
        const creditVal = parseFloat(creditAmountPaid) || 0;
        const totalNeeded = activeInvoice.grandTotal;
        const totalAllocated = cashVal + cardVal + creditVal;
        const changeDue = (cardVal === 0 && creditVal === 0 && cashVal > totalNeeded) ? (cashVal - totalNeeded) : 0;

        const currentVendor = vendors.find(v => v.id === activeInvoice.vendorId);
        const isPermanentVendor = activeInvoice.vendorType === 'permanent' || (currentVendor && !currentVendor.isSystemCashVendor && currentVendor.id !== 'VEND-CASH' && currentVendor.id !== 'VEND-CASH-001');

        const creditValidation = purchaseService.validateVendorCredit(
          activeInvoice.vendorId,
          creditVal,
          'deferred',
          activeInvoice.id
        );

        const allowCreditPurchases = creditValidation.allowCreditPurchases ?? isCreditPurchasesAllowed;
        const creditLimit = creditValidation.creditLimit || 0;
        const currentBalanceDue = creditValidation.currentOutstanding || (currentVendor?.balanceDue || 0);
        const projectedBalanceDue = currentBalanceDue + creditVal;
        const isLimitExceeded = (creditLimit > 0 && projectedBalanceDue > creditLimit) || creditValidation.isLimitExceeded;
        const isBlocked = (creditVal > 0 || !allowCreditPurchases) && !creditValidation.allowed;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto" dir="rtl">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-3xl w-full space-y-3.5 shadow-2xl my-auto">
              <div className="relative flex items-center justify-center border-b border-slate-800 pb-2.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-100 text-center tracking-wide">
                  إنهاء الفاتورة ومعالجة الدفع للمورد
                </h3>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="absolute left-0 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. أعلى النافذة: بطاقة المبلغ المستحق للدفع في المنتصف */}
              <div className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-0.5 font-mono shadow-inner flex flex-col items-center justify-center">
                <span className="text-slate-400 text-xs sm:text-sm font-semibold">المبلغ المستحق للدفع</span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-400 leading-none tracking-tight py-1">
                  ${totalNeeded.toFixed(2)}
                </div>
              </div>

              {/* 2. أسفل Card المبلغ المستحق: عمودان متساويان ومتناظران تماماً (3 خانات في كل عمود) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 items-start text-right">
                {/* العمود الأيمن: 3 خانات لطرق الدفع */}
                <div className="space-y-2.5">
                  {/* الخانة الأولى: 1. النقدي */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold font-mono text-xs sm:text-sm flex items-center space-x-1.5 space-x-reverse">
                        <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>1. النقدي ($)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Double Click للتعيين</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={cashAmountPaid}
                      onChange={e => handleCashChange(e.target.value)}
                      onDoubleClick={() => handleDoubleClickPayment('cash')}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEnterOnPaymentInput('cash');
                        }
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-mono font-bold text-base sm:text-lg text-center focus:border-amber-500 focus:outline-none cursor-pointer"
                      placeholder="0.00"
                      title="نقر مزدوج (Double Click) لنقل كامل المبلغ إلى النقدي وتصفير باقي الطرق"
                    />
                  </div>

                  {/* الخانة الثانية: 2. البطاقة / التحويل */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold font-mono text-xs sm:text-sm flex items-center space-x-1.5 space-x-reverse">
                        <CreditCard className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>2. البطاقة / التحويل ($)</span>
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Double Click للتعيين</span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      value={cardAmountPaid}
                      onChange={e => handleCardChange(e.target.value)}
                      onDoubleClick={() => handleDoubleClickPayment('card')}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEnterOnPaymentInput('card');
                        }
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-mono font-bold text-base sm:text-lg text-center focus:border-amber-500 focus:outline-none cursor-pointer"
                      placeholder="0.00"
                      title="نقر مزدوج (Double Click) لنقل كامل المبلغ إلى البطاقة وتصفير باقي الطرق"
                    />
                  </div>

                  {/* الخانة الثالثة: 3. الآجل */}
                  <div className={`p-2.5 rounded-xl bg-slate-950 border ${!isCreditPurchasesAllowed ? 'border-slate-800/50 opacity-70' : 'border-slate-800'} space-y-1`}>
                    <div className="flex items-center justify-between">
                      <label className="text-slate-200 font-bold font-mono text-xs sm:text-sm flex items-center space-x-1.5 space-x-reverse">
                        <Clock className={`w-4 h-4 ${!isCreditPurchasesAllowed ? 'text-slate-500' : 'text-amber-400'} shrink-0`} />
                        <span>3. الآجل للمورد ($)</span>
                      </label>
                      <span className={`text-[10px] font-mono ${!isCreditPurchasesAllowed ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                        {!isCreditPurchasesAllowed ? 'غير متاح للمورد' : 'Double Click للتعيين'}
                      </span>
                    </div>
                    <input
                      type="number"
                      step="any"
                      disabled={!isCreditPurchasesAllowed}
                      value={creditAmountPaid}
                      onChange={e => handleCreditChange(e.target.value)}
                      onDoubleClick={() => handleDoubleClickPayment('credit')}
                      className={`w-full h-10 px-3 py-1.5 bg-slate-900 border rounded-lg font-mono font-bold text-base sm:text-lg text-center focus:outline-none ${
                        !isCreditPurchasesAllowed
                          ? 'border-slate-800 text-slate-500 bg-slate-950/80 cursor-not-allowed'
                          : 'border-slate-700/80 text-slate-100 focus:border-amber-500 cursor-pointer'
                      }`}
                      placeholder="0.00"
                      title={!isCreditPurchasesAllowed ? 'هذا المورد لا يقبل الشراء الآجل وفقاً لبياناته' : 'نقر مزدوج (Double Click) لنقل كامل المبلغ إلى الآجل وتصفير باقي الطرق'}
                    />
                  </div>
                </div>

                {/* العمود الأيسر */}
                <div className="space-y-2.5">
                  {/* الخانة الأولى: الخزينة */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="purchase-payment-modal-treasury-select" className="text-xs sm:text-sm font-bold text-slate-200 flex items-center space-x-1.5 space-x-reverse">
                        <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>الخزينة</span>
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        متاح
                      </span>
                    </div>

                    <select
                      id="purchase-payment-modal-treasury-select"
                      value={activeInvoice.treasuryId || (treasuries[0]?.id || 'TR-MAIN')}
                      onChange={(e) => {
                        const newTId = e.target.value;
                        const selectedT = treasuries.find(t => t.id === newTId);
                        setActiveInvoice(prev => ({
                          ...prev,
                          treasuryId: newTId,
                          treasuryName: selectedT ? selectedT.name : prev.treasuryName
                        }));
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none cursor-pointer leading-tight"
                    >
                      {treasuries.map(t => (
                        <option
                          key={t.id}
                          value={t.id}
                          className="bg-slate-900 text-slate-100 font-bold"
                        >
                          {t.name} ({t.id}) [{t.currency || 'EGP'}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* الخانة الثانية: البنك */}
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="purchase-payment-modal-bank-select" className="text-xs sm:text-sm font-bold text-slate-200 flex items-center space-x-1.5 space-x-reverse">
                        <Landmark className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>البنك</span>
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        متاح
                      </span>
                    </div>

                    <select
                      id="purchase-payment-modal-bank-select"
                      value={selectedBankId}
                      onChange={(e) => {
                        setSelectedBankId(e.target.value);
                      }}
                      className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-bold text-xs sm:text-sm focus:border-amber-500 focus:outline-none cursor-pointer leading-tight"
                    >
                      {availableBankAccounts.map(b => (
                        <option
                          key={b.id}
                          value={b.id}
                          className="bg-slate-900 text-slate-100 font-bold"
                        >
                          {b.bankName} ({b.accountNumber}) [{b.currency}]
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* مستطيلان متجاوران أسفل حقل البنك: أداة حسابية مستقلة */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* المربع الأيمن: حقل إدخال رقمي قابل للكتابة */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-center">
                        <label htmlFor="calc-purchase-custom-input" className="block text-slate-300 font-bold font-mono text-[11px] sm:text-xs text-center">
                          المدفوع المسدد
                        </label>
                      </div>
                      <input
                        id="calc-purchase-custom-input"
                        type="number"
                        step="any"
                        value={calcReceivedAmount}
                        onChange={e => setCalcReceivedAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-100 font-mono font-bold text-base sm:text-lg text-center focus:border-amber-500 focus:outline-none"
                      />
                    </div>

                    {/* المربع الأيسر: عرض النتيجة فقط غير قابل للكتابة */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-center">
                        <span className="block text-slate-300 font-bold font-mono text-[11px] sm:text-xs text-center">
                          الفرق / الناتج
                        </span>
                      </div>
                      {(() => {
                        const rawInput = calcReceivedAmount.trim();
                        const inputVal = parseFloat(rawInput);
                        const hasInput = rawInput !== '' && !isNaN(inputVal);

                        if (!hasInput) {
                          return (
                            <div className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 font-mono font-bold text-base sm:text-lg flex items-center justify-center text-center">
                              <span>-</span>
                            </div>
                          );
                        }

                        const currentTotalPaid = totalAllocated;
                        const result = Math.round((currentTotalPaid - inputVal) * 100) / 100;

                        return (
                          <div className="w-full h-10 px-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-amber-400 font-mono font-black text-base sm:text-lg flex items-center justify-center text-center">
                            <span>{result >= 0 ? `$${result.toFixed(2)}` : `-$${Math.abs(result).toFixed(2)}`}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vendor Account & Credit Details Box - Matching Sales Entry identically */}
              <div className="min-h-[108px] flex items-center text-right">
                <div className={`w-full p-2.5 rounded-xl border text-xs font-mono space-y-2 ${
                  isBlocked 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className={`font-bold font-sans ${isBlocked ? 'text-rose-300' : 'text-amber-300'}`}>
                      {isBlocked ? 'لا يمكن إتمام الشراء الآجل' : 'تسجيل المبلغ كـ آجل (مستحق للمورد)'}
                    </span>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-sans border ${
                        !isBlocked 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}>
                        {!isBlocked ? 'الآجل مسموح' : 'مرفوض'}
                      </span>
                      <p className="text-xs text-slate-300 font-sans font-bold">
                        المورد: <span className="font-black text-amber-400">{activeInvoice.vendorName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
                    <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                      <span className="text-slate-300 font-bold text-[11px]">السماح بالآجل:</span>
                      <strong className={`pt-0.5 font-bold ${allowCreditPurchases ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {allowCreditPurchases ? 'مسموح' : 'غير مسموح'}
                      </strong>
                    </div>
                    <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                      <span className="text-slate-300 font-bold text-[11px]">الحد الائتماني:</span>
                      <strong className="text-slate-200 font-bold pt-0.5">
                        {creditLimit > 0 ? `$${creditLimit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'بلا سقف'}
                      </strong>
                    </div>
                    <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                      <span className="text-slate-300 font-bold text-[11px]">رصيد المورد الحالي:</span>
                      <strong className="text-amber-300 font-bold pt-0.5">${currentBalanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                      <span className="text-slate-300 font-bold text-[11px]">قيمة الشراء الآجل:</span>
                      <strong className="text-sky-300 font-bold pt-0.5">${creditVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    </div>
                    <div className="flex flex-col justify-between items-center text-center p-1.5 rounded-lg bg-slate-900/60 border border-slate-800/50">
                      <span className="text-slate-300 font-bold text-[11px]">الرصيد بعد العملية:</span>
                      <strong className={`pt-0.5 font-black ${isLimitExceeded ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}`}>
                        ${projectedBalanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>

                  {/* Clear Rejection / Prohibition Reason Banner */}
                  {isBlocked && creditValidation.message && (
                    <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-sans font-bold flex items-center justify-center space-x-1.5 space-x-reverse text-center">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{creditValidation.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {changeDue > 0 && (
                <div className="space-y-1.5 pt-0.5 text-right">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center font-mono">
                    <span className="text-slate-300 text-xs font-bold font-sans">الباقي المسترد من المورد (النقدي):</span>
                    <span className="text-emerald-400 text-sm font-black">${changeDue.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 4. أسفل ذلك: شريط الأزرار الأربعة الأساسية */}
              <div className="grid grid-cols-4 gap-2.5 pt-3 border-t border-slate-800" dir="rtl">
                {/* 1. حفظ */}
                <button
                  type="button"
                  onClick={handleSaveInvoiceOnly}
                  disabled={isBlocked}
                  className={`h-11 px-2.5 sm:px-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 space-x-reverse transition-colors ${
                    isBlocked
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer'
                  }`}
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span className="truncate">حفظ</span>
                </button>

                {/* 2. حفظ وطباعة A4 */}
                <button
                  type="button"
                  onClick={() => handleCompletePaymentAndPrint('a4')}
                  disabled={isBlocked}
                  className={`h-11 px-2.5 sm:px-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-1.5 space-x-reverse transition-colors ${
                    isBlocked
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer'
                  }`}
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span className="truncate">حفظ وطباعة A4</span>
                </button>

                {/* 3. حفظ وطباعة ريسيت */}
                <button
                  type="button"
                  onClick={() => handleCompletePaymentAndPrint('receipt')}
                  disabled={isBlocked}
                  className={`h-11 px-2.5 sm:px-3.5 rounded-xl border font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-1.5 space-x-reverse transition-colors ${
                    isBlocked
                      ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700/80 cursor-pointer'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span className="truncate">حفظ وطباعة ريسيت</span>
                </button>

                {/* 4. إغلاق */}
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="h-11 px-2.5 sm:px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center space-x-1.5 space-x-reverse cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span className="truncate">إغلاق</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. PRINTED PURCHASE INVOICE / RECEIPT MODAL */}
      {completedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 no-print">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {completedReceipt.printFormat === 'receipt' ? 'معاينة ريسيت مشتريات حراري' : 'معاينة وطباعة فاتورة المشتريات A4'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div id="printable-purchase-invoice" className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-3 text-right">
              {/* Cancelled Banner */}
              {completedReceipt.status === 'cancelled' && (
                <div className="p-3 bg-rose-500/10 border-2 border-rose-500/80 rounded-xl text-rose-300 mb-3 text-right space-y-1.5 print-cancelled-banner">
                  <div className="flex items-center space-x-2 space-x-reverse font-black text-sm text-rose-400">
                    <Ban className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>فاتورة مشتريات ملغاة (CANCELLED PURCHASE INVOICE)</span>
                  </div>
                  <div className="text-[11px] pt-1 text-slate-300">
                    تم إلغاء الفاتورة وعكس الأرصدة المخزنية والمالية المرتبطة بها.
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div>
                  <span className="font-bold text-slate-100 text-sm">{completedReceipt.invoiceNumber}</span>
                  <p className="text-[10px] text-slate-400">المورد: {completedReceipt.vendorName}</p>
                  {completedReceipt.warehouseName && (
                    <p className="text-[10px] text-slate-400">المستودع: {completedReceipt.warehouseName}</p>
                  )}
                  {completedReceipt.treasuryName && (
                    <p className="text-[10px] text-slate-400">الخزينة: {completedReceipt.treasuryName}</p>
                  )}
                  {completedReceipt.bankName && (
                    <p className="text-[10px] text-slate-400">البنك: {completedReceipt.bankName}</p>
                  )}
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400">{new Date(completedReceipt.createdAt).toLocaleString('ar-EG')}</span>
                  <p className="text-[10px] text-emerald-400 font-bold uppercase">
                    فاتورة مشتريات ({completedReceipt.paymentMethod})
                  </p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="py-1 text-right">الصنف</th>
                    <th className="py-1 text-center">الكمية</th>
                    <th className="py-1 text-left">سعر الشراء</th>
                    <th className="py-1 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {completedReceipt.lineItems.map(item => (
                    <tr key={item.id} className="text-slate-200">
                      <td className="py-1.5 font-sans font-semibold text-right">
                        <div>{item.productName}</div>
                        {item.bonusQuantity && item.bonusQuantity > 0 ? (
                          <div className="text-[10px] text-amber-400 font-mono font-normal">بونص مجاني: +{item.bonusQuantity}</div>
                        ) : null}
                      </td>
                      <td className="py-1.5 text-center">
                        <div>{item.quantity} {item.unit || ''}</div>
                      </td>
                      <td className="py-1.5 text-left">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-1.5 text-left font-bold">${item.lineTotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Breakdown */}
              <div className="pt-3 border-t border-slate-800 space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>الإجمالي قبل الخصم:</span>
                  <span>${completedReceipt.subtotal.toFixed(2)}</span>
                </div>

                {completedReceipt.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>
                      {completedReceipt.invoiceDiscountValue > 0
                        ? `خصم الفاتورة${completedReceipt.invoiceDiscountType === 'percent' ? ` (${completedReceipt.invoiceDiscountValue}%)` : ''}:`
                        : 'خصم الأصناف:'}
                    </span>
                    <span>-${completedReceipt.totalDiscount.toFixed(2)}</span>
                  </div>
                )}

                {completedReceipt.isTaxInvoice && completedReceipt.totalTax > 0 && (
                  <div className="flex justify-between text-sky-400">
                    <span>ضريبة القيمة المضافة ({completedReceipt.taxRate}%):</span>
                    <span>+${completedReceipt.totalTax.toFixed(2)}</span>
                  </div>
                )}

                {completedReceipt.taxDiscount > 0 && (
                  <div className="flex justify-between text-rose-300">
                    <span>الخصم الضريبي ({completedReceipt.taxDiscountRate}%):</span>
                    <span>-${completedReceipt.taxDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="h-px bg-slate-800 my-1" />

                <div className="flex justify-between text-slate-100 text-sm font-black pt-1">
                  <span>الإجمالي النهائي:</span>
                  <span className="text-emerald-400">${completedReceipt.grandTotal.toFixed(2)}</span>
                </div>

                {/* Payments breakdown */}
                {((completedReceipt.cashPaid && completedReceipt.cashPaid > 0) ||
                  (completedReceipt.cardPaid && completedReceipt.cardPaid > 0) ||
                  (completedReceipt.creditPaid && completedReceipt.creditPaid > 0)) && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                    {completedReceipt.cashPaid && completedReceipt.cashPaid > 0 ? (
                      <div className="flex justify-between text-emerald-400/90">
                        <span>المدفوع نقداً:</span>
                        <span>${completedReceipt.cashPaid.toFixed(2)}</span>
                      </div>
                    ) : null}
                    {completedReceipt.cardPaid && completedReceipt.cardPaid > 0 ? (
                      <div className="flex justify-between text-sky-400/90">
                        <span>المدفوع تحويل / بنكي ({completedReceipt.bankName || 'البنك'}):</span>
                        <span>${completedReceipt.cardPaid.toFixed(2)}</span>
                      </div>
                    ) : null}
                    {completedReceipt.creditPaid && completedReceipt.creditPaid > 0 ? (
                      <div className="flex justify-between text-amber-400/90">
                        <span>المستحق آجل للمورد:</span>
                        <span>${completedReceipt.creditPaid.toFixed(2)}</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-2 space-x-reverse pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center space-x-2 space-x-reverse transition-colors cursor-pointer text-sm shadow-lg shadow-emerald-900/30"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الفاتورة</span>
              </button>
              <button
                type="button"
                onClick={() => setCompletedReceipt(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer text-sm"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PURCHASE HISTORY & ARCHIVE MODAL (عرض سجل وفواتير المشتريات F4) */}
      {isPurchaseHistoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] max-h-[900px] flex flex-col shadow-2xl overflow-hidden text-right">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 space-x-reverse">
                    <span>أرشيف وسجل فواتير المشتريات</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-mono font-bold">
                      {completedInvoices.length + heldInvoices.length} سجل
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">استعراض وإدارة فواتير المشتريات المحفوظة والمعلقة، مع إمكانية التعديل، المعاينة، الطباعة، والإلغاء</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseHistoryModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setHistoryActiveTab('completed')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all cursor-pointer ${
                    historyActiveTab === 'completed'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>الفواتير المكتملة والمحفوظة</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    historyActiveTab === 'completed' ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {completedInvoices.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setHistoryActiveTab('held')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all cursor-pointer ${
                    historyActiveTab === 'held'
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>الفواتير المعلقة</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    historyActiveTab === 'held' ? 'bg-amber-700 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {heldInvoices.length}
                  </span>
                </button>
              </div>

              {/* Quick Actions for Held Tab */}
              {historyActiveTab === 'held' && heldInvoices.length > 0 && (
                <button
                  type="button"
                  onClick={() => setDeleteHeldConfirmModal({ isOpen: true, isAll: true })}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors flex items-center space-x-1.5 space-x-reverse cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف جميع الفواتير المعلقة</span>
                </button>
              )}
            </div>

            {/* Search & Filters for Completed Tab */}
            {historyActiveTab === 'completed' && (
              <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="بحث برقم الفاتورة أو اسم المورد..."
                    className="w-full h-9 pr-9 pl-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => setHistoryStatusFilter(e.target.value as 'all' | 'completed' | 'cancelled')}
                    className="w-full h-9 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="completed">مكتملة</option>
                    <option value="cancelled">ملغاة</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">من:</span>
                  <input
                    type="date"
                    value={historyDateFrom}
                    onChange={(e) => setHistoryDateFrom(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">إلى:</span>
                  <input
                    type="date"
                    value={historyDateTo}
                    onChange={(e) => setHistoryDateTo(e.target.value)}
                    className="w-full h-9 px-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {historyActiveTab === 'completed' ? (
                (() => {
                  const filtered = completedInvoices.filter(inv => {
                    if (historyStatusFilter !== 'all' && inv.status !== historyStatusFilter) return false;
                    if (historySearchQuery.trim()) {
                      const q = historySearchQuery.toLowerCase();
                      const matchNumber = inv.invoiceNumber.toLowerCase().includes(q);
                      const matchVendor = inv.vendorName.toLowerCase().includes(q);
                      if (!matchNumber && !matchVendor) return false;
                    }
                    if (historyDateFrom) {
                      const invDate = new Date(inv.createdAt).toISOString().split('T')[0];
                      if (invDate < historyDateFrom) return false;
                    }
                    if (historyDateTo) {
                      const invDate = new Date(inv.createdAt).toISOString().split('T')[0];
                      if (invDate > historyDateTo) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 text-slate-500 space-y-3">
                        <Archive className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
                        <p className="text-sm font-bold">لا توجد فواتير مشتريات مطابقة للبحث</p>
                      </div>
                    );
                  }

                  return (
                    <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4">رقم الفاتورة</th>
                            <th className="py-3 px-4">التاريخ والوقت</th>
                            <th className="py-3 px-4">المورد</th>
                            <th className="py-3 px-4">المستودع</th>
                            <th className="py-3 px-4">طريقة الدفع</th>
                            <th className="py-3 px-4 text-center">الإجمالي</th>
                            <th className="py-3 px-4 text-center">الحالة</th>
                            <th className="py-3 px-4 text-center">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {filtered.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-100">{inv.invoiceNumber}</td>
                              <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{new Date(inv.createdAt).toLocaleString('ar-EG')}</td>
                              <td className="py-3 px-4 text-slate-200 font-bold">{inv.vendorName}</td>
                              <td className="py-3 px-4 text-slate-400">{inv.warehouseName}</td>
                              <td className="py-3 px-4 text-slate-300">
                                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                  inv.paymentMethod === 'نقدي' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                  inv.paymentMethod === 'آجل' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                                  'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                                }`}>
                                  {inv.paymentMethod}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">${inv.grandTotal.toFixed(2)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  inv.status === 'cancelled'
                                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                }`}>
                                  {inv.status === 'cancelled' ? 'ملغاة' : 'مكتملة'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                                  {/* معاينة */}
                                  <button
                                    type="button"
                                    onClick={() => setCompletedReceipt(inv)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-[11px] border border-slate-700 flex items-center space-x-1 space-x-reverse cursor-pointer transition-colors"
                                    title="معاينة الفاتورة"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>معاينة</span>
                                  </button>

                                  {/* طباعة */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCompletedReceipt(inv);
                                      setTimeout(() => window.print(), 150);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] border border-slate-700 flex items-center space-x-1 space-x-reverse cursor-pointer transition-colors"
                                    title="طباعة الفاتورة"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>طباعة</span>
                                  </button>

                                  {/* تعديل */}
                                  <button
                                    type="button"
                                    onClick={() => setEditInvoiceConfirmModal({ isOpen: true, invoice: inv })}
                                    disabled={inv.status === 'cancelled'}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center space-x-1 space-x-reverse transition-colors cursor-pointer ${
                                      inv.status === 'cancelled'
                                        ? 'bg-slate-800 text-slate-500 border-slate-800 opacity-50 cursor-not-allowed'
                                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                                    }`}
                                    title="تعديل الفاتورة"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>تعديل</span>
                                  </button>

                                  {/* إلغاء */}
                                  <button
                                    type="button"
                                    onClick={() => setCancelInvoiceConfirmModal({ isOpen: true, invoice: inv })}
                                    disabled={inv.status === 'cancelled'}
                                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border flex items-center space-x-1 space-x-reverse transition-colors cursor-pointer ${
                                      inv.status === 'cancelled'
                                        ? 'bg-slate-800 text-slate-500 border-slate-800 opacity-50 cursor-not-allowed'
                                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/30'
                                    }`}
                                    title="إلغاء فاتورة المشتريات"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    <span>{inv.status === 'cancelled' ? 'ملغاة' : 'إلغاء'}</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : (
                /* HELD INVOICES TAB */
                heldInvoices.length === 0 ? (
                  <div className="text-center py-16 text-slate-500 space-y-3">
                    <PauseCircle className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
                    <p className="text-sm font-bold">لا توجد فواتير مشتريات معلقة حالياً</p>
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">رقم الفاتورة</th>
                          <th className="py-3 px-4">تاريخ التعليق</th>
                          <th className="py-3 px-4">المورد</th>
                          <th className="py-3 px-4">المستودع</th>
                          <th className="py-3 px-4 text-center">عدد الأصناف</th>
                          <th className="py-3 px-4 text-center">إجمالي الفاتورة</th>
                          <th className="py-3 px-4 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {heldInvoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-100">{inv.invoiceNumber}</td>
                            <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{new Date(inv.createdAt).toLocaleString('ar-EG')}</td>
                            <td className="py-3 px-4 text-slate-200 font-bold">{inv.vendorName}</td>
                            <td className="py-3 px-4 text-slate-400">{inv.warehouseName}</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">{inv.lineItems.length} صنف</td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">${inv.grandTotal.toFixed(2)}</td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2 space-x-reverse">
                                <button
                                  type="button"
                                  onClick={() => handleResumeHeldInvoice(inv.id)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 space-x-reverse transition-colors cursor-pointer shadow-sm shadow-emerald-900/40"
                                >
                                  <Play className="w-3.5 h-3.5 fill-current" />
                                  <span>استئناف الفاتورة</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteHeldConfirmModal({ isOpen: true, invoiceId: inv.id })}
                                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors cursor-pointer"
                                  title="حذف الفاتورة المعلقة"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="text-xs text-slate-400">
                إجمالي فواتير الشراء المحفوظة: <strong className="text-slate-200 font-mono">{completedInvoices.length}</strong> | المعلقة: <strong className="text-amber-400 font-mono">{heldInvoices.length}</strong>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseHistoryModalOpen(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors cursor-pointer text-xs"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 5. CONFIRM NEW INVOICE MODAL (F1) */}
      {isNewConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-blue-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">تأكيد إنشاء فاتورة شراء جديدة</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              توجد أصناف وتعديلات غير محفوظة في مسودة الفاتورة الحالية. هل أنت متأكد من تفريغها والبدء في فاتورة شراء جديدة؟
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsNewConfirmModalOpen(false);
                  executeNewInvoice();
                  showToast('تم إنشاء مسودة فاتورة شراء جديدة (F1)', 'info');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                نعم، إنشاء فاتورة جديدة
              </button>
              <button
                type="button"
                onClick={() => setIsNewConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. CONFIRM CANCEL DRAFT MODAL (F6) */}
      {isCancelConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">تأكيد تفريغ فاتورة الشراء الحالية</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من تفريغ جميع الأصناف والتعديلات الحالية والبدء من جديد؟
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCancelConfirmModalOpen(false);
                  executeNewInvoice();
                  showToast('تم إلغاء فاتورة الشراء الحالية', 'info');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                نعم، تفريغ الفاتورة
              </button>
              <button
                type="button"
                onClick={() => setIsCancelConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. CONFIRM CLOSE MODAL (F7) */}
      {isCloseConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">تأكيد الخروج من شاشة المشتريات</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              توجد أصناف وتعديلات غير محفوظة بالفاتورة الحالية. هل أنت متأكد من إغلاق الشاشة وتجاهل التعديلات؟
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCloseConfirmModalOpen(false);
                  onClose?.();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق وتجاهل
              </button>
              <button
                type="button"
                onClick={() => setIsCloseConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                البقاء بالشاشة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. CONFIRM CANCEL COMPLETED INVOICE MODAL */}
      {cancelInvoiceConfirmModal.isOpen && cancelInvoiceConfirmModal.invoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <Ban className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">تأكيد إلغاء فاتورة المشتريات</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من إلغاء فاتورة الشراء رقم <strong className="text-slate-100 font-mono">[{cancelInvoiceConfirmModal.invoice.invoiceNumber}]</strong>؟
              <br />
              <span className="text-rose-400 mt-1 block">
                سيتم عكس الكميات المشتراة من المخزن المحدد وعكس المديونية الخاصة بالمورد تلقائياً.
              </span>
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => cancelInvoiceConfirmModal.invoice && handleExecuteCancelInvoice(cancelInvoiceConfirmModal.invoice)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تأكيد الإلغاء
              </button>
              <button
                type="button"
                onClick={() => setCancelInvoiceConfirmModal({ isOpen: false })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تراجع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. CONFIRM EDIT COMPLETED INVOICE MODAL */}
      {editInvoiceConfirmModal.isOpen && editInvoiceConfirmModal.invoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <Edit3 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">تعديل فاتورة المشتريات</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              هل تريد تحميل فاتورة الشراء رقم <strong className="text-slate-100 font-mono">[{editInvoiceConfirmModal.invoice.invoiceNumber}]</strong> إلى شاشة الإدخال لتعديلها؟
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => editInvoiceConfirmModal.invoice && handleEditCompletedInvoice(editInvoiceConfirmModal.invoice)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                نعم، تحميل للتعديل
              </button>
              <button
                type="button"
                onClick={() => setEditInvoiceConfirmModal({ isOpen: false })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. CONFIRM DELETE HELD INVOICE MODAL */}
      {deleteHeldConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">
                {deleteHeldConfirmModal.isAll ? 'حذف جميع الفواتير المعلقة' : 'حذف الفاتورة المعلقة'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {deleteHeldConfirmModal.isAll
                ? 'هل أنت متأكد من حذف جميع مسودات فواتير الشراء المعلقة نهائياً؟'
                : 'هل أنت متأكد من حذف هذه المسودة المعلقة نهائياً؟'}
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => {
                  if (deleteHeldConfirmModal.isAll) {
                    purchaseService.deleteAllHeldInvoices();
                    showToast('تم حذف جميع فواتير الشراء المعلقة', 'info');
                  } else if (deleteHeldConfirmModal.invoiceId) {
                    purchaseService.deleteHeldInvoice(deleteHeldConfirmModal.invoiceId);
                    showToast('تم حذف الفاتورة المعلقة', 'info');
                  }
                  setDeleteHeldConfirmModal({ isOpen: false });
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تأكيد الحذف
              </button>
              <button
                type="button"
                onClick={() => setDeleteHeldConfirmModal({ isOpen: false })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
