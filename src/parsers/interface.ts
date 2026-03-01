/**
 * Parser Interface
 * 
 * Defines the contract for all document parsers.
 * Each parser converts a specific input format to DocumentAST.
 */

import type { DocumentNode } from "../ast/types";

export interface ParseOptions {
  /** Enable plugin pipeline */
  enablePlugins?: boolean;
  /** Extract embedded resources */
  extractResources?: boolean;
  /** Include metadata */
  includeMetadata?: boolean;
}

export interface ParseReport {
  /** Size of input in bytes */
  byteSize: number;
  /** Number of characters processed */
  characterCount: number;
  /** Parsing warnings */
  warnings: string[];
  /** Time taken to parse in milliseconds */
  parseTimeMs: number;
}

export interface ParseResult {
  /** The parsed AST */
  ast: DocumentNode;
  /** Parsing report with metrics */
  report: ParseReport;
}

/**
 * Base interface for all parsers
 */
export interface IParser<T extends ParseOptions = ParseOptions> {
  /**
   * Parse input and return AST
   */
  parse(input: T): Promise<ParseResult>;
  
  /**
   * Get the supported input format
   */
  getSupportedFormat(): string;
  
  /**
   * Validate input before parsing
   */
  validate(input: unknown): { valid: boolean; error?: string };
}

/**
 * Parser factory for creating parsers by format
 */
export interface ParserFactory {
  /**
   * Create a parser for the given format
   */
  createParser(format: string): IParser | null;
  
  /**
   * Get list of supported formats
   */
  getSupportedFormats(): string[];
  
  /**
   * Register a custom parser
   */
  registerParser(format: string, parser: IParser): void;
}
