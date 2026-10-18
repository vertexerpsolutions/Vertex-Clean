import React, { useState, useEffect, useRef } from 'react';
import { 
  unitOfMeasureService, 
  UnitOfMeasure 
} from '../../../../services/unitOfMeasureService';
import { FormInput, FormLabel } from '../../../common';
import { UnifiedMessageOverlay, UnifiedMessageType } from '../../../common/UnifiedMessageOverlay';
import { StandardActionBar } from '../../../common/StandardActionBar';
import { UnitOfMeasureRecordsModal } from './UnitOfMeasureRecordsModal';
import { 
  Scale, 
  Search, 
  Trash2, 
  AlertTriangle, 
  Lock, 
  X, 
  Package 
} from 'lucide-react';

export interface UnitOfMeasureViewProps {
  initialUnitId?: string;
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

type FormMode = 'view' | 'edit' | 'new';

export const UnitOfMeasureView: React.FC<UnitOfMeasureViewProps> = ({
  initialUnitId,
  onClose,
  onNavigateSection
}) => {
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  
  // Active Loaded Unit (null in new mode)
  const [loadedUnit, setLoadedUnit] = useState<UnitOfMeasure | null>(null);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);
  const [mode, setMode] = useState<FormMode>('new');

  // Form Fields State
  const [formCode, setFormCode] = useState<string>(() => unitOfMeasureService.generateNextCode());
  const [formName, setFormName] = useState<string>('');

  // Modals and Alerts
  const [showRecordsModal, setShowRecordsModal] = useState<boolean>(false);
  const [showDeleteBlockedModal, setShowDeleteBlockedModal] = useState<{ 
    isOpen: boolean; 
    reason: string; 
    usageCount?: number;
    isSystem?: boolean;
  }>({ isOpen: false, reason: '' });
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<{ 
    isOpen: boolean; 
    unit: UnitOfMeasure | null 
  }>({ isOpen: false, unit: null });

  // Notifications State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<UnifiedMessageType>('info');

