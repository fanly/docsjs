import { PluginPhase, PluginPriority, type RunPlugin, type PluginContext, type RunParseResult } from "../base";

export function createShapePlugin(): RunPlugin {
  return {
    name: "shape",
    version: "1.0.0",
    description: "Renders VML and DrawingML shapes",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.LOW,
    
    init() {},
    execute() {},
    
    parseRun(element: Element, _context: PluginContext): RunParseResult {
      const vmlShape = element.querySelector("w\\:pict, pict");
      if (!vmlShape) return { html: "", handled: false };
      
      const shapeType = vmlShape.querySelector("v\\:shape, v\\:rect, v\\:oval");
      if (!shapeType) return { html: "", handled: false };
      
      const typeAttr = shapeType.getAttribute("type") || shapeType.tagName;
      const style = shapeType.getAttribute("style") || "";
      
      const widthMatch = style.match(/width:(\d+)/);
      const heightMatch = style.match(/height:(\d+)/);
      const width = widthMatch ? widthMatch[1] : "100";
      const height = heightMatch ? heightMatch[1] : "100";
      
      return {
        html: `<div data-word-shape="${typeAttr}" style="width:${width}px;height:${height}px;border:1px dashed #ccc;display:inline-block;"></div>`,
        handled: true
      };
    }
  };
}
