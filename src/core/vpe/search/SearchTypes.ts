export type SearchResultType = 
  | 'customer'
  | 'supplier'
  | 'item'
  | 'warehouse'
  | 'account'
  | 'invoice'
  | 'payment'
  | 'bank'
  | 'treasury'
  | 'asset'
  | 'employee'
  | 'user'
  | 'document'
  | 'attachment'
  | 'audit_log'
  | 'gold_feature'
  | 'platform_engine'
  | 'workflow'
  | 'workflow_instance'
  | 'notification'
  | 'report'
  | 'report_dashboard';

export type MatchStrategy = 'exact' | 'partial' | 'fuzzy' | 'hybrid';

export interface SearchFilters {
  module?: string[];
  company?: string;
  branch?: string[];
  department?: string[];
  docType?: string[];
  category?: string[];
  dateFrom?: string;
  dateTo?: string;
  user?: string[];
  status?: string[];
  tags?: string[];
}

export interface SearchQuery {
  term: string;
  filters?: SearchFilters;
  matchStrategy?: MatchStrategy;
  limit?: number;
  offset?: number;
  userRole?: string;
  userBranch?: string;
  userDepartment?: string;
}

export interface IndexRecord {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  code: string;
  reference: string;
  barcode?: string;
  qrCode?: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  taxNumber?: string;
  serialNumber?: string;
  description: string;
  keywords: string[];
  tags: string[];
  module: string;
  company: string;
  branch: string;
  department: string;
  status: string;
  date: string;
  createdBy: string;
  permissionsRequired: string[];
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  record: IndexRecord;
  score: number;
  matchedFields: string[];
  highlights: Record<string, string>;
}

export interface SearchResponse {
  query: SearchQuery;
  totalCount: number;
  executionTimeMs: number;
  results: SearchResult[];
  facets: {
    byModule: Record<string, number>;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byBranch: Record<string, number>;
  };
  suggestions: string[];
}

export interface SearchAnalyticsData {
  totalQueries: number;
  avgResponseTimeMs: number;
  failedQueryCount: number;
  popularKeywords: Array<{ keyword: string; count: number }>;
  mostSearchedRecords: Array<{ recordId: string; title: string; type: string; count: number }>;
  queriesByModule: Record<string, number>;
  queriesByUser: Record<string, number>;
  recentQueries: Array<{
    id: string;
    query: string;
    timestamp: string;
    resultsCount: number;
    userId: string;
    latencyMs: number;
  }>;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: SearchQuery;
  createdAt: string;
  isPinned: boolean;
}

export interface SearchQuickAction {
  id: string;
  title: string;
  description: string;
  iconName: string;
  actionType: 'navigate' | 'modal' | 'trigger';
  target: string;
  shortcut?: string;
}
