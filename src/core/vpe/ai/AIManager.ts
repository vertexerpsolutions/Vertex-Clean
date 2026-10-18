import { 
  AIModelConfig, 
  AIPredictionResult, 
  AIAnomalyAlert, 
  AIDocumentExtraction, 
  AICopilotMessage, 
  AIRecommendation, 
  AIModelType 
} from './AITypes';
import { auditEngine } from '../../../services/auditEngine';

export class AIManager {
  private static instance: AIManager;
  private models: Map<string, AIModelConfig> = new Map();
  private predictions: AIPredictionResult[] = [];
  private anomalies: AIAnomalyAlert[] = [];
  private extractions: AIDocumentExtraction[] = [];
  private copilotHistory: AICopilotMessage[] = [];
  private recommendations: AIRecommendation[] = [];

  private constructor() {
    this.seedDefaults();
  }

  public static getInstance(): AIManager {
    if (!AIManager.instance) {
      AIManager.instance = new AIManager();
    }
    return AIManager.instance;
  }

  private seedDefaults(): void {
    const now = new Date();

    // 1. Seed AI Models
    const initialModels: AIModelConfig[] = [
      {
        modelId: 'MDL-GEMINI-25-PRO',
        name: 'Google Gemini 2.5 Pro (Multimodal Copilot)',
        provider: 'Google Gemini',
        modelType: 'GEMINI_2_5_PRO',
        category: 'COPILOT_ASSISTANT',
        temperature: 0.2,
        maxTokens: 8192,
        isOperational: true,
        latencyMs: 140,
        accuracyRating: '99.4%',
        description: 'Advanced reasoning engine for natural language ERP queries, document synthesis, and automated business insights.'
      },
      {
        modelId: 'MDL-GEMINI-25-FLASH',
        name: 'Google Gemini 2.5 Flash (Real-Time OCR & Search)',
        provider: 'Google Gemini',
        modelType: 'GEMINI_2_5_FLASH',
        category: 'DOCUMENT_OCR',
        temperature: 0.1,
        maxTokens: 4096,
        isOperational: true,
        latencyMs: 42,
        accuracyRating: '98.9%',
        description: 'Ultra-low latency model powering sub-50ms document parsing and VSE universal search intent mapping.'
      },
      {
        modelId: 'MDL-FIN-FORECAST-01',
        name: 'Vertex Financial & Cash Flow Neural Forecaster',
        provider: 'Vertex Internal ML',
        modelType: 'VERTEX_FINANCIAL_FORECASTER',
        category: 'PREDICTIVE_ANALYTICS',
        temperature: 0.0,
        maxTokens: 2048,
        isOperational: true,
        latencyMs: 85,
        accuracyRating: '97.2%',
        description: 'Time-series forecasting model trained on historical General Ledger data, seasonal trends, and macro factors.'
      },
      {
        modelId: 'MDL-FRAUD-ANOMALY-02',
        name: 'Vertex Real-time Fraud & Anomaly Detector',
        provider: 'Vertex Internal ML',
        modelType: 'VERTEX_ANOMALY_DETECTOR',
        category: 'ANOMALY_DETECTION',
        temperature: 0.0,
        maxTokens: 1024,
        isOperational: true,
        latencyMs: 18,
        accuracyRating: '99.1%',
        description: 'Isolation Forest + Autoencoder neural net monitoring transaction velocity, duplicate invoice patterns, and unapproved expense outliers.'
      }
    ];

    initialModels.forEach(m => this.models.set(m.modelId, m));

    // 2. Seed Predictions
    this.predictions = [
      {
        predictionId: 'PRED-Q3-REV-901',
        modelId: 'MDL-FIN-FORECAST-01',
        targetMetric: 'Q3 Enterprise Revenue Forecast',
        timeHorizon: 'Next 90 Days',
        predictedValue: 4850000,
        unit: 'USD',
        confidenceScore: 0.965,
        historicalComparisonChangePercent: 14.8,
        generatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
        summaryReasoning: 'Consistent contract renewals in Manufacturing division paired with 22% growth in Gold Feature module adoption.',
        factors: [
          { name: 'SaaS Renewal Rate', impact: 'POSITIVE', weight: 0.45 },
          { name: 'Supply Chain Shipping Inflation', impact: 'NEGATIVE', weight: 0.15 },
          { name: 'Cross-sell Pipeline Growth', impact: 'POSITIVE', weight: 0.40 }
        ]
      },
      {
        predictionId: 'PRED-CASH-FLOW-902',
        modelId: 'MDL-FIN-FORECAST-01',
        targetMetric: '30-Day Net Cash Flow Projection',
        timeHorizon: 'Next 30 Days',
        predictedValue: 1240000,
        unit: 'USD',
        confidenceScore: 0.981,
        historicalComparisonChangePercent: 8.2,
        generatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
        summaryReasoning: 'Expected $1.8M Accounts Receivable collection offset by $560K scheduled payroll and vendor disbursements.',
        factors: [
          { name: 'AR Collection Velocity', impact: 'POSITIVE', weight: 0.60 },
          { name: 'Scheduled Vendor AP Payables', impact: 'NEGATIVE', weight: 0.40 }
        ]
      }
    ];

    // 3. Seed Anomalies
    this.anomalies = [
      {
        anomalyId: 'ANOM-EXP-4401',
        sourceModule: 'Expense Claims',
        entityId: 'CLM-9942 ($14,500 Executive Travel)',
        riskScore: 88,
        severity: 'HIGH',
        detectedAt: new Date(now.getTime() - 1000 * 60 * 40).toISOString(),
        title: 'Unusual Expense Claim Amount Exceeds Department Policy Cap',
        description: 'Single receipt claim of $14,500 submitted under "Client Dinner". Department threshold is capped at $2,500 without prior VP signoff.',
        suggestedMitigation: 'Route claim to VWE Workflow Engine for Executive Compliance Review.',
        status: 'UNREVIEWED'
      },
      {
        anomalyId: 'ANOM-INV-1102',
        sourceModule: 'Vendor Invoices',
        entityId: 'INV-VEN-8831 ($42,000 IT Equipment)',
        riskScore: 94,
        severity: 'CRITICAL',
        detectedAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
        title: 'Potential Duplicate Vendor Invoice & Account Number Mismatch',
        description: 'Invoice number matches INV-VEN-8810 paid 12 days ago. Remittance bank account number differs from master vendor profile in ERP.',
        suggestedMitigation: 'Freeze disbursements in AP module and flag vendor record in VSEC Security Vault.',
        status: 'UNREVIEWED'
      }
    ];

    // 4. Seed Document Extractions
    this.extractions = [
      {
        documentId: 'DOC-INV-9001',
        fileName: 'Invoice_AcmeCorp_Aug2026.pdf',
        documentType: 'VENDOR_INVOICE',
        confidenceScore: 0.992,
        extractedFields: [
          { fieldName: 'Vendor Name', fieldValue: 'Acme Industrial Solutions Inc', confidence: 0.99 },
          { fieldName: 'Invoice Number', fieldValue: 'INV-2026-8812', confidence: 0.99 },
          { fieldName: 'Invoice Total', fieldValue: '$38,450.00 USD', confidence: 0.98 },
          { fieldName: 'Due Date', fieldValue: '2026-09-15', confidence: 0.99 },
          { fieldName: 'Tax ID / VAT', fieldValue: 'US-99824102-X', confidence: 0.97 }
        ],
        processedAt: new Date(now.getTime() - 1000 * 60 * 90).toISOString(),
        status: 'PARSED'
      }
    ];

    // 5. Seed Copilot Messages
    this.copilotHistory = [
      {
        id: 'MSG-001',
        sender: 'COPILOT',
        text: 'Greetings. I am Vertex AI Copilot, powered by Gemini 2.5. I am monitoring your ERP financials, inventory, and security logs in real-time. How can I assist you today?',
        timestamp: new Date(now.getTime() - 1000 * 60 * 10).toISOString(),
        suggestedActions: [
          { label: 'Summarize Q3 Financial Forecast', actionType: 'QUERY_FORECAST' },
          { label: 'Check Open Anomaly Alerts', actionType: 'CHECK_ANOMALIES' },
          { label: 'Scan Pending Vendor Invoices', actionType: 'SCAN_INVOICES' }
        ]
      }
    ];

    // 6. Seed Smart Recommendations
    this.recommendations = [
      {
        recommendationId: 'REC-FIN-01',
        category: 'FINANCE',
        title: 'Optimize Working Capital via Early Vendor Discounts',
        description: 'Negotiate 2% early payment terms with top 5 hardware vendors to save an estimated $64,000 annually.',
        potentialImpactValue: '+$64,000 / Year',
        urgency: 'HIGH',
        actionableStep: 'Generate automated discount proposal letter in VRE Reporting Engine.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 180).toISOString()
      },
      {
        recommendationId: 'REC-INV-02',
        category: 'INVENTORY',
        title: 'Reorder Point Adjustment for High-Demand Server Racks',
        description: 'Demand for SKU-RACK-42U spiked 35% in European branches. Increase safety stock buffer from 50 to 120 units.',
        potentialImpactValue: 'Prevent $120K Stockouts',
        urgency: 'IMMEDIATE',
        actionableStep: 'Create Purchase Order draft in Purchasing Module.',
        createdAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString()
      }
    ];
  }

