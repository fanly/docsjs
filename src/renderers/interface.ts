/**
 * Renderer Interface
 * 
 * Defines the contract for all document renderers.
 * Each renderer converts DocumentAST to a specific output format.
 */

import type { DocumentNode } from "../ast/types";

export interface RenderOptions {
  /** Render mode (fidelity, semantic, strict) */
  mode?: "fidelity" | "semantic" | "strict";
  /** Include semantic data attributes */
  includeDataAttrs?: boolean;
  /** Wrap output in full document */
  wrapAsDocument?: boolean;
  /** Custom options based on renderer */
  [key: string]: unknown;
}

export interface RenderResult {
  /** The rendered output */
  output: string;
  /** Rendering metadata */
  metadata: RenderMetadata;
}

export interface RenderMetadata {
  /** Number of AST nodes processed */
  nodeCount: number;
  /** Number of images in output */
  imageCount: number;
  /** Number of links in output */
  linkCount: number;
  /** Time taken to render in milliseconds */
  renderTimeMs?: number;
}

/**
 * Base interface for all renderers
 */
export interface IRenderer<T extends RenderOptions = RenderOptions> {
  /**
   * Render AST to output format
   */
  render(ast: DocumentNode, options?: Partial<T>): RenderResult;
  
  /**
   * Get the supported output format
   */
  getSupportedFormat(): string;
  
  /**
   * Validate AST before rendering
   */
  validate(ast: DocumentNode): { valid: boolean; error?: string };
}

/**
 * Renderer factory for creating renderers by format
 */
export interface RendererFactory {
  /**
   * Create a renderer for the given format
   */
  createRenderer(format: string): IRenderer | null;
  
  /**
   * Get list of supported formats
   */
  getSupportedFormats(): string[];
  
  /**
   * Register a custom renderer
   */
  registerRenderer(format: string, renderer: IRenderer): void;
}

/**
 * Supported output formats
 */
export type OutputFormat = "html" | "markdown" | "json" | "tiptap" | "slate" | "prosemirror";

/**
 * Default render options by format
 */
export const DEFAULT_RENDER_OPTIONS: Record<OutputFormat, RenderOptions> = {
  html: {
    mode: "fidelity",
    includeDataAttrs: true,
    wrapAsDocument: false,
  },
  markdown: {
    mode: "fidelity",
    includeDataAttrs: false,
    wrapAsDocument: false,
  },
  json: {
    mode: "semantic",
    wrapAsDocument: false,
  },
  tiptap: {
    mode: "semantic",
    wrapAsDocument: false,
  },
  slate: {
    mode: "semantic",
    wrapAsDocument: false,
  },
  prosemirror: {
    mode: "semantic",
    wrapAsDocument: false,
  },
};
