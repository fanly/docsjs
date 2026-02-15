import type JSZip from "jszip";

export type ElementNode = Element;

export enum PluginPhase {
  PARSE = "parse",
  TRANSFORM = "transform",
  RENDER = "render",
  CLEANUP = "cleanup"
}

export enum PluginPriority {
  LOWEST = 0,
  LOW = 25,
  NORMAL = 50,
  HIGH = 75,
  HIGHEST = 100
}

export interface PluginContext {
  zip: JSZip | null;
  documentXml: Document | null;
  stylesXml: Document | null;
  numberingXml: Document | null;
  relsMap: Record<string, string>;
  metadata: Record<string, unknown>;
  config: PluginConfig;
}

export interface PluginConfig {
  experimental: boolean;
  cleanup: {
    googleDocs: boolean;
    wps: boolean;
    word: boolean;
  };
  features: {
    mathML: boolean;
    shapes: boolean;
    oleObjects: boolean;
  };
}

export const defaultPluginConfig: PluginConfig = {
  experimental: false,
  cleanup: {
    googleDocs: true,
    wps: true,
    word: true
  },
  features: {
    mathML: true,
    shapes: true,
    oleObjects: false
  }
};

export interface DocxPlugin {
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly phases: PluginPhase[];
  readonly priority: PluginPriority;
  readonly dependencies?: string[];
  init(context: PluginContext): void | Promise<void>;
  execute(context: PluginContext, phase: PluginPhase): void | Promise<void>;
  destroy?(): void;
}

export interface ParagraphPlugin extends DocxPlugin {
  readonly phases: [PluginPhase.PARSE];
  parseParagraph(element: Element, context: PluginContext): ParagraphParseResult;
}

export interface ParagraphParseResult {
  html: string;
  handled: boolean;
  metadata?: Record<string, unknown>;
}

export interface RunPlugin extends DocxPlugin {
  readonly phases: [PluginPhase.PARSE];
  parseRun(element: Element, context: PluginContext): RunParseResult;
}

export interface RunParseResult {
  html: string;
  handled: boolean;
  styles?: string[];
}

export interface TablePlugin extends DocxPlugin {
  readonly phases: [PluginPhase.PARSE];
  parseTable(element: Element, context: PluginContext): TableParseResult;
}

export interface TableParseResult {
  html: string;
  handled: boolean;
}

export interface CleanupPlugin extends DocxPlugin {
  readonly phases: [PluginPhase.CLEANUP];
  cleanup(html: string, context: PluginContext): string;
}

export interface TransformPlugin extends DocxPlugin {
  readonly phases: [PluginPhase.TRANSFORM];
  transform(html: string, context: PluginContext): string;
}

export interface PluginRegistrationOptions {
  enabled?: boolean;
  config?: Record<string, unknown>;
}
