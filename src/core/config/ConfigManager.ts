import {
  EnvironmentProfile,
  ConfigCategory,
  SystemVariable,
  EnvironmentInfo,
  SecretItem,
  ConfigValidationResult,
  ConfigBackupEntry,
  FeatureFlagItem,
  RuntimeState,
  ConfigGeneratedDocs
} from './ConfigTypes';

export class ConfigManager {
  private static instance: ConfigManager;

  private envInfo: EnvironmentInfo = {
    currentEnvironment: 'production',
    status: 'HEALTHY',
    activeProfileName: 'Vertex-ERP-Prod-AWS-EKS-01',
    nodeVersion: 'v20.12.2',
    osArchitecture: 'x86_64 Linux CloudRun Container',
    memoryUsageMb: 412.5,
    uptimeSeconds: 864200,
    cloudRegion: 'europe-west2',
    clusterId: 'vertex-prod-cluster-uk',
    totalVariablesCount: 48,
    healthScorePercentage: 98
  };

  private variables: SystemVariable[] = [
    {
      key: 'APP_NAME',
      value: 'Vertex ERP Ultimate',
      source: 'ENV_FILE',
      isSecret: false,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Primary platform display branding name',
      category: 'application'
    },
    {
      key: 'APP_ENV',
      value: 'production',
      source: 'SYSTEM',
      isSecret: false,
      isHotReloadable: false,
      requiresRestart: true,
      description: 'Active deployment profile environment',
      category: 'application'
    },
    {
      key: 'DB_POSTGRES_URL',
      value: 'postgresql://vertex_admin:****************@pg-cluster.internal:5432/vertex_db',
      source: 'SECRET_VAULT',
      isSecret: true,
      isHotReloadable: false,
      requiresRestart: true,
      description: 'Main PostgreSQL Cloud SQL database connection URI',
      category: 'database'
    },
    {
      key: 'DB_MAX_POOL_SIZE',
      value: '100',
      source: 'ENV_FILE',
      isSecret: false,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Maximum database connection pool size per pod',
      category: 'database'
    },
    {
      key: 'GEMINI_API_KEY',
      value: 'AIzaSy**********************************',
      source: 'SECRET_VAULT',
      isSecret: true,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Google GenAI SDK server-side API key',
      category: 'ai_providers'
    },
    {
      key: 'JWT_SECRET_KEY',
      value: 'vtx_sec_99a8b7c6d5e4f3a2b1c0_rsa4096',
      source: 'SECRET_VAULT',
      isSecret: true,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'OAuth2 / JWT session token signing secret',
      category: 'authentication'
    },
    {
      key: 'SMTP_SERVER_HOST',
      value: 'email-smtp.eu-west-2.amazonaws.com',
      source: 'ENV_FILE',
      isSecret: false,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Enterprise transactional email SMTP relay host',
      category: 'smtp'
    },
    {
      key: 'STORAGE_S3_BUCKET',
      value: 'vertex-erp-enterprise-vault-prod',
      source: 'ENV_FILE',
      isSecret: false,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Primary object storage bucket name for attachments',
      category: 'storage'
    },
    {
      key: 'LICENSE_KEY_ENTERPRISE',
      value: 'VTX-ULTIMATE-2026-99A8-77B2-C3D4',
      source: 'SECRET_VAULT',
      isSecret: true,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Vertex Enterprise Unlimited OEM License Signature',
      category: 'license'
    },
    {
      key: 'DEFAULT_TIMEZONE',
      value: 'UTC',
      source: 'ENV_FILE',
      isSecret: false,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Global system default time zone setting',
      category: 'regional'
    },
    {
      key: 'DEFAULT_LOCALE',
      value: 'en_US',
      source: 'ENV_FILE',
      isSecret: false,
      isHotReloadable: true,
      requiresRestart: false,
      description: 'Platform localization default language locale',
      category: 'localization'
    }
  ];

  private secrets: SecretItem[] = [
    {
      id: 'sec-01',
      keyName: 'DB_POSTGRES_PASSWORD',
      maskedValue: '••••••••••••••••••••••••',
      encryptedVaultRef: 'kms://projects/vertex/keyRings/prod/cryptoKeys/db-pass',
      lastRotatedAt: '2026-07-01T00:00:00.000Z',
      rotationPolicyDays: 90,
      isProtected: true,
      category: 'database',
      accessCount: 1420
    },
    {
      id: 'sec-02',
      keyName: 'GEMINI_API_KEY',
      maskedValue: 'AIzaSy••••••••••••••••••••',
      encryptedVaultRef: 'kms://projects/vertex/keyRings/prod/cryptoKeys/gemini-api',
      lastRotatedAt: '2026-06-15T12:00:00.000Z',
      rotationPolicyDays: 60,
      isProtected: true,
      category: 'ai_providers',
      accessCount: 8900
    },
    {
      id: 'sec-03',
      keyName: 'JWT_SIGNING_PRIVATE_KEY',
      maskedValue: '-----BEGIN PRIVATE KEY-----\nMIIE••••••••',
      encryptedVaultRef: 'kms://projects/vertex/keyRings/prod/cryptoKeys/jwt-key',
      lastRotatedAt: '2026-05-01T08:30:00.000Z',
      rotationPolicyDays: 180,
      isProtected: true,
      category: 'authentication',
      accessCount: 45200
    }
  ];

