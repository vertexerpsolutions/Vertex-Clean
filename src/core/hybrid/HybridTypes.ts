// Vertex ERP Ultimate - VDP-04 Hybrid Edition Types

export type HybridConnectivityMode = 'online' | 'offline' | 'auto_switch';

export type SyncConflictPolicy = 'cloud_wins' | 'local_wins' | 'manual_review' | 'timestamp_merge';

export interface HybridSyncQueueItem {
  id: string;
  timestamp: string;
  entityName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE' | 'POST_JOURNAL';
  payload: Record<string, any>;
  status: 'pending' | 'syncing' | 'synced' | 'conflict' | 'failed';
  attempts: number;
  conflictDetails?: string;
  checksum: string;
}

export interface HybridDeviceRegistration {
  deviceId: string;
  deviceName: string;
  machineGuid: string;
  tenantId: string;
  lastSyncTimestamp: string;
  status: 'Registered' | 'Pending Approval' | 'Revoked';
  encryptionKeyFingerprint: string;
}

export interface HybridConsistencyCheck {
  entityType: string;
  localRecordCount: number;
  cloudRecordCount: number;
  unmatchedRecords: number;
  status: 'In Sync' | 'Drift Detected' | 'Sync In Progress';
  lastValidated: string;
}

export interface HybridValidationReport {
  timestamp: string;
  syncSuccessRatePct: number;
  offlineSwitchLatencyMs: number;
  dataIntegrityScore: number;
  hybridReadinessScore: number;
  overallStatus: 'passed' | 'warning' | 'failed';
  checkItems: {
    name: string;
    category: string;
    status: 'passed' | 'warning' | 'failed';
    details: string;
  }[];
}

export interface HybridGeneratedDocs {
  hybridGuide: string;
  syncDiagram: string;
  offlineGuide: string;
  developerNotes: string;
}
