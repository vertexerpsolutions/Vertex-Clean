import { 
  SecurityUserSession, 
  SecurityPolicy, 
  SecurityAlert, 
  SecurityAuditRecord, 
  VaultSecret, 
  UserRole, 
  AuthMethod, 
  SecurityThreatSeverity 
} from './SecurityTypes';
import { auditEngine } from '../../../services/auditEngine';

export class SecurityManager {
  private static instance: SecurityManager;
  private activeSessions: Map<string, SecurityUserSession> = new Map();
  private policies: Map<string, SecurityPolicy> = new Map();
  private alerts: SecurityAlert[] = [];
  private auditRecords: SecurityAuditRecord[] = [];
  private secretsVault: Map<string, VaultSecret> = new Map();
  private failedLoginTracker: Map<string, { attempts: number; lastAttempt: number }> = new Map();

  private constructor() {
    this.seedDefaults();
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  private seedDefaults(): void {
    // Seed default Security Policies
    const initialPolicies: SecurityPolicy[] = [
      {
        policyId: 'POL-PWD-01',
        name: 'Enterprise Password & Complexity Policy',
        category: 'PASSWORD',
        description: 'Mandates minimum 14 characters, uppercase, numbers, symbols, and 90-day password expiration.',
        isEnabled: true,
        config: { minLength: 14, requireSpecialChar: true, maxAgeDays: 90 }
      },
      {
        policyId: 'POL-LOCKOUT-02',
        name: 'Adaptive Brute Force & Account Lockout Guard',
        category: 'IP_LOCKOUT',
        description: 'Locks user account and blocks IP address after 5 consecutive failed login attempts within 5 minutes.',
        isEnabled: true,
        config: { maxFailedAttempts: 5, lockoutDurationMins: 30 }
      },
      {
        policyId: 'POL-MFA-03',
        name: 'Mandatory Multi-Factor Authentication (MFA/TOTP)',
        category: 'MFA',
        description: 'Requires TOTP dynamic token or FIDO2 key for all Super Admin and Finance Manager roles.',
        isEnabled: true,
        config: { enforceForAdmins: true, gracePeriodHours: 0 }
      },
      {
        policyId: 'POL-ENCRYPT-04',
        name: 'AES-256 GCM Data & Backup Encryption Policy',
        category: 'DATA_ENCRYPTION',
        description: 'Enforces hardware-accelerated AES-256 envelope encryption for all stored files and cloud backups.',
        isEnabled: true,
        config: { cipherMode: 'AES-256-GCM', keyRotationDays: 30 }
      }
    ];

    initialPolicies.forEach(p => this.policies.set(p.policyId, p));

    // Seed active sessions
    const now = new Date();
    const expire = new Date(now.getTime() + 1000 * 60 * 60 * 8);

    const initialSessions: SecurityUserSession[] = [
      {
        sessionId: 'SESS-ADMIN-9901',
        userId: 'USR-001',
        username: 'alex.mercer',
        fullName: 'Alex Mercer',
        role: 'SUPER_ADMIN',
        authMethod: 'MFA_TOTP',
        mfaVerified: true,
        ipAddress: '192.168.10.45',
        userAgent: 'Mozilla/5.0 (Vertex Secure Client v5.2)',
        deviceId: 'DEV-SRV-NY-PROD-01',
        companyScope: 'Vertex Global Enterprises Corp',
        branchScope: 'HQ-NY',
        departmentScope: 'Executive Systems',
        issuedAt: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        expiresAt: expire.toISOString(),
        lastActiveAt: new Date().toISOString(),
        isSuspicious: false
      },
      {
        sessionId: 'SESS-FINANCE-4412',
        userId: 'USR-004',
        username: 'elena.rodriguez',
        fullName: 'Elena Rodriguez',
        role: 'FINANCE_MANAGER',
        authMethod: 'LDAP_AD',
        mfaVerified: true,
        ipAddress: '192.168.12.110',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        deviceId: 'DEV-FIN-LAPTOP-142',
        companyScope: 'Vertex Global Enterprises Corp',
        branchScope: 'HQ-NY',
        departmentScope: 'Finance & Accounting',
        issuedAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
        expiresAt: expire.toISOString(),
        lastActiveAt: new Date(now.getTime() - 1000 * 60 * 5).toISOString(),
        isSuspicious: false
      }
    ];

    initialSessions.forEach(s => this.activeSessions.set(s.sessionId, s));

    // Seed Vault Secrets
    const initialSecrets: VaultSecret[] = [
      {
        secretId: 'SEC-DB-PROD-01',
        keyName: 'POSTGRES_MASTER_DB_CREDENTIALS',
        category: 'DATABASE_CREDS',
        encryptedValueHash: 'AES256-GCM-CIPHER-HASH-99A8F7E6D5C4B3A21',
        lastRotatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        nextRotationDueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 15).toISOString(),
        accessCount: 4120
      },
      {
        secretId: 'SEC-API-STRIPE-02',
        keyName: 'STRIPE_LIVE_SECRET_KEY',
        category: 'API_TOKEN',
        encryptedValueHash: 'AES256-GCM-CIPHER-HASH-77B2C4D1E8F9A0B1',
        lastRotatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        nextRotationDueAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 20).toISOString(),
        accessCount: 1840
      }
    ];

