// Vertex ERP Ultimate - VDP-01 Deployment Service

import { deploymentManager } from '../core/deployment/DeploymentManager';
import { 
  DeploymentProfileConfig, 
  DeploymentEdition, 
  EnvironmentProfile, 
  ValidationReport, 
  GeneratedDeploymentDocs,
  ArchitecturalLayerInfo
} from '../core/deployment/DeploymentTypes';
import { auditEngine } from './auditEngine';

export class DeploymentService {
  private static instance: DeploymentService;

  private constructor() {}

  public static getInstance(): DeploymentService {
    if (!DeploymentService.instance) {
      DeploymentService.instance = new DeploymentService();
    }
    return DeploymentService.instance;
  }

  public getActiveProfile(): DeploymentProfileConfig {
    return deploymentManager.getActiveProfile();
  }

  public getAllProfiles(): DeploymentProfileConfig[] {
    return deploymentManager.getAllProfiles();
  }

  public setActiveProfile(profileId: string): DeploymentProfileConfig {
    const profile = deploymentManager.setActiveProfile(profileId);
    auditEngine.logAction(
      `Active Deployment Profile Changed`,
      'Deployment Service',
      `Switched deployment profile to '${profile.name}' (${profile.edition.toUpperCase()} / ${profile.environment.toUpperCase()}).`,
      'info'
    );
    return profile;
  }

  public switchEdition(edition: DeploymentEdition): DeploymentProfileConfig {
    const profile = deploymentManager.switchEdition(edition);
    auditEngine.logAction(
      `Deployment Edition Switched`,
      'Deployment Service',
      `Switched architecture edition to '${edition.toUpperCase()}'. Profile: ${profile.name}`,
      'info'
    );
    return profile;
  }

  public switchEnvironment(env: EnvironmentProfile): DeploymentProfileConfig {
    const profile = deploymentManager.switchEnvironment(env);
    auditEngine.logAction(
      `Deployment Environment Stage Switched`,
      'Deployment Service',
      `Switched environment stage to '${env.toUpperCase()}'. Profile: ${profile.name}`,
      'info'
    );
    return profile;
  }

  public updateActiveProfile(updates: Partial<DeploymentProfileConfig>): DeploymentProfileConfig {
    const updated = deploymentManager.updateActiveProfile(updates);
    auditEngine.logAction(
      `Deployment Profile Configuration Updated`,
      'Deployment Service',
      `Updated settings for profile '${updated.name}'.`,
      'info'
    );
    return updated;
  }

  public runValidation(): ValidationReport {
    const report = deploymentManager.runValidation();
    auditEngine.logAction(
      `Deployment Validation Executed`,
      'Deployment Service',
      `Validation score: ${report.scorePercentage}%. Status: ${report.overallStatus.toUpperCase()}. Passed: ${report.passedCount}, Warnings: ${report.warningCount}, Failed: ${report.failedCount}.`,
      report.failedCount > 0 ? 'warning' : 'info'
    );
    return report;
  }

  public generateDocs(): GeneratedDeploymentDocs {
    return deploymentManager.generateDocs();
  }

  public getArchitecturalLayers(): ArchitecturalLayerInfo[] {
    return deploymentManager.getArchitecturalLayers();
  }

  public getInfrastructureOverview() {
    return deploymentManager.getInfrastructureOverview();
  }
}

export const deploymentService = DeploymentService.getInstance();
