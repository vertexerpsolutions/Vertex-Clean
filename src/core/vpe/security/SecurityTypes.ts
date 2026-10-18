export type AuthMethod = 
  | 'LOCAL_PASSWORD'
  | 'WINDOWS_NTLM'
  | 'LDAP_AD'
  | 'OAUTH2_SSO'
  | 'JWT_BEARER'
  | 'MFA_TOTP'
  | 'BIOMETRIC_FINGERPRINT'
  | 'HARDWARE_TOKEN';

export type UserRole = 
  | 'SUPER_ADMIN'
  | 'SECURITY_ADMIN'
  | 'COMPLIANCE_OFFICER'
  | 'FINANCE_MANAGER'
  | 'INVENTORY_AUDITOR'
  | 'GENERAL_USER'
  | 'READ_ONLY_GUEST';

export type SecurityThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface SecurityUserSession {
  sessionId: string;
  userId: string;
  username: string;
  fullName: string;
  role: UserRole;
  authMethod: AuthMethod;
  mfaVerified: boolean;
  ipAddress: string;
  userAgent: string;
  deviceId: string;
  companyScope: string;
  branchScope: string;
  departmentScope: string;
  issuedAt: string;
  expiresAt: string;
  lastActiveAt: string;
  isSuspicious: boolean;
}

export interface SecurityPolicy {
  policyId: string;
  name: string;
  category: 'PASSWORD' | 'SESSION' | 'IP_LOCKOUT' | 'MFA' | 'DATA_ENCRYPTION';
  description: string;
  isEnabled: boolean;
  config: Record<string, string | number | boolean>;
}

export interface SecurityAlert {
  alertId: string;
  severity: SecurityThreatSeverity;
  title: string;
  description: string;
  ipAddress: string;
  userId?: string;
  timestamp: string;
  status: 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'DISMISSED';
  mitigationActionTaken?: string;
}

export interface SecurityAuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  ipAddress: string;
  actionType: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'PERMISSION_CHANGED' | 'SECRET_ACCESSED' | 'POLICY_MODIFIED' | 'THREAT_BLOCKED';
  resourceTarget: string;
  status: 'SUCCESS' | 'DENIED' | 'FLAGGED';
  details: string;
}

export interface VaultSecret {
  secretId: string;
  keyName: string;
  category: 'DATABASE_CREDS' | 'API_TOKEN' | 'RSA_PRIVATE_KEY' | 'SSL_CERTIFICATE';
  encryptedValueHash: string;
  lastRotatedAt: string;
  nextRotationDueAt: string;
  accessCount: number;
}
