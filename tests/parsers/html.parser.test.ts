/**
 * HTML Parser Tests
 * 
 * Tests for HTML string to AST conversion.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HtmlParser } from '../../src/parsers/html/parser';

describe('HtmlParser', () => {
  let parser: HtmlParser;

  beforeEach(() => {
    parser = new HtmlParser();
  });

  describe('Basic Parsing', () => {
    it('should parse a simple HTML document', async () => {
      const html = '<p>Hello World</p>';
      const result = await parser.parse(html);

      expect(result.ast).toBeDefined();
      expect(result.ast.type).toBe('document');
      expect(result.report.characterCount).toBe(html.length);
    });

    it('should extract document title', async () => {
      const html = '<html><head><title>Test Title</title></head><body><p>Content</p></body></html>';
      const result = await parser.parse(html);

      expect(result.ast.properties?.title).toBe('Test Title');
    });

    it('should extract meta author', async () => {
      const html = '<html><head><meta name="author" content="John Doe"></head><body><p>Content</p></body></html>';
      const result = await parser.parse(html);

      expect(result.ast.properties?.author).toBe('John Doe');
    });
  });

  describe('Block Elements', () => {
    it('should parse headings', async () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><p>Content</p>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[0].type).toBe('heading');
      expect((section.children[0] as any).level).toBe(1);
      expect(section.children[1].type).toBe('heading');
      expect((section.children[1] as any).level).toBe(2);
    });

    it('should parse paragraphs', async () => {
      const html = '<p>First paragraph</p><p>Second paragraph</p>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[0].type).toBe('paragraph');
      expect(section.children[1].type).toBe('paragraph');
    });

    it('should parse unordered lists', async () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[0].type).toBe('list');
      expect((section.children[0] as any).listType).toBe('unordered');
    });

    it('should parse ordered lists', async () => {
      const html = '<ol><li>First</li><li>Second</li></ol>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[0].type).toBe('list');
      expect((section.children[0] as any).listType).toBe('ordered');
    });

    it('should parse tables', async () => {
      const html = '<table><tr><th>Header</th></tr><tr><td>Cell</td></tr></table>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[0].type).toBe('table');
    });

    it('should parse blockquotes', async () => {
      const html = '<blockquote>Quoted text</blockquote>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[0].type).toBe('blockquote');
    });

    it('should parse code blocks', async () => {
      const html = '<pre><code>const x = 1;</code></pre>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[0].type).toBe('codeBlock');
      expect((section.children[0] as any).code).toBe('const x = 1;');
    });

    it('should parse thematic breaks', async () => {
      const html = '<p>Before</p><hr><p>After</p>';
      const result = await parser.parse(html);

      const section = result.ast.children[0];
      expect(section.children[1].type).toBe('thematicBreak');
    });
  });

  describe('Inline Elements', () => {
    it('should parse bold text', async () => {
      const html = '<p><strong>Bold text</strong></p>';
      const result = await parser.parse(html);

      const paragraph = (result.ast.children[0] as any).children[0];
      const textNode = paragraph.children[0];
      expect(textNode.text).toBe('Bold text');
      expect(textNode.marks?.[0].type).toBe('bold');
    });

    it('should parse italic text', async () => {
      const html = '<p><em>Italic text</em></p>';
      const result = await parser.parse(html);

      const paragraph = (result.ast.children[0] as any).children[0];
      const textNode = paragraph.children[0];
      expect(textNode.marks?.[0].type).toBe('italic');
    });

    it('should parse links', async () => {
      const html = '<p><a href="https://example.com" title="Example">Link</a></p>';
      const result = await parser.parse(html);

      const paragraph = (result.ast.children[0] as any).children[0];
      const link = paragraph.children[0];
      expect(link.type).toBe('hyperlink');
      expect(link.href).toBe('https://example.com');
      expect(link.title).toBe('Example');
    });

    it('should parse images', async () => {
      const html = '<p><img src="image.png" alt="Alt text" title="Image"></p>';
      const result = await parser.parse(html);

      const paragraph = (result.ast.children[0] as any).children[0];
      const img = paragraph.children[0];
      expect(img.type).toBe('image');
      expect(img.src).toBe('image.png');
      expect(img.alt).toBe('Alt text');
    });

    it('should parse code inline', async () => {
      const html = '<p>Use <code>console.log()</code> for debugging</p>';
      const result = await parser.parse(html);

      const paragraph = (result.ast.children[0] as any).children[0];
      expect(paragraph.children.some((c: any) => c.marks?.[0]?.type === 'code')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw on invalid HTML', async () => {
      const html = '<p>Unclosed paragraph';
      
      // Should not throw but may warn
      await expect(parser.parse(html)).rejects.toThrow();
    });
  });

  describe('Report', () => {
    it('should include byte size in report', async () => {
      const html = '<p>Test</p>';
      const result = await parser.parse(html);

      expect(result.report.byteSize).toBeGreaterThan(0);
    });

    it('should include character count in report', async () => {
      const html = '<p>Test</p>';
      const result = await parser.parse(html);

      expect(result.report.characterCount).toBe(html.length);
    });

    it('should include parse time in report', async () => {
      const html = '<p>Test</p>';
      const result = await parser.parse(html);

      expect(result.report.parseTimeMs).toBeGreaterThanOrEqual(0);
    });
  });
});
