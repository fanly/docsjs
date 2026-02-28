/**
 * Enhanced Entry Point for DocsJS Core Engine v2
 * 
 * Exports the new engine with improved architecture.
 */

// Main Engine Classes
export { CoreEngine, getGlobalEngine } from './engine/core';
export type { EngineInterface, EngineConfig, TransformationProfile } from './types/engine';

// Pipeline Components  
export { PipelineManager } from './pipeline/manager';
export type { 
  PipelineContext, 
  PipelineState, 
  ExportResult, 
  PipelinePhase,
  PipelineHooks,
  PipelineMetrics
} from './pipeline/types';

// Plugin System
export { PluginManagerImpl as PluginManager } from './plugins-v2/manager';
export type { 
  EnginePlugin, 
  PluginHooks, 
  PluginContext, 
  PluginPermissions,
  PluginHook,
  ParsePlugin,
  TransformPlugin, 
  RenderPlugin,
  SanitizePlugin
} from './plugins-v2/types';

// Profile Management
export { ProfileManager, SYSTEM_PROFILES } from './profiles/profile-manager';
export type { ProfileManagerOptions } from './profiles/profile-manager';

// AST Components
export type { 
  DocumentAST,
  DocumentNode,
  SectionNode,
  BlockNode, 
  InlineNode,
  ParagraphNode,
  HeadingNode,
  ListNode,
  TableNode,
  // ... include all AST types as needed
} from './ast/types';

// Parsers
export { DOCXParser } from './parsers/docx/parser';
export type { 
  DocxParseOptions, 
  DocxParseResult, 
  DocxParseReport,
  DocxFeatureCounts
} from './parsers';

// Renderers  
export { HTMLRenderer } from './renderers/html/renderer';
export type { 
  HtmlRenderOptions, 
  HtmlRenderResult,
  RenderContext
} from './renderers';

// Core Utilities
export { 
  // AST utilities
  generateId,
  htmlToASTNodes,
  serializeAST,
  deserializeAST,
  walkAST,
  findNodeById,
  cloneAST,
  validateAST,
  // ... other utilities
} from './ast/utils';

// Plugin Adapters
export { PluginAdapter } from './ast/pluginAdapter';