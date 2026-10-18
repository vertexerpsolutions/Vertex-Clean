import { installerManager } from '../core/installer/InstallerManager';
import {
  InstallationMode,
  WizardStep,
  SystemConfigProfile
} from '../core/installer/InstallerTypes';

export class InstallerService {
  private static instance: InstallerService;

  private constructor() {}

  public static getInstance(): InstallerService {
    if (!InstallerService.instance) {
      InstallerService.instance = new InstallerService();
    }
    return InstallerService.instance;
  }

  public getAnalysis() {
    return installerManager.getInstallerAnalysis();
  }

  public getWizardStep() {
    return installerManager.getWizardStep();
  }

  public setWizardStep(step: WizardStep) {
    return installerManager.setWizardStep(step);
  }

  public getPrerequisites() {
    return installerManager.getPrerequisites();
  }

  public getInstallPath() {
    return installerManager.getInstallPath();
  }

  public setInstallPath(path: string) {
    return installerManager.setInstallPath(path);
  }

  public toggleLicenseAcceptance() {
    return installerManager.toggleLicenseAcceptance();
  }

  public isLicenseAccepted() {
    return installerManager.isLicenseAccepted();
  }

  public getReleases() {
    return installerManager.getReleases();
  }

  public checkForUpdates() {
    return installerManager.checkForUpdates();
  }

  public applyUpdate(version: string) {
    return installerManager.applyUpdate(version);
  }

  public getLicense() {
    return installerManager.getLicense();
  }

  public activateLicense(key: string, org: string) {
    return installerManager.activateLicense(key, org);
  }

  public getSystemConfig() {
    return installerManager.getSystemConfig();
  }

  public updateSystemConfig(updated: Partial<SystemConfigProfile>) {
    return installerManager.updateSystemConfig(updated);
  }

  public getRecoverySnapshots() {
    return installerManager.getRecoverySnapshots();
  }

  public createRecoverySnapshot(reason: string) {
    return installerManager.createRecoverySnapshot(reason);
  }

  public restoreSnapshot(snapshotId: string) {
    return installerManager.restoreSnapshot(snapshotId);
  }

  public runValidation() {
    return installerManager.runInstallerValidation();
  }

  public generateDocs() {
    return installerManager.generateDocs();
  }
}

export const installerService = InstallerService.getInstance();
