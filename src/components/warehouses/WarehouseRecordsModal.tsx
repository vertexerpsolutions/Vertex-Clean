import React, { useState, useEffect, useMemo } from 'react';
import { 
  warehouseService, 
  Warehouse 
} from '../../services/warehouseService';
import { 
  Warehouse as WarehouseIcon, 
  Search, 
  X, 
  Eye, 
  Edit3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  Check
} from 'lucide-react';

export interface WarehouseRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWarehouse?: (warehouse: Warehouse) => void;
  onLoadWarehouseIntoForm?: (warehouse: Warehouse) => void;
  onViewWarehouse?: (warehouse: Warehouse) => void;
  loadedWarehouseId?: string;
  warehouses?: Warehouse[];
}

type SortField = 'code' | 'name' | 'branch' | 'account' | 'valuation' | 'users' | 'status';
type SortDirection = 'asc' | 'desc';

export const WarehouseRecordsModal: React.FC<WarehouseRecordsModalProps> = ({
  isOpen,
  onClose,
  onSelectWarehouse,
  onLoadWarehouseIntoForm,
  onViewWarehouse,
  loadedWarehouseId,
  warehouses: propWarehouses
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => propWarehouses || warehouseService.getAllWarehouses());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [valuationFilter, setValuationFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const refreshList = () => {
    if (propWarehouses && propWarehouses.length > 0) {
      setWarehouses(propWarehouses);
    } else {
      setWarehouses(warehouseService.getAllWarehouses());
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSearchTerm('');
      setBranchFilter('all');
      setStatusFilter('all');
      setValuationFilter('all');
      setSortField(null);
      setSortDirection('asc');
    }
  }, [isOpen, propWarehouses]);

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

  const branches = useMemo(() => warehouseService.getAvailableBranches(), []);
  const accounts = useMemo(() => warehouseService.getAvailableAccounts(), []);

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

  const filteredAndSortedWarehouses = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    let result = warehouses.filter(w => {
      const matchesSearch = !term || (
        (w.name && w.name.toLowerCase().includes(term)) ||
        (w.nameEn && w.nameEn.toLowerCase().includes(term)) ||
        (w.code && w.code.toLowerCase().includes(term)) ||
        (w.branchName && w.branchName.toLowerCase().includes(term)) ||
        (w.accountName && w.accountName.toLowerCase().includes(term)) ||
        (w.accountId && w.accountId.toLowerCase().includes(term)) ||
        (w.id && w.id.toLowerCase().includes(term))
      );

      const matchesBranch = branchFilter === 'all' || w.branchId === branchFilter;
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && (w.status === 'نشط' || w.status === 'active')) ||
        (statusFilter === 'inactive' && (w.status === 'غير نشط' || w.status === 'inactive'));

      const matchesValuation = valuationFilter === 'all' || w.valuationType === valuationFilter;

      return matchesSearch && matchesBranch && matchesStatus && matchesValuation;
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
          case 'branch':
            valA = a.branchName || '';
            valB = b.branchName || '';
            break;
          case 'account':
            valA = `${a.accountId || ''} ${a.accountName || ''}`;
            valB = `${b.accountId || ''} ${b.accountName || ''}`;
            break;
          case 'valuation':
            valA = a.valuationType || '';
            valB = b.valuationType || '';
            break;
          case 'users':
            valA = a.allowedUsersType || '';
            valB = b.allowedUsersType || '';
            break;
          case 'status':
            valA = a.status || '';
            valB = b.status || '';
            break;
        }

        const cmp = valA.localeCompare(valB, 'ar', { numeric: true });
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [warehouses, searchTerm, branchFilter, statusFilter, valuationFilter, sortField, sortDirection]);

  if (!isOpen) return null;

  const handleSelectWarehouse = (warehouse: Warehouse) => {
    if (onLoadWarehouseIntoForm) {
      onLoadWarehouseIntoForm(warehouse);
    } else if (onSelectWarehouse) {
      onSelectWarehouse(warehouse);
    }
    onClose();
  };

  const handleLoadWarehouse = (e: React.MouseEvent, warehouse: Warehouse) => {
    e.stopPropagation();
    if (onLoadWarehouseIntoForm) {
      onLoadWarehouseIntoForm(warehouse);
    } else if (onSelectWarehouse) {
      onSelectWarehouse(warehouse);
    }
    onClose();
  };

  const handleViewWarehouse = (e: React.MouseEvent, warehouse: Warehouse) => {
    e.stopPropagation();
    if (onViewWarehouse) {
      onViewWarehouse(warehouse);
    } else if (onLoadWarehouseIntoForm) {
      onLoadWarehouseIntoForm(warehouse);
    } else if (onSelectWarehouse) {
      onSelectWarehouse(warehouse);
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
          {/* Top-Right: Golden Warehouse Icon */}
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs">
            <WarehouseIcon className="w-5 h-5" />
          </div>

          {/* Center: Title */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide text-center">
            سجلات المخازن ودليل المخازن
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
        {/* 2. SEARCH & FILTERS BAR                                   */}
        {/* ========================================================= */}
        <div className="px-6 pb-3 pt-4 shrink-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث باسم المخزن أو الكود أو الفرع أو الحساب وانتر..."
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

            {/* Branch Filter */}
            <div className="md:col-span-3">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors cursor-pointer font-['Cairo',sans-serif]"
              >
                <option value="all">كافة الفروع المسجلة</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors cursor-pointer font-['Cairo',sans-serif]"
              >
                <option value="all">كل الحالات</option>
                <option value="active">نشط فقط</option>
                <option value="inactive">غير نشط فقط</option>
              </select>
            </div>

            {/* Valuation Filter */}
            <div className="md:col-span-2">
              <select
                value={valuationFilter}
                onChange={(e) => setValuationFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors cursor-pointer font-['Cairo',sans-serif]"
              >
                <option value="all">كل أنواع التقييم</option>
                <option value="included">يدخل بالتقييم</option>
                <option value="excluded">لا يدخل بالتقييم</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RECORDS TABLE CONTAINER (RESPONSIVE SCROLL)             */}
        {/* ========================================================= */}
        <div className="px-6 flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          {filteredAndSortedWarehouses.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <WarehouseIcon className="w-10 h-10 stroke-[1.2] text-slate-600" />
              <span className="text-slate-400 text-sm font-bold">لا توجد مخازن مطابقة لمعايير البحث الحالية.</span>
            </div>
          ) : (
            <div className="min-w-[880px] pb-2">
              <table className="w-full text-right text-xs border-separate border-spacing-y-2">
                <thead className="text-slate-300 text-xs font-bold select-none">
                  <tr>
                    <th 
                      onClick={() => handleSort('code')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      كود المخزن {renderSortIndicator('code')}
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="pb-2 px-4 font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      اسم المخزن {renderSortIndicator('name')}
                    </th>
                    <th 
                      onClick={() => handleSort('branch')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      الفرع التابع له {renderSortIndicator('branch')}
                    </th>
                    <th 
                      onClick={() => handleSort('account')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      حساب المخزون {renderSortIndicator('account')}
                    </th>
                    <th 
                      onClick={() => handleSort('valuation')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      نوع التقييم {renderSortIndicator('valuation')}
                    </th>
                    <th 
                      onClick={() => handleSort('users')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      المستخدمون {renderSortIndicator('users')}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="pb-2 px-4 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors"
                    >
                      الحالة {renderSortIndicator('status')}
                    </th>
                    <th className="pb-2 px-4 text-center font-bold">
                      إجراء ↕
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedWarehouses.map(w => {
                    const isLoaded = Boolean(loadedWarehouseId && loadedWarehouseId === w.id);
                    const isActive = w.status === 'نشط' || w.status === 'active';
                    const isIncludedInValuation = w.valuationType === 'included';

                    const cellBg = isLoaded 
                      ? 'bg-amber-950/20 group-hover:bg-amber-950/30' 
                      : !isActive
                        ? 'bg-slate-950/40 opacity-75 group-hover:bg-slate-900/60'
                        : 'bg-slate-900/40 group-hover:bg-slate-800/50';

                    const cellBorder = isLoaded
                      ? 'border-amber-500/50'
                      : 'border-slate-800/80';

                    // Resolve account display
                    const acc = accounts.find(a => a.id === w.accountId || a.code === w.accountId);
                    const displayAccCode = acc ? acc.code : (w.accountId || '120401');
                    const displayAccName = w.accountName || acc?.name || 'مخزون البضائع';

                    return (
                      <tr
                        key={w.id}
                        onClick={() => handleSelectWarehouse(w)}
                        className="group transition-all cursor-pointer select-none"
                      >
                        {/* 1. كود المخزن */}
                        <td className={`py-3.5 px-4 text-center font-mono font-bold text-amber-400 text-xs rounded-r-xl border-r border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {w.code}
                        </td>

                        {/* 2. اسم المخزن */}
                        <td className={`py-3.5 px-4 font-bold text-slate-100 text-sm border-y ${cellBorder} ${cellBg} transition-colors`}>
                          <div>{w.name}</div>
                          {isLoaded && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              مفتوح حاليًا
                            </div>
                          )}
                        </td>

                        {/* 3. الفرع التابع له */}
                        <td className={`py-3.5 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors`}>
                          <div className="inline-flex items-center gap-1.5 text-slate-200 text-xs font-medium">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{w.branchName}</span>
                          </div>
                        </td>

                        {/* 4. حساب المخزون */}
                        <td className={`py-3.5 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors`}>
                          <div className="font-mono font-bold text-slate-100 text-xs">
                            {displayAccCode}
                          </div>
                          <div className="text-[11px] text-amber-400 font-medium mt-0.5">
                            {displayAccName}
                          </div>
                        </td>

                        {/* 5. نوع التقييم */}
                        <td className={`py-3.5 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {isIncludedInValuation ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-950/60 text-blue-300 border border-blue-700/50 whitespace-nowrap shadow-2xs">
                              <Check className="w-3 h-3" />
                              يدخل بالتقييم
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap shadow-2xs">
                              لا يدخل بالتقييم
                            </span>
                          )}
                        </td>

                        {/* 6. المستخدمون */}
                        <td className={`py-3.5 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {w.allowedUsersType === 'all' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap shadow-2xs">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              كل المستخدمين
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-950/50 text-purple-300 border border-purple-700/50 whitespace-nowrap shadow-2xs">
                              <Users className="w-3.5 h-3.5 text-purple-400" />
                              {w.allowedUserIds?.length || 0} مستخدمين
                            </span>
                          )}
                        </td>

                        {/* 7. الحالة */}
                        <td className={`py-3.5 px-4 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-600/40 whitespace-nowrap shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              نشط
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-950/40 text-rose-300 border border-rose-600/40 whitespace-nowrap shadow-2xs">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              غير نشط
                            </span>
                          )}
                        </td>

                        {/* 8. إجراء */}
                        <td className={`py-3.5 px-4 text-center rounded-l-xl border-l border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          <div className="flex items-center justify-center space-x-2 space-x-reverse">
                            {/* تعديل (Edit3 icon) */}
                            <button
                              type="button"
                              onClick={(e) => handleLoadWarehouse(e, w)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer shadow-2xs shrink-0"
                              title="تعديل وتحميل بيانات المخزن"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-slate-300" />
                              <span>تعديل</span>
                            </button>

                            {/* عرض (Eye icon) */}
                            <button
                              type="button"
                              onClick={(e) => handleViewWarehouse(e, w)}
                              className="px-3 py-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-all cursor-pointer shadow-2xs shrink-0"
                              title="عرض بيانات المخزن"
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
          <div className="text-xs text-slate-300 font-bold flex items-center space-x-3 space-x-reverse">
            <div className="flex items-center space-x-1.5 space-x-reverse">
              <span>إجمالي المخازن :</span>
              <span className="text-amber-400 text-base font-black font-mono">
                {filteredAndSortedWarehouses.length}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 font-semibold">
              {filteredAndSortedWarehouses.filter(w => w.status === 'نشط' || w.status === 'active').length} نشط
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-rose-400 font-semibold">
              {filteredAndSortedWarehouses.filter(w => w.status === 'غير نشط' || w.status === 'inactive').length} غير نشط
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
