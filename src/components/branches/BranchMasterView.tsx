import React, { useState, useEffect, useRef } from 'react';
import { branchService } from '../../services/branchService';
import { chartOfAccountsService, ChartAccountNode } from '../../services/chartOfAccountsService';
import { BranchItem } from '../../types';
import { BranchRecordsModal } from './BranchRecordsModal';
import { StandardActionBar } from '../common/StandardActionBar';
import { FormInput, FormSelect } from '../common';
import { 
  Building2, 
  Search, 
  Plus, 
  Save, 
  Edit3, 
  Eye, 
  Trash2, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Lock,
  Phone,
  MapPin,
  Landmark
} from 'lucide-react';

export interface BranchMasterViewProps {
  initialBranchId?: string;
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}

// Independent styled label rectangle matching input height and theme
const FieldLabelBox: React.FC<{
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
}> = ({ label, required, icon }) => (
  <div className="h-10 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 flex items-center justify-center space-x-2 space-x-reverse text-xs font-bold select-none w-full shadow-2xs font-['Cairo',sans-serif]">
    {required && <span className="text-rose-500 font-bold ml-0.5">*</span>}
    {icon && <span className="text-amber-500 dark:text-amber-400 shrink-0">{icon}</span>}
    <span className="truncate">{label}</span>
  </div>
);

