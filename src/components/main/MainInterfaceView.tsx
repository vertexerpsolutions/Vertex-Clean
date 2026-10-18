import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  ShoppingBag, 
  Box, 
  BarChart2, 
  Settings,
  Terminal,
  ShieldAlert,
  Database,
  KeyRound,
  Wrench,
  X,
  Layers,
  FileCode2,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Server,
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  AlertCircle,
  Bell,
  Sun,
  Moon,
  Building2
} from 'lucide-react';
import { PlatformSection, NotificationItem } from '../../types';
import { purgeOperationalData } from '../../services/systemResetService';
import { notificationEngine } from '../../services/notificationEngine';
import { themeService, ThemeMode } from '../../services/themeService';
import { setupWizardService } from '../../services/setupWizardService';
import { branchService } from '../../services/branchService';

interface MainInterfaceViewProps {
  onSelectSection: (section: PlatformSection) => void;
  onSelectFeature: (featureId: string) => void;
  onOpenNotifications?: () => void;
}

interface MainNavCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  hoverBorder: string;
  action: () => void;
}

export const MainInterfaceView: React.FC<MainInterfaceViewProps> = ({
  onSelectSection,
  onSelectFeature,
  onOpenNotifications
}) => {
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Relocated Header Controls: Unread Notifications Count, Theme, & Company Identity
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState<ThemeMode>(() => themeService.getTheme());
  const [activeBranch, setActiveBranch] = useState(() => branchService.getCurrentBranch());

  const rawCompanyName = setupWizardService.getConfig()?.companyName;
  const companyName = (rawCompanyName && rawCompanyName !== 'Vertex Global Enterprises Corp' && rawCompanyName.trim() !== '')
    ? rawCompanyName
    : '';

  useEffect(() => {
    const unsubNotify = notificationEngine.subscribe((items: NotificationItem[]) => {
      setUnreadCount(items.filter(i => !i.read).length);
    });
    const unsubTheme = themeService.subscribe((currentTheme) => {
      setTheme(currentTheme);
    });
    const unsubBranch = branchService.subscribe(() => {
      setActiveBranch(branchService.getCurrentBranch());
    });
    return () => {
      unsubNotify();
      unsubTheme();
      unsubBranch();
    };
  }, []);

  const currentBranch = activeBranch;
  const currentBranchId = activeBranch?.id || 'BR-01';

  const branchNameToDisplay = (activeBranch?.showOnMainScreen && activeBranch?.name && activeBranch.name.trim() !== '')
    ? activeBranch.name.trim()
    : null;

  // SQL Server Engine Config State
  const [sqlConfig, setSqlConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('VERTEX_SQL_SERVER_CONFIG');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          server: parsed.server || '.\\VERTEX',
          database: parsed.database || 'VERTEX_ERP_DB',
          username: parsed.username || 'sa',
          password: parsed.password || ''
        };
      }
    } catch {}
    return {
      server: '.\\VERTEX',
      database: 'VERTEX_ERP_DB',
      username: 'sa',
      password: ''
    };
  });
  const [showSqlPassword, setShowSqlPassword] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const desktop = (typeof window !== 'undefined' ? (window as any).vertexDesktop : null);
    if (desktop?.isDesktop && desktop?.sqlServer) {
      if (desktop.sqlServer.getConfig) {
        desktop.sqlServer.getConfig(false).then((cfg: any) => {
          if (cfg) {
            setSqlConfig((prev: any) => ({
              server: cfg.server || prev.server || '.\\VERTEX',
              database: cfg.database || prev.database || 'VERTEX_ERP_DB',
              username: cfg.username || prev.username || 'sa',
              password: cfg.password || prev.password || ''
            }));
          }
        }).catch(() => {});
      }
      if (desktop.sqlServer.getStatus) {
        desktop.sqlServer.getStatus().then((st: any) => {
          if (st && st.status === 'connected') {
            setIsConnected(true);
            setTestResult({
              status: 'success',
              message: 'Connected'
            });
          }
        }).catch(() => {});
      }
    }
  }, []);

  const handleTestSqlConnection = async () => {
    let effectiveServer = (sqlConfig.server || '').trim() || '.\\VERTEX';
    let effectiveDb = (sqlConfig.database || '').trim() || 'VERTEX_ERP_DB';
    let effectiveUser = (sqlConfig.username || '').trim() || 'sa';
    let effectivePass = sqlConfig.password || '';

    // If password is not typed in field, retrieve saved password from storage
    if (!effectivePass) {
      try {
        const saved = localStorage.getItem('VERTEX_SQL_SERVER_CONFIG');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.password) effectivePass = parsed.password;
        }
      } catch {}
    }

    setIsTestingConnection(true);
    setTestResult(null);

    const desktop = (typeof window !== 'undefined' ? (window as any).vertexDesktop : null);
    if (desktop?.isDesktop && desktop?.sqlServer?.testConnection) {
      try {
        const res = await desktop.sqlServer.testConnection({
          server: effectiveServer,
          database: effectiveDb,
          username: effectiveUser,
          password: effectivePass,
          authentication: 'sql'
        });

        setIsTestingConnection(false);

        if (res.success || res.status === 'Connected') {
          setIsConnected(true);
          setTestResult({
            status: 'success',
            message: 'Connected'
          });
        } else {
          setIsConnected(false);
          setTestResult({
            status: 'error',
            message: res.error || 'فشل الاتصال بـ SQL Server'
          });
        }
      } catch (err: any) {
        setIsTestingConnection(false);
        setIsConnected(false);
        setTestResult({
          status: 'error',
          message: err?.message || String(err)
        });
      }
    } else {
      // In browser preview (outside Electron runtime)
      setIsTestingConnection(false);
      setTestResult({
        status: 'error',
        message: 'اختبار الاتصال الفعلي بـ .\\VERTEX متاح داخل VERTEX Desktop فقط (شغّل START_VERTEX.bat لتنفيذ اتصال TDS الحقيقي).'
      });
    }
  };

  const handleSaveSqlConfig = () => {
    try {
      localStorage.setItem('VERTEX_SQL_SERVER_CONFIG', JSON.stringify(sqlConfig));
      const desktop = (typeof window !== 'undefined' ? (window as any).vertexDesktop : null);
      if (desktop?.isDesktop && desktop?.sqlServer?.saveConfig) {
        desktop.sqlServer.saveConfig(sqlConfig).catch(() => {});
      }
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch {}
  };

  const handleExecutePurge = () => {
    setIsResetting(true);
    setResetError(null);
    try {
      const result = purgeOperationalData(currentBranchId);
      if (result.blocked) {
        setIsResetting(false);
        setResetError(result.reason || 'لا يمكن تنفيذ التهيئة لوجود تحويلات مخزنية معلقة بين هذا الفرع وفرع آخر.');
        return;
      }
      if (!result.success) {
        setIsResetting(false);
        setResetError(result.reason || 'حدث خطأ أثناء تنفيذ تهيئة بيانات الفرع.');
        return;
      }
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1200);
    } catch (err: any) {
      console.error('Failed to reset operational data', err);
      setIsResetting(false);
      setResetError('حدث خطأ غير متوقع أثناء تنفيذ عملية التهيئة.');
    }
  };

  // Safe/Vault icon matching reference image for Treasury & Accounts
  const SafeVaultIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth={2.4} 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="4" />
      <circle cx="12" cy="12" r="3" />
      <path d="M15 12h3" />
    </svg>
  );

  // 6 Symmetrical core navigation cards (3x2 on Desktop)
  const cards: MainNavCard[] = [
    // Row 1
    {
      id: 'sales',
      title: 'المبيعات',
      subtitle: 'إدارة عمليات البيع والمرتجعات والتقارير',
      icon: <ShoppingCart className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform duration-200" strokeWidth={2.4} />,
      iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      action: () => {
        onSelectSection('gold');
        onSelectFeature('VGF-06');
      }
    },
    {
      id: 'purchases',
      title: 'المشتريات',
      subtitle: 'إدارة عمليات الشراء والمرتجعات والتقارير',
      icon: <ShoppingBag className="w-10 h-10 text-orange-400 group-hover:scale-110 transition-transform duration-200" strokeWidth={2.4} />,
      iconBg: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
      hoverBorder: 'hover:border-orange-500/50 hover:shadow-orange-500/10',
      action: () => {
        onSelectSection('purchases');
      }
    },
    {
      id: 'inventory',
      title: 'المخزون والمخازن',
      subtitle: 'إدارة المخزون والحركة والأصناف والمخازن',
      icon: <Box className="w-10 h-10 text-purple-400 group-hover:scale-110 transition-transform duration-200" strokeWidth={2.4} />,
      iconBg: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      hoverBorder: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      action: () => {
        onSelectSection('warehouses');
      }
    },

    // Row 2
    {
      id: 'finance',
      title: 'الخزينة والحسابات',
      subtitle: 'إدارة الخزينة والحسابات والعمليات المالية',
      icon: <SafeVaultIcon className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform duration-200" />,
      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      hoverBorder: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
      action: () => {
        onSelectSection('accounts');
      }
    },
    {
      id: 'reports',
      title: 'التقارير',
      subtitle: 'التقارير العامة والتحليلية والإحصائيات',
      icon: <BarChart2 className="w-10 h-10 text-rose-400 group-hover:scale-110 transition-transform duration-200" strokeWidth={2.4} />,
      iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
      hoverBorder: 'hover:border-rose-500/50 hover:shadow-rose-500/10',
      action: () => {
        onSelectSection('modules');
        onSelectFeature('MOD-BI');
      }
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      subtitle: 'إعدادات النظام، البيانات الأساسية، والصلاحيات',
      icon: <Settings className="w-10 h-10 text-blue-400 group-hover:scale-110 group-hover:rotate-45 transition-all duration-300" strokeWidth={2.4} />,
      iconBg: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      hoverBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      action: () => {
        onSelectSection('settings');
      }
    }
  ];

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between py-6 sm:py-8 lg:py-10 px-4 sm:px-8 lg:px-12 xl:px-16 select-none animate-fadeIn bg-slate-950" 
      dir="rtl"
    >
      {/* Relocated Controls Cluster (Notifications + Theme Toggle) in exact position */}
      <div className="w-full max-w-5xl lg:max-w-6xl 2xl:max-w-7xl mx-auto flex items-center justify-between mb-2 sm:mb-4 lg:mb-6" dir="ltr">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Notifications Button */}
          <button
            type="button"
            onClick={onOpenNotifications}
            title="محرك الإشعارات"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 border border-slate-700/80 transition-colors relative cursor-pointer shadow-md"
          >
            <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Theme Mode Toggle Button */}
          <button
            type="button"
            onClick={() => themeService.toggleTheme()}
            title={theme === 'dark' ? 'التحويل إلى الوضع الفاتح (Light Mode)' : 'التحويل إلى الوضع الداكن (Dark Mode)'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 text-slate-200 border border-slate-700/80 transition-colors cursor-pointer shadow-md"
          >
            {theme === 'dark' ? (
              <>
                <span className="text-xs sm:text-sm font-semibold text-amber-300">فاتح</span>
                <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-amber-400" />
              </>
            ) : (
              <>
                <span className="text-xs sm:text-sm font-semibold text-indigo-400">داكن</span>
                <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-400" />
              </>
            )}
          </button>
        </div>

        {/* Empty placeholder to ensure left alignment in LTR */}
        <div />
      </div>

      <div className="w-full max-w-5xl lg:max-w-6xl 2xl:max-w-7xl mx-auto my-auto flex-1 flex flex-col justify-center items-center space-y-8 sm:space-y-10 lg:space-y-12 text-center">
        {/* Main Title Block: Dynamic Branch Name & Company Name directly above VERTEX ERP */}
        <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2">
          {/* Dynamic Branch Name (Displayed only when CheckBox is enabled in Branch Master) */}
          {branchNameToDisplay ? (
            <span className="text-base sm:text-lg lg:text-xl font-bold tracking-wide text-amber-300 drop-shadow-[0_1px_4px_rgba(251,191,36,0.25)] select-none animate-fadeIn font-['Cairo',sans-serif]">
              {branchNameToDisplay}
            </span>
          ) : null}

          {/* Dynamic Company Name (Display-only, same style & font as VERTEX ERP, smaller & lighter) */}
          {companyName ? (
            <span className="text-sm sm:text-base lg:text-lg font-semibold tracking-wider text-amber-400/90 uppercase select-none">
              {companyName}
            </span>
          ) : null}

          {/* VERTEX ERP Title with secret Developer Menu access (clicking it opens Dev Menu) */}
          <button
            type="button"
            onClick={() => setIsDevMenuOpen(true)}
            id="btn-main-vertex-erp-dev-menu"
            title="قائمة المطورين وأصحاب البرنامج"
            className="group cursor-pointer inline-flex items-center justify-center focus:outline-none"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 drop-shadow-[0_2px_10px_rgba(251,191,36,0.2)] group-hover:scale-105 transition-transform duration-200">
              VERTEX ERP
            </h1>
          </button>
        </div>

        {/* Symmetrical 6 Cards Grid (3x2 on Desktop, 2x3 on Tablet, 1x6 on Mobile) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 lg:gap-8 max-w-5xl lg:max-w-6xl 2xl:max-w-7xl mx-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={card.action}
              id={`main-nav-card-${card.id}`}
              className={`w-full min-h-[170px] sm:min-h-[190px] lg:min-h-[210px] rounded-3xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 ${card.hoverBorder} shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col items-center justify-center p-6 sm:p-7 lg:p-8 text-center group cursor-pointer active:scale-[0.98] relative overflow-hidden`}
            >
              {/* Icon Container */}
              <div className={`w-20 h-20 rounded-2xl ${card.iconBg} border flex items-center justify-center mb-4 transition-all duration-200 shadow-inner group-hover:shadow-lg group-hover:scale-105 [&>svg]:w-10 [&>svg]:h-10`}>
                {card.icon}
              </div>

              {/* Module Title */}
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-100 group-hover:text-amber-400 transition-colors duration-200">
                {card.title}
              </h2>
            </button>
          ))}
        </div>
      </div>

      {/* Symmetrical Bottom Counter-balance Spacer */}
      <div className="hidden lg:block h-6 sm:h-8" />

      {/* Developer & System Owner Modal Container */}
      {isDevMenuOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsDevMenuOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-100">
                      قائمة المطورين وأصحاب البرنامج
                    </h2>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/30 font-semibold">
                      Developer Console
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    حاوية مخصصة للأدوات الهيكلية والوظائف الحساسة المستقبلية
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-dev-menu"
                onClick={() => setIsDevMenuOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Sensitive Functions Container (Placeholders only, no execution) */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-amber-300 block mb-0.5">حاوية الوظائف الحساسة والمتقدمة:</span>
                  تم تخصيص هذه النافذة لتكون الحاوية المركزية لأي عمليات حاسمة أو إعدادات عميقة للنظام مستقبلاً. حالياً الحاوية جاهزة ولا تتضمن أي وظيفة قيد التنفيذ أو كلمة مرور، وفق التوجيهات.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Operational Data Reset Button */}
                <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 hover:border-rose-700/80 transition-colors flex flex-col justify-between sm:col-span-2">
                  <div>
                    <div className="flex items-center justify-between gap-2.5 mb-2">
                      <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                        <span>تهيئة البرنامج — حذف بيانات التشغيل</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
                        System Reset
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      حذف جميع بيانات التشغيل والحركات (العملاء، الموردين، الأصناف، المخازن، الخزن، الفواتير، الحركات، التحويلات والأرصدة) مع <span className="text-emerald-400 font-semibold">الحفاظ الكامل</span> على المستخدمين، الأدوار والصلاحيات، إعدادات النظام، ودليل الحسابات المعتمد (236 حساباً).
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-end">
                    <button
                      type="button"
                      id="btn-purge-operational-data"
                      onClick={() => setIsResetConfirmOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>تهيئة البرنامج — حذف بيانات التشغيل</span>
                    </button>
                  </div>
                </div>

                {/* Database Engine: SQL Server Setup */}
                <div className="p-5 rounded-xl bg-slate-850/90 border border-cyan-500/30 hover:border-cyan-500/50 transition-colors sm:col-span-2 shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-100">محرك قواعد البيانات — إعداد اتصال SQL Server</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                            isConnected || testResult?.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                              : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          }`}>
                            {isConnected || testResult?.status === 'success' ? 'Connected' : 'TDS Connection'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isConnected || testResult?.status === 'success'
                            ? 'تم الاتصال الفعلي بنجاح بـ Microsoft SQL Server عبر بروتوكول TDS.'
                            : 'الاتصال المباشر بـ Microsoft SQL Server عبر بروتوكول TDS داخل VERTEX Desktop.'}
                        </p>
                      </div>
                    </div>
                    {isSaved && (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        تم حفظ الإعدادات
                      </span>
                    )}
                  </div>

                  {/* Form Fields: Server, Database, Username, Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Server */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-cyan-400" />
                        <span>خادم قاعدة البيانات (Server)</span>
                        <span className="text-rose-400 text-xs">*</span>
                      </label>
                      <input
                        type="text"
                        id="sql-server-host"
                        value={sqlConfig.server}
                        onChange={(e) => {
                          setSqlConfig({ ...sqlConfig, server: e.target.value });
                          if (testResult) setTestResult(null);
                        }}
                        placeholder="مثال: localhost أو 192.168.1.50 أو .\\SQLEXPRESS"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        dir="ltr"
                      />
                    </div>

                    {/* Database */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-cyan-400" />
                        <span>اسم قاعدة البيانات (Database)</span>
                        <span className="text-rose-400 text-xs">*</span>
                      </label>
                      <input
                        type="text"
                        id="sql-database-name"
                        value={sqlConfig.database}
                        onChange={(e) => {
                          setSqlConfig({ ...sqlConfig, database: e.target.value });
                          if (testResult) setTestResult(null);
                        }}
                        placeholder="مثال: VERTEX_DB"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        dir="ltr"
                      />
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-cyan-400" />
                        <span>اسم المستخدم (Username)</span>
                        <span className="text-rose-400 text-xs">*</span>
                      </label>
                      <input
                        type="text"
                        id="sql-username"
                        value={sqlConfig.username}
                        onChange={(e) => {
                          setSqlConfig({ ...sqlConfig, username: e.target.value });
                          if (testResult) setTestResult(null);
                        }}
                        placeholder="مثال: sa أو vertex_admin"
                        className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        dir="ltr"
                      />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>كلمة المرور (Password)</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSqlPassword ? 'text' : 'password'}
                          id="sql-password"
                          value={sqlConfig.password}
                          onChange={(e) => {
                            setSqlConfig({ ...sqlConfig, password: e.target.value });
                            if (testResult) setTestResult(null);
                          }}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2 pl-9 rounded-lg bg-slate-950 border border-slate-700/80 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSqlPassword(!showSqlPassword)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title={showSqlPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          {showSqlPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Result */}
                  <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        id="btn-test-sql-connection"
                        onClick={handleTestSqlConnection}
                        disabled={isTestingConnection}
                        className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isTestingConnection ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>جارٍ فحص المعلمات...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>اختبار الاتصال</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        id="btn-save-sql-config"
                        onClick={handleSaveSqlConfig}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>حفظ الإعدادات</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      محرك الربط: MS SQL Server Driver (TDS)
                    </span>
                  </div>

                  {/* Status Message */}
                  {testResult && (
                    <div
                      className={`p-3.5 rounded-lg text-xs leading-relaxed flex items-start gap-2.5 ${
                        testResult.status === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {testResult.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`font-mono text-xs font-bold ${testResult.status === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {testResult.message}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Future Slot: System Keys & Security */}
                <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>مفاتيح الأمان والتراخيص</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    مساحة مخصصة لإدارة المفاتيح الجذرية، شهادات التشفير، وإعدادات التحقق المتقدم.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500 font-medium">
                    (حاوية شاغرة - جاهزة للربط المستقبلي)
                  </div>
                </div>

                {/* Future Slot: Low-Level Maintenance */}
                <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-1.5">
                    <Wrench className="w-4 h-4 text-emerald-400" />
                    <span>الصيانة الجذرية للجداول</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    مساحة مخصصة لفحص سلامة الملفات، إعادة بناء الفهارس، والتطهير المنخفض المستوى.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500 font-medium">
                    (حاوية شاغرة - جاهزة للربط المستقبلي)
                  </div>
                </div>

                {/* Future Slot: Developer Diagnostics */}
                <div className="p-4 rounded-xl bg-slate-850/70 border border-slate-800/80 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5 text-slate-200 font-semibold text-sm mb-1.5">
                    <FileCode2 className="w-4 h-4 text-purple-400" />
                    <span>أدوات التشخيص وسجلات المطور</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    مساحة مخصصة لمخرجات المطورين، مراقبة استدعاءات النظام، وفحص مسارات التشغيل.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500 font-medium">
                    (حاوية شاغرة - جاهزة للربط المستقبلي)
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                VERTEX CORE • DEV_HOLDER_V1
              </span>
              <button
                type="button"
                id="btn-footer-close-dev-menu"
                onClick={() => setIsDevMenuOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Purge Operational Data */}
      {isResetConfirmOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => !isResetting && setIsResetConfirmOpen(false)}
        >
          <div 
            className="w-full max-w-lg bg-slate-900 border border-rose-600/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-800 bg-rose-950/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100">
                    تأكيد تهيئة البرنامج وحذف بيانات التشغيل
                  </h3>
                  <p className="text-xs text-rose-400/80">
                    هذا الإجراء جذري ولا يمكن التراجع عنه
                  </p>
                </div>
              </div>
              {!isResetting && (
                <button
                  type="button"
                  id="btn-close-confirm-purge"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {resetSuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <div>
                    <div className="font-bold text-sm">تمت تهيئة البرنامج وحذف بيانات التشغيل بنجاح!</div>
                    <div className="text-xs text-slate-400 mt-0.5">جاري إعادة تحميل البرنامج لتطبيق الحالة النظيفة...</div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Blocked or Error Alert */}
                  {resetError && (
                    <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 leading-relaxed flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                      <div className="flex-1 font-semibold">{resetError}</div>
                    </div>
                  )}

                  <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-slate-200 leading-relaxed">
                    <span className="font-bold text-rose-400 block mb-1">تنبيه حاسم (تهيئة البرنامج الشاملة):</span>
                    سيتم مسح وتصفير كافة بيانات التشغيل والاختبار من جميع موديولات النظام، وتشمل:
                    <ul className="list-disc list-inside mt-2 space-y-1 text-slate-300">
                      <li>سجلات العملاء والموردين التجريبية (مع بقاء العميل والمورد النقدي النظامي).</li>
                      <li>كتالوج الأصناف ومجموعاتها ووحداتها وأرصدة المخزون والتحويلات.</li>
                      <li>المناديب والمناطق، والفروع الثانوية، والمخازن والخزن غير التأسيسية.</li>
                      <li>فواتير المبيعات ونقاط البيع والمشتريات والمعلقات والمرتجعات وسندات الخزينة والبنوك.</li>
                      <li>يومية الأعمال والورديات وسجلات التدقيق والتاريخ التشغيلي.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 leading-relaxed flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>
                      <strong>البيانات المحفوظة كنواة نظامية:</strong> العميل النقدي (CUST-CASH-00)، المورد النقدي (VEND-CASH-00)، الفرع الرئيسي (BR-01)، المخزن الرئيسي (WH-01)، الخزينة الرئيسية (TR-01)، شجرة الحسابات المعتمدة (236 حساباً)، مستخدمو وصلاحيات وإعدادات النظام الأساسية.
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 text-center font-medium">
                    هل أنت متأكد تماماً من رغبتك في المتابعة وتنفيذ تهيئة البرنامج وإعادة تشغيله نظيفاً الآن؟
                  </p>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end gap-3">
              {!resetSuccess && (
                <>
                  <button
                    type="button"
                    id="btn-cancel-purge"
                    disabled={isResetting}
                    onClick={() => {
                      setIsResetConfirmOpen(false);
                      setResetError(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    إلغاء التراجع
                  </button>
                  <button
                    type="button"
                    id="btn-confirm-execute-purge"
                    disabled={isResetting}
                    onClick={handleExecutePurge}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isResetting ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>جاري التهيئة...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>نعم، نفّذ التهيئة واحذف بيانات التشغيل</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
