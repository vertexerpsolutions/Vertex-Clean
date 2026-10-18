export type BackupEnvironment = 'desktop' | 'cloud' | 'hybrid';

export type BackupAssetCategory =
  | 'application_files'
  | 'database'
  | 'configurations'
  | 'licenses'
  | 'system_logs'
  | 'attachments'
  | 'user_settings';

export interface BackupAssetRequirement {
  id: string;
  category: BackupAssetCategory;
  name: string;
  sourcePath: string;
  sizeMb: number;
  criticality: 'critical' | 'high' | 'medium' | 'standard';
  description: string;
  desktopSupported: boolean;
  cloudSupported: boolean;
  hybridSupported: boolean;
}

export type BackupType = 'full' | 'incremental' | 'differential' | 'scheduled' | 'manual' | 'cloud_sync';

export interface BackupJobSpec {
  id: string;
  name: string;
  type: BackupType;
  environment: BackupEnvironment;
  scheduleCron: string;
  lastRunTimestamp: string;
  nextRunTimestamp: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  totalSizeMb: number;
  compressedSizeMb: number;
  sha256Checksum: string;
  destinationLocation: string;
  retentionDays: number;
}

export type RestoreType = 'full' | 'partial' | 'point_in_time' | 'configuration' | 'database' | 'file_level';

export interface RestorePoint {
  id: string;
  backupJobId: string;
  timestamp: string;
  type: BackupType;
  environment: BackupEnvironment;
  sizeMb: number;
  checksum: string;
  canPointInTimeRestore: boolean;
  snapshotState: string;
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  targetEnvironment: BackupEnvironment;
  targetRTOSeconds: number; // Recovery Time Objective
  targetRPOSeconds: number; // Recovery Point Objective
  status: 'active_standby' | 'testing' | 'recovering' | 'ready';
  lastValidated: string;
  checklistItems: {
    id: string;
    stepOrder: number;
    title: string;
    description: string;
    automationScript: string;
    status: 'pending' | 'in_progress' | 'passed' | 'failed';
  }[];
}

export interface RedundancyConfig {
  primaryStoragePool: string;
  redundantStoragePool: string;
  cloudReplicationEnabled: boolean;
  secondaryCloudRegion: string;
  backupLocations: {
    id: string;
    name: string;
    type: 'local_nvme' | 'san_nas' | 'gcp_storage_bucket' | 'aws_s3_glacier';
    pathOrUri: string;
    active: boolean;
    freeSpaceGb: number;
  }[];
  integrityAutoVerificationEnabled: boolean;
  verificationIntervalHours: number;
}

export interface BackupSecurityConfig {
  encryptionAlgorithm: 'AES-256-GCM' | 'RSA-4096-AES-HYBRID';
  kmsKeyAlias: string;
  requireAuthForRestore: boolean;
  mfaRequiredForDisasterRecovery: boolean;
  allowedRolesForRestore: string[];
  auditLoggingEnabled: boolean;
  immutableWormStorageEnabled: boolean; // Write Once Read Many
}

export interface BackupAuditLog {
  id: string;
  timestamp: string;
  operator: string;
  action: 'BACKUP_STARTED' | 'BACKUP_COMPLETED' | 'RESTORE_EXECUTED' | 'DR_PLAN_RUN' | 'KEYS_ROTATED';
  details: string;
  status: 'success' | 'warning' | 'failure';
  ipAddress: string;
}

export interface BackupValidationReport {
  timestamp: string;
  backupIntegrityScore: number; // e.g. 100%
  restoreProcessScore: number;
  measuredRTOSeconds: number; // e.g. 14 seconds
  measuredRPOSeconds: number; // e.g. 0 seconds
  recoverySuccessRate: number; // e.g. 99.9%
  overallReadiness: 'DISASTER_READY' | 'NEEDS_ATTENTION' | 'NON_COMPLIANT';
  checkItems: {
    name: string;
    category: string;
    status: 'passed' | 'warning' | 'failed';
    details: string;
  }[];
}

export interface BackupGeneratedDocs {
  backupGuide: string;
  recoveryGuide: string;
  disasterRecoveryPlanDoc: string;
  architectureDoc: string;
  developerNotes: string;
}
