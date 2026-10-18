import { GoldFeatureMetadata, GoldFeatureStatus, PhaseInfo } from '../types';

export interface GoldFeatureContract {
  metadata: GoldFeatureMetadata;
  phases: PhaseInfo[];
  initialize(): void;
  getPhaseStatus(phaseId: string): boolean;
  completePhase(phaseId: string): void;
}
