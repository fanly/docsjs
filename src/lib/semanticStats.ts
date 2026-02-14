export interface SemanticStats {
  paragraphCount: number;
  headingCount: number;
  tableCount: number;
  tableCellCount: number;
  imageCount: number;
  anchorImageCount: number;
  wrappedImageCount: number;
  listParagraphCount: number;
  commentRefCount: number;
  revisionInsCount: number;
  revisionDelCount: number;
  pageBreakCount: number;
  pageSpacerCount: number;
  textCharCount: number;
}

function countElements(root: ParentNode, selector: string): number {
  return root.querySelectorAll(selector).length;
}

function isListLikeParagraph(p: Element): boolean {
  if (p.hasAttribute("data-word-list")) return true;
  if (p.querySelector("span.__word-list-marker")) return true;
  const style = (p.getAttribute("style") ?? "").toLowerCase();
  return style.includes("mso-list");
}

export function collectSemanticStatsFromDocument(doc: Document): SemanticStats {
  const paragraphs = Array.from(doc.querySelectorAll("p"));
  const listParagraphCount = paragraphs.filter((p) => isListLikeParagraph(p)).length;
  const textCharCount = (doc.body.textContent ?? "").replace(/\s+/g, "").length;

  return {
    paragraphCount: paragraphs.length,
    headingCount: countElements(doc, "h1,h2,h3,h4,h5,h6"),
    tableCount: countElements(doc, "table"),
    tableCellCount: countElements(doc, "td,th"),
    imageCount: countElements(doc, "img"),
    anchorImageCount: countElements(doc, 'img[data-word-anchor="1"]'),
    wrappedImageCount: countElements(doc, "img[data-word-wrap]"),
    listParagraphCount,
    commentRefCount: countElements(doc, "[data-word-comment-ref]"),
    revisionInsCount: countElements(doc, '[data-word-revision="ins"]'),
    revisionDelCount: countElements(doc, '[data-word-revision="del"]'),
    pageBreakCount: countElements(doc, "[data-word-page-break='1']"),
    pageSpacerCount: countElements(doc, "[data-word-page-spacer='1']"),
    textCharCount
  };
}

export function collectSemanticStatsFromHtml(rawHtml: string): SemanticStats {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, "text/html");
  return collectSemanticStatsFromDocument(doc);
}
