import React, { useState, useEffect, useRef } from 'react';
import { 
  treasuryService, 
  Treasury, 
  SystemUserOption 
} from '../../services/treasuryService';
import { UnifiedMessageOverlay } from '../common/UnifiedMessageOverlay';
import { FormInput, FormSelect } from '../common';
import { TreasuryRecordsModal } from './TreasuryRecordsModal';
import { TreasuryStatementModal } from './TreasuryStatementModal';
import { StandardActionBar } from '../common/StandardActionBar';
import { BranchItem } from '../../types';
import { 
  Vault, 
  Building2, 
  Users, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Coins, 
  Lock, 
  X, 
  Check, 
  Eye, 
  Plus, 
  Save,
  RotateCcw,
  SlidersHorizontal,
  ArrowRight,
  UserCheck,
  FileText
} from 'lucide-react';

const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const ARABIC_DAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

// Helper for today's date formatted as YYYY-MM-DD
const getTodayIsoDate = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Styled label box matching compact input height (h-8) and theme for unified alignment
const FieldLabelBox: React.FC<{
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
}> = ({ label, required, icon }) => (
  <div className="h-8 px-3 rounded-lg border border-slate-700/80 bg-slate-800/50 text-slate-200 flex items-center justify-center space-x-2 space-x-reverse text-xs font-bold select-none w-full shadow-2xs font-['Cairo',sans-serif]">
    {icon && <span className="inline-flex shrink-0 text-slate-400">{icon}</span>}
    <span>{label}</span>
    {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
  </div>
);

export interface TreasuryMasterViewProps {
  initialTreasuryId?: string;
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}

export const TreasuryMasterView: React.FC<TreasuryMasterViewProps> = ({
  initialTreasuryId,
  onClose,
  onNavigateSection
}) => {
  const [treasuries, setTreasuries] = useState<Treasury[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SystemUserOption[]>([]);
  
  // Active Loaded Treasury (Null = New Treasury Mode, Treasury = Edit Mode)
  const [loadedTreasury, setLoadedTreasury] = useState<Treasury | null>(null);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);

  // Form Fields State
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formBranchId, setFormBranchId] = useState<string>('BR-01');
  const [formCurrency, setFormCurrency] = useState<string>('جنيه مصري');
  const [formExchangeRate, setFormExchangeRate] = useState<number>(1.00);
  const [formAllowedUsersType, setFormAllowedUsersType] = useState<'all' | 'specific'>('all');
  const [formAllowedUserIds, setFormAllowedUserIds] = useState<string[]>([]);
  const [formOpeningBalance, setFormOpeningBalance] = useState<string>('');
  const [formOpeningBalanceDate, setFormOpeningBalanceDate] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [formNotes, setFormNotes] = useState<string>('');

  // Modals and Alerts
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [showStatementModal, setShowStatementModal] = useState<boolean>(false);
  const [statementTreasury, setStatementTreasury] = useState<Treasury | null>(null);
  const [showDeleteBlockedModal, setShowDeleteBlockedModal] = useState<{ isOpen: boolean; msg: string }>({ isOpen: false, msg: '' });
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<{ isOpen: boolean; treasury: Treasury | null }>({ isOpen: false, treasury: null });

  // Notifications State (Unified with Customer & Vendor Master Views)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Calendar Popup State for Opening Balance Date
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [calendarViewDate, setCalendarViewDate] = useState<Date>(new Date());
  const datePickerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Track Unsaved Changes
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const refreshData = () => {
    const list = treasuryService.getAllTreasuries();
    setTreasuries(list);
    setBranches(treasuryService.getAvailableBranches());
    setAvailableUsers(treasuryService.getAvailableUsers());
    return list;
  };

  const clearEmptyState = () => {
    setLoadedTreasury(null);
    setCurrentRecordIndex(-1);
    setFormCode('');
    setFormName('');
    setFormBranchId('');
    setFormCurrency('جنيه مصري');
    setFormExchangeRate(1.00);
    setFormAllowedUsersType('all');
    setFormAllowedUserIds([]);
    setFormOpeningBalance('');
    setFormOpeningBalanceDate('');
    setFormStatus('نشط');
    setFormNotes('');
    setIsDirty(false);
    setShowDatePicker(false);
  };

  useEffect(() => {
    const list = refreshData();
    const unsub = treasuryService.subscribe(() => {
      refreshData();
    });

    if (initialTreasuryId) {
      const found = treasuryService.getTreasuryById(initialTreasuryId);
      if (found) {
        loadTreasuryIntoForm(found, list);
      } else {
        clearEmptyState();
      }
    } else {
      if (list.length > 0) {
        loadTreasuryIntoForm(list[0], list);
      } else {
        clearEmptyState();
      }
    }

    return () => unsub();
  }, [initialTreasuryId]);

  // Click outside to close date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetToNewMode = () => {
    const nextCode = treasuryService.getNextTreasuryCode();
    setLoadedTreasury(null);
    setCurrentRecordIndex(-1);
    setFormCode(nextCode);
    setFormName('');
    setFormBranchId(branches[0]?.id || '');
    setFormCurrency('جنيه مصري');
    setFormExchangeRate(1.00);
    setFormAllowedUsersType('all');
    setFormAllowedUserIds([]);
    setFormOpeningBalance('');
    setFormOpeningBalanceDate('');
    setFormStatus('نشط');
    setFormNotes('');
    setIsDirty(false);
    setShowDatePicker(false);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const loadTreasuryIntoForm = (treasury: Treasury, list?: Treasury[]) => {
    const currentList = list || treasuries;
    const idx = currentList.findIndex(t => t.id === treasury.id);
    setCurrentRecordIndex(idx);
    setLoadedTreasury(treasury);
    setFormCode(treasury.code);
    setFormName(treasury.name);
    setFormBranchId(treasury.branchId);
    setFormCurrency(treasury.currency || 'جنيه مصري');
    setFormExchangeRate(treasury.exchangeRate || 1.00);
    setFormAllowedUsersType(treasury.allowedUsersType);
    setFormAllowedUserIds(treasury.allowedUserIds || []);
    setFormOpeningBalance(treasury.openingBalance > 0 ? treasury.openingBalance.toString() : '');
    setFormOpeningBalanceDate(treasury.openingBalanceDate || '');
    setFormStatus(treasury.status === 'inactive' || treasury.status === 'غير نشط' ? 'غير نشط' : 'نشط');
    setFormNotes(treasury.notes || '');
    setIsDirty(false);
    setShowDatePicker(false);
  };

  // Navigator Handlers (Organizer style record stepper)
  const handleNavFirst = () => {
    if (treasuries.length > 0) loadTreasuryIntoForm(treasuries[0]);
  };
  const handleNavPrev = () => {
    if (treasuries.length === 0) return;
    const targetIdx = currentRecordIndex > 0 ? currentRecordIndex - 1 : treasuries.length - 1;
    loadTreasuryIntoForm(treasuries[targetIdx]);
  };
  const handleNavNext = () => {
    if (treasuries.length === 0) return;
    const targetIdx = currentRecordIndex >= 0 && currentRecordIndex < treasuries.length - 1 ? currentRecordIndex + 1 : 0;
    loadTreasuryIntoForm(treasuries[targetIdx]);
  };
  const handleNavLast = () => {
    if (treasuries.length > 0) loadTreasuryIntoForm(treasuries[treasuries.length - 1]);
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    if (type === 'error') {
      setFormError(message);
    } else {
      setToastMessage(message);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setIsDirty(true);
    setFormAllowedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setIsDirty(true);
    setFormAllowedUserIds(availableUsers.map(u => u.id));
  };

  const clearAllUsers = () => {
    setIsDirty(true);
    setFormAllowedUserIds([]);
  };

  // SAVE HANDLER (Enforces exact strict financial validation rules)
  const handleSave = () => {
    const rawBalance = formOpeningBalance.trim() ? parseFloat(formOpeningBalance) : 0;
    const cleanDate = formOpeningBalanceDate.trim();

    // 1. Mandatory Name
    if (!formName.trim()) {
      showToast('error', 'حقل إجباري مطلوب', 'يرجى إدخال اسم الخزينة.');
      nameInputRef.current?.focus();
      return;
    }

    // 2. Strict Opening Balance and Date Pairing Rules
    // Rule A: Balance entered (>0) but date is missing -> ERROR
    if (rawBalance > 0 && !cleanDate) {
      showToast('error', 'خطأ في الرصيد الافتتاحي', 'تم إدخال رصيد افتتاحي بدون تحديد تاريخ الرصيد. يرجى تحديد تاريخ الرصيد الافتتاحي.');
      return;
    }

    // Rule B: Date entered but balance is missing or 0 -> ERROR
    if (cleanDate && (isNaN(rawBalance) || rawBalance <= 0)) {
      showToast('error', 'خطأ في تاريخ الرصيد', 'تم تحديد تاريخ للرصيد الافتتاحي بدون إدخال قيمة الرصيد الافتتاحي. يرجى إدخال قيمة الرصيد.');
      return;
    }

    // Rule C: Specific users with zero selected
    if (formAllowedUsersType === 'specific' && formAllowedUserIds.length === 0) {
      showToast('error', 'تحديد المستخدمين', 'عند اختيار "مستخدمون محددون"، يجب اختيار مستخدم واحد على الأقل مصرح له.');
      return;
    }

    const selectedBranch = branches.find(b => b.id === formBranchId) || branches[0];
    const branchId = selectedBranch?.id || 'BR-01';
    const branchName = selectedBranch?.name || 'الفرع الرئيسي';
    const finalCode = formCode.trim() || treasuryService.getNextTreasuryCode();

    const treasuryData = {
      code: finalCode,
      name: formName.trim(),
      branchId,
      branchName,
      currency: formCurrency,
      exchangeRate: formExchangeRate || 1.00,
      allowedUsersType: formAllowedUsersType,
      allowedUserIds: formAllowedUsersType === 'all' ? [] : formAllowedUserIds,
      openingBalance: isNaN(rawBalance) ? 0 : rawBalance,
      openingBalanceDate: cleanDate || undefined,
      status: formStatus === 'نشط' ? ('نشط' as const) : ('غير نشط' as const),
      notes: formNotes.trim() || undefined
    };

    if (loadedTreasury) {
      // EDIT MODE
      const res = treasuryService.updateTreasury(loadedTreasury.id, treasuryData);
      if (!res.success) {
        showToast('error', 'تعذر حفظ التعديلات', res.error || 'حدث خطأ أثناء تعديل بيانات الخزينة.');
        return;
      }

      const updatedName = res.treasury?.name || formName;
      const updatedCode = res.treasury?.code || formCode;
      resetToNewMode();
      showToast('success', 'تم حفظ التعديلات', `تم تحديث بيانات الخزينة [${updatedCode}] (${updatedName}) بنجاح.`);
    } else {
      // NEW TREASURY MODE (Sequential recording workflow: Save -> Reset -> Create New Record)
      const res = treasuryService.createTreasury(treasuryData);
      if (!res.success) {
        showToast('error', 'تعذر إضافة الخزينة', res.error || 'حدث خطأ أثناء إضافة الخزينة الجديدة.');
        return;
      }

      const savedName = res.treasury?.name || formName;
      const savedCode = res.treasury?.code || formCode;
      resetToNewMode();
      showToast('success', 'تم إضافة الخزينة بنجاح', `تم حفظ وتسجيل الخزينة [${savedCode}] (${savedName}) بنجاح.`);
    }
  };

  // DELETE HANDLER (Strict rule: Block deletion if treasury has any financial transactions)
  const handleDeleteClick = () => {
    if (!loadedTreasury) {
      showToast('warning', 'تنبيه', 'يرجى اختيار خزينة مسجلة أولاً من الجدول لحذفها.');
      return;
    }

    const check = treasuryService.canDeleteTreasury(loadedTreasury.id);
    if (!check.canDelete) {
      setShowDeleteBlockedModal({
        isOpen: true,
        msg: check.reason || 'لا يمكن حذف الخزينة لوجود حركات مالية أو قيود محاسبية مسجلة عليها.'
      });
      return;
    }

    setShowDeleteConfirmModal({
      isOpen: true,
      treasury: loadedTreasury
    });
  };

  const confirmDelete = () => {
    if (!showDeleteConfirmModal.treasury) return;
    const t = showDeleteConfirmModal.treasury;
    const res = treasuryService.deleteTreasury(t.id);
    setShowDeleteConfirmModal({ isOpen: false, treasury: null });

    if (res.success) {
      showToast('warning', 'تم حذف الخزينة', `تم حذف الخزينة [${t.code}] ${t.name} بنجاح.`);
      resetToNewMode();
    } else {
      showToast('error', 'فشل في الحذف', res.error || 'تعذر حذف الخزينة.');
    }
  };

  // VIEW HANDLER (Always opens the standard Treasury Records List / Selector Modal)
  const handleViewStatementClick = () => {
    setShowRecordsModal(true);
  };

  // Date Picker Helper Methods
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handleSelectDay = (day: number) => {
    const year = calendarViewDate.getFullYear();
    const month = String(calendarViewDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setFormOpeningBalanceDate(`${year}-${month}-${dayStr}`);
    setShowDatePicker(false);
    setIsDirty(true);
  };

  const handleCloseScreen = () => {
    if (onClose) {
      onClose();
    } else if (onNavigateSection) {
      onNavigateSection('settings');
    }
  };

  return (
    <div 
      className="flex flex-col font-['Cairo',sans-serif] w-full select-none"
      dir="rtl"
    >
      
      {/* ========================================================= */}
      {/* WINDOW / SCREEN CONTAINER                                 */}
      {/* ========================================================= */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full">
        
        {/* 1. WINDOW TITLE BAR */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 font-['Cairo',sans-serif]">
          {/* Right Icon */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Vault className="w-4 h-4 sm:w-5 h-5" />
            </div>
          </div>

          {/* Center: Title Centered, Bigger, Bold, Cairo Font */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
              بيانات الخزن
            </h2>
          </div>

          {/* Left: Status Badge and Close Button */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${
              loadedTreasury 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {loadedTreasury ? `[${loadedTreasury.code}]` : (formCode ? 'إضافة جديدة' : 'سجل جديد')}
            </span>
            <button
              type="button"
              onClick={handleCloseScreen}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="إغلاق الشاشة"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. TOP DATA ENTRY FORM: CODE, NAME, BRANCH, STATUS        */}
        {/* ========================================================= */}
        <div className="p-2.5 sm:p-3 space-y-2 border-b border-slate-800 bg-slate-900/70">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 items-center">
            
            {/* 1. كود الخزينة */}
            <div className="md:col-span-2">
              <FieldLabelBox label="كود الخزينة :" />
            </div>
            <div className="md:col-span-10 flex items-center space-x-2 space-x-reverse">
              <div className="w-36 sm:w-44">
                <FormInput
                  type="text"
                  value={formCode}
                  readOnly
                  variant="readonly-code"
                  icon={<Lock className="w-3.5 h-3.5 text-blue-400" />}
                  className="text-center font-mono font-bold !h-8 !py-1 text-xs"
                />
              </div>
              
              <button
                type="button"
                onClick={() => setShowRecordsModal(true)}
                title="بحث واختيار من سجل الخزائن"
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse text-xs font-bold shrink-0 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث في الخزائن</span>
              </button>
            </div>

            {/* 2. اسم الخزينة */}
            <div className="md:col-span-2">
              <FieldLabelBox label="اسم الخزينة :" required />
            </div>
            <div className="md:col-span-10">
              <FormInput
                ref={nameInputRef}
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setIsDirty(true);
                }}
                className="!h-8 !py-1 text-xs font-bold !bg-white !text-slate-900 !border-slate-300 placeholder-slate-400 focus:!border-amber-500 font-['Cairo',sans-serif]"
                required
              />
            </div>

            {/* 3. الفرع */}
            <div className="md:col-span-2">
              <FieldLabelBox 
                label="الفرع :" 
                required 
                icon={<Building2 className="w-3.5 h-3.5 text-amber-400/80" />}
              />
            </div>
            <div className="md:col-span-4">
              <FormSelect
                value={formBranchId}
                onChange={(e) => {
                  setFormBranchId(e.target.value);
                  setIsDirty(true);
                }}
                className="!h-8 !py-1 text-xs font-bold !bg-white !text-slate-900 !border-slate-300 focus:!border-amber-500 font-['Cairo',sans-serif]"
              >
                <option value="">-- اختر الفرع --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* 4. حالة الخزينة */}
            <div className="md:col-span-2">
              <FieldLabelBox label="حالة الخزينة :" required />
            </div>
            <div className="md:col-span-4 flex items-center">
              <div className="inline-flex h-8 p-0.5 bg-slate-950 border border-slate-800 rounded-lg space-x-1 space-x-reverse items-center">
                <button
                  type="button"
                  onClick={() => {
                    setFormStatus('نشط');
                    setIsDirty(true);
                  }}
                  className={`h-7 px-3.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    formStatus === 'نشط'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${formStatus === 'نشط' ? 'bg-emerald-400 ring-2 ring-emerald-500/30' : 'bg-slate-600'}`}></span>
                  <span>نشط</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormStatus('غير نشط');
                    setIsDirty(true);
                  }}
                  className={`h-7 px-3.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    formStatus === 'غير نشط'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${formStatus === 'غير نشط' ? 'bg-rose-400 ring-2 ring-rose-500/30' : 'bg-slate-600'}`}></span>
                  <span>غير نشط</span>
                </button>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* 3. MIDDLE DUAL SUB-SECTIONS (Organizer Structure) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-1">
            
            {/* LEFT / SECTION 1: USERS PERMISSIONS */}
            <div className="lg:col-span-5 border border-slate-700/80 bg-slate-950/70 rounded-xl p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 space-x-reverse text-slate-200">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-bold">المستخدمون المصرح لهم</span>
                  </div>
                </div>

                {/* Mode Selectors */}
                <div className="flex items-center space-x-4 space-x-reverse mb-1.5">
                  <label className="flex items-center space-x-1.5 space-x-reverse cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="userPermissionType"
                      checked={formAllowedUsersType === 'all'}
                      onChange={() => {
                        setFormAllowedUsersType('all');
                        setIsDirty(true);
                      }}
                      className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="font-bold">كل المستخدمين</span>
                  </label>

                  <label className="flex items-center space-x-1.5 space-x-reverse cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="userPermissionType"
                      checked={formAllowedUsersType === 'specific'}
                      onChange={() => {
                        setFormAllowedUsersType('specific');
                        setIsDirty(true);
                        if (formAllowedUserIds.length === 0) {
                          setFormAllowedUserIds(['USR-001']);
                        }
                      }}
                      className="accent-purple-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="font-bold">مستخدمون محددون</span>
                  </label>
                </div>

                {/* Specific Users Table List (Shown when 'specific' is active) */}
                {formAllowedUsersType === 'specific' ? (
                  <div className="space-y-1 border border-slate-800 rounded-lg p-1.5 bg-slate-900/60 max-h-28 overflow-y-auto">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
                      <span className="font-bold">المستخدم</span>
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <button
                          type="button"
                          onClick={selectAllUsers}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          تحديد الكل
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={clearAllUsers}
                          className="text-slate-400 hover:underline cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800/60">
                      {availableUsers.map(user => {
                        const isChecked = formAllowedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => toggleUserSelection(user.id)}
                            className={`py-1 px-1.5 flex items-center justify-between cursor-pointer rounded hover:bg-slate-800/60 transition-colors ${
                              isChecked ? 'bg-purple-950/30' : ''
                            }`}
                          >
                            <span className="text-xs text-slate-200 font-medium">
                              {user.fullName}
                            </span>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              isChecked ? 'bg-purple-600 border-purple-500 text-white' : 'border-slate-700 bg-slate-950'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="h-7 px-2.5 bg-slate-900/50 rounded-lg border border-slate-800 text-[11px] font-bold text-emerald-400 flex items-center space-x-1.5 space-x-reverse">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400 ml-1" />
                    <span>متاح لجميع مستخدمي النظام</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT / SECTION 2: OPENING BALANCE & FINANCIAL TABLE */}
            <div className="lg:col-span-7 border border-slate-700/80 bg-slate-950/70 rounded-xl p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 space-x-reverse text-slate-200">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold">الرصيد الافتتاحي وتفاصيل العملة</span>
                  </div>
                </div>

                {/* Organizer Financial Grid Layout */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700 text-[11px]">
                      <tr>
                        <th className="p-2 text-center">الرصيد الافتتاحي</th>
                        <th className="p-2 text-center">التاريخ</th>
                        <th className="p-2 text-center">العملة</th>
                        <th className="p-2 text-center">سعر الصرف</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/60 divide-y divide-slate-800">
                      <tr>
                        {/* الرصيد الافتتاحي */}
                        <td className="p-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formOpeningBalance}
                            onChange={(e) => {
                              setFormOpeningBalance(e.target.value);
                              setIsDirty(true);
                            }}
                            placeholder="0.00"
                            className="w-full bg-white border border-slate-300 rounded py-1 px-2 text-xs font-mono font-bold text-center text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                          />
                        </td>

                        {/* تاريخ الرصيد */}
                        <td className="p-1.5 relative" ref={datePickerRef}>
                          <div className="relative">
                            <input
                              type="text"
                              value={formOpeningBalanceDate}
                              onChange={(e) => {
                                setFormOpeningBalanceDate(e.target.value);
                                setIsDirty(true);
                              }}
                              placeholder="YYYY-MM-DD"
                              className="w-full bg-white border border-slate-300 rounded py-1 pr-2 pl-7 text-xs font-mono font-bold text-center text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setShowDatePicker(!showDatePicker)}
                              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-amber-500 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Date Picker Dropdown (Positioned safely above) */}
                          {showDatePicker && (
                            <div className="absolute bottom-full right-0 z-50 mb-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-2xl w-60">
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-xs font-bold text-slate-200">
                                <button
                                  type="button"
                                  onClick={() => setCalendarViewDate(new Date(calendarViewDate.setMonth(calendarViewDate.getMonth() - 1)))}
                                  className="p-1 hover:bg-slate-800 rounded"
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                                <span>
                                  {ARABIC_MONTHS[calendarViewDate.getMonth()]} {calendarViewDate.getFullYear()}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCalendarViewDate(new Date(calendarViewDate.setMonth(calendarViewDate.getMonth() + 1)))}
                                  className="p-1 hover:bg-slate-800 rounded"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 mb-1">
                                {ARABIC_DAYS.map((d, i) => (
                                  <span key={i}>{d}</span>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1 text-[11px]">
                                {Array.from({ length: getFirstDayOfMonth(calendarViewDate.getFullYear(), calendarViewDate.getMonth()) }).map((_, i) => (
                                  <div key={`empty-${i}`} />
                                ))}
                                {Array.from({ length: getDaysInMonth(calendarViewDate.getFullYear(), calendarViewDate.getMonth()) }).map((_, i) => {
                                  const dayNum = i + 1;
                                  return (
                                    <button
                                      key={dayNum}
                                      type="button"
                                      onClick={() => handleSelectDay(dayNum)}
                                      className="p-1 rounded hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-mono text-center transition-colors cursor-pointer"
                                    >
                                      {dayNum}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="mt-2 pt-1.5 border-t border-slate-800 flex justify-between">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormOpeningBalanceDate(getTodayIsoDate());
                                    setShowDatePicker(false);
                                    setIsDirty(true);
                                  }}
                                  className="text-[10px] text-amber-400 hover:underline font-bold"
                                >
                                  اليوم
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormOpeningBalanceDate('');
                                    setShowDatePicker(false);
                                    setIsDirty(true);
                                  }}
                                  className="text-[10px] text-slate-400 hover:underline font-bold"
                                >
                                  مسح
                                </button>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* العملة */}
                        <td className="p-1.5">
                          <select
                            value={formCurrency}
                            onChange={(e) => {
                              setFormCurrency(e.target.value);
                              setIsDirty(true);
                            }}
                            className="w-full bg-white border border-slate-300 rounded py-1 px-2 text-xs text-center text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs cursor-pointer font-bold font-['Cairo',sans-serif]"
                          >
                            <option value="جنيه مصري">جنيه مصري</option>
                            <option value="دولار أمريكي">دولار أمريكي</option>
                            <option value="ريال سعودي">ريال سعودي</option>
                            <option value="درهم إماراتي">درهم إماراتي</option>
                            <option value="يورو">يورو</option>
                          </select>
                        </td>

                        {/* سعر الصرف */}
                        <td className="p-1.5">
                          <input
                            type="number"
                            step="0.01"
                            value={formExchangeRate}
                            onChange={(e) => {
                              setFormExchangeRate(parseFloat(e.target.value) || 1.00);
                              setIsDirty(true);
                            }}
                            className="w-full bg-white border border-slate-300 rounded py-1 px-2 text-xs font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* Record Navigator Stepper */}
          <div className="flex items-center justify-between pt-1 px-1 border-t border-slate-800 text-xs">
            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                type="button"
                onClick={handleNavFirst}
                disabled={treasuries.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأول"
              >
                |◀
              </button>
              <button
                type="button"
                onClick={handleNavPrev}
                disabled={treasuries.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السابق"
              >
                ◀
              </button>
              <span className="h-7 px-3 bg-slate-950 font-mono text-amber-400 font-bold border border-slate-800 rounded-lg flex items-center justify-center text-xs">
                {currentRecordIndex >= 0 ? currentRecordIndex + 1 : 0} of {treasuries.length}
              </span>
              <button
                type="button"
                onClick={handleNavNext}
                disabled={treasuries.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="التالي"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={handleNavLast}
                disabled={treasuries.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأخير"
              >
                ▶|
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {loadedTreasury ? (
                <span>الخزينة المحددة للتعديل: <strong className="text-slate-200">{loadedTreasury.name}</strong></span>
              ) : formCode ? (
                <span className="text-emerald-400 font-bold">جاهز لإضافة خزينة جديدة</span>
              ) : (
                <span className="text-slate-500 font-medium">لا توجد خزن محفوظة — اضغط "جديد" للبدء</span>
              )}
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 4. BOTTOM ACTION BUTTONS (Standard Action Bar)            */}
        {/* ========================================================= */}
        <div className="pt-2 border-t border-slate-800 p-2 sm:p-2.5 bg-slate-900/90 font-['Cairo',sans-serif]">
          <StandardActionBar
            hasHold={false}
            gridCols={5}
            onNew={resetToNewMode}
            onSave={handleSave}
            onView={handleViewStatementClick}
            onDelete={handleDeleteClick}
            deleteDisabled={!loadedTreasury}
            onClose={handleCloseScreen}
            newLabel="1. جديد"
            saveLabel="2. حفظ السجل"
            viewLabel="3. عرض"
            deleteLabel="4. حذف"
            closeLabel="5. إغلاق"
          />
        </div>

      </div>

      {/* ========================================================= */}
      {/* 6. MODALS & DIALOGS */}
      {/* ========================================================= */}

      {/* A. RECORDS BROWSER MODAL (SEARCH & LOAD) */}
      <TreasuryRecordsModal
        isOpen={showRecordsModal}
        onClose={() => setShowRecordsModal(false)}
        onLoadTreasuryIntoForm={(t) => {
          loadTreasuryIntoForm(t);
          setShowRecordsModal(false);
        }}
        onViewTreasury={(t) => {
          setStatementTreasury(t);
          setShowStatementModal(true);
          setShowRecordsModal(false);
        }}
        loadedTreasuryId={loadedTreasury?.id}
      />

      {/* B. DETAILED ACCOUNT STATEMENT MODAL */}
      <TreasuryStatementModal
        isOpen={showStatementModal}
        onClose={() => {
          setShowStatementModal(false);
          setStatementTreasury(null);
        }}
        treasury={statementTreasury}
      />

      {/* C. DELETE BLOCKED INTEGRITY ALERT MODAL */}
      {showDeleteBlockedModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">حماية القيود والحسابات المالية</h3>
                <p className="text-xs text-slate-400">رفض عملية الحذف لمنع اختلال التوازن المالي</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 leading-relaxed">
              {showDeleteBlockedModal.msg}
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              💡 <strong>توصية:</strong> إذا كنت ترغب في إيقاف التعامل على هذه الخزينة مستقبلاً دون التأثير على القيود المحاسبية التاريخية، يمكنك تعديل حالتها إلى <strong>"غير نشط"</strong>.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteBlockedModal({ isOpen: false, msg: '' })}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* D. CONFIRM DELETION MODAL */}
      {showDeleteConfirmModal.isOpen && showDeleteConfirmModal.treasury && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">تأكيد حذف الخزينة</h3>
                <p className="text-xs text-slate-400">الخزينة خالية من الحركات ويمكن حذفها بأمان</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف الخزينة <strong>[{showDeleteConfirmModal.treasury.code}] {showDeleteConfirmModal.treasury.name}</strong> نهائياً من قاعدة البيانات؟
            </p>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal({ isOpen: false, treasury: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-900/30 cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Message Overlays */}
      <UnifiedMessageOverlay message={formError} type="error" onClose={() => setFormError(null)} />
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

    </div>
  );
};
