import React, { useState } from 'react';
import { Users, Download, CreditCard, LifeBuoy, RefreshCw, CheckCircle2, FileText, Plus } from 'lucide-react';
import { licenseService } from '../../../services/licenseService';
import { PortalPurchaseHistory, SupportRequest } from '../../../core/license/LicenseTypes';

export const CustomerPortalView: React.FC = () => {
  const [purchases, setPurchases] = useState<PortalPurchaseHistory[]>(() => licenseService.getPurchases());
  const [tickets, setTickets] = useState<SupportRequest[]>(() => licenseService.getSupportTickets());
  const [subjectInput, setSubjectInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<'HIGH' | 'CRITICAL' | 'NORMAL'>('NORMAL');
  const [creatingTicket, setCreatingTicket] = useState(false);

  const handleCreateTicket = () => {
    if (!subjectInput.trim()) return;
    setCreatingTicket(true);
    setTimeout(() => {
      licenseService.createSupportTicket(subjectInput, priorityInput);
      setTickets([...licenseService.getSupportTickets()]);
      setSubjectInput('');
      setCreatingTicket(false);
    }, 600);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Phase 07: Enterprise Customer Self-Service Portal</h2>
            <p className="text-xs text-slate-400">License Management, Software Downloads, Invoicing & Purchase History, Activation Recovery and Support Ticketing</p>
          </div>
        </div>

        {/* Purchase History */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 mt-6 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-slate-200 uppercase flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Purchase & Invoicing History ({purchases.length})</span>
          </h3>

          <div className="space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100">{p.invoiceId}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {p.licenseType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {p.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Date: {p.date} | Allocated Seats: {p.seatsCount}</div>
                </div>

                <div className="text-right font-bold text-emerald-400 text-sm">
                  ${p.amountUsd.toLocaleString()} USD
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Support Requests & Ticket Submission */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 font-mono text-xs">
        <h3 className="text-sm font-bold text-slate-200 uppercase flex items-center space-x-2">
          <LifeBuoy className="w-4 h-4 text-cyan-400" />
          <span>Enterprise Technical Support Requests ({tickets.length})</span>
        </h3>

        {/* New Ticket Form */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Support Issue Subject</label>
              <input
                type="text"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                placeholder="Describe activation recovery, offline blob issue or license key problem..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 uppercase mb-1">Priority</label>
              <select
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="NORMAL">NORMAL SLA</option>
                <option value="HIGH">HIGH SLA</option>
                <option value="CRITICAL">CRITICAL 24/7 SLA</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleCreateTicket}
            disabled={creatingTicket}
            className="px-4 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Ticket</span>
          </button>
        </div>

        {/* Existing Tickets */}
        <div className="space-y-3">
          {tickets.map((t) => (
            <div key={t.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-100">{t.ticketNumber}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {t.status}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {t.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">{t.subject}</p>
              </div>

              <div className="text-right text-[10px] text-slate-500">
                Created: {new Date(t.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
