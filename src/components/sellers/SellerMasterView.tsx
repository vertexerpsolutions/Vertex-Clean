import React, { useState, useEffect, useRef } from 'react';
import { 
  sellerService, 
  Seller 
} from '../../services/sellerService';
import { SystemUserOption } from '../../services/treasuryService';
import { UnifiedMessageOverlay } from '../common/UnifiedMessageOverlay';
import { FormInput, FormSelect } from '../common';
import { SellerRecordsModal } from './SellerRecordsModal';
import { StandardActionBar } from '../common/StandardActionBar';
import { BranchItem } from '../../types';
import { 
  UserCheck, 
  Building2, 
  Users, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  X, 
  Check, 
  Eye, 
  Plus, 
  Save,
  Phone,
  Percent,
  Coins,
  FileText
} from 'lucide-react';

// Styled label box matching compact input height (h-8) and theme for unified alignment
function FieldLabelBox({ 
  label, 
  required = false, 
  icon, 
  className = '' 
}: { 
  label: string; 
  required?: boolean; 
  icon?: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`h-8 px-2.5 bg-slate-800/90 border border-slate-700/80 rounded-lg flex items-center justify-between text-xs font-bold text-slate-200 select-none shadow-2xs ${className}`}>
      <div className="flex items-center space-x-1.5 space-x-reverse truncate">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      {required && (
        <span className="text-amber-400 font-bold mr-1 shrink-0 text-sm leading-none">*</span>
      )}
    </div>
  );
}

export interface SellerMasterViewProps {
  initialSellerId?: string;
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}

