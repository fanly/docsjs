import JSZip from "jszip";
import { buildHtmlSnapshot } from "./htmlSnapshot";

interface RelMap {
  [rid: string]: string;
}

interface DrawingSizePx {
  widthPx: number | null;
  heightPx: number | null;
}

interface FootnoteMap {
  [id: string]: string;
}

interface CommentInfo {
  author: string | null;
  date: string | null;
  text: string;
}

interface CommentMap {
  [id: string]: CommentInfo;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseXml(xmlText: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(xmlText, "application/xml");
}

function queryAllByLocalName(root: ParentNode, localName: string): Element[] {
  return Array.from(root.querySelectorAll("*")).filter((el) => el.localName === localName);
}

function queryByLocalName(root: ParentNode, localName: string): Element | null {
  return queryAllByLocalName(root, localName)[0] ?? null;
}

function directChildrenByLocalName(node: Element, localName: string): Element[] {
  return Array.from(node.children).filter((child) => child.localName === localName);
}

function getAttr(node: Element | null, name: string): string | null {
  if (!node) return null;
  return node.getAttribute(name);
}

function emuToPx(emu: number): number {
  return (emu * 96) / 914400;
}

function parseDrawingSizePx(drawing: Element): DrawingSizePx {
  const extentNode =
    queryAllByLocalName(drawing, "extent").find((node) => {
      const parent = node.parentElement;
      return parent?.localName === "inline" || parent?.localName === "anchor";
    }) ?? null;
  if (!extentNode) {
    return { widthPx: null, heightPx: null };
  }

  const rawCx = getAttr(extentNode, "cx");
  const rawCy = getAttr(extentNode, "cy");
  const cx = rawCx ? Number.parseInt(rawCx, 10) : Number.NaN;
  const cy = rawCy ? Number.parseInt(rawCy, 10) : Number.NaN;

  const widthPx = Number.isFinite(cx) && cx > 0 ? emuToPx(cx) : null;
  const heightPx = Number.isFinite(cy) && cy > 0 ? emuToPx(cy) : null;
  return { widthPx, heightPx };
}

function imageDimensionAttributes(sizePx: DrawingSizePx): string {
  const attrs: string[] = [];
  if (sizePx.widthPx !== null) attrs.push(`width="${Math.round(sizePx.widthPx)}"`);
  if (sizePx.heightPx !== null) attrs.push(`height="${Math.round(sizePx.heightPx)}"`);
  if (sizePx.widthPx !== null || sizePx.heightPx !== null) {
    const style: string[] = ["max-width:100%"];
    if (sizePx.widthPx !== null) style.push(`width:${sizePx.widthPx.toFixed(2)}px`);
    if (sizePx.heightPx !== null) style.push(`height:${sizePx.heightPx.toFixed(2)}px`);
    attrs.push(`style="${style.join(";")}"`);
  }
  return attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
}

interface AnchorPositionPx {
  leftPx: number | null;
  topPx: number | null;
}

type AnchorWrapMode = "square" | "tight" | "topAndBottom" | "none" | null;

function parseAnchorPositionPx(drawing: Element): AnchorPositionPx {
  const anchor = directChildrenByLocalName(drawing, "anchor")[0] ?? null;
  if (!anchor) return { leftPx: null, topPx: null };

  let leftPx: number | null = null;
  let topPx: number | null = null;

  const positionH = directChildrenByLocalName(anchor, "positionH")[0] ?? null;
  const positionV = directChildrenByLocalName(anchor, "positionV")[0] ?? null;
  const posH = positionH ? directChildrenByLocalName(positionH, "posOffset")[0] ?? null : null;
  const posV = positionV ? directChildrenByLocalName(positionV, "posOffset")[0] ?? null : null;

  const rawLeft = posH?.textContent?.trim() ?? "";
  const rawTop = posV?.textContent?.trim() ?? "";
  const left = rawLeft ? Number.parseFloat(rawLeft) : Number.NaN;
  const top = rawTop ? Number.parseFloat(rawTop) : Number.NaN;

  if (Number.isFinite(left)) leftPx = emuToPx(left);
  if (Number.isFinite(top)) topPx = emuToPx(top);
  return { leftPx, topPx };
}

function parseAnchorWrapMode(drawing: Element): AnchorWrapMode {
  const anchor = directChildrenByLocalName(drawing, "anchor")[0] ?? null;
  if (!anchor) return null;
  if (directChildrenByLocalName(anchor, "wrapSquare")[0]) return "square";
  if (directChildrenByLocalName(anchor, "wrapTight")[0]) return "tight";
  if (directChildrenByLocalName(anchor, "wrapTopAndBottom")[0]) return "topAndBottom";
  if (directChildrenByLocalName(anchor, "wrapNone")[0]) return "none";
  return null;
}

function mergeImageStyle(baseAttrs: string, anchorPos: AnchorPositionPx, wrapMode: AnchorWrapMode): string {
  if (anchorPos.leftPx === null && anchorPos.topPx === null) return baseAttrs;
  const styleParts = [
    "position:absolute",
    anchorPos.leftPx !== null ? `left:${anchorPos.leftPx.toFixed(2)}px` : "",
    anchorPos.topPx !== null ? `top:${anchorPos.topPx.toFixed(2)}px` : "",
    "z-index:3"
  ].filter((x) => x.length > 0);

  if (wrapMode === "topAndBottom") {
    styleParts.push("display:block");
  }

  if (!baseAttrs.includes("style=")) {
    const wrapAttr = wrapMode ? ` data-word-wrap="${wrapMode}"` : "";
    return `${baseAttrs} style="${styleParts.join(";")}" data-word-anchor="1"${wrapAttr}`;
  }

  return baseAttrs.replace(/style="([^"]*)"/, (_m, styleText: string) => {
    const merged = [styleText, ...styleParts].filter((x) => x.length > 0).join(";");
    const wrapAttr = wrapMode ? ` data-word-wrap="${wrapMode}"` : "";
    return `style="${merged}" data-word-anchor="1"${wrapAttr}`;
  });
}

