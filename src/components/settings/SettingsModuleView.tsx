import React, { useState } from 'react';
import { 
  Sparkles, 
  Users, 
  Layers, 
  Sliders, 
  Store, 
  ShoppingCart, 
  Package, 
  Landmark, 
  Printer, 
  ShieldAlert, 
  BarChart3, 
  Wrench, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search, 
  ArrowLeft,
  X,
  Home,
  Vault,
  UserCheck,
  MapPin,
  FolderTree,
  FileText,
  Tag,
  Scale,
  DollarSign,
  EyeOff
} from 'lucide-react';
import { 
  SettingsCategoryId, 
  SettingsCategoryItem, 
  MasterDataSubTab,
  PlatformSection 
} from '../../types';
import { StartupWizardModal } from './StartupWizardModal';
import { UnsavedChangesDialog } from './UnsavedChangesDialog';
import { MasterDataView } from './screens/MasterDataView';
import { UsersPermissionsView } from './screens/UsersPermissionsView';
import { DedicatedSettingsSectionView } from './screens/DedicatedSettingsSectionView';
import { CustomerMasterView } from '../customers/CustomerMasterView';
import { VendorMasterView } from '../vendors/VendorMasterView';
import { WarehouseMasterView } from '../warehouses/WarehouseMasterView';
import { TreasuryMasterView } from '../treasuries/TreasuryMasterView';
import { SellerMasterView } from '../sellers/SellerMasterView';
import { RegionMasterView } from '../regions/RegionMasterView';
import { ChartOfAccountsView } from '../accounts/ChartOfAccountsView';
import { BranchMasterView } from '../branches/BranchMasterView';
import { UnitOfMeasureView } from './screens/item_data/UnitOfMeasureView';
import { PriceTierView } from './screens/item_data/PriceTierView';
import { setupWizardService } from '../../services/setupWizardService';

interface SettingsModuleViewProps {
  onClose?: () => void;
  onNavigateSection?: (section: PlatformSection) => void;
  initialCategoryId?: SettingsCategoryId;
}

