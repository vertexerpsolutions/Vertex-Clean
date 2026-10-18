import React, { useState, useEffect, useRef } from 'react';
import { 
  vendorService, 
  Vendor, 
  VendorType, 
  VendorStatus, 
  VendorCategory,
  DEFAULT_VENDOR_AREAS,
  DEFAULT_VENDOR_CLASSIFICATIONS,
  DEFAULT_PURCHASERS,
  DEFAULT_PAYMENT_TERMS
} from '../../services/vendorService';
import { 
  Building2, 
  X, 
  Save, 
  UserCheck, 
  UserX, 
  Phone, 
  Hash, 
  CreditCard, 
  Calendar, 
  MapPin, 
  FileText, 
  FileCode,
  Coins, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus
} from 'lucide-react';

const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const ARABIC_DAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

export interface VendorViewEditModalProps {
  isOpen: boolean;
  vendor: Vendor | null;
  onClose: () => void;
  onSaved?: (updatedVendor: Vendor) => void;
  zIndexClass?: string;
}

export const VendorViewEditModal: React.FC<VendorViewEditModalProps> = ({
  isOpen,
  vendor,
  onClose,
  onSaved,
  zIndexClass = 'z-[60]'
}) => {
  // Form fields state
  const [formName, setFormName] = useState<string>('');
  const [formMobile, setFormMobile] = useState<string>('');
  const [formPhone2, setFormPhone2] = useState<string>('');
  const [formVendorType, setFormVendorType] = useState<string>('');
  const [formCategory, setFormCategory] = useState<VendorCategory>('Local');
  const [formAssignedPurchaser, setFormAssignedPurchaser] = useState<string>('');
  const [formTaxNumber, setFormTaxNumber] = useState<string>('');
  const [formCommercialRegister, setFormCommercialRegister] = useState<string>('');
  const [formCreditLimit, setFormCreditLimit] = useState<string>('');
  const [formAllowCreditPurchases, setFormAllowCreditPurchases] = useState<boolean>(false);
  const [formPaymentTerms, setFormPaymentTerms] = useState<string>('آجل 30 يوم من الفاتورة');
  const [formStatus, setFormStatus] = useState<VendorStatus>('نشط');
  const [formDiscount, setFormDiscount] = useState<string>('');
  const [formArea, setFormArea] = useState<string>('');
  const [formAddress, setFormAddress] = useState<string>('');
  const [formSpecialNumber, setFormSpecialNumber] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formOpeningBalance, setFormOpeningBalance] = useState<string>('');
  const [formOpeningBalanceType, setFormOpeningBalanceType] = useState<'دائن' | 'مدين' | ''>('دائن');
  const [formOpeningBalanceDate, setFormOpeningBalanceDate] = useState<string>('');

  // Expand / Collapse Collapsible Sections State (Matching VendorMasterView)
  const [showAdditionalInfo, setShowAdditionalInfo] = useState<boolean>(false);
  const [showFinancialInfo, setShowFinancialInfo] = useState<boolean>(false);

  // Custom Calendar Date Picker State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(() => new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState<number>(() => new Date().getMonth());
  const datePickerRef = useRef<HTMLDivElement>(null);

  // UI feedback state
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Dynamic classifications & areas from service
  const classifications = vendorService.getVendorClassifications ? vendorService.getVendorClassifications() : DEFAULT_VENDOR_CLASSIFICATIONS;
  const areas = vendorService.getVendorAreas ? vendorService.getVendorAreas() : DEFAULT_VENDOR_AREAS;
  const purchasers = vendorService.getPurchasersList ? vendorService.getPurchasersList() : DEFAULT_PURCHASERS;
  const paymentTermsList = vendorService.getPaymentTermsList ? vendorService.getPaymentTermsList() : DEFAULT_PAYMENT_TERMS;

  useEffect(() => {
    if (vendor && isOpen) {
      setFormName(vendor.name || '');
      setFormMobile(vendor.mobile || '');
      setFormPhone2(vendor.phone2 || '');
      setFormVendorType(vendor.type || '');
      setFormCategory(vendor.category || 'Local');
      setFormAssignedPurchaser(vendor.assignedPurchaser || '');
      setFormTaxNumber(vendor.taxNumber || '');
      setFormCommercialRegister(vendor.commercialRegister || '');
      setFormCreditLimit(
        vendor.creditLimit !== undefined && vendor.creditLimit !== null && vendor.creditLimit !== 0 
          ? vendor.creditLimit.toString() 
          : ''
      );
      setFormAllowCreditPurchases(vendor.allowCreditPurchases ?? false);
      setFormPaymentTerms(vendor.paymentTerms || 'آجل 30 يوم من الفاتورة');
      setFormStatus(vendor.status || 'نشط');
      setFormDiscount(
        vendor.discountRate 
          ? (vendor.discountRate <= 1 ? (Math.round(vendor.discountRate * 10000) / 100).toString() : vendor.discountRate.toString()) 
          : ''
      );
      setFormArea(vendor.area || '');
      setFormAddress(vendor.address || '');
      setFormSpecialNumber(vendor.specialNumber || '');
      setFormNotes(vendor.notes || '');
      setFormOpeningBalance(
        vendor.openingBalance !== undefined && vendor.openingBalance !== null && vendor.openingBalance !== 0 
          ? vendor.openingBalance.toString() 
          : ''
      );
      setFormOpeningBalanceType((vendor.openingBalanceType as any) || 'دائن');
      setFormOpeningBalanceDate(vendor.openingBalanceDate || '');
      setIsDirty(false);
      setErrorMessage(null);
      setSuccessMessage(null);

      // Auto-open sections if they contain existing data
      const hasAdditionalData = Boolean(
        vendor.discountRate || vendor.area || vendor.address || vendor.phone2 || 
        vendor.taxNumber || vendor.commercialRegister || vendor.notes ||
        (vendor.paymentTerms && vendor.paymentTerms !== 'آجل 30 يوم من الفاتورة')
      );
      setShowAdditionalInfo(hasAdditionalData);

      const hasFinancialData = Boolean(
        vendor.openingBalance || vendor.creditLimit || vendor.openingBalanceDate
      );
      setShowFinancialInfo(hasFinancialData);

      // Initialize date picker month/year
      if (vendor.openingBalanceDate) {
        const parts = vendor.openingBalanceDate.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          if (!isNaN(y) && !isNaN(m)) {
            setPickerYear(y);
            setPickerMonth(m);
          }
        }
      }
    }
  }, [vendor, isOpen]);

  // Click outside date picker listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };
    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

  if (!isOpen || !vendor) return null;

  const handleFieldChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setIsDirty(true);
    setErrorMessage(null);
  };

  const handlePrevMonth = () => {
    if (pickerMonth === 0) {
      setPickerMonth(11);
      setPickerYear(prev => prev - 1);
    } else {
      setPickerMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerMonth === 11) {
      setPickerMonth(0);
      setPickerYear(prev => prev + 1);
    } else {
      setPickerMonth(prev => prev + 1);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const firstDayIndex = new Date(pickerYear, pickerMonth, 1).getDay();
  const daysInMonth = new Date(pickerYear, pickerMonth + 1, 0).getDate();

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formName.trim()) {
      setErrorMessage('اسم المورد حقل إلزامي ولا يمكن تركه فارغاً.');
      return;
    }

    const creditLimitNum = formCreditLimit.trim() ? Math.max(0, parseFloat(formCreditLimit) || 0) : 0;
    const discountRaw = formDiscount.trim() ? parseFloat(formDiscount) : 0;
    const discountNum = isNaN(discountRaw) ? 0 : (discountRaw > 1 ? discountRaw / 100 : discountRaw);
    const openingBalanceNum = formOpeningBalance.trim() ? parseFloat(formOpeningBalance) || 0 : 0;

    const updateData: Partial<Vendor> = {
      name: formName.trim(),
      mobile: formMobile.trim(),
      phone2: formPhone2.trim() || undefined,
      type: (formVendorType.trim() || undefined) as VendorType | undefined,
      category: formCategory,
      assignedPurchaser: formAssignedPurchaser.trim() || undefined,
      taxNumber: formTaxNumber.trim() || undefined,
      commercialRegister: formCommercialRegister.trim() || undefined,
      creditLimit: creditLimitNum,
      allowCreditPurchases: formAllowCreditPurchases,
      paymentTerms: formPaymentTerms.trim() || undefined,
      status: formStatus,
      discountRate: discountNum,
      area: formArea.trim() || undefined,
      address: formAddress.trim() || undefined,
      specialNumber: formSpecialNumber.trim() || undefined,
      notes: formNotes.trim() || undefined,
      openingBalance: openingBalanceNum,
      openingBalanceType: formOpeningBalanceType || undefined,
      openingBalanceDate: formOpeningBalanceDate.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    const result = vendorService.updateVendor(vendor.id, updateData);

    if (!result.success) {
      setErrorMessage(result.error || 'تعذر حفظ تعديلات المورد.');
      return;
    }

    setSuccessMessage('تم حفظ وتحديث بيانات المورد بنجاح.');
    setIsDirty(false);

    if (result.vendor && onSaved) {
      onSaved(result.vendor);
    }

    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleToggleStatusQuick = () => {
    const nextStatus: VendorStatus = formStatus === 'نشط' || formStatus === 'active' ? 'غير نشط' : 'نشط';
    handleFieldChange(setFormStatus, nextStatus);
  };

  const isActive = formStatus === 'نشط' || formStatus === 'active';

  return (
    <div className={`fixed inset-0 ${zIndexClass} bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 no-print animate-in fade-in duration-200`}>
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl dir-rtl text-right flex flex-col max-h-[92vh] overflow-hidden font-sans animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Matching VendorMasterView aesthetics) */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  {vendor.name ? `تعديل بيانات المورد: ${vendor.name}` : 'عرض وتعديل بيانات المورد'}
                </h2>
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  كود: {vendor.code}
                </span>
                {vendor.isSystemCashVendor && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>مورد نقدي نظامي</span>
                  </span>
                )}
                {isDirty && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                    تعديلات غير محفوظة
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تعديل وتحديث بيانات المورد والاتصال والحدود المالية وفق الهيكل المعتمد
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Success Banners */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/30 flex items-center space-x-2 space-x-reverse text-rose-400 text-xs shrink-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/30 flex items-center space-x-2 space-x-reverse text-emerald-400 text-xs shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Form Body - Scrollable (Strict 1:1 match with VendorMasterView form structure) */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 custom-scrollbar text-xs">
          
          {/* أولًا: البيانات الأساسية — ظاهرة دائمًا */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. كود المورد (Read-Only) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                <span>كود المورد</span>
              </label>
              <input
                type="text"
                value={vendor.code}
                readOnly
                tabIndex={-1}
                onKeyDown={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                onChange={() => {}}
                className="w-full px-3 py-1.5 h-8.5 rounded-lg border border-slate-800 bg-slate-950/80 text-slate-300 font-mono text-xs focus:outline-none cursor-default select-all"
              />
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                الكود المعتمد في السجل (للقراءة فقط)
              </p>
            </div>

            {/* 2. اسم المورد / الشركة (مطلوب) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                اسم المورد / الشركة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => handleFieldChange(setFormName, e.target.value)}
                placeholder="مثال: شركة الأهرام للصناعات الكيماوية"
                className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            {/* 3. رقم الموبايل */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>رقم الموبايل</span>
              </label>
              <input
                type="text"
                value={formMobile}
                onChange={(e) => handleFieldChange(setFormMobile, e.target.value)}
                placeholder="01098765432"
                className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/50 dir-ltr text-right"
              />
            </div>

            {/* 4. فئة المورد / النطاق */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                فئة المورد / النطاق
              </label>
              <select
                value={formCategory}
                onChange={(e) => handleFieldChange(setFormCategory, e.target.value as VendorCategory)}
                className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="Local">مورد محلي (Local)</option>
                <option value="Primary">مورد استراتيجي رئيسي (Primary)</option>
                <option value="Corporate">شركات ومؤسسات (Corporate)</option>
                <option value="Wholesale">وكيل وتوزيع جملة (Wholesale)</option>
                <option value="Import">مورد دولي واستيراد (Import)</option>
              </select>
            </div>

            {/* 5. تصنيف التوريد (اختياري) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                تصنيف التوريد <span className="text-slate-500 font-normal text-[11px]">(اختياري)</span>
              </label>
              <div className="relative">
                <select
                  value={formVendorType}
                  onChange={(e) => handleFieldChange(setFormVendorType, e.target.value)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer appearance-none pl-8"
                >
                  <option value="">اختر تصنيف التوريد (اختياري)</option>
                  {formVendorType && !classifications.includes(formVendorType) && (
                    <option value={formVendorType}>{formVendorType}</option>
                  )}
                  {classifications.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* 6. الحالة التشغيلية */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs">
                الحالة التشغيلية
              </label>
              <select
                value={formStatus}
                onChange={(e) => handleFieldChange(setFormStatus, e.target.value as VendorStatus)}
                className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="نشط">نشط (Active)</option>
                <option value="غير نشط">غير نشط (Inactive)</option>
              </select>
            </div>

            {/* 7. السماح بالشراء الآجل */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>السماح بالشراء الآجل</span>
              </label>
              <select
                value={formAllowCreditPurchases ? 'true' : 'false'}
                onChange={(e) => handleFieldChange(setFormAllowCreditPurchases, e.target.value === 'true')}
                className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
              >
                <option value="false">غير مسموح (نقدي فقط)</option>
                <option value="true">مسموح بالشراء الآجل</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                يتحكم في إمكانية إصدار فواتير شراء آجل للمورد
              </p>
            </div>

            {/* 8. مسؤول المشتريات */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>مسؤول المشتريات</span>
                <span className="text-slate-500 font-normal text-[11px]">(اختياري)</span>
              </label>
              <div className="relative">
                <select
                  value={formAssignedPurchaser}
                  onChange={(e) => handleFieldChange(setFormAssignedPurchaser, e.target.value)}
                  className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer appearance-none pl-8"
                >
                  <option value="">اختر مسؤول المشتريات (اختياري)</option>
                  {formAssignedPurchaser && (
                    <option value={formAssignedPurchaser}>{formAssignedPurchaser}</option>
                  )}
                  {purchasers.filter(p => p !== formAssignedPurchaser).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* ثانيًا: البيانات الإضافية — مخفية افتراضيًا (Expand / Collapse) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowAdditionalInfo(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer text-xs font-semibold select-none"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {showAdditionalInfo ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
                <span>{showAdditionalInfo ? '− إخفاء البيانات الإضافية' : '+ عرض البيانات الإضافية'}</span>
                <span className="text-[11px] text-slate-500 font-normal mr-1">
                  (المنطقة، العنوان التفصيلي، الهاتف 2، الرقم الضريبي، السجل التجاري، نسبة الخصم، الملاحظات)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 space-x-reverse text-slate-400">
                {showAdditionalInfo ? (
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {showAdditionalInfo && (
              <div className="p-3.5 border-t border-slate-800 space-y-3 bg-slate-950/30 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* نسبة الخصم التجاري (%) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs">
                      نسبة الخصم التجاري (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={formDiscount}
                      onChange={(e) => handleFieldChange(setFormDiscount, e.target.value)}
                      placeholder="أدخل نسبة الخصم (%) (اختياري)..."
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* المنطقة الجغرافية / الصناعية */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>المنطقة</span>
                      <span className="text-slate-500 font-normal text-[11px]">(اختياري)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formArea}
                        onChange={(e) => handleFieldChange(setFormArea, e.target.value)}
                        className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer appearance-none pl-8"
                      >
                        <option value="">اختر المنطقة (اختياري)</option>
                        {formArea && !areas.includes(formArea) && (
                          <option value={formArea}>{formArea}</option>
                        )}
                        {areas.map((area) => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* العنوان التفصيلي / المصنع */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>العنوان التفصيلي / المصنع</span>
                      <span className="text-slate-500 font-normal text-[11px]">(اختياري)</span>
                    </label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => handleFieldChange(setFormAddress, e.target.value)}
                      placeholder="أدخل العنوان التفصيلي للمورد أو المصنع (اختياري)..."
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* الهاتف الأرضي / هاتف 2 */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>الهاتف الأرضي / هاتف 2</span>
                    </label>
                    <input
                      type="text"
                      value={formPhone2}
                      onChange={(e) => handleFieldChange(setFormPhone2, e.target.value)}
                      placeholder="0226849301"
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/50 dir-ltr text-right"
                    />
                  </div>

                  {/* الرقم الضريبي */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <FileCode className="w-3.5 h-3.5 text-amber-400" />
                      <span>الرقم الضريبي</span>
                      <span className="text-slate-500 font-normal text-[11px]">(اختياري)</span>
                    </label>
                    <input
                      type="text"
                      value={formTaxNumber}
                      onChange={(e) => handleFieldChange(setFormTaxNumber, e.target.value)}
                      placeholder="100-294-883"
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* السجل التجاري / رقم خاص */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span>السجل التجاري / رقم خاص</span>
                      <span className="text-slate-500 font-normal text-[11px]">(اختياري)</span>
                    </label>
                    <input
                      type="text"
                      value={formCommercialRegister}
                      onChange={(e) => handleFieldChange(setFormCommercialRegister, e.target.value)}
                      placeholder="CR-88492"
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* شروط السداد والائتمان */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      <span>شروط السداد</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formPaymentTerms}
                        onChange={(e) => handleFieldChange(setFormPaymentTerms, e.target.value)}
                        className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer appearance-none pl-8"
                      >
                        {paymentTermsList.map((term) => (
                          <option key={term} value={term}>{term}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    </div>
                  </div>

                  {/* ملاحظات التوريد والتعاقد */}
                  <div className="col-span-1 sm:col-span-2 lg:col-span-4">
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>ملاحظات التوريد والتعاقد</span>
                      <span className="text-slate-500 font-normal text-[11px]">(اختياري)</span>
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => handleFieldChange(setFormNotes, e.target.value)}
                      placeholder="سجل أي شروط خاصة أو تفاصيل العقود والملاحظات..."
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ثالثًا: البيانات المالية والائتمانية — قسم مستقل (Expand / Collapse) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowFinancialInfo(prev => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer text-xs font-semibold select-none"
            >
              <div className="flex items-center space-x-2 space-x-reverse">
                <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {showFinancialInfo ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
                <span>{showFinancialInfo ? '− إخفاء البيانات المالية والائتمانية' : '+ البيانات المالية والائتمانية'}</span>
                <span className="text-[11px] text-slate-500 font-normal mr-1">
                  (نوع الرصيد، رصيد أول المدة، حد الائتمان، تاريخ الإضافة)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 space-x-reverse text-slate-400">
                {showFinancialInfo ? (
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {showFinancialInfo && (
              <div className="p-3.5 border-t border-slate-800 space-y-3 bg-slate-950/30 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* 1. نوع الرصيد الافتتاحي */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-[11px]">
                      نوع الرصيد الافتتاحي <span className="text-slate-500 text-[10px]">(اختياري)</span>
                    </label>
                    <select
                      value={formOpeningBalanceType}
                      onChange={(e) => handleFieldChange(setFormOpeningBalanceType, e.target.value as any)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
                    >
                      <option value="دائن">دائن (Credit - مستحق للمورد)</option>
                      <option value="مدين">مدين (Debit - دفعة مقدمة للمورد)</option>
                    </select>
                  </div>

                  {/* 2. رصيد أول المدة (ج.م) */}
                  <div>
                    <label className="block text-slate-300 font-medium mb-1 text-[11px]">
                      رصيد أول المدة (ج.م) <span className="text-slate-500 text-[10px]">(اختياري)</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formOpeningBalance}
                      onChange={(e) => handleFieldChange(setFormOpeningBalance, e.target.value)}
                      placeholder="أدخل رصيد أول المدة (اختياري)..."
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                  </div>

                  {/* 3. حد الائتمان للمشتريات (ج.م) */}
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center space-x-1 space-x-reverse">
                      <Coins className="w-3.5 h-3.5 text-amber-400" />
                      <span>حد الائتمان (ج.م)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={formCreditLimit}
                      onChange={(e) => handleFieldChange(setFormCreditLimit, e.target.value)}
                      placeholder="أدخل حد الائتمان (اختياري)..."
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500/50"
                    />
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      0 = بلا سقف ائتماني
                    </p>
                  </div>

                  {/* 4. تاريخ الإضافة (Calendar Date Picker) */}
                  <div className="relative" ref={datePickerRef}>
                    <label className="block text-slate-300 font-medium mb-1 text-[11px]">
                      تاريخ الإضافة <span className="text-slate-500 text-[10px]">(اختياري)</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                      className="w-full px-3 py-1.5 h-8.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs flex items-center justify-between focus:outline-none focus:border-amber-500/50 cursor-pointer hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className={formOpeningBalanceDate ? "text-amber-300 font-mono font-semibold" : "text-slate-500"}>
                          {formOpeningBalanceDate
                            ? formatDateForDisplay(formOpeningBalanceDate)
                            : "اختر التاريخ من التقويم (اختياري)"}
                        </span>
                      </div>

                      {formOpeningBalanceDate ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFieldChange(setFormOpeningBalanceDate, '');
                          }}
                          className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          title="تفريغ التاريخ"
                        >
                          <X className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      )}
                    </button>

                    {/* Real Interactive Calendar Popover */}
                    {isDatePickerOpen && (
                      <div className="absolute z-50 mt-1 left-0 right-0 sm:right-auto sm:w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-2xl space-y-3 text-right" dir="rtl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="الشهر السابق"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-bold text-slate-200 font-sans">
                            {ARABIC_MONTHS[pickerMonth]} {pickerYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            title="الشهر القادم"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center">
                          {ARABIC_DAYS.map((day, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-slate-500 py-0.5">
                              {day}
                            </span>
                          ))}
                          {Array.from({ length: firstDayIndex }).map((_, idx) => (
                            <span key={`empty-${idx}`} className="py-1" />
                          ))}
                          {Array.from({ length: daysInMonth }).map((_, idx) => {
                            const dayNumber = idx + 1;
                            const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
                            const isSelected = formOpeningBalanceDate === dateStr;
                            const isToday = new Date().toISOString().split('T')[0] === dateStr;

                            return (
                              <button
                                key={`day-${dayNumber}`}
                                type="button"
                                onClick={() => {
                                  handleFieldChange(setFormOpeningBalanceDate, dateStr);
                                  setIsDatePickerOpen(false);
                                }}
                                className={`py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                                    : isToday
                                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 hover:bg-amber-500/30'
                                    : 'text-slate-300 hover:bg-slate-800'
                                }`}
                              >
                                {dayNumber}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        </form>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center space-x-2 space-x-reverse">
            {/* Active / Inactive status toggle button */}
            {!vendor.isSystemCashVendor && (
              <button
                type="button"
                onClick={handleToggleStatusQuick}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {isActive ? <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> : <UserX className="w-3.5 h-3.5 text-slate-400" />}
                <span>{isActive ? 'الحالة: نشط (اضغط للتعطيل)' : 'الحالة: غير نشط (اضغط للتفعيل)'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              إلغاء وإغلاق
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ التعديلات</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
