import React from 'react';
import { 
  Home,
  Sparkles, 
  Layers, 
  Cpu, 
  Terminal, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  Receipt,
  CreditCard,
  Package,
  Users,
  Building2,
  Vault,
  Warehouse as WarehouseIcon,
  Target,
  Factory,
  Truck,
  Briefcase,
  ShoppingBag,
  ShieldCheck,
  Landmark,
  Car,
  BarChart3,
  Server,
  Monitor,
  Cloud,
  ShieldAlert,
  RefreshCw,
  Sliders,
  HardDrive,
  Settings,
  Calculator,
  PanelRightClose
} from 'lucide-react';
import { INITIAL_GOLD_FEATURES, APPROVED_ERP_MODULES, SYSTEM_ENGINES } from '../data/mockData';
import { PlatformSection } from '../types';

interface SidebarProps {
  activeSection: PlatformSection;
  activeFeatureId: string;
  onSelectSection: (section: PlatformSection) => void;
  onSelectFeature: (featureId: string) => void;
  isTopBarHidden?: boolean;
  onHideSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  activeFeatureId,
  onSelectSection,
  onSelectFeature,
  isTopBarHidden = false,
  onHideSidebar
}) => {
  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-4 h-4" />;
      case 'Receipt': return <Receipt className="w-4 h-4" />;
      case 'CreditCard': return <CreditCard className="w-4 h-4" />;
      case 'Package': return <Package className="w-4 h-4" />;
      case 'Users': return <Users className="w-4 h-4" />;
      case 'Building2': return <Building2 className="w-4 h-4" />;
      case 'Target': return <Target className="w-4 h-4" />;
      case 'Factory': return <Factory className="w-4 h-4" />;
      case 'Truck': return <Truck className="w-4 h-4" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4" />;
      case 'ShoppingBag': return <ShoppingBag className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'Landmark': return <Landmark className="w-4 h-4" />;
      case 'Car': return <Car className="w-4 h-4" />;
      case 'BarChart3': return <BarChart3 className="w-4 h-4" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  return (
    <aside className={`w-64 sm:w-72 bg-slate-900/95 border-r border-slate-800 flex flex-col ${
      isTopBarHidden ? 'h-screen sticky top-0' : 'h-[calc(100vh-4rem)] sticky top-16'
    } overflow-y-auto shrink-0 select-none transition-all duration-300`}>
      {/* Top Main Navigation Tabs */}
      <div className="p-3 border-b border-slate-800 space-y-2 bg-slate-950/40">
        {onHideSidebar && (
          <div className="flex items-center justify-between pb-1 text-slate-400">
            <span className="text-[11px] font-bold text-slate-400">القائمة الجانبية</span>
            <button
              type="button"
              onClick={onHideSidebar}
              title="إخفاء القائمة الجانبية (Ctrl+B)"
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-transparent hover:border-slate-700/80 transition-all flex items-center space-x-1 space-x-reverse text-[11px] cursor-pointer"
            >
              <span>إخفاء</span>
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Interface Hub Entry */}
        <button
          onClick={() => onSelectSection('main')}
          className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
            activeSection === 'main'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25 font-extrabold'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-300'
          }`}
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <Home className={`w-4 h-4 shrink-0 ${activeSection === 'main' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>🏠 الواجهة الرئيسية</span>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            activeSection === 'main'
              ? 'bg-slate-950/20 text-slate-950 border-slate-950/30 font-bold'
              : 'bg-slate-950 text-amber-400 border-amber-500/20'
          }`}>
            Main
          </span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => {
              onSelectSection('gold');
              onSelectFeature('VGF-01');
            }}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'gold'
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>الميزات الذهبية</span>
          </button>

          <button
            onClick={() => onSelectSection('modules')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'modules'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>أنظمة ERP الـ15</span>
          </button>

          <button
            onClick={() => onSelectSection('engines')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'engines'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>المحركات (15)</span>
          </button>

          <button
            onClick={() => onSelectSection('devtools')}
            className={`flex items-center justify-center space-x-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeSection === 'devtools'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>أدوات المطور</span>
          </button>
        </div>

        {/* Dedicated Master Navigation Entries (Customers, Vendors, Treasuries & Warehouses) */}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <button
            onClick={() => {
              onSelectSection('customers');
            }}
            className={`flex items-center justify-center space-x-1.5 space-x-reverse py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
              activeSection === 'customers' || activeFeatureId === 'MOD-AR' || activeFeatureId === 'MOD-CUST'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-black'
                : 'bg-slate-900/90 text-amber-300 border-amber-500/30 hover:bg-slate-800 hover:border-amber-500/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">العملاء</span>
          </button>

          <button
            onClick={() => {
              onSelectSection('vendors');
            }}
            className={`flex items-center justify-center space-x-1.5 space-x-reverse py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
              activeSection === 'vendors' || activeFeatureId === 'MOD-AP' || activeFeatureId === 'MOD-VEND'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 font-black'
                : 'bg-slate-900/90 text-cyan-300 border-cyan-500/30 hover:bg-slate-800 hover:border-cyan-500/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">الموردين</span>
          </button>

          <button
            onClick={() => {
              onSelectSection('treasuries');
            }}
            className={`flex items-center justify-center space-x-1.5 space-x-reverse py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
              activeSection === 'treasuries'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 font-black'
                : 'bg-slate-900/90 text-emerald-300 border-emerald-500/30 hover:bg-slate-800 hover:border-emerald-500/60'
            }`}
          >
            <Vault className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">الخزائن</span>
          </button>

          <button
            onClick={() => {
              onSelectSection('warehouses');
            }}
            className={`flex items-center justify-center space-x-1.5 space-x-reverse py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
              activeSection === 'warehouses'
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20 font-black'
                : 'bg-slate-900/90 text-amber-200 border-amber-500/30 hover:bg-slate-800 hover:border-amber-500/60'
            }`}
          >
            <WarehouseIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">المخازن</span>
          </button>

          <button
            onClick={() => {
              onSelectSection('accounts');
            }}
            className={`col-span-2 flex items-center justify-center space-x-1.5 space-x-reverse py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
              activeSection === 'accounts'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/20 font-black'
                : 'bg-slate-900/90 text-blue-300 border-blue-500/30 hover:bg-slate-800 hover:border-blue-500/60'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">الحسابات (Accounts)</span>
          </button>
        </div>

        {/* Dedicated Settings Button */}
        <button
          onClick={() => onSelectSection('settings')}
          className={`w-full flex items-center justify-between py-2 px-2.5 rounded-xl text-xs font-bold transition-all border mt-1.5 ${
            activeSection === 'settings'
              ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20 font-black'
              : 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-850 hover:border-blue-500/50 hover:text-blue-300'
          }`}
        >
          <div className="flex items-center space-x-2 space-x-reverse">
            <Settings className={`w-3.5 h-3.5 shrink-0 ${activeSection === 'settings' ? 'text-white' : 'text-blue-400'}`} />
            <span>⚙️ إعدادات النظام (Settings)</span>
          </div>
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
            activeSection === 'settings'
              ? 'bg-white/20 text-white border-white/30 font-bold'
              : 'bg-slate-950 text-blue-400 border-blue-500/20'
          }`}>
            12 Sections
          </span>
        </button>

        <div className="grid grid-cols-5 gap-1 font-mono">
          <button
            onClick={() => onSelectSection('deployment')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'deployment'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <Server className="w-2.5 h-2.5" />
            <span>VDP-01</span>
          </button>

          <button
            onClick={() => onSelectSection('desktop_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'desktop_vdp'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20'
            }`}
          >
            <Monitor className="w-2.5 h-2.5" />
            <span>VDP-02</span>
          </button>

          <button
            onClick={() => onSelectSection('cloud_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'cloud_vdp'
                ? 'bg-blue-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-blue-500/10 text-blue-300 border border-blue-500/30 hover:bg-blue-500/20'
            }`}
          >
            <Cloud className="w-2.5 h-2.5" />
            <span>VDP-03</span>
          </button>

          <button
            onClick={() => onSelectSection('hybrid_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'hybrid_vdp'
                ? 'bg-purple-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20'
            }`}
          >
            <Layers className="w-2.5 h-2.5" />
            <span>VDP-04</span>
          </button>

          <button
            onClick={() => onSelectSection('installer_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'installer_vdp'
                ? 'bg-amber-400 text-slate-950 font-extrabold shadow-md'
                : 'bg-amber-400/10 text-amber-300 border border-amber-400/30 hover:bg-amber-400/20'
            }`}
          >
            <Package className="w-2.5 h-2.5" />
            <span>VDP-05</span>
          </button>

          <button
            onClick={() => onSelectSection('portable_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'portable_vdp'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <HardDrive className="w-2.5 h-2.5" />
            <span>VDP-06</span>
          </button>

          <button
            onClick={() => onSelectSection('backup_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'backup_vdp'
                ? 'bg-rose-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            <span>VDP-07</span>
          </button>

          <button
            onClick={() => onSelectSection('update_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'update_vdp'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>VDP-08</span>
          </button>

          <button
            onClick={() => onSelectSection('config_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'config_vdp'
                ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
            }`}
          >
            <Sliders className="w-2.5 h-2.5" />
            <span>VDP-09</span>
          </button>

          <button
            onClick={() => onSelectSection('license_vdp')}
            className={`flex items-center justify-center space-x-1 py-1.5 px-0.5 rounded-lg text-[9px] font-bold transition-all ${
              activeSection === 'license_vdp'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <ShieldCheck className="w-2.5 h-2.5" />
            <span>VDP-10</span>
          </button>
        </div>
      </div>

      {/* Sub-Items Listing */}
      <div className="p-3 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
        {/* GOLD FEATURES LIST */}
        {activeSection === 'gold' && (
          <div className="space-y-1">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
              <span>الميزات الذهبية للمؤسسات</span>
              <span className="text-slate-500 font-mono">10 مواصفات</span>
            </div>

            {INITIAL_GOLD_FEATURES.map(feat => {
              const isSelected = activeFeatureId === feat.id;
              return (
                <button
                  key={feat.id}
                  onClick={() => onSelectFeature(feat.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200 shadow-md shadow-amber-950/40'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate pr-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                      feat.id === 'VGF-01' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {feat.code}
                    </span>
                    <span className="truncate">{feat.name}</span>
                  </div>
                  {feat.status === 'completed' ? (
                    <span className="shrink-0 text-emerald-400 flex items-center space-x-1 text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="shrink-0 text-slate-500 text-[10px] flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span className="hidden sm:inline">مخطط</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* CORE 15 ERP MODULES LIST */}
        {activeSection === 'modules' && (
          <div className="space-y-1">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
              <span>أنظمة ERP الـ15 الأساسية</span>
              <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                معتمد 100%
              </span>
            </div>

            {/* Direct Entry for العملاء */}
            <button
              onClick={() => onSelectFeature('MOD-AR')}
              className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-between group ${
                activeFeatureId === 'MOD-AR' || activeFeatureId === 'MOD-CUST'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200 shadow-md shadow-amber-950/30'
                  : 'bg-slate-900/80 text-amber-300 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30'
              }`}
            >
              <div className="flex items-center space-x-2.5 space-x-reverse truncate pr-2">
                <Users className="w-4 h-4 text-amber-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate font-bold">العملاء (سجل العملاء الموحد)</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                MOD-AR
              </span>
            </button>

            {APPROVED_ERP_MODULES.map(mod => {
              const isSelected = activeFeatureId === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => onSelectFeature(mod.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-200 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate pr-2">
                    <div className="text-indigo-400 group-hover:scale-110 transition-transform">
                      {getModuleIcon(mod.iconName)}
                    </div>
                    <span className="truncate">{mod.name}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-500 ${isSelected ? 'text-indigo-400 translate-x-0.5' : ''}`} />
                </button>
              );
            })}
          </div>
        )}

        {/* SYSTEM ENGINES LIST */}
        {activeSection === 'engines' && (
          <div className="space-y-1">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
              <span>15 محرك منصة مشترك</span>
              <span className="text-blue-400 font-mono">أقل من 10ms</span>
            </div>

            {SYSTEM_ENGINES.map(eng => {
              const isSelected = activeFeatureId === eng.id;
              return (
                <button
                  key={eng.id}
                  onClick={() => onSelectFeature(eng.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/40 text-blue-200 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate pr-2">
                    <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="truncate">{eng.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                    {eng.latencyMs}ms
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* DEVELOPER TOOLS LIST */}
        {activeSection === 'devtools' && (
          <div className="space-y-1">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
              <span>أدوات المطور</span>
              <span className="text-emerald-400 font-mono">مستوى الدعم</span>
            </div>

            {[
              { id: 'DEV-DIAG', name: 'تشخيص النظام' },
              { id: 'DEV-PERF', name: 'مراقب الأداء' },
              { id: 'DEV-DB', name: 'فاحص صحة قاعدة البيانات' },
              { id: 'DEV-LOGS', name: 'عارض السجلات ووحدة التحكم' },
              { id: 'DEV-ENV', name: 'فاحص بيئة التشغيل' },
              { id: 'DEV-API', name: 'بيئة اختبار API' },
              { id: 'DEV-MAINT', name: 'أدوات الصيانة' }
            ].map(tool => {
              const isSelected = activeFeatureId === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelectFeature(tool.id)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 shadow-md'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">{tool.name}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer info box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>الميزات الذهبية النشطة:</span>
          <span className="text-emerald-400 font-mono font-bold">VGF-01 إلى 10 (الكل)</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          جميع الميزات الذهبية الـ10 نشطة: الإعداد، الترحيل، الدمج، اليوم التجاري، النسخ الاحتياطي، المبيعات، الرؤية، إعادة الطلب، سجل المستندات والخط الزمني للتدقيق.
        </p>
      </div>
    </aside>
  );
};
