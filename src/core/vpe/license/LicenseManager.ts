import { 
  LicenseProfile, 
  LicenseType, 
  LicenseStatus, 
  ActivationRecord, 
  SubscriptionHistoryItem,
  LicenseQuotaLimits,
  LicenseFeatureGrant
} from './LicenseTypes';
import { auditEngine } from '../../../services/auditEngine';

export class LicenseManager {
  private static instance: LicenseManager;
  private currentLicense: LicenseProfile;
  private activationHistory: ActivationRecord[] = [];
  private subscriptionHistory: SubscriptionHistoryItem[] = [];

  private constructor() {
    this.currentLicense = this.createDefaultEnterpriseLicense();
    this.seedDefaults();
  }

  public static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  private createDefaultEnterpriseLicense(): LicenseProfile {
    const dateNow = new Date();
    const expireDate = new Date();
    expireDate.setFullYear(dateNow.getFullYear() + 1);

    return {
      id: 'LIC-ENTERPRISE-2026-88',
      licenseKey: 'VRTX-ENT-2026-99A8-77B2-C4D1',
      licenseType: 'ENTERPRISE',
      status: 'ACTIVE',
      issuedToCompany: 'Vertex Global Enterprises Corp',
      issuedToContact: 'Alex Mercer (CTO)',
      contactEmail: 'alex.mercer@vertexglobal.org',
      hardwareFingerprint: 'HW-FINGERPRINT-SHA256-9981A7F4',
      machineBindingHash: 'MB-NODE-SRV-PROD-01-A99',
      editionName: 'Vertex Enterprise Ultimate Suite',
      billingCycle: 'YEARLY',
      issueDate: dateNow.toISOString(),
      expirationDate: expireDate.toISOString(),
      gracePeriodDaysRemaining: 14,
      autoRenew: true,
      digitalSignature: 'RSA4096-SIG-99A8F7E6D5C4B3A21098',
      encryptedKeyBundle: 'AES256-BUNDLE-x981273918273912837912',
      quotas: {
        maxUsers: 500,
        maxCompanies: 20,
        maxBranches: 100,
        maxDevices: 1000,
        maxStorageGB: 5000,
        maxMonthlyApiTransactions: 1000000
      },
      features: [
        { featureId: 'MOD_FINANCE', featureName: 'Financial Accounting & General Ledger', category: 'ERP_MODULE', isEnabled: true },
        { featureId: 'MOD_INVENTORY', featureName: 'Inventory & Warehouse Control', category: 'ERP_MODULE', isEnabled: true },
        { featureId: 'MOD_HRM', featureName: 'Human Resources & Global Payroll', category: 'ERP_MODULE', isEnabled: true },
        { featureId: 'MOD_CRM', featureName: 'CRM & Sales Pipeline', category: 'ERP_MODULE', isEnabled: true },
        { featureId: 'GOLD_FORECASTING', featureName: 'AI Demand Forecasting Suite', category: 'GOLD_FEATURE', isEnabled: true },
        { featureId: 'GOLD_BI_VISUALIZER', featureName: 'Executive BI & 3D Analytics', category: 'GOLD_FEATURE', isEnabled: true },
        { featureId: 'ENG_VSE', featureName: 'VPE-01 Universal Search Engine', category: 'PLATFORM_ENGINE', isEnabled: true },
        { featureId: 'ENG_VWE', featureName: 'VPE-02 Workflow Engine', category: 'PLATFORM_ENGINE', isEnabled: true },
        { featureId: 'ENG_VNE', featureName: 'VPE-03 Notification Engine', category: 'PLATFORM_ENGINE', isEnabled: true },
        { featureId: 'ENG_VRE', featureName: 'VPE-04 Reporting Engine', category: 'PLATFORM_ENGINE', isEnabled: true },
        { featureId: 'ENG_VIE', featureName: 'VPE-05 Integration Engine', category: 'PLATFORM_ENGINE', isEnabled: true },
        { featureId: 'AI_GEMINI_SUITE', featureName: 'Server-side Gemini Enterprise AI', category: 'AI_SERVICE', isEnabled: true }
      ]
    };
  }

