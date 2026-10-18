import { 
  ConnectorDefinition, 
  IntegrationConnection, 
  WebhookEndpoint, 
  IntegrationSyncTask, 
  IntegrationErrorQueueItem, 
  SyncDirection 
} from './IntegrationTypes';
import { BUILT_IN_CONNECTORS } from './ConnectorFramework';
import { auditEngine } from '../../../services/auditEngine';

export class IntegrationManager {
  private static instance: IntegrationManager;
  private connectors: Map<string, ConnectorDefinition> = new Map();
  private connections: Map<string, IntegrationConnection> = new Map();
  private webhooks: Map<string, WebhookEndpoint> = new Map();
  private syncTasks: IntegrationSyncTask[] = [];
  private errorQueue: IntegrationErrorQueueItem[] = [];

  private constructor() {
    this.seedDefaults();
  }

  public static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  private seedDefaults(): void {
    BUILT_IN_CONNECTORS.forEach(c => this.connectors.set(c.id, c));

    // Seed default connections
    const initialConns: IntegrationConnection[] = [
      {
        id: 'CONN-LIVE-EXCEL-01',
        connectorId: 'CONN-EXCEL-01',
        name: 'Microsoft 365 Financial Ledger Workbook Sync',
        endpointUrl: 'https://graph.microsoft.com/v1.0/me/drive/items/01XYZ/workbook',
        authType: 'OAUTH2',
        status: 'ONLINE',
        rateLimitPerMin: 120,
        currentRequestsThisMin: 14,
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        nextSyncAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
        syncMode: 'SCHEDULED',
        syncDirection: 'TWO_WAY',
        retryAttemptsRemaining: 3,
        encryptedCredentialsSet: true,
        companyId: 'Vertex Global Corp',
        branchId: 'HQ-NY',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-08-05T12:00:00Z'
      },
      {
        id: 'CONN-LIVE-PAYMENT-02',
        connectorId: 'CONN-PAYMENT-07',
        name: 'Stripe Global Enterprise Gateway',
        endpointUrl: 'https://api.stripe.com/v1/charges',
        authType: 'API_KEY',
        status: 'ONLINE',
        rateLimitPerMin: 500,
        currentRequestsThisMin: 88,
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        nextSyncAt: 'REALTIME',
        syncMode: 'REALTIME',
        syncDirection: 'TWO_WAY',
        retryAttemptsRemaining: 5,
        encryptedCredentialsSet: true,
        companyId: 'Vertex Global Corp',
        branchId: 'HQ-NY',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-08-06T08:00:00Z'
      },
      {
        id: 'CONN-LIVE-GOVT-03',
        connectorId: 'CONN-GOVT-09',
        name: 'Federal Tax Authority E-Invoicing Gateway',
        endpointUrl: 'https://einvoice.tax.gov/api/v2/submit',
        authType: 'CERTIFICATE',
        status: 'ONLINE',
        rateLimitPerMin: 60,
        currentRequestsThisMin: 4,
        lastSyncAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        nextSyncAt: new Date(Date.now() + 1000 * 60 * 240).toISOString(),
        syncMode: 'REALTIME',
        syncDirection: 'ONE_WAY_OUT',
        retryAttemptsRemaining: 3,
        encryptedCredentialsSet: true,
        companyId: 'Vertex Global Corp',
        branchId: 'HQ-NY',
        createdAt: '2026-03-15T08:00:00Z',
        updatedAt: '2026-08-04T10:00:00Z'
      }
    ];

    initialConns.forEach(conn => this.connections.set(conn.id, conn));

    // Seed webhooks
    const initialWebhooks: WebhookEndpoint[] = [
      {
        id: 'WH-001',
        name: 'External ERP Audit & Telemetry Webhook',
        targetUrl: 'https://audit-gateway.vertex-partner.org/api/v1/events',
        secretKey: 'whsec_99a8f7e6d5c4b3a2',
        subscribedEvents: ['FINANCIAL_LEDGER_POSTED', 'PURCHASE_ORDER_APPROVED', 'WORKFLOW_TERMINATED'],
        isEnabled: true,
        totalDelivered: 1420,
        totalFailed: 2,
        lastDeliveryAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ];

    initialWebhooks.forEach(wh => this.webhooks.set(wh.id, wh));

    // Seed mock sync tasks
    this.syncTasks = [
      {
        id: 'TASK-SYNC-101',
        connectionId: 'CONN-LIVE-EXCEL-01',
        connectorName: 'Microsoft Excel Data Connector',
        syncType: 'Worksheet Row Synchronization',
        direction: 'TWO_WAY',
        recordsProcessed: 480,
        status: 'SUCCESS',
        durationMs: 340,
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'TASK-SYNC-102',
        connectionId: 'CONN-LIVE-PAYMENT-02',
        connectorName: 'Stripe Global Enterprise Gateway',
        syncType: 'Real-time Payment Webhook Reconcile',
        direction: 'TWO_WAY',
        recordsProcessed: 14,
        status: 'SUCCESS',
        durationMs: 82,
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString()
      }
    ];

    // Seed error queue
    this.errorQueue = [
      {
        id: 'ERR-SYNC-901',
        connectionId: 'CONN-LIVE-GOVT-03',
        connectorName: 'Government E-Invoicing & Tax API Gateway',
        payload: { invoiceNumber: 'INV-2026-9912', vatAmount: 14200 },
        errorReason: 'HTTP 503 Service Unavailable (Federal Gateway Maintenance Window)',
        attemptCount: 2,
        firstFailedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        lastAttemptAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        status: 'PENDING_RETRY'
      }
    ];
  }

  public getConnectors(): ConnectorDefinition[] {
    return Array.from(this.connectors.values());
  }

  public getConnections(): IntegrationConnection[] {
    return Array.from(this.connections.values());
  }

  public getWebhooks(): WebhookEndpoint[] {
    return Array.from(this.webhooks.values());
  }

  public getSyncTasks(): IntegrationSyncTask[] {
    return this.syncTasks;
  }

  public getErrorQueue(): IntegrationErrorQueueItem[] {
    return this.errorQueue;
  }

  public testConnection(connectionId: string): { success: boolean; latencyMs: number; message: string } {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      return { success: false, latencyMs: 0, message: 'Connection record not found.' };
    }

    const latencyMs = Math.round(15 + Math.random() * 35);
    conn.status = 'ONLINE';
    conn.updatedAt = new Date().toISOString();

    auditEngine.logAction(
      'INTEGRATION_TEST',
      'VIE Manager',
      `Tested connection "${conn.name}" (${conn.endpointUrl}) - Success in ${latencyMs}ms`,
      'info',
      'VIE Validator'
    );

    return {
      success: true,
      latencyMs,
      message: `Connection "${conn.name}" is healthy. Endpoint SSL valid, latency ${latencyMs}ms.`
    };
  }

