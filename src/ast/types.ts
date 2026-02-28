/**
 * DocumentAST v1.0 - Unified Document Semantic Intermediate Representation
 * 
 * Design Principles:
 * 1. Pure semantic representation - no rendering-specific data
 * 2. Versioned - supports migration between versions
 * 3. Serializable - can be converted to/from JSON
 * 4. Extensible - supports custom node types via extension points
 * 5. Diffable - supports structural comparison
 */

// ============================================================================
// AST VERSION & METADATA
// ============================================================================

export const AST_VERSION = "1.0.0" as const;

export type ASTVersion = typeof AST_VERSION;

export interface ASTMetadata {
  /** AST schema version */
  version: ASTVersion;
  /** Creation timestamp (ms since epoch) */
  createdAt: number;
  /** Source format identifier */
  sourceFormat: InputFormat;
  /** Source format version (e.g., "DOCX-Office365", "GFM") */
  sourceVersion?: string;
  /** Generator identifier */
  generator: string;
  /** Content hash for integrity verification */
  checksum?: string;
}

export type InputFormat = 
  | "docx"
  | "html"
  | "markdown"
  | "gfm"
  | "json"
  | "clipboard"
  | "unknown";

export type OutputFormat =
  | "html"
  | "markdown"
  | "gfm"
  | "json"
  | "tiptap"
  | "slate"
  | "prosemirror";

// ============================================================================
// DOCUMENT ROOT
// ============================================================================

/**
 * Root document node - the top-level container for all content
 */
export interface DocumentNode {
  type: "document";
  id: string;
  metadata: ASTMetadata;
  
  /** Document-level properties */
  properties?: DocumentProperties;
  
  /** Global style definitions */
  styles?: StyleDefinitions;
  
  /** Content sections */
  children: SectionNode[];
  
  /** Referenced resources (images, fonts, etc.) */
  resources?: ResourceMap;
  
  /** Auxiliary content (footnotes, endnotes, comments) */
  auxiliary?: AuxiliaryContent;
}

// ============================================================================
// DOCUMENT PROPERTIES
// ============================================================================

export interface DocumentProperties {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  language?: string;
  createdTime?: number;
  modifiedTime?: number;
  
  /** Page setup (semantic-level, not rendering-level) */
  pageSetup?: PageSetup;
}

export interface PageSetup {
  size?: PageSize;
  margins?: PageMargins;
  columns?: number;
  columnSpacing?: number;
}

export interface PageSize {
  width: number;
  height: number;
  unit: "pt" | "in" | "cm" | "mm";
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
  header?: number;
  footer?: number;
  unit: "pt" | "in" | "cm" | "mm";
}

// ============================================================================
// STYLE DEFINITIONS
// ============================================================================

export interface StyleDefinitions {
  paragraph?: Map<string, ParagraphStyleDef>;
  character?: Map<string, CharacterStyleDef>;
  table?: Map<string, TableStyleDef>;
  list?: Map<string, ListStyleDef>;
}

export interface ParagraphStyleDef {
  id: string;
  name: string;
  basedOn?: string;
  
  // Paragraph formatting
  alignment?: "start" | "center" | "end" | "justify";
  indent?: ParagraphIndent;
  spacing?: ParagraphSpacing;
  
  // Outline level (for headings)
  outlineLevel?: number;
}

export interface CharacterStyleDef {
  id: string;
  name: string;
  basedOn?: string;
  
  // Character formatting hints (semantic)
  weight?: "normal" | "bold";
  style?: "normal" | "italic";
  decoration?: "none" | "underline" | "strikethrough";
  variant?: "normal" | "small-caps";
}

export interface TableStyleDef {
  id: string;
  name: string;
  basedOn?: string;
}

export interface ListStyleDef {
  id: string;
  name: string;
  type: "ordered" | "unordered" | "description";
  levels: ListLevelDef[];
}

export interface ListLevelDef {
  level: number;
  format: "decimal" | "lowerLetter" | "upperLetter" | "lowerRoman" | "upperRoman" | "bullet" | "custom";
  template?: string; // e.g., "%1.%2."
  startAt?: number;
  bulletChar?: string;
}

// ============================================================================
// SECTION NODE
// ============================================================================

export interface SectionNode {
  type: "section";
  id: string;
  
  /** Section-specific properties */
  properties?: SectionProperties;
  
  /** Block-level content */
  children: BlockNode[];
}

export interface SectionProperties {
  /** Section break type */
  breakType?: "continuous" | "nextPage" | "evenPage" | "oddPage";
  
  /** Section-specific page setup */
  pageSetup?: PageSetup;
  
  /** Header references */
  headerRef?: string;
  
  /** Footer references */
  footerRef?: string;
}

// ============================================================================
// BLOCK NODES
// ============================================================================

export type BlockNode =
  | ParagraphNode
  | HeadingNode
  | ListNode
  | TableNode
  | FigureNode
  | CodeBlockNode
  | BlockquoteNode
  | DividerNode
  | ThematicBreakNode
  | CustomBlockNode;

// ---- Paragraph ----

export interface ParagraphNode {
  type: "paragraph";
  id: string;
  children: InlineNode[];
  
  /** Semantic properties */
  semantics?: ParagraphSemantics;
  
  /** Style reference */
  styleId?: string;
}

export interface ParagraphSemantics {
  indent?: ParagraphIndent;
  alignment?: "start" | "center" | "end" | "justify";
  spacing?: ParagraphSpacing;
  lineSpacing?: number;
  
  /** Keep with next paragraph */
  keepWithNext?: boolean;
  
  /** Keep lines together */
  keepLinesTogether?: boolean;
  
  /** Widow/orphan control */
  widowControl?: boolean;
  
  /** Page break before */
  pageBreakBefore?: boolean;
}

export interface ParagraphIndent {
  left?: number;
  right?: number;
  firstLine?: number;
  hanging?: number;
  unit: "pt" | "in" | "cm" | "mm";
}

export interface ParagraphSpacing {
  before?: number;
  after?: number;
  unit: "pt" | "in" | "cm" | "mm";
}

// ---- Heading ----

export interface HeadingNode {
  type: "heading";
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: InlineNode[];
  
  /** Auto-numbering state */
  numbering?: HeadingNumbering;
  
  /** Style reference */
  styleId?: string;
}

export interface HeadingNumbering {
  enabled: boolean;
  level?: number;
  format?: string;
  text?: string; // e.g., "1.2.3"
}

// ---- List ----

export interface ListNode {
  type: "list";
  id: string;
  listType: "ordered" | "unordered" | "description";
  items: ListItemNode[];
  
  /** List style reference */
  styleId?: string;
  
  /** Numbering properties */
  numbering?: ListNumbering;
}

export interface ListItemNode {
  type: "listItem";
  id: string;
  children: BlockNode[];
  
  /** Item marker (for unordered lists) */
  marker?: string;
  
  /** Item number (for ordered lists) */
  number?: number;
  
  /** Nesting level (0-based) */
  level: number;
  
  /** For description lists */
  term?: InlineNode[];
}

export interface ListNumbering {
  startAt?: number;
  format?: "decimal" | "lowerLetter" | "upperLetter" | "lowerRoman" | "upperRoman";
  
  /** Multi-level template, e.g., ["%1", "%1.%2", "%1.%2.%3"] */
  levelTemplates?: string[];
  
  /** Continue numbering from previous list */
  continueFrom?: string;
}

// ---- Table ----

export interface TableNode {
  type: "table";
  id: string;
  rows: TableRowNode[];
  
  /** Table caption */
  caption?: string;
  
  /** Table summary (accessibility) */
  summary?: string;
  
  /** Style reference */
  styleId?: string;
  
  /** Column widths (semantic) */
  columnWidths?: number[];
}

export interface TableRowNode {
  type: "tableRow";
  id: string;
  cells: TableCellNode[];
  
  /** Row is a header row */
  isHeader?: boolean;
  
  /** Row height hint */
  height?: number;
}

export interface TableCellNode {
  type: "tableCell";
  id: string;
  children: BlockNode[];
  
  /** Column span */
  colspan?: number;
  
  /** Row span */
  rowspan?: number;
  
  /** Cell is a header cell */
  isHeader?: boolean;
  
  /** Vertical alignment */
  valign?: "top" | "middle" | "bottom";
  
  /** Cell width hint */
  width?: number;
}

// ---- Figure ----

export interface FigureNode {
  type: "figure";
  id: string;
  
  /** Figure content */
  content: ImageNode | VideoNode | AudioNode | CustomBlockNode;
  
  /** Caption */
  caption?: FigcaptionNode;
  
  /** Figure identifier for cross-references */
  identifier?: string;
}

export interface FigcaptionNode {
  type: "figcaption";
  id: string;
  children: InlineNode[];
}

// ---- Code Block ----

export interface CodeBlockNode {
  type: "codeBlock";
  id: string;
  code: string;
  language?: string;
  
  /** Line numbers to highlight */
  highlightLines?: number[];
  
  /** Show line numbers */
  showLineNumbers?: boolean;
  
  /** Starting line number */
  startLine?: number;
}

// ---- Blockquote ----

export interface BlockquoteNode {
  type: "blockquote";
  id: string;
  children: BlockNode[];
  
  /** Attribution/citation */
  attribution?: string;
}

// ---- Divider / Thematic Break ----

export interface DividerNode {
  type: "divider";
  id: string;
  
  /** Divider style hint */
  style?: "solid" | "dashed" | "dotted" | "double";
}

export interface ThematicBreakNode {
  type: "thematicBreak";
  id: string;
}

// ---- Custom Block (Extension Point) ----

export interface CustomBlockNode {
  type: "customBlock";
  id: string;
  /** Custom block type identifier */
  customType: string;
  /** Custom block data */
  data: Record<string, unknown>;
  /** Optional inline content */
  children?: InlineNode[];
}

// ============================================================================
// INLINE NODES
// ============================================================================

export type InlineNode =
  | TextNode
  | HardBreakNode
  | SoftBreakNode
  | HyperlinkNode
  | ImageNode
  | MathNode
  | FootnoteRefNode
  | EndnoteRefNode
  | CommentRefNode
  | BookmarkNode
  | EmbedNode
  | CustomInlineNode;

// ---- Text ----

export interface TextNode {
  type: "text";
  id: string;
  text: string;
  
  /** Text marks (semantic formatting) */
  marks?: TextMark[];
}

export interface TextMark {
  type: TextMarkType;
  attrs?: Record<string, unknown>;
}

export type TextMarkType =
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "code"
  | "subscript"
  | "superscript"
  | "highlight"
  | "smallCaps"
  | "hidden";

// ---- Break ----

export interface HardBreakNode {
  type: "hardBreak";
  id: string;
}

export interface SoftBreakNode {
  type: "softBreak";
  id: string;
}

// ---- Hyperlink ----

export interface HyperlinkNode {
  type: "hyperlink";
  id: string;
  children: InlineNode[];
  
  /** Link target URL */
  href: string;
  
  /** Link title */
  title?: string;
  
  /** Link target window */
  target?: "_blank" | "_self" | "_parent" | "_top";
  
  /** Internal anchor reference */
  anchor?: string;
}

// ---- Image ----

export interface ImageNode {
  type: "image";
  id: string;
  src: string;
  alt?: string;
  title?: string;
  
  /** Image dimensions (semantic) */
  dimensions?: ImageDimensions;
  
  /** Image positioning (for floating images) */
  positioning?: ImagePositioning;
  
  /** Crop rectangle */
  crop?: ImageCrop;
  
  /** Transform (rotation, flip) */
  transform?: ImageTransform;
}

export interface ImageDimensions {
  width?: number;
  height?: number;
  unit: "px" | "pt" | "%" | "em";
}

export interface ImagePositioning {
  type: "inline" | "floating";
  
  /** Floating anchor position */
  anchor?: {
    horizontal?: AnchorPosition;
    vertical?: AnchorPosition;
    wrap?: "inline" | "square" | "tight" | "topAndBottom" | "none";
    behindText?: boolean;
    overlap?: boolean;
    zIndex?: number;
  };
}

export interface AnchorPosition {
  position: number;
  relativeTo: "page" | "margin" | "column" | "paragraph" | "line" | "character";
}

export interface ImageCrop {
  left: number;
  top: number;
  right: number;
  bottom: number;
  unit: "px" | "%";
}

export interface ImageTransform {
  rotation?: number; // degrees
  flipHorizontal?: boolean;
  flipVertical?: boolean;
}

// ---- Math ----

export interface MathNode {
  type: "math";
  id: string;
  
  /** Math source code */
  source: string;
  
  /** Source format */
  format: "latex" | "omml" | "mathml" | "asciimath";
  
  /** Display mode (block vs inline) */
  displayMode?: boolean;
}

// ---- References ----

export interface FootnoteRefNode {
  type: "footnoteRef";
  id: string;
  footnoteId: string;
  number?: number;
}

export interface EndnoteRefNode {
  type: "endnoteRef";
  id: string;
  endnoteId: string;
  number?: number;
}

export interface CommentRefNode {
  type: "commentRef";
  id: string;
  commentId: string;
  
