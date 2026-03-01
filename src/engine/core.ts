/**
 * Core Engine Implementation
 * 
 * The central hub coordinating the entire document transformation pipeline.
 */

import type { 
  EngineInterface, 
  EngineConfig, 
  TransformationProfile,
  ValidationResult,
  PerformanceMetrics,
  PipelineMetrics
} from '../types/engine';
import type { PluginHooks, PluginPermissions, PluginContext } from '../plugins-v2';
import { DEFAULT_PIPELINE_CONTEXT } from '../pipeline/context';
import { PipelineManager } from '../pipeline/manager';

export class CoreEngine implements EngineInterface {
  private config: EngineConfig;
  private profiles: Map<string, TransformationProfile> = new Map();
  private plugins: Map<string, PluginHooks> = new Map();
  private pipelineManager: PipelineManager;
  private currentProfile: string | null = null;
  
  // Performance tracking
  private metrics: PerformanceMetrics = {
    totalOperations: 0,
    averageElapsedTimeMs: 0,
    peakMemoryUsageMB: 0,
    totalMemoryGCRuns: 0,
    pipelineStats: {},
  };
  
  constructor(initialConfig?: Partial<EngineConfig>) {
    this.config = this.getDefaultConfig();
    
    // Initialize sub-components FIRST
    this.pipelineManager = new PipelineManager(this);
    
    // Override with initial config
    if (initialConfig) {
      this.configure(initialConfig);
    }
  }

  // Config management

  // Config management
  configure(config: Partial<EngineConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Propagate performance settings to subsystems
    if (config.performance) {
      // Update pipeline manager performance limits
      this.pipelineManager.updatePerformanceLimits(config.performance);
    }
  }

  getConfig(): EngineConfig {
    return { ...this.config };
  }

  // Profile management
  registerProfile(profile: TransformationProfile): void {
    if (this.profiles.has(profile.id)) {
      throw new Error(`Profile with id '${profile.id}' already exists`);
    }
    
    this.profiles.set(profile.id, profile);
    
    if (this.config.debug) {
      console.log(`Registered profile: ${profile.id}`);
    }
  }

  getProfile(id: string): TransformationProfile | undefined {
    return this.profiles.get(id);
  }

  listProfiles(): string[] {
    return Array.from(this.profiles.keys());
  }

  applyProfile(id: string): void {
    const profile = this.getProfile(id);
    if (!profile) {
      throw new Error(`Profile with id '${id}' does not exist`);
    }
    
    this.currentProfile = id;
    
    if (this.config.debug) {
      console.log(`Applied profile: ${id}`);
    }
  }

  async transformDocument(input: File | string, profileId?: string): Promise<ExportResult> {
    const startTime = Date.now();
    const profile = this.getProfile(profileId || this.currentProfile || 'default');
    if (!profile) {
      throw new Error(`Transform profile not found: ${profileId || this.currentProfile}`);
    }

    try {
      // Create pipeline context
      const context: PipelineContext = {
        ...DEFAULT_PIPELINE_CONTEXT,
        engine: this,
        profile: profile,
        input: input,
        config: this.config,
      };

      // Execute transformation pipeline
      const result = await this.pipelineManager.execute(context);

      // Update metrics
      const endTime = Date.now();
      
      this.metrics.totalOperations++;
      this.adjustAverageTime((endTime - startTime), this.metrics.totalOperations);
      
      // Update pipeline metrics
      if (!this.metrics.pipelineStats[profile.id]) {
        this.metrics.pipelineStats[profile.id] = this.getDefaultPipelineMetrics();
      }
      
      const profileMetrics = this.metrics.pipelineStats[profile.id];
      profileMetrics.successCount++;
      profileMetrics.averageThroughputMBps = this.calculateThroughput(
        input,
        (endTime - startTime)
      );

      return result;
    } catch (error) {
      // Update error count in metrics
      if (this.currentProfile) {
        if (!this.metrics.pipelineStats[this.currentProfile]) {
          this.metrics.pipelineStats[this.currentProfile] = this.getDefaultPipelineMetrics();
        }
        this.metrics.pipelineStats[this.currentProfile].errorCount++;
      }
      
      throw error;
    }
  }

