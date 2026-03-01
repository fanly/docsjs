/**
 * Slate Editor Adapter
 * 
 * Converts DocumentAST to/from Slate JSON format.
 * Slate is a customizable rich text editor framework.
 */

import type { DocumentNode, BlockNode, InlineNode, ParagraphNode, HeadingNode, TextNode, ImageNode, HyperlinkNode, ListNode, TableNode } from "../ast/types";

export interface SlateNode {
  type?: string;
  children?: SlateNode[];
  text?: string;
  [key: string]: unknown;
}

export interface SlateElement extends SlateNode {
  type: string;
  children: SlateNode[];
}

export interface SlateText extends SlateNode {
  text: string;
}

export interface SlateDocument {
  children: SlateNode[];
}

/**
 * Convert DocumentAST to Slate format
 */
export function astToSlate(doc: DocumentNode): SlateDocument {
  return {
    children: doc.children.flatMap(section =>
      section.children.map(block => blockToSlate(block))
    ),
  };
}

/**
 * Convert a block node to Slate
 */
function blockToSlate(block: BlockNode): SlateNode {
  switch (block.type) {
    case "paragraph":
      return paragraphToSlate(block);
    case "heading":
      return headingToSlate(block);
    case "list":
      return listToSlate(block);
    case "table":
      return tableToSlate(block);
    case "codeBlock":
      return codeBlockToSlate(block);
    case "blockquote":
      return blockquoteToSlate(block);
    case "image":
      return imageToSlate(block as unknown as ImageNode);
    default:
      return {
        type: "paragraph",
        children: [{ text: "" }],
      };
  }
}

function paragraphToSlate(p: ParagraphNode): SlateElement {
  return {
    type: "paragraph",
    children: p.children.map(inlineToSlate).filter(Boolean) as SlateNode[],
  };
}

function headingToSlate(h: HeadingNode): SlateElement {
  return {
    type: "heading",
    level: h.level,
    children: h.children.map(inlineToSlate).filter(Boolean) as SlateNode[],
  };
}

function listToSlate(list: ListNode): SlateElement {
  return {
    type: list.listType === "ordered" ? "numbered-list" : "bulleted-list",
    children: list.items.map((item: any) => ({
      type: "list-item",
      children: item.children.map(blockToSlate),
    })),
  };
}

function tableToSlate(table: TableNode): SlateElement {
  return {
    type: "table",
    children: table.rows.map((row: any) => ({
      type: "table-row",
      children: row.cells.map((cell: any) => ({
        type: "table-cell",
        children: cell.children.map(blockToSlate),
      })),
    })),
  };
}

function codeBlockToSlate(code: BlockNode): SlateElement {
  return {
    type: "code-block",
    language: (code as any).language,
    children: [{ text: (code as any).code || "" }],
  };
}

function blockquoteToSlate(block: BlockNode): SlateElement {
  return {
    type: "block-quote",
    children: block.children.map(blockToSlate),
  };
}

function imageToSlate(img: ImageNode): SlateElement {
  return {
    type: "image",
    src: img.src,
    alt: img.alt,
    title: img.title,
    children: [{ text: "" }],
  };
}

function inlineToSlate(node: InlineNode): SlateNode | null {
  switch (node.type) {
    case "text":
      return textToSlate(node);
    case "hyperlink":
      return hyperlinkToSlate(node);
    case "hardBreak":
      return { text: "" };
    default:
      return null;
  }
}

function textToSlate(text: TextNode): SlateText {
  const result: SlateText = {
    text: text.text,
  };

  if (text.marks?.length) {
    Object.assign(result, marksToSlate(text.marks));
  }

  return result;
}

function marksToSlate(marks: any[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        result.bold = true;
        break;
      case "italic":
        result.italic = true;
        break;
      case "underline":
        result.underline = true;
        break;
      case "strikethrough":
        result.strikethrough = true;
        break;
      case "code":
        result.code = true;
        break;
    }
  }
  
  return result;
}

function hyperlinkToSlate(link: HyperlinkNode): SlateText {
  return {
    text: link.children.map(c => c.type === "text" ? c.text : "").join(""),
    url: link.href,
    title: link.title,
  };
}

/**
 * Convert Slate format to DocumentAST
 */
export function slateToAst(slate: SlateDocument): DocumentNode {
  return {
    type: "document",
    id: generateId(),
    metadata: {
      version: "1.0.0",
      createdAt: Date.now(),
      sourceFormat: "slate",
      generator: "DocsJS",
    },
    children: [
      {
        type: "section",
        id: generateId(),
        children: slate.children?.map(slateToBlock).filter(Boolean) as BlockNode[] || [],
      },
    ],
  };
}

function slateToBlock(node: SlateNode): BlockNode | null {
  const element = node as SlateElement;
  
  switch (element.type) {
    case "paragraph":
      return slateToParagraph(element);
    case "heading":
      return slateToHeading(element);
    case "bulleted-list":
    case "numbered-list":
      return slateToList(element);
    default:
      return null;
  }
}

function slateToParagraph(node: SlateElement): ParagraphNode {
  return {
    type: "paragraph",
    id: generateId(),
    children: node.children?.map(slateToInline).filter(Boolean) as InlineNode[] || [],
  };
}

function slateToHeading(node: SlateElement): HeadingNode {
  return {
    type: "heading",
    id: generateId(),
    level: (node.level || 1) as 1 | 2 | 3 | 4 | 5 | 6,
    children: node.children?.map(slateToInline).filter(Boolean) as InlineNode[] || [],
  };
}

function slateToList(node: SlateElement): ListNode {
  return {
    type: "list",
    id: generateId(),
    listType: node.type === "numbered-list" ? "ordered" : "unordered",
    items: node.children?.map((item: any) => ({
      type: "listItem",
      id: generateId(),
      children: item.children?.map(slateToBlock).filter(Boolean) || [],
    })) || [],
  };
}

function slateToInline(node: SlateNode): InlineNode | null {
  const textNode = node as SlateText;
  
  if (textNode.text !== undefined) {
    return {
      type: "text",
      id: generateId(),
      text: textNode.text,
      marks: slateToMarks(textNode),
    };
  }
  return null;
}

function slateToMarks(node: SlateText): any[] {
  const marks: any[] = [];
  
  if (node.bold) marks.push({ type: "bold" });
  if (node.italic) marks.push({ type: "italic" });
  if (node.underline) marks.push({ type: "underline" });
  if (node.strikethrough) marks.push({ type: "strikethrough" });
  if (node.code) marks.push({ type: "code" });
  
  return marks;
}

function generateId(): string {
  return "id_" + Math.random().toString(36).substr(2, 9);
}
