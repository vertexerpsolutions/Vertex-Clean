import React, { useState, useEffect, useRef } from 'react';
import { 
  regionService, 
  Region 
} from '../../services/regionService';
import { UnifiedMessageOverlay } from '../common/UnifiedMessageOverlay';
import { FormInput, FormSelect } from '../common';
import { RegionTreeModal } from './RegionTreeModal';
import { StandardActionBar } from '../common/StandardActionBar';
import { 
  MapPin, 
  FolderTree, 
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
  Printer,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';

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

export interface RegionMasterViewProps {
  initialRegionId?: string;
  onClose?: () => void;
  onNavigateSection?: (section: any) => void;
}

export const RegionMasterView: React.FC<RegionMasterViewProps> = ({
  initialRegionId,
  onClose,
  onNavigateSection
}) => {
  const [regions, setRegions] = useState<Region[]>([]);
  
  // Active Loaded Region (Null = New Mode, Region = Edit Mode)
  const [loadedRegion, setLoadedRegion] = useState<Region | null>(null);
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(-1);

  // Form Fields State (Organizer Reference)
  const [formClassification, setFormClassification] = useState<string>('تصنيف تحليلي');
  const [formParentId, setFormParentId] = useState<string>('');
  const [formCode, setFormCode] = useState<string>('');
  const [formName, setFormName] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'نشط' | 'غير نشط'>('نشط');
  const [formNotes, setFormNotes] = useState<string>('');

  // Modals & Popups
  const [showTreeModal, setShowTreeModal] = useState<boolean>(false);
  const [showDeleteBlockedModal, setShowDeleteBlockedModal] = useState<{ isOpen: boolean; msg: string; count?: number }>({ isOpen: false, msg: '' });
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<{ isOpen: boolean; region: Region | null }>({ isOpen: false, region: null });

  // Notifications State (Unified with Master Template)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const refreshData = () => {
    const list = regionService.getAllRegions();
    setRegions(list);
    return list;
  };

  const clearEmptyState = () => {
    setLoadedRegion(null);
    setCurrentRecordIndex(-1);
    setFormClassification('تصنيف تحليلي');
    setFormParentId('');
    setFormCode('');
    setFormName('');
    setFormStatus('نشط');
    setFormNotes('');
    setIsDirty(false);
    setFormError(null);
  };

  useEffect(() => {
    const list = refreshData();
    const unsub = regionService.subscribe(() => {
      refreshData();
    });

    if (initialRegionId) {
      const found = regionService.getRegionById(initialRegionId);
      if (found) {
        loadRegionIntoForm(found, list);
      } else {
        clearEmptyState();
      }
    } else {
      if (list.length > 0) {
        loadRegionIntoForm(list[0], list);
      } else {
        clearEmptyState();
      }
    }

    return () => unsub();
  }, [initialRegionId]);

  // Load a region into active editing state
  const loadRegionIntoForm = (region: Region, currentList?: Region[]) => {
    const activeList = currentList || regions;
    const idx = activeList.findIndex(r => r.id === region.id);
    setCurrentRecordIndex(idx);
    setLoadedRegion(region);

    setFormClassification(region.classification || 'تصنيف تحليلي');
    setFormParentId(region.parentId || '');
    setFormCode(region.code);
    setFormName(region.name);
    setFormStatus(region.status === 'غير نشط' || region.status === 'inactive' ? 'غير نشط' : 'نشط');
    setFormNotes(region.notes || '');

    setIsDirty(false);
    setFormError(null);
  };

  // Reset to New Region Registration Mode
  const resetToNewMode = (targetParentId?: string) => {
    setLoadedRegion(null);
    setCurrentRecordIndex(-1);

    const parent = targetParentId !== undefined ? targetParentId : formParentId;
    const nextCode = regionService.getNextHierarchicalCode(parent || null);

    setFormClassification('تصنيف تحليلي');
    setFormParentId(parent || '');
    setFormCode(nextCode);
    setFormName('');
    setFormStatus('نشط');
    setFormNotes('');

    setIsDirty(false);
    setFormError(null);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  // Handle changing parent region
  const handleParentChange = (newParentId: string) => {
    setFormParentId(newParentId);
    setIsDirty(true);

    // If in New mode, update the auto-generated code according to new parent hierarchy
    if (!loadedRegion) {
      const nextCode = regionService.getNextHierarchicalCode(newParentId || null);
      setFormCode(nextCode);
    }
  };

  // Stepper Navigator Handlers
  const handleNavFirst = () => {
    if (regions.length > 0) loadRegionIntoForm(regions[0]);
  };
  const handleNavPrev = () => {
    if (regions.length === 0) return;
    const targetIdx = currentRecordIndex > 0 ? currentRecordIndex - 1 : regions.length - 1;
    loadRegionIntoForm(regions[targetIdx]);
  };
  const handleNavNext = () => {
    if (regions.length === 0) return;
    const targetIdx = currentRecordIndex >= 0 && currentRecordIndex < regions.length - 1 ? currentRecordIndex + 1 : 0;
    loadRegionIntoForm(regions[targetIdx]);
  };
  const handleNavLast = () => {
    if (regions.length > 0) loadRegionIntoForm(regions[regions.length - 1]);
  };

  // Status Toggle
  const toggleStatus = () => {
    const next = formStatus === 'نشط' ? 'غير نشط' : 'نشط';
    setFormStatus(next);
    setIsDirty(true);
    if (next === 'غير نشط') {
      setToastMessage('تنبيه: تعطيل المنطقة يمنع اختيارها في العمليات والمعاملات الجغرافية الجديدة.');
    }
  };

  // SAVE HANDLER (Enforces Master Data standard workflow: Save -> Notification -> New Record with auto-code)
  const handleSave = () => {
    if (!formName.trim()) {
      setFormError('اسم المنطقة حقل إجباري مطلوب، يرجى كتابة اسم المنطقة.');
      nameInputRef.current?.focus();
      return;
    }

    const regionData = {
      name: formName.trim(),
      parentId: formParentId.trim() ? formParentId.trim() : null,
      classification: formClassification,
      status: formStatus,
      notes: formNotes.trim()
    };

    if (loadedRegion) {
      // EDIT MODE
      const res = regionService.updateRegion(loadedRegion.id, regionData);
      if (res.success && res.region) {
        setToastMessage(`تم تعديل بيانات المنطقة "${res.region.name}" بنجاح.`);
        loadRegionIntoForm(res.region);
        setIsDirty(false);
      } else {
        setFormError(res.error || 'فشلت عملية حفظ التعديلات.');
      }
    } else {
      // NEW REGISTRATION MODE
      const res = regionService.createRegion(regionData);
      if (res.success && res.region) {
        setToastMessage(`تم حفظ المنطقة الجديدة "${res.region.name}" بالكود [${res.region.code}] بنجاح.`);
        // Auto-open next fresh record with next hierarchical code
        resetToNewMode(formParentId);
      } else {
        setFormError(res.error || 'فشلت عملية تسجيل المنطقة الجديدة.');
      }
    }
  };

  // DELETE HANDLERS
  const handleDeleteClick = () => {
    if (!loadedRegion) return;

    // Check if region has children
    const directChildren = regionService.getDirectChildren(loadedRegion.id);
    if (directChildren.length > 0) {
      setShowDeleteBlockedModal({
        isOpen: true,
        msg: 'لا يمكن حذف المنطقة لأنها تحتوي على مناطق فرعية.',
        count: directChildren.length
      });
      return;
    }

    // Check if region has linked transactions
    if (loadedRegion.transactionCount > 0) {
      setShowDeleteBlockedModal({
        isOpen: true,
        msg: `لا يمكن حذف المنطقة (${loadedRegion.name}) لوجود (${loadedRegion.transactionCount}) حركة وعملية جغرافية مسجلة عليها في النظام.`,
        count: loadedRegion.transactionCount
      });
      return;
    }

    // Safe to delete
    setShowDeleteConfirmModal({
      isOpen: true,
      region: loadedRegion
    });
  };

  const confirmDelete = () => {
    if (!showDeleteConfirmModal.region) return;
    const reg = showDeleteConfirmModal.region;
    const res = regionService.deleteRegion(reg.id);

    if (res.success) {
      setShowDeleteConfirmModal({ isOpen: false, region: null });
      setToastMessage(`تم حذف المنطقة [${reg.code}] ${reg.name} بنجاح.`);
      
      const updatedList = regionService.getAllRegions();
      if (updatedList.length > 0) {
        loadRegionIntoForm(updatedList[0], updatedList);
      } else {
        resetToNewMode();
      }
    } else {
      setShowDeleteConfirmModal({ isOpen: false, region: null });
      setFormError(res.error || 'فشلت عملية الحذف.');
    }
  };

  // Print Preview
  const handlePrint = () => {
    window.print();
  };

  const handleCloseScreen = () => {
    if (onClose) {
      onClose();
    } else if (onNavigateSection) {
      onNavigateSection('products');
    }
  };

  // Filter available parents to exclude self and all descendants when editing
  const availableParents = React.useMemo(() => {
    if (!loadedRegion) {
      return regions;
    }
    const excludedIds = new Set([loadedRegion.id, ...regionService.getDescendantIds(loadedRegion.id)]);
    return regions.filter(r => !excludedIds.has(r.id));
  }, [regions, loadedRegion]);

  return (
    <div 
      className="flex flex-col font-['Cairo',sans-serif] w-full select-none"
      dir="rtl"
    >
      
      {/* ========================================================= */}
      {/* 1. MASTER TEMPLATE CONTAINER                              */}
      {/* ========================================================= */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col w-full">
        
        {/* ========================================================= */}
        {/* 2. TOP TOOLBAR & HEADER                                   */}
        {/* ========================================================= */}
        <div className="relative px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 font-['Cairo',sans-serif]">
          {/* Right Icon */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <MapPin className="w-4 h-4 sm:w-5 h-5" />
            </div>
          </div>

          {/* Center: Title Centered, Bigger, Bold, Cairo Font */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-wide font-['Cairo',sans-serif]">
              بيانات الموقع (المناطق)
            </h2>
          </div>

          {/* Left: Status Toggle Badge, Code Badge, and Close Button */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={toggleStatus}
              title="انقر لتغيير حالة نشاط المنطقة"
              className={`flex items-center space-x-1.5 space-x-reverse px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                formStatus === 'نشط'
                  ? 'bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-400 border-emerald-500/40'
                  : 'bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border-rose-500/40'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${formStatus === 'نشط' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{formStatus === 'نشط' ? 'منطقة نشطة' : 'منطقة غير نشطة'}</span>
            </button>
            <span className={`text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full ${
              loadedRegion
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono' 
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {loadedRegion ? `[${loadedRegion.code}]` : (formCode ? 'إضافة جديدة' : 'سجل جديد')}
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
        {/* 3. DATA ENTRY FORM: CODE, NAME, CATEGORIES, NOTES         */}
        {/* ========================================================= */}
        <div className="p-2.5 sm:p-3 space-y-2 border-b border-slate-800 bg-slate-900/70">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-2.5 items-center">
            
            {/* 1. كود المنطقة + زر الشجرة */}
            <div className="md:col-span-2">
              <FieldLabelBox label="كود المنطقة :" />
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
                onClick={() => setShowTreeModal(true)}
                title="استعراض شجرة التوزيع الجغرافي"
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center space-x-1.5 space-x-reverse text-xs font-bold shrink-0 shadow-2xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>الشجرة</span>
              </button>
            </div>

            {/* 2. اسم المنطقة */}
            <div className="md:col-span-2">
              <FieldLabelBox label="اسم المنطقة :" required />
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                className="!h-8 !py-1 text-xs font-bold"
                required
                autoFocus
              />
            </div>

            {/* 3. التصنيف */}
            <div className="md:col-span-2">
              <FieldLabelBox 
                label="التصنيف :" 
                icon={<Layers className="w-3.5 h-3.5 text-blue-400" />}
              />
            </div>
            <div className="md:col-span-4">
              <FormSelect
                value={formClassification}
                onChange={(e) => {
                  setFormClassification(e.target.value);
                  setIsDirty(true);
                }}
                className="!h-8 !py-1 text-xs font-bold"
              >
                <option value="تصنيف تحليلي">تصنيف تحليلي</option>
                <option value="تصنيف رئيسي">تصنيف رئيسي</option>
                <option value="تصنيف فرعي">تصنيف فرعي</option>
              </FormSelect>
            </div>

            {/* 4. التصنيف الأب */}
            <div className="md:col-span-2">
              <FieldLabelBox 
                label="التصنيف الأب :" 
                icon={<FolderTree className="w-3.5 h-3.5 text-amber-400" />}
              />
            </div>
            <div className="md:col-span-4">
              <FormSelect
                value={formParentId}
                onChange={(e) => handleParentChange(e.target.value)}
                className="!h-8 !py-1 text-xs font-bold"
              >
                <option value="">(بدون - منطقة رئيسية)</option>
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.parentId ? `└─ [${parent.code}] ${parent.name}` : `■ [${parent.code}] ${parent.name}`}
                  </option>
                ))}
              </FormSelect>
            </div>

            {/* 5. ملاحظات وتفاصيل */}
            <div className="md:col-span-2">
              <FieldLabelBox 
                label="ملاحظات وتفاصيل :" 
                icon={<FileText className="w-3.5 h-3.5 text-slate-400" />}
              />
            </div>
            <div className="md:col-span-10">
              <FormInput
                type="text"
                value={formNotes}
                onChange={(e) => {
                  setFormNotes(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="أي ملاحظات أو بيانات إضافية حول المنطقة..."
                className="!h-8 !py-1 text-xs font-medium"
              />
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* 4. MASTER ACTION BUTTONS (Standard Action Bar)            */}
        {/* ========================================================= */}
        <div className="pt-2 border-t border-slate-800 p-2 sm:p-2.5 bg-slate-900/90 font-['Cairo',sans-serif]">
          <StandardActionBar
            hasHold={false}
            gridCols={6}
            onNew={resetToNewMode}
            onSave={handleSave}
            onView={() => setShowTreeModal(true)}
            onDelete={handleDeleteClick}
            deleteDisabled={!loadedRegion}
            onPrint={handlePrint}
            onClose={handleCloseScreen}
            newLabel="1. جديد"
            saveLabel="2. حفظ السجل"
            viewLabel="3. عرض"
            deleteLabel="4. حذف"
            printLabel="5. طباعة"
            closeLabel="6. إغلاق"
          />
        </div>

      </div>

      {/* ========================================================= */}
      {/* 5. MODALS & DIALOGS */}
      {/* ========================================================= */}

      {/* A. HIERARCHICAL TREE MODAL (SELECTOR) */}
      <RegionTreeModal
        isOpen={showTreeModal}
        onClose={() => setShowTreeModal(false)}
        onSelectRegion={(reg) => {
          loadRegionIntoForm(reg);
          setShowTreeModal(false);
        }}
        selectedRegionId={loadedRegion?.id}
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
                <h3 className="text-sm font-bold text-slate-100">حماية الشجرة الجغرافية والبيانات</h3>
                <p className="text-xs text-slate-400">تعذر الحذف لضمان سلامة الهيكل الهرمي</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 leading-relaxed font-medium">
              {showDeleteBlockedModal.msg}
            </div>

            <div className="text-[11px] text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
              💡 <strong>توصية:</strong> إذا كانت المنطقة تحتوي على مناطق فرعية، يجب حذف أو نقل المناطق التابعة أولاً، أو يمكنك تغيير حالتها إلى <strong>"غير نشطة"</strong> بدلاً من الحذف.
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

      {/* C. CONFIRM DELETION MODAL */}
      {showDeleteConfirmModal.isOpen && showDeleteConfirmModal.region && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">تأكيد حذف المنطقة</h3>
                <p className="text-xs text-slate-400">المنطقة خالية من أي مناطق فرعية أو معاملات سابقة</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المنطقة <strong>[{showDeleteConfirmModal.region.code}] {showDeleteConfirmModal.region.name}</strong> نهائياً من شجرة المناطق؟
            </p>

            <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal({ isOpen: false, region: null })}
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
