import React, { useState } from 'react';
import { 
  Building2, 
  Store, 
  Package, 
  Vault, 
  Landmark, 
  FolderTree, 
  Layers, 
  Coins, 
  Users, 
  ShoppingCart, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  ArrowRight
} from 'lucide-react';
import { setupWizardService } from '../../services/setupWizardService';
import { SetupWizardData } from '../../types';

interface StartupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

export const StartupWizardModal: React.FC<StartupWizardModalProps> = ({
  isOpen,
  onClose,
  onFinish
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCompletedView, setIsCompletedView] = useState<boolean>(false);
  const [isSummaryView, setIsSummaryView] = useState<boolean>(false);

  // Form State initialized from setupWizardService
  const [wizardData, setWizardData] = useState<SetupWizardData>(setupWizardService.getConfig());

  // Step 5: Temporary Bank Account entry state
  const [tempBank, setTempBank] = useState({
    bankName: 'بنك الرياض / مصر',
    accountNumber: '100234567890',
    iban: 'SA1234567890123456789012',
    currency: 'SAR (ر.س)'
  });

  // Step 6: Temporary Category
  const [tempCategory, setTempCategory] = useState({ name: 'أجهزة ولابتوبات', parent: 'الرئيسية' });
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'أجهزة الحاسب واللابتوب',
    'قطع الغيار والإكسسوارات',
    'البرمجيات والتراخيص',
    'خدمات الدعم والصيانة'
  ]);

  // Step 7: Units
  const [unitsList, setUnitsList] = useState<{ id: string; name: string; symbol: string; isDefault: boolean }[]>([
    { id: '1', name: 'عدد (قطعة)', symbol: 'PCS', isDefault: true },
    { id: '2', name: 'كرتونة', symbol: 'BOX', isDefault: false },
    { id: '3', name: 'طرد / باقة', symbol: 'PK', isDefault: false },
    { id: '4', name: 'كيلوجرام', symbol: 'KG', isDefault: false },
    { id: '5', name: 'ساعة خدمة', symbol: 'HRS', isDefault: false }
  ]);
  const [newUnitName, setNewUnitName] = useState('');

  if (!isOpen) return null;

  const stepsMeta = [
    { number: 1, title: 'بيانات الشركة', icon: Building2 },
    { number: 2, title: 'الفرع الرئيسي', icon: Store },
    { number: 3, title: 'المخزن الرئيسي', icon: Package },
    { number: 4, title: 'الخزينة الرئيسية', icon: Vault },
    { number: 5, title: 'البنك', icon: Landmark },
    { number: 6, title: 'شجرة الأصناف', icon: FolderTree },
    { number: 7, title: 'الوحدات', icon: Layers },
    { number: 8, title: 'الأرصدة الافتتاحية', icon: Coins },
    { number: 9, title: 'المستخدمون والصلاحيات', icon: Users },
    { number: 10, title: 'إعدادات البيع الأساسية', icon: ShoppingCart }
  ];

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsSummaryView(true);
    }
  };

  const handlePrev = () => {
    if (isSummaryView) {
      setIsSummaryView(false);
    } else if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleFinalFinish = () => {
    setupWizardService.updateConfig({
      ...wizardData,
      isCompleted: true,
      completedAt: new Date().toISOString()
    });
    setIsSummaryView(false);
    setIsCompletedView(true);
  };

  const handleGoToSettings = () => {
    onClose();
    if (onFinish) onFinish();
  };

  return (
    <div id="startup-wizard-modal-overlay" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none animate-fadeIn" dir="rtl">
      <div 
        id="startup-wizard-modal-container"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] max-h-[850px] shadow-2xl flex flex-col overflow-hidden text-right relative"
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <h2 className="text-base sm:text-lg font-black text-slate-100">معالج بدء التشغيل</h2>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                  Startup Wizard
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                تهيئة وتجهيز إعدادات النظام للتشغيل الفعلي لأول مرة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10 Steps Visual Stepper Bar */}
        {!isCompletedView && (
          <div className="px-6 py-3.5 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto custom-scrollbar shrink-0">
            <div className="flex items-center justify-between min-w-[700px] gap-2">
              {stepsMeta.map((step) => {
                const isCurrent = currentStep === step.number && !isSummaryView;
                const isDone = currentStep > step.number || isSummaryView;
                return (
                  <button
                    key={step.number}
                    type="button"
                    onClick={() => {
                      if (!isSummaryView) setCurrentStep(step.number);
                    }}
                    className={`flex flex-col items-center flex-1 min-w-[62px] group transition-all cursor-pointer`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all border ${
                      isDone 
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-md shadow-emerald-500/20' 
                        : isCurrent 
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black ring-4 ring-amber-500/20 scale-110 shadow-lg' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.number}
                    </div>
                    <span className={`text-[11px] mt-1.5 whitespace-nowrap transition-colors font-medium ${
                      isCurrent ? 'text-amber-400 font-bold' : isDone ? 'text-emerald-400' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
              
              {/* Finish Indicator */}
              <div className="flex flex-col items-center flex-1 min-w-[62px]">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all border ${
                  isSummaryView 
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-4 ring-emerald-500/20 scale-110' 
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  10+
                </div>
                <span className={`text-[11px] mt-1.5 whitespace-nowrap font-medium ${
                  isSummaryView ? 'text-emerald-400 font-bold' : 'text-slate-500'
                }`}>
                  إنهاء
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {/* VIEW: COMPLETED SUCCESS VIEW (Screenshot 4) */}
          {isCompletedView ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8 animate-fadeIn">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mb-6 shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-14 h-14" />
              </div>
              <h3 className="text-2xl font-black text-slate-100 mb-2">
                تم إنهاء معالج بدء التشغيل بنجاح
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-8">
                يمكنك الآن استخدام النظام بالكامل أو استكمال أي إعدادات إضافية من القوائم الرئيسية.
              </p>
              <button
                type="button"
                id="btn-wizard-go-to-settings"
                onClick={handleGoToSettings}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm flex items-center space-x-2 space-x-reverse"
              >
                <span>الانتقال للإعدادات</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : isSummaryView ? (
            /* VIEW: SUMMARY BEFORE FINISH (Screenshot 3) */
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-2">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <Check className="w-8 h-8 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-slate-100">
                  أنت على وشك إنهاء معالج بدء التشغيل
                </h3>
                <p className="text-xs text-slate-400">
                  تم إدخال وتجهيز البيانات الأساسية التالية بنجاح:
                </p>
              </div>

              {/* Checklist Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
                {[
                  { label: 'بيانات الشركة', icon: Building2, desc: wizardData.companyName || 'شركة مثال التجارية' },
                  { label: 'الفرع الرئيسي', icon: Store, desc: 'الفرع الرئيسي (BR-01)' },
                  { label: 'المخزن الرئيسي', icon: Package, desc: 'المستودع المركزي (WH-01)' },
                  { label: 'الخزينة الرئيسية', icon: Vault, desc: 'الخزينة الرئيسية (TR-01)' },
                  { label: 'البنك', icon: Landmark, desc: 'بنك الرياض / مصر' },
                  { label: 'شجرة الأصناف', icon: FolderTree, desc: `${categoriesList.length} مجموعات مهيأة` },
                  { label: 'الوحدات الأساسية', icon: Layers, desc: `${unitsList.length} وحدات قياس` },
                  { label: 'الأرصدة الافتتاحية', icon: Coins, desc: 'سنة مالية 2026 جاهزة' },
                  { label: 'المستخدمون والصلاحيات', icon: Users, desc: 'حساب Super Admin نشط' },
                  { label: 'إعدادات البيع الأساسية', icon: ShoppingCart, desc: 'تسعير وسياسات معتمدة' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-xl border border-slate-800">
                    <div className="flex items-center space-x-2.5 space-x-reverse">
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-200">{item.label}</div>
                        <div className="text-[10px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 1 TO 10 FORMS */
            <div className="max-w-3xl mx-auto space-y-6">
              {/* STEP 1: بيانات الشركة (Screenshot 2) */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100 flex items-center space-x-2 space-x-reverse">
                      <span>1. بيانات الشركة</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">أدخل بيانات شركتك الأساسية</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Logo Box */}
                    <div className="md:col-span-1 flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-950/50 hover:bg-slate-950 transition-colors text-center">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">شعار الشركة</span>
                      <p className="text-[10px] text-slate-500 mt-1">اختر صورة الشعار (اختياري) PNG, JPG</p>
                      <button type="button" className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300">
                        رفع ملف
                      </button>
                    </div>

                    {/* Inputs */}
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          اسم الشركة <span className="text-rose-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={wizardData.companyName}
                          onChange={(e) => setWizardData({ ...wizardData, companyName: e.target.value })}
                          placeholder="شركة مثال التجارية"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          الاسم التجاري
                        </label>
                        <input
                          type="text"
                          value={wizardData.commercialName}
                          onChange={(e) => setWizardData({ ...wizardData, commercialName: e.target.value })}
                          placeholder="مجموعة مثال الخليج للحلول التقنية"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            العملة <span className="text-rose-400">*</span>
                          </label>
                          <select
                            value={wizardData.baseCurrency}
                            onChange={(e) => setWizardData({ ...wizardData, baseCurrency: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                          >
                            <option value="EGP">جنيه مصري (EGP)</option>
                            <option value="SAR">ريال سعودي (SAR)</option>
                            <option value="USD">دولار أمريكي (USD)</option>
                            <option value="AED">درهم إماراتي (AED)</option>
                            <option value="KWD">دينار كويتي (KWD)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            الرقم الضريبي <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={wizardData.taxRegistrationNumber}
                            onChange={(e) => setWizardData({ ...wizardData, taxRegistrationNumber: e.target.value })}
                            placeholder="123-456-789"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500 text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: الفرع الرئيسي */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">2. الفرع الرئيسي</h3>
                    <p className="text-xs text-slate-400 mt-0.5">تهيئة الفرع الأساسي للمؤسسة</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">كود الفرع</label>
                      <input type="text" defaultValue="BR-01" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الفرع</label>
                      <input type="text" defaultValue="الفرع الرئيسي - الرياض" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">المدينة</label>
                      <input type="text" defaultValue="الرياض" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">هاتف الفرع</label>
                      <input type="text" defaultValue="+966 11 000 0000" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-100" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: المخزن الرئيسي */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">3. المخزن الرئيسي</h3>
                    <p className="text-xs text-slate-400 mt-0.5">تحديد مستودع البضائع الافتراضي</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">كود المخزن</label>
                      <input type="text" defaultValue="WH-01" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المخزن</label>
                      <input type="text" defaultValue="المستودع المركزي الرئيسي" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">الموقع</label>
                      <input type="text" defaultValue="المنطقة الصناعية الثانية" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">أمين المخزن الافتراضي</label>
                      <input type="text" defaultValue="أمين المستودع الرئيسي" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: الخزينة الرئيسية */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">4. الخزينة الرئيسية</h3>
                    <p className="text-xs text-slate-400 mt-0.5">صندوق النقدية المقبوضات والمدفوعات</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">كود الخزينة</label>
                      <input type="text" defaultValue="TR-01" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-amber-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم الخزينة</label>
                      <input type="text" defaultValue="الخزينة الرئيسية - الصندوق العام" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">العملة</label>
                      <input type="text" defaultValue="العملة الأساسية (SAR / EGP)" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-400" disabled />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">الحد الأقصى للنقدية</label>
                      <input type="number" defaultValue="50000" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-100" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: البنك عند الحاجة */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">5. الحساب البنكي الأساسي (اختياري)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">سجل حسابك البنكي للتحويلات والمدفوعات</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم البنك</label>
                      <input type="text" value={tempBank.bankName} onChange={(e) => setTempBank({...tempBank, bankName: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الحساب</label>
                      <input type="text" value={tempBank.accountNumber} onChange={(e) => setTempBank({...tempBank, accountNumber: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-slate-100" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">رقم الآيبان الدولي (IBAN)</label>
                      <input type="text" value={tempBank.iban} onChange={(e) => setTempBank({...tempBank, iban: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-emerald-400 text-left" dir="ltr" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: شجرة الأصناف */}
              {currentStep === 6 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">6. شجرة وتصنيف الأصناف</h3>
                    <p className="text-xs text-slate-400 mt-0.5">تحديد المجموعات الرئيسية والفرعية (مستويين أو 3 مستويات)</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={tempCategory.name} 
                        onChange={(e) => setTempCategory({ ...tempCategory, name: e.target.value })}
                        placeholder="اسم المجموعة الجديدة..." 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          if (tempCategory.name.trim()) {
                            setCategoriesList([...categoriesList, tempCategory.name.trim()]);
                            setTempCategory({ name: '', parent: 'الرئيسية' });
                          }
                        }}
                        className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 space-x-reverse"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إضافة مجموعة</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {categoriesList.map((cat, idx) => (
                        <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-200">📁 {cat}</span>
                          <span className="text-[10px] text-slate-500 font-mono">مستوى 1</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 7: الوحدات الأساسية */}
              {currentStep === 7 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">7. الوحدات الأساسية</h3>
                    <p className="text-xs text-slate-400 mt-0.5">وحدات القياس والبيع (الافتراضي: عدد)</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newUnitName}
                        onChange={(e) => setNewUnitName(e.target.value)}
                        placeholder="اسم الوحدة (مثال: درزن، لفة...)" 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" 
                      />
                      <button 
                        type="button" 
                        onClick={() => {
                          if (newUnitName.trim()) {
                            setUnitsList([...unitsList, { id: String(Date.now()), name: newUnitName.trim(), symbol: 'UNIT', isDefault: false }]);
                            setNewUnitName('');
                          }
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs"
                      >
                        إضافة
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {unitsList.map((unit) => (
                        <div key={unit.id} className={`p-3 rounded-xl border flex items-center justify-between ${
                          unit.isDefault ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950 border-slate-800'
                        }`}>
                          <div>
                            <div className="text-xs font-bold text-slate-200">{unit.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{unit.symbol}</div>
                          </div>
                          {unit.isDefault && (
                            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded">الافتراضي</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 8: الأرصدة الافتتاحية */}
              {currentStep === 8 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">8. الأرصدة الافتتاحية (اختياري)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">تحديد رصيد بداية المدة والتاريخ المالي</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">بداية السنة المالية</label>
                      <input type="date" defaultValue="2026-01-01" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">الرصيد النقدي الافتتاحي</label>
                      <input type="number" defaultValue="10000" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-emerald-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 9: المستخدمون والصلاحيات */}
              {currentStep === 9 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">9. المستخدمون والصلاحيات</h3>
                    <p className="text-xs text-slate-400 mt-0.5">تأكيد حساب مدير النظام وصلاحيات الأدوار</p>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-200">حساب مدير النظام (Super Admin)</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">نشط</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>اسم المستخدم: <span className="font-mono font-bold text-slate-200">admin</span></div>
                      <div>الصلاحية: <span className="font-bold text-amber-400">كامل الصلاحيات (Full Control)</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 10: إعدادات البيع الأساسية */}
              {currentStep === 10 && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="text-lg font-black text-slate-100">10. إعدادات البيع والفوترة الأساسية</h3>
                    <p className="text-xs text-slate-400 mt-0.5">سياسات البيع والخصومات الافتراضية</p>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-2.5 space-x-reverse p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 text-amber-500 focus:ring-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">السماح بالبيع الآجل للعملاء</div>
                        <div className="text-[10px] text-slate-500">تمكين خيار السداد الآجل في شاشات المبيعات</div>
                      </div>
                    </label>
                    <label className="flex items-center space-x-2.5 space-x-reverse p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input type="checkbox" defaultChecked className="rounded border-slate-700 text-amber-500 focus:ring-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">إظهار مؤشر ربحية الفاتورة للمستخدمين المصرح لهم</div>
                        <div className="text-[10px] text-slate-500">حساب الربحية الاسترشادية حسب متوسط التكلفة وآخر سعر شراء</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Hint Notice Banner (as in screenshot) */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                <span className="text-xs text-blue-300 font-medium">
                  يمكنك تخطي أي خطوة والعودة إليها لاحقاً من الإعدادات
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions (Screenshot 2 & 3) */}
        {!isCompletedView && (
          <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              id="btn-wizard-cancel"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold text-xs cursor-pointer transition-colors"
            >
              إلغاء المعالج
            </button>

            <div className="flex items-center space-x-2.5 space-x-reverse">
              {/* Previous */}
              {(currentStep > 1 || isSummaryView) && (
                <button
                  type="button"
                  id="btn-wizard-prev"
                  onClick={handlePrev}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
                >
                  السابق
                </button>
              )}

              {/* Skip */}
              {!isSummaryView && (
                <button
                  type="button"
                  id="btn-wizard-skip"
                  onClick={handleSkip}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  تخطي
                </button>
              )}

              {/* Next / Finish */}
              {isSummaryView ? (
                <button
                  type="button"
                  id="btn-wizard-finish-final"
                  onClick={handleFinalFinish}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1.5 space-x-reverse"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>إنهاء الإعداد</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-wizard-next"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1.5 space-x-reverse"
                >
                  <span>{currentStep === 10 ? 'مراجعة الإعداد' : 'التالي'}</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
