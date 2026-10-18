import { SearchAnalyticsData, SearchQuery, SearchResponse } from './SearchTypes';

export class SearchAnalytics {
  private static instance: SearchAnalytics;

  private totalQueries = 0;
  private totalLatencyMs = 0;
  private failedQueryCount = 0;
  private keywordCounts = new Map<string, number>();
  private recordSearchCounts = new Map<string, { title: string; type: string; count: number }>();
  private queriesByModule = new Map<string, number>();
  private queriesByUser = new Map<string, number>();
  private recentQueriesLog: SearchAnalyticsData['recentQueries'] = [];

  private constructor() {}

  public static getInstance(): SearchAnalytics {
    if (!SearchAnalytics.instance) {
      SearchAnalytics.instance = new SearchAnalytics();
    }
    return SearchAnalytics.instance;
  }

  public recordSearch(query: SearchQuery, response: SearchResponse): void {
    this.totalQueries++;
    this.totalLatencyMs += response.executionTimeMs;

    const term = query.term.trim().toLowerCase();
    const userId = query.userRole || 'vtx_sysadmin';

    if (term) {
      this.keywordCounts.set(term, (this.keywordCounts.get(term) || 0) + 1);
    }

    if (response.totalCount === 0 && term !== '') {
      this.failedQueryCount++;
    }

    // Track top searched records from results
    response.results.slice(0, 3).forEach(res => {
      const rec = res.record;
      const existing = this.recordSearchCounts.get(rec.id) || { title: rec.title, type: rec.type, count: 0 };
      existing.count++;
      this.recordSearchCounts.set(rec.id, existing);

      if (rec.module) {
        this.queriesByModule.set(rec.module, (this.queriesByModule.get(rec.module) || 0) + 1);
      }
    });

    this.queriesByUser.set(userId, (this.queriesByUser.get(userId) || 0) + 1);

    this.recentQueriesLog.unshift({
      id: `SQ-${Math.floor(10000 + Math.random() * 90000)}`,
      query: query.term || '* (all)',
      timestamp: new Date().toISOString(),
      resultsCount: response.totalCount,
      userId,
      latencyMs: response.executionTimeMs
    });

    if (this.recentQueriesLog.length > 50) {
      this.recentQueriesLog.pop();
    }
  }

  public getAnalyticsData(): SearchAnalyticsData {
    const popularKeywords = Array.from(this.keywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const mostSearchedRecords = Array.from(this.recordSearchCounts.entries())
      .map(([recordId, info]) => ({ recordId, title: info.title, type: info.type, count: info.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const modObj: Record<string, number> = {};
    this.queriesByModule.forEach((val, key) => (modObj[key] = val));

    const userObj: Record<string, number> = {};
    this.queriesByUser.forEach((val, key) => (userObj[key] = val));

    const avgResponseTimeMs = this.totalQueries > 0 ? Math.round((this.totalLatencyMs / this.totalQueries) * 100) / 100 : 0;

    return {
      totalQueries: this.totalQueries,
      avgResponseTimeMs,
      failedQueryCount: this.failedQueryCount,
      popularKeywords,
      mostSearchedRecords,
      queriesByModule: modObj,
      queriesByUser: userObj,
      recentQueries: [...this.recentQueriesLog]
    };
  }
}

export const searchAnalytics = SearchAnalytics.getInstance();
