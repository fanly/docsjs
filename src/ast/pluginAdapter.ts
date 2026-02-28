/**
 * Plugin Adapter for AST Compatibility
 * 
 * Provides backward compatibility for existing plugins while enabling
 * new AST-aware plugin capabilities.
 * 
 * Strategy:
 * - Legacy plugins output HTML strings
 * - New plugins output AST nodes or transform AST
 * - Adapter converts between the two paradigms
 */

import type JSZip from "jszip";
import type { 
  DocumentNode, 
  BlockNode, 
  InlineNode, 
  ParagraphNode,
  ASTNode,
} from "../ast/types";
import { 
  generateId, 
  createParagraphNode, 
  createTextNode,
  walkAST,
} from "../ast/utils";
import type { 
  DocxPlugin, 
  PluginContext, 
  PluginConfig, 
  ParagraphParseResult,
  RunParseResult,
  TableParseResult,
} from "../plugins/base";

// ============================================================================
// LEGACY COMPATIBILITY TYPES
// ============================================================================

/**
 * Legacy plugin output (HTML string)
 */
export type LegacyPluginOutput = string;

/**
 * New plugin output (AST node)
 */
export type ASTPluginOutput = ASTNode | ASTNode[];

/**
 * Hybrid plugin output (either)
 */
export type HybridPluginOutput = LegacyPluginOutput | ASTPluginOutput;

/**
 * Extended plugin interface for AST support
 */
export interface ASTAwarePlugin extends DocxPlugin {
  /** Whether this plugin outputs AST nodes instead of HTML */
  readonly outputsAST?: boolean;
  
  /** Parse paragraph and return AST nodes */
  parseParagraphToAST?(element: Element, context: PluginContext): ParagraphASTResult;
  
  /** Transform AST after parsing */
  transformAST?(ast: DocumentNode, context: PluginContext): DocumentNode | Promise<DocumentNode>;
}