function parseDocRelsMap(relsXmlText: string | null): RelMap {
  if (!relsXmlText) return {};
  const rels = parseXml(relsXmlText);
  const relationNodes = queryAllByLocalName(rels, "Relationship");
  const map: RelMap = {};
  for (const rel of relationNodes) {
    const id = getAttr(rel, "Id");
    const target = getAttr(rel, "Target");
    if (!id || !target) continue;
    map[id] = target;
  }
  return map;
}

function extToMime(ext: string): string {
  const lower = ext.toLowerCase();
  if (lower === "png") return "image/png";
  if (lower === "jpg" || lower === "jpeg") return "image/jpeg";
  if (lower === "gif") return "image/gif";
  if (lower === "webp") return "image/webp";
  if (lower === "bmp") return "image/bmp";
  if (lower === "svg") return "image/svg+xml";
  return "application/octet-stream";
}

async function imageRidToDataUrl(zip: JSZip, relMap: RelMap, rid: string): Promise<string | null> {
  const relTarget = relMap[rid];
  if (!relTarget) return null;
  const normalized = relTarget.replace(/^\/+/, "");
  const path = normalized.startsWith("word/") ? normalized : `word/${normalized}`;
  const file = zip.file(path);
  if (!file) return null;
  const base64 = await file.async("base64");
  const ext = path.split(".").pop() ?? "bin";
  const mime = extToMime(ext);
  return `data:${mime};base64,${base64}`;
}

