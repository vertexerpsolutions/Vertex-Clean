import {
  LicenseType,
  LicenseStatus,
  LicenseDashboardInfo,
  ActivationRecord,
  ProductDistributionPackage,
  ReleaseUpdateItem,
  PortalPurchaseHistory,
  SupportRequest,
  DistributionAnalytics,
  SecurityAudit,
  LicenseGeneratedDocs,
  RegisteredDevice
} from './LicenseTypes';

export class LicenseManager {
  private static instance: LicenseManager;

  private dashboardInfo: LicenseDashboardInfo = {
    licenseKey: 'VTX-ULTIMATE-2026-99A8-77B2-C3D4',
    type: 'enterprise',
    status: 'ACTIVE',
    activationStatus: 'ACTIVATED',
    issuedAt: '2026-01-01T00:00:00.000Z',
    expirationDate: '2027-12-31T23:59:59.000Z',
    customer: {
      companyName: 'Global Vertex Enterprise Corp',
      contactEmail: 'cto@vertex-corp.global',
      accountManager: 'Sarah Jenkins (Enterprise Lead)',
      supportTier: 'Enterprise 24/7 Gold',
      tierLevel: 'Tier 1 Global Unlimited'
    },
    maxActivationsAllowed: 50,
    remainingActivations: 42,
    registeredDevices: [
      {
        deviceId: 'dev-node-uk-01',
        deviceName: 'Vertex-Mainframe-London-Pod1',
        hardwareFingerprint: 'HWID-9988-A7F3-4410-BC22-E311',
        ipAddress: '10.240.12.88',
        osVersion: 'Ubuntu 24.04 LTS (x86_64)',
        activatedAt: '2026-01-05T09:12:00.000Z',
        lastHeartbeatAt: '2026-08-07T06:10:00.000Z',
        status: 'ACTIVE'
      },
      {
        deviceId: 'dev-node-us-02',
        deviceName: 'Vertex-East-AWS-Cluster-Pod4',
        hardwareFingerprint: 'HWID-7722-B9D1-1100-FF44-A009',
        ipAddress: '10.120.45.12',
        osVersion: 'RedHat Enterprise Linux 9.4',
        activatedAt: '2026-02-10T14:22:00.000Z',
        lastHeartbeatAt: '2026-08-07T06:12:00.000Z',
        status: 'ACTIVE'
      }
    ],
    licenseHealthScore: 100,
    rsaSignatureValid: true,
    tamperCheckPassed: true
  };

  private activationHistory: ActivationRecord[] = [
    {
      id: 'act-101',
      licenseKey: 'VTX-ULTIMATE-2026-99A8-77B2-C3D4',
      method: 'ONLINE',
      hardwareFingerprint: 'HWID-9988-A7F3-4410-BC22-E311',
      deviceName: 'Vertex-Mainframe-London-Pod1',
      timestamp: '2026-01-05T09:12:00.000Z',
      status: 'SUCCESS',
      ipAddress: '10.240.12.88'
    },
    {
      id: 'act-102',
      licenseKey: 'VTX-ULTIMATE-2026-99A8-77B2-C3D4',
      method: 'OFFLINE_BLOB',
      hardwareFingerprint: 'HWID-7722-B9D1-1100-FF44-A009',
      deviceName: 'Vertex-East-AWS-Cluster-Pod4',
      timestamp: '2026-02-10T14:22:00.000Z',
      status: 'SUCCESS',
      ipAddress: '10.120.45.12'
    }
  ];

  private packages: ProductDistributionPackage[] = [
    {
      id: 'pkg-01',
      packageName: 'Vertex ERP Enterprise Unlimited Edition',
      edition: 'Enterprise Edition',
      format: 'SETUP_EXE',
      version: 'v1.0.0-Stable',
      sizeMb: 850,
      sha256Checksum: 'a89c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c',
      downloadUrl: 'https://downloads.vertex.com/dist/vertex-erp-v1.0-enterprise-setup.exe',
      targetOs: 'Windows Server 2022 / Windows 11'
    },
    {
      id: 'pkg-02',
      packageName: 'Vertex ERP Portable Standalone Package',
      edition: 'Portable Edition',
      format: 'ZIP_PACKAGE',
      version: 'v1.0.0-Portable',
      sizeMb: 420,
      sha256Checksum: 'f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9',
      downloadUrl: 'https://downloads.vertex.com/dist/vertex-erp-v1.0-portable.zip',
      targetOs: 'Cross-Platform Node.js Runtime'
    },
    {
      id: 'pkg-03',
      packageName: 'Vertex ERP Cloud Container Image',
      edition: 'Cloud Edition',
      format: 'DOCKER_IMAGE',
      version: 'v1.0.0-CloudRun',
      sizeMb: 610,
      sha256Checksum: 'c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2',
      downloadUrl: 'https://downloads.vertex.com/dist/vertex-erp-v1.0-cloudrun.tar.gz',
      targetOs: 'Linux CloudRun / Kubernetes Container'
    }
  ];

