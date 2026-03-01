/**
 * Enterprise Integration Adapters
 * 
 * Integrations for enterprise document management:
 * - SharePoint (Microsoft)
 * - Box
 * - OneDrive
 * - Google Drive
 */

import type { CMSAdapter, CMSImportOptions, CMSContent } from './adapters';
import type { ConvertResultData } from '../server/types';

// ============================================================================
// SharePoint Adapter
// ============================================================================

export interface SharePointOptions extends CMSImportOptions {
  /** SharePoint base URL */
  baseUrl: string;
  /** Microsoft Graph API token */
  accessToken: string;
  /** Site ID */
  siteId?: string;
  /** Drive ID */
  driveId?: string;
  /** Item ID (for single file) */
  itemId?: string;
}

export interface SharePointSite {
  id: string;
  displayName: string;
  name: string;
  webUrl: string;
}

export interface SharePointDrive {
  id: string;
  name: string;
  driveType: string;
  webUrl: string;
}

export interface SharePointItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  content?: string;
}

export class SharePointAdapter implements CMSAdapter {
  name = 'sharepoint';
  version = '1.0.0';
  private options: SharePointOptions;

  constructor(options: SharePointOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const item = content as SharePointItem;
    return {
      output: item.content || '',
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    if (this.options.driveId) {
      await this.uploadToSharePoint(extracted);
    }
    return extracted;
  }

  /**
   * Get site info
   */
  async getSite(siteId: string): Promise<SharePointSite> {
    const response = await fetch(
      `${this.options.baseUrl}/v1.0/sites/${siteId}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`SharePoint API error: ${response.statusText}`);
    return response.json();
  }

  /**
   * Get drive contents
   */
  async getDriveContents(driveId: string, folderId?: string): Promise<SharePointItem[]> {
    const path = folderId 
      ? `/drives/${driveId}/items/${folderId}/children`
      : `/drives/${driveId}/root/children`;
    
    const response = await fetch(
      `${this.options.baseUrl}/v1.0${path}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`SharePoint API error: ${response.statusText}`);
    const data = await response.json();
    return data.value || [];
  }

  /**
   * Download file content
   */
  async downloadFile(driveId: string, itemId: string): Promise<string> {
    const response = await fetch(
      `${this.options.baseUrl}/v1.0/drives/${driveId}/items/${itemId}/content`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`SharePoint API error: ${response.statusText}`);
    return response.text();
  }

  /**
   * Upload file
   */
  async uploadToSharePoint(content: CMSContent): Promise<SharePointItem> {
    const response = await fetch(
      `${this.options.baseUrl}/v1.0/drives/${this.options.driveId}/root:/${encodeURIComponent(content.title)}.html:/content`,
      {
        method: 'PUT',
        headers: this.getHeaders(),
        body: content.body,
      }
    );
    if (!response.ok) throw new Error(`SharePoint upload error: ${response.statusText}`);
    return response.json();
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled',
      body: html,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.options.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}

export function createSharePointAdapter(options: SharePointOptions): CMSAdapter {
  return new SharePointAdapter(options);
}

// ============================================================================
// Box Adapter
// ============================================================================

export interface BoxOptions extends CMSImportOptions {
  /** Box API base URL */
  baseUrl: string;
  /** Box Developer Token or OAuth access token */
  accessToken: string;
  /** Folder ID */
  folderId?: string;
}

export interface BoxItem {
  id: string;
  type: 'file' | 'folder';
  name: string;
  size?: number;
  created_at: string;
  modified_at: string;
  shared_link?: { url: string };
}

export interface BoxFile extends BoxItem {
  type: 'file';
  file_version?: { id: string };
  contents?: string;
}

export class BoxAdapter implements CMSAdapter {
  name = 'box';
  version = '1.0.0';
  private options: BoxOptions;

  constructor(options: BoxOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const file = content as BoxFile;
    return {
      output: file.contents || '',
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    if (this.options.folderId) {
      await this.uploadToBox(extracted);
    }
    return extracted;
  }

  /**
   * Get folder contents
   */
  async getFolderContents(folderId: string = '0'): Promise<BoxItem[]> {
    const response = await fetch(
      `${this.options.baseUrl}/2.0/folders/${folderId}/items`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`Box API error: ${response.statusText}`);
    const data = await response.json();
    return data.entries || [];
  }

  /**
   * Download file
   */
  async downloadFile(fileId: string): Promise<string> {
    const response = await fetch(
      `${this.options.baseUrl}/2.0/files/${fileId}/content`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`Box API error: ${response.statusText}`);
    return response.text();
  }

  /**
   * Upload file
   */
  async uploadToBox(content: CMSContent): Promise<BoxFile> {
    const formData = new FormData();
    formData.append('attributes', JSON.stringify({
      name: `${content.title}.html`,
      parent: { id: this.options.folderId },
    }));
    formData.append('file', new Blob([content.body], { type: 'text/html' }));

    const response = await fetch(
      `${this.options.baseUrl}/2.0/files/content`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.options.accessToken}` },
        body: formData,
      }
    );
    if (!response.ok) throw new Error(`Box upload error: ${response.statusText}`);
    return (await response.json()).entries[0];
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled',
      body: html,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.options.accessToken}`,
    };
  }
}

export function createBoxAdapter(options: BoxOptions): CMSAdapter {
  return new BoxAdapter(options);
}

// ============================================================================
// OneDrive Adapter
// ============================================================================

export interface OneDriveOptions extends CMSImportOptions {
  /** Microsoft Graph API base URL */
  baseUrl: string;
  /** Microsoft Graph access token */
  accessToken: string;
  /** Drive ID (defaults to me/drive) */
  driveId?: string;
  /** Item ID */
  itemId?: string;
}

export interface OneDriveItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  folder?: { childCount: number };
  file?: { mimeType: string };
  content?: string;
}

export class OneDriveAdapter implements CMSAdapter {
  name = 'onedrive';
  version = '1.0.0';
  private options: OneDriveOptions;

