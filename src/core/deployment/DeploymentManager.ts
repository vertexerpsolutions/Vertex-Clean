// Vertex ERP Ultimate - VDP-01 Deployment Manager Singleton

import { 
  DeploymentProfileConfig, 
  DeploymentEdition, 
  EnvironmentProfile, 
  ValidationReport, 
  GeneratedDeploymentDocs,
  ArchitecturalLayerInfo
} from './DeploymentTypes';
import { INITIAL_DEPLOYMENT_PROFILES } from './DeploymentProfiles';
import { deploymentValidator } from './DeploymentValidator';
import { infrastructureManager } from './InfrastructureManager';
import { deploymentDocGenerator } from './DeploymentDocGenerator';

export class DeploymentManager {
  private static instance: DeploymentManager;
  private profiles: Map<string, DeploymentProfileConfig> = new Map();
  private activeProfileId: string = 'PROF-CLOUD-PROD';

  private constructor() {
    INITIAL_DEPLOYMENT_PROFILES.forEach(p => {
      this.profiles.set(p.id, { ...p });
    });
  }

  public static getInstance(): DeploymentManager {
    if (!DeploymentManager.instance) {
      DeploymentManager.instance = new DeploymentManager();
    }
    return DeploymentManager.instance;
  }

  /**
   * Get all registered deployment profiles
   */
  public getAllProfiles(): DeploymentProfileConfig[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get currently active profile
   */
  public getActiveProfile(): DeploymentProfileConfig {
    const active = this.profiles.get(this.activeProfileId);
    if (!active) {
      return Array.from(this.profiles.values())[0];
    }
    return { ...active };
  }

  /**
   * Set active deployment profile
   */
  public setActiveProfile(profileId: string): DeploymentProfileConfig {
    if (!this.profiles.has(profileId)) {
      throw new Error(`[DeploymentManager] Profile ID '${profileId}' does not exist.`);
    }

    this.profiles.forEach((p, id) => {
      p.isCurrentActive = id === profileId;
    });

    this.activeProfileId = profileId;
    return this.getActiveProfile();
  }

  /**
   * Switch edition (desktop, cloud, hybrid) while retaining stage environment
   */
  public switchEdition(edition: DeploymentEdition): DeploymentProfileConfig {
    const current = this.getActiveProfile();
    const match = this.getAllProfiles().find(p => p.edition === edition && p.environment === current.environment);
    
    if (match) {
      return this.setActiveProfile(match.id);
    } else {
      const anyEditionMatch = this.getAllProfiles().find(p => p.edition === edition);
      if (anyEditionMatch) {
        return this.setActiveProfile(anyEditionMatch.id);
      }
    }
    return current;
  }

  /**
   * Switch environment stage (development, testing, production)
   */
  public switchEnvironment(env: EnvironmentProfile): DeploymentProfileConfig {
    const current = this.getActiveProfile();
    const match = this.getAllProfiles().find(p => p.environment === env && p.edition === current.edition);

    if (match) {
      return this.setActiveProfile(match.id);
    } else {
      const anyEnvMatch = this.getAllProfiles().find(p => p.environment === env);
      if (anyEnvMatch) {
        return this.setActiveProfile(anyEnvMatch.id);
      }
    }
    return current;
  }

  /**
   * Update active profile configuration settings
   */
  public updateActiveProfile(updates: Partial<DeploymentProfileConfig>): DeploymentProfileConfig {
    const active = this.getActiveProfile();
    const updated: DeploymentProfileConfig = {
      ...active,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.profiles.set(active.id, updated);
    return updated;
  }

  /**
   * Run validation on active profile
   */
  public runValidation(): ValidationReport {
    const active = this.getActiveProfile();
    return deploymentValidator.validate(active);
  }

  /**
   * Generate documentation for active profile
   */
  public generateDocs(): GeneratedDeploymentDocs {
    const active = this.getActiveProfile();
    return deploymentDocGenerator.generateAllDocs(active);
  }

  /**
   * Get 5 Decoupled Layers info
   */
  public getArchitecturalLayers(): ArchitecturalLayerInfo[] {
    return [
      {
        layerName: 'Business Layer',
        status: 'decoupled',
        components: [
          '15 Core ERP Modules (GL, AR, AP, INV, HR, FA, CRM, MFG, SCM, PM, POS, QM, TR, FLEET, BI)',
          '10 Gold Enterprise Features (VGF-01 through VGF-10)'
        ],
        description: 'Contains domain entities, ledger rules, document workflows, and audit services. 100% decoupled from infrastructure.'
      },
      {
        layerName: 'Infrastructure Layer',
        status: 'isolated',
        components: [
          'PostgreSQL 16 Clustered Engine & SQLite WAL Local DB',
          'Async Worker Queue & Task Processors',
          'File System & File Storage Adapters'
        ],
        description: 'Abstracts hardware, disk, memory, and database connectivity behind unified service interfaces.'
      },
      {
        layerName: 'Deployment Layer',
        status: 'active',
        components: [
          'Desktop Profile Manager (Offline-First / Local DB)',
          'Cloud Profile Manager (Multi-Tenant / Cloud Run)',
          'Hybrid Profile Manager (Edge Branch Gateway / Sync Queue)'
        ],
        description: 'Orchestrates environment profiles, packaging formats, and pre-flight validation checks.'
      },
      {
        layerName: 'Hosting Layer',
        status: 'active',
        components: [
          'Cloud Run / Kubernetes Docker Containers',
          'Electron / Tauri Native Desktop Executable Package',
          'Edge Branch Gateway Nodes'
        ],
        description: 'Physical or virtual container runtime environments serving the Express ingress gateway at 0.0.0.0:3000.'
      },
      {
        layerName: 'Configuration Layer',
        status: 'active',
        components: [
          'Environment Variables (.env)',
          'Encrypted Secrets Vault (API Keys, TLS Certs, JWT Secrets)',
          'Production Security Settings & Debug Diagnostics'
        ],
        description: 'Provides runtime variables, secret injection, CORS/SSL policies, and diagnostic log levels.'
      }
    ];
  }

  /**
   * Get Infrastructure specs
   */
  public getInfrastructureOverview() {
    const active = this.getActiveProfile();
    return infrastructureManager.getInfrastructureOverview(active.edition);
  }
}

export const deploymentManager = DeploymentManager.getInstance();
