import { SearchQuery, SearchResponse } from './SearchTypes';
import { indexManager, IndexManager } from './IndexManager';
import { queryEngine, QueryEngine } from './QueryEngine';
import { searchAnalytics, SearchAnalytics } from './SearchAnalytics';
import { searchSession, SearchSession } from './SearchSession';
import { engineContext } from '../EngineContext';

export class SearchManager {
  private static instance: SearchManager;

  private indexManager: IndexManager = indexManager;
  private queryEngine: QueryEngine = queryEngine;
  private searchAnalytics: SearchAnalytics = searchAnalytics;
  private searchSession: SearchSession = searchSession;

  private constructor() {}

  public static getInstance(): SearchManager {
    if (!SearchManager.instance) {
      SearchManager.instance = new SearchManager();
    }
    return SearchManager.instance;
  }

  public search(query: SearchQuery): SearchResponse {
    const response = this.queryEngine.executeSearch(query);
    
    // Log audit & analytics
    this.searchAnalytics.recordSearch(query, response);

    if (query.term) {
      this.searchSession.addRecentTerm(query.term);
      engineContext.logAudit(
        'ENG-SEARCH',
        'Universal Search Query Executed',
        `Query: "${query.term}" | Results: ${response.totalCount} | Latency: ${response.executionTimeMs}ms`,
        'info'
      );
    }

    return response;
  }

  public liveSearch(term: string, filters?: SearchQuery['filters']): SearchResponse {
    return this.search({
      term,
      filters,
      matchStrategy: 'hybrid',
      limit: 10
    });
  }

  public getIndexManager(): IndexManager {
    return this.indexManager;
  }

  public getAnalytics(): SearchAnalytics {
    return this.searchAnalytics;
  }

  public getSession(): SearchSession {
    return this.searchSession;
  }
}

export const searchManager = SearchManager.getInstance();
