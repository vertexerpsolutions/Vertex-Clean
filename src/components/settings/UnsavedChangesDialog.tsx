import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface UnsavedChangesDialogProps {
  isOpen: boolean;
  onStay: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesDialog: React.FC<UnsavedChangesDialogProps> = ({
  isOpen,
  onStay,
  onDiscard
}) => {
  if (!isOpen) return null;

  return (
    <div id="unsaved-changes-dialog-overlay" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-fadeIn" dir="rtl">
      <div 
        id="unsaved-changes-dialog"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-right relative"
      >
        <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6 shrink-0" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-100">تأكيد الإغلاق</h3>
            <p className="text-xs text-slate-400 mt-0.5">توجد بيانات تم تعديلها ولم تُحفظ بعد</p>
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          لديك تغييرات غير محفوظة، هل تريد الخروج بدون حفظ؟
        </p>

        <div className="flex items-center justify-end space-x-3 space-x-reverse pt-2">
          <button
            type="button"
            id="btn-unsaved-stay"
            onClick={onStay}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
          >
            العودة
          </button>
          <button
            type="button"
            id="btn-unsaved-discard"
            onClick={onDiscard}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-rose-600/20 transition-colors"
          >
            الخروج بدون حفظ
          </button>
        </div>
      </div>
    </div>
  );
};
