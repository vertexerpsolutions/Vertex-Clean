import React, { useState } from 'react';
import { 
  SettingsCategoryId, 
  SettingsCategoryItem 
} from '../../../types';
import { 
  Sliders, 
  Store, 
  ShoppingCart, 
  Package, 
  Landmark, 
  Printer, 
  ShieldAlert, 
  BarChart3, 
  Wrench, 
  X, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Scale,
  Tag
} from 'lucide-react';

interface DedicatedSettingsSectionViewProps {
  category: SettingsCategoryItem;
  onClose: (dirty?: boolean) => void;
  onNavigateSubTab?: (subTab: string) => void;
}

export const DedicatedSettingsSectionView: React.FC<DedicatedSettingsSectionViewProps> = ({
  category,
  onClose,
  onNavigateSubTab
}) => {
  const [isDirty, setIsDirty] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // Field states based on category
  const [activeSubSection, setActiveSubSection] = useState<string>(
    category.subItems && category.subItems.length > 0 ? category.subItems[0].id : 'general'
  );

  const handleSave = () => {
    setIsDirty(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const getCategoryIcon = () => {
    switch (category.id) {
      case 'system_settings': return <Sliders className="w-5 h-5 text-amber-400" />;
      case 'branch_settings': return <Store className="w-5 h-5 text-emerald-400" />;
      case 'sales_purchasing': return <Package className="w-5 h-5 text-amber-400" />;
      case 'warehouses_inventory': return <Package className="w-5 h-5 text-purple-400" />;
      case 'finance_accounts': return <Landmark className="w-5 h-5 text-yellow-400" />;
      case 'printing_invoices': return <Printer className="w-5 h-5 text-blue-400" />;
      case 'security_audit': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'reports_settings': return <BarChart3 className="w-5 h-5 text-teal-400" />;
      case 'system_admin': return <Wrench className="w-5 h-5 text-slate-300" />;
      default: return <Sliders className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div id={`settings-section-${category.id}`} className="h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden select-none" dir="rtl">
      {/* Top Header */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
            {getCategoryIcon()}
          </div>
          <div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <h2 className="text-base sm:text-lg font-black text-slate-100">{category.title}</h2>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                {category.id}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{category.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse">
          {savedNotice && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold animate-fadeIn">
              ✓ تم حفظ الإعدادات بنجاح
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center space-x-1.5 space-x-reverse transition-all shadow-md shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>حفظ التغييرات</span>
          </button>
          <button
            type="button"
            onClick={() => onClose(isDirty)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer flex items-center space-x-1.5 space-x-reverse transition-colors"
          >
            <span>إغلاق الشاشة</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub Menu Tabs if available */}
      {category.subItems && category.subItems.length > 0 && (
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto flex items-center space-x-2 space-x-reverse shrink-0">
          {category.subItems.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setActiveSubSection(sub.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubSection === sub.id
                  ? 'bg-slate-800 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              {sub.title}
            </button>
          ))}
        </div>
      )}

      {/* Settings Form Workspace */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-6 max-w-4xl">
        {/* 4. SYSTEM SETTINGS */}
        {category.id === 'system_settings' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200">البيانات الإقليمية والعملة الأساسية</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">العملة الافتراضية</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200" onChange={() => setIsDirty(true)}>
                    <option>ريال سعودي (SAR)</option>
                    <option>جنيه مصري (EGP)</option>
                    <option>دولار أمريكي (USD)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">التوقيت والمنطقة الزمنية</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200" onChange={() => setIsDirty(true)}>
                    <option>توقيت مكة المكرمة (GMT+3)</option>
                    <option>توقيت القاهرة (GMT+2)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. ITEM DATA (بيانات الأصناف) */}
        {category.id === 'sales_purchasing' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-200">إدارة بيانات الأصناف</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  يمكنك الوصول إلى وظائف إدارة الأصناف المتقدمة من القائمة الفرعية الجانبية أو عبر البطاقات المباشرة:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigateSubTab?.('price_tiers')}
                  className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-amber-500/50 rounded-xl text-right transition-all group flex items-start space-x-3 space-x-reverse cursor-pointer shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 group-hover:text-amber-400 transition-colors">شرائح الأسعار</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      المرجع المركزي لشرائح التسعير (جملة وتجزئة) لربطها بالعملاء والمعاملات.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigateSubTab?.('units_of_measure')}
                  className="p-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-right transition-all group flex items-start space-x-3 space-x-reverse cursor-pointer shadow-sm"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 group-hover:text-emerald-400 transition-colors">وحدات القياس</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      المرجع المركزي لإدارة وتوحيد وحدات القياس لجميع الأصناف والمعاملات.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 9. PRINTING & INVOICES */}
        {category.id === 'printing_invoices' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200">مقاسات الطباعة وتصميم الفواتير</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">النموذج الافتراضي</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200" onChange={() => setIsDirty(true)}>
                    <option>فاتورة ضريبية قياسية A4</option>
                    <option>إيصال نقطة بيع حراري 80mm POS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">رمز الاستجابة السريعة (ZATCA QR)</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200" onChange={() => setIsDirty(true)}>
                    <option>مفعل (المرحلة الثانية الربط والتكامل)</option>
                    <option>المرحلة الأولى المبسطة</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Default standard form fields for other categories */}
        {!['system_settings', 'sales_purchasing', 'printing_invoices'].includes(category.id) && (
          <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-bold text-slate-200">خيارات {category.title}</h3>
              <span className="text-[10px] text-slate-500 font-mono">Module Configuration</span>
            </div>
            <div className="space-y-3">
              <label className="flex items-center space-x-2.5 space-x-reverse cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 text-amber-500" onChange={() => setIsDirty(true)} />
                <span className="text-xs text-slate-300">تفعيل خيارات المزامنة الآلية والتنبيهات المباشرة</span>
              </label>
              <label className="flex items-center space-x-2.5 space-x-reverse cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-slate-700 text-amber-500" onChange={() => setIsDirty(true)} />
                <span className="text-xs text-slate-300">تسجيل جميع العمليات في سجل التدقيق الأمني المتقدم</span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
