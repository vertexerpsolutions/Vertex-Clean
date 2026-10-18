import React, { useState, useEffect, useRef } from 'react';
import { 
  customerService, 
  Customer, 
  CustomerType, 
  CustomerStatus 
} from '../../services/customerService';
import { priceTierService, PriceTier } from '../../services/priceTierService';
import { permissionIntegrationService } from '../../services/permissionIntegrationService';
import { securityManager } from '../../core/vpe/security/SecurityManager';
import { StandardActionBar } from '../common/StandardActionBar';
import { UnifiedMessageOverlay } from '../common/UnifiedMessageOverlay';
import { CustomerRecordsModal } from './CustomerRecordsModal';
import { CustomerBalancesHubModal } from './CustomerBalancesHubModal';
import { CustomerStatementReportModal } from './CustomerStatementReportModal';
import { CustomerBalancesListModal } from './CustomerBalancesListModal';
import { 
  SalesNavigationModal, 
  SalesNavButton, 
  SalesNavDestination 
} from '../sales/SalesNavigationModal';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  ShieldCheck, 
  UserCheck, 
  UserX, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  Tag, 
  Hash, 
  Sparkles, 
  Printer, 
  Check, 
  Building2, 
  Save, 
  FileText,
  ArrowUp,
  Info,
  CreditCard,
  Coins,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Plus,
  Minus,
  RotateCcw,
  ListFilter
} from 'lucide-react';

const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const ARABIC_DAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

