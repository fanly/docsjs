import { PluginPhase, PluginPriority, type TransformPlugin, type PluginContext } from "../base";

export interface MathMlConfig {
  outputFormat: "mathml" | "katex";
}

export function createMathMlPlugin(config?: MathMlConfig): TransformPlugin {
  const outputFormat = config?.outputFormat ?? "mathml";

  return {
    name: "mathml",
    version: "1.0.0",
    description: "Converts OMML to MathML or KaTeX for high-fidelity rendering",
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
        const converted = outputFormat === "katex"
          ? ommlToKaTeX(omml)
          : ommlToMathml(omml);

        result = result.replace(`<span data-word-omml="1"></span>`, converted);
      }

      return result;
    }
  };
}

function ommlToMathml(omml: Element): string {
  const math = document.createElementNS("http://www.w3.org/1998/Math/MathML", "math");
  const converted = convertOmml(omml);
  if (converted) math.appendChild(converted);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${math.innerHTML}</math>`;
}

function convertOmml(node: Element | null): Element | null {
  if (!node) return null;

  const localName = node.localName || "";

  switch (localName) {
    case "oMath":
    case "m":
      return convertRow(node);
    case "f":
      return convertFraction(node);
    case "sup":
    case "sSup":
      return convertSuperscript(node);
    case "sub":
    case "sSub":
      return convertSubscript(node);
    case "sSubSup":
      return convertSubSup(node);
    case "rad":
    case "root":
      return convertRoot(node);
    case "bar":
    case "barOver":
      return convertBarOver(node);
    case "barUnder":
      return convertBarUnder(node);
    case "acc":
    case "accent":
      return convertAccent(node);
    case "lim":
      return convertLim(node);
    case "func":
      return convertFunc(node);
    case "r":
      return convertText(node, "mi");
    case "t":
      return convertText(node, "mtext");
    case "n":
      return convertText(node, "mn");
    case "o":
      return convertText(node, "mo");
    case "s":
      return convertTextStretchy(node);
    case "b":
      return convertBold(node);
    case "i":
      return convertItalic(node);
    case "span":
    case "sp":
      return convertRow(node);
    case "box":
      return convertBox(node);
    case "groupChr":
      return convertGroupChr(node);
    case "borderBox":
      return convertBorderBox(node);
    case "d":
    case "deg":
      return convertDegree(node);
    default:
      return convertDefault(node);
  }
}

function createMathElement(tag: string): Element {
  return document.createElementNS("http://www.w3.org/1998/Math/MathML", tag);
}

function convertText(node: Element, tag: string): Element {
  const el = createMathElement(tag);
  el.textContent = node.textContent || "";
  return el;
}

function convertTextStretchy(node: Element): Element {
  const el = createMathElement("ms");
  el.setAttribute("stretchy", "false");
  el.textContent = node.textContent || "";
  return el;
}

function convertBold(node: Element): Element {
  const el = createMathElement("mi");
  el.setAttribute("font-weight", "bold");
  el.textContent = node.textContent || "";
  return el;
}

function convertItalic(node: Element): Element {
  const el = createMathElement("mi");
  el.setAttribute("font-style", "italic");
  el.textContent = node.textContent || "";
  return el;
}

function convertRow(node: Element): Element {
  const result = createMathElement("mrow");
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const converted = convertOmml(child as Element);
      if (converted) result.appendChild(converted);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        const mtext = createMathElement("mtext");
        mtext.textContent = text;
        result.appendChild(mtext);
      }
    }
  }
  return result;
}

function convertFraction(node: Element): Element {
  const result = createMathElement("mfrac");
  const num = node.querySelector("m\\:num, num");
  const den = node.querySelector("m\\:den, den");
  if (num) {
    const converted = convertOmml(num);
    if (converted) result.appendChild(converted);
  }
  if (den) {
    const convertedDen = convertOmml(den);
    if (convertedDen) result.appendChild(convertedDen);
  }
  return result;
}

function convertSuperscript(node: Element): Element {
  const result = createMathElement("msup");
  const base = node.querySelector("m\\:e, e");
  const sup = node.querySelector("m\\:sup, sup");
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  if (sup) {
    const convertedSup = convertOmml(sup);
    if (convertedSup) result.appendChild(convertedSup);
  }
  return result;
}

function convertSubscript(node: Element): Element {
  const result = createMathElement("msub");
  const base = node.querySelector("m\\:e, e");
  const sub = node.querySelector("m\\:sub, sub");
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  if (sub) {
    const convertedSub = convertOmml(sub);
    if (convertedSub) result.appendChild(convertedSub);
  }
  return result;
}

function convertSubSup(node: Element): Element {
  const result = createMathElement("msubsup");
  const base = node.querySelector("m\\:e, e");
  const sub = node.querySelector("m\\:sub, sub");
  const sup = node.querySelector("m\\:sup, sup");
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  if (sub) {
    const convertedSub = convertOmml(sub);
    if (convertedSub) result.appendChild(convertedSub);
  }
  if (sup) {
    const convertedSup = convertOmml(sup);
    if (convertedSup) result.appendChild(convertedSup);
  }
  return result;
}

function convertRoot(node: Element): Element {
  const result = createMathElement("mroot");
  const base = node.querySelector("m\\:e, e");
  const deg = node.querySelector("m\\:deg, deg, m\\:degree, degree");
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  if (deg) {
    const convertedDeg = convertOmml(deg);
    if (convertedDeg) result.appendChild(convertedDeg);
  } else {
    const degEl = createMathElement("mn");
    degEl.textContent = "2";
    result.appendChild(degEl);
  }
  return result;
}

function convertBarOver(node: Element): Element {
  const result = createMathElement("mover");
  const base = node.querySelector("m\\:e, e");
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  const overBar = createMathElement("mo");
  overBar.textContent = "̄";
  result.appendChild(overBar);
  return result;
}

function convertBarUnder(node: Element): Element {
  const result = createMathElement("munder");
  const base = node.querySelector("m\\:e, e");
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  const underLine = createMathElement("mo");
  underLine.textContent = "̱";
  result.appendChild(underLine);
  return result;
}

function convertAccent(node: Element): Element {
  const result = createMathElement("mover");
  const base = node.querySelector("m\\:e, e");
  const char = node.getAttribute("chr") || "^";
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  const accent = createMathElement("mo");
  accent.textContent = char;
  result.appendChild(accent);
  return result;
}

function convertLim(node: Element): Element {
  const result = createMathElement("munderover");
  const base = node.querySelector("m\\:e, e");
  const low = node.querySelector("m\\:lim, lim, m\\:bottom, bottom");
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  if (low) {
    const convertedLow = convertOmml(low);
    if (convertedLow) result.appendChild(convertedLow);
  }
  const limSym = createMathElement("mi");
  limSym.textContent = "lim";
  result.appendChild(limSym);
  return result;
}

function convertFunc(node: Element): Element {
  const result = createMathElement("mrow");
  const name = node.querySelector("m\\:func, func, m\\:fName, fName");
  const arg = node.querySelector("m\\:arg, arg, m\\:e, e");
  if (name) {
    const converted = convertOmml(name);
    if (converted) result.appendChild(converted);
  }
  if (arg) {
    const converted = convertOmml(arg);
    if (converted) result.appendChild(converted);
  }
  return result;
}

function convertBox(node: Element): Element {
  const result = createMathElement("mpadded");
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const converted = convertOmml(child as Element);
      if (converted) result.appendChild(converted);
    }
  }
  return result;
}

function convertGroupChr(node: Element): Element {
  const result = createMathElement("mover");
  const base = node.querySelector("m\\:e, e");
  const char = node.getAttribute("chr") || "{";
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  const groupChr = createMathElement("mo");
  groupChr.textContent = char;
  result.appendChild(groupChr);
  return result;
}

function convertBorderBox(node: Element): Element {
  const result = createMathElement("menclose");
  result.setAttribute("notation", "top bottom left right");
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const converted = convertOmml(child as Element);
      if (converted) result.appendChild(converted);
    }
  }
  return result;
}

function convertDegree(node: Element): Element {
  const result = createMathElement("msup");
  const base = node.previousElementSibling;
  if (base) {
    const converted = convertOmml(base);
    if (converted) result.appendChild(converted);
  }
  const deg = createMathElement("mn");
  deg.textContent = node.textContent || "0";
  result.appendChild(deg);
  return result;
}

function convertDefault(node: Element): Element {
  const result = createMathElement("mrow");
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const converted = convertOmml(child as Element);
      if (converted) result.appendChild(converted);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim();
      if (text) {
        const mtext = createMathElement("mtext");
        mtext.textContent = text;
        result.appendChild(mtext);
      }
    }
  }
  return result;
}

function ommlToKaTeX(omml: Element): string {
  function convert(node: Element | null): string {
    if (!node) return "";

    const localName = node.localName || "";

    switch (localName) {
      case "oMath":
      case "m":
      case "span":
      case "sp":
        return convertChildren(node);
      case "f":
        return `\\frac{${convert(node.querySelector("m\\:num, num"))}}{${convert(node.querySelector("m\\:den, den"))}}`;
      case "sup":
      case "sSup":
        return `^{${convert(node.querySelector("m\\:sup, sup"))}}`;
      case "sub":
      case "sSub":
        return `_{${convert(node.querySelector("m\\:sub, sub"))}}`;
      case "sSubSup": {
        const base = convert(node.querySelector("m\\:e, e"));
        const sub = convert(node.querySelector("m\\:sub, sub"));
        const sup = convert(node.querySelector("m\\:sup, sup"));
        return `${base}_{${sub}}^{${sup}}`;
      }
      case "rad":
      case "root":
        return `\\sqrt${convert(node.querySelector("m\\:e, e"))}`;
      case "bar":
      case "barOver":
        return `\\overline{${convert(node.querySelector("m\\:e, e"))}}`;
      case "barUnder":
        return `\\underline{${convert(node.querySelector("m\\:e, e"))}}`;
      case "acc":
      case "accent":
        return `\\hat{${convert(node.querySelector("m\\:e, e"))}}`;
      case "lim":
        return `\\lim_{${convert(node.querySelector("m\\:lim, lim"))}}`;
      case "func": {
        const name = convert(node.querySelector("m\\:func, func, m\\:fName, fName"));
        const arg = convert(node.querySelector("m\\:arg, arg, m\\:e, e"));
        return `${name}${arg}`;
      }
      case "r":
      case "t":
      case "n":
      case "o":
        return node.textContent || "";
      case "s":
        return `\\space${node.textContent || ""}`;
      case "b":
        return `\\mathbf{${node.textContent || ""}}`;
      case "i":
        return `\\mathit{${node.textContent || ""}}`;
      default:
        return convertChildren(node);
    }
  }

  function convertChildren(node: Element): string {
    const parts: string[] = [];
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        parts.push(convert(child as Element));
      } else if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent?.trim();
        if (text) parts.push(text);
      }
    }
    return parts.join("");
  }

  const converted = convert(omml);
  return `<span class="katex">${converted}</span>`;
}
