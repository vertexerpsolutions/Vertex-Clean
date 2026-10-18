// Vertex ERP Ultimate - VDP-03 Cloud Edition Types

export type TenantStatus = 'active' | 'provisioning' | 'suspended' | 'archived';

export interface EnterpriseTenantConfig {
  tenantId: string;
  organizationName: string;
  subdomain: string;
  status: TenantStatus;
  companyCount: number;
  branchCount: number;
  databaseSchema: string; // Isolated PG Schema (e.g. tenant_acme_corp)
  tier: 'Enterprise SaaS Dedicated' | 'Business SaaS Clustered' | 'Standard Cloud';
  allocatedCpuCores: number;
  allocatedRamGb: number;
  createdAt: string;
}

export interface CloudServiceHealth {
  serviceName: string;
  clusterRegion: string;
  instancesCount: number;
  healthyCount: number;
  p99LatencyMs: number;
  status: 'healthy' | 'degraded' | 'recovering';
}

export interface ScalabilityMetrics {
  currentRps: number;
  cpuUtilizationPct: number;
  memoryUtilizationPct: number;
  activeContainerInstances: number;
  minInstances: number;
  maxInstances: number;
  autoScaleThresholdCpuPct: number;
  loadBalancerStatus: 'Optimal' | 'Spike Mitigated' | 'Throttling';
}

export interface FailoverNodeStatus {
  nodeId: string;
  zone: string;
  role: 'Primary Master' | 'Hot Standby Replica' | 'Read Replica';
  replicationLagMs: number;
  health: 'Online' | 'Synchronized' | 'Failing Over';
}

export interface CloudSecurityState {
  mTLSEnforced: boolean;
  rateLimitPerMin: number;
  wafShieldActive: boolean;
  ddosMitigationLevel: 'Enterprise High' | 'Standard';
  secretRotationDays: number;
  activeTokensCount: number;
}

export interface CloudValidationReport {
  timestamp: string;
  multiTenantIsolationScore: number;
  performanceP99Ms: number;
  scalabilityReadinessScore: number;
  availabilitySla: string;
  overallStatus: 'passed' | 'warning' | 'failed';
  checkItems: {
    name: string;
    category: string;
    status: 'passed' | 'warning' | 'failed';
    details: string;
  }[];
}

export interface CloudGeneratedDocs {
  cloudGuide: string;
  saasArchitecture: string;
  tenantArchitecture: string;
  infrastructureDiagram: string;
  developerNotes: string;
}
