import React, { useState, useEffect, useMemo } from 'react';
import { 
  vendorService, 
  Vendor 
} from '../../services/vendorService';
import { 
  Building2, 
  Search, 
  Edit3, 
  UserCheck, 
  UserX, 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export interface VendorRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVendor?: (vendor: Vendor) => void;
  onLoadVendorIntoForm?: (vendor: Vendor) => void;
  loadedVendorId?: string;
  selectedVendorId?: string;
  isSelectionOnlyMode?: boolean;
  activeOnly?: boolean;
}

type SortField = 'code' | 'name' | 'mobile' | 'category' | 'creditLimit' | 'allowCredit' | 'status';
type SortDirection = 'asc' | 'desc';

export const VendorRecordsModal: React.FC<VendorRecordsModalProps> = ({
  isOpen,
  onClose,
  onSelectVendor,
  onLoadVendorIntoForm,
  loadedVendorId,
  selectedVendorId,
  isSelectionOnlyMode = false,
  activeOnly = false,
}) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creditPurchasesFilter, setCreditPurchasesFilter] = useState<string>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const refreshVendorList = () => {
    const list = vendorService.getAllVendors();
    setVendors(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshVendorList();
      setSearchTerm('');
      setStatusFilter('all');
      setCreditPurchasesFilter('all');
      setErrorMessage(null);
      setSortField(null);
      setSortDirection('asc');
    }
  }, [isOpen]);

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

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 inline-block mr-1 group-hover/col:opacity-80 transition-opacity" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3.5 h-3.5 text-amber-400 inline-block mr-1" />;
    }
    return <ArrowDown className="w-3.5 h-3.5 text-amber-400 inline-block mr-1" />;
  };

  const nonDeletedVendors = useMemo(() => {
    return vendors.filter(v => {
      if (v.status === 'محذوف' || v.status === 'deleted') return false;
      if (activeOnly && !vendorService.isVendorActive(v)) return false;
      return true;
    });
  }, [vendors, activeOnly]);

  const filteredAndSortedVendors = useMemo(() => {
    let result = nonDeletedVendors.filter(v => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const codeMatch = v.code?.toLowerCase().includes(q);
        const nameMatch = v.name?.toLowerCase().includes(q);
        const mobileMatch = v.mobile?.includes(q);
        const typeMatch = v.type?.toLowerCase().includes(q);
        const categoryMatch = v.category?.toLowerCase().includes(q);
        const areaMatch = v.area?.toLowerCase().includes(q);
        const purchaserMatch = v.assignedPurchaser?.toLowerCase().includes(q);
        const taxMatch = v.taxNumber?.includes(q);
        const notesMatch = v.notes?.toLowerCase().includes(q);

        if (!codeMatch && !nameMatch && !mobileMatch && !typeMatch && !categoryMatch && !areaMatch && !purchaserMatch && !taxMatch && !notesMatch) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        const isVendActive = v.status === 'نشط' || v.status === 'active';
        if (statusFilter === 'active' && !isVendActive) return false;
        if (statusFilter === 'inactive' && isVendActive) return false;
      }

      if (creditPurchasesFilter !== 'all') {
        if (creditPurchasesFilter === 'allowed' && !v.allowCreditPurchases) return false;
        if (creditPurchasesFilter === 'blocked' && v.allowCreditPurchases) return false;
      }

      return true;
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
          case 'mobile':
            valA = a.mobile || '';
            valB = b.mobile || '';
            break;
          case 'category':
            valA = a.category || a.type || '';
            valB = b.category || b.type || '';
            break;
          case 'creditLimit':
            valA = String(a.creditLimit || 0);
            valB = String(b.creditLimit || 0);
            break;
          case 'allowCredit':
            valA = a.allowCreditPurchases ? '1' : '0';
            valB = b.allowCreditPurchases ? '1' : '0';
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
  }, [nonDeletedVendors, searchTerm, statusFilter, creditPurchasesFilter, sortField, sortDirection]);

  if (!isOpen) return null;

  const handleRowClick = (vend: Vendor) => {
    if (isSelectionOnlyMode) {
      if (vend.status === 'محذوف' || vend.status === 'deleted') {
        setErrorMessage('هذا المورد محذوف ولا يمكن اختياره.');
        return;
      }
      if (activeOnly && !vendorService.isVendorActive(vend)) {
        setErrorMessage('هذا المورد غير نشط ولا يمكن اختياره لإجراء حركة مالية جديدة.');
        return;
      }
      if (onSelectVendor) {
        onSelectVendor(vend);
      }
      onClose();
    } else if (onLoadVendorIntoForm) {
      onLoadVendorIntoForm(vend);
      onClose();
    } else if (onSelectVendor) {
      if (activeOnly && !vendorService.isVendorActive(vend)) {
        setErrorMessage('هذا المورد غير نشط ولا يمكن اختياره لإجراء حركة مالية جديدة.');
        return;
      }
      onSelectVendor(vend);
      onClose();
    }
  };

  const handleToggleStatus = (e: React.MouseEvent, vend: Vendor) => {
    e.stopPropagation();
    vendorService.toggleVendorStatus(vend.id);
    refreshVendorList();
  };

  // Counts for footer stats
  const activeCount = filteredAndSortedVendors.filter(v => v.status === 'نشط' || v.status === 'active').length;
  const inactiveCount = filteredAndSortedVendors.filter(v => v.status === 'غير نشط' || v.status === 'inactive').length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none font-['Cairo',sans-serif] no-print"
      dir="rtl"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-7xl bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================= */}
        {/* 1. TOP HEADER BAR                                         */}
        {/* ========================================================= */}
        <div className="px-6 py-5 bg-[#090d16] flex items-center justify-between shrink-0 border-b border-slate-800/40">
          {/* Top-Right: Golden Building2 Icon */}
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>

          {/* Center: Title & Subtitle */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-wide">
              الموردين
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isSelectionOnlyMode 
                ? 'اختر مورداً من القائمة لاختياره وتعيينه مباشرة' 
                : 'استعرض سجلات الموردين، واضغط على أي مورد لتحميل بياناته بالكامل في النموذج'
              }
            </p>
          </div>

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

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mx-6 mt-3 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center justify-between text-rose-300 text-xs font-bold animate-fadeIn shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button 
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-200 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. SEARCH & FILTERS BAR                                   */}
        {/* ========================================================= */}
        <div className="px-6 pb-3 pt-4 shrink-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بكود المورد أو الاسم أو التصنيف أو رقم الموبايل وانتر..."
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

            {/* Status Filter */}
            <div className="md:col-span-3">
              {activeOnly ? (
                <div className="flex items-center justify-center space-x-1.5 space-x-reverse bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-2.5 text-xs text-emerald-300 font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-bold">الموردون النشطون فقط</span>
                </div>
              ) : (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors cursor-pointer font-['Cairo',sans-serif]"
                >
                  <option value="all">كل الحالات (نشط وغير نشط)</option>
                  <option value="active">نشط فقط</option>
                  <option value="inactive">غير نشط فقط</option>
                </select>
              )}
            </div>

            {/* Credit Purchases Filter */}
            <div className="md:col-span-3">
              <select
                value={creditPurchasesFilter}
                onChange={(e) => setCreditPurchasesFilter(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 shadow-xs transition-colors cursor-pointer font-['Cairo',sans-serif]"
              >
                <option value="all">كل أنواع الشراء (آجل ونقدي)</option>
                <option value="allowed">مسموح بالشراء الآجل</option>
                <option value="blocked">غير مسموح بالآجل (نقدي فقط)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. RECORDS TABLE CONTAINER (RESPONSIVE SCROLL)             */}
        {/* ========================================================= */}
        <div className="px-6 flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          {filteredAndSortedVendors.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Building2 className="w-10 h-10 stroke-[1.2] text-slate-600" />
              <span className="text-slate-400 text-sm font-bold">لا توجد سجلات موردين مطابقة لمعايير البحث الحالية.</span>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCreditPurchasesFilter('all'); }}
                className="text-xs text-amber-400 hover:underline cursor-pointer font-bold"
              >
                إعادة ضبط معايير البحث
              </button>
            </div>
          ) : (
            <div className="min-w-[1000px] pb-2">
              <table className="w-full text-right text-xs border-separate border-spacing-y-2">
                <thead className="text-slate-300 text-xs font-bold select-none">
                  <tr>
                    <th 
                      onClick={() => handleSort('code')}
                      className="pb-2 px-3 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-[10%]"
                    >
                      كود المورد {renderSortIndicator('code')}
                    </th>
                    <th 
                      onClick={() => handleSort('name')}
                      className="pb-2 px-4 font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-[26%]"
                    >
                      اسم المورد {renderSortIndicator('name')}
                    </th>
                    <th 
                      onClick={() => handleSort('mobile')}
                      className="pb-2 px-3 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-[12%]"
                    >
                      رقم الموبايل {renderSortIndicator('mobile')}
                    </th>
                    <th 
                      onClick={() => handleSort('category')}
                      className="pb-2 px-3 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-[10%]"
                    >
                      التصنيف {renderSortIndicator('category')}
                    </th>
                    <th 
                      onClick={() => handleSort('creditLimit')}
                      className="pb-2 px-3 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-[11%]"
                    >
                      حد الائتمان {renderSortIndicator('creditLimit')}
                    </th>
                    <th 
                      onClick={() => handleSort('allowCredit')}
                      className="pb-2 px-3 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-[9%]"
                    >
                      الشراء الآجل {renderSortIndicator('allowCredit')}
                    </th>
                    <th 
                      onClick={() => handleSort('status')}
                      className="pb-2 px-3 text-center font-bold cursor-pointer group/col hover:text-amber-300 transition-colors w-[8%]"
                    >
                      الحالة {renderSortIndicator('status')}
                    </th>
                    <th className="pb-2 px-3 text-center font-bold w-[14%]">
                      {isSelectionOnlyMode ? 'الاختيار' : 'الإجراء ↕'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedVendors.map((vend, idx) => {
                    const isActive = vend.status === 'نشط' || vend.status === 'active';
                    const isCurrentlyLoaded = loadedVendorId === vend.id;
                    const isCurrentlySelected = selectedVendorId === vend.id;

                    const cellBg = isCurrentlySelected
                      ? 'bg-blue-950/30 group-hover:bg-blue-950/40'
                      : isCurrentlyLoaded
                        ? 'bg-amber-950/20 group-hover:bg-amber-950/30'
                        : !isActive
                          ? 'bg-slate-950/40 opacity-75 group-hover:bg-slate-900/60'
                          : 'bg-slate-900/40 group-hover:bg-slate-800/50';

                    const cellBorder = isCurrentlySelected
                      ? 'border-blue-500/60'
                      : isCurrentlyLoaded
                        ? 'border-amber-500/50'
                        : 'border-slate-800/80';

                    return (
                      <tr 
                        key={vend.id ? `${vend.id}-${idx}` : `vend-${idx}`} 
                        onClick={() => handleRowClick(vend)}
                        className="group transition-all cursor-pointer select-none"
                      >
                        {/* 1. كود المورد */}
                        <td className={`py-3.5 px-3 text-center font-mono font-bold text-amber-400 text-xs rounded-r-xl border-r border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {vend.code}
                        </td>

                        {/* 2. اسم المورد */}
                        <td className={`py-3.5 px-4 font-bold text-slate-100 text-sm border-y ${cellBorder} ${cellBg} transition-colors`}>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="hover:text-amber-300 transition-colors">
                              {vend.name}
                            </span>
                            {isCurrentlySelected && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-600 text-white shadow-2xs shrink-0">
                                محدد للفاتورة
                              </span>
                            )}
                            {isCurrentlyLoaded && !isCurrentlySelected && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-slate-950 shadow-2xs shrink-0">
                                مُحمل
                              </span>
                            )}
                            {vend.isSystemCashVendor && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shrink-0">
                                <Sparkles className="w-3 h-3 text-cyan-400" />
                                <span>نقدي نظامي</span>
                              </span>
                            )}
                            {vend.discount !== undefined && vend.discount !== null && vend.discount > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 shrink-0">
                                <Tag className="w-3 h-3 text-rose-400" />
                                <span>خصم {vend.discount}%</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 3. رقم الموبايل */}
                        <td className={`py-3.5 px-3 text-center font-mono text-slate-300 text-xs border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`} dir="ltr">
                          {vend.mobile ? vend.mobile : <span className="text-slate-600 font-sans">—</span>}
                        </td>

                        {/* 4. التصنيف */}
                        <td className={`py-3.5 px-3 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap shadow-2xs">
                            {vend.category || vend.type || 'عام'}
                          </span>
                        </td>

                        {/* 5. حد الائتمان */}
                        <td className={`py-3.5 px-3 text-center font-mono font-bold text-slate-200 text-xs border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {vend.creditLimit !== undefined && vend.creditLimit > 0
                            ? `${vend.creditLimit.toLocaleString('ar-EG', { minimumFractionDigits: 2 })} ج.م`
                            : '0.00 ج.م'}
                        </td>

                        {/* 6. الشراء الآجل */}
                        <td className={`py-3.5 px-3 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {vend.allowCreditPurchases ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-600/40 whitespace-nowrap shadow-2xs">
                              مسموح
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap shadow-2xs">
                              غير مسموح
                            </span>
                          )}
                        </td>

                        {/* 7. الحالة */}
                        <td className={`py-3.5 px-3 text-center border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`}>
                          {vend.status === 'محذوف' || vend.status === 'deleted' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/40 text-rose-300 border border-rose-600/40 whitespace-nowrap shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              <span>محذوف</span>
                            </span>
                          ) : isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-300 border border-emerald-600/40 whitespace-nowrap shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>نشط</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 whitespace-nowrap shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              <span>غير نشط</span>
                            </span>
                          )}
                        </td>

                        {/* 8. إجراء */}
                        <td className={`py-3.5 px-3 text-center rounded-l-xl border-l border-y ${cellBorder} ${cellBg} transition-colors whitespace-nowrap`} onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Primary Action Button */}
                            <button
                              type="button"
                              onClick={() => handleRowClick(vend)}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center space-x-1 space-x-reverse transition-all cursor-pointer shadow-2xs shrink-0 ${
                                isCurrentlySelected
                                  ? 'bg-blue-600 text-white border-blue-500'
                                  : isCurrentlyLoaded
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                              }`}
                            >
                              {isSelectionOnlyMode ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                                  <span>{isCurrentlySelected ? 'محدد' : 'اختيار'}</span>
                                </>
                              ) : (
                                <>
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{isCurrentlyLoaded ? 'مُحمل' : 'تعديل'}</span>
                                </>
                              )}
                            </button>

                            {/* Toggle Active / Inactive Button */}
                            {!isSelectionOnlyMode && !vend.isSystemCashVendor && vend.status !== 'محذوف' && vend.status !== 'deleted' && (
                              <button
                                type="button"
                                onClick={(e) => handleToggleStatus(e, vend)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs ${
                                  isActive
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}
                                title={isActive ? "تعطيل المورد" : "تفعيل المورد"}
                              >
                                {isActive ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-amber-400" />
                                    <span>تعطيل</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>تفعيل</span>
                                  </>
                                )}
                              </button>
                            )}
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
              <span>إجمالي الموردين :</span>
              <span className="text-amber-400 text-base font-black font-mono">
                {filteredAndSortedVendors.length}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <span className="text-emerald-400 font-semibold">
              {activeCount} نشط
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-rose-400 font-semibold">
              {inactiveCount} غير نشط
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
