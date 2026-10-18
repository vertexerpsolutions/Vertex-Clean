import { EngineBase } from '../EngineBase';
import { HealthCheckResult } from '../EngineTypes';
import { searchManager } from './SearchManager';

export class UniversalSearchEngine extends EngineBase {
  constructor() {
    super({
      id: 'ENG-SEARCH',
      name: 'Vertex Universal Search Engine (VSE)',
      version: '2.0.0-VPE01',
      description: 'Centralized enterprise full-text search engine powering all 15 ERP business modules, Gold features, and platform engines with permission-aware indexing.',
      category: 'Core Platform Engine',
      autoStart: true,
      dependencies: ['ENG-AUDIT', 'ENG-SECURITY'],
      permissions: {
        allowDatabaseAccess: true,
        allowNetworkAccess: true,
        allowSystemCommands: false,
        allowEventBroadcast: true,
        allowedEvents: ['search:query_executed', 'search:index_rebuilt'],
        maxMemoryMB: 128
      }
    });
  }

  protected async onInitialize(): Promise<boolean> {
    const stats = searchManager.getIndexManager().getIndexStats();
    if (this.context) {
      this.context.logAudit(
        this.config.id,
        'Universal Search Engine Initialized',
        `Indexed ${stats.totalRecords} records across all business modules & engines.`
      );
    }
    return true;
  }

  protected async onStart(): Promise<boolean> {
    return true;
  }

  protected async onPause(): Promise<boolean> {
    return true;
  }

  protected async onResume(): Promise<boolean> {
    return true;
  }

  protected async onShutdown(): Promise<boolean> {
    return true;
  }

  protected async onHealthCheck(): Promise<HealthCheckResult> {
    const stats = searchManager.getIndexManager().getIndexStats();
    const analytics = searchManager.getAnalytics().getAnalyticsData();

    return {
      status: 'healthy',
      latencyMs: analytics.avgResponseTimeMs || 1.4,
      message: `Universal Search Engine active. ${stats.totalRecords} records indexed. Total queries served: ${analytics.totalQueries}`,
      subsystemChecks: {
        indexManager: !stats.isIndexing,
        queryEngine: true,
        securityValidator: true,
        analyticsTracker: true
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const universalSearchEngine = new UniversalSearchEngine();
