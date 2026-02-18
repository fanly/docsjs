import { PluginPhase, PluginPriority, type CleanupPlugin, type PluginContext } from "../base";

export function createWordCleanupPlugin(): CleanupPlugin {
  return {
    name: "word-cleanup",
    version: "1.0.0",
    description: "Cleans up Microsoft Word specific HTML artifacts",
    phases: [PluginPhase.CLEANUP],
    priority: PluginPriority.NORMAL,
    
    init() {},
    execute() {},
    
    cleanup(html: string, _context: PluginContext): string {
      let result = html;
      
      result = result.replace(/\s*mso-[^:]+:[^;]+;?/gi, "");
      result = result.replace(/\s*class="Mso[^"]*"/gi, "");
      result = result.replace(/<o:[^>]*>/gi, "");
      result = result.replace(/<\/o:[^>]*>/gi, "");
      result = result.replace(/<!--\[if[^>]*>[\s\S]*?<!\[endif\]-->/gi, "");
      result = result.replace(/<v:[^>]*>/gi, "");
      result = result.replace(/<\/v:[^>]*>/gi, "");
      result = result.replace(/<w:[^>]*>/gi, "");
      result = result.replace(/<\/w:[^>]*>/gi, "");
      
      result = result.replace(/<span([^>]*)>\s*<\/span>/gi, (match, attrs: string) => {
        if (/\sdata-word-[^=\s]+=/i.test(attrs)) return match;
        return "";
      });
      result = result.replace(/<span([^>]*)>&nbsp;<\/span>/gi, (match, attrs: string) => {
        if (/\sdata-word-[^=\s]+=/i.test(attrs)) return match;
        return "";
      });
      
      return result;
    }
  };
}
