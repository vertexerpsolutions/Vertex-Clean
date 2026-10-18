import { updateManager } from '../core/update/UpdateManager';
import {
  UpdateChannel,
  DownloaderConfig,
  MaintenanceWindowSpec
} from '../core/update/UpdateTypes';

export class UpdateService {
  private static instance: UpdateService;

  private constructor() {}

  public static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  public getVersionInfo() {
    return updateManager.getVersionInfo();
  }

  public checkForUpdates() {
    return updateManager.checkForUpdates();
  }

  public setUpdateChannel(channel: UpdateChannel) {
    return updateManager.setUpdateChannel(channel);
  }

  public loadOfflinePackage(pkgName: string) {
    return updateManager.loadOfflinePackage(pkgName);
  }

  public getDownloaderConfig() {
    return updateManager.getDownloaderConfig();
  }

  public updateDownloaderConfig(config: Partial<DownloaderConfig>) {
    return updateManager.updateDownloaderConfig(config);
  }

  public getDownloadTask() {
    return updateManager.getDownloadTask();
  }

  public startDownload() {
    return updateManager.startDownload();
  }

  public pauseDownload() {
    return updateManager.pauseDownload();
  }

  public resumeDownload() {
    return updateManager.resumeDownload();
  }

  public cancelDownload() {
    return updateManager.cancelDownload();
  }

  public completeDownload() {
    return updateManager.completeDownload();
  }

  public getPatchPackage() {
    return updateManager.getPatchPackage();
  }

  public applyPatch() {
    return updateManager.applyPatch();
  }

  public getVersionHistory() {
    return updateManager.getVersionHistory();
  }

  public rollbackToVersion(versionStr: string) {
    return updateManager.rollbackToVersion(versionStr);
  }

  public verifySecurity() {
    return updateManager.verifySecurity();
  }

  public getMaintenanceWindow() {
    return updateManager.getMaintenanceWindow();
  }

  public updateMaintenanceWindow(spec: Partial<MaintenanceWindowSpec>) {
    return updateManager.updateMaintenanceWindow(spec);
  }

  public generateDocs() {
    return updateManager.generateDocs();
  }
}

export const updateService = UpdateService.getInstance();