export const SellerMasterView: React.FC<SellerMasterViewProps> = ({
  initialSellerId,
  onClose,
  onNavigateSection
}) => {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SystemUserOption[]>([]);
  
  // Active Loaded Seller (Null = New Mode, Seller = Edit Mode)
  const [loadedSeller, setLoadedSeller] = useState<Seller | null>(null);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);

  // Form Fields State
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formBranchId, setFormBranchId] = useState<string>('BR-01');
  const [formCommissionType, setFormCommissionType] = useState<string>('كل المنتجات');
  const [formSalesCommissionPercent, setFormSalesCommissionPercent] = useState<string>('0');
  const [formSalesCommissionAmount, setFormSalesCommissionAmount] = useState<string>('0');
  const [formAllowedUsersType, setFormAllowedUsersType] = useState<'all' | 'specific'>('all');
  const [formAllowedUserIds, setFormAllowedUserIds] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [formNotes, setFormNotes] = useState<string>('');

  // Modals and Alerts
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [showDeleteBlockedModal, setShowDeleteBlockedModal] = useState<{ isOpen: boolean; msg: string; txCount: number }>({ isOpen: false, msg: '', txCount: 0 });
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<{ isOpen: boolean; seller: Seller | null }>({ isOpen: false, seller: null });

  // Notifications State (Unified with Master Template)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const refreshData = () => {
    const list = sellerService.getAllSellers();
    setSellers(list);
    setBranches(sellerService.getAvailableBranches());
    setAvailableUsers(sellerService.getAvailableUsers());
    return list;
  };

  const clearEmptyState = () => {
    setLoadedSeller(null);
    setCurrentRecordIndex(-1);
    setFormCode('');
    setFormName('');
    setFormPhone('');
    setFormBranchId('');
    setFormCommissionType('كل المنتجات');
    setFormSalesCommissionPercent('0');
    setFormSalesCommissionAmount('0');
    setFormAllowedUsersType('all');
    setFormAllowedUserIds([]);
    setFormStatus('نشط');
    setFormNotes('');
    setIsDirty(false);
    setFormError(null);
  };

  useEffect(() => {
    const list = refreshData();
    const unsub = sellerService.subscribe(() => {
      refreshData();
    });

    if (initialSellerId) {
      const found = sellerService.getSellerById(initialSellerId);
      if (found) {
        loadSellerIntoForm(found, list);
      } else {
        clearEmptyState();
      }
    } else {
      if (list.length > 0) {
        loadSellerIntoForm(list[0], list);
      } else {
        clearEmptyState();
      }
    }

    return () => unsub();
  }, [initialSellerId]);

  // Load a seller into active editing state
  const loadSellerIntoForm = (seller: Seller, currentList?: Seller[]) => {
    const activeList = currentList || sellers;
    const idx = activeList.findIndex(s => s.id === seller.id);
    setCurrentRecordIndex(idx);
    setLoadedSeller(seller);

    setFormCode(seller.code);
    setFormName(seller.name);
    setFormPhone(seller.phone || '');
    setFormBranchId(seller.branchId);
    setFormCommissionType(seller.commissionType || 'كل المنتجات');
    setFormSalesCommissionPercent(String(seller.salesCommissionPercent || 0));
    setFormSalesCommissionAmount(String(seller.salesCommissionAmount || 0));
    setFormAllowedUsersType(seller.allowedUsersType || 'all');
    setFormAllowedUserIds(seller.allowedUserIds || []);
    setFormStatus(seller.status === 'غير نشط' || seller.status === 'inactive' ? 'غير نشط' : 'نشط');
    setFormNotes(seller.notes || '');

    setIsDirty(false);
    setFormError(null);
  };

  // Reset to New Seller Registration Mode
  const resetToNewMode = () => {
    setLoadedSeller(null);
    setCurrentRecordIndex(-1);

    const nextCode = sellerService.getNextSequentialCode();
    setFormCode(nextCode);
    setFormName('');
    setFormPhone('');
    setFormBranchId(branches[0]?.id || '');
    setFormCommissionType('كل المنتجات');
    setFormSalesCommissionPercent('0');
    setFormSalesCommissionAmount('0');
    setFormAllowedUsersType('all');
    setFormAllowedUserIds([]);
    setFormStatus('نشط');
    setFormNotes('');

    setIsDirty(false);
    setFormError(null);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  // Stepper Record Navigation (Organizer standard)
  const handleNavFirst = () => {
    if (sellers.length === 0) return;
    loadSellerIntoForm(sellers[0]);
  };

  const handleNavPrev = () => {
    if (sellers.length === 0) return;
    if (currentRecordIndex > 0) {
      loadSellerIntoForm(sellers[currentRecordIndex - 1]);
    } else {
      loadSellerIntoForm(sellers[0]);
    }
  };

  const handleNavNext = () => {
    if (sellers.length === 0) return;
    if (currentRecordIndex >= 0 && currentRecordIndex < sellers.length - 1) {
      loadSellerIntoForm(sellers[currentRecordIndex + 1]);
    } else {
      loadSellerIntoForm(sellers[sellers.length - 1]);
    }
  };

  const handleNavLast = () => {
    if (sellers.length === 0) return;
    loadSellerIntoForm(sellers[sellers.length - 1]);
  };

  // Save handler (Unified Workflow: Save -> Feedback -> Auto Open New Record with Next Code)
  const handleSave = () => {
    setFormError(null);

    if (!formName.trim()) {
      setFormError('اسم البائع حقل إجباري، يرجى إدخال اسم البائع للمتابعة');
      nameInputRef.current?.focus();
      return;
    }

    const selectedBranch = branches.find(b => b.id === formBranchId) || branches[0];
    const branchId = selectedBranch?.id || 'BR-01';
    const branchName = selectedBranch?.name || 'الفرع الرئيسي';

    const salesCommPct = parseFloat(formSalesCommissionPercent) || 0;
    const salesCommAmt = parseFloat(formSalesCommissionAmount) || 0;

    const sellerData = {
      name: formName.trim(),
      phone: formPhone.trim(),
      branchId,
      branchName,
      commissionType: formCommissionType,
      salesCommissionPercent: salesCommPct,
      salesCommissionAmount: salesCommAmt,
      allowedUsersType: formAllowedUsersType,
      allowedUserIds: formAllowedUsersType === 'specific' ? formAllowedUserIds : [],
      status: formStatus,
      notes: formNotes.trim() || undefined
    };

    try {
      if (loadedSeller) {
        // Update Existing Seller
        sellerService.updateSeller(loadedSeller.id, sellerData);
        setToastMessage(`تم حفظ تعديلات بيانات البائع (${formName}) بنجاح`);
        
        // Auto Reset to New Record Mode (Standard VERTEX Workflow)
        resetToNewMode();
      } else {
        // Create New Seller
        const created = sellerService.createSeller(sellerData);
        setToastMessage(`تم إنشاء البائع الجديد (${created.name}) بنجاح برقم كود [${created.code}]`);
        
        // Auto open blank new record for fast data entry
        resetToNewMode();
      }
    } catch (err: any) {
      setFormError(err.message || 'حدث خطأ أثناء حفظ بيانات البائع');
    }
  };

  // Delete Click handler with strict integrity check
  const handleDeleteClick = () => {
    if (!loadedSeller) return;

    const txCount = sellerService.getTransactionsCount(loadedSeller.id, loadedSeller.name);
    if (txCount > 0) {
      setShowDeleteBlockedModal({
        isOpen: true,
        msg: `لا يمكن حذف البائع (${loadedSeller.name}) لوجود (${txCount}) حركة ومبيعات أو عملاء مسجلين عليه! للحفاظ على سلامة القيود والتقارير التاريخية، لا يُسمح بحذف البائعين النشطين المرتبطين بسجلات سابقة.`,
        txCount
      });
      return;
    }

    setShowDeleteConfirmModal({
      isOpen: true,
      seller: loadedSeller
    });
  };

  // Confirm delete of unused seller
  const confirmDelete = () => {
    if (!showDeleteConfirmModal.seller) return;
    const res = sellerService.deleteSeller(showDeleteConfirmModal.seller.id);
    setShowDeleteConfirmModal({ isOpen: false, seller: null });

    if (res.success) {
      setToastMessage('تم حذف البائع بنجاح');
      resetToNewMode();
    } else {
      setFormError(res.error || 'تعذر حذف البائع');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setIsDirty(true);
    setFormAllowedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
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
              <UserCheck className="w-4 h-4 sm:w-5 h-5" />
            </div>
          </div>

          {/* Center: Title Centered, Bigger, Bold, Cairo Font */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
              بيانات المندوبين
            </h2>
          </div>

          {/* Left: Status Badge and Close Button */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${
              loadedSeller 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {loadedSeller ? `[${loadedSeller.code}]` : (formCode ? 'إضافة جديدة' : 'سجل جديد')}
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
        {/* 2. TOP DATA ENTRY FORM: CODE, NAME, PHONE, COMM., BRANCH, STATUS */}
        {/* ========================================================= */}
        <div className="p-2.5 sm:p-3 space-y-2 border-b border-slate-800 bg-slate-900/70">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 items-center">
            
            {/* 1. كود البائع */}
            <div className="md:col-span-2">
              <FieldLabelBox label="كود البائع :" />
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
                title="بحث واختيار بائع من الدليل"
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse text-xs font-bold shrink-0 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث في المندوبين</span>
              </button>
            </div>

            {/* 2. اسم البائع */}
            <div className="md:col-span-2">
              <FieldLabelBox label="اسم البائع :" required />
            </div>
            <div className="md:col-span-10">
              <FormInput
                ref={nameInputRef}
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setIsDirty(true);
                  setFormError(null);
                }}
                className="!h-8 !py-1 text-xs font-bold"
                required
                autoFocus
              />
            </div>

            {/* 3. تليفونات البائع */}
            <div className="md:col-span-2">
              <FieldLabelBox 
                label="تليفونات البائع :" 
                icon={<Phone className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
            <div className="md:col-span-4">
              <FormInput
                type="text"
                value={formPhone}
                onChange={(e) => {
                  setFormPhone(e.target.value);
                  setIsDirty(true);
                }}
                className="!h-8 !py-1 text-xs font-mono font-bold"
                dir="ltr"
                placeholder="01xxxxxxxxx"
              />
            </div>

            {/* 4. نوع العمولة */}
            <div className="md:col-span-2">
              <FieldLabelBox 
                label="نوع العمولة :" 
                icon={<Percent className="w-3.5 h-3.5 text-amber-400" />}
              />
            </div>
            <div className="md:col-span-4">
              <FormSelect
                value={formCommissionType}
                onChange={(e) => {
                  setFormCommissionType(e.target.value);
                  setIsDirty(true);
                }}
                className="!h-8 !py-1 text-xs font-bold"
              >
                <option value="كل المنتجات">كل المنتجات</option>
                <option value="مجموعات أصناف محددة">مجموعات أصناف محددة</option>
                <option value="حسب الفاتورة">حسب الفاتورة الإجمالية</option>
              </FormSelect>
            </div>

            {/* 5. الفرع التابع له (Same position as Warehouse & Treasury!) */}
            <div className="md:col-span-2">
              <FieldLabelBox 
                label="الفرع التابع له :" 
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
                className="!h-8 !py-1 text-xs font-bold"
              >
                <option value="">-- اختر الفرع --</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} {branch.isMain ? '(الفرع الرئيسي)' : ''}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* 6. حالة البائع (Same position as Warehouse & Treasury!) */}
            <div className="md:col-span-2">
              <FieldLabelBox label="حالة البائع :" required />
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
            <div className="lg:col-span-5 border border-slate-700/80 bg-slate-950/70 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 space-x-reverse text-slate-200">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-bold">المستخدمون المصرح لهم بالتعامل</span>
                  </div>
                </div>

                {/* Mode Selectors */}
                <div className="space-y-2 mb-3">
                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="sellerUserPermissionType"
                      checked={formAllowedUsersType === 'all'}
                      onChange={() => {
                        setFormAllowedUsersType('all');
                        setIsDirty(true);
                      }}
                      className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="font-bold">كل المستخدمين</span>
                  </label>

                  <label className="flex items-center space-x-2 space-x-reverse cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="sellerUserPermissionType"
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

                {/* Specific Users Table List */}
                {formAllowedUsersType === 'specific' ? (
                  <div className="space-y-1.5 border border-slate-800 rounded-lg p-2 bg-slate-900/60 max-h-40 overflow-y-auto">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-slate-800">
                      <span className="font-bold">المستخدم</span>
                      <div className="flex items-center space-x-1.5 space-x-reverse">
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
                  <div className="p-2.5 bg-slate-900/40 rounded-lg border border-slate-800 text-[11px] text-emerald-400/90 flex items-center space-x-2 space-x-reverse">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>متاح لجميع مستخدمي النظام</span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT / SECTION 2: COMMISSIONS GRID */}
            <div className="lg:col-span-7 border border-slate-700/80 bg-slate-950/70 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 space-x-reverse text-slate-200">
                    <Coins className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">نسب وقيم العمولات</span>
                  </div>
                </div>

                {/* Organizer Commission Grid Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs border border-slate-800 rounded-lg overflow-hidden">
                    <thead className="bg-slate-800/90 text-slate-300 font-bold border-b border-slate-700 text-[11px]">
                      <tr>
                        <th className="p-2 text-right w-[45%]">بيان العمولة</th>
                        <th className="p-2 text-center w-[27%]">نسبة (%)</th>
                        <th className="p-2 text-center w-[28%]">قيمة / الوحدة (ج.م)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900/60 divide-y divide-slate-800">
                      {/* Row 1: عمولة المبيعات */}
                      <tr>
                        <td className="p-2 font-bold text-slate-200">
                          نسبة العمولة على المبيعات
                        </td>
                        <td className="p-1.5">
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={formSalesCommissionPercent}
                              onChange={(e) => {
                                setFormSalesCommissionPercent(e.target.value);
                                setIsDirty(true);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded py-1.5 px-2 text-xs text-center font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
                              placeholder="0.0000"
                            />
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">%</span>
                          </div>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formSalesCommissionAmount}
                            onChange={(e) => {
                              setFormSalesCommissionAmount(e.target.value);
                              setIsDirty(true);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded py-1.5 px-2 text-xs text-center font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                            placeholder="0.0000"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

          {/* Record Navigator Stepper (Organizer record position bar) */}
          <div className="flex items-center justify-between pt-1.5 px-2 border-t border-slate-800 text-xs font-['Cairo',sans-serif]">
            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                type="button"
                onClick={handleNavFirst}
                disabled={sellers.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأول"
              >
                |◀
              </button>
              <button
                type="button"
                onClick={handleNavPrev}
                disabled={sellers.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السابق"
              >
                ◀
              </button>
              <span className="h-7 px-3 flex items-center bg-slate-950 font-mono text-amber-400 font-bold border border-slate-800 rounded-lg text-xs">
                {currentRecordIndex >= 0 ? currentRecordIndex + 1 : 0} of {sellers.length}
              </span>
              <button
                type="button"
                onClick={handleNavNext}
                disabled={sellers.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="التالي"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={handleNavLast}
                disabled={sellers.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأخير"
              >
                ▶|
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {loadedSeller ? (
                <span>البائع المحدد للتعديل: <strong className="text-slate-200">[{loadedSeller.code}] {loadedSeller.name}</strong></span>
              ) : formCode ? (
                <span className="text-emerald-400 font-bold">جاهز لإضافة بائع جديد</span>
              ) : (
                <span className="text-slate-500 font-medium">لا يوجد مندوبون محفوظون — اضغط "جديد" للبدء</span>
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
            onView={() => setShowRecordsModal(true)}
            onDelete={handleDeleteClick}
            deleteDisabled={!loadedSeller}
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
      {/* 5. MODALS & DIALOGS */}
      {/* ========================================================= */}

      {/* A. RECORDS BROWSER MODAL (SEARCH & LOAD) */}
      <SellerRecordsModal
        isOpen={showRecordsModal}
        onClose={() => setShowRecordsModal(false)}
        onLoadSellerIntoForm={(s) => {
          loadSellerIntoForm(s);
          setShowRecordsModal(false);
        }}
        loadedSellerId={loadedSeller?.id}
      />

      {/* B. DELETE BLOCKED INTEGRITY ALERT MODAL */}
      {showDeleteBlockedModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">حماية القيود وحركات المبيعات</h3>
                <p className="text-xs text-slate-400">رفض عملية الحذف لضمان سلامة التدقيق والمبيعات السابقة</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 leading-relaxed">
              {showDeleteBlockedModal.msg}
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              💡 <strong>توصية:</strong> إذا كنت ترغب في إيقاف التعامل مع هذا البائع مستقبلاً دون التأثير على الفواتير والعمولات السابقة، يمكنك تعديل حالته إلى <strong>"غير نشط"</strong>.
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteBlockedModal({ isOpen: false, msg: '', txCount: 0 })}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. CONFIRM DELETION MODAL */}
      {showDeleteConfirmModal.isOpen && showDeleteConfirmModal.seller && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">تأكيد حذف البائع</h3>
                <p className="text-xs text-slate-400">البائع خالٍ من أي معاملات ويمكن حذفه بأمان</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف البائع <strong>[{showDeleteConfirmModal.seller.code}] {showDeleteConfirmModal.seller.name}</strong> نهائياً من قاعدة البيانات؟
            </p>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal({ isOpen: false, seller: null })}
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
