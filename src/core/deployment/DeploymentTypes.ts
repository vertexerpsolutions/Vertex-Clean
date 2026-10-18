// Vertex ERP Ultimate - VDP-01 Deployment Architecture Types

export type DeploymentEdition = 'desktop' | 'cloud' | 'hybrid';
export type EnvironmentProfile = 'development' | 'testing' | 'production';

export interface ArchitecturalLayerInfo {
  layerName: 'Business Layer' | 'Infrastructure Layer' | 'Deployment Layer' | 'Hosting Layer' | 'Configuration Layer';
  status: 'active' | 'decoupled' | 'isolated';
  components: string[];
  description: string;
}

export interface InfrastructureSpec {
  desktopInstallation: {
    packageFormat: 'AppImage' | 'NSIS Exe' | 'DMG Bundle' | 'Tauri / Electron Core';
    databaseEngine: 'SQLite Embedded (WAL Mode)';
    localStoragePath: string;
    offlineSyncAdapter: 'EventSourcing Sync Queue';
  };
  cloudHosting: {
    containerImage: string;
    orchestrator: 'Google Cloud Run' | 'Kubernetes Helm Cluster' | 'AWS ECS';
    databaseCluster: 'PostgreSQL 16 High-Availability' | 'Cloud Firestore';
    cdnProvider: 'Cloudflare Enterprise' | 'Google Cloud CDN';
  };
  hybridDeployment: {
    edgeNodeEngine: 'Vertex Edge Gateway v1.0';
    syncGatewayUrl: string;
    offlineQueueMaxRecords: number;
    syncIntervalSec: number;
    conflictResolutionStrategy: 'Server-Wins-With-Audit-Log';
  };
  apiHosting: {
    gateway: 'Express Reverse Proxy (0.0.0.0:3000)';
    protocol: 'HTTP/1.1 & HTTPS (TLS 1.3)';
    port: number;
    rateLimitPerMin: number;
    sslEnforced: boolean;
  };
  backgroundServices: {
    workerCount: number;
    scheduler: 'Vertex Cron Task Queue';
    deadLetterQueue: boolean;
    maxConcurrency: number;
  };
}

export interface SecretVariable {
  key: string;
  category: 'API Key' | 'Database Credentials' | 'JWT Secret' | 'TLS Certificate';
  status: 'configured' | 'missing' | 'injected_server_side';
  encrypted: boolean;
  description: string;
}

export interface ProductionSettings {
  sslEnforced: boolean;
  corsAllowedOrigins: string[];
  rateLimitingEnabled: boolean;
  highAvailabilityMode: boolean;
  minReplicas: number;
  maxReplicas: number;
  healthCheckEndpoint: string;
}

export interface DebugSettings {
  verboseLogs: boolean;
  memorySamplingEnabled: boolean;
  eventLoopTracing: boolean;
  mockDataFallbackAllowed: boolean;
  devToolsConsoleActive: boolean;
}

export interface DeploymentProfileConfig {
  id: string;
  name: string;
  edition: DeploymentEdition;
  environment: EnvironmentProfile;
  description: string;
  isCurrentActive: boolean;
  infrastructure: InfrastructureSpec;
  envVariables: Record<string, string>;
  secrets: SecretVariable[];
  productionSettings: ProductionSettings;
  debugSettings: DebugSettings;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationItem {
  id: string;
  category: 'deployment_dependencies' | 'environment_configuration' | 'production_readiness' | 'infrastructure_readiness';
  title: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  details: string;
  remediation?: string;
}

export interface ValidationReport {
  timestamp: string;
  edition: DeploymentEdition;
  environment: EnvironmentProfile;
  overallStatus: 'ready' | 'degraded' | 'blocked';
  passedCount: number;
  warningCount: number;
  failedCount: number;
  scorePercentage: number;
  items: ValidationItem[];
}

export interface GeneratedDeploymentDocs {
  deploymentArchitecture: string;
  environmentGuide: string;
  infrastructureDiagram: string;
  deploymentGuide: string;
  developerNotes: string;
}
