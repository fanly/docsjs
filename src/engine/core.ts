import type { EngineConfig, TransformationProfile } from "../types/engine";
import type { ExportResult } from "../pipeline/types";
import type { EnginePlugin } from "../plugins-v2/types";

export interface EngineInterface {
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  configure(config: Partial<EngineConfig>): void;
  getConfig(): EngineConfig;
  getProfile(name: string): any;
  listProfiles(): string[];
  applyProfile(name: string): void;
  getPlugin(name: string): EnginePlugin | undefined;
  listPlugins(): string[];
  registerPlugin(p: EnginePlugin): void;
  registerProfile(p: any): void;
  getPerformanceMetrics(): any;
  resetPerformanceMetrics(): void;
  transformDocument(input: File | string, profileId?: string): Promise<ExportResult>;
}

export class CoreEngine implements EngineInterface {
  private config: EngineConfig;
  private profiles: Map<string, any>;
  private plugins: Map<string, EnginePlugin>;
  private currentProfile?: string;
  private initialized: boolean;
  private metrics: {
    totalOperations: number;
    averageElapsedTimeMs?: number;
    totalElapsedTimeMs?: number;
    averageOperationsPerSecond?: number;
    pipelineStats?: any;
    totalProfileSwitches?: number;
    totalPluginInit?: number;
    peakMemoryUsageMB?: number;
  };

  constructor(config?: Partial<EngineConfig>) {
    const defaultConfig: EngineConfig = {
      debug: false,
      performance: {
        maxMemoryMB: 512,
        maxWorkers: 4,
        operationTimeoutMS: 30000,
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ["."],
        allowNetwork: false,
      },
      plugins: {
        allowUnsigned: false,
        autoUpdate: true,
        maxExecutionTimeMS: 1000,
      },
    };
    this.config = { ...defaultConfig, ...(config as any) };
    this.profiles = new Map<string, any>();
    this.plugins = new Map<string, EnginePlugin>();
    this.currentProfile = undefined;
    this.initialized = false;
    this.metrics = {
      totalOperations: 0,
      averageElapsedTimeMs: 0,
      totalElapsedTimeMs: 0,
      averageOperationsPerSecond: 0,
      pipelineStats: {},
      totalProfileSwitches: 0,
      totalPluginInit: 0,
      peakMemoryUsageMB: 0,
    };
    this.seedSystemProfiles();
  }

  private seedSystemProfiles(): void {
    this.profiles.set("default", {
      id: "default",
      name: "Default Profile",
      description: "Default processing profile for general use",
      parse: {
        enablePlugins: true,
        features: {
          mathML: true,
          tables: true,
          images: true,
          annotations: true,
        },
        performance: { chunkSize: 1024, maxFileSizeMB: 100 },
      },
      transform: {
        enablePlugins: true,
        enableCompression: true,
        enableOptimization: true,
        operations: [],
      },
      render: {
        outputFormat: "html",
        theme: "default",
        options: { preserveOriginalFormatting: true },
      },
      security: {
        allowExternalResources: false,
        sanitizerProfile: "fidelity-first",
      },
    });

    this.profiles.set("knowledge-base", {
      id: "knowledge-base",
      name: "Knowledge Base Profile",
      description: "For documentation and knowledge bases content preservation",
      parse: {
        enablePlugins: true,
        features: {
          mathML: true,
          tables: true,
          images: true,
          annotations: true,
        },
        performance: { chunkSize: 1024, maxFileSizeMB: 200 },
      },
      transform: {
        enablePlugins: true,
        enableCompression: false,
        enableOptimization: true,
        preserveSemanticFidelity: true,
        operations: [
          "normalize-headings",
          "enhance-semantic-meaning",
          "preserve-structure",
          "optimize-for-search",
          "annotate-with-ids",
        ],
      },
      render: {
        outputFormat: "html",
        theme: "knowledge-base",
        options: { preserveOriginalFormatting: true },
      },
      security: {
        allowExternalResources: false,
        sanitizerProfile: "fidelity-first",
      },
    });

    this.profiles.set("exam-paper", {
      id: "exam-paper",
      name: "Exam Paper Profile",
      description: "For academic document and exam papers with question extraction",
      parse: {
        enablePlugins: true,
        features: {
          mathML: true,
          tables: false,
          images: true,
          annotations: true,
        },
        performance: { chunkSize: 512, maxFileSizeMB: 150 },
      },
      transform: {
        enableCompression: false,
        enableOptimization: false,
        preserveSemanticFidelity: true,
        extractQuestions: true,
        questionProcessing: true,
        operations: ["extract-questions"],
      },
      render: {
        outputFormat: "markdown",
        theme: "academic",
      },
      security: {
        allowExternalResources: false,
        sanitizerProfile: "strict",
      },
    });

    this.profiles.set("enterprise-document", {
      id: "enterprise-document",
      name: "Enterprise Document Profile",
      description: "For enterprise documents with security and compliance focus",
      parse: {
        enablePlugins: true,
        features: {
          mathML: false,
          tables: true,
          images: true,
          annotations: true,
        },
        performance: { chunkSize: 2048, maxFileSizeMB: 250 },
      },
      transform: {
        enableCompression: true,
        enableOptimization: true,
        preserveSemanticFidelity: true,
        complianceChecking: true,
        securityEnhancement: true,
        operations: ["normalize", "enterprise-scan"],
      },
      render: {
        outputFormat: "pdf",
        theme: "corporate",
        options: { enableEnterpriseFeatures: true },
      },
      security: {
        allowExternalResources: false,
        sanitizerProfile: "strict",
      },
    });
  }

