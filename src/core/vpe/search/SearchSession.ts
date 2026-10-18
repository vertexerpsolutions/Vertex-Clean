import { SavedSearch, SearchQuickAction } from './SearchTypes';

export class SearchSession {
  private static instance: SearchSession;

  private recentTerms: string[] = ['server', 'acme', 'INV-2026-001', 'VGF-01', 'setup wizard'];
  private savedSearches: SavedSearch[] = [
    {
      id: 'SAV-1',
      name: 'All NY Active Invoices',
      query: { term: 'invoice', filters: { branch: ['HQ-NY'], status: ['Paid'] } },
      createdAt: new Date().toISOString(),
      isPinned: true
    },
    {
      id: 'SAV-2',
      name: 'High-Value Hardware Items',
      query: { term: 'hardware', filters: { tags: ['Hardware'] } },
      createdAt: new Date().toISOString(),
      isPinned: true
    }
  ];

  private pinnedRecordIds = new Set<string>(['CUST-1001', 'ITEM-5001', 'VGF-01-IDX']);

  private quickActions: SearchQuickAction[] = [
    {
      id: 'QA-1',
      title: 'Run First Run Setup Wizard (VGF-01)',
      description: 'Launch system onboarding boot sequence',
      iconName: 'Wand2',
      actionType: 'navigate',
      target: '/gold/VGF-01',
      shortcut: 'Alt+1'
    },
    {
      id: 'QA-2',
      title: 'Create New Sales Invoice',
      description: 'Open Accounts Receivable invoice editor',
      iconName: 'Receipt',
      actionType: 'navigate',
      target: '/ar/invoices/new',
      shortcut: 'Alt+I'
    },
    {
      id: 'QA-3',
      title: 'Trigger Platform Backup Snapshot',
      description: 'Execute encrypted point-in-time database snapshot',
      iconName: 'Database',
      actionType: 'trigger',
      target: 'trigger_backup',
      shortcut: 'Alt+B'
    },
    {
      id: 'QA-4',
      title: 'Check Platform Engines Health',
      description: 'Ping all 15 system engines and VPE core',
      iconName: 'Activity',
      actionType: 'navigate',
      target: '/vpe/dashboard',
      shortcut: 'Alt+H'
    }
  ];

  private constructor() {}

  public static getInstance(): SearchSession {
    if (!SearchSession.instance) {
      SearchSession.instance = new SearchSession();
    }
    return SearchSession.instance;
  }

  public addRecentTerm(term: string): void {
    const trimmed = term.trim();
    if (!trimmed) return;
    this.recentTerms = [trimmed, ...this.recentTerms.filter(t => t.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
  }

  public getRecentTerms(): string[] {
    return [...this.recentTerms];
  }

  public clearRecentTerms(): void {
    this.recentTerms = [];
  }

  public saveSearch(name: string, query: SavedSearch['query']): SavedSearch {
    const newSave: SavedSearch = {
      id: `SAV-${Math.floor(100 + Math.random() * 900)}`,
      name,
      query,
      createdAt: new Date().toISOString(),
      isPinned: false
    };
    this.savedSearches.push(newSave);
    return newSave;
  }

  public getSavedSearches(): SavedSearch[] {
    return [...this.savedSearches];
  }

  public togglePinSavedSearch(id: string): void {
    const item = this.savedSearches.find(s => s.id === id);
    if (item) {
      item.isPinned = !item.isPinned;
    }
  }

  public deleteSavedSearch(id: string): void {
    this.savedSearches = this.savedSearches.filter(s => s.id !== id);
  }

  public togglePinRecord(recordId: string): boolean {
    if (this.pinnedRecordIds.has(recordId)) {
      this.pinnedRecordIds.delete(recordId);
      return false;
    } else {
      this.pinnedRecordIds.add(recordId);
      return true;
    }
  }

  public isRecordPinned(recordId: string): boolean {
    return this.pinnedRecordIds.has(recordId);
  }

  public getPinnedRecordIds(): string[] {
    return Array.from(this.pinnedRecordIds);
  }

  public getQuickActions(): SearchQuickAction[] {
    return [...this.quickActions];
  }
}

export const searchSession = SearchSession.getInstance();
