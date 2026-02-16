/* eslint-disable no-case-declarations */
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

  function convert(node: Element | null): Element | null {
    if (!node) return null;

    const localName = node.localName || "";
    let result: Element;

    switch (localName) {
      case "oMath":
      case "m":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mrow");
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const converted = convert(child as Element);
            if (converted) result.appendChild(converted);
          } else if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.trim();
            if (text) {
              const mtext = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mtext");
              mtext.textContent = text;
              result.appendChild(mtext);
            }
          }
        }
        break;

      case "f":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mfrac");
        const num = node.querySelector("m\\:num, num");
        const den = node.querySelector("m\\:den, den");
        if (num) {
          const converted = convert(num);
          if (converted) result.appendChild(converted);
        }
        if (den) {
          const convertedDen = convert(den);
          if (convertedDen) result.appendChild(convertedDen);
        }
        break;

      case "sup":
      case "sSup":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "msup");
        const supBase = node.querySelector("m\\:e, e");
        const supSup = node.querySelector("m\\:sup, sup");
        if (supBase) {
          const converted = convert(supBase);
          if (converted) result.appendChild(converted);
        }
        if (supSup) {
          const convertedSup = convert(supSup);
          if (convertedSup) result.appendChild(convertedSup);
        }
        break;

      case "sub":
      case "sSub":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "msub");
        const subBase = node.querySelector("m\\:e, e");
        const subSub = node.querySelector("m\\:sub, sub");
        if (subBase) {
          const converted = convert(subBase);
          if (converted) result.appendChild(converted);
        }
        if (subSub) {
          const convertedSub = convert(subSub);
          if (convertedSub) result.appendChild(convertedSub);
        }
        break;

      case "sSubSup":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "msubsup");
        const subSupBase = node.querySelector("m\\:e, e");
        const subSupSub = node.querySelector("m\\:sub, sub");
        const subSupSup = node.querySelector("m\\:sup, sup");
        if (subSupBase) {
          const converted = convert(subSupBase);
          if (converted) result.appendChild(converted);
        }
        if (subSupSub) {
          const convertedSub = convert(subSupSub);
          if (convertedSub) result.appendChild(convertedSub);
        }
        if (subSupSup) {
          const convertedSup = convert(subSupSup);
          if (convertedSup) result.appendChild(convertedSup);
        }
        break;

      case "rad":
      case "root":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mroot");
        const rootBase = node.querySelector("m\\:e, e");
        const rootDeg = node.querySelector("m\\:deg, deg, m\\:degree, degree");
        if (rootBase) {
          const converted = convert(rootBase);
          if (converted) result.appendChild(converted);
        }
        if (rootDeg) {
          const convertedDeg = convert(rootDeg);
          if (convertedDeg) result.appendChild(convertedDeg);
        } else {
          const deg = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mn");
          deg.textContent = "2";
          result.appendChild(deg);
        }
        break;

      case "bar":
      case "barOver":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mover");
        const barBase = node.querySelector("m\\:e, e");
        if (barBase) {
          const converted = convert(barBase);
          if (converted) result.appendChild(converted);
        }
        const overBar = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mo");
        overBar.textContent = "̄";
        result.appendChild(overBar);
        break;

      case "barUnder":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "munder");
        const underBase = node.querySelector("m\\:e, e");
        if (underBase) {
          const converted = convert(underBase);
          if (converted) result.appendChild(converted);
        }
        const underLine = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mo");
        underLine.textContent = "̱";
        result.appendChild(underLine);
        break;

      case "acc":
      case "accent":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mover");
        const accBase = node.querySelector("m\\:e, e");
        const accChar = node.getAttribute("chr") || "^";
        if (accBase) {
          const converted = convert(accBase);
          if (converted) result.appendChild(converted);
        }
        const accent = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mo");
        accent.textContent = accChar;
        result.appendChild(accent);
        break;

      case "lim":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "munderover");
        const limBase = node.querySelector("m\\:e, e");
        const limLow = node.querySelector("m\\:lim, lim, m\\:bottom, bottom");
        if (limBase) {
          const converted = convert(limBase);
          if (converted) result.appendChild(converted);
        }
        if (limLow) {
          const convertedLow = convert(limLow);
          if (convertedLow) result.appendChild(convertedLow);
        }
        const limSym = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mi");
        limSym.textContent = "lim";
        result.appendChild(limSym);
        break;

      case "func":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mrow");
        const funcName = node.querySelector("m\\:func, func, m\\:fName, fName");
        const funcArg = node.querySelector("m\\:arg, arg, m\\:e, e");
        if (funcName) {
          const convertedName = convert(funcName);
          if (convertedName) result.appendChild(convertedName);
        }
        if (funcArg) {
          const convertedArg = convert(funcArg);
          if (convertedArg) result.appendChild(convertedArg);
        }
        break;

      case "r":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mi");
        result.textContent = node.textContent || "";
        break;

      case "t":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mtext");
        result.textContent = node.textContent || "";
        break;

      case "n":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mn");
        result.textContent = node.textContent || "";
        break;

      case "o":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mo");
        result.textContent = node.textContent || "";
        break;

      case "s":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "ms");
        result.setAttribute("stretchy", "false");
        result.textContent = node.textContent || "";
        break;

      case "b":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mi");
        result.setAttribute("font-weight", "bold");
        result.textContent = node.textContent || "";
        break;

      case "i":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mi");
        result.setAttribute("font-style", "italic");
        result.textContent = node.textContent || "";
        break;

      case "span":
      case "sp":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mrow");
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const converted = convert(child as Element);
            if (converted) result.appendChild(converted);
          }
        }
        break;

      case "box":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mpadded");
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const converted = convert(child as Element);
            if (converted) result.appendChild(converted);
          }
        }
        break;

      case "groupChr":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mover");
        const groupChrBase = node.querySelector("m\\:e, e");
        const groupChrChr = node.getAttribute("chr") || "{";
        if (groupChrBase) {
          const converted = convert(groupChrBase);
          if (converted) result.appendChild(converted);
        }
        const groupChr = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mo");
        groupChr.textContent = groupChrChr;
        result.appendChild(groupChr);
        break;

      case "borderBox":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "menclose");
        result.setAttribute("notation", "top bottom left right");
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const converted = convert(child as Element);
            if (converted) result.appendChild(converted);
          }
        }
        break;

      case "d":
      case "deg":
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "msup");
        const degBase = node.previousElementSibling;
        if (degBase) {
          const converted = convert(degBase);
          if (converted) result.appendChild(converted);
        }
        const degNum = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mn");
        degNum.textContent = node.textContent || "0";
        result.appendChild(degNum);
        break;

      default:
        result = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mrow");
        for (const child of Array.from(node.childNodes)) {
          if (child.nodeType === Node.ELEMENT_NODE) {
            const converted = convert(child as Element);
            if (converted) result.appendChild(converted);
          } else if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent?.trim();
            if (text) {
              const mtext = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mtext");
              mtext.textContent = text;
              result.appendChild(mtext);
            }
          }
        }
    }

    return result;
  }

  const converted = convert(omml);
  if (converted) math.appendChild(converted);

  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${math.innerHTML}</math>`;
}

function ommlToKaTeX(omml: Element): string {
  function convert(node: Element | null): string {
    if (!node) return "";

    const localName = node.localName || "";

    switch (localName) {
      case "oMath":
      case "m":
        return Array.from(node.childNodes)
          .map(child => child.nodeType === Node.ELEMENT_NODE ? convert(child as Element) : "")
          .join(" ");

      case "f":
        const num = node.querySelector("m\\:num, num");
        const den = node.querySelector("m\\:den, den");
        return `\\frac{${convert(num)}}{${convert(den)}}`;

      case "sup":
      case "sSup":
        const supBase = node.querySelector("m\\:e, e");
        const supSup = node.querySelector("m\\:sup, sup");
        return `{${convert(supBase)}}^{${convert(supSup)}}`;

      case "sub":
      case "sSub":
        const subBase = node.querySelector("m\\:e, e");
        const subSub = node.querySelector("m\\:sub, sub");
        return `{${convert(subBase)}}_{${convert(subSub)}}`;

      case "sSubSup":
        const subSupBase = node.querySelector("m\\:e, e");
        const subSupSub = node.querySelector("m\\:sub, sub");
        const subSupSup = node.querySelector("m\\:sup, sup");
        return `{${convert(subSupBase)}}_{${convert(subSupSub)}}^{${convert(subSupSup)}}`;

      case "rad":
      case "root":
        const rootBase = node.querySelector("m\\:e, e");
        const rootDeg = node.querySelector("m\\:deg, deg, m\\:degree, degree");
        if (rootDeg) {
          return `\\sqrt[${convert(rootDeg)}]{${convert(rootBase)}}`;
        }
        return `\\sqrt{${convert(rootBase)}}`;

      case "bar":
      case "barOver":
        const barBase = node.querySelector("m\\:e, e");
        return `\\overline{${convert(barBase)}}`;

      case "barUnder":
        const underBase = node.querySelector("m\\:e, e");
        return `\\underline{${convert(underBase)}}`;

      case "lim":
        const limBase = node.querySelector("m\\:e, e");
        const limLow = node.querySelector("m\\:lim, lim, m\\:bottom, bottom");
        return `\\lim_{${convert(limLow)}} ${convert(limBase)}`;

      case "func":
        const funcName = node.querySelector("m\\:func, func, m\\:fName, fName");
        const funcArg = node.querySelector("m\\:arg, arg, m\\:e, e");
        return `${convert(funcName)}${convert(funcArg)}`;

      case "r":
      case "t":
        return node.textContent || "";

      case "n":
        return node.textContent || "";

      case "o":
        return node.textContent || "";

      case "b":
        return `\\mathbf{${node.textContent || ""}}`;

      case "i":
        return `\\textit{${node.textContent || ""}}`;

      case "box":
        return `\\boxed{${Array.from(node.childNodes)
          .map(child => child.nodeType === Node.ELEMENT_NODE ? convert(child as Element) : "")
          .join(" ")}}`;

      case "groupChr":
        const groupBase = node.querySelector("m\\:e, e");
        return `\\underbrace{${convert(groupBase)}}`;

      case "borderBox":
        return `\\fbox{${Array.from(node.childNodes)
          .map(child => child.nodeType === Node.ELEMENT_NODE ? convert(child as Element) : "")
          .join(" ")}}`;

      default:
        return Array.from(node.childNodes)
          .map(child => child.nodeType === Node.ELEMENT_NODE ? convert(child as Element) : "")
          .join(" ");
    }
  }

  const katexContent = convert(omml);
  return `<span class="katex" data-katex="${encodeURIComponent(katexContent)}">${katexContent}</span>`;
}
