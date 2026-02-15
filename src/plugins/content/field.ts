import { PluginPhase, PluginPriority, type ParagraphPlugin, type PluginContext, type ParagraphParseResult } from "../base";

export function createFieldPlugin(): ParagraphPlugin {
  return {
    name: "field",
    version: "1.0.0",
    description: "Parses Word fields (page numbers, dates, TOC)",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.NORMAL,
    
    init() {},
    execute() {},
    
    parseParagraph(element: Element, _context: PluginContext): ParagraphParseResult {
      const fldCharBegins = Array.from(element.querySelectorAll('w\\:fldChar[fldCharType="begin"], fldChar[fldCharType="begin"]'));
      const fields: { type: string; instr: string }[] = [];
      
      for (const begin of fldCharBegins) {
        const parent = begin.parentElement;
        if (!parent) continue;
        
        const instrText = parent.querySelector('w\\:instrText, instrText');
        if (instrText) {
          const instr = instrText.textContent?.trim() || "";
          let type = "unknown";
          
          if (instr.startsWith("PAGE ")) type = "page";
          else if (instr.startsWith("NUMPAGES")) type = "totalPages";
          else if (instr.startsWith("DATE ")) type = "date";
          else if (instr.startsWith("TIME ")) type = "time";
          else if (instr.startsWith("TOC")) type = "toc";
          else if (instr.startsWith("AUTHOR")) type = "author";
          else if (instr.startsWith("TITLE")) type = "title";
          else if (instr.startsWith("FILENAME")) type = "fileName";
          
          fields.push({ type, instr });
        }
      }
      
      if (fields.length === 0) {
        return { html: "", handled: false };
      }
      
      const fieldHtml = fields.map(f => 
        `<span data-word-field="${f.type}" data-word-field-instr="${f.instr}"></span>`
      ).join("");
      
      return {
        html: fieldHtml,
        handled: true,
        metadata: { fields }
      };
    }
  };
}
