import { PluginPhase, PluginPriority, type ParagraphPlugin, type PluginContext, type ParagraphParseResult } from "../base";

export function createCrossRefPlugin(): ParagraphPlugin {
  return {
    name: "cross-reference",
    version: "1.0.0",
    description: "Parses cross-references in Word documents",
    phases: [PluginPhase.PARSE],
    priority: PluginPriority.NORMAL,
    
    init() {},
    execute() {},
    
    parseParagraph(element: Element, _context: PluginContext): ParagraphParseResult {
      const refs = Array.from(element.querySelectorAll('w\\:fldChar[fldCharType="separate"], fldChar[fldCharType="separate"]'));
      const crossRefs: { type: string; ref: string }[] = [];
      
      for (const ref of refs) {
        const parent = ref.parentElement;
        if (!parent) continue;
        
        const instrText = parent.querySelector('w\\:instrText, instrText');
        if (instrText && instrText.textContent?.includes("REF")) {
          const instr = instrText.textContent.trim();
          const match = instr.match(/REF\s+(\S+)/);
          if (match) {
            crossRefs.push({
              type: "ref",
              ref: match[1]
            });
          }
        }
      }
      
      if (crossRefs.length === 0) {
        return { html: "", handled: false };
      }
      
      const refHtml = crossRefs.map(r => 
        `<a data-word-crossref="${r.ref}" href="#${r.ref}"></a>`
      ).join("");
      
      return {
        html: refHtml,
        handled: true,
        metadata: { crossRefs }
      };
    }
  };
}
