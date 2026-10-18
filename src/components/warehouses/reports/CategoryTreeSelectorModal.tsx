import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderTree, 
  Folder, 
  FolderOpen, 
  Search, 
  X, 
  ChevronDown, 
  ChevronLeft, 
  Layers, 
  Check, 
  ChevronsDown, 
  ChevronsUp,
  Tag
} from 'lucide-react';
import { categoryService, CategoryTreeNode, SubCategoryTreeNode } from '../../../services/categoryService';

export interface CategorySelectionResult {
  mode: 'all' | 'main-only' | 'specific-sub' | 'main-with-subs';
  displayName: string;
  code?: string;
  mainName?: string;
  subName?: string;
}

interface CategoryTreeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: CategorySelectionResult) => void;
  currentSelected?: string;
  isDark: boolean;
}

// Standard system fallback hierarchy based on real enterprise inventory catalog
const DEFAULT_SYSTEM_CATEGORY_TREE: CategoryTreeNode[] = [
  {
    id: '004',
    name: 'كابلات وملحقات',
    level: 1,
    itemCount: 5,
    children: [
      { id: '004004', name: 'محولات وتحويلات شاشة (DisplayPort/HDMI)', level: 2, itemCount: 1 },
      { id: '007004', name: 'كابلات شبكات CAT6 عالية السرعة', level: 2, itemCount: 1 },
      { id: '004003', name: 'كابلات شاشات VGA وHDMI', level: 2, itemCount: 1 },
      { id: '007001', name: 'كابلات محورية Coaxial للمراقبة', level: 2, itemCount: 1 },
      { id: '004010', name: 'كابلات شحن سريع USB-C وملحقات', level: 2, itemCount: 1 }
    ]
  },
  {
    id: '005',
    name: 'معدات كمبيوتر',
    level: 1,
    itemCount: 4,
    children: [
      { id: '005002', name: 'أقراص صلبة HDD ووحدات تخزين ميكانيكية', level: 2, itemCount: 1 },
      { id: '005001', name: 'وحدات تخزين سريعة SSD وذاكرات', level: 2, itemCount: 1 },
      { id: '004003', name: 'لوحات مفاتيح وفأرات مكتبية وأجهزة إدخال', level: 2, itemCount: 2 }
    ]
  },
  {
    id: '006',
    name: 'إلكترونيات ومستلزمات',
    level: 1,
    itemCount: 3,
    children: [
      { id: '006004', name: 'سوكت وفيش وتوصيلات كهربائية BNC/Power', level: 2, itemCount: 2 },
      { id: '006005', name: 'بطاريات وتغذية أجهزة DVR وأنظمة أمان', level: 2, itemCount: 1 }
    ]
  }
];

