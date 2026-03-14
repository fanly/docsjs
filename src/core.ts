/**
 * DocsJS Core - Minimal Entry Point
 *
 * Only includes core parsing and rendering functionality.
 * Excludes: CMS adapters, Enterprise, Cloud, Collaboration features.
 *
 * This enables tree-shaking for smaller bundle sizes.
 */

// Core parsing
export { parseDocxToHtmlSnapshot, parseDocxToHtmlSnapshotWithReport } from "./lib/docxHtml";
export { parseDocxToAST } from "./parsers/docx/parser";

// AST types
export type {
  DocumentNode,
  SectionNode,
  BlockNode,
  InlineNode,
  ParagraphNode,
  HeadingNode,
  ListNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  TextNode,
  TextMark,
  HyperlinkNode,
  ImageNode,
  MathNode,
  FootnoteNode,
  EndnoteNode,
  CommentNode,
  BookmarkNode,
  HeaderFooterNode,
  RevisionNode,
  AuxiliaryContent,
  ImageDimensions,
  ImagePositioning,
  PageSetup,
  ParagraphSemantics,
} from "./ast/types";

// AST utilities
export {
  generateId,
  serializeAST,
  deserializeAST,
  cloneAST,
  walkAST,
  extractText,
} from "./ast/utils";

// Engine
export { CoreEngine, getGlobalEngine, globalEngine } from "./engine/core";

// Profiles
export { ProfileManager, SYSTEM_PROFILES } from "./profiles/profile-manager";

// Plugin system
export { DocxPluginPipeline, getGlobalPipeline, createPipeline } from "./lib/pluginPipeline";
export type { PluginContext, DocxPlugin } from "./plugins";

// Web Component
export { defineDocsWordElement, DocsWordElement } from "./core/DocsWordElement";
export type { DocsWordEditorChangeDetail, DocsWordEditorElementApi } from "./core/types";

// Utilities
export {
  collectSemanticStatsFromDocument,
  collectSemanticStatsFromHtml,
} from "./lib/semanticStats";
export { calculateFidelityScore } from "./lib/fidelityScore";
