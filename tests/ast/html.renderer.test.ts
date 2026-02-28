/**
 * HTML Renderer Tests
 * 
 * Tests for AST → HTML rendering
 */

import { describe, it, expect } from "vitest";
import {
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
  createAuxiliaryContent,
  addFootnote,
  addEndnote,
  addComment,
  generateId,
  resetIdCounter,
} from "../../src/ast";
import { HtmlRenderer, renderASTToHtml } from "../../src/renderers/html";
import type { HtmlRenderOptions } from "../../src/renderers/html";

describe("HTML Renderer", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  const defaultOptions: Partial<HtmlRenderOptions> = {
    mode: "fidelity",
    includeDataAttrs: true,
    wrapAsDocument: false,
  };

  describe("Document Rendering", () => {
    it("should render an empty document", () => {
      const doc = createEmptyDocument("docx");
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toBe("");
    });

    it("should render a document with content", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([createTextNode("Hello, World!")]),
        ])
      );
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<p");
      expect(html).toContain("Hello, World!");
    });
  });

  describe("Paragraph Rendering", () => {
    it("should render a simple paragraph", () => {
      const p = createParagraphNode([createTextNode("Test paragraph")]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<p");
      expect(html).toContain("Test paragraph");
      expect(html).toContain("</p>");
    });

    it("should include paragraph index in data attribute", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([createTextNode("First")]),
          createParagraphNode([createTextNode("Second")]),
        ])
      );
      
      const html = renderASTToHtml(doc, { ...defaultOptions, includeParagraphIndex: true });
      
      expect(html).toContain('data-word-p-index="0"');
      expect(html).toContain('data-word-p-index="1"');
    });

    it("should render empty paragraph with br", () => {
      const p = createParagraphNode([]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<br/>");
    });
  });

  describe("Heading Rendering", () => {
    it("should render h1-h6 correctly", () => {
      for (let level = 1; level <= 6; level++) {
        const h = createHeadingNode(level as 1 | 2 | 3 | 4 | 5 | 6, [createTextNode(`Heading ${level}`)]);
        const doc = createEmptyDocument("docx");
        doc.children.push(createSectionNode([h]));
        
        const html = renderASTToHtml(doc, defaultOptions);
        
        expect(html).toContain(`<h${level}`);
        expect(html).toContain(`Heading ${level}`);
        expect(html).toContain(`</h${level}>`);
      }
    });
  });

  describe("Text Marks Rendering", () => {
    it("should render bold text", () => {
      const text = createTextNode("Bold text", [{ type: "bold" }]);
      const p = createParagraphNode([text]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<strong>");
      expect(html).toContain("</strong>");
    });

    it("should render italic text", () => {
      const text = createTextNode("Italic text", [{ type: "italic" }]);
      const p = createParagraphNode([text]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<em>");
      expect(html).toContain("</em>");
    });

    it("should render underlined text", () => {
      const text = createTextNode("Underlined", [{ type: "underline" }]);
      const p = createParagraphNode([text]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<u>");
      expect(html).toContain("</u>");
    });

    it("should render strikethrough text", () => {
      const text = createTextNode("Struck", [{ type: "strikethrough" }]);
      const p = createParagraphNode([text]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<s>");
      expect(html).toContain("</s>");
    });

    it("should render code text", () => {
      const text = createTextNode("code", [{ type: "code" }]);
      const p = createParagraphNode([text]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<code>");
      expect(html).toContain("</code>");
    });

    it("should render subscript and superscript", () => {
      const subText = createTextNode("2", [{ type: "subscript" }]);
      const supText = createTextNode("2", [{ type: "superscript" }]);
      const p = createParagraphNode([
        createTextNode("H"),
        subText,
        createTextNode("O"),
        supText,
      ]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<sub>");
      expect(html).toContain("<sup>");
    });

    it("should render multiple marks", () => {
      const text = createTextNode("Bold and italic", [{ type: "bold" }, { type: "italic" }]);
      const p = createParagraphNode([text]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<strong>");
      expect(html).toContain("<em>");
    });
  });

  describe("List Rendering", () => {
    it("should render unordered list", () => {
      const list = createListNode("unordered", [
        createListItemNode([createParagraphNode([createTextNode("Item 1")])], 0),
        createListItemNode([createParagraphNode([createTextNode("Item 2")])], 0),
      ]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([list]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<ul");
      expect(html).toContain("<li>");
      expect(html).toContain("Item 1");
      expect(html).toContain("Item 2");
      expect(html).toContain("</ul>");
    });

    it("should render ordered list", () => {
      const list = createListNode("ordered", [
        createListItemNode([createParagraphNode([createTextNode("First")])], 0, undefined, 1),
        createListItemNode([createParagraphNode([createTextNode("Second")])], 0, undefined, 2),
      ]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([list]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<ol");
      expect(html).toContain("First");
      expect(html).toContain("Second");
      expect(html).toContain("</ol>");
    });

    it("should render nested list levels", () => {
      const list = createListNode("unordered", [
        createListItemNode([createParagraphNode([createTextNode("Level 0")])], 0),
        createListItemNode(
          [
            createParagraphNode([createTextNode("Level 0 with nested")]),
            createListNode("unordered", [
              createListItemNode([createParagraphNode([createTextNode("Level 1")])], 1),
            ]),
          ],
          0
        ),
      ]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([list]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('data-list-level="1"');
    });
  });

  describe("Table Rendering", () => {
    it("should render a simple table", () => {
      const table = createTableNode([
        createTableRowNode([
          createTableCellNode([createParagraphNode([createTextNode("Cell 1")])]),
          createTableCellNode([createParagraphNode([createTextNode("Cell 2")])]),
        ]),
      ]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([table]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<table");
      expect(html).toContain("<tr>");
      expect(html).toContain("<td");
      expect(html).toContain("Cell 1");
      expect(html).toContain("Cell 2");
    });

    it("should render header cells", () => {
      const table = createTableNode([
        createTableRowNode(
          [
            createTableCellNode([createParagraphNode([createTextNode("Header")])], { isHeader: true }),
          ],
          true
        ),
      ]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([table]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("<th>");
    });

    it("should render colspan and rowspan", () => {
      const table = createTableNode([
        createTableRowNode([
          createTableCellNode([createParagraphNode([createTextNode("Span 2")])], { colspan: 2 }),
        ]),
        createTableRowNode([
          createTableCellNode([createParagraphNode([createTextNode("Span 2 rows")])], { rowspan: 2 }),
        ]),
      ]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([table]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('colspan="2"');
      expect(html).toContain('rowspan="2"');
    });
  });

  describe("Image Rendering", () => {
    it("should render an inline image", () => {
      const img = createImageNode("image.png", { alt: "An image" });
      const p = createParagraphNode([img]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('<img');
      expect(html).toContain('src="image.png"');
      expect(html).toContain('alt="An image"');
    });

    it("should render image with dimensions", () => {
      const img = createImageNode("image.png", {
        dimensions: { width: 200, height: 100, unit: "px" },
      });
      const p = createParagraphNode([img]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('width:200px');
      expect(html).toContain('height:100px');
    });

    it("should render floating image with positioning", () => {
      const img = createImageNode("image.png", {
        positioning: {
          type: "floating",
          anchor: {
            horizontal: { position: 100, relativeTo: "page" },
            vertical: { position: 50, relativeTo: "page" },
            wrap: "square",
          },
        },
      });
      const p = createParagraphNode([img]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('position:absolute');
      expect(html).toContain('left:100px');
      expect(html).toContain('top:50px');
      expect(html).toContain('data-word-anchor="1"');
    });
  });

  describe("Hyperlink Rendering", () => {
    it("should render a hyperlink", () => {
      const link = createHyperlinkNode(
        "https://example.com",
        [createTextNode("Example")],
        { title: "Example Site" }
      );
      const p = createParagraphNode([link]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('<a href="https://example.com"');
      expect(html).toContain('title="Example Site"');
      expect(html).toContain(">Example</a>");
    });

    it("should render external link with target blank", () => {
      const link = createHyperlinkNode(
        "https://external.com",
        [createTextNode("External")],
        { target: "_blank" }
      );
      const p = createParagraphNode([link]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });
  });

  describe("Auxiliary Content Rendering", () => {
    it("should render footnotes section", () => {
      const doc = createEmptyDocument("docx");
      doc.auxiliary = createAuxiliaryContent();
      addFootnote(doc.auxiliary, "fn1", [createParagraphNode([createTextNode("Footnote 1")])], 1);
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('data-word-footnotes="1"');
      expect(html).toContain('data-word-footnote-id="fn1"');
      expect(html).toContain("Footnote 1");
    });

    it("should render endnotes section", () => {
      const doc = createEmptyDocument("docx");
      doc.auxiliary = createAuxiliaryContent();
      addEndnote(doc.auxiliary, "en1", [createParagraphNode([createTextNode("Endnote 1")])], 1);
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('data-word-endnotes="1"');
      expect(html).toContain("Endnote 1");
    });

    it("should render comments section", () => {
      const doc = createEmptyDocument("docx");
      doc.auxiliary = createAuxiliaryContent();
      addComment(doc.auxiliary, "c1", [createParagraphNode([createTextNode("Comment")])], {
        author: "Test User",
      });
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain('data-word-comments="1"');
      expect(html).toContain("Comment");
      expect(html).toContain("Test User");
    });
  });

  describe("Render Modes", () => {
    it("should render in fidelity mode with styles", () => {
      const p = createParagraphNode([createTextNode("Test")], {
        alignment: "center",
        indent: { left: 20, unit: "pt" },
      });
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, { mode: "fidelity" });
      
      expect(html).toContain("text-align:center");
      expect(html).toContain("margin-left:20pt");
    });

    it("should render in semantic mode without inline styles", () => {
      const p = createParagraphNode([createTextNode("Test")], {
        alignment: "center",
      });
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, { mode: "semantic", includeDataAttrs: false });
      
      // Semantic mode should not include style attributes
      expect(html).not.toContain("text-align");
    });
  });

  describe("Document Wrapper", () => {
    it("should wrap in full HTML document when requested", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([createParagraphNode([createTextNode("Test")])]));
      
      const html = renderASTToHtml(doc, { wrapAsDocument: true });
      
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html>");
      expect(html).toContain("<head>");
      expect(html).toContain("<body>");
    });
  });

  describe("Special Characters", () => {
    it("should escape HTML in text content", () => {
      const p = createParagraphNode([createTextNode("<script>alert('xss')</script>")]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("&lt;script&gt;");
      expect(html).not.toContain("<script>");
    });

    it("should escape HTML in attributes", () => {
      const link = createHyperlinkNode(
        'https://example.com?q="test"',
        [createTextNode("Link")],
        { title: 'Title with "quotes"' }
      );
      const p = createParagraphNode([link]);
      const doc = createEmptyDocument("docx");
      doc.children.push(createSectionNode([p]));
      
      const html = renderASTToHtml(doc, defaultOptions);
      
      expect(html).toContain("&quot;");
    });
  });

  describe("Renderer Class", () => {
    it("should return metadata with node counts", () => {
      const doc = createEmptyDocument("docx");
      doc.children.push(
        createSectionNode([
          createParagraphNode([
            createTextNode("Hello"),
            createImageNode("img.png"),
          ]),
          createParagraphNode([
            createHyperlinkNode("https://example.com", [createTextNode("Link")]),
          ]),
        ])
      );
      
      const renderer = new HtmlRenderer(defaultOptions);
      const result = renderer.render(doc);
      
      expect(result.metadata.imageCount).toBe(1);
      expect(result.metadata.linkCount).toBe(1);
      expect(result.metadata.nodeCount).toBeGreaterThan(0);
    });
  });
});
