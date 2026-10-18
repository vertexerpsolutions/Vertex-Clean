import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  UserCheck, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Search, 
  Activity, 
  Server, 
  Smartphone, 
  Fingerprint, 
  Globe, 
  Clock, 
  Terminal, 
  Sliders, 
  BookOpen, 
  Layers, 
  Users, 
  ShieldCheck, 
  HardDrive, 
  Radio, 
  Database, 
  KeyRound, 
  LogOut, 
  Zap, 
  Check 
} from 'lucide-react';
import { 
  securityManager, 
  SecurityUserSession, 
  SecurityPolicy, 
  SecurityAlert, 
  SecurityAuditRecord, 
  VaultSecret, 
  AuthMethod, 
  UserRole 
} from '../../../core/vpe/security';

interface VSECWorkspaceProps {
  onOpenGlobalSearch?: () => void;
}

export const VSECWorkspace: React.FC<VSECWorkspaceProps> = ({ onOpenGlobalSearch }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'auth' | 'rbac' | 'vault' | 'threats' | 'audit' | 'docs'>('overview');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Auth test simulator state
  const [testUsername, setTestUsername] = useState<string>('alex.mercer');
  const [testAuthMethod, setTestAuthMethod] = useState<AuthMethod>('MFA_TOTP');
  const [testIpAddress, setTestIpAddress] = useState<string>('192.168.10.45');
  const [testMfaCode, setTestMfaCode] = useState<string>('882914');

  // Trigger state refresh
  const activeSessions = securityManager.getActiveSessions();
  const policies = securityManager.getPolicies();
  const alerts = securityManager.getAlerts();
  const auditRecords = securityManager.getAuditRecords();
  const secrets = securityManager.getVaultSecrets();

  const handleSimulateAuth = () => {
    const res = securityManager.authenticateUser(testUsername, testAuthMethod, testIpAddress, testMfaCode);
    setStatusMsg(res.message);
    setTimeout(() => setStatusMsg(null), 4500);
  };

  const handleTerminateSession = (sessionId: string) => {
    securityManager.terminateSession(sessionId);
    setStatusMsg(`Session ${sessionId} has been terminated.`);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleRotateSecret = (secretId: string) => {
    const sec = securityManager.rotateSecret(secretId);
    setStatusMsg(`Secret "${sec.keyName}" rotated successfully. New cipher hash stored in hardware vault.`);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'HIGH': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* VSEC Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-red-600 rounded-lg shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">VPE-07 Vertex Security Engine (VSEC)</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-500/20 text-red-300 rounded-full border border-red-500/30">
                    v7.0.0 Operational
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Centralized Security Core, MFA/SSO Auth, RBAC Authorization, AES-256 Vault, Adaptive Lockout & Compliance Audit
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenGlobalSearch && (
              <button
                onClick={onOpenGlobalSearch}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
              >
                <Search className="w-3.5 h-3.5 text-red-400" />
                <span>Search Security Index (VSE)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('auth')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Auth Gateway Simulator</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 mt-6 pt-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-red-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Security Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('auth')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'auth'
                ? 'bg-red-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Auth & Active Sessions ({activeSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'rbac'
                ? 'bg-red-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>RBAC & Permissions</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'vault'
                ? 'bg-red-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Secrets Vault ({secrets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('threats')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'threats'
                ? 'bg-red-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Threats & Lockouts ({alerts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'audit'
                ? 'bg-red-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Audit Trail ({auditRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'docs'
                ? 'bg-red-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Security API Guide</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-red-600" />
            <span className="font-semibold">{statusMsg}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-red-700 hover:text-red-900 text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Active User Sessions</span>
                <Users className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{activeSessions.length} Active</div>
              <div className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>100% MFA Enforced for Admins</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Active Security Policies</span>
                <Sliders className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{policies.length} Active</div>
              <div className="text-xs text-slate-500 font-medium">Password, Lockout, MFA, AES-256</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Vault Encrypted Secrets</span>
                <KeyRound className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{secrets.length} Vault Keys</div>
              <div className="text-xs text-slate-500 font-medium">AES-256 GCM Envelope Cipher</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>Open Threat Alerts</span>
                <ShieldAlert className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{alerts.filter(a => a.status === 'OPEN').length} Open</div>
              <div className="text-xs text-emerald-600 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Brute-force Auto Guard Active</span>
              </div>
            </div>
          </div>

          {/* Active Policies List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Enforced Platform Security Policies</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map(p => (
                <div key={p.policyId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-800 rounded">
                      {p.category}
                    </span>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                      ENFORCED
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                  <p className="text-xs text-slate-600">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTH & SESSIONS */}
      {activeTab === 'auth' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Auth Simulator */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Auth Gateway Test Simulator</h3>
              <p className="text-xs text-slate-500">Test Multi-Factor, LDAP, and OAuth authentication flows.</p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  value={testUsername}
                  onChange={e => setTestUsername(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Authentication Protocol</label>
                <select
                  value={testAuthMethod}
                  onChange={e => setTestAuthMethod(e.target.value as AuthMethod)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg"
                >
                  <option value="MFA_TOTP">MFA TOTP Token</option>
                  <option value="LDAP_AD">Windows Active Directory / LDAP</option>
                  <option value="OAUTH2_SSO">OAuth2 Single Sign-On (SSO)</option>
                  <option value="LOCAL_PASSWORD">Standard Local Password</option>
                  <option value="BIOMETRIC_FINGERPRINT">Biometric Fingerprint</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Client IP Address</label>
                <input
                  type="text"
                  value={testIpAddress}
                  onChange={e => setTestIpAddress(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">TOTP Security Code</label>
                <input
                  type="text"
                  value={testMfaCode}
                  onChange={e => setTestMfaCode(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-[11px]"
                />
              </div>

              <button
                onClick={handleSimulateAuth}
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg shadow-sm transition"
              >
                Authenticate & Grant JWT
              </button>
            </div>
          </div>

          {/* Active Sessions List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Active Authenticated User Sessions</h3>

            <div className="space-y-3">
              {activeSessions.map(sess => (
                <div key={sess.sessionId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-xs text-indigo-600">{sess.sessionId}</span>
                        <h4 className="text-xs font-bold text-slate-900">{sess.fullName} ({sess.role})</h4>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        IP: {sess.ipAddress} | Auth: {sess.authMethod} | Device: {sess.deviceId}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTerminateSession(sess.sessionId)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center space-x-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Revoke Session</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RBAC PERMISSIONS */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) & Scope Matrix</h2>
            <p className="text-xs text-slate-500">Fine-grained permissions for ERP Modules, Gold Features, Platform Engines, and APIs.</p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-200 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Platform Target Scope</th>
                  <th className="p-3 text-center">Super Admin</th>
                  <th className="p-3 text-center">Security Admin</th>
                  <th className="p-3 text-center">Finance Manager</th>
                  <th className="p-3 text-center">General User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">VPE Platform Engines (VSE, VWE, VNE, VRE, VIE, VLE, VSEC)</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL (ALL)</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL (VSEC, VNE)</td>
                  <td className="p-3 text-center text-amber-600 font-bold">READ ONLY</td>
                  <td className="p-3 text-center text-rose-600 font-bold">DENIED</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">Financial Accounting & General Ledger</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL</td>
                  <td className="p-3 text-center text-rose-600 font-bold">DENIED</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL</td>
                  <td className="p-3 text-center text-rose-600 font-bold">DENIED</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">Sales Invoice Profitability & Item Cost Margins (PERM_ACT_VIEW_INVOICE_PROFIT)</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL</td>
                  <td className="p-3 text-center text-rose-600 font-bold">DENIED</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL</td>
                  <td className="p-3 text-center text-rose-600 font-bold">DENIED</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">Secrets Vault & Encryption Key Rotation</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL</td>
                  <td className="p-3 text-center text-emerald-600 font-bold">FULL</td>
                  <td className="p-3 text-center text-rose-600 font-bold">DENIED</td>
                  <td className="p-3 text-center text-rose-600 font-bold">DENIED</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SECRETS VAULT */}
      {activeTab === 'vault' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Hardware Encrypted Secrets Vault (AES-256 GCM)</h2>
            <p className="text-xs text-slate-500">Secure credential storage and 1-click key rotation for master database and payment keys.</p>
          </div>

          <div className="space-y-4">
            {secrets.map(sec => (
              <div key={sec.secretId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded">
                        {sec.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{sec.keyName}</h3>
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-1">
                      Cipher Hash: {sec.encryptedValueHash}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRotateSecret(sec.secretId)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg shadow-sm transition inline-flex items-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Rotate Key Now</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/80">
                  <div>Last Rotated: <strong className="text-slate-800">{new Date(sec.lastRotatedAt).toLocaleDateString()}</strong></div>
                  <div>Next Due: <strong className="text-slate-800">{new Date(sec.nextRotationDueAt).toLocaleDateString()}</strong></div>
                  <div>Access Count: <strong className="text-slate-800">{sec.accessCount.toLocaleString()}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: THREATS */}
      {activeTab === 'threats' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Threat Protection & Adaptive Lockout Monitor</h2>
            <p className="text-xs text-slate-500">Automated firewall IP blocks, brute-force mitigation, and suspicious activity detection.</p>
          </div>

          <div className="space-y-4">
            {alerts.map(alt => (
              <div key={alt.alertId} className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getSeverityBadge(alt.severity)}`}>
                      {alt.severity}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{alt.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{new Date(alt.timestamp).toLocaleTimeString()}</span>
                </div>

                <p className="text-xs text-slate-700">{alt.description}</p>
                {alt.mitigationActionTaken && (
                  <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    Mitigation: {alt.mitigationActionTaken}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Security Audit & Compliance Trail</h2>
            <p className="text-xs text-slate-500">Immutable ledger tracking authentication, permission modifications, and vault accesses.</p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-200 font-semibold border-b border-slate-700">
                <tr>
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Action Type</th>
                  <th className="p-3">Details</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {auditRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600">{rec.id}</td>
                    <td className="p-3 font-bold text-slate-900">{rec.actor}</td>
                    <td className="p-3 font-mono text-slate-600">{rec.ipAddress}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 rounded">
                        {rec.actionType}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{rec.details}</td>
                    <td className="p-3 text-center">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: DOCS */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Vertex Security Engine (VSEC) Developer Guide</h2>
            <p className="text-xs text-slate-500">API integration patterns for authentication and role authorization.</p>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-2 font-mono text-xs">
            <div className="text-red-400 font-bold">// Validate permission programmatically</div>
            <div>import &#123; securityManager &#125; from './core/vpe/security';</div>
            <br />
            <div>const isAllowed = securityManager.checkRolePermission('FINANCE_MANAGER', 'MOD_FINANCE', 'WRITE');</div>
            <div>console.log('Access Granted:', isAllowed);</div>
          </div>
        </div>
      )}
    </div>
  );
};
