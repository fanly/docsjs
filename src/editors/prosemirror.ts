/**
 * ProseMirror Adapter
 * 
 * Converts DocumentAST to/from ProseMirror JSON format.
 * ProseMirror is a rich text editor framework with a schema-based architecture.
 */

import type { DocumentNode, BlockNode, InlineNode, ParagraphNode, HeadingNode, TextNode, ImageNode, HyperlinkNode, ListNode, TableNode } from "../ast/types";

export interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  text?: string;
  marks?: ProseMirrorMark[];
}

export interface ProseMirrorMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface ProseMirrorDoc {
  type: "doc";
  content: ProseMirrorNode[];
}

/**
 * Convert DocumentAST to ProseMirror format
 */
export function astToProseMirror(doc: DocumentNode): ProseMirrorDoc {
  return {
    type: "doc",
    content: doc.children.flatMap(section =>
      section.children.map(block => blockToProseMirror(block))
    ),
  };
}

/**
 * Convert a block node to ProseMirror
 */
function blockToProseMirror(block: BlockNode): ProseMirrorNode {
  switch (block.type) {
    case "paragraph":
      return paragraphToProseMirror(block);
    case "heading":
      return headingToProseMirror(block);
    case "list":
      return listToProseMirror(block);
    case "table":
      return tableToProseMirror(block);
    case "codeBlock":
      return codeBlockToProseMirror(block);
    case "blockquote":
      return blockquoteToProseMirror(block);
    case "image":
      return imageToProseMirror(block as unknown as ImageNode);
    default:
      return {
        type: "paragraph",
        content: [{ type: "text", text: "" }],
      };
  }
}

function paragraphToProseMirror(p: ParagraphNode): ProseMirrorNode {
  return {
    type: "paragraph",
    content: p.children.map(inlineToProseMirror).filter(Boolean) as ProseMirrorNode[],
  };
}

function headingToProseMirror(h: HeadingNode): ProseMirrorNode {
  return {
    type: "heading",
    attrs: { level: h.level },
    content: h.children.map(inlineToProseMirror).filter(Boolean) as ProseMirrorNode[],
  };
}

function listToProseMirror(list: ListNode): ProseMirrorNode {
  return {
    type: list.listType === "ordered" ? "ordered_list" : "bullet_list",
    content: list.items.map((item: any) => ({
      type: "list_item",
      content: item.children.map(blockToProseMirror),
    })),
  };
}

function tableToProseMirror(table: TableNode): ProseMirrorNode {
  return {
    type: "table",
    content: table.rows.map((row: any) => ({
      type: "table_row",
      content: row.cells.map((cell: any) => ({
        type: "table_cell",
        content: cell.children.map(blockToProseMirror),
      })),
    })),
  };
}

function codeBlockToProseMirror(code: BlockNode): ProseMirrorNode {
  return {
    type: "code_block",
    attrs: { language: (code as any).language },
    content: [{ type: "text", text: (code as any).code || "" }],
  };
}

function blockquoteToProseMirror(block: BlockNode): ProseMirrorNode {
  return {
    type: "blockquote",
    content: block.children.map(blockToProseMirror),
  };
}

function imageToProseMirror(img: ImageNode): ProseMirrorNode {
  return {
    type: "image",
    attrs: {
      src: img.src,
      alt: img.alt,
      title: img.title,
    },
  };
}

function inlineToProseMirror(node: InlineNode): ProseMirrorNode | null {
  switch (node.type) {
    case "text":
      return textToProseMirror(node);
    case "hyperlink":
      return hyperlinkToProseMirror(node);
    case "hardBreak":
      return { type: "hard_break" };
    default:
      return null;
  }
}

function textToProseMirror(text: TextNode): ProseMirrorNode {
  const result: ProseMirrorNode = {
    type: "text",
    text: text.text,
  };

  if (text.marks?.length) {
    result.marks = text.marks.map(markToProseMirror);
  }

  return result;
}

function markToProseMirror(mark: any): ProseMirrorMark {
  const typeMap: Record<string, string> = {
    bold: "strong",
    italic: "em",
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

function hyperlinkToProseMirror(link: HyperlinkNode): ProseMirrorNode {
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
 * Convert ProseMirror format to DocumentAST
 */
export function proseMirrorToAst(pm: ProseMirrorDoc): DocumentNode {
  return {
    type: "document",
    id: generateId(),
    metadata: {
      version: "1.0.0",
      createdAt: Date.now(),
      sourceFormat: "prosemirror",
      generator: "DocsJS",
    },
    children: [
      {
        type: "section",
        id: generateId(),
        children: pm.content?.map(proseMirrorToBlock).filter(Boolean) as BlockNode[] || [],
      },
    ],
  };
}

function proseMirrorToBlock(node: ProseMirrorNode): BlockNode | null {
  switch (node.type) {
    case "paragraph":
      return proseMirrorToParagraph(node);
    case "heading":
      return proseMirrorToHeading(node);
    case "bullet_list":
    case "ordered_list":
      return proseMirrorToList(node);
    case "code_block":
      return proseMirrorToCodeBlock(node);
    case "blockquote":
      return proseMirrorToBlockquote(node);
    default:
      return null;
  }
}

function proseMirrorToParagraph(node: ProseMirrorNode): ParagraphNode {
  return {
    type: "paragraph",
    id: generateId(),
    children: node.content?.map(proseMirrorToInline).filter(Boolean) as InlineNode[] || [],
  };
}

function proseMirrorToHeading(node: ProseMirrorNode): HeadingNode {
  return {
    type: "heading",
    id: generateId(),
    level: (node.attrs?.level || 1) as 1 | 2 | 3 | 4 | 5 | 6,
    children: node.content?.map(proseMirrorToInline).filter(Boolean) as InlineNode[] || [],
  };
}

function proseMirrorToList(node: ProseMirrorNode): ListNode {
  return {
    type: "list",
    id: generateId(),
    listType: node.type === "ordered_list" ? "ordered" : "unordered",
    items: node.content?.map((item: any) => ({
      type: "listItem",
      id: generateId(),
      children: item.content?.map(proseMirrorToBlock).filter(Boolean) || [],
    })) || [],
  };
}

function proseMirrorToCodeBlock(node: ProseMirrorNode): BlockNode {
  return {
    type: "codeBlock",
    id: generateId(),
    code: node.content?.[0]?.text || "",
    language: node.attrs?.language as string || "",
  };
}

function proseMirrorToBlockquote(node: ProseMirrorNode): BlockNode {
  return {
    type: "blockquote",
    id: generateId(),
    children: node.content?.map(proseMirrorToBlock).filter(Boolean) as BlockNode[] || [],
  };
}

function proseMirrorToInline(node: ProseMirrorNode): InlineNode | null {
  if (node.type === "text" && node.text !== undefined) {
    return {
      type: "text",
      id: generateId(),
      text: node.text,
      marks: node.marks?.map(proseMirrorToMark),
    };
  }
  if (node.type === "image") {
    return {
      type: "image",
      id: generateId(),
      src: node.attrs?.src as string || "",
      alt: node.attrs?.alt as string || "",
      title: node.attrs?.title as string || "",
    };
  }
  return null;
}

function proseMirrorToMark(mark: ProseMirrorMark): any {
  const typeMap: Record<string, string> = {
    strong: "bold",
    em: "italic",
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
