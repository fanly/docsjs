import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

export function createMathMlPlugin(): TransformPlugin {
  return {
    name: "mathml",
    version: "1.0.0",
    description: "Converts OMML to MathML for high-fidelity rendering",
    phases: [PluginPhase.TRANSFORM],
    priority: PluginPriority.HIGH,
    
    init() {},
    execute() {},
    
    transform(html: string, context: PluginContext): string {
      if (!context.config.features.mathML) return html;
      if (!context.documentXml) return html;
      
      const ommlElements = context.documentXml.querySelectorAll("m\\:oMath, oMath");
      if (ommlElements.length === 0) return html;
      
      let result = html;
      
      for (let i = 0; i < ommlElements.length; i++) {
        const omml = ommlElements[i];
        const mathml = ommlToMathml(omml);
        
        result = result.replace(`<span data-word-omml="1"></span>`, mathml);
      }
      
      return result;
    }
  };
}

function ommlToMathml(omml: Element): string {
  const math = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math");
  
  function convert(node: Element): Element {
    const localName = node.localName || "";
    let result: Element;
    
    if (localName === "oMath") {
      result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mrow");
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          result.appendChild(convert(child as Element));
        } else if (child.nodeType === Node.TEXT_NODE) {
          const mtext = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mtext");
          mtext.textContent = child.textContent;
          result.appendChild(mtext);
        }
      }
    } else if (localName === "f") {
      result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mfrac");
      const num = node.querySelector("m\\:num, num");
      const den = node.querySelector("m\\:den, den");
      if (num) result.appendChild(convert(num));
      if (den) result.appendChild(convert(den));
    } else if (localName === "r") {
      result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mi");
      result.textContent = node.textContent || "";
    } else {
      result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mrow");
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          result.appendChild(convert(child as Element));
        }
      }
    }
    
    return result;
  }
  
  const converted = convert(omml);
  math.appendChild(converted);
  
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${math.innerHTML}</math>`;
}
