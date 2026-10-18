import { hybridManager } from '../core/hybrid/HybridManager';
import {
  HybridConnectivityMode,
  SyncConflictPolicy,
  HybridSyncQueueItem
} from '../core/hybrid/HybridTypes';

export class HybridService {
  private static instance: HybridService;

  private constructor() {}

  public static getInstance(): HybridService {
    if (!HybridService.instance) {
      HybridService.instance = new HybridService();
    }
    return HybridService.instance;
  }

  public getAnalysis() {
    return hybridManager.getHybridAnalysis();
  }

  public getConnectivityMode() {
    return hybridManager.getConnectivityMode();
  }

  public setConnectivityMode(mode: HybridConnectivityMode) {
    return hybridManager.setConnectivityMode(mode);
  }

  public getNetworkState() {
    return hybridManager.getNetworkState();
  }

  public toggleNetworkState() {
    return hybridManager.toggleNetworkState();
  }

  public getSyncQueue() {
    return hybridManager.getSyncQueue();
  }

  public getConflictPolicy() {
    return hybridManager.getConflictPolicy();
  }

  public setConflictPolicy(policy: SyncConflictPolicy) {
    return hybridManager.setConflictPolicy(policy);
  }

  public processSyncQueue() {
    return hybridManager.processSyncQueue();
  }

  public createSyncItem(
    operation: HybridSyncQueueItem['operation'],
    entityName: string,
    payload: Record<string, any>
  ) {
    return hybridManager.createSyncItem(operation, entityName, payload);
  }

  public getRegisteredDevices() {
    return hybridManager.getRegisteredDevices();
  }

  public getConsistencyChecks() {
    return hybridManager.getConsistencyChecks();
  }

  public getSecurityState() {
    return hybridManager.getHybridSecurityState();
  }

  public runValidation() {
    return hybridManager.runHybridValidation();
  }

  public generateDocs() {
    return hybridManager.generateDocs();
  }
}

export const hybridService = HybridService.getInstance();
