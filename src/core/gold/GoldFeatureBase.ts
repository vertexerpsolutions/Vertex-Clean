import { GoldFeatureMetadata, PhaseInfo } from '../types';
import { GoldFeatureContract } from './GoldTypes';

export abstract class GoldFeatureBase implements GoldFeatureContract {
  public metadata: GoldFeatureMetadata;
  public phases: PhaseInfo[];

  constructor(metadata: GoldFeatureMetadata, phases: PhaseInfo[]) {
    this.metadata = metadata;
    this.phases = phases;
  }

  public initialize(): void {
    console.log(`[GoldFeatureBase] Initialized feature: ${this.metadata.code} - ${this.metadata.name}`);
  }

  public getPhaseStatus(phaseId: string): boolean {
    const phase = this.phases.find(p => p.id === phaseId);
    return phase ? phase.isCompleted : false;
  }

  public completePhase(phaseId: string): void {
    const phase = this.phases.find(p => p.id === phaseId);
    if (phase) {
      phase.isCompleted = true;
      this.metadata.completedPhasesCount = this.phases.filter(p => p.isCompleted).length;
    }
  }
}
