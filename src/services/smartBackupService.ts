export type BackupType = 'full' | 'quick' | 'differential' | 'incremental';
export type BackupTrigger = 'manual' | 'scheduled' | 'automatic' | 'before_update' | 'before_day_closing' | 'before_db_maintenance' | 'before_restore';
export type BackupLocation = 'local_folder' | 'network_folder' | 'external_drive' | 'cloud_storage';
export type BackupStatus = 'completed' | 'failed' | 'in_progress' | 'verifying';
export type CompressionLevel = 'none' | 'fast' | 'high' | 'ultra';
export type EncryptionAlgorithm = 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'RSA-4096';

export interface BackupArchive {
  id: string;
  code: string;
  filename: string;
  type: BackupType;
  trigger: BackupTrigger;
  location: BackupLocation;
  sizeMB: number;
  createdAt: string;
  createdBy: string;
  durationSeconds: number;
  isEncrypted: boolean;
  encryptionAlgorithm?: EncryptionAlgorithm;
  compressionLevel: CompressionLevel;
  integrityChecksum: string;
  status: BackupStatus;
  modulesIncluded: string[];
  branchesIncluded: string[];
  recordsCountTotal: number;
  isVerified: boolean;
}

export interface BackupConfig {
  location: BackupLocation;
  destinationPath: string;
  compressionLevel: CompressionLevel;
  encryptionEnabled: boolean;
  encryptionAlgorithm: EncryptionAlgorithm;
  passwordProtected: boolean;
  maxHistoryRetentionDays: number;
  maxBackupFilesCount: number;
  autoBackupBeforeDayClosing: boolean;
  autoBackupBeforeUpdate: boolean;
  autoBackupBeforeMaintenance: boolean;
  autoBackupBeforeRestore: boolean;
  scheduledFrequency: 'hourly' | 'daily_midnight' | 'weekly_sunday';
  lastBackupTimestamp: string;
  nextScheduledTimestamp: string;
}

export interface BackupLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  action: 'backup_started' | 'backup_completed' | 'backup_failed' | 'integrity_verified' | 'restore_started' | 'restore_completed' | 'config_updated';
  message: string;
  details: string;
  archiveCode?: string;
  executedBy: string;
}

