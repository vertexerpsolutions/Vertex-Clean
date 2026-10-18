import React, { useState } from 'react';
import { 
  Key, 
  ShieldCheck, 
  Award, 
  Lock, 
  Unlock, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Users, 
  Building2, 
  GitBranch, 
  Smartphone, 
  HardDrive, 
  Zap, 
  Calendar, 
  CreditCard, 
  FileText, 
  Search, 
  Check, 
  Sliders, 
  BookOpen, 
  Copy, 
  ShieldAlert, 
  Layers, 
  Activity, 
  Download, 
  Upload
} from 'lucide-react';
import { 
  licenseManager, 
  LicenseProfile, 
  LicenseType, 
  ActivationRecord, 
  SubscriptionHistoryItem 
} from '../../../core/vpe/license';

interface VLEWorkspaceProps {
  onOpenGlobalSearch?: () => void;
}

export const VLEWorkspace: React.FC<VLEWorkspaceProps> = ({ onOpenGlobalSearch }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activation' | 'features' | 'subscription' | 'security' | 'docs'>('overview');
  const [msg, setMsg] = useState<string | null>(null);

  // Activation Wizard State
  const [activationMethod, setActivationMethod] = useState<'ONLINE' | 'OFFLINE_FILE' | 'ACTIVATION_CODE'>('ONLINE');
  const [inputLicenseKey, setInputLicenseKey] = useState<string>('VRTX-ENT-2026-99A8-77B2-C4D1');
  const [hardwareFingerprint, setHardwareFingerprint] = useState<string>('HW-FINGERPRINT-SHA256-9981A7F4');

  // Trigger state refresh
  const currentLicense = licenseManager.getCurrentLicense();
  const validationResult = licenseManager.validateLicense();
  const activationHistory = licenseManager.getActivationHistory();
  const subscriptionHistory = licenseManager.getSubscriptionHistory();

  const handleActivate = () => {
    const res = licenseManager.activateLicenseKey(inputLicenseKey, activationMethod, hardwareFingerprint);
    setMsg(res.message);
    setTimeout(() => setMsg(null), 4500);
  };

  const handleToggleAutoRenew = () => {
    licenseManager.updateAutoRenew(!currentLicense.autoRenew);
    setMsg(`Auto-renewal preference updated to ${!currentLicense.autoRenew}.`);
    setTimeout(() => setMsg(null), 3500);
  };

  const handleManualRenewal = () => {
    const item = licenseManager.triggerManualRenewal();
    setMsg(`Successfully renewed license ${item.licenseKey}. Extended until ${new Date(item.periodEnd).toLocaleDateString()}.`);
    setTimeout(() => setMsg(null), 4500);
  };

  const getLicenseTypeBadge = (type: LicenseType) => {
    switch (type) {
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PROFESSIONAL': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'STANDARD': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'TRIAL': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DEVELOPER': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* VLE Header Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-600 rounded-lg shadow-md">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold tracking-tight text-white">VPE-06 Vertex License Engine (VLE)</h1>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                    v6.0.0 Operational
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Central Licensing Registry, RSA Signatures, Machine Binding, Subscription Quotas & Feature Entitlements
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
                <Search className="w-3.5 h-3.5 text-purple-400" />
                <span>Search License Index (VSE)</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('activation')}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg shadow-sm transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Activation Wizard</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 border-t border-slate-800/80 mt-6 pt-4 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>License Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('activation')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'activation'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Activation & Binding</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'features'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Feature Control ({currentLicense.features.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('subscription')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'subscription'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Subscription & Renewals</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'security'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Signatures</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg transition ${
              activeTab === 'docs'
                ? 'bg-purple-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>License API Guide</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
            <span className="font-semibold">{msg}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-purple-700 hover:text-purple-900 text-xs">Dismiss</button>
        </div>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Main License Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getLicenseTypeBadge(currentLicense.licenseType)}`}>
                    {currentLicense.licenseType} LICENSE
                  </span>
                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>STATUS: {currentLicense.status}</span>
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 mt-2">{currentLicense.editionName}</h2>
                <div className="text-xs font-mono text-purple-700">License Key: {currentLicense.licenseKey}</div>
              </div>

              <div className="flex flex-col items-end text-xs text-slate-600 space-y-1">
                <div>Issued To: <strong className="text-slate-900">{currentLicense.issuedToCompany}</strong></div>
                <div>Contact: <strong className="text-slate-800">{currentLicense.issuedToContact}</strong></div>
                <div>Valid Until: <strong className="text-slate-900">{new Date(currentLicense.expirationDate).toLocaleDateString()}</strong></div>
              </div>
            </div>

            {/* Quotas & Capacity Limits Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>Enterprise Resource & Quota Limits</span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>User Limit</span>
                    <Users className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">42 / {currentLicense.quotas.maxUsers}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '8.4%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Companies</span>
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">3 / {currentLicense.quotas.maxCompanies}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '15%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Branches</span>
                    <GitBranch className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">12 / {currentLicense.quotas.maxBranches}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Hardware POS</span>
                    <Smartphone className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">140 / {currentLicense.quotas.maxDevices}</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '14%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Storage GB</span>
                    <HardDrive className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">420 / {currentLicense.quotas.maxStorageGB} GB</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: '8.4%' }} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>API Trans/Mo</span>
                    <Zap className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-slate-900">142K / 1M</div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: '14.2%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVATION */}
      {activeTab === 'activation' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Vertex License Activation & Machine Binding</h2>
            <p className="text-xs text-slate-500">Online activation server, offline license file import, and node fingerprinting.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">Activation Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setActivationMethod('ONLINE')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-center transition ${
                      activationMethod === 'ONLINE' ? 'bg-purple-50 border-purple-500 text-purple-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Online Server Activation
                  </button>
                  <button
                    onClick={() => setActivationMethod('OFFLINE_FILE')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-center transition ${
                      activationMethod === 'OFFLINE_FILE' ? 'bg-purple-50 border-purple-500 text-purple-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Offline License File (.vlic)
                  </button>
                  <button
                    onClick={() => setActivationMethod('ACTIVATION_CODE')}
                    className={`p-3 rounded-lg border text-xs font-semibold text-center transition ${
                      activationMethod === 'ACTIVATION_CODE' ? 'bg-purple-50 border-purple-500 text-purple-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Short Activation Code
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">License Key / Code</label>
                <input
                  type="text"
                  value={inputLicenseKey}
                  onChange={e => setInputLicenseKey(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Machine Hardware Fingerprint</label>
                <input
                  type="text"
                  value={hardwareFingerprint}
                  onChange={e => setHardwareFingerprint(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono bg-slate-50"
                  readOnly
                />
              </div>

              <button
                onClick={handleActivate}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-lg shadow-sm transition"
              >
                Execute Activation Process
              </button>
            </div>

            {/* Hardware Binding Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Machine Binding Details</h4>
              <div className="space-y-2 text-slate-600">
                <div>Node IP: <strong className="text-slate-800">192.168.10.45</strong></div>
                <div>CPU Serial: <strong className="text-slate-800">INTEL-XEON-9901-A</strong></div>
                <div>MAC Address: <strong className="text-slate-800">00:1A:2B:3C:4D:5E</strong></div>
                <div>OS Kernel: <strong className="text-slate-800">Linux 6.1.0-cloud-run</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FEATURE CONTROL */}
      {activeTab === 'features' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Licensed Module & Feature Entitlements</h2>
            <p className="text-xs text-slate-500">Feature flags dynamically governed by current active license tier.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentLicense.features.map(f => (
              <div key={f.featureId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-800 rounded">
                      {f.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{f.featureName}</h3>
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">{f.featureId}</div>
                </div>

                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ENTITLED
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Subscription & Auto-Renewal Governance</h2>
              <p className="text-xs text-slate-500">Billing frequency, grace periods, and payment audit history.</p>
            </div>

            <button
              onClick={handleManualRenewal}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              Manual Renew License
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Billing & Renewal Preferences</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Billing Cycle:</span>
                  <strong className="text-slate-800">{currentLicense.billingCycle}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Grace Period:</span>
                  <strong className="text-slate-800">{currentLicense.gracePeriodDaysRemaining} Days Remaining</strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span>Automatic Renewal:</span>
                  <button
                    onClick={handleToggleAutoRenew}
                    className={`px-3 py-1 text-xs font-bold rounded-full transition ${
                      currentLicense.autoRenew ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {currentLicense.autoRenew ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-slate-900">Subscription Invoices History</h4>
              <div className="space-y-2">
                {subscriptionHistory.map(sub => (
                  <div key={sub.id} className="p-2.5 bg-white border border-slate-200 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">{sub.invoiceNumber}</div>
                      <div className="text-[10px] text-slate-500">{sub.paymentMethod}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-emerald-700">
                      ${sub.amountPaid.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Security Vault & Digital Signatures</h2>
            <p className="text-xs text-slate-500">RSA-4096 signature verification, AES-256 key bundles, and tamper audit logs.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">RSA-4096 Digital Signature</label>
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono rounded-lg overflow-x-auto">
                {currentLicense.digitalSignature}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Encrypted License Key Bundle (AES-256)</label>
              <div className="p-3 bg-slate-900 text-purple-300 font-mono rounded-lg overflow-x-auto">
                {currentLicense.encryptedKeyBundle}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DOCS */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Vertex License Engine (VLE) Developer Guide</h2>
            <p className="text-xs text-slate-500">SDK reference for validating features and quotas programmatically.</p>
          </div>

          <div className="p-4 bg-slate-900 text-slate-100 rounded-lg space-y-2 font-mono text-xs">
            <div className="text-purple-400 font-bold">// Validate feature access programmatically</div>
            <div>import &#123; licenseManager &#125; from './core/vpe/license';</div>
            <br />
            <div>const hasAI = licenseManager.validateFeature('AI_GEMINI_SUITE');</div>
            <div>console.log('AI Access Granted:', hasAI);</div>
          </div>
        </div>
      )}
    </div>
  );
};
