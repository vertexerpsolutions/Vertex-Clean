export type EnvironmentProfile = 'development' | 'testing' | 'qa' | 'staging' | 'production' | 'local' | 'cloud' | 'hybrid';

export type ConfigCategory = 
  | 'application'
  | 'database'
  | 'api_keys'
  | 'authentication'
  | 'smtp'
  | 'storage'
  | 'ai_providers'
  | 'license'
  | 'regional'
  | 'localization';

export interface SystemVariable {
  key: string;
  value: string;
  source: 'SYSTEM' | 'ENV_FILE' | 'SECRET_VAULT' | 'RUNTIME_OVERRIDE';
  isSecret: boolean;
  isHotReloadable: boolean;
  requiresRestart: boolean;
  description: string;
  category: ConfigCategory;
}

export interface EnvironmentInfo {
  currentEnvironment: EnvironmentProfile;
  status: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE' | 'SYNCING';
  activeProfileName: string;
  nodeVersion: string;
  osArchitecture: string;
  memoryUsageMb: number;
  uptimeSeconds: number;
  cloudRegion: string;
  clusterId: string;
  totalVariablesCount: number;
  healthScorePercentage: number;
}

export interface SecretItem {
  id: string;
  keyName: string;
  maskedValue: string;
  encryptedVaultRef: string;
  lastRotatedAt: string;
  rotationPolicyDays: number;
  isProtected: boolean;
  category: ConfigCategory;
  accessCount: number;
}

export interface ConfigValidationResult {
  healthScore: number; // 0 - 100
  isValid: boolean;
  missingKeys: string[];
  deprecatedKeys: string[];
  dependencyChecks: {
    serviceName: string;
    requiredVars: string[];
    status: 'PASSED' | 'FAILED' | 'WARNING';
    message: string;
  }[];
  validationTimestamp: string;
}

export interface ConfigBackupEntry {
  id: string;
  environment: EnvironmentProfile;
  createdAt: string;
  createdBy: string;
  variableCount: number;
  checksumSha256: string;
  versionLabel: string;
  description: string;
}

export interface FeatureFlagItem {
  key: string;
  name: string;
  enabled: boolean;
  targetEnvironments: EnvironmentProfile[];
  description: string;
  type: 'boolean' | 'percentage_rollout' | 'user_group';
  rolloutPercentage?: number;
}

export interface RuntimeState {
  maintenanceMode: boolean;
  maintenanceReason?: string;
  hotReloadEnabled: boolean;
  restartPending: boolean;
  pendingRestartKeys: string[];
  featureFlags: FeatureFlagItem[];
}

export interface ConfigGeneratedDocs {
  environmentGuide: string;
  configurationGuide: string;
  developerSetupGuide: string;
  productionDeploymentGuide: string;
}