export const BranchMasterView: React.FC<BranchMasterViewProps> = ({
  initialBranchId,
  onClose,
  onNavigateSection
}) => {
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [currentAccounts, setCurrentAccounts] = useState<ChartAccountNode[]>([]);
  
  // Active Loaded Branch (Null = New Mode, BranchItem = Edit/View Mode)
  const [loadedBranch, setLoadedBranch] = useState<BranchItem | null>(null);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);

  // Form Fields State
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formNameEn, setFormNameEn] = useState<string>('');
  const [formCity, setFormCity] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formAccountId, setFormAccountId] = useState<string>('');
  const [formPhones, setFormPhones] = useState<string[]>([]);
  const [newPhoneInput, setNewPhoneInput] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [formShowOnMainScreen, setFormShowOnMainScreen] = useState<boolean>(false);

  // UI State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<boolean>(false);

  // Toast / Alerts State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const refreshAccounts = () => {
    const all = chartOfAccountsService.getAllAccounts();
    // Filter accounts under '120707' (جارى الفروع) that are leaf accounts
    const branchCurrentAccounts = all.filter(acc => 
      acc.parentCode === '120707' || (acc.code.startsWith('120707') && acc.code !== '120707' && acc.isLeaf)
    );
    setCurrentAccounts(branchCurrentAccounts);
    return branchCurrentAccounts;
  };

  const refreshData = () => {
    const list = branchService.getAllBranches();
    setBranches(list);
    return list;
  };

  // Initial Data Subscription and Loading
  useEffect(() => {
    const list = refreshData();
    refreshAccounts();

    const unsubBranch = branchService.subscribe(() => {
      const freshList = branchService.getAllBranches();
      setBranches(freshList);
      setLoadedBranch(prev => {
        if (!prev) return null;
        return freshList.find(b => b.id === prev.id) || prev;
      });
    });

    const unsubChart = chartOfAccountsService.subscribe(() => {
      refreshAccounts();
    });

    const storedLastBranchId = typeof localStorage !== 'undefined' ? localStorage.getItem('VERTEX_LAST_SELECTED_BRANCH_ID') : null;
    const targetBranchId = initialBranchId || storedLastBranchId;

    if (targetBranchId) {
      const found = branchService.getBranchById(targetBranchId);
      if (found) {
        loadBranchIntoForm(found, list);
      } else {
        const current = branchService.getCurrentBranch();
        loadBranchIntoForm(current, list);
      }
    } else {
      if (list.length > 0) {
        const current = branchService.getCurrentBranch();
        loadBranchIntoForm(current, list);
      }
    }

    return () => {
      unsubBranch();
      unsubChart();
    };
  }, [initialBranchId]);

  const loadBranchIntoForm = (branch: BranchItem, list?: BranchItem[]) => {
    const freshList = list || branchService.getAllBranches();
    const currentBranch = freshList.find(b => b.id === branch.id) || branch;
    const idx = freshList.findIndex(b => b.id === currentBranch.id);
    setBranches(freshList);
    setCurrentRecordIndex(idx >= 0 ? idx : 0);
    setLoadedBranch(currentBranch);
    setFormCode(currentBranch.code);
    setFormName(currentBranch.name);
    setFormNameEn(currentBranch.nameEn || '');
    setFormCity(currentBranch.city || '');
    setFormAddress(currentBranch.address || '');

    if (typeof localStorage !== 'undefined' && currentBranch.id) {
      localStorage.setItem('VERTEX_LAST_SELECTED_BRANCH_ID', currentBranch.id);
    }

    // Refresh and resolve account
    const allAccounts = chartOfAccountsService.getAllAccounts();
    const branchCurrentAccounts = allAccounts.filter(acc => 
      acc.parentCode === '120707' || (acc.code.startsWith('120707') && acc.code !== '120707' && acc.isLeaf)
    );
    setCurrentAccounts(branchCurrentAccounts);
    const matchedAccount = branchCurrentAccounts.find(
      a => a.id === currentBranch.accountId || a.code === currentBranch.accountCode || a.code === currentBranch.accountId
    );
    setFormAccountId(matchedAccount ? matchedAccount.id : (currentBranch.accountId || ''));

    setFormPhones(Array.isArray(currentBranch.phones) ? [...currentBranch.phones] : (currentBranch.phones ? [currentBranch.phones] : []));
    setNewPhoneInput('');
    setFormStatus(currentBranch.status === 'غير نشط' ? 'غير نشط' : 'نشط');
    setFormShowOnMainScreen(Boolean(currentBranch.showOnMainScreen));
    setIsEditing(false);
    setIsDirty(false);
    setFormError(null);
  };

  const resetToNewMode = () => {
    const nextCode = branchService.getNextBranchCode();
    setLoadedBranch(null);
    setCurrentRecordIndex(-1);
    setFormCode(nextCode);
    setFormName('');
    setFormNameEn('');
    setFormCity('الإسكندرية / القاهرة');
    setFormAddress('');
    setFormAccountId('');
    setFormPhones([]);
    setNewPhoneInput('');
    setFormStatus('نشط');
    setFormShowOnMainScreen(false);
    setIsEditing(true);
    setIsDirty(false);
    setFormError(null);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  // Phone list management
  const handleAddPhone = () => {
    const trimmed = newPhoneInput.trim();
    if (!trimmed) return;
    if (formPhones.includes(trimmed)) {
      showToast('رقم الهاتف مسجل بالفعل في قائمة أرقام الفرع.', 'warning');
      return;
    }
    setFormPhones([...formPhones, trimmed]);
    setNewPhoneInput('');
    setIsDirty(true);
    phoneInputRef.current?.focus();
  };

  const handleRemovePhone = (index: number) => {
    setFormPhones(formPhones.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  // Navigation Stepper
  const handleNavFirst = () => {
    const list = branchService.getAllBranches();
    if (list.length > 0) loadBranchIntoForm(list[0], list);
  };
  const handleNavPrev = () => {
    const list = branchService.getAllBranches();
    if (list.length === 0) return;
    const targetIdx = currentRecordIndex > 0 ? currentRecordIndex - 1 : list.length - 1;
    loadBranchIntoForm(list[targetIdx], list);
  };
  const handleNavNext = () => {
    const list = branchService.getAllBranches();
    if (list.length === 0) return;
    const targetIdx = currentRecordIndex >= 0 && currentRecordIndex < list.length - 1 ? currentRecordIndex + 1 : 0;
    loadBranchIntoForm(list[targetIdx], list);
  };
  const handleNavLast = () => {
    const list = branchService.getAllBranches();
    if (list.length > 0) loadBranchIntoForm(list[list.length - 1], list);
  };

  // Action 1: جديد (New)
  const handleNewClick = () => {
    resetToNewMode();
    showToast('تم فتح وضع إنشاء فرع جديد.', 'warning');
  };

  // Action 2: تعديل (Edit)
  const handleEditClick = () => {
    if (!loadedBranch) return;
    setIsEditing(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 50);
  };

  // Filter accounts: accounts linked to other branches are excluded, while preserving current branch's selection
  const availableAccountsForBranch = currentAccounts.filter(acc => {
    if (formAccountId && (acc.id === formAccountId || acc.code === formAccountId)) return true;
    if (loadedBranch && (acc.id === loadedBranch.accountId || acc.code === loadedBranch.accountCode)) return true;
    const isLinkedToAnother = branches.some(b => 
      b.id !== loadedBranch?.id && (b.accountId === acc.id || b.accountCode === acc.code)
    );
    return !isLinkedToAnother;
  });

  // Action 3: حفظ (Save)
  const handleSave = () => {
    setFormError(null);

    if (!formName.trim()) {
      const err = 'اسم الفرع إجباري ومطلوب.';
      setFormError(err);
      showToast(err, 'error');
      nameInputRef.current?.focus();
      return;
    }

    if (!formAccountId) {
      const err = 'يرجى اختيار حساب جاري الفرع من القائمة المنسدلة.';
      setFormError(err);
      showToast(err, 'error');
      return;
    }

    // Resolve selected account details
    const allAccs = chartOfAccountsService.getAllAccounts();
    const selectedAccount = currentAccounts.find(a => a.id === formAccountId || a.code === formAccountId) ||
                            allAccs.find(a => a.id === formAccountId || a.code === formAccountId);

    if (loadedBranch) {
      // Validate: cannot deactivate the only active branch
      if (formStatus === 'غير نشط') {
        const allBrs = branchService.getAllBranches();
        const otherActiveBranches = allBrs.filter(b => b.id !== loadedBranch.id && b.status !== 'غير نشط');
        if (allBrs.length <= 1) {
          const err = 'لا يمكن تعطيل الفرع الوحيد في النظام؛ يجب أن يظل هناك فرع واحد نشط على الأقل دائماً لإتمام العمليات التشغيلية والمالية.';
          setFormError(err);
          showToast(err, 'error');
          return;
        }
        if (otherActiveBranches.length === 0) {
          const err = 'لا يمكن تعطيل هذا الفرع؛ يجب أن يظل هناك فرع واحد نشط على الأقل دائماً في النظام لإتمام العمليات التشغيلية والمالية.';
          setFormError(err);
          showToast(err, 'error');
          return;
        }
      }

      // Edit Mode
      const targetAccountId = selectedAccount?.id || formAccountId || loadedBranch.accountId;
      const targetAccountCode = selectedAccount?.code || loadedBranch.accountCode || '';
      const targetAccountName = selectedAccount?.name || loadedBranch.accountName || '';

      const result = branchService.updateBranch(loadedBranch.id, {
        name: formName,
        nameEn: formNameEn,
        city: formCity,
        address: formAddress,
        phones: formPhones,
        accountId: targetAccountId,
        accountCode: targetAccountCode,
        accountName: targetAccountName,
        status: formStatus,
        showOnMainScreen: formShowOnMainScreen
      });

      if (!result.success) {
        setFormError(result.error || 'حدث خطأ أثناء تعديل الفرع.');
        showToast(result.error || 'حدث خطأ أثناء تعديل الفرع.', 'error');
        return;
      }

      showToast(`تم تعديل بيانات الفرع [${formName.trim()}] بنجاح.`, 'success');
      const updatedList = branchService.getAllBranches();
      setBranches(updatedList);
      const freshBranch = updatedList.find(b => b.id === loadedBranch.id) || result.branch;
      if (freshBranch) {
        loadBranchIntoForm(freshBranch, updatedList);
      }
    } else {
      // New Branch Creation Mode
      const targetAccountId = selectedAccount?.id || (formAccountId ? formAccountId : undefined);
      const targetAccountCode = selectedAccount?.code || undefined;
      const targetAccountName = selectedAccount?.name || undefined;

      const result = branchService.createBranch({
        code: formCode,
        name: formName,
        nameEn: formNameEn,
        city: formCity,
        address: formAddress,
        phones: formPhones,
        accountId: targetAccountId,
        accountCode: targetAccountCode,
        accountName: targetAccountName,
        status: formStatus,
        showOnMainScreen: formShowOnMainScreen
      });

      if (!result.success) {
        setFormError(result.error || 'حدث خطأ أثناء إنشاء الفرع الجديد.');
        showToast(result.error || 'حدث خطأ أثناء إنشاء الفرع الجديد.', 'error');
        return;
      }

      showToast(`تم حفظ الفرع [${formName.trim()}] بنجاح.`, 'success');
      const updatedList = branchService.getAllBranches();
      setBranches(updatedList);
      if (result.branch) {
        loadBranchIntoForm(result.branch, updatedList);
      }
    }
  };

  // Action 4: عرض (View records list modal / reload fresh saved data)
  const handleViewRecordsClick = () => {
    const freshList = branchService.getAllBranches();
    setBranches(freshList);
    refreshAccounts();
    if (loadedBranch) {
      const freshCurrent = freshList.find(b => b.id === loadedBranch.id);
      if (freshCurrent) {
        loadBranchIntoForm(freshCurrent, freshList);
      }
    }
    setShowRecordsModal(true);
  };

  // Action 5: حذف (Delete)
  const handleDeleteClick = () => {
    if (!loadedBranch) return;

    if (loadedBranch.isMain) {
      const err = 'الفرع الرئيسي للنظام هو كيان تأسيسي جوهري ولا يمكن حذفه نهائياً.';
      setFormError(err);
      showToast(err, 'error');
      return;
    }

    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = () => {
    if (!loadedBranch) return;
    const result = branchService.deleteBranch(loadedBranch.id);
    setShowDeleteConfirmModal(false);

    if (!result.success) {
      setFormError(result.error || 'تعذر حذف الفرع.');
      showToast(result.error || 'تعذر حذف الفرع.', 'error');
      return;
    }

    showToast(`تم حذف الفرع [${loadedBranch.name}] بنجاح.`, 'success');
    const updatedList = branchService.getAllBranches();
    setBranches(updatedList);
    const fallback = branchService.getCurrentBranch();
    loadBranchIntoForm(fallback, updatedList);
  };

  // Action 6: إغلاق (Close)
  const handleCloseScreen = () => {
    if (onClose) {
      onClose();
    } else if (onNavigateSection) {
      onNavigateSection('settings');
    }
  };

  const isNewMode = loadedBranch === null;

  return (
    <div 
      id="branch-master-container" 
      className="w-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none font-['Cairo',sans-serif]"
      dir="rtl"
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER BAR                                         */}
      {/* ========================================================= */}
      <div className="relative px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 font-['Cairo',sans-serif]">
        {/* Right Icon */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Center: Title "بيانات الفروع" Centered, Bigger, Bold, Cairo Font */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
          <h2 className="text-lg sm:text-xl font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
            بيانات الفروع
          </h2>
        </div>

        {/* Left: Close Button Only */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            type="button"
            onClick={handleCloseScreen}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="إغلاق الشاشة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* TOAST / ALERTS */}
      {toastMessage && (
        <div className={`px-4 py-2 text-xs font-bold flex items-center justify-between transition-all ${
          toastMessage.type === 'error' 
            ? 'bg-rose-950/90 text-rose-200 border-b border-rose-800' 
            : toastMessage.type === 'warning'
              ? 'bg-amber-950/90 text-amber-200 border-b border-amber-800'
              : 'bg-emerald-950/90 text-emerald-200 border-b border-emerald-800'
        }`}>
          <div className="flex items-center space-x-2 space-x-reverse">
            {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />}
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            <span>{toastMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {formError && (
        <div className="px-4 py-2 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2 space-x-reverse">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{formError}</span>
          </div>
          <button type="button" onClick={() => setFormError(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DATA ENTRY FORM (EXACT CLEAN STRUCTURE)                */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          
          {/* 1. كود الفرع */}
          <div className="md:col-span-2">
            <FieldLabelBox label="كود الفرع :" />
          </div>
          <div className="md:col-span-10 flex flex-wrap items-center gap-3">
            <div className="w-44 shrink-0">
              <FormInput
                type="text"
                value={formCode}
                readOnly
                variant="readonly-code"
                icon={<Lock className="w-3.5 h-3.5 text-blue-400" />}
                className="text-center font-mono font-bold"
              />
            </div>
            
            <button
              type="button"
              onClick={() => setShowRecordsModal(true)}
              title="بحث واختيار من سجل الفروع"
              className="h-10 px-3.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse text-xs font-bold shrink-0 shadow-xs"
            >
              <Search className="w-4 h-4" />
              <span>بحث في الفروع</span>
            </button>

            {/* خيار إظهار اسم الفرع في الشاشة الرئيسية */}
            <label
              htmlFor="checkbox-show-branch-main"
              className="h-10 px-3.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center space-x-2.5 space-x-reverse cursor-pointer transition-colors select-none text-xs font-bold shrink-0"
              title="التحكم في ظهور اسم هذا الفرع أعلى عنوان VERTEX ERP في الشاشة الرئيسية"
            >
              <input
                type="checkbox"
                id="checkbox-show-branch-main"
                checked={formShowOnMainScreen}
                onChange={(e) => {
                  setFormShowOnMainScreen(e.target.checked);
                  setIsDirty(true);
                }}
                className="w-4 h-4 text-amber-500 bg-slate-900 border-slate-600 rounded focus:ring-amber-500 focus:ring-offset-slate-900 focus:ring-1 cursor-pointer accent-amber-500"
              />
              <span className="text-slate-200">إظهار اسم الفرع في الشاشة الرئيسية</span>
            </label>
          </div>

          {/* 2. اسم الفرع */}
          <div className="md:col-span-2">
            <FieldLabelBox label="اسم الفرع :" required />
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
              required
            />
          </div>

          {/* 3. الاسم بالإنجليزية */}
          <div className="md:col-span-2">
            <FieldLabelBox label="الاسم بالإنجليزي :" />
          </div>
          <div className="md:col-span-10">
            <FormInput
              type="text"
              dir="ltr"
              value={formNameEn}
              onChange={(e) => {
                setFormNameEn(e.target.value);
                setIsDirty(true);
              }}
              className="text-left font-mono"
            />
          </div>

          {/* 4. جاري الفرع (دليل الحسابات - 120707) */}
          <div className="md:col-span-2">
            <FieldLabelBox
              label="جاري الفرع :"
              required
              icon={<Landmark className="w-3.5 h-3.5 text-amber-400/80" />}
            />
          </div>
          <div className="md:col-span-10">
            <FormSelect
              value={formAccountId}
              onChange={(e) => {
                setFormAccountId(e.target.value);
                setIsDirty(true);
              }}
            >
              <option value="">
                -- اختر حساب جاري الفرع من الدليل --
              </option>
              {availableAccountsForBranch.map(acc => (
                <option key={acc.id} value={acc.id}>
                  [{acc.code}] - {acc.name}
                </option>
              ))}
            </FormSelect>
          </div>

          {/* 5. المدينة / النطاق */}
          <div className="md:col-span-2">
            <FieldLabelBox label="المدينة / النطاق :" required />
          </div>
          <div className="md:col-span-10">
            <FormInput
              type="text"
              value={formCity}
              onChange={(e) => {
                setFormCity(e.target.value);
                setIsDirty(true);
              }}
              required
            />
          </div>

          {/* 6. موقع الفرع (العنوان التفصيلي) */}
          <div className="md:col-span-2">
            <FieldLabelBox
              label="موقع الفرع :"
              icon={<MapPin className="w-3.5 h-3.5 text-amber-400/80" />}
            />
          </div>
          <div className="md:col-span-10">
            <FormInput
              type="text"
              value={formAddress}
              onChange={(e) => {
                setFormAddress(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          {/* 7. أرقام هواتف الفرع (متعدد الأرقام) */}
          <div className="md:col-span-2 self-start">
            <FieldLabelBox
              label="أرقام الهواتف :"
              icon={<Phone className="w-3.5 h-3.5 text-amber-400/80" />}
            />
          </div>
          <div className="md:col-span-10 space-y-2">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex-1">
                <FormInput
                  ref={phoneInputRef}
                  type="tel"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPhone();
                    }
                  }}
                  className="font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPhone}
                className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة رقم</span>
              </button>
            </div>

            {/* Badges / Chips for added phones */}
            {formPhones.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {formPhones.map((phone, idx) => (
                  <span 
                    key={idx}
                    className="inline-flex items-center space-x-1.5 space-x-reverse bg-slate-950 border border-slate-800 text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(idx)}
                      className="text-slate-400 hover:text-rose-400 p-0.5 rounded cursor-pointer"
                      title="إزالة الرقم"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 8. حالة الفرع */}
          <div className="md:col-span-2">
            <FieldLabelBox label="حالة الفرع :" required />
          </div>
          <div className="md:col-span-10 flex items-center">
            <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl space-x-1.5 space-x-reverse">
              <button
                type="button"
                onClick={() => {
                  setFormStatus('نشط');
                  setIsDirty(true);
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  formStatus === 'نشط'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${formStatus === 'نشط' ? 'bg-emerald-400 ring-2 ring-emerald-500/30' : 'bg-slate-600'}`}></span>
                <span>نشط</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const allBrs = branchService.getAllBranches();
                  const otherActive = allBrs.filter(b => b.id !== loadedBranch?.id && b.status !== 'غير نشط');
                  if (allBrs.length <= 1) {
                    const msg = 'لا يمكن تعطيل الفرع الوحيد في النظام؛ يجب أن يظل هناك فرع واحد نشط على الأقل دائماً لإتمام العمليات التشغيلية والمالية.';
                    setFormError(msg);
                    showToast(msg, 'error');
                    return;
                  }
                  if (otherActive.length === 0) {
                    const msg = 'لا يمكن تعطيل هذا الفرع؛ يجب أن يظل هناك فرع واحد نشط على الأقل دائماً في النظام لإتمام العمليات التشغيلية والمالية.';
                    setFormError(msg);
                    showToast(msg, 'error');
                    return;
                  }
                  setFormStatus('غير نشط');
                  setIsDirty(true);
                }}
                className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  formStatus === 'غير نشط'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${formStatus === 'غير نشط' ? 'bg-rose-400 ring-2 ring-rose-500/30' : 'bg-slate-600'}`}></span>
                <span>غير نشط</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* 3. CLEAN SPACER / STEPPER BAR                             */}
      {/* ========================================================= */}
      <div className="flex-1 bg-slate-900/40 flex flex-col justify-end">
        {/* Record Navigator Stepper */}
        <div className="flex items-center justify-between p-3 px-4 border-t border-slate-800 text-xs bg-slate-950/60">
          <div className="flex items-center space-x-1.5 space-x-reverse" dir="ltr">
            <button
              type="button"
              onClick={handleNavFirst}
              disabled={branches.length === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded font-mono text-xs cursor-pointer"
              title="السجل الأول"
            >
              |◀
            </button>
            <button
              type="button"
              onClick={handleNavPrev}
              disabled={branches.length === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded font-mono text-xs cursor-pointer"
              title="السابق"
            >
              ◀
            </button>
            <span className="px-3 py-1 bg-slate-950 font-mono text-amber-400 font-bold border border-slate-800 rounded select-none inline-block">
              <bdi>{currentRecordIndex >= 0 ? currentRecordIndex + 1 : 0} of {branches.length}</bdi>
            </span>
            <button
              type="button"
              onClick={handleNavNext}
              disabled={branches.length === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded font-mono text-xs cursor-pointer"
              title="التالي"
            >
              ▶
            </button>
            <button
              type="button"
              onClick={handleNavLast}
              disabled={branches.length === 0}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded font-mono text-xs cursor-pointer"
              title="السجل الأخير"
            >
              ▶|
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            {loadedBranch ? (
              <span>الفرع المحدد للتعديل: <strong className="text-slate-200">{loadedBranch.name}</strong></span>
            ) : (
              <span className="text-emerald-400 font-bold">جاهز لإضافة فرع جديد</span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BOTTOM ACTION BUTTONS (Standard Action Bar)            */}
      {/* ========================================================= */}
      <div className="pt-2 border-t border-slate-800 p-2 sm:p-2.5 bg-slate-900/90 font-['Cairo',sans-serif] shrink-0">
        <StandardActionBar
          hasHold={false}
          gridCols={6}
          onNew={handleNewClick}
          onSave={handleSave}
          onEdit={handleEditClick}
          editDisabled={isNewMode}
          onView={handleViewRecordsClick}
          onDelete={handleDeleteClick}
          deleteDisabled={!loadedBranch || loadedBranch.isMain}
          onClose={handleCloseScreen}
          newLabel="1. جديد"
          saveLabel="2. حفظ السجل"
          editLabel="3. تعديل"
          viewLabel="4. عرض"
          deleteLabel="5. حذف"
          closeLabel="6. إغلاق"
        />
      </div>

      {/* ========================================================= */}
      {/* 5. MODALS                                                 */}
      {/* ========================================================= */}

      {/* A. RECORDS MODAL (SEARCH & LOAD) */}
      <BranchRecordsModal
        isOpen={showRecordsModal}
        onClose={() => setShowRecordsModal(false)}
        onLoadBranchIntoForm={(b) => {
          const freshList = branchService.getAllBranches();
          const freshCurrent = freshList.find(x => x.id === b.id) || b;
          loadBranchIntoForm(freshCurrent, freshList);
          setIsEditing(true);
          setShowRecordsModal(false);
        }}
        onViewBranch={(b) => {
          const freshList = branchService.getAllBranches();
          const freshCurrent = freshList.find(x => x.id === b.id) || b;
          loadBranchIntoForm(freshCurrent, freshList);
          setIsEditing(false);
          setShowRecordsModal(false);
        }}
        loadedBranchId={loadedBranch?.id}
      />

      {/* B. DELETE CONFIRMATION MODAL */}
      {showDeleteConfirmModal && loadedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
              <div className="p-2.5 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-100">تأكيد حذف الفرع</h3>
                <p className="text-xs text-slate-400">إجراء أمني نهائي</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف الفرع: <strong className="text-rose-400">[{loadedBranch.name}]</strong> (كود: {loadedBranch.code})؟
            </p>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء التراجع
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black transition-colors shadow-lg shadow-rose-900/40 cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