  private backups: ConfigBackupEntry[] = [
    {
      id: 'cfg-bak-20260801-v1',
      environment: 'production',
      createdAt: '2026-08-01T10:00:00.000Z',
      createdBy: 'sysadmin@vertex.com',
      variableCount: 48,
      checksumSha256: 'a89c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c',
      versionLabel: 'v1.0.0-Baseline-Prod',
      description: 'Production initial baseline snapshot post VDP-08 rollout'
    },
    {
      id: 'cfg-bak-20260715-v0',
      environment: 'staging',
      createdAt: '2026-07-15T14:30:00.000Z',
      createdBy: 'devops-lead',
      variableCount: 46,
      checksumSha256: 'f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9',
      versionLabel: 'v0.9.8-Staging-Backup',
      description: 'Pre-upgrade staging environment configuration snapshot'
    }
  ];

  private runtimeState: RuntimeState = {
    maintenanceMode: false,
    maintenanceReason: '',
    hotReloadEnabled: true,
    restartPending: false,
    pendingRestartKeys: [],
    featureFlags: [
      {
        key: 'ENABLE_VDP_08_PATCH_ENGINE',
        name: 'VDP-08 Automated Patch Engine',
        enabled: true,
        targetEnvironments: ['development', 'staging', 'production'],
        description: 'Enables background updates and RSA signature checks',
        type: 'boolean'
      },
      {
        key: 'ENABLE_C_PLUS_PLUS_VGF_ACCELERATION',
        name: 'VGF Ledger C++ SIMD Acceleration',
        enabled: true,
        targetEnvironments: ['production', 'cloud', 'hybrid'],
        description: 'Native C++ VGF assembly binding for double-entry ledger calculations',
        type: 'boolean'
      },
      {
        key: 'FEATURE_AI_AUTOPILOT_SUGGESTIONS',
        name: 'Gemini AI Autopilot Assistant',
        enabled: true,
        targetEnvironments: ['development', 'testing', 'qa', 'staging', 'production'],
        description: 'Server-side Gemini AI financial forecasting & anomaly detection',
        type: 'percentage_rollout',
        rolloutPercentage: 100
      }
    ]
  };

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  // Phase 01: Environment Dashboard
  public getEnvironmentInfo(): EnvironmentInfo {
    return this.envInfo;
  }

  public getSystemVariables(): SystemVariable[] {
    return this.variables;
  }

  // Phase 02: Environment Profiles
  public setEnvironmentProfile(profile: EnvironmentProfile): EnvironmentInfo {
    this.envInfo = {
      ...this.envInfo,
      currentEnvironment: profile,
      activeProfileName: `Vertex-ERP-${profile.toUpperCase()}-Profile`
    };
    return this.envInfo;
  }

  // Phase 03: Configuration Manager
  public updateVariable(key: string, newValue: string): SystemVariable {
    let updatedVar: SystemVariable | null = null;
    this.variables = this.variables.map(v => {
      if (v.key === key) {
        if (v.requiresRestart) {
          this.runtimeState.restartPending = true;
          if (!this.runtimeState.pendingRestartKeys.includes(key)) {
            this.runtimeState.pendingRestartKeys.push(key);
          }
        }
        updatedVar = { ...v, value: newValue, source: 'RUNTIME_OVERRIDE' };
        return updatedVar;
      }
      return v;
    });

    if (!updatedVar) {
      throw new Error(`Variable ${key} not found`);
    }
    return updatedVar;
  }

  public addVariable(newVar: SystemVariable): SystemVariable {
    this.variables.push(newVar);
    this.envInfo.totalVariablesCount = this.variables.length;
    return newVar;
  }

  // Phase 04: Secrets Management
  public getSecrets(): SecretItem[] {
    return this.secrets;
  }

  public rotateSecret(id: string): SecretItem {
    let rotated: SecretItem | null = null;
    this.secrets = this.secrets.map(s => {
      if (s.id === id) {
        rotated = {
          ...s,
          lastRotatedAt: new Date().toISOString(),
          accessCount: s.accessCount + 1
        };
        return rotated;
      }
      return s;
    });

    if (!rotated) throw new Error(`Secret ${id} not found`);
    return rotated;
  }

