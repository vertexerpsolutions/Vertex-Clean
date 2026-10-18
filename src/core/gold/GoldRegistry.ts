import { GoldFeatureMetadata } from '../types';
import { GOLD_FEATURE_DEFINITIONS } from './GoldConstants';

export class GoldRegistry {
  private static instance: GoldRegistry;
  private features: Map<string, GoldFeatureMetadata> = new Map();

  private constructor() {
    GOLD_FEATURE_DEFINITIONS.forEach(f => {
      this.features.set(f.code, f);
    });
  }

  public static getInstance(): GoldRegistry {
    if (!GoldRegistry.instance) {
      GoldRegistry.instance = new GoldRegistry();
    }
    return GoldRegistry.instance;
  }

  public getAllFeatures(): GoldFeatureMetadata[] {
    return Array.from(this.features.values());
  }

  public getFeature(code: string): GoldFeatureMetadata | undefined {
    return this.features.get(code);
  }

  public registerFeature(feature: GoldFeatureMetadata): void {
    this.features.set(feature.code, feature);
  }
}
