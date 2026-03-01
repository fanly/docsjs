/**
 * Markdown Renderer
 * 
 * Renders DocumentAST to Markdown output.
 * 
 * Design Principles:
 * 1. Pure rendering - no modification to AST
 * 2. GitHub Flavored Markdown (GFM) by default
 * 3. Semantic fidelity preservation
 * 4. Configurable output options
 */

import type {
  DocumentNode,
  SectionNode,
  BlockNode,
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
  TextMarkType,
  MathNode,
  FootnoteRefNode,
  BlockquoteNode,
  CodeBlockNode,
  ThematicBreakNode,
  CustomBlockNode,
  InlineNode,
  AuxiliaryContent,
  FigureNode,
  CustomInlineNode,
} from "../../ast/types";

// ============================================================================
// TYPES
// ============================================================================

export interface MarkdownRenderOptions {
  /** Render mode - affects output style */
  mode: "gfm" | "standard" | "strict";
  
  /** Include frontmatter YAML block */
  includeFrontmatter: boolean;
  
  /** Include table of contents */
  includeTOC: boolean;
  
  /** Maximum heading level to include in TOC */
  tocMaxLevel: number;
  
  /** Image handling */
  imageHandling: "reference" | "placeholder" | "base64";
  
  /** Math rendering format */
  mathFormat: "katex" | "latex" | "text";
  
  /** Code block language */
  codeLanguage: string;
  
  /** Use thematic breaks instead of multiple newlines */
  useThematicBreaks: boolean;
  
  /** Preserve soft breaks in paragraphs */
  preserveSoftBreaks: boolean;
}

export interface MarkdownRenderResult {
  markdown: string;
  metadata: {
    nodeCount: number;
    imageCount: number;
    linkCount: number;
    tocGenerated: boolean;
  };
}

const DEFAULT_OPTIONS: MarkdownRenderOptions = {
  mode: "gfm",
  includeFrontmatter: false,
  includeTOC: false,
  tocMaxLevel: 3,
  imageHandling: "reference",
  mathFormat: "katex",
  codeLanguage: "",
  useThematicBreaks: true,
  preserveSoftBreaks: true,
};

// ============================================================================
// MARKDOWN RENDERER CLASS
// ============================================================================

export class MarkdownRenderer {
  private options: MarkdownRenderOptions;
  private nodeCount = 0;
  private imageCount = 0;
  private linkCount = 0;
  private headingItems: { level: number; text: string; anchor: string }[] = [];

