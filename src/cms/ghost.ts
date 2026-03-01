/**
 * Ghost CMS Adapter
 * 
 * Integration with Ghost CMS for blog posts and newsletters.
 */

import type { CMSAdapter, CMSImportOptions, CMSContent } from './adapters';
import type { ConvertResultData } from '../server/types';

export interface GhostOptions extends CMSImportOptions {
  /** Ghost API URL */
  apiUrl: string;
  /** Admin API key */
  adminApiKey?: string;
  /** Content API key (for reading) */
  contentApiKey?: string;
  /** Default post status */
  defaultStatus?: 'draft' | 'published' | 'scheduled';
  /** Newsletter to publish to */
  newsletter?: string;
}

export interface GhostPost {
  id: string;
  title: string;
  slug: string;
  html: string;
  plaintext?: string;
  feature_image?: string;
  featured?: boolean;
  status: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  tags: Array<{ name: string; slug: string }>;
  authors: Array<{ name: string; email: string }>;
  excerpt?: string;
  custom_excerpt?: string;
  meta_title?: string;
  meta_description?: string;
}

export class GhostAdapter implements CMSAdapter {
  name = 'ghost';
  version = '1.0.0';
  private options: GhostOptions;

  constructor(options: GhostOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const post = content as GhostPost;
    
    return {
      output: this.htmlToDocsJS(post.html || ''),
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const mergedOptions = { ...this.options, ...options };
    const extracted = this.extractContent(content);
    
    // Post to Ghost if API keys provided
    if (mergedOptions.apiUrl && mergedOptions.adminApiKey) {
      await this.postToGhost(extracted, mergedOptions);
    }
    
    return extracted;
  }

  /**
   * Fetch posts from Ghost
   */
  async fetchPosts(options?: { limit?: number; page?: number; status?: string }): Promise<GhostPost[]> {
    if (!this.options.contentApiKey) {
      throw new Error('Content API key required');
    }

    const params = new URLSearchParams({
      limit: String(options?.limit || 10),
      page: String(options?.page || 1),
      include: 'tags,authors',
    });

    if (options?.status) {
      params.set('filter', `status:${options.status}`);
    }

    const response = await fetch(
      `${this.options.apiUrl}/ghost/api/content/posts/?${params}`,
      {
        headers: {
          'Authorization': `Ghost ${this.options.contentApiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Ghost API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.posts;
  }

  /**
   * Get single post
   */
  async getPost(slug: string): Promise<GhostPost | null> {
    const posts = await this.fetchPosts({ limit: 1 });
    return posts.find(p => p.slug === slug) || null;
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

    const excerptMatch = body.match(/<p[^>]*>([^<]{50,200})<\/p>/i);
    const excerpt = excerptMatch ? excerptMatch[1] : undefined;

    return {
      title,
      body: body.trim(),
      excerpt,
      featuredImage,
    };
  }

  private async postToGhost(content: CMSContent, options: GhostOptions): Promise<GhostPost> {
    const posts = [
      {
        posts: [{
          title: content.title,
          html: content.body,
          status: options.defaultStatus || 'draft',
          feature_image: content.featuredImage,
          excerpt: content.excerpt,
          tags: content.tags?.map(t => ({ name: t })),
          authors: content.author ? [{ name: content.author }] : undefined,
        }],
      },
    ];

    const response = await fetch(
      `${options.apiUrl}/ghost/api/admin/posts/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Ghost ${options.adminApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(posts),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to post to Ghost: ${response.statusText}`);
    }

    const data = await response.json();
    return data.posts[0];
  }

  private htmlToDocsJS(html: string): string {
    // Transform Ghost HTML to DocsJS format
    return html;
  }
}

export function createGhostAdapter(options: GhostOptions): CMSAdapter {
  return new GhostAdapter(options);
}