  public getModels(): AIModelConfig[] {
    return Array.from(this.models.values());
  }

  public getPredictions(): AIPredictionResult[] {
    return this.predictions;
  }

  public getAnomalies(): AIAnomalyAlert[] {
    return this.anomalies;
  }

  public getExtractions(): AIDocumentExtraction[] {
    return this.extractions;
  }

  public getCopilotHistory(): AICopilotMessage[] {
    return this.copilotHistory;
  }

  public getRecommendations(): AIRecommendation[] {
    return this.recommendations;
  }

  public sendCopilotQuery(userQuery: string): AICopilotMessage {
    const now = new Date();
    const userMsg: AICopilotMessage = {
      id: `MSG-${Date.now()}-U`,
      sender: 'USER',
      text: userQuery,
      timestamp: now.toISOString()
    };
    this.copilotHistory.push(userMsg);

    // Generate intelligent AI Response based on intent
    let responseText = '';
    let suggestedActions: AICopilotMessage['suggestedActions'] = [];

    const lower = userQuery.toLowerCase();
    if (lower.includes('forecast') || lower.includes('revenue') || lower.includes('cash')) {
      responseText = `Based on current General Ledger postings and model PRED-Q3-REV-901 (Gemini 2.5 Pro + Forecaster), Q3 Enterprise Revenue is projected at $4,850,000 USD (+14.8% YoY) with a 96.5% confidence rating. Key drivers include manufacturing renewals and Gold Feature adoption.`;
      suggestedActions = [
        { label: 'View Full Forecasting Breakdown', actionType: 'VIEW_FORECAST' },
        { label: 'Export Report to VRE Engine', actionType: 'EXPORT_VRE' }
      ];
    } else if (lower.includes('anomaly') || lower.includes('fraud') || lower.includes('alert')) {
      responseText = `Vertex Anomaly Detector currently flags 2 unreviewed suspicious items: 1) High risk $14,500 expense claim (CLM-9942) exceeding policy threshold, and 2) Critical $42,000 vendor invoice (INV-VEN-8831) with bank account discrepancy.`;
      suggestedActions = [
        { label: 'Review Expense Claim in VWE', actionType: 'REVIEW_CLAIM' },
        { label: 'Lock Disbursement in VSEC', actionType: 'LOCK_DISBURSEMENT' }
      ];
    } else if (lower.includes('invoice') || lower.includes('ocr') || lower.includes('document')) {
      responseText = `Vertex OCR Engine successfully parsed 100% of uploaded documents this week. Latest file Invoice_AcmeCorp_Aug2026.pdf was extracted with 99.2% field accuracy ($38,450.00 USD due 2026-09-15).`;
      suggestedActions = [
        { label: 'Process Next Invoice PDF', actionType: 'OCR_UPLOAD' }
      ];
    } else {
      responseText = `I have analyzed your request across all ERP modules, Security logs (VSEC), and Workflows (VWE). All systems are running optimally with 0 critical security breaches and 99.4% prediction accuracy.`;
      suggestedActions = [
        { label: 'Run Full ERP System Diagnostic', actionType: 'RUN_DIAGNOSTIC' }
      ];
    }

    const aiMsg: AICopilotMessage = {
      id: `MSG-${Date.now()}-AI`,
      sender: 'COPILOT',
      text: responseText,
      timestamp: new Date().toISOString(),
      suggestedActions
    };

    this.copilotHistory.push(aiMsg);

    auditEngine.logAction(
      'AI_COPILOT_QUERY_PROCESSED',
      'VAIE Copilot Engine',
      `Processed user natural language query: "${userQuery.slice(0, 40)}..."`,
      'info',
      'VAIE Core'
    );

    return aiMsg;
  }

  public resolveAnomaly(anomalyId: string, resolution: 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'RESOLVED'): void {
    const item = this.anomalies.find(a => a.anomalyId === anomalyId);
    if (item) {
      item.status = resolution;
      auditEngine.logAction(
        'AI_ANOMALY_RESOLVED',
        'VAIE Anomaly Manager',
        `Anomaly ${anomalyId} marked as ${resolution}`,
        'info',
        'VAIE Anomaly Core'
      );
    }
  }

  public parseDocumentFile(fileName: string, docType: AIDocumentExtraction['documentType']): AIDocumentExtraction {
    const doc: AIDocumentExtraction = {
      documentId: `DOC-${Date.now().toString().slice(-4)}`,
      fileName,
      documentType: docType,
      confidenceScore: 0.988,
      extractedFields: [
        { fieldName: 'Document Name', fieldValue: fileName, confidence: 0.99 },
        { fieldName: 'Type', fieldValue: docType, confidence: 0.99 },
        { fieldName: 'Extracted Amount', fieldValue: '$12,850.00 USD', confidence: 0.98 },
        { fieldName: 'Tax / Reg ID', fieldValue: 'TAX-881029', confidence: 0.97 },
        { fieldName: 'Parsed Date', fieldValue: new Date().toISOString().split('T')[0], confidence: 0.99 }
      ],
      processedAt: new Date().toISOString(),
      status: 'PARSED'
    };

    this.extractions.unshift(doc);
    auditEngine.logAction(
      'AI_DOCUMENT_OCR_PROCESSED',
      'VAIE OCR Engine',
      `Parsed file ${fileName} with confidence 98.8%`,
      'info',
      'VAIE Document Parser'
    );

    return doc;
  }
}

export const aiManager = AIManager.getInstance();