  constructor(options: Partial<MarkdownRenderOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  // ---- PUBLIC API ----

  render(ast: DocumentNode): MarkdownRenderResult {
    this.nodeCount = 0;
    this.imageCount = 0;
    this.linkCount = 0;
    this.headingItems = [];

    let markdown = this.renderDocument(ast);

    // Add table of contents if requested
    if (this.options.includeTOC && this.headingItems.length > 0) {
      const toc = this.generateTOC();
      markdown = toc + "\n\n" + markdown;
    }

    return {
      markdown,
      metadata: {
        nodeCount: this.nodeCount,
        imageCount: this.imageCount,
        linkCount: this.linkCount,
        tocGenerated: this.options.includeTOC,
      },
    };
  }

  // ---- DOCUMENT RENDERING ----

  private renderDocument(doc: DocumentNode): string {
    const parts: string[] = [];

    // Add frontmatter if requested
    if (this.options.includeFrontmatter) {
      parts.push(this.renderFrontmatter(doc));
    }

    for (const section of doc.children) {
      const rendered = this.renderSection(section);
      if (rendered) parts.push(rendered);
    }

    // Render auxiliary sections (footnotes, etc.)
    if (doc.auxiliary) {
      const auxMarkdown = this.renderAuxiliarySections(doc.auxiliary);
      if (auxMarkdown) parts.push(auxMarkdown);
    }

    return parts.join("\n\n");
  }

  private renderFrontmatter(doc: DocumentNode): string {
    const meta: Record<string, string> = {};
    
    if (doc.properties?.title) {
      meta.title = doc.properties.title;
    }
    if (doc.properties?.author) {
      meta.author = doc.properties.author;
    }
    if (doc.properties?.subject) {
      meta.subject = doc.properties.subject;
    }
    if (doc.properties?.keywords?.length) {
      meta.keywords = doc.properties.keywords.join(", ");
    }

    if (Object.keys(meta).length === 0) {
      return "";
    }

    const yaml = Object.entries(meta)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n");

    return `---\n${yaml}\n---\n`;
  }

  private renderSection(section: SectionNode): string {
    const parts: string[] = [];

    for (const block of section.children) {
      const markdown = this.renderBlock(block);
      if (markdown) parts.push(markdown);
    }

    return parts.join("\n\n");
  }

  // ---- BLOCK RENDERING ----

  private renderBlock(block: BlockNode): string {
    this.nodeCount++;

    switch (block.type) {
      case "paragraph":
        return this.renderParagraph(block as ParagraphNode);
      case "heading":
        return this.renderHeading(block as HeadingNode);
      case "list":
        return this.renderList(block as ListNode);
      case "table":
        return this.renderTable(block as TableNode);
      case "figure":
        return this.renderFigure(block as FigureNode);
      case "codeBlock":
        return this.renderCodeBlock(block as CodeBlockNode);
      case "blockquote":
        return this.renderBlockquote(block as BlockquoteNode);
      case "thematicBreak":
        return this.renderThematicBreak();
      case "customBlock":
        return this.renderCustomBlock(block as CustomBlockNode);
      default:
        return "";
    }
  }

  private renderParagraph(p: ParagraphNode): string {
    return this.renderInlines(p.children);
  }

  private renderHeading(h: HeadingNode): string {
    const prefix = "#".repeat(h.level);
    const text = this.renderInlines(h.children);
    
    // Track for TOC
    const anchor = this.generateAnchor(text);
    this.headingItems.push({ level: h.level, text, anchor });

    return `${prefix} ${text}`;
  }

  private renderList(list: ListNode): string {
    const items = list.items.map((item, index) => this.renderListItem(item, index, list.listType));
    return items.join("\n");
  }

  private renderListItem(item: ListItemNode, index: number, listType?: string): string {
    const prefix = listType === "ordered" 
      ? `${item.number || index + 1}.` 
      : "-";
    
    const content = item.children.map((b) => this.renderBlock(b)).join("\n");
    
    // Handle nested items with indentation
    if (item.children.some(c => c.type === "list")) {
      const lines = content.split("\n");
      return `${prefix} ${lines[0]}\n${lines.slice(1).map(l => "  " + l).join("\n")}`;
    }
    
    return `${prefix} ${content}`;
  }

  private renderTable(table: TableNode): string {
    if (!table.rows || table.rows.length === 0) return "";

    const parts: string[] = [];
    
    // Header row
    if (table.rows[0]) {
      const headerCells = table.rows[0].cells.map(cell => this.renderTableCellContent(cell));
      parts.push("| " + headerCells.join(" | ") + " |");
      
      // Separator row
      const separators = headerCells.map(() => "---");
      parts.push("| " + separators.join(" | ") + " |");
    }
    
    // Body rows
    for (let i = 1; i < table.rows.length; i++) {
      const row = table.rows[i];
      const cells = row.cells.map(cell => this.renderTableCellContent(cell));
      parts.push("| " + cells.join(" | ") + " |");
    }

    return parts.join("\n");
  }

  private renderTableCellContent(cell: TableCellNode): string {
    const content = cell.children.map((block) => {
      if (block.type === "paragraph") {
        return this.renderInlines((block as ParagraphNode).children);
      }
      return this.renderBlock(block);
    }).join(" ");
    
    return content || " ";
  }

  private renderFigure(figure: FigureNode): string {
    // Figure content is a single node (image, video, audio, or custom)
    if (figure.content) {
      switch (figure.content.type) {
        case "image":
          return this.renderImage(figure.content as ImageNode);
        case "video":
        case "audio":
          return `<!-- ${figure.content.type} embedded -->`;
        case "customBlock":
          return this.renderCustomBlock(figure.content as CustomBlockNode);
      }
    }
    
    // Fallback: render caption if exists
    if (figure.caption) {
      return this.renderInlines(figure.caption.children);
    }
    
    return "";
  }

  private renderCodeBlock(code: CodeBlockNode): string {
    const lang = code.language || this.options.codeLanguage || "";
    const fences = "```";
    
    return `${fences}${lang}\n${code.code || ""}\n${fences}`;
  }

  private renderBlockquote(block: BlockquoteNode): string {
    const content = block.children.map((b) => this.renderBlock(b)).join("\n");
    const lines = content.split("\n");
    return lines.map(line => `> ${line}`).join("\n");
  }

  private renderThematicBreak(): string {
    return this.options.useThematicBreaks ? "---" : "";
  }

  private renderCustomBlock(block: CustomBlockNode): string {
    // Render custom blocks as HTML comments or skip
    return `<!-- Custom block: ${block.customType} -->`;
  }

  // ---- INLINE RENDERING ----

  private renderInlines(nodes: InlineNode[]): string {
    return nodes.map(node => this.renderInline(node)).join("");
  }

  private renderInline(node: InlineNode): string {
    switch (node.type) {
      case "text":
        return this.renderText(node as TextNode);
      case "hyperlink":
        return this.renderHyperlink(node as HyperlinkNode);
      case "image":
        return this.renderImage(node as ImageNode);
      case "math":
        return this.renderMath(node as MathNode);
      case "footnoteRef":
        return this.renderFootnoteRef(node as FootnoteRefNode);
      case "customInline":
        return this.renderCustomInline(node as CustomInlineNode);
      case "hardBreak":
        return "\n";
      case "softBreak":
        return this.options.preserveSoftBreaks ? " " : "";
      default:
        return "";
    }
  }

  private renderText(text: TextNode): string {
    let content = text.text || "";
    
    // Process marks
    if (text.marks) {
      for (const mark of text.marks) {
        content = this.applyMark(content, mark);
      }
    }
    
    return content;
  }

  private applyMark(content: string, mark: TextMark): string {
    switch (mark.type) {
      case "bold":
        return `**${content}**`;
      case "italic":
        return `*${content}*`;
      case "underline":
        return `_${content}_`; // Markdown uses underscore for underline
      case "strikethrough":
        return `~~${content}~~`;
      case "code":
        return `\`${content}\``;
      case "subscript":
        return `<sub>${content}</sub>`;
      case "superscript":
        return `<sup>${content}</sup>`;
      case "highlight":
        return `==${content}==`;
      case "smallCaps":
        return `<small>${content.toUpperCase()}</small>`;
      default:
        return content;
    }
  }

  private renderHyperlink(link: HyperlinkNode): string {
    this.linkCount++;
    const text = this.renderInlines(link.children);
    const href = link.href || "";
    const title = link.title ? ` "${link.title}"` : "";
    
    return `[${text}](${href}${title})`;
  }

  private renderImage(image: ImageNode): string {
    this.imageCount++;
    const alt = image.alt || "";
    const src = image.src || "";
    
    switch (this.options.imageHandling) {
      case "placeholder":
        return `![${alt}](${src})`;
      case "base64":
        return `![${alt}](${src})`;
      case "reference":
      default:
        return `![${alt}](${src})`;
    }
  }

  private renderMath(math: MathNode): string {
    switch (this.options.mathFormat) {
      case "katex":
        return `$${math.source}$`;
      case "latex":
        return `$${math.source}$`;
      case "text":
        return `[Math: ${math.source}]`;
      default:
        return `$${math.source}$`;
    }
  }

  private renderFootnoteRef(ref: FootnoteRefNode): string {
    return `[^${ref.footnoteId}]`;
  }

  private renderCustomInline(node: CustomInlineNode): string {
    return `<!-- ${node.customType}: ${node.text || ""} -->`;
  }

  // ---- AUXILIARY RENDERING ----

  private renderAuxiliarySections(aux: AuxiliaryContent): string {
    const parts: string[] = [];

    // Footnotes
    if (aux.footnotes && aux.footnotes.size > 0) {
      parts.push("## References\n");
      const footnoteArray = Array.from(aux.footnotes.entries());
      for (const [id, fn] of footnoteArray) {
        const content = fn.children.map(b => this.renderBlock(b)).join("\n");
        parts.push(`[^${id}]: ${content}`);
      }
    }

    return parts.join("\n\n");
  }

  // ---- UTILITIES ----

  private generateTOC(): string {
    const items = this.headingItems.filter(h => h.level <= this.options.tocMaxLevel);
    if (items.length === 0) return "";

    const lines: string[] = ["## Table of Contents\n"];
    
    for (const item of items) {
      const indent = "  ".repeat(item.level - 1);
      lines.push(`${indent}- [${item.text}](#${item.anchor})`);
    }

    return lines.join("\n");
  }

  private generateAnchor(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
}
