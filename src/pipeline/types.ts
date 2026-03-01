/**
 * Pipeline Type Definitions
 * 
 * Defines the types for the enhanced document transformation pipeline system.
 */

import type { EngineConfig, TransformationProfile } from '../types/engine';
import type { EngineConfig, TransformationProfile } from '../types/engine';

// Pipeline context
export interface PipelineContext {
  // Engine references
  engine: unknown;
  profile: TransformationProfile;
  config: EngineConfig;
  
  // Input source
  input: File | string;
  
  // Transformation state
  state: PipelineState;
  
  // Hooks for plugins to inject logic
  hooks: PipelineHooks;
  
  // Metrics and performance
  metrics: PipelineMetrics;
  
  // Cancellation support
  abortSignal?: AbortSignal;
}

export interface PipelineState {
  // Current pipeline phase
  phase: PipelinePhase;
  
  // AST at current stage of transformation
  ast?: DocumentAST;
  
  // Raw input processed so far 
  processedInput?: string | ArrayBuffer;
  
  // Intermediate results
  intermediate: Record<string, any>;
  
  // Errors and warnings accumulated
  errors: PipelineError[];
  warnings: PipelineWarning[];
  
  // Plugin-specific context data
  pluginContexts: Record<string, any>;
}

export interface PipelineHooks {
  // Lifecycle hooks for plugins
  beforeParse: PipelineHook[];
  afterParse: PipelineHook[];
  beforeTransform: PipelineHook[];
  afterTransform: PipelineHook[];
  beforeRender: PipelineHook[];
  afterRender: PipelineHook[];
  beforeExport: PipelineHook[];
  afterExport: PipelineHook[];
}

export type PipelineHook = (context: PipelineContext) => void | Promise<void>;

export type PipelinePhase = 
  | 'initializing'
  | 'parsing' 
  | 'transforming'
  | 'rendering'
  | 'exporting'
  | 'complete'
  | 'failed';

export interface PipelineMetrics {
  totalTimeMs: number;
  currentPhase: PipelinePhase;
  phaseTimes: Record<PipelinePhase, number>;
  processedChars: number;
  processedBytes: number;
  pluginApplications: number;
}

export interface PipelineError {
  code: string;
  message: string;
  phase: PipelinePhase;
  timestamp: number;
  pluginName?: string;
  severity: 'critical' | 'error' | 'warning';
}

export interface PipelineWarning {
  code: string;
  message: string;
  phase: PipelinePhase;
  timestamp: number;
  pluginName?: string;
  suggestion?: string;
}

// Export result type
export interface ExportResult {
  output: string | Record<string, any>; // Final output (HTML, JSON, etc.)
  diagnostics: {
    errors: string[];
    warnings: string[];
    stats: Record<string, any>;
    metadata: {
      engineVersion: string;
      astVersion: string;
      pipelineProfile: string;
      transformTimeMs: number;
      inputSizeBytes: number;
      outputSizeBytes: number;
    };
  };
}

// Default context
export interface DefaultPipelineContext extends PipelineContext {}