import { portableManager } from '../core/portable/PortableManager';

export class PortableService {
  private static instance: PortableService;

  private constructor() {}

  public static getInstance(): PortableService {
    if (!PortableService.instance) {
      PortableService.instance = new PortableService();
    }
    return PortableService.instance;
  }

  public getDashboardInfo() {
    return portableManager.getDashboardInfo();
  }

  public ejectVolume() {
    return portableManager.ejectVolume();
  }

  public mountVolume() {
    return portableManager.mountVolume();
  }

  public runZeroInstallCheck() {
    return portableManager.runZeroInstallCheck();
  }

  public triggerSync() {
    return portableManager.triggerSync();
  }

  public getSyncLogs() {
    return portableManager.getSyncLogs();
  }

  public getSecurityAudit() {
    return portableManager.getSecurityAudit();
  }

  public runSecurityAudit() {
    return portableManager.runSecurityAudit();
  }

  public generateDocs() {
    return portableManager.generateDocs();
  }
}

export const portableService = PortableService.getInstance();
