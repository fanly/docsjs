import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

export function createListStylePlugin(): TransformPlugin {
  return {
    name: "list-style",
    version: "1.0.0",
    description: "Parses list styles and bullet formatting",
    phases: [PluginPhase.TRANSFORM],
    priority: PluginPriority.NORMAL,
    
    init() {},
    execute() {},
    
    transform(html: string, context: PluginContext): string {
      if (!context.numberingXml) return html;
      
      const abstractNums = Array.from(context.numberingXml.querySelectorAll("w\\:abstractNum, abstractNum"));
      const listStyles: Record<string, { format: string; text: string }> = {};
      
      for (const abs of abstractNums) {
        const abstractNumId = abs.getAttribute("w:abstractNumId");
        if (!abstractNumId) continue;
        
        const lvl = abs.querySelector("w\\:lvl, lvl");
        if (!lvl) continue;
        
        const lvlText = lvl.querySelector("w\\:lvlText, lvlText");
        const numFmt = lvl.querySelector("w\\:numFmt, numFmt");
        
        const format = numFmt?.getAttribute("w:val") || "decimal";
        const text = lvlText?.getAttribute("w:val") || "%1.";
        
        listStyles[abstractNumId] = { format, text };
      }
      
      context.metadata.listStyles = listStyles;
      
      return html;
    }
  };
}
