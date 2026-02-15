import { PluginPhase, PluginPriority, type CleanupPlugin, type PluginContext } from "../base";

export function createWpsCleanupPlugin(): CleanupPlugin {
  return {
    name: "wps-cleanup",
    version: "1.0.0",
    description: "Cleans up WPS Office specific HTML artifacts",
    phases: [PluginPhase.CLEANUP],
    priority: PluginPriority.HIGH,
    
    init() {},
    execute() {},
    
    cleanup(html: string, _context: PluginContext): string {
      let result = html;
      
      result = result.replace(/\s*wps-[^=]*="[^"]*"/gi, "");
      
      result = result.replace(/<wps:[^>]*>/gi, "");
      result = result.replace(/<\/wps:[^>]*>/gi, "");
      
      result = result.replace(/\s*kingsoft-[^=]*="[^"]*"/gi, "");
      
      return result;
    }
  };
}
