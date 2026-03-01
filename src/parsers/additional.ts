/**
 * Additional Input Format Parsers
 * 
 * Provides support for PDF, ODT, and RTF formats.
 */

import type { DocumentNode } from '../ast/types';

// PDF Parser using pdf-parse
export interface PDFParseOptions {
  extractImages?: boolean;
  extractTables?: boolean;
  maxPages?: number;
}

export interface PDFParseResult {
  success: boolean;
  content: string;
  metadata?: {
    title?: string;
    author?: string;
    pageCount: number;
  };
  images?: ArrayOf<{ data: string; page: number }>;
}

// ODT Parser 
export interface ODTParseResult {
  success: boolean;
  content: string;
  metadata?: {
    title?: string;
    author?: string;
  };
}

// RTF Parser
export interface RTFParseResult {
  success: boolean;
  content: string;
}

type ArrayOf<T> = T[];

class PDFParser {
  private pdfjs: any = null;

  async loadLibrary(): Promise<any> {
    if (!this.pdfjs) {
      try {
        this.pdfjs = await import('pdf-parse');
      } catch {
        throw new Error('pdf-parse not installed');
      }
    }
    return this.pdfjs;
  }

  async parse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFParseResult> {
    try {
      const pdf = await this.loadLibrary();
      const data = await pdf(buffer, {
        max: options?.maxPages || 100
      });

      let content = '';
      const images: ArrayOf<{ data: string; page: number }> = [];

      for (let i = 1; i <= data.numpages; i++) {
        const page = await data.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        content += pageText + '\n\n';

        if (options?.extractImages) {
          const ops = await page.getOperatorList();
          // Image extraction would go here
        }
      }

      return {
        success: true,
        content,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          pageCount: data.numpages
        },
        images: images.length > 0 ? images : undefined
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        metadata: { pageCount: 0 }
      };
    }
  }
}

class ODTParser {
  private JSZip: any = null;

  async loadLibrary(): Promise<any> {
    if (!this.JSZip) {
      const JSZip = (await import('jszip')).default;
      this.JSZip = JSZip;
    }
    return this.JSZip;
  }

  async parse(buffer: Buffer): Promise<ODTParseResult> {
    try {
      const JSZip = await this.loadLibrary();
      const zip = await JSZip.loadAsync(buffer);
      
      // Get content.xml
      const contentXml = await zip.file('content.xml')?.async('string');
      if (!contentXml) {
        throw new Error('content.xml not found');
      }

      // Parse XML to text
      const content = this.extractTextFromXML(contentXml);

      // Try to get metadata
      let metadata: ODTParseResult['metadata'];
      const metaXml = await zip.file('meta.xml')?.async('string');
      if (metaXml) {
        metadata = this.extractMetadata(metaXml);
      }

      return { success: true, content, metadata };
    } catch (error) {
      return { success: false, content: '' };
    }
  }

  private extractTextFromXML(xml: string): string {
    // Simple extraction - in production use proper XML parser
    const textMatches = xml.match(/<text:p[^>]*>([^<]*)<\/text:p>/g) || [];
    return textMatches
      .map(match => match.replace(/<[^>]+>/g, '').trim())
      .filter(Boolean)
      .join('\n\n');
  }

  private extractMetadata(xml: string): ODTParseResult['metadata'] {
    const titleMatch = xml.match(/<dc:title[^>]*>([^<]*)<\/dc:title>/);
    const authorMatch = xml.match(/<dc:creator[^>]*>([^<]*)<\/dc:creator>/);
    
    return {
      title: titleMatch?.[1],
      author: authorMatch?.[1]
    };
  }
}

class RTFParser {
  parse(rtf: string): RTFParseResult {
    try {
      // Basic RTF parser
      let content = '';
      let inGroup = 0;
      let skipNext = false;
      let skipUntil = '';
      
      for (let i = 0; i < rtf.length; i++) {
        const char = rtf[i];
        
        if (skipNext) {
          skipNext = false;
          continue;
        }
        
        if (skipUntil) {
          if (char === '\\' && rtf.slice(i, i + skipUntil.length) === skipUntil) {
            skipUntil = '';
          }
          continue;
        }
        
        if (char === '{') {
          inGroup++;
          continue;
        }
        
        if (char === '}') {
          inGroup--;
          continue;
        }
        
        if (char === '\\') {
          const nextChars = rtf.slice(i + 1, i + 4);
          
          // Control words
          if (/^[a-zA-Z]/.test(nextChars)) {
            const match = rtf.slice(i + 1).match(/^([a-zA-Z]+)(-?\d*)/);
            if (match) {
              const word = match[1];
              i += match[0].length;
              
              // Skip certain keywords
              if (['fonttbl', 'colortbl', 'stylesheet', 'info'].includes(word)) {
                skipUntil = '\\' + word;
              }
              
              // Newline
              if (word === 'par' || word === 'line') {
                content += '\n';
              }
              continue;
            }
          }
          
          // Special characters
          if (nextChars[0] === "'") {
            const hex = rtf.slice(i + 2, i + 4);
            const charCode = parseInt(hex, 16);
            content += String.fromCharCode(charCode);
            i += 3;
            continue;
          }
          
          if (nextChars[0] === '\\' || nextChars[0] === '{' || nextChars[0] === '}') {
            content += nextChars[0];
            i += 1;
            continue;
          }
        }
        
        if (char !== '\r' && char !== '\n') {
          content += char;
        }
      }
      
      return { success: true, content: content.trim() };
    } catch (error) {
      return { success: false, content: '' };
    }
  }
}

// Main parser factory
export type InputFormat = 'pdf' | 'odt' | 'rtf' | 'docx';

export async function parseToText(buffer: Buffer, format: InputFormat): Promise<string> {
  switch (format) {
    case 'pdf': {
      const parser = new PDFParser();
      const result = await parser.parse(buffer);
      return result.content;
    }
    case 'odt': {
      const parser = new ODTParser();
      const result = await parser.parse(buffer);
      return result.content;
    }
    case 'rtf': {
      const parser = new RTFParser();
      const result = parser.parse(buffer.toString('utf-8'));
      return result.content;
    }
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export async function parseToAST(buffer: Buffer, format: InputFormat): Promise<DocumentNode> {
  const text = await parseToText(buffer, format);
  
  // Convert text to basic AST
  const lines = text.split('\n');
  const children: any[] = [];
  
  for (const line of lines) {
    if (line.trim()) {
      children.push({
        type: 'paragraph',
        children: [{ type: 'text', value: line }]
      });
    }
  }
  
  return {
    type: 'document',
    version: '1.0',
    children
  } as DocumentNode;
}

export { PDFParser, ODTParser, RTFParser };