  private releases: ReleaseUpdateItem[] = [
    {
      version: 'v1.0.0',
      channel: 'STABLE',
      releaseDate: '2026-08-01',
      downloadSizeMb: 850,
      summary: 'Vertex ERP Ultimate v1.0 Production Launch Release with complete VDP engines.',
      patchUrl: 'https://updates.vertex.com/patches/v1.0.0-stable.patch',
      requiresLicenseRenewal: false
    },
    {
      version: 'v1.0.1-hotfix',
      channel: 'HOTFIX',
      releaseDate: '2026-08-05',
      downloadSizeMb: 12,
      summary: 'Critical security update for VDP-09 secret vault KMS rotation handlers.',
      patchUrl: 'https://updates.vertex.com/patches/v1.0.1-sec-hotfix.patch',
      requiresLicenseRenewal: false
    },
    {
      version: 'v1.1.0-beta1',
      channel: 'BETA',
      releaseDate: '2026-08-06',
      downloadSizeMb: 880,
      summary: 'Beta release featuring AI Autopilot v2 with streaming Gemini forecast graph preview.',
      patchUrl: 'https://updates.vertex.com/patches/v1.1.0-beta1.patch',
      requiresLicenseRenewal: false
    }
  ];

  private purchases: PortalPurchaseHistory[] = [
    {
      id: 'pur-2026-001',
      invoiceId: 'INV-VTX-998811',
      date: '2026-01-01',
      licenseType: 'enterprise',
      seatsCount: 50,
      amountUsd: 49500,
      status: 'PAID'
    },
    {
      id: 'pur-2025-080',
      invoiceId: 'INV-VTX-776600',
      date: '2025-12-15',
      licenseType: 'professional',
      seatsCount: 10,
      amountUsd: 8500,
      status: 'PAID'
    }
  ];

  private supportTickets: SupportRequest[] = [
    {
      id: 'tkt-901',
      ticketNumber: 'SUP-2026-4412',
      subject: 'Offline activation license blob request for disconnected air-gapped pod',
      status: 'RESOLVED',
      createdAt: '2026-08-02T11:00:00.000Z',
      priority: 'HIGH'
    },
    {
      id: 'tkt-902',
      ticketNumber: 'SUP-2026-4490',
      subject: 'Request for secondary KMS RSA public signing certificate bundle',
      status: 'IN_PROGRESS',
      createdAt: '2026-08-06T15:30:00.000Z',
      priority: 'NORMAL'
    }
  ];

  private analytics: DistributionAnalytics = {
    totalInstalledCopies: 14200,
    totalActiveLicenses: 890,
    activeDevicesCount: 38400,
    activationSuccessRatePercentage: 99.8,
    regionalBreakdown: [
      { region: 'North America (US-East/West)', count: 18200 },
      { region: 'Europe (UK / Germany)', count: 12400 },
      { region: 'Asia Pacific (Tokyo / Singapore)', count: 7800 }
    ],
    versionUsageBreakdown: [
      { version: 'v1.0.0-Stable', percentage: 88.5 },
      { version: 'v1.0.1-Hotfix', percentage: 9.2 },
      { version: 'v1.1.0-Beta', percentage: 2.3 }
    ]
  };

  private securityAudit: SecurityAudit = {
    rsaKeyFingerprint: 'RSA-4096-SHA512-VTX-SIG-99A8B7C6D5E4F3A2',
    antiTamperShieldActive: true,
    antiCrackValidationStatus: 'VERIFIED',
    encryptedLicenseVaultRef: 'kms://projects/vertex/keyRings/prod/cryptoKeys/license-cert',
    lastSecurityCheckTimestamp: '2026-08-07T06:12:00.000Z'
  };

  private constructor() {}

  public static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  // Phase 01: License Dashboard
  public getDashboardInfo(): LicenseDashboardInfo {
    return this.dashboardInfo;
  }

  // Phase 02: License Types
  public switchLicenseType(type: LicenseType): LicenseDashboardInfo {
    this.dashboardInfo = {
      ...this.dashboardInfo,
      type
    };
    return this.dashboardInfo;
  }

