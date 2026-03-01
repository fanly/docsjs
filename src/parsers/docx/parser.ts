/**
 * DOCX Parser
 * 
 * Parses DOCX files and outputs DocumentAST.
 * 
 * Architecture:
 * - DOCX file → XML parsing → AST nodes
 * - Clean separation from rendering
 * - Preserves all semantic information
 */

import JSZip from "jszip";
import type {
  DocumentNode,
  SectionNode,
  BlockNode,
  InlineNode,
  ParagraphNode,
  HeadingNode,
  TextNode,
  TextMark,
  ListNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  ImageNode,
  HyperlinkNode,
  MathNode,
  FootnoteRefNode,
  EndnoteRefNode,
  CommentRefNode,
  BookmarkNode,
  ImageDimensions,
  ImagePositioning,
  AuxiliaryContent,
  FootnoteNode,
  EndnoteNode,
  CommentNode,
  PageSetup,
  ParagraphSemantics,
} from "../ast/types";

import {
  generateId,
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
  createAuxiliaryContent,
} from "../../ast/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface DocxParseOptions {
  /** Enable plugin pipeline */
  enablePlugins?: boolean;
  /** Extract embedded images as base64 */
  extractImages?: boolean;
  /** Include revision markers */
  includeRevisions?: boolean;
  /** Include comments */
  includeComments?: boolean;
}

export interface DocxParseResult {
  ast: DocumentNode;
  report: DocxParseReport;
}

export interface DocxParseReport {
  elapsedMs: number;
  features: DocxFeatureCounts;
  warnings: string[];
}

export interface DocxFeatureCounts {
  paragraphCount: number;
  tableCount: number;
  imageCount: number;
  hyperlinkCount: number;
  listCount: number;
  headingCount: number;
  mathCount: number;
  footnoteCount: number;
  endnoteCount: number;
  commentCount: number;
  bookmarkCount: number;
  revisionCount: number;
}

// ============================================================================
// XML UTILITIES
// ============================================================================

function parseXml(xmlText: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, "application/xml");
}

function getChildrenByLocalName(parent: ParentNode, localName: string): Element[] {
  return Array.from(parent.children).filter((child) => child.localName === localName);
}

function getChildByLocalName(parent: ParentNode, localName: string): Element | null {
  return getChildrenByLocalName(parent, localName).at(0) ?? null;
}

function getAttr(el: Element | null, name: string): string | null {
  if (!el) return null;
  return el.getAttribute(name) ?? el.getAttribute(`w:${name}`) ?? null;
}

