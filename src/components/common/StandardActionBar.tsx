import React from 'react';
import { 
  FilePlus, 
  Save, 
  PauseCircle, 
  Eye, 
  Printer, 
  XCircle, 
  LogOut,
  Trash2,
  Edit3
} from 'lucide-react';

export interface StandardActionBarProps {
  onNew?: () => void;
  onSave?: () => void;
  onHold?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  onPrint?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onClose?: () => void;

  hasHold?: boolean; // Default is false! Only true for Sales/Purchases/Inward/Outward

  newLabel?: string;
  saveLabel?: string;
  holdLabel?: string;
  editLabel?: string;
  viewLabel?: string;
  printLabel?: string;
  deleteLabel?: string;
  cancelLabel?: string;
  closeLabel?: string;

  newDisabled?: boolean;
  saveDisabled?: boolean;
  holdDisabled?: boolean;
  editDisabled?: boolean;
  viewDisabled?: boolean;
  printDisabled?: boolean;
  deleteDisabled?: boolean;
  cancelDisabled?: boolean;
  closeDisabled?: boolean;

  className?: string;
  compact?: boolean;
  gridCols?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'auto';
}

export const StandardActionBar: React.FC<StandardActionBarProps> = ({
  onNew,
  onSave,
  onHold,
  onEdit,
  onView,
  onPrint,
  onDelete,
  onCancel,
  onClose,
  hasHold = false,

  newLabel,
  saveLabel,
  holdLabel = '3. تعليق',
  editLabel,
  viewLabel,
  printLabel,
  deleteLabel,
  cancelLabel,
  closeLabel,

  newDisabled = false,
  saveDisabled = false,
  holdDisabled = false,
  editDisabled = false,
  viewDisabled = false,
  printDisabled = false,
  deleteDisabled = false,
  cancelDisabled = false,
  closeDisabled = false,

  className = '',
  compact = false,
  gridCols
}) => {
  // Label defaults based on whether Hold is present or not
  const defaultNewLabel = hasHold ? '1. فاتورة جديدة' : '1. جديد';
  const defaultSaveLabel = hasHold ? '2. حفظ ودفع' : '2. حفظ السجل';
  const defaultEditLabel = '3. تعديل';
  const defaultViewLabel = hasHold ? '4. عرض' : '3. عرض';
  const defaultPrintLabel = hasHold ? '5. طباعة' : '4. طباعة';
  const defaultDeleteLabel = '5. حذف';
  const defaultCancelLabel = hasHold ? '6. إلغاء' : '5. إلغاء';
  const defaultCloseLabel = hasHold ? '7. إغلاق' : '6. إغلاق';

  const btnPadding = compact ? 'p-2 text-[11px]' : 'p-2.5 text-xs';
  const iconSize = compact ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const gridClasses = gridCols === 2
    ? 'grid grid-cols-2 gap-2'
    : gridCols === 3
    ? 'grid grid-cols-3 gap-2'
    : gridCols === 4
    ? 'grid grid-cols-2 sm:grid-cols-4 gap-2'
    : gridCols === 5
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2'
    : gridCols === 6
    ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2'
    : gridCols === 7
    ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2'
    : gridCols === 8
    ? 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2'
    : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2';

  return (
    <div className={`space-y-2 dir-rtl text-right font-sans ${className}`} dir="rtl">
      <div className={gridClasses}>
        {/* 1. جديد / فاتورة جديدة - F1 (Blue) */}
        {onNew && (
          <button
            type="button"
            onClick={onNew}
            disabled={newDisabled}
            className={`${btnPadding} rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-blue-600/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-blue-400/30`}
          >
            <FilePlus className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{newLabel || defaultNewLabel}</span>
          </button>
        )}

        {/* 2. حفظ / حفظ ودفع - F2 (Emerald Green) */}
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={saveDisabled}
            className={`${btnPadding} rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-emerald-400/30`}
          >
            <Save className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{saveLabel || defaultSaveLabel}</span>
          </button>
        )}

        {/* 3. تعليق - F3 (Teal/Cyan) - ONLY IF HAS HOLD */}
        {hasHold && onHold && (
          <button
            type="button"
            onClick={onHold}
            disabled={holdDisabled}
            className={`${btnPadding} rounded-xl bg-teal-700 hover:bg-teal-600 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-teal-700/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-teal-400/30`}
          >
            <PauseCircle className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{holdLabel}</span>
          </button>
        )}

        {/* تعديل - (Blue/Sky) - IF PROVIDED */}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            disabled={editDisabled}
            className={`${btnPadding} rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-sky-600/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-sky-400/30`}
          >
            <Edit3 className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{editLabel || defaultEditLabel}</span>
          </button>
        )}

        {/* 4. عرض - F4 (Purple / Violet) */}
        {onView && (
          <button
            type="button"
            onClick={onView}
            disabled={viewDisabled}
            className={`${btnPadding} rounded-xl bg-purple-700 hover:bg-purple-600 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-purple-700/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-purple-400/30`}
          >
            <Eye className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{viewLabel || defaultViewLabel}</span>
          </button>
        )}

        {/* 5. طباعة - F5 (Vivid Sky / Blue) */}
        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            disabled={printDisabled}
            className={`${btnPadding} rounded-xl bg-blue-500 hover:bg-blue-400 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-blue-300/30`}
          >
            <Printer className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{printLabel || defaultPrintLabel}</span>
          </button>
        )}

        {/* حذف - F6 Alternative (Rose / Crimson Red) - IF PROVIDED */}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleteDisabled}
            className={`${btnPadding} rounded-xl bg-rose-700 hover:bg-rose-600 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-rose-700/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-rose-400/30`}
          >
            <Trash2 className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{deleteLabel || defaultDeleteLabel}</span>
          </button>
        )}

        {/* 6. إلغاء - F6 (Crimson Red) */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelDisabled}
            className={`${btnPadding} rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] disabled:opacity-40 text-white font-bold shadow-md shadow-red-600/20 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full border border-red-400/30`}
          >
            <XCircle className={`${iconSize} text-white shrink-0`} />
            <span className="truncate">{cancelLabel || defaultCancelLabel}</span>
          </button>
        )}

        {/* 7. إغلاق - F7 (Charcoal Slate) - ONLY IF ONCLOSE PROVIDED */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className={`${btnPadding} rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] disabled:opacity-40 text-slate-200 font-bold border border-slate-700 hover:border-slate-600 flex items-center justify-center space-x-2 space-x-reverse transition-all cursor-pointer w-full shadow-sm`}
          >
            <LogOut className={`${iconSize} text-slate-300 shrink-0`} />
            <span className="truncate">{closeLabel || defaultCloseLabel}</span>
          </button>
        )}
      </div>
    </div>
  );
};
