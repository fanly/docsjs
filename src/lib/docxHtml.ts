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

interface RevisionMeta {
  type: "ins" | "del";
  id: string | null;
  author: string | null;
  date: string | null;
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

function twipToPx(twip: number): number {
  return (twip * 96) / 1440;
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

interface AnchorMeta {
  position: AnchorPositionPx;
  wrapMode: AnchorWrapMode;
  distTPx: number | null;
  distBPx: number | null;
  distLPx: number | null;
  distRPx: number | null;
  relativeFromH: string | null;
  relativeFromV: string | null;
  behindDoc: boolean;
  allowOverlap: boolean;
  layoutInCell: boolean;
  relativeHeight: number | null;
}

function parseAnchorPositionPx(anchor: Element): AnchorPositionPx {
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

function parseAnchorWrapMode(anchor: Element): AnchorWrapMode {
  if (directChildrenByLocalName(anchor, "wrapSquare")[0]) return "square";
  if (directChildrenByLocalName(anchor, "wrapTight")[0]) return "tight";
  if (directChildrenByLocalName(anchor, "wrapTopAndBottom")[0]) return "topAndBottom";
  if (directChildrenByLocalName(anchor, "wrapNone")[0]) return "none";
  return null;
}

function parseAnchorMeta(drawing: Element): AnchorMeta | null {
  const anchor = directChildrenByLocalName(drawing, "anchor")[0] ?? null;
  if (!anchor) return null;

  const positionH = directChildrenByLocalName(anchor, "positionH")[0] ?? null;
  const positionV = directChildrenByLocalName(anchor, "positionV")[0] ?? null;
  const relativeFromH = getAttr(positionH, "relativeFrom");
  const relativeFromV = getAttr(positionV, "relativeFrom");

  const parseDistPx = (name: string): number | null => {
    const raw = getAttr(anchor, name);
    const emu = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(emu) && emu >= 0 ? emuToPx(emu) : null;
  };

  const rawHeight = getAttr(anchor, "relativeHeight");
  const parsedHeight = rawHeight ? Number.parseInt(rawHeight, 10) : Number.NaN;

  const boolAttr = (name: string, fallback: boolean): boolean => {
    const raw = (getAttr(anchor, name) ?? "").toLowerCase();
    if (raw === "1" || raw === "true" || raw === "on") return true;
    if (raw === "0" || raw === "false" || raw === "off") return false;
    return fallback;
  };

  return {
    position: parseAnchorPositionPx(anchor),
    wrapMode: parseAnchorWrapMode(anchor),
    distTPx: parseDistPx("distT"),
    distBPx: parseDistPx("distB"),
    distLPx: parseDistPx("distL"),
    distRPx: parseDistPx("distR"),
    relativeFromH,
    relativeFromV,
    behindDoc: boolAttr("behindDoc", false),
    allowOverlap: boolAttr("allowOverlap", true),
    layoutInCell: boolAttr("layoutInCell", true),
    relativeHeight: Number.isFinite(parsedHeight) ? parsedHeight : null
  };
}

function mergeImageStyle(baseAttrs: string, anchorMeta: AnchorMeta | null): string {
  if (!anchorMeta) return baseAttrs;
  const { position, wrapMode } = anchorMeta;
  if (position.leftPx === null && position.topPx === null) return baseAttrs;
  const styleParts = [
    "position:absolute",
    position.leftPx !== null ? `left:${position.leftPx.toFixed(2)}px` : "",
    position.topPx !== null ? `top:${position.topPx.toFixed(2)}px` : "",
    `z-index:${anchorMeta.behindDoc ? 0 : anchorMeta.relativeHeight ?? 3}`,
    anchorMeta.distTPx !== null ? `margin-top:${anchorMeta.distTPx.toFixed(2)}px` : "",
    anchorMeta.distBPx !== null ? `margin-bottom:${anchorMeta.distBPx.toFixed(2)}px` : "",
    anchorMeta.distLPx !== null ? `margin-left:${anchorMeta.distLPx.toFixed(2)}px` : "",
    anchorMeta.distRPx !== null ? `margin-right:${anchorMeta.distRPx.toFixed(2)}px` : ""
  ].filter((x) => x.length > 0);

  if (wrapMode === "topAndBottom") {
    styleParts.push("display:block", "clear:both");
  }

  const anchorAttrs = [
    `data-word-anchor="1"`,
    wrapMode ? `data-word-wrap="${wrapMode}"` : "",
    anchorMeta.relativeFromH ? `data-word-anchor-relh="${escapeHtml(anchorMeta.relativeFromH)}"` : "",
    anchorMeta.relativeFromV ? `data-word-anchor-relv="${escapeHtml(anchorMeta.relativeFromV)}"` : "",
    anchorMeta.behindDoc ? `data-word-anchor-behind="1"` : `data-word-anchor-behind="0"`,
    anchorMeta.allowOverlap ? `data-word-anchor-overlap="1"` : `data-word-anchor-overlap="0"`,
    anchorMeta.layoutInCell ? `data-word-anchor-layout-cell="1"` : `data-word-anchor-layout-cell="0"`
  ]
    .filter((x) => x.length > 0)
    .join(" ");

  if (!baseAttrs.includes("style=")) {
    return `${baseAttrs} style="${styleParts.join(";")}" ${anchorAttrs}`;
  }

  return baseAttrs.replace(/style="([^"]*)"/, (_m, styleText: string) => {
    const merged = [styleText, ...styleParts].filter((x) => x.length > 0).join(";");
    return `style="${merged}" ${anchorAttrs}`;
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

function normalizeWordPath(relTarget: string): string {
  const normalized = relTarget.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized.startsWith("word/")) return normalized;
  if (normalized.startsWith("../")) return `word/${normalized.replace(/^(\.\.\/)+/, "")}`;
  return `word/${normalized}`;
}

async function imageRidToDataUrl(zip: JSZip, relMap: RelMap, rid: string): Promise<string | null> {
  const relTarget = relMap[rid];
  if (!relTarget) return null;
  const path = normalizeWordPath(relTarget);
  const file = zip.file(path);
  if (!file) return null;
  const base64 = await file.async("base64");
  const ext = path.split(".").pop() ?? "bin";
  const mime = extToMime(ext);
  return `data:${mime};base64,${base64}`;
}

async function readXmlByRid(zip: JSZip, relMap: RelMap, rid: string): Promise<string | null> {
  const relTarget = relMap[rid];
  if (!relTarget) return null;
  const path = normalizeWordPath(relTarget);
  const file = zip.file(path);
  return file ? file.async("string") : null;
}

function parseChartType(chartDoc: Document): string {
  const known = ["barChart", "lineChart", "pieChart", "areaChart", "scatterChart", "radarChart", "doughnutChart"];
  for (const type of known) {
    if (queryByLocalName(chartDoc, type)) return type.replace(/Chart$/, "");
  }
  return "unknown";
}

function parseChartSummary(chartXmlText: string): { title: string; type: string; seriesCount: number; pointCount: number } {
  const chartDoc = parseXml(chartXmlText);
  const title = queryAllByLocalName(chartDoc, "t")
    .map((n) => (n.textContent ?? "").trim())
    .find((v) => v.length > 0) ?? "Chart";
  const seriesCount = queryAllByLocalName(chartDoc, "ser").length;
  const pointCount = queryAllByLocalName(chartDoc, "pt").length;
  const type = parseChartType(chartDoc);
  return { title, type, seriesCount, pointCount };
}

function extractSmartArtText(diagramXmlText: string): string[] {
  const diagramDoc = parseXml(diagramXmlText);
  return queryAllByLocalName(diagramDoc, "t")
    .map((n) => (n.textContent ?? "").trim())
    .filter((v) => v.length > 0)
    .slice(0, 12);
}

function ommlNodeToText(node: Element): string {
  if (node.localName === "t") return node.textContent ?? "";
  if (node.localName === "f") {
    const num = queryByLocalName(node, "num");
    const den = queryByLocalName(node, "den");
    return `(${num ? ommlNodeToText(num) : "?"})/(${den ? ommlNodeToText(den) : "?"})`;
  }
  if (node.localName === "sSup") {
    const e = queryByLocalName(node, "e");
    const sup = queryByLocalName(node, "sup");
    return `${e ? ommlNodeToText(e) : ""}^(${sup ? ommlNodeToText(sup) : ""})`;
  }
  if (node.localName === "sSub") {
    const e = queryByLocalName(node, "e");
    const sub = queryByLocalName(node, "sub");
    return `${e ? ommlNodeToText(e) : ""}_(${sub ? ommlNodeToText(sub) : ""})`;
  }
  if (node.localName === "rad") {
    const e = queryByLocalName(node, "e");
    return `sqrt(${e ? ommlNodeToText(e) : ""})`;
  }
  return Array.from(node.children)
    .map((child) => ommlNodeToText(child))
    .join("");
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
  const hasRenderableNode =
    queryAllByLocalName(paragraph, "r").length > 0 ||
    queryAllByLocalName(paragraph, "oMath").length > 0 ||
    queryAllByLocalName(paragraph, "oMathPara").length > 0;
  if (!hasRenderableNode) {
    return `<${tag}${dataAttr}${alignStyle ? ` style="${alignStyle}"` : ""}><br/></${tag}>`;
  }

  function parseRevisionMeta(node: Element, type: "ins" | "del"): RevisionMeta {
    return {
      type,
      id: getAttr(node, "w:id") ?? getAttr(node, "id"),
      author: getAttr(node, "w:author") ?? getAttr(node, "author"),
      date: getAttr(node, "w:date") ?? getAttr(node, "date")
    };
  }

  function inferRevisionMeta(run: Element, fallback: RevisionMeta | null): RevisionMeta | null {
    if (fallback) return fallback;
    let cursor: Element | null = run;
    while (cursor) {
      if (cursor.localName === "ins") return parseRevisionMeta(cursor, "ins");
      if (cursor.localName === "del") return parseRevisionMeta(cursor, "del");
      if (cursor.localName === "p") break;
      cursor = cursor.parentElement;
    }
    return null;
  }

  function revisionMetaAttrs(meta: RevisionMeta): string {
    const attrs: string[] = [`data-word-revision="${meta.type}"`];
    if (meta.id) attrs.push(`data-word-revision-id="${escapeHtml(meta.id)}"`);
    if (meta.author) attrs.push(`data-word-revision-author="${escapeHtml(meta.author)}"`);
    if (meta.date) attrs.push(`data-word-revision-date="${escapeHtml(meta.date)}"`);
    return attrs.join(" ");
  }

  async function runToHtml(run: Element, revisionFallback: RevisionMeta | null): Promise<string[]> {
    const result: string[] = [];
    const rPr = queryByLocalName(run, "rPr");
    const css = runStyleToCss(rPr);

    const footnoteRef = queryByLocalName(run, "footnoteReference");
    const footnoteId = getAttr(footnoteRef, "w:id") ?? getAttr(footnoteRef, "id");
    if (footnoteId && footnotesMap[footnoteId]) {
      usedFootnoteIds.push(footnoteId);
      result.push(
        `<sup data-word-footnote-ref="${footnoteId}"><a href="#word-footnote-${footnoteId}">[${footnoteId}]</a></sup>`
      );
      return result;
    }

    const endnoteRef = queryByLocalName(run, "endnoteReference");
    const endnoteId = getAttr(endnoteRef, "w:id") ?? getAttr(endnoteRef, "id");
    if (endnoteId && endnotesMap[endnoteId]) {
      usedEndnoteIds.push(endnoteId);
      result.push(
        `<sup data-word-endnote-ref="${endnoteId}"><a href="#word-endnote-${endnoteId}">[${endnoteId}]</a></sup>`
      );
      return result;
    }

    const commentRef = queryByLocalName(run, "commentReference");
    const commentId = getAttr(commentRef, "w:id") ?? getAttr(commentRef, "id");
    if (commentId && commentsMap[commentId]) {
      usedCommentIds.push(commentId);
      result.push(
        `<sup data-word-comment-ref="${commentId}"><a href="#word-comment-${commentId}">[c${commentId}]</a></sup>`
      );
      return result;
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
          const anchorMeta = parseAnchorMeta(drawing);
          const attrs = mergeImageStyle(dimensionAttrs, anchorMeta);
          result.push(`<img src="${src}" alt="word-image"${attrs}/>`);
          return result;
        }
      }

      const chartRef = queryByLocalName(drawing, "chart");
      const chartRid = getAttr(chartRef, "r:id") ?? getAttr(chartRef, "id");
      if (chartRid) {
        const chartXmlText = await readXmlByRid(zip, relMap, chartRid);
        if (chartXmlText) {
          const summary = parseChartSummary(chartXmlText);
          result.push(
            `<figure data-word-chart="1" data-word-chart-type="${summary.type}" data-word-chart-series="${summary.seriesCount}" data-word-chart-points="${summary.pointCount}">` +
              `<figcaption>${escapeHtml(summary.title)}</figcaption>` +
              `<div>Chart(${escapeHtml(summary.type)}): series=${summary.seriesCount}, points=${summary.pointCount}</div>` +
              `</figure>`
          );
          return result;
        }
      }

      const smartArtRef = queryByLocalName(drawing, "relIds");
      const smartArtRid = getAttr(smartArtRef, "r:dm") ?? getAttr(smartArtRef, "dm");
      if (smartArtRid) {
        const diagramXmlText = await readXmlByRid(zip, relMap, smartArtRid);
        const textItems = diagramXmlText ? extractSmartArtText(diagramXmlText) : [];
        const preview = textItems.length > 0 ? `: ${escapeHtml(textItems.join(" / "))}` : "";
        result.push(
          `<figure data-word-smartart="1" data-word-smartart-items="${textItems.length}">` +
            `<figcaption>SmartArt fallback${preview}</figcaption>` +
            `</figure>`
        );
        return result;
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
    if (runText) {
      const revisionMeta = inferRevisionMeta(run, revisionFallback);
      if (css) {
        const span = `<span style="${css}">${runText}</span>`;
        if (revisionMeta) {
          const tagName = revisionMeta.type === "ins" ? "ins" : "del";
          result.push(`<${tagName} ${revisionMetaAttrs(revisionMeta)}>${span}</${tagName}>`);
        } else {
          result.push(span);
        }
      } else if (revisionMeta) {
        const tagName = revisionMeta.type === "ins" ? "ins" : "del";
        result.push(`<${tagName} ${revisionMetaAttrs(revisionMeta)}>${runText}</${tagName}>`);
      } else {
        result.push(runText);
      }
    }

    for (let i = 0; i < pageBreakCount; i += 1) {
      result.push(`<span data-word-page-break="1" style="display:block;break-before:page"></span>`);
    }
    return result;
  }

  async function nodeToHtml(node: Element, revisionFallback: RevisionMeta | null): Promise<string[]> {
    if (node.localName === "commentRangeStart") {
      const id = getAttr(node, "w:id") ?? getAttr(node, "id");
      return id ? [`<span data-word-comment-range-start="${id}"></span>`] : [];
    }
    if (node.localName === "commentRangeEnd") {
      const id = getAttr(node, "w:id") ?? getAttr(node, "id");
      return id ? [`<span data-word-comment-range-end="${id}"></span>`] : [];
    }
    if (node.localName === "r") {
      return runToHtml(node, revisionFallback);
    }
    if (node.localName === "oMath" || node.localName === "oMathPara") {
      const linear = ommlNodeToText(node).trim();
      if (!linear) return [];
      return [`<span data-word-omml="1">${escapeHtml(linear)}</span>`];
    }
    if (node.localName === "ins" || node.localName === "del") {
      const scopedMeta = parseRevisionMeta(node, node.localName === "ins" ? "ins" : "del");
      const nested: string[] = [];
      for (const child of Array.from(node.children)) {
        nested.push(...(await nodeToHtml(child, scopedMeta)));
      }
      return nested;
    }
    const nested: string[] = [];
    for (const child of Array.from(node.children)) {
      nested.push(...(await nodeToHtml(child, revisionFallback)));
    }
    return nested;
  }

  const parts: string[] = [];
  const renderedPageBreakCount = queryAllByLocalName(paragraph, "lastRenderedPageBreak").length;
  for (let i = 0; i < renderedPageBreakCount; i += 1) {
    parts.push(`<span data-word-page-break="1" style="display:block;break-before:page"></span>`);
  }
  for (const child of Array.from(paragraph.children)) {
    parts.push(...(await nodeToHtml(child, null)));
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

function parseTblGridWidthsPx(table: Element): number[] {
  const grid = directChildrenByLocalName(table, "tblGrid")[0] ?? null;
  if (!grid) return [];
  return directChildrenByLocalName(grid, "gridCol")
    .map((col) => {
      const raw = getAttr(col, "w:w") ?? getAttr(col, "w");
      const twip = raw ? Number.parseInt(raw, 10) : Number.NaN;
      return Number.isFinite(twip) && twip > 0 ? twipToPx(twip) : 0;
    })
    .filter((px) => px > 0);
}

function borderSizeToPx(size: number): number {
  return size / 6;
}

function parseBorderCss(borderNode: Element | null): string | null {
  if (!borderNode) return null;
  const val = (getAttr(borderNode, "w:val") ?? getAttr(borderNode, "val") ?? "").toLowerCase();
  if (!val || val === "nil" || val === "none") return "none";
  const color = (getAttr(borderNode, "w:color") ?? getAttr(borderNode, "color") ?? "222222").replace(/^#/, "");
  const rawSize = getAttr(borderNode, "w:sz") ?? getAttr(borderNode, "sz");
  const size = rawSize ? Number.parseInt(rawSize, 10) : Number.NaN;
  const px = Number.isFinite(size) && size > 0 ? borderSizeToPx(size) : 1;
  const style = val === "single" ? "solid" : val;
  return `${px.toFixed(2)}px ${style} #${color}`;
}

interface TableStyleProfile {
  tableLayout: "fixed" | "auto";
  borderCollapse: "collapse" | "separate";
  borderSpacingPx: number;
  borderCss: string;
  insideHCss: string | null;
  insideVCss: string | null;
}

function parseTableStyleProfile(table: Element): TableStyleProfile {
  const tblPr = directChildrenByLocalName(table, "tblPr")[0] ?? null;
  const tblBorders = tblPr ? directChildrenByLocalName(tblPr, "tblBorders")[0] ?? null : null;
  const layout = tblPr ? directChildrenByLocalName(tblPr, "tblLayout")[0] ?? null : null;
  const spacing = tblPr ? directChildrenByLocalName(tblPr, "tblCellSpacing")[0] ?? null : null;
  const spacingType = (getAttr(spacing, "w:type") ?? getAttr(spacing, "type") ?? "dxa").toLowerCase();
  const spacingRaw = getAttr(spacing, "w:w") ?? getAttr(spacing, "w");
  const spacingVal = spacingRaw ? Number.parseFloat(spacingRaw) : Number.NaN;
  const borderSpacingPx =
    spacingType === "dxa" && Number.isFinite(spacingVal) && spacingVal > 0 ? twipToPx(spacingVal) : 0;
  const borderCollapse = borderSpacingPx > 0 ? "separate" : "collapse";
  const tableLayout = (getAttr(layout, "w:type") ?? getAttr(layout, "type") ?? "").toLowerCase() === "autofit" ? "auto" : "fixed";

  const top = parseBorderCss(tblBorders ? directChildrenByLocalName(tblBorders, "top")[0] ?? null : null);
  const bottom = parseBorderCss(tblBorders ? directChildrenByLocalName(tblBorders, "bottom")[0] ?? null : null);
  const left = parseBorderCss(tblBorders ? directChildrenByLocalName(tblBorders, "left")[0] ?? null : null);
  const right = parseBorderCss(tblBorders ? directChildrenByLocalName(tblBorders, "right")[0] ?? null : null);
  const insideH = parseBorderCss(tblBorders ? directChildrenByLocalName(tblBorders, "insideH")[0] ?? null : null);
  const insideV = parseBorderCss(tblBorders ? directChildrenByLocalName(tblBorders, "insideV")[0] ?? null : null);
  const borderCss = top ?? right ?? bottom ?? left ?? "1px solid #222";

  return {
    tableLayout,
    borderCollapse,
    borderSpacingPx,
    borderCss,
    insideHCss: insideH,
    insideVCss: insideV
  };
}

function parseTableWidthStyle(table: Element, gridWidthsPx: number[]): string {
  const tblPr = directChildrenByLocalName(table, "tblPr")[0] ?? null;
  const tblW = tblPr ? directChildrenByLocalName(tblPr, "tblW")[0] ?? null : null;
  const type = (getAttr(tblW, "w:type") ?? getAttr(tblW, "type") ?? "").toLowerCase();
  const rawVal = getAttr(tblW, "w:w") ?? getAttr(tblW, "w");
  const numericVal = rawVal ? Number.parseFloat(rawVal) : Number.NaN;
  if (type === "dxa" && Number.isFinite(numericVal) && numericVal > 0) {
    return `width:${twipToPx(numericVal).toFixed(2)}px`;
  }
  if (type === "pct" && Number.isFinite(numericVal) && numericVal > 0) {
    return `width:${(numericVal / 50).toFixed(2)}%`;
  }
  const gridTotal = gridWidthsPx.reduce((sum, item) => sum + item, 0);
  if (gridTotal > 0) return `width:${gridTotal.toFixed(2)}px;max-width:100%`;
  return "width:100%";
}

function parseCellWidthStyle(cell: Element, colCursor: number, colSpan: number, gridWidthsPx: number[]): string {
  const tcPr = directChildrenByLocalName(cell, "tcPr")[0] ?? null;
  const tcW = tcPr ? directChildrenByLocalName(tcPr, "tcW")[0] ?? null : null;
  const type = (getAttr(tcW, "w:type") ?? getAttr(tcW, "type") ?? "").toLowerCase();
  const rawVal = getAttr(tcW, "w:w") ?? getAttr(tcW, "w");
  const numericVal = rawVal ? Number.parseFloat(rawVal) : Number.NaN;

  if (type === "dxa" && Number.isFinite(numericVal) && numericVal > 0) {
    return `width:${twipToPx(numericVal).toFixed(2)}px`;
  }
  if (type === "pct" && Number.isFinite(numericVal) && numericVal > 0) {
    return `width:${(numericVal / 50).toFixed(2)}%`;
  }
  const width = gridWidthsPx.slice(colCursor, colCursor + colSpan).reduce((sum, item) => sum + item, 0);
  if (width > 0) return `width:${width.toFixed(2)}px`;
  return "";
}

function parseCellBorderStyle(cell: Element, tableStyle: TableStyleProfile): string {
  const tcPr = directChildrenByLocalName(cell, "tcPr")[0] ?? null;
  const tcBorders = tcPr ? directChildrenByLocalName(tcPr, "tcBorders")[0] ?? null : null;
  if (!tcBorders) {
    const fallback = tableStyle.insideHCss ?? tableStyle.insideVCss ?? tableStyle.borderCss;
    return `border:${fallback}`;
  }
  const top = parseBorderCss(directChildrenByLocalName(tcBorders, "top")[0] ?? null) ?? tableStyle.insideHCss ?? tableStyle.borderCss;
  const right = parseBorderCss(directChildrenByLocalName(tcBorders, "right")[0] ?? null) ?? tableStyle.insideVCss ?? tableStyle.borderCss;
  const bottom = parseBorderCss(directChildrenByLocalName(tcBorders, "bottom")[0] ?? null) ?? tableStyle.insideHCss ?? tableStyle.borderCss;
  const left = parseBorderCss(directChildrenByLocalName(tcBorders, "left")[0] ?? null) ?? tableStyle.insideVCss ?? tableStyle.borderCss;
  return `border-top:${top};border-right:${right};border-bottom:${bottom};border-left:${left}`;
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
  const gridWidthsPx = parseTblGridWidthsPx(table);
  const tableStyle = parseTableStyleProfile(table);

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
      const widthStyle = parseCellWidthStyle(cell, colCursor, colSpan, gridWidthsPx);
      const borderStyle = parseCellBorderStyle(cell, tableStyle);
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
        `<td${attrs.length > 0 ? ` ${attrs.join(" ")}` : ""} style="${borderStyle};vertical-align:top;${widthStyle}">${html}</td>`
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

  const tableWidthStyle = parseTableWidthStyle(table, gridWidthsPx);
  const spacing = tableStyle.borderSpacingPx > 0 ? `border-spacing:${tableStyle.borderSpacingPx.toFixed(2)}px;` : "";
  return `<table style="border-collapse:${tableStyle.borderCollapse};${spacing}table-layout:${tableStyle.tableLayout};${tableWidthStyle};border:${tableStyle.borderCss};">${merged}</table>`;
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
