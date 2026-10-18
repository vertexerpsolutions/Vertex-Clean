import { GoldFeatureMetadata } from '../types';
import { GOLD_FEATURE_DEFINITIONS, TOTAL_GOLD_FEATURES, TOTAL_GOLD_PHASES } from './GoldConstants';

export class GoldUtilities {
  public static calculateCompletionRate(): number {
    const completedCount = GOLD_FEATURE_DEFINITIONS.filter(f => f.status === 'completed').length;
    return (completedCount / TOTAL_GOLD_FEATURES) * 100;
  }

  public static formatFeatureCode(codeNumber: number): string {
    return `VGF-${codeNumber.toString().padStart(2, '0')}`;
  }

  public static getFeatureByCode(code: string): GoldFeatureMetadata | undefined {
    return GOLD_FEATURE_DEFINITIONS.find(f => f.code === code || f.id === code);
  }

  public static generateAuditHash(payload: string): string {
    let hash = 0;
    const salt = `${payload}:VERTEX_GOLD_KEY_2026`;
    for (let i = 0; i < salt.length; i++) {
      const char = salt.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return '0x' + Math.abs(hash).toString(16).padStart(8, '0') + 'a8c2f1';
  }
}
