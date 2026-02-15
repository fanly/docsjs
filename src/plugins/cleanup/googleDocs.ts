import { PluginPhase, PluginPriority, type CleanupPlugin, type PluginContext } from "../base";

export function createGoogleDocsCleanupPlugin(): CleanupPlugin {
  return {
    name: "google-docs-cleanup",
    version: "1.0.0",
    description: "Cleans up Google Docs specific HTML artifacts",
    phases: [PluginPhase.CLEANUP],
    priority: PluginPriority.HIGHEST,
    
    init() {},
    execute() {},
    
    cleanup(html: string, _context: PluginContext): string {
      let result = html;
      
      result = result.replace(/<b[^>]*id="docs-internal-guid-[^"]*"[^>]*>/gi, "");
      result = result.replace(/<\/b>/gi, "");
      
      result = result.replace(/<span[^>]*id="docs-internal-guid-[^"]*"[^>]*>/gi, "");
      
      result = result.replace(/<google-sheets-html-origin[^>]*>/gi, "");
      result = result.replace(/<\/google-sheets-html-origin>/gi, "");
      
      result = result.replace(/\s*data-sheets-[^=]*="[^"]*"/gi, "");
      
      result = result.replace(/<style[^>]*>.*?google-sheets.*?<\/style>/gis, "");
      
      return result;
    }
  };
}
