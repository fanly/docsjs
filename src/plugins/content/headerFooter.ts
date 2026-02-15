import { PluginPhase, PluginPriority, type ParagraphPlugin, type PluginContext, type ParagraphParseResult } from "../base";

function queryAllByLocalName(root: ParentNode, localName: string): Element[] {
  return Array.from(root.querySelectorAll(`:scope > ${localName}`));
}

export function createHeaderFooterPlugin(): ParagraphPlugin {
  return {
    name: "header-footer",
    version: "1.0.0",
    description: "Parses Word headers and footers",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.HIGH,
    
    init() {},
    execute() {},
    
    parseParagraph(element: Element, context: PluginContext): ParagraphParseResult {
      const headerRefs = queryAllByLocalName(element, "headerReference");
      const footerRefs = queryAllByLocalName(element, "footerReference");
      
      const headers = headerRefs.map(ref => ({
        type: ref.getAttribute("w:type"),
        rid: ref.getAttribute("r:id")
      }));
      
      const footers = footerRefs.map(ref => ({
        type: ref.getAttribute("w:type"),
        rid: ref.getAttribute("r:id")
      }));
      
      if (headers.length === 0 && footers.length === 0) {
        return { html: "", handled: false };
      }
      
      context.metadata.headers = headers;
      context.metadata.footers = footers;
      
      return {
        html: "",
        handled: true,
        metadata: { headers, footers }
      };
    }
  };
}
