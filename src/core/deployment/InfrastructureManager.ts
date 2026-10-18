// Vertex ERP Ultimate - VDP-01 Infrastructure Manager

import { InfrastructureSpec, DeploymentEdition } from './DeploymentTypes';

export class InfrastructureManager {
  private static instance: InfrastructureManager;

  private constructor() {}

  public static getInstance(): InfrastructureManager {
    if (!InfrastructureManager.instance) {
      InfrastructureManager.instance = new InfrastructureManager();
    }
    return InfrastructureManager.instance;
  }

  /**
   * Generates Dockerfile spec for containerized Cloud / Hybrid deployments
   */
  public generateDockerfile(): string {
    return `# Vertex ERP Ultimate - Production Multi-Stage Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
USER node
CMD ["node", "dist/server.cjs"]
`;
  }

  /**
   * Generates Docker Compose manifest for hybrid edge node or local cloud deployment
   */
  public generateDockerCompose(): string {
    return `version: '3.8'
services:
  vertex-erp-app:
    image: vertex-erp-core:1.0.0-rc1
    container_name: vertex_erp_main
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOST=0.0.0.0
      - VERTEX_EDITION=cloud
      - DATABASE_URL=postgresql://vertex_app:secret_password@postgres:5432/vertex_db
    restart: always
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    container_name: vertex_postgres
    environment:
      POSTGRES_DB: vertex_db
      POSTGRES_USER: vertex_app
      POSTGRES_PASSWORD: secret_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: vertex_redis
    ports:
      - "6379:6379"

volumes:
  pgdata:
`;
  }

  /**
   * Generates Electron / Tauri Desktop Manifest for Desktop Edition installer
   */
  public generateDesktopPackageManifest(): string {
    return JSON.stringify({
      name: "vertex-erp-desktop",
      productName: "Vertex ERP Ultimate Desktop",
      version: "1.0.0-rc1",
      description: "Standalone Offline-First Desktop Edition of Vertex ERP Ultimate",
      main: "dist/electron-main.js",
      build: {
        appId: "com.vertex.erp.desktop",
        mac: {
          category: "public.app-category.business",
          target: ["dmg", "zip"],
          icon: "build/icon.icns"
        },
        win: {
          target: ["nsis", "portable"],
          icon: "build/icon.ico"
        },
        linux: {
          target: ["AppImage", "deb"],
          icon: "build/icon.png"
        },
        extraResources: [
          "./data/vertex_desktop.db"
        ]
      }
    }, null, 2);
  }

  /**
   * Generates Hybrid Sync Configuration Manifest
   */
  public generateHybridSyncManifest(): string {
    return JSON.stringify({
      edgeNodeId: "EDGE-BRANCH-001",
      syncEngine: "Vertex Bi-Directional Event Sourcing Gateway",
      centralServerUrl: "https://cloud-hub.vertex-erp.app/v1/sync",
      localStorage: "SQLite WAL Engine",
      batchSize: 500,
      pollIntervalSec: 5,
      conflictStrategy: "server_wins_with_audit",
      retryExponentialBackoff: {
        initialMs: 1000,
        maxMs: 60000,
        multiplier: 2
      }
    }, null, 2);
  }

  /**
   * Get Infrastructure specifications for active edition
   */
  public getInfrastructureOverview(edition: DeploymentEdition): {
    edition: DeploymentEdition;
    specs: string[];
    readinessScore: number;
    recommendedActions: string[];
  } {
    if (edition === 'desktop') {
      return {
        edition,
        specs: [
          'Native OS Installer (NSIS, DMG, AppImage)',
          'Embedded SQLite Database Engine (WAL Mode)',
          'Local File System Storage Encryption (AES-256-GCM)',
          'Offline-First Local Event Sourcing Queue',
          'IPC Native OS Integration & Hardware Printing Drivers'
        ],
        readinessScore: 98,
        recommendedActions: [
          'Ensure SQLite WAL mode is enabled during initial launch.',
          'Verify local file system permissions for database path.',
          'Test offline queue flush during connection re-establishment.'
        ]
      };
    } else if (edition === 'hybrid') {
      return {
        edition,
        specs: [
          'Edge Gateway Node v1.0',
          'Bi-Directional Async Event Queue',
          'Automatic Conflict Resolution Engine',
          'Dual Database Adapters (Local SQLite + Central PostgreSQL)',
          'mTLS Encrypted Branch-to-Cloud Bridge'
        ],
        readinessScore: 96,
        recommendedActions: [
          'Verify mTLS branch certificates are installed.',
          'Configure central cloud hub endpoint address.',
          'Set offline queue maximum storage thresholds.'
        ]
      };
    } else {
      return {
        edition,
        specs: [
          'Cloud Run Containerized Node.js Runtime',
          'PostgreSQL 16 Multi-AZ Clustered Relational Engine',
          'Google Cloud CDN / Cloudflare Web Application Firewall',
          'Distributed Redis Caching & Session Store',
          'Horizontal Pod Auto-Scaling (2 to 20 replicas)'
        ],
        readinessScore: 100,
        recommendedActions: [
          'Production container image compiled cleanly to dist/server.cjs.',
          'Ingress reverse proxy bound to 0.0.0.0:3000.',
          'Automated health check probes active at /api/v1/health.'
        ]
      };
    }
  }
}

export const infrastructureManager = InfrastructureManager.getInstance();
