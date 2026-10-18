import { configManager } from '../core/config/ConfigManager';
import {
  EnvironmentProfile,
  SystemVariable
} from '../core/config/ConfigTypes';

export class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getEnvironmentInfo() {
    return configManager.getEnvironmentInfo();
  }

  public getSystemVariables() {
    return configManager.getSystemVariables();
  }

  public setEnvironmentProfile(profile: EnvironmentProfile) {
    return configManager.setEnvironmentProfile(profile);
  }

  public updateVariable(key: string, newValue: string) {
    return configManager.updateVariable(key, newValue);
  }

  public addVariable(newVar: SystemVariable) {
    return configManager.addVariable(newVar);
  }

  public getSecrets() {
    return configManager.getSecrets();
  }

  public rotateSecret(id: string) {
    return configManager.rotateSecret(id);
  }

  public validateConfiguration() {
    return configManager.validateConfiguration();
  }

  public getBackups() {
    return configManager.getBackups();
  }

  public createBackup(description: string) {
    return configManager.createBackup(description);
  }

  public exportConfigJson() {
    return configManager.exportConfigJson();
  }

  public getRuntimeState() {
    return configManager.getRuntimeState();
  }

  public toggleMaintenanceMode(reason?: string) {
    return configManager.toggleMaintenanceMode(reason);
  }

  public toggleFeatureFlag(key: string) {
    return configManager.toggleFeatureFlag(key);
  }

  public generateDocs() {
    return configManager.generateDocs();
  }
}

export const configService = ConfigService.getInstance();
