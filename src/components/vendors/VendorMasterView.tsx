import React, { useState, useEffect, useRef } from 'react';
import { 
  vendorService, 
  Vendor, 
  VendorType, 
  VendorStatus, 
  VendorCategory 
} from '../../services/vendorService';
import { permissionIntegrationService } from '../../services/permissionIntegrationService';
import { securityManager } from '../../core/vpe/security/SecurityManager';
import { StandardActionBar } from '../common/StandardActionBar';
import { UnifiedMessageOverlay } from '../common/UnifiedMessageOverlay';
import { VendorRecordsModal } from './VendorRecordsModal';
import { VendorViewEditModal } from './VendorViewEditModal';
import { 
  Building2, 
  Users,
  PlusCircle, 
  Plus,
  Minus,
  Search, 
  Filter, 
  Edit3, 
  ShieldCheck, 
  UserCheck, 
  UserPlus,
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
  RotateCcw,
  ListFilter,
  FileCheck2,
  FileCode,
  Briefcase
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

export interface VendorMasterViewProps {
  initialVendorId?: string;
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}

export const VendorMasterView: React.FC<VendorMasterViewProps> = ({
  initialVendorId,
  onClose,
  onNavigateSection
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creditPurchasesFilter, setCreditPurchasesFilter] = useState<string>('all');
  const [viewEditVendor, setViewEditVendor] = useState<Vendor | null>(null);

  // Active Form Mode State (Null = New Vendor Mode, Vendor = Existing Vendor Loaded)
  const [loadedVendor, setLoadedVendor] = useState<Vendor | null>(null);

  // Form Fields
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formMobile, setFormMobile] = useState<string>('');
  const [formPhone2, setFormPhone2] = useState<string>('');
  const [formVendorType, setFormVendorType] = useState<string>('');
  const [formCategory, setFormCategory] = useState<VendorCategory>('Local');
  const [formAssignedPurchaser, setFormAssignedPurchaser] = useState<string>('');
  const [formTaxNumber, setFormTaxNumber] = useState<string>('');
  const [formCommercialRegister, setFormCommercialRegister] = useState<string>('');
  const [formCreditLimit, setFormCreditLimit] = useState<string>('');
  const [formAllowCreditPurchases, setFormAllowCreditPurchases] = useState<boolean>(false);
  const [formPaymentTerms, setFormPaymentTerms] = useState<string>('آجل 30 يوم من الفاتورة');
  const [formStatus, setFormStatus] = useState<VendorStatus>('نشط');
  const [formDiscount, setFormDiscount] = useState<string>('');
  const [formOpeningBalance, setFormOpeningBalance] = useState<string>('');
  const [formOpeningBalanceType, setFormOpeningBalanceType] = useState<'دائن' | 'مدين' | ''>('دائن');
  const [formOpeningBalanceDate, setFormOpeningBalanceDate] = useState<string>(getTodayIsoDate());
  const [formArea, setFormArea] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formSpecialNumber, setFormSpecialNumber] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  // Expand / Collapse Collapsible Sections State (Matching CustomerMasterView UX)
  const [showAdditionalInfo, setShowAdditionalInfo] = useState<boolean>(false);
  const [showFinancialInfo, setShowFinancialInfo] = useState<boolean>(false);

  // Original Opening Balance tracking for existing vendor edit confirmation
  const [originalOpeningBalance, setOriginalOpeningBalance] = useState<number | null>(null);
  const [showOpeningBalanceConfirmModal, setShowOpeningBalanceConfirmModal] = useState<boolean>(false);

  // Form Unsaved State Safety (Dirty Tracking)
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showCancelVendorModal, setShowCancelVendorModal] = useState<boolean>(false);
  const [showBlockedDeleteModal, setShowBlockedDeleteModal] = useState<boolean>(false);
  const [showVendorRecordsModal, setShowVendorRecordsModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Print Action Menu & Bulk Filter Modals State
  const [showPrintOptionsModal, setShowPrintOptionsModal] = useState<boolean>(false);
  const [showBulkPrintModal, setShowBulkPrintModal] = useState<boolean>(false);
  const [showSinglePrintPreviewModal, setShowSinglePrintPreviewModal] = useState<boolean>(false);
  const [showBulkPrintPreviewModal, setShowBulkPrintPreviewModal] = useState<boolean>(false);
  const [printMode, setPrintMode] = useState<'single' | 'bulk'>('single');

  // Bulk Print Filters & Report Navigation State
  const [bulkActiveTab, setBulkActiveTab] = useState<'all' | 'area' | 'purchaser' | 'category' | 'classification' | 'status'>('all');
  const [bulkSortBy, setBulkSortBy] = useState<string>('alphabetical');
  const [bulkFilterPurchaser, setBulkFilterPurchaser] = useState<string>('');
  const [bulkFilterArea, setBulkFilterArea] = useState<string>('');
  const [bulkFilterCategory, setBulkFilterCategory] = useState<string>('');
  const [bulkFilterClassification, setBulkFilterClassification] = useState<string>('');
  const [bulkFilterStatus, setBulkFilterStatus] = useState<string>('all');
  const [bulkFilterCreditPurchases, setBulkFilterCreditPurchases] = useState<string>('all');
  const [bulkFilterSearch, setBulkFilterSearch] = useState<string>('');

  // Available Classifications, Areas, Purchasers, and Payment Terms List for Dropdowns
  const availableClassifications = vendorService.getVendorClassifications();
  const availableAreas = vendorService.getVendorAreas();
  const availablePurchasers = vendorService.getPurchasersList();
  const availablePaymentTerms = vendorService.getPaymentTermsList();

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
  const checkUserPermission = (actionCode: string = 'PERM_MOD_AP'): boolean => {
    const activeSessions = securityManager.getActiveSessions();
    const role = activeSessions.length > 0 ? activeSessions[0].role : 'SUPER_ADMIN';
    const checkResult = permissionIntegrationService.checkPermission(role, actionCode);
    
    if (!checkResult.granted) {
      setFormError(`عذراً، الحساب الحالي [${activeSessions[0]?.username || 'GUEST'}] لا يملك صلاحية [${actionCode}] لإتخاذ هذا الإجراء.`);
      return false;
    }
    return true;
  };

  // Refresh vendor list from authoritative service
  const refreshVendorList = () => {
    const all = vendorService.getAllVendors();
    setVendors(all);
  };

  useEffect(() => {
    refreshVendorList();
    const unsubscribe = vendorService.subscribe(() => {
      refreshVendorList();
    });
    return () => unsubscribe();
  }, []);

  // Initialize or handle initialVendorId
  useEffect(() => {
    if (initialVendorId) {
      const existing = vendorService.getVendorById(initialVendorId);
      if (existing) {
        setLoadedVendor(existing);
        setFormCode(existing.code);
        setFormName(existing.name);
        setFormMobile(existing.mobile || '');
        setFormPhone2(existing.phone2 || '');
        setFormVendorType(existing.type || '');
        setFormCategory(existing.category || 'Local');
        setFormAssignedPurchaser(existing.assignedPurchaser || '');
        setFormTaxNumber(existing.taxNumber || '');
        setFormCommercialRegister(existing.commercialRegister || '');
        setFormCreditLimit((existing.creditLimit !== undefined && existing.creditLimit !== null && existing.creditLimit !== 0) ? existing.creditLimit.toString() : '');
        setFormAllowCreditPurchases(existing.allowCreditPurchases ?? false);
        setFormPaymentTerms(existing.paymentTerms || 'آجل 30 يوم من الفاتورة');
        setFormStatus(existing.status || 'نشط');
        setFormDiscount(existing.discountRate ? (existing.discountRate <= 1 ? (Math.round(existing.discountRate * 10000) / 100).toString() : existing.discountRate.toString()) : '');
        setFormOpeningBalance((existing.openingBalance !== undefined && existing.openingBalance !== null && existing.openingBalance !== 0) ? existing.openingBalance.toString() : '');
        const origBal = (existing.openingBalance !== undefined && existing.openingBalance !== null) ? Number(existing.openingBalance) : 0;
        setOriginalOpeningBalance(isNaN(origBal) ? 0 : origBal);
        setFormOpeningBalanceType((existing.openingBalanceType as any) || 'دائن');
        setFormOpeningBalanceDate(existing.openingBalanceDate || getTodayIsoDate());
        setFormArea(existing.area || '');
        setFormAddress(existing.address || '');
        setFormSpecialNumber(existing.specialNumber || '');
        setFormNotes(existing.notes || '');
        setIsDirty(false);
        setFormError(null);
        return;
      }
    }

    if (!loadedVendor) {
      setFormCode(vendorService.generateUniqueVendorCode());
      setFormOpeningBalanceDate(getTodayIsoDate());
    }
  }, [initialVendorId]);

  // Reset form to clear initial state for a brand new vendor
  const resetToNewVendor = () => {
    setLoadedVendor(null);
    setFormCode(vendorService.generateUniqueVendorCode());
    setFormName('');
    setFormMobile('');
    setFormPhone2('');
    setFormVendorType('');
    setFormCategory('Local');
    setFormAssignedPurchaser('');
    setFormTaxNumber('');
    setFormCommercialRegister('');
    setFormCreditLimit('');
    setFormAllowCreditPurchases(false);
    setFormPaymentTerms('آجل 30 يوم من الفاتورة');
    setFormStatus('نشط');
    setFormDiscount('');
    setFormOpeningBalance('');
    setOriginalOpeningBalance(null);
    setShowOpeningBalanceConfirmModal(false);
    setFormOpeningBalanceType('دائن');
    setFormOpeningBalanceDate(getTodayIsoDate());
    setFormArea('');
    setFormAddress('');
    setFormSpecialNumber('');
    setFormNotes('');
    setIsDirty(false);
    setFormError(null);
  };

  // Safe Action Wrapper with Dirty State Confirmation
  const safeExecute = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowConfirmModal(true);
    } else {
      action();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmModal(false);
    setIsDirty(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowConfirmModal(false);
    setPendingAction(null);
  };

  // Form Field Change Handlers
  const handleNameChange = (val: string) => { setFormName(val); setIsDirty(true); setFormError(null); };
  const handleMobileChange = (val: string) => { setFormMobile(val); setIsDirty(true); };
  const handlePhone2Change = (val: string) => { setFormPhone2(val); setIsDirty(true); };
  const handleVendorTypeChange = (val: string) => { setFormVendorType(val); setIsDirty(true); };
  const handleCategoryChange = (val: VendorCategory) => { setFormCategory(val); setIsDirty(true); };
  const handleAssignedPurchaserChange = (val: string) => { setFormAssignedPurchaser(val); setIsDirty(true); };
  const handleTaxNumberChange = (val: string) => { setFormTaxNumber(val); setIsDirty(true); };
  const handleCommercialRegisterChange = (val: string) => { setFormCommercialRegister(val); setIsDirty(true); };
  const handleCreditLimitChange = (val: string) => { setFormCreditLimit(val); setIsDirty(true); };
  const handleAllowCreditPurchasesChange = (val: boolean) => { setFormAllowCreditPurchases(val); setIsDirty(true); };
  const handlePaymentTermsChange = (val: string) => { setFormPaymentTerms(val); setIsDirty(true); };
  const handleStatusChange = (val: VendorStatus) => { setFormStatus(val); setIsDirty(true); };
  const handleDiscountChange = (val: string) => { setFormDiscount(val); setIsDirty(true); };
  
  const handleOpeningBalanceChange = (val: string) => {
    setFormOpeningBalance(val);
    setIsDirty(true);
    if (loadedVendor && originalOpeningBalance !== null) {
      const numVal = parseFloat(val) || 0;
      if (numVal !== originalOpeningBalance) {
        setShowOpeningBalanceConfirmModal(true);
      } else {
        setShowOpeningBalanceConfirmModal(false);
      }
    }
  };

  const handleOpeningBalanceTypeChange = (val: 'دائن' | 'مدين' | '') => { setFormOpeningBalanceType(val); setIsDirty(true); };
  const handleOpeningBalanceDateChange = (val: string) => { setFormOpeningBalanceDate(val); setIsDirty(true); };
  const handleAreaChange = (val: string) => { setFormArea(val); setIsDirty(true); };
  const handleAddressChange = (val: string) => { setFormAddress(val); setIsDirty(true); };
  const handleSpecialNumberChange = (val: string) => { setFormSpecialNumber(val); setIsDirty(true); };
  const handleNotesChange = (val: string) => { setFormNotes(val); setIsDirty(true); };

  // Load an existing vendor into the active form
  const handleLoadVendorIntoForm = (vend: Vendor) => {
    safeExecute(() => {
      setLoadedVendor(vend);
      setFormCode(vend.code);
      setFormName(vend.name);
      setFormMobile(vend.mobile || '');
      setFormPhone2(vend.phone2 || '');
      setFormVendorType(vend.type || '');
      setFormCategory(vend.category || 'Local');
      setFormAssignedPurchaser(vend.assignedPurchaser || '');
      setFormTaxNumber(vend.taxNumber || '');
      setFormCommercialRegister(vend.commercialRegister || '');
      setFormCreditLimit((vend.creditLimit !== undefined && vend.creditLimit !== null && vend.creditLimit !== 0) ? vend.creditLimit.toString() : '');
      setFormAllowCreditPurchases(vend.allowCreditPurchases ?? false);
      setFormPaymentTerms(vend.paymentTerms || 'آجل 30 يوم من الفاتورة');
      setFormStatus(vend.status || 'نشط');
      setFormDiscount(vend.discountRate ? (vend.discountRate <= 1 ? (Math.round(vend.discountRate * 10000) / 100).toString() : vend.discountRate.toString()) : '');
      setFormOpeningBalance((vend.openingBalance !== undefined && vend.openingBalance !== null && vend.openingBalance !== 0) ? vend.openingBalance.toString() : '');
      const origBal = (vend.openingBalance !== undefined && vend.openingBalance !== null) ? Number(vend.openingBalance) : 0;
      setOriginalOpeningBalance(isNaN(origBal) ? 0 : origBal);
      setShowOpeningBalanceConfirmModal(false);
      setFormOpeningBalanceType((vend.openingBalanceType as any) || 'دائن');
      setFormOpeningBalanceDate(vend.openingBalanceDate || getTodayIsoDate());
      setFormArea(vend.area || '');
      setFormAddress(vend.address || '');
      setFormSpecialNumber(vend.specialNumber || '');
      setFormNotes(vend.notes || '');
      setIsDirty(false);
      setFormError(null);

      // Smooth scroll to form
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // 1. Action: New Vendor
  const handleActionNew = () => {
    safeExecute(() => {
      resetToNewVendor();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // 2. Action: Save (Create / Update)
  const handleActionSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!checkUserPermission('PERM_MOD_AP')) {
      return;
    }

    if (!formName.trim()) {
      setFormError('يرجى إدخال اسم المورد، هذا الحقل إلزامي.');
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const parsedCreditLimit = formCreditLimit.trim() === '' ? 0 : parseFloat(formCreditLimit);
    const creditLimitNum = isNaN(parsedCreditLimit) ? 0 : Math.max(0, parsedCreditLimit);

    const parsedDiscount = formDiscount.trim() === '' ? 0 : parseFloat(formDiscount);
    const discountNum = isNaN(parsedDiscount) ? 0 : Math.max(0, parsedDiscount) / 100;

    const parsedOpeningBalance = formOpeningBalance.trim() === '' ? 0 : parseFloat(formOpeningBalance);
    const openingBalanceNum = isNaN(parsedOpeningBalance) ? 0 : Math.max(0, parsedOpeningBalance);

    if (loadedVendor) {
      // UPDATE EXISTING VENDOR
      const result = vendorService.updateVendor(loadedVendor.id, {
        name: formName,
        mobile: formMobile,
        phone2: formPhone2,
        type: formVendorType,
        status: formStatus,
        category: formCategory,
        assignedPurchaser: formAssignedPurchaser,
        taxNumber: formTaxNumber,
        commercialRegister: formCommercialRegister,
        creditLimit: creditLimitNum,
        allowCreditPurchases: formAllowCreditPurchases,
        paymentTerms: formPaymentTerms,
        discountRate: discountNum,
        notes: formNotes,
        area: formArea,
        address: formAddress,
        specialNumber: formSpecialNumber,
        openingBalance: openingBalanceNum,
        openingBalanceType: formOpeningBalanceType,
        openingBalanceDate: formOpeningBalanceDate
      });

      if (!result.success) {
        setFormError(result.error || 'تعذر تحديث بيانات المورد');
        return;
      }

      const updatedVendorName = result.vendor?.name || formName;
      refreshVendorList();
      resetToNewVendor();
      setToastMessage(`تم حفظ وتحديث بيانات المورد [${updatedVendorName}] بنجاح.`);
    } else {
      // CREATE NEW VENDOR
      const result = vendorService.addVendor({
        code: formCode,
        name: formName,
        mobile: formMobile,
        phone2: formPhone2,
        type: formVendorType,
        status: formStatus,
        category: formCategory,
        assignedPurchaser: formAssignedPurchaser,
        taxNumber: formTaxNumber,
        commercialRegister: formCommercialRegister,
        creditLimit: creditLimitNum,
        allowCreditPurchases: formAllowCreditPurchases,
        paymentTerms: formPaymentTerms,
        discountRate: discountNum,
        notes: formNotes,
        area: formArea,
        address: formAddress,
        specialNumber: formSpecialNumber,
        openingBalance: openingBalanceNum,
        openingBalanceType: formOpeningBalanceType,
        openingBalanceDate: formOpeningBalanceDate
      });

      if (!result.success) {
        setFormError(result.error || 'تعذر إضافة المورد الجديد');
        return;
      }

      const savedVendorName = result.vendor?.name || formName;
      const savedVendorCode = result.vendor?.code || formCode;
      refreshVendorList();
      resetToNewVendor();
      setToastMessage(`تم إنشاء المورد [${savedVendorName}] بكود [${savedVendorCode}] وحفظه بنجاح.`);
    }
  };

  // 3. Action: View / Browse Records
  const handleActionView = () => {
    setShowVendorRecordsModal(true);
  };

  // 4. Action: Print
  const handleActionPrint = () => {
    setShowPrintOptionsModal(true);
  };

  const handleSelectPrintOption = (option: 'single' | 'bulk') => {
    setShowPrintOptionsModal(false);
    if (option === 'single') {
      if (!formName.trim()) {
        setFormError('يرجى تحديد أو إدخال بيانات المورد أولاً لطباعة بطاقة المورد.');
        return;
      }
      setPrintMode('single');
      setShowSinglePrintPreviewModal(true);
    } else {
      setPrintMode('bulk');
      setBulkActiveTab('all');
      setBulkFilterPurchaser('');
      setBulkFilterArea('');
      setBulkFilterCategory('');
      setBulkFilterClassification('');
      setBulkFilterStatus('all');
      setBulkFilterCreditPurchases('all');
      setBulkFilterSearch('');
      setShowBulkPrintModal(true);
    }
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

  const handleExecuteBulkPrint = () => {
    if (filteredBulkVendors.length === 0) {
      setToastMessage('لا توجد بيانات مطابقة للفلاتر المحددة للطباعة.');
      return;
    }
    setPrintMode('bulk');
    setShowBulkPrintPreviewModal(true);
  };

  const handleTriggerActualBulkPrint = () => {
    window.print();
  };

  const handleResetBulkFilters = () => {
    setBulkFilterPurchaser('');
    setBulkFilterArea('');
    setBulkFilterCategory('');
    setBulkFilterClassification('');
    setBulkFilterStatus('all');
    setBulkFilterCreditPurchases('all');
    setBulkFilterSearch('');
  };

  const executeBrowserPrint = () => {
    setShowSinglePrintPreviewModal(false);
    setShowBulkPrintPreviewModal(false);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // 5. Action: Cancel
  const handleActionCancel = () => {
    if (isDirty) {
      setShowCancelVendorModal(true);
    } else {
      resetToNewVendor();
    }
  };

  const handleConfirmCancelVendor = () => {
    setShowCancelVendorModal(false);
    setIsDirty(false);
    resetToNewVendor();
  };

  // 6. Action: Close
  const handleActionClose = () => {
    safeExecute(() => {
      if (onClose) {
        onClose();
      } else if (onNavigateSection) {
        onNavigateSection('modules');
      }
    });
  };

  const handleToggleStatus = (vendor: Vendor) => {
    if (vendor.isSystemCashVendor) return;
    const res = vendorService.toggleVendorStatus(vendor.id);
    if (res.success) {
      setToastMessage(`تم تغيير حالة المورد [${vendor.name}] إلى (${res.vendor?.status})`);
      refreshVendorList();
    }
  };

  // Filter and Search in Main Table
  const filteredVendors = vendors.filter(v => {
    if (v.status === 'محذوف' || v.status === 'deleted') return false;

    if (statusFilter !== 'all') {
      const isAct = v.status === 'نشط' || v.status === 'active';
      if (statusFilter === 'active' && !isAct) return false;
      if (statusFilter === 'inactive' && isAct) return false;
    }

    if (creditPurchasesFilter !== 'all') {
      if (creditPurchasesFilter === 'allowed' && !v.allowCreditPurchases) return false;
      if (creditPurchasesFilter === 'blocked' && v.allowCreditPurchases) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const codeMatch = v.code?.toLowerCase().includes(q);
      const nameMatch = v.name?.toLowerCase().includes(q);
      const mobileMatch = v.mobile?.toLowerCase().includes(q);
      const phone2Match = v.phone2?.toLowerCase().includes(q);
      const taxMatch = v.taxNumber?.toLowerCase().includes(q);
      const purchaserMatch = v.assignedPurchaser?.toLowerCase().includes(q);
      const areaMatch = v.area?.toLowerCase().includes(q);
      const typeMatch = v.type?.toLowerCase().includes(q);
      const categoryMatch = v.category?.toLowerCase().includes(q);

      if (!codeMatch && !nameMatch && !mobileMatch && !phone2Match && !taxMatch && !purchaserMatch && !areaMatch && !typeMatch && !categoryMatch) {
        return false;
      }
    }

    return true;
  });

  // Filtered List for Bulk Reports
  const filteredBulkVendors = [...vendors.filter(v => {
    if (v.status === 'محذوف' || v.status === 'deleted') return false;

    if (bulkFilterPurchaser && v.assignedPurchaser !== bulkFilterPurchaser) return false;
    if (bulkFilterArea && v.area !== bulkFilterArea) return false;
    if (bulkFilterCategory && v.category !== bulkFilterCategory) return false;
    if (bulkFilterClassification && v.type !== bulkFilterClassification) return false;

    if (bulkFilterStatus !== 'all') {
      const isAct = v.status === 'نشط' || v.status === 'active';
      if (bulkFilterStatus === 'نشط' && !isAct) return false;
      if (bulkFilterStatus === 'غير نشط' && isAct) return false;
    }

    if (bulkFilterCreditPurchases === 'allowed' && !v.allowCreditPurchases) return false;
    if (bulkFilterCreditPurchases === 'blocked' && v.allowCreditPurchases) return false;

    if (bulkFilterSearch.trim()) {
      const q = bulkFilterSearch.trim().toLowerCase();
      const codeMatch = v.code?.toLowerCase().includes(q);
      const nameMatch = v.name?.toLowerCase().includes(q);
      const mobileMatch = v.mobile?.toLowerCase().includes(q);
      const taxMatch = v.taxNumber?.toLowerCase().includes(q);
      const areaMatch = v.area?.toLowerCase().includes(q);
      const purchaserMatch = v.assignedPurchaser?.toLowerCase().includes(q);

      if (!codeMatch && !nameMatch && !mobileMatch && !taxMatch && !areaMatch && !purchaserMatch) {
        return false;
      }
    }

    return true;
  })].sort((a, b) => {
    if (bulkSortBy === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '', 'ar');
    } else if (bulkSortBy === 'code') {
      return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true });
    } else if (bulkSortBy === 'area') {
      return (a.area || '').localeCompare(b.area || '', 'ar');
    } else if (bulkSortBy === 'purchaser') {
      return (a.assignedPurchaser || '').localeCompare(b.assignedPurchaser || '', 'ar');
    } else if (bulkSortBy === 'creditLimit') {
      return (b.creditLimit || 0) - (a.creditLimit || 0);
    } else if (bulkSortBy === 'status') {
      return (a.status || '').localeCompare(b.status || '', 'ar');
    }
    return 0;
  });

  // KPI Calculations
  const nonDeletedVendors = vendors.filter(v => v.status !== 'محذوف' && v.status !== 'deleted');
  const totalVendorsCount = nonDeletedVendors.length;
  const activeVendorsCount = vendors.filter(v => v.status === 'نشط' || v.status === 'active').length;
  const creditPurchasesAllowedCount = nonDeletedVendors.filter(v => v.allowCreditPurchases).length;
  const totalCreditLimitSum = nonDeletedVendors.reduce((acc, v) => acc + (v.creditLimit || 0), 0);

  return (
    <div className="space-y-4 font-sans text-right" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <UnifiedMessageOverlay
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
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
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          {/* Center: Title Centered, Bigger, Bold, Cairo Font */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
              بيانات الموردين
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
              loadedVendor 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {loadedVendor ? `[${loadedVendor.code}]` : 'إضافة جديدة'}
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
          {/* Error Notification */}
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-rose-400 hover:text-rose-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Vendor Form Grid (Unified Layout with Collapsible Sections) */}
          <form onSubmit={handleActionSave} className="space-y-3.5 text-xs font-['Cairo',sans-serif]">
            {/* أولًا: البيانات الأساسية — ظاهرة دائمًا */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. كود المورد (Auto-generated + Read-Only) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>كود المورد</span>
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

            {/* 2. اسم المورد (مطلوب) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                اسم المورد / الشركة <span className="text-rose-400">*</span>
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

            {/* 4. فئة المورد / النطاق */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                فئة المورد / النطاق
              </label>
              <div className="relative">
                <select
                  value={formCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as VendorCategory)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value="Local">مورد محلي (Local)</option>
                  <option value="Primary">مورد استراتيجي رئيسي (Primary)</option>
                  <option value="Corporate">شركات ومؤسسات (Corporate)</option>
                  <option value="Wholesale">وكيل وتوزيع جملة (Wholesale)</option>
                  <option value="Import">مورد دولي واستيراد (Import)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 5. تصنيف التوريد */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                تصنيف التوريد
              </label>
              <div className="relative">
                <select
                  value={formVendorType}
                  onChange={(e) => handleVendorTypeChange(e.target.value)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value=""></option>
                  {formVendorType && !availableClassifications.includes(formVendorType) && (
                    <option value={formVendorType}>{formVendorType}</option>
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
                  onChange={(e) => handleStatusChange(e.target.value as VendorStatus)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value="نشط">نشط (Active)</option>
                  <option value="غير نشط">غير نشط (Inactive)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 7. السماح بالشراء الآجل */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>السماح بالشراء الآجل</span>
              </label>
              <div className="relative">
                <select
                  value={formAllowCreditPurchases ? 'true' : 'false'}
                  onChange={(e) => handleAllowCreditPurchasesChange(e.target.value === 'true')}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value="false">غير مسموح (نقدي فقط)</option>
                  <option value="true">مسموح بالشراء الآجل</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 8. مسؤول المشتريات */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>مسؤول المشتريات</span>
              </label>
              <div className="relative">
                <select
                  value={formAssignedPurchaser}
                  onChange={(e) => handleAssignedPurchaserChange(e.target.value)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                >
                  <option value=""></option>
                  {formAssignedPurchaser && (
                    <option value={formAssignedPurchaser}>{formAssignedPurchaser}</option>
                  )}
                  {availablePurchasers.filter(p => p !== formAssignedPurchaser).map((p) => (
                    <option key={p} value={p}>{p}</option>
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
                  {/* نسبة الخصم التجاري (%) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      نسبة الخصم التجاري (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={formDiscount}
                      onChange={(e) => handleDiscountChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* المنطقة الجغرافية / الصناعية */}
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

                  {/* العنوان التفصيلي / المصنع */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>العنوان التفصيلي / المصنع</span>
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => handleAddressChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* الهاتف الأرضي / هاتف 2 */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>الهاتف الأرضي / هاتف 2</span>
                    </label>
                    <input
                      type="text"
                      value={formPhone2}
                      onChange={(e) => handlePhone2Change(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 dir-ltr text-right shadow-xs"
                    />
                  </div>

                  {/* الرقم الضريبي */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <FileCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>الرقم الضريبي</span>
                    </label>
                    <input
                      type="text"
                      value={formTaxNumber}
                      onChange={(e) => handleTaxNumberChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* السجل التجاري / رقم خاص */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>السجل التجاري / رقم خاص</span>
                    </label>
                    <input
                      type="text"
                      value={formCommercialRegister}
                      onChange={(e) => handleCommercialRegisterChange(e.target.value)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-mono font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                    />
                  </div>

                  {/* شروط السداد والائتمان */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>شروط السداد</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formPaymentTerms}
                        onChange={(e) => handlePaymentTermsChange(e.target.value)}
                        className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                      >
                        {availablePaymentTerms.map((term) => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* ملاحظات التوريد والتعاقد */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>ملاحظات التوريد والتعاقد</span>
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
          <div className={`rounded-xl border border-slate-800 bg-slate-950/40 transition-all ${showFinancialInfo || isDatePickerOpen ? 'overflow-visible' : 'overflow-hidden'}`}>
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
                        onChange={(e) => handleOpeningBalanceTypeChange(e.target.value as any)}
                        className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 cursor-pointer appearance-none pl-8 shadow-xs"
                      >
                        <option value="دائن">دائن (Credit - مستحق للمورد)</option>
                        <option value="مدين">مدين (Debit - دفعة مقدمة للمورد)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* 2. رصيد أول المدة (ج.م) */}
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

                  {/* 3. حد الائتمان للمشتريات (ج.م) */}
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
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="الشهر السابق"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-slate-200 font-sans">
                            {ARABIC_MONTHS[pickerMonth]} {pickerYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="الشهر القادم"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {ARABIC_DAYS.map((day, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-slate-500 py-0.5">
                              {day}
                            </span>
                          ))}
                          {Array.from({ length: firstDayIndex }).map((_, idx) => (
                            <span key={`empty-${idx}`} className="py-1" />
                          ))}
                          {Array.from({ length: daysInMonth }).map((_, idx) => {
                            const dayNumber = idx + 1;
                            const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                            const isSelected = formOpeningBalanceDate === dateStr;
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                              <button
                                key={`day-${dayNumber}`}
                                type="button"
                                onClick={() => {
                                  handleOpeningBalanceDateChange(dateStr);
                                  setIsDatePickerOpen(false);
                                }}
                                className={`py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                                    : isToday
                                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 hover:bg-amber-500/30'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                {dayNumber}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Standard Action Bar for Vendor Master Screen */}
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
              newLabel="1. مورد جديد"
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

      {/* Print Options Selection Modal */}
      {showPrintOptionsModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowPrintOptionsModal(false)}
        >
          <div 
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-right font-sans space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2 space-x-reverse">
                <Printer className="w-5 h-5 text-cyan-400" />
                <span>خيارات الطباعة والتقارير</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowPrintOptionsModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              اختر نوع تقرير الموردين الذي ترغب في معاينته وطباعته:
            </p>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSelectPrintOption('single')}
                className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-right transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    1. بطاقة بيانات المورد الحالي (Single Vendor Card)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    طباعة مستند رسمي بكامل بيانات المورد المحدد في النموذج، شروط السداد والحد الائتماني.
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectPrintOption('bulk')}
                className="w-full p-3.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-right transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                    2. كشف وتقارير الموردين المجمعة (Vendor Lists & Reports)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    تصفية وفرز الموردين حسب المنطقة، الفئة، مسؤول المشتريات، وطباعة كشف إجمالي أو مفصل.
                  </div>
                </div>
                <ChevronLeft className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:-translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Vendor Print Preview Modal */}
      {showSinglePrintPreviewModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowSinglePrintPreviewModal(false)}
        >
          <div 
            className="w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-right font-sans"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Printer className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-100">
                  معاينة طباعة بطاقة المورد: [{formName}]
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowSinglePrintPreviewModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50">
              {/* Paper Look Container */}
              <div className="bg-white text-slate-900 p-6 rounded-xl shadow-lg border border-slate-200 text-xs font-sans space-y-4">
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 m-0">بطاقة بيانات مورد (Vendor Master Record)</h2>
                    <p className="text-[11px] text-slate-600 m-0 mt-0.5">نظام Vertex ERP — سجل الموردين المعتمدين</p>
                  </div>
                  <div className="text-left text-[10px] text-slate-500">
                    <p className="m-0">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                    <p className="m-0">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
                  </div>
                </div>

                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800 w-1/4">كود المورد:</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900 w-1/4">{formCode}</td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800 w-1/4">اسم المورد:</td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900 w-1/4">{formName}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">رقم الموبايل:</td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-900 dir-ltr text-right">{formMobile || '—'}</td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">الهاتف الأرضي / هاتف 2:</td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-900 dir-ltr text-right">{formPhone2 || '—'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">فئة ونطاق المورد:</td>
                      <td className="p-2 border border-slate-300 text-slate-900">{formCategory}</td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">تصنيف التوريد:</td>
                      <td className="p-2 border border-slate-300 text-slate-900">{formVendorType || 'عام'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">الرقم الضريبي:</td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-900">{formTaxNumber || '—'}</td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">السجل التجاري:</td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-900">{formCommercialRegister || '—'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">الحد الائتماني للمشتريات:</td>
                      <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{formCreditLimit ? `${formCreditLimit} ج.م` : '0.00 ج.م'}</td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">السماح بالشراء الآجل:</td>
                      <td className="p-2 border border-slate-300 font-bold text-slate-900">{formAllowCreditPurchases ? 'مسموح' : 'نقدي فقط'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">شروط السداد المعتمدة:</td>
                      <td className="p-2 border border-slate-300 text-slate-900">{formPaymentTerms}</td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">نسبة الخصم التجاري:</td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-900">{formDiscount ? `${formDiscount}%` : '0%'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">المنطقة الجغرافية:</td>
                      <td className="p-2 border border-slate-300 text-slate-900">{formArea || '—'}</td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">مسؤول المشتريات:</td>
                      <td className="p-2 border border-slate-300 text-slate-900">{formAssignedPurchaser || '—'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">رصيد أول المدة الافتتاحي:</td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-900">
                        {formOpeningBalance ? `${formOpeningBalance} ج.م (${formOpeningBalanceType})` : '0.00 ج.م'}
                      </td>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">تاريخ الرصيد الافتتاحي:</td>
                      <td className="p-2 border border-slate-300 font-mono text-slate-900">{formatDateForDisplay(formOpeningBalanceDate)}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">العنوان التفصيلي:</td>
                      <td colSpan={3} className="p-2 border border-slate-300 text-slate-900">{formAddress || '—'}</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold bg-slate-100 border border-slate-300 text-slate-800">الملاحظات:</td>
                      <td colSpan={3} className="p-2 border border-slate-300 text-slate-900">{formNotes || 'لا توجد ملاحظات مسجلة.'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSinglePrintPreviewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={executeBrowserPrint}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center space-x-1.5 space-x-reverse shadow-lg shadow-cyan-600/30 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>إرسال إلى الطابعة الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BULK VENDORS PRINT FILTER & REPORTS MODAL */}
      {showBulkPrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl dir-rtl text-right flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
            {/* Window Style Title Bar */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>كشف وتقارير الموردين المعتمدين</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {filteredBulkVendors.length} مورد مطابق
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

            {/* Top Bar: Sort Dropdown & Quick Info */}
            <div className="px-5 py-3 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <span className="text-xs font-bold text-amber-400">عرض بيانات الموردين مرتبة وفقاً:</span>
                <select
                  value={bulkSortBy}
                  onChange={(e) => setBulkSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold focus:outline-none focus:border-amber-500/60 cursor-pointer min-w-[200px]"
                >
                  <option value="alphabetical">ترتيب أبجدي (حسب اسم المورد)</option>
                  <option value="code">ترتيب تصاعدي (حسب كود المورد)</option>
                  <option value="area">ترتيب جغرافي (حسب المنطقة)</option>
                  <option value="purchaser">ترتيب حسب مسؤول المشتريات</option>
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
                    className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Navigation Tabs */}
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
                <Building2 className="w-3.5 h-3.5" />
                <span>بيانات الموردين</span>
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
                <span>الموردين وفقاً لمنطقة</span>
                {bulkFilterArea && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </button>

              <button
                type="button"
                onClick={() => setBulkActiveTab('purchaser')}
                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all border-t border-x cursor-pointer flex items-center gap-1.5 ${
                  bulkActiveTab === 'purchaser'
                    ? 'bg-slate-900 text-amber-400 border-slate-700 border-b-transparent shadow-sm'
                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>الموردين وفقاً لمسؤول مشتريات</span>
                {bulkFilterPurchaser && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
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
                <span>نوع ونطاق المورد / الفئة</span>
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
                <span>تصنيف التوريد</span>
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
                {(bulkFilterStatus !== 'all' || bulkFilterCreditPurchases !== 'all') && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4 bg-slate-900">
              {/* TAB 1: بيانات الموردين (All / Overview) */}
              {bulkActiveTab === 'all' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Action Cards Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: بيانات كل الموردين */}
                    <button
                      type="button"
                      onClick={handleResetBulkFilters}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px] ${
                        !bulkFilterPurchaser && !bulkFilterArea && !bulkFilterCategory && !bulkFilterClassification && bulkFilterStatus === 'all' && bulkFilterCreditPurchases === 'all'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <h4 className="text-sm font-bold mb-1">بيانات كل الموردين</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({nonDeletedVendors.length} مورد مسجل)</p>
                    </button>

                    {/* Card 2: عدد الموردين بكل منطقة */}
                    <button
                      type="button"
                      onClick={() => setBulkActiveTab('area')}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950 text-slate-200 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px]"
                    >
                      <h4 className="text-sm font-bold mb-1">عدد الموردين بكل منطقة</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({availableAreas.length} مناطق جغرافية)</p>
                    </button>

                    {/* Card 3: عدد الموردين لكل مسؤول مشتريات */}
                    <button
                      type="button"
                      onClick={() => setBulkActiveTab('purchaser')}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950 text-slate-200 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px]"
                    >
                      <h4 className="text-sm font-bold mb-1">عدد الموردين لكل مسؤول مشتريات</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({availablePurchasers.length} مسؤولي مشتريات)</p>
                    </button>

                    {/* Card 4: المسموح لهم بالشراء الآجل */}
                    <button
                      type="button"
                      onClick={() => {
                        setBulkFilterCreditPurchases(bulkFilterCreditPurchases === 'allowed' ? 'all' : 'allowed');
                      }}
                      className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[95px] ${
                        bulkFilterCreditPurchases === 'allowed'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/70 border-slate-800 text-slate-200 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <h4 className="text-sm font-bold mb-1">المسموح لهم بالشراء الآجل</h4>
                      <p className="text-[11px] text-slate-400 font-mono">({creditPurchasesAllowedCount} مورد معتمد)</p>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: الموردين وفقاً لمنطقة (By Area) */}
              {bulkActiveTab === 'area' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      <span>تصفية الموردين حسب المنطقة الجغرافية</span>
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
                        {nonDeletedVendors.length}
                      </span>
                    </button>

                    {availableAreas.map((area) => {
                      const count = nonDeletedVendors.filter(v => v.area === area).length;
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

              {/* TAB 3: الموردين وفقاً لمسؤول المشتريات (By Purchaser) */}
              {bulkActiveTab === 'purchaser' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-400" />
                      <span>تصفية الموردين حسب مسؤول المشتريات المخصص</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setBulkFilterPurchaser('')}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                    >
                      عرض جميع مسؤولي المشتريات
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setBulkFilterPurchaser('')}
                      className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                        !bulkFilterPurchaser
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">جميع مسؤولي المشتريات</span>
                      <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                        {nonDeletedVendors.length}
                      </span>
                    </button>

                    {availablePurchasers.map((purchaser) => {
                      const count = nonDeletedVendors.filter(v => v.assignedPurchaser === purchaser).length;
                      const isSelected = bulkFilterPurchaser === purchaser;
                      return (
                        <button
                          key={purchaser}
                          type="button"
                          onClick={() => setBulkFilterPurchaser(isSelected ? '' : purchaser)}
                          className={`p-3 rounded-lg border text-right transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold truncate ml-2">{purchaser}</span>
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

              {/* TAB 4: نوع ونطاق المورد / الفئة (By Category) */}
              {bulkActiveTab === 'category' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-400" />
                      <span>تصفية الموردين حسب نوع ونطاق التعامل وفئة المورد</span>
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
                    {[
                      { key: 'Local', label: 'مورد محلي (Local)', desc: 'توريدات ومشتريات محلية' },
                      { key: 'International', label: 'مورد دولي (International)', desc: 'استيراد وشحن خارجي' },
                      { key: 'Corporate', label: 'شركات وتوكيلات (Corporate)', desc: 'مصانع ومؤسسات كبرى' },
                      { key: 'VIP', label: 'كبار الموردين (VIP)', desc: 'موردون استراتيجيون معتمدون' },
                    ].map((cat) => {
                      const count = nonDeletedVendors.filter(v => v.category === cat.key).length;
                      const isSelected = bulkFilterCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setBulkFilterCategory(isSelected ? '' : cat.key)}
                          className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold">{cat.label}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded font-mono ${
                              isSelected ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-slate-800 text-slate-300'
                            }`}>
                              {count}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{cat.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: تصنيف التوريد (Classification) */}
              {bulkActiveTab === 'classification' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <ListFilter className="w-4 h-4 text-amber-400" />
                      <span>تصفية الموردين حسب تصنيف ونشاط التوريد</span>
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
                        {nonDeletedVendors.length}
                      </span>
                    </button>

                    {availableClassifications.map((cls) => {
                      const count = nonDeletedVendors.filter(v => v.type === cls).length;
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
                      <span>تصفية الموردين حسب الحالة التشغيلية وسياسة الشراء الآجل</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBulkFilterStatus('all');
                        setBulkFilterCreditPurchases('all');
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
                        <span className="text-xs font-bold">الموردين النشطين</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300">
                          {activeVendorsCount}
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
                        <span className="text-xs font-bold">الموردين الموقوفين</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-slate-800 text-slate-300">
                          {totalVendorsCount - activeVendorsCount}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">حسابات مجمدة أو غير نشطة</span>
                    </button>

                    {/* مسموح بالشراء الآجل */}
                    <button
                      type="button"
                      onClick={() => setBulkFilterCreditPurchases(bulkFilterCreditPurchases === 'allowed' ? 'all' : 'allowed')}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        bulkFilterCreditPurchases === 'allowed'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">الشراء الآجل مسموح</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300">
                          {creditPurchasesAllowedCount}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">موردون بحد ائتماني معتمد</span>
                    </button>

                    {/* غير مسموح بالآجل (نقدي فقط) */}
                    <button
                      type="button"
                      onClick={() => setBulkFilterCreditPurchases(bulkFilterCreditPurchases === 'blocked' ? 'all' : 'blocked')}
                      className={`p-3.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        bulkFilterCreditPurchases === 'blocked'
                          ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-bold shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold">نقدي فقط (بدون آجل)</span>
                        <span className="text-[11px] px-2 py-0.5 rounded font-mono bg-rose-500/20 text-rose-300">
                          {totalVendorsCount - creditPurchasesAllowedCount}
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
                    {filteredBulkVendors.length} مورد
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">إجمالي سقف الائتمان:</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {filteredBulkVendors.reduce((acc, v) => acc + (v.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">الترتيب النشط:</span>
                  <span className="text-amber-300 font-semibold">
                    {bulkSortBy === 'alphabetical' && 'أبجدي (بالاسم)'}
                    {bulkSortBy === 'code' && 'تصاعدي (بالكود)'}
                    {bulkSortBy === 'area' && 'جغرافي (بالمنطقة)'}
                    {bulkSortBy === 'purchaser' && 'حسب مسؤول المشتريات'}
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
                        <th className="py-2 px-3 font-semibold">كود المورد</th>
                        <th className="py-2 px-3 font-semibold">اسم المورد</th>
                        <th className="py-2 px-3 font-semibold">رقم الموبايل</th>
                        <th className="py-2 px-3 font-semibold">المنطقة</th>
                        <th className="py-2 px-3 font-semibold">مسؤول المشتريات</th>
                        <th className="py-2 px-3 font-semibold">التصنيف / الفئة</th>
                        <th className="py-2 px-3 font-semibold text-center">الحالة</th>
                        <th className="py-2 px-3 font-semibold text-left">حد الائتمان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredBulkVendors.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center space-y-1">
                              <AlertTriangle className="w-5 h-5 text-amber-400/60" />
                              <p className="font-bold text-xs">لا توجد سجلات تطابق الفلاتر المحددة</p>
                              <p className="text-[11px] text-slate-500">يرجى تعديل أو تفريغ الفلاتر لعرض الموردين</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredBulkVendors.map((v, idx) => (
                          <tr key={v.id} className="hover:bg-slate-900/50 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-bold text-amber-400">{v.code}</td>
                            <td className="py-2 px-3 font-bold text-slate-100">{v.name}</td>
                            <td className="py-2 px-3 font-mono text-slate-300 dir-ltr text-right">{v.mobile || '-'}</td>
                            <td className="py-2 px-3 text-slate-300">{v.area || '-'}</td>
                            <td className="py-2 px-3 text-slate-300">{v.assignedPurchaser || '-'}</td>
                            <td className="py-2 px-3">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                                {v.category || v.type || '-'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                v.status === 'نشط' || v.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {v.status === 'نشط' || v.status === 'active' ? 'نشط' : 'غير نشط'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-200 text-left">
                              {(v.creditLimit || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
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
                  disabled={filteredBulkVendors.length === 0}
                  onClick={handleExecuteBulkPrint}
                  className={`px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                    filteredBulkVendors.length > 0
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                  <span>تنفيذ طباعة التقرير ({filteredBulkVendors.length} مورد)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2.1 BULK VENDORS REPORT PRINT PREVIEW MODAL */}
      {showBulkPrintPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-6xl shadow-2xl dir-rtl text-right flex flex-col max-h-[94vh] overflow-hidden animate-in zoom-in-95 duration-200 font-sans">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 shrink-0">
              <div className="flex items-center space-x-3 space-x-reverse">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>معاينة طباعة — كشف وتقارير الموردين المعتمدين</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {filteredBulkVendors.length} مورد
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
                      تقرير بيانات وسجلات الموردين المعتمدين (Vendor Master Records Report)
                    </h2>
                    <p className="text-xs text-slate-600 mt-1">
                      نظام Vertex ERP — سجل الموردين الموحد
                    </p>
                    <div className="text-[11px] text-slate-600 mt-2 flex flex-wrap gap-2">
                      <span className="font-semibold"><strong>عدد السجلات في التقرير:</strong> {filteredBulkVendors.length} مورد</span>
                      {bulkFilterPurchaser && <span className="text-slate-700">| <strong>مسؤول المشتريات:</strong> {bulkFilterPurchaser}</span>}
                      {bulkFilterArea && <span className="text-slate-700">| <strong>المنطقة:</strong> {bulkFilterArea}</span>}
                      {bulkFilterCategory && <span className="text-slate-700">| <strong>الفئة/النطاق:</strong> {bulkFilterCategory}</span>}
                      {bulkFilterClassification && <span className="text-slate-700">| <strong>التصنيف:</strong> {bulkFilterClassification}</span>}
                      {bulkFilterStatus !== 'all' && <span className="text-slate-700">| <strong>الحالة:</strong> {bulkFilterStatus}</span>}
                      {bulkFilterCreditPurchases !== 'all' && <span className="text-slate-700">| <strong>الشراء الآجل:</strong> {bulkFilterCreditPurchases === 'allowed' ? 'مسموح' : 'غير مسموح'}</span>}
                    </div>
                  </div>
                  <div className="text-left text-xs text-slate-500 font-mono">
                    <p className="m-0">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                    <p className="mt-1">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
                  </div>
                </div>

                {/* Main Vendors Table */}
                <table className="w-full border-collapse mb-6 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-bold">
                      <th className="p-2 border border-slate-300 text-center w-[4%]">م</th>
                      <th className="p-2 border border-slate-300 text-center w-[11%]">كود المورد</th>
                      <th className="p-2 border border-slate-300 text-right w-[22%]">اسم المورد</th>
                      <th className="p-2 border border-slate-300 text-center w-[11%]">الموبايل</th>
                      <th className="p-2 border border-slate-300 text-right w-[11%]">المنطقة</th>
                      <th className="p-2 border border-slate-300 text-right w-[11%]">مسؤول المشتريات</th>
                      <th className="p-2 border border-slate-300 text-center w-[9%]">التصنيف</th>
                      <th className="p-2 border border-slate-300 text-center w-[7%]">الحالة</th>
                      <th className="p-2 border border-slate-300 text-center w-[6%]">الخصم</th>
                      <th className="p-2 border border-slate-300 text-left w-[8%]">حد الائتمان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBulkVendors.map((vendor, idx) => (
                      <tr key={vendor.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="p-1.5 border border-slate-300 text-center font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-slate-900">{vendor.code}</td>
                        <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{vendor.name}</td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono text-[11px]">{vendor.mobile || '-'}</td>
                        <td className="p-1.5 border border-slate-300">{vendor.area || '-'}</td>
                        <td className="p-1.5 border border-slate-300">{vendor.assignedPurchaser || '-'}</td>
                        <td className="p-1.5 border border-slate-300 text-center">{vendor.category || vendor.type || '-'}</td>
                        <td className="p-1.5 border border-slate-300 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            vendor.status === 'نشط' || vendor.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {vendor.status === 'نشط' || vendor.status === 'active' ? 'نشط' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="p-1.5 border border-slate-300 text-center font-mono">{vendor.discountRate ? `${vendor.discountRate <= 1 ? Math.round(vendor.discountRate * 10000) / 100 : vendor.discountRate}%` : '0%'}</td>
                        <td className="p-1.5 border border-slate-300 text-left font-mono font-bold">
                          {(vendor.creditLimit || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-200 font-bold text-slate-900">
                      <td colSpan={8} className="p-2 border border-slate-300 text-right">
                        إجمالي عدد الموردين في التقرير: {filteredBulkVendors.length} مورد
                      </td>
                      <td className="p-2 border border-slate-300 text-center">-</td>
                      <td className="p-2 border border-slate-300 text-left font-mono">
                        {filteredBulkVendors.reduce((acc, v) => acc + (v.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Signatures */}
                <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-600">
                  <div>توقيع موظف الحسابات: ............................</div>
                  <div>اعتماد مدير قسم المشتريات والحسابات: ............................</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                عدد السجلات في التقرير: <strong className="text-amber-400 font-mono">{filteredBulkVendors.length}</strong> مورد | إجمالي سقف الائتمان: <strong className="text-slate-200 font-mono">{filteredBulkVendors.reduce((acc, v) => acc + (v.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م</strong>
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

      {/* Confirmation Modal: Unsaved Changes */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-right font-sans space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100">تغييرات غير محفوظة</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              هناك تعديلات قيد الإدخال في نموذج بيانات المورد لم تقم بحفظها. هل تود تجاهل التغييرات والمتابعة؟
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={handleCancelDiscard}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                العودة للنموذج
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold"
              >
                تجاهل التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Cancel / Reset Form */}
      {showCancelVendorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-right font-sans space-y-4">
            <div className="flex items-center space-x-2 space-x-reverse text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100">إلغاء التعديلات</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في إلغاء التعديلات وتفريغ النموذج؟
            </p>
            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowCancelVendorModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelVendor}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                تأكيد الإلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor View / Edit Modal Overlay */}
      <VendorViewEditModal
        isOpen={!!viewEditVendor}
        vendor={viewEditVendor}
        onClose={() => setViewEditVendor(null)}
        onSaved={(updated) => {
          refreshVendorList();
          handleLoadVendorIntoForm(updated);
        }}
        zIndexClass="z-50"
      />

      {/* Vendor Records Modal */}
      <VendorRecordsModal
        isOpen={showVendorRecordsModal}
        onClose={() => setShowVendorRecordsModal(false)}
        onLoadVendorIntoForm={handleLoadVendorIntoForm}
        loadedVendorId={loadedVendor?.id}
      />

      {/* 1. HIDDEN PRINTABLE SINGLE VENDOR CARD CONTAINER */}
      {printMode === 'single' && (
        <div id="printable-vendor-card" className="print-only hidden print:block">
          <div style={{ textAlign: 'right', direction: 'rtl', fontFamily: 'sans-serif' }}>
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                  بطاقة بيانات مورد (Vendor Master Record Card)
                </h2>
                <p style={{ fontSize: '9.5pt', color: '#475569', margin: '3px 0 0 0' }}>
                  نظام Vertex ERP — سجل الموردين المعتمدين
                </p>
              </div>
              <div style={{ textAlign: 'left', fontSize: '8.5pt', color: '#64748b' }}>
                <p style={{ margin: 0 }}>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
                <p style={{ margin: '2px 0 0 0' }}>الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '9.5pt' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', width: '22%' }}>كود المورد:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', width: '28%', fontFamily: 'monospace', fontWeight: 'bold' }}>{formCode}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', width: '22%' }}>اسم المورد:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', width: '28%', fontWeight: 'bold' }}>{formName}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>رقم الموبايل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formMobile || '-'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>الهاتف 2:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formPhone2 || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>فئة ونطاق المورد:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formCategory}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>تصنيف التوريد:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formVendorType || 'عام'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>الرقم الضريبي:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formTaxNumber || '-'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>السجل التجاري:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formCommercialRegister || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>الحد الائتماني للمشتريات:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontWeight: 'bold' }}>{formCreditLimit ? `${formCreditLimit} ج.م` : '0.00 ج.م'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>السماح بالشراء الآجل:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formAllowCreditPurchases ? 'مسموح' : 'نقدي فقط'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>نسبة الخصم التجاري:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formDiscount ? `${formDiscount}%` : '0%'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>الحالة التشغيلية:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formStatus}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>المنطقة الجغرافية:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formArea || '-'}</td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>مسؤول المشتريات:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formAssignedPurchaser || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>العنوان التفصيلي:</td>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formAddress || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>رصيد أول المدة:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>
                    {formOpeningBalance ? `${formOpeningBalance} ج.م (${formOpeningBalanceType})` : '0.00 ج.م'}
                  </td>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>تاريخ رصيد أول المدة:</td>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace' }}>{formatDateForDisplay(formOpeningBalanceDate)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', fontWeight: 'bold', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1' }}>ملاحظات:</td>
                  <td colSpan={3} style={{ padding: '8px', border: '1px solid #cbd5e1' }}>{formNotes || '-'}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '30px', paddingTop: '16px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '10pt', color: '#475569' }}>
              <div>توقيع موظف الحسابات: ............................</div>
              <div>اعتماد مدير قسم المشتريات: ............................</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. HIDDEN PRINTABLE BULK VENDORS LIST CONTAINER */}
      {printMode === 'bulk' && (
        <div id="printable-vendors-list" className="print-only hidden print:block">
          <div style={{ textAlign: 'right', direction: 'rtl', fontFamily: 'sans-serif' }}>
            {/* Report Header */}
            <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0, color: '#0f172a' }}>
                  تقرير بيانات وسجلات الموردين المعتمدين (Vendor Master Records Report)
                </h2>
                <p style={{ fontSize: '9.5pt', color: '#475569', margin: '3px 0 0 0' }}>
                  نظام Vertex ERP — سجل الموردين الموحد
                </p>
                <div style={{ fontSize: '8.5pt', color: '#64748b', marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  <span><strong>عدد السجلات في التقرير:</strong> {filteredBulkVendors.length} مورد</span>
                  {bulkFilterPurchaser && <span><strong>مسؤول المشتريات:</strong> {bulkFilterPurchaser}</span>}
                  {bulkFilterArea && <span><strong>المنطقة:</strong> {bulkFilterArea}</span>}
                  {bulkFilterCategory && <span><strong>الفئة/النطاق:</strong> {bulkFilterCategory}</span>}
                  {bulkFilterClassification && <span><strong>التصنيف:</strong> {bulkFilterClassification}</span>}
                  {bulkFilterStatus !== 'all' && <span><strong>الحالة:</strong> {bulkFilterStatus}</span>}
                  {bulkFilterCreditPurchases !== 'all' && <span><strong>الشراء الآجل:</strong> {bulkFilterCreditPurchases === 'allowed' ? 'مسموح' : 'غير مسموح'}</span>}
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
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '11%' }}>كود المورد</th>
                  <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', width: '22%' }}>اسم المورد</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '11%' }}>الموبايل</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '11%' }}>المنطقة</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'right', width: '11%' }}>مسؤول المشتريات</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '9%' }}>التصنيف</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '7%' }}>الحالة</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center', width: '6%' }}>الخصم</th>
                  <th style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'left', width: '8%' }}>حد الائتمان</th>
                </tr>
              </thead>
              <tbody>
                {filteredBulkVendors.map((vendor, idx) => (
                  <tr key={vendor.id} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>{vendor.code}</td>
                    <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{vendor.name}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>{vendor.mobile || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1' }}>{vendor.area || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1' }}>{vendor.assignedPurchaser || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{vendor.category || vendor.type || '-'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{vendor.status === 'نشط' || vendor.status === 'active' ? 'نشط' : 'غير نشط'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'center', fontFamily: 'monospace' }}>{vendor.discountRate ? `${vendor.discountRate <= 1 ? Math.round(vendor.discountRate * 10000) / 100 : vendor.discountRate}%` : '0%'}</td>
                    <td style={{ padding: '5px 6px', border: '1px solid #cbd5e1', textAlign: 'left', fontFamily: 'monospace' }}>{(vendor.creditLimit || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
                  <td colSpan={8} style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>
                    إجمالي عدد الموردين: {filteredBulkVendors.length} مورد
                  </td>
                  <td style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'center' }}>-</td>
                  <td style={{ padding: '6px 6px', border: '1px solid #cbd5e1', textAlign: 'left', fontFamily: 'monospace' }}>
                    {filteredBulkVendors.reduce((acc, v) => acc + (v.creditLimit || 0), 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#475569' }}>
              <div>توقيع موظف الحسابات: ............................</div>
              <div>اعتماد مدير قسم المشتريات والحسابات: ............................</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
