import React, { useState, useEffect, useMemo } from 'react';
import { 
  unitOfMeasureService, 
  UnitOfMeasure 
} from '../../../../services/unitOfMeasureService';
import { 
  Scale, 
  Search, 
  X, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Printer, 
  Trash2, 
  Check, 
  Package,
  AlertTriangle
} from 'lucide-react';

export interface UnitOfMeasureRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUnit?: (unit: UnitOfMeasure) => void;
  onLoadUnitIntoForm?: (unit: UnitOfMeasure) => void;
  loadedUnitId?: string;
  onDeleteUnit?: (unit: UnitOfMeasure) => void;
}

type SortField = 'code' | 'name' | 'type' | 'usage' | 'status' | 'date';
type SortDirection = 'asc' | 'desc';
type TypeFilter = 'all' | 'system' | 'custom' | 'active' | 'inactive';

export const UnitOfMeasureRecordsModal: React.FC<UnitOfMeasureRecordsModalProps> = ({
  isOpen,
  onClose,
  onSelectUnit,
  onLoadUnitIntoForm,
  loadedUnitId,
  onDeleteUnit
}) => {
  const [units, setUnits] = useState<UnitOfMeasure[]>(() => unitOfMeasureService.getAllUnits());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortField, setSortField] = useState<SortField | null>('code');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [unitToDelete, setUnitToDelete] = useState<UnitOfMeasure | null>(null);

  const refreshList = () => {
    setUnits(unitOfMeasureService.getAllUnits());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSearchTerm('');
      setTypeFilter('all');
      setSortField('code');
      setSortDirection('asc');
      setUnitToDelete(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = unitOfMeasureService.subscribe(() => {
      refreshList();
    });
    return unsub;
  }, []);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (unitToDelete) {
          setUnitToDelete(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, unitToDelete, onClose]);

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

  const usageCounts = useMemo(() => {
    const map: Record<string, number> = {};
    units.forEach(u => {
      map[u.id] = unitOfMeasureService.getUnitUsageCount(u.name);
    });
    return map;
  }, [units]);

  const filteredAndSortedUnits = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    let result = units.filter(u => {
      const matchesSearch = !term || (
        u.name.toLowerCase().includes(term) ||
        u.code.toLowerCase().includes(term)
      );

      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'system' && u.isSystem) ||
        (typeFilter === 'custom' && !u.isSystem) ||
        (typeFilter === 'active' && u.status !== 'inactive') ||
        (typeFilter === 'inactive' && u.status === 'inactive');

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
          case 'usage':
            valA = usageCounts[a.id] || 0;
            valB = usageCounts[b.id] || 0;
            break;
          case 'status':
            valA = a.status === 'inactive' ? '1' : '0';
            valB = b.status === 'inactive' ? '1' : '0';
            break;
          case 'date':
            valA = a.createdAt || '';
            valB = b.createdAt || '';
            break;
        }

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const cmp = String(valA).localeCompare(String(valB), 'ar');
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [units, searchTerm, typeFilter, sortField, sortDirection, usageCounts]);

  const handleSelectUnit = (u: UnitOfMeasure) => {
    if (onLoadUnitIntoForm) {
      onLoadUnitIntoForm(u);
    } else if (onSelectUnit) {
      onSelectUnit(u);
    }
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const confirmDeleteModal = () => {
    if (!unitToDelete) return;
    const res = unitOfMeasureService.deactivateUnit(unitToDelete.id);
    if (res.success) {
      if (onDeleteUnit) {
        onDeleteUnit(unitToDelete);
      }
      setUnitToDelete(null);
      refreshList();
    } else {
      alert(res.error || 'تعذر إلغاء وحدة القياس.');
      setUnitToDelete(null);
    }
  };

  if (!isOpen) return null;

  const totalCount = units.length;
  const systemCount = units.filter(u => u.isSystem).length;
  const customCount = totalCount - systemCount;
  const activeCount = units.filter(u => u.status !== 'inactive').length;
  const inactiveCount = totalCount - activeCount;

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
        className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. MODAL HEADER                                           */}
        {/* ========================================================= */}
        <div className="relative px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-100 tracking-wide">
                سجل وحدات القياس المعتمدة
              </h2>
              <p className="text-[11px] text-slate-400">
                استعراض، بحث، واختيار وحدات القياس المسجلة بالنظام
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
              {filteredAndSortedUnits.length} وحدة
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SEARCH & FILTER TOOLBAR                                */}
        {/* ========================================================= */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 shrink-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="بحث سريع باسم وحدة القياس أو الكود (مثال: متر، كرتونة، UOM-0001)..."
                className="w-full bg-white border border-slate-300 rounded-xl pr-10 pl-9 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors"
                autoFocus
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
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

                <button
                  type="button"
                  onClick={() => setTypeFilter('active')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 space-x-reverse ${
                    typeFilter === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>نشطة</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {activeCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTypeFilter('inactive')}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center space-x-1 space-x-reverse ${
                    typeFilter === 'inactive'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>ملغاة</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {inactiveCount}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TABLE OF UNITS                                         */}
        {/* ========================================================= */}
        <div className="px-5 py-3 flex-1 overflow-x-auto overflow-y-auto">
          {filteredAndSortedUnits.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Scale className="w-10 h-10 stroke-[1.2] text-slate-600" />
              <span className="text-slate-400 text-sm font-bold">
                لا توجد وحدات قياس مطابقة لمعايير البحث الحالية.
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
                    كود الوحدة {renderSortIndicator('code')}
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="pb-2 px-4 font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                  >
                    اسم وحدة القياس {renderSortIndicator('name')}
                  </th>
                  <th 
                    onClick={() => handleSort('type')}
                    className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-36"
                  >
                    النوع والتصنيف {renderSortIndicator('type')}
                  </th>
                  <th 
                    onClick={() => handleSort('usage')}
                    className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-36"
                  >
                    الأصناف المرتبطة {renderSortIndicator('usage')}
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-28"
                  >
                    الحالة {renderSortIndicator('status')}
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
                {filteredAndSortedUnits.map(unit => {
                  const isLoaded = Boolean(loadedUnitId && loadedUnitId === unit.id);
                  const usage = usageCounts[unit.id] || 0;
                  const isInactive = unit.status === 'inactive';
                  // Rule: Any unit (system or custom) can be cancelled iff usage === 0
                  const canCancel = usage === 0 && !isInactive;

                  const cellBg = isLoaded 
                    ? 'bg-amber-950/20 group-hover:bg-amber-950/30' 
                    : isInactive
                    ? 'bg-slate-900/20 opacity-70 group-hover:bg-slate-800/40'
                    : 'bg-slate-900/40 group-hover:bg-slate-800/50';

                  const cellBorder = isLoaded
                    ? 'border-amber-500/50'
                    : 'border-slate-800/80';

                  return (
                    <tr
                      key={unit.id}
                      onClick={() => handleSelectUnit(unit)}
                      className="group transition-all cursor-pointer select-none"
                    >
                      {/* 1. Code */}
                      <td className={`py-3 px-4 text-center font-mono font-bold text-amber-400 text-xs rounded-r-xl border-r border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        {unit.code}
                      </td>

                      {/* 2. Name */}
                      <td className={`py-3 px-4 font-bold text-slate-100 text-sm border-y ${cellBorder} ${cellBg} transition-colors`}>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className={isInactive ? 'line-through text-slate-400' : ''}>{unit.name}</span>
                          {isLoaded && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                              مفتوح حالياً
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Type */}
                      <td className={`py-3 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        {unit.isSystem ? (
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

                      {/* 4. Usage Count */}
                      <td className={`py-3 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        {usage > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/50 text-emerald-300 border border-emerald-700/50 shadow-2xs">
                            <Package className="w-3 h-3 text-emerald-400" />
                            {usage} صنف
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 shadow-2xs">
                            غير مرتبطة
                          </span>
                        )}
                      </td>

                      {/* 5. Status */}
                      <td className={`py-3 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        {isInactive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-950/60 text-rose-300 border border-rose-700/40">
                            ملغاة / معطلة
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700/40">
                            نشطة
                          </span>
                        )}
                      </td>

                      {/* 6. Date */}
                      <td className={`py-3 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors text-slate-400 font-mono text-[11px] whitespace-nowrap`}>
                        {unit.createdAt ? unit.createdAt.split('T')[0] : '—'}
                      </td>

                      {/* 7. Actions */}
                      <td className={`py-3 px-4 text-center rounded-l-xl border-l border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                        <div className="flex items-center justify-center space-x-1.5 space-x-reverse">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectUnit(unit);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center space-x-1 space-x-reverse transition-all cursor-pointer shadow-2xs"
                            title="اختيار وتحميل السجل في شاشة الإدخال"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>تحميل السجل</span>
                          </button>

                          {canCancel && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUnitToDelete(unit);
                              }}
                              className="p-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-700/40 transition-all cursor-pointer"
                              title="إلغاء وتعطيل هذه الوحدة لعدم ارتباطها بأي صنف"
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
              <span>إجمالي الوحدات :</span>
              <span className="text-amber-400 text-sm font-black font-mono">
                {units.length}
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
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5 space-x-reverse"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>طباعة السجلات</span>
            </button>
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
        {/* 5. DIRECT CANCELLATION CONFIRMATION MODAL                 */}
        {/* ========================================================= */}
        {unitToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center space-x-3 space-x-reverse text-amber-400">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-slate-100">
                  تأكيد إلغاء وحدة القياس
                </h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                هل أنت متأكد من رغبتك في إلغاء وتعطيل وحدة القياس{' '}
                <strong className="text-amber-400 font-bold">[{unitToDelete.code}] {unitToDelete.name}</strong>؟
                <br />
                <span className="text-slate-400 text-[11px]">
                  سيتم حفظ سجل الوحدة ومعرفها التاريخي، مع حجبها عن قوائم الاختيار للأصناف الجديدة.
                </span>
              </p>
              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setUnitToDelete(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  تراجع
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteModal}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                >
                  نعم، إلغاء الوحدة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
