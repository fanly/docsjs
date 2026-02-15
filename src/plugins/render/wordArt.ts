import { PluginPhase, PluginPriority, type RunPlugin, type PluginContext, type RunParseResult } from "../base";

export function createWordArtPlugin(): RunPlugin {
  return {
    name: "wordart",
    version: "1.0.0",
    description: "Renders WordArt text effects",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.LOW,
    
    init() {},
    execute() {},
    
    parseRun(element: Element, _context: PluginContext): RunParseResult {
      const pict = element.querySelector("w\\:pict, pict");
      if (!pict) return { html: "", handled: false };
      
      const wordArt = pict.querySelector("w\\:drawing, drawing");
      if (!wordArt) return { html: "", handled: false };
      
      return {
        html: `<span data-word-wordart="1" contenteditable="false" style="font-style:italic;">[WordArt]</span>`,
        handled: true
      };
    }
  };
}
