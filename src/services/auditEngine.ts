import { AuditLog } from '../types';
import { INITIAL_AUDIT_LOGS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'vertex_audit_logs_v1';

class AuditEngineService {
  private logs: AuditLog[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        this.logs = JSON.parse(saved);
      } else {
        this.logs = [...INITIAL_AUDIT_LOGS];
        this.save();
      }
    } catch {
      this.logs = [...INITIAL_AUDIT_LOGS];
    }
  }

  private save() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save audit log:', e);
    }
  }

  public getLogs(): AuditLog[] {
    return [...this.logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public logAction(
    action: string,
    module: string,
    details: string,
    severity: 'info' | 'warning' | 'critical' = 'info',
    userName: string = 'System Admin',
    userId: string = 'ADM-01'
  ): AuditLog {
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      module,
      details,
      severity,
      ipAddress: '192.168.1.100'
    };

    this.logs.unshift(newLog);
    if (this.logs.length > 200) {
      this.logs = this.logs.slice(0, 200);
    }
    this.save();
    return newLog;
  }

  public clearLogs() {
    this.logs = [];
    this.save();
  }
}

export const auditEngine = new AuditEngineService();
