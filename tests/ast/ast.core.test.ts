/**
 * AST Core Tests
 * 
 * Tests for DocumentAST v1.0 core functionality:
 * - Node creation
 * - Serialization/Deserialization
 * - Traversal
 * - Validation
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  // Types
  DocumentNode,
  ParagraphNode,
  TextNode,
  HeadingNode,
  ListNode,
  TableNode,
  TextMark,
  
  // Utilities
  generateId,
  resetIdCounter,
  serializeAST,
  deserializeAST,
  calculateChecksum,
  createEmptyDocument,
  createTextNode,
  createParagraphNode,
  createHeadingNode,
  createListNode,
  createListItemNode,
  createTableNode,
  createTableRowNode,
  createTableCellNode,
  createImageNode,
  createHyperlinkNode,
  createSectionNode,
  walkAST,
  findNodeById,
  findNodesByType,
  cloneAST,
  validateAST,
  hasMark,
  addMark,
  removeMark,
  extractText,
  extractImageSources,
  extractHyperlinks,
  createAuxiliaryContent,
  addFootnote,
  addEndnote,
  addComment,
  AST_VERSION,
} from "../../src/ast";

describe("AST Core", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  describe("ID Generation", () => {
    it("should generate unique IDs", () => {
      const id1 = generateId("test");
      const id2 = generateId("test");
      expect(id1).not.toBe(id2);
    });

    it("should include prefix in ID", () => {
      const id = generateId("paragraph");
      expect(id).toContain("paragraph");
    });
  });

  describe("Node Creation", () => {
    it("should create an empty document", () => {
      const doc = createEmptyDocument("docx");
      
      expect(doc.type).toBe("document");
      expect(doc.metadata.version).toBe(AST_VERSION);
      expect(doc.metadata.sourceFormat).toBe("docx");
      expect(doc.children).toEqual([]);
    });

    it("should create a text node", () => {
      const text = createTextNode("Hello, World!");
      
      expect(text.type).toBe("text");
      expect(text.text).toBe("Hello, World!");
      expect(text.marks).toBeUndefined();
    });

    it("should create a text node with marks", () => {
      const marks: TextMark[] = [{ type: "bold" }, { type: "italic" }];
      const text = createTextNode("Bold and italic", marks);
      
      expect(text.marks).toHaveLength(2);
      expect(text.marks?.[0].type).toBe("bold");
    });

    it("should create a paragraph node", () => {
      const children = [createTextNode("Hello")];
      const p = createParagraphNode(children);
      
      expect(p.type).toBe("paragraph");
      expect(p.children).toHaveLength(1);
    });

    it("should create a heading node", () => {
      const children = [createTextNode("Title")];
      const h = createHeadingNode(1, children);
      
      expect(h.type).toBe("heading");
      expect(h.level).toBe(1);
    });

    it("should create a list node", () => {
      const items = [
        createListItemNode([createParagraphNode([createTextNode("Item 1")])], 0),
        createListItemNode([createParagraphNode([createTextNode("Item 2")])], 0),
      ];
      const list = createListNode("ordered", items);
      
      expect(list.type).toBe("list");
      expect(list.listType).toBe("ordered");
      expect(list.items).toHaveLength(2);
    });

    it("should create a table node", () => {
      const rows = [
        createTableRowNode([
          createTableCellNode([createParagraphNode([createTextNode("Cell 1")])]),
          createTableCellNode([createParagraphNode([createTextNode("Cell 2")])]),
        ]),
      ];
      const table = createTableNode(rows);
      
      expect(table.type).toBe("table");
      expect(table.rows).toHaveLength(1);
      expect(table.rows[0].cells).toHaveLength(2);
    });

    it("should create an image node", () => {
      const img = createImageNode("image.png", {
        alt: "An image",
        dimensions: { width: 100, height: 100, unit: "px" },
      });
      
      expect(img.type).toBe("image");
      expect(img.src).toBe("image.png");
      expect(img.alt).toBe("An image");
      expect(img.dimensions?.width).toBe(100);
    });

    it("should create a hyperlink node", () => {
      const link = createHyperlinkNode(
        "https://example.com",
        [createTextNode("Example")],
        { target: "_blank" }
      );
      
      expect(link.type).toBe("hyperlink");
      expect(link.href).toBe("https://example.com");
      expect(link.target).toBe("_blank");
    });

    it("should create a section node", () => {
      const section = createSectionNode([
        createParagraphNode([createTextNode("Content")]),
      ]);
      
      expect(section.type).toBe("section");
      expect(section.children).toHaveLength(1);
    });
  });

  describe("Serialization", () => {
    it("should serialize and deserialize a document", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([createTextNode("Hello, World!")]),
        ])
      );
      
      const json = serializeAST(doc);
      const restored = deserializeAST(json);
      
      expect(restored.type).toBe("document");
      expect(restored.children).toHaveLength(1);
    });

    it("should preserve text content through serialization", () => {
      const text = createTextNode("Test content with <special> & characters");
      const p = createParagraphNode([text]);
      
      const json = serializeAST(p);
      const restored = deserializeAST(json) as ParagraphNode;
      
      expect((restored.children[0] as TextNode).text).toBe(
        "Test content with <special> & characters"
      );
    });

    it("should calculate consistent checksums", () => {
      const doc1 = createEmptyDocument("docx");
      doc1.children.push(createSectionNode([]));
      
      const doc2 = createEmptyDocument("docx");
      doc2.children.push(createSectionNode([]));
      
      // Same content structure should produce same checksum
      const hash1 = calculateChecksum(doc1);
      const hash2 = calculateChecksum(doc2);
      
      expect(hash1).toBe(hash2);
    });
  });

  describe("Traversal", () => {
    it("should walk all nodes", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([createTextNode("Hello")]),
          createHeadingNode(1, [createTextNode("Title")]),
        ])
      );
      
      const visited: string[] = [];
      walkAST(doc, (node) => {
        visited.push(node.type);
      });
      
      expect(visited).toContain("document");
      expect(visited).toContain("section");
      expect(visited).toContain("paragraph");
      expect(visited).toContain("heading");
      expect(visited).toContain("text");
    });

    it("should find node by ID", () => {
      const text = createTextNode("Find me");
      const p = createParagraphNode([text]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const found = findNodeById(doc, text.id);
      
      expect(found).not.toBeNull();
      expect((found as TextNode).text).toBe("Find me");
    });

    it("should find nodes by type", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([createTextNode("One")]),
          createParagraphNode([createTextNode("Two")]),
          createHeadingNode(1, [createTextNode("Title")]),
        ])
      );
      
      const paragraphs = findNodesByType<ParagraphNode>(doc, "paragraph");
      const headings = findNodesByType<HeadingNode>(doc, "heading");
      
      expect(paragraphs).toHaveLength(2);
      expect(headings).toHaveLength(1);
    });
  });

  describe("Validation", () => {
    it("should validate a correct document", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([]));
      
      const result = validateAST(doc);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect invalid heading levels", () => {
      const heading = {
        type: "heading" as const,
        id: generateId("h"),
        level: 7 as 1, // Invalid level
        children: [createTextNode("Test")],
      };
      
      const result = validateAST(heading);
      
      // Note: Our validation checks level range, so this should flag it
      expect(result.errors.some(e => e.includes("heading level"))).toBe(true);
    });
  });

  describe("Text Marks", () => {
    it("should check if text has a mark", () => {
      const text = createTextNode("Bold", [{ type: "bold" }]);
      
      expect(hasMark(text, "bold")).toBe(true);
      expect(hasMark(text, "italic")).toBe(false);
    });

    it("should add a mark", () => {
      const text = createTextNode("Text");
      const withMark = addMark(text, { type: "bold" });
      
      expect(withMark.marks).toHaveLength(1);
      expect(withMark.marks?.[0].type).toBe("bold");
    });

    it("should not add duplicate marks", () => {
      const text = createTextNode("Text", [{ type: "bold" }]);
      const withMark = addMark(text, { type: "bold" });
      
      expect(withMark.marks).toHaveLength(1);
    });

    it("should remove a mark", () => {
      const text = createTextNode("Text", [{ type: "bold" }, { type: "italic" }]);
      const withoutBold = removeMark(text, "bold");
      
      expect(withoutBold.marks).toHaveLength(1);
      expect(withoutBold.marks?.[0].type).toBe("italic");
    });

    it("should remove marks array when empty", () => {
      const text = createTextNode("Text", [{ type: "bold" }]);
      const withoutMark = removeMark(text, "bold");
      
      expect(withoutMark.marks).toBeUndefined();
    });
  });

  describe("Content Extraction", () => {
    it("should extract text from document", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([createTextNode("Hello, "), createTextNode("World!")]),
        ])
      );
      
      const text = extractText(doc);
      
      expect(text).toBe("Hello, World!");
    });

    it("should extract image sources", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([
            createImageNode("img1.png"),
            createTextNode(" text "),
            createImageNode("img2.png"),
          ]),
        ])
      );
      
      const sources = extractImageSources(doc);
      
      expect(sources).toEqual(["img1.png", "img2.png"]);
    });

    it("should extract hyperlinks", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([
            createHyperlinkNode("https://a.com", [createTextNode("Link A")]),
            createHyperlinkNode("https://b.com", [createTextNode("Link B")]),
          ]),
        ])
      );
      
      const links = extractHyperlinks(doc);
      
      expect(links).toHaveLength(2);
      expect(links[0].href).toBe("https://a.com");
      expect(links[0].text).toBe("Link A");
    });
  });

  describe("Auxiliary Content", () => {
    it("should create auxiliary content container", () => {
      const aux = createAuxiliaryContent();
      
      expect(aux.footnotes).toBeInstanceOf(Map);
      expect(aux.endnotes).toBeInstanceOf(Map);
      expect(aux.comments).toBeInstanceOf(Map);
    });

    it("should add footnotes", () => {
      const aux = createAuxiliaryContent();
      const footnote = addFootnote(
        aux,
        "fn1",
        [createParagraphNode([createTextNode("Footnote content")])],
        1
      );
      
      expect(footnote.type).toBe("footnote");
      expect(footnote.number).toBe(1);
      expect(aux.footnotes?.size).toBe(1);
    });

    it("should add endnotes", () => {
      const aux = createAuxiliaryContent();
      const endnote = addEndnote(
        aux,
        "en1",
        [createParagraphNode([createTextNode("Endnote content")])],
        1
      );
      
      expect(endnote.type).toBe("endnote");
      expect(aux.endnotes?.size).toBe(1);
    });

    it("should add comments", () => {
      const aux = createAuxiliaryContent();
      const comment = addComment(
        aux,
        "c1",
        [createParagraphNode([createTextNode("Comment content")])],
        { author: "Test User", date: "2024-01-01" }
      );
      
      expect(comment.type).toBe("comment");
      expect(comment.author).toBe("Test User");
      expect(aux.comments?.size).toBe(1);
    });
  });

  describe("Cloning", () => {
    it("should deep clone a document", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([]));
      
      const cloned = cloneAST(doc);
      
      expect(cloned).not.toBe(doc);
      expect(cloned.children).not.toBe(doc.children);
      expect(cloned.id).toBe(doc.id);
    });
  });
});