  const nameInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    const list = unitOfMeasureService.getAllUnits();
    setUnits(list);
    return list;
  };

  const loadUnitIntoForm = (unit: UnitOfMeasure, list?: UnitOfMeasure[]) => {
    const currentList = list || units;
    const idx = currentList.findIndex(u => u.id === unit.id);
    setCurrentRecordIndex(idx);
    setLoadedUnit(unit);
    setFormCode(unit.code);
    setFormName(unit.name);
    setMode('view');
  };

  const clearEmptyState = () => {
    setLoadedUnit(null);
    setCurrentRecordIndex(-1);
    setFormCode('');
    setFormName('');
    setMode('view');
  };

  useEffect(() => {
    const list = refreshData();
    const unsub = unitOfMeasureService.subscribe(() => {
      refreshData();
    });

    if (initialUnitId) {
      const found = unitOfMeasureService.getUnitById(initialUnitId);
      if (found) {
        loadUnitIntoForm(found, list);
      } else {
        resetToNewMode();
      }
    } else {
      resetToNewMode();
    }

    return () => {
      unsub();
    };
  }, [initialUnitId]);

  const showToast = (type: UnifiedMessageType, message: string) => {
    setToastType(type);
    setToastMessage(message);
  };

  // Switch to New Record Mode
  const resetToNewMode = () => {
    const nextCode = unitOfMeasureService.generateNextCode();
    setMode('new');
    setLoadedUnit(null);
    setCurrentRecordIndex(-1);
    setFormCode(nextCode);
    setFormName('');

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  // Switch to Edit Mode for Loaded Unit
  const handleEditMode = () => {
    if (!loadedUnit) {
      showToast('warning', 'يرجى اختيار وحدة قياس أولاً لتعديلها.');
      return;
    }
    setMode('edit');
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  // Cancel Current Edit or New Action
  const handleCancel = () => {
    if (loadedUnit) {
      loadUnitIntoForm(loadedUnit);
    } else {
      resetToNewMode();
    }
  };

  // Navigator Handlers
  const handleNavFirst = () => {
    if (units.length > 0) loadUnitIntoForm(units[0]);
  };
  const handleNavPrev = () => {
    if (units.length === 0) return;
    const targetIdx = currentRecordIndex > 0 ? currentRecordIndex - 1 : units.length - 1;
    loadUnitIntoForm(units[targetIdx]);
  };
  const handleNavNext = () => {
    if (units.length === 0) return;
    const targetIdx = currentRecordIndex >= 0 && currentRecordIndex < units.length - 1 ? currentRecordIndex + 1 : 0;
    loadUnitIntoForm(units[targetIdx]);
  };
  const handleNavLast = () => {
    if (units.length > 0) loadUnitIntoForm(units[units.length - 1]);
  };

  // Save Handler
  const handleSave = () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      showToast('error', 'يرجى إدخال اسم وحدة القياس.');
      nameInputRef.current?.focus();
      return;
    }

    if (mode === 'new') {
      const res = unitOfMeasureService.addUnit(trimmedName, formCode.trim() || undefined);
      if (!res.success) {
        showToast('error', res.error || 'تعذر إضافة وحدة القياس.');
        return;
      }

      const freshList = refreshData();
      if (res.unit) {
        loadUnitIntoForm(res.unit, freshList);
      }
      showToast('success', `تمت إضافة وحدة القياس (${res.unit?.name}) بنجاح بكود [${res.unit?.code}].`);
    } else if (mode === 'edit') {
      if (!loadedUnit) return;
      const res = unitOfMeasureService.updateUnit(loadedUnit.id, trimmedName);
      if (!res.success) {
        showToast('error', res.error || 'تعذر تعديل وحدة القياس.');
        return;
      }

      const freshList = refreshData();
      if (res.unit) {
        loadUnitIntoForm(res.unit, freshList);
      }
      showToast('success', `تم حفظ وتحديث مسمى وحدة القياس (${res.unit?.name}) بنجاح وتحديث الأصناف المرتبطة بها.`);
    }
  };

  // Cancellation / Deactivation Click Validation
  const handleDeleteClick = () => {
    if (!loadedUnit) {
      showToast('warning', 'يرجى اختيار وحدة قياس أولاً لإلغائها.');
      return;
    }

    // Cancellation rule: Check usage across all catalog products (basicUnit, unit, subUnit)
    const usage = unitOfMeasureService.getUnitUsageCount(loadedUnit.name);
    if (usage > 0) {
      setShowDeleteBlockedModal({
        isOpen: true,
        reason: `لا يمكن إلغاء وحدة القياس (${loadedUnit.name}) لوجود ارتباطات فعلية مع (${usage}) صنف في شجرة الأصناف.`,
        usageCount: usage,
        isSystem: loadedUnit.isSystem
      });
      return;
    }

    // Allowed: Open confirm modal (even for system units since usage === 0)
    setShowDeleteConfirmModal({
      isOpen: true,
      unit: loadedUnit
    });
  };

  const confirmDelete = () => {
    if (!showDeleteConfirmModal.unit) return;
    const u = showDeleteConfirmModal.unit;
    const res = unitOfMeasureService.deactivateUnit(u.id);
    setShowDeleteConfirmModal({ isOpen: false, unit: null });

    if (res.success) {
      showToast('success', `تم إلغاء وتعطيل وحدة القياس [${u.code}] ${u.name} بنجاح وحجبها عن قوائم الأصناف الجديدة.`);
      const freshList = refreshData();
      if (freshList.length > 0) {
        const remaining = freshList.find(x => x.id === u.id) || freshList[0];
        loadUnitIntoForm(remaining, freshList);
      } else {
        clearEmptyState();
      }
    } else {
      showToast('error', res.error || 'فشلت عملية إلغاء وحدة القياس.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCloseScreen = () => {
    if (onClose) {
      onClose();
    } else if (onNavigateSection) {
      onNavigateSection('settings');
    }
  };

  const currentUsage = loadedUnit ? unitOfMeasureService.getUnitUsageCount(loadedUnit.name) : 0;

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
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          {/* Center: Title Centered, Bigger, Bold, Cairo Font */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
              بيانات وحدات القياس
            </h2>
          </div>

          {/* Left: Status Badge and Close Button */}
          <div className="flex items-center space-x-2 space-x-reverse">
            {loadedUnit && loadedUnit.status === 'inactive' && (
              <span className="text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                ملغاة (معطلة)
              </span>
            )}
            <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${
              mode === 'new'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : mode === 'edit'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : loadedUnit?.status === 'inactive'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
              {mode === 'new' 
                ? 'إضافة جديدة' 
                : mode === 'edit' 
                ? `تعديل [${formCode}]` 
                : loadedUnit 
                ? `[${loadedUnit.code}]` 
                : 'استعراض'}
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
        {/* 2. MAIN DATA ENTRY FORM: CODE, NAME, METADATA CARDS       */}
        {/* ========================================================= */}
        <div className="p-3 sm:p-4 space-y-3 border-b border-slate-800 bg-slate-900/70">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
            
            {/* 1. كود وحدة القياس */}
            <div className="md:col-span-2">
              <FieldLabelBox label="كود وحدة القياس :" />
            </div>
            <div className="md:col-span-10 flex items-center space-x-2 space-x-reverse">
              <div className="w-36 sm:w-48">
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
                title="استعراض والبحث في سجل وحدات القياس"
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse text-xs font-bold shrink-0 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>بحث في السجلات</span>
              </button>
            </div>

            {/* 2. اسم وحدة القياس */}
            <div className="md:col-span-2">
              <FieldLabelBox label="اسم وحدة القياس :" required />
            </div>
            <div className="md:col-span-10">
              <FormInput
                ref={nameInputRef}
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                readOnly={mode === 'view'}
                disabled={mode === 'view'}
                placeholder={mode === 'view' ? '' : 'أدخل اسم وحدة القياس بالعربية (مثال: كرتونة، باقة، متر...)'}
                className="!h-8 !py-1 text-xs font-bold"
                required
              />
            </div>

          </div>

          {/* Record Navigator Stepper */}
          <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-800 text-xs">
            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                type="button"
                onClick={handleNavFirst}
                disabled={units.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأول"
              >
                |◀
              </button>
              <button
                type="button"
                onClick={handleNavPrev}
                disabled={units.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السابق"
              >
                ◀
              </button>
              <span className="h-7 px-3 bg-slate-950 font-mono text-amber-400 font-bold border border-slate-800 rounded-lg flex items-center justify-center text-xs">
                {currentRecordIndex >= 0 ? currentRecordIndex + 1 : 0} of {units.length}
              </span>
              <button
                type="button"
                onClick={handleNavNext}
                disabled={units.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="التالي"
              >
                ▶
              </button>
              <button
                type="button"
                onClick={handleNavLast}
                disabled={units.length === 0}
                className="h-7 px-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg font-mono text-xs cursor-pointer border border-slate-700 transition-colors"
                title="السجل الأخير"
              >
                ▶|
              </button>
            </div>

            <div className="text-xs text-slate-400">
              {mode === 'new' ? (
                <span className="text-emerald-400 font-bold">جاهز لإضافة وحدة قياس جديدة — اضغط "حفظ السجل" للاعتماد</span>
              ) : mode === 'edit' && loadedUnit ? (
                <span className="text-amber-400 font-bold">جاري تعديل وحدة القياس: <strong className="text-slate-100">{loadedUnit.name}</strong></span>
              ) : loadedUnit ? (
                <span>
                  وحدة القياس المحددة: <strong className="text-slate-200">[{loadedUnit.code}] {loadedUnit.name}</strong>
                  {loadedUnit.status === 'inactive' && (
                    <span className="mr-2 text-rose-400 font-bold">(حالة الوحدة: ملغاة / معطلة)</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-500 font-medium">لا توجد وحدات قياس — اضغط "جديد" للبدء</span>
              )}
            </div>
          </div>

        </div>

        {/* ========================================================= */}
        {/* 3. BOTTOM ACTION BUTTONS (Standard Action Bar)            */}
        {/* ========================================================= */}
        <div className="pt-2 border-t border-slate-800 p-2 sm:p-2.5 bg-slate-900/90 font-['Cairo',sans-serif]">
          <StandardActionBar
            hasHold={false}
            gridCols={5}
            onNew={resetToNewMode}
            onSave={handleSave}
            onView={() => setShowRecordsModal(true)}
            onCancel={handleCancel}
            onClose={handleCloseScreen}
            newDisabled={mode === 'new'}
            saveDisabled={mode === 'view'}
            cancelDisabled={mode === 'view'}
            newLabel="1. جديد"
            saveLabel="2. حفظ السجل"
            viewLabel="3. عرض"
            cancelLabel="4. إلغاء"
            closeLabel="5. إغلاق"
          />
        </div>

      </div>

      {/* ========================================================= */}
      {/* 4. MODALS & OVERLAYS                                      */}
      {/* ========================================================= */}

      {/* Records Browse Modal */}
      <UnitOfMeasureRecordsModal
        isOpen={showRecordsModal}
        onClose={() => setShowRecordsModal(false)}
        onLoadUnitIntoForm={(u) => loadUnitIntoForm(u)}
        loadedUnitId={loadedUnit?.id}
        onDeleteUnit={(u) => {
          if (loadedUnit?.id === u.id) {
            const freshList = refreshData();
            if (freshList.length > 0) {
              loadUnitIntoForm(freshList[0], freshList);
            } else {
              clearEmptyState();
            }
          }
        }}
      />

      {/* Delete / Cancel Blocked Modal (Unified With Warehouse Standard) */}
      {showDeleteBlockedModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">
                تعذر إلغاء وحدة القياس
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              {showDeleteBlockedModal.reason}
            </p>

            {showDeleteBlockedModal.usageCount && showDeleteBlockedModal.usageCount > 0 ? (
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center space-x-2 space-x-reverse">
                <Package className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  لإلغاء هذه الوحدة، يجب أولاً تعديل أو نقل ارتباطها في الأصناف المرتبطة بها في شجرة الأصناف ({showDeleteBlockedModal.usageCount} صنف).
                </span>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteBlockedModal({ isOpen: false, reason: '' })}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                حسنًا، فهمت
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal (Unified With Warehouse Standard) */}
      {showDeleteConfirmModal.isOpen && showDeleteConfirmModal.unit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-['Cairo',sans-serif]" dir="rtl">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <Trash2 className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-100">
                تأكيد إلغاء وحدة القياس
              </h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في إلغاء وتعطيل وحدة القياس التالية؟
              <br />
              <span className="text-slate-400 text-[11px]">
                سيتم الاحتفاظ بسجلها التاريخي مع حجبها عن قوائم الاختيار للأصناف الجديدة.
              </span>
            </p>

            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">كود الوحدة:</span>
                <span className="font-mono font-bold text-amber-400">[{showDeleteConfirmModal.unit.code}]</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">اسم الوحدة:</span>
                <span className="font-bold text-slate-100">{showDeleteConfirmModal.unit.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">النوع:</span>
                <span className="text-xs text-slate-300">
                  {showDeleteConfirmModal.unit.isSystem ? 'أساسية نظامية' : 'مخصصة'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal({ isOpen: false, unit: null })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                نعم، إلغاء الوحدة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Notification Toast */}
      {toastMessage && (
        <UnifiedMessageOverlay
          isOpen={Boolean(toastMessage)}
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
          duration={3500}
        />
      )}

    </div>
  );
};
