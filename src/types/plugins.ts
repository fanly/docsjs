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
  permissions?: PluginPermissions;
  compatibility?: string[];
  supportedHooks?: string[];
  changelog?: string;
  license?: string;
  sizeMB?: number;
  downloadUrl?: string;
  signature?: string;
}

export interface PluginMetadata {
  name: string;
  version: string;
  description?: string;
  author?: string;
  repository?: string;
  keywords?: string[];
  license?: string;
  id?: string;
  compatibility?: string;
  permissions?: PluginPermissions;
}

export interface PluginPermissions {
  read?: string[];
  write?: string[];
  network?: boolean;
  compute?: {
    maxMemoryMB?: number;
    maxCpuSecs?: number;
    maxThreads?: number;
  };
  ast?: {
    canModifySemantics?: boolean;
    canAccessOriginal?: boolean;
    canExportRawAst?: boolean;
  };
  export?: { canGenerateFiles?: boolean; canUpload?: boolean };
  misc?: { allowUnsafeCode?: boolean };
}

export interface EnginePlugin {
  name: string;
  version: string;
  enabled?: boolean;
  permissions?: PluginPermissions;
  author?: string;
  description?: string;
}

export interface InstalledPlugin {
  name: string;
  version: string;
  path: string;
  enabled: boolean;
  installed?: boolean;
  cleanup?: () => void;
}

export interface PluginVerification {
  valid: boolean;
  signature?: string;
  checksum?: string;
  signatureValid?: boolean;
  publisherTrusted?: boolean;
  securityScanPassed?: boolean;
  performanceCompliant?: boolean;
}
