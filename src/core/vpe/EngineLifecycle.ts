import { EngineLifecycleStatus } from './EngineTypes';

export class EngineLifecycle {
  private currentStatus: EngineLifecycleStatus = 'uninitialized';
  private history: Array<{ timestamp: string; from: EngineLifecycleStatus; to: EngineLifecycleStatus; reason?: string }> = [];

  constructor(status: EngineLifecycleStatus = 'uninitialized') {
    this.currentStatus = status;
  }

  public getStatus(): EngineLifecycleStatus {
    return this.currentStatus;
  }

  public transitionTo(nextStatus: EngineLifecycleStatus, reason?: string): boolean {
    if (!this.isValidTransition(this.currentStatus, nextStatus)) {
      console.warn(`[EngineLifecycle] Invalid transition from ${this.currentStatus} to ${nextStatus}`);
      return false;
    }

    const prev = this.currentStatus;
    this.currentStatus = nextStatus;
    this.history.push({
      timestamp: new Date().toISOString(),
      from: prev,
      to: nextStatus,
      reason
    });
    return true;
  }

  private isValidTransition(from: EngineLifecycleStatus, to: EngineLifecycleStatus): boolean {
    if (from === to) return true;
    if (to === 'error') return true;

    switch (from) {
      case 'uninitialized':
        return to === 'initialized';
      case 'initialized':
        return to === 'running' || to === 'stopped';
      case 'running':
        return to === 'paused' || to === 'stopped';
      case 'paused':
        return to === 'running' || to === 'stopped';
      case 'stopped':
        return to === 'initialized' || to === 'running';
      case 'error':
        return to === 'initialized' || to === 'stopped';
      default:
        return false;
    }
  }

  public getHistory() {
    return [...this.history];
  }
}