function runStyleToCss(rPr: Element | null): string {
  if (!rPr) return "";
  const declarations: string[] = [];

  if (queryByLocalName(rPr, "b")) declarations.push("font-weight:700");
  if (queryByLocalName(rPr, "i")) declarations.push("font-style:italic");
  if (queryByLocalName(rPr, "u")) declarations.push("text-decoration:underline");
  if (queryByLocalName(rPr, "strike")) declarations.push("text-decoration:line-through");

  const color = queryByLocalName(rPr, "color");
  const colorVal = getAttr(color, "w:val") ?? getAttr(color, "val");
  if (colorVal && colorVal.toLowerCase() !== "auto") declarations.push(`color:#${colorVal}`);

  const highlight = queryByLocalName(rPr, "highlight");
  const highlightVal = (getAttr(highlight, "w:val") ?? getAttr(highlight, "val") ?? "").toLowerCase();
  if (highlightVal === "yellow") declarations.push("background-color:#fff200");

  const vertAlign = queryByLocalName(rPr, "vertAlign");
  const vertVal = (getAttr(vertAlign, "w:val") ?? getAttr(vertAlign, "val") ?? "").toLowerCase();
  if (vertVal === "superscript") declarations.push("vertical-align:super;font-size:0.83em");
  if (vertVal === "subscript") declarations.push("vertical-align:sub;font-size:0.83em");

  return declarations.join(";");
}

function paragraphTag(paragraph: Element): "p" | "h1" | "h2" | "h3" {
  const pPr = queryByLocalName(paragraph, "pPr");
  const pStyle = pPr ? queryByLocalName(pPr, "pStyle") : null;
  const val = (getAttr(pStyle, "w:val") ?? getAttr(pStyle, "val") ?? "").toLowerCase();
  if (val.includes("heading1") || val === "1" || val === "heading 1") return "h1";
  if (val.includes("heading2") || val === "2" || val === "heading 2") return "h2";
  if (val.includes("heading3") || val === "3" || val === "heading 3") return "h3";
  return "p";
}

function paragraphAlignStyle(paragraph: Element): string {
  const pPr = queryByLocalName(paragraph, "pPr");
  const jc = pPr ? queryByLocalName(pPr, "jc") : null;
  const align = (getAttr(jc, "w:val") ?? getAttr(jc, "val") ?? "").toLowerCase();
  if (align === "center" || align === "right" || align === "left") {
    return `text-align:${align};`;
  }
  return "";
}

function paragraphDataAttr(paragraphIndex: number | null): string {
  return paragraphIndex === null ? "" : ` data-word-p-index="${paragraphIndex}"`;
}

function parseFootnotesMap(footnotesXmlText: string | null): FootnoteMap {
  if (!footnotesXmlText) return {};
  const footnotesDoc = parseXml(footnotesXmlText);
  const map: FootnoteMap = {};
  const footnotes = queryAllByLocalName(footnotesDoc, "footnote");
  for (const footnote of footnotes) {
    const idRaw = getAttr(footnote, "w:id") ?? getAttr(footnote, "id");
    const idNum = idRaw ? Number.parseInt(idRaw, 10) : Number.NaN;
    if (!Number.isFinite(idNum) || idNum <= 0) continue;

    const paragraphs = queryAllByLocalName(footnote, "p");
    const text = paragraphs.map((p) => paragraphText(p)).join("<br/>").trim();
    if (!text) continue;
    map[String(idNum)] = text;
  }
  return map;
}

function parseCommentsMap(commentsXmlText: string | null): CommentMap {
  if (!commentsXmlText) return {};
  const commentsDoc = parseXml(commentsXmlText);
  const map: CommentMap = {};
  const comments = queryAllByLocalName(commentsDoc, "comment");
  for (const comment of comments) {
    const idRaw = getAttr(comment, "w:id") ?? getAttr(comment, "id");
    if (!idRaw) continue;
    const paragraphs = queryAllByLocalName(comment, "p");
    const text = paragraphs.map((p) => paragraphText(p)).join("<br/>").trim();
    if (!text) continue;
    map[idRaw] = {
      author: getAttr(comment, "w:author") ?? getAttr(comment, "author"),
      date: getAttr(comment, "w:date") ?? getAttr(comment, "date"),
      text
    };
  }
  return map;
}

