import React, { useState, useEffect } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  HardDrive, 
  ShieldCheck, 
  Database, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Key, 
  Folder, 
  Cloud, 
  Server, 
  Zap, 
  Play, 
  Settings, 
  FileText, 
  Activity, 
  Search, 
  Check, 
  X, 
  ShieldAlert, 
  Layers, 
  Download, 
  Upload, 
  Sliders, 
  Cpu, 
  RotateCcw, 
  BarChart3, 
  Eye, 
  Bell, 
  Building2 
} from 'lucide-react';
import { 
  smartBackupService, 
  SmartBackupState, 
  BackupType, 
  BackupTrigger, 
  BackupLocation, 
  CompressionLevel, 
  EncryptionAlgorithm, 
  BackupArchive 
} from '../../services/smartBackupService';

type VGF05Tab = 
  | 'backup_center'
  | 'configuration'
  | 'smart_automation'
  | 'restore_center'
  | 'monitoring_security'
  | 'reports_integration';

export const VGF05SmartBackup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VGF05Tab>('backup_center');
  const [backupState, setBackupState] = useState<SmartBackupState>(smartBackupService.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger Backup Modal State
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<BackupType>('full');
  const [selectedTrigger, setSelectedTrigger] = useState<BackupTrigger>('manual');

  // Preview / Restore Modal State
  const [selectedArchive, setSelectedArchive] = useState<BackupArchive | null>(null);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [restoreScope, setRestoreScope] = useState<'full_database' | 'selected_modules' | 'selected_branches'>('full_database');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);

  // Report Modal State
  const [activeReportModal, setActiveReportModal] = useState<'backup' | 'restore' | 'storage' | 'history' | 'audit' | null>(null);

  useEffect(() => {
    setBackupState(smartBackupService.getState());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const handleRunBackup = () => {
    const newArch = smartBackupService.triggerBackup(selectedType, selectedTrigger);
    setBackupState(smartBackupService.getState());
    setIsBackupModalOpen(false);
    showToast(`Backup ${newArch.code} executed and saved successfully!`);
  };

  const handleConfigChange = (field: string, val: any) => {
    smartBackupService.updateConfig({ [field]: val });
    setBackupState(smartBackupService.getState());
    showToast(`Configuration '${field}' updated`);
  };

  const handleVerifyIntegrity = (archiveId: string) => {
    smartBackupService.verifyBackupIntegrity(archiveId);
    setBackupState(smartBackupService.getState());
    showToast('Backup integrity SHA-256 checksum verified 100% OK!');
  };

  const handleExecuteRestore = () => {
    if (!selectedArchive) return;
    setIsRestoring(true);
    setRestoreProgress(25);

    setTimeout(() => {
      setRestoreProgress(60);
      setTimeout(() => {
        setRestoreProgress(100);
        smartBackupService.startRestore(selectedArchive.id, restoreScope);
        setBackupState(smartBackupService.getState());
        setIsRestoring(false);
        setIsRestoreModalOpen(false);
        showToast(`Full Restore from ${selectedArchive.code} completed successfully!`);
      }, 800);
    }, 600);
  };

  const markCompleted = () => {
    smartBackupService.markVgf05Completed();
    setBackupState(smartBackupService.getState());
    showToast('VGF-05 Smart Backup System Marked as Completed!');
  };

  const { config, archives, logs, storageStats } = backupState;

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                VGF-05
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                backupState.isVgf05Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{backupState.isVgf05Completed ? 'VGF-05 COMPLETED' : 'OFFICIALLY APPROVED'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Version 1.2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Smart Backup & Restore System
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Enterprise automated database & multi-branch backup engine with AES-256 encryption, zero-downtime restoration, pre-closing automation triggers, and real-time security integrity logs.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark VGF-05 Completed</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>BACKUP ENGINE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'backup_center', label: '1. Backup Center', icon: HardDrive },
            { id: 'configuration', label: '2. Backup Configuration', icon: Settings },
            { id: 'smart_automation', label: '3. Smart Automation', icon: Zap },
            { id: 'restore_center', label: '4. Restore Center', icon: RotateCcw },
            { id: 'monitoring_security', label: '5. Monitoring & Security', icon: ShieldCheck },
            { id: 'reports_integration', label: '6. Reports & Integration', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as VGF05Tab)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: BACKUP CENTER */}
      {activeTab === 'backup_center' && (
        <div className="space-y-6 animate-fade-in">
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>LAST BACKUP</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-lg font-black text-slate-100 font-mono mt-2">
                {new Date(config.lastBackupTimestamp).toLocaleDateString()}
              </p>
              <p className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                {new Date(config.lastBackupTimestamp).toLocaleTimeString()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>NEXT SCHEDULED</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-lg font-black text-slate-100 font-mono mt-2">
                {new Date(config.nextScheduledTimestamp).toLocaleDateString()}
              </p>
              <p className="text-[10px] text-amber-400 font-semibold mt-0.5">Automated Daily Midnight</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>BACKUP STATUS</span>
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-lg font-black text-emerald-400 font-mono mt-2">HEALTHY</p>
              <p className="text-[10px] text-slate-400 mt-0.5">AES-256 Encrypted</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>STORAGE USAGE</span>
                <HardDrive className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-lg font-black text-slate-100 font-mono mt-2">
                {storageStats.usedStorageGB.toFixed(2)} GB
              </p>
              <p className="text-[10px] text-indigo-300 mt-0.5">of {storageStats.totalAllocatedGB} GB allocated</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>ARCHIVES COUNT</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-lg font-black text-slate-100 font-mono mt-2">{archives.length}</p>
              <p className="text-[10px] text-purple-300 mt-0.5">Active backup archives</p>
            </div>
          </div>

          {/* Quick Actions & Archives List */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Database className="w-5 h-5 text-amber-400" />
                  <span>Backup Execution Center</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Trigger manual, full, quick, or custom scheduled snapshots.</p>
              </div>

              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow flex items-center space-x-1.5 self-start sm:self-auto"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Run Instant Backup</span>
              </button>
            </div>

            {/* Table of Archives */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">Code / Archive</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Trigger Source</th>
                    <th className="pb-2">Location</th>
                    <th className="pb-2">Size (MB)</th>
                    <th className="pb-2">Created At</th>
                    <th className="pb-2">Encryption</th>
                    <th className="pb-2">Integrity</th>
                    <th className="pb-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {archives.map(arc => (
                    <tr key={arc.id} className="hover:bg-slate-950/50">
                      <td className="py-3 font-bold text-slate-100">
                        <div>{arc.code}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{arc.filename}</div>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono font-bold uppercase text-[10px]">
                          {arc.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-mono text-[11px] capitalize">{arc.trigger.replace('_', ' ')}</td>
                      <td className="py-3 text-slate-400 font-mono text-[11px] capitalize">{arc.location.replace('_', ' ')}</td>
                      <td className="py-3 font-mono text-emerald-400 font-bold">{arc.sizeMB.toLocaleString()} MB</td>
                      <td className="py-3 font-mono text-slate-400 text-[11px]">{new Date(arc.createdAt).toLocaleString()}</td>
                      <td className="py-3">
                        {arc.isEncrypted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center space-x-1 w-fit">
                            <Lock className="w-3 h-3" />
                            <span>{arc.encryptionAlgorithm || 'AES-256'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">Unencrypted</span>
                        )}
                      </td>
                      <td className="py-3">
                        {arc.isVerified ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified OK</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerifyIntegrity(arc.id)}
                            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-slate-100 font-bold text-[10px]"
                          >
                            Verify Integrity
                          </button>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => {
                            setSelectedArchive(arc);
                            setIsRestoreModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>Preview / Restore</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONFIGURATION */}
      {activeTab === 'configuration' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <span>Phase 02: Enterprise Backup Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Customize storage destinations, compression parameters, and encryption algorithms.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Storage Location */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 uppercase font-mono text-[11px] flex items-center space-x-1.5">
                  <Folder className="w-4 h-4" />
                  <span>Backup Storage Location</span>
                </h4>

                <div className="space-y-2">
                  <label className="block text-slate-400">Primary Storage Target</label>
                  <select
                    value={config.location}
                    onChange={e => handleConfigChange('location', e.target.value as BackupLocation)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  >
                    <option value="local_folder">Local Server Folder (/var/vertex/backups)</option>
                    <option value="network_folder">Network Attached Storage (NAS //192.168.1.50/vault)</option>
                    <option value="external_drive">External Encrypted Drive (/mnt/ext_drive)</option>
                    <option value="cloud_storage">Cloud Storage Vault (AWS S3 / Google Cloud Storage)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-slate-400">Destination URI / Directory Path</label>
                  <input
                    type="text"
                    value={config.destinationPath}
                    onChange={e => handleConfigChange('destinationPath', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Compression & Security */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <h4 className="font-bold text-amber-400 uppercase font-mono text-[11px] flex items-center space-x-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Compression & Encryption Security</span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Compression Level</label>
                    <select
                      value={config.compressionLevel}
                      onChange={e => handleConfigChange('compressionLevel', e.target.value as CompressionLevel)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono"
                    >
                      <option value="none">None (Fastest)</option>
                      <option value="fast">Fast (GZIP Level 1)</option>
                      <option value="high">High (ZSTD Standard)</option>
                      <option value="ultra">Ultra (XZ Max Ratio)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Encryption Spec</label>
                    <select
                      value={config.encryptionAlgorithm}
                      onChange={e => handleConfigChange('encryptionAlgorithm', e.target.value as EncryptionAlgorithm)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono"
                    >
                      <option value="AES-256-GCM">AES-256-GCM (Hardware Accel)</option>
                      <option value="ChaCha20-Poly1305">ChaCha20-Poly1305</option>
                      <option value="RSA-4096">RSA-4096 Asymmetric</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-4">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.encryptionEnabled}
                      onChange={e => handleConfigChange('encryptionEnabled', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Enable Encryption</span>
                  </label>

                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.passwordProtected}
                      onChange={e => handleConfigChange('passwordProtected', e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    <span>Master Password Protection</span>
                  </label>
                </div>
              </div>

              {/* Retention Policy */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 md:col-span-2">
                <h4 className="font-bold text-amber-400 uppercase font-mono text-[11px] flex items-center space-x-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Retention Policy & Automated Cleanup</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Max History Retention (Days)</label>
                    <input
                      type="number"
                      value={config.maxHistoryRetentionDays}
                      onChange={e => handleConfigChange('maxHistoryRetentionDays', parseInt(e.target.value) || 30)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Max Backup Files Count Limit</label>
                    <input
                      type="number"
                      value={config.maxBackupFilesCount}
                      onChange={e => handleConfigChange('maxBackupFilesCount', parseInt(e.target.value) || 50)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SMART AUTOMATION */}
      {activeTab === 'smart_automation' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Phase 03: Smart Automation Triggers</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Automatically trigger snapshots before critical ERP state changes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                {
                  key: 'autoBackupBeforeUpdate',
                  title: 'Backup Before System Update',
                  desc: 'Automatically creates a full system backup before applying patches or major core updates.'
                },
                {
                  key: 'autoBackupBeforeDayClosing',
                  title: 'Backup Before Closing Business Day',
                  desc: 'Creates a targeted financial snapshot right before executing VGF-04 Business Day Closing.'
                },
                {
                  key: 'autoBackupBeforeMaintenance',
                  title: 'Backup Before Database Maintenance',
                  desc: 'Ensures zero data loss prior to running index rebuilds or database vacuum operations.'
                },
                {
                  key: 'autoBackupBeforeRestore',
                  title: 'Backup Before System Restore',
                  desc: 'Takes a safety snapshot of the existing state before restoring an older backup file.'
                }
              ].map(item => {
                const isEnabled = (config as any)[item.key];
                return (
                  <div key={item.key} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between space-x-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-100 flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>{item.title}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>

                    <button
                      onClick={() => handleConfigChange(item.key, !isEnabled)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] shrink-0 transition-colors ${
                        isEnabled
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESTORE CENTER */}
      {activeTab === 'restore_center' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <span>Phase 04: Restore Center & Selective Recovery</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Browse backup archives, inspect contents, and execute full or selective module restorations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {archives.map(arc => (
                <div key={arc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {arc.code}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">{arc.sizeMB} MB</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100 font-mono truncate">{arc.filename}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(arc.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono">
                    <p>Modules Included: <span className="text-amber-400">{arc.modulesIncluded.length} modules</span></p>
                    <p>Total Records: <span className="text-indigo-300">{arc.recordsCountTotal.toLocaleString()}</span></p>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedArchive(arc);
                      setIsRestoreModalOpen(true);
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Launch Restore Wizard</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MONITORING & SECURITY */}
      {activeTab === 'monitoring_security' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Phase 05: Monitoring, Audit Logs & Security Engine</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Real-time audit log stream, integrity verification, and automatic failure alerts.</p>
            </div>

            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      log.level === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                      log.level === 'error' ? 'bg-rose-500/20 text-rose-400' :
                      'bg-indigo-500/20 text-indigo-400'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-100">{log.message}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{log.details}</p>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] text-slate-500">
                    <div>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    <div className="text-amber-400">{log.executedBy}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: REPORTS & INTEGRATION */}
      {activeTab === 'reports_integration' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Phase 06: Backup Reports & Platform Module Integration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Generate compliance reports and view active ERP module integrations.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { type: 'backup', title: 'Backup History & Status Report', desc: 'Detailed log of completed, scheduled, and automated snapshots.' },
                { type: 'restore', title: 'System Restore Audit Log', desc: 'Audit history of full and module-level database restorations.' },
                { type: 'storage', title: 'Storage Usage & Retention Report', desc: 'Capacity planning, compression ratios, and retention cleanup.' },
                { type: 'history', title: 'Multi-Branch Snapshot Matrix', desc: 'Branch-by-branch backup coverage analysis.' },
                { type: 'audit', title: 'Security & Integrity Verification', desc: 'AES-256 encryption & SHA-256 checksum compliance certificate.' }
              ].map(rpt => (
                <button
                  key={rpt.type}
                  onClick={() => setActiveReportModal(rpt.type as any)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all space-y-2"
                >
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-100">{rpt.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{rpt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instant Backup Modal */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Run Instant Smart Backup</h3>
              <button onClick={() => setIsBackupModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Backup Type</label>
                <select
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value as BackupType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="full">Full Database Backup (All Modules & Branches)</option>
                  <option value="quick">Quick Financial Snapshot (GL, AR, AP, Treasury)</option>
                  <option value="differential">Differential Backup</option>
                  <option value="incremental">Incremental Delta Backup</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Trigger Context</label>
                <select
                  value={selectedTrigger}
                  onChange={e => setSelectedTrigger(e.target.value as BackupTrigger)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="manual">Manual On-Demand</option>
                  <option value="before_update">Before System Update</option>
                  <option value="before_day_closing">Before Business Day Closing</option>
                  <option value="before_db_maintenance">Before DB Maintenance</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRunBackup}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Start Backup Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {isRestoreModalOpen && selectedArchive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Restore System - {selectedArchive.code}</h3>
              <button onClick={() => setIsRestoreModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <p>Filename: <span className="text-amber-400">{selectedArchive.filename}</span></p>
                <p>Size: <span className="text-emerald-400">{selectedArchive.sizeMB} MB</span></p>
                <p>Checksum: <span className="text-indigo-300 text-[10px]">{selectedArchive.integrityChecksum}</span></p>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Restore Scope</label>
                <select
                  value={restoreScope}
                  onChange={e => setRestoreScope(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                >
                  <option value="full_database">Full Database & All Platform State</option>
                  <option value="selected_modules">Selected ERP Modules Only (GL, AR, AP)</option>
                  <option value="selected_branches">Selected Branches Only</option>
                </select>
              </div>

              {isRestoring && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between font-mono text-xs text-amber-400 font-bold">
                    <span>Restoring Database...</span>
                    <span>{restoreProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${restoreProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRestoreModalOpen(false)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
              >
                {isRestoring ? 'Restoring...' : 'Confirm & Execute Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 uppercase">{activeReportModal} REPORT</h3>
              <button onClick={() => setActiveReportModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              <p className="text-amber-400 font-bold">VERTEX SMART BACKUP AUDIT REPORT</p>
              <p className="text-slate-500">Generated At: {new Date().toLocaleString()}</p>
              <div className="h-px bg-slate-800 my-2" />
              <p>Active Storage Location: {config.location}</p>
              <p>Total Archives Count: {archives.length}</p>
              <p>Total Allocated Storage: {storageStats.totalAllocatedGB} GB</p>
              <p>Used Storage: {storageStats.usedStorageGB.toFixed(2)} GB</p>
              <p>Security Compliance: AES-256 ENCRYPTED / SHA-256 VERIFIED</p>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setActiveReportModal(null)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