  constructor(options: OneDriveOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const item = content as OneDriveItem;
    return {
      output: item.content || '',
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    if (this.options.driveId) {
      await this.uploadToOneDrive(extracted);
    }
    return extracted;
  }

  /**
   * Get drive info
   */
  async getDrive(driveId?: string): Promise<unknown> {
    const path = driveId ? `/drives/${driveId}` : '/me/drive';
    const response = await fetch(
      `${this.options.baseUrl}/v1.0${path}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`OneDrive API error: ${response.statusText}`);
    return response.json();
  }

  /**
   * Get item contents
   */
  async getItemContents(itemId: string): Promise<string> {
    const response = await fetch(
      `${this.options.baseUrl}/v1.0/me/drive/items/${itemId}/content`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`OneDrive API error: ${response.statusText}`);
    return response.text();
  }

  /**
   * Upload file
   */
  async uploadToOneDrive(content: CMSContent): Promise<OneDriveItem> {
    const response = await fetch(
      `${this.options.baseUrl}/v1.0/me/drive/root:/${encodeURIComponent(content.title)}.html:/content`,
      {
        method: 'PUT',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'text/html',
        },
        body: content.body,
      }
    );
    if (!response.ok) throw new Error(`OneDrive upload error: ${response.statusText}`);
    return response.json();
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled',
      body: html,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.options.accessToken}`,
    };
  }
}

export function createOneDriveAdapter(options: OneDriveOptions): CMSAdapter {
  return new OneDriveAdapter(options);
}

// ============================================================================
// Google Drive Adapter
// ============================================================================

export interface GoogleDriveOptions extends CMSImportOptions {
  /** Google Drive API base URL */
  baseUrl: string;
  /** Google OAuth2 access token */
  accessToken: string;
  /** Folder ID */
  folderId?: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  createdTime: string;
  modifiedTime: string;
  webViewLink?: string;
  content?: string;
}

export class GoogleDriveAdapter implements CMSAdapter {
  name = 'google-drive';
  version = '1.0.0';
  private options: GoogleDriveOptions;

  constructor(options: GoogleDriveOptions) {
    this.options = options;
  }

  async convert(content: unknown): Promise<ConvertResultData> {
    const file = content as GoogleDriveFile;
    return {
      output: file.content || '',
      outputFormat: 'html',
      profile: 'default',
      status: 'completed',
    };
  }

  async import(content: string, options?: CMSImportOptions): Promise<CMSContent> {
    const extracted = this.extractContent(content);
    if (this.options.folderId) {
      await this.uploadToGoogleDrive(extracted);
    }
    return extracted;
  }

  /**
   * List files in folder
   */
  async listFiles(folderId?: string): Promise<GoogleDriveFile[]> {
    let query = "mimeType='text/html' or mimeType='application/vnd.google-apps.document'";
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await fetch(
      `${this.options.baseUrl}/drive/v3/files?q=${encodeURIComponent(query)}`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`Google Drive API error: ${response.statusText}`);
    const data = await response.json();
    return data.files || [];
  }

  /**
   * Get file content
   */
  async getFileContent(fileId: string): Promise<string> {
    const response = await fetch(
      `${this.options.baseUrl}/drive/v3/files/${fileId}?alt=media`,
      { headers: this.getHeaders() }
    );
    if (!response.ok) throw new Error(`Google Drive API error: ${response.statusText}`);
    return response.text();
  }

  /**
   * Upload file
   */
  async uploadToGoogleDrive(content: CMSContent): Promise<GoogleDriveFile> {
    const metadata = {
      name: `${content.title}.html`,
      mimeType: 'text/html',
      parents: [this.options.folderId],
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', new Blob([content.body], { type: 'text/html' }));

    const response = await fetch(
      `${this.options.baseUrl}/upload/drive/v3/files?uploadType=multipart`,
      {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.options.accessToken}` },
        body: formData,
      }
    );
    if (!response.ok) throw new Error(`Google Drive upload error: ${response.statusText}`);
    return response.json();
  }

  private extractContent(html: string): CMSContent {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return {
      title: titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : 'Untitled',
      body: html,
    };
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.options.accessToken}`,
    };
  }
}

export function createGoogleDriveAdapter(options: GoogleDriveOptions): CMSAdapter {
  return new GoogleDriveAdapter(options);
}
