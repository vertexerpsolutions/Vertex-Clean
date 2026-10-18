// Vertex ERP Ultimate - VDP-05 Installer & Auto Update Types

export type InstallationMode = 'standard' | 'silent' | 'custom' | 'upgrade' | 'repair' | 'uninstall';

export type WizardStep = 'welcome' | 'license' | 'prerequisites' | 'path' | 'progress' | 'completion';

export interface PrerequisiteCheck {
  name: string;
  required: string;
  detected: string;
  status: 'passed' | 'warning' | 'failed';
}

export interface SoftwareReleaseSpec {
  version: string;
  releaseDate: string;
  releaseNotes: string[];
  packageSizeMb: number;
  sha256Hash: string;
  isMandatory: boolean;
  status: 'available' | 'downloading' | 'ready_to_install' | 'installed' | 'rolled_back';
}

export interface EnterpriseLicenseKey {
  licenseKey: string;
  organizationName: string;
  tier: 'Enterprise Unlimited' | 'Business Multi-Tenant' | 'Developer Sandbox';
  maxSeats: number;
  assignedMachineHash: string;
  subscriptionExpires: string;
  status: 'active' | 'grace_period' | 'expired' | 'unassigned';
  offlineSignature: string;
}

export interface SystemConfigProfile {
  installDirectory: string;
  dbConnectionString: string;
  cloudEndpointUrl: string;
  desktopVaultPath: string;
  hybridSyncEnabled: boolean;
  autoUpdateBranch: 'stable' | 'beta' | 'enterprise_lts';
}

export interface RecoverySnapshot {
  snapshotId: string;
  timestamp: string;
  version: string;
  reason: string;
  configBackupSizeKb: number;
  status: 'valid' | 'restoring' | 'restored';
}

export interface InstallerValidationReport {
  timestamp: string;
  installationIntegrityScore: number;
  updateRollbackReadinessScore: number;
  licenseAuthenticityScore: number;
  recoveryReadinessScore: number;
  overallStatus: 'passed' | 'warning' | 'failed';
  checkItems: {
    name: string;
    category: string;
    status: 'passed' | 'warning' | 'failed';
    details: string;
  }[];
}

export interface InstallerGeneratedDocs {
  installerGuide: string;
  updateGuide: string;
  recoveryGuide: string;
  deploymentNotes: string;
  developerNotes: string;
}
