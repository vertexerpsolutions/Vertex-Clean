export type DocumentType = 
  | 'Sales Order' 
  | 'Sales Invoice' 
  | 'Purchase Order' 
  | 'Purchase Invoice' 
  | 'Sales Return' 
  | 'Purchase Return' 
  | 'Receipt Voucher' 
  | 'Payment Voucher' 
  | 'Journal Entry' 
  | 'Inventory Transfer' 
  | 'Asset Registration';

export type HistoryEventType = 
  | 'Created' 
  | 'Modified' 
  | 'Approved' 
  | 'Rejected' 
  | 'Printed' 
  | 'Exported' 
  | 'Shared' 
  | 'Cancelled' 
  | 'Reopened' 
  | 'Soft Deleted' 
  | 'Restored';

export interface DocumentVersion {
  versionNumber: number;
  timestamp: string;
  modifiedBy: string;
  reasonForChange: string;
  previousValues: Record<string, any>;
  currentValues: Record<string, any>;
}

export interface RelatedDocument {
  docId: string;
  docNumber: string;
  docType: DocumentType;
  relationship: 'Parent Order' | 'Fulfillment Invoice' | 'Payment Voucher' | 'GL Journal' | 'Inventory Dispatch';
  amount: number;
  status: string;
}

export interface HistoryEvent {
  id: string;
  timestamp: string;
  eventType: HistoryEventType;
  performedBy: string;
  userRole: string;
  summary: string;
  details?: string;
  ipAddress: string;
}

export interface DocumentRecord {
  id: string;
  docNumber: string;
  docType: DocumentType;
  title: string;
  company: string;
  branch: string;
  status: 'Draft' | 'Approved' | 'Posted' | 'Cancelled' | 'Soft Deleted';
  createdAt: string;
  createdBy: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  totalAmount: number;
  currency: string;
  versionCount: number;
  events: HistoryEvent[];
  versions: DocumentVersion[];
  relatedDocs: RelatedDocument[];
}

export interface HistoryState {
  documents: DocumentRecord[];
  isVgf09Completed: boolean;
}

const STORAGE_KEY = 'VERTEX_VGF09_DOCUMENT_HISTORY';

