import { describe, expect, it } from "vitest";
import { PluginRegistry, defaultPluginConfig } from "../../src/plugins";
import type { PluginContext, TransformPlugin, CleanupPlugin } from "../../src/plugins";
import { createGoogleDocsCleanupPlugin } from "../../src/plugins/cleanup/googleDocs";
import { createWpsCleanupPlugin } from "../../src/plugins/cleanup/wps";
import { createWordCleanupPlugin } from "../../src/plugins/cleanup/word";
import { createBookmarkPlugin } from "../../src/plugins/content/bookmark";
import { createSectionPlugin } from "../../src/plugins/content/section";
import { createDropCapPlugin } from "../../src/plugins/content/dropCap";
import { createFieldPlugin } from "../../src/plugins/content/field";
import { createShapePlugin } from "../../src/plugins/render/shape";
import { createWatermarkPlugin } from "../../src/plugins/render/watermark";
import { createPageBackgroundPlugin } from "../../src/plugins/render/pageBackground";
import { createListStylePlugin } from "../../src/plugins/style/listStyle";
import { createMathMlPlugin } from "../../src/plugins/math/mathMl";
import { createAnchorCollisionPlugin } from "../../src/plugins/render/anchorCollision";
import { createPipeline } from "../../src/lib/pluginPipeline";
import type JSZip from "jszip";

const mockContext: PluginContext = {
  zip: {} as JSZip,
  documentXml: null as unknown as Document,
  stylesXml: null,
  numberingXml: null,
  relsMap: {},
  metadata: {},
  config: defaultPluginConfig
};

