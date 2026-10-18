import { cloudManager } from '../core/cloud/CloudManager';
import { EnterpriseTenantConfig } from '../core/cloud/CloudTypes';

export class CloudService {
  private static instance: CloudService;

  private constructor() {}

  public static getInstance(): CloudService {
    if (!CloudService.instance) {
      CloudService.instance = new CloudService();
    }
    return CloudService.instance;
  }

  public getAnalysis() {
    return cloudManager.getCloudAnalysis();
  }

  public getTenants() {
    return cloudManager.getTenants();
  }

  public provisionTenant(orgName: string, subdomain: string, tier: EnterpriseTenantConfig['tier']) {
    return cloudManager.provisionTenant(orgName, subdomain, tier);
  }

  public getCloudServices() {
    return cloudManager.getCloudServices();
  }

  public getScalabilityMetrics() {
    return cloudManager.getScalabilityMetrics();
  }

  public triggerAutoScaling(targetInstances: number) {
    return cloudManager.triggerAutoScaling(targetInstances);
  }

  public getFailoverNodes() {
    return cloudManager.getFailoverNodes();
  }

  public triggerSimulatedFailover() {
    return cloudManager.triggerSimulatedFailover();
  }

  public getSecurityState() {
    return cloudManager.getSecurityState();
  }

  public runValidation() {
    return cloudManager.runCloudValidation();
  }

  public generateDocs() {
    return cloudManager.generateDocs();
  }
}

export const cloudService = CloudService.getInstance();