  // Phase 03: Activation Engine
  public activateOnline(key: string, deviceName: string): ActivationRecord {
    const record: ActivationRecord = {
      id: `act-${Date.now().toString().slice(-6)}`,
      licenseKey: key,
      method: 'ONLINE',
      hardwareFingerprint: `HWID-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      deviceName,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      ipAddress: '10.240.88.199'
    };

    this.activationHistory.unshift(record);
    this.dashboardInfo.remainingActivations = Math.max(0, this.dashboardInfo.remainingActivations - 1);
    this.dashboardInfo.registeredDevices.push({
      deviceId: `dev-${Date.now().toString().slice(-6)}`,
      deviceName,
      hardwareFingerprint: record.hardwareFingerprint,
      ipAddress: record.ipAddress,
      osVersion: 'Windows 11 Enterprise (x86_64)',
      activatedAt: record.timestamp,
      lastHeartbeatAt: record.timestamp,
      status: 'ACTIVE'
    });

    return record;
  }

  public activateOffline(key: string, offlineBlob: string): ActivationRecord {
    const record: ActivationRecord = {
      id: `act-off-${Date.now().toString().slice(-6)}`,
      licenseKey: key,
      method: 'OFFLINE_BLOB',
      hardwareFingerprint: 'HWID-OFFLINE-AIRGAP-8811',
      deviceName: 'AirGapped-Vault-Node',
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      ipAddress: '127.0.0.1 (Offline AirGap)'
    };

    this.activationHistory.unshift(record);
    this.dashboardInfo.activationStatus = 'OFFLINE_ACTIVATED';
    return record;
  }

  public getActivationHistory(): ActivationRecord[] {
    return this.activationHistory;
  }

  // Phase 04: License Server
  public revokeDevice(deviceId: string): LicenseDashboardInfo {
    this.dashboardInfo.registeredDevices = this.dashboardInfo.registeredDevices.map(d => {
      if (d.deviceId === deviceId) {
        return { ...d, status: 'REVOKED' };
      }
      return d;
    });
    this.dashboardInfo.remainingActivations += 1;
    return this.dashboardInfo;
  }

  public renewLicense(years: number): LicenseDashboardInfo {
    const currentExp = new Date(this.dashboardInfo.expirationDate);
    currentExp.setFullYear(currentExp.getFullYear() + years);
    this.dashboardInfo.expirationDate = currentExp.toISOString();
    this.dashboardInfo.status = 'ACTIVE';
    return this.dashboardInfo;
  }

  // Phase 05: Product Distribution
  public getPackages(): ProductDistributionPackage[] {
    return this.packages;
  }

  // Phase 06: Update Distribution
  public getReleases(): ReleaseUpdateItem[] {
    return this.releases;
  }

  // Phase 07: Customer Portal
  public getPurchases(): PortalPurchaseHistory[] {
    return this.purchases;
  }

  public getSupportTickets(): SupportRequest[] {
    return this.supportTickets;
  }

  public createSupportTicket(subject: string, priority: 'HIGH' | 'CRITICAL' | 'NORMAL'): SupportRequest {
    const tkt: SupportRequest = {
      id: `tkt-${Date.now().toString().slice(-6)}`,
      ticketNumber: `SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      subject,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      priority
    };
    this.supportTickets.unshift(tkt);
    return tkt;
  }

  // Phase 08: Analytics
  public getAnalytics(): DistributionAnalytics {
    return this.analytics;
  }

  // Phase 09: Security
  public getSecurityAudit(): SecurityAudit {
    return this.securityAudit;
  }

  public runAntiCrackValidation(): SecurityAudit {
    this.securityAudit.lastSecurityCheckTimestamp = new Date().toISOString();
    this.securityAudit.antiCrackValidationStatus = 'VERIFIED';
    this.securityAudit.antiTamperShieldActive = true;
    return this.securityAudit;
  }

  // Phase 10: Documentation
  public generateDocs(): LicenseGeneratedDocs {
    return {
      licenseGuide: `# Vertex ERP Ultimate - License & Entitlement Guide
## License Terms & Seat Allocation
- **Enterprise Unlimited**: Site-wide license with node floating seat pooling.
- **Hardware Fingerprint Binding**: HWID hashing algorithm incorporating CPU ID, Motherboard UUID, and MAC address.
- **Heartbeat Requirement**: 30-day offline grace period prior to mandatory online or challenge-response offline sync.
`,
      deploymentGuide: `# Enterprise Product Deployment Guide
## Installation Packages
1. **Windows Setup Installer (.exe / .msi)**: Unattended silent deployment via \`msiexec /i vertex-erp.msi /qn LICENSE_KEY="VTX-..."\`.
2. **ZIP Portable Edition**: Self-contained Node.js + SQLite embedded binary bundle.
3. **Cloud Container (Docker / Cloud Run)**: \`docker pull registry.vertex.com/vertex-erp:v1.0.0-cloudrun\`.
`,
      distributionGuide: `# Release Channels & Patch Distribution
## Software Release Lifecycle
- **STABLE**: Verified, multi-stage QA certified enterprise releases.
- **HOTFIX**: Emergency security patches auto-signed with RSA-4096.
- **BETA**: Feature preview releases for staging sandbox environments.
`,
      developerNotes: `# Developer License API & SDK Integration
\`\`\`typescript
import { licenseService } from './services/licenseService';

// Verify current machine license status
const info = licenseService.getDashboardInfo();
if (info.status !== 'ACTIVE') {
  throw new Error('Unlicensed Vertex ERP instance');
}
\`\`\`
`,
      administratorGuide: `# Administrator Operations Manual
1. **Device Management**: Revoke stale pod instances directly from the License Dashboard.
2. **Offline AirGap Activation**: Export challenge blob from air-gapped machine and upload to Customer Portal.
3. **KMS Certificate Renewal**: Monitor RSA signature validity in Security Audit panel.
`
    };
  }
}

export const licenseManager = LicenseManager.getInstance();
