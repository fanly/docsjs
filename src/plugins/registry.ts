import { PluginPhase, type DocxPlugin, type PluginContext, type PluginConfig, type CleanupPlugin, type TransformPlugin } from "./base";

export class PluginRegistry {
  private plugins: Map<string, DocxPlugin> = new Map();
  private config: PluginConfig;
  private initialized = false;

  constructor(config: Partial<PluginConfig> = {}) {
    this.config = {
      experimental: config.experimental ?? false,
      cleanup: config.cleanup ?? { googleDocs: true, wps: true, word: true },
      features: config.features ?? { mathML: true, shapes: true, oleObjects: false, anchors: true }
    };
  }

  register(plugin: DocxPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} already registered, overwriting`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  unregister(name: string): boolean {
    return this.plugins.delete(name);
  }

  get(name: string): DocxPlugin | undefined {
    return this.plugins.get(name);
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  list(): DocxPlugin[] {
    return Array.from(this.plugins.values());
  }

  async initialize(context: PluginContext): Promise<void> {
    if (this.initialized) return;
    
    const sorted = this.sortByPriority();
    for (const plugin of sorted) {
      await plugin.init(context);
    }
    this.initialized = true;
  }

  async execute(context: PluginContext, phase: PluginPhase): Promise<void> {
    const sorted = this.sortByPriority();
    const phasePlugins = sorted.filter(p => p.phases.includes(phase));
    
    for (const plugin of phasePlugins) {
      await plugin.execute(context, phase);
    }
  }

  getCleanupPlugins(): CleanupPlugin[] {
    return this.list()
      .filter((p): p is CleanupPlugin => "cleanup" in p && p.phases.includes(PluginPhase.CLEANUP))
      .sort((a, b) => b.priority - a.priority);
  }

  getTransformPlugins(): TransformPlugin[] {
    return this.list()
      .filter((p): p is TransformPlugin => "transform" in p && p.phases.includes(PluginPhase.TRANSFORM))
      .sort((a, b) => b.priority - a.priority);
  }

  async cleanup(html: string, context: PluginContext): Promise<string> {
    let result = html;
    for (const plugin of this.getCleanupPlugins()) {
      result = plugin.cleanup(result, context);
    }
    return result;
  }

  async transform(html: string, context: PluginContext): Promise<string> {
    let result = html;
    for (const plugin of this.getTransformPlugins()) {
      result = plugin.transform(result, context);
    }
    return result;
  }

  destroy(): void {
    for (const plugin of this.plugins.values()) {
      plugin.destroy?.();
    }
    this.plugins.clear();
    this.initialized = false;
  }

  private sortByPriority(): DocxPlugin[] {
    return this.list().sort((a, b) => b.priority - a.priority);
  }

  getConfig(): PluginConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const globalRegistry = new PluginRegistry();