function parseEndnotesMap(endnotesXmlText: string | null): FootnoteMap {
  if (!endnotesXmlText) return {};
  const endnotesDoc = parseXml(endnotesXmlText);
  const map: FootnoteMap = {};
  const endnotes = queryAllByLocalName(endnotesDoc, "endnote");
  for (const endnote of endnotes) {
    const idRaw = getAttr(endnote, "w:id") ?? getAttr(endnote, "id");
    const idNum = idRaw ? Number.parseInt(idRaw, 10) : Number.NaN;
    if (!Number.isFinite(idNum) || idNum <= 0) continue;

    const paragraphs = queryAllByLocalName(endnote, "p");
    const text = paragraphs.map((p) => paragraphText(p)).join("<br/>").trim();
    if (!text) continue;
    map[String(idNum)] = text;
  }
  return map;
}

function renderFootnotesSection(usedIds: string[], footnotesMap: FootnoteMap): string {
  const uniq = [...new Set(usedIds)].filter((id) => footnotesMap[id]);
  if (uniq.length === 0) return "";
  const items = uniq
    .map((id) => `<li id="word-footnote-${id}" data-word-footnote-id="${id}">${footnotesMap[id]}</li>`)
    .join("");
  return `<section data-word-footnotes="1"><hr/><ol>${items}</ol></section>`;
}

function renderCommentsSection(usedIds: string[], commentsMap: CommentMap): string {
  const uniq = [...new Set(usedIds)].filter((id) => commentsMap[id]);
  if (uniq.length === 0) return "";
  const items = uniq
    .map((id) => {
      const item = commentsMap[id];
      const meta = [item.author ?? "", item.date ?? ""].filter((x) => x.length > 0).join(" · ");
      const metaHtml = meta ? `<div data-word-comment-meta="1">${escapeHtml(meta)}</div>` : "";
      return `<li id="word-comment-${id}" data-word-comment-id="${id}">${metaHtml}<div>${item.text}</div></li>`;
    })
    .join("");
  return `<section data-word-comments="1"><hr/><ol>${items}</ol></section>`;
}

function renderEndnotesSection(usedIds: string[], endnotesMap: FootnoteMap): string {
  const uniq = [...new Set(usedIds)].filter((id) => endnotesMap[id]);
  if (uniq.length === 0) return "";
  const items = uniq
    .map((id) => `<li id="word-endnote-${id}" data-word-endnote-id="${id}">${endnotesMap[id]}</li>`)
    .join("");
  return `<section data-word-endnotes="1"><hr/><ol>${items}</ol></section>`;
}