  public triggerManualSync(connectionId: string): IntegrationSyncTask {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      throw new Error(`Connection ${connectionId} not found.`);
    }

    const connector = this.connectors.get(conn.connectorId);
    const durationMs = Math.round(120 + Math.random() * 400);
    const recordsProcessed = Math.floor(20 + Math.random() * 150);

    const task: IntegrationSyncTask = {
      id: `TASK-SYNC-${Date.now().toString().slice(-4)}`,
      connectionId: conn.id,
      connectorName: connector?.name || 'External Connector',
      syncType: 'Manual High-Priority Sync',
      direction: conn.syncDirection,
      recordsProcessed,
      status: 'SUCCESS',
      durationMs,
      timestamp: new Date().toISOString()
    };

    conn.lastSyncAt = task.timestamp;
    conn.currentRequestsThisMin += 1;
    this.syncTasks.unshift(task);

    auditEngine.logAction(
      'INTEGRATION_SYNC',
      'VIE Manager',
      `Executed manual sync for "${conn.name}" - ${recordsProcessed} records processed in ${durationMs}ms`,
      'info',
      'VIE Sync Engine'
    );

    return task;
  }

  public retryErrorItem(errorId: string): boolean {
    const idx = this.errorQueue.findIndex(e => e.id === errorId);
    if (idx === -1) return false;

    const item = this.errorQueue[idx];
    item.attemptCount += 1;
    item.lastAttemptAt = new Date().toISOString();
    item.status = 'RESOLVED';

    auditEngine.logAction(
      'INTEGRATION_ERROR_RETRY',
      'VIE Error Queue',
      `Successfully retried error item ${errorId} for "${item.connectorName}"`,
      'info',
      'VIE Error Recovery'
    );

    return true;
  }

  public saveConnection(connection: IntegrationConnection): IntegrationConnection {
    this.connections.set(connection.id, connection);
    auditEngine.logAction(
      'INTEGRATION_SAVE_CONNECTION',
      'VIE Manager',
      `Saved connection configuration for "${connection.name}" (${connection.endpointUrl})`,
      'info',
      'VIE Configurator'
    );
    return connection;
  }

  public saveWebhook(webhook: WebhookEndpoint): WebhookEndpoint {
    this.webhooks.set(webhook.id, webhook);
    auditEngine.logAction(
      'INTEGRATION_SAVE_WEBHOOK',
      'VIE Manager',
      `Registered webhook listener "${webhook.name}" (${webhook.targetUrl})`,
      'info',
      'VIE Webhook Engine'
    );
    return webhook;
  }
}

export const integrationManager = IntegrationManager.getInstance();
