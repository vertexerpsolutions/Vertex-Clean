import React, { useState } from 'react';
import { Users, Database, Building2, Plus, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { cloudService } from '../../../services/cloudService';
import { EnterpriseTenantConfig } from '../../../core/cloud/CloudTypes';

export const MultiTenantView: React.FC = () => {
  const [tenants, setTenants] = useState<EnterpriseTenantConfig[]>(cloudService.getTenants());
  const [showAddModal, setShowAddModal] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [tier, setTier] = useState<EnterpriseTenantConfig['tier']>('Enterprise SaaS Dedicated');

  const handleProvisionTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !subdomain) return;
    cloudService.provisionTenant(orgName, subdomain, tier);
    setTenants([...cloudService.getTenants()]);
    setOrgName('');
    setSubdomain('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Phase 02: Multi-Tenant Enterprise Architecture</h2>
              <p className="text-xs text-slate-400">Isolated PostgreSQL Database Schemas, Company & Branch RBAC Boundaries</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-500 text-slate-950 hover:bg-blue-400 font-mono text-xs font-bold transition-all shadow-lg shadow-blue-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New SaaS Tenant</span>
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleProvisionTenant} className="p-6 rounded-2xl bg-slate-900 border border-blue-500/40 shadow-2xl space-y-4">
          <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">Provision Tenant Sandbox</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-400">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="e.g. Sterling Financial Group"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400">Subdomain Prefix</label>
              <input
                type="text"
                value={subdomain}
                onChange={e => setSubdomain(e.target.value)}
                placeholder="e.g. sterling"
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400">Subscription Tier</label>
              <select
                value={tier}
                onChange={e => setTier(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="Enterprise SaaS Dedicated">Enterprise SaaS Dedicated (32 vCPU)</option>
                <option value="Business SaaS Clustered">Business SaaS Clustered (16 vCPU)</option>
                <option value="Standard Cloud">Standard Cloud (8 vCPU)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-500 text-slate-950 text-xs font-mono font-bold"
            >
              Confirm Provisioning
            </button>
          </div>
        </form>
      )}

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">Active Subscribed SaaS Tenants</h3>
        <div className="space-y-4">
          {tenants.map(t => (
            <div key={t.tenantId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-100 font-mono">{t.organizationName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {t.tier}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Tenant ID: {t.tenantId} | URL: <span className="text-blue-400">{t.subdomain}</span>
                  </div>
                </div>

                <span className="flex items-center space-x-1 px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t.status.toUpperCase()}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-800/60">
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">PG DB Schema</div>
                  <div className="text-xs font-bold text-slate-300 font-mono">{t.databaseSchema}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">Companies / Branches</div>
                  <div className="text-xs font-bold text-slate-300 font-mono">{t.companyCount} Companies ({t.branchCount} Branches)</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">Allocated Resources</div>
                  <div className="text-xs font-bold text-slate-300 font-mono">{t.allocatedCpuCores} vCPU / {t.allocatedRamGb} GB RAM</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-slate-500 uppercase">Provisioned Date</div>
                  <div className="text-xs font-bold text-slate-300 font-mono">{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
