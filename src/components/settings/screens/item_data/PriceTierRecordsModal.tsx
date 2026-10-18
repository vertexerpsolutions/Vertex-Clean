import React, { useState, useEffect, useMemo } from 'react';
import { 
  priceTierService, 
  PriceTier 
} from '../../../../services/priceTierService';
import { 
  Tag, 
  Search, 
  X, 
  Lock, 
  Sparkles, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

export interface PriceTierRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTier?: (tier: PriceTier) => void;
  onLoadTierIntoForm?: (tier: PriceTier) => void;
  loadedTierId?: string;
  onDeleteTier?: (tier: PriceTier) => void;
}

type SortField = 'code' | 'name' | 'type' | 'date';
type SortDirection = 'asc' | 'desc';
type TypeFilter = 'all' | 'system' | 'custom';

export const PriceTierRecordsModal: React.FC<PriceTierRecordsModalProps> = ({
  isOpen,
  onClose,
  onSelectTier,
  onLoadTierIntoForm,
  loadedTierId,
  onDeleteTier
}) => {
  const [tiers, setTiers] = useState<PriceTier[]>(() => priceTierService.getAllTiers());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortField, setSortField] = useState<SortField | null>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [tierToDelete, setTierToDelete] = useState<PriceTier | null>(null);

  const refreshList = () => {
    setTiers(priceTierService.getAllTiers());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSearchTerm('');
      setTypeFilter('all');
      setSortField('code');
      setSortDirection('asc');
      setTierToDelete(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = priceTierService.subscribe(() => {
      refreshList();
    });
    return unsub;
  }, []);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (tierToDelete) {
          setTierToDelete(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, tierToDelete, onClose]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedTiers = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    let result = tiers.filter(t => {
      const matchesSearch = !term || (
        t.name.toLowerCase().includes(term) ||
        t.code.toLowerCase().includes(term)
      );

      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'system' && t.isSystem) ||
        (typeFilter === 'custom' && !t.isSystem);

      return matchesSearch && matchesType;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        switch (sortField) {
          case 'code':
            valA = a.code || '';
            valB = b.code || '';
            break;
          case 'name':
            valA = a.name || '';
            valB = b.name || '';
            break;
          case 'type':
            valA = a.isSystem ? '0' : '1';
            valB = b.isSystem ? '0' : '1';
            break;
          case 'date':
            valA = a.createdAt || '';
            valB = b.createdAt || '';
            break;
        }

        const cmp = String(valA).localeCompare(String(valB), 'ar');
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [tiers, searchTerm, typeFilter, sortField, sortDirection]);

  const handleSelectTier = (t: PriceTier) => {
    if (onLoadTierIntoForm) {
      onLoadTierIntoForm(t);
    } else if (onSelectTier) {
      onSelectTier(t);
    }
    onClose();
  };

  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDeleteModal = () => {
    if (!tierToDelete) return;
    const res = priceTierService.deleteTier(tierToDelete.id);
    if (res.success) {
      if (onDeleteTier) {
        onDeleteTier(tierToDelete);
      }
      setTierToDelete(null);
      setDeleteError(null);
      refreshList();
    } else {
      setDeleteError(res.error || 'تعذر حذف شريحة السعر.');
    }
  };

  if (!isOpen) return null;

  const totalCount = tiers.length;
  const systemCount = tiers.filter(t => t.isSystem).length;
  const customCount = totalCount - systemCount;

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 inline-block mr-1 opacity-40 group-hover/col:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 inline-block mr-1 text-amber-400" />
    ) : (
      <ArrowDown className="w-3 h-3 inline-block mr-1 text-amber-400" />
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs font-['Cairo',sans-serif]"
      dir="rtl"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col w-full max-w-4xl max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. MODAL TITLE BAR                                        */}
        {/* ========================================================= */}
        <div className="relative px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="p-1.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-100 tracking-wide">
              سجل شرائح الأسعار المسجلة
            </h3>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filteredAndSortedTiers.length} من {totalCount}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SEARCH & FILTER TOOLBAR                                */}
        {/* ========================================================= */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بكود أو مسمى شريحة السعر..."
                className="w-full h-9 pr-9 pl-8 bg-slate-900 border border-slate-700/80 focus:border-amber-500/80 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Fast Filter Pills */}
            <div className="md:col-span-6 flex items-center justify-end space-x-2 space-x-reverse">
              <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-xl space-x-1 space-x-reverse text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTypeFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 space-x-reverse ${
                    typeFilter === 'all'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>الكل</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {totalCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter('system')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 space-x-reverse ${
                    typeFilter === 'system'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>أساسية نظامية</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {systemCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter('custom')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 space-x-reverse ${
                    typeFilter === 'custom'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>مخصصة</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {customCount}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TABLE OF TIERS                                         */}
        {/* ========================================================= */}
        <div className="px-5 py-3 flex-1 overflow-x-auto overflow-y-auto">
          {filteredAndSortedTiers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Tag className="w-10 h-10 stroke-[1.2] text-slate-600" />
              <span className="text-slate-400 text-sm font-bold">
                لا توجد شرائح أسعار مطابقة لمعايير البحث الحالية.
              </span>
            </div>
          ) : (
            <table className="w-full text-right text-xs border-separate border-spacing-y-2">
              <thead className="text-slate-300 text-xs font-bold select-none">
                <tr>
                  <th 
                    onClick={() => handleSort('code')}
                    className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-28"
                  >
                    كود الشريحة {renderSortIndicator('code')}
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="pb-2 px-4 font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                  >
                    اسم شريحة السعر {renderSortIndicator('name')}
                  </th>
                  <th 
                    onClick={() => handleSort('type')}
                    className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-36"
                  >
                    النوع {renderSortIndicator('type')}
                  </th>
                  <th 
                    onClick={() => handleSort('date')}
                    className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-32"
                  >
                    تاريخ الإنشاء {renderSortIndicator('date')}
                  </th>
                  <th className="pb-2 px-4 text-center font-bold w-44">
                    إجراء
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTiers.map(tier => {
                  const isLoaded = Boolean(loadedTierId && loadedTierId === tier.id);
                  const canDelete = !tier.isSystem;

                  const cellBg = isLoaded 
                    ? 'bg-amber-950/20 group-hover:bg-amber-950/30' 
                    : 'bg-slate-900/40 group-hover:bg-slate-800/50';

                  const cellBorder = isLoaded
                    ? 'border-amber-500/50'
                    : 'border-slate-800/80';

                  return (
                    <tr
                      key={tier.id}
                      onClick={() => handleSelectTier(tier)}
                      className="group transition-all cursor-pointer select-none"
                    >
                      {/* 1. Code */}
                      <td className={`py-3 px-4 text-center font-mono font-bold text-amber-400 text-xs rounded-r-xl border-r border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        {tier.code}
                      </td>

                      {/* 2. Name */}
                      <td className={`py-3 px-4 font-bold text-slate-100 text-sm border-y ${cellBorder} ${cellBg} transition-colors`}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span>{tier.name}</span>
                          {isLoaded && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              مفتوح حالياً
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Type */}
                      <td className={`py-3 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        {tier.isSystem ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-950/60 text-blue-300 border border-blue-700/50 shadow-2xs">
                            <Lock className="w-3 h-3 text-blue-400" />
                            أساسية نظامية
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-950/50 text-purple-300 border border-purple-700/50 shadow-2xs">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            مخصصة
                          </span>
                        )}
                      </td>

                      {/* 4. Date */}
                      <td className={`py-3 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors text-slate-400 font-mono text-[11px] whitespace-nowrap`}>
                        {tier.createdAt ? tier.createdAt.split('T')[0] : '—'}
                      </td>

                      {/* 5. Actions */}
                      <td className={`py-3 px-4 text-center rounded-l-xl border-l border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectTier(tier);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1 space-x-reverse transition-all cursor-pointer shadow-2xs"
                            title="اختيار وتحميل السجل في شاشة الإدخال"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تحميل السجل</span>
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTierToDelete(tier);
                              }}
                              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-700/40 transition-all cursor-pointer"
                              title="حذف هذه الشريحة المخصصة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ========================================================= */}
        {/* 4. MODAL FOOTER                                           */}
        {/* ========================================================= */}
        <div className="px-5 py-3.5 bg-[#090d16] flex items-center justify-between shrink-0 select-none border-t border-slate-800/60">
          <div className="text-xs text-slate-300 font-bold flex items-center space-x-3 space-x-reverse">
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span>إجمالي الشرائح :</span>
              <span className="text-amber-400 text-sm font-black font-mono">
                {tiers.length}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-blue-400 font-semibold">
              {systemCount} أساسية نظامية
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-purple-400 font-semibold">
              {customCount} مخصصة
            </span>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. DIRECT DELETE CONFIRMATION MODAL                       */}
        {/* ========================================================= */}
        {tierToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 space-x-reverse text-rose-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-100">
                  تأكيد حذف شريحة السعر
                </h3>
              </div>
              {deleteError ? (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                  {deleteError}
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed">
                  هل أنت متأكد من رغبتك في حذف شريحة السعر المخصصة{' '}
                  <strong className="text-amber-400 font-bold">[{tierToDelete.code}] {tierToDelete.name}</strong>؟
                  <br />
                  لا يمكن التراجع عن هذه الخطوة.
                </p>
              )}
              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setTierToDelete(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {deleteError ? 'إغلاق' : 'إلغاء'}
                </button>
                {!deleteError && (
                  <button
                    type="button"
                    onClick={confirmDeleteModal}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                  >
                    نعم، حذف
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
