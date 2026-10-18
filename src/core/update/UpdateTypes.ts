export type UpdateChannel = 'stable' | 'beta' | 'enterprise' | 'internal' | 'offline';

export type UpdateStatus = 
  | 'up_to_date' 
  | 'update_available' 
  | 'downloading' 
  | 'download_paused' 
  | 'ready_to_install' 
  | 'installing' 
  | 'restart_required' 
  | 'failed' 
  | 'rolled_back';

export interface ReleaseNote {
  version: string;
  buildNumber: number;
  releaseDate: string;
  category: 'major' | 'minor' | 'security' | 'hotfix';
  title: string;
  highlights: string[];
  bugFixes: string[];
  breakingChanges: string[];
  downloadSizeMb: number;
  sha256Checksum: string;
  minSupportedVersion: string;
}

export interface SystemVersionInfo {
  currentVersion: string;
  currentBuildNumber: number;
  latestAvailableVersion: string;
  latestBuildNumber: number;
  releaseDate: string;
  channel: UpdateChannel;
  updateStatus: UpdateStatus;
  releaseNotes: ReleaseNote[];
}

export interface DownloaderConfig {
  maxThreads: number; // 1 - 8 threads
  bandwidthLimitKbps: number; // 0 = unlimited
  autoResume: boolean;
  verifyOnDownload: boolean;
}

export interface DownloadTask {
  id: string;
  version: string;
  totalBytes: number;
  downloadedBytes: number;
  progressPercentage: number;
  downloadSpeedKbps: number;
  activeThreads: number;
  status: 'idle' | 'downloading' | 'paused' | 'completed' | 'cancelled' | 'failed';
  estimatedTimeRemainingSeconds: number;
}

export interface PatchPackage {
  packageId: string;
  targetVersion: string;
  sourceVersion: string;
  sizeMb: number;
  sha256Checksum: string;
  signatureRsa: string;
  publisherName: string;
  publisherFingerprint: string;
  isOfflineFile: boolean;
}

export interface PatchOperationResult {
  success: boolean;
  stepName: string;
  backupSnapshotId?: string;
  timestamp: string;
  logs: string[];
  error?: string;
}

export interface VersionHistoryEntry {
  version: string;
  buildNumber: number;
  installedAt: string;
  installedBy: string;
  channel: UpdateChannel;
  backupSnapshotId: string;
  status: 'active' | 'archived' | 'rolled_back';
  releaseType: 'full' | 'delta_patch' | 'hotfix';
}

export interface SecurityCheckResult {
  signatureValid: boolean;
  sha256Match: boolean;
  publisherTrusted: boolean;
  tamperDetected: boolean;
  publisherName: string;
  certificateExpiry: string;
  checkTimestamp: string;
  securityVerdict: 'VERIFIED_TRUSTED' | 'TAMPERED_BLOCKED' | 'UNTRUSTED_PUBLISHER' | 'SIGNATURE_INVALID';
}

export interface MaintenanceWindowSpec {
  enabled: boolean;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startHourUtc: number; // e.g., 2 = 02:00 AM UTC
  durationHours: number;
  autoApproveHotfixes: boolean;
  silentMode: boolean;
  notifyUsersAheadMinutes: number;
}

export interface UpdateGeneratedDocs {
  updateGuide: string;
  patchGuide: string;
  rollbackGuide: string;
  developerNotes: string;
}
