import { desktopManager } from '../core/desktop/DesktopManager';
import {
  WindowState,
  DesktopSystemTrayConfig,
  OfflineSyncQueueItem,
  HardwarePrintJob
} from '../core/desktop/DesktopTypes';

export class DesktopService {
  private static instance: DesktopService;

  private constructor() {}

  public static getInstance(): DesktopService {
    if (!DesktopService.instance) {
      DesktopService.instance = new DesktopService();
    }
    return DesktopService.instance;
  }

  public getAnalysis() {
    return desktopManager.getDesktopAnalysis();
  }

  public setWindowState(state: WindowState) {
    return desktopManager.setWindowState(state);
  }

  public getWindowState() {
    return desktopManager.getWindowState();
  }

  public getMonitors() {
    return desktopManager.getMonitors();
  }

  public getMenuItems() {
    return desktopManager.getMenuItems();
  }

  public getTrayConfig() {
    return desktopManager.getTrayConfig();
  }

  public updateTrayConfig(updates: Partial<DesktopSystemTrayConfig>) {
    return desktopManager.updateTrayConfig(updates);
  }

  public getLocalStorageQuota() {
    return desktopManager.getLocalStorageQuota();
  }

  public getSyncQueue() {
    return desktopManager.getSyncQueue();
  }

  public processSyncQueue() {
    return desktopManager.processSyncQueue();
  }

  public addSyncItem(actionType: OfflineSyncQueueItem['actionType'], entityName: string, payload: Record<string, any>) {
    return desktopManager.addSyncItem(actionType, entityName, payload);
  }

  public getPrintJobs() {
    return desktopManager.getPrintJobs();
  }

  public triggerPrintJob(title: string, printer: string, pages: number) {
    return desktopManager.triggerPrintJob(title, printer, pages);
  }

  public exportLocalBackup() {
    return desktopManager.exportLocalBackup();
  }

  public getMachineIdentity() {
    return desktopManager.getMachineIdentity();
  }

  public getVaultStatus() {
    return desktopManager.getVaultStatus();
  }

  public runValidation() {
    return desktopManager.runDesktopValidation();
  }

  public generateDocs() {
    return desktopManager.generateDocs();
  }
}

export const desktopService = DesktopService.getInstance();
