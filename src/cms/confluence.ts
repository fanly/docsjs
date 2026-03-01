/**
 * Confluence Adapter
 * 
 * Integration with Atlassian Confluence for enterprise documentation.
 */

import type { CMSAdapter, CMSImportOptions, CMSContent } from './adapters';
import type { ConvertResultData } from '../server/types';

export interface ConfluenceOptions extends CMSImportOptions {
  /** Confluence base URL */
  baseUrl: string;
  /** Confluence email */
  email: string;
  /** Confluence API token */
  apiToken: string;
  /** Space key for new pages */
  spaceKey?: string;
  /** Parent page ID for hierarchy */
  parentId?: string;
  /** Enable macros expansion */
  expandMacros?: boolean;
}

export interface ConfluencePage {
  id: string;
  type: string;
  status: string;
  title: string;
  space?: { key: string; name: string };
  body?: { storage: { value: string }; representation: string };
  version?: { number: number; message?: string };
  createdAt: string;
  lastUpdated: string;
  _links?: { webui: string; editui: string };
}

export interface ConfluenceSpace {
  id: string;
  key: string;
  name: string;
  type: string;
  status: string;
  description?: { plain?: { value: string } };
}

export interface ConfluenceAttachment {
  id: string;
  title: string;
  mediaType: string;
  downloadLink: string;
  fileSize: number;
}

export class ConfluenceAdapter implements CMSAdapter {
  name = 'confluence';
  version = '1.0.0';
  private options: ConfluenceOptions;

  constructor(options: ConfluenceOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const page = content as ConfluencePage;
    const html = this.confluenceToHtml(page);
    
    return {
      output: html,
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    
    if (this.options.spaceKey || this.options.parentId) {
      await this.createConfluencePage(extracted);
    }
    
    return extracted;
  }

  /**
   * Get page by ID
   */
  async getPage(pageId: string): Promise<ConfluencePage> {
    const response = await fetch(
      `${this.options.baseUrl}/wiki/api/v2/pages/${pageId}?body-format=storage`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get page by title
   */
  async getPageByTitle(title: string, spaceKey?: string): Promise<ConfluencePage | null> {
    const params = new URLSearchParams({
      title,
      'body-format': 'storage',
    });

    if (spaceKey) {
      params.set('space-key', spaceKey);
    }

    const response = await fetch(
      `${this.options.baseUrl}/wiki/api/v2/pages?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results?.[0] || null;
  }

  /**
   * Get page children
   */
  async getChildren(pageId: string): Promise<ConfluencePage[]> {
    const response = await fetch(
      `${this.options.baseUrl}/wiki/api/v2/pages?parent-id=${pageId}&body-format=storage`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Get space info
   */
  async getSpace(spaceKey: string): Promise<ConfluenceSpace> {
    const response = await fetch(
      `${this.options.baseUrl}/wiki/api/v2/spaces?keys=${spaceKey}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.results?.length) {
      throw new Error(`Space not found: ${spaceKey}`);
    }

    return data.results[0];
  }

  /**
   * Get page attachments
   */
  async getAttachments(pageId: string): Promise<ConfluenceAttachment[]> {
    const response = await fetch(
      `${this.options.baseUrl}/wiki/api/v2/pages/${pageId}/attachments`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  /**
   * Search content
   */
  async search(cql: string): Promise<ConfluencePage[]> {
    const params = new URLSearchParams({
      cql,
      'body-format': 'storage',
    });

    const response = await fetch(
      `${this.options.baseUrl}/wiki/api/v2/pages?${params}`,
      { headers: this.getHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Confluence API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  }

  private async createConfluencePage(content: CMSContent): Promise<ConfluencePage> {
    const body: Record<string, unknown> = {
      spaceId: this.options.spaceKey,
      status: 'current',
      title: content.title,
      parentId: this.options.parentId,
      body: {
        representation: 'storage',
        value: content.body,
      },
    };

    const response = await fetch(
      `${this.options.baseUrl}/wiki/api/v2/pages`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Confluence page: ${response.statusText}`);
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

  private confluenceToHtml(page: ConfluencePage): string {
    const title = page.title;
    let html = `<h1>${title}</h1>\n`;
    
    // Add storage format content
    if (page.body?.storage?.value) {
      html += this.convertStorageToHtml(page.body.storage.value);
    }
    
    return html;
  }

  private convertStorageToHtml(storage: string): string {
    // Convert Confluence storage format to HTML
    // This is simplified - real implementation would handle all macros
    return storage;
  }

  private getHeaders(): Record<string, string> {
    const credentials = Buffer.from(
      `${this.options.email}:${this.options.apiToken}`
    ).toString('base64');

    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }
}

export function createConfluenceAdapter(options: ConfluenceOptions): CMSAdapter {
  return new ConfluenceAdapter(options);
}
