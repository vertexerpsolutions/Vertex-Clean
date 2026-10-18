export interface ReorderRule {
  id: string;
  itemCode: string;
  itemName: string;
  category: string;
  warehouse: string;
  branch: string;
  supplierId: string;
  supplierName: string;
  minQty: number;
  maxQty: number;
  safetyStock: number;
  reorderPoint: number;
  economicOrderQty: number; // EOQ
  leadTimeDays: number;
  orderMultiple: number;
}

export interface InventoryHealthItem {
  id: string;
  ruleId: string;
  itemCode: string;
  itemName: string;
  category: string;
  warehouse: string;
  branch: string;
  supplierId: string;
  supplierName: string;
  
  // Quantities
  onHandStock: number;
  reservedStock: number;
  availableStock: number; // onHand - reserved
  incomingQty: number; // pending POs
  avgDailyConsumption: number;
  
  // Rules reference
  minQty: number;
  maxQty: number;
  safetyStock: number;
  reorderPoint: number;
  economicOrderQty: number;
  leadTimeDays: number;
  orderMultiple: number;

  // Calculated metrics
  suggestedPurchaseQty: number;
  daysOfInventory: number; // availableStock / avgDailyConsumption
  stockCoveragePct: number;
  
  // Status & Priority
  healthStatus: 'critical' | 'low_stock' | 'optimal' | 'overstock';
  riskLevel: 'high' | 'medium' | 'low' | 'none';
  alertTriggered?: string;
  suggestedAction: string;
}

export interface PurchaseRecommendation {
  id: string;
  itemCode: string;
  itemName: string;
  supplierId: string;
  supplierName: string;
  warehouse: string;
  branch: string;
  category: string;
  suggestedQty: number;
  approvedQty: number;
  unitCost: number;
  totalCost: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'pending' | 'approved' | 'modified' | 'rejected' | 'po_generated';
  generatedPoNumber?: string;
}

export interface PendingPurchaseOrder {
  poNumber: string;
  supplierName: string;
  warehouse: string;
  totalAmount: number;
  expectedDeliveryDate: string;
  itemCount: number;
  status: 'ordered' | 'in_transit' | 'customs_hold';
}

export interface ReorderState {
  rules: ReorderRule[];
  inventoryHealth: InventoryHealthItem[];
  recommendations: PurchaseRecommendation[];
  pendingOrders: PendingPurchaseOrder[];
  isVgf08Completed: boolean;
}

const STORAGE_KEY = 'VERTEX_VGF08_SMART_REORDER';

export const INITIAL_REORDER_RULES: ReorderRule[] = [
  {
    id: 'RUL-101',
    itemCode: 'SKU-ENT-101',
    itemName: 'Enterprise Server Node X1',
    category: 'Hardware & IT',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-001',
    supplierName: 'Dell Enterprise Systems Inc',
    minQty: 10,
    maxQty: 60,
    safetyStock: 15,
    reorderPoint: 25,
    economicOrderQty: 20,
    leadTimeDays: 14,
    orderMultiple: 5
  },
  {
    id: 'RUL-102',
    itemCode: 'SKU-ENT-102',
    itemName: 'Gigabit Switch 48-Port PoE',
    category: 'Hardware & IT',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-002',
    supplierName: 'Cisco Systems Global',
    minQty: 30,
    maxQty: 150,
    safetyStock: 40,
    reorderPoint: 60,
    economicOrderQty: 50,
    leadTimeDays: 10,
    orderMultiple: 10
  },
  {
    id: 'RUL-103',
    itemCode: 'SKU-POS-201',
    itemName: 'Thermal Receipt Printer 80mm',
    category: 'POS Hardware',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-003',
    supplierName: 'Epson POS Solutions',
    minQty: 50,
    maxQty: 400,
    safetyStock: 60,
    reorderPoint: 100,
    economicOrderQty: 100,
    leadTimeDays: 7,
    orderMultiple: 20
  },
  {
    id: 'RUL-104',
    itemCode: 'SKU-CAF-301',
    itemName: 'Artisanal Espresso Beans 1kg',
    category: 'Food & Beverage',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-004',
    supplierName: 'Roasters Guild International',
    minQty: 100,
    maxQty: 800,
    safetyStock: 120,
    reorderPoint: 200,
    economicOrderQty: 250,
    leadTimeDays: 5,
    orderMultiple: 25
  },
  {
    id: 'RUL-105',
    itemCode: 'SKU-OFF-401',
    itemName: 'Ergonomic Executive Mesh Chair',
    category: 'Office Furniture',
    warehouse: 'WH-LON-02',
    branch: 'BR-LON-02',
    supplierId: 'SUP-005',
    supplierName: 'Herman Miller Commercial',
    minQty: 15,
    maxQty: 100,
    safetyStock: 20,
    reorderPoint: 35,
    economicOrderQty: 30,
    leadTimeDays: 21,
    orderMultiple: 5
  }
];