async function paragraphToHtml(
  zip: JSZip,
  relMap: RelMap,
  paragraph: Element,
  paragraphIndex: number | null,
  footnotesMap: FootnoteMap,
  usedFootnoteIds: string[],
  endnotesMap: FootnoteMap,
  usedEndnoteIds: string[],
  commentsMap: CommentMap,
  usedCommentIds: string[]
): Promise<string> {
  const tag = paragraphTag(paragraph);
  const alignStyle = paragraphAlignStyle(paragraph);
  const dataAttr = paragraphDataAttr(paragraphIndex);
  const runs = queryAllByLocalName(paragraph, "r");
  if (runs.length === 0) {
    return `<${tag}${dataAttr}${alignStyle ? ` style="${alignStyle}"` : ""}><br/></${tag}>`;
  }

  const parts: string[] = [];
  const renderedPageBreakCount = queryAllByLocalName(paragraph, "lastRenderedPageBreak").length;
  for (let i = 0; i < renderedPageBreakCount; i += 1) {
    parts.push(`<span data-word-page-break="1" style="display:block;break-before:page"></span>`);
  }
  for (const run of runs) {
    const rPr = queryByLocalName(run, "rPr");
    const css = runStyleToCss(rPr);

    const footnoteRef = queryByLocalName(run, "footnoteReference");
    const footnoteId = getAttr(footnoteRef, "w:id") ?? getAttr(footnoteRef, "id");
    if (footnoteId && footnotesMap[footnoteId]) {
      usedFootnoteIds.push(footnoteId);
      parts.push(
        `<sup data-word-footnote-ref="${footnoteId}"><a href="#word-footnote-${footnoteId}">[${footnoteId}]</a></sup>`
      );
      continue;
    }

    const endnoteRef = queryByLocalName(run, "endnoteReference");
    const endnoteId = getAttr(endnoteRef, "w:id") ?? getAttr(endnoteRef, "id");
    if (endnoteId && endnotesMap[endnoteId]) {
      usedEndnoteIds.push(endnoteId);
      parts.push(
        `<sup data-word-endnote-ref="${endnoteId}"><a href="#word-endnote-${endnoteId}">[${endnoteId}]</a></sup>`
      );
      continue;
    }

    const commentRef = queryByLocalName(run, "commentReference");
    const commentId = getAttr(commentRef, "w:id") ?? getAttr(commentRef, "id");
    if (commentId && commentsMap[commentId]) {
      usedCommentIds.push(commentId);
      parts.push(
        `<sup data-word-comment-ref="${commentId}"><a href="#word-comment-${commentId}">[c${commentId}]</a></sup>`
      );
      continue;
    }

    const drawing = queryByLocalName(run, "drawing");
    if (drawing) {
      const blip = queryByLocalName(drawing, "blip");
      const rid = getAttr(blip, "r:embed") ?? getAttr(blip, "embed");
      if (rid) {
        const src = await imageRidToDataUrl(zip, relMap, rid);
        if (src) {
          const imageSize = parseDrawingSizePx(drawing);
          const dimensionAttrs = imageDimensionAttributes(imageSize);
          const anchorPos = parseAnchorPositionPx(drawing);
          const wrapMode = parseAnchorWrapMode(drawing);
          const attrs = mergeImageStyle(dimensionAttrs, anchorPos, wrapMode);
          parts.push(`<img src="${src}" alt="word-image"${attrs}/>`);
          continue;
        }
      }
    }

    const texts = queryAllByLocalName(run, "t").map((t) => t.textContent ?? "").join("");
    const delTexts = queryAllByLocalName(run, "delText").map((t) => t.textContent ?? "").join("");
    const brNodes = queryAllByLocalName(run, "br");
    const pageBreakCount = brNodes.filter((node) => {
      const type = (getAttr(node, "w:type") ?? getAttr(node, "type") ?? "").toLowerCase();
      return type === "page";
    }).length;
    const lineBreakCount = Math.max(0, brNodes.length - pageBreakCount);
    const runText = `${escapeHtml(texts || delTexts)}${"<br/>".repeat(lineBreakCount)}`;
    if (!runText) continue;

    let revisionType: "ins" | "del" | null = null;
    let cursor: Element | null = run;
    while (cursor) {
      if (cursor.localName === "ins") {
        revisionType = "ins";
        break;
      }
      if (cursor.localName === "del") {
        revisionType = "del";
        break;
      }
      if (cursor.localName === "p") break;
      cursor = cursor.parentElement;
    }
    if (css) {
      const span = `<span style="${css}">${runText}</span>`;
      if (revisionType) {
        const tag = revisionType === "ins" ? "ins" : "del";
        parts.push(`<${tag} data-word-revision="${revisionType}">${span}</${tag}>`);
      } else {
        parts.push(span);
      }
    } else {
      if (revisionType) {
        const tag = revisionType === "ins" ? "ins" : "del";
        parts.push(`<${tag} data-word-revision="${revisionType}">${runText}</${tag}>`);
      } else {
        parts.push(runText);
      }
    }

    for (let i = 0; i < pageBreakCount; i += 1) {
      parts.push(`<span data-word-page-break="1" style="display:block;break-before:page"></span>`);
    }
  }

  const content = parts.join("") || "<br/>";
  return `<${tag}${dataAttr}${alignStyle ? ` style="${alignStyle}"` : ""}>${content}</${tag}>`;
}

