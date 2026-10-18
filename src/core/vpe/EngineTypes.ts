export type EngineLifecycleStatus = 
  | 'uninitialized'
  | 'initialized'
  | 'running'
  | 'paused'
  | 'stopped'
  | 'error';

export type EngineHealthState = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface EnginePermissions {
  allowDatabaseAccess: boolean;
  allowNetworkAccess: boolean;
  allowSystemCommands: boolean;
  allowEventBroadcast: boolean;
  allowedEvents: string[];
  maxMemoryMB: number;
}

export interface EngineConfiguration {
  id: string;
  name: string;
  version: string;
  description: string;
  category: string;
  autoStart: boolean;
  dependencies: string[];
  permissions: EnginePermissions;
  customConfig?: Record<string, any>;
}

export interface HealthCheckResult {
  status: EngineHealthState;
  latencyMs: number;
  message: string;
  subsystemChecks?: Record<string, boolean>;
  timestamp: string;
}

export interface EngineMetrics {
  cpuUsagePct: number;
  memoryUsageMB: number;
  executionTimeMs: number;
  totalCalls: number;
  errorCount: number;
  warningCount: number;
  lastActive: string;
}

export interface EngineEvent<T = any> {
  id: string;
  sourceEngineId: string;
  eventName: string;
  payload: T;
  timestamp: string;
}

export type EventCallback<T = any> = (event: EngineEvent<T>) => void;

export interface EngineContract {
  readonly config: EngineConfiguration;
  readonly status: EngineLifecycleStatus;
  
  initialize(context: IEngineContext): Promise<boolean>;
  start(): Promise<boolean>;
  pause(): Promise<boolean>;
  resume(): Promise<boolean>;
  restart(): Promise<boolean>;
  shutdown(): Promise<boolean>;
  
  getHealth(): Promise<HealthCheckResult>;
  getStatus(): EngineLifecycleStatus;
  getVersion(): string;
  getMetrics(): EngineMetrics;
}

export interface IEngineContext {
  publishEvent<T>(eventName: string, payload: T, sourceEngineId: string): void;
  subscribeEvent<T>(eventName: string, callback: EventCallback<T>): () => void;
  getSharedState<T>(key: string): T | undefined;
  setSharedState<T>(key: string, value: T): void;
  getEngineService(engineId: string): any;
  logAudit(engineId: string, action: string, details: string, level?: 'info' | 'warning' | 'error'): void;
}