export const INITIAL_HEALTH_ITEMS: InventoryHealthItem[] = [
  {
    id: 'HLT-101',
    ruleId: 'RUL-101',
    itemCode: 'SKU-ENT-101',
    itemName: 'Enterprise Server Node X1',
    category: 'Hardware & IT',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-001',
    supplierName: 'Dell Enterprise Systems Inc',
    onHandStock: 18,
    reservedStock: 12,
    availableStock: 6,
    incomingQty: 10,
    avgDailyConsumption: 2.5,
    minQty: 10,
    maxQty: 60,
    safetyStock: 15,
    reorderPoint: 25,
    economicOrderQty: 20,
    leadTimeDays: 14,
    orderMultiple: 5,
    suggestedPurchaseQty: 35,
    daysOfInventory: 2.4,
    stockCoveragePct: 24,
    healthStatus: 'critical',
    riskLevel: 'high',
    alertTriggered: 'Stock below safety stock threshold (6 < 15)',
    suggestedAction: 'Immediate PO release to avoid out-of-stock SLA failure.'
  },
  {
    id: 'HLT-102',
    ruleId: 'RUL-102',
    itemCode: 'SKU-ENT-102',
    itemName: 'Gigabit Switch 48-Port PoE',
    category: 'Hardware & IT',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-002',
    supplierName: 'Cisco Systems Global',
    onHandStock: 52,
    reservedStock: 10,
    availableStock: 42,
    incomingQty: 0,
    avgDailyConsumption: 3.8,
    minQty: 30,
    maxQty: 150,
    safetyStock: 40,
    reorderPoint: 60,
    economicOrderQty: 50,
    leadTimeDays: 10,
    orderMultiple: 10,
    suggestedPurchaseQty: 60,
    daysOfInventory: 11.0,
    stockCoveragePct: 70,
    healthStatus: 'low_stock',
    riskLevel: 'medium',
    alertTriggered: 'Reached Reorder Point (42 <= 60)',
    suggestedAction: 'Generate replenishment PO with 10-day lead time window.'
  },
  {
    id: 'HLT-103',
    ruleId: 'RUL-103',
    itemCode: 'SKU-POS-201',
    itemName: 'Thermal Receipt Printer 80mm',
    category: 'POS Hardware',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-003',
    supplierName: 'Epson POS Solutions',
    onHandStock: 220,
    reservedStock: 20,
    availableStock: 200,
    incomingQty: 50,
    avgDailyConsumption: 4.2,
    minQty: 50,
    maxQty: 400,
    safetyStock: 60,
    reorderPoint: 100,
    economicOrderQty: 100,
    leadTimeDays: 7,
    orderMultiple: 20,
    suggestedPurchaseQty: 0,
    daysOfInventory: 47.6,
    stockCoveragePct: 100,
    healthStatus: 'optimal',
    riskLevel: 'none',
    suggestedAction: 'Stock levels healthy. Reorder check scheduled next week.'
  },
  {
    id: 'HLT-104',
    ruleId: 'RUL-104',
    itemCode: 'SKU-CAF-301',
    itemName: 'Artisanal Espresso Beans 1kg',
    category: 'Food & Beverage',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    supplierId: 'SUP-004',
    supplierName: 'Roasters Guild International',
    onHandStock: 890,
    reservedStock: 40,
    availableStock: 850,
    incomingQty: 100,
    avgDailyConsumption: 8.0,
    minQty: 100,
    maxQty: 800,
    safetyStock: 120,
    reorderPoint: 200,
    economicOrderQty: 250,
    leadTimeDays: 5,
    orderMultiple: 25,
    suggestedPurchaseQty: 0,
    daysOfInventory: 106.2,
    stockCoveragePct: 120,
    healthStatus: 'overstock',
    riskLevel: 'low',
    alertTriggered: 'Overstock warning: Stock exceeds Max Qty (850 > 800)',
    suggestedAction: 'Pause replenishment orders and run promotional discount.'
  }
];

