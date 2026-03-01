/**
 * Educational Platform Adapters
 * 
 * Integrations for Learning Management Systems (LMS):
 * - Blackboard
 * - Moodle
 */

import type { CMSAdapter, CMSImportOptions, CMSContent } from './adapters';
import type { ConvertResultData } from '../server/types';

// ============================================================================
// Blackboard Adapter
// ============================================================================

export interface BlackboardOptions extends CMSImportOptions {
  /** Blackboard base URL */
  baseUrl: string;
  /** Blackboard REST API key */
  apiKey: string;
  /** Course ID */
  courseId?: string;
  /** Content handler */
  contentHandler?: 'resource' | 'lesson' | 'assignment' | 'assessment';
}

export interface BlackboardCourse {
  id: string;
  courseId: string;
  name: string;
  description?: string;
  created?: string;
  modified?: string;
}

export interface BlackboardContent {
  id: string;
  title: string;
  body?: string;
  contentHandler: string;
  parentId?: string;
  children?: BlackboardContent[];
  attachments?: BlackboardAttachment[];
}

export interface BlackboardAttachment {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  url: string;
}

export class BlackboardAdapter implements CMSAdapter {
  name = 'blackboard';
  version = '1.0.0';
  private options: BlackboardOptions;

  constructor(options: BlackboardOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const bbContent = content as BlackboardContent;
    return {
      output: this.contentToHtml(bbContent),
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    if (this.options.courseId) {
      await this.createBlackboardContent(extracted);
    }
    return extracted;
  }

  /**
   * Get course info
   */
  async getCourse(courseId: string): Promise<BlackboardCourse> {
    const response = await fetch(
      `${this.options.baseUrl}/learn/api/public/v1/courses/${courseId}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`Blackboard API error: ${response.statusText}`);
    return response.json();
  }

  /**
   * Get course contents
   */
  async getContents(courseId: string): Promise<BlackboardContent[]> {
    const response = await fetch(
      `${this.options.baseUrl}/learn/api/public/v1/courses/${courseId}/contents`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`Blackboard API error: ${response.statusText}`);
    const data = await response.json();
    return data.results || [];
  }

  /**
   * Get content by ID
   */
  async getContent(courseId: string, contentId: string): Promise<BlackboardContent> {
    const response = await fetch(
      `${this.options.baseUrl}/learn/api/public/v1/courses/${courseId}/contents/${contentId}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`Blackboard API error: ${response.statusText}`);
    return response.json();
  }

  private async createBlackboardContent(content: CMSContent): Promise<BlackboardContent> {
    const body = {
      title: content.title,
      body: content.body,
      contentHandler: this.options.contentHandler || 'resource',
    };

    const response = await fetch(
      `${this.options.baseUrl}/learn/api/public/v1/courses/${this.options.courseId}/contents`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Blackboard content: ${response.statusText}`);
    }
    return response.json();
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled',
      body: html,
    };
  }

  private contentToHtml(content: BlackboardContent): string {
    return `<h1>${content.title}</h1>\n${content.body || ''}`;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.options.apiKey}`,
      'Content-Type': 'application/json',
    };
  }
}

export function createBlackboardAdapter(options: BlackboardOptions): CMSAdapter {
  return new BlackboardAdapter(options);
}

// ============================================================================
// Moodle Adapter
// ============================================================================

export interface MoodleOptions extends CMSImportOptions {
  /** Moodle base URL */
  baseUrl: string;
  /** Moodle Web Service Token */
  apiToken: string;
  /** Course ID */
  courseId?: number;
  /** Section number */
  sectionNum?: number;
}

export interface MoodleCourse {
  id: number;
  shortname: string;
  fullname: string;
  summary?: string;
  summaryformat?: number;
}

export interface MoodleSection {
  id: number;
  name: string;
  summary?: string;
  summaryformat?: number;
  modules?: MoodleModule[];
}

export interface MoodleModule {
  id: number;
  name: string;
  modname: string;
  description?: string;
  contents?: MoodleFile[];
}

export interface MoodleFile {
  type: string;
  filename: string;
  fileurl: string;
  filesize: number;
  timemodified: number;
}

export class MoodleAdapter implements CMSAdapter {
  name = 'moodle';
  version = '1.0.0';
  private options: MoodleOptions;

  constructor(options: MoodleOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const module = content as MoodleModule;
    return {
      output: this.moduleToHtml(module),
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    if (this.options.courseId) {
      await this.createMoodleContent(extracted);
    }
    return extracted;
  }

  /**
   * Get course info
   */
  async getCourse(courseId: number): Promise<MoodleCourse> {
    const response = await this.callMoodle('core_course_get_contents', {
      courseid: courseId,
    });
    return response;
  }

  /**
   * Get course sections
   */
  async getSections(courseId: number): Promise<MoodleSection[]> {
    const response = await this.callMoodle('core_course_get_contents', {
      courseid: courseId,
    });
    return response;
  }

  /**
   * Get module
   */
  async getModule(moduleId: number): Promise<MoodleModule> {
    const response = await this.callMoodle('core_course_get_course_module', {
      cmid: moduleId,
    });
    return response;
  }

  /**
   * Add resource to course
   */
  async addResource(
    type: 'resource' | 'page' | 'book' | 'folder',
    data: Record<string, unknown>
  ): Promise<{ cmid: number }> {
    const functionName = `mod_${type}_add_instance`;
    const response = await this.callMoodle(functionName, {
      course: this.options.courseId,
      ...data,
    });
    return { cmid: response.id };
  }

  private async createMoodleContent(content: CMSContent): Promise<{ cmid: number }> {
    return this.addResource('page', {
      name: content.title,
      content: content.body,
      intro: content.excerpt || '',
    });
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled',
      body: html,
    };
  }

  private moduleToHtml(module: MoodleModule): string {
    return `<h1>${module.name}</h1>\n${module.description || ''}`;
  }

  private async callMoodle(
    wsfunction: string,
    params: Record<string, unknown>
  ): Promise<unknown> {
    const urlParams = new URLSearchParams({
      wstoken: this.options.apiToken,
      wsfunction,
      moodlewsrestformat: 'json',
      ...Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      ),
    });

    const response = await fetch(
      `${this.options.baseUrl}/webservice/rest/server.php?${urlParams}`
    );

    if (!response.ok) {
      throw new Error(`Moodle API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.exception) {
      throw new Error(`Moodle error: ${data.message}`);
    }
    return data;
  }
}

export function createMoodleAdapter(options: MoodleOptions): CMSAdapter {
  return new MoodleAdapter(options);
}
