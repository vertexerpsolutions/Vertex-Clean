import { EnginePermissions } from './EngineTypes';

export interface VPEPlatformSecurityPolicy {
  enableEngineIsolation: boolean;
  strictPermissions: boolean;
  maxMemoryPerEngineMB: number;
  auditAllEvents: boolean;
  allowedEngineCategories: string[];
}

export const DEFAULT_ENGINE_PERMISSIONS: EnginePermissions = {
  allowDatabaseAccess: true,
  allowNetworkAccess: true,
  allowSystemCommands: false,
  allowEventBroadcast: true,
  allowedEvents: ['*'],
  maxMemoryMB: 128
};

export const DEFAULT_PLATFORM_SECURITY_POLICY: VPEPlatformSecurityPolicy = {
  enableEngineIsolation: true,
  strictPermissions: true,
  maxMemoryPerEngineMB: 256,
  auditAllEvents: true,
  allowedEngineCategories: [
    'Core',
    'Audit & Compliance',
    'Communication & Messaging',
    'Data & Storage',
    'Security & Auth',
    'Workflow & Automation',
    'Analytics & Reporting'
  ]
};

export class EngineConfigurationManager {
  private static instance: EngineConfigurationManager;
  private policy: VPEPlatformSecurityPolicy = { ...DEFAULT_PLATFORM_SECURITY_POLICY };

  private constructor() {}

  public static getInstance(): EngineConfigurationManager {
    if (!EngineConfigurationManager.instance) {
      EngineConfigurationManager.instance = new EngineConfigurationManager();
    }
    return EngineConfigurationManager.instance;
  }

  public getPolicy(): VPEPlatformSecurityPolicy {
    return { ...this.policy };
  }

  public updatePolicy(newPolicy: Partial<VPEPlatformSecurityPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy };
  }

  public validatePermissions(permissions: EnginePermissions): { valid: boolean; reason?: string } {
    if (permissions.maxMemoryMB > this.policy.maxMemoryPerEngineMB) {
      return {
        valid: false,
        reason: `Engine requested memory (${permissions.maxMemoryMB}MB) exceeds platform security policy maximum (${this.policy.maxMemoryPerEngineMB}MB).`
      };
    }
    return { valid: true };
  }
}

export const engineConfigurationManager = EngineConfigurationManager.getInstance();