export const INITIAL_RECOMMENDATIONS: PurchaseRecommendation[] = [
  {
    id: 'REC-101',
    itemCode: 'SKU-ENT-101',
    itemName: 'Enterprise Server Node X1',
    supplierId: 'SUP-001',
    supplierName: 'Dell Enterprise Systems Inc',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    category: 'Hardware & IT',
    suggestedQty: 35,
    approvedQty: 35,
    unitCost: 1800.00,
    totalCost: 63000.00,
    priority: 'CRITICAL',
    status: 'pending'
  },
  {
    id: 'REC-102',
    itemCode: 'SKU-ENT-102',
    itemName: 'Gigabit Switch 48-Port PoE',
    supplierId: 'SUP-002',
    supplierName: 'Cisco Systems Global',
    warehouse: 'WH-NY-MAIN',
    branch: 'BR-NY-01',
    category: 'Hardware & IT',
    suggestedQty: 60,
    approvedQty: 60,
    unitCost: 620.00,
    totalCost: 37200.00,
    priority: 'HIGH',
    status: 'pending'
  }
];

export const INITIAL_PENDING_ORDERS: PendingPurchaseOrder[] = [
  {
    poNumber: 'PO-2026-9041',
    supplierName: 'Dell Enterprise Systems Inc',
    warehouse: 'WH-NY-MAIN',
    totalAmount: 18000.00,
    expectedDeliveryDate: '2026-08-12',
    itemCount: 10,
    status: 'in_transit'
  },
  {
    poNumber: 'PO-2026-8812',
    supplierName: 'Epson POS Solutions',
    warehouse: 'WH-NY-MAIN',
    totalAmount: 5500.00,
    expectedDeliveryDate: '2026-08-09',
    itemCount: 50,
    status: 'ordered'
  }
];

