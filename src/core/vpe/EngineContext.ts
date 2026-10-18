import { EngineEvent, EventCallback, IEngineContext } from './EngineTypes';

export class EngineContext implements IEngineContext {
  private static instance: EngineContext;
  private sharedState = new Map<string, any>();
  private eventListeners = new Map<string, Set<EventCallback>>();
  private services = new Map<string, any>();
  private auditLogs: Array<{ timestamp: string; engineId: string; action: string; details: string; level: string }> = [];

  private constructor() {}

  public static getInstance(): EngineContext {
    if (!EngineContext.instance) {
      EngineContext.instance = new EngineContext();
    }
    return EngineContext.instance;
  }

  public publishEvent<T>(eventName: string, payload: T, sourceEngineId: string): void {
    const event: EngineEvent<T> = {
      id: `EVT-${Math.floor(100000 + Math.random() * 900000)}`,
      sourceEngineId,
      eventName,
      payload,
      timestamp: new Date().toISOString()
    };

    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(cb => {
        try {
          cb(event);
        } catch (err) {
          console.error(`[EngineContext] Error in listener for event ${eventName}:`, err);
        }
      });
    }

    // Also broadcast to wildcards
    const globalListeners = this.eventListeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(cb => cb(event));
    }
  }

  public subscribeEvent<T>(eventName: string, callback: EventCallback<T>): () => void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, new Set());
    }
    const set = this.eventListeners.get(eventName)!;
    set.add(callback as EventCallback);

    return () => {
      set.delete(callback as EventCallback);
    };
  }

  public getSharedState<T>(key: string): T | undefined {
    return this.sharedState.get(key) as T | undefined;
  }

  public setSharedState<T>(key: string, value: T): void {
    this.sharedState.set(key, value);
    this.publishEvent('system:state_changed', { key, value }, 'EngineContext');
  }

  public registerService(engineId: string, serviceInstance: any): void {
    this.services.set(engineId, serviceInstance);
  }

  public getEngineService(engineId: string): any {
    return this.services.get(engineId);
  }

  public logAudit(engineId: string, action: string, details: string, level: 'info' | 'warning' | 'error' = 'info'): void {
    const entry = {
      timestamp: new Date().toISOString(),
      engineId,
      action,
      details,
      level
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 200) this.auditLogs.pop();
    this.publishEvent('system:audit_log', entry, engineId);
  }

  public getAuditLogs() {
    return [...this.auditLogs];
  }
}

export const engineContext = EngineContext.getInstance();