// Helper to get today's date formatted as YYYY-MM-DD in local time
const getTodayIsoDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to safely resolve any customer category (code, name, id, legacy keyword) to a tier code or display value
export const resolvePriceTierCode = (
  catVal: string | undefined, 
  tiers: PriceTier[]
): string => {
  if (!catVal) return '';
  const trimmed = catVal.trim();

  // 1. Direct match by tier code (e.g. TIER-01, TIER-02)
  const byCode = tiers.find(t => t.code.toUpperCase() === trimmed.toUpperCase());
  if (byCode) return byCode.code;

  // 2. Direct match by tier id (e.g. tier-1, tier-2)
  const byId = tiers.find(t => t.id === trimmed);
  if (byId) return byId.code;

  // 3. Match by tier Arabic name (e.g. تجزئة, جملة)
  const byName = tiers.find(t => t.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (byName) return byName.code;

  // 4. Legacy English keywords and variations
  const lower = trimmed.toLowerCase();
  if (lower === 'retail' || trimmed === 'تجزئة') {
    const retailTier = tiers.find(t => t.name.includes('تجزئة') || t.code === 'TIER-01');
    if (retailTier) return retailTier.code;
  }
  if (lower === 'wholesale' || trimmed === 'جملة') {
    const wholesaleTier = tiers.find(t => t.name.includes('جملة') || t.code === 'TIER-02');
    if (wholesaleTier) return wholesaleTier.code;
  }
  if (lower === 'corporate' || trimmed === 'شركات') {
    const corpTier = tiers.find(t => t.name.includes('شركات') || t.name.toLowerCase().includes('corporate'));
    if (corpTier) return corpTier.code;
  }
  if (lower === 'vip' || trimmed === 'كبار العملاء') {
    const vipTier = tiers.find(t => t.name.toUpperCase().includes('VIP') || t.name.includes('كبار'));
    if (vipTier) return vipTier.code;
  }

  // Fallback: keep original value so no custom or historical values are lost
  return trimmed;
};

// Helper to get Arabic display name for any category value
export const getCategoryDisplayName = (
  catVal: string | undefined, 
  tiers: PriceTier[]
): string => {
  if (!catVal || !catVal.trim()) return 'غير محدد';
  const trimmed = catVal.trim();

  const tier = tiers.find(t => 
    t.code.toUpperCase() === trimmed.toUpperCase() || 
    t.id === trimmed ||
    t.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  if (tier) return tier.name;

  if (trimmed.toLowerCase() === 'retail' || trimmed === 'تجزئة') return 'تجزئة';
  if (trimmed.toLowerCase() === 'wholesale' || trimmed === 'جملة') return 'جملة';
  if (trimmed.toLowerCase() === 'corporate' || trimmed === 'شركات') return 'شركات';
  if (trimmed.toLowerCase() === 'vip' || trimmed === 'كبار العملاء') return 'كبار العملاء (VIP)';

  return trimmed;
};

export interface CustomerMasterViewProps {
  initialCustomerId?: string;
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}

export const CustomerMasterView: React.FC<CustomerMasterViewProps> = ({
  initialCustomerId,
  onClose,
  onNavigateSection
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creditSalesFilter, setCreditSalesFilter] = useState<string>('all');

  // Dynamic Price Tiers loaded centrally from priceTierService
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>(() => priceTierService.getAllTiers());

  // Active Form Mode State (Null = New Customer Mode, Customer = Existing Customer Loaded)
  const [loadedCustomer, setLoadedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formMobile, setFormMobile] = useState<string>('');
  const [formCustomerType, setFormCustomerType] = useState<string>('');
  const [formCategory, setFormCategory] = useState<string>(() => priceTierService.getAllTiers()[0]?.code || 'TIER-01');
  const [formAssignedSeller, setFormAssignedSeller] = useState<string>('');
  const [formCreditLimit, setFormCreditLimit] = useState<string>('');
  const [formAllowCreditSales, setFormAllowCreditSales] = useState<boolean>(false);
  const [formStatus, setFormStatus] = useState<CustomerStatus>('نشط');
  const [formDiscount, setFormDiscount] = useState<string>('');
  const [formOpeningBalance, setFormOpeningBalance] = useState<string>('');
  const [formOpeningBalanceType, setFormOpeningBalanceType] = useState<'مدين' | 'دائن' | ''>('مدين');
  const [formOpeningBalanceDate, setFormOpeningBalanceDate] = useState<string>(getTodayIsoDate());
  const [formArea, setFormArea] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formSpecialNumber, setFormSpecialNumber] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Expand / Collapse Section States (Both Collapsed by Default)
  const [showAdditionalInfo, setShowAdditionalInfo] = useState<boolean>(false);
  const [showFinancialInfo, setShowFinancialInfo] = useState<boolean>(false);

  // Original Opening Balance tracking for existing customer edit confirmation
  const [originalOpeningBalance, setOriginalOpeningBalance] = useState<number | null>(null);
  const [showOpeningBalanceConfirmModal, setShowOpeningBalanceConfirmModal] = useState<boolean>(false);

  // Form Unsaved State Safety (Dirty Tracking)
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showCancelCustomerModal, setShowCancelCustomerModal] = useState<boolean>(false);
  const [showBlockedDeleteModal, setShowBlockedDeleteModal] = useState<boolean>(false);
  const [showCustomerRecordsModal, setShowCustomerRecordsModal] = useState<boolean>(false);
  const [isCustomerBalancesHubOpen, setIsCustomerBalancesHubOpen] = useState<boolean>(false);
  const [isCustomerStatementReportOpen, setIsCustomerStatementReportOpen] = useState<boolean>(false);
  const [isCustomerBalancesListOpen, setIsCustomerBalancesListOpen] = useState<boolean>(false);
  const [statementTargetCustomerId, setStatementTargetCustomerId] = useState<string>('');
  const [isSalesNavModalOpen, setIsSalesNavModalOpen] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Print Action Menu & Bulk Filter Modals State
  const [showPrintOptionsModal, setShowPrintOptionsModal] = useState<boolean>(false);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState<boolean>(false);
  const [showSinglePrintPreviewModal, setShowSinglePrintPreviewModal] = useState<boolean>(false);
  const [showBulkPrintPreviewModal, setShowBulkPrintPreviewModal] = useState<boolean>(false);
  const [printMode, setPrintMode] = useState<'single' | 'bulk'>('single');

  // Bulk Print Filters & Report Navigation State
  const [bulkActiveTab, setBulkActiveTab] = useState<'all' | 'area' | 'seller' | 'category' | 'classification' | 'status'>('all');
  const [bulkSortBy, setBulkSortBy] = useState<string>('alphabetical');
  const [bulkFilterSeller, setBulkFilterSeller] = useState<string>('');
  const [bulkFilterArea, setBulkFilterArea] = useState<string>('');
  const [bulkFilterCategory, setBulkFilterCategory] = useState<string>('');
  const [bulkFilterClassification, setBulkFilterClassification] = useState<string>('');
  const [bulkFilterStatus, setBulkFilterStatus] = useState<string>('all');
  const [bulkFilterCreditSales, setBulkFilterCreditSales] = useState<string>('all');
  const [bulkFilterSearch, setBulkFilterSearch] = useState<string>('');

  // Available Classifications, Areas, and Sellers List for Dropdowns
  const availableClassifications = customerService.getCustomerClassifications();
  const availableAreas = customerService.getCustomerAreas();
  const availableSellers = customerService.getSellersList();

  // Custom Calendar Date Picker State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number>(() => new Date().getMonth());
  const [openAbove, setOpenAbove] = useState<boolean>(true);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Determine dynamic placement (above or below) based on viewport space
  useEffect(() => {
    if (isDatePickerOpen && datePickerRef.current) {
      const rect = datePickerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenAbove(spaceBelow < 320);
    }
  }, [isDatePickerOpen]);

  // Sync Calendar view when formOpeningBalanceDate changes
  useEffect(() => {
    if (formOpeningBalanceDate) {
      const parts = formOpeningBalanceDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setPickerYear(y);
          setPickerMonth(m);
        }
      }
    }
  }, [formOpeningBalanceDate]);

  // Click outside to close Date Picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  const handlePrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear(prev => prev - 1);
    } else {
      setPickerMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear(prev => prev + 1);
    } else {
      setPickerMonth(prev => prev + 1);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();

  // Validation & Toast state
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Refs for smooth scrolling
  const formRef = useRef<HTMLDivElement>(null);
  const searchSectionRef = useRef<HTMLDivElement>(null);

  // Permission Verification Helper
  const checkUserPermission = (actionCode: string = 'PERM_MOD_AR'): boolean => {
    const activeSessions = securityManager.getActiveSessions();
    const role = activeSessions.length > 0 ? activeSessions[0].role : 'SUPER_ADMIN';
    const checkResult = permissionIntegrationService.checkPermission(role, actionCode);
    
    if (!checkResult.granted) {
      setFormError(`عذراً، الحساب الحساب [${activeSessions[0]?.username || 'GUEST'}] لا يملك صلاحية [${actionCode}] لإتخاذ هذا الإجراء.`);
      return false;
    }
    return true;
  };

  // Refresh customer list from authoritative service
  const refreshCustomerList = () => {
    const list = customerService.getAllCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    refreshCustomerList();
    const currentTiers = priceTierService.getAllTiers();
    setPriceTiers(currentTiers);

    if (initialCustomerId) {
      const existing = customerService.getCustomerById(initialCustomerId);
      if (existing) {
        setLoadedCustomer(existing);
        setFormCode(existing.code);
        setFormName(existing.name || '');
        setFormMobile(existing.mobile || '');
        setFormCustomerType(existing.type || '');
        const resolvedCategory = existing.category 
          ? resolvePriceTierCode(existing.category, currentTiers) 
          : '';
        setFormCategory(resolvedCategory);
        setFormAssignedSeller(existing.assignedSeller || '');
        setFormCreditLimit((existing.creditLimit !== undefined && existing.creditLimit !== null && existing.creditLimit !== 0) ? existing.creditLimit.toString() : '');
        setFormAllowCreditSales(existing.allowCreditSales ?? false);
        setFormStatus(existing.status || 'نشط');
        setFormDiscount(existing.discountRate ? (existing.discountRate <= 1 ? (Math.round(existing.discountRate * 10000) / 100).toString() : existing.discountRate.toString()) : '');
        setFormOpeningBalance((existing.openingBalance !== undefined && existing.openingBalance !== null && existing.openingBalance !== 0) ? existing.openingBalance.toString() : '');
        const origBal = (existing.openingBalance !== undefined && existing.openingBalance !== null) ? Number(existing.openingBalance) : 0;
        setOriginalOpeningBalance(isNaN(origBal) ? 0 : origBal);
        setFormOpeningBalanceType((existing.openingBalanceType as any) || 'مدين');
        setFormOpeningBalanceDate(existing.openingBalanceDate || getTodayIsoDate());
        setFormArea(existing.area || '');
        setFormAddress(existing.address || '');
        setFormSpecialNumber(existing.specialNumber || '');
        setFormNotes(existing.notes || '');
      } else {
        resetToNewCustomerMode();
      }
    } else {
      resetToNewCustomerMode();
    }

    const unsubscribe = customerService.subscribe(() => {
      refreshCustomerList();
    });

    const unsubscribeTiers = priceTierService.subscribe(() => {
      setPriceTiers(priceTierService.getAllTiers());
    });

    return () => {
      unsubscribe();
      unsubscribeTiers();
    };
  }, [initialCustomerId]);

  // Auto-dismiss form error overlay after exactly 1000ms
  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => {
        setFormError(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [formError]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1000);
  };

  // Field change wrappers (mark form dirty)
  const handleNameChange = (val: string) => { setFormName(val); setIsDirty(true); setFormError(null); };
  const handleMobileChange = (val: string) => { setFormMobile(val); setIsDirty(true); setFormError(null); };
  const handleCustomerTypeChange = (val: string) => { setFormCustomerType(val); setIsDirty(true); setFormError(null); };
  const handleCategoryChange = (val: string) => { setFormCategory(val); setIsDirty(true); setFormError(null); };
  const handleAssignedSellerChange = (val: string) => { setFormAssignedSeller(val); setIsDirty(true); setFormError(null); };
  const handleCreditLimitChange = (val: string) => { setFormCreditLimit(val); setIsDirty(true); setFormError(null); };
  const handleAllowCreditSalesChange = (val: boolean) => { setFormAllowCreditSales(val); setIsDirty(true); setFormError(null); };
  const handleStatusChange = (val: CustomerStatus) => { setFormStatus(val); setIsDirty(true); setFormError(null); };
  const handleDiscountChange = (val: string) => { setFormDiscount(val); setIsDirty(true); setFormError(null); };
  const handleOpeningBalanceChange = (val: string) => { setFormOpeningBalance(val); setIsDirty(true); setFormError(null); };
  const handleOpeningBalanceTypeChange = (val: any) => { setFormOpeningBalanceType(val); setIsDirty(true); setFormError(null); };
  const handleOpeningBalanceDateChange = (val: string) => { setFormOpeningBalanceDate(val); setIsDirty(true); setFormError(null); };
  const handleAreaChange = (val: string) => { setFormArea(val); setIsDirty(true); setFormError(null); };
  const handleAddressChange = (val: string) => { setFormAddress(val); setIsDirty(true); setFormError(null); };
  const handleSpecialNumberChange = (val: string) => {
    const numericVal = val.replace(/\D/g, '');
    setFormSpecialNumber(numericVal);
    setIsDirty(true);
    setFormError(null);
  };
  const handleNotesChange = (val: string) => { setFormNotes(val); setIsDirty(true); setFormError(null); };

  // =========================================================
  // ACTION 1: عميل جديد (NEW CUSTOMER)
  // =========================================================
  const resetToNewCustomerMode = () => {
    setLoadedCustomer(null);
    const newCode = customerService.generateUniqueCustomerCode();
    setFormCode(newCode);
    setFormName('');
    setFormMobile('');
    setFormCustomerType('');
    const currentTiers = priceTierService.getAllTiers();
    setFormCategory(currentTiers[0]?.code || 'TIER-01');
    setFormAssignedSeller('');
    setFormCreditLimit('');
    setFormAllowCreditSales(false);
    setFormStatus('نشط');
    setFormDiscount('');
    setFormOpeningBalance('');
    setOriginalOpeningBalance(null);
    setShowOpeningBalanceConfirmModal(false);
    setFormOpeningBalanceType('مدين');
    setFormOpeningBalanceDate(getTodayIsoDate());
    setFormArea('');
    setFormAddress('');
    setFormSpecialNumber('');
    setFormNotes('');
    setFormError(null);
    setIsDirty(false);
  };

  const handleActionNew = () => {
    if (!checkUserPermission('PERM_MOD_AR')) return;

    if (isDirty) {
      setPendingAction(() => () => {
        resetToNewCustomerMode();
      });
      setShowConfirmModal(true);
    } else {
      resetToNewCustomerMode();
    }
  };

  // =========================================================
  // ACTION 2: حفظ السجل (SAVE RECORD - CREATE OR UPDATE)
  // =========================================================
  const handleActionSave = (e?: React.FormEvent, skipOpeningBalanceConfirm: boolean = false) => {
    if (e) e.preventDefault();
    if (!checkUserPermission('PERM_MOD_AR')) return;

    setFormError(null);

    if (!formName.trim()) {
      setFormError('اسم العميل مطلوب ولا يمكن إبقاؤه فارغاً.');
      return;
    }

    // Normalize creditLimit before validation: empty string, null, undefined, or whitespace -> 0
    let creditLimitNum: number;
    const rawCreditLimit = formCreditLimit !== null && formCreditLimit !== undefined ? String(formCreditLimit).trim() : '';
    if (rawCreditLimit === '') {
      creditLimitNum = 0;
    } else {
      const parsed = parseFloat(rawCreditLimit);
      if (isNaN(parsed) || parsed < 0) {
        setFormError('حد الائتمان يجب أن يكون رقماً صحيحاً أو عشرياً (0 أو أكثر).');
        return;
      }
      creditLimitNum = parsed;
    }

    // Discount validation: 0% to 100%
    const rawDiscount = formDiscount !== null && formDiscount !== undefined ? String(formDiscount).trim() : '';
    let discRate: number = 0;
    if (rawDiscount !== '') {
      const discNum = parseFloat(rawDiscount);
      if (isNaN(discNum) || discNum < 0) {
        setFormError('نسبة الخصم يجب أن تكون 0% أو أكثر.');
        return;
      }
      if (discNum > 100) {
        setFormError('نسبة الخصم يجب ألا تتجاوز 100%.');
        return;
      }
      discRate = discNum / 100;
    } else {
      discRate = 0;
    }

    const rawOpeningBal = formOpeningBalance !== null && formOpeningBalance !== undefined ? String(formOpeningBalance).trim() : '';
    const openingBalNum = rawOpeningBal !== '' ? parseFloat(rawOpeningBal) : 0;
    const effectiveOpeningBalance = isNaN(openingBalNum) ? 0 : openingBalNum;

    // Retrieve real outstanding debt from Customer Statement / Transaction Ledger
    const statementDebt = loadedCustomer
      ? customerService.getCustomerStatementDebt(loadedCustomer.id, loadedCustomer.code)
      : 0;

    // Real Actual Balance = Opening Balance (رصيد أول المدة) + Statement Debt (مديونية كشف الحساب)
    const actualCustomerBalance = effectiveOpeningBalance + statementDebt;

    // Strict Validation:
    // When creditLimitNum > 0: validate that actual customer balance does not exceed credit limit.
    // When creditLimitNum === 0: customer has NO credit limit (بلا حد ائتماني), so save is always permitted regardless of balance.
    if (creditLimitNum > 0) {
      const balanceInCents = Math.round(actualCustomerBalance * 100);
      const limitInCents = Math.round(creditLimitNum * 100);

      if (balanceInCents > limitInCents) {
        if (statementDebt > 0 && effectiveOpeningBalance > 0) {
          setFormError('الرصيد الفعلي للعميل أكبر من حد الائتمان ولا يمكن الحفظ.');
        } else if (statementDebt > 0) {
          setFormError('حد الائتمان أقل من رصيد العميل الحالي ولا يمكن الحفظ.');
        } else {
          setFormError('رصيد أول المدة أكبر من حد الائتمان ولا يمكن الحفظ.');
        }
        return;
      }
    }

    // Special Number Duplicate Check before saving (if special number is provided)
    const cleanSpecialNumber = formSpecialNumber.trim();
    if (cleanSpecialNumber) {
      const isDup = loadedCustomer
        ? customerService.checkDuplicateSpecialNumber(cleanSpecialNumber, loadedCustomer.id)
        : customerService.checkDuplicateSpecialNumber(cleanSpecialNumber);
      if (isDup) {
        setFormError('رقم خاص للعميل مستخدم بالفعل.');
        return;
      }
    }

    if (loadedCustomer) {
      // Confirmation check for Opening Balance modification in existing customer
      if (!skipOpeningBalanceConfirm) {
        const normalizedOriginal = (originalOpeningBalance !== null && originalOpeningBalance !== undefined && !isNaN(originalOpeningBalance))
          ? originalOpeningBalance
          : 0;
        if (Math.abs(effectiveOpeningBalance - normalizedOriginal) > 0.00001) {
          setShowOpeningBalanceConfirmModal(true);
          return;
        }
      }

      // UPDATE EXISTING CUSTOMER (Using existing Customer ID - NO DUPLICATES)
      const res = customerService.updateCustomer(loadedCustomer.id, {
        name: formName.trim(),
        mobile: formMobile.trim(),
        type: formCustomerType.trim() || undefined,
        category: formCategory,
        assignedSeller: formAssignedSeller.trim() || undefined,
        creditLimit: creditLimitNum,
        allowCreditSales: formAllowCreditSales,
        status: formStatus,
        discountRate: discRate,
        balanceDue: actualCustomerBalance,
        openingBalance: effectiveOpeningBalance,
        openingBalanceType: formOpeningBalanceType || undefined,
        openingBalanceDate: formOpeningBalanceDate || undefined,
        area: formArea.trim() || undefined,
        address: formAddress.trim() || undefined,
        specialNumber: cleanSpecialNumber || undefined,
        notes: formNotes.trim()
      });

      if (!res.success || !res.customer) {
        setFormError(res.error || 'فشل تحديث بيانات العميل');
        return;
      }

      // Successful update: Refresh list, show toast, and reset to fresh new customer form with next code
      const updatedCustomerName = res.customer.name;
      refreshCustomerList();
      resetToNewCustomerMode();
      showToast(`تم حفظ وتحديث بيانات العميل (${updatedCustomerName}) بنجاح.`);
    } else {
      // CREATE NEW CUSTOMER
      const res = customerService.addCustomer({
        code: formCode,
        name: formName.trim(),
        mobile: formMobile.trim(),
        type: formCustomerType.trim() || undefined,
        category: formCategory,
        assignedSeller: formAssignedSeller.trim() || undefined,
        creditLimit: creditLimitNum,
        allowCreditSales: formAllowCreditSales,
        status: formStatus,
        discountRate: discRate,
        openingBalance: effectiveOpeningBalance,
        openingBalanceType: formOpeningBalanceType || undefined,
        openingBalanceDate: formOpeningBalanceDate || undefined,
        area: formArea.trim() || undefined,
        address: formAddress.trim() || undefined,
        specialNumber: cleanSpecialNumber || undefined,
        notes: formNotes.trim()
      });

      if (!res.success || !res.customer) {
        setFormError(res.error || 'فشل إضافة العميل الجديد');
        return;
      }

      // Successful save: Refresh list, show toast, and reset to fresh new customer form with next code
      const savedCustomerName = res.customer.name;
      const savedCustomerCode = res.customer.code;
      refreshCustomerList();
      resetToNewCustomerMode();
      showToast(`تم إنشاء العميل الجديد (${savedCustomerName}) بكود [${savedCustomerCode}] وحفظه بنجاح.`);
    }
  };

  // =========================================================
  // ACTION 3: عرض (VIEW / BROWSE CUSTOMER RECORDS MODAL)
  // =========================================================
  const handleActionView = () => {
    if (!checkUserPermission('PERM_MOD_AR')) return;

    refreshCustomerList();
    setShowCustomerRecordsModal(true);
  };

  // Load Existing Customer into Form
  const handleLoadCustomerIntoForm = (cust: Customer) => {
    if (!checkUserPermission('PERM_MOD_AR')) return;

    const executeLoad = () => {
      setLoadedCustomer(cust);
      setFormCode(cust.code);
      setFormName(cust.name || '');
      setFormMobile(cust.mobile || '');
      setFormCustomerType(cust.type || '');
      const resolvedCategory = cust.category 
        ? resolvePriceTierCode(cust.category, priceTiers) 
        : '';
      setFormCategory(resolvedCategory);
      setFormAssignedSeller(cust.assignedSeller || '');
      setFormCreditLimit((cust.creditLimit !== undefined && cust.creditLimit !== null && cust.creditLimit !== 0) ? cust.creditLimit.toString() : '');
      setFormAllowCreditSales(cust.allowCreditSales ?? false);
      setFormStatus(cust.status || 'نشط');
      setFormDiscount(cust.discountRate ? (cust.discountRate <= 1 ? (Math.round(cust.discountRate * 10000) / 100).toString() : cust.discountRate.toString()) : '');
      setFormOpeningBalance((cust.openingBalance !== undefined && cust.openingBalance !== null && cust.openingBalance !== 0) ? cust.openingBalance.toString() : '');
      const origBal = (cust.openingBalance !== undefined && cust.openingBalance !== null) ? Number(cust.openingBalance) : 0;
      setOriginalOpeningBalance(isNaN(origBal) ? 0 : origBal);
      setShowOpeningBalanceConfirmModal(false);
      setFormOpeningBalanceType((cust.openingBalanceType as any) || 'مدين');
      setFormOpeningBalanceDate(cust.openingBalanceDate || getTodayIsoDate());
      setFormArea(cust.area || '');
      setFormAddress(cust.address || '');
      setFormSpecialNumber(cust.specialNumber || '');
      setFormNotes(cust.notes || '');
      setFormError(null);
      setIsDirty(false);
      setShowCustomerRecordsModal(false);

      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (isDirty) {
      setPendingAction(() => executeLoad);
      setShowConfirmModal(true);
    } else {
      executeLoad();
    }
  };

  // =========================================================
  // ACTION 4: طباعة (PRINT ACTION MENU & HANDLERS)
  // =========================================================
  const handleActionPrint = () => {
    if (!checkUserPermission('PERM_MOD_AR')) return;
    setShowPrintOptionsModal(true);
  };

  const handlePrintSingleCustomer = () => {
    if (!loadedCustomer && !formName.trim()) {
      setShowPrintOptionsModal(false);
      setFormError('لا يوجد عميل محدد للطباعة. يرجى اختيار عميل من السجل أولاً.');
      return;
    }
    setPrintMode('single');
    setShowPrintOptionsModal(false);
    setShowSinglePrintPreviewModal(true);
  };

  const handleExecuteSinglePrint = () => {
    setPrintMode('single');
    setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.focus();
          window.print();
        }
      } catch (err) {
        console.error('Failed to trigger window.print():', err);
      }
    }, 100);
  };

  const handleOpenBulkPrintFilter = () => {
    setShowPrintOptionsModal(false);
    setShowBulkPrintModal(true);
  };

  const handleExecuteBulkPrint = () => {
    if (bulkFilteredCustomers.length === 0) {
      showToast('لا توجد بيانات مطابقة للفلاتر المحددة للطباعة.');
      return;
    }
    setPrintMode('bulk');
    setShowBulkPrintPreviewModal(true);
  };

  const handleTriggerActualBulkPrint = () => {
    window.print();
  };

  const handleResetBulkFilters = () => {
    setBulkFilterSeller('');
    setBulkFilterArea('');
    setBulkFilterCategory('');
    setBulkFilterClassification('');
    setBulkFilterStatus('all');
    setBulkFilterCreditSales('all');
    setBulkFilterSearch('');
  };

  // =========================================================
  // ACTION 5: إلغاء العميل (LOGICAL CUSTOMER CANCELLATION / DELETE)
  // =========================================================
  const handleActionCancel = () => {
    if (!checkUserPermission('PERM_MOD_AR')) return;

    if (!loadedCustomer) {
      setFormError('لا يوجد عميل محدد للحذف. يرجى اختيار عميل محمل من السجل أولاً.');
      showToast('تنبيه: يلزم تحديد عميل محمل لإجراء الحذف المنطقي.');
      return;
    }

    if (loadedCustomer.isSystemCashCustomer) {
      setFormError('العميل النقدي النظامي محمي ولا يمكن حذفه.');
      showToast('العميل النقدي النظامي محمي ولا يمكن حذفه.');
      return;
    }

    if (isDirty) {
      setFormError('تحتوي الاستمارة على تغييرات غير محفوظة. يرجى حفظ البيانات أو التخلي عنها أولاً قبل إجراء حذف العميل.');
      showToast('تنبيه: توجد تعديلات غير محفوظة. قم بحفظها أو التخلي عنها أولاً.');
      return;
    }

    // Check if customer has historical transactions or sales invoices
    const hasTransactions = customerService.hasCustomerTransactions(loadedCustomer);

    if (hasTransactions) {
      // CASE 2: Customer WITH invoices -> BLOCK DELETE COMPLETELY
      setShowBlockedDeleteModal(true);
    } else {
      // CASE 1: Customer WITH NO invoices -> ALLOW LOGICAL DELETE
      setShowCancelCustomerModal(true);
    }
  };

  const executeCustomerCancellation = () => {
    if (!loadedCustomer) return;

    const activeSessions = securityManager.getActiveSessions();
    const username = activeSessions.length > 0 ? activeSessions[0].username : 'SUPER_ADMIN';
    const res = customerService.deleteCustomerLogically(loadedCustomer.id, username);

    if (res.success) {
      resetToNewCustomerMode();
      refreshCustomerList();
      showToast('تم إلغاء العميل منطقيًا بنجاح');
    } else {
      setFormError(res.error || 'فشل إلغاء العميل');
    }

    setShowCancelCustomerModal(false);
  };

  // =========================================================
  // ACTION 6: إغلاق (CLOSE / NAVIGATE SCREEN)
  // =========================================================
  const handleActionClose = () => {
    const executeClose = () => {
      setIsDirty(false);
      resetToNewCustomerMode();
      if (onClose) {
        onClose();
      } else if (onNavigateSection) {
        onNavigateSection('main');
      } else {
        resetToNewCustomerMode();
      }
    };

    if (isDirty) {
      setPendingAction(() => executeClose);
      setShowConfirmModal(true);
    } else {
      executeClose();
    }
  };

  // Toggle Status Action
  const handleToggleStatus = (cust: Customer) => {
    if (!checkUserPermission('PERM_MOD_AR')) return;

    if (cust.isSystemCashCustomer) {
      showToast('العميل النقدي النظامي محمي ولا يمكن تعطيله.');
      return;
    }

    const res = customerService.toggleCustomerStatus(cust.id);
    if (res.success && res.customer) {
      const isNowActive = res.customer.status === 'نشط' || res.customer.status === 'active';
      if (loadedCustomer && loadedCustomer.id === cust.id) {
        setLoadedCustomer(res.customer);
        setFormStatus(res.customer.status);
      }
      refreshCustomerList();
      showToast(`تم تغيير حالة العميل (${cust.name}) إلى: ${isNowActive ? 'نشط' : 'غير نشط'}`);
    } else {
      showToast(res.error || 'حدث خطأ أثناء تغيير حالة العميل.');
    }
  };

  // Filtered customers for display
  const rawFilteredCustomers = customerService.filterCustomers({
    searchTerm,
    status: statusFilter
  });

  const filteredCustomers = rawFilteredCustomers.filter(c => {
    if (creditSalesFilter === 'allowed') {
      return !!c.allowCreditSales;
    }
    if (creditSalesFilter === 'blocked') {
      return !c.allowCreditSales;
    }
    return true;
  });

  // Filtered and sorted customers for bulk printing and report preview
  const bulkFilteredCustomers = [...customers.filter(c => {
    if (c.status === 'محذوف' || c.status === 'deleted') return false;

    // Seller / Representative
    if (bulkFilterSeller && c.assignedSeller !== bulkFilterSeller) return false;

    // Area
    if (bulkFilterArea && c.area !== bulkFilterArea) return false;

    // Price Category / Type
    if (bulkFilterCategory) {
      const resolved = resolvePriceTierCode(c.category, priceTiers);
      if (resolved !== bulkFilterCategory && c.category !== bulkFilterCategory) return false;
    }

    // Classification
    if (bulkFilterClassification && c.type !== bulkFilterClassification) return false;

    // Operational Status
    if (bulkFilterStatus !== 'all') {
      const isActive = c.status === 'نشط' || c.status === 'active';
      if (bulkFilterStatus === 'نشط' && !isActive) return false;
      if (bulkFilterStatus === 'غير نشط' && isActive) return false;
    }

    // Credit Sales Permission
    if (bulkFilterCreditSales === 'allowed' && !c.allowCreditSales) return false;
    if (bulkFilterCreditSales === 'blocked' && c.allowCreditSales) return false;

    // Search Query
    if (bulkFilterSearch.trim()) {
      const term = bulkFilterSearch.trim().toLowerCase();
      const codeMatch = c.code?.toLowerCase().includes(term);
      const nameMatch = c.name?.toLowerCase().includes(term);
      const mobileMatch = c.mobile?.toLowerCase().includes(term);
      const areaMatch = c.area?.toLowerCase().includes(term);
      const sellerMatch = c.assignedSeller?.toLowerCase().includes(term);
      if (!codeMatch && !nameMatch && !mobileMatch && !areaMatch && !sellerMatch) return false;
    }

    return true;
  })].sort((a, b) => {
    if (bulkSortBy === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '', 'ar');
    } else if (bulkSortBy === 'code') {
      return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true });
    } else if (bulkSortBy === 'area') {
      return (a.area || '').localeCompare(b.area || '', 'ar');
    } else if (bulkSortBy === 'seller') {
      return (a.assignedSeller || '').localeCompare(b.assignedSeller || '', 'ar');
    } else if (bulkSortBy === 'creditLimit') {
      return (b.creditLimit || 0) - (a.creditLimit || 0);
    } else if (bulkSortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '', 'ar');
    }
    return 0;
  });

  // KPI Calculations
  const nonDeletedCustomers = customers.filter(c => c.status !== 'محذوف' && c.status !== 'deleted');
  const totalCustomersCount = nonDeletedCustomers.length;
  const activeCustomersCount = customers.filter(c => c.status === 'نشط' || c.status === 'active').length;
  const creditSalesAllowedCount = nonDeletedCustomers.filter(c => c.allowCreditSales).length;
  const totalCreditLimitSum = nonDeletedCustomers.reduce((acc, c) => acc + (c.creditLimit || 0), 0);

  // Reusable Customer Records Search, Filter & Table Component
  const renderCustomerRecordsSection = (isInsideModal: boolean) => (
    <div className="space-y-4">
      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث بكود العميل، الاسم، الفئة، أو رقم الموبايل..."
              className="w-full pr-10 pl-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 transition-all font-sans"
            />
            {searchTerm && (
              <button 
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3 space-x-reverse w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium text-[11px]">الحالة:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">جميع الحالات</option>
                <option value="active" className="bg-slate-900">نشط فقط</option>
                <option value="inactive" className="bg-slate-900">غير نشط فقط</option>
              </select>
            </div>

            {/* Credit Sales Filter */}
            <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium text-[11px]">البيع الآجل:</span>
              <select
                value={creditSalesFilter}
                onChange={(e) => setCreditSalesFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">الجميع</option>
                <option value="allowed" className="bg-slate-900">مسموح بالآجل</option>
                <option value="blocked" className="bg-slate-900">غير مسموح بالآجل</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center space-x-2 space-x-reverse">
            <Users className="w-4 h-4 text-amber-400" />
            <span>سجلات العملاء ({filteredCustomers.length})</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">
            اضغط على أي عميل لتحميل بياناته في النموذج أعلى الشاشة
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-right border-collapse text-xs table-auto">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase text-[11px]">
                <th className="py-2.5 px-3 font-mono w-[10%]">كود العميل</th>
                <th className="py-2.5 px-3 w-[32%] text-slate-200">اسم العميل</th>
                <th className="py-2.5 px-3 font-mono w-[12%]">رقم الموبايل</th>
                <th className="py-2.5 px-3 w-[10%]">الفئة والتصنيف</th>
                <th className="py-2.5 px-3 font-mono w-[12%]">حد الائتمان</th>
                <th className="py-2.5 px-3 w-[8%]">البيع الآجل</th>
                <th className="py-2.5 px-3 w-[7%]">الحالة</th>
                <th className="py-2.5 px-3 text-center w-[9%]">الإجراء المباشر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-400">لا توجد سجلات عملاء تطابق معايير البحث.</p>
                      <button
                        type="button"
                        onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCreditSalesFilter('all'); }}
                        className="text-xs text-amber-400 hover:underline cursor-pointer"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust, idx) => {
                  const isActive = cust.status === 'نشط' || cust.status === 'active';
                  const isCurrentlyLoaded = loadedCustomer?.id === cust.id;
                  
                  return (
                    <tr 
                      key={cust.id ? `${cust.id}-${idx}` : `cust-${idx}`} 
                      onClick={() => handleLoadCustomerIntoForm(cust)}
                      className={`transition-colors cursor-pointer ${
                        isCurrentlyLoaded
                          ? 'bg-amber-500/15 border-r-4 border-r-amber-500 font-medium'
                          : !isActive
                          ? 'opacity-70 bg-slate-950/30 hover:bg-slate-800/40'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      {/* كود العميل */}
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400 whitespace-nowrap text-xs">
                        {cust.code}
                      </td>

                      {/* اسم العميل (العنصر الأبرز بصرياً) */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm sm:text-base font-bold text-slate-100 tracking-normal hover:text-amber-300 transition-colors">
                            {cust.name}
                          </span>
                          {isCurrentlyLoaded && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 shadow shrink-0">
                              مُحمل
                            </span>
                          )}
                          {cust.isSystemCashCustomer && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shrink-0">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>نقدي نظامي</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* رقم الموبايل */}
                      <td className="py-2.5 px-3 font-mono text-slate-300 dir-ltr text-right whitespace-nowrap text-xs">
                        {cust.mobile ? cust.mobile : <span className="text-slate-600">-</span>}
                      </td>

                      {/* الفئة والتصنيف */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[11px] border border-slate-700">
                          {getCategoryDisplayName(cust.category, priceTiers)}
                        </span>
                      </td>

                      {/* حد الائتمان */}
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-200 whitespace-nowrap text-xs">
                        {cust.creditLimit !== undefined ? cust.creditLimit.toLocaleString('ar-EG', { minimumFractionDigits: 2 }) : '0.00'} ج.م
                      </td>

                      {/* البيع الآجل */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {cust.allowCreditSales ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            مسموح
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            غير مسموح
                          </span>
                        )}
                      </td>

                      {/* الحالة */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {cust.status === 'محذوف' || cust.status === 'deleted' ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center space-x-1 space-x-reverse w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                            <span>محذوف</span>
                          </span>
                        ) : isActive ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 space-x-reverse w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>نشط</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1 space-x-reverse w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>غير نشط</span>
                          </span>
                        )}
                      </td>

                      {/* الإجراءات المباشرة */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Load into Form Button */}
                          <button
                            type="button"
                            onClick={() => handleLoadCustomerIntoForm(cust)}
                            className={`px-2.5 py-1 rounded-lg border transition-all text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
                              isCurrentlyLoaded
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                            }`}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{isCurrentlyLoaded ? 'مُحمل' : 'عرض/تعديل'}</span>
                          </button>

                          {/* Toggle Active / Inactive Button */}
                          {!cust.isSystemCashCustomer && cust.status !== 'محذوف' && cust.status !== 'deleted' && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cust)}
                              className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer shrink-0 ${
                                isActive
                                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <UserX className="w-3.5 h-3.5 text-amber-400" />
                                  <span>تعطيل</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>تفعيل</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 dir-rtl text-right font-sans">

      {/* Unified Message Overlays */}
      <UnifiedMessageOverlay message={formError} type="error" duration={1000} onClose={() => setFormError(null)} />
      <UnifiedMessageOverlay message={toastMessage} duration={1000} onClose={() => setToastMessage(null)} />

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl dir-rtl text-right space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">تنبيه: توجد تعديلات غير محفوظة</h3>
                <p className="text-xs text-slate-400">تحتوي الاستمارة الحالية على تغييرات غير محفوظة.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-xl border border-slate-800">
              هل أنت تأكد من متابعة الإجراء والتخلي عن التعديلات الحالية دون حفظها؟
            </p>

            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                البقاء ومتابعة التعديل
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  if (pendingAction) {
                    pendingAction();
                    setPendingAction(null);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                تجاهل والتخلي عن التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGICAL CUSTOMER CANCELLATION CONFIRMATION MODAL (CASE 1 - NO INVOICES) */}
      {/* OPENING BALANCE CHANGE WARNING CONFIRMATION MODAL */}
      {showOpeningBalanceConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl dir-rtl text-right space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">تأكيد تعديل رصيد أول المدة</h3>
                <p className="text-xs text-amber-400 font-medium">تغيير في الرصيد الافتتاحي</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              تنبيه: تعديل رصيد أول المدة قد يؤثر على حسابات وأرصدة العميل. هل تريد المتابعة؟
            </p>

            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowOpeningBalanceConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOpeningBalanceConfirmModal(false);
                  handleActionSave(undefined, true);
                }}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                متابعة
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelCustomerModal && loadedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl dir-rtl text-right space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
                <UserX className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">تأكيد إلغاء العميل</h3>
                <p className="text-xs text-slate-400">الحذف المنطقي النهائي للعميل</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              سيتم إلغاء العميل نهائياً من السجل. لن يظهر هذا العميل في القوائم العادية أو الفواتير الجديدة.
            </p>

            {/* Current Customer Details Summary */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-medium">اسم العميل:</span>
                <span className="font-bold text-slate-100">{loadedCustomer.name}</span>
              </div>
              <div className="flex justify-between items-center pb-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-medium">كود العميل:</span>
                <span className="font-mono font-bold text-amber-400">{loadedCustomer.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">رقم الهاتف:</span>
                <span className="font-mono text-slate-300">{loadedCustomer.mobile || 'غير مسجل'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowCancelCustomerModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                رجوع
              </button>
              <button
                type="button"
                onClick={executeCustomerCancellation}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOCKED CUSTOMER DELETE WARNING MODAL (CASE 2 - HAS INVOICES) */}
      {showBlockedDeleteModal && loadedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl dir-rtl text-right space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">لا يمكن حذف العميل</h3>
                <p className="text-xs text-amber-400 font-medium">حظر عملية الحذف لحماية السجل التاريخي</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              لا يمكن حذف هذا العميل لوجود فواتير أو تعاملات سابقة مرتبطة به. يجب الاحتفاظ بالعميل للحفاظ على السجل التاريخي.
            </p>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1 border-b border-slate-800/60">
                <span className="text-slate-400 font-medium">اسم العميل:</span>
                <span className="font-bold text-slate-100">{loadedCustomer.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">كود العميل:</span>
                <span className="font-mono font-bold text-amber-400">{loadedCustomer.code}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowBlockedDeleteModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs transition-all cursor-pointer"
              >
                رجوع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER RECORDS FULL SCREEN MODAL OVERLAY */}
      <CustomerRecordsModal
        isOpen={showCustomerRecordsModal}
        onClose={() => setShowCustomerRecordsModal(false)}
        onRequestSafeExitSales={() => {
          setShowCustomerRecordsModal(false);
          handleActionClose();
        }}
        onLoadCustomerIntoForm={handleLoadCustomerIntoForm}
        loadedCustomerId={loadedCustomer?.id}
        onNavigateSalesTab={(tab) => {
          setShowCustomerRecordsModal(false);
          if (onNavigateSection) {
            onNavigateSection('gold');
          }
        }}
        onNavigateSection={(sec) => {
          setShowCustomerRecordsModal(false);
          if (onNavigateSection) {
            onNavigateSection(sec);
          }
        }}
      />

      {/* 1. PRINT OPTIONS ACTION MENU MODAL */}
      {showPrintOptionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl dir-rtl text-right space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Printer className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">إجراءات وخيارات الطباعة</h3>
                  <p className="text-xs text-slate-400">اختر نوع تقرير الطباعة المطلوب تنفيذه</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPrintOptionsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {/* Option 1: Print Single Customer */}
              <button
                type="button"
                onClick={handlePrintSingleCustomer}
                className="w-full text-right p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group cursor-pointer space-y-1.5 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 space-x-reverse text-slate-100 font-bold text-sm group-hover:text-amber-400 transition-colors">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>1. طباعة بيانات العميل (السجل الفردي)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    تقرير فردي
                  </span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">
                  {loadedCustomer ? (
                    <span>طباعة بطاقة العميل المحدد حالياً: <strong className="text-amber-300 font-bold">[{loadedCustomer.name}]</strong> (كود: <span className="font-mono">{loadedCustomer.code}</span>)</span>
                  ) : formName.trim() ? (
                    <span>طباعة بيانات النموذج المفتوح: <strong className="text-amber-300 font-bold">[{formName}]</strong></span>
                  ) : (
                    <span className="text-slate-500">طباعة بيانات العميل المفتوح في النموذج (يرجى تحميل عميل أولاً)</span>
                  )}
                </p>
              </button>

              {/* Option 2: Print All Customers with Filtering */}
              <button
                type="button"
                onClick={handleOpenBulkPrintFilter}
                className="w-full text-right p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group cursor-pointer space-y-1.5 block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5 space-x-reverse text-slate-100 font-bold text-sm group-hover:text-amber-400 transition-colors">
                    <Users className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>2. طباعة بيانات كل العملاء (تقرير مخصص / مفلتر)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    تقرير شامل / مفلتر
                  </span>
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300">
                  فتح نافذة الفلترة المتقدمة لمعاينة وطباعة تقرير العملاء (حسب المندوب، المنطقة، نوع السعر، التصنيف، الحالة التشغيلية، أو الكل).
                </p>
              </button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPrintOptionsModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE CUSTOMER PRINT PREVIEW MODAL */}
      {showSinglePrintPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl dir-rtl text-right overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 space-x-reverse">
                    <span>معاينة طباعة بطاقة العميل (Print Preview)</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-mono border border-amber-500/30">A4 Standard</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    العميل: <strong className="text-amber-300 font-bold">{formName}</strong> (كود: <span className="font-mono">{formCode}</span>)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={handleExecuteSinglePrint}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>إرسال للطابعة (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSinglePrintPreviewModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Sheet Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 flex justify-center custom-scrollbar">
              <div className="w-full max-w-3xl bg-white text-slate-900 rounded-lg shadow-xl p-8 sm:p-10 border border-slate-200 text-right dir-rtl font-sans min-h-[500px]">
                {/* Paper Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 m-0">
                      بطاقة بيانات عميل (Customer Master Record)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      نظام Vertex ERP — سجل العملاء الموحد
                    </p>
                  </div>
                  <div className="text-left text-xs text-slate-500 font-mono">
                    <p className="m-0">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                    <p className="mt-1">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
                  </div>
                </div>

                {/* Main Customer Details Table */}
                <table className="w-full border-collapse mb-6 text-sm">
                  <tbody>
                    <tr>
                      <td className="p-2.5 font-bold w-1/4 bg-slate-100 border border-slate-300 text-slate-800">كود العميل:</td>
                      <td className="p-2.5 border border-slate-300 font-mono font-bold text-slate-900">{formCode}</td>
                      <td className="p-2.5 font-bold w-1/4 bg-slate-100 border border-slate-300 text-slate-800">اسم العميل:</td>
                      <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{formName || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">رقم الموبايل:</td>
                      <td className="p-2.5 border border-slate-300 font-mono text-slate-900">{formMobile || '-'}</td>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">الفئة / التصنيف:</td>
                      <td className="p-2.5 border border-slate-300 text-slate-900">{getCategoryDisplayName(formCategory, priceTiers)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">المندوب / البائع:</td>
                      <td className="p-2.5 border border-slate-300 text-slate-900">{formAssignedSeller || '-'}</td>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">تصنيف العميل:</td>
                      <td className="p-2.5 border border-slate-300 text-slate-900">{formCustomerType || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">حد الائتمان:</td>
                      <td className="p-2.5 border border-slate-300 font-mono font-bold text-slate-900">{formCreditLimit ? `${formCreditLimit} ج.م` : '0.00 ج.م'}</td>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">السماح بالبيع الآجل:</td>
                      <td className="p-2.5 border border-slate-300 font-bold text-slate-900">{formAllowCreditSales ? 'مسموح' : 'غير مسموح'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">الحالة التشغيلية:</td>
                      <td className="p-2.5 border border-slate-300 text-slate-900">{formStatus}</td>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">نسبة الخصم:</td>
                      <td className="p-2.5 border border-slate-300 font-mono text-slate-900">{formDiscount ? `${formDiscount}%` : '0%'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">المنطقة:</td>
                      <td className="p-2.5 border border-slate-300 text-slate-900">{formArea || '-'}</td>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">عنوان العميل:</td>
                      <td className="p-2.5 border border-slate-300 text-slate-900">{formAddress || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">رصيد أول المدة:</td>
                      <td className="p-2.5 border border-slate-300 font-mono font-bold text-slate-900">
                        {formOpeningBalance ? `${formOpeningBalance} ج.م (${formOpeningBalanceType})` : '0.00 ج.م'}
                      </td>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">تاريخ رصيد أول المدة:</td>
                      <td className="p-2.5 border border-slate-300 font-mono text-slate-900">{formOpeningBalanceDate || '-'}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold bg-slate-100 border border-slate-300 text-slate-800">ملاحظات:</td>
                      <td colSpan={3} className="p-2.5 border border-slate-300 text-slate-800">{formNotes || '-'}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div className="mt-10 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-600">
                  <div>توقيع موظف الحسابات: ............................</div>
                  <div>اعتماد مدير قسم العملاء: ............................</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                يمكنك معاينة بطاقة العميل والتأكد من البيانات قبل إرسالها للطباعة
              </span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowSinglePrintPreviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSinglePrint}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة فورية</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. BULK CUSTOMERS PRINT FILTER & REPORTS MODAL */}
      {showBulkPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl dir-rtl text-right flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Window Style Title Bar */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>بيانات وتقارير العملاء</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {bulkFilteredCustomers.length} عميل مطابق
                    </span>
                  </h2>
                </div>
              </div>

              {/* Window Controls & Close Button */}
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowBulkPrintModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Top Bar: Sort Dropdown & Quick Info (Matching Reference Image) */}
            <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className="text-xs font-bold text-amber-400">عرض بيانات العملاء مرتبة وفقاً:</span>
                <select
                  value={bulkSortBy}
                  onChange={(e) => setBulkSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:border-amber-500/60 cursor-pointer min-w-[200px]"
                >
                  <option value="alphabetical">ترتيب أبجدي (حسب اسم العميل)</option>
                  <option value="code">ترتيب تصاعدي (حسب كود العميل)</option>
                  <option value="area">ترتيب جغرافي (حسب المنطقة)</option>
                  <option value="seller">ترتيب حسب المندوب / البائع</option>
                  <option value="creditLimit">ترتيب تنازلي (حسب حد الائتمان)</option>
                  <option value="status">ترتيب حسب الحالة التشغيلية</option>
                </select>
              </div>

              {/* Quick Search */}
              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  value={bulkFilterSearch}
                  onChange={(e) => setBulkFilterSearch(e.target.value)}
                  placeholder="بحث سريع بالاسم، الكود، الهاتف..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-500/60 placeholder:text-slate-500"
                />
                {bulkFilterSearch ? (
                  <button
                    type="button"
                    onClick={() => setBulkFilterSearch('')}
                    className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Navigation Tabs (Directly Under Top Bar as in Image) */}
            <div className="px-5 pt-2 bg-slate-950/60 border-b border-slate-800 flex flex-wrap gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setBulkActiveTab('all')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-x cursor-pointer flex items-center gap-1.5 ${
                  bulkActiveTab === 'all'
                    ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>بيانات العملاء</span>
              </button>

              <button
                type="button"
                onClick={() => setBulkActiveTab('area')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-x cursor-pointer flex items-center gap-1.5 ${
                  bulkActiveTab === 'area'
                    ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>العملاء وفقاً لمنطقة</span>
                {bulkFilterArea && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </button>

              <button
                type="button"
                onClick={() => setBulkActiveTab('seller')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-x cursor-pointer flex items-center gap-1.5 ${
                  bulkActiveTab === 'seller'
                    ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>العملاء وفقاً لمندوب</span>
                {bulkFilterSeller && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </button>

              <button
                type="button"
                onClick={() => setBulkActiveTab('category')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-x cursor-pointer flex items-center gap-1.5 ${
                  bulkActiveTab === 'category'
                    ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>نوع السعر / الفئة</span>
                {bulkFilterCategory && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </button>

              <button
                type="button"
                onClick={() => setBulkActiveTab('classification')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-x cursor-pointer flex items-center gap-1.5 ${
                  bulkActiveTab === 'classification'
                    ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>تصنيف العميل</span>
                {bulkFilterClassification && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </button>

              <button
                type="button"
                onClick={() => setBulkActiveTab('status')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-x cursor-pointer flex items-center gap-1.5 ${
                  bulkActiveTab === 'status'
                    ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>الحالة التشغيلية</span>
                {(bulkFilterStatus !== 'all' || bulkFilterCreditSales !== 'all') && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-slate-900">
              {/* TAB 1: بيانات العملاء (All / Overview) */}
              {bulkActiveTab === 'all' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Action Cards Row (Matching Visual Reference Image) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: بيانات كل العملاء */}
                    <button
                      type="button"
                      onClick={handleResetBulkFilters}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px] ${
                        !bulkFilterSeller && !bulkFilterArea && !bulkFilterCategory && !bulkFilterClassification && bulkFilterStatus === 'all' && bulkFilterCreditSales === 'all'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <h4 className="text-sm font-bold mb-1">بيانات كل العملاء</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({nonDeletedCustomers.length} عميل مسجل)</p>
                    </button>

                    {/* Card 2: عدد العملاء بكل منطقة */}
                    <button
                      type="button"
                      onClick={() => setBulkActiveTab('area')}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950 text-slate-200 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px]"
                    >
                      <h4 className="text-sm font-bold mb-1">عدد العملاء بكل منطقة</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({availableAreas.length} مناطق جغرافية)</p>
                    </button>

                    {/* Card 3: عدد العملاء لكل مندوب */}
                    <button
                      type="button"
                      onClick={() => setBulkActiveTab('seller')}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950 text-slate-200 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px]"
                    >
                      <h4 className="text-sm font-bold mb-1">عدد العملاء لكل مندوب</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({availableSellers.length} مندوبين مسجلين)</p>
                    </button>

                    {/* Card 4: المسموح لهم بالبيع الآجل */}
                    <button
                      type="button"
                      onClick={() => {
                        setBulkFilterCreditSales(bulkFilterCreditSales === 'allowed' ? 'all' : 'allowed');
                      }}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px] ${
                        bulkFilterCreditSales === 'allowed'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <h4 className="text-sm font-bold mb-1">المسموح لهم بالبيع الآجل</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({creditSalesAllowedCount} عميل معتمد)</p>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: العملاء وفقاً لمنطقة (By Area) */}
              {bulkActiveTab === 'area' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>تصفية العملاء حسب المنطقة الجغرافية</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBulkFilterArea('')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      عرض جميع المناطق
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setBulkFilterArea('')}
                      className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                        !bulkFilterArea
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">جميع المناطق</span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {nonDeletedCustomers.length}
                      </span>
                    </button>

                    {availableAreas.map((area) => {
                      const count = nonDeletedCustomers.filter(c => c.area === area).length;
                      const isSelected = bulkFilterArea === area;
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => setBulkFilterArea(isSelected ? '' : area)}
                          className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold truncate ml-2">{area}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                            isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: العملاء وفقاً لمندوب (By Seller) */}
              {bulkActiveTab === 'seller' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>تصفية العملاء حسب المندوب / البائع المخصص</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBulkFilterSeller('')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      عرض جميع المندوبين
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setBulkFilterSeller('')}
                      className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                        !bulkFilterSeller
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">جميع المندوبين</span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {nonDeletedCustomers.length}
                      </span>
                    </button>

                    {availableSellers.map((seller) => {
                      const count = nonDeletedCustomers.filter(c => c.assignedSeller === seller).length;
                      const isSelected = bulkFilterSeller === seller;
                      return (
                        <button
                          key={seller}
                          type="button"
                          onClick={() => setBulkFilterSeller(isSelected ? '' : seller)}
                          className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold truncate ml-2">{seller}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                            isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: نوع السعر / الفئة (By Category / Price Type) */}
              {bulkActiveTab === 'category' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-400" />
                      <span>تصفية العملاء حسب نوع السعر وفئة التعامل</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBulkFilterCategory('')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      عرض جميع الفئات
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {priceTiers.map((tier) => {
                      const count = nonDeletedCustomers.filter(c => {
                        const resolved = resolvePriceTierCode(c.category, priceTiers);
                        return resolved === tier.code;
                      }).length;
                      const isSelected = bulkFilterCategory === tier.code;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => setBulkFilterCategory(isSelected ? '' : tier.code)}
                          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{tier.name}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                              isSelected ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {count}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">[{tier.code}]</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: تصنيف العميل (Classification) */}
              {bulkActiveTab === 'classification' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ListFilter className="w-4 h-4 text-amber-400" />
                      <span>تصفية العملاء حسب تصنيف ونشاط العميل</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBulkFilterClassification('')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      عرض جميع التصنيفات
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setBulkFilterClassification('')}
                      className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                        !bulkFilterClassification
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">جميع التصنيفات</span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {nonDeletedCustomers.length}
                      </span>
                    </button>

                    {availableClassifications.map((cls) => {
                      const count = nonDeletedCustomers.filter(c => c.type === cls).length;
                      const isSelected = bulkFilterClassification === cls;
                      return (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => setBulkFilterClassification(isSelected ? '' : cls)}
                          className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold truncate ml-2">{cls}</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                            isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: الحالة التشغيلية والائتمان (Status & Credit) */}
              {bulkActiveTab === 'status' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>تصفية العملاء حسب الحالة التشغيلية وسياسة البيع الآجل</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkFilterStatus('all');
                        setBulkFilterCreditSales('all');
                      }}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      إعادة تعيين الحالة
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {/* نشط فقط */}
                    <button
                      type="button"
                      onClick={() => setBulkFilterStatus(bulkFilterStatus === 'نشط' ? 'all' : 'نشط')}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        bulkFilterStatus === 'نشط'
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">العملاء النشطين</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300">
                          {activeCustomersCount}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">حسابات نشطة ومفعلة</span>
                    </button>

                    {/* غير نشط */}
                    <button
                      type="button"
                      onClick={() => setBulkFilterStatus(bulkFilterStatus === 'غير نشط' ? 'all' : 'غير نشط')}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        bulkFilterStatus === 'غير نشط'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">العملاء الموقوفين</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                          {totalCustomersCount - activeCustomersCount}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">حسابات مجمدة أو غير نشطة</span>
                    </button>

                    {/* مسموح بالبيع الآجل */}
                    <button
                      type="button"
                      onClick={() => setBulkFilterCreditSales(bulkFilterCreditSales === 'allowed' ? 'all' : 'allowed')}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        bulkFilterCreditSales === 'allowed'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">البيع الآجل مسموح</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300">
                          {creditSalesAllowedCount}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">عملاء بحد ائتماني معتمد</span>
                    </button>

                    {/* غير مسموح بالآجل (نقدي فقط) */}
                    <button
                      type="button"
                      onClick={() => setBulkFilterCreditSales(bulkFilterCreditSales === 'blocked' ? 'all' : 'blocked')}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        bulkFilterCreditSales === 'blocked'
                          ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">نقدي فقط (بدون آجل)</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300">
                          {totalCustomersCount - creditSalesAllowedCount}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">معاملات نقدية فورية</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Applied Filters Summary & Live KPIs */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-y-1">
                  <span className="text-slate-400">النتائج المطابقة:</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    {bulkFilteredCustomers.length} عميل
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">إجمالي سقف الائتمان:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {bulkFilteredCustomers.reduce((acc, c) => acc + (c.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">الترتيب النشط:</span>
                  <span className="text-amber-300 font-semibold">
                    {bulkSortBy === 'alphabetical' && 'أبجدي (بالاسم)'}
                    {bulkSortBy === 'code' && 'تصاعدي (بالكود)'}
                    {bulkSortBy === 'area' && 'جغرافي (بالمنطقة)'}
                    {bulkSortBy === 'seller' && 'حسب المندوب'}
                    {bulkSortBy === 'creditLimit' && 'حد الائتمان (الأعلى)'}
                    {bulkSortBy === 'status' && 'الحالة التشغيلية'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetBulkFilters}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>تفريغ كل الفلاتر</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <div className="max-h-56 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 text-[11px] sticky top-0 border-b border-slate-800 z-10">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-center w-12">م</th>
                        <th className="py-2 px-3 font-semibold">كود العميل</th>
                        <th className="py-2 px-3 font-semibold">اسم العميل</th>
                        <th className="py-2 px-3 font-semibold">رقم الموبايل</th>
                        <th className="py-2 px-3 font-semibold">المنطقة</th>
                        <th className="py-2 px-3 font-semibold">المندوب</th>
                        <th className="py-2 px-3 font-semibold">التصنيف / الفئة</th>
                        <th className="py-2 px-3 font-semibold text-center">الحالة</th>
                        <th className="py-2 px-3 font-semibold text-left">حد الائتمان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {bulkFilteredCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <AlertTriangle className="w-5 h-5 text-amber-400/60" />
                              <p className="font-bold text-xs">لا توجد سجلات تطابق الفلاتر المحددة</p>
                              <p className="text-[11px] text-slate-500">يرجى تعديل أو تفريغ الفلاتر لعرض العملاء</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        bulkFilteredCustomers.map((c, idx) => (
                          <tr key={c.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-400">{c.code}</td>
                            <td className="py-2 px-3 font-bold text-slate-100">{c.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-300 dir-ltr text-right">{c.mobile || '-'}</td>
                            <td className="py-2 px-3 text-slate-300">{c.area || '-'}</td>
                            <td className="py-2 px-3 text-slate-300">{c.assignedSeller || '-'}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px] border border-slate-700">
                                {getCategoryDisplayName(c.category, priceTiers) || c.type || '-'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                c.status === 'نشط' || c.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {c.status === 'نشط' || c.status === 'active' ? 'نشط' : 'غير نشط'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-200 text-left">
                              {(c.creditLimit || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950 shrink-0">
              <button
                type="button"
                onClick={() => setShowBulkPrintModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetBulkFilters}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تفريغ الفلاتر</span>
                </button>

                <button
                  type="button"
                  disabled={bulkFilteredCustomers.length === 0}
                  onClick={handleExecuteBulkPrint}
                  className={`px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                    bulkFilteredCustomers.length > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>تنفيذ طباعة التقرير ({bulkFilteredCustomers.length} عميل)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.1 BULK CUSTOMERS REPORT PRINT PREVIEW MODAL */}
      {showBulkPrintPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl dir-rtl text-right flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>معاينة طباعة — تقرير بيانات وسجلات العملاء</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {bulkFilteredCustomers.length} عميل
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    معاينة شكل التقرير النهائي المطابق لورق الطباعة A4 قبل إرساله إلى الطابعة
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={handleTriggerActualBulkPrint}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkPrintPreviewModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                  title="إغلاق المعاينة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* A4 Sheet Preview Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 flex justify-center custom-scrollbar">
              <div className="w-full max-w-4xl bg-white text-slate-900 rounded-lg shadow-xl p-8 sm:p-10 border border-slate-200 text-right dir-rtl font-sans min-h-[500px]">
                {/* Paper Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 m-0">
                      تقرير بيانات وسجلات العملاء (Customer Master Records Report)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      نظام Vertex ERP — سجل العملاء الموحد
                    </p>
                    <div className="text-[11px] text-slate-600 mt-2 flex flex-wrap gap-2">
                      <span className="font-semibold"><strong>عدد السجلات في التقرير:</strong> {bulkFilteredCustomers.length} عميل</span>
                      {bulkFilterSeller && <span className="text-slate-700">| <strong>المندوب:</strong> {bulkFilterSeller}</span>}
                      {bulkFilterArea && <span className="text-slate-700">| <strong>المنطقة:</strong> {bulkFilterArea}</span>}
                      {bulkFilterCategory && <span className="text-slate-700">| <strong>الفئة/السعر:</strong> {bulkFilterCategory}</span>}
                      {bulkFilterClassification && <span className="text-slate-700">| <strong>التصنيف:</strong> {bulkFilterClassification}</span>}
                      {bulkFilterStatus !== 'all' && <span className="text-slate-700">| <strong>الحالة:</strong> {bulkFilterStatus}</span>}
                      {bulkFilterCreditSales !== 'all' && <span className="text-slate-700">| <strong>البيع الآجل:</strong> {bulkFilterCreditSales === 'allowed' ? 'مسموح' : 'غير مسموح'}</span>}
                    </div>
                  </div>
                  <div className="text-left text-xs text-slate-500 font-mono">
                    <p className="m-0">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                    <p className="mt-1">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
                  </div>
                </div>

                {/* Main Customers Table */}
                <table className="w-full border-collapse mb-6 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="p-2 border border-slate-300 text-center w-[4%]">م</th>
                      <th className="p-2 border border-slate-300 text-center w-[11%]">كود العميل</th>
                      <th className="p-2 border border-slate-300 text-right w-[22%]">اسم العميل</th>
                      <th className="p-2 border border-slate-300 text-center w-[11%]">الموبايل</th>
                      <th className="p-2 border border-slate-300 text-right w-[11%]">المنطقة</th>
                      <th className="p-2 border border-slate-300 text-right w-[11%]">المندوب</th>
                      <th className="p-2 border border-slate-300 text-center w-[9%]">التصنيف</th>
                      <th className="p-2 border border-slate-300 text-center w-[7%]">الحالة</th>
                      <th className="p-2 border border-slate-300 text-center w-[6%]">الخصم</th>
                      <th className="p-2 border border-slate-300 text-left w-[8%]">حد الائتمان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkFilteredCustomers.map((cust, idx) => (
                      <tr key={cust.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1.5 border border-slate-300 text-center font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-slate-900">{cust.code}</td>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{cust.name}</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono text-[11px]">{cust.mobile || '-'}</td>
                        <td className="p-1.5 border border-slate-300">{cust.area || '-'}</td>
                        <td className="p-1.5 border border-slate-300">{cust.assignedSeller || '-'}</td>
                        <td className="p-1.5 border border-slate-300 text-center">{getCategoryDisplayName(cust.category, priceTiers) || cust.type || '-'}</td>
                        <td className="p-1.5 border border-slate-300 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            cust.status === 'نشط' || cust.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {cust.status === 'نشط' || cust.status === 'active' ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono">{cust.discountRate ? `${cust.discountRate <= 1 ? Math.round(cust.discountRate * 10000) / 100 : cust.discountRate}%` : '0%'}</td>
                        <td className="p-1.5 border border-slate-300 text-left font-mono font-bold">
                          {(cust.creditLimit || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold text-slate-900">
                      <td colSpan={8} className="p-2 border border-slate-300 text-right">
                        إجمالي عدد العملاء في التقرير: {bulkFilteredCustomers.length} عميل
                      </td>
                      <td className="p-2 border border-slate-300 text-center">-</td>
                      <td className="p-2 border border-slate-300 text-left font-mono">
                        {bulkFilteredCustomers.reduce((acc, c) => acc + (c.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-600">
                  <div>توقيع موظف الحسابات: ............................</div>
                  <div>اعتماد مدير قسم المبيعات والحسابات: ............................</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                عدد السجلات في التقرير: <strong className="text-amber-400 font-mono">{bulkFilteredCustomers.length}</strong> عميل | إجمالي سقف الائتمان: <strong className="text-slate-200 font-mono">{bulkFilteredCustomers.reduce((acc, c) => acc + (c.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</strong>
              </span>
              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowBulkPrintPreviewModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  إغلاق المعاينة
                </button>
                <button
                  type="button"
                  onClick={handleTriggerActualBulkPrint}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 space-x-reverse transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* WINDOW / SCREEN CONTAINER (Unified VERTEX Master Template) */}
      {/* ========================================================= */}
      <div ref={formRef} className={`bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl ${isDatePickerOpen ? 'overflow-visible' : 'overflow-hidden'} flex flex-col w-full no-print font-['Cairo',sans-serif]`}>
        
        {/* 1. WINDOW TITLE BAR */}
        <div className="relative px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 font-['Cairo',sans-serif]">
          {/* Right Icon */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Users className="w-5 h-5" />
            </div>
          </div>

          {/* Center: Title Centered, Bigger, Bold, Cairo Font */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
              بيانات العملاء
            </h2>
          </div>

          {/* Left: Status Badge and Close Button */}
          <div className="flex items-center space-x-2 space-x-reverse">
            {isDirty && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                تعديلات غير محفوظة
              </span>
            )}
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              loadedCustomer 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {loadedCustomer ? `[${loadedCustomer.code}]` : 'إضافة جديدة'}
            </span>
            <button
              type="button"
              onClick={handleActionClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="إغلاق الشاشة"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 2. FORM BODY */}
        <div className="p-4 sm:p-5 space-y-3.5 bg-slate-900/70 border-b border-slate-800">
          <form onSubmit={handleActionSave} className="space-y-3.5 text-xs font-['Cairo',sans-serif]">
            {/* أولًا: البيانات الأساسية — ظاهرة دائمًا */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. كود العميل (Auto-generated + Read-Only) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>كود العميل</span>
              </label>
              <input
                type="text"
                value={formCode}
                readOnly
                tabIndex={-1}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onChange={() => {}}
                className="w-full px-3 py-1.5 h-8.5 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs focus:outline-none cursor-default select-all shadow-xs"
              />
            </div>

            {/* 2. اسم العميل (مطلوب) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                اسم العميل <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                required
              />
            </div>

            {/* 3. رقم الموبايل */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>رقم الموبايل</span>
              </label>
              <input
                type="text"
                value={formMobile}
                onChange={(e) => handleMobileChange(e.target.value)}
                className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 dir-ltr text-right shadow-xs"
              />
            </div>

            {/* 4. فئة العميل / التصنيف */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                فئة العميل / التصنيف
              </label>
              <div className="relative">
                <select
                  value={formCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  {/* توافق آمن لقراءة سجل عميل قديم فارغ دون فرض شريحة عليه، ودون إتاحة غير محدد كخيار لعميل جديد */}
                  {loadedCustomer && !formCategory && (
                    <option value="" disabled hidden>
                      غير محدد
                    </option>
                  )}
                  {/* إتاحة قراءة أي تصنيف تاريخي محفوظ في سجل قديم دون فقده */}
                  {loadedCustomer && formCategory && !priceTiers.some(t => t.code === formCategory || t.id === formCategory) && (
                    <option value={formCategory}>{getCategoryDisplayName(formCategory, priceTiers)}</option>
                  )}
                  {/* شرائح الأسعار المسجلة فعليًا وحصريًا في الخدمة المركزية */}
                  {priceTiers.map((tier) => (
                    <option key={tier.id} value={tier.code}>
                      {tier.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 5. تصنيف العميل */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                تصنيف العميل
              </label>
              <div className="relative">
                <select
                  value={formCustomerType}
                  onChange={(e) => handleCustomerTypeChange(e.target.value)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value=""></option>
                  {formCustomerType && !availableClassifications.includes(formCustomerType) && (
                    <option value={formCustomerType}>{formCustomerType}</option>
                  )}
                  {availableClassifications.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 6. الحالة التشغيلية */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                الحالة التشغيلية
              </label>
              <div className="relative">
                <select
                  value={formStatus}
                  disabled={loadedCustomer?.isSystemCashCustomer}
                  onChange={(e) => handleStatusChange(e.target.value as CustomerStatus)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="نشط">نشط</option>
                  <option value="غير نشط">غير نشط</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 7. السماح بالبيع الآجل */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>السماح بالبيع الآجل</span>
              </label>
              <div className="relative">
                <select
                  value={formAllowCreditSales ? 'true' : 'false'}
                  onChange={(e) => handleAllowCreditSalesChange(e.target.value === 'true')}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value="false">غير مسموح</option>
                  <option value="true">مسموح</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 8. البائع المخصص */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>البائع المخصص</span>
              </label>
              <div className="relative">
                <select
                  value={formAssignedSeller}
                  onChange={(e) => handleAssignedSellerChange(e.target.value)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value=""></option>
                  {formAssignedSeller && (
                    <option value={formAssignedSeller}>{formAssignedSeller}</option>
                  )}
                  {availableSellers.filter(s => s !== formAssignedSeller).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ثانيًا: البيانات الإضافية — مخفية افتراضيًا (Expand / Collapse) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowAdditionalInfo(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer text-xs font-semibold select-none"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {showAdditionalInfo ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
                <span>{showAdditionalInfo ? '− إخفاء البيانات الإضافية' : '+ عرض البيانات الإضافية'}</span>
              </div>
              <div className="flex items-center space-x-1.5 space-x-reverse text-slate-400">
                {showAdditionalInfo ? (
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {showAdditionalInfo && (
              <div className="p-3.5 border-t border-slate-800 space-y-3 bg-slate-950/30 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* نسبة الخصم الإضافية (%) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      نسبة الخصم الإضافية (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formDiscount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* المنطقة */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>المنطقة</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formArea}
                        onChange={(e) => handleAreaChange(e.target.value)}
                        className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                      >
                        <option value=""></option>
                        {formArea && !availableAreas.includes(formArea) && (
                          <option value={formArea}>{formArea}</option>
                        )}
                        {availableAreas.map((area) => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* عنوان العميل التفصيلي */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>عنوان العميل التفصيلي</span>
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* رقم خاص للعميل */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>رقم خاص للعميل</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formSpecialNumber}
                      onChange={(e) => handleSpecialNumberChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* ملاحظات */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>ملاحظات</span>
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => handleNotesChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ثالثًا: البيانات المالية والائتمانية — قسم مستقل (Expand / Collapse) */}
          <div className={`rounded-xl border border-slate-800 bg-slate-950/40 transition-all ${showFinancialInfo ? 'overflow-visible' : 'overflow-hidden'}`}>
            <button
              type="button"
              onClick={() => setShowFinancialInfo(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer text-xs font-semibold select-none"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {showFinancialInfo ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
                <span>{showFinancialInfo ? '− إخفاء البيانات المالية والائتمانية' : '+ البيانات المالية والائتمانية'}</span>
              </div>
              <div className="flex items-center space-x-1.5 space-x-reverse text-slate-400">
                {showFinancialInfo ? (
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {showFinancialInfo && (
              <div className="p-3.5 border-t border-slate-800 space-y-3 bg-slate-950/30 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. نوع الرصيد الافتتاحي */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-[11px]">
                      نوع الرصيد الافتتاحي
                    </label>
                    <div className="relative">
                      <select
                        value={formOpeningBalanceType}
                        onChange={(e) => handleOpeningBalanceTypeChange(e.target.value)}
                        className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                      >
                        <option value=""></option>
                        <option value="مدين">مدين (Debit)</option>
                        <option value="دائن">دائن (Credit)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. رصيد أول المدة */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-[11px]">
                      رصيد أول المدة (ج.م)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formOpeningBalance}
                      onChange={(e) => handleOpeningBalanceChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* 3. حد الائتمان */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>حد الائتمان (ج.م)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formCreditLimit}
                      onChange={(e) => handleCreditLimitChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* 4. تاريخ الإضافة (Calendar Date Picker) */}
                  <div className="relative" ref={datePickerRef}>
                    <label className="block text-slate-300 font-medium mb-1 text-[11px]">
                      تاريخ الإضافة
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs flex items-center justify-between focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer hover:bg-slate-50 transition-colors shadow-xs"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className={formOpeningBalanceDate ? "text-slate-900 font-mono font-bold" : "text-slate-400"}>
                          {formOpeningBalanceDate
                            ? formatDateForDisplay(formOpeningBalanceDate)
                            : ""}
                        </span>
                      </div>

                      {formOpeningBalanceDate ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpeningBalanceDateChange('');
                          }}
                          className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-rose-500 transition-colors"
                          title="تفريغ التاريخ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>

                    {/* Real Interactive Calendar Popover */}
                    {isDatePickerOpen && (
                      <div className={`absolute z-50 ${openAbove ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-72 max-w-[calc(100vw-2.5rem)] bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl space-y-3 text-right shadow-black/80`} dir="rtl">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-slate-100">
                            {ARABIC_MONTHS[pickerMonth]} {pickerYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Day of Week Header */}
                        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                          {ARABIC_DAYS.map((day) => (
                            <div key={day}>{day}</div>
                          ))}
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs">
                          {Array(firstDayIndex).fill(null).map((_, i) => (
                            <div key={`blank-${i}`} />
                          ))}
                          {Array(daysInMonth).fill(null).map((_, i) => {
                            const dayNum = i + 1;
                            const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            const isSelected = formOpeningBalanceDate === dateStr;

                            return (
                              <button
                                key={`day-${dayNum}`}
                                type="button"
                                onClick={() => {
                                  handleOpeningBalanceDateChange(dateStr);
                                  setIsDatePickerOpen(false);
                                }}
                                className={`p-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                                    : "bg-slate-950/60 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300"
                                }`}
                              >
                                {dayNum}
                              </button>
                            );
                          })}
                        </div>

                        {/* Footer controls */}
                        <div className="flex items-center justify-between border-t border-slate-800 pt-2 text-[11px]">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpeningBalanceDateChange('');
                              setIsDatePickerOpen(false);
                            }}
                            className="text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                          >
                            تفريغ التاريخ
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsDatePickerOpen(false)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                          >
                            إغلاق
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STANDARD ACTION BAR FOR CUSTOMER MASTER SCREEN */}
          <div className="pt-2 border-t border-slate-800">
            <StandardActionBar
              hasHold={false}
              gridCols={6}
              onNew={handleActionNew}
              onSave={handleActionSave}
              onView={handleActionView}
              onPrint={handleActionPrint}
              onCancel={handleActionCancel}
              onClose={handleActionClose}
              newLabel="1. عميل جديد"
              saveLabel="2. حفظ السجل"
              viewLabel="3. عرض"
              printLabel="4. طباعة"
              cancelLabel="5. إلغاء"
              closeLabel="6. إغلاق"
            />
          </div>
        </form>
      </div>
    </div>

      {/* 1. HIDDEN PRINTABLE SINGLE CUSTOMER CARD CONTAINER */}
      {printMode === 'single' && (
        <div id="printable-customer" className="print-only hidden print:block">
          <div style={{ textAlign: 'right', direction: 'rtl', fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '18pt', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                  بطاقة بيانات عميل (Customer Master Record)
                </h2>
                <p style={{ fontSize: '10pt', color: '#475569', margin: '4px 0 0 0' }}>
                  نظام Vertex ERP — سجل العملاء الموحد
                </p>
              </div>
              <div style={{ textAlign: 'left', fontSize: '9pt', color: '#64748b' }}>
                <p style={{ margin: 0 }}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                <p style={{ margin: '2px 0 0 0' }}>الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', width: '25%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>كود العميل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 'bold' }}>{formCode}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', width: '25%', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>اسم العميل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{formName || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>رقم الموبايل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formMobile || '-'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>الفئة / التصنيف:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{getCategoryDisplayName(formCategory, priceTiers)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>المندوب / البائع المخصص:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formAssignedSeller || '-'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>تصنيف العميل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formCustomerType || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>حد الائتمان:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 'bold' }}>{formCreditLimit ? `${formCreditLimit} ج.م` : '0.00 ج.م'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>السماح بالبيع الآجل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{formAllowCreditSales ? 'مسموح' : 'غير مسموح'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>الحالة التشغيلية:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formStatus}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>نسبة الخصم الإضافية:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formDiscount ? `${formDiscount}%` : '0%'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>المنطقة:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formArea || '-'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>عنوان العميل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formAddress || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>رصيد أول المدة:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {formOpeningBalance ? `${formOpeningBalance} ج.م (${formOpeningBalanceType})` : '0.00 ج.م'}
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>تاريخ رصيد أول المدة:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formOpeningBalanceDate || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>ملاحظات:</td>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formNotes || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '10pt', color: '#475569' }}>
              <div>توقيع موظف الحسابات: ............................</div>
              <div>اعتماد مدير قسم العملاء: ............................</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HIDDEN PRINTABLE BULK CUSTOMERS LIST CONTAINER */}
      {printMode === 'bulk' && (
        <div id="printable-customers-list" className="print-only hidden print:block">
          <div style={{ textAlign: 'right', direction: 'rtl', fontFamily: 'sans-serif' }}>
            {/* Report Header */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                  تقرير بيانات وسجلات العملاء (Customer Master Records Report)
                </h2>
                <p style={{ fontSize: '9.5pt', color: '#475569', margin: '3px 0 0 0' }}>
                  نظام Vertex ERP — سجل العملاء الموحد
                </p>
                <div style={{ fontSize: '8.5pt', color: '#64748b', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span><strong>عدد السجلات في التقرير:</strong> {bulkFilteredCustomers.length} عميل</span>
                  {bulkFilterSeller && <span><strong>المندوب:</strong> {bulkFilterSeller}</span>}
                  {bulkFilterArea && <span><strong>المنطقة:</strong> {bulkFilterArea}</span>}
                  {bulkFilterCategory && <span><strong>الفئة/السعر:</strong> {bulkFilterCategory}</span>}
                  {bulkFilterClassification && <span><strong>التصنيف:</strong> {bulkFilterClassification}</span>}
                  {bulkFilterStatus !== 'all' && <span><strong>الحالة:</strong> {bulkFilterStatus}</span>}
                  {bulkFilterCreditSales !== 'all' && <span><strong>البيع الآجل:</strong> {bulkFilterCreditSales === 'allowed' ? 'مسموح' : 'غير مسموح'}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'left', fontSize: '8.5pt', color: '#64748b' }}>
                <p style={{ margin: 0 }}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                <p style={{ margin: '2px 0 0 0' }}>الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
              </div>
            </div>

            {/* Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '8.5pt' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '4%' }}>م</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '11%' }}>كود العميل</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '22%' }}>اسم العميل</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '11%' }}>الموبايل</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '11%' }}>المنطقة</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '11%' }}>المندوب</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '9%' }}>التصنيف</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '7%' }}>الحالة</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '6%' }}>الخصم</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'left', width: '8%' }}>حد الائتمان</th>
                </tr>
              </thead>
              <tbody>
                {bulkFilteredCustomers.map((cust, idx) => (
                  <tr key={cust.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{cust.code}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{cust.name}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>{cust.mobile || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1' }}>{cust.area || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1' }}>{cust.assignedSeller || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{getCategoryDisplayName(cust.category, priceTiers) || cust.type || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{cust.status === 'نشط' || cust.status === 'active' ? 'نشط' : 'غير نشط'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>{cust.discountRate ? `${cust.discountRate <= 1 ? Math.round(cust.discountRate * 10000) / 100 : cust.discountRate}%` : '0%'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'left', fontFamily: 'monospace' }}>{(cust.creditLimit || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                  <td colSpan={8} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                    إجمالي عدد العملاء: {bulkFilteredCustomers.length} عميل
                  </td>
                  <td style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'left', fontFamily: 'monospace' }}>
                    {bulkFilteredCustomers.reduce((acc, c) => acc + (c.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#475569' }}>
              <div>توقيع موظف الحسابات: ............................</div>
              <div>اعتماد مدير قسم المبيعات والحسابات: ............................</div>
            </div>
          </div>
        </div>
      )}

      {/* SALES NAVIGATION OVERLAY MODAL */}
      <SalesNavigationModal
        isOpen={isSalesNavModalOpen}
        onClose={() => {
          setIsSalesNavModalOpen(false);
          const executeExitToMain = () => {
            setIsDirty(false);
            resetToNewCustomerMode();
            if (onNavigateSection) {
              onNavigateSection('main');
            }
          };

          if (isDirty) {
            setPendingAction(() => executeExitToMain);
            setShowConfirmModal(true);
          } else {
            executeExitToMain();
          }
        }}
        onSelectOption={(option: SalesNavDestination) => {
          setIsSalesNavModalOpen(false);
          if (option === 'sales_terminal') {
            if (onNavigateSection) {
              onNavigateSection('gold');
            }
          } else if (option === 'reports_integration') {
            if (onNavigateSection) {
              onNavigateSection('gold');
            }
          } else if (option === 'balances') {
            setIsCustomerBalancesHubOpen(true);
          } else if (option === 'customers') {
            // Already in Customer Master View
          }
        }}
      />

      {/* CUSTOMER BALANCES & STATEMENT HUB MODAL */}
      <CustomerBalancesHubModal
        isOpen={isCustomerBalancesHubOpen}
        onClose={() => {
          setIsCustomerBalancesHubOpen(false);
          setIsSalesNavModalOpen(true);
        }}
        onOpenStatementReport={() => {
          setIsCustomerBalancesHubOpen(false);
          setStatementTargetCustomerId(loadedCustomer?.id || '');
          setIsCustomerStatementReportOpen(true);
        }}
        onOpenBalancesList={() => {
          setIsCustomerBalancesHubOpen(false);
          setIsCustomerBalancesListOpen(true);
        }}
        onOpenSalesNav={() => {
          setIsCustomerBalancesHubOpen(false);
          setIsSalesNavModalOpen(true);
        }}
      />

      {/* LARGE CUSTOMER ACCOUNT STATEMENT REPORT SCREEN */}
      <CustomerStatementReportModal
        isOpen={isCustomerStatementReportOpen}
        defaultCustomerId={statementTargetCustomerId}
        onClose={() => {
          setIsCustomerStatementReportOpen(false);
          setIsCustomerBalancesHubOpen(true);
        }}
        onOpenSalesNav={() => {
          setIsCustomerStatementReportOpen(false);
          setIsSalesNavModalOpen(true);
        }}
      />

      {/* CUSTOMER BALANCES LIST MODAL */}
      <CustomerBalancesListModal
        isOpen={isCustomerBalancesListOpen}
        onClose={() => {
          setIsCustomerBalancesListOpen(false);
          setIsCustomerBalancesHubOpen(true);
        }}
        onSelectCustomerForStatement={(custCodeOrId) => {
          setStatementTargetCustomerId(custCodeOrId);
          setIsCustomerBalancesListOpen(false);
          setIsCustomerStatementReportOpen(true);
        }}
        onOpenSalesNav={() => {
          setIsCustomerBalancesListOpen(false);
          setIsSalesNavModalOpen(true);
        }}
      />
    </div>
  );
};