function getTextContent(el: Element | null): string {
  return el?.textContent ?? "";
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// ============================================================================
// UNIT CONVERSIONS
// ============================================================================

function emuToPx(emu: number): number {
  return (emu * 96) / 914400;
}

function twipToPx(twip: number): number {
  return (twip * 96) / 1440;
}

function twipToPt(twip: number): number {
  return twip / 20;
}

// ============================================================================
// DOCX PARSER CLASS
// ============================================================================

export class DocxParser {
  private zip: JSZip | null = null;
  private documentXml: Document | null = null;
  private stylesXml: Document | null = null;
  private numberingXml: Document | null = null;
  private relsMap: Record<string, string> = new Map() as unknown as Record<string, string>;
  private auxiliary: AuxiliaryContent = createAuxiliaryContent();
  private footnotesMap: Map<string, FootnoteNode> = new Map();
  private endnotesMap: Map<string, EndnoteNode> = new Map();
  private commentsMap: Map<string, CommentNode> = new Map();
  private options: DocxParseOptions;
  private report: DocxFeatureCounts;
  private warnings: string[] = [];

  constructor(options: DocxParseOptions = {}) {
    this.options = {
      enablePlugins: true,
      extractImages: true,
      includeRevisions: true,
      includeComments: true,
      ...options,
    };
    this.report = this.createEmptyFeatureCounts();
  }

  // ---- PUBLIC API ----

  async parse(file: File): Promise<DocxParseResult> {
    const startTime = Date.now();
    
    // Load ZIP
    const buffer = await this.loadFileBuffer(file);
    this.zip = await JSZip.loadAsync(buffer);
    
    // Parse XML files
    await this.parseXmlFiles();
    
    // Parse relationships
    this.parseRelationships();
    
    // Parse auxiliary content
    this.parseFootnotes();
    this.parseEndnotes();
    this.parseComments();
    
    // Build AST
    const ast = this.buildDocument();
    
    return {
      ast,
      report: {
        elapsedMs: Date.now() - startTime,
        features: this.report,
        warnings: this.warnings,
      },
    };
  }

  // ---- FILE LOADING ----

  private async loadFileBuffer(file: File): Promise<ArrayBuffer> {
    const maybeArrayBuffer = (file as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
    return maybeArrayBuffer 
      ? await maybeArrayBuffer.call(file) 
      : await new Response(file).arrayBuffer();
  }

  private async parseXmlFiles(): Promise<void> {
    const documentXmlText = await this.zip?.file("word/document.xml")?.async("string");
    if (!documentXmlText) {
      throw new Error("DOCX missing document.xml");
    }
    this.documentXml = parseXml(documentXmlText);

    const stylesText = await this.zip?.file("word/styles.xml")?.async("string");
    this.stylesXml = stylesText ? parseXml(stylesText) : null;

    const numberingText = await this.zip?.file("word/numbering.xml")?.async("string");
    this.numberingXml = numberingText ? parseXml(numberingText) : null;
  }

  private parseRelationships(): void {
    const relsText = this.zip?.file("word/_rels/document.xml.rels")?.async("string");
    if (!relsText) return;

    const relsDoc = parseXml(relsText);
    const rels = getChildrenByLocalName(relsDoc, "Relationship");
    
    for (const rel of rels) {
      const id = getAttr(rel, "Id");
      const target = getAttr(rel, "Target");
      if (id && target) {
        this.relsMap[id] = target;
      }
    }
  }

  // ---- AUXILIARY CONTENT PARSING ----

  private parseFootnotes(): void {
    // Will be implemented to parse word/footnotes.xml
  }

  private parseEndnotes(): void {
    // Will be implemented to parse word/endnotes.xml
  }

  private parseComments(): void {
    // Will be implemented to parse word/comments.xml
  }

  // ---- DOCUMENT BUILDING ----

  private buildDocument(): DocumentNode {
    const doc = createEmptyDocument("docx");
    
    const body = getChildByLocalName(this.documentXml!, "body");
    if (!body) {
      this.warnings.push("Document missing body element");
      return doc;
    }

    const section = this.parseBody(body);
    doc.children.push(section);
    
    // Attach auxiliary content
    if (this.footnotesMap.size > 0 || 
        this.endnotesMap.size > 0 || 
        this.commentsMap.size > 0) {
      doc.auxiliary = {
        footnotes: this.footnotesMap,
        endnotes: this.endnotesMap,
        comments: this.commentsMap,
      };
    }

    return doc;
  }

  private parseBody(body: Element): SectionNode {
    const children: BlockNode[] = [];
    
    for (const child of Array.from(body.children)) {
      if (child.localName === "p") {
        const node = this.parseParagraph(child);
        if (node) children.push(node);
      } else if (child.localName === "tbl") {
        const node = this.parseTable(child);
        if (node) children.push(node);
      } else if (child.localName === "sectPr") {
        // Section properties - could create new section
      }
    }

    return createSectionNode(children);
  }

  // ---- PARAGRAPH PARSING ----

  private parseParagraph(p: Element): ParagraphNode | HeadingNode | null {
    const pPr = getChildByLocalName(p, "pPr");
    const pStyle = pPr ? getChildByLocalName(pPr, "pStyle") : null;
    const styleVal = getAttr(pStyle, "val")?.toLowerCase() ?? "";

    // Check if heading
    const headingLevel = this.getHeadingLevel(styleVal);
    
    // Parse runs
    const inlines = this.parseParagraphContent(p);
    
    // Parse paragraph semantics
    const semantics = this.parseParagraphSemantics(pPr);

    this.report.paragraphCount++;

    if (headingLevel !== null) {
      this.report.headingCount++;
      return createHeadingNode(headingLevel, inlines, styleVal || undefined);
    }

    return createParagraphNode(inlines, semantics, styleVal || undefined);
  }

  private getHeadingLevel(styleVal: string): 1 | 2 | 3 | 4 | 5 | 6 | null {
    if (styleVal.includes("heading1") || styleVal === "1" || styleVal === "heading 1") return 1;
    if (styleVal.includes("heading2") || styleVal === "2" || styleVal === "heading 2") return 2;
    if (styleVal.includes("heading3") || styleVal === "3" || styleVal === "heading 3") return 3;
    if (styleVal.includes("heading4") || styleVal === "4" || styleVal === "heading 4") return 4;
    if (styleVal.includes("heading5") || styleVal === "5" || styleVal === "heading 5") return 5;
    if (styleVal.includes("heading6") || styleVal === "6" || styleVal === "heading 6") return 6;
    return null;
  }

  private parseParagraphSemantics(pPr: Element | null): ParagraphSemantics | undefined {
    if (!pPr) return undefined;

    const semantics: ParagraphSemantics = {};
    
    // Alignment
    const jc = getChildByLocalName(pPr, "jc");
    const alignVal = getAttr(jc, "val")?.toLowerCase();
    if (alignVal === "left" || alignVal === "start") semantics.alignment = "start";
    else if (alignVal === "center") semantics.alignment = "center";
    else if (alignVal === "right" || alignVal === "end") semantics.alignment = "end";
    else if (alignVal === "both") semantics.alignment = "justify";

    // Indent
    const ind = getChildByLocalName(pPr, "ind");
    if (ind) {
      const left = getAttr(ind, "left");
      const right = getAttr(ind, "right");
      const firstLine = getAttr(ind, "firstLine");
      const hanging = getAttr(ind, "hanging");

      if (left || right || firstLine || hanging) {
        semantics.indent = { unit: "pt" };
        if (left) semantics.indent.left = twipToPt(parseInt(left, 10));
        if (right) semantics.indent.right = twipToPt(parseInt(right, 10));
        if (firstLine) semantics.indent.firstLine = twipToPt(parseInt(firstLine, 10));
        if (hanging) semantics.indent.hanging = twipToPt(parseInt(hanging, 10));
      }
    }

    // Spacing
    const spacing = getChildByLocalName(pPr, "spacing");
    if (spacing) {
      const before = getAttr(spacing, "before");
      const after = getAttr(spacing, "after");
      
      if (before || after) {
        semantics.spacing = { unit: "pt" };
        if (before) semantics.spacing.before = twipToPt(parseInt(before, 10));
        if (after) semantics.spacing.after = twipToPt(parseInt(after, 10));
      }
    }

    // Page break
    const pageBreakBefore = getChildByLocalName(pPr, "pageBreakBefore");
    if (pageBreakBefore) {
      semantics.pageBreakBefore = true;
    }

    return Object.keys(semantics).length > 0 ? semantics : undefined;
  }

  private parseParagraphContent(p: Element): InlineNode[] {
    const inlines: InlineNode[] = [];

    for (const child of Array.from(p.children)) {
      if (child.localName === "r") {
        const runInlines = this.parseRun(child);
        inlines.push(...runInlines);
      } else if (child.localName === "hyperlink") {
        const hyperlink = this.parseHyperlink(child);
        if (hyperlink) inlines.push(hyperlink);
      } else if (child.localName === "bookmarkStart") {
        const bookmark = this.parseBookmarkStart(child);
        if (bookmark) inlines.push(bookmark);
      } else if (child.localName === "oMath" || child.localName === "oMathPara") {
        const math = this.parseMath(child);
        if (math) inlines.push(math);
      } else if (child.localName === "ins" || child.localName === "del") {
        // Revision markers
        const revisionInlines = this.parseRevision(child);
        inlines.push(...revisionInlines);
      }
    }

    return inlines;
  }

  // ---- RUN PARSING ----

  private parseRun(r: Element): InlineNode[] {
    const inlines: InlineNode[] = [];
    
    const rPr = getChildByLocalName(r, "rPr");
    const marks = this.parseRunMarks(rPr);

    // Check for special content first
    const footnoteRef = getChildByLocalName(r, "footnoteReference");
    if (footnoteRef) {
      const id = getAttr(footnoteRef, "id");
      if (id) {
        this.report.footnoteCount++;
        inlines.push({
          type: "footnoteRef",
          id: generateId("fnref"),
          footnoteId: id,
        } as FootnoteRefNode);
      }
      return inlines;
    }

    const endnoteRef = getChildByLocalName(r, "endnoteReference");
    if (endnoteRef) {
      const id = getAttr(endnoteRef, "id");
      if (id) {
        this.report.endnoteCount++;
        inlines.push({
          type: "endnoteRef",
          id: generateId("enref"),
          endnoteId: id,
        } as EndnoteRefNode);
      }
      return inlines;
    }

    const commentRef = getChildByLocalName(r, "commentReference");
    if (commentRef) {
      const id = getAttr(commentRef, "id");
      if (id) {
        this.report.commentCount++;
        inlines.push({
          type: "commentRef",
          id: generateId("cmref"),
          commentId: id,
        } as CommentRefNode);
      }
      return inlines;
    }

    // Drawing (image)
    const drawing = getChildByLocalName(r, "drawing");
    if (drawing) {
      const image = this.parseDrawing(drawing);
      if (image) {
        this.report.imageCount++;
        inlines.push(image);
      }
      return inlines;
    }

    // Text content
    const textNodes = getChildrenByLocalName(r, "t");
    const delTextNodes = getChildrenByLocalName(r, "delText");
    const brNodes = getChildrenByLocalName(r, "br");

    // Collect text
    let text = "";
    for (const t of textNodes) {
      text += getTextContent(t);
    }
    for (const t of delTextNodes) {
      text += getTextContent(t);
    }

    if (text) {
      inlines.push(createTextNode(text, marks.length > 0 ? marks : undefined));
    }

    // Line breaks
    for (const br of brNodes) {
      const type = getAttr(br, "type")?.toLowerCase();
      if (type === "page") {
        // Page break - could be a special node
      } else {
        inlines.push({ type: "hardBreak", id: generateId("br") });
      }
    }

    return inlines;
  }

  private parseRunMarks(rPr: Element | null): TextMark[] {
    const marks: TextMark[] = [];
    if (!rPr) return marks;

    if (getChildByLocalName(rPr, "b")) {
      marks.push({ type: "bold" });
    }
    if (getChildByLocalName(rPr, "i")) {
      marks.push({ type: "italic" });
    }
    if (getChildByLocalName(rPr, "u")) {
      marks.push({ type: "underline" });
    }
    if (getChildByLocalName(rPr, "strike")) {
      marks.push({ type: "strikethrough" });
    }
    if (getChildByLocalName(rPr, "vertAlign")) {
      const val = getAttr(getChildByLocalName(rPr, "vertAlign"), "val")?.toLowerCase();
      if (val === "superscript") marks.push({ type: "superscript" });
      if (val === "subscript") marks.push({ type: "subscript" });
    }

    return marks;
  }

  // ---- HYPERLINK PARSING ----

  private parseHyperlink(el: Element): HyperlinkNode | null {
    const rid = getAttr(el, "id");
    const anchor = getAttr(el, "anchor");
    
    let href = "";
    if (anchor) {
      href = `#${encodeURIComponent(anchor)}`;
    } else if (rid && this.relsMap[rid]) {
      href = this.relsMap[rid];
    }

    if (!href) return null;

    this.report.hyperlinkCount++;

    const children = this.parseParagraphContent(el);
    return createHyperlinkNode(href, children, anchor ? { anchor } : undefined);
  }

  // ---- BOOKMARK PARSING ----

  private parseBookmarkStart(el: Element): BookmarkNode | null {
    const id = getAttr(el, "id");
    const name = getAttr(el, "name");
    
    if (!id || !name) return null;

    this.report.bookmarkCount++;

    return {
      type: "bookmark",
      id: generateId("bm"),
      name,
      isRangeStart: true,
    };
  }

  // ---- MATH PARSING ----

  private parseMath(el: Element): MathNode | null {
    // Extract linear representation for now
    const linear = this.ommlToLinear(el);
    if (!linear) return null;

    this.report.mathCount++;

    return {
      type: "math",
      id: generateId("math"),
      source: linear,
      format: "omml",
    };
  }

  private ommlToLinear(node: Element): string {
    // Simplified linear representation
    const localName = node.localName;
    
    if (localName === "t") {
      return node.textContent ?? "";
    }
    
    if (localName === "f") {
      const num = getChildByLocalName(node, "num");
      const den = getChildByLocalName(node, "den");
      return `(${this.ommlToLinear(num)})/(${this.ommlToLinear(den)})`;
    }
    
    if (localName === "sSup" || localName === "sup") {
      const e = getChildByLocalName(node, "e");
      const sup = getChildByLocalName(node, "sup");
      return `${this.ommlToLinear(e)}^(${this.ommlToLinear(sup)})`;
    }
    
    if (localName === "sSub" || localName === "sub") {
      const e = getChildByLocalName(node, "e");
      const sub = getChildByLocalName(node, "sub");
      return `${this.ommlToLinear(e)}_(${this.ommlToLinear(sub)})`;
    }
    
    if (localName === "rad" || localName === "root") {
      const e = getChildByLocalName(node, "e");
      return `sqrt(${this.ommlToLinear(e)})`;
    }

    // Recursively process children
    let result = "";
    for (const child of Array.from(node.children)) {
      result += this.ommlToLinear(child);
    }
    return result;
  }

  // ---- REVISION PARSING ----

  private parseRevision(el: Element): InlineNode[] {
    const revisionType = el.localName === "ins" ? "insert" : "delete";
    this.report.revisionCount++;
    
    // Parse the content inside revision
    const inlines: InlineNode[] = [];
    for (const child of Array.from(el.children)) {
      if (child.localName === "r") {
        const runInlines = this.parseRun(child);
        // Mark these as revision content
        inlines.push(...runInlines);
      }
    }
    
    return inlines;
  }

  // ---- DRAWING / IMAGE PARSING ----

  private parseDrawing(drawing: Element): ImageNode | null {
    const blip = getChildByLocalName(drawing, "blip") ?? 
                 this.queryByLocalName(drawing, "blip");
    
    if (!blip) return null;

    const rid = getAttr(blip, "embed");
    if (!rid) return null;

    const src = this.relsMap[rid];
    if (!src) return null;

    // Resolve image data
    const imageSrc = this.resolveImageSrc(src);

    // Parse dimensions
    const dimensions = this.parseDrawingDimensions(drawing);
    
    // Parse positioning
    const positioning = this.parseDrawingPositioning(drawing);

    return createImageNode(imageSrc, { dimensions, positioning });
  }

  private resolveImageSrc(relTarget: string): string {
    const normalized = relTarget.replace(/\\/g, "/").replace(/^\/+/, "");
    const path = normalized.startsWith("word/") ? normalized : `word/${normalized}`;
    
    // For now, return the path - in production, we'd convert to base64
    // This would be handled by the resource resolver
    return `docx:${path}`;
  }

  private parseDrawingDimensions(drawing: Element): ImageDimensions | undefined {
    const extent = this.queryByLocalName(drawing, "extent");
    if (!extent) return undefined;

    const cx = getAttr(extent, "cx");
    const cy = getAttr(extent, "cy");
    
    if (!cx || !cy) return undefined;

    const cxNum = parseInt(cx, 10);
    const cyNum = parseInt(cy, 10);
    
    if (!Number.isFinite(cxNum) || !Number.isFinite(cyNum)) return undefined;

    return {
      width: emuToPx(cxNum),
      height: emuToPx(cyNum),
      unit: "px",
    };
  }

  private parseDrawingPositioning(drawing: Element): ImagePositioning | undefined {
    const anchor = getChildByLocalName(drawing, "anchor");
    if (!anchor) {
      return { type: "inline" };
    }

    // Parse anchor position
    const posH = getChildByLocalName(anchor, "positionH");
    const posV = getChildByLocalName(anchor, "positionV");
    
    let horizontal: ImagePositioning["anchor"]["horizontal"];
    let vertical: ImagePositioning["anchor"]["vertical"];

    if (posH) {
      const posOffset = getChildByLocalName(posH, "posOffset");
      const relativeFrom = getAttr(posH, "relativeFrom");
      if (posOffset && relativeFrom) {
        horizontal = {
          position: emuToPx(parseFloat(getTextContent(posOffset))),
          relativeTo: relativeFrom as ImagePositioning["anchor"]["horizontal"]["relativeTo"],
        };
      }
    }

    if (posV) {
      const posOffset = getChildByLocalName(posV, "posOffset");
      const relativeFrom = getAttr(posV, "relativeFrom");
      if (posOffset && relativeFrom) {
        vertical = {
          position: emuToPx(parseFloat(getTextContent(posOffset))),
          relativeTo: relativeFrom as ImagePositioning["anchor"]["vertical"]["relativeTo"],
        };
      }
    }

    // Parse wrap mode
    let wrap: ImagePositioning["anchor"]["wrap"] = "inline";
    if (getChildByLocalName(anchor, "wrapSquare")) wrap = "square";
    else if (getChildByLocalName(anchor, "wrapTight")) wrap = "tight";
    else if (getChildByLocalName(anchor, "wrapTopAndBottom")) wrap = "topAndBottom";
    else if (getChildByLocalName(anchor, "wrapNone")) wrap = "none";

    const behindDoc = getAttr(anchor, "behindDoc") === "1";
    const allowOverlap = getAttr(anchor, "allowOverlap") !== "0";

    return {
      type: "floating",
      anchor: {
        horizontal,
        vertical,
        wrap,
        behindText: behindDoc,
        overlap: allowOverlap,
      },
    };
  }

  // ---- TABLE PARSING ----

  private parseTable(tbl: Element): TableNode | null {
    this.report.tableCount++;

    const rows: TableRowNode[] = [];
    const trs = getChildrenByLocalName(tbl, "tr");

    for (const tr of trs) {
      const row = this.parseTableRow(tr);
      if (row) rows.push(row);
    }

    return createTableNode(rows);
  }

  private parseTableRow(tr: Element): TableRowNode | null {
    const cells: TableCellNode[] = [];
    const tcs = getChildrenByLocalName(tr, "tc");

    for (const tc of tcs) {
      const cell = this.parseTableCell(tc);
      if (cell) cells.push(cell);
    }

    return createTableRowNode(cells);
  }

  private parseTableCell(tc: Element): TableCellNode | null {
    const children: BlockNode[] = [];
    
    // Parse cell properties
    const tcPr = getChildByLocalName(tc, "tcPr");
    let colspan: number | undefined;
    let rowspan: number | undefined;

    if (tcPr) {
      const gridSpan = getChildByLocalName(tcPr, "gridSpan");
      if (gridSpan) {
        const val = parseInt(getAttr(gridSpan, "val") ?? "1", 10);
        if (Number.isFinite(val) && val > 1) {
          colspan = val;
        }
      }

      const vMerge = getChildByLocalName(tcPr, "vMerge");
      if (vMerge) {
        const val = getAttr(vMerge, "val");
        // "restart" starts a merged cell, "continue" continues it
        // This is simplified - full implementation needs row tracking
        if (val === "restart") {
          rowspan = 1; // Will be updated as we process subsequent rows
        }
      }
    }

    // Parse cell content
    for (const child of Array.from(tc.children)) {
      if (child.localName === "p") {
        const node = this.parseParagraph(child);
        if (node) children.push(node);
      } else if (child.localName === "tbl") {
        const node = this.parseTable(child);
        if (node) children.push(node);
      }
    }

    return createTableCellNode(children, { colspan, rowspan });
  }

  // ---- HELPERS ----

  private queryByLocalName(root: ParentNode, localName: string): Element | null {
    const stack = [...rootChildren(root)].reverse();
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.localName === localName) return node;
      stack.push(...[...node.children].reverse());
    }
    return null;
  }

  private createEmptyFeatureCounts(): DocxFeatureCounts {
    return {
      paragraphCount: 0,
      tableCount: 0,
      imageCount: 0,
      hyperlinkCount: 0,
      listCount: 0,
      headingCount: 0,
      mathCount: 0,
      footnoteCount: 0,
      endnoteCount: 0,
      commentCount: 0,
      bookmarkCount: 0,
      revisionCount: 0,
    };
  }
}

function rootChildren(root: ParentNode): Element[] {
  return Array.from((root as Document).children ?? (root as Element).children ?? []);
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Parse a DOCX file to DocumentAST
 */
export async function parseDocxToAST(
  file: File,
  options?: DocxParseOptions
): Promise<DocxParseResult> {
  const parser = new DocxParser(options);
  return parser.parse(file);
}
