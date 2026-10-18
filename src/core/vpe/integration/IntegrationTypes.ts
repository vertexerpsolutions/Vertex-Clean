export type ProtocolType = 'REST' | 'GRAPHQL' | 'SOAP' | 'WEBHOOK' | 'SFTP' | 'SMTP' | 'WEBSOCKET';

export type AuthType = 'OAUTH2' | 'API_KEY' | 'JWT' | 'BASIC' | 'CERTIFICATE';

export type SyncMode = 'REALTIME' | 'SCHEDULED' | 'MANUAL';
export type SyncDirection = 'ONE_WAY_IN' | 'ONE_WAY_OUT' | 'TWO_WAY';

export type ConnectorCategory = 
  | 'SPREADSHEET'
  | 'EMAIL_CALENDAR'
  | 'WORKSPACE'
  | 'CLOUD_STORAGE'
  | 'FILE_TRANSFER'
  | 'PAYMENT_GATEWAY'
  | 'HARDWARE_DEVICE'
  | 'GOVERNMENT_TAX_API'
  | 'CUSTOM_API';

export type IntegrationStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'SYNCING' | 'ERROR';

export interface ConnectorDefinition {
  id: string;
  code: string;
  name: string;
  category: ConnectorCategory;
  protocol: ProtocolType;
  authType: AuthType;
  description: string;
  iconName: string;
  supportedDataFormats: ('JSON' | 'XML' | 'CSV' | 'EXCEL' | 'BINARY' | 'PDF')[];
  isBuiltIn: boolean;
  version: string;
  configSchema: Record<string, any>;
}

export interface IntegrationConnection {
  id: string;
  connectorId: string;
  name: string;
  endpointUrl: string;
  authType: AuthType;
  status: IntegrationStatus;
  rateLimitPerMin: number;
  currentRequestsThisMin: number;
  lastSyncAt?: string;
  nextSyncAt?: string;
  syncMode: SyncMode;
  syncDirection: SyncDirection;
  retryAttemptsRemaining: number;
  encryptedCredentialsSet: boolean;
  companyId?: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  targetUrl: string;
  secretKey: string;
  subscribedEvents: string[];
  isEnabled: boolean;
  totalDelivered: number;
  totalFailed: number;
  lastDeliveryAt?: string;
}

export interface IntegrationSyncTask {
  id: string;
  connectionId: string;
  connectorName: string;
  syncType: string;
  direction: SyncDirection;
  recordsProcessed: number;
  status: 'SUCCESS' | 'IN_PROGRESS' | 'FAILED' | 'RETRY_QUEUED';
  durationMs: number;
  timestamp: string;
  errorMessage?: string;
}

export interface IntegrationErrorQueueItem {
  id: string;
  connectionId: string;
  connectorName: string;
  payload: any;
  errorReason: string;
  attemptCount: number;
  firstFailedAt: string;
  lastAttemptAt: string;
  status: 'PENDING_RETRY' | 'RESOLVED' | 'DISCARDED';
}
