// Minimal plugin base types for tests and scaffolding
export type EnginePlugin = any;
export type DocxPlugin = any;
export enum PluginPhase {
  // Support both lowercase (test expectations) and uppercase (standard convention)
  PARSE = "parse",
  TRANSFORM = "transform",
  CLEANUP = "cleanup",
  RENDER = "render",
}
export enum PluginPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  LOWEST = 3,
  HIGHEST = 4,
}
export type PluginContext = any;
export type PluginConfig = any;
export type CleanupPlugin = any;
export type TransformPlugin = any;
export type ParagraphPlugin = any;
export type RunPlugin = any;
export type TablePlugin = any;
export type ParagraphParseResult = any;
export type RunParseResult = any;
export type TableParseResult = any;
export type PluginRegistrationOptions = any;
export const defaultPluginConfig = {
  features: {
    mathML: true,
    tables: true,
    images: true,
    annotations: true,
    anchors: true,
  },
};

export class PluginManager {
  registerPlugin(_p: EnginePlugin): void {}
  list(): string[] {
    return [];
  }
  validatePlugin(_p: EnginePlugin): boolean {
    return true;
  }
  resolveDependencies(_p: EnginePlugin): EnginePlugin[] {
    return [];
  }
  // Expose a couple methods used in tests
  getConfig(_p?: EnginePlugin): any {
    return {};
  }
}

export default PluginManager;
