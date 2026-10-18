import { IndexRecord, MatchStrategy, SearchQuery, SearchResponse, SearchResult } from './SearchTypes';
import { indexManager } from './IndexManager';

export class QueryEngine {
  private static instance: QueryEngine;

  private constructor() {}

  public static getInstance(): QueryEngine {
    if (!QueryEngine.instance) {
      QueryEngine.instance = new QueryEngine();
    }
    return QueryEngine.instance;
  }

  public executeSearch(query: SearchQuery): SearchResponse {
    const startTime = performance.now();
    const records = indexManager.getAllRecords();

    const normalizedTerm = query.term.trim().toLowerCase();
    const strategy: MatchStrategy = query.matchStrategy || 'hybrid';

    // 1. Filter by security permissions & user context
    const authorizedRecords = records.filter(rec => this.checkSecurityPermission(rec, query));

    // 2. Filter by Smart Filters
    const filteredRecords = authorizedRecords.filter(rec => this.applySmartFilters(rec, query.filters));

    // 3. Match & Calculate Relevance Score
    const scoredResults: SearchResult[] = [];

    for (const record of filteredRecords) {
      const matchResult = this.evaluateMatch(record, normalizedTerm, strategy);
      if (matchResult.score > 0 || normalizedTerm === '') {
        scoredResults.push({
          record,
          score: matchResult.score,
          matchedFields: matchResult.matchedFields,
          highlights: matchResult.highlights
        });
      }
    }

    // Sort by relevance score descending
    scoredResults.sort((a, b) => b.score - a.score);

    // Facets computation
    const facets = {
      byModule: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byBranch: {} as Record<string, number>
    };

    scoredResults.forEach(res => {
      const r = res.record;
      facets.byModule[r.module] = (facets.byModule[r.module] || 0) + 1;
      facets.byType[r.type] = (facets.byType[r.type] || 0) + 1;
      facets.byStatus[r.status] = (facets.byStatus[r.status] || 0) + 1;
      facets.byBranch[r.branch] = (facets.byBranch[r.branch] || 0) + 1;
    });

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const paginatedResults = scoredResults.slice(offset, offset + limit);

    // Compute search suggestions
    const suggestions = this.generateSuggestions(normalizedTerm, scoredResults);

    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      query,
      totalCount: scoredResults.length,
      executionTimeMs,
      results: paginatedResults,
      facets,
      suggestions
    };
  }

  private checkSecurityPermission(record: IndexRecord, query: SearchQuery): boolean {
    const userRole = query.userRole || 'Super Administrator';
    const userBranch = query.userBranch;
    const userDepartment = query.userDepartment;

    // Super Admin sees everything
    if (userRole === 'Super Administrator' || userRole === 'Root Admin') {
      return true;
    }

    // Check role permission requirements
    if (record.permissionsRequired && record.permissionsRequired.length > 0) {
      const hasRole = record.permissionsRequired.some(r => r === userRole);
      if (!hasRole) return false;
    }

    // Branch restriction check
    if (userBranch && record.branch && record.branch !== userBranch && userBranch !== 'ALL') {
      // Allow if branch matches HQ or user branch
      if (record.branch !== 'HQ-NY' && record.branch !== userBranch) {
        return false;
      }
    }

    // Department restriction check (if applicable)
    if (userDepartment && record.department && userDepartment !== 'ALL') {
      if (record.department !== userDepartment && record.department !== 'Platform Architecture') {
        // Optional relaxed check or strict
      }
    }

    return true;
  }

  private applySmartFilters(record: IndexRecord, filters?: SearchQuery['filters']): boolean {
    if (!filters) return true;

    if (filters.module && filters.module.length > 0) {
      if (!filters.module.some(m => m.toLowerCase() === record.module.toLowerCase())) {
        return false;
      }
    }

    if (filters.branch && filters.branch.length > 0) {
      if (!filters.branch.some(b => b.toLowerCase() === record.branch.toLowerCase())) {
        return false;
      }
    }

    if (filters.department && filters.department.length > 0) {
      if (!filters.department.some(d => d.toLowerCase() === record.department.toLowerCase())) {
        return false;
      }
    }

    if (filters.status && filters.status.length > 0) {
      if (!filters.status.some(s => s.toLowerCase() === record.status.toLowerCase())) {
        return false;
      }
    }

    if (filters.docType && filters.docType.length > 0) {
      if (!filters.docType.some(t => t.toLowerCase() === record.type.toLowerCase())) {
        return false;
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        record.tags.some(rt => rt.toLowerCase() === tag.toLowerCase())
      );
      if (!hasMatchingTag) return false;
    }

    if (filters.user && filters.user.length > 0) {
      if (!filters.user.some(u => u.toLowerCase() === record.createdBy.toLowerCase())) {
        return false;
      }
    }

    if (filters.dateFrom) {
      if (record.date < filters.dateFrom) return false;
    }

    if (filters.dateTo) {
      if (record.date > filters.dateTo) return false;
    }

    return true;
  }

  private evaluateMatch(
    record: IndexRecord,
    term: string,
    strategy: MatchStrategy
  ): { score: number; matchedFields: string[]; highlights: Record<string, string> } {
    if (!term) {
      return { score: 10, matchedFields: ['all'], highlights: {} };
    }

    let score = 0;
    const matchedFields: string[] = [];
    const highlights: Record<string, string> = {};

    // Helper for exact and substring matching
    const testField = (fieldName: string, value?: string, weight = 10) => {
      if (!value) return;
      const lowerVal = value.toLowerCase();

      // Exact match
      if (lowerVal === term) {
        score += weight * 10;
        matchedFields.push(`${fieldName} (Exact)`);
        highlights[fieldName] = `<mark class="bg-amber-400 text-slate-950 px-1 rounded">${value}</mark>`;
      } 
      // Prefix match
      else if (lowerVal.startsWith(term)) {
        score += weight * 5;
        matchedFields.push(`${fieldName} (Prefix)`);
        highlights[fieldName] = value.replace(new RegExp(`(${term})`, 'gi'), '<mark class="bg-amber-400 text-slate-950 px-1 rounded">$1</mark>');
      } 
      // Substring match
      else if (lowerVal.includes(term)) {
        score += weight * 3;
        matchedFields.push(`${fieldName} (Partial)`);
        highlights[fieldName] = value.replace(new RegExp(`(${term})`, 'gi'), '<mark class="bg-amber-400 text-slate-950 px-1 rounded">$1</mark>');
      }
      // Fuzzy match (Levenshtein proximity if term length > 3)
      else if (strategy === 'fuzzy' || strategy === 'hybrid') {
        if (term.length >= 4 && this.isFuzzyMatch(lowerVal, term)) {
          score += weight * 1.5;
          matchedFields.push(`${fieldName} (Fuzzy)`);
          highlights[fieldName] = value;
        }
      }
    };

    // Primary code & reference (Highest priority)
    testField('code', record.code, 25);
    testField('reference', record.reference, 20);
    testField('barcode', record.barcode, 20);
    testField('qrCode', record.qrCode, 20);
    testField('serialNumber', record.serialNumber, 20);

    // Contact info
    testField('phone', record.phone, 18);
    testField('email', record.email, 18);
    testField('taxNumber', record.taxNumber, 18);
    testField('nationalId', record.nationalId, 18);

    // Title & Subtitle
    testField('title', record.title, 15);
    testField('subtitle', record.subtitle, 10);

    // Description & Keywords
    testField('description', record.description, 8);

    record.keywords.forEach(kw => {
      if (kw.toLowerCase().includes(term)) {
        score += 6;
        if (!matchedFields.includes('keywords')) matchedFields.push('keywords');
      }
    });

    record.tags.forEach(tag => {
      if (tag.toLowerCase().includes(term)) {
        score += 8;
        if (!matchedFields.includes('tags')) matchedFields.push('tags');
      }
    });

    return { score, matchedFields, highlights };
  }

  private isFuzzyMatch(str: string, pattern: string): boolean {
    if (str.length < pattern.length) return false;
    let errorsAllowed = 1;
    let j = 0;
    for (let i = 0; i < str.length && j < pattern.length; i++) {
      if (str[i] === pattern[j]) {
        j++;
      } else if (errorsAllowed > 0) {
        errorsAllowed--;
      }
    }
    return j === pattern.length;
  }

  private generateSuggestions(term: string, scoredResults: SearchResult[]): string[] {
    const suggestionsSet = new Set<string>();

    scoredResults.slice(0, 5).forEach(res => {
      suggestionsSet.add(res.record.title);
      suggestionsSet.add(res.record.code);
    });

    if (term) {
      if ('server'.includes(term)) suggestionsSet.add('Enterprise Server Blade R750');
      if ('invoice'.includes(term)) suggestionsSet.add('INV-2026-001');
      if ('acme'.includes(term)) suggestionsSet.add('Acme International Corporation');
      if ('setup'.includes(term)) suggestionsSet.add('VGF-01 First Run Setup Wizard');
      if ('engine'.includes(term)) suggestionsSet.add('VPE-01 Vertex Universal Search Engine');
    }

    return Array.from(suggestionsSet).slice(0, 6);
  }
}

export const queryEngine = QueryEngine.getInstance();
