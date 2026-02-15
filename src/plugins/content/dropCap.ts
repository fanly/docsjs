import { PluginPhase, PluginPriority, type RunPlugin, type PluginContext, type RunParseResult } from "../base";

export function createDropCapPlugin(): RunPlugin {
  return {
    name: "drop-cap",
    version: "1.0.0",
    description: "Parses drop cap formatting",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.NORMAL,
    
    init() {},
    execute() {},
    
    parseRun(element: Element, _context: PluginContext): RunParseResult {
      const pPr = element.parentElement?.querySelector(":scope > w\\:pPr, pPr");
      if (!pPr) return { html: "", handled: false };
      
      const dropCap = pPr.querySelector("w\\:dropCap, dropCap");
      if (!dropCap) return { html: "", handled: false };
      
      const type = dropCap.getAttribute("w:val");
      
      const styles = [
        "float: left",
        "font-size: 3em",
        "line-height: 0.8",
        "margin-right: 0.1em",
        "margin-top: 0.1em"
      ];
      
      if (type === "margin") {
        styles.push("margin-left: -1em");
      }
      
      return {
        html: "",
        handled: true,
        styles
      };
    }
  };
}