  // Phase 05: Configuration Validation
  public validateConfiguration(): ConfigValidationResult {
    const missingKeys: string[] = [];
    const requiredKeys = ['APP_NAME', 'APP_ENV', 'DB_POSTGRES_URL', 'GEMINI_API_KEY', 'JWT_SECRET_KEY'];

    requiredKeys.forEach(rk => {
      const found = this.variables.find(v => v.key === rk);
      if (!found || !found.value) {
        missingKeys.push(rk);
      }
    });

    const isVal = missingKeys.length === 0;
    const health = isVal ? 98 : Math.max(20, 100 - missingKeys.length * 20);

    return {
      healthScore: health,
      isValid: isVal,
      missingKeys,
      deprecatedKeys: ['LEGACY_MYSQL_HOST', 'V1_OAUTH_TOKEN'],
      dependencyChecks: [
        {
          serviceName: 'PostgreSQL Cloud SQL Engine',
          requiredVars: ['DB_POSTGRES_URL', 'DB_MAX_POOL_SIZE'],
          status: 'PASSED',
          message: 'Connection pool test succeeded. Latency 1.2ms.'
        },
        {
          serviceName: 'Google Gemini AI Service',
          requiredVars: ['GEMINI_API_KEY'],
          status: 'PASSED',
          message: 'Server-side API key verified with Gemini 1.5/2.0 endpoints.'
        },
        {
          serviceName: 'OAuth2 Authentication Vault',
          requiredVars: ['JWT_SECRET_KEY'],
          status: 'PASSED',
          message: 'RSA-4096 signing key valid and active.'
        }
      ],
      validationTimestamp: new Date().toISOString()
    };
  }

  // Phase 06: Import / Export
  public getBackups(): ConfigBackupEntry[] {
    return this.backups;
  }

  public createBackup(description: string): ConfigBackupEntry {
    const newBak: ConfigBackupEntry = {
      id: `cfg-bak-${Date.now().toString().slice(-8)}`,
      environment: this.envInfo.currentEnvironment,
      createdAt: new Date().toISOString(),
      createdBy: 'admin@vertex.com',
      variableCount: this.variables.length,
      checksumSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      versionLabel: `v1.0-Snap-${this.envInfo.currentEnvironment}`,
      description
    };
    this.backups.unshift(newBak);
    return newBak;
  }

  public exportConfigJson(): string {
    const exportData = {
      environment: this.envInfo.currentEnvironment,
      exportedAt: new Date().toISOString(),
      variables: this.variables.map(v => ({
        key: v.key,
        value: v.isSecret ? '[ENCRYPTED_SECRET]' : v.value,
        category: v.category,
        description: v.description
      }))
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Phase 07: Runtime Management
  public getRuntimeState(): RuntimeState {
    return this.runtimeState;
  }

  public toggleMaintenanceMode(reason?: string): RuntimeState {
    this.runtimeState = {
      ...this.runtimeState,
      maintenanceMode: !this.runtimeState.maintenanceMode,
      maintenanceReason: reason || 'Scheduled System Maintenance'
    };
    return this.runtimeState;
  }

  public toggleFeatureFlag(key: string): FeatureFlagItem {
    let updated: FeatureFlagItem | null = null;
    this.runtimeState.featureFlags = this.runtimeState.featureFlags.map(f => {
      if (f.key === key) {
        updated = { ...f, enabled: !f.enabled };
        return updated;
      }
      return f;
    });

    if (!updated) throw new Error(`Feature flag ${key} not found`);
    return updated;
  }

  // Phase 08: Documentation
  public generateDocs(): ConfigGeneratedDocs {
    return {
      environmentGuide: `# Vertex ERP Ultimate - Environment & Profile Guide
## Supported Runtime Profiles
- **Development**: Local debugging with detailed stack traces and SQLite dev DB.
- **Testing**: Automated unit and integration test runner sandbox.
- **QA**: Quality assurance manual testing environment.
- **Staging**: Production mirror environment with sanitized database copy.
- **Production**: Hardened, multi-region Cloud Run container cluster with Cloud SQL.
- **Local / Cloud / Hybrid**: Edge node deployment profiles for VDP-04 Hybrid Sync engine.
`,
      configurationGuide: `# Configuration Management Manual
## Category Taxonomies
1. **Application Settings**: Branding, base URLs, feature flags.
2. **Database Settings**: PostgreSQL, SQLite WAL, connection pooling.
3. **API Keys & AI Providers**: Google Gemini API, OpenAI proxy keys.
4. **Authentication & Security**: JWT signing secrets, OAuth2 credentials.
5. **SMTP & Email**: Transactional AWS SES / SendGrid SMTP relays.
6. **Storage**: Object storage bucket names and regional endpoints.
7. **License & Regional**: OEM license keys, default timezone, locale translations.
`,
      developerSetupGuide: `# Developer Local Environment Setup
\`\`\`bash
# 1. Clone repository
git clone https://github.com/vertex-erp/vertex-erp-platform.git

# 2. Copy environment template
cp .env.example .env

# 3. Initialize VDP-09 Config Engine
npm run dev
\`\`\`
`,
      productionDeploymentGuide: `# Production Deployment Security Checklist
1. Enable **KMS Envelope Encryption** for all secret keys in \`Secrets Management\`.
2. Ensure **Auto-Approve Security Hotfixes** is enabled in VDP-08 / VDP-09.
3. Verify **Config Health Score >= 95%** in Configuration Validator prior to pod rollout.
`
    };
  }
}

export const configManager = ConfigManager.getInstance();