  async initialize(): Promise<void> {
    this.initialized = true;
    for (const plugin of this.plugins.values()) {
      if ((plugin as any).init) {
        try {
          await (plugin as any).init();
          this.metrics.totalPluginInit = (this.metrics.totalPluginInit || 0) + 1;
        } catch (e) {
          if (this.config.debug) {
            console.error(`Plugin init failed: ${(plugin as any).name}`, e);
          }
        }
      }
    }
  }

  async destroy(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      if ((plugin as any).destroy) {
        try {
          await (plugin as any).destroy();
        } catch (e) {
          if (this.config.debug) {
            console.error(`Plugin destroy failed: ${(plugin as any).name}`, e);
          }
        }
      }
    }
    this.initialized = false;
  }

  configure(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...(config as any) } as EngineConfig;
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
    const previous = this.currentProfile;
    this.currentProfile = name;
    if (previous !== name) {
      this.metrics.totalProfileSwitches = (this.metrics.totalProfileSwitches || 0) + 1;
    }
  }

  getPlugin(name: string): EnginePlugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  registerPlugin(p: EnginePlugin): void {
    const key = p?.name ?? `plugin-${Date.now()}`;
    if (!key || key.trim() === "") {
      throw new Error("Plugin must have a valid name");
    }
    if (p.permissions?.network && !this.config.security.allowNetwork) {
      throw new Error("Plugin requires network access but engine network is disabled");
    }
    this.plugins.set(key, p);
  }

  registerProfile(p: any): void {
    const key = p?.id ?? p?.name ?? `profile-${Date.now()}`;
    if (!key || key.trim() === "") {
      throw new Error("Profile must have a valid id or name");
    }
    this.profiles.set(key, p);
  }

  getPerformanceMetrics(): any {
    if (this.metrics.totalOperations > 0) {
      this.metrics.averageElapsedTimeMs = this.metrics.totalElapsedTimeMs
        ? this.metrics.totalElapsedTimeMs / this.metrics.totalOperations
        : 0;
      this.metrics.averageOperationsPerSecond =
        this.metrics.totalElapsedTimeMs && this.metrics.totalElapsedTimeMs > 0
          ? (this.metrics.totalOperations * 1000) / this.metrics.totalElapsedTimeMs
          : 0;
    }
    if (!this.metrics.pipelineStats) {
      this.metrics.pipelineStats = {};
    }
    return this.metrics;
  }

  resetPerformanceMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      averageElapsedTimeMs: 0,
      totalElapsedTimeMs: 0,
      averageOperationsPerSecond: 0,
      pipelineStats: {},
      totalProfileSwitches: 0,
      totalPluginInit: 0,
      peakMemoryUsageMB: 0,
    };
  }

  async transformDocument(input: File | string, profileId?: string): Promise<ExportResult> {
    const start = Date.now();
    let content: string = "";
    if (typeof input === "string") {
      content = input;
    } else if (input && typeof (input as any).text === "function") {
      content = await (input as any).text();
    } else {
      content = JSON.stringify(input);
    }

    const activeProfile = profileId ?? this.currentProfile ?? "default";
    const transformed = `<!-- Profile: ${activeProfile} -->\n${content}`;
    const duration = Date.now() - start;

    this.metrics.totalOperations += 1;
    this.metrics.totalElapsedTimeMs = (this.metrics.totalElapsedTimeMs || 0) + duration;

    const result: ExportResult = {
      output: transformed,
      diagnostics: {
        errors: [],
        warnings: [],
        stats: {},
        metadata: {
          engineVersion: "2.0.0",
          astVersion: "v2",
          pipelineProfile: activeProfile,
          transformTimeMs: duration,
          inputSizeBytes: typeof content === "string" ? content.length : 0,
          outputSizeBytes: transformed.length,
        },
      },
    };
    return result;
  }
}

export const globalEngine = new CoreEngine({ debug: true });
export function getGlobalEngine(): CoreEngine {
  return globalEngine;
}
