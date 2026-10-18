import React, { useState } from 'react';
import { 
  Search, RefreshCw, Database, Shield, BarChart3, Bookmark, BookOpen, 
  Sparkles, Zap, Layers, CheckCircle2, Sliders, Play, Plus, Trash2, 
  ExternalLink, Pin, Clock, Tag, Cpu, ShieldAlert, Award, FileText,
  User, Building2, Package, Receipt, CreditCard, Landmark, Briefcase, Activity
} from 'lucide-react';
import { searchManager, SearchQuery, SearchResultType } from '../../core/vpe/search';

interface VSEWorkspaceProps {
  onOpenGlobalSearch?: () => void;
}

export const VSEWorkspace: React.FC<VSEWorkspaceProps> = ({ onOpenGlobalSearch }) => {
  const [activeTab, setActiveTab] = useState<
    'playground' | 'index' | 'security' | 'analytics' | 'saved' | 'docs'
  >('playground');

  // Playground state
  const [queryTerm, setQueryTerm] = useState('server');
  const [matchStrategy, setMatchStrategy] = useState<'hybrid' | 'exact' | 'partial' | 'fuzzy'>('hybrid');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [simulatedRole, setSimulatedRole] = useState<string>('Super Administrator');

  // Index Manager state
  const [rebuildStatus, setRebuildStatus] = useState<string | null>(null);
  const [isRebuilding, setIsRebuilding] = useState(false);

  // New Record Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState<SearchResultType>('item');
  const [newModule, setNewModule] = useState('Inventory & Warehouse');

  const indexManagerInstance = searchManager.getIndexManager();
  const indexStats = indexManagerInstance.getIndexStats();
  const analyticsData = searchManager.getAnalytics().getAnalyticsData();
  const savedSearches = searchManager.getSession().getSavedSearches();

  // Execute playground query
  const searchFilters = {
    module: selectedModule !== 'all' ? [selectedModule] : undefined,
    branch: selectedBranch !== 'all' ? [selectedBranch] : undefined
  };

  const searchResponse = searchManager.search({
    term: queryTerm,
    matchStrategy,
    filters: searchFilters,
    userRole: simulatedRole,
    limit: 20
  });

  const handleRebuildIndex = async () => {
    setIsRebuilding(true);
    setRebuildStatus('Rebuilding index across all ERP entities...');
    const result = await indexManagerInstance.rebuildIndex();
    setIsRebuilding(false);
    setRebuildStatus(`Index rebuilt successfully! Total records indexed: ${result.recordCount} in ${result.durationMs}ms`);
  };

  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newCode) return;

    indexManagerInstance.addOrUpdateRecord({
      id: `CUSTOM-${Math.floor(1000 + Math.random() * 9000)}`,
      type: newType,
      title: newTitle,
      subtitle: `Custom Index Record • ${newModule}`,
      code: newCode,
      reference: `REF-${newCode}`,
      description: `Custom user-added index record for ${newTitle}`,
      keywords: [newTitle.toLowerCase(), newCode.toLowerCase(), newType],
      tags: ['Custom Record', 'User Added'],
      module: newModule,
      company: 'Vertex Global Enterprises Corp',
      branch: 'HQ-NY',
      department: 'Custom',
      status: 'Active',
      date: new Date().toISOString().split('T')[0],
      createdBy: 'vtx_sysadmin',
      permissionsRequired: ['Super Administrator']
    });

    setNewTitle('');
    setNewCode('');
    setRebuildStatus(`Added record "${newTitle}" to search index!`);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold tracking-wide uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Platform Engine VPE-01
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium border border-emerald-500/30">
                STATUS: HEALTHY
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Search className="w-8 h-8 text-indigo-400" /> Vertex Universal Search Engine (VSE)
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Central enterprise search infrastructure indexing all 15 ERP business modules, 10 Gold features, and platform records with permission-aware fuzzy matching, smart filtering, and analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenGlobalSearch}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Open Universal Search Bar (Ctrl+K)
            </button>
            <button
              onClick={handleRebuildIndex}
              disabled={isRebuilding}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition border border-slate-700 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRebuilding ? 'animate-spin text-amber-400' : ''}`} /> Rebuild Index
            </button>
          </div>
        </div>

        {/* Engine KPI Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div>
            <div className="text-slate-400">Total Indexed Records</div>
            <div className="text-xl font-bold text-white mt-1 font-mono">{indexStats.totalRecords}</div>
          </div>
          <div>
            <div className="text-slate-400">Avg Query Latency</div>
            <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{analyticsData.avgResponseTimeMs || 1.2} ms</div>
          </div>
          <div>
            <div className="text-slate-400">Total Queries Served</div>
            <div className="text-xl font-bold text-indigo-300 mt-1 font-mono">{analyticsData.totalQueries}</div>
          </div>
          <div>
            <div className="text-slate-400">Security Filtering</div>
            <div className="text-xl font-bold text-amber-300 mt-1 flex items-center gap-1 font-mono">
              <Shield className="w-4 h-4 text-amber-400" /> RBAC Active
            </div>
          </div>
        </div>
      </div>

      {/* Rebuild Status Banner */}
      {rebuildStatus && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {rebuildStatus}
          </span>
          <button onClick={() => setRebuildStatus(null)} className="text-slate-400 hover:text-slate-600">
            Dismiss
          </button>
        </div>
      )}

      {/* Workspace Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-2">
        {[
          { id: 'playground', label: '1. Live Search Playground', icon: Play },
          { id: 'index', label: '2. Index Manager & Controller', icon: Database },
          { id: 'security', label: '3. Security & RBAC Inspector', icon: Shield },
          { id: 'analytics', label: '4. Search Analytics', icon: BarChart3 },
          { id: 'saved', label: '5. Saved Searches & Favorites', icon: Bookmark },
          { id: 'docs', label: '6. Architecture & Specs', icon: BookOpen }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-xs font-bold transition flex items-center gap-2 whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIVE PLAYGROUND */}
      {activeTab === 'playground' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Control Panel */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" /> Search Parameters
              </h3>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Search Term</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={queryTerm}
                    onChange={e => setQueryTerm(e.target.value)}
                    placeholder="Enter query term..."
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Match Strategy</label>
                <select
                  value={matchStrategy}
                  onChange={e => setMatchStrategy(e.target.value as any)}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="hybrid">Hybrid (Exact + Prefix + Partial + Fuzzy)</option>
                  <option value="exact">Exact Match Only</option>
                  <option value="partial">Substring Partial Match</option>
                  <option value="fuzzy">Fuzzy Proximity Match</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Module Filter</label>
                <select
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="all">All Modules</option>
                  <option value="General Ledger & Accounting">General Ledger & Accounting</option>
                  <option value="Accounts Receivable">Accounts Receivable</option>
                  <option value="Accounts Payable">Accounts Payable</option>
                  <option value="Inventory & Warehouse">Inventory & Warehouse</option>
                  <option value="Human Resources & Payroll">Human Resources & Payroll</option>
                  <option value="Treasury & Cash Management">Treasury & Cash Management</option>
                  <option value="Platform Core">Platform Core</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Branch Context</label>
                <select
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="all">All Branches</option>
                  <option value="HQ-NY">HQ New York</option>
                  <option value="BR-LDN">BR London</option>
                  <option value="BR-DXB">BR Dubai</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Simulated User Role</label>
                <select
                  value={simulatedRole}
                  onChange={e => setSimulatedRole(e.target.value)}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                  <option value="HR Administrator">HR Administrator</option>
                  <option value="Restricted User">Restricted User</option>
                </select>
              </div>
            </div>

            {/* Results Display */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Search className="w-4 h-4 text-indigo-600" /> Search Results
                  </h3>
                  <p className="text-xs text-slate-400">
                    Found {searchResponse.totalCount} records in {searchResponse.executionTimeMs}ms
                  </p>
                </div>
                <div className="text-xs text-slate-400">
                  User Role: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{simulatedRole}</span>
                </div>
              </div>

              {searchResponse.results.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs italic">
                  No records matched query &quot;{queryTerm}&quot; with current filters.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {searchResponse.results.map(res => (
                    <div
                      key={res.record.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {res.record.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
                            {res.record.code}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {res.record.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{res.record.description}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1 flex-wrap">
                          <span>Module: <strong className="text-slate-700 dark:text-slate-300">{res.record.module}</strong></span>
                          <span>• Branch: <strong className="text-slate-700 dark:text-slate-300">{res.record.branch}</strong></span>
                          {res.matchedFields.length > 0 && (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              • Matched: {res.matchedFields.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
                        <div className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {res.score} pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: INDEX MANAGER */}
      {activeTab === 'index' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-600" /> Index Health Overview
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Total Records:</span>
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{indexStats.totalRecords}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Last Rebuild:</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300">{new Date(indexStats.lastRebuildTime).toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Indexing Engine:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">In-Memory Trie & Inverted Index</span>
                </div>
              </div>

              <button
                onClick={handleRebuildIndex}
                disabled={isRebuilding}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRebuilding ? 'animate-spin' : ''}`} /> Trigger Full Index Rebuild
              </button>
            </div>

            {/* Add Record Form */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Inject Custom Index Record
              </h3>

              <form onSubmit={handleAddRecord} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400">Title / Name</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Cisco Switch 48-Port"
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400">Code / SKU</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    placeholder="e.g. SKU-CS-48P"
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400">Record Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as SearchResultType)}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  >
                    <option value="item">Item / SKU</option>
                    <option value="customer">Customer</option>
                    <option value="supplier">Supplier</option>
                    <option value="invoice">Invoice</option>
                    <option value="account">Account</option>
                    <option value="document">Document</option>
                  </select>
                </div>
                <div>
                  <label className="font-medium text-slate-600 dark:text-slate-400">Module</label>
                  <input
                    type="text"
                    value={newModule}
                    onChange={e => setNewModule(e.target.value)}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition"
                  >
                    Add Record to Search Index
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Index Records Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" /> Indexed Record Type Distribution
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
              {Object.entries(indexStats.countByType).map(([type, count]) => (
                <div key={type} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-slate-400 uppercase text-[10px] font-bold">{type}</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-0.5">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECURITY & RBAC */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" /> Permission-Aware Search Security Isolation
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              VSE integrates with `ENG-SECURITY` (Security Engine) to verify user roles, branch access, and department rules before returning search results. Users cannot see records they do not have authorization to view.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" /> Role-Based Access Control (RBAC)
                </div>
                <p className="text-[11px] text-slate-500">
                  Filters records based on `permissionsRequired` metadata. E.g. restricted users cannot view audit logs or executive salary accounts.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" /> Branch Multi-Tenant Isolation
                </div>
                <p className="text-[11px] text-slate-500">
                  Users assigned to Dubai branch (BR-DXB) only see Dubai records and HQ shared records, suppressing unauthorized branch records.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> Audit Log Traceability
                </div>
                <p className="text-[11px] text-slate-500">
                  Every search query, parameter, and result set count is logged cryptographically into the platform audit timeline.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SEARCH ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Popular Keywords</h4>
              <div className="space-y-2 text-xs">
                {analyticsData.popularKeywords.map((kw, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-medium text-slate-700 dark:text-slate-300">&quot;{kw.keyword}&quot;</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{kw.count} searches</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm md:col-span-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Search Audit Feed</h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto text-xs">
                {analyticsData.recentQueries.map(q => (
                  <div key={q.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{q.query}&quot;</span>
                      <span className="text-slate-400 ml-2">by {q.userId}</span>
                    </div>
                    <div className="text-right font-mono text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{q.resultsCount} results</span> • {q.latencyMs}ms
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SAVED SEARCHES */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-amber-500" /> Saved Searches & Favorites
            </h3>

            <div className="space-y-3">
              {savedSearches.map(s => (
                <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      {s.name}
                      {s.isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Query: &quot;{s.query.term}&quot;
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setQueryTerm(s.query.term);
                      setActiveTab('playground');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg"
                  >
                    Run Search
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: DOCS & ARCHITECTURE */}
      {activeTab === 'docs' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> VPE-01 Vertex Universal Search Engine Specifications
            </h3>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900">
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Architecture Summary</h4>
                <p>
                  VSE is built on top of the VPE Platform Engine framework as engine ID `ENG-SEARCH`. It manages a centralized memory index (`IndexManager`) of all business entities and platform records, evaluated in real time by `QueryEngine`.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">1. Query Match Strategies</div>
                  <p>Supports Exact Code Match, Substring Prefix Match, Partial Match, and Fuzzy Proximity Levenshtein Match.</p>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 dark:text-slate-200">2. Security & RBAC Isolation</div>
                  <p>Validates user permissions, branch filters, and department roles before serializing search responses.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