function runText(run: Element): string {
  const text = queryAllByLocalName(run, "t").map((t) => t.textContent ?? "").join("");
  const delText = queryAllByLocalName(run, "delText").map((t) => t.textContent ?? "").join("");
  const brCount = queryAllByLocalName(run, "br").length;
  return `${escapeHtml(text || delText)}${"<br/>".repeat(brCount)}`;
}

function paragraphText(paragraph: Element): string {
  const runs = queryAllByLocalName(paragraph, "r");
  const content = runs.map((run) => runText(run)).join("");
  return content || "<br/>";
}

function parseTcGridSpan(tc: Element): number {
  const tcPr = directChildrenByLocalName(tc, "tcPr")[0] ?? null;
  const gridSpan = tcPr ? directChildrenByLocalName(tcPr, "gridSpan")[0] ?? null : null;
  const rawVal = getAttr(gridSpan, "w:val") ?? getAttr(gridSpan, "val");
  const parsed = rawVal ? Number.parseInt(rawVal, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseTcVMerge(tc: Element): "none" | "restart" | "continue" {
  const tcPr = directChildrenByLocalName(tc, "tcPr")[0] ?? null;
  const vMerge = tcPr ? directChildrenByLocalName(tcPr, "vMerge")[0] ?? null : null;
  if (!vMerge) return "none";
  const rawVal = (getAttr(vMerge, "w:val") ?? getAttr(vMerge, "val") ?? "continue").toLowerCase();
  return rawVal === "restart" ? "restart" : "continue";
}

function tableCellHtml(cell: Element, paragraphIndexMap: Map<Element, number>): string {
  const blocks: string[] = [];
  for (const child of Array.from(cell.children)) {
    if (child.localName === "tcPr") continue;
    if (child.localName === "p") {
      const paragraphIndex = paragraphIndexMap.get(child) ?? null;
      blocks.push(`<p${paragraphDataAttr(paragraphIndex)}>${paragraphText(child)}</p>`);
      continue;
    }
    if (child.localName === "tbl") {
      blocks.push(tableToHtml(child, paragraphIndexMap));
      continue;
    }
  }

  if (blocks.length > 0) return blocks.join("");
  const text = queryAllByLocalName(cell, "t").map((t) => t.textContent ?? "").join("").trim();
  return escapeHtml(text) || "<br/>";
}

function tableToHtml(table: Element, paragraphIndexMap: Map<Element, number>): string {
  const rows = directChildrenByLocalName(table, "tr");

  type MergeOrigin = {
    id: string;
    startCol: number;
    colSpan: number;
    rowSpan: number;
    startedRow: number;
  };

  const activeByCol = new Map<number, MergeOrigin>();
  const allOrigins: MergeOrigin[] = [];
  let nextOriginId = 1;

  const htmlRows = rows.map((row, rowIndex) => {
    const directCells = directChildrenByLocalName(row, "tc");
    const continued = new Set<MergeOrigin>();
    const emittedCells: string[] = [];
    let colCursor = 0;

    for (const cell of directCells) {
      const colSpan = parseTcGridSpan(cell);
      const vMerge = parseTcVMerge(cell);

      if (vMerge === "continue") {
        const activeOrigins = Array.from(new Set(activeByCol.values()))
          .filter((origin) => !continued.has(origin))
          .sort((a, b) => a.startCol - b.startCol);
        const origin =
          activeOrigins.find((item) => item.startCol >= colCursor) ??
          activeOrigins[0] ??
          null;
        if (origin) {
          origin.rowSpan += 1;
          continued.add(origin);
          colCursor = origin.startCol + origin.colSpan;
        }
        continue;
      }

      while (activeByCol.has(colCursor)) {
        colCursor += 1;
      }

      const html = tableCellHtml(cell, paragraphIndexMap);
      const attrs: string[] = [];
      if (vMerge === "restart") {
        const origin: MergeOrigin = {
          id: `m${nextOriginId}`,
          startCol: colCursor,
          colSpan,
          rowSpan: 1,
          startedRow: rowIndex
        };
        nextOriginId += 1;
        allOrigins.push(origin);
        for (let i = 0; i < colSpan; i += 1) {
          activeByCol.set(colCursor + i, origin);
        }
        attrs.push(`data-word-merge-id="${origin.id}"`);
      }

      if (colSpan > 1) attrs.push(`colspan="${colSpan}"`);
      emittedCells.push(
        `<td${attrs.length > 0 ? ` ${attrs.join(" ")}` : ""} style="border:1px solid #222;vertical-align:top;">${html}</td>`
      );
      colCursor += colSpan;
    }

    for (const origin of Array.from(new Set(activeByCol.values()))) {
      if (origin.startedRow < rowIndex && !continued.has(origin)) {
        for (let i = 0; i < origin.colSpan; i += 1) {
          activeByCol.delete(origin.startCol + i);
        }
      }
    }

    return `<tr>${emittedCells.join("")}</tr>`;
  });

  let merged = htmlRows.join("");
  for (const origin of allOrigins) {
    const marker = `data-word-merge-id="${origin.id}"`;
    const replacement = origin.rowSpan > 1 ? `rowspan="${origin.rowSpan}"` : "";
    merged = merged.replace(marker, replacement).replace(/\s{2,}/g, " ");
  }

  return `<table style="border-collapse:collapse;table-layout:fixed;width:100%;border:1px solid #222;">${merged}</table>`;
}

export async function parseDocxToHtmlSnapshot(file: File): Promise<string> {
  const maybeArrayBuffer = (file as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
  const buffer = maybeArrayBuffer ? await maybeArrayBuffer.call(file) : await new Response(file).arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const documentXmlText = await zip.file("word/document.xml")?.async("string");
  if (!documentXmlText) {
    throw new Error("DOCX missing document.xml");
  }
  const relsText = await zip.file("word/_rels/document.xml.rels")?.async("string");
  const footnotesText = await zip.file("word/footnotes.xml")?.async("string");
  const endnotesText = await zip.file("word/endnotes.xml")?.async("string");
  const commentsText = await zip.file("word/comments.xml")?.async("string");
  const relMap = parseDocRelsMap(relsText ?? null);
  const footnotesMap = parseFootnotesMap(footnotesText ?? null);
  const endnotesMap = parseEndnotesMap(endnotesText ?? null);
  const commentsMap = parseCommentsMap(commentsText ?? null);
  const usedFootnoteIds: string[] = [];
  const usedEndnoteIds: string[] = [];
  const usedCommentIds: string[] = [];
  const documentXml = parseXml(documentXmlText);
  const body = queryByLocalName(documentXml, "body");
  if (!body) {
    throw new Error("DOCX missing body");
  }

  const paragraphIndexMap = new Map<Element, number>();
  queryAllByLocalName(documentXml, "p").forEach((paragraph, index) => {
    paragraphIndexMap.set(paragraph, index);
  });

  const blockHtml: string[] = [];
  for (const child of Array.from(body.children)) {
    if (child.localName === "sectPr") continue;
    if (child.localName === "p") {
      const paragraphIndex = paragraphIndexMap.get(child) ?? null;
      blockHtml.push(
        await paragraphToHtml(
          zip,
          relMap,
          child,
          paragraphIndex,
          footnotesMap,
          usedFootnoteIds,
          endnotesMap,
          usedEndnoteIds,
          commentsMap,
          usedCommentIds
        )
      );
      continue;
    }
    if (child.localName === "tbl") {
      blockHtml.push(tableToHtml(child, paragraphIndexMap));
      continue;
    }
  }

  blockHtml.push(renderFootnotesSection(usedFootnoteIds, footnotesMap));
  blockHtml.push(renderEndnotesSection(usedEndnoteIds, endnotesMap));
  blockHtml.push(renderCommentsSection(usedCommentIds, commentsMap));
  return buildHtmlSnapshot(blockHtml.join("\n"));
}
