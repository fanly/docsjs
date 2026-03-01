/**
 * GitBook Adapter
 * 
 * Integration with GitBook for technical documentation.
 */

import type { CMSAdapter, CMSImportOptions, CMSContent } from './adapters';
import type { ConvertResultData } from '../server/types';

export interface GitBookOptions extends CMSImportOptions {
  /** GitBook API token */
  apiToken: string;
  /** Organization/space ID */
  organizationId?: string;
  /** Space ID */
  spaceId?: string;
  /** GitBook API URL (default: https://api.gitbook.com) */
  apiUrl?: string;
  /** Enable version history */
  includeHistory?: boolean;
}

export interface GitBookPage {
  id: string;
  title: string;
  slug: string;
  path: string;
  description?: string;
  content?: GitBookContent;
  childIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GitBookContent {
  /** Document content in GitBook's block format */
  nodes: GitBookBlock[];
}

export interface GitBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

export interface GitBookSpace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface GitBookVersion {
  id: string;
  title: string;
  createdAt: string;
}

export class GitBookAdapter implements CMSAdapter {
  name = 'gitbook';
  version = '1.0.0';
  private options: GitBookOptions;

  constructor(options: GitBookOptions) {
    this.options = {
      apiUrl: 'https://api.gitbook.com',
      ...options,
    };
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const page = content as GitBookPage;
    const html = this.gitbookToHtml(page);
    
    return {
      output: html,
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    
    if (this.options.spaceId) {
      await this.createGitBookPage(extracted);
    }
    
    return extracted;
  }

  /**
   * Get space info
   */
  async getSpace(spaceId: string): Promise<GitBookSpace> {
    const response = await fetch(
      `${this.options.apiUrl}/v1/spaces/${spaceId}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`GitBook API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get page by path
   */
  async getPage(spaceId: string, path: string): Promise<GitBookPage | null> {
    const response = await fetch(
      `${this.options.apiUrl}/v1/spaces/${spaceId}/content/${path}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitBook API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all pages in space
   */
  async getPages(spaceId: string): Promise<GitBookPage[]> {
    const pages: GitBookPage[] = [];
    let cursor: string | undefined;

    do {
      const params = new URLSearchParams();
      if (cursor) params.set('cursor', cursor);

      const response = await fetch(
        `${this.options.apiUrl}/v1/spaces/${spaceId}/pages?${params}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`GitBook API error: ${response.statusText}`);
      }

      const data = await response.json();
      pages.push(...(data.pages || []));
      cursor = data.nextCursor;
    } while (cursor);

    return pages;
  }

  /**
   * Search content
   */
  async search(spaceId: string, query: string): Promise<GitBookPage[]> {
    const response = await fetch(
      `${this.options.apiUrl}/v1/spaces/${spaceId}/search?q=${encodeURIComponent(query)}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`GitBook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Get versions
   */
  async getVersions(spaceId: string): Promise<GitBookVersion[]> {
    const response = await fetch(
      `${this.options.apiUrl}/v1/spaces/${spaceId}/versions`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`GitBook API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.versions || [];
  }

  /**
   * Get specific version content
   */
  async getVersionContent(spaceId: string, versionId: string, path: string): Promise<GitBookPage | null> {
    const response = await fetch(
      `${this.options.apiUrl}/v1/spaces/${spaceId}/versions/${versionId}/content/${path}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitBook API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async createGitBookPage(content: CMSContent): Promise<GitBookPage> {
    const body = {
      title: content.title,
      description: content.excerpt,
      content: {
        nodes: this.htmlToGitBookNodes(content.body),
      },
    };

    const response = await fetch(
      `${this.options.apiUrl}/v1/spaces/${this.options.spaceId}/pages`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create GitBook page: ${response.statusText}`);
    }

    return response.json();
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled';

    let body = html;
    if (titleMatch) {
      body = body.replace(titleMatch[0], '');
    }

    const imgMatch = body.match(/<img[^>]+src="([^"]+)"/i);
    const featuredImage = imgMatch ? imgMatch[1] : undefined;

    return {
      title,
      body: body.trim(),
      featuredImage,
    };
  }

  private gitbookToHtml(page: GitBookPage): string {
    let html = `<h1>${page.title}</h1>\n`;
    
    if (page.content?.nodes) {
      html += this.nodesToHtml(page.content.nodes);
    }
    
    return html;
  }

  private nodesToHtml(nodes: GitBookBlock[]): string {
    return nodes.map(node => this.blockToHtml(node)).join('\n');
  }

  private blockToHtml(block: GitBookBlock): string {
    switch (block.type) {
      case 'paragraph':
        return `<p>${this.extractTextFromParagraph(block)}</p>`;
      case 'heading':
        const level = (block as any).level || 1;
        return `<h${level}>${this.extractTextFromHeading(block)}</h${level}>`;
      case 'code':
        const code = (block as any).code || '';
        const lang = (block as any).language || '';
        return `<pre><code class="language-${lang}">${code}</code></pre>`;
      case 'list':
        return this.listToHtml(block);
      case 'image':
        const url = (block as any).url || '';
        const alt = (block as any).alt || '';
        return `<img src="${url}" alt="${alt}" />`;
      default:
        return '';
    }
  }

  private extractTextFromParagraph(block: any): string {
    const children = block.children || [];
    return children.map((c: any) => c.text || '').join('');
  }

  private extractTextFromHeading(block: any): string {
    const children = block.children || [];
    return children.map((c: any) => c.text || '').join('');
  }

  private listToHtml(block: any): string {
    const items = block.children || [];
    const tag = (block as any).ordered ? 'ol' : 'ul';
    const listItems = items.map((item: any) => 
      `<li>${this.nodesToHtml(item.children || [])}</li>`
    ).join('\n');
    return `<${tag}>\n${listItems}\n</${tag}>`;
  }

  private htmlToGitBookNodes(html: string): GitBookBlock[] {
    // Simple HTML to GitBook nodes conversion
    // This is simplified - real implementation would be more robust
    const nodes: GitBookBlock[] = [];
    
    // Parse headings
    const headingMatches = html.matchAll(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi);
    for (const match of headingMatches) {
      nodes.push({
        id: `heading-${nodes.length}`,
        type: 'heading',
        level: parseInt(match[1]),
        children: [{ text: match[2] }],
      });
    }
    
    // Add remaining content as paragraph
    const remaining = html.replace(/<h[1-6][^>]*>.*?<\/h[1-6]>/gi, '').trim();
    if (remaining) {
      nodes.push({
        id: `para-${nodes.length}`,
        type: 'paragraph',
        children: [{ text: remaining }],
      });
    }
    
    return nodes;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.options.apiToken}`,
      'Content-Type': 'application/json',
    };
  }
}

export function createGitBookAdapter(options: GitBookOptions): CMSAdapter {
  return new GitBookAdapter(options);
}