export const CategoryTreeSelectorModal: React.FC<CategoryTreeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentSelected,
  isDark
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Load category tree from existing system service
  const categoryTree = useMemo(() => {
    try {
      const liveTree = categoryService.getCategoryTree();
      if (Array.isArray(liveTree) && liveTree.length > 0) {
        // If system service has live categories, enrich with any missing default groups
        const liveNames = new Set(liveTree.map(c => c.name));
        const missingDefaults = DEFAULT_SYSTEM_CATEGORY_TREE.filter(d => !liveNames.has(d.name));
        return [...liveTree, ...missingDefaults];
      }
    } catch {
      // fallback
    }
    return DEFAULT_SYSTEM_CATEGORY_TREE;
  }, [isOpen]);

  // Initialize expanded state on open
  useEffect(() => {
    if (isOpen) {
      const allIds = new Set<string>();
      categoryTree.forEach(c => allIds.add(c.id));
      setExpandedIds(allIds);
      setSearchQuery('');
    }
  }, [isOpen, categoryTree]);

  // Toggle expansion of a single node
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    categoryTree.forEach(c => allIds.add(c.id));
    setExpandedIds(allIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Filtered categories according to search query
  const filteredTree = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categoryTree;

    return categoryTree.map(cat => {
      const matchesMain = cat.name.toLowerCase().includes(q) || cat.id.toLowerCase().includes(q);
      const matchingChildren = (cat.children || []).filter(sub => 
        sub.name.toLowerCase().includes(q) || sub.id.toLowerCase().includes(q)
      );

      if (matchesMain) {
        return cat;
      }
      if (matchingChildren.length > 0) {
        return {
          ...cat,
          children: matchingChildren
        };
      }
      return null;
    }).filter((c): c is CategoryTreeNode => c !== null);
  }, [categoryTree, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div 
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400">
              <FolderTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                شجرة الأصناف — اختيار وتصفية المجموعة
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يمكنك اختيار المجموعة الرئيسية فقط، مجموعة فرعية محددة، أو المجموعة مع كافة تفرعاتها
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Search */}
        <div className="p-4 border-b space-y-3 border-slate-200 dark:border-slate-800">
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في شجرة المجموعات (اسم المجموعة أو كود التصنيف)..."
              className={`w-full text-xs rounded-xl pr-9 pl-9 py-2.5 border outline-none font-medium transition-all ${
                isDark 
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-blue-500' 
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-blue-500'
              }`}
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button 
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 space-x-reverse">
              <button 
                type="button"
                onClick={expandAll}
                className="flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                <ChevronsDown className="w-3.5 h-3.5" />
                <span>توسيع الكل</span>
              </button>
              <button 
                type="button"
                onClick={collapseAll}
                className="flex items-center space-x-1 space-x-reverse px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                <ChevronsUp className="w-3.5 h-3.5" />
                <span>طي الكل</span>
              </button>
            </div>

            <button 
              type="button"
              onClick={() => {
                onSelect({
                  mode: 'all',
                  displayName: 'جميع المجموعات'
                });
                onClose();
              }}
              className="flex items-center space-x-1.5 space-x-reverse px-3 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 font-bold transition-colors"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>اختيار: جميع المجموعات</span>
            </button>
          </div>
        </div>

        {/* Category Tree Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredTree.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
              لا توجد مجموعات مطابقة للبحث.
            </div>
          ) : (
            filteredTree.map(cat => {
              const isExpanded = expandedIds.has(cat.id);
              const hasChildren = Array.isArray(cat.children) && cat.children.length > 0;
              const isCurrentMain = currentSelected === cat.name;

              return (
                <div 
                  key={cat.id} 
                  className={`rounded-xl border transition-all ${
                    isDark 
                      ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Main Category Node Row */}
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 space-x-reverse flex-1 min-w-0">
                      {hasChildren ? (
                        <button 
                          type="button"
                          onClick={() => toggleExpand(cat.id)}
                          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                      ) : (
                        <span className="w-6" />
                      )}

                      <div className="text-amber-500">
                        {isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                      </div>

                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {cat.id}
                      </span>

                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                        {cat.name}
                      </span>

                      {hasChildren && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                          {cat.children!.length} مجموعات فرعية
                        </span>
                      )}
                    </div>

                    {/* Action buttons for main group: Support both main-only and main-with-subs */}
                    <div className="flex items-center space-x-1.5 space-x-reverse shrink-0">
                      {/* Option 1: Select main category only */}
                      <button 
                        type="button"
                        onClick={() => {
                          onSelect({
                            mode: 'main-only',
                            displayName: cat.name,
                            code: cat.id,
                            mainName: cat.name
                          });
                          onClose();
                        }}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all flex items-center space-x-1 space-x-reverse ${
                          isCurrentMain 
                            ? 'bg-blue-600 text-white border-blue-600' 
                            : isDark 
                              ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' 
                              : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800'
                        }`}
                        title="اختيار هذه المجموعة الرئيسية فقط دون فروعها"
                      >
                        <Check className="w-3 h-3 text-blue-400" />
                        <span>الرئيسية فقط</span>
                      </button>

                      {/* Option 2: Select main category with all sub-categories (3-level hierarchy) */}
                      {hasChildren && (
                        <button 
                          type="button"
                          onClick={() => {
                            onSelect({
                              mode: 'main-with-subs',
                              displayName: `${cat.name} (شامل الفروع)`,
                              code: cat.id,
                              mainName: cat.name
                            });
                            onClose();
                          }}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40 transition-colors flex items-center space-x-1 space-x-reverse"
                          title="اختيار المجموعة الرئيسية متضمنة كافة مجموعاتها الفرعية"
                        >
                          <Layers className="w-3 h-3 text-purple-500" />
                          <span>شامل الفروع</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-categories list (Level 2) */}
                  {hasChildren && isExpanded && (
                    <div className="pr-8 pl-3 pb-3 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                      {cat.children!.map(sub => {
                        const isCurrentSub = currentSelected === sub.name;

                        return (
                          <div 
                            key={sub.id} 
                            className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                              isDark 
                                ? 'hover:bg-slate-800/80 bg-slate-900/40' 
                                : 'hover:bg-blue-50/50 bg-white'
                            } border border-transparent hover:border-blue-200 dark:hover:border-slate-700`}
                          >
                            <div className="flex items-center space-x-2 space-x-reverse flex-1 min-w-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {sub.id}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {sub.name}
                              </span>
                            </div>

                            {/* Option 3: Select this specific sub-category */}
                            <button 
                              type="button"
                              onClick={() => {
                                onSelect({
                                  mode: 'specific-sub',
                                  displayName: sub.name,
                                  code: sub.id,
                                  mainName: cat.name,
                                  subName: sub.name
                                });
                                onClose();
                              }}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-all flex items-center space-x-1 space-x-reverse ${
                                isCurrentSub
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : isDark
                                    ? 'bg-slate-800 border-slate-700 hover:bg-blue-600 hover:text-white text-slate-300'
                                    : 'bg-slate-50 border-slate-300 hover:bg-blue-600 hover:text-white text-slate-700'
                              }`}
                              title="اختيار هذه المجموعة الفرعية المحددة"
                            >
                              <Check className="w-3 h-3" />
                              <span>اختيار الفرعية</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t flex items-center justify-between ${
          isDark ? 'bg-slate-850 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 space-x-reverse">
            <span>المجموعة الحالية:</span>
            <span className="font-bold text-slate-800 dark:text-slate-100 font-mono">
              {currentSelected || 'جميع المجموعات'}
            </span>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
