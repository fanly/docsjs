// Core exports
export { defineDocsWordElement, DocxWordElement } from "./core/DocsWordElement";

// Semantic analysis
export { collectSemanticStatsFromDocument, collectSemanticStatsFromHtml } from "./lib/semanticStats";
export { calculateFidelityScore } from "./lib/fidelityScore";

// Legacy API (backward compatible)  
export { parseDocxToHtmlSnapshot, parseDocxToHtmlSnapshotWithReport } from "./lib/docxHtml";
export { DocxPluginPipeline, getGlobalPipeline, createPipeline } from "./lib/pluginPipeline";
export type { DocxPluginPipelineConfig } from "./lib/pluginPipeline";
export type { SemanticStats } from "./lib/semanticStats";
export type { FidelityScore } from "./lib/fidelityScore"; 
export type { DocxParseFeatureCounts, DocxParseReport } from "./lib/docxHtml";

// Web Component types
export type {
  DocsWordEditorChangeDetail,
  DocsWordEditorElementApi,
  DocsWordEditorErrorDetail, 
  DocsWordEditorReadyDetail,
  CollaborationAdapter
} from "./core/types";

// ============================================================================
// NEW AST API (v1.0)  
// ============================================================================

// AST Types
export type {
  // Core
  ASTVersion,
  ASTMetadata,
  InputFormat,
  OutputFormat,
  
  // Document
  DocumentNode,
  DocumentProperties,
  PageSetup,
  PageSize,
  PageMargins,
  
  // Styles
  StyleDefinitions,
  ParagraphStyleDef,
  CharacterStyleDef, 
  TableStyleDef,
  ListStyleDef,
  ListLevelDef,
  
  // Sections
  SectionNode,
  SectionProperties,
  
  // Block nodes
  BlockNode,
  ParagraphNode,
  ParagraphSemantics,
  ParagraphIndent,
  ParagraphSpacing,
  HeadingNode, 
  HeadingNumbering,
  ListNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  FigureNode,
  FigcaptionNode,
  CodeBlockNode,
  BlockquoteNode,
  DividerNode,
  CustomBlockNode,
  
  // Inline nodes
  InlineNode,
  TextNode,
  TextMark,
  TextMarkType,
  HardBreakNode,
  SoftBreakNode,
  HyperlinkNode,
  ImageNode,
  ImageDimensions,
  ImagePositioning,
  MathNode,
  FootnoteRefNode, 
  EndnoteRefNode,
  CommentRefNode,
  BookmarkNode,
  // ... additional types as needed
} from "./ast/types";

// ============================================================================
// CORE ENGINE v2 (Platform Architecture) 
// ============================================================================

// Core Engine
export { CoreEngine } from "./engine/core";
export type { 
  CoreConfig, 
  EngineConfig, 
  PerformanceMetrics,
  TransformResult,
  PipelineReport,
  ExportResult,
  DiagnosticEntry,
  ProcessingStats
} from "./engine/core";

// Pipeline System
export { PipelineManager } from "./pipeline/manager";
export type { 
  PipelineContext,
  PipelineState,
  PipelinePhase,
  PipelineHook,
  PipelineResult
} from "./pipeline/types";

// Plugin System v2 (Enhanced with Security Model)
export { PluginManagerImpl as PluginManager } from "./plugins-v2/manager";
export type { 
  DocxPlugin,
  PluginContext, 
  PluginPhase,
  PluginHook,
  PluginPermissions,
  ASTAwarePlugin,
  PluginPriority,
  TextMarkPlugin,
  ParagraphPlugin, 
  RunPlugin,
  TablePlugin
} from "./plugins-v2/types";

// Profile System (Configurable Processing)
export { ProfileManager, SYSTEM_PROFILES } from "./profiles/profile-manager";
export type { 
  Profile,
  ProfileDefinition,
  ProcessingProfile,
  AuxiliaryContent,
  FootnoteNode,
  EndnoteNode, 
  CommentNode,
  ProfileMetadata,
  ParseConfig,
  TransformConfig,
  RenderConfig,
  SecurityConfig
} from "./profiles/profile-manager";

// AST Utilities (v2)
export { 
  // Enhanced ID generation
  generateId,
  resetIdCounter, 
  generateDeterministicId,
  
  // Serialization improvements
  serializeAST,
  deserializeAST,
  calculateChecksum,
  
  // Enhanced node creation
  createMetadata,
  createEmptyDocument,
  createTextNode,
  createParagraphNode,
  createHeadingNode,
  createListNode,
  createListItemNode,
  createTableNode,
  createTableRowNode,
  createTableCellNode,
  createImageNode,
  createHyperlinkNode,
  createSectionNode,
  
  // Traversal
  walkAST,
  findNodeById,
  findNodesByType,
  
  // Cloning
  cloneAST,
  cloneASTWithNewIds,
  
  // Validation
  validateAST,
  
  // Mark handling
  hasMark,
  addMark,
  removeMark,
  
  // Content extraction
  extractText,
  extractImageSources,
  extractHyperlinks,
  
  // Auxiliary content helpers
  createAuxiliaryContent,
  addFootnote,
  addEndnote,
  addComment, 
  addRevision,
} from "./ast/utils";

// Parser & Renderer Architecture
export { 
  // New entry points (for platform)
  parseDocxToAST,
  renderASTToHTML
} from "./parsers/docx/parser";

export type {
  ParseResult,
  TransformResult, 
  RenderResult,
  ExportResult,
  ParseReport
} from "./parsers/docx/parser";

// Legacy compatibility
export {
  parseDocxToHtmlSnapshot as legacyParseDocxToHtml,
  parseDocxToHtmlSnapshotWithReport as legacyParseDocxToReport  
} from "./lib/docxHtml";
