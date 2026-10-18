import { APPROVED_ERP_MODULES } from '../data/mockData';
import { ERPModuleMeta, ERPModuleId } from '../types';
import { auditEngine } from './auditEngine';
import { notificationEngine } from './notificationEngine';
import { setupWizardService } from './setupWizardService';

export type ModuleCategory = 'Finance' | 'Logistics' | 'Operations' | 'Commercial' | 'HR' | 'Assets' | 'Analytics';

export type CrossModuleEventType =
  | 'POS_SALE_COMPLETED'
  | 'INVENTORY_STOCK_DEPLETED'
  | 'REORDER_THRESHOLD_TRIGGERED'
  | 'PURCHASE_ORDER_ISSUED'
  | 'VENDOR_BILL_MATCHED'
  | 'PAYROLL_DISBURSED'
  | 'WORK_ORDER_COMPLETED'
  | 'QUALITY_INSPECTION_PASSED'
  | 'LEAD_CONVERTED_TO_CUSTOMER'
  | 'ASSET_DEPRECIATION_CALCULATED'
  | 'FLEET_MAINTENANCE_LOGGED'
  | 'GL_JOURNAL_VOUCHER_POSTED';

export interface ModuleEvent {
  id: string;
  type: CrossModuleEventType;
  sourceModuleId: ERPModuleId;
  targetModuleIds: ERPModuleId[];
  timestamp: string;
  payload: Record<string, any>;
  status: 'published' | 'processed' | 'failed';
  description: string;
}

export interface CrossModuleWorkflow {
  id: string;
  name: string;
  description: string;
  primaryModuleId: ERPModuleId;
  participatingModules: ERPModuleId[];
  steps: {
    stepNumber: number;
    moduleId: ERPModuleId;
    actionName: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
  }[];
  lastExecuted?: string;
  executionCount: number;
}

export interface SharedMasterDataSummary {
  customersCount: number;
  vendorsCount: number;
  inventoryItemsCount: number;
  employeesCount: number;
  chartOfAccountsCount: number;
  warehousesCount: number;
  projectsCount: number;
  fixedAssetsCount: number;
}

export type EventCallback = (event: ModuleEvent) => void;

class ModuleIntegrationService {
  private modules: ERPModuleMeta[] = [...APPROVED_ERP_MODULES];
  private eventHistory: ModuleEvent[] = [];
  private eventListeners: Map<string, EventCallback[]> = new Map();
  private workflows: CrossModuleWorkflow[] = [
    {
      id: 'WF-POS-GL-INV',
      name: 'Omni-Channel Retail Checkout & Ledger Sync',
      description: 'Executes POS barcode checkout, depletes stock in INV, generates customer invoice in AR, and posts double-entry vouchers in GL.',
      primaryModuleId: 'MOD-POS',
      participatingModules: ['MOD-POS', 'MOD-INV', 'MOD-AR', 'MOD-GL'],
      executionCount: 142,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      steps: [
        { stepNumber: 1, moduleId: 'MOD-POS', actionName: 'Scan & Process Payment', description: 'Barcode scanner registers sale and accepts cash/card.', status: 'completed' },
        { stepNumber: 2, moduleId: 'MOD-INV', actionName: 'Deplete Multi-Bin Stock', description: 'Deducts SKU units from active store warehouse bin.', status: 'completed' },
        { stepNumber: 3, moduleId: 'MOD-AR', actionName: 'Generate Receivable Invoice', description: 'Registers customer sales invoice and tax breakdown.', status: 'completed' },
        { stepNumber: 4, moduleId: 'MOD-GL', actionName: 'Post Journal Voucher', description: 'Debits Cash/Bank and credits Sales Revenue in GL.', status: 'completed' }
      ]
    },
    {
      id: 'WF-REORDER-SCM-AP',
      name: 'Automated Supply Chain Replenishment & 3-Way Match',
      description: 'Detects safety stock breach, issues Purchase Order in SCM, matches delivery receipt in AP, and schedules vendor payment.',
      primaryModuleId: 'MOD-INV',
      participatingModules: ['MOD-INV', 'MOD-SCM', 'MOD-AP', 'MOD-GL'],
      executionCount: 89,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      steps: [
        { stepNumber: 1, moduleId: 'MOD-INV', actionName: 'Safety Stock Threshold Alert', description: 'Triggers reorder policy based on EOQ algorithm.', status: 'completed' },
        { stepNumber: 2, moduleId: 'MOD-SCM', actionName: 'Issue Vendor Purchase Order', description: 'Dispatches PO to primary supplier portal.', status: 'completed' },
        { stepNumber: 3, moduleId: 'MOD-AP', actionName: '3-Way Match Vendor Bill', description: 'Verifies PO, Goods Receipt, and Invoice amounts.', status: 'completed' },
        { stepNumber: 4, moduleId: 'MOD-GL', actionName: 'Accrue AP Liability', description: 'Debits Inventory asset and credits Accounts Payable.', status: 'completed' }
      ]
    },
    {
      id: 'WF-HR-PAYROLL-TR-GL',
      name: 'Enterprise Payroll Settlement & Cash Disbursement',
      description: 'Calculates employee salaries and tax withholdings in HR, releases treasury funds in TR, and posts payroll expenses in GL.',
      primaryModuleId: 'MOD-HR',
      participatingModules: ['MOD-HR', 'MOD-TR', 'MOD-GL'],
      executionCount: 24,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      steps: [
        { stepNumber: 1, moduleId: 'MOD-HR', actionName: 'Calculate Monthly Payroll', description: 'Processes attendance, overtime, and statutory withholdings.', status: 'completed' },
        { stepNumber: 2, moduleId: 'MOD-TR', actionName: 'Authorize Treasury Transfer', description: 'Generates bank batch payment file and cash authorization.', status: 'completed' },
        { stepNumber: 3, moduleId: 'MOD-GL', actionName: 'Post Payroll Ledger Vouchers', description: 'Debits Salary Expense and credits Cash Bank Account.', status: 'completed' }
      ]
    },
    {
      id: 'WF-MFG-QM-INV',
      name: 'Manufacturing Assembly, Quality Approval & Storage',
      description: 'Consumes raw materials from INV via MFG Bill of Materials, triggers QM quality clearance, and deposits finished products into INV.',
      primaryModuleId: 'MOD-MFG',
      participatingModules: ['MOD-MFG', 'MOD-INV', 'MOD-QM'],
      executionCount: 56,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
      steps: [
        { stepNumber: 1, moduleId: 'MOD-MFG', actionName: 'BOM Work Order Execution', description: 'Deducts raw materials and records machine hours.', status: 'completed' },
        { stepNumber: 2, moduleId: 'MOD-QM', actionName: 'Quality Inspection Sampling', description: 'Executes CAPA non-conformance check and tolerance test.', status: 'completed' },
        { stepNumber: 3, moduleId: 'MOD-INV', actionName: 'Deposit Finished Goods', description: 'Increments inventory stock levels for saleable items.', status: 'completed' }
      ]
    },
    {
      id: 'WF-CRM-LEAD-AR',
      name: 'Commercial Lead Conversion & Credit Onboarding',
      description: 'Converts qualified CRM deal pipelines into active AR customer accounts with credit limit authorization.',
      primaryModuleId: 'MOD-CRM',
      participatingModules: ['MOD-CRM', 'MOD-AR', 'MOD-GL'],
      executionCount: 112,
      lastExecuted: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
      steps: [
        { stepNumber: 1, moduleId: 'MOD-CRM', actionName: 'Close Won Deal Pipeline', description: 'Converts lead record into verified commercial entity.', status: 'completed' },
        { stepNumber: 2, moduleId: 'MOD-AR', actionName: 'Create Customer Account', description: 'Sets payment terms, tax category, and credit limit.', status: 'completed' },
        { stepNumber: 3, moduleId: 'MOD-GL', actionName: 'Bind Sub-Ledger Account', description: 'Associates customer sub-ledger to AR master control account.', status: 'completed' }
      ]
    }
  ];

  constructor() {
    this.seedInitialEvents();
  }

  private seedInitialEvents() {
    this.eventHistory = [
      {
        id: 'EVT-1001',
        type: 'POS_SALE_COMPLETED',
        sourceModuleId: 'MOD-POS',
        targetModuleIds: ['MOD-INV', 'MOD-AR', 'MOD-GL'],
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        payload: { transactionId: 'TX-99482', totalAmount: 1250.00, itemsCount: 4 },
        status: 'processed',
        description: 'POS Sale TX-99482 posted. Multi-bin inventory deducted and GL Journal entry created.'
      },
      {
        id: 'EVT-1002',
        type: 'REORDER_THRESHOLD_TRIGGERED',
        sourceModuleId: 'MOD-INV',
        targetModuleIds: ['MOD-SCM', 'MOD-AP'],
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        payload: { skuCode: 'SKU-8812', currentStock: 12, reorderPoint: 25, eoq: 100 },
        status: 'processed',
        description: 'Stock SKU-8812 dropped below safety threshold. PO-2026-004 generated in SCM.'
      },
      {
        id: 'EVT-1003',
        type: 'PAYROLL_DISBURSED',
        sourceModuleId: 'MOD-HR',
        targetModuleIds: ['MOD-TR', 'MOD-GL'],
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        payload: { period: '2026-07', TotalGrossPay: 185000.00, EmployeesCount: 310 },
        status: 'processed',
        description: 'Monthly payroll batch disburse initiated. Treasury cash transfer approved.'
      }
    ];
  }

  public getModules(): ERPModuleMeta[] {
    return this.modules;
  }

  public getModuleById(id: string): ERPModuleMeta | undefined {
    return this.modules.find(m => m.id === id);
  }

  public getWorkflows(): CrossModuleWorkflow[] {
    return this.workflows;
  }

  public getEventHistory(): ModuleEvent[] {
    return this.eventHistory;
  }

  public publishEvent(event: Omit<ModuleEvent, 'id' | 'timestamp' | 'status'>): ModuleEvent {
    const fullEvent: ModuleEvent = {
      ...event,
      id: `EVT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      status: 'processed'
    };

    this.eventHistory.unshift(fullEvent);

    // Increment record count on primary source module
    const sourceMod = this.modules.find(m => m.id === fullEvent.sourceModuleId);
    if (sourceMod) {
      sourceMod.recordCount += 1;
    }

    // Audit and notify platform
    auditEngine.logAction(
      `Cross-Module Event: ${fullEvent.type}`,
      `Module Integration (${fullEvent.sourceModuleId} -> ${fullEvent.targetModuleIds.join(', ')})`,
      fullEvent.description,
      'info'
    );

    notificationEngine.addNotification(
      `Module Sync: ${fullEvent.sourceModuleId}`,
      fullEvent.description,
      'info',
      fullEvent.sourceModuleId
    );

    // Notify listeners
    const listeners = this.eventListeners.get(fullEvent.type) || [];
    listeners.forEach(cb => cb(fullEvent));

    const wildcardListeners = this.eventListeners.get('*') || [];
    wildcardListeners.forEach(cb => cb(fullEvent));

    return fullEvent;
  }

  public subscribe(eventType: string, callback: EventCallback): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);

    return () => {
      const callbacks = this.eventListeners.get(eventType);
      if (callbacks) {
        this.eventListeners.set(eventType, callbacks.filter(cb => cb !== callback));
      }
    };
  }

  public executeWorkflow(workflowId: string): ModuleEvent {
    const wf = this.workflows.find(w => w.id === workflowId);
    if (!wf) {
      throw new Error(`Workflow ${workflowId} not found.`);
    }

    wf.executionCount += 1;
    wf.lastExecuted = new Date().toISOString();

    const targetModules = wf.participatingModules.filter(id => id !== wf.primaryModuleId);

    const event = this.publishEvent({
      type: 'POS_SALE_COMPLETED',
      sourceModuleId: wf.primaryModuleId,
      targetModuleIds: targetModules,
      payload: {
        workflowId: wf.id,
        workflowName: wf.name,
        executedBy: 'Vertex Platform Event Bus',
        configCurrency: setupWizardService.getConfig().baseCurrency
      },
      description: `Executed cross-module workflow: "${wf.name}". Processed across ${wf.participatingModules.join(', ')}.`
    });

    return event;
  }

  public getSharedMasterDataSummary(): SharedMasterDataSummary {
    return {
      customersCount: 2150,
      vendorsCount: 640,
      inventoryItemsCount: 3820,
      employeesCount: 310,
      chartOfAccountsCount: 245,
      warehousesCount: 18,
      projectsCount: 95,
      fixedAssetsCount: 185
    };
  }

  public validateArchitectureHealth(): {
    isFullyConnected: boolean;
    activeConnectionsCount: number;
    isolatedModulesCount: number;
    healthScore: number;
    recommendations: string[];
  } {
    return {
      isFullyConnected: true,
      activeConnectionsCount: 105, // 15 modules fully meshed
      isolatedModulesCount: 0,
      healthScore: 100,
      recommendations: [
        'All 15 ERP Modules are actively bound to Vertex Platform Event Bus.',
        'Cross-module master data references validated against VGF-01 Company Setup.',
        'Zero isolated modules detected.'
      ]
    };
  }
}

export const moduleIntegrationService = new ModuleIntegrationService();
