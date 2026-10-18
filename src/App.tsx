import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VGF01FirstRunWizard } from './components/vgf/VGF01FirstRunWizard';
import { VGF02MigrationCenter } from './components/vgf/VGF02MigrationCenter';
import { VGF03MergeEngine } from './components/vgf/VGF03MergeEngine';
import { VGF04BusinessDayExtension } from './components/vgf/VGF04BusinessDayExtension';
import { VGF05SmartBackup } from './components/vgf/VGF05SmartBackup';
import { VGF06SalesEntryModes } from './components/vgf/VGF06SalesEntryModes';
import { VGF07VisibilityManager } from './components/vgf/VGF07VisibilityManager';
import { VGF08SmartReorderPolicy } from './components/vgf/VGF08SmartReorderPolicy';
import { VGF09DocumentHistory } from './components/vgf/VGF09DocumentHistory';
import { VGF10AdvancedAuditTimeline } from './components/vgf/VGF10AdvancedAuditTimeline';
import { GoldFeaturesDashboard } from './components/gold/GoldFeaturesDashboard';
import { MainInterfaceView } from './components/main/MainInterfaceView';
import { CustomerMasterView } from './components/customers/CustomerMasterView';
import { VendorMasterView } from './components/vendors/VendorMasterView';
import { PurchasesModuleView } from './components/purchases/PurchasesModuleView';
import { TreasuryMasterView } from './components/treasuries/TreasuryMasterView';
import { WarehouseMainView } from './components/warehouses/WarehouseMainView';
import { AccountsMainView } from './components/accounts/AccountsMainView';
import { SellerMasterView } from './components/sellers/SellerMasterView';
import { BranchMasterView } from './components/branches/BranchMasterView';
import { ERPModulesView } from './components/modules/ERPModulesView';
import { SystemEnginesView } from './components/engines/SystemEnginesView';
import { DeveloperToolsView } from './components/devtools/DeveloperToolsView';
import { VDP01DeploymentDashboard } from './components/vdp/VDP01DeploymentDashboard';
import { VDP02DesktopDashboard } from './components/vdp/desktop/VDP02DesktopDashboard';
import { VDP03CloudDashboard } from './components/vdp/cloud/VDP03CloudDashboard';
import { VDP04HybridDashboard } from './components/vdp/hybrid/VDP04HybridDashboard';
import { VDP05InstallerDashboard } from './components/vdp/installer/VDP05InstallerDashboard';
import { VDP06PortableDashboard } from './components/vdp/portable/VDP06PortableDashboard';
import { VDP07BackupDashboard } from './components/vdp/backup/VDP07BackupDashboard';
import { VDP08UpdateDashboard } from './components/vdp/update/VDP08UpdateDashboard';
import { VDP09ConfigDashboard } from './components/vdp/config/VDP09ConfigDashboard';
import { VDP10LicenseDashboard } from './components/vdp/license/VDP10LicenseDashboard';
import { SettingsModuleView } from './components/settings/SettingsModuleView';

