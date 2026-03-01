import type { ConvertResultData } from '../server/types';

export interface CMSAdapter {
  name: string;
  version: string;
  convert(content: unknown): Promise<ConvertResultData>;
  import(content: string, options?: CMSImportOptions): Promise<CMSContent>;
}

export interface CMSImportOptions {
  preserveFormatting?: boolean;
  extractMetadata?: boolean;
  imagesHandling?: 'embed' | 'link' | 'download';
}

export interface CMSContent {
  title: string;
  body: string;
  excerpt?: string;
  featuredImage?: string;
  categories?: string[];
  tags?: string[];
  author?: string;
  publishedAt?: string;
  customFields?: Record<string, unknown>;
}

export interface WordPressOptions extends CMSImportOptions {
  apiUrl: string;
  username?: string;
  applicationPassword?: string;
  defaultStatus?: 'draft' | 'publish' | 'private';
}

export interface ContentfulOptions extends CMSImportOptions {
  spaceId: string;
  accessToken: string;
  environment?: string;
  contentTypeId?: string;
}

export interface StrapiOptions extends CMSImportOptions {
  apiUrl: string;
  apiToken?: string;
  collection?: string;
}

class WordPressAdapter implements CMSAdapter {
  name = 'wordpress';
  version = '1.0.0';
  private options: WordPressOptions;

  constructor(options: WordPressOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    return content as ConvertResultData;
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const mergedOptions = { ...this.options, ...options };
    
    const extracted = this.extractContent(content);
    
    if (mergedOptions.apiUrl && this.options.applicationPassword) {
      await this.postToWordPress(extracted);
    }

    return extracted;
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled';

    let body = html;
    if (titleMatch) {
      body = body.replace(titleMatch[0], '');
    }

    const excerptMatch = body.match(/<p[^>]*class="[^"]*excerpt[^"]*"[^>]*>(.*?)<\/p>/i);
    const excerpt = excerptMatch ? excerptMatch[1].replace(/<[^>]+>/g, '').substring(0, 200) : undefined;

    const imgMatch = body.match(/<img[^>]+src="([^"]+)"/i);
    const featuredImage = imgMatch ? imgMatch[1] : undefined;

    return {
      title,
      body: body.trim(),
      excerpt,
      featuredImage,
    };
  }

  private async postToWordPress(content: CMSContent): Promise<void> {
    const credentials = Buffer.from(`${this.options.username}:${this.options.applicationPassword}`).toString('base64');
    
    await fetch(`${this.options.apiUrl}/wp-json/wp/v2/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: content.title,
        content: content.body,
        excerpt: content.excerpt,
        status: this.options.defaultStatus || 'draft',
      }),
    });
  }
}

class ContentfulAdapter implements CMSAdapter {
  name = 'contentful';
  version = '1.0.0';
  private options: ContentfulOptions;

  constructor(options: ContentfulOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    return content as ConvertResultData;
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    
    if (this.options.accessToken) {
      await this.postToContentful(extracted);
    }

    return extracted;
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled';

    let body = html;
    if (titleMatch) {
      body = body.replace(titleMatch[0], '');
    }

    return {
      title,
      body: body.trim(),
    };
  }

  private async postToContentful(content: CMSContent): Promise<void> {
    const url = `https://api.contentful.com/spaces/${this.options.spaceId}/environments/${this.options.environment || 'master'}/entries`;
    
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.options.accessToken}`,
        'Content-Type': 'application/vnd.contentful.management.v1+json',
        'X-Contentful-Content-Type': this.options.contentTypeId || 'article',
      },
      body: JSON.stringify({
        fields: {
          title: { 'en-US': content.title },
          body: { 'en-US': content.body },
        },
      }),
    });
  }
}

class StrapiAdapter implements CMSAdapter {
  name = 'strapi';
  version = '1.0.0';
  private options: StrapiOptions;

  constructor(options: StrapiOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    return content as ConvertResultData;
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    
    if (this.options.apiUrl && this.options.apiToken) {
      await this.postToStrapi(extracted);
    }

    return extracted;
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled';

    let body = html;
    if (titleMatch) {
      body = body.replace(titleMatch[0], '');
    }

    return {
      title,
      body: body.trim(),
    };
  }

  private async postToStrapi(content: CMSContent): Promise<void> {
    const collection = this.options.collection || 'articles';
    
    await fetch(`${this.options.apiUrl}/api/${collection}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.options.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          title: content.title,
          content: content.body,
        },
      }),
    });
  }
}

class GenericAdapter implements CMSAdapter {
  name = 'generic';
  version = '1.0.0';

  async convert(content: unknown): Promise<ConvertResultData> {
    return content as ConvertResultData;
  }

  async import(content: string, _options?: CMSImportOptions): Promise<CMSContent> {
    return this.extractContent(content);
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled';

    let body = html;
    if (titleMatch) {
      body = body.replace(titleMatch[0], '');
    }

    return {
      title,
      body: body.trim(),
    };
  }
}

export function createWordPressAdapter(options: WordPressOptions): WordPressAdapter {
  return new WordPressAdapter(options);
}

export function createContentfulAdapter(options: ContentfulOptions): ContentfulAdapter {
  return new ContentfulAdapter(options);
}

export function createStrapiAdapter(options: StrapiOptions): StrapiAdapter {
  return new StrapiAdapter(options);
}

export function createCMSAdapter(

export function createCMSAdapter(
  type: 'wordpress' | 'contentful' | 'strapi' | 'ghost' | 'notion' | 'confluence' | 'gitbook' | 'generic', 
  options: unknown
): CMSAdapter {
  switch (type) {
    case 'wordpress':
      return new WordPressAdapter(options as WordPressOptions);
    case 'contentful':
      return new ContentfulAdapter(options as ContentfulOptions);
    case 'strapi':
      return new StrapiAdapter(options as StrapiOptions);
    case 'ghost':
      return new GhostAdapter(options as GhostOptions);
    case 'notion':
      return new NotionAdapter(options as NotionOptions);
    case 'confluence':
      return new ConfluenceAdapter(options as ConfluenceOptions);
    case 'gitbook':
      return new GitBookAdapter(options as GitBookOptions);
    default:
      return new GenericAdapter();
  }
}