export const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'DOC-1001',
    docNumber: 'INV-2026-0891',
    docType: 'Sales Invoice',
    title: 'Enterprise Software & Cloud Subscription Invoice',
    company: 'Vertex Tech Holdings LLC',
    branch: 'BR-NY-01',
    status: 'Posted',
    createdAt: '2026-08-01T09:15:00Z',
    createdBy: 'sarah_commercial',
    lastModifiedAt: '2026-08-05T14:30:00Z',
    lastModifiedBy: 'alex_finance',
    totalAmount: 145000.00,
    currency: 'USD',
    versionCount: 3,
    events: [
      {
        id: 'EVT-901',
        timestamp: '2026-08-01T09:15:00Z',
        eventType: 'Created',
        performedBy: 'sarah_commercial',
        userRole: 'Commercial Officer',
        summary: 'Initial draft generated from Sales Order SO-2026-0412.',
        ipAddress: '192.168.1.104'
      },
      {
        id: 'EVT-902',
        timestamp: '2026-08-02T11:20:00Z',
        eventType: 'Modified',
        performedBy: 'sarah_commercial',
        userRole: 'Commercial Officer',
        summary: 'Updated payment terms to Net 30 and added 5% loyalty discount.',
        details: 'Discount adjusted from 0% to 5%. Total updated to $145,000.00.',
        ipAddress: '192.168.1.104'
      },
      {
        id: 'EVT-903',
        timestamp: '2026-08-03T16:00:00Z',
        eventType: 'Approved',
        performedBy: 'michael_vp',
        userRole: 'VP Operations',
        summary: 'Executive sign-off provided for high-value invoice.',
        ipAddress: '192.168.1.12'
      },
      {
        id: 'EVT-904',
        timestamp: '2026-08-04T10:15:00Z',
        eventType: 'Printed',
        performedBy: 'alex_finance',
        userRole: 'Senior Accountant',
        summary: 'Official PDF printed for customer physical dispatch.',
        ipAddress: '192.168.1.215'
      },
      {
        id: 'EVT-905',
        timestamp: '2026-08-05T14:30:00Z',
        eventType: 'Exported',
        performedBy: 'alex_finance',
        userRole: 'Senior Accountant',
        summary: 'Exported XML ledger payload to Audit Compliance Archive.',
        ipAddress: '192.168.1.215'
      }
    ],
    versions: [
      {
        versionNumber: 1,
        timestamp: '2026-08-01T09:15:00Z',
        modifiedBy: 'sarah_commercial',
        reasonForChange: 'Initial Document Creation',
        previousValues: {},
        currentValues: { totalAmount: 152631.58, discountPct: 0, paymentTerms: 'Net 15' }
      },
      {
        versionNumber: 2,
        timestamp: '2026-08-02T11:20:00Z',
        modifiedBy: 'sarah_commercial',
        reasonForChange: 'Customer negotiated volume discount',
        previousValues: { totalAmount: 152631.58, discountPct: 0, paymentTerms: 'Net 15' },
        currentValues: { totalAmount: 145000.00, discountPct: 5, paymentTerms: 'Net 30' }
      },
      {
        versionNumber: 3,
        timestamp: '2026-08-03T16:00:00Z',
        modifiedBy: 'michael_vp',
        reasonForChange: 'Final Executive Approval & GL Posting Code Binding',
        previousValues: { status: 'Draft' },
        currentValues: { status: 'Posted', glPostingJournal: 'JV-2026-9901' }
      }
    ],
    relatedDocs: [
      {
        docId: 'DOC-0992',
        docNumber: 'SO-2026-0412',
        docType: 'Sales Order',
        relationship: 'Parent Order',
        amount: 152631.58,
        status: 'Fulfilled'
      },
      {
        docId: 'DOC-1008',
        docNumber: 'RV-2026-0041',
        docType: 'Receipt Voucher',
        relationship: 'Payment Voucher',
        amount: 145000.00,
        status: 'Cleared'
      },
      {
        docId: 'DOC-1012',
        docNumber: 'JV-2026-9901',
        docType: 'Journal Entry',
        relationship: 'GL Journal',
        amount: 145000.00,
        status: 'Posted'
      }
    ]
  },
  {
    id: 'DOC-1002',
    docNumber: 'PO-2026-9041',
    docType: 'Purchase Order',
    title: 'Dell Server Infrastructure Expansion Order',
    company: 'Vertex Tech Holdings LLC',
    branch: 'BR-NY-01',
    status: 'Approved',
    createdAt: '2026-08-03T08:00:00Z',
    createdBy: 'david_procurement',
    lastModifiedAt: '2026-08-04T13:10:00Z',
    lastModifiedBy: 'david_procurement',
    totalAmount: 63000.00,
    currency: 'USD',
    versionCount: 2,
    events: [
      {
        id: 'EVT-910',
        timestamp: '2026-08-03T08:00:00Z',
        eventType: 'Created',
        performedBy: 'david_procurement',
        userRole: 'Procurement Specialist',
        summary: 'Generated PO from VGF-08 Smart Reorder Policy Recommendation.',
        ipAddress: '192.168.1.88'
      },
      {
        id: 'EVT-911',
        timestamp: '2026-08-04T13:10:00Z',
        eventType: 'Approved',
        performedBy: 'elena_cfo',
        userRole: 'Chief Financial Officer',
        summary: 'Financial budget authorization completed for hardware expansion.',
        ipAddress: '192.168.1.15'
      }
    ],
    versions: [
      {
        versionNumber: 1,
        timestamp: '2026-08-03T08:00:00Z',
        modifiedBy: 'david_procurement',
        reasonForChange: 'System Auto-Generated PO from Smart Reorder',
        previousValues: {},
        currentValues: { qty: 35, unitPrice: 1800.00, totalAmount: 63000.00 }
      },
      {
        versionNumber: 2,
        timestamp: '2026-08-04T13:10:00Z',
        modifiedBy: 'elena_cfo',
        reasonForChange: 'CFO Approval Signoff',
        previousValues: { status: 'Draft' },
        currentValues: { status: 'Approved' }
      }
    ],
    relatedDocs: [
      {
        docId: 'DOC-1015',
        docNumber: 'PI-2026-4401',
        docType: 'Purchase Invoice',
        relationship: 'Fulfillment Invoice',
        amount: 63000.00,
        status: 'Pending Receipt'
      }
    ]
  },
  {
    id: 'DOC-1003',
    docNumber: 'JV-2026-0033',
    docType: 'Journal Entry',
    title: 'Monthly Depreciation Adjustment - London Assets',
    company: 'Vertex Global UK Ltd',
    branch: 'BR-LON-02',
    status: 'Soft Deleted',
    createdAt: '2026-08-02T14:00:00Z',
    createdBy: 'rachel_accounting',
    lastModifiedAt: '2026-08-05T17:45:00Z',
    lastModifiedBy: 'vtx_sysadmin',
    totalAmount: 18500.00,
    currency: 'GBP',
    versionCount: 2,
    events: [
      {
        id: 'EVT-920',
        timestamp: '2026-08-02T14:00:00Z',
        eventType: 'Created',
        performedBy: 'rachel_accounting',
        userRole: 'Senior Accountant UK',
        summary: 'Manual Depreciation Journal Entry prepared.',
        ipAddress: '192.168.2.45'
      },
      {
        id: 'EVT-921',
        timestamp: '2026-08-05T17:45:00Z',
        eventType: 'Soft Deleted',
        performedBy: 'vtx_sysadmin',
        userRole: 'System Administrator',
        summary: 'Soft-deleted duplicate journal entry during month-end reconciliation.',
        details: 'Record hidden from active ledger but preserved in audit history.',
        ipAddress: '127.0.0.1'
      }
    ],
    versions: [
      {
        versionNumber: 1,
        timestamp: '2026-08-02T14:00:00Z',
        modifiedBy: 'rachel_accounting',
        reasonForChange: 'Initial Manual JV Creation',
        previousValues: {},
        currentValues: { totalAmount: 18500.00, status: 'Draft' }
      },
      {
        versionNumber: 2,
        timestamp: '2026-08-05T17:45:00Z',
        modifiedBy: 'vtx_sysadmin',
        reasonForChange: 'Duplicate Entry Removal',
        previousValues: { status: 'Draft' },
        currentValues: { status: 'Soft Deleted' }
      }
    ],
    relatedDocs: []
  }
];

class DocumentHistoryService {
  private state: HistoryState;

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): HistoryState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          documents: parsed.documents || INITIAL_DOCUMENTS
        };
      }
    } catch (e) {
      console.warn('Failed to parse Document History state:', e);
    }

    return {
      documents: INITIAL_DOCUMENTS,
      isVgf09Completed: true
    };
  }

  public getState(): HistoryState {
    return this.state;
  }

  public saveState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save Document History state:', e);
    }
  }

  public addEventToDocument(
    docId: string, 
    eventType: HistoryEventType, 
    performedBy: string, 
    userRole: string, 
    summary: string, 
    details?: string
  ): void {
    const doc = this.state.documents.find(d => d.id === docId);
    if (doc) {
      const newEvt: HistoryEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        eventType,
        performedBy,
        userRole,
        summary,
        details,
        ipAddress: '192.168.1.100'
      };

      doc.events.unshift(newEvt);
      doc.lastModifiedAt = newEvt.timestamp;
      doc.lastModifiedBy = performedBy;

      if (eventType === 'Soft Deleted') {
        doc.status = 'Soft Deleted';
      } else if (eventType === 'Restored') {
        doc.status = 'Draft';
      } else if (eventType === 'Approved') {
        doc.status = 'Approved';
      }

      this.saveState();
    }
  }

  public markVgf09Completed(): void {
    this.state.isVgf09Completed = true;
    this.saveState();
  }

  public resetState(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.state = this.loadInitialState();
  }
}

export const documentHistoryService = new DocumentHistoryService();
