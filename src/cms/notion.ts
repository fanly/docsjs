/**
 * Notion Adapter
 * 
 * Integration with Notion for importing/exporting pages and databases.
 */

import type { CMSAdapter, CMSImportOptions, CMSContent } from './adapters';
import type { ConvertResultData } from '../server/types';

export interface NotionOptions extends CMSImportOptions {
  /** Notion API key (Integration token) */
  apiKey: string;
  /** Parent page ID for new pages */
  parentPageId?: string;
  /** Parent database ID for database entries */
  parentDatabaseId?: string;
  /** Enable rich text formatting */
  preserveFormatting?: boolean;
}

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

export interface NotionPage {
  id: string;
  created_time: string;
  last_edited_time: string;
  created_by: { id: string; object: string };
  last_edited_by: { id: string; object: string };
  cover?: { external?: { url: string }; file?: { url: string } };
  icon?: { emoji?: string; external?: { url: string }; file?: { url: string } };
  parent: { type: string; page_id?: string; database_id?: string };
  properties: Record<string, unknown>;
  archived: boolean;
  url: string;
}

export interface NotionDatabase {
  id: string;
  created_time: string;
  last_edited_time: string;
  title: Array<{ plain_text: string }>;
  properties: Record<string, unknown>;
}

export class NotionAdapter implements CMSAdapter {
  name = 'notion';
  version = '1.0.0';
  private options: NotionOptions;

  constructor(options: NotionOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const page = content as NotionPage;
    const html = this.pageToHtml(page);
    
    return {
      output: html,
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    
    if (this.options.parentPageId || this.options.parentDatabaseId) {
      await this.createNotionPage(extracted);
    }
    
    return extracted;
  }

  /**
   * Fetch page by ID
   */
  async getPage(pageId: string): Promise<NotionPage> {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch page blocks (children)
   */
  async getPageBlocks(pageId: string): Promise<NotionBlock[]> {
    const blocks: NotionBlock[] = [];
    let cursor: string | undefined;

    do {
      const params = new URLSearchParams();
      if (cursor) params.set('start_cursor', cursor);

      const response = await fetch(
        `https://api.notion.com/v1/blocks/${pageId}/children?${params}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Notion API error: ${response.statusText}`);
      }

      const data = await response.json();
      blocks.push(...data.results);
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor);

    return blocks;
  }

  /**
   * Query database
   */
  async queryDatabase(
    databaseId: string, 
    query?: Record<string, unknown>
  ): Promise<NotionPage[]> {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(query || {}),
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results;
  }

  private async createNotionPage(content: CMSContent): Promise<NotionPage> {
    const properties: Record<string, unknown> = {
      title: {
        title: [{ text: { content: content.title } }],
      },
    };

    if (content.excerpt) {
      properties['excerpt'] = {
        rich_text: [{ text: { content: content.excerpt } }],
      };
    }

    const parent = this.options.parentPageId 
      ? { page_id: this.options.parentPageId }
      : { database_id: this.options.parentDatabaseId };

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ parent, properties }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create Notion page: ${response.statusText}`);
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

  private pageToHtml(page: NotionPage): string {
    const title = this.getPageTitle(page);
    let html = `<h1>${title}</h1>\n`;

    // Add cover image if present
    if (page.cover) {
      const url = page.cover.external?.url || page.cover.file?.url;
      if (url) {
        html += `<img src="${url}" alt="Cover" />\n`;
      }
    }

    return html;
  }

  private getPageTitle(page: NotionPage): string {
    const props = page.properties;
    for (const key of Object.keys(props)) {
      const prop = props[key] as any;
      if (prop.type === 'title' && prop.title?.length > 0) {
        return prop.title[0].plain_text;
      }
    }
    return 'Untitled';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.options.apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    };
  }
}

export function createNotionAdapter(options: NotionOptions): CMSAdapter {
  return new NotionAdapter(options);
}
