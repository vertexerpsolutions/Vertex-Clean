import React, { useState } from 'react';
import { Package, ArrowRight, ArrowLeft, CheckCircle2, Folder, ShieldCheck, Play, HardDrive, Check } from 'lucide-react';
import { installerService } from '../../../services/installerService';
import { WizardStep } from '../../../core/installer/InstallerTypes';

export const InstallationWizardView: React.FC = () => {
  const [step, setStep] = useState<WizardStep>(() => installerService.getWizardStep());
  const [accepted, setAccepted] = useState(() => installerService.isLicenseAccepted());
  const [path, setPath] = useState(() => installerService.getInstallPath());
  const [progressPct, setProgressPct] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);

  const prerequisites = installerService.getPrerequisites();

  const handleNext = () => {
    if (step === 'welcome') setStep('license');
    else if (step === 'license') setStep('prerequisites');
    else if (step === 'prerequisites') setStep('path');
    else if (step === 'path') {
      setStep('progress');
      runProgressSimulation();
    }
  };

  const handleBack = () => {
    if (step === 'license') setStep('welcome');
    else if (step === 'prerequisites') setStep('license');
    else if (step === 'path') setStep('prerequisites');
  };

  const runProgressSimulation = () => {
    setIsInstalling(true);
    setProgressPct(0);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setProgressPct(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsInstalling(false);
        setStep('completion');
      }
    }, 200);
  };

  const handleToggleAccept = () => {
    const val = installerService.toggleLicenseAcceptance();
    setAccepted(val);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: Enterprise Installation Wizard</h2>
            <p className="text-xs text-slate-400">Step-by-Step Interactive GUI Setup, License Verification & Prerequisite Validation</p>
          </div>
        </div>

        {/* Wizard Steps Indicator */}
        <div className="flex items-center justify-between my-6 border-b border-slate-800 pb-4 overflow-x-auto font-mono text-xs">
          {(['welcome', 'license', 'prerequisites', 'path', 'progress', 'completion'] as WizardStep[]).map((s, idx) => (
            <div key={s} className="flex items-center space-x-2 shrink-0">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  step === s
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {idx + 1}
              </span>
              <span className={`capitalize font-bold ${step === s ? 'text-amber-400' : 'text-slate-500'}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Wizard Body Container */}
        <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 min-h-[260px] flex flex-col justify-between">
          {step === 'welcome' && (
            <div className="space-y-4">
              <h3 className="text-xl font-extrabold text-slate-100">Welcome to Vertex ERP Ultimate v1.0 Setup</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-mono">
                This installer will deploy Vertex ERP Ultimate Enterprise Edition on your local machine, configuring double-entry VGF engines, desktop WAL storage, and cloud synchronization sockets.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-amber-300 space-y-1">
                <div>- Target Architecture: Windows x64 (Native C++ / .NET 8)</div>
                <div>- MSI Code: {`{90A1B2C3-D4E5-4F6A-8B9C-0D1E2F3A4B5C}`}</div>
              </div>
            </div>
          )}

          {step === 'license' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-100 font-mono">End User License Agreement (EULA)</h3>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 h-36 overflow-y-auto font-mono text-[11px] text-slate-400 leading-relaxed">
                <p className="font-bold text-slate-200 mb-2">VERTEX ERP ULTIMATE ENTERPRISE SOFTWARE LICENSE AGREEMENT</p>
                <p>1. GRANT OF LICENSE: Subject to the terms of this Agreement, Vertex Systems grants you a non-exclusive, non-transferable license to execute Vertex ERP Ultimate.</p>
                <p className="mt-2">2. HARDWARE ATTESTATION: Device GUID and TPM 2.0 signatures will be registered for auditing and cryptographically hashed license compliance.</p>
                <p className="mt-2">3. HYBRID SYNCHRONIZATION: Local SQLite transaction queues will sync incrementally to multi-tenant Cloud Run containers.</p>
              </div>
              <label className="flex items-center space-x-2 text-xs font-mono text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={handleToggleAccept}
                  className="rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span>I accept the terms in the License Agreement</span>
              </label>
            </div>
          )}

          {step === 'prerequisites' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-base font-bold text-slate-100">System Prerequisites Check</h3>
              <div className="space-y-2">
                {prerequisites.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{p.name}</div>
                      <div className="text-[10px] text-slate-500">Required: {p.required} | Detected: {p.detected}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {p.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'path' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-base font-bold text-slate-100">Select Installation Directory</h3>
              <p className="text-slate-400">Choose the destination folder on local NVMe / SSD drive:</p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                />
                <button
                  onClick={() => setPath('C:\\Program Files\\Vertex ERP Ultimate')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 font-bold"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {step === 'progress' && (
            <div className="space-y-4 font-mono text-xs">
              <h3 className="text-base font-bold text-slate-100">Installing Vertex ERP Ultimate...</h3>
              <p className="text-slate-400">Extracting binaries, registering system services, and binding TLS certificates...</p>
              <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                ></div>
              </div>
              <div className="text-right text-amber-400 font-bold">{progressPct}% Complete</div>
            </div>
          )}

          {step === 'completion' && (
            <div className="space-y-4 font-mono text-xs text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-xl font-bold text-slate-100">Installation Completed Successfully!</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Vertex ERP Ultimate v1.0 has been deployed to <span className="text-slate-200">{path}</span>. Desktop services and background auto-update hooks are active.
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
            <button
              onClick={handleBack}
              disabled={step === 'welcome' || step === 'progress' || step === 'completion'}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            {step !== 'completion' && step !== 'progress' && (
              <button
                onClick={handleNext}
                disabled={step === 'license' && !accepted}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1 transition-all"
              >
                <span>{step === 'path' ? 'Install Now' : 'Next'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 'completion' && (
              <button
                onClick={() => setStep('welcome')}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all"
              >
                Finish & Launch
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
