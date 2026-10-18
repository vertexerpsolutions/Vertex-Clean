import { EngineContract } from './EngineTypes';

export interface DependencyValidationResult {
  valid: boolean;
  missingDependencies: string[];
  circularDependencies: string[];
}

export class EngineRegistry {
  private static instance: EngineRegistry;
  private registry = new Map<string, EngineContract>();

  private constructor() {}

  public static getInstance(): EngineRegistry {
    if (!EngineRegistry.instance) {
      EngineRegistry.instance = new EngineRegistry();
    }
    return EngineRegistry.instance;
  }

  public registerEngine(engine: EngineContract): boolean {
    if (this.registry.has(engine.config.id)) {
      console.warn(`[EngineRegistry] Engine ${engine.config.id} is already registered. Overwriting.`);
    }
    this.registry.set(engine.config.id, engine);
    return true;
  }

  public unregisterEngine(engineId: string): boolean {
    return this.registry.delete(engineId);
  }

  public getEngine(engineId: string): EngineContract | undefined {
    return this.registry.get(engineId);
  }

  public getAllEngines(): EngineContract[] {
    return Array.from(this.registry.values());
  }

  public validateDependencies(engineId: string): DependencyValidationResult {
    const engine = this.registry.get(engineId);
    if (!engine) {
      return { valid: false, missingDependencies: [engineId], circularDependencies: [] };
    }

    const missing: string[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();
    const circular: string[] = [];

    const checkDeps = (id: string) => {
      visited.add(id);
      stack.add(id);

      const target = this.registry.get(id);
      if (target) {
        for (const depId of target.config.dependencies) {
          if (!this.registry.has(depId)) {
            missing.push(depId);
          } else if (stack.has(depId)) {
            circular.push(`${id} -> ${depId}`);
          } else if (!visited.has(depId)) {
            checkDeps(depId);
          }
        }
      }

      stack.delete(id);
    };

    checkDeps(engineId);

    return {
      valid: missing.length === 0 && circular.length === 0,
      missingDependencies: missing,
      circularDependencies: circular
    };
  }
}

export const engineRegistry = EngineRegistry.getInstance();
