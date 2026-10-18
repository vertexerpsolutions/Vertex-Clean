import React, { useState, useEffect, useRef } from 'react';
import { 
  warehouseService, 
  Warehouse, 
  AccountOption 
} from '../../services/warehouseService';
import { sellerService } from '../../services/sellerService';
import { SystemUserOption } from '../../services/treasuryService';
import { FormInput, FormSelect, FormLabel } from '../common';
import { UnifiedMessageOverlay } from '../common/UnifiedMessageOverlay';
import { WarehouseRecordsModal } from './WarehouseRecordsModal';
import { StandardActionBar } from '../common/StandardActionBar';
import { BranchItem } from '../../types';
import { 
  Warehouse as WarehouseIcon, 
  Building2, 
  Users, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  X, 
  Check, 
  Eye, 
  Plus, 
  Save,
  FolderTree
} from 'lucide-react';

export interface WarehouseMasterViewProps {
  initialWarehouseId?: string;
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}

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

export const WarehouseMasterView: React.FC<WarehouseMasterViewProps> = ({
  initialWarehouseId,
  onClose,
  onNavigateSection
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SystemUserOption[]>([]);
  
  // Active Loaded Warehouse (Null = New Mode, Warehouse = Edit Mode)
  const [loadedWarehouse, setLoadedWarehouse] = useState<Warehouse | null>(null);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);

  // Form Fields State
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formNameEn, setFormNameEn] = useState<string>('');
  const [formBranchId, setFormBranchId] = useState<string>('BR-01');
  const [formAccountId, setFormAccountId] = useState<string>('ACC-1205');
  const [formValuationType, setFormValuationType] = useState<'included' | 'excluded'>('included');
  const [formAllowedUsersType, setFormAllowedUsersType] = useState<'all' | 'specific'>('all');
  const [formAllowedUserIds, setFormAllowedUserIds] = useState<string[]>([]);
  const [formStatus, setFormStatus] = useState<'نشط' | 'غير نشط'>('نشط');

  // Modals and Alerts
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [showDeleteBlockedModal, setShowDeleteBlockedModal] = useState<{ isOpen: boolean; msg: string; txCount: number }>({ isOpen: false, msg: '', txCount: 0 });
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<{ isOpen: boolean; warehouse: Warehouse | null }>({ isOpen: false, warehouse: null });

  // Notifications State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const [, setIsDirty] = useState<boolean>(false);

  const refreshData = () => {
    const list = warehouseService.getAllWarehouses();
    setWarehouses(list);
    setBranches(warehouseService.getAvailableBranches());
    setAccounts(warehouseService.getAvailableAccounts());
    setAvailableUsers(warehouseService.getAvailableUsers());
    return list;
  };

  const clearEmptyState = () => {
    setLoadedWarehouse(null);
    setCurrentRecordIndex(-1);
    setFormCode('');
    setFormName('');
    setFormNameEn('');
    setFormBranchId('');
    setFormAccountId('');
    setFormValuationType('included');
    setFormAllowedUsersType('all');
    setFormAllowedUserIds([]);
    setFormStatus('نشط');
    setIsDirty(false);
  };

  useEffect(() => {
    const list = refreshData();
    const unsub = warehouseService.subscribe(() => {
      refreshData();
    });
    const unsubSeller = sellerService.subscribe(() => {
      refreshData();
    });

    if (initialWarehouseId) {
      const found = warehouseService.getWarehouseById(initialWarehouseId);
      if (found) {
        loadWarehouseIntoForm(found, list);
      } else {
        clearEmptyState();
      }
    } else {
      if (list.length > 0) {
        loadWarehouseIntoForm(list[0], list);
      } else {
        clearEmptyState();
      }
    }

    return () => {
      unsub();
      unsubSeller();
    };
  }, [initialWarehouseId]);

  const resetToNewMode = () => {
    const nextCode = warehouseService.getNextWarehouseCode();
    setLoadedWarehouse(null);
    setCurrentRecordIndex(-1);
    setFormCode(nextCode);
    setFormName('');
    setFormNameEn('');
    setFormBranchId(branches[0]?.id || '');
    setFormAccountId(accounts[0]?.id || '');
    setFormValuationType('included');
    setFormAllowedUsersType('all');
    setFormAllowedUserIds([]);
    setFormStatus('نشط');
    setIsDirty(false);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const loadWarehouseIntoForm = (warehouse: Warehouse, list?: Warehouse[]) => {
    const currentList = list || warehouses;
    const idx = currentList.findIndex(w => w.id === warehouse.id);
    setCurrentRecordIndex(idx);
    setLoadedWarehouse(warehouse);
    setFormCode(warehouse.code);
    setFormName(warehouse.name);
    setFormNameEn(warehouse.nameEn || '');
    setFormBranchId(warehouse.branchId);
    
    // Resolve matching Account ID from current chart of accounts
    const matchingAcc = accounts.find(a => a.id === warehouse.accountId || a.code === warehouse.accountId);
    setFormAccountId(matchingAcc ? matchingAcc.id : (warehouse.accountId || accounts[0]?.id || 'ACC-1205'));
    
    setFormValuationType(warehouse.valuationType || 'included');
    setFormAllowedUsersType(warehouse.allowedUsersType);
    setFormAllowedUserIds(warehouse.allowedUserIds || []);
    setFormStatus(warehouse.status === 'inactive' || warehouse.status === 'غير نشط' ? 'غير نشط' : 'نشط');
    setIsDirty(false);
  };

  // Navigator Handlers
  const handleNavFirst = () => {
    if (warehouses.length > 0) loadWarehouseIntoForm(warehouses[0]);
  };
  const handleNavPrev = () => {
    if (warehouses.length === 0) return;
    const targetIdx = currentRecordIndex > 0 ? currentRecordIndex - 1 : warehouses.length - 1;
    loadWarehouseIntoForm(warehouses[targetIdx]);
  };
  const handleNavNext = () => {
    if (warehouses.length === 0) return;
    const targetIdx = currentRecordIndex >= 0 && currentRecordIndex < warehouses.length - 1 ? currentRecordIndex + 1 : 0;
    loadWarehouseIntoForm(warehouses[targetIdx]);
  };
  const handleNavLast = () => {
    if (warehouses.length > 0) loadWarehouseIntoForm(warehouses[warehouses.length - 1]);
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', _title: string, message: string) => {
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

  // SAVE HANDLER
  const handleSave = () => {
    // 1. Mandatory Name
    if (!formName.trim()) {
      showToast('error', 'حقل إجباري مطلوب', 'يرجى إدخال اسم المخزن.');
      nameInputRef.current?.focus();
      return;
    }

    // 2. Specific users with zero selected
    if (formAllowedUsersType === 'specific' && formAllowedUserIds.length === 0) {
      showToast('error', 'تحديد المستخدمين', 'عند اختيار "مستخدمون محددون"، يجب اختيار مستخدم واحد على الأقل مصرح له.');
      return;
    }

    const selectedBranch = branches.find(b => b.id === formBranchId) || branches[0];
    const branchId = selectedBranch?.id || 'BR-01';
    const branchName = selectedBranch?.name || 'الفرع الرئيسي';
    const selectedAcc = accounts.find(a => a.id === formAccountId || a.code === formAccountId) || accounts[0];
    const accountId = selectedAcc ? selectedAcc.id : (formAccountId || 'ACC-1205');
    const accountName = selectedAcc ? selectedAcc.name : 'المخزون (مخزون بضائع بغرض البيع)';
    const finalCode = formCode.trim() || warehouseService.getNextWarehouseCode();

    const warehouseData = {
      code: finalCode,
      name: formName.trim(),
      nameEn: formNameEn.trim() || undefined,
      branchId,
      branchName,
      accountId,
      accountName,
      valuationType: formValuationType,
      allowedUsersType: formAllowedUsersType,
      allowedUserIds: formAllowedUsersType === 'all' ? [] : formAllowedUserIds,
      status: formStatus === 'نشط' ? ('نشط' as const) : ('غير نشط' as const)
    };

    if (loadedWarehouse) {
      // EDIT MODE
      const res = warehouseService.updateWarehouse(loadedWarehouse.id, warehouseData);
      if (!res.success) {
        showToast('error', 'تعذر حفظ التعديلات', res.error || 'حدث خطأ أثناء تعديل بيانات المخزن.');
        return;
      }

      const updatedName = res.warehouse?.name || formName;
      const updatedCode = res.warehouse?.code || formCode;
      resetToNewMode();
      showToast('success', 'تم حفظ التعديلات', `تم تحديث بيانات المخزن [${updatedCode}] (${updatedName}) بنجاح.`);
    } else {
      // NEW WAREHOUSE MODE
      const res = warehouseService.createWarehouse(warehouseData);
      if (!res.success) {
        showToast('error', 'تعذر إضافة المخزن', res.error || 'حدث خطأ أثناء إضافة المخزن الجديد.');
        return;
      }

      const savedName = res.warehouse?.name || formName;
      const savedCode = res.warehouse?.code || formCode;
      resetToNewMode();
      showToast('success', 'تم إضافة المخزن بنجاح', `تم حفظ وتسجيل المخزن [${savedCode}] (${savedName}) بنجاح.`);
    }
  };

  // DELETE HANDLER
  const handleDeleteClick = () => {
    if (!loadedWarehouse) {
      showToast('warning', 'تنبيه', 'يرجى اختيار مخزن مسجل أولاً لحذفه.');
      return;
    }

    const check = warehouseService.canDeleteWarehouse(loadedWarehouse.id);
    if (!check.canDelete) {
      setShowDeleteBlockedModal({
        isOpen: true,
        msg: check.reason || 'لا يمكن حذف المخزن لوجود حركات مخزنية أو مبيعات سابقة مسجلة عليه.',
        txCount: check.transactionCount || 0
      });
      return;
    }

    setShowDeleteConfirmModal({
      isOpen: true,
      warehouse: loadedWarehouse
    });
  };

  const confirmDelete = () => {
    if (!showDeleteConfirmModal.warehouse) return;
    const w = showDeleteConfirmModal.warehouse;
    const res = warehouseService.deleteWarehouse(w.id);
    setShowDeleteConfirmModal({ isOpen: false, warehouse: null });

    if (res.success) {
      showToast('warning', 'تم حذف المخزن', `تم حذف المخزن [${w.code}] ${w.name} بنجاح.`);
      resetToNewMode();
    } else {
      showToast('error', 'فشل في الحذف', res.error || 'تعذر حذف المخزن.');
    }
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
              <WarehouseIcon className="w-4 h-4 sm:w-5 h-5" />
            </div>
          </div>

          {/* Center: Title Centered, Bigger, Bold, Cairo Font */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
              بيانات المخازن
            </h2>
          </div>

          {/* Left: Status Badge and Close Button */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${
              loadedWarehouse 
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {loadedWarehouse ? `[${loadedWarehouse.code}]` : (formCode ? 'إضافة جديدة' : 'سجل جديد')}
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
        {/* 2. MAIN DATA ENTRY FORM: CODE, NAME, NAME_EN, BRANCH, STATUS */}
        {/* ========================================================= */}
        <div className="p-2.5 sm:p-3 space-y-2 border-b border-slate-800 bg-slate-900/70">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 items-center">
            
            {/* 1. كود المخزن */}
            <div className="md:col-span-2">
              <FieldLabelBox label="كود المخزن :" />
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
                title="بحث واختيار من سجل المخازن"
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse text-xs font-bold shrink-0 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث في المخازن</span>
              </button>
            </div>

            {/* 2. اسم المخزن */}
            <div className="md:col-span-2">
              <FieldLabelBox label="اسم المخزن :" required />
            </div>
            <div className="md:col-span-4">
              <FormInput
                ref={nameInputRef}
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setIsDirty(true);
                }}
                className="!h-8 !py-1 text-xs font-bold"
                required
              />
            </div>

            {/* 3. الاسم بالإنجليزية */}
            <div className="md:col-span-2">
              <FieldLabelBox label="الاسم بالإنجليزي :" />
            </div>
            <div className="md:col-span-4">
              <FormInput
                type="text"
                dir="ltr"
                value={formNameEn}
                onChange={(e) => {
                  setFormNameEn(e.target.value);
                  setIsDirty(true);
                }}
                className="text-left font-mono !h-8 !py-1 text-xs"
              />
            </div>

            {/* 4. الفرع */}
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
                className="!h-8 !py-1 text-xs font-bold"
              >
                <option value="">-- اختر الفرع --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* 5. حالة المخزن */}
            <div className="md:col-span-2">
              <FieldLabelBox label="حالة المخزن :" required />
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
          {/* 3. DUAL SUB-SECTIONS (USERS & ACCOUNTING/VALUATION)       */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-1">
            
            {/* SUB-SECTION 1: USERS PERMISSIONS */}
            <div className="lg:col-span-5 border border-slate-700/80 bg-slate-950/70 rounded-xl p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 space-x-reverse text-slate-200">
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-bold">المناديب المصرح لهم</span>
                  </div>
                </div>

                {/* Mode Selectors */}
                <div className="flex items-center space-x-4 space-x-reverse mb-1.5">
                  <label className="flex items-center space-x-1.5 space-x-reverse cursor-pointer text-xs text-slate-300 hover:text-white">
                    <input
                      type="radio"
                      name="warehouseUserPermissionType"
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
                      name="warehouseUserPermissionType"
                      checked={formAllowedUsersType === 'specific'}
                      onChange={() => {
                        setFormAllowedUsersType('specific');
                        setIsDirty(true);
                        if (formAllowedUserIds.length === 0 && availableUsers.length > 0) {
                          setFormAllowedUserIds([availableUsers[0].id]);
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
                      <span className="font-bold">المندوب</span>
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
                            className={`py-1 px-2 flex items-center justify-between cursor-pointer rounded hover:bg-slate-800/60 transition-colors ${
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
                    <span>متاح لجميع المناديب والمستخدمين المعتمدين</span>
                  </div>
                )}
              </div>
            </div>

            {/* SUB-SECTION 2: WAREHOUSE ACCOUNT & VALUATION TYPE */}
            <div className="lg:col-span-7 border border-slate-700/80 bg-slate-950/70 rounded-xl p-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
                  <div className="flex items-center space-x-1.5 space-x-reverse text-slate-200">
                    <FolderTree className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold">حساب المخزن ونوع التقييم</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-0.5">
                  {/* حساب المخزن */}
                  <div>
                    <FormLabel label="حساب المخزن (شجرة الحسابات) :" required className="!mb-1 text-xs" />
                    <FormSelect
                      value={formAccountId}
                      onChange={(e) => {
                        setFormAccountId(e.target.value);
                        setIsDirty(true);
                      }}
                      className="!h-8 !py-1 text-xs font-bold"
                    >
                      <option value="">-- اختر الحساب المخزني --</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </FormSelect>
                  </div>

                  {/* نوع التقييم */}
                  <div>
                    <FormLabel label="نوع التقييم :" required className="!mb-1 text-xs" />
                    <FormSelect
                      value={formValuationType}
                      onChange={(e) => {
                        setFormValuationType(e.target.value as 'included' | 'excluded');
                        setIsDirty(true);
                      }}
                      className="!h-8 !py-1 text-xs font-bold"
                    >
                      <option value="included">يدخل ضمن التقييم</option>
                      <option value="excluded">لا يدخل ضمن التقييم</option>
                    </FormSelect>
                  </div>
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
                disabled={warehouses.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأول"
              >
                |◀
              </button>
              <button
                type="button"
                onClick={handleNavPrev}
                disabled={warehouses.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السابق"
              >
                ◀
              </button>
              <span className="h-7 px-3 bg-slate-950 font-mono text-amber-400 font-bold border border-slate-800 rounded-lg flex items-center justify-center text-xs">
                {currentRecordIndex >= 0 ? currentRecordIndex + 1 : 0} of {warehouses.length}
              </span>
              <button
                type="button"
                onClick={handleNavNext}
                disabled={warehouses.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="التالي"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={handleNavLast}
                disabled={warehouses.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأخير"
              >
                ▶|
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {loadedWarehouse ? (
                <span>المخزن المحدد للتعديل: <strong className="text-slate-200">{loadedWarehouse.name}</strong></span>
              ) : formCode ? (
                <span className="text-emerald-400 font-bold">جاهز لإضافة مخزن جديد</span>
              ) : (
                <span className="text-slate-500 font-medium">لا توجد مخازن محفوظة — اضغط "جديد" للبدء</span>
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
            deleteDisabled={!loadedWarehouse}
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
      {/* 5. MODALS & DIALOGS                                       */}
      {/* ========================================================= */}

      {/* A. RECORDS BROWSER MODAL (SEARCH & LOAD) */}
      <WarehouseRecordsModal
        isOpen={showRecordsModal}
        onClose={() => setShowRecordsModal(false)}
        onLoadWarehouseIntoForm={(w) => {
          loadWarehouseIntoForm(w);
          setShowRecordsModal(false);
        }}
        loadedWarehouseId={loadedWarehouse?.id}
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
                <h3 className="text-sm font-bold text-slate-100">حماية القيود والحركات المخزنية</h3>
                <p className="text-xs text-slate-400">رفض عملية الحذف لضمان سلامة الأرصدة والتدقيق</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 leading-relaxed">
              {showDeleteBlockedModal.msg}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteBlockedModal({ isOpen: false, msg: '', txCount: 0 })}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. CONFIRM DELETION MODAL */}
      {showDeleteConfirmModal.isOpen && showDeleteConfirmModal.warehouse && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">تأكيد حذف المخزن</h3>
                <p className="text-xs text-slate-400">المخزن خالٍ من الحركات ويمكن حذفه بأمان</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المخزن <strong>[{showDeleteConfirmModal.warehouse.code}] {showDeleteConfirmModal.warehouse.name}</strong> نهائياً من قاعدة البيانات؟
            </p>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal({ isOpen: false, warehouse: null })}
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