export const SettingsModuleView: React.FC<SettingsModuleViewProps> = ({
  onClose,
  onNavigateSection,
  initialCategoryId
}) => {
  // 1. Selected Main Category (Default: master_data as in mockup screenshot 1)
  const [selectedCategoryId, setSelectedCategoryId] = useState<SettingsCategoryId>(initialCategoryId || 'master_data');
  
  // 2. Active Screen in Center Working Workspace (null = showing settings welcome screen)
  const [activeScreen, setActiveScreen] = useState<{
    categoryId: SettingsCategoryId;
    subTab?: string;
  } | null>(initialCategoryId === 'branch_settings' ? { categoryId: 'branch_settings', subTab: 'branch_list' } : null);

  // Track last explicitly chosen sub-tab per category (null if not chosen or closed)
  const [lastActiveSubTabByCategory, setLastActiveSubTabByCategory] = useState<Partial<Record<SettingsCategoryId, string | null>>>({});

  // 3. Modals & Dialogs State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [unsavedDialog, setUnsavedDialog] = useState<{
    isOpen: boolean;
    pendingAction: (() => void) | null;
  }>({ isOpen: false, pendingAction: null });

  // Has unsaved edits tracking in active view
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  // 12 Main Settings Categories strictly ordered as requested
  const categories: SettingsCategoryItem[] = [
    {
      id: 'wizard',
      order: 1,
      title: 'Startup Wizard',
      subtitle: 'معالج بدء التشغيل',
      iconName: 'Sparkles',
      isWizard: true
    },
    {
      id: 'users_permissions',
      order: 2,
      title: 'المستخدمون والصلاحيات',
      subtitle: 'إدارة المستخدمين والأدوار وصلاحيات الأمان',
      iconName: 'Users',
      subItems: [
        { id: 'users', title: 'سجل المستخدمين', iconName: 'Users' },
        { id: 'roles', title: 'مجموعات الصلاحيات', iconName: 'ShieldCheck' },
        { id: 'sensitive', title: 'الصلاحيات الحساسة', iconName: 'Lock' }
      ]
    },
    {
      id: 'master_data',
      order: 3,
      title: 'البيانات الأساسية',
      subtitle: 'الأصناف، المخازن، العملاء، الموردون، والبائعون',
      iconName: 'Layers',
      subItems: [
        { id: 'item_tree', title: 'شجرة الأصناف', iconName: 'FolderTree' },
        { id: 'customers', title: 'العملاء', iconName: 'Users' },
        { id: 'suppliers', title: 'الموردين', iconName: 'Building2' },
        { id: 'warehouses', title: 'المخازن', iconName: 'Store' },
        { id: 'treasuries', title: 'الخزن', iconName: 'Vault' },
        { id: 'sales_reps', title: 'البائعون', iconName: 'UserCheck' },
        { id: 'regions', title: 'الموقع', iconName: 'MapPin' }
      ]
    },
    {
      id: 'system_settings',
      order: 4,
      title: 'العملة والضرائب',
      subtitle: 'العملة الأساسية، الضرائب، والخيارات العامة',
      iconName: 'Sliders',
      subItems: [
        { id: 'general', title: 'الخيارات العامة', iconName: 'Sliders' },
        { id: 'currencies', title: 'العملات وأسعار الصرف', iconName: 'DollarSign' },
        { id: 'taxes', title: 'الضرائب والرسوم', iconName: 'FileText' }
      ]
    },
    {
      id: 'branch_settings',
      order: 5,
      title: 'إعدادات الفروع',
      subtitle: 'الفروع ومراكز البيع ونقاط التوزيع',
      iconName: 'Store',
      subItems: [
        { id: 'branch_list', title: 'سجل الفروع', iconName: 'Store' },
        { id: 'branch_links', title: 'ربط الفروع بالمخازن', iconName: 'Package' }
      ]
    },
    {
      id: 'sales_purchasing',
      order: 6,
      title: 'بيانات الأصناف',
      subtitle: 'شرائح الأسعار، وحدات القياس، أماكن التخزين، تعديل الأسعار، وإخفاء الأصناف',
      iconName: 'Package',
      subItems: [
        { id: 'price_tiers', title: 'شرائح الأسعار', iconName: 'Tag' },
        { id: 'units_of_measure', title: 'وحدات القياس', iconName: 'Scale' },
        { id: 'storage_locations', title: 'أماكن التخزين', iconName: 'MapPin' },
        { id: 'price_adjustment', title: 'تعديل أسعار البيع', iconName: 'DollarSign' },
        { id: 'item_visibility', title: 'إخفاء/إظهار الأصناف', iconName: 'EyeOff' }
      ]
    },
    {
      id: 'warehouses_inventory',
      order: 7,
      title: 'المخازن والمخزون',
      subtitle: 'سياسات الجرد، حدود إعادة الطلب، والتحويلات',
      iconName: 'Package',
      subItems: [
        { id: 'inventory_policies', title: 'سياسات تقييم المخزون', iconName: 'Package' },
        { id: 'reorder_limits', title: 'حدود الطلب والأمان', iconName: 'AlertCircle' }
      ]
    },
    {
      id: 'finance_accounts',
      order: 8,
      title: 'الحسابات والمالية',
      subtitle: 'دليل الحسابات، السنوات المالية، ومراكز التكلفة',
      iconName: 'Landmark',
      subItems: [
        { id: 'chart_accounts', title: 'دليل الحسابات (شجرة الحسابات)', iconName: 'FolderTree' },
        { id: 'fiscal_years', title: 'السنوات المالية والإقفال', iconName: 'Clock' }
      ]
    },
    {
      id: 'printing_invoices',
      order: 9,
      title: 'الطباعة والفواتير',
      subtitle: 'نماذج الفواتير، مقاسات الورق، والباركود',
      iconName: 'Printer',
      subItems: [
        { id: 'templates', title: 'نماذج الفواتير A4 / 80mm', iconName: 'Printer' },
        { id: 'zatca_qr', title: 'إعدادات ZATCA QR', iconName: 'FileText' }
      ]
    },
    {
      id: 'security_audit',
      order: 10,
      title: 'الأمان وسجل العمليات',
      subtitle: 'سجل الحركات (Audit Trail) وسياسات كلمات المرور',
      iconName: 'ShieldAlert',
      subItems: [
        { id: 'audit_logs', title: 'سجل النشاط والأحداث', iconName: 'ShieldAlert' },
        { id: 'password_policy', title: 'سياسات الجلسات و2FA', iconName: 'Lock' }
      ]
    },
    {
      id: 'reports_settings',
      order: 11,
      title: 'التقارير',
      subtitle: 'تفضيلات التقارير المالية والإدارية والتصدير',
      iconName: 'BarChart3',
      subItems: [
        { id: 'report_presets', title: 'التقارير الافتراضية', iconName: 'BarChart3' },
        { id: 'export_formats', title: 'خيارات التصدير والطباعة', iconName: 'FileText' }
      ]
    },
    {
      id: 'system_admin',
      order: 12,
      title: 'إدارة النظام',
      subtitle: 'النسخ الاحتياطي، صيانة البيانات، والاستيراد',
      iconName: 'Wrench',
      subItems: [
        { id: 'backup_restore', title: 'النسخ الاحتياطي والاستعادة', iconName: 'Database' },
        { id: 'data_maintenance', title: 'صيانة قاعدة البيانات', iconName: 'Wrench' }
      ]
    }
  ];

  const currentCategory = categories.find(c => c.id === selectedCategoryId) || categories[2];

  // Handle Main Category Click
  const handleSelectCategory = (cat: SettingsCategoryItem) => {
    if (cat.isWizard) {
      setIsWizardOpen(true);
      return;
    }

    const doSelect = () => {
      setHasUnsavedEdits(false);
      setSelectedCategoryId(cat.id);
      
      // When selecting branch settings, immediately open the interactive Branch Master screen
      if (cat.id === 'branch_settings') {
        setActiveScreen({
          categoryId: 'branch_settings',
          subTab: 'branch_list'
        });
        return;
      }

      // If user had previously explicitly opened a sub-screen in this category, restore it.
      // Otherwise, show general welcome screen. NEVER auto-open 'item_tree' or any other sub-tab.
      const rememberedSubTab = lastActiveSubTabByCategory[cat.id];
      if (rememberedSubTab) {
        setActiveScreen({
          categoryId: cat.id,
          subTab: rememberedSubTab
        });
      } else {
        setActiveScreen(null);
      }
    };

    if (hasUnsavedEdits) {
      setUnsavedDialog({
        isOpen: true,
        pendingAction: doSelect
      });
    } else {
      doSelect();
    }
  };

  // Handle Sub-Menu item Click (Opens inside main workspace)
  const handleOpenSubScreen = (subId: string) => {
    const doOpen = () => {
      setHasUnsavedEdits(false);
      setLastActiveSubTabByCategory(prev => ({
        ...prev,
        [selectedCategoryId]: subId
      }));

      if (selectedCategoryId === 'branch_settings' || subId === 'branch_list') {
        setActiveScreen({ categoryId: 'branch_settings', subTab: subId });
        return;
      }

      if (selectedCategoryId === 'master_data') {
        setActiveScreen({
          categoryId: 'master_data',
          subTab: subId as MasterDataSubTab
        });
      } else if (selectedCategoryId === 'users_permissions') {
        setActiveScreen({
          categoryId: 'users_permissions',
          subTab: subId
        });
      } else {
        setActiveScreen({
          categoryId: selectedCategoryId,
          subTab: subId
        });
      }
    };

    if (hasUnsavedEdits) {
      setUnsavedDialog({
        isOpen: true,
        pendingAction: doOpen
      });
    } else {
      doOpen();
    }
  };

  // Handle Closing Active Screen (Returns workspace to welcome overview)
  const handleCloseActiveScreen = (isDirty?: boolean) => {
    const doClose = () => {
      setHasUnsavedEdits(false);
      if (activeScreen) {
        setLastActiveSubTabByCategory(prev => ({
          ...prev,
          [activeScreen.categoryId]: null
        }));
      }
      setActiveScreen(null);
    };

    if (isDirty || hasUnsavedEdits) {
      setUnsavedDialog({
        isOpen: true,
        pendingAction: doClose
      });
    } else {
      doClose();
    }
  };

  const getSubItemIcon = (iconName: string) => {
    switch (iconName) {
      case 'Home': return <Home className="w-4 h-4 text-blue-400" />;
      case 'Building2': return <Building2 className="w-4 h-4 text-indigo-400" />;
      case 'Package': return <Package className="w-4 h-4 text-emerald-400" />;
      case 'Store': return <Store className="w-4 h-4 text-amber-400" />;
      case 'Vault': return <Vault className="w-4 h-4 text-yellow-400" />;
      case 'UserCheck': return <UserCheck className="w-4 h-4 text-teal-400" />;
      case 'MapPin': return <MapPin className="w-4 h-4 text-rose-400" />;
      case 'Users': return <Users className="w-4 h-4 text-purple-400" />;
      case 'FolderTree': return <FolderTree className="w-4 h-4 text-amber-400" />;
      case 'Tag': return <Tag className="w-4 h-4 text-amber-400" />;
      case 'Scale': return <Scale className="w-4 h-4 text-emerald-400" />;
      case 'DollarSign': return <DollarSign className="w-4 h-4 text-blue-400" />;
      case 'EyeOff': return <EyeOff className="w-4 h-4 text-purple-400" />;
      default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  // Dynamic Workspace Content Renderer
  const renderCenterContent = () => {
    if (!activeScreen) {
      return (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 md:p-8 overflow-y-auto text-center relative custom-scrollbar">
          <div className="max-w-md mx-auto space-y-6 animate-fadeIn">
            {/* Illustration Icon */}
            <div className="w-24 h-24 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto shadow-2xl shadow-blue-500/10">
              <Layers className="w-12 h-12 stroke-[1.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                مرحباً بك في إعدادات VERTEX
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                يمكنك إدارة جميع إعدادات النظام من القوائم الرئيسية. اختر القسم المطلوب لتعديل بطاقات الأصناف، المخازن، الحسابات، وصلاحيات المستخدمين.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (activeScreen.categoryId === 'master_data') {
      if (activeScreen.subTab === 'warehouses') {
        return (
          <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
            <WarehouseMasterView
              onClose={() => handleCloseActiveScreen()}
              onNavigateSection={onNavigateSection}
            />
          </div>
        );
      }

      if (activeScreen.subTab === 'customers') {
        return (
          <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
            <CustomerMasterView
              onClose={() => handleCloseActiveScreen()}
              onNavigateSection={onNavigateSection}
            />
          </div>
        );
      }

      if (activeScreen.subTab === 'suppliers') {
        return (
          <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
            <VendorMasterView
              onClose={() => handleCloseActiveScreen()}
              onNavigateSection={onNavigateSection}
            />
          </div>
        );
      }

      if (activeScreen.subTab === 'treasuries') {
        return (
          <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
            <TreasuryMasterView
              onClose={() => handleCloseActiveScreen()}
              onNavigateSection={onNavigateSection}
            />
          </div>
        );
      }

      if (activeScreen.subTab === 'sales_reps') {
        return (
          <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
            <SellerMasterView
              onClose={() => handleCloseActiveScreen()}
              onNavigateSection={onNavigateSection}
            />
          </div>
        );
      }

      if (activeScreen.subTab === 'regions') {
        return (
          <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
            <RegionMasterView
              onClose={() => handleCloseActiveScreen()}
              onNavigateSection={onNavigateSection}
            />
          </div>
        );
      }

      return (
        <div className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col">
          <MasterDataView
            initialSubTab={(activeScreen.subTab as MasterDataSubTab) || 'item_tree'}
            onClose={(dirty) => handleCloseActiveScreen(dirty)}
            onNavigateSubTab={(subTab) => {
              setActiveScreen({
                categoryId: 'master_data',
                subTab
              });
              setLastActiveSubTabByCategory(prev => ({
                ...prev,
                master_data: subTab
              }));
            }}
          />
        </div>
      );
    }

    if (activeScreen.categoryId === 'users_permissions') {
      return (
        <div className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col">
          <UsersPermissionsView
            onClose={(dirty) => handleCloseActiveScreen(dirty)}
          />
        </div>
      );
    }

    if (activeScreen.categoryId === 'finance_accounts' && (!activeScreen.subTab || activeScreen.subTab === 'chart_accounts')) {
      return (
        <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-5">
          <ChartOfAccountsView
            onClose={() => handleCloseActiveScreen()}
            onNavigateSection={onNavigateSection}
          />
        </div>
      );
    }

    if (activeScreen.categoryId === 'branch_settings') {
      return (
        <div className="w-full h-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4">
          <BranchMasterView
            onClose={() => handleCloseActiveScreen()}
            onNavigateSection={onNavigateSection}
          />
        </div>
      );
    }

    if (activeScreen.categoryId === 'sales_purchasing' && activeScreen.subTab === 'price_tiers') {
      return (
        <div className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col p-3 sm:p-4">
          <PriceTierView
            onClose={() => handleCloseActiveScreen()}
          />
        </div>
      );
    }

    if (activeScreen.categoryId === 'sales_purchasing' && activeScreen.subTab === 'units_of_measure') {
      return (
        <div className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col p-3 sm:p-4">
          <UnitOfMeasureView
            onClose={() => handleCloseActiveScreen()}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full flex-1 min-h-0 overflow-hidden flex flex-col">
        <DedicatedSettingsSectionView
          category={currentCategory}
          onClose={(dirty) => handleCloseActiveScreen(dirty)}
          onNavigateSubTab={(subTab) => handleOpenSubScreen(subTab)}
        />
      </div>
    );
  };

  // MAIN SETTINGS DASHBOARD - FIXED HEADERS & FLUID WORKSPACE
  return (
    <div id="settings-main-container" className="h-[calc(100vh-6rem)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden select-none" dir="rtl">
      {/* Top Header Bar */}
      <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse text-amber-400 font-bold text-sm">
            <span className="text-base">⚙️</span>
            <span className="text-slate-100 font-black text-base">الإعدادات</span>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            VERTEX Settings
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق قسم الإعدادات"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Settings Body (Main Sidebar + SubMenu + Center Working Workspace) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* 1. Main Categories Sidebar (Red Zone - Compact & Content-Fit) */}
        <div className="w-52 bg-slate-950/90 border-l border-slate-800 flex flex-col h-full overflow-y-auto custom-scrollbar shrink-0 p-2 space-y-1.5">
          <div className="px-2 py-1.5 text-xs font-bold text-slate-400 border-b border-slate-800/80 mb-1">
            القائمة الرئيسية للإعدادات
          </div>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            const isWizard = cat.isWizard;

            return (
              <button
                key={cat.id}
                type="button"
                id={`settings-menu-item-${cat.id}`}
                onClick={() => handleSelectCategory(cat)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border text-right group ${
                  isWizard
                    ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-amber-500/40 text-amber-300 hover:bg-amber-500/20 shadow-sm'
                    : isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20 font-black'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-slate-100 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                  {isWizard ? (
                    <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <span className="text-sm shrink-0">
                      {cat.order === 2 && '👥'}
                      {cat.order === 3 && '🗄️'}
                      {cat.order === 4 && '⚙️'}
                      {cat.order === 5 && '🏢'}
                      {cat.order === 6 && '🛒'}
                      {cat.order === 7 && '📦'}
                      {cat.order === 8 && '💳'}
                      {cat.order === 9 && '🖨️'}
                      {cat.order === 10 && '🛡️'}
                      {cat.order === 11 && '📊'}
                      {cat.order === 12 && '🔧'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="whitespace-nowrap">{cat.title}</div>
                    {isWizard && (
                      <div className="text-[10px] font-normal text-amber-400/80 whitespace-nowrap">معالج بدء التشغيل</div>
                    )}
                  </div>
                </div>

                <ChevronLeft className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isSelected ? 'translate-x-[-2px] text-white' : 'text-slate-600 group-hover:text-slate-400'
                }`} />
              </button>
            );
          })}
        </div>

        {/* 2. Secondary Sub-Menu Panel (Yellow Zone - Fitted to Content) */}
        {currentCategory && currentCategory.id !== 'branch_settings' && currentCategory.subItems && currentCategory.subItems.length > 0 && (
          <div className="w-48 bg-slate-900/90 border-l border-slate-800 flex flex-col h-full overflow-y-auto custom-scrollbar shrink-0 p-2.5 space-y-2">
            <div className="px-1.5 pb-2 border-b border-slate-800">
              <h3 className="text-xs font-black text-slate-100 whitespace-nowrap">{currentCategory.title}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">اختر القسم لعرضه في مساحة العمل</p>
            </div>

            <div className="space-y-1.5">
              {currentCategory.subItems.map((sub) => {
                const isSubActive = activeScreen?.categoryId === selectedCategoryId && activeScreen?.subTab === sub.id;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    id={`settings-sub-item-${sub.id}`}
                    onClick={() => handleOpenSubScreen(sub.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer group text-right ${
                      isSubActive
                        ? 'bg-blue-600/25 border-blue-500 text-blue-200 shadow-sm'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-850 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2 space-x-reverse min-w-0">
                      {getSubItemIcon(sub.iconName)}
                      <span className="whitespace-nowrap">{sub.title}</span>
                    </div>
                    <ChevronLeft className={`w-3.5 h-3.5 transition-all ${
                      isSubActive ? 'text-blue-400 translate-x-[-2px]' : 'text-slate-600 group-hover:text-blue-400 group-hover:translate-x-[-2px]'
                    } shrink-0 mr-1`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Center Working Workspace (Blue Zone - Responsive Workspace) */}
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-slate-900 relative">
          {renderCenterContent()}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="px-6 py-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 shrink-0 font-medium">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>المستخدم: <strong className="text-slate-200">مدير النظام</strong></span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center space-x-1.5 space-x-reverse">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>الفرع: <strong className="text-slate-200">الفرع الرئيسي</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 space-x-reverse font-mono text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>التاريخ: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
        </div>
      </div>

      {/* Startup Wizard Modal */}
      <StartupWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onFinish={() => {
          setIsWizardOpen(false);
        }}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <UnsavedChangesDialog
        isOpen={unsavedDialog.isOpen}
        onStay={() => setUnsavedDialog({ isOpen: false, pendingAction: null })}
        onDiscard={() => {
          const action = unsavedDialog.pendingAction;
          setUnsavedDialog({ isOpen: false, pendingAction: null });
          if (action) action();
        }}
      />
    </div>
  );
};