describe("Plugin System", () => {
  describe("PluginRegistry", () => {
    it("registers and retrieves plugins", () => {
      const registry = new PluginRegistry();
      const plugin = createGoogleDocsCleanupPlugin();
      registry.register(plugin);
      
      expect(registry.get("google-docs-cleanup")).toBeDefined();
      expect(registry.has("google-docs-cleanup")).toBe(true);
    });

    it("unregisters plugins", () => {
      const registry = new PluginRegistry();
      const plugin = createGoogleDocsCleanupPlugin();
      registry.register(plugin);
      
      expect(registry.unregister("google-docs-cleanup")).toBe(true);
      expect(registry.has("google-docs-cleanup")).toBe(false);
    });

    it("lists all registered plugins", () => {
      const registry = new PluginRegistry();
      registry.register(createGoogleDocsCleanupPlugin());
      registry.register(createWpsCleanupPlugin());
      
      expect(registry.list()).toHaveLength(2);
    });

    it("executes cleanup plugins in priority order", async () => {
      const registry = new PluginRegistry();
      registry.register(createWordCleanupPlugin());
      registry.register(createGoogleDocsCleanupPlugin());
      
      await registry.initialize(mockContext);
      
      const html = '<b id="docs-internal-guid-123">Test</b><span style="mso-test">Content</span>';
      const result = await registry.cleanup(html, mockContext);
      
      expect(result).not.toContain("docs-internal-guid");
    });

    it("gets cleanup plugins", () => {
      const registry = new PluginRegistry();
      registry.register(createGoogleDocsCleanupPlugin());
      
      const cleanupPlugins = registry.getCleanupPlugins();
      expect(cleanupPlugins.length).toBeGreaterThan(0);
    });

    it("gets transform plugins", () => {
      const registry = new PluginRegistry();
      registry.register(createSectionPlugin());
      registry.register(createWatermarkPlugin());
      
      const transformPlugins = registry.getTransformPlugins();
      expect(transformPlugins.length).toBeGreaterThan(0);
    });
  });

  describe("Cleanup Plugins", () => {
    it("google-docs-cleanup removes GUID artifacts", () => {
      const plugin = createGoogleDocsCleanupPlugin();
      const html = '<b id="docs-internal-guid-123">Test</b><span data-sheets-value="test">Content</span>';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("docs-internal-guid");
      expect(result).not.toContain("data-sheets-value");
    });

    it("google-docs-cleanup removes Sheets HTML origin", () => {
      const plugin = createGoogleDocsCleanupPlugin();
      const html = '<google-sheets-html-origin><table><td data-sheets-value="1">Test</td></table></google-sheets-html-origin>';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("google-sheets-html-origin");
    });

    it("wps-cleanup removes WPS artifacts", () => {
      const plugin = createWpsCleanupPlugin();
      const html = '<span wps-test="value">Content</span><wps:element>Test</wps:element>';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("wps-");
      expect(result).not.toContain("wps:");
    });

    it("wps-cleanup removes kingsoft artifacts", () => {
      const plugin = createWpsCleanupPlugin();
      const html = '<span kingsoft-office="test">Content</span>';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("kingsoft-");
    });

    it("word-cleanup removes MSO inline styles", () => {
      const plugin = createWordCleanupPlugin();
      const html = '<p style="mso-fareast-font-family:Calibri" class="MsoNormal"><o:p>Test</o:p></p>';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("mso-");
      expect(result).not.toContain("Mso");
    });

    it("word-cleanup removes Office XML namespaces", () => {
      const plugin = createWordCleanupPlugin();
      const html = '<o:p>Test</o:p><w:element>Content</w:element>';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("o:");
      expect(result).not.toContain("w:");
    });

    it("word-cleanup removes conditional comments", () => {
      const plugin = createWordCleanupPlugin();
      const html = '<!--[if mso]><style>/* test */</style><![endif]-->';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("[if");
    });

    it("word-cleanup removes empty spans", () => {
      const plugin = createWordCleanupPlugin();
      const html = '<span></span><span>&nbsp;</span>';
      
      const result = plugin.cleanup(html, mockContext);
      
      expect(result).not.toContain("<span></span>");
    });

    it("cleanup plugin has correct phase", () => {
      const plugin = createGoogleDocsCleanupPlugin() as CleanupPlugin;
      expect(plugin.phases).toContain("cleanup");
    });
  });

  describe("Content Plugins (ParagraphPlugin)", () => {
    describe("Bookmark Plugin", () => {
      it("has correct name and phases", () => {
        const plugin = createBookmarkPlugin();
        
        expect(plugin.name).toBe("bookmark");
        expect(plugin.phases).toContain("parse");
      });
    });

    describe("DropCap Plugin", () => {
      it("has correct name and phases", () => {
        const plugin = createDropCapPlugin();
        
        expect(plugin.name).toBe("drop-cap");
        expect(plugin.phases).toContain("parse");
      });
    });

    describe("Field Plugin", () => {
      it("has correct name and phases", () => {
        const plugin = createFieldPlugin();
        
        expect(plugin.name).toBe("field");
        expect(plugin.phases).toContain("parse");
      });
    });
  });

  describe("Transform Plugins", () => {
    describe("Section Plugin", () => {
      it("returns unchanged HTML when no sectPr", () => {
        const plugin = createSectionPlugin();
        const html = '<body><p>Content</p></body>';
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toBe(html);
      });
    });

    describe("Shape Plugin", () => {
      it("has correct name and phases", () => {
        const plugin = createShapePlugin();
        
        expect(plugin.name).toBe("shape");
        expect(plugin.phases).toContain("parse");
      });
    });

    describe("Watermark Plugin", () => {
      it("returns unchanged HTML when no watermark in sectPr", () => {
        const plugin = createWatermarkPlugin();
        const html = '<body><p>Content</p></body>';
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toBe(html);
      });
    });

    describe("PageBackground Plugin", () => {
      it("returns unchanged HTML when no pgFill in sectPr", () => {
        const plugin = createPageBackgroundPlugin();
        const html = '<body><p>Content</p></body>';
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toBe(html);
      });
    });

    describe("ListStyle Plugin", () => {
      it("returns unchanged HTML when no numberingXml", () => {
        const plugin = createListStylePlugin() as unknown as TransformPlugin;
        const html = '<p>List item</p>';
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toBe(html);
      });
    });

    describe("MathMl Plugin", () => {
      it("skips transformation when mathML feature disabled", () => {
        const plugin = createMathMlPlugin();
        const config = { ...defaultPluginConfig, features: { ...defaultPluginConfig.features, mathML: false } };
        const context = { ...mockContext, config };
        const html = '<p>Content</p>';
        
        const result = plugin.transform(html, context);
        
        expect(result).toBe(html);
      });

      it("handles missing documentXml gracefully", () => {
        const plugin = createMathMlPlugin();
        const html = '<p>Content</p>';
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toBe(html);
      });
    });

    describe("AnchorCollision Plugin", () => {
      it("skips transformation when anchors feature disabled", () => {
        const plugin = createAnchorCollisionPlugin();
        const config = { ...defaultPluginConfig, features: { ...defaultPluginConfig.features, anchors: false } };
        const context = { ...mockContext, config };
        const html = '<p>Content</p>';
        
        const result = plugin.transform(html, context);
        
        expect(result).toBe(html);
      });

      it("returns unchanged HTML when no anchors present", () => {
        const plugin = createAnchorCollisionPlugin();
        const html = '<p>Content</p>';
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toBe(html);
      });

      it("returns unchanged HTML when single anchor present", () => {
        const plugin = createAnchorCollisionPlugin();
        const html = '<img src="test.png" data-word-anchor="1" style="left:100px;top:100px;width:50px;height:50px;">';
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toBe(html);
      });

      it("detects collision between overlapping anchors", () => {
        const plugin = createAnchorCollisionPlugin();
        const html = `
          <img src="test1.png" data-word-anchor="1" style="left:100px;top:100px;width:100px;height:100px;">
          <img src="test2.png" data-word-anchor="1" style="left:150px;top:150px;width:100px;height:100px;">
        `;
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).toContain('data-word-anchor-collision');
      });

      it("does not flag non-overlapping anchors", () => {
        const plugin = createAnchorCollisionPlugin();
        const html = `
          <img src="test1.png" data-word-anchor="1" style="left:100px;top:100px;width:50px;height:50px;">
          <img src="test2.png" data-word-anchor="1" style="left:200px;top:200px;width:50px;height:50px;">
        `;
        
        const result = plugin.transform(html, mockContext);
        
        expect(result).not.toContain('data-word-anchor-collision');
      });
    });
  });

  describe("PluginPipeline Integration", () => {
    it("can create and configure pipeline", () => {
      const pipeline = createPipeline({ enabled: true });
      
      expect(pipeline).toBeDefined();
      expect(pipeline.getConfig).toBeDefined();
    });

    it("can disable plugins via config", () => {
      const pipeline = createPipeline({ 
        cleanup: { googleDocs: false, wps: false, word: false },
        features: { mathML: false, shapes: false, oleObjects: false, anchors: false }
      });
      
      const config = pipeline.getConfig();
      expect(config.cleanup.googleDocs).toBe(false);
      expect(config.features.mathML).toBe(false);
    });

    it("executes cleanup phase", async () => {
      const pipeline = createPipeline({ enabled: true });
      
      const html = '<b id="docs-internal-guid-123">Test</b>';
      const result = await pipeline.executeCleanupPhase(html);
      
      expect(result).not.toContain("docs-internal-guid");
    });

    it("executes transform phase", async () => {
      const pipeline = createPipeline({ enabled: true });
      
      const html = '<p>Content</p>';
      const result = await pipeline.executeTransformPhase(html);
      
      expect(result).toBeDefined();
    });
  });

  describe("Plugin Configuration", () => {
    it("uses default configuration", () => {
      const registry = new PluginRegistry();
      const config = registry.getConfig();
      
      expect(config.cleanup.googleDocs).toBe(true);
      expect(config.cleanup.wps).toBe(true);
      expect(config.features.mathML).toBe(true);
    });

    it("allows custom configuration", () => {
      const registry = new PluginRegistry({
        cleanup: { googleDocs: false, wps: false, word: false },
        features: { mathML: false, shapes: false, oleObjects: true, anchors: false }
      });
      
      const config = registry.getConfig();
      
      expect(config.cleanup.googleDocs).toBe(false);
      expect(config.features.mathML).toBe(false);
      expect(config.features.oleObjects).toBe(true);
    });

    it("updates configuration", () => {
      const registry = new PluginRegistry();
      registry.updateConfig({ cleanup: { googleDocs: false, wps: false, word: false } });
      
      const config = registry.getConfig();
      expect(config.cleanup.googleDocs).toBe(false);
    });
  });
});
