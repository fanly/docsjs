/**
 * DocumentAST Module
 * 
 * Unified document semantic intermediate representation.
 * 
 * @example
 * ```typescript
 * import { 
 *   createEmptyDocument, 
 *   createParagraphNode, 
 *   createTextNode,
 *   serializeAST,
 *   deserializeAST
 * } from "@coding01/docsjs/ast";
 * 
 * // Create a document
 * const doc = createEmptyDocument("docx");
 * doc.children.push(
 *   createSectionNode([
 *     createParagraphNode([
 *       createTextNode("Hello, World!")
 *     ])
 *   ])
 * );
 * 
 * // Serialize
 * const json = serializeAST(doc);
 * 
 * // Deserialize
 * const restored = deserializeAST(json);
 * ```
 */

// Types
export * from "./types";

// Utilities
export {
  // ID generation
  generateId,
  resetIdCounter,
  generateDeterministicId,
  
  // Serialization
  serializeAST,
  deserializeAST,
  calculateChecksum,
  
  // Node creation
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
  
  // Marks
  hasMark,
  addMark,
  removeMark,
  
  // Extraction
  extractText,
  extractImageSources,
  extractHyperlinks,
  
  // Auxiliary
  createAuxiliaryContent,
  addFootnote,
  addEndnote,
  addComment,
  addRevision,
} from "./utils";


// Plugin Adapter
export {
  htmlToASTNodes,
  PluginASTAdapter,
} from "./pluginAdapter";
export type {
  LegacyPluginOutput,
  ASTPluginOutput,
  HybridPluginOutput,
  ASTAwarePlugin,
  ParagraphASTResult,
} from "./pluginAdapter";