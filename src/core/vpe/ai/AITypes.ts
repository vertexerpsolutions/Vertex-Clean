export type AIModelType = 
  | 'GEMINI_2_5_FLASH'
  | 'GEMINI_2_5_PRO'
  | 'VERTEX_FINANCIAL_FORECASTER'
  | 'VERTEX_ANOMALY_DETECTOR'
  | 'VERTEX_OCR_PARSER'
  | 'VERTEX_LEAD_SCORER';

export type AIModuleCategory = 
  | 'PREDICTIVE_ANALYTICS'
  | 'ANOMALY_DETECTION'
  | 'DOCUMENT_OCR'
  | 'COPILOT_ASSISTANT'
  | 'SMART_RECOMMENDATIONS'
  | 'MODEL_GOVERNANCE';

export interface AIModelConfig {
  modelId: string;
  name: string;
  provider: 'Google Gemini' | 'Vertex Internal ML';
  modelType: AIModelType;
  category: AIModuleCategory;
  temperature: number;
  maxTokens: number;
  isOperational: boolean;
  latencyMs: number;
  accuracyRating: string;
  description: string;
}

export interface AIPredictionResult {
  predictionId: string;
  modelId: string;
  targetMetric: string;
  timeHorizon: string;
  predictedValue: number;
  unit: string;
  confidenceScore: number; // 0.0 to 1.0
  historicalComparisonChangePercent: number;
  generatedAt: string;
  summaryReasoning: string;
  factors: { name: string; impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'; weight: number }[];
}

export interface AIAnomalyAlert {
  anomalyId: string;
  sourceModule: 'General Ledger' | 'Expense Claims' | 'Vendor Invoices' | 'VSEC Audit Logs' | 'Inventory Warehouse';
  entityId: string;
  riskScore: number; // 0 to 100
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAt: string;
  title: string;
  description: string;
  suggestedMitigation: string;
  status: 'UNREVIEWED' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE' | 'RESOLVED';
}

export interface AIDocumentExtraction {
  documentId: string;
  fileName: string;
  documentType: 'VENDOR_INVOICE' | 'PURCHASE_ORDER' | 'CUSTOMS_DECLARATION' | 'EMPLOYEE_RECEIPT';
  confidenceScore: number;
  extractedFields: { fieldName: string; fieldValue: string; confidence: number }[];
  processedAt: string;
  status: 'PARSED' | 'NEEDS_VERIFICATION' | 'REJECTED';
}

export interface AICopilotMessage {
  id: string;
  sender: 'USER' | 'COPILOT';
  text: string;
  timestamp: string;
  suggestedActions?: { label: string; actionType: string; payload?: Record<string, any> }[];
  referencedEntities?: string[];
}

export interface AIRecommendation {
  recommendationId: string;
  category: 'FINANCE' | 'INVENTORY' | 'CRM' | 'HR' | 'WORKFLOW';
  title: string;
  description: string;
  potentialImpactValue: string;
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
  actionableStep: string;
  createdAt: string;
}
