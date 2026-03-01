/**
 * Engine Core Type Definitions
 * 
 * Defines the core interfaces and types for the new document transformation engine.
 */

import type { DocumentAST } from '../ast/types';
import type { ExportResult, PipelineContext } from '../pipeline/types';
import type { PluginHooks, PluginPermissions } from '../plugins-v2/types';

// Engine Configuration
export interface EngineConfig {
  /** Enable debug logging */
  debug?: boolean;
  
  /** Performance and resource limits */
  performance: {
    /** Maximum memory allowed (MB) */
    maxMemoryMB: number;
    
    /** Thread pool size for workers */
    maxWorkers: number;
    
    /** Timeout for individual operations */
    operationTimeoutMS: number;
  };
  
  /** Security settings */
  security: {
    /** Enable plugin sandboxing */
    enableSandboxes: boolean;
    
    /** Allowed file path patterns for readFile operations */
    allowedReadPaths: string[];
    
    /** Allow network access */
    allowNetwork: boolean;
  };
  
  /** Plugin settings */
  plugins: {
    /** Allow unsigned plugins */
    allowUnsigned: boolean;
    
    /** Plugin auto-update settings */
    autoUpdate: boolean;
    
    /** Maximum plugin execution time (ms) */
    maxExecutionTimeMS: number;
  };
}

// Transformation Profile
export interface TransformationProfile {
  id: string;
  name: string;
  description: string;
  
  // Parse settings
  parse: {
    enablePlugins: boolean;
    features: {
      mathML: boolean;
      tables: boolean;
      images: boolean;
      annotations: boolean;
    };
    performance: {
      chunkSize: number;
      maxFileSizeMB: number;
    };
  };
  
  // Transform settings
  transform: {
    enablePlugins: boolean;
    operations: string[]; // List of transformation operations
  };
  
  // Render settings
  render: {
    outputFormat: 'html' | 'markdown' | 'json' | 'editor';
    theme: string;
    options?: Record<string, unknown>;
  };
  
  // Security settings for this profile
  security: {
    allowedDomains: string[];
    sanitizerProfile: 'fidelity-first' | 'strict' | 'none';
  };
}

// Engine Interface
export interface EngineInterface {
  // Configuration
  configure(config: Partial<EngineConfig>): void;
  getConfig(): EngineConfig;
  
  // Profile management
  registerProfile(profile: TransformationProfile): void;
  getProfile(id: string): TransformationProfile | undefined;
  listProfiles(): string[];
  applyProfile(id: string): void;
  
  // Document transformation
  transformDocument(input: File | string, profileId?: string): Promise<ExportResult>;
  validateAST(ast: DocumentAST): ValidationResult;
  
  // Plugin management
  registerPlugin(plugin: PluginHooks): void;
  getPlugin(name: string): PluginHooks | undefined;
  listPlugins(): string[];
  
  // Lifecycle management
  initialize(): Promise<void>;
  destroy(): Promise<void>;
  
  // Performance monitoring
  getPerformanceMetrics(): PerformanceMetrics;
  resetPerformanceMetrics(): void;
}

// Validation and diagnostics
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  location?: number | string;
  severity: 'critical' | 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// Performance metrics
export interface PerformanceMetrics {
  totalOperations: number;
  averageElapsedTimeMs: number;
  peakMemoryUsageMB: number;
  totalMemoryGCRuns: number;
  pipelineStats: Record<string, PipelineMetrics>;
}

export interface PipelineMetrics {
  parseTimeMs: number;
  transformTimeMs: number;
  renderTimeMs: number;
  successCount: number;
  errorCount: number;
  averageThroughputMBps: number;
}