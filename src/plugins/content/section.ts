import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

export function createSectionPlugin(): TransformPlugin {
  return {
    name: "section",
    version: "1.0.0",
    description: "Parses section properties (page size, margins, columns)",
    phases: [PluginPhase.TRANSFORM],
    priority: PluginPriority.NORMAL,
    
    init() {},
    execute() {},
    
    transform(html: string, context: PluginContext): string {
      if (!context.documentXml) return html;
      const sectPr = context.documentXml.querySelector("w\\:sectPr, sectPr");
      if (!sectPr) return html;
      
      const pgSz = sectPr.querySelector("w\\:pgSz, pgSz");
      const pgMar = sectPr.querySelector("w\\:pgMar, pgMar");
      const cols = sectPr.querySelector("w\\:cols, cols");
      
      const sectionData: Record<string, string> = {};
      
      if (pgSz) {
        sectionData.pageWidth = pgSz.getAttribute("w:w") || "0";
        sectionData.pageHeight = pgSz.getAttribute("w:h") || "0";
        sectionData.orientation = pgSz.getAttribute("w:orient") || "portrait";
      }
      
      if (pgMar) {
        sectionData.marginTop = pgMar.getAttribute("w:top") || "0";
        sectionData.marginBottom = pgMar.getAttribute("w:bottom") || "0";
        sectionData.marginLeft = pgMar.getAttribute("w:left") || "0";
        sectionData.marginRight = pgMar.getAttribute("w:right") || "0";
      }
      
      if (cols) {
        sectionData.columnCount = cols.getAttribute("w:num") || "1";
        sectionData.columnSpace = cols.getAttribute("w:space") || "0";
      }
      
      const dataAttrs = Object.entries(sectionData)
        .map(([k, v]) => `data-word-section-${k}="${v}"`)
        .join(" ");
      
      const bodyMatch = html.match(/<body[^>]*>/);
      if (bodyMatch) {
        return html.replace(
          bodyMatch[0],
          `<body ${dataAttrs}>`
        );
      }
      
      return html;
    }
  };
}
