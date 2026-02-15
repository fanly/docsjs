import { PluginPhase, PluginPriority, type RunPlugin, type PluginContext, type RunParseResult } from "../base";

export function createOlePlugin(): RunPlugin {
  return {
    name: "ole-object",
    version: "1.0.0",
    description: "Renders OLE object placeholders",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.LOWEST,
    
    init() {},
    execute() {},
    
    parseRun(element: Element, _context: PluginContext): RunParseResult {
      const object = element.querySelector("w\\:object, object");
      if (!object) return { html: "", handled: false };
      
      const oleObj = object.querySelector("o\\:OLEObject, OLEObject");
      const progId = oleObj?.getAttribute("ProgID") || "unknown";
      
      return {
        html: `<div data-word-ole="1" data-word-ole-progid="${progId}" class="word-ole-object"><span>[Embedded ${progId}]</span></div>`,
        handled: true
      };
    }
  };
}
