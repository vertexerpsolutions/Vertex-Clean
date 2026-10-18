import React, { useState } from 'react';
import { Award, CheckCircle2, ShieldCheck, Globe, Building2, GraduationCap, Clock, RefreshCw, Cloud, HardDrive } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { LicenseType } from '../../../core/license/LicenseTypes';

export const LicenseTypesView: React.FC = () => {
  const [activeType, setActiveType] = useState<LicenseType>(() => licenseService.getDashboardInfo().type);

  const licenseTypes: { id: LicenseType; title: string; desc: string; seats: string; badge: string; color: string }[] = [
    {
      id: 'trial',
      title: '30-Day Evaluation Trial',
      desc: 'Free 30-day full feature trial with floating 5-node cap and dev watermark.',
      seats: '5 Nodes',
      badge: 'FREE TRIAL',
      color: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    },
    {
      id: 'personal',
      title: 'Personal Edition',
      desc: 'Single developer or small startup license for individual desktop deployments.',
      seats: '1 Desktop Node',
      badge: 'PERSONAL',
      color: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
    },
    {
      id: 'professional',
      title: 'Professional Tier',
      desc: 'Mid-sized business license supporting up to 10 nodes with standard 8x5 SLA.',
      seats: '10 Nodes Pool',
      badge: 'PRO',
      color: 'text-blue-400 border-blue-500/30 bg-blue-500/10'
    },
    {
      id: 'enterprise',
      title: 'Enterprise Unlimited',
      desc: 'Multi-region enterprise cluster entitlement with 24/7 Gold support and KMS integration.',
      seats: 'Unlimited Floating',
      badge: 'ENTERPRISE',
      color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
    },
    {
      id: 'government',
      title: 'Government / Defense Security Tier',
      desc: 'FIPS 140-3 compliant air-gapped entitlement with custom RSA key pair signing.',
      seats: 'Air-Gapped Vaults',
      badge: 'GOVERNMENT',
      color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    },
    {
      id: 'educational',
      title: 'Educational & Academic Grant',
      desc: 'Discounted academic institutional license for universities and non-profit research.',
      seats: 'Institutional 100 Seats',
      badge: 'ACADEMIC',
      color: 'text-sky-400 border-sky-500/30 bg-sky-500/10'
    },
    {
      id: 'lifetime',
      title: 'Perpetual Lifetime License',
      desc: 'One-time perpetual purchase license with optional yearly maintenance updates.',
      seats: 'Perpetual',
      badge: 'LIFETIME',
      color: 'text-amber-300 border-amber-400/30 bg-amber-400/10'
    },
    {
      id: 'subscription',
      title: 'Annual SaaS Subscription',
      desc: 'Yearly recurring subscription with continuous automatic feature updates and cloud backup.',
      seats: 'Recurring Seat Pool',
      badge: 'SUBSCRIPTION',
      color: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
    },
    {
      id: 'offline',
      title: 'Offline AirGap License',
      desc: 'Self-contained offline license file with hardware fingerprint signature validation.',
      seats: 'Offline Node',
      badge: 'AIRGAP OFFLINE',
      color: 'text-slate-300 border-slate-700 bg-slate-800'
    },
    {
      id: 'cloud',
      title: 'Cloud Native Serverless',
      desc: 'Usage-based Cloud Run container licensing integrated directly with Google Cloud Platform.',
      seats: 'Pay-per-Pod',
      badge: 'CLOUD RUN',
      color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10'
    }
  ];

  const handleSwitch = (type: LicenseType) => {
    setActiveType(type);
    licenseService.switchLicenseType(type);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 02: License Types & Entitlements Catalog</h2>
            <p className="text-xs text-slate-400">Select active license tier (Trial, Personal, Pro, Enterprise, Government, Educational, Lifetime, Subscription, Offline, Cloud)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 font-mono text-xs">
          {licenseTypes.map((t) => {
            const isSelected = activeType === t.id;
            return (
              <div
                key={t.id}
                onClick={() => handleSwitch(t.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-950 border-amber-500 ring-2 ring-amber-500/20 shadow-xl'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${t.color}`}>
                      {t.badge}
                    </span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 mt-1">{t.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1">{t.desc}</p>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                  <span>Allocation:</span>
                  <span className="text-slate-200 font-bold">{t.seats}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
