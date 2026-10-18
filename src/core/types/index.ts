export type GoldFeatureStatus = 'active' | 'completed' | 'planned' | 'deprecated';

export interface GoldFeatureMetadata {
  id: string;
  code: string;
  name: string;
  description: string;
  version: string;
  category: string;
  phasesCount: number;
  completedPhasesCount: number;
  status: GoldFeatureStatus;
  author?: string;
  releaseDate?: string;
}

export interface PhaseInfo {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  icon?: string;
}

export interface UserContext {
  userId: string;
  username: string;
  role: string;
  department: string;
  branch: string;
  company: string;
}

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}
