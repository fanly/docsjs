import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

export function createWatermarkPlugin(): TransformPlugin {
  return {
    name: "watermark",
    version: "1.0.0",
    description: "Parses document watermarks",
    phases: [PluginPhase.TRANSFORM],
    priority: PluginPriority.LOW,
    
    init() {},
    execute() {},
    
    transform(html: string, context: PluginContext): string {
      if (!context.documentXml) return html;
      const sectPr = context.documentXml.querySelector("w\\:sectPr, sectPr");
      if (!sectPr) return html;
      
      const watermark = sectPr.querySelector("w\\:watermark, watermark");
      if (!watermark) return html;
      
      const text = watermark.querySelector("w\\:text, text")?.textContent || "CONFIDENTIAL";
      
      const watermarkHtml = `<div data-word-watermark="1" style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);opacity:0.1;font-size:72px;color:#000;">${text}</div>`;
      
      const bodyMatch = html.match(/<body[^>]*>/);
      if (bodyMatch) {
        return html.replace(bodyMatch[0], bodyMatch[0] + watermarkHtml);
      }
      
      return html;
    }
  };
}
