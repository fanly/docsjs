import { PluginPhase, PluginPriority, type ParagraphPlugin, type PluginContext, type ParagraphParseResult } from "../base";

export function createCaptionPlugin(): ParagraphPlugin {
  return {
    name: "caption",
    version: "1.0.0",
    description: "Parses figure, table, and equation captions",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.NORMAL,
    
    init() {},
    execute() {},
    
    parseParagraph(element: Element, _context: PluginContext): ParagraphParseResult {
      const pStyle = element.querySelector("w\\:pStyle, pStyle");
      const styleName = pStyle?.getAttribute("w:val");
      
      if (!styleName || !styleName.toLowerCase().includes("caption")) {
        return { html: "", handled: false };
      }
      
      const captionType = styleName.toLowerCase().includes("figure") ? "figure" :
        styleName.toLowerCase().includes("table") ? "table" :
          styleName.toLowerCase().includes("equation") ? "equation" : "other";
      
      const textContent = element.textContent?.trim() || "";
      
      return {
        html: `< figcaption data-word-caption-type="${captionType}">${textContent}</figcaption>`,
        handled: true,
        metadata: { captionType, text: textContent }
      };
    }
  };
}
