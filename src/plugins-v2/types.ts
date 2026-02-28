/**
 * Enhanced Plugin System Types
 * 
 * Defines the new plugin interfaces for the v2 engine with lifecycle hooks.
 */

import type { CoreEngine } from '../engine/core';
import type { PipelineContext } from '../pipeline/types';

// Context passed to plugins
export interface PluginContext {
  engine: CoreEngine;
  pipeline: PipelineContext;
  config: Record<string, unknown>;
}

// Permission system for plugins
export interface PluginPermissions {
  /** File system permissions (read) */
  read: string[];  // Allow read from these paths/directory patterns
  
  /** File system permissions (write) */ 
  write: string[]; // Allow write to these paths/directory patterns
  
  /** Network permissions */
  network: boolean; // Allow network requests?
  
  /** Computation limits */
  compute: {
    /** Maximum threads plugin can use */
    maxThreads: number;
    
    /** Maximum memory allocation (MB) */
    maxMemoryMB: number;
    
    /** Maximum CPU time allowed */
    maxCpuSecs: number;
  };
  
  /** AST access limitations */
  ast: {
    /** Allow plugin to modify AST semantics? */
    canModifySemantics: boolean;
    
    /** Allow plugin to access full AST structure? */
    canAccessOriginal: boolean;
    
    /** Allow plugin to export raw AST data? */
    canExportRawAst: boolean;
  };
  
  /** Export permissions */
  export: {
    /** Allow plugin to generate/modify exported file(s)? */
    canGenerateFiles: boolean;
    
    /** Allow plugin to upload files? */
    canUpload: boolean;
  };
  
  /** Additional security permissions */
  misc: {
    /** Allow plugins to execute arbitrary code? */
    allowUnsafeCode: boolean;
  };
}

// Common plugin interface
export interface EnginePlugin {
  // Basic identification
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly author: string;
  
  // Capabilities
  readonly availableHooks: PluginHook[];
  readonly supportedFormats: string[];
  readonly permissions: PluginPermissions;
  readonly dependencies: string[]; // Plugin dependencies by name
  readonly priority: PluginPriority;
  
  // Initialization and destruction
  init?(context: PluginContext): void | Promise<void>;
  destroy?(): void | Promise<void>;
  
  // Lifecycle hook implementations (only called if subscribed to that hook)
  beforeParse?(context: PluginContext): PipelineContext | Promise<PipelineContext>;
  afterParse?(context: PluginContext): PipelineContext | Promise<PipelineContext>;
  beforeTransform?(context: PluginContext): PipelineContext | Promise<PipelineContext>; 
  afterTransform?(context: PluginContext): PipelineContext | Promise<PipelineContext>;
  beforeRender?(context: PluginContext): PipelineContext | Promise<PipelineContext>;
  afterRender?(context: PluginContext): PipelineContext | Promise<PipelineContext>;
  beforeExport?(context: PluginContext): PipelineContext | Promise<PipelineContext>;
  afterExport?(context: PluginContext): PipelineContext | Promise<PipelineContext>;
}

// Specific plugin type interfaces for type safety
export interface ParsePlugin extends EnginePlugin {
  readonly availableHooks: (Extract<PluginHook, 'beforeParse' | 'afterParse'>)[];
  parseHook(context: PluginContext, input: File | string): ParseResult | Promise<ParseResult>;
}

export interface TransformPlugin extends EnginePlugin {
  readonly availableHooks: (Extract<PluginHook, 'beforeTransform' | 'afterTransform'>)[];
  transformHook(context: PluginContext, ast: DocumentAST): DocumentAST | Promise<DocumentAST>;
}

export interface RenderPlugin extends EnginePlugin {
  readonly availableHooks: (Extract<PluginHook, 'beforeRender' | 'afterRender'>)[];
  renderHook(context: PluginContext, content: string, format: string): string | Promise<string>;
}

export interface SanitizePlugin extends EnginePlugin {
  readonly availableHooks: (Extract<PluginHook, 'beforeRender' | 'afterRender' | 'beforeExport' | 'afterExport'>)[];
  sanitizeHook(content: string, context: PluginContext): string | Promise<string>;
}

// Helper types
export type PluginHook = 
  | 'beforeParse'
  | 'afterParse' 
  | 'beforeTransform'
  | 'afterTransform'
  | 'beforeRender'
  | 'afterRender'
  | 'beforeExport'
  | 'afterExport';

export type PluginPriority = 'lowest' | 'low' | 'normal' | 'high' | 'highest';

export type HookResult = PipelineContext | DocumentAST | string | void;


// Parse-specific result
export interface ParseResult {
  ast?: DocumentAST;
  modifiedContext?: PipelineContext;
  errors?: string[];
  warnings?: string[];
}

// Plugin registration metadata
export interface PluginRegistrationOptions {
  // Whether to override if plugin already exists
  overrideExisting?: boolean;
  
  // Additional configuration for this plugin instance  
  config?: Record<string, unknown>;
  
  // Validation callback for plugin
  validate?: (plugin: EnginePlugin) => boolean;
}

// Plugin manager interface
export interface PluginManager {
  // Registration
  register(plugin: EnginePlugin, options?: PluginRegistrationOptions): void;
  unregister(name: string): boolean;
  
  // Plugin retrieval
  get(name: string): EnginePlugin | undefined;
  list(): string[];
  listForHook(hook: PluginHook): EnginePlugin[];
  
  // Lifecycle execution
  runForHook(hook: PluginHook, context: PluginContext): Promise<PluginContext>;
  validatePlugin(plugin: EnginePlugin): boolean;
  
  // Dependency resolution
  resolveDependencies(plugin: EnginePlugin): EnginePlugin[];
}

// Enhanced plugin interface for lifecycle hooks
export type PluginHooks = EnginePlugin;

// Helper types for specific use cases
export type DocumentConversionPlugin = ParsePlugin & TransformPlugin;
export type OutputFormatPlugin = TransformPlugin & RenderPlugin;
export type ContentEnrichmentPlugin = TransformPlugin;