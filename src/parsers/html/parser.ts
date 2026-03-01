/**
 * HTML Parser
 * 
 * Parses HTML strings and outputs DocumentAST.
 * 
 * Architecture:
 * - HTML string → DOM parsing → AST nodes
 * - Clean separation from rendering
 * - Preserves semantic information
 */

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
  BlockquoteNode,
  CodeBlockNode,
  ThematicBreakNode,
  AuxiliaryContent,
  InputFormat,
} from "../../ast/types";

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
import { AST_VERSION } from "../../ast/types";

// ============================================================================
// TYPES
// ============================================================================

export interface HtmlParseOptions {
  /** Enable plugin pipeline */
  enablePlugins?: boolean;
  /** Base URL for resolving relative links */
  baseUrl?: string;
  /** Enable sanitization */
  sanitize?: boolean;
  /** Extract image data as base64 */
  extractImages?: boolean;
}

export interface HtmlParseResult {
  ast: DocumentNode;
  report: HtmlParseReport;
}

export interface HtmlParseReport {
  byteSize: number;
  characterCount: number;
  warnings: string[];
  parseTimeMs: number;
}

// Simple DOM node types
type DOMElement = {
  nodeType: number;
  nodeName: string;
  tagName?: string;
  textContent?: string;
  childNodes?: DOMElement[];
  getAttribute?: (name: string) => string | null;
  querySelectorAll?: (selector: string) => DOMElement[];
  querySelector?: (selector: string) => DOMElement | null;
};

// ============================================================================
// HTML PARSER CLASS
// ============================================================================

export class HtmlParser {
  private options: Required<HtmlParseOptions>;
  private warnings: string[] = [];
  private auxiliary: AuxiliaryContent = createAuxiliaryContent();
  private document: Document | null = null;

  constructor(options: HtmlParseOptions = {}) {
    this.options = {
      enablePlugins: options.enablePlugins ?? true,
      baseUrl: options.baseUrl ?? "",
      sanitize: options.sanitize ?? true,
      extractImages: options.extractImages ?? false,
    };
  }

  // ---- PUBLIC API ----

  async parse(html: string): Promise<HtmlParseResult> {
    const startTime = Date.now();
    this.warnings = [];
    this.auxiliary = createAuxiliaryContent();

    // Use browser DOMParser if available (browser environment)
    // Otherwise use a simple parser fallback
    if (typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      this.document = parser.parseFromString(html, "text/html");
      
      // Check for parsing errors
      const parseError = this.document.getElementsByTagName("parsererror")[0];
      if (parseError) {
        throw new Error(`HTML parse error: ${parseError.textContent}`);
      }
    } else {
      // Simple fallback for Node.js - just parse basic HTML structure
      this.document = this.simpleParse(html);
    }

    if (!this.document || !this.document.body) {
      throw new Error("Failed to parse HTML");
    }

    // Build AST from DOM
    const ast = this.parseDocument(this.document);

    const report: HtmlParseReport = {
      byteSize: new TextEncoder().encode(html).length,
      characterCount: html.length,
      warnings: this.warnings,
      parseTimeMs: Date.now() - startTime,
    };

    return { ast, report };
  }

  // ---- SIMPLE PARSER (Node.js fallback) ----

  private simpleParse(html: string): Document {
    // Very basic HTML parsing for Node.js environment
    // Creates a minimal DOM-like structure
    const bodyContent = this.extractBodyContent(html);
    
    return {
      body: this.createSimpleElement("body", bodyContent),
      querySelector: (selector: string) => {
        if (selector === "body") return this.createSimpleElement("body", bodyContent);
        if (selector.startsWith("meta[name=")) {
          const match = html.match(/<meta name="([^"]+)" content="([^"]*)"/);
          if (match) {
            return {
              nodeType: 1,
              nodeName: "META",
              tagName: "meta",
              getAttribute: (name: string) => {
                if (name === "name") return match[1];
                if (name === "content") return match[2];
                return null;
              }
            } as unknown as Element;
          }
        }
        return null;
      },
      getElementsByTagName: () => []
    } as unknown as Document;
  }

  private extractBodyContent(html: string): string {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) return bodyMatch[1];
    
