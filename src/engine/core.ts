export interface EngineConfig {
  debug?: boolean;
}

export interface EngineInterface {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  getConfig(): EngineConfig;
  getProfile(name: string): any;
  listProfiles(): string[];
  applyProfile(name: string): void;
  getPlugin(name: string): any;
  listPlugins(): string[];
  registerPlugin(p: any): void;
  registerProfile(p: any): void;
  getPerformanceMetrics(): any;
  resetPerformanceMetrics(): void;
}

export class CoreEngine implements EngineInterface {
  private config: EngineConfig;
  private profiles: Map<string, any>;
  private plugins: Map<string, any>;
  private currentProfile?: string;
  private initialized: boolean;
  private metrics: { totalOperations: number };

  constructor(config?: EngineConfig) {
    this.config = { debug: true, ...config };
    this.profiles = new Map<string, any>();
    this.plugins = new Map<string, any>();
    this.currentProfile = undefined;
    this.initialized = false;
    this.metrics = { totalOperations: 0 };
    // Seed a default profile
    this.profiles.set("default", {
      id: "default",
      name: "default",
      description: "Default profile",
    });
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async destroy(): Promise<void> {
    this.initialized = false;
  }

  getConfig(): EngineConfig {
    return this.config;
  }

  getProfile(name: string): any {
    return this.profiles.get(name);
  }

  listProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  applyProfile(name: string): void {
    this.currentProfile = name;
  }

  getPlugin(name: string): any {
    return this.plugins.get(name);
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  registerPlugin(p: any): void {
    const key = p?.name ?? `plugin-${Date.now()}`;
    this.plugins.set(key, p);
  }

  registerProfile(p: any): void {
    const key = p?.name ?? p?.id ?? `profile-${Date.now()}`;
    this.profiles.set(key, p);
  }

  getPerformanceMetrics(): any {
    return this.metrics;
  }

  resetPerformanceMetrics(): void {
    this.metrics = { totalOperations: 0 };
  }
}

export const globalEngine = new CoreEngine({ debug: true });
export function getGlobalEngine(): CoreEngine {
  return globalEngine;
}
