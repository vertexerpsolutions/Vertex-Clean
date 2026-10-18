import {
  PortableDashboardInfo,
  PortableSyncLog,
  PortableSecurityAudit,
  PortableGeneratedDocs,
  ZeroInstallStatus
} from './PortableTypes';

export class PortableManager {
  private static instance: PortableManager;

  private dashboardInfo: PortableDashboardInfo = {
    volume: {
      volumeId: 'VOL-VTX-USB-32GB-99A8',
      driveLabel: 'VERTEX_PORTABLE_EDITION',
      mountPoint: 'E:\\VertexERP\\',
      fsType: 'exFAT-Encrypted',
      totalCapacityMb: 32768,
      freeCapacityMb: 21450,
      isEncrypted: true,
      hardwareVendor: 'SanDisk Extreme PRO USB 3.2',
      serialNumber: 'SN-9988-A7B6-54321'
    },
    zeroInstallStatus: 'READY',
    dbConfig: {
      dbEngine: 'SQLite Embedded',
      dbPath: 'E:\\VertexERP\\data\\vertex_local.db',
      isEncrypted: true,
      dbSizeMb: 1420,
      lastSyncTimestamp: '2026-08-07T06:15:00.000Z'
    },
    healthScore: 98,
    activeSessionUser: 'Admin (Portable Standalone Session)',
    totalSyncEvents: 1420,
    isMounted: true
  };

  private syncLogs: PortableSyncLog[] = [
    {
      id: 'psync-01',
      timestamp: '2026-08-07T06:15:00.000Z',
      direction: 'LOCAL_TO_CLOUD',
      changedRecordsCount: 42,
      status: 'SUCCESS',
      targetCloudEndpoint: 'https://cloud.vertex.com/api/v1/sync'
    },
    {
      id: 'psync-02',
      timestamp: '2026-08-06T18:30:00.000Z',
      direction: 'CLOUD_TO_LOCAL',
      changedRecordsCount: 128,
      status: 'CONFLICT_RESOLVED',
      targetCloudEndpoint: 'https://cloud.vertex.com/api/v1/sync'
    }
  ];

  private securityAudit: PortableSecurityAudit = {
    isVolumeEncrypted: true,
    hardwareEncryptionActive: true,
    aes256KeyFingerprint: 'AES256-GCM-VTX-PORTABLE-KEY-88776655',
    tamperCheckPassed: true,
    lastAuditTimestamp: '2026-08-07T06:20:00.000Z'
  };

  private constructor() {}

  public static getInstance(): PortableManager {
    if (!PortableManager.instance) {
      PortableManager.instance = new PortableManager();
    }
    return PortableManager.instance;
  }

  public getDashboardInfo(): PortableDashboardInfo {
    return this.dashboardInfo;
  }

  public ejectVolume(): PortableDashboardInfo {
    this.dashboardInfo.isMounted = false;
    this.dashboardInfo.volume.mountPoint = 'DISCONNECTED';
    return this.dashboardInfo;
  }

  public mountVolume(): PortableDashboardInfo {
    this.dashboardInfo.isMounted = true;
    this.dashboardInfo.volume.mountPoint = 'E:\\VertexERP\\';
    return this.dashboardInfo;
  }

  public runZeroInstallCheck(): ZeroInstallStatus {
    this.dashboardInfo.zeroInstallStatus = 'CACHE_VALIDATED';
    return this.dashboardInfo.zeroInstallStatus;
  }

  public triggerSync(): PortableSyncLog {
    const newLog: PortableSyncLog = {
      id: `psync-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      direction: 'LOCAL_TO_CLOUD',
      changedRecordsCount: Math.floor(Math.random() * 50) + 1,
      status: 'SUCCESS',
      targetCloudEndpoint: 'https://cloud.vertex.com/api/v1/sync'
    };

    this.syncLogs.unshift(newLog);
    this.dashboardInfo.dbConfig.lastSyncTimestamp = newLog.timestamp;
    this.dashboardInfo.totalSyncEvents += 1;
    return newLog;
  }

  public getSyncLogs(): PortableSyncLog[] {
    return this.syncLogs;
  }

  public getSecurityAudit(): PortableSecurityAudit {
    return this.securityAudit;
  }

  public runSecurityAudit(): PortableSecurityAudit {
    this.securityAudit.lastAuditTimestamp = new Date().toISOString();
    this.securityAudit.tamperCheckPassed = true;
    return this.securityAudit;
  }

  public generateDocs(): PortableGeneratedDocs {
    return {
      portableGuide: `# Vertex ERP Portable Edition - Deployment Guide
## Overview
VDP-06 Portable Edition is a zero-installation, standalone executable package designed for plug-and-play USB deployment.
- **Embedded Database**: Local SQLite with SQLCipher AES-256 transparent encryption.
- **Zero Registry Dependency**: No Windows registry or admin privilege requirements.
`,
      zeroInstallManual: `# Zero-Install Runtime Execution Manual
1. Insert the encrypted USB hardware drive into any host workstation.
2. Launch \`VertexERP-Portable.exe\` directly from the root directory.
3. Node.js embedded runtime boots cleanly without leaving residual temp files.
`,
      storageSpecs: `# Storage Volume & Filesystem Specifications
- **Hardware Bus**: USB 3.2 Gen 2 / Thunderbolt 4.
- **Filesystem**: exFAT with BitLocker To Go or LUKS container wrapping.
- **Data Directory**: \`E:\\VertexERP\\data\\\`.
`,
      syncArchitecture: `# Local-First Offline Sync Architecture
- **Offline Ledger**: All transactions are appended locally first.
- **Cloud Gateway**: When network is detected, incremental delta sync executes over HTTPS with HMAC-SHA256 headers.
`,
      administratorManual: `# Administrator Safety & Volume Ejection
- Always trigger the Safe Eject procedure in VDP-06 to flush SQLite write-ahead logs (WAL) prior to removing physical hardware.
`
    };
  }
}

export const portableManager = PortableManager.getInstance();