  validateAST(ast: DocumentAST): ValidationResult {
    // Basic validation (could be extended with schema validators)
    const errors: ValidationError[] = [];
    
    if (!ast.version) {
      errors.push({
        code: 'MISSING_AST_VERSION',
        message: 'AST must include version field',
        severity: 'critical'
      });
    }
    
    if (!ast.type || ast.type !== 'document') {
      errors.push({
        code: 'INVALID_ROOT_TYPE',
        message: 'AST must have "document" as root type',
        severity: 'critical'
      });
    }
    
    // Additional validation checks can be added here
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: [] // Could add semantic warnings here
    };
  }

  // Plugin management
  registerPlugin(plugin: PluginHooks): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin with name '${plugin.name}' already registered`);
    }
    
    // Validate plugin permissions against engine policy
    this.validatePluginPermissions(plugin.permissions);
    
    this.plugins.set(plugin.name, plugin);
    
    if (this.config.debug) {
      console.log(`Registered plugin: ${plugin.name}`);
    }
  }

  getPlugin(name: string): PluginHooks | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  async initialize(): Promise<void> {
    // Initialize default profile if none registered
    if (this.profiles.size === 0) {
      this.registerProfile(this.getDefaultProfile());
    }

    // Initialize all registered plugins
    for (const plugin of this.plugins.values()) {
      try {
        await plugin.init?.({ engine: this } as PluginContext);
      } catch (error) {
        console.error(`Failed to initialize plugin ${plugin.name}:`, error);
        throw error;
      }
    }
    
    if (this.config.debug) {
      console.log('Engine initialized');
    }
  }

  async destroy(): Promise<void> {
    // Destroy all plugins in reverse order to respect dependencies
    const pluginsArray = Array.from(this.plugins.values());
    
    for (let i = pluginsArray.length - 1; i >= 0; i--) {
      try {
        await pluginsArray[i].destroy?.();
      } catch (error) {
        console.error(`Error destroying plugin ${pluginsArray[i].name}:`, error);
      }
    }
    
    // Clear plugin map
    this.plugins.clear();
    
    // Reset metrics
    this.resetPerformanceMetrics();
    
    if (this.config.debug) {
      console.log('Engine destroyed');
    }
  }

  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetPerformanceMetrics(): void {
    this.metrics = {
      totalOperations: 0,
      averageElapsedTimeMs: 0,
      peakMemoryUsageMB: 0,
      totalMemoryGCRuns: 0,
      pipelineStats: {},
    };
  }

  // Private helper methods
  private getDefaultConfig(): EngineConfig {
    return {
      debug: false,
      performance: {
        maxMemoryMB: 512,
        maxWorkers: 4,
        operationTimeoutMS: 30000,
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.'],
        allowNetwork: false,
      },
      plugins: {
        allowUnsigned: false,
        autoUpdate: false,
        maxExecutionTimeMS: 10000,
      }
    };
  }

  private getDefaultProfile(): TransformationProfile {
    return {
      id: 'default',
      name: 'Default Profile',
      description: 'Default transformation profile for general document conversion',
      parse: {
        enablePlugins: true,
        features: {
          mathML: true,
          tables: true,
          images: true,
          annotations: false,
        },
        performance: {
          chunkSize: 10 * 1024 * 1024, // 10MB
          maxFileSizeMB: 50,
        },
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize', 'enhance-structure', 'preserve-semantics'],
      },
      render: {
        outputFormat: 'html',
        theme: 'default',
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first',
      },
    };
  }

  private getDefaultPipelineMetrics(): PipelineMetrics {
    return {
      parseTimeMs: 0,
      transformTimeMs: 0,
      renderTimeMs: 0,
      successCount: 0,
      errorCount: 0,
      averageThroughputMBps: 0,
    };
  }

  private adjustAverageTime(addition: number, count: number): void {
    // Simple incremental average calculation
    this.metrics.averageElapsedTimeMs = (
      (this.metrics.averageElapsedTimeMs * (count - 1) + addition) / count
    );
  }

  private calculateThroughput(input: File | string, timeMs: number): number {
    let sizeMB = 0;
    
    if (input instanceof File) {
      sizeMB = input.size / (1024 * 1024);
    } else {
      sizeMB = input.length / (1024 * 1024);
    }
    
    const timeSecs = timeMs / 1000;
    
    if (timeSecs === 0) {
      return 0;
    }
    
    return sizeMB / timeSecs;
  }

  private validatePluginPermissions(permissions: PluginPermissions): void {
    if (!this.config.security.allowNetwork && permissions.network) {
      throw new Error('Plugin requires network access but engine network is disabled');
    }

    // Add more permission validations as needed
  }
}

// Export singleton instance if needed elsewhere (but engine should generally be instantiated)
export let globalEngine: CoreEngine | null = null;

export function getGlobalEngine(): CoreEngine {
  if (!globalEngine) {
    globalEngine = new CoreEngine();
  }
  return globalEngine;
}