/**
 * Transformation Engine
 * 
 * A decoupled transformation engine that coordinates parsers and renderers.
 * This is the core of the platform, connecting input formats to output formats.
 */

import type { DocumentNode } from "../ast/types";
import type { IParser, ParseOptions, ParseResult, ParserFactory } from "../parsers/interface";
import type { IRenderer, RenderOptions, RenderResult, RendererFactory } from "../renderers/interface";

export interface TransformationInput {
  /** Raw input data */
  data: string | ArrayBuffer | Uint8Array;
  /** Input format (docx, html, markdown, etc.) */
  format: string;
  /** Original filename (for type detection) */
  filename?: string;
}

export interface TransformationOutput {
  /** Rendered output */
  output: string;
  /** Output format */
  format: string;
  /** Processing metadata */
  metadata: TransformationMetadata;
}

export interface TransformationMetadata {
  /** Total processing time in milliseconds */
  totalTimeMs: number;
  /** Parse time in milliseconds */
  parseTimeMs: number;
  /** Render time in milliseconds */
  renderTimeMs: number;
  /** Input size in bytes */
  inputSizeBytes: number;
  /** Output size in bytes */
  outputSizeBytes: number;
  /** AST node count */
  nodeCount: number;
  /** Any warnings during processing */
  warnings: string[];
  /** Processing profile used */
  profileId?: string;
}

/**
 * Configuration for the transformation engine
 */
export interface TransformationConfig {
  /** Enable debugging output */
  debug?: boolean;
  /** Enable validation */
  validateInput?: boolean;
  /** Enable validation */
  validateOutput?: boolean;
  /** Default input format if not specified */
  defaultInputFormat?: string;
  /** Default output format if not specified */
  defaultOutputFormat?: string;
}

/**
 * The main transformation engine class
 * Coordinates parsing and rendering in a decoupled manner
 */
export class TransformationEngine {
  private parserFactory: ParserFactory;
  private rendererFactory: RendererFactory;
  private config: TransformationConfig;

  constructor(
    parserFactory: ParserFactory,
    rendererFactory: RendererFactory,
    config?: Partial<TransformationConfig>
  ) {
    this.parserFactory = parserFactory;
    this.rendererFactory = rendererFactory;
    this.config = {
      debug: false,
      validateInput: true,
      validateOutput: true,
      ...config,
    };
  }

  /**
   * Transform input to output using specified formats
   */
  async transform(
    input: TransformationInput,
    outputFormat: string,
    options?: {
      parseOptions?: ParseOptions;
      renderOptions?: RenderOptions;
      profileId?: string;
    }
  ): Promise<TransformationOutput> {
    const startTime = Date.now();
    const warnings: string[] = [];

    // Determine input format
    const inputFormat = input.format || this.detectFormat(input);

    if (this.config.debug) {
      console.log(`[TransformationEngine] Input format: ${inputFormat}, Output format: ${outputFormat}`);
    }

    // Get parser
    const parser = this.parserFactory.createParser(inputFormat);
    if (!parser) {
      throw new Error(`No parser available for format: ${inputFormat}`);
    }

    // Validate input if enabled
    if (this.config.validateInput) {
      const validation = parser.validate(input.data);
      if (!validation.valid) {
        throw new Error(`Invalid input: ${validation.error}`);
      }
    }

    // Parse
    let parseResult: ParseResult;
    let ast: DocumentNode;
    
    const parseStartTime = Date.now();
    try {
      parseResult = await parser.parse(input.data as string);
      ast = parseResult.ast;
    } catch (error) {
      throw new Error(`Parsing failed: ${error instanceof Error ? error.message : error}`);
    }
    const parseTimeMs = Date.now() - parseStartTime;

    // Collect parse warnings
    if (parseResult.report.warnings) {
      warnings.push(...parseResult.report.warnings);
    }

    // Get renderer
    const renderer = this.rendererFactory.createRenderer(outputFormat);
    if (!renderer) {
      throw new Error(`No renderer available for format: ${outputFormat}`);
    }

    // Validate AST if enabled
    if (this.config.validateOutput) {
      const validation = renderer.validate(ast);
      if (!validation.valid) {
        throw new Error(`Invalid AST: ${validation.error}`);
      }
    }

    // Render
    const renderStartTime = Date.now();
    let renderResult: RenderResult;
    
    try {
      renderResult = renderer.render(ast, options?.renderOptions);
    } catch (error) {
      throw new Error(`Rendering failed: ${error instanceof Error ? error.message : error}`);
    }
    const renderTimeMs = Date.now() - renderStartTime;

    const totalTimeMs = Date.now() - startTime;

    if (this.config.debug) {
      console.log(`[TransformationEngine] Complete in ${totalTimeMs}ms`);
    }

    return {
      output: renderResult.output,
      format: outputFormat,
      metadata: {
        totalTimeMs,
        parseTimeMs,
        renderTimeMs,
        inputSizeBytes: parseResult.report.byteSize,
        outputSizeBytes: new TextEncoder().encode(renderResult.output).length,
        nodeCount: renderResult.metadata.nodeCount,
        warnings,
        profileId: options?.profileId,
      },
    };
  }

