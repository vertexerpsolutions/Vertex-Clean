import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  Terminal, 
  History, 
  CheckCircle2, 
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  PanelTopClose
} from 'lucide-react';
import { setupWizardService } from '../services/setupWizardService';

interface HeaderProps {
  onOpenNotifications?: () => void;
  onOpenAuditLogs: () => void;
  onOpenDevTools: () => void;
  onOpenSearch: () => void;
  onSelectFeature: (featureId: string) => void;
  isSidebarHidden?: boolean;
  onToggleSidebar?: () => void;
  onHideTopBar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAuditLogs,
  onOpenDevTools,
  onOpenSearch,
  onSelectFeature,
  isSidebarHidden = false,
  onToggleSidebar,
  onHideTopBar
}) => {
  const wizardConfig = setupWizardService.getConfig();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 text-slate-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-md">
      {/* Left: Branding & Status */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div 
          onClick={() => onSelectFeature('VGF-01')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                VERTEX
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                PLATFORM
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              نظام تشغيل المؤسسات • الإصدار المؤسسي
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions & Tools */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* VGF-01 Status Indicator */}
        <button
          onClick={() => onSelectFeature('VGF-01')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
            wizardConfig.isCompleted
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 animate-pulse'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>VGF-01: {wizardConfig.isCompleted ? 'مفعل' : 'يحتاج إعداد'}</span>
        </button>

        {/* Quick Search */}
        <button 
          onClick={onOpenSearch}
          className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-400 transition-colors"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>البحث الموحد (محرك VSE)...</span>
          <kbd className="text-[10px] font-mono bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Audit Logs */}
        <button
          onClick={onOpenAuditLogs}
          title="محرك الخط الزمني للتدقيق"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors relative"
        >
          <History className="w-4 h-4 text-slate-300" />
        </button>

        {/* Developer Console Toggle */}
        <button
          onClick={onOpenDevTools}
          title="وحدة أدوات المطور"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors cursor-pointer"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">وحدة المطور</span>
        </button>

        {/* Toggle Sidebar Button */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarHidden ? 'إظهار القائمة الجانبية (Ctrl+B)' : 'إخفاء القائمة الجانبية (Ctrl+B)'}
            className={`p-2 rounded-lg border text-xs font-medium transition-all flex items-center space-x-1.5 space-x-reverse cursor-pointer ${
              isSidebarHidden
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border-slate-700/80'
            }`}
          >
            {isSidebarHidden ? (
              <PanelRightOpen className="w-4 h-4 text-amber-400" />
            ) : (
              <PanelRightClose className="w-4 h-4" />
            )}
            <span className="hidden xl:inline">{isSidebarHidden ? 'إظهار القائمة' : 'إخفاء القائمة'}</span>
          </button>
        )}

        {/* Hide Top Bar Button */}
        {onHideTopBar && (
          <button
            type="button"
            onClick={onHideTopBar}
            title="إخفاء الشريط العلوي وتوسيع مساحة العمل (Alt+T)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700/80 transition-colors flex items-center space-x-1.5 space-x-reverse cursor-pointer"
          >
            <PanelTopClose className="w-4 h-4" />
            <span className="hidden xl:inline">إخفاء الشريط</span>
          </button>
        )}

        {/* Active License Tag */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>ENTERPRISE-PROD</span>
        </div>
      </div>
    </header>
  );
};
