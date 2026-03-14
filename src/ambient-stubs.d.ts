// Ambient stubs to satisfy type-checks for test scaffolding without full implementations
declare module "../src/engine/core" {
  export class CoreEngine {
    constructor(config?: any);
    registerPlugin(p: any): void;
    destroy(): Promise<void> | void;
    configure(config?: any): void;
    registerProfile(p: any): void;
    listPlugins(): string[];
    listProfiles(): string[];
  }
}

declare module "../src/plugins/base" {
  export type DocxPlugin = any;
  export type PluginPhase = any;
}

declare module "../src/profiles/profile-manager" {
  export const SYSTEM_PROFILES: any;
  export class ProfileManager {
    addProfile(p: any): void;
    getProfile(name: string): any;
    findProfile(name: string): any;
    list(): string[];
  }
}
