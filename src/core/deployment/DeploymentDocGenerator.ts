// Vertex ERP Ultimate - VDP-01 Documentation Generator

import { DeploymentProfileConfig, GeneratedDeploymentDocs } from './DeploymentTypes';

export class DeploymentDocGenerator {
  private static instance: DeploymentDocGenerator;

  private constructor() {}

  public static getInstance(): DeploymentDocGenerator {
    if (!DeploymentDocGenerator.instance) {
      DeploymentDocGenerator.instance = new DeploymentDocGenerator();
    }
    return DeploymentDocGenerator.instance;
  }

  public generateAllDocs(profile: DeploymentProfileConfig): GeneratedDeploymentDocs {
    return {
      deploymentArchitecture: this.generateArchitectureDoc(profile),
      environmentGuide: this.generateEnvironmentGuide(profile),
      infrastructureDiagram: this.generateInfrastructureDiagram(profile),
      deploymentGuide: this.generateDeploymentGuide(profile),
      developerNotes: this.generateDeveloperNotes(profile),
    };
  }

  public generateArchitectureDoc(profile: DeploymentProfileConfig): string {
    return `# Vertex ERP Ultimate - VDP-01 Deployment Architecture

## 1. Architectural Overview
Vertex ERP Ultimate Version 1.0 (RC1) is built upon a 5-tier decoupled deployment layer that cleanly separates business logic from infrastructure choices.

### 5 Decoupled Layers
1. **Business Layer**: 15 Core ERP Modules (GL, AR, AP, INV, HR, FA, CRM, MFG, SCM, PM, POS, QM, TR, FLEET, BI) & 10 Gold Features (VGF-01 through VGF-10).
2. **Infrastructure Layer**: Unified database adapters (PostgreSQL & SQLite WAL), file system, and hardware interfaces.
3. **Deployment Layer**: Orchestration layer containing profile configurations for Desktop, Cloud, and Hybrid deployments.
4. **Hosting Layer**: Physical and cloud container runtimes (Cloud Run, Docker, Kubernetes, Electron/Tauri desktop wrappers).
5. **Configuration Layer**: Environment profiles, secret vaults, TLS enforcement, and debug diagnostics.

## 2. Supported Deployment Editions
- **Desktop Edition**: Standalone, offline-first installer with embedded SQLite database.
- **Cloud Edition**: Multi-tenant, containerized Cloud Run / Kubernetes deployment with PostgreSQL.
- **Hybrid Edition**: Edge node branch deployment with automatic background bi-directional event syncing.

## 3. Active Profile
- **Current Active Profile**: ${profile.name} (${profile.edition.toUpperCase()} / ${profile.environment.toUpperCase()})
- **Status**: Release Candidate (RC1)
`;
  }

  public generateEnvironmentGuide(profile: DeploymentProfileConfig): string {
    return `# Vertex ERP Ultimate - Environment Configuration Guide

## Environment Variables (.env)
Every deployment requires environment variables configured in \`.env\`.

### Standard Environment Parameters
\`\`\`env
# Core Server Environment
NODE_ENV=${profile.envVariables.NODE_ENV || 'production'}
PORT=${profile.envVariables.PORT || '3000'}
HOST=${profile.envVariables.HOST || '0.0.0.0'}
DISABLE_HMR=true
VERTEX_EDITION=${profile.edition}

# Database Connection
DATABASE_URL=${profile.envVariables.DATABASE_URL || 'postgresql://vertex_admin:***@cloudsql.internal:5432/vertex_prod'}

# Gemini AI Gateway Key
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
\`\`\`

## Secrets Vault Management
Sensitive secrets (Database passwords, API keys, JWT signing keys) must **NEVER** be committed to source code.

### Configured Secrets
${profile.secrets.map(s => `- **${s.key}** (${s.category}): ${s.description} [Status: ${s.status}]`).join('\n')}
`;
  }

  public generateInfrastructureDiagram(profile: DeploymentProfileConfig): string {
    return `# Vertex ERP Ultimate - Infrastructure Diagram

\`\`\`
+-----------------------------------------------------------------------+
|                       HTTP / HTTPS Ingress (Port 3000)                |
|                     Proxy Gateway (0.0.0.0 Binding)                    |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         APPLICATION RUNTIME LAYER                    |
|  +--------------------------+  +-----------------------------------+  |
|  |   15 Core ERP Modules    |  |     10 Gold Enterprise Features   |  |
|  +--------------------------+  +-----------------------------------+  |
|  +-----------------------------------------------------------------+  |
|  |                 15 Shared Platform Engines (VPE)                 |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                         DEPLOYMENT ADAPTER LAYER                      |
|                                                                       |
|  [ Desktop Edition ]        [ Cloud Edition ]       [ Hybrid Edition ]|
|  - SQLite WAL DB            - PostgreSQL 16 Cluster - Edge Node Sync  |
|  - Offline Storage          - Cloud CDN / Redis     - Offline Queue   |
+-----------------------------------------------------------------------+
\`\`\`
`;
  }

  public generateDeploymentGuide(profile: DeploymentProfileConfig): string {
    return `# Vertex ERP Ultimate - Step-by-Step Deployment Guide

## Step 1: Pre-Flight Verification
1. Run \`npm run lint\` to verify zero TypeScript errors.
2. Confirm \`.env\` contains \`PORT=3000\` and \`HOST=0.0.0.0\`.

## Step 2: Build Production Bundle
\`\`\`bash
# Compiles frontend React bundle and bundles server.ts to dist/server.cjs
npm run build
\`\`\`

## Step 3: Launch Production Container / Server
\`\`\`bash
# Launches the standalone server
npm run start
\`\`\`

## Step 4: Validate Deployment
Open browser to \`http://localhost:3000/api/v1/health\` and verify HTTP 200 OK.
`;
  }

  public generateDeveloperNotes(profile: DeploymentProfileConfig): string {
    return `# Vertex ERP Ultimate - Developer & Maintainer Notes

## Architectural Rules & Guarantees
1. **Decoupled Architecture**: Modifying deployment configurations or profile environments does NOT alter business logic in ERP Modules or Gold Features.
2. **Hardcoded Ingress Port**: Container reverse proxies depend strictly on binding to \`0.0.0.0:3000\`.
3. **Lazy Initialization**: All external SDKs (Gemini, DB pools, OAuth) use lazy initialization to prevent startup crashes when keys are omitted in preview environments.
4. **VDP-01 Complete**: Deployment Architecture VDP-01 completed and verified for Desktop, Cloud, and Hybrid editions.
`;
  }
}

export const deploymentDocGenerator = DeploymentDocGenerator.getInstance();
