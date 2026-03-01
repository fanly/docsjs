/**
 * TipTap Adapter
 * 
 * Converts DocumentAST to/from TipTap JSON format.
 * TipTap is a headless editor based on Prosemirror.
 */

import type { DocumentNode, BlockNode, InlineNode, ParagraphNode, HeadingNode, TextNode, ImageNode, HyperlinkNode } from "../ast/types";

export interface TipTapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  marks?: TipTapMark[];
  text?: string;
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TipTapDocument {
  type: string;
  content: TipTapNode[];
}

/**
 * Convert DocumentAST to TipTap format
 */
export function astToTipTap(doc: DocumentNode): TipTapDocument {
  return {
    type: "doc",
    content: doc.children.flatMap(section => 
      section.children.map(block => blockToTipTap(block))
    ),
  };
}

/**
 * Convert a block node to TipTap
 */
function blockToTipTap(block: BlockNode): TipTapNode {
  switch (block.type) {
    case "paragraph":
      return paragraphToTipTap(block);
    case "heading":
      return headingToTipTap(block);
    case "list":
      return listToTipTap(block);
    case "table":
      return tableToTipTap(block);
    case "codeBlock":
      return codeBlockToTipTap(block);
    case "blockquote":
      return blockquoteToTipTap(block);
    case "image":
      return imageToTipTap(block as unknown as ImageNode);
    default:
      return {
        type: "paragraph",
        content: [{ type: "text", text: "" }],
      };
  }
}

function paragraphToTipTap(p: ParagraphNode): TipTapNode {
  return {
    type: "paragraph",
    content: p.children.map(inlineToTipTap).filter(Boolean) as TipTapNode[],
  };
}

function headingToTipTap(h: HeadingNode): TipTapNode {
  return {
    type: "heading",
    attrs: { level: h.level },
    content: h.children.map(inlineToTipTap).filter(Boolean) as TipTapNode[],
  };
}

function listToTipTap(list: any): TipTapNode {
  return {
    type: list.listType === "ordered" ? "orderedList" : "bulletList",
    content: list.items.map((item: any) => ({
      type: "listItem",
      content: item.children.map(blockToTipTap),
    })),
  };
}

function tableToTipTap(table: any): TipTapNode {
  return {
    type: "table",
    content: table.rows.map((row: any) => ({
      type: "tableRow",
      content: row.cells.map((cell: any) => ({
        type: "tableCell",
        content: cell.children.map(blockToTipTap),
      })),
    })),
  };
}

function codeBlockToTipTap(code: any): TipTapNode {
  return {
    type: "codeBlock",
    attrs: { language: code.language },
    content: [{ type: "text", text: code.code }],
  };
}

function blockquoteToTipTap(block: any): TipTapNode {
  return {
    type: "blockquote",
    content: block.children.map(blockToTipTap),
  };
}

function imageToTipTap(img: ImageNode): TipTapNode {
  return {
    type: "image",
    attrs: {
      src: img.src,
      alt: img.alt,
      title: img.title,
    },
  };
}

function inlineToTipTap(node: InlineNode): TipTapNode | null {
  switch (node.type) {
    case "text":
      return textToTipTap(node);
    case "hyperlink":
      return hyperlinkToTipTap(node);
    case "hardBreak":
      return { type: "hardBreak" };
    default:
      return null;
  }
}

function textToTipTap(text: TextNode): TipTapNode {
  const result: TipTapNode = {
    type: "text",
    text: text.text,
  };

  if (text.marks?.length) {
    result.marks = text.marks.map(markToTipTap);
  }

  return result;
}

function markToTipTap(mark: any): TipTapMark {
  const typeMap: Record<string, string> = {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "strike",
    code: "code",
    subscript: "subscript",
    superscript: "superscript",
  };

  return {
    type: typeMap[mark.type] || mark.type,
    attrs: mark.attrs,
  };
}

function hyperlinkToTipTap(link: HyperlinkNode): TipTapNode {
  return {
    type: "text",
    text: link.children.map(c => c.type === "text" ? c.text : "").join(""),
    marks: [{
      type: "link",
      attrs: { href: link.href, title: link.title },
    }],
  };
}

/**
 * Convert TipTap format to DocumentAST
 */
export function tipTapToAst(tiptap: TipTapDocument): DocumentNode {
  return {
    type: "document",
    id: generateId(),
    metadata: {
      version: "1.0.0",
      createdAt: Date.now(),
      sourceFormat: "tiptap",
      generator: "DocsJS",
    },
    children: [
      {
        type: "section",
        id: generateId(),
        children: tiptap.content?.map(tipTapToBlock).filter(Boolean) as BlockNode[] || [],
      },
    ],
  };
}

function tipTapToBlock(node: TipTapNode): BlockNode | null {
  switch (node.type) {
    case "paragraph":
      return tipTapToParagraph(node);
    case "heading":
      return tipTapToHeading(node);
    case "bulletList":
    case "orderedList":
      return tipTapToList(node);
    default:
      return null;
  }
}

function tipTapToParagraph(node: TipTapNode): ParagraphNode {
  return {
    type: "paragraph",
    id: generateId(),
    children: node.content?.map(tipTapToInline).filter(Boolean) as InlineNode[] || [],
  };
}

function tipTapToHeading(node: TipTapNode): HeadingNode {
  return {
    type: "heading",
    id: generateId(),
    level: (node.attrs?.level || 1) as 1 | 2 | 3 | 4 | 5 | 6,
    children: node.content?.map(tipTapToInline).filter(Boolean) as InlineNode[] || [],
  };
}

function tipTapToList(node: TipTapNode): any {
  return {
    type: "list",
    id: generateId(),
    listType: node.type === "orderedList" ? "ordered" : "unordered",
    items: node.content?.map((item: any) => ({
      type: "listItem",
      id: generateId(),
      children: item.content?.map(tipTapToBlock).filter(Boolean) || [],
    })) || [],
  };
}

function tipTapToInline(node: TipTapNode): InlineNode | null {
  if (node.type === "text" && node.text) {
    return {
      type: "text",
      id: generateId(),
      text: node.text,
      marks: node.marks?.map(tipTapToMark),
    };
  }
  return null;
}

function tipTapToMark(mark: TipTapMark): any {
  const typeMap: Record<string, string> = {
    bold: "bold",
    italic: "italic",
    underline: "underline",
    strike: "strikethrough",
    code: "code",
  };
  return {
    type: typeMap[mark.type] || mark.type,
    attrs: mark.attrs,
  };
}

function generateId(): string {
  return "id_" + Math.random().toString(36).substr(2, 9);
}
