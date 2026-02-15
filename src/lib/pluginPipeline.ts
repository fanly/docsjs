import type JSZip from "jszip";
import type { PluginContext, PluginConfig } from "../plugins";
import { PluginRegistry } from "../plugins";

import {
  createGoogleDocsCleanupPlugin,
  createWpsCleanupPlugin,
  createWordCleanupPlugin,
  createBookmarkPlugin,
  createHeaderFooterPlugin,
  createSectionPlugin,
  createDropCapPlugin,
  createFieldPlugin,
  createCrossRefPlugin,
  createCaptionPlugin,
  createShapePlugin,
  createWordArtPlugin,
  createOlePlugin,
  createSdtPlugin,
  createWatermarkPlugin,
  createPageBackgroundPlugin,
  createStyleInheritancePlugin,
  createListStylePlugin,
  createMathMlPlugin
} from "../plugins";

export interface DocxPluginPipelineConfig extends PluginConfig {
  enabled: boolean;
}

const defaultPipelineConfig: DocxPluginPipelineConfig = {
  enabled: true,
  experimental: false,
  cleanup: {
    googleDocs: true,
    wps: true,
    word: true
  },
  features: {
    mathML: true,
    shapes: true,
    oleObjects: true
  }
};

export class DocxPluginPipeline {
  private registry: PluginRegistry;
  private config: DocxPluginPipelineConfig;
  private initialized = false;

  constructor(config: Partial<DocxPluginPipelineConfig> = {}) {
    this.config = { ...defaultPipelineConfig, ...config };
    this.registry = new PluginRegistry(this.config);
  }

  private registerAllPlugins(): void {
    if (this.config.cleanup.googleDocs) {
      this.registry.register(createGoogleDocsCleanupPlugin());
    }
    if (this.config.cleanup.wps) {
      this.registry.register(createWpsCleanupPlugin());
    }
    if (this.config.cleanup.word) {
      this.registry.register(createWordCleanupPlugin());
    }

    this.registry.register(createBookmarkPlugin());
    this.registry.register(createHeaderFooterPlugin());
    this.registry.register(createSectionPlugin());
    this.registry.register(createDropCapPlugin());
    this.registry.register(createFieldPlugin());
    this.registry.register(createCrossRefPlugin());
    this.registry.register(createCaptionPlugin());

    this.registry.register(createShapePlugin());
    this.registry.register(createWordArtPlugin());
    this.registry.register(createOlePlugin());
    this.registry.register(createSdtPlugin());
    this.registry.register(createWatermarkPlugin());
    this.registry.register(createPageBackgroundPlugin());

    this.registry.register(createStyleInheritancePlugin());
    this.registry.register(createListStylePlugin());

    this.registry.register(createMathMlPlugin());
  }

  async initialize(
    zip: JSZip,
    documentXml: Document,
    stylesXml: Document | null,
    numberingXml: Document | null,
    relsMap: Record<string, string>
  ): Promise<void> {
    if (this.initialized || !this.config.enabled) return;

    this.registerAllPlugins();

    const context: PluginContext = {
      zip,
      documentXml,
      stylesXml,
      numberingXml,
      relsMap,
      metadata: {},
      config: this.config
    };

    await this.registry.initialize(context);
    this.initialized = true;
  }

  async executeTransformPhase(html: string): Promise<string> {
    if (!this.config.enabled) return html;

    const context: PluginContext = {
      zip: null as unknown as JSZip,
      documentXml: null as unknown as Document,
      stylesXml: null,
      numberingXml: null,
      relsMap: {},
      metadata: {},
      config: this.config
    };

    return this.registry.transform(html, context);
  }

  async executeCleanupPhase(html: string): Promise<string> {
    if (!this.config.enabled) return html;

    if (!this.initialized) {
      this.registerAllPlugins();
      this.initialized = true;
    }

    const context: PluginContext = {
      zip: null as unknown as JSZip,
      documentXml: null as unknown as Document,
      stylesXml: null,
      numberingXml: null,
      relsMap: {},
      metadata: {},
      config: this.config
    };

    return this.registry.cleanup(html, context);
  }

  getRegistry(): PluginRegistry {
    return this.registry;
  }

  getConfig(): DocxPluginPipelineConfig {
    return this.config;
  }

  destroy(): void {
    this.registry.destroy();
    this.initialized = false;
  }
}

let globalPipeline: DocxPluginPipeline | null = null;

export function getGlobalPipeline(): DocxPluginPipeline {
  if (!globalPipeline) {
    globalPipeline = new DocxPluginPipeline();
  }
  return globalPipeline;
}

export function createPipeline(config?: Partial<DocxPluginPipelineConfig>): DocxPluginPipeline {
  return new DocxPluginPipeline(config);
}