export interface ParagraphASTResult {
  nodes: BlockNode[];
  handled: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// LEGACY HTML → AST CONVERTER
// ============================================================================

/**
 * Convert legacy HTML output to AST nodes
 */
export function htmlToASTNodes(html: string): BlockNode[] {
  if (!html || !html.trim()) return [];

  const nodes: BlockNode[] = [];
  
  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");
  const container = doc.body.firstElementChild;
  
  if (!container) return nodes;

  for (const child of Array.from(container.children)) {
    const node = htmlElementToASTNode(child);
    if (node) {
      if (Array.isArray(node)) {
        nodes.push(...node);
      } else {
        nodes.push(node);
      }
    }
  }

  return nodes;
}

/**
 * Convert a single HTML element to AST node
 */
function htmlElementToASTNode(el: Element): BlockNode | BlockNode[] | null {
  const tagName = el.tagName.toLowerCase();
  
  switch (tagName) {
    case "p":
      return createParagraphNode(htmlChildrenToInlines(el));
      
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const level = parseInt(tagName[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
      return {
        type: "heading",
        id: generateId("h"),
        level,
        children: htmlChildrenToInlines(el),
      };
    }
    
    case "ul":
    case "ol": {
      const items = Array.from(el.querySelectorAll(":scope > li"))
        .map((li) => ({
          type: "listItem" as const,
          id: generateId("li"),
          children: [createParagraphNode(htmlChildrenToInlines(li))],
          level: 0,
        }));
      return {
        type: "list",
        id: generateId("list"),
        listType: tagName === "ol" ? "ordered" : "unordered",
        items,
      };
    }
    
    case "table": {
      const rows = Array.from(el.querySelectorAll(":scope > tr, :scope > tbody > tr"))
        .map((tr) => ({
          type: "tableRow" as const,
          id: generateId("tr"),
          cells: Array.from(tr.querySelectorAll(":scope > td, :scope > th"))
            .map((cell) => ({
              type: "tableCell" as const,
              id: generateId("tc"),
              children: [createParagraphNode(htmlChildrenToInlines(cell))],
              isHeader: cell.tagName.toLowerCase() === "th",
              colspan: cell.colSpan > 1 ? cell.colSpan : undefined,
              rowspan: cell.rowSpan > 1 ? cell.rowSpan : undefined,
            })),
        }));
      return {
        type: "table",
        id: generateId("tbl"),
        rows,
      };
    }
    
    case "figure": {
      const img = el.querySelector("img");
      const caption = el.querySelector("figcaption");
      
      if (img) {
        return {
          type: "figure",
          id: generateId("fig"),
          content: {
            type: "image",
            id: generateId("img"),
            src: img.getAttribute("src") ?? "",
            alt: img.getAttribute("alt") ?? undefined,
            title: img.getAttribute("title") ?? undefined,
          },
          caption: caption ? {
            type: "figcaption",
            id: generateId("caption"),
            children: htmlChildrenToInlines(caption),
          } : undefined,
        };
      }
      return null;
    }
    
    case "pre": {
      const code = el.querySelector("code");
      return {
        type: "codeBlock",
        id: generateId("code"),
        code: code?.textContent ?? el.textContent ?? "",
        language: code?.className.replace(/^language-/, "") || undefined,
      };
    }
    
    case "blockquote": {
      const children: BlockNode[] = [];
      for (const child of Array.from(el.children)) {
        const node = htmlElementToASTNode(child);
        if (node) {
          if (Array.isArray(node)) {
            children.push(...node);
          } else {
            children.push(node);
          }
        }
      }
      return {
        type: "blockquote",
        id: generateId("quote"),
        children,
        attribution: el.getAttribute("cite") ?? undefined,
      };
    }
    
    case "hr":
      return {
        type: "divider",
        id: generateId("hr"),
      };
    
    case "span": {
      // Inline span - wrap in paragraph
      const dataAttrs = extractDataAttrs(el);
      if (Object.keys(dataAttrs).length > 0) {
        // This is a semantic marker span
        return createParagraphNode([
          {
            type: "customInline",
            id: generateId("custom"),
            customType: "marker",
            data: dataAttrs,
            text: el.textContent ?? undefined,
          },
        ]);
      }
      return createParagraphNode(htmlChildrenToInlines(el));
    }
    
    default:
      // For unknown elements, try to extract content
      if (el.children.length > 0) {
        const nodes: BlockNode[] = [];
        for (const child of Array.from(el.children)) {
          const node = htmlElementToASTNode(child);
          if (node) {
            if (Array.isArray(node)) {
              nodes.push(...node);
            } else {
              nodes.push(node);
            }
          }
        }
        return nodes.length > 0 ? nodes : null;
      }
      return createParagraphNode(htmlChildrenToInlines(el));
  }
}

/**
 * Convert HTML element children to inline nodes
 */
function htmlChildrenToInlines(el: Element): InlineNode[] {
  const inlines: InlineNode[] = [];
  
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        inlines.push(createTextNode(text));
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const inline = htmlElementToInlineNode(child as Element);
      if (inline) {
        if (Array.isArray(inline)) {
          inlines.push(...inline);
        } else {
          inlines.push(inline);
        }
      }
    }
  }
  
  return inlines;
}

/**
 * Convert HTML element to inline node
 */
function htmlElementToInlineNode(el: Element): InlineNode | InlineNode[] | null {
  const tagName = el.tagName.toLowerCase();
  
  switch (tagName) {
    case "strong":
    case "b":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "bold" });
      
    case "em":
    case "i":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "italic" });
      
    case "u":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "underline" });
      
    case "s":
    case "del":
    case "strike":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "strikethrough" });
      
    case "code":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "code" });
      
    case "sub":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "subscript" });
      
    case "sup":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "superscript" });
      
    case "mark":
      return wrapInlinesWithMark(htmlChildrenToInlines(el), { type: "highlight" });
      
    case "a": {
      const href = el.getAttribute("href") ?? "";
      return {
        type: "hyperlink",
        id: generateId("a"),
        href,
        children: htmlChildrenToInlines(el),
        title: el.getAttribute("title") ?? undefined,
        target: el.getAttribute("target") as "_blank" | "_self" | undefined,
      };
    }
    
    case "img":
      return {
        type: "image",
        id: generateId("img"),
        src: el.getAttribute("src") ?? "",
        alt: el.getAttribute("alt") ?? undefined,
        title: el.getAttribute("title") ?? undefined,
      };
    
    case "br":
      return { type: "hardBreak", id: generateId("br") };
    
    case "span": {
      const dataAttrs = extractDataAttrs(el);
      if (Object.keys(dataAttrs).length > 0) {
        return {
          type: "customInline",
          id: generateId("custom"),
          customType: "marker",
          data: dataAttrs,
          text: el.textContent ?? undefined,
        };
      }
      return htmlChildrenToInlines(el);
    }
    
    default:
      return htmlChildrenToInlines(el);
  }
}

/**
 * Wrap inline nodes with a text mark
 */
function wrapInlinesWithMark(inlines: InlineNode[], mark: { type: string }): InlineNode[] {
  return inlines.map((inline) => {
    if (inline.type === "text") {
      return {
        ...inline,
        marks: [...(inline.marks ?? []), mark],
      };
    }
    return inline;
  });
}

/**
 * Extract data attributes from element
 */
function extractDataAttrs(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith("data-")) {
      attrs[attr.name.slice(5)] = attr.value;
    }
  }
  return attrs;
}

// ============================================================================
// PLUGIN ADAPTER
// ============================================================================

/**
 * Adapter that wraps legacy plugins to work with AST pipeline
 */
export class PluginASTAdapter {
  private legacyPlugins: DocxPlugin[] = [];
  private astPlugins: ASTAwarePlugin[] = [];
  
  /**
   * Register a plugin (legacy or AST-aware)
   */
  register(plugin: DocxPlugin | ASTAwarePlugin): void {
    if ("outputsAST" in plugin && plugin.outputsAST) {
      this.astPlugins.push(plugin as ASTAwarePlugin);
    } else {
      this.legacyPlugins.push(plugin);
    }
  }
  
  /**
   * Transform AST using all registered plugins
   */
  async transformAST(ast: DocumentNode, context: PluginContext): Promise<DocumentNode> {
    let result = ast;
    
    // Apply AST-aware plugins first
    for (const plugin of this.astPlugins) {
      if (plugin.transformAST) {
        result = await plugin.transformAST(result, context);
      }
    }
    
    // Apply legacy plugins via HTML round-trip
    // This is a compatibility layer - not ideal but maintains backward compatibility
    result = await this.applyLegacyPluginsViaHTML(result, context);
    
    return result;
  }
  
  /**
   * Apply legacy plugins via HTML round-trip
   * (Converts AST → HTML → applies plugin → converts back to AST)
   */
  private async applyLegacyPluginsViaHTML(
    ast: DocumentNode, 
    _context: PluginContext
  ): Promise<DocumentNode> {
    // For now, return AST unchanged
    // Full implementation would:
    // 1. Render AST to HTML
    // 2. Apply legacy plugins to HTML
    // 3. Parse HTML back to AST
    
    // This is a placeholder - the full implementation would require
    // the HTML renderer to be available here
    
    return ast;
  }
  
  /**
   * Check if any plugins are registered
   */
  hasPlugins(): boolean {
    return this.legacyPlugins.length > 0 || this.astPlugins.length > 0;
  }
  
  /**
   * Get all registered plugins
   */
  getAllPlugins(): (DocxPlugin | ASTAwarePlugin)[] {
    return [...this.legacyPlugins, ...this.astPlugins];
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { htmlToASTNodes };