  /** Comment range start marker */
  isRangeStart?: boolean;
  
  /** Comment range end marker */
  isRangeEnd?: boolean;
}

export interface BookmarkNode {
  type: "bookmark";
  id: string;
  name: string;
  
  /** Bookmark range start marker */
  isRangeStart?: boolean;
  
  /** Bookmark range end marker */
  isRangeEnd?: boolean;
}

// ---- Embed ----

export interface EmbedNode {
  type: "embed";
  id: string;
  
  /** Embed source URL */
  src: string;
  
  /** Embed type */
  embedType: "video" | "audio" | "iframe" | "object" | "unknown";
  
  /** Dimensions */
  dimensions?: ImageDimensions;
  
  /** Provider name (e.g., "YouTube", "Vimeo") */
  provider?: string;
}

// ---- Video / Audio ----

export interface VideoNode {
  type: "video";
  id: string;
  src: string;
  poster?: string;
  dimensions?: ImageDimensions;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

export interface AudioNode {
  type: "audio";
  id: string;
  src: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
}

// ---- Custom Inline (Extension Point) ----

export interface CustomInlineNode {
  type: "customInline";
  id: string;
  /** Custom inline type identifier */
  customType: string;
  /** Custom inline data */
  data: Record<string, unknown>;
  /** Optional text content */
  text?: string;
}

// ============================================================================
// RESOURCES
// ============================================================================

export interface ResourceMap {
  images?: Map<string, ImageResource>;
  fonts?: Map<string, FontResource>;
  files?: Map<string, FileResource>;
}

export interface ImageResource {
  id: string;
  type: "image";
  mimeType: string;
  data: string; // Base64 or URL
  width?: number;
  height?: number;
}

export interface FontResource {
  id: string;
  type: "font";
  family: string;
  weight?: number;
  style?: "normal" | "italic";
  data?: string; // Base64 or URL
  url?: string;
}

export interface FileResource {
  id: string;
  type: "file";
  mimeType: string;
  filename: string;
  data?: string; // Base64 or URL
  url?: string;
}

// ============================================================================
// AUXILIARY CONTENT
// ============================================================================

export interface AuxiliaryContent {
  footnotes?: Map<string, FootnoteNode>;
  endnotes?: Map<string, EndnoteNode>;
  comments?: Map<string, CommentNode>;
  revisions?: RevisionNode[];
  headers?: Map<string, HeaderFooterNode>;
  footers?: Map<string, HeaderFooterNode>;
}

export interface FootnoteNode {
  type: "footnote";
  id: string;
  number: number;
  children: BlockNode[];
}

export interface EndnoteNode {
  type: "endnote";
  id: string;
  number: number;
  children: BlockNode[];
}

export interface CommentNode {
  type: "comment";
  id: string;
  author?: string;
  authorId?: string;
  date?: string;
  children: BlockNode[];
}

export interface RevisionNode {
  type: "revision";
  id: string;
  revisionType: "insert" | "delete";
  author?: string;
  authorId?: string;
  date?: string;
  
  /** Affected content */
  content: InlineNode[];
}

export interface HeaderFooterNode {
  type: "header" | "footer";
  id: string;
  children: BlockNode[];
  
  /** Header/footer type */
  headerFooterType?: "default" | "firstPage" | "evenPage";
}

// ============================================================================
// AST UTILITY TYPES
// ============================================================================

/** Any AST node */
export type ASTNode = 
  | DocumentNode
  | SectionNode
  | BlockNode
  | InlineNode
  | TableRowNode
  | TableCellNode
  | ListItemNode
  | FigcaptionNode
  | FootnoteNode
  | EndnoteNode
  | CommentNode
  | RevisionNode
  | HeaderFooterNode
  | VideoNode
  | AudioNode;

/** Node with children */
export interface ParentNode {
  children: ASTNode[];
}

/** Node that can appear in block context */
export type BlockContent = BlockNode;

/** Node that can appear in inline context */
export type InlineContent = InlineNode;

/** Position in source document (for source mapping) */
export interface SourcePosition {
  /** Zero-based line number */
  line: number;
  /** Zero-based column number */
  column: number;
  /** Byte offset */
  offset?: number;
}

/** Source location span */
export interface SourceLocation {
  start: SourcePosition;
  end: SourcePosition;
  source?: string;
}

/** Node with source location */
export interface LocatedNode extends ASTNode {
  position?: SourceLocation;
}