  /**
   * Detect input format from filename or data
   */
  private detectFormat(input: TransformationInput): string {
    // Check filename first
    if (input.filename) {
      const ext = input.filename.split(".").pop()?.toLowerCase();
      if (ext) {
        const formatMap: Record<string, string> = {
          docx: "docx",
          html: "html",
          htm: "html",
          md: "markdown",
          markdown: "markdown",
          json: "json",
        };
        if (formatMap[ext]) {
          return formatMap[ext];
        }
      }
    }

    // Check data content
    if (typeof input.data === "string") {
      const trimmed = input.data.trim();
      if (trimmed.startsWith("<")) {
        return "html";
      }
      if (trimmed.startsWith("#") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return "markdown";
      }
      if (trimmed.startsWith("{")) {
        return "json";
      }
    }

    return this.config.defaultInputFormat || "unknown";
  }

  /**
   * Get supported input formats
   */
  getSupportedInputFormats(): string[] {
    return this.parserFactory.getSupportedFormats();
  }

  /**
   * Get supported output formats
   */
  getSupportedOutputFormats(): string[] {
    return this.rendererFactory.getSupportedFormats();
  }

  /**
   * Update configuration
   */
  configure(config: Partial<TransformationConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Create a default transformation engine with built-in parsers and renderers
 */
export async function createDefaultTransformationEngine(): Promise<TransformationEngine> {
  // Import built-in implementations
  const { DocxParser } = await import("../parsers/docx/parser");
  const { HtmlParser } = await import("../parsers/html/parser");
  const { HtmlRenderer } = await import("../renderers/html/renderer");
  const { MarkdownRenderer } = await import("../renderers/markdown/renderer");

  // Create parser factory
  const parserFactory: ParserFactory = {
    createParser(format: string) {
      switch (format) {
        case "docx":
          return new DocxParser();
        case "html":
          return new HtmlParser();
        default:
          return null;
      }
    },
    getSupportedFormats() {
      return ["docx", "html"];
    },
    registerParser(format: string, parser: IParser) {
      // Could be extended to support custom parsers
    },
  };

  // Create renderer factory
  const rendererFactory: RendererFactory = {
    createRenderer(format: string) {
      switch (format) {
        case "html":
          return new HtmlRenderer();
        case "markdown":
          return new MarkdownRenderer();
        default:
          return null;
      }
    },
    getSupportedFormats() {
      return ["html", "markdown"];
    },
    registerRenderer(format: string, renderer: IRenderer) {
      // Could be extended to support custom renderers
    },
  };

  return new TransformationEngine(parserFactory, rendererFactory);
}
