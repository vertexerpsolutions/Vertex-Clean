// Vertex ERP Ultimate - VDP-02 Desktop Edition Types

export type WindowState = 'normal' | 'maximized' | 'minimized' | 'fullscreen';

export interface DisplayMonitorSpec {
  id: string;
  name: string;
  resolution: string;
  isPrimary: boolean;
  scaleFactor: number;
}

export interface ApplicationMenuItem {
  id: string;
  label: string;
  shortcut?: string;
  enabled: boolean;
  action: string;
}

export interface DesktopSystemTrayConfig {
  enabled: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  unreadNotificationsCount: number;
  statusIndicator: 'online' | 'offline' | 'syncing';
}

export interface LocalStorageQuota {
  configSizeKb: number;
  userSettingsSizeKb: number;
  logsSizeKb: number;
  tempFilesSizeKb: number;
  cacheSizeKb: number;
  offlineDataSizeKb: number;
  totalAllocatedMb: number;
}

export interface OfflineSyncQueueItem {
  id: string;
  timestamp: string;
  actionType: 'CREATE_TRANSACTION' | 'UPDATE_LEDGER' | 'POST_DOCUMENT' | 'AUDIT_LOG';
  entityName: string;
  payload: Record<string, any>;
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  attempts: number;
  errorMessage?: string;
}

export interface HardwarePrintJob {
  jobId: string;
  documentTitle: string;
  printerName: string;
  pages: number;
  status: 'queued' | 'printing' | 'completed' | 'failed';
  timestamp: string;
}

export interface MachineIdentity {
  machineGuid: string;
  osName: string;
  osArch: string;
  hostname: string;
  cpuModel: string;
  totalRamGb: number;
  isVirtualMachine: boolean;
  licenseHash: string;
  licenseValid: boolean;
}

export interface EncryptedLocalVaultStatus {
  isVaultEncrypted: boolean;
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2-SHA256 (100,000 iterations)';
  sessionProtected: boolean;
  masterKeyPresent: boolean;
}

export interface DesktopValidationReport {
  timestamp: string;
  compatibilityPassed: boolean;
  offlineReadinessScore: number;
  memoryUsageMb: number;
  cpuUsagePct: number;
  stabilityScore: number;
  overallStatus: 'passed' | 'warning' | 'failed';
  checkItems: {
    name: string;
    category: string;
    status: 'passed' | 'warning' | 'failed';
    details: string;
  }[];
}

export interface DesktopGeneratedDocs {
  editionGuide: string;
  architectureSpec: string;
  installationNotes: string;
  developerNotes: string;
}
