import React, { useState, useEffect } from 'react';
import { Layers, FolderTree, X, Check } from 'lucide-react';

interface ClassificationMethodSelectorModalProps {
  isOpen: boolean;
  initialMode?: '2-level' | '3-level';
  onClose: () => void;
  onConfirm: (levelMode: '2-level' | '3-level') => void;
}

export const ClassificationMethodSelectorModal: React.FC<ClassificationMethodSelectorModalProps> = ({
  isOpen,
  initialMode = '2-level',
  onClose,
  onConfirm
}) => {
  const [selectedMode, setSelectedMode] = useState<'2-level' | '3-level'>(initialMode);

  useEffect(() => {
    if (isOpen) {
      setSelectedMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Handle keyboard events (Enter to confirm, Escape to cancel)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm(selectedMode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedMode, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fadeIn" 
      dir="rtl"
    >
      <div 
        className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100 animate-scaleUp"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                طريقة تصنيف الأصناف
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                اختر الهيكل التنظيمي المطلوب لعرض شجرة الأصناف
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="إلغاء"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-5 space-y-3">
          {/* Option 1: 2 Levels */}
          <div
            onClick={() => setSelectedMode('2-level')}
            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 space-x-reverse ${
              selectedMode === '2-level'
                ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md shadow-amber-500/10'
                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="pt-0.5">
              <div 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedMode === '2-level'
                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                    : 'border-slate-600 bg-slate-900'
                }`}
              >
                {selectedMode === '2-level' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="font-bold text-sm text-slate-100">مستويان</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 font-bold">
                  2 Levels
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                مجموعة رئيسية ← صنف
              </p>
            </div>

            <div className="text-slate-500 pt-0.5">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          {/* Option 2: 3 Levels */}
          <div
            onClick={() => setSelectedMode('3-level')}
            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start space-x-3 space-x-reverse ${
              selectedMode === '3-level'
                ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md shadow-amber-500/10'
                : 'border-slate-800 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 text-slate-300'
            }`}
          >
            <div className="pt-0.5">
              <div 
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selectedMode === '3-level'
                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                    : 'border-slate-600 bg-slate-900'
                }`}
              >
                {selectedMode === '3-level' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="font-bold text-sm text-slate-100">3 مستويات</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-blue-400 border border-blue-500/30 font-bold">
                  3 Levels
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                مجموعة رئيسية ← مجموعة فرعية ← صنف
              </p>
            </div>

            <div className="text-slate-500 pt-0.5">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center justify-end space-x-2.5 space-x-reverse">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={() => onConfirm(selectedMode)}
            className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-1.5 space-x-reverse"
          >
            <span>اعتماد</span>
          </button>
        </div>
      </div>
    </div>
  );
};
