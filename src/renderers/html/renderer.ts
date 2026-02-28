/**
 * HTML Renderer
 * 
 * Renders DocumentAST to HTML output.
 * 
 * Design Principles:
 * 1. Pure rendering - no modification to AST
 * 2. Configurable output style
 * 3. Fidelity-first with optional sanitization
 * 4. Extensible via render plugins
 */

import type {
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
  ImageNode,
  HyperlinkNode,
  TextNode,
  TextMark,
  MathNode,
  FootnoteRefNode,
  EndnoteRefNode,
  CommentRefNode,
  BookmarkNode,
  HardBreakNode,
  FigureNode,
  CodeBlockNode,
  BlockquoteNode,
  DividerNode,
  ThematicBreakNode,
  CustomBlockNode,
  CustomInlineNode,
  ParagraphSemantics,
  AuxiliaryContent,
  FootnoteNode,
  EndnoteNode,
  CommentNode,
} from "../../ast/types";

// ============================================================================
// TYPES
// ============================================================================

export interface HtmlRenderOptions {
  /** Render mode */
  mode: "fidelity" | "semantic" | "strict";
  
  /** Include data attributes for semantic info */
  includeDataAttrs: boolean;
  
  /** Include paragraph indices */
  includeParagraphIndex: boolean;
  
  /** Wrap in full HTML document */
  wrapAsDocument: boolean;
  
  /** Image handling */
  imageHandling: "base64" | "reference" | "placeholder";
  
  /** Math rendering format */
  mathFormat: "mathml" | "katex" | "linear";
  
  /** Custom renderers for custom node types */
  customRenderers?: Map<string, CustomRenderer>;
}

export type CustomRenderer = (node: CustomBlockNode | CustomInlineNode, ctx: RenderContext) => string;

export interface RenderContext {
  options: HtmlRenderOptions;
  auxiliary: AuxiliaryContent | undefined;
  paragraphIndex: number;
  resourceResolver?: (src: string) => string;
}

export interface HtmlRenderResult {
  html: string;
  metadata: {
    nodeCount: number;
    imageCount: number;
    linkCount: number;
  };
}

const DEFAULT_OPTIONS: HtmlRenderOptions = {
  mode: "fidelity",
  includeDataAttrs: true,
  includeParagraphIndex: true,
  wrapAsDocument: false,
  imageHandling: "reference",
  mathFormat: "mathml",
};

// ============================================================================
// HTML RENDERER CLASS
// ============================================================================

export class HtmlRenderer {
  private options: HtmlRenderOptions;
  private nodeCount = 0;
  private imageCount = 0;
  private linkCount = 0;

