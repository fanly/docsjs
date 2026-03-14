// Minimal plugin base types for tests and scaffolding
export type EnginePlugin = any;
export type DocxPlugin = any;
export enum PluginPhase {
  PARSE = "PARSE",
  TRANSFORM = "TRANSFORM",
  CLEANUP = "CLEANUP",
  RENDER = "RENDER",
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
export const defaultPluginConfig = {};

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
