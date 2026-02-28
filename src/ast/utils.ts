/**
 * AST Utility Functions
 * 
 * Provides utilities for:
 * - Node ID generation
 * - Serialization / Deserialization
 * - Node traversal
 * - Node creation helpers
 * - Deep cloning
 */

import type {
  DocumentNode,
  ASTNode,
  SectionNode,
  BlockNode,
  InlineNode,
  TextNode,
  ParagraphNode,
  HeadingNode,
  ListNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  ImageNode,
  HyperlinkNode,
  ASTMetadata,
  InputFormat,
  TextMark,
  ParagraphSemantics,
  ImageDimensions,
  ImagePositioning,
  AuxiliaryContent,
  FootnoteNode,
  EndnoteNode,
  CommentNode,
  RevisionNode,
  ParentNode,
} from "./types";

import { AST_VERSION } from "./types";

// ============================================================================
// ID GENERATION
// ============================================================================

let idCounter = 0;
const ID_PREFIX = "docsjs_";

/**
 * Generate a unique node ID
 */
export function generateId(prefix = "node"): string {
  idCounter += 1;
  return `${ID_PREFIX}${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}

/**
 * Reset ID counter (for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Generate a deterministic ID from content hash
 */
export function generateDeterministicId(content: string, prefix = "node"): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `${ID_PREFIX}${prefix}_${Math.abs(hash).toString(36)}`;
}

// ============================================================================
// SERIALIZATION
// ============================================================================

/**
 * Serialize AST to JSON string
 */
export function serializeAST(ast: DocumentNode): string {
  return JSON.stringify(ast, replacer, 0);
}

/**
 * Deserialize JSON string to AST
 */
export function deserializeAST(json: string): DocumentNode {
  return JSON.parse(json, reviver) as DocumentNode;
}

/**
 * JSON replacer function - handles Map objects
 */
function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Map) {
    return {
      __type: "Map",
      data: Array.from(value.entries()),
    };
  }
  return value;
}

/**
 * JSON reviver function - restores Map objects
 */
function reviver(_key: string, value: unknown): unknown {
  if (typeof value === "object" && value !== null && "__type" in value) {
    if ((value as { __type: string }).__type === "Map") {
      return new Map((value as { data: [unknown, unknown][] }).data);
    }
  }
  return value;
}

/**
 * Calculate content hash for checksum
 */
export function calculateChecksum(ast: DocumentNode): string {
  const content = JSON.stringify(ast, (_key, value) => {
    // Exclude metadata fields from checksum
    if (typeof value === "object" && value !== null) {
      const { id, metadata, ...rest } = value as Record<string, unknown>;
      return rest;
    }
    return value;
  });
  
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

// ============================================================================
// NODE CREATION HELPERS
// ============================================================================

/**
 * Create document metadata
 */
export function createMetadata(sourceFormat: InputFormat): ASTMetadata {
  return {
    version: AST_VERSION,
    createdAt: Date.now(),
    sourceFormat,
    generator: `@coding01/docsjs`,
  };
}

/**
 * Create an empty document
 */
export function createEmptyDocument(sourceFormat: InputFormat = "unknown"): DocumentNode {
  return {
    type: "document",
    id: generateId("doc"),
    metadata: createMetadata(sourceFormat),
    children: [],
  };
}

/**
 * Create a text node
 */
export function createTextNode(text: string, marks?: TextMark[]): TextNode {
  return {
    type: "text",
    id: generateId("txt"),
    text,
    marks,
  };
}

/**
 * Create a paragraph node
 */
export function createParagraphNode(
  children: InlineNode[] = [],
  semantics?: ParagraphSemantics,
  styleId?: string
): ParagraphNode {
  return {
    type: "paragraph",
    id: generateId("p"),
    children,
    semantics,
    styleId,
  };
}

/**
 * Create a heading node
 */
export function createHeadingNode(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  children: InlineNode[] = [],
  styleId?: string
): HeadingNode {
  return {
    type: "heading",
    id: generateId("h"),
    level,
    children,
    styleId,
  };
}

/**
 * Create a list node
 */
export function createListNode(
  listType: "ordered" | "unordered" | "description",
  items: ListItemNode[] = []
): ListNode {
  return {
    type: "list",
    id: generateId("list"),
    listType,
    items,
  };
}

/**
 * Create a list item node
 */
export function createListItemNode(
  children: BlockNode[] = [],
  level = 0,
  marker?: string,
  number?: number
): ListItemNode {
  return {
    type: "listItem",
    id: generateId("li"),
    children,
    level,
    marker,
    number,
  };
}

/**
 * Create a table node
 */
export function createTableNode(rows: TableRowNode[] = []): TableNode {
  return {
    type: "table",
    id: generateId("tbl"),
    rows,
  };
}

/**
 * Create a table row node
 */
export function createTableRowNode(cells: TableCellNode[] = [], isHeader = false): TableRowNode {
  return {
    type: "tableRow",
    id: generateId("tr"),
    cells,
    isHeader,
  };
}

/**
 * Create a table cell node
 */
export function createTableCellNode(
  children: BlockNode[] = [],
  options?: {
    colspan?: number;
    rowspan?: number;
    isHeader?: boolean;
    valign?: "top" | "middle" | "bottom";
    width?: number;
  }
): TableCellNode {
  return {
    type: "tableCell",
    id: generateId("tc"),
    children,
    ...options,
  };
}

/**
 * Create an image node
 */
export function createImageNode(
  src: string,
  options?: {
    alt?: string;
    title?: string;
    dimensions?: ImageDimensions;
    positioning?: ImagePositioning;
  }
): ImageNode {
  return {
    type: "image",
    id: generateId("img"),
    src,
    ...options,
  };
}

/**
 * Create a hyperlink node
 */
export function createHyperlinkNode(
  href: string,
  children: InlineNode[] = [],
  options?: {
    title?: string;
    target?: "_blank" | "_self";
    anchor?: string;
  }
): HyperlinkNode {
  return {
    type: "hyperlink",
    id: generateId("a"),
    href,
    children,
    ...options,
  };
}

/**
 * Create a section node
 */
export function createSectionNode(children: BlockNode[] = []): SectionNode {
  return {
    type: "section",
    id: generateId("sec"),
    children,
  };
}

// ============================================================================
// NODE TRAVERSAL
// ============================================================================

/**
 * Visit all nodes in the AST
 */
export function walkAST(
  node: ASTNode,
  visitor: (node: ASTNode, parent: ASTNode | null, path: string[]) => void | boolean,
  parent: ASTNode | null = null,
  path: string[] = []
): void {
  const result = visitor(node, parent, path);
  if (result === false) return;

  const children = getNodeChildren(node);
  if (children) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      walkAST(child, visitor, node, [...path, getChildrenKey(node) ?? "", String(i)]);
    }
  }
}

/**
 * Find a node by ID
 */
export function findNodeById(ast: DocumentNode, id: string): ASTNode | null {
  let found: ASTNode | null = null;
  walkAST(ast, (node) => {
    if ("id" in node && node.id === id) {
      found = node;
      return false;
    }
  });
  return found;
}

/**
 * Find all nodes of a specific type
 */
export function findNodesByType<T extends ASTNode>(
  ast: DocumentNode,
  type: T["type"]
): T[] {
  const nodes: T[] = [];
  walkAST(ast, (node) => {
    if (node.type === type) {
      nodes.push(node as T);
    }
  });
  return nodes;
}

/**
 * Get the children array of a parent node
 */
function getNodeChildren(node: ASTNode): ASTNode[] | null {
  if ("children" in node && Array.isArray((node as ParentNode).children)) {
    return (node as ParentNode).children;
  }
  if (node.type === "document") {
    return (node as DocumentNode).children;
  }
  if (node.type === "section") {
    return (node as SectionNode).children;
  }
  if (node.type === "list") {
    return (node as ListNode).items;
  }
  if (node.type === "listItem") {
    return (node as ListItemNode).children;
  }
  if (node.type === "table") {
    return (node as TableNode).rows;
  }
  if (node.type === "tableRow") {
    return (node as TableRowNode).cells;
  }
  if (node.type === "tableCell") {
    return (node as TableCellNode).children;
  }
  if (node.type === "hyperlink") {
    return (node as HyperlinkNode).children;
  }
  return null;
}

/**
 * Get the key name for children property
 */
function getChildrenKey(node: ASTNode): string | null {
  if (node.type === "list") return "items";
  if (node.type === "table") return "rows";
  if (node.type === "tableRow") return "cells";
  return "children";
}

// ============================================================================
// DEEP CLONE
// ============================================================================

/**
 * Deep clone an AST node
 */
export function cloneAST<T extends ASTNode>(node: T): T {
  return JSON.parse(JSON.stringify(node, replacer, 0), reviver) as T;
}

/**
 * Deep clone with new IDs
 */
export function cloneASTWithNewIds<T extends ASTNode>(node: T): T {
  const cloned = cloneAST(node);
  assignNewIds(cloned);
  return cloned;
}

/**
 * Assign new IDs to all nodes
 */
function assignNewIds(node: ASTNode): void {
  walkAST(node, (n) => {
    if ("id" in n && typeof n.id === "string") {
      (n as { id: string }).id = generateId(n.type);
    }
  });
}

// ============================================================================
// NODE VALIDATION
// ============================================================================

/**
 * Validate AST structure
 */
export function validateAST(node: ASTNode): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  walkAST(node, (n) => {
    // Check required fields
    if (!("type" in n)) {
      errors.push(`Node missing 'type' field: ${JSON.stringify(n)}`);
    }
    if (!("id" in n)) {
      errors.push(`Node missing 'id' field: ${JSON.stringify(n)}`);
    }
    
    // Type-specific validation
    if (n.type === "heading") {
      const heading = n as HeadingNode;
      if (heading.level < 1 || heading.level > 6) {
        errors.push(`Invalid heading level: ${heading.level}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// TEXT MARK UTILITIES
// ============================================================================

/**
 * Check if text has a specific mark
 */
export function hasMark(node: TextNode, markType: TextMark["type"]): boolean {
  return node.marks?.some((m) => m.type === markType) ?? false;
}

/**
 * Add a mark to text node
 */
export function addMark(node: TextNode, mark: TextMark): TextNode {
  const marks = node.marks ?? [];
  if (!marks.some((m) => m.type === mark.type)) {
    return { ...node, marks: [...marks, mark] };
  }
  return node;
}

/**
 * Remove a mark from text node
 */
export function removeMark(node: TextNode, markType: TextMark["type"]): TextNode {
  if (!node.marks) return node;
  const marks = node.marks.filter((m) => m.type !== markType);
  if (marks.length === 0) {
    const { marks: _, ...rest } = node;
    return rest as TextNode;
  }
  return { ...node, marks };
}

// ============================================================================
// CONTENT EXTRACTION
// ============================================================================

/**
 * Extract plain text from AST
 */
export function extractText(node: ASTNode): string {
  const texts: string[] = [];
  
  walkAST(node, (n) => {
    if (n.type === "text") {
      texts.push((n as TextNode).text);
    }
  });
  
  return texts.join("");
}

/**
 * Extract all image sources
 */
export function extractImageSources(node: ASTNode): string[] {
  const sources: string[] = [];
  
  walkAST(node, (n) => {
    if (n.type === "image") {
      sources.push((n as ImageNode).src);
    }
  });
  
  return sources;
}

/**
 * Extract all hyperlinks
 */
export function extractHyperlinks(node: ASTNode): Array<{ href: string; text: string }> {
  const links: Array<{ href: string; text: string }> = [];
  
  walkAST(node, (n) => {
    if (n.type === "hyperlink") {
      const link = n as HyperlinkNode;
      links.push({
        href: link.href,
        text: extractText(n),
      });
    }
  });
  
  return links;
}

// ============================================================================
// AUXILIARY CONTENT HELPERS
// ============================================================================

/**
 * Create auxiliary content container
 */
export function createAuxiliaryContent(): AuxiliaryContent {
  return {
    footnotes: new Map(),
    endnotes: new Map(),
    comments: new Map(),
    revisions: [],
    headers: new Map(),
    footers: new Map(),
  };
}

/**
 * Add footnote to document
 */
export function addFootnote(
  auxiliary: AuxiliaryContent,
  id: string,
  children: BlockNode[],
  number?: number
): FootnoteNode {
  const footnote: FootnoteNode = {
    type: "footnote",
    id,
    number: number ?? (auxiliary.footnotes?.size ?? 0) + 1,
    children,
  };
  
  if (!auxiliary.footnotes) {
    auxiliary.footnotes = new Map();
  }
  auxiliary.footnotes.set(id, footnote);
  
  return footnote;
}

/**
 * Add endnote to document
 */
export function addEndnote(
  auxiliary: AuxiliaryContent,
  id: string,
  children: BlockNode[],
  number?: number
): EndnoteNode {
  const endnote: EndnoteNode = {
    type: "endnote",
    id,
    number: number ?? (auxiliary.endnotes?.size ?? 0) + 1,
    children,
  };
  
  if (!auxiliary.endnotes) {
    auxiliary.endnotes = new Map();
  }
  auxiliary.endnotes.set(id, endnote);
  
  return endnote;
}

/**
 * Add comment to document
 */
export function addComment(
  auxiliary: AuxiliaryContent,
  id: string,
  children: BlockNode[],
  options?: { author?: string; date?: string }
): CommentNode {
  const comment: CommentNode = {
    type: "comment",
    id,
    author: options?.author,
    date: options?.date,
    children,
  };
  
  if (!auxiliary.comments) {
    auxiliary.comments = new Map();
  }
  auxiliary.comments.set(id, comment);
  
  return comment;
}

/**
 * Add revision to document
 */
export function addRevision(
  auxiliary: AuxiliaryContent,
  revisionType: "insert" | "delete",
  content: InlineNode[],
  options?: { author?: string; date?: string }
): RevisionNode {
  if (!auxiliary.revisions) {
    auxiliary.revisions = [];
  }
  
  const revision: RevisionNode = {
    type: "revision",
    id: generateId("rev"),
    revisionType,
    author: options?.author,
    date: options?.date,
    content,
  };
  
  auxiliary.revisions.push(revision);
  
  return revision;
}
