import { PluginPhase, PluginPriority, type ParagraphPlugin, type PluginContext, type ParagraphParseResult } from "../base";

function directChildrenByLocalName(root: ParentNode, localName: string): Element[] {
  const children = Array.from((root as Element).children ?? []);
  return children.filter((child) => child.localName === localName);
}

export function createBookmarkPlugin(): ParagraphPlugin {
  return {
    name: "bookmark",
    version: "1.0.0",
    description: "Parses Word bookmarks and cross-references",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.NORMAL,
    dependencies: [],
    
    init() {},
    execute() {},
    
    parseParagraph(element: Element, _context: PluginContext): ParagraphParseResult {
      const bookmarkStarts = directChildrenByLocalName(element, "bookmarkStart");
      
      if (bookmarkStarts.length === 0) {
        return { html: "", handled: false };
      }
      
      const bookmarks: { id: string; name: string }[] = [];
      
      for (const start of bookmarkStarts) {
        const id = start.getAttribute("w:id");
        const name = start.getAttribute("w:name");
        if (id && name) {
          bookmarks.push({ id, name });
        }
      }
      
      const bookmarksData = bookmarks.map(b => 
        `<span data-word-bookmark-id="${b.id}" data-word-bookmark-name="${b.name}"></span>`
      ).join("");
      
      return {
        html: bookmarksData,
        handled: true,
        metadata: { bookmarks }
      };
    }
  };
}
