/**
 * Plugin Type Definitions
 * Types referenced by marketplace modules but not defined elsewhere
 */

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  main?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;
  keywords?: string[];
  license?: string;
}

export interface PluginPermissions {
  read?: string[];
  write?: string[];
  network?: boolean;
  compute?: {
    maxMemoryMB?: number;
    maxCpuSecs?: number;
  };
  ast?: {
    canModifySemantics?: boolean;
    canAccessOriginal?: boolean;
    canExportRawAst?: boolean;
  };
}

export interface EnginePlugin {
  name: string;
  version: string;
  enabled?: boolean;
  permissions?: PluginPermissions;
}

export { InstalledPlugin, PluginVerification } from './modules';