    const htmlMatch = html.match(/<html[^>]*>([\s\S]*)<\/html>/i);
    if (htmlMatch) return htmlMatch[1];
    
    return html;
  }

  private createSimpleElement(tag: string, content: string): DOMElement {
    return {
      nodeType: 1,
      nodeName: tag.toUpperCase(),
      tagName: tag.toUpperCase(),
      textContent: content,
      childNodes: [],
      querySelectorAll: () => [],
      querySelector: () => null,
      getAttribute: () => null
    };
  }

  // ---- DOCUMENT PARSING ----

  private parseDocument(doc: Document): DocumentNode {
    const body = doc.body;
    if (!body) {
      return createEmptyDocument();
    }

    // Extract document-level metadata from <title>, <meta>, etc.
    const properties = this.extractMetadata(doc);

    // Parse body content into sections
    const sections = this.parseBodyContent(body);

    const ast: DocumentNode = {
      type: "document",
      id: generateId(),
      metadata: {
        version: AST_VERSION,
        createdAt: Date.now(),
        sourceFormat: "html" as InputFormat,
        generator: "DocsJS HTML Parser",
      },
      properties,
      styles: undefined,
      children: sections,
      resources: undefined,
      auxiliary: this.auxiliary,
    };

    return ast;
  }

  private extractMetadata(doc: Document): DocumentNode["properties"] {
    const properties: DocumentNode["properties"] = {};

    // Extract title
    const titleEl = doc.querySelector?.("title");
    if (titleEl) {
      properties.title = titleEl.textContent || undefined;
    }

    // Extract meta tags
    const metaTags = doc.getElementsByTagName?.("meta") || [];
    for (const meta of Array.from(metaTags)) {
      const name = meta.getAttribute?.("name") || meta.getAttribute?.("property");
      const content = meta.getAttribute?.("content");

      if (name && content) {
        switch (name.toLowerCase()) {
          case "author":
            properties.author = content;
            break;
          case "description":
          case "subject":
            properties.subject = content;
            break;
          case "keywords":
            properties.keywords = content.split(",").map(k => k.trim());
            break;
          case "language":
            properties.language = content;
            break;
        }
      }
    }

    return Object.keys(properties).length > 0 ? properties : undefined;
  }

  private parseBodyContent(element: Element): SectionNode[] {
    const blocks = this.parseChildBlocks(element);

    // Wrap all blocks in a single section
    const section = createSectionNode(blocks);

    return [section];
  }

  // ---- BLOCK PARSING ----

  private parseChildBlocks(element: Element): BlockNode[] {
    const blocks: BlockNode[] = [];
    const children = Array.from(element.childNodes || []);

    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const block = this.parseElement(child as Element);
        if (block) blocks.push(block);
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = (child as Text).textContent?.trim();
        if (text) {
          // Convert text nodes to paragraphs
          blocks.push(createParagraphNode([createTextNode(text)]));
        }
      }
    }

    return blocks;
  }

  private parseElement(element: Element): BlockNode | null {
    const tagName = (element.tagName || element.nodeName).toLowerCase();

    switch (tagName) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return this.parseHeading(element);

      case "p":
        return this.parseParagraph(element);

      case "ul":
      case "ol":
        return this.parseList(element);

      case "table":
        return this.parseTable(element);

      case "blockquote":
        return this.parseBlockquote(element);

      case "pre":
        return this.parseCodeBlock(element);

      case "img":
        // Wrap standalone images in paragraphs
        return createParagraphNode([this.parseImage(element)]);

      case "hr":
        return this.parseThematicBreak();

      case "div":
        return this.parseDiv(element);

      case "section":
      case "article":
      case "main":
      case "aside":
      case "nav":
        const blocks = this.parseChildBlocks(element);
        return blocks.length > 0 ? blocks[0] : null;

      case "figure":
        return this.parseFigure(element);

      case "figcaption":
        return null;

      default:
        this.warnings.push(`Unknown element: ${tagName}, treating as paragraph`);
        return this.parseParagraph(element);
    }
  }

  private parseHeading(element: Element): HeadingNode {
    const level = parseInt((element.tagName || "h1")[1]) as 1 | 2 | 3 | 4 | 5 | 6;
    const children = this.parseInlineContent(element);

    return createHeadingNode(level, children);
  }

  private parseParagraph(element: Element): ParagraphNode {
    const children = this.parseInlineContent(element);

    return createParagraphNode(children);
  }

  private parseDiv(element: Element): BlockNode {
    const blocks = this.parseChildBlocks(element);
    
    if (blocks.length === 1) {
      return blocks[0];
    }

    return createParagraphNode([createTextNode("[block content]")]);
  }

  private parseList(element: Element): ListNode {
    const tagName = (element.tagName || "ul").toLowerCase();
    const listType = tagName === "ol" ? "ordered" : "unordered";

    const items: ListItemNode[] = [];
    const listItems = Array.from(element.querySelectorAll?.(":scope > li") || element.childNodes || []);

    for (let i = 0; i < listItems.length; i++) {
      const li = listItems[i];
      if (li.nodeType === Node.ELEMENT_NODE) {
        const itemBlocks = this.parseListItemContent(li as Element);

        items.push(createListItemNode(
          itemBlocks,
          0,
          undefined,
          listType === "ordered" ? i + 1 : undefined
        ));
      }
    }

    return createListNode(listType, items);
  }

  private parseListItemContent(li: Element): BlockNode[] {
    const blocks: BlockNode[] = [];
    const childBlocks: BlockNode[] = [];
    const children = Array.from(li.childNodes || []);

    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as Element;
        const tagName = (el.tagName || "").toLowerCase();
        
        if (tagName === "ul" || tagName === "ol") {
          if (childBlocks.length > 0) {
            blocks.push(createParagraphNode(childBlocks.flatMap(b => this.blockToInlines(b))));
            childBlocks.length = 0;
          }
          const listBlock = this.parseElement(el);
          if (listBlock) blocks.push(listBlock);
        } else {
          const block = this.parseElement(el);
          if (block) childBlocks.push(block);
        }
      }
    }

    if (childBlocks.length > 0) {
      blocks.push(createParagraphNode(childBlocks.flatMap(b => this.blockToInlines(b))));
    }

    return blocks;
  }

  private blockToInlines(block: BlockNode): InlineNode[] {
    if (block.type === "paragraph") {
      return (block as ParagraphNode).children;
    } else if (block.type === "heading") {
      return (block as HeadingNode).children;
    }
    return [createTextNode("[block content]")];
  }

  private parseTable(element: Element): TableNode {
    const rows: TableRowNode[] = [];
    
    const thead = element.querySelector?.("thead");
    if (thead) {
      const headerRows = this.parseTableRows(thead, true);
      rows.push(...headerRows);
    }

    const tbody = element.querySelector?.("tbody");
    if (tbody) {
      const bodyRows = this.parseTableRows(tbody, false);
      rows.push(...bodyRows);
    }

    if (rows.length === 0) {
      const directRows = this.parseTableRows(element, false);
      rows.push(...directRows);
    }

    return createTableNode(rows);
  }

  private parseTableRows(container: Element, isHeader: boolean): TableRowNode[] {
    const rows: TableRowNode[] = [];
    const trElements = Array.from(container.querySelectorAll?.(":scope > tr") || []);

    for (const tr of trElements) {
      const cells: TableCellNode[] = [];
      const cellElements = Array.from(tr.querySelectorAll?.("th, td") || []);

      for (const cell of cellElements) {
        const isHeaderCell = (cell.tagName || "").toLowerCase() === "th";
        const children = this.parseInlineContent(cell);

        cells.push(createTableCellNode(
          [createParagraphNode(children)],
          { isHeader: isHeaderCell || isHeader }
        ));
      }

      if (cells.length > 0) {
        rows.push(createTableRowNode(cells));
      }
    }

    return rows;
  }

  private parseBlockquote(element: Element): BlockquoteNode {
    const children = this.parseChildBlocks(element);

    return {
      type: "blockquote",
      id: generateId(),
      children,
    };
  }

  private parseCodeBlock(element: Element): CodeBlockNode {
    const code = element.textContent || "";
    const classAttr = element.getAttribute?.("class") || "";
    const lang = classAttr.replace(/language-/, "").trim();

    return {
      type: "codeBlock",
      id: generateId(),
      code,
      language: lang || undefined,
    };
  }

  private parseImage(element: Element): ImageNode {
    const src = element.getAttribute?.("src") || "";
    const alt = element.getAttribute?.("alt") || "";
    const title = element.getAttribute?.("title") || undefined;

    return createImageNode(
      this.resolveUrl(src),
      { alt, title }
    );
  }

  private parseThematicBreak(): ThematicBreakNode {
    return {
      type: "thematicBreak",
      id: generateId(),
    };
  }

  private parseFigure(element: Element): BlockNode {
    const img = element.querySelector?.("img");
    if (img) {
      // Wrap image in paragraph
      return createParagraphNode([this.parseImage(img)]);
    }

    const children = this.parseChildBlocks(element);
    return children.length > 0 ? children[0] : createParagraphNode([]);
  }

  // ---- INLINE PARSING ----

  private parseInlineContent(element: Element): InlineNode[] {
    const inlines: InlineNode[] = [];
    const children = Array.from(element.childNodes || []);

    for (const child of children) {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = (child as Text).textContent;
        if (text) {
          inlines.push(createTextNode(text));
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const inline = this.parseInlineElement(child as Element);
        if (inline) inlines.push(inline);
      }
    }

    return this.mergeAdjacentTextNodes(inlines);
  }

  private parseInlineElement(element: Element): InlineNode | null {
    const tagName = (element.tagName || "").toLowerCase();

    switch (tagName) {
      case "a":
        return this.parseHyperlink(element);

      case "img":
        return this.parseImage(element);

      case "strong":
      case "b":
        return this.parseMarkedInline(element, "bold");

      case "em":
      case "i":
        return this.parseMarkedInline(element, "italic");

      case "u":
        return this.parseMarkedInline(element, "underline");

      case "s":
      case "strike":
      case "del":
        return this.parseMarkedInline(element, "strikethrough");

      case "code":
        return this.parseMarkedInline(element, "code");

      case "sub":
        return this.parseMarkedInline(element, "subscript");

      case "sup":
        return this.parseMarkedInline(element, "superscript");

      case "br":
        return {
          type: "hardBreak",
          id: generateId(),
        };

      case "span":
        const className = element.getAttribute?.("class") || "";
        if (className.includes("highlight") || className.includes("mark")) {
          return this.parseMarkedInline(element, "highlight");
        }
        const content = this.parseInlineContent(element);
        return content.length > 0 ? content[0] : null;

      default:
        const inlineContent = this.parseInlineContent(element);
        return inlineContent.length > 0 ? inlineContent[0] : null;
    }
  }

  private parseHyperlink(element: Element): HyperlinkNode {
    const href = element.getAttribute?.("href") || "";
    const title = element.getAttribute?.("title") || undefined;
    const children = this.parseInlineContent(element);

    return createHyperlinkNode(
      this.resolveUrl(href),
      children,
      { title }
    );
  }

  private parseMarkedInline(element: Element, markType: TextMark["type"]): TextNode {
    const children = this.parseInlineContent(element);
    
    const text = children
      .map(c => c.type === "text" ? c.text : "")
      .join("");

    return createTextNode(text, [{ type: markType }]);
  }

  private mergeAdjacentTextNodes(inlines: InlineNode[]): InlineNode[] {
    if (inlines.length <= 1) return inlines;

    const result: InlineNode[] = [];
    let currentText: TextNode | null = null;

    for (const inline of inlines) {
      if (inline.type === "text") {
        if (currentText) {
          const mergedMarks = this.mergeMarks(currentText.marks, (inline as TextNode).marks);
          currentText = {
            ...currentText,
            text: currentText.text + (inline as TextNode).text,
            marks: mergedMarks,
          };
        } else {
          currentText = inline as TextNode;
        }
      } else {
        if (currentText) {
          result.push(currentText);
          currentText = null;
        }
        result.push(inline);
      }
    }

    if (currentText) {
      result.push(currentText);
    }

    return result;
  }

  private mergeMarks(
    marks1?: TextMark[], 
    marks2?: TextMark[]
  ): TextMark[] | undefined {
    if (!marks1) return marks2;
    if (!marks2) return marks1;
    return [...marks1, ...marks2];
  }

  private resolveUrl(url: string): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    if (this.options.baseUrl && url.startsWith("//")) {
      return "https:" + url;
    }
    return url;
  }
}
