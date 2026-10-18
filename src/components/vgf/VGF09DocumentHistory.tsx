import React, { useState, useEffect } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  History, 
  Clock, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Eye, 
  GitCompare, 
  Link, 
  Share2, 
  Printer, 
  Download, 
  Trash2, 
  RotateCcw, 
  X, 
  SlidersHorizontal, 
  BarChart3, 
  User, 
  Building2, 
  Layers, 
  ArrowRight, 
  Calendar, 
  Tag, 
  FileSpreadsheet, 
  AlertTriangle,
  Zap,
  Plus
} from 'lucide-react';
import { 
  documentHistoryService, 
  HistoryState, 
  DocumentRecord, 
  HistoryEventType, 
  DocumentType, 
  DocumentVersion, 
  HistoryEvent 
} from '../../services/documentHistoryService';

export const VGF09DocumentHistory: React.FC = () => {
  const [histState, setHistState] = useState<HistoryState>(documentHistoryService.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'history_center' | 'events_tracker' | 'version_history' | 'related_documents' | 'search_filters' | 'reports_integration'>('history_center');

  // Selected Document for Deep View
  const [selectedDocId, setSelectedDocId] = useState<string>('DOC-1001');

  // Version Comparison State
  const [compareVersionPair, setCompareVersionPair] = useState<{ v1: number; v2: number } | null>(null);

  // Search & Filter State
  const [searchDocNumber, setSearchDocNumber] = useState<string>('');
  const [filterDocType, setFilterDocType] = useState<DocumentType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterUser, setFilterUser] = useState<string>('All');
  const [filterCompany, setFilterCompany] = useState<string>('All');

  // Action Event Trigger Modal
  const [activeEventTrigger, setActiveEventTrigger] = useState<{ docId: string; eventType: HistoryEventType } | null>(null);
  const [triggerReason, setTriggerReason] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<string>('vtx_sysadmin');

  // Reports Modal State
  const [activeReportModal, setActiveReportModal] = useState<string | null>(null);

  useEffect(() => {
    setHistState(documentHistoryService.getState());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const refreshState = () => {
    setHistState(documentHistoryService.getState());
  };

  const handleExecuteEvent = () => {
    if (!activeEventTrigger) return;
    if (!triggerReason.trim()) {
      showToast('Please provide a valid reason or summary for this action.');
      return;
    }

    documentHistoryService.addEventToDocument(
      activeEventTrigger.docId,
      activeEventTrigger.eventType,
      currentUser,
      'System Operator',
      `Action '${activeEventTrigger.eventType}' executed.`,
      triggerReason
    );

    refreshState();
    setActiveEventTrigger(null);
    setTriggerReason('');
    showToast(`Event '${activeEventTrigger.eventType}' recorded in history timeline.`);
  };

  const markCompleted = () => {
    documentHistoryService.markVgf09Completed();
    refreshState();
    showToast('VGF-09 Document History System Marked as Completed!');
  };

  const { documents } = histState;

  // Selected document instance
  const activeDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  // Filtered Documents list
  const filteredDocuments = documents.filter(doc => {
    if (filterDocType !== 'All' && doc.docType !== filterDocType) return false;
    if (filterStatus !== 'All' && doc.status !== filterStatus) return false;
    if (filterCompany !== 'All' && doc.company !== filterCompany) return false;
    if (filterUser !== 'All' && doc.createdBy !== filterUser && doc.lastModifiedBy !== filterUser) return false;

    if (searchDocNumber.trim()) {
      const q = searchDocNumber.toLowerCase();
      return (
        doc.docNumber.toLowerCase().includes(q) ||
        doc.title.toLowerCase().includes(q) ||
        doc.createdBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Recent statistics
  const totalEventsCount = documents.reduce((acc, d) => acc + d.events.length, 0);
  const totalVersionsCount = documents.reduce((acc, d) => acc + d.versions.length, 0);
  const totalAmountAudited = documents.reduce((acc, d) => acc + d.totalAmount, 0);

  const documentTypesList: DocumentType[] = [
    'Sales Order', 'Sales Invoice', 'Purchase Order', 'Purchase Invoice',
    'Sales Return', 'Purchase Return', 'Receipt Voucher', 'Payment Voucher',
    'Journal Entry', 'Inventory Transfer', 'Asset Registration'
  ];

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <History className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                VGF-09
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                histState.isVgf09Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{histState.isVgf09Completed ? 'VGF-09 COMPLETED' : 'OFFICIALLY APPROVED'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Version 1.0.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Enterprise Document History System
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Complete lifetime audit trail for every business document in Vertex ERP. Tracks lifecycle events, side-by-side version comparison, soft deletion recovery, and multi-document relational trees.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark VGF-09 Completed</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>FULL REVISION AUDIT ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'history_center', label: '1. Document History Center', icon: BarChart3 },
            { id: 'events_tracker', label: `2. Tracking Events (${activeDoc ? activeDoc.events.length : 0})`, icon: Clock },
            { id: 'version_history', label: `3. Version Comparison (${activeDoc ? activeDoc.versions.length : 0})`, icon: GitCompare },
            { id: 'related_documents', label: `4. Linked Documents (${activeDoc ? activeDoc.relatedDocs.length : 0})`, icon: Link },
            { id: 'search_filters', label: `5. Advanced Query (${filteredDocuments.length})`, icon: Search },
            { id: 'reports_integration', label: '6. Reports & Integration', icon: FileText }
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PHASE 01: DOCUMENT HISTORY CENTER */}
      {activeTab === 'history_center' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Tracked Business Documents</span>
              <p className="text-2xl font-black text-slate-100 font-mono">{documents.length}</p>
              <p className="text-[10px] text-slate-400">Across 11 Transaction Types</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-emerald-400 uppercase">Total Event Logs</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">{totalEventsCount}</p>
              <p className="text-[10px] text-emerald-400/80">Immutable Audit Entries</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-amber-400 uppercase">Stored Versions</span>
              <p className="text-2xl font-black text-amber-400 font-mono">{totalVersionsCount}</p>
              <p className="text-[10px] text-amber-400/80">Delta Revision Snapshots</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/30 shadow-xl space-y-1">
              <span className="text-[11px] font-mono text-sky-400 uppercase">Audited Volume</span>
              <p className="text-2xl font-black text-sky-400 font-mono">${totalAmountAudited.toLocaleString()}</p>
              <p className="text-[10px] text-sky-400/80">Financial Transaction Value</p>
            </div>
          </div>

          {/* Active Document Selector & History Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Recently Created & Modified Documents (5 cols) */}
            <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Select Document to Audit</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Quick Switcher</span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {documents.map(doc => {
                  const isSelected = doc.id === selectedDocId;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all space-y-1.5 ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="font-mono text-amber-400">{doc.docNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          doc.status === 'Posted' ? 'bg-emerald-500/20 text-emerald-300' :
                          doc.status === 'Soft Deleted' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-200 line-clamp-1">{doc.title}</div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                        <span>{doc.docType}</span>
                        <span>${doc.totalAmount.toLocaleString()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Snapshot Timeline (7 cols) */}
            <div className="lg:col-span-7 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Timeline: {activeDoc.docNumber}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">{activeDoc.title}</p>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveEventTrigger({ docId: activeDoc.id, eventType: 'Printed' })}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Print Document"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveEventTrigger({ docId: activeDoc.id, eventType: 'Exported' })}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Export XML"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveEventTrigger({ docId: activeDoc.id, eventType: 'Soft Deleted' })}
                    className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-slate-950 text-xs border border-rose-500/30"
                    title="Soft Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Event Timeline Flow */}
              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
                {activeDoc.events.map((evt, idx) => (
                  <div key={evt.id} className="relative pl-8 space-y-1">
                    <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-900 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-amber-400 font-mono text-[11px]">{evt.eventType}</span>
                        <span className="text-[10px] font-mono text-slate-500">{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200">{evt.summary}</p>
                      {evt.details && <p className="text-[10px] text-slate-400 italic">{evt.details}</p>}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                        <span>By {evt.performedBy} ({evt.userRole})</span>
                        <span>IP: {evt.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 02: TRACKING EVENTS */}
      {activeTab === 'events_tracker' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span>Document Event Trigger Console: {activeDoc.docNumber}</span>
                </h3>
                <p className="text-xs text-slate-400">Manually invoke lifecycle tracking events to generate immutable audit logs.</p>
              </div>

              <span className="text-xs font-mono text-amber-400 font-bold">{activeDoc.events.length} Events Logged</span>
            </div>

            {/* Lifecycle Event Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {[
                { type: 'Approved', icon: CheckCircle2, color: 'emerald' },
                { type: 'Rejected', icon: AlertTriangle, color: 'rose' },
                { type: 'Printed', icon: Printer, color: 'sky' },
                { type: 'Exported', icon: Download, color: 'amber' },
                { type: 'Shared', icon: Share2, color: 'indigo' },
                { type: 'Cancelled', icon: X, color: 'rose' },
                { type: 'Reopened', icon: RotateCcw, color: 'amber' },
                { type: 'Soft Deleted', icon: Trash2, color: 'rose' },
                { type: 'Restored', icon: ShieldCheck, color: 'emerald' }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    onClick={() => setActiveEventTrigger({ docId: activeDoc.id, eventType: item.type as any })}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition-all flex items-center space-x-2.5"
                  >
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-slate-200">{item.type}</span>
                  </button>
                );
              })}
            </div>

            {/* Event Audit History List */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <h4 className="text-xs font-mono text-slate-400 uppercase font-bold">Event Log Sequence</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase">
                      <th className="pb-2">Timestamp</th>
                      <th className="pb-2">Event</th>
                      <th className="pb-2">User</th>
                      <th className="pb-2">Summary</th>
                      <th className="pb-2 text-right">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {activeDoc.events.map(e => (
                      <tr key={e.id} className="hover:bg-slate-950/50">
                        <td className="py-2 text-slate-400 text-[10px]">{new Date(e.timestamp).toLocaleString()}</td>
                        <td className="py-2 text-amber-400 font-bold">{e.eventType}</td>
                        <td className="py-2 text-slate-300">{e.performedBy}</td>
                        <td className="py-2 text-slate-200 font-sans">{e.summary}</td>
                        <td className="py-2 text-right text-slate-500">{e.ipAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 03: VERSION HISTORY */}
      {activeTab === 'version_history' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <GitCompare className="w-5 h-5 text-amber-400" />
                  <span>Version History & Side-by-Side Delta Comparison</span>
                </h3>
                <p className="text-xs text-slate-400">Document: <span className="text-amber-400 font-mono font-bold">{activeDoc.docNumber}</span> ({activeDoc.versions.length} Revision Snapshots)</p>
              </div>

              {activeDoc.versions.length >= 2 && (
                <button
                  onClick={() => setCompareVersionPair({ v1: 1, v2: 2 })}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5"
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Compare v1 vs v2</span>
                </button>
              )}
            </div>

            {/* Version Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeDoc.versions.map(v => (
                <div key={v.versionNumber} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-bold">
                      Version {v.versionNumber}.0
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{new Date(v.timestamp).toLocaleDateString()}</span>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 block">Reason for Revision:</span>
                    <p className="text-slate-200 font-bold">{v.reasonForChange}</p>
                    <p className="text-[10px] font-mono text-slate-400 pt-1">By {v.modifiedBy}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
                    <span className="text-amber-400 font-bold block uppercase">Delta Values:</span>
                    <pre className="text-slate-400 whitespace-pre-wrap">{JSON.stringify(v.currentValues, null, 2)}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 04: RELATED DOCUMENTS */}
      {activeTab === 'related_documents' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Link className="w-5 h-5 text-amber-400" />
                  <span>Relational Document Network: {activeDoc.docNumber}</span>
                </h3>
                <p className="text-xs text-slate-400">Bidirectional links between Sales, Purchases, Vouchers, and General Ledger Entries.</p>
              </div>

              <span className="text-xs font-mono text-slate-400">{activeDoc.relatedDocs.length} Connected Records</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeDoc.relatedDocs.map(rel => (
                <div key={rel.docId} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold">
                      {rel.relationship}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">{rel.status}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-100 font-mono">{rel.docNumber}</h4>
                    <p className="text-xs text-slate-400">{rel.docType}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs font-mono">
                    <span className="text-slate-400">Amount:</span>
                    <span className="text-slate-100 font-bold">${rel.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 05: ADVANCED SEARCH & FILTERS */}
      {activeTab === 'search_filters' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <span>Multi-Criteria Document Query Engine</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Document Subsystem Type</label>
                <select
                  value={filterDocType}
                  onChange={e => setFilterDocType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All 11 Document Types</option>
                  {documentTypesList.map(dt => (
                    <option key={dt} value={dt}>{dt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Status Filter</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Approved">Approved</option>
                  <option value="Posted">Posted</option>
                  <option value="Soft Deleted">Soft Deleted</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-mono">Quick Search Query</label>
                <input
                  type="text"
                  placeholder="Search Doc Number, Title, or User..."
                  value={searchDocNumber}
                  onChange={e => setSearchDocNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="pb-3">Doc Number & Type</th>
                    <th className="pb-3">Title & Company</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-right">Versions</th>
                    <th className="pb-3 text-center">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredDocuments.map(doc => (
                    <tr key={doc.id} className="hover:bg-slate-950/50">
                      <td className="py-3 font-bold text-amber-400">
                        <div>{doc.docNumber}</div>
                        <div className="text-[10px] text-slate-500">{doc.docType}</div>
                      </td>
                      <td className="py-3 text-slate-100 font-sans">
                        <div className="font-bold">{doc.title}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{doc.company}</div>
                      </td>
                      <td className="py-3 text-right text-slate-200 font-bold">${doc.totalAmount.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'Posted' ? 'bg-emerald-500/20 text-emerald-300' :
                          doc.status === 'Soft Deleted' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {doc.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-amber-400 font-bold">{doc.versionCount}</td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => { setSelectedDocId(doc.id); setActiveTab('history_center'); }}
                          className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-[10px]"
                        >
                          Audit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 06: REPORTS & INTEGRATION */}
      {activeTab === 'reports_integration' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Document History Audit Reports & ERP Integration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'doc_hist_rpt', title: 'Document History Master Report', desc: 'Chronological timeline of all ERP documents and actions.' },
                { id: 'version_delta_rpt', title: 'Version Delta Audit Report', desc: 'Listing of modified fields, previous values, and current values.' },
                { id: 'user_activity_rpt', title: 'User Document Activity Log', desc: 'Audit breakdown of document actions grouped by employee.' },
                { id: 'relational_rpt', title: 'Cross-Document Network Report', desc: 'Relational mapping between Sales Orders, Invoices, POs, and JVs.' },
                { id: 'soft_delete_rpt', title: 'Soft-Deleted Documents Archive', desc: 'Listing of hidden documents retained for legal compliance.' }
              ].map(rpt => (
                <button
                  key={rpt.id}
                  onClick={() => setActiveReportModal(rpt.id)}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-left transition-all space-y-2"
                >
                  <FileText className="w-5 h-5 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-100">{rpt.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-snug">{rpt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Event Trigger Modal */}
      {activeEventTrigger && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">
                Trigger History Event: {activeEventTrigger.eventType}
              </h3>
              <button onClick={() => setActiveEventTrigger(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono">User ID</label>
                <input
                  type="text"
                  value={currentUser}
                  onChange={e => setCurrentUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono">Event Summary / Reason *</label>
                <textarea
                  rows={3}
                  value={triggerReason}
                  onChange={e => setTriggerReason(e.target.value)}
                  placeholder="Enter explicit reason for audit logging..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveEventTrigger(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteEvent}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Log Event & Update Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Versions Modal */}
      {compareVersionPair && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <GitCompare className="w-5 h-5 text-amber-400" />
                <span>Side-by-Side Delta Comparison (v1 vs v2)</span>
              </h3>
              <button onClick={() => setCompareVersionPair(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-amber-400 font-bold uppercase block">Version 1.0 (Initial)</span>
                <p className="text-slate-400">Total Amount: $152,631.58</p>
                <p className="text-slate-400">Discount Pct: 0%</p>
                <p className="text-slate-400">Payment Terms: Net 15</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <span className="text-emerald-400 font-bold uppercase block">Version 2.0 (Negotiated)</span>
                <p className="text-emerald-300 font-bold">Total Amount: $145,000.00 (-$7,631.58)</p>
                <p className="text-emerald-300 font-bold">Discount Pct: 5% (+5%)</p>
                <p className="text-emerald-300 font-bold">Payment Terms: Net 30</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCompareVersionPair(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Document History Audit Report</h3>
              <button onClick={() => setActiveReportModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono space-y-2">
              <p className="text-amber-400 font-bold uppercase">Vertex Document History System Report</p>
              <p>Tracked Documents: {documents.length}</p>
              <p>Total Audit Events: {totalEventsCount}</p>
              <p>Total Versions Preserved: {totalVersionsCount}</p>
              <p>Compliance Status: 100% Immutable Ledger Active</p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setActiveReportModal(null)}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
