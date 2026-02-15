import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

export function createStyleInheritancePlugin(): TransformPlugin {
  return {
    name: "style-inheritance",
    version: "1.0.0",
    description: "Applies style inheritance from paragraph and character styles",
    phases: [PluginPhase.TRANSFORM],
    priority: PluginPriority.HIGH,
    
    init() {},
    execute() {},
    
    transform(html: string, context: PluginContext): string {
      if (!context.stylesXml) return html;
      
      const styles = Array.from(context.stylesXml.querySelectorAll("w\\:style, style"));
      const styleMap: Record<string, Record<string, string>> = {};
      
      for (const style of styles) {
        const type = style.getAttribute("w:type");
        const styleId = style.getAttribute("w:styleId");
        if (!styleId) continue;
        
        const rPr = style.querySelector("w\\:rPr, rPr");
        if (rPr && type === "paragraph") {
          const props: Record<string, string> = {};
          
          const b = rPr.querySelector("w\\:b, b");
          if (b) props["font-weight"] = "bold";
          
          const i = rPr.querySelector("w\\:i, i");
          if (i) props["font-style"] = "italic";
          
          const u = rPr.querySelector("w\\:u, u");
          if (u) props["text-decoration"] = "underline";
          
          const color = rPr.querySelector("w\\:color, color");
          if (color) {
            const val = color.getAttribute("w:val");
            if (val && val !== "auto") props["color"] = `#${val}`;
          }
          
          const sz = rPr.querySelector("w\\:sz, sz");
          if (sz) {
            const val = sz.getAttribute("w:val");
            if (val) props["font-size"] = `${parseInt(val) / 2}pt`;
          }
          
          if (Object.keys(props).length > 0) {
            styleMap[styleId] = props;
          }
        }
      }
      
      context.metadata.styleMap = styleMap;
      
      return html;
    }
  };
}
