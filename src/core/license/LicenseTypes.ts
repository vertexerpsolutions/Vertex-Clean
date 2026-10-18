export type LicenseType = 
  | 'trial'
  | 'personal'
  | 'professional'
  | 'enterprise'
  | 'government'
  | 'educational'
  | 'lifetime'
  | 'subscription'
  | 'offline'
  | 'cloud';

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED' | 'PENDING_ACTIVATION';

export interface CustomerInfo {
  companyName: string;
  contactEmail: string;
  accountManager: string;
  supportTier: 'Standard 8x5' | 'Enterprise 24/7 Gold' | 'Government Platinum';
  tierLevel: string;
}

export interface RegisteredDevice {
  deviceId: string;
  deviceName: string;
  hardwareFingerprint: string;
  ipAddress: string;
  osVersion: string;
  activatedAt: string;
  lastHeartbeatAt: string;
  status: 'ACTIVE' | 'OFFLINE' | 'REVOKED';
}

export interface LicenseDashboardInfo {
  licenseKey: string;
  type: LicenseType;
  status: LicenseStatus;
  activationStatus: 'ACTIVATED' | 'OFFLINE_ACTIVATED' | 'NOT_ACTIVATED';
  issuedAt: string;
  expirationDate: string;
  customer: CustomerInfo;
  maxActivationsAllowed: number;
  remainingActivations: number;
  registeredDevices: RegisteredDevice[];
  licenseHealthScore: number; // 0 - 100
  rsaSignatureValid: boolean;
  tamperCheckPassed: boolean;
}

export interface ActivationRecord {
  id: string;
  licenseKey: string;
  method: 'ONLINE' | 'OFFLINE_BLOB';
  hardwareFingerprint: string;
  deviceName: string;
  timestamp: string;
  status: 'SUCCESS' | 'DENIED';
  ipAddress: string;
}

export interface ProductDistributionPackage {
  id: string;
  packageName: string;
  edition: 'Portable Edition' | 'Desktop Edition' | 'Enterprise Edition' | 'Cloud Edition';
  format: 'SETUP_EXE' | 'MSI_INSTALLER' | 'ZIP_PACKAGE' | 'DOCKER_IMAGE';
  version: string;
  sizeMb: number;
  sha256Checksum: string;
  downloadUrl: string;
  targetOs: string;
}

export interface ReleaseUpdateItem {
  version: string;
  channel: 'BETA' | 'STABLE' | 'HOTFIX';
  releaseDate: string;
  downloadSizeMb: number;
  summary: string;
  patchUrl: string;
  requiresLicenseRenewal: boolean;
}

export interface PortalPurchaseHistory {
  id: string;
  invoiceId: string;
  date: string;
  licenseType: LicenseType;
  seatsCount: number;
  amountUsd: number;
  status: 'PAID' | 'REFUNDED';
}

export interface SupportRequest {
  id: string;
  ticketNumber: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  priority: 'HIGH' | 'CRITICAL' | 'NORMAL';
}

export interface DistributionAnalytics {
  totalInstalledCopies: number;
  totalActiveLicenses: number;
  activeDevicesCount: number;
  activationSuccessRatePercentage: number;
  regionalBreakdown: { region: string; count: number }[];
  versionUsageBreakdown: { version: string; percentage: number }[];
}

export interface SecurityAudit {
  rsaKeyFingerprint: string;
  antiTamperShieldActive: boolean;
  antiCrackValidationStatus: 'VERIFIED' | 'TAMPER_DETECTED';
  encryptedLicenseVaultRef: string;
  lastSecurityCheckTimestamp: string;
}

export interface LicenseGeneratedDocs {
  licenseGuide: string;
  deploymentGuide: string;
  distributionGuide: string;
  developerNotes: string;
  administratorGuide: string;
}