  constructor(options: Partial<HtmlRenderOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // ---- PUBLIC API ----

  render(ast: DocumentNode): HtmlRenderResult {
    this.nodeCount = 0;
    this.imageCount = 0;
    this.linkCount = 0;

    const ctx: RenderContext = {
      options: this.options,
      auxiliary: ast.auxiliary,
      paragraphIndex: 0,
    };

    let html = this.renderDocument(ast, ctx);

    if (this.options.wrapAsDocument) {
      html = this.wrapAsHtmlDocument(html);
    }

    return {
      html,
      metadata: {
        nodeCount: this.nodeCount,
        imageCount: this.imageCount,
        linkCount: this.linkCount,
      },
    };
  }

  // ---- DOCUMENT RENDERING ----

  private renderDocument(doc: DocumentNode, ctx: RenderContext): string {
    const parts: string[] = [];

    for (const section of doc.children) {
      parts.push(this.renderSection(section, ctx));
    }

    // Render auxiliary sections
    if (doc.auxiliary) {
      const auxHtml = this.renderAuxiliarySections(doc.auxiliary, ctx);
      if (auxHtml) parts.push(auxHtml);
    }

    return parts.join("\n");
  }

  private renderSection(section: SectionNode, ctx: RenderContext): string {
    const parts: string[] = [];

    for (const block of section.children) {
      const html = this.renderBlock(block, ctx);
      if (html) parts.push(html);
    }

    return parts.join("\n");
  }

  // ---- BLOCK RENDERING ----

  private renderBlock(block: BlockNode, ctx: RenderContext): string {
    this.nodeCount++;

    switch (block.type) {
      case "paragraph":
        return this.renderParagraph(block, ctx);
      case "heading":
        return this.renderHeading(block, ctx);
      case "list":
        return this.renderList(block, ctx);
      case "table":
        return this.renderTable(block, ctx);
      case "figure":
        return this.renderFigure(block, ctx);
      case "codeBlock":
        return this.renderCodeBlock(block, ctx);
      case "blockquote":
        return this.renderBlockquote(block, ctx);
      case "divider":
        return this.renderDivider(block, ctx);
      case "thematicBreak":
        return this.renderThematicBreak(block, ctx);
      case "customBlock":
        return this.renderCustomBlock(block, ctx);
      default:
        return "";
    }
  }

  private renderParagraph(p: ParagraphNode, ctx: RenderContext): string {
    const attrs = this.collectParagraphAttrs(p, ctx);
    const content = this.renderInlines(p.children, ctx);
    
    ctx.paragraphIndex++;
    
    return `<p${attrs}>${content || "<br/>"}</p>`;
  }

  private renderHeading(h: HeadingNode, ctx: RenderContext): string {
    const tag = `h${h.level}`;
    const attrs = this.collectHeadingAttrs(h, ctx);
    const content = this.renderInlines(h.children, ctx);
    
    return `<${tag}${attrs}>${content}</${tag}>`;
  }

  private renderList(list: ListNode, ctx: RenderContext): string {
    const tag = list.listType === "ordered" ? "ol" : "ul";
    const attrs = this.options.includeDataAttrs 
      ? ` data-list-type="${list.listType}"` 
      : "";
    
    const items = list.items.map((item) => this.renderListItem(item, ctx)).join("\n");
    
    return `<${tag}${attrs}>${items}</${tag}>`;
  }

  private renderListItem(item: ListItemNode, ctx: RenderContext): string {
    const attrs: string[] = [];
    
    if (this.options.includeDataAttrs && item.level > 0) {
      attrs.push(`data-list-level="${item.level}"`);
    }
    if (item.number !== undefined && this.options.includeDataAttrs) {
      attrs.push(`value="${item.number}"`);
    }
    
    const attrStr = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
    const content = item.children.map((b) => this.renderBlock(b, ctx)).join("");
    
    return `<li${attrStr}>${content}</li>`;
  }

  private renderTable(table: TableNode, ctx: RenderContext): string {
    const rows = table.rows.map((row) => this.renderTableRow(row, ctx)).join("\n");
    
    const style = this.options.mode === "fidelity" 
      ? `style="border-collapse:collapse;width:100%;"` 
      : "";
    
    const attrs = this.options.includeDataAttrs 
      ? ` data-table="1" ${style}` 
      : style ? ` ${style}` : "";
    
    return `<table${attrs}>${rows}</table>`;
  }

  private renderTableRow(row: TableRowNode, ctx: RenderContext): string {
    const cells = row.cells.map((cell) => this.renderTableCell(cell, ctx)).join("");
    return `<tr>${cells}</tr>`;
  }

  private renderTableCell(cell: TableCellNode, ctx: RenderContext): string {
    const tag = cell.isHeader ? "th" : "td";
    const attrs: string[] = [];
    
    if (cell.colspan && cell.colspan > 1) {
      attrs.push(`colspan="${cell.colspan}"`);
    }
    if (cell.rowspan && cell.rowspan > 1) {
      attrs.push(`rowspan="${cell.rowspan}"`);
    }
    if (this.options.mode === "fidelity") {
      attrs.push(`style="vertical-align:${cell.valign ?? "top"}"`);
    }
    
    const attrStr = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
    const content = cell.children.map((b) => this.renderBlock(b, ctx)).join("");
    
    return `<${tag}${attrStr}>${content || "<br/>"}</${tag}>`;
  }

  private renderFigure(figure: FigureNode, ctx: RenderContext): string {
    const content = this.renderInline(figure.content as InlineNode, ctx);
    let caption = "";
    
    if (figure.caption) {
      caption = `<figcaption>${this.renderInlines(figure.caption.children, ctx)}</figcaption>`;
    }
    
    return `<figure>${content}${caption}</figure>`;
  }

  private renderCodeBlock(code: CodeBlockNode, _ctx: RenderContext): string {
    const langAttr = code.language ? ` class="language-${code.language}"` : "";
    return `<pre><code${langAttr}>${this.escapeHtml(code.code)}</code></pre>`;
  }

  private renderBlockquote(quote: BlockquoteNode, ctx: RenderContext): string {
    const content = quote.children.map((b) => this.renderBlock(b, ctx)).join("\n");
    const citeAttr = quote.attribution ? ` cite="${this.escapeHtml(quote.attribution)}"` : "";
    
    return `<blockquote${citeAttr}>${content}</blockquote>`;
  }

  private renderDivider(_divider: DividerNode, _ctx: RenderContext): string {
    return "<hr/>";
  }

  private renderThematicBreak(_tb: ThematicBreakNode, _ctx: RenderContext): string {
    return "<hr/>";
  }

  private renderCustomBlock(block: CustomBlockNode, ctx: RenderContext): string {
    const customRenderer = this.options.customRenderers?.get(block.customType);
    if (customRenderer) {
      return customRenderer(block, ctx);
    }
    
    // Default: render as div with data attributes
    const dataAttrs = Object.entries(block.data)
      .map(([k, v]) => `data-${k}="${this.escapeHtml(String(v))}"`)
      .join(" ");
    
    return `<div data-custom-type="${block.customType}" ${dataAttrs}></div>`;
  }

  // ---- INLINE RENDERING ----

  private renderInlines(inlines: InlineNode[], ctx: RenderContext): string {
    return inlines.map((inline) => this.renderInline(inline, ctx)).join("");
  }

  private renderInline(inline: InlineNode, ctx: RenderContext): string {
    this.nodeCount++;

    switch (inline.type) {
      case "text":
        return this.renderText(inline);
      case "hardBreak":
        return "<br/>";
      case "softBreak":
        return "\n";
      case "hyperlink":
        return this.renderHyperlink(inline, ctx);
      case "image":
        return this.renderImage(inline, ctx);
      case "math":
        return this.renderMath(inline, ctx);
      case "footnoteRef":
        return this.renderFootnoteRef(inline, ctx);
      case "endnoteRef":
        return this.renderEndnoteRef(inline, ctx);
      case "commentRef":
        return this.renderCommentRef(inline, ctx);
      case "bookmark":
        return this.renderBookmark(inline);
      case "customInline":
        return this.renderCustomInline(inline, ctx);
      default:
        return "";
    }
  }

  private renderText(text: TextNode): string {
    let content = this.escapeHtml(text.text);
    
    if (text.marks && text.marks.length > 0) {
      content = this.applyMarks(content, text.marks);
    }
    
    return content;
  }

  private applyMarks(content: string, marks: TextMark[]): string {
    let result = content;
    
    for (const mark of marks) {
      switch (mark.type) {
        case "bold":
          result = `<strong>${result}</strong>`;
          break;
        case "italic":
          result = `<em>${result}</em>`;
          break;
        case "underline":
          result = `<u>${result}</u>`;
          break;
        case "strikethrough":
          result = `<s>${result}</s>`;
          break;
        case "code":
          result = `<code>${result}</code>`;
          break;
        case "subscript":
          result = `<sub>${result}</sub>`;
          break;
        case "superscript":
          result = `<sup>${result}</sup>`;
          break;
        case "highlight":
          result = `<mark>${result}</mark>`;
          break;
        default:
          break;
      }
    }
    
    return result;
  }

  private renderHyperlink(link: HyperlinkNode, ctx: RenderContext): string {
    this.linkCount++;
    
    const content = this.renderInlines(link.children, ctx);
    const href = this.escapeHtml(link.href);
    
    const attrs: string[] = [`href="${href}"`];
    
    if (link.target) {
      attrs.push(`target="${link.target}"`);
      if (link.target === "_blank") {
        attrs.push('rel="noopener noreferrer"');
      }
    }
    
    if (link.title) {
      attrs.push(`title="${this.escapeHtml(link.title)}"`);
    }
    
    if (this.options.includeDataAttrs) {
      attrs.push('data-word-hyperlink="1"');
    }
    
    return `<a ${attrs.join(" ")}>${content}</a>`;
  }

  private renderImage(img: ImageNode, ctx: RenderContext): string {
    this.imageCount++;
    
    let src = img.src;
    
    // Resolve resource if needed
    if (src.startsWith("docx:") && ctx.resourceResolver) {
      src = ctx.resourceResolver(src);
    }
    
    const attrs: string[] = [
      `src="${this.escapeHtml(src)}"`,
      `alt="${this.escapeHtml(img.alt ?? "")}"`,
    ];
    
    if (img.title) {
      attrs.push(`title="${this.escapeHtml(img.title)}"`);
    }
    
    // Dimensions
    if (img.dimensions && this.options.mode === "fidelity") {
      const { width, height, unit } = img.dimensions;
      const style: string[] = [];
      
      if (width) style.push(`width:${width}${unit}`);
      if (height) style.push(`height:${height}${unit}`);
      style.push("max-width:100%");
      
      attrs.push(`style="${style.join(";")}"`);
    }
    
    // Positioning (floating)
    if (img.positioning?.type === "floating" && this.options.mode === "fidelity") {
      const anchor = img.positioning.anchor;
      const style: string[] = ["position:absolute"];
      
      if (anchor?.horizontal) {
        style.push(`left:${anchor.horizontal.position}px`);
      }
      if (anchor?.vertical) {
        style.push(`top:${anchor.vertical.position}px`);
      }
      if (anchor?.zIndex !== undefined) {
        style.push(`z-index:${anchor.zIndex}`);
      }
      if (anchor?.wrap === "topAndBottom") {
        style.push("display:block", "clear:both");
      }
      
      attrs.push(`style="${style.join(";")}"`);
      
      if (this.options.includeDataAttrs) {
        attrs.push('data-word-anchor="1"');
        if (anchor?.wrap) {
          attrs.push(`data-word-wrap="${anchor.wrap}"`);
        }
      }
    }
    
    return `<img ${attrs.join(" ")}/>`;
  }

  private renderMath(math: MathNode, _ctx: RenderContext): string {
    if (this.options.mathFormat === "katex") {
      return `<span class="katex">${this.escapeHtml(math.source)}</span>`;
    }
    
    if (this.options.mathFormat === "mathml") {
      // For now, wrap in semantic span - full MathML conversion would be separate
      return `<span data-word-omml="1">${this.escapeHtml(math.source)}</span>`;
    }
    
    // Linear
    return `<span data-math="1">${this.escapeHtml(math.source)}</span>`;
  }

  private renderFootnoteRef(ref: FootnoteRefNode, ctx: RenderContext): string {
    const footnote = ctx.auxiliary?.footnotes?.get(ref.footnoteId);
    const num = footnote?.number ?? ref.number ?? "?";
    
    return `<sup data-word-footnote-ref="${ref.footnoteId}"><a href="#word-footnote-${ref.footnoteId}">[${num}]</a></sup>`;
  }

  private renderEndnoteRef(ref: EndnoteRefNode, ctx: RenderContext): string {
    const endnote = ctx.auxiliary?.endnotes?.get(ref.endnoteId);
    const num = endnote?.number ?? ref.number ?? "?";
    
    return `<sup data-word-endnote-ref="${ref.endnoteId}"><a href="#word-endnote-${ref.endnoteId}">[${num}]</a></sup>`;
  }

  private renderCommentRef(ref: CommentRefNode, _ctx: RenderContext): string {
    if (ref.isRangeStart) {
      return `<span data-word-comment-range-start="${ref.commentId}"></span>`;
    }
    if (ref.isRangeEnd) {
      return `<span data-word-comment-range-end="${ref.commentId}"></span>`;
    }
    
    return `<sup data-word-comment-ref="${ref.commentId}"><a href="#word-comment-${ref.commentId}">[c${ref.commentId}]</a></sup>`;
  }

  private renderBookmark(bookmark: BookmarkNode): string {
    if (bookmark.isRangeStart) {
      return `<span data-word-bookmark-id="${bookmark.id}" data-word-bookmark-name="${this.escapeHtml(bookmark.name)}"></span>`;
    }
    return "";
  }

  private renderCustomInline(inline: CustomInlineNode, ctx: RenderContext): string {
    const customRenderer = this.options.customRenderers?.get(inline.customType);
    if (customRenderer) {
      return customRenderer(inline, ctx);
    }
    
    // Default: render as span with data attributes
    const dataAttrs = Object.entries(inline.data)
      .map(([k, v]) => `data-${k}="${this.escapeHtml(String(v))}"`)
      .join(" ");
    
    return `<span data-custom-type="${inline.customType}" ${dataAttrs}>${inline.text ?? ""}</span>`;
  }

  // ---- AUXILIARY SECTIONS ----

  private renderAuxiliarySections(aux: AuxiliaryContent, ctx: RenderContext): string {
    const parts: string[] = [];
    
    if (aux.footnotes && aux.footnotes.size > 0) {
      parts.push(this.renderFootnotesSection(aux.footnotes, ctx));
    }
    
    if (aux.endnotes && aux.endnotes.size > 0) {
      parts.push(this.renderEndnotesSection(aux.endnotes, ctx));
    }
    
    if (aux.comments && aux.comments.size > 0) {
      parts.push(this.renderCommentsSection(aux.comments, ctx));
    }
    
    return parts.join("\n");
  }

  private renderFootnotesSection(footnotes: Map<string, FootnoteNode>, _ctx: RenderContext): string {
    const items = Array.from(footnotes.values())
      .map((fn) => {
        const content = fn.children.map((b) => this.renderBlock(b, { ..._ctx, paragraphIndex: 0 })).join("");
        return `<li id="word-footnote-${fn.id}" data-word-footnote-id="${fn.id}">${content}</li>`;
      })
      .join("");
    
    return `<section data-word-footnotes="1"><hr/><ol>${items}</ol></section>`;
  }

  private renderEndnotesSection(endnotes: Map<string, EndnoteNode>, _ctx: RenderContext): string {
    const items = Array.from(endnotes.values())
      .map((en) => {
        const content = en.children.map((b) => this.renderBlock(b, { ..._ctx, paragraphIndex: 0 })).join("");
        return `<li id="word-endnote-${en.id}" data-word-endnote-id="${en.id}">${content}</li>`;
      })
      .join("");
    
    return `<section data-word-endnotes="1"><hr/><ol>${items}</ol></section>`;
  }

  private renderCommentsSection(comments: Map<string, CommentNode>, _ctx: RenderContext): string {
    const items = Array.from(comments.values())
      .map((c) => {
        const content = c.children.map((b) => this.renderBlock(b, { ..._ctx, paragraphIndex: 0 })).join("");
        const meta = [c.author ?? "", c.date ?? ""].filter((x) => x).join(" · ");
        const metaHtml = meta ? `<div data-word-comment-meta="1">${this.escapeHtml(meta)}</div>` : "";
        return `<li id="word-comment-${c.id}" data-word-comment-id="${c.id}">${metaHtml}<div>${content}</div></li>`;
      })
      .join("");
    
    return `<section data-word-comments="1"><hr/><ol>${items}</ol></section>`;
  }

  // ---- ATTRIBUTE HELPERS ----

  private collectParagraphAttrs(p: ParagraphNode, ctx: RenderContext): string {
    const attrs: string[] = [];
    
    if (this.options.includeParagraphIndex) {
      attrs.push(`data-word-p-index="${ctx.paragraphIndex}"`);
    }
    
    if (p.styleId && this.options.includeDataAttrs) {
      attrs.push(`data-style-id="${this.escapeHtml(p.styleId)}"`);
    }
    
    if (p.semantics && this.options.mode === "fidelity") {
      const style = this.semanticsToStyle(p.semantics);
      if (style) attrs.push(`style="${style}"`);
    }
    
    return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  }

  private collectHeadingAttrs(h: HeadingNode, _ctx: RenderContext): string {
    const attrs: string[] = [];
    
    if (h.styleId && this.options.includeDataAttrs) {
      attrs.push(`data-style-id="${this.escapeHtml(h.styleId)}"`);
    }
    
    if (h.numbering?.text && this.options.includeDataAttrs) {
      attrs.push(`data-heading-number="${this.escapeHtml(h.numbering.text)}"`);
    }
    
    return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
  }

  private semanticsToStyle(semantics: ParagraphSemantics): string {
    const parts: string[] = [];
    
    if (semantics.alignment) {
      parts.push(`text-align:${semantics.alignment}`);
    }
    
    if (semantics.indent) {
      const { left, right, firstLine, hanging, unit } = semantics.indent;
      if (left) parts.push(`margin-left:${left}${unit}`);
      if (right) parts.push(`margin-right:${right}${unit}`);
      if (firstLine) parts.push(`text-indent:${firstLine}${unit}`);
      if (hanging) parts.push(`text-indent:-${hanging}${unit}`);
    }
    
    if (semantics.spacing) {
      const { before, after, unit } = semantics.spacing;
      if (before) parts.push(`margin-top:${before}${unit}`);
      if (after) parts.push(`margin-bottom:${after}${unit}`);
    }
    
    return parts.join(";");
  }

  // ---- DOCUMENT WRAPPER ----

  private wrapAsHtmlDocument(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
table { border-collapse: collapse; }
td, th { border: 1px solid #ddd; padding: 8px; }
img { max-width: 100%; height: auto; }
</style>
</head>
<body>
${content}
</body>
</html>`;
  }

  // ---- UTILITIES ----

  private escapeHtml(text: string): string {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

// ============================================================================
// CONVENIENCE FUNCTION
// ============================================================================

/**
 * Render DocumentAST to HTML
 */
export function renderASTToHtml(
  ast: DocumentNode,
  options?: Partial<HtmlRenderOptions>
): string {
  const renderer = new HtmlRenderer(options);
  const result = renderer.render(ast);
  return result.html;
}
