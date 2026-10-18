import React, { useState, useEffect } from 'react';
import { UnifiedMessageOverlay, detectMessageType } from '../common/UnifiedMessageOverlay';
import { 
  PackageCheck, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Truck, 
  SlidersHorizontal, 
  Calculator, 
  CheckCircle2, 
  X, 
  Check, 
  ShieldCheck, 
  FileText, 
  PlusCircle, 
  Building2, 
  Layers, 
  Clock, 
  DollarSign, 
  FileSpreadsheet, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Send,
  Boxes,
  Zap,
  Tag
} from 'lucide-react';
import { 
  smartReorderService, 
  ReorderState, 
  ReorderRule, 
  InventoryHealthItem, 
  PurchaseRecommendation, 
  PendingPurchaseOrder 
} from '../../services/smartReorderService';

export const VGF08SmartReorderPolicy: React.FC = () => {
  const [reorderState, setReorderState] = useState<ReorderState>(smartReorderService.getState());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tab Navigation
  const [activeTab, setActiveTab] = useState<'reorder_center' | 'reorder_rules' | 'auto_calculations' | 'purchase_recommendations' | 'alerts_monitoring' | 'reports_integration'>('reorder_center');

  // New Rule Form Modal State
  const [isAddRuleOpen, setIsAddRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState<Partial<ReorderRule>>({
    itemCode: 'SKU-LOG-501',
    itemName: 'Industrial Barcode Scanner Wireless',
    category: 'POS Hardware',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-001',
    supplierName: 'Zebra Enterprise Systems',
    minQty: 20,
    maxQty: 100,
    safetyStock: 25,
    reorderPoint: 40,
    economicOrderQty: 30,
    leadTimeDays: 7,
    orderMultiple: 5
  });

  // Edit Recommendation Modal
  const [editingRec, setEditingRec] = useState<PurchaseRecommendation | null>(null);
  const [modQty, setModQty] = useState<number>(0);

  // Report Modal
  const [activeReportModal, setActiveReportModal] = useState<string | null>(null);

  useEffect(() => {
    setReorderState(smartReorderService.getState());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    const duration = detectMessageType(msg) === 'error' ? 2000 : 1000;
    setTimeout(() => setToastMessage(null), duration);
  };

  const refreshState = () => {
    setReorderState(smartReorderService.getState());
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.itemName || !newRule.itemCode) {
      showToast('Please provide Item Code and Name.');
      return;
    }

    const rule: ReorderRule = {
      id: `RUL-${Date.now().toString().slice(-4)}`,
      itemCode: newRule.itemCode || 'SKU-GEN-001',
      itemName: newRule.itemName || 'Generic Inventory Item',
      category: newRule.category || 'General Supplies',
      warehouse: newRule.warehouse || 'WH-NY-MAIN',
      branch: newRule.branch || 'BR-NY-01',
      supplierId: newRule.supplierId || 'SUP-001',
      supplierName: newRule.supplierName || 'Default Enterprise Supplier',
      minQty: Number(newRule.minQty) || 10,
      maxQty: Number(newRule.maxQty) || 100,
      safetyStock: Number(newRule.safetyStock) || 15,
      reorderPoint: Number(newRule.reorderPoint) || 30,
      economicOrderQty: Number(newRule.economicOrderQty) || 20,
      leadTimeDays: Number(newRule.leadTimeDays) || 7,
      orderMultiple: Number(newRule.orderMultiple) || 5
    };

    smartReorderService.addRule(rule);
    refreshState();
    setIsAddRuleOpen(false);
    showToast(`New Reorder Rule created for '${rule.itemName}'!`);
  };

  const handleApproveRec = (recId: string) => {
    smartReorderService.updateRecommendationStatus(recId, 'approved');
    refreshState();
    showToast('Purchase Recommendation APPROVED.');
  };

  const handleRejectRec = (recId: string) => {
    smartReorderService.updateRecommendationStatus(recId, 'rejected');
    refreshState();
    showToast('Purchase Recommendation REJECTED.');
  };

  const handleModifyRecSubmit = () => {
    if (editingRec) {
      smartReorderService.updateRecommendationStatus(editingRec.id, 'modified', modQty);
      refreshState();
      setEditingRec(null);
      showToast(`Quantity updated to ${modQty} units.`);
    }
  };

  const handleGeneratePO = (recId: string) => {
    const poNum = smartReorderService.generatePOFromRecommendation(recId);
    refreshState();
    showToast(`Official Purchase Order ${poNum} generated!`);
  };

  const markCompleted = () => {
    smartReorderService.markVgf08Completed();
    refreshState();
    showToast('VGF-08 Smart Reorder Policy Marked as Completed!');
  };

  const { rules, inventoryHealth, recommendations, pendingOrders } = reorderState;

  // Key Counts
  const criticalCount = inventoryHealth.filter(h => h.healthStatus === 'critical').length;
  const lowStockCount = inventoryHealth.filter(h => h.healthStatus === 'low_stock').length;
  const optimalCount = inventoryHealth.filter(h => h.healthStatus === 'optimal').length;
  const overstockCount = inventoryHealth.filter(h => h.healthStatus === 'overstock').length;

  return (
    <div className="space-y-6">
      {/* Unified Message Overlay */}
      <UnifiedMessageOverlay message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <PackageCheck className="w-48 h-48 text-amber-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold">
                VGF-08
              </span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center space-x-1 border ${
                reorderState.isVgf08Completed
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{reorderState.isVgf08Completed ? 'VGF-08 COMPLETED' : 'OFFICIALLY APPROVED'}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Version 1.0.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              Smart Reorder Policy System
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Automated multi-echelon inventory replenishment matrix. Continuously computes Economic Order Quantities (EOQ), Safety Stocks, Days of Inventory Coverage, and generates direct PO recommendations.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={markCompleted}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark VGF-08 Completed</span>
            </button>
            <div className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/40 text-xs font-bold flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>AUTO REORDER ENGINE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center space-x-2 overflow-x-auto custom-scrollbar">
          {[
            { id: 'reorder_center', label: '1. Reorder Center', icon: PackageCheck },
            { id: 'reorder_rules', label: `2. Reorder Rules (${rules.length})`, icon: SlidersHorizontal },
            { id: 'auto_calculations', label: '3. Automatic Calculations', icon: Calculator },
            { id: 'purchase_recommendations', label: `4. Purchase Suggestions (${recommendations.length})`, icon: ShoppingBag },
            { id: 'alerts_monitoring', label: `5. Monitoring & Alerts (${criticalCount + lowStockCount + overstockCount})`, icon: AlertTriangle },
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

      {/* PHASE 01: REORDER CENTER */}
      {activeTab === 'reorder_center' && (
        <div className="space-y-6 animate-fade-in">
          {/* Inventory Health Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-rose-500/30 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-[11px] font-mono uppercase font-bold">Critical Items</span>
                <AlertTriangle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-rose-400 font-mono">{criticalCount}</p>
              <p className="text-[10px] text-rose-400/80">Below Safety Stock Limit</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-[11px] font-mono uppercase font-bold">Low Stock Items</span>
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-amber-400 font-mono">{lowStockCount}</p>
              <p className="text-[10px] text-amber-400/80">At or Below Reorder Point</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-mono uppercase font-bold">Optimal Stock</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-emerald-400 font-mono">{optimalCount}</p>
              <p className="text-[10px] text-emerald-400/80">Within Min-Max Band</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-sky-500/30 shadow-xl space-y-1">
              <div className="flex items-center justify-between text-sky-400">
                <span className="text-[11px] font-mono uppercase font-bold">Overstock Items</span>
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-2xl font-black text-sky-400 font-mono">{overstockCount}</p>
              <p className="text-[10px] text-sky-400/80">Exceeds Maximum Holding Limit</p>
            </div>
          </div>

          {/* Pending Purchase Orders & Delivery Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Inventory Health Matrix */}
            <div className="lg:col-span-8 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Boxes className="w-4 h-4 text-amber-400" />
                  <span>Inventory Status Overview</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">{inventoryHealth.length} Active SKUs</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                      <th className="pb-3">SKU & Item Name</th>
                      <th className="pb-3">Warehouse</th>
                      <th className="pb-3 text-right">Available</th>
                      <th className="pb-3 text-right">Reorder Pt</th>
                      <th className="pb-3 text-right">Days Cover</th>
                      <th className="pb-3 text-center">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {inventoryHealth.map(h => (
                      <tr key={h.id} className="hover:bg-slate-950/50">
                        <td className="py-3 font-bold text-slate-100">
                          <div>{h.itemName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{h.itemCode}</div>
                        </td>
                        <td className="py-3 text-slate-400 font-mono text-[10px]">{h.warehouse}</td>
                        <td className="py-3 text-right font-mono text-slate-200 font-bold">{h.availableStock}</td>
                        <td className="py-3 text-right font-mono text-slate-400">{h.reorderPoint}</td>
                        <td className="py-3 text-right font-mono text-amber-400 font-bold">{h.daysOfInventory}d</td>
                        <td className="py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            h.healthStatus === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            h.healthStatus === 'low_stock' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            h.healthStatus === 'overstock' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                            'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {h.healthStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Purchase Orders (Phase 01) */}
            <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Pending Deliveries</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">{pendingOrders.length} In-Flight</span>
              </div>

              <div className="space-y-3">
                {pendingOrders.map(po => (
                  <div key={po.poNumber} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-200">
                      <span className="font-mono text-amber-400">{po.poNumber}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                        {po.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{po.supplierName}</div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Delivery: {po.expectedDeliveryDate}</span>
                      <span>${po.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 02: REORDER RULES */}
      {activeTab === 'reorder_rules' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                  <span>Multi-Echelon Reorder Rules Engine</span>
                </h3>
                <p className="text-xs text-slate-400">Configure safety thresholds, EOQ, lead times, and order multiples per SKU/Branch.</p>
              </div>

              <button
                onClick={() => setIsAddRuleOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Define New Reorder Rule</span>
              </button>
            </div>

            {/* Rules Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="pb-3">Item & Category</th>
                    <th className="pb-3">Warehouse & Supplier</th>
                    <th className="pb-3 text-right">Min / Max</th>
                    <th className="pb-3 text-right">Safety Stock</th>
                    <th className="pb-3 text-right">Reorder Pt</th>
                    <th className="pb-3 text-right">EOQ</th>
                    <th className="pb-3 text-right">Lead Time</th>
                    <th className="pb-3 text-right">Order Mult</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {rules.map(r => (
                    <tr key={r.id} className="hover:bg-slate-950/50">
                      <td className="py-3 font-sans font-bold text-slate-100">
                        <div>{r.itemName}</div>
                        <div className="text-[10px] font-mono text-amber-400">{r.itemCode} • {r.category}</div>
                      </td>
                      <td className="py-3 text-slate-400 text-[11px] font-sans">
                        <div>{r.warehouse}</div>
                        <div className="text-[10px] font-mono text-slate-500">{r.supplierName}</div>
                      </td>
                      <td className="py-3 text-right text-slate-200">{r.minQty} / {r.maxQty}</td>
                      <td className="py-3 text-right text-rose-400 font-bold">{r.safetyStock}</td>
                      <td className="py-3 text-right text-amber-400 font-bold">{r.reorderPoint}</td>
                      <td className="py-3 text-right text-emerald-400 font-bold">{r.economicOrderQty}</td>
                      <td className="py-3 text-right text-slate-300">{r.leadTimeDays} days</td>
                      <td className="py-3 text-right text-slate-400">{r.orderMultiple}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 03: AUTOMATIC CALCULATIONS */}
      {activeTab === 'auto_calculations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  <span>Real-Time Inventory Metrics & EOQ Calculations</span>
                </h3>
                <p className="text-xs text-slate-400">Automated formula: <code className="text-amber-300 font-mono">Suggested Qty = Max Qty - (Available Stock + Incoming POs)</code> rounded up to Order Multiple.</p>
              </div>

              <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                Formula Engine Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {inventoryHealth.map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate">{item.itemName}</span>
                    <span className="text-[10px] font-mono text-amber-400">{item.itemCode}</span>
                  </div>

                  <div className="space-y-1.5 text-xs font-mono border-t border-slate-800/80 pt-2">
                    <div className="flex justify-between text-slate-400">
                      <span>On Hand Stock:</span>
                      <span className="text-slate-200">{item.onHandStock}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Reserved Stock:</span>
                      <span className="text-rose-400">{item.reservedStock}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Available Stock:</span>
                      <span className="text-emerald-400 font-bold">{item.availableStock}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Incoming PO Qty:</span>
                      <span className="text-sky-400">{item.incomingQty}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Avg Daily Burn:</span>
                      <span className="text-slate-200">{item.avgDailyConsumption} / day</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                      <span>Days of Inventory:</span>
                      <span className="text-amber-400 font-bold">{item.daysOfInventory} days</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Suggested PO Qty:</span>
                      <span className="text-emerald-400 font-black">{item.suggestedPurchaseQty} units</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 04: PURCHASE RECOMMENDATIONS */}
      {activeTab === 'purchase_recommendations' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  <span>Automated Purchase Recommendations</span>
                </h3>
                <p className="text-xs text-slate-400">Grouped by Supplier, Priority & Warehouse. Approve or modify before generating POs.</p>
              </div>

              <span className="text-xs font-mono text-slate-400">{recommendations.length} Suggestions Generated</span>
            </div>

            <div className="space-y-4">
              {recommendations.map(rec => (
                <div key={rec.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        rec.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                        rec.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {rec.priority}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100">{rec.itemName}</h4>
                      <span className="text-xs font-mono text-slate-500">({rec.itemCode})</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
                        rec.status === 'po_generated' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        rec.status === 'approved' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        rec.status === 'rejected' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {rec.status}
                      </span>
                      {rec.generatedPoNumber && (
                        <span className="text-xs font-mono text-amber-400 font-bold">{rec.generatedPoNumber}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Supplier:</span>
                      <span className="text-slate-200 font-bold">{rec.supplierName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Warehouse / Branch:</span>
                      <span className="text-slate-200">{rec.warehouse}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Suggested vs Approved Qty:</span>
                      <span className="text-amber-400 font-bold">{rec.suggestedQty} → {rec.approvedQty} units</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Estimated Cost:</span>
                      <span className="text-emerald-400 font-bold">${rec.totalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {rec.status !== 'po_generated' && (
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-800/80">
                      {rec.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApproveRec(rec.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => { setEditingRec(rec); setModQty(rec.approvedQty); }}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 font-bold text-xs border border-amber-500/30 transition-colors"
                          >
                            Modify Quantity
                          </button>
                          <button
                            onClick={() => handleRejectRec(rec.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-slate-950 font-bold text-xs border border-rose-500/30 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {rec.status === 'approved' && (
                        <button
                          onClick={() => handleGeneratePO(rec.id)}
                          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center space-x-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Generate Official PO Now</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PHASE 05: MONITORING & ALERTS */}
      {activeTab === 'alerts_monitoring' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>Real-Time Reorder Alerts & Risk Center</span>
                </h3>
                <p className="text-xs text-slate-400">Automated risk evaluation for stockouts, lead time delays, and overstock events.</p>
              </div>

              <span className="text-xs font-mono text-slate-400">Live Telemetry Feed</span>
            </div>

            <div className="space-y-3">
              {inventoryHealth.filter(h => h.alertTriggered).map(item => (
                <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.riskLevel === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}>
                        RISK: {item.riskLevel}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100">{item.itemName} ({item.itemCode})</h4>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500">{item.warehouse}</span>
                  </div>

                  <p className="text-xs text-rose-300 font-mono">{item.alertTriggered}</p>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] font-mono text-amber-400 font-bold block uppercase">Suggested System Action:</span>
                    <p className="text-[11px] text-slate-400">{item.suggestedAction}</p>
                  </div>
                </div>
              ))}
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
              <span>Smart Reorder Reports & ERP Ecosystem Integration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'reorder_rpt', title: 'Reorder Policy Master Report', desc: 'Listing of all active min/max, EOQ, and lead time policies across branches.' },
                { id: 'health_rpt', title: 'Inventory Health Matrix Report', desc: 'Distribution analysis of critical, low-stock, and overstocked SKUs.' },
                { id: 'forecast_rpt', title: 'Stock Forecast & Coverage Report', desc: 'Predictive days-of-inventory burn rate calculations.' },
                { id: 'po_rec_rpt', title: 'PO Recommendation History', desc: 'Audit log of generated purchase suggestions and approvals.' },
                { id: 'critical_rpt', title: 'Critical Stockout Audit', desc: 'High-risk items threatening SLA compliance or production halt.' },
                { id: 'integration_audit', title: 'Ecosystem Sync Audit', desc: 'Integration status with Purchasing, Sales, and Accounting modules.' }
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

      {/* Define New Rule Modal */}
      {isAddRuleOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Define Reorder Policy Rule</h3>
              <button onClick={() => setIsAddRuleOpen(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Item Code</label>
                  <input
                    type="text"
                    value={newRule.itemCode}
                    onChange={e => setNewRule({ ...newRule, itemCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Item Name</label>
                  <input
                    type="text"
                    value={newRule.itemName}
                    onChange={e => setNewRule({ ...newRule, itemName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Min Qty</label>
                  <input
                    type="number"
                    value={newRule.minQty}
                    onChange={e => setNewRule({ ...newRule, minQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Max Qty</label>
                  <input
                    type="number"
                    value={newRule.maxQty}
                    onChange={e => setNewRule({ ...newRule, maxQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Safety Stock</label>
                  <input
                    type="number"
                    value={newRule.safetyStock}
                    onChange={e => setNewRule({ ...newRule, safetyStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Reorder Point</label>
                  <input
                    type="number"
                    value={newRule.reorderPoint}
                    onChange={e => setNewRule({ ...newRule, reorderPoint: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">EOQ</label>
                  <input
                    type="number"
                    value={newRule.economicOrderQty}
                    onChange={e => setNewRule({ ...newRule, economicOrderQty: Number(e.target.value) })}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Lead Time (d)</label>
                  <input
                    type="number"
                    value={newRule.leadTimeDays}
                    onChange={e => setNewRule({ ...newRule, leadTimeDays: Number(e.target.value) })}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono">Order Mult</label>
                  <input
                    type="number"
                    value={newRule.orderMultiple}
                    onChange={e => setNewRule({ ...newRule, orderMultiple: Number(e.target.value) })}
                    className="w-full px-2 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddRuleOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  Save Reorder Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modify Quantity Modal */}
      {editingRec && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100">Modify Purchase Order Quantity</h3>
            <div className="space-y-2 text-xs">
              <p className="text-slate-400">Item: <span className="text-slate-100 font-bold">{editingRec.itemName}</span></p>
              <div>
                <label className="block text-slate-400 mb-1 font-mono">Approved Quantity</label>
                <input
                  type="number"
                  value={modQty}
                  onChange={e => setModQty(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono text-base font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setEditingRec(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleModifyRecSubmit}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {activeReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100">Smart Reorder System Report</h3>
              <button onClick={() => setActiveReportModal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono space-y-2">
              <p className="text-amber-400 font-bold uppercase">Vertex Smart Reorder Policy Audit</p>
              <p>Total Active Policies: {rules.length} Rules</p>
              <p>SKUs Monitored: {inventoryHealth.length} Items</p>
              <p>Pending Suggestions: {recommendations.length} Orders</p>
              <p>Inventory Sync: 100% (Inventory, Purchasing & Accounting Integrated)</p>
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