  private seedDefaults(): void {
    this.activationHistory = [
      {
        id: 'ACT-001',
        licenseKey: this.currentLicense.licenseKey,
        activatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
        activationMethod: 'ONLINE',
        hardwareFingerprint: this.currentLicense.hardwareFingerprint,
        ipAddress: '192.168.10.45',
        machineName: 'PROD-SRV-NY-01',
        status: 'SUCCESS'
      }
    ];

    this.subscriptionHistory = [
      {
        id: 'SUB-INV-2026-01',
        licenseKey: this.currentLicense.licenseKey,
        billingCycle: 'YEARLY',
        amountPaid: 48000,
        invoiceNumber: 'INV-VLE-2026-9901',
        transactionDate: '2026-01-15T09:00:00Z',
        periodStart: '2026-01-15T00:00:00Z',
        periodEnd: '2027-01-15T00:00:00Z',
        paymentMethod: 'Corporate ACH Wire Transfer'
      }
    ];
  }

  public getCurrentLicense(): LicenseProfile {
    return this.currentLicense;
  }

  public getActivationHistory(): ActivationRecord[] {
    return this.activationHistory;
  }

  public getSubscriptionHistory(): SubscriptionHistoryItem[] {
    return this.subscriptionHistory;
  }

  public validateLicense(): { isValid: boolean; warnings: string[]; errors: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const now = new Date();
    const expire = new Date(this.currentLicense.expirationDate);

    if (this.currentLicense.status === 'TAMPERED') {
      errors.push('CRITICAL: License digital signature invalid or tamper detected!');
    } else if (this.currentLicense.status === 'SUSPENDED') {
      errors.push('License has been administratively suspended.');
    } else if (now > expire) {
      if (this.currentLicense.gracePeriodDaysRemaining > 0) {
        warnings.push(`License expired on ${expire.toLocaleDateString()}. Active under Grace Period (${this.currentLicense.gracePeriodDaysRemaining} days left).`);
      } else {
        errors.push(`License expired on ${expire.toLocaleDateString()}. Please renew subscription.`);
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  public validateFeature(featureId: string): boolean {
    const validation = this.validateLicense();
    if (!validation.isValid) return false;

    const feat = this.currentLicense.features.find(f => f.featureId === featureId);
    return feat ? feat.isEnabled : false;
  }

  public checkQuotaLimit(quotaKey: keyof LicenseQuotaLimits, currentUsage: number): { allowed: boolean; max: number; current: number } {
    const max = this.currentLicense.quotas[quotaKey];
    return {
      allowed: currentUsage <= max,
      max,
      current: currentUsage
    };
  }

  public activateLicenseKey(
    key: string, 
    method: 'ONLINE' | 'OFFLINE_FILE' | 'ACTIVATION_CODE', 
    hardwareFingerprint: string
  ): { success: boolean; message: string } {
    if (!key || key.length < 10) {
      this.recordActivationAttempt(key, method, hardwareFingerprint, 'FAILED_INVALID_KEY');
      return { success: false, message: 'Invalid activation key format.' };
    }

    const newProfile = this.generateProfileFromKey(key, method, hardwareFingerprint);
    this.currentLicense = newProfile;
    this.recordActivationAttempt(key, method, hardwareFingerprint, 'SUCCESS');

    auditEngine.logAction(
      'LICENSE_ACTIVATION',
      'VLE Engine',
      `Successfully activated license ${key} via ${method} method. Machine binding: ${hardwareFingerprint}`,
      'info',
      'VLE License Core'
    );

    return {
      success: true,
      message: `License successfully activated for ${newProfile.issuedToCompany} (${newProfile.licenseType} Edition).`
    };
  }

  private recordActivationAttempt(
    key: string, 
    method: 'ONLINE' | 'OFFLINE_FILE' | 'ACTIVATION_CODE', 
    hw: string, 
    status: 'SUCCESS' | 'FAILED_INVALID_KEY' | 'FAILED_HARDWARE_MISMATCH'
  ): void {
    const act: ActivationRecord = {
      id: `ACT-${Date.now().toString().slice(-4)}`,
      licenseKey: key,
      activatedAt: new Date().toISOString(),
      activationMethod: method,
      hardwareFingerprint: hw,
      ipAddress: '127.0.0.1',
      machineName: 'LOCAL-NODE-01',
      status
    };
    this.activationHistory.unshift(act);
  }

  private generateProfileFromKey(key: string, method: string, hw: string): LicenseProfile {
    const isTrial = key.includes('TRIAL');
    const isStd = key.includes('STD');
    const isDev = key.includes('DEV');
    const isEdu = key.includes('EDU');

    let type: LicenseType = 'ENTERPRISE';
    if (isTrial) type = 'TRIAL';
    else if (isStd) type = 'STANDARD';
    else if (isDev) type = 'DEVELOPER';
    else if (isEdu) type = 'EDUCATIONAL';

    const now = new Date();
    const expire = new Date();
    expire.setFullYear(now.getFullYear() + (type === 'TRIAL' ? 0.08 : 1));

    return {
      id: `LIC-${type}-${Date.now().toString().slice(-4)}`,
      licenseKey: key,
      licenseType: type,
      status: 'ACTIVE',
      issuedToCompany: 'Vertex Partner Organization',
      issuedToContact: 'License Administrator',
      contactEmail: 'admin@vertex-partner.org',
      hardwareFingerprint: hw,
      machineBindingHash: `MB-HASH-${hw}`,
      editionName: `Vertex ${type} Platform Edition`,
      billingCycle: 'YEARLY',
      issueDate: now.toISOString(),
      expirationDate: expire.toISOString(),
      gracePeriodDaysRemaining: 14,
      autoRenew: true,
      digitalSignature: `RSA4096-SIG-VALIDATED-${Date.now()}`,
      encryptedKeyBundle: `AES256-BUNDLE-${key.replace(/-/g, '')}`,
      quotas: {
        maxUsers: type === 'TRIAL' ? 10 : type === 'STANDARD' ? 50 : 500,
        maxCompanies: type === 'TRIAL' ? 1 : 10,
        maxBranches: type === 'TRIAL' ? 2 : 50,
        maxDevices: type === 'TRIAL' ? 20 : 500,
        maxStorageGB: 1000,
        maxMonthlyApiTransactions: 500000
      },
      features: this.currentLicense.features
    };
  }

  public updateAutoRenew(autoRenew: boolean): void {
    this.currentLicense.autoRenew = autoRenew;
    auditEngine.logAction(
      'LICENSE_AUTORENEW_UPDATE',
      'VLE Manager',
      `Auto-renewal setting updated to ${autoRenew}`,
      'info',
      'VLE Subscription'
    );
  }

  public triggerManualRenewal(): SubscriptionHistoryItem {
    const now = new Date();
    const nextExpire = new Date();
    nextExpire.setFullYear(now.getFullYear() + 1);

    this.currentLicense.expirationDate = nextExpire.toISOString();
    this.currentLicense.status = 'ACTIVE';

    const item: SubscriptionHistoryItem = {
      id: `SUB-INV-${Date.now().toString().slice(-4)}`,
      licenseKey: this.currentLicense.licenseKey,
      billingCycle: this.currentLicense.billingCycle,
      amountPaid: 48000,
      invoiceNumber: `INV-VLE-${Date.now().toString().slice(-4)}`,
      transactionDate: now.toISOString(),
      periodStart: now.toISOString(),
      periodEnd: nextExpire.toISOString(),
      paymentMethod: 'Auto-Renew Credit Gateway'
    };

    this.subscriptionHistory.unshift(item);

    auditEngine.logAction(
      'LICENSE_RENEWAL',
      'VLE Engine',
      `Manual subscription renewal processed. Extended until ${nextExpire.toLocaleDateString()}`,
      'info',
      'VLE Subscription Engine'
    );

    return item;
  }
}

export const licenseManager = LicenseManager.getInstance();
