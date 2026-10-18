export type LicenseType = 
  | 'TRIAL'
  | 'STANDARD'
  | 'PROFESSIONAL'
  | 'ENTERPRISE'
  | 'DEVELOPER'
  | 'EDUCATIONAL'
  | 'LIFETIME'
  | 'SUBSCRIPTION';

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'GRACE_PERIOD' | 'SUSPENDED' | 'TAMPERED';

export type SubscriptionBillingCycle = 'MONTHLY' | 'YEARLY' | 'PERPETUAL';

export interface LicenseFeatureGrant {
  featureId: string;
  featureName: string;
  category: 'ERP_MODULE' | 'GOLD_FEATURE' | 'PLATFORM_ENGINE' | 'AI_SERVICE' | 'REPORTING';
  isEnabled: boolean;
  maxCapacity?: number;
}

export interface LicenseQuotaLimits {
  maxUsers: number;
  maxCompanies: number;
  maxBranches: number;
  maxDevices: number;
  maxStorageGB: number;
  maxMonthlyApiTransactions: number;
}

export interface LicenseProfile {
  id: string;
  licenseKey: string;
  licenseType: LicenseType;
  status: LicenseStatus;
  issuedToCompany: string;
  issuedToContact: string;
  contactEmail: string;
  hardwareFingerprint: string;
  machineBindingHash: string;
  editionName: string;
  billingCycle: SubscriptionBillingCycle;
  issueDate: string;
  expirationDate: string;
  gracePeriodDaysRemaining: number;
  autoRenew: boolean;
  digitalSignature: string;
  encryptedKeyBundle: string;
  quotas: LicenseQuotaLimits;
  features: LicenseFeatureGrant[];
}

export interface ActivationRecord {
  id: string;
  licenseKey: string;
  activatedAt: string;
  activationMethod: 'ONLINE' | 'OFFLINE_FILE' | 'ACTIVATION_CODE';
  hardwareFingerprint: string;
  ipAddress: string;
  machineName: string;
  status: 'SUCCESS' | 'FAILED_INVALID_KEY' | 'FAILED_HARDWARE_MISMATCH';
}

export interface SubscriptionHistoryItem {
  id: string;
  licenseKey: string;
  billingCycle: SubscriptionBillingCycle;
  amountPaid: number;
  invoiceNumber: string;
  transactionDate: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
}
