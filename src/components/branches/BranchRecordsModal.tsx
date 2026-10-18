import React, { useState, useEffect, useMemo } from 'react';
import { branchService } from '../../services/branchService';
import { BranchItem } from '../../types';
import { 
  Store, 
  Search, 
  X, 
  Eye, 
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export interface BranchRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadBranchIntoForm?: (branch: BranchItem) => void;
  onViewBranch?: (branch: BranchItem) => void;
  loadedBranchId?: string;
  branches?: BranchItem[];
}

type SortField = 'code' | 'name' | 'account' | 'city' | 'address' | 'classification';
type SortDirection = 'asc' | 'desc';

export const BranchRecordsModal: React.FC<BranchRecordsModalProps> = ({
  isOpen,
  onClose,
  onLoadBranchIntoForm,
  onViewBranch,
  loadedBranchId,
  branches: propBranches
}) => {
  const [branches, setBranches] = useState<BranchItem[]>(() => propBranches || branchService.getAllBranches());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const refreshList = () => {
    if (propBranches && propBranches.length > 0) {
      setBranches(propBranches);
    } else {
      setBranches(branchService.getAllBranches());
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSearchTerm('');
      setSortField(null);
    }
  }, [isOpen, propBranches]);

  useEffect(() => {
    const unsub = branchService.subscribe(() => {
      if (!propBranches) {
        refreshList();
      }
    });
    return unsub;
  }, [propBranches]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  const filteredAndSortedBranches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let result = branches.filter(b => {
      if (!term) return true;
      const isMain = Boolean(b.isMain || b.code === 'BR-01');
      const classificationText = isMain ? 'الفرع الرئيسي رئيسي' : 'فرع فرعي فرعي';
      const statusText = b.status || 'نشط';

      return (
        (b.name && b.name.toLowerCase().includes(term)) ||
        (b.code && b.code.toLowerCase().includes(term)) ||
        (b.nameEn && b.nameEn.toLowerCase().includes(term)) ||
        (b.city && b.city.toLowerCase().includes(term)) ||
        (b.address && b.address.toLowerCase().includes(term)) ||
        (b.accountCode && b.accountCode.toLowerCase().includes(term)) ||
        (b.accountName && b.accountName.toLowerCase().includes(term)) ||
        (b.accountId && b.accountId.toLowerCase().includes(term)) ||
        (b.id && b.id.toLowerCase().includes(term)) ||
        classificationText.toLowerCase().includes(term) ||
        statusText.toLowerCase().includes(term)
      );
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA = '';
        let valB = '';

        switch (sortField) {
          case 'code':
            valA = a.code || '';
            valB = b.code || '';
            break;
          case 'name':
            valA = a.name || '';
            valB = b.name || '';
            break;
          case 'account':
            valA = `${a.accountCode || ''} ${a.accountName || ''}`;
            valB = `${b.accountCode || ''} ${b.accountName || ''}`;
            break;
          case 'city':
            valA = a.city || '';
            valB = b.city || '';
            break;
          case 'address':
            valA = a.address || '';
            valB = b.address || '';
            break;
          case 'classification':
            valA = a.isMain || a.code === 'BR-01' ? '0' : '1';
            valB = b.isMain || b.code === 'BR-01' ? '0' : '1';
            break;
        }

        const cmp = valA.localeCompare(valB, 'ar', { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [branches, searchTerm, sortField, sortDirection]);

  if (!isOpen) return null;

  const handleSelectBranch = (branch: BranchItem) => {
    if (onLoadBranchIntoForm) {
      onLoadBranchIntoForm(branch);
    }
    onClose();
  };

  const handleViewBranch = (e: React.MouseEvent, branch: BranchItem) => {
    e.stopPropagation();
    if (onViewBranch) {
      onViewBranch(branch);
    } else if (onLoadBranchIntoForm) {
      onLoadBranchIntoForm(branch);
    }
    onClose();
  };

  const handleLoadBranch = (e: React.MouseEvent, branch: BranchItem) => {
    e.stopPropagation();
    if (onLoadBranchIntoForm) {
      onLoadBranchIntoForm(branch);
    }
    onClose();
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 inline-block mr-1 group-hover/col:opacity-80 transition-opacity" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-amber-400 inline-block mr-1" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-amber-400 inline-block mr-1" />;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none font-['Cairo',sans-serif]" 
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-6xl bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. TOP HEADER BAR                                         */}
        {/* ========================================================= */}
        <div className="px-6 py-5 bg-[#090d16] flex items-center justify-between shrink-0 border-b border-slate-800/40">
          {/* Top-Right: Golden Storefront / Building Icon */}
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs">
            <Store className="w-5 h-5" />
          </div>

          {/* Center: Title */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide text-center">
            سجل فروع ومراكز التوزيع
          </h2>

          {/* Top-Left: Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 2. SEARCH INPUT BAR                                       */}
        {/* ========================================================= */}
        <div className="px-6 pb-3 pt-4 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث باسم الفرع أو الكود المدينة أو الموقع وانتر..."
              className="w-full bg-white border border-slate-300 rounded-xl pr-4 pl-11 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors font-['Cairo',sans-serif]"
              autoFocus
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors p-1"
                title="مسح البحث"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RECORDS TABLE CONTAINER (RESPONSIVE SCROLL)             */}
        {/* ========================================================= */}
        <div className="px-6 flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          {filteredAndSortedBranches.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Store className="w-10 h-10 stroke-[1.2] text-slate-600" />
              <span className="text-slate-400 text-sm font-bold">لا توجد فروع مطابقة لمعايير البحث الحالية.</span>
            </div>
          ) : (
            <div className="min-w-[760px] pb-2">
              <table className="w-full text-right text-xs border-separate border-spacing-y-2">
                <thead className="text-slate-300 text-xs font-bold select-none">
                  <tr>
                    <th 
                      onClick={() => handleSort('code')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      كود الفرع {renderSortIndicator('code')}
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="pb-2 px-4 font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      اسم الفرع {renderSortIndicator('name')}
                    </th>
                    <th 
                      onClick={() => handleSort('account')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      الحساب الجاري للفرع {renderSortIndicator('account')}
                    </th>
                    <th 
                      onClick={() => handleSort('city')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      المدينة / النطاق {renderSortIndicator('city')}
                    </th>
                    <th 
                      onClick={() => handleSort('address')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      الموقع {renderSortIndicator('address')}
                    </th>
                    <th 
                      onClick={() => handleSort('classification')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      التصنيف {renderSortIndicator('classification')}
                    </th>
                    <th className="pb-2 px-4 text-center font-bold">
                      إجراء ↕
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedBranches.map(branch => {
                    const isMain = Boolean(branch.isMain || branch.code === 'BR-01');
                    const isLoaded = loadedBranchId && loadedBranchId === branch.id;

                    // Distinct styling for Main Branch (highlight border & soft calm background) vs regular branch
                    const cellBg = isMain 
                      ? 'bg-amber-950/20 group-hover:bg-amber-950/30' 
                      : 'bg-slate-900/40 group-hover:bg-slate-800/50';

                    const cellBorder = isMain
                      ? 'border-amber-500/50'
                      : isLoaded
                        ? 'border-cyan-500/50'
                        : 'border-slate-800/80';

                    return (
                      <tr
                        key={branch.id}
                        onClick={() => handleSelectBranch(branch)}
                        className="group transition-all cursor-pointer select-none"
                      >
                        {/* 1. كود الفرع */}
                        <td className={`py-3.5 px-4 text-center font-mono font-bold text-amber-400 text-xs rounded-r-xl border-r border-y ${cellBorder} ${cellBg} transition-colors`}>
                          {branch.code}
                        </td>

                        {/* 2. اسم الفرع */}
                        <td className={`py-3.5 px-4 font-bold text-slate-100 text-sm border-y ${cellBorder} ${cellBg} transition-colors`}>
                          {branch.name}
                        </td>

                        {/* 3. الحساب الجاري للفرع */}
                        <td className={`py-3.5 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors`}>
                          <div className="font-mono font-bold text-slate-100 text-xs">
                            {branch.accountCode || (branch.accountId === 'COA-12070701' ? '12070701' : '12070701')}
                          </div>
                          <div className="text-[11px] text-amber-400 font-medium mt-0.5">
                            {branch.accountName || 'جاري المركز الرئيسي'}
                          </div>
                        </td>

                        {/* 4. المدينة / النطاق */}
                        <td className={`py-3.5 px-4 text-center text-slate-200 text-xs font-medium border-y ${cellBorder} ${cellBg} transition-colors`}>
                          {branch.city || '—'}
                        </td>

                        {/* 5. الموقع */}
                        <td className={`py-3.5 px-4 text-center text-slate-300 text-xs border-y ${cellBorder} ${cellBg} transition-colors`}>
                          {branch.address || '—'}
                        </td>

                        {/* 6. التصنيف */}
                        <td className={`py-3.5 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors`}>
                          {isMain ? (
                            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-amber-950/40 text-amber-200 border border-amber-600/50 whitespace-nowrap shadow-2xs">
                              الفرع الرئيسي
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold bg-blue-950/60 text-blue-300 border border-blue-700/50 whitespace-nowrap shadow-2xs">
                              فرع فرعي
                            </span>
                          )}
                        </td>

                        {/* 7. إجراء */}
                        <td className={`py-3.5 px-4 text-center rounded-l-xl border-l border-y ${cellBorder} ${cellBg} transition-colors`}>
                          <div className="flex items-center justify-center space-x-2 space-x-reverse">
                            {/* تحميل (Pencil icon) */}
                            <button
                              type="button"
                              onClick={(e) => handleLoadBranch(e, branch)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer shadow-2xs shrink-0"
                              title="تحميل بيانات الفرع"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                              <span>تحميل</span>
                            </button>

                            {/* عرض (Eye icon) */}
                            <button
                              type="button"
                              onClick={(e) => handleViewBranch(e, branch)}
                              className="px-3 py-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer shadow-2xs shrink-0"
                              title="عرض الفرع"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>عرض</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* 4. MODAL FOOTER                                           */}
        {/* ========================================================= */}
        <div className="px-6 py-4 bg-[#090d16] flex items-center justify-between shrink-0 select-none border-t border-slate-800/40">
          {/* Counter Right */}
          <div className="text-xs text-slate-300 font-bold flex items-center space-x-2 space-x-reverse">
            <span>إجمالي الفروع :</span>
            <span className="text-amber-400 text-base font-black font-mono">
              {filteredAndSortedBranches.length}
            </span>
          </div>

          {/* Close Action Left */}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