class SmartReorderService {
  private state: ReorderState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): ReorderState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          rules: parsed.rules || INITIAL_REORDER_RULES,
          inventoryHealth: parsed.inventoryHealth || INITIAL_HEALTH_ITEMS,
          recommendations: parsed.recommendations || INITIAL_RECOMMENDATIONS,
          pendingOrders: parsed.pendingOrders || INITIAL_PENDING_ORDERS
        };
      }
    } catch (e) {
      console.warn('Failed to parse Smart Reorder state:', e);
    }

    return {
      rules: INITIAL_REORDER_RULES,
      inventoryHealth: INITIAL_HEALTH_ITEMS,
      recommendations: INITIAL_RECOMMENDATIONS,
      pendingOrders: INITIAL_PENDING_ORDERS,
      isVgf08Completed: true
    };
  }

  public getState(): ReorderState {
    return this.state;
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Smart Reorder state:', e);
    }
  }

  public addRule(rule: ReorderRule): void {
    this.state.rules.push(rule);

    // Calculate initial health for new rule
    const onHand = 20;
    const reserved = 5;
    const avail = onHand - reserved;
    const suggested = Math.max(0, rule.maxQty - (avail + 0));
    
    let status: 'critical' | 'low_stock' | 'optimal' | 'overstock' = 'optimal';
    if (avail <= rule.safetyStock) status = 'critical';
    else if (avail <= rule.reorderPoint) status = 'low_stock';
    else if (avail > rule.maxQty) status = 'overstock';

    const healthItem: InventoryHealthItem = {
      id: `HLT-${Date.now().toString().slice(-4)}`,
      ruleId: rule.id,
      itemCode: rule.itemCode,
      itemName: rule.itemName,
      category: rule.category,
      warehouse: rule.warehouse,
      branch: rule.branch,
      supplierId: rule.supplierId,
      supplierName: rule.supplierName,
      onHandStock: onHand,
      reservedStock: reserved,
      availableStock: avail,
      incomingQty: 0,
      avgDailyConsumption: 2.0,
      minQty: rule.minQty,
      maxQty: rule.maxQty,
      safetyStock: rule.safetyStock,
      reorderPoint: rule.reorderPoint,
      economicOrderQty: rule.economicOrderQty,
      leadTimeDays: rule.leadTimeDays,
      orderMultiple: rule.orderMultiple,
      suggestedPurchaseQty: suggested,
      daysOfInventory: parseFloat((avail / 2.0).toFixed(1)),
      stockCoveragePct: Math.round((avail / rule.maxQty) * 100),
      healthStatus: status,
      riskLevel: status === 'critical' ? 'high' : status === 'low_stock' ? 'medium' : 'none',
      suggestedAction: `System auto-evaluated reorder point for ${rule.itemName}`
    };

    this.state.inventoryHealth.push(healthItem);

    if (status === 'critical' || status === 'low_stock') {
      this.generateRecommendationForHealth(healthItem);
    }

    this.saveState();
  }

  public generateRecommendationForHealth(item: InventoryHealthItem): void {
    const existing = this.state.recommendations.find(r => r.itemCode === item.itemCode && r.status === 'pending');
    if (!existing) {
      const rec: PurchaseRecommendation = {
        id: `REC-${Date.now().toString().slice(-4)}`,
        itemCode: item.itemCode,
        itemName: item.itemName,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        warehouse: item.warehouse,
        branch: item.branch,
        category: item.category,
        suggestedQty: item.suggestedPurchaseQty || item.economicOrderQty,
        approvedQty: item.suggestedPurchaseQty || item.economicOrderQty,
        unitCost: 500.00,
        totalCost: (item.suggestedPurchaseQty || item.economicOrderQty) * 500.00,
        priority: item.healthStatus === 'critical' ? 'CRITICAL' : 'HIGH',
        status: 'pending'
      };
      this.state.recommendations.unshift(rec);
    }
  }

  public updateRecommendationStatus(recId: string, status: 'approved' | 'rejected' | 'modified', newQty?: number): void {
    const rec = this.state.recommendations.find(r => r.id === recId);
    if (rec) {
      rec.status = status;
      if (newQty !== undefined) {
        rec.approvedQty = newQty;
        rec.totalCost = rec.approvedQty * rec.unitCost;
      }
      this.saveState();
    }
  }

  public generatePOFromRecommendation(recId: string): string {
    const rec = this.state.recommendations.find(r => r.id === recId);
    if (rec) {
      const poNum = `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      rec.status = 'po_generated';
      rec.generatedPoNumber = poNum;

      this.state.pendingOrders.unshift({
        poNumber: poNum,
        supplierName: rec.supplierName,
        warehouse: rec.warehouse,
        totalAmount: rec.totalCost,
        expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        itemCount: rec.approvedQty,
        status: 'ordered'
      });

      this.saveState();
      return poNum;
    }
    return '';
  }

  public markVgf08Completed(): void {
    this.state.isVgf08Completed = true;
    this.saveState();
  }

  public resetState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
  }
}

export const smartReorderService = new SmartReorderService();
