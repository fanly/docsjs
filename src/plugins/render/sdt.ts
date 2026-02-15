import { PluginPhase, PluginPriority, type ParagraphPlugin, type PluginContext, type ParagraphParseResult } from "../base";

export function createSdtPlugin(): ParagraphPlugin {
  return {
    name: "sdt-content-control",
    version: "1.0.0",
    description: "Parses content controls (SDT)",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.LOW,
    
    init() {},
    execute() {},
    
    parseParagraph(element: Element, _context: PluginContext): ParagraphParseResult {
      const sdt = element.querySelector("w\\:sdt, sdt");
      if (!sdt) return { html: "", handled: false };
      
      const sdtPr = sdt.querySelector("w\\:sdtPr, sdtPr");
      const sdtContent = sdt.querySelector("w\\:sdtContent, sdtContent");
      
      let type = "text";
      if (sdtPr) {
        const alias = sdtPr.querySelector("w\\:alias, alias");
        const tag = sdtPr.querySelector("w\\:tag, tag");
        type = tag?.getAttribute("w:val") || alias?.getAttribute("w:val") || type;
      }
      
      const content = sdtContent?.textContent?.trim() || "";
      
      return {
        html: `<span data-word-sdt="${type}">${content}</span>`,
        handled: true
      };
    }
  };
}
