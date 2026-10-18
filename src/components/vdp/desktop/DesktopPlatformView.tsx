import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Monitor, 
  Bell, 
  Menu, 
  Maximize2, 
  Minimize2, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  Database, 
  Server, 
  AlertCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { desktopService } from '../../../services/desktopService';
import { WindowState } from '../../../core/desktop/DesktopTypes';

export const DesktopPlatformView: React.FC = () => {
  const [windowState, setWindowState] = useState<WindowState>(desktopService.getWindowState());
  const [trayConfig, setTrayConfig] = useState(desktopService.getTrayConfig());
  const monitors = desktopService.getMonitors();
  const menuItems = desktopService.getMenuItems();

  // Desktop SQL Server TDS Connection State
  const [sqlStatus, setSqlStatus] = useState<'idle' | 'testing' | 'connected' | 'failed'>('idle');
  const [sqlResult, setSqlResult] = useState<{
    server: string;
    database: string;
    authentication: string;
    username: string;
    status: string;
    error?: string;
    details?: any;
  }>({
    server: '.\\VERTEX',
    database: 'VERTEX_ERP_DB',
    authentication: 'SQL Server',
    username: 'sa',
    status: 'Standby'
  });

  // Check if running inside VERTEX Desktop (Electron)
  const isElectronDesktop = typeof window !== 'undefined' && Boolean((window as any).vertexDesktop?.isDesktop);

  useEffect(() => {
    if (isElectronDesktop && (window as any).vertexDesktop?.sqlServer) {
      (window as any).vertexDesktop.sqlServer.getStatus().then((st: any) => {
        if (st) {
          setSqlResult(prev => ({
            ...prev,
            server: st.server || '.\\VERTEX',
            database: st.database || 'VERTEX_ERP_DB',
            authentication: st.authentication === 'sql' ? 'SQL Server' : 'Windows',
            username: st.username || 'sa',
            status: st.status === 'connected' ? 'Connected' : 'Standby'
          }));
          if (st.status === 'connected') {
            setSqlStatus('connected');
          }
        }
      }).catch(() => {});
    }
  }, [isElectronDesktop]);

  const handleTestSqlConnection = async () => {
    setSqlStatus('testing');

    if (isElectronDesktop && (window as any).vertexDesktop?.sqlServer) {
      try {
        let pass = '';
        try {
          const saved = localStorage.getItem('VERTEX_SQL_SERVER_CONFIG');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.password) pass = parsed.password;
          }
        } catch {}

        const res = await (window as any).vertexDesktop.sqlServer.testConnection({
          server: '.\\VERTEX',
          database: 'VERTEX_ERP_DB',
          username: 'sa',
          password: pass,
          authentication: 'sql'
        });
        if (res.success || res.status === 'Connected') {
          setSqlStatus('connected');
          setSqlResult(prev => ({
            ...prev,
            status: 'Connected',
            error: undefined,
            details: res.details
          }));
        } else {
          setSqlStatus('failed');
          setSqlResult(prev => ({
            ...prev,
            status: 'Failed',
            error: res.error || 'فشل الاتصال بـ SQL Server'
          }));
        }
      } catch (err: any) {
        setSqlStatus('failed');
        setSqlResult(prev => ({
          ...prev,
          status: 'Failed',
          error: err.message || String(err)
        }));
      }
    } else {
      // Non-electron web preview fallback
      setTimeout(() => {
        setSqlStatus('failed');
        setSqlResult(prev => ({
          ...prev,
          status: 'Failed',
          error: 'الاتصال الفعلي بـ SQL Server عبر بروتوكول TDS يعمل حصرياً داخل تطبيق الديسكتوب (VERTEX Desktop) بنظام Electron'
        }));
      }, 600);
    }
  };

  const handleWindowStateChange = (state: WindowState) => {
    const updated = desktopService.setWindowState(state);
    setWindowState(updated);
  };

  const toggleTrayMinimize = () => {
    const updated = desktopService.updateTrayConfig({ minimizeToTray: !trayConfig.minimizeToTray });
    setTrayConfig(updated);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Layout className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: Desktop Platform</h2>
            <p className="text-xs text-slate-400">Native Window Management, App Menus, System Tray & Multi-Monitor Support</p>
          </div>
        </div>

        {/* Window State Controls */}
        <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-xs font-bold text-slate-300 font-mono mb-3">NATIVE WINDOW CONTROLS</div>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { state: 'normal' as WindowState, label: 'Normal Window', icon: Square },
              { state: 'maximized' as WindowState, label: 'Maximized', icon: Maximize2 },
              { state: 'minimized' as WindowState, label: 'Minimize to Taskbar', icon: Minimize2 },
              { state: 'fullscreen' as WindowState, label: 'Kiosk / Fullscreen', icon: Maximize2 },
            ].map(btn => {
              const Icon = btn.icon;
              const isSelected = windowState === btn.state;
              return (
                <button
                  key={btn.state}
                  onClick={() => handleWindowStateChange(btn.state)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Tray & Notifications */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>System Tray & Native Toast Integration</span>
          </h3>

          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-300">Minimize to System Tray</div>
                <div className="text-[10px] text-slate-500">Keep Vertex running quietly in background</div>
              </div>
              <button
                onClick={toggleTrayMinimize}
                className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold uppercase transition-all ${
                  trayConfig.minimizeToTray
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {trayConfig.minimizeToTray ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-300">Unread Toast Notifications</div>
                <div className="text-[10px] text-slate-500">Windows Toast Notification Spooler</div>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold">
                {trayConfig.unreadNotificationsCount} Pending Toasts
              </span>
            </div>
          </div>
        </div>

        {/* Multi-Monitor Setup */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>Multi-Monitor Geometry Detection</span>
          </h3>

          <div className="space-y-3 pt-2">
            {monitors.map(mon => (
              <div key={mon.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200 font-mono flex items-center space-x-2">
                    <span>{mon.name}</span>
                    {mon.isPrimary && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        PRIMARY
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Resolution: {mon.resolution} | DPI Scale: {mon.scaleFactor * 100}%
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real TDS SQL Server Connection Layer (Desktop Workstation) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-100">الاتصال الفعلي بـ SQL Server (TDS Protocol)</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 uppercase">
                  VERTEX Desktop Native
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                اتصال TDS مباشر وحقيقي من بيئة Electron إلى قاعدة بيانات SQL Server المحلية
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleTestSqlConnection}
              disabled={sqlStatus === 'testing'}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md shrink-0 ${
                sqlStatus === 'testing'
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${sqlStatus === 'testing' ? 'animate-spin' : ''}`} />
              <span>{sqlStatus === 'testing' ? 'جاري الفحص الفعلي (TDS)...' : 'اختبار الاتصال الفعلي (Test Connection)'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">خادم SQL Server</div>
            <div className="text-xs font-bold text-slate-200 font-mono mt-1 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span>{sqlResult.server}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">قاعدة البيانات المعنية</div>
            <div className="text-xs font-bold text-slate-200 font-mono mt-1 flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{sqlResult.database}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">نوع المصادقة</div>
            <div className="text-xs font-bold text-slate-200 font-mono mt-1 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sqlResult.authentication}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] font-mono text-slate-500 uppercase">اسم المستخدم</div>
            <div className="text-xs font-bold text-slate-200 font-mono mt-1">
              {sqlResult.username}
            </div>
          </div>
        </div>

        {/* Real Status Banner */}
        {sqlStatus === 'connected' && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-300 font-mono">Connected</div>
                <div className="text-xs text-emerald-400 mt-1 font-mono">
                  تم إجراء الاتصال الفعلي بنجاح عبر بروتوكول TDS مع {sqlResult.server} على قاعدة {sqlResult.database}.
                </div>
                {sqlResult.details && (
                  <div className="text-[11px] text-emerald-300/80 font-mono mt-1">
                    {sqlResult.details.sql_version ? sqlResult.details.sql_version.split('\n')[0] : ''}
                  </div>
                )}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-mono font-bold uppercase shrink-0">
              CONNECTED
            </span>
          </div>
        )}

        {sqlStatus === 'failed' && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-rose-300 font-mono">Failed</div>
                <div className="text-xs text-rose-300 mt-1 font-mono">
                  <span className="font-bold text-rose-200">الخطأ الحقيقي: </span>
                  {sqlResult.error}
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-mono font-bold uppercase shrink-0">
              FAILED
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
