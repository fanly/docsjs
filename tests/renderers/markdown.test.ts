/**
 * Markdown Renderer Tests
 * 
 * Tests for AST to Markdown conversion.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MarkdownRenderer } from '../../src/renderers/markdown/renderer';
import type { DocumentNode, HeadingNode, ParagraphNode, TextNode, ListNode } from '../../src/ast/types';

describe('MarkdownRenderer', () => {
  let renderer: MarkdownRenderer;

  beforeEach(() => {
    renderer = new MarkdownRenderer();
  });

  describe('Basic Rendering', () => {
    it('should render an empty document', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toBe('');
    });

    it('should render a simple paragraph', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'paragraph',
                id: 'p-1',
                children: [
                  { type: 'text', id: 't-1', text: 'Hello World' }
                ]
              }
            ]
          }
        ],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toBe('Hello World');
    });

    it('should render headings with correct level', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'heading',
                id: 'h1',
                level: 1,
                children: [{ type: 'text', id: 't1', text: 'Main Title' }]
              },
              {
                type: 'heading',
                id: 'h2',
                level: 2,
                children: [{ type: 'text', id: 't2', text: 'Subtitle' }]
              }
            ]
          }
        ],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toContain('# Main Title');
      expect(result.markdown).toContain('## Subtitle');
    });
  });

  describe('Text Formatting', () => {
    it('should render bold text', () => {
      const ast = createDocWithParagraph([{
        type: 'text',
        id: 't1',
        text: 'bold text',
        marks: [{ type: 'bold' }]
      }]);

      const result = renderer.render(ast);
      expect(result.markdown).toBe('**bold text**');
    });

    it('should render italic text', () => {
      const ast = createDocWithParagraph([{
        type: 'text',
        id: 't1',
        text: 'italic text',
        marks: [{ type: 'italic' }]
      }]);

      const result = renderer.render(ast);
      expect(result.markdown).toBe('*italic text*');
    });

    it('should render code inline', () => {
      const ast = createDocWithParagraph([{
        type: 'text',
        id: 't1',
        text: 'inline code',
        marks: [{ type: 'code' }]
      }]);

      const result = renderer.render(ast);
      expect(result.markdown).toBe('`inline code`');
    });
  });

  describe('Lists', () => {
    it('should render unordered lists', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'list',
                id: 'list-1',
                listType: 'unordered',
                items: [
                  {
                    type: 'listItem',
                    id: 'li-1',
                    children: [
                      { type: 'paragraph', id: 'p1', children: [{ type: 'text', id: 't1', text: 'Item 1' }] }
                    ]
                  },
                  {
                    type: 'listItem',
                    id: 'li-2',
                    children: [
                      { type: 'paragraph', id: 'p2', children: [{ type: 'text', id: 't2', text: 'Item 2' }] }
                    ]
                  }
                ]
              }
            ]
          }
        ],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toContain('- Item 1');
      expect(result.markdown).toContain('- Item 2');
    });

    it('should render ordered lists', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'list',
                id: 'list-1',
                listType: 'ordered',
                items: [
                  {
                    type: 'listItem',
                    id: 'li-1',
                    number: 1,
                    children: [
                      { type: 'paragraph', id: 'p1', children: [{ type: 'text', id: 't1', text: 'First' }] }
                    ]
                  },
                  {
                    type: 'listItem',
                    id: 'li-2',
                    number: 2,
                    children: [
                      { type: 'paragraph', id: 'p2', children: [{ type: 'text', id: 't2', text: 'Second' }] }
                    ]
                  }
                ]
              }
            ]
          }
        ],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toContain('1. First');
      expect(result.markdown).toContain('2. Second');
    });
  });

  describe('Links and Images', () => {
    it('should render hyperlinks', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'paragraph',
                id: 'p-1',
                children: [
                  {
                    type: 'hyperlink',
                    id: 'link-1',
                    href: 'https://example.com',
                    title: 'Example',
                    children: [{ type: 'text', id: 't1', text: 'Click here' }]
                  }
                ]
              }
            ]
          }
        ],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toContain('[Click here](https://example.com)');
      expect(result.metadata.linkCount).toBe(1);
    });

    it('should render images', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'paragraph',
                id: 'p-1',
                children: [
                  {
                    type: 'image',
                    id: 'img-1',
                    src: 'image.png',
                    alt: 'Test Image'
                  }
                ]
              }
            ]
          }
        ],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toContain('![Test Image](image.png)');
      expect(result.metadata.imageCount).toBe(1);
    });
  });

  describe('Code Blocks', () => {
    it('should render code blocks', () => {
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'codeBlock',
                id: 'code-1',
                code: 'const x = 1;',
                language: 'javascript'
              }
            ]
          }
        ],
      };

      const result = renderer.render(ast);
      expect(result.markdown).toContain('```javascript');
      expect(result.markdown).toContain('const x = 1;');
      expect(result.markdown).toContain('```');
    });
  });

  describe('Table of Contents', () => {
    it('should generate TOC when enabled', () => {
      const rendererWithTOC = new MarkdownRenderer({ includeTOC: true });
      
      const ast: DocumentNode = {
        type: 'document',
        id: 'test-doc',
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          sourceFormat: 'docx',
          generator: 'test',
        },
        children: [
          {
            type: 'section',
            id: 'section-1',
            children: [
              {
                type: 'heading',
                id: 'h1',
                level: 1,
                children: [{ type: 'text', id: 't1', text: 'Introduction' }]
              },
              {
                type: 'heading',
                id: 'h2',
                level: 2,
                children: [{ type: 'text', id: 't2', text: 'Background' }]
              }
            ]
          }
        ],
      };

      const result = rendererWithTOC.render(ast);
      expect(result.markdown).toContain('## Table of Contents');
      expect(result.markdown).toContain('- [Introduction](#introduction)');
      expect(result.markdown).toContain('- [Background](#background)');
    });
  });
});

// Helper function to create test documents
function createDocWithParagraph(children: any[]): DocumentNode {
  return {
    type: 'document',
    id: 'test-doc',
    metadata: {
      version: '1.0.0',
      createdAt: Date.now(),
      sourceFormat: 'docx',
      generator: 'test',
    },
    children: [
      {
        type: 'section',
        id: 'section-1',
        children: [
          {
            type: 'paragraph',
            id: 'p-1',
            children
          }
        ]
      }
    ],
  };
}