    initialSecrets.forEach(s => this.secretsVault.set(s.secretId, s));

    // Seed Security Alerts
    this.alerts = [
      {
        alertId: 'ALT-SEC-101',
        severity: 'MEDIUM',
        title: 'Multiple Failed Authentication Attempts Blocked',
        description: '5 consecutive failed password attempts detected from IP 198.51.100.42 targeting account "admin". IP temporarily blacklisted.',
        ipAddress: '198.51.100.42',
        timestamp: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
        status: 'MITIGATED',
        mitigationActionTaken: 'IP automatically added to VSEC Firewall Ban List for 30 minutes.'
      }
    ];

    // Seed Audit Log
    this.auditRecords = [
      {
        id: 'AUD-SEC-8801',
        timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
        actor: 'alex.mercer (SUPER_ADMIN)',
        ipAddress: '192.168.10.45',
        actionType: 'LOGIN_SUCCESS',
        resourceTarget: 'VSEC Authentication Gateway',
        status: 'SUCCESS',
        details: 'User successfully authenticated via MFA TOTP token.'
      }
    ];
  }

  public getActiveSessions(): SecurityUserSession[] {
    return Array.from(this.activeSessions.values());
  }

  public getPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  public getAlerts(): SecurityAlert[] {
    return this.alerts;
  }

  public getAuditRecords(): SecurityAuditRecord[] {
    return this.auditRecords;
  }

  public getVaultSecrets(): VaultSecret[] {
    return Array.from(this.secretsVault.values());
  }

  public authenticateUser(
    username: string, 
    method: AuthMethod, 
    ipAddress: string, 
    mfaCode?: string
  ): { success: boolean; session?: SecurityUserSession; message: string } {
    // Check brute force
    const failedInfo = this.failedLoginTracker.get(ipAddress) || { attempts: 0, lastAttempt: 0 };
    if (failedInfo.attempts >= 5 && (Date.now() - failedInfo.lastAttempt) < 1000 * 60 * 30) {
      this.recordAudit('LOGIN_FAILED', username, ipAddress, 'DENIED', 'Blocked by VSEC Lockout Guard (Too many failed attempts).');
      return {
        success: false,
        message: 'Account/IP temporarily locked due to repeated authentication failures. Try again in 30 minutes.'
      };
    }

    if (!username || username.trim().length === 0) {
      this.trackFailedLogin(ipAddress);
      this.recordAudit('LOGIN_FAILED', 'UNKNOWN', ipAddress, 'DENIED', 'Empty username submitted.');
      return { success: false, message: 'Invalid credentials supplied.' };
    }

    // Generate authenticated session
    const now = new Date();
    const expire = new Date(now.getTime() + 1000 * 60 * 60 * 8);

    const session: SecurityUserSession = {
      sessionId: `SESS-${Date.now().toString().slice(-4)}`,
      userId: `USR-${Math.floor(100 + Math.random() * 900)}`,
      username,
      fullName: username.replace('.', ' ').toUpperCase(),
      role: username.includes('admin') ? 'SUPER_ADMIN' : 'GENERAL_USER',
      authMethod: method,
      mfaVerified: method === 'MFA_TOTP' || !!mfaCode,
      ipAddress,
      userAgent: 'Mozilla/5.0 (Vertex Security Gateway)',
      deviceId: `DEV-BIND-${Date.now().toString().slice(-4)}`,
      companyScope: 'Vertex Global Enterprises Corp',
      branchScope: 'HQ-NY',
      departmentScope: 'Information Security',
      issuedAt: now.toISOString(),
      expiresAt: expire.toISOString(),
      lastActiveAt: now.toISOString(),
      isSuspicious: false
    };

    this.activeSessions.set(session.sessionId, session);
    this.failedLoginTracker.delete(ipAddress);

    this.recordAudit(
      'LOGIN_SUCCESS',
      username,
      ipAddress,
      'SUCCESS',
      `User authenticated via ${method}. Session ${session.sessionId} granted.`
    );

    auditEngine.logAction(
      'SECURITY_AUTHENTICATED',
      'VSEC Engine',
      `User ${username} logged in successfully via ${method} from ${ipAddress}`,
      'info',
      'VSEC Auth Core'
    );

    return {
      success: true,
      session,
      message: `Authentication successful. Welcome, ${session.fullName}.`
    };
  }

  private trackFailedLogin(ipAddress: string): void {
    const info = this.failedLoginTracker.get(ipAddress) || { attempts: 0, lastAttempt: 0 };
    info.attempts += 1;
    info.lastAttempt = Date.now();
    this.failedLoginTracker.set(ipAddress, info);

    if (info.attempts >= 5) {
      const alert: SecurityAlert = {
        alertId: `ALT-SEC-${Date.now().toString().slice(-4)}`,
        severity: 'HIGH',
        title: 'Brute Force Attack Detected & Blocked',
        description: `IP address ${ipAddress} exceeded maximum 5 failed attempts. Automated lockout engaged.`,
        ipAddress,
        timestamp: new Date().toISOString(),
        status: 'OPEN',
        mitigationActionTaken: 'IP blacklisted for 30 minutes.'
      };
      this.alerts.unshift(alert);
    }
  }

  public terminateSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    this.activeSessions.delete(sessionId);
    this.recordAudit(
      'LOGIN_SUCCESS',
      session.username,
      session.ipAddress,
      'SUCCESS',
      `Session ${sessionId} manually terminated by Security Administrator.`
    );

    auditEngine.logAction(
      'SECURITY_SESSION_TERMINATED',
      'VSEC Manager',
      `Session ${sessionId} for ${session.username} terminated.`,
      'info',
      'VSEC Session Guard'
    );

    return true;
  }

  public checkRolePermission(userRole: UserRole, targetResource: string, requiredPermission: string): boolean {
    if (userRole === 'SUPER_ADMIN') return true;
    if (userRole === 'READ_ONLY_GUEST' && requiredPermission !== 'READ') return false;

    return true;
  }

  public rotateSecret(secretId: string): VaultSecret {
    const sec = this.secretsVault.get(secretId);
    if (!sec) throw new Error(`Secret ${secretId} not found in vault.`);

    const now = new Date();
    const nextDue = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);

    sec.encryptedValueHash = `AES256-GCM-CIPHER-HASH-ROTATED-${Date.now()}`;
    sec.lastRotatedAt = now.toISOString();
    sec.nextRotationDueAt = nextDue.toISOString();

    this.recordAudit(
      'SECRET_ACCESSED',
      'VSEC Security Vault',
      '127.0.0.1',
      'SUCCESS',
      `Rotated master cipher hash for secret "${sec.keyName}" (${sec.secretId}).`
    );

    auditEngine.logAction(
      'SECURITY_SECRET_ROTATED',
      'VSEC Vault',
      `Rotated secret ${sec.keyName} successfully. Next rotation due ${nextDue.toLocaleDateString()}`,
      'info',
      'VSEC Vault Engine'
    );

    return sec;
  }

  public recordAudit(
    actionType: SecurityAuditRecord['actionType'],
    actor: string,
    ipAddress: string,
    status: 'SUCCESS' | 'DENIED' | 'FLAGGED',
    details: string
  ): void {
    const rec: SecurityAuditRecord = {
      id: `AUD-SEC-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      actor,
      ipAddress,
      actionType,
      resourceTarget: 'VSEC Security Core',
      status,
      details
    };
    this.auditRecords.unshift(rec);
  }
}

export const securityManager = SecurityManager.getInstance();
