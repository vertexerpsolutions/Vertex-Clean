export type PortableDeviceStatus = 'ACTIVE' | 'DISCONNECTED' | 'SYNCING' | 'LOCKED';

export type ZeroInstallStatus = 'READY' | 'RUNNING' | 'CACHE_VALIDATED' | 'CORRUPTED';

export interface PortableVolumeInfo {
  volumeId: string;
  driveLabel: string;
  mountPoint: string;
  fsType: 'NTFS-Portable' | 'exFAT-Encrypted' | 'ext4-LUKS';
  totalCapacityMb: number;
  freeCapacityMb: number;
  isEncrypted: boolean;
  hardwareVendor: string;
  serialNumber: string;
}

export interface PortableDatabaseConfig {
  dbEngine: 'SQLite Embedded' | 'DuckDB Analytics' | 'Embedded RocksDB';
  dbPath: string;
  isEncrypted: boolean;
  dbSizeMb: number;
  lastSyncTimestamp: string;
}

export interface PortableDashboardInfo {
  volume: PortableVolumeInfo;
  zeroInstallStatus: ZeroInstallStatus;
  dbConfig: PortableDatabaseConfig;
  healthScore: number;
  activeSessionUser: string;
  totalSyncEvents: number;
  isMounted: boolean;
}

export interface PortableSyncLog {
  id: string;
  timestamp: string;
  direction: 'LOCAL_TO_CLOUD' | 'CLOUD_TO_LOCAL';
  changedRecordsCount: number;
  status: 'SUCCESS' | 'CONFLICT_RESOLVED' | 'PENDING';
  targetCloudEndpoint: string;
}

export interface PortableSecurityAudit {
  isVolumeEncrypted: boolean;
  hardwareEncryptionActive: boolean;
  aes256KeyFingerprint: string;
  tamperCheckPassed: boolean;
  lastAuditTimestamp: string;
}

export interface PortableGeneratedDocs {
  portableGuide: string;
  zeroInstallManual: string;
  storageSpecs: string;
  syncArchitecture: string;
  administratorManual: string;
}
