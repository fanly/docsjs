import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

export function createPageBackgroundPlugin(): TransformPlugin {
  return {
    name: "page-background",
    version: "1.0.0",
    description: "Parses page background color",
    phases: [PluginPhase.TRANSFORM],
    priority: PluginPriority.LOW,
    
    init() {},
    execute() {},
    
    transform(html: string, context: PluginContext): string {
      if (!context.documentXml) return html;
      const sectPr = context.documentXml.querySelector("w\\:sectPr, sectPr");
      if (!sectPr) return html;
      
      const pgFill = sectPr.querySelector("w\\:pgFill, pgFill");
      
      let bgStyle = "";
      
      if (pgFill) {
        const fillColor = pgFill.getAttribute("w:fill");
        if (fillColor && fillColor !== "FFFFFFFF") {
          const hexColor = parseInt(fillColor).toString(16).padStart(6, "0");
          bgStyle = `background-color:#${hexColor.slice(2)};`;
        }
      }
      
      if (!bgStyle) return html;
      
      const bodyMatch = html.match(/<body[^>]*>/);
      if (bodyMatch) {
        return html.replace(bodyMatch[0], `<body ${bgStyle}>`);
      }
      
      return html;
    }
  };
}
