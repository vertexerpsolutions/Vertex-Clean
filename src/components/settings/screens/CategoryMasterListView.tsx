import React, { useState } from 'react';
import { 
  FastProductItem, 
  CategoryTreeNode, 
  SubCategoryTreeNode,
  detectClassificationMode 
} from '../../../services/categoryService';
import { unitOfMeasureService } from '../../../services/unitOfMeasureService';
import { TwoLevelCategoryMasterView } from './TwoLevelCategoryMasterView';
import { ThreeLevelCategoryMasterView } from './ThreeLevelCategoryMasterView';
import { Layers } from 'lucide-react';

export type { FastProductItem, CategoryTreeNode, SubCategoryTreeNode };

/**
 * Dynamic getter and backward-compatible array backed by the central unitOfMeasureService.
 * Always reflects the 18 standard units plus any newly registered units.
 */
export const getCentralProductUnits = (): string[] => unitOfMeasureService.getUnitNames();
export const SYSTEM_PRODUCT_UNITS: string[] = unitOfMeasureService.getUnitNames();

interface CategoryMasterListViewProps {
  products: FastProductItem[];
  setProducts: React.Dispatch<React.SetStateAction<FastProductItem[]>>;
  categoryTree: CategoryTreeNode[];
  setCategoryTree: React.Dispatch<React.SetStateAction<CategoryTreeNode[]>>;
  categoryLevels?: 2 | 3;
  setCategoryLevels?: (levels: 2 | 3) => void;
  isStructureConfigured?: boolean;
  setIsStructureConfigured?: (configured: boolean) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  showNotice?: (msg: string) => void;
}

export const CategoryMasterListView: React.FC<CategoryMasterListViewProps> = ({
  products,
  setProducts,
  categoryTree,
  setCategoryTree,
  categoryLevels = 2,
  setCategoryLevels,
  isStructureConfigured = true,
  setIsStructureConfigured,
  onDirtyChange,
  showNotice
}) => {
  // Local level state if not passed from parent
  const [internalLevels, setInternalLevels] = useState<2 | 3>(() => {
    try {
      const saved = localStorage.getItem('vertex_category_structure_levels');
      return saved === '3' ? 3 : (categoryLevels || 2);
    } catch {
      return categoryLevels || 2;
    }
  });

  const detectedMode = detectClassificationMode(categoryTree, products);
  const activeLevel: 2 | 3 = detectedMode === '3-level'
    ? 3
    : detectedMode === '2-level'
      ? 2
      : (categoryLevels || internalLevels || 2);

  const handleToggleLevel = (newLevel: 2 | 3) => {
    setInternalLevels(newLevel);
    setCategoryLevels?.(newLevel);
    try {
      localStorage.setItem('vertex_category_structure_levels', String(newLevel));
      localStorage.setItem('vertex_category_structure_configured', 'true');
    } catch (e) {
      console.error(e);
    }
    showNotice?.(
      newLevel === 2
        ? 'تم التبديل إلى شاشة شجرة الأصناف (مستويان: مجموعة رئيسية ← صنف)'
        : 'تم التبديل إلى شاشة شجرة الأصناف (3 مستويات: مجموعة رئيسية ← مجموعة فرعية ← صنف)'
    );
  };

  return (
    <div className="space-y-3" dir="rtl">
      {/* Quick Level Switcher Ribbon for Seamless Testing & Switching */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs">
        <div className="flex items-center space-x-2 space-x-reverse text-slate-400">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-slate-300">نمط عرض الشاشة الحالية:</span>
          <span className="font-bold text-amber-400">
            {activeLevel === 2 ? 'مستويان (مجموعة رئيسية ← صنف)' : '3 مستويات (مجموعة رئيسية ← مجموعة فرعية ← صنف)'}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 space-x-reverse bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => handleToggleLevel(2)}
            className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] cursor-pointer ${
              activeLevel === 2
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            مستويان (2 Levels)
          </button>
          <button
            type="button"
            onClick={() => handleToggleLevel(3)}
            className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] cursor-pointer ${
              activeLevel === 3
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3 مستويات (3 Levels)
          </button>
        </div>
      </div>

      {/* Render the Completely Independent 2-Level or 3-Level Component */}
      {activeLevel === 2 ? (
        <TwoLevelCategoryMasterView
          products={products}
          setProducts={setProducts}
          categoryTree={categoryTree}
          setCategoryTree={setCategoryTree}
          onDirtyChange={onDirtyChange}
          showNotice={showNotice}
        />
      ) : (
        <ThreeLevelCategoryMasterView
          products={products}
          setProducts={setProducts}
          categoryTree={categoryTree}
          setCategoryTree={setCategoryTree}
          onDirtyChange={onDirtyChange}
          showNotice={showNotice}
        />
      )}
    </div>
  );
};