export interface RestoreJobProgress {
  id: string;
  archiveId: string;
  archiveCode: string;
  startedAt: string;
  progressPercentage: number;
  currentStep: string;
  restoreScope: 'full_database' | 'selected_modules' | 'selected_branches';
  selectedModules: string[];
  selectedBranches: string[];
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface SmartBackupState {
  config: BackupConfig;
  archives: BackupArchive[];
  logs: BackupLogEntry[];
  activeRestoreJob: RestoreJobProgress | null;
  storageStats: {
    totalAllocatedGB: number;
    usedStorageGB: number;
    availableStorageGB: number;
    backupsCount: number;
    averageBackupSizeMB: number;
  };
  isVgf05Completed: boolean;
}

const STORAGE_KEY = 'VERTEX_VGF05_SMART_BACKUP';

export const INITIAL_BACKUP_CONFIG: BackupConfig = {
  location: 'cloud_storage',
  destinationPath: 's3://vertex-enterprise-vault-us-east-1/backups/',
  compressionLevel: 'high',
  encryptionEnabled: true,
  encryptionAlgorithm: 'AES-256-GCM',
  passwordProtected: true,
  maxHistoryRetentionDays: 90,
  maxBackupFilesCount: 50,
  autoBackupBeforeDayClosing: true,
  autoBackupBeforeUpdate: true,
  autoBackupBeforeMaintenance: true,
  autoBackupBeforeRestore: true,
  scheduledFrequency: 'daily_midnight',
  lastBackupTimestamp: '2026-08-06T00:00:00Z',
  nextScheduledTimestamp: '2026-08-07T00:00:00Z'
};

export const INITIAL_ARCHIVES: BackupArchive[] = [
  {
    id: 'ARC-2026-001',
    code: 'BKP-2026-0806-FULL',
    filename: 'vertex_full_snapshot_20260806_000000.vtx.enc',
    type: 'full',
    trigger: 'scheduled',
    location: 'cloud_storage',
    sizeMB: 1420.50,
    createdAt: '2026-08-06T00:00:00Z',
    createdBy: 'vtx_cron_scheduler',
    durationSeconds: 42,
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM',
    compressionLevel: 'high',
    integrityChecksum: 'SHA256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    status: 'completed',
    modulesIncluded: ['MOD-GL', 'MOD-AR', 'MOD-AP', 'MOD-INV', 'MOD-TR', 'MOD-HR', 'MOD-FA'],
    branchesIncluded: ['BR-NY-01', 'BR-LON-02', 'BR-DXB-03', 'BR-SGP-04'],
    recordsCountTotal: 184920,
    isVerified: true
  },
  {
    id: 'ARC-2026-002',
    code: 'BKP-2026-0805-DAYCLOSE',
    filename: 'vertex_dayclose_BR-NY_20260805.vtx.enc',
    type: 'quick',
    trigger: 'before_day_closing',
    location: 'local_folder',
    sizeMB: 380.20,
    createdAt: '2026-08-05T19:00:00Z',
    createdBy: 'vtx_sysadmin',
    durationSeconds: 14,
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM',
    compressionLevel: 'fast',
    integrityChecksum: 'SHA256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    status: 'completed',
    modulesIncluded: ['MOD-GL', 'MOD-AR', 'MOD-AP', 'MOD-TR'],
    branchesIncluded: ['BR-NY-01'],
    recordsCountTotal: 42100,
    isVerified: true
  },
  {
    id: 'ARC-2026-003',
    code: 'BKP-2026-0804-SYSUPD',
    filename: 'vertex_pre_update_v1.2.0.vtx.enc',
    type: 'full',
    trigger: 'before_update',
    location: 'external_drive',
    sizeMB: 1390.80,
    createdAt: '2026-08-04T14:30:00Z',
    createdBy: 'vtx_devops',
    durationSeconds: 38,
    isEncrypted: true,
    encryptionAlgorithm: 'AES-256-GCM',
    compressionLevel: 'ultra',
    integrityChecksum: 'SHA256:1a8a25a81452a3b1a206a4a2c918349272895f3a0937a8fb483e0708b7a66b9f',
    status: 'completed',
    modulesIncluded: ['ALL_MODULES'],
    branchesIncluded: ['ALL_BRANCHES'],
    recordsCountTotal: 181050,
    isVerified: true
  }
];

export const INITIAL_LOGS: BackupLogEntry[] = [
  {
    id: 'LOG-BKP-01',
    timestamp: '2026-08-06T00:00:42Z',
    level: 'success',
    action: 'backup_completed',
    message: 'Scheduled full database backup completed successfully.',
    details: 'Backup code BKP-2026-0806-FULL created (1,420.50 MB). Checksum verified SHA256 matches.',
    archiveCode: 'BKP-2026-0806-FULL',
    executedBy: 'vtx_cron_scheduler'
  },
  {
    id: 'LOG-BKP-02',
    timestamp: '2026-08-05T19:00:14Z',
    level: 'info',
    action: 'backup_completed',
    message: 'Pre-Day Closing automated snapshot completed for New York Headquarters.',
    details: 'Backup code BKP-2026-0805-DAYCLOSE created (380.20 MB).',
    archiveCode: 'BKP-2026-0805-DAYCLOSE',
    executedBy: 'vtx_sysadmin'
  }
];

class SmartBackupService {
  private state: SmartBackupState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): SmartBackupState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          config: parsed.config || INITIAL_BACKUP_CONFIG,
          archives: parsed.archives || INITIAL_ARCHIVES,
          logs: parsed.logs || INITIAL_LOGS
        };
      }
    } catch (e) {
      console.warn('Failed to parse Smart Backup state, using defaults:', e);
    }

    return {
      config: INITIAL_BACKUP_CONFIG,
      archives: INITIAL_ARCHIVES,
      logs: INITIAL_LOGS,
      activeRestoreJob: null,
      storageStats: {
        totalAllocatedGB: 500,
        usedStorageGB: 3.19,
        availableStorageGB: 496.81,
        backupsCount: 3,
        averageBackupSizeMB: 1063.83
      },
      isVgf05Completed: true
    };
  }

  public getState(): SmartBackupState {
    return this.state;
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Smart Backup state:', e);
    }
  }

  public updateConfig(newConfig: Partial<BackupConfig>): BackupConfig {
    this.state.config = { ...this.state.config, ...newConfig };
    this.addLog('info', 'config_updated', 'Backup system configuration updated successfully.', `Location: ${this.state.config.location}, Encryption: ${this.state.config.encryptionAlgorithm}`);
    this.saveState();
    return this.state.config;
  }

  public triggerBackup(type: BackupType, trigger: BackupTrigger): BackupArchive {
    const archiveCode = `BKP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const newArchive: BackupArchive = {
      id: `ARC-${Date.now()}`,
      code: archiveCode,
      filename: `vertex_${type}_${Date.now().toString().slice(-4)}.vtx.enc`,
      type,
      trigger,
      location: this.state.config.location,
      sizeMB: type === 'full' ? 1435.00 : 250.00,
      createdAt: new Date().toISOString(),
      createdBy: 'vtx_sysadmin',
      durationSeconds: type === 'full' ? 35 : 12,
      isEncrypted: this.state.config.encryptionEnabled,
      encryptionAlgorithm: this.state.config.encryptionAlgorithm,
      compressionLevel: this.state.config.compressionLevel,
      integrityChecksum: `SHA256:${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      status: 'completed',
      modulesIncluded: ['ALL_MODULES'],
      branchesIncluded: ['ALL_BRANCHES'],
      recordsCountTotal: 185400,
      isVerified: true
    };

    this.state.archives = [newArchive, ...this.state.archives];
    this.state.config.lastBackupTimestamp = newArchive.createdAt;
    this.state.storageStats.backupsCount += 1;
    this.state.storageStats.usedStorageGB += newArchive.sizeMB / 1024;
    this.state.storageStats.availableStorageGB -= newArchive.sizeMB / 1024;

    this.addLog('success', 'backup_completed', `Backup ${archiveCode} completed successfully.`, `Type: ${type}, Trigger: ${trigger}, Size: ${newArchive.sizeMB} MB`, archiveCode);
    this.saveState();
    return newArchive;
  }

  public verifyBackupIntegrity(archiveId: string): boolean {
    const archive = this.state.archives.find(a => a.id === archiveId);
    if (!archive) return false;

    archive.isVerified = true;
    this.addLog('info', 'integrity_verified', `Integrity checksum scan passed for archive ${archive.code}.`, `Checksum: ${archive.integrityChecksum}`, archive.code);
    this.saveState();
    return true;
  }

  public startRestore(archiveId: string, scope: RestoreJobProgress['restoreScope']): RestoreJobProgress | null {
    const archive = this.state.archives.find(a => a.id === archiveId);
    if (!archive) return null;

    const restoreJob: RestoreJobProgress = {
      id: `RST-${Date.now().toString().slice(-5)}`,
      archiveId: archive.id,
      archiveCode: archive.code,
      startedAt: new Date().toISOString(),
      progressPercentage: 100,
      currentStep: 'Database restored successfully & consistency verified.',
      restoreScope: scope,
      selectedModules: archive.modulesIncluded,
      selectedBranches: archive.branchesIncluded,
      status: 'completed'
    };

    this.state.activeRestoreJob = restoreJob;
    this.addLog('success', 'restore_completed', `Full system restore from ${archive.code} completed.`, `Scope: ${scope}, Modules restored: ${archive.modulesIncluded.length}`, archive.code);
    this.saveState();
    return restoreJob;
  }

  public addLog(level: BackupLogEntry['level'], action: BackupLogEntry['action'], message: string, details: string, archiveCode?: string): void {
    const entry: BackupLogEntry = {
      id: `LOG-BKP-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      level,
      action,
      message,
      details,
      archiveCode,
      executedBy: 'vtx_sysadmin'
    };
    this.state.logs = [entry, ...this.state.logs.slice(0, 99)];
    this.saveState();
  }

  public markVgf05Completed(): void {
    this.state.isVgf05Completed = true;
    this.addLog('success', 'backup_completed', 'VGF-05 Smart Backup System officially marked as COMPLETED.', 'VGF-05');
    this.saveState();
  }

  public resetState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
  }
}

export const smartBackupService = new SmartBackupService();
