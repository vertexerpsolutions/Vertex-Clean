import { 
  EngineConfiguration, 
  EngineContract, 
  EngineHealthState, 
  EngineLifecycleStatus, 
  EngineMetrics, 
  HealthCheckResult, 
  IEngineContext 
} from './EngineTypes';
import { EngineLifecycle } from './EngineLifecycle';

export abstract class EngineBase implements EngineContract {
  public readonly config: EngineConfiguration;
  protected lifecycle: EngineLifecycle;
  protected context: IEngineContext | null = null;
  protected metrics: EngineMetrics = {
    cpuUsagePct: 0.1,
    memoryUsageMB: 12.4,
    executionTimeMs: 0,
    totalCalls: 0,
    errorCount: 0,
    warningCount: 0,
    lastActive: new Date().toISOString()
  };

  constructor(config: EngineConfiguration) {
    this.config = config;
    this.lifecycle = new EngineLifecycle('uninitialized');
  }

  public get status(): EngineLifecycleStatus {
    return this.lifecycle.getStatus();
  }

  public async initialize(context: IEngineContext): Promise<boolean> {
    this.context = context;
    const start = performance.now();
    try {
      const ok = await this.onInitialize();
      if (ok) {
        this.lifecycle.transitionTo('initialized', 'Initialization successful');
        this.context.logAudit(this.config.id, 'Engine Initialized', `Engine ${this.config.name} v${this.config.version} initialized successfully.`);
      } else {
        this.lifecycle.transitionTo('error', 'Initialization callback returned false');
      }
      this.recordExecutionTime(performance.now() - start);
      return ok;
    } catch (err: any) {
      this.lifecycle.transitionTo('error', err.message);
      this.metrics.errorCount++;
      return false;
    }
  }

  public async start(): Promise<boolean> {
    if (this.status !== 'initialized' && this.status !== 'stopped' && this.status !== 'paused') {
      return false;
    }
    const start = performance.now();
    try {
      const ok = await this.onStart();
      if (ok) {
        this.lifecycle.transitionTo('running', 'Start successful');
        if (this.context) {
          this.context.logAudit(this.config.id, 'Engine Started', `Engine ${this.config.name} is now running.`);
          this.context.publishEvent('engine:started', { engineId: this.config.id }, this.config.id);
        }
      } else {
        this.lifecycle.transitionTo('error', 'Start callback returned false');
      }
      this.recordExecutionTime(performance.now() - start);
      return ok;
    } catch (err: any) {
      this.lifecycle.transitionTo('error', err.message);
      this.metrics.errorCount++;
      return false;
    }
  }

  public async pause(): Promise<boolean> {
    if (this.status !== 'running') return false;
    try {
      const ok = await this.onPause();
      if (ok) {
        this.lifecycle.transitionTo('paused', 'Engine paused');
        if (this.context) {
          this.context.logAudit(this.config.id, 'Engine Paused', `Engine ${this.config.name} paused.`);
          this.context.publishEvent('engine:paused', { engineId: this.config.id }, this.config.id);
        }
      }
      return ok;
    } catch (err: any) {
      this.metrics.errorCount++;
      return false;
    }
  }

  public async resume(): Promise<boolean> {
    if (this.status !== 'paused') return false;
    try {
      const ok = await this.onResume();
      if (ok) {
        this.lifecycle.transitionTo('running', 'Engine resumed');
        if (this.context) {
          this.context.logAudit(this.config.id, 'Engine Resumed', `Engine ${this.config.name} resumed execution.`);
          this.context.publishEvent('engine:resumed', { engineId: this.config.id }, this.config.id);
        }
      }
      return ok;
    } catch (err: any) {
      this.metrics.errorCount++;
      return false;
    }
  }

  public async restart(): Promise<boolean> {
    await this.shutdown();
    if (this.context) {
      await this.initialize(this.context);
      return await this.start();
    }
    return false;
  }

  public async shutdown(): Promise<boolean> {
    try {
      const ok = await this.onShutdown();
      this.lifecycle.transitionTo('stopped', 'Engine shutdown completed');
      if (this.context) {
        this.context.logAudit(this.config.id, 'Engine Shutdown', `Engine ${this.config.name} shut down.`);
        this.context.publishEvent('engine:stopped', { engineId: this.config.id }, this.config.id);
      }
      return ok;
    } catch (err: any) {
      this.metrics.errorCount++;
      return false;
    }
  }

  public async getHealth(): Promise<HealthCheckResult> {
    const start = performance.now();
    try {
      const result = await this.onHealthCheck();
      result.latencyMs = Math.round(performance.now() - start);
      return result;
    } catch (err: any) {
      return {
        status: 'unhealthy',
        latencyMs: Math.round(performance.now() - start),
        message: `Health check failed: ${err.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  public getStatus(): EngineLifecycleStatus {
    return this.lifecycle.getStatus();
  }

  public getVersion(): string {
    return this.config.version;
  }

  public getMetrics(): EngineMetrics {
    // Dynamic simulated metrics based on status
    if (this.status === 'running') {
      this.metrics.cpuUsagePct = Math.round((0.2 + Math.random() * 1.5) * 100) / 100;
      this.metrics.memoryUsageMB = Math.round((14 + Math.random() * 8) * 10) / 10;
      this.metrics.lastActive = new Date().toISOString();
    } else {
      this.metrics.cpuUsagePct = 0;
      this.metrics.memoryUsageMB = 4.2;
    }
    return { ...this.metrics };
  }

  protected recordExecutionTime(ms: number) {
    this.metrics.totalCalls++;
    this.metrics.executionTimeMs = Math.round(ms * 100) / 100;
    this.metrics.lastActive = new Date().toISOString();
  }

  // Hook methods to be overridden by concrete engines
  protected abstract onInitialize(): Promise<boolean>;
  protected abstract onStart(): Promise<boolean>;
  protected abstract onPause(): Promise<boolean>;
  protected abstract onResume(): Promise<boolean>;
  protected abstract onShutdown(): Promise<boolean>;
  protected abstract onHealthCheck(): Promise<HealthCheckResult>;
}