import { NotificationsModal } from './components/NotificationsModal';
import { AuditLogsModal } from './components/AuditLogsModal';
import { VSESearchModal } from './components/vpe/VSESearchModal';
import { PlatformSection } from './types';
import { INITIAL_GOLD_FEATURES } from './data/mockData';
import { themeService } from './services/themeService';
import { Clock, CheckCircle2, AlertCircle, PanelRightOpen, PanelTopOpen, RotateCcw } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState<PlatformSection>('customers');
  const [activeFeatureId, setActiveFeatureId] = useState<string>('MOD-AR');

  // Layout Visibility Controls (Top Header Bar & Right Sidebar)
  const [isTopBarHidden, setIsTopBarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('VERTEX_LAYOUT_TOPBAR_HIDDEN') === 'true';
    } catch {
      return false;
    }
  });

  const [isSidebarHidden, setIsSidebarHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('VERTEX_LAYOUT_SIDEBAR_HIDDEN') === 'true';
    } catch {
      return false;
    }
  });

  const toggleTopBar = () => {
    setIsTopBarHidden(prev => {
      const next = !prev;
      try {
        localStorage.setItem('VERTEX_LAYOUT_TOPBAR_HIDDEN', String(next));
      } catch {}
      return next;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarHidden(prev => {
      const next = !prev;
      try {
        localStorage.setItem('VERTEX_LAYOUT_SIDEBAR_HIDDEN', String(next));
      } catch {}
      return next;
    });
  };

  const showAllBars = () => {
    setIsTopBarHidden(false);
    setIsSidebarHidden(false);
    try {
      localStorage.setItem('VERTEX_LAYOUT_TOPBAR_HIDDEN', 'false');
      localStorage.setItem('VERTEX_LAYOUT_SIDEBAR_HIDDEN', 'false');
    } catch {}
  };

  // Modal controls
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    themeService.init();
  }, []);

  const handleSelectSection = (section: PlatformSection) => {
    setActiveSection(section);
    if (section === 'gold') {
      setActiveFeatureId('VGF-01');
    } else if (section === 'customers') {
      setActiveFeatureId('MOD-AR');
    } else if (section === 'vendors') {
      setActiveFeatureId('MOD-AP');
    } else if (section === 'purchases') {
      setActiveFeatureId('purchases');
    } else if (section === 'accounts') {
      setActiveFeatureId('accounts');
    } else if (section === 'modules') {
      setActiveFeatureId('MOD-GL');
    } else if (section === 'engines') {
      setActiveFeatureId('ENG-AUDIT');
    } else if (section === 'devtools') {
      setActiveFeatureId('DEV-DIAG');
    }
  };

  const handleSelectFeature = (featureId: string) => {
    setActiveFeatureId(featureId);
    if (featureId === 'MOD-AR' || featureId === 'MOD-CUST' || featureId === 'customers') {
      setActiveSection('customers');
    } else if (featureId === 'MOD-AP' || featureId === 'MOD-VEND' || featureId === 'vendors') {
      setActiveSection('vendors');
    } else if (featureId === 'purchases') {
      setActiveSection('purchases');
    } else if (featureId === 'treasuries') {
      setActiveSection('treasuries');
    } else if (featureId === 'accounts') {
      setActiveSection('accounts');
    } else if (featureId === 'warehouses' || featureId === 'MOD-INV') {
      setActiveSection('warehouses');
    } else if (featureId.startsWith('VGF-')) {
      setActiveSection('gold');
    } else if (featureId.startsWith('MOD-')) {
      setActiveSection('modules');
    } else if (featureId.startsWith('ENG-')) {
      setActiveSection('engines');
    } else if (featureId.startsWith('DEV-')) {
      setActiveSection('devtools');
    }
  };

  const selectedGoldFeature = INITIAL_GOLD_FEATURES.find(f => f.id === activeFeatureId);
  const isMainView = activeSection === 'main';

  // Global shortcuts:
  // - Ctrl+K: Search
  // - Ctrl+B: Toggle Sidebar
  // - Alt+T: Toggle Top Bar
  // - F10 / Alt+M: Toggle Full Workspace (Both)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      } else if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTopBar();
      } else if (e.key === 'F10' || (e.altKey && e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        if (isTopBarHidden && isSidebarHidden) {
          showAllBars();
        } else {
          setIsTopBarHidden(true);
          setIsSidebarHidden(true);
          try {
            localStorage.setItem('VERTEX_LAYOUT_TOPBAR_HIDDEN', 'true');
            localStorage.setItem('VERTEX_LAYOUT_SIDEBAR_HIDDEN', 'true');
          } catch {}
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTopBarHidden, isSidebarHidden]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950 relative">
      {/* Top Floating Control Dock (Visible when Top Bar is hidden) */}
      {!isMainView && isTopBarHidden && (
        <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/90 rounded-full px-3.5 py-1.5 shadow-2xl transition-all duration-200 animate-fadeIn">
          <button
            type="button"
            onClick={toggleTopBar}
            title="إظهار الشريط العلوي (Alt+T)"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <PanelTopOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>إظهار الشريط العلوي</span>
          </button>
          {isSidebarHidden && (
            <>
              <span className="w-px h-3.5 bg-slate-700 mx-0.5"></span>
              <button
                type="button"
                onClick={toggleSidebar}
                title="إظهار القائمة الجانبية (Ctrl+B)"
                className="flex items-center gap-1.5 text-xs font-bold text-slate-200 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <PanelRightOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>إظهار القائمة</span>
              </button>
              <span className="w-px h-3.5 bg-slate-700 mx-0.5"></span>
              <button
                type="button"
                onClick={showAllBars}
                title="استعادة العرض الكامل (F10)"
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إظهار الكل</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating Edge Trigger on Right (Visible when Sidebar is hidden) */}
      {!isMainView && isSidebarHidden && (
        <button
          type="button"
          onClick={toggleSidebar}
          title="إظهار القائمة الجانبية (Ctrl+B)"
          className="fixed top-24 right-0 z-50 bg-slate-900/95 hover:bg-slate-800 text-slate-300 hover:text-amber-300 border-y border-l border-slate-700/90 hover:border-amber-500/50 py-3 px-1.5 rounded-l-xl shadow-2xl transition-all duration-200 flex flex-col items-center gap-1 group cursor-pointer"
        >
          <PanelRightOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-amber-300 [writing-mode:vertical-rl]">القائمة</span>
        </button>
      )}

      {/* Top Header Bar (Hidden on Main Interface Hub OR when toggled hidden) */}
      {!isMainView && !isTopBarHidden && (
        <Header
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
          onOpenDevTools={() => {
            setActiveSection('devtools');
            setActiveFeatureId('DEV-DIAG');
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onSelectFeature={handleSelectFeature}
          isSidebarHidden={isSidebarHidden}
          onToggleSidebar={toggleSidebar}
          onHideTopBar={toggleTopBar}
        />
      )}

      {/* Main App Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar (Hidden on Main Interface Hub OR when toggled hidden) */}
        {!isMainView && !isSidebarHidden && (
          <Sidebar
            activeSection={activeSection}
            activeFeatureId={activeFeatureId}
            onSelectSection={handleSelectSection}
            onSelectFeature={handleSelectFeature}
            isTopBarHidden={isTopBarHidden}
            onHideSidebar={toggleSidebar}
          />
        )}

        {/* Dynamic Content Body Area */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar transition-all duration-200 ${
          isMainView 
            ? 'h-screen min-h-screen p-0 m-0' 
            : isTopBarHidden
              ? isSidebarHidden
                ? 'h-screen min-h-screen p-2 sm:p-3 md:p-4' 
                : 'h-screen min-h-screen p-2 sm:p-4 md:p-5'
              : activeSection === 'warehouses' || activeSection === 'accounts' 
                ? 'h-[calc(100vh-4rem)] p-3 sm:p-5 md:p-6' 
                : 'h-[calc(100vh-4rem)] p-4 sm:p-6 md:p-8'
        }`}>
          {isMainView ? (
            /* MAIN INTERFACE NAVIGATION HUB (Full Symmetrical View) */
            <MainInterfaceView 
              onSelectSection={handleSelectSection}
              onSelectFeature={handleSelectFeature}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
            />
          ) : (
            <div className={
              isSidebarHidden 
                ? 'w-full mx-auto' 
                : (activeSection === 'warehouses' || activeSection === 'accounts' ? 'w-full max-w-[1700px] mx-auto' : 'max-w-7xl mx-auto')
            }>

            {/* GOLD FEATURES SECTION */}
            {activeSection === 'gold' && (
              <>
                {activeFeatureId === 'VGF-01' ? (
                  <VGF01FirstRunWizard />
                ) : activeFeatureId === 'VGF-02' ? (
                  <VGF02MigrationCenter />
                ) : activeFeatureId === 'VGF-03' ? (
                  <VGF03MergeEngine />
                ) : activeFeatureId === 'VGF-04' ? (
                  <VGF04BusinessDayExtension />
                ) : activeFeatureId === 'VGF-05' ? (
                  <VGF05SmartBackup />
                ) : activeFeatureId === 'VGF-06' ? (
                  <VGF06SalesEntryModes 
                    onClose={() => handleSelectSection('main')} 
                    onNavigateSection={(sec) => handleSelectSection(sec)}
                  />
                ) : activeFeatureId === 'VGF-07' ? (
                  <VGF07VisibilityManager />
                ) : activeFeatureId === 'VGF-08' ? (
                  <VGF08SmartReorderPolicy />
                ) : activeFeatureId === 'VGF-09' ? (
                  <VGF09DocumentHistory />
                ) : activeFeatureId === 'VGF-10' ? (
                  <VGF10AdvancedAuditTimeline />
                ) : (
                  <GoldFeaturesDashboard onSelectFeature={(id) => handleSelectFeature(id)} />
                )}
              </>
            )}

            {/* DEDICATED CUSTOMER MASTER SECTION */}
            {activeSection === 'customers' && (
              <CustomerMasterView 
                onClose={() => {
                  setActiveSection('gold');
                  setActiveFeatureId('VGF-06');
                }}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* DEDICATED PURCHASES SECTION */}
            {activeSection === 'purchases' && (
              <PurchasesModuleView 
                onClose={() => handleSelectSection('main')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* DEDICATED VENDOR MASTER SECTION */}
            {activeSection === 'vendors' && (
              <VendorMasterView 
                onClose={() => handleSelectSection('gold')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* DEDICATED TREASURY MASTER SECTION */}
            {activeSection === 'treasuries' && (
              <TreasuryMasterView 
                onClose={() => handleSelectSection('gold')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* DEDICATED ACCOUNTS MAIN SECTION */}
            {activeSection === 'accounts' && (
              <AccountsMainView 
                onClose={() => handleSelectSection('main')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* DEDICATED WAREHOUSE MAIN SECTION */}
            {activeSection === 'warehouses' && (
              <WarehouseMainView 
                onClose={() => handleSelectSection('gold')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* DEDICATED SELLER MASTER SECTION */}
            {activeSection === 'sellers' && (
              <SellerMasterView 
                onClose={() => handleSelectSection('gold')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* DEDICATED BRANCH MASTER SECTION */}
            {activeSection === 'branches' && (
              <BranchMasterView 
                onClose={() => handleSelectSection('settings')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* SETTINGS MODULE SECTION */}
            {activeSection === 'settings' && (
              <SettingsModuleView 
                onClose={() => handleSelectSection('main')}
                onNavigateSection={(sec) => handleSelectSection(sec)}
              />
            )}

            {/* 15 CORE ERP MODULES SECTION */}
            {activeSection === 'modules' && (
              <ERPModulesView
                selectedModuleId={activeFeatureId}
                onSelectModule={(id) => setActiveFeatureId(id)}
              />
            )}

            {/* 15 SHARED SYSTEM ENGINES SECTION */}
            {activeSection === 'engines' && (
              <SystemEnginesView
                selectedEngineId={activeFeatureId}
                onSelectEngine={(id) => setActiveFeatureId(id)}
                onOpenGlobalSearch={() => setIsSearchOpen(true)}
              />
            )}

            {/* DEVELOPER TOOLS SECTION */}
            {activeSection === 'devtools' && (
              <DeveloperToolsView />
            )}

            {/* VDP-01 DEPLOYMENT ARCHITECTURE SECTION */}
            {activeSection === 'deployment' && (
              <VDP01DeploymentDashboard />
            )}

            {/* VDP-02 DESKTOP EDITION SECTION */}
            {activeSection === 'desktop_vdp' && (
              <VDP02DesktopDashboard />
            )}

            {/* VDP-03 CLOUD EDITION SECTION */}
            {activeSection === 'cloud_vdp' && (
              <VDP03CloudDashboard />
            )}

            {/* VDP-04 HYBRID EDITION SECTION */}
            {activeSection === 'hybrid_vdp' && (
              <VDP04HybridDashboard />
            )}

            {/* VDP-05 INSTALLER & AUTO UPDATE SECTION */}
            {activeSection === 'installer_vdp' && (
              <VDP05InstallerDashboard />
            )}

            {/* VDP-06 PORTABLE DEPLOYMENT ENGINE */}
            {activeSection === 'portable_vdp' && (
              <VDP06PortableDashboard />
            )}

            {/* VDP-07 BACKUP & DISASTER RECOVERY SECTION */}
            {activeSection === 'backup_vdp' && (
              <VDP07BackupDashboard />
            )}

            {/* VDP-08 UPDATE & PATCH MANAGEMENT ENGINE */}
            {activeSection === 'update_vdp' && (
              <VDP08UpdateDashboard />
            )}

            {/* VDP-09 ENVIRONMENT & CONFIGURATION MANAGEMENT ENGINE */}
            {activeSection === 'config_vdp' && (
              <VDP09ConfigDashboard />
            )}

            {/* VDP-10 ENTERPRISE LICENSE & PRODUCT DISTRIBUTION ENGINE */}
            {activeSection === 'license_vdp' && (
              <VDP10LicenseDashboard />
            )}
            </div>
          )}
        </main>
      </div>

      {/* Global Drawer Modals */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      <VSESearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(path) => {
          if (path.includes('main')) {
            setActiveSection('main');
          } else if (path.includes('gold')) {
            setActiveSection('gold');
          } else if (path.includes('customer') || path.includes('ar')) {
            setActiveSection('customers');
            setActiveFeatureId('MOD-AR');
          } else if (path.includes('vendor') || path.includes('ap')) {
            setActiveSection('vendors');
            setActiveFeatureId('MOD-AP');
          } else if (path.includes('inventory') || path.includes('gl') || path.includes('hr') || path.includes('treasury')) {
            setActiveSection('modules');
          } else if (path.includes('vpe') || path.includes('engines')) {
            setActiveSection('engines');
          }
        }}
      />
    </div>
  );
}
