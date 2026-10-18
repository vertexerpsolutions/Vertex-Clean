import { backupManager } from '../core/backup/BackupManager';
import {
  RestoreType,
  RedundancyConfig,
  BackupSecurityConfig
} from '../core/backup/BackupTypes';

export class BackupService {
  private static instance: BackupService;

  private constructor() {}

  public static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  public getBackupAssets() {
    return backupManager.getBackupAssets();
  }

  public getBackupJobs() {
    return backupManager.getBackupJobs();
  }

  public triggerManualBackup(jobId: string) {
    return backupManager.triggerManualBackup(jobId);
  }

  public getRestorePoints() {
    return backupManager.getRestorePoints();
  }

  public executeRestore(restorePointId: string, restoreType: RestoreType) {
    return backupManager.executeRestore(restorePointId, restoreType);
  }

  public getDisasterRecoveryPlans() {
    return backupManager.getDisasterRecoveryPlans();
  }

  public runRecoveryPlan(planId: string) {
    return backupManager.runRecoveryPlan(planId);
  }

  public getRedundancyConfig() {
    return backupManager.getRedundancyConfig();
  }

  public updateRedundancyConfig(updated: Partial<RedundancyConfig>) {
    return backupManager.updateRedundancyConfig(updated);
  }

  public getSecurityConfig() {
    return backupManager.getSecurityConfig();
  }

  public updateSecurityConfig(updated: Partial<BackupSecurityConfig>) {
    return backupManager.updateSecurityConfig(updated);
  }

  public getAuditLogs() {
    return backupManager.getAuditLogs();
  }

  public runValidationSuite() {
    return backupManager.runValidationSuite();
  }

  public generateDocs() {
    return backupManager.generateDocs();
  }
}

export const backupService = BackupService.getInstance();
