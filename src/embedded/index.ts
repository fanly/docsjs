/**
 * Embedded Services Module
 * 
 * SDK for embedding DocsJS in 3rd party products, white-label packaging,
 * and OEM licensing.
 */

import type { SubscriptionPlan } from '../saas/organization';

// ============================================================================
// SDK Configuration
// ============================================================================

export interface EmbeddedSDKConfig {
  /** SDK version */
  version: string;
  /** API endpoint */
  apiUrl: string;
  /** API key */
  apiKey: string;
  /** Organization ID (for multi-tenant) */
  organizationId?: string;
  /** White-label settings */
  whiteLabel?: WhiteLabelConfig;
  /** Feature flags */
  features?: SDKFeatures;
}

export interface WhiteLabelConfig {
  /** Custom brand name */
  brandName: string;
  /** Logo URL */
  logoUrl?: string;
  /** Primary color */
  primaryColor?: string;
  /** Secondary color */
  secondaryColor?: string;
  /** Custom CSS */
  customCSS?: string;
  /** Custom domain */
  customDomain?: string;
  /** Remove DocsJS branding */
  removeBranding?: boolean;
  /** Custom support URL */
  supportUrl?: string;
}

export interface SDKFeatures {
  /** Enable editor */
  editor?: boolean;
  /** Enable conversion API */
  conversionApi?: boolean;
  /** Enable collaboration */
  collaboration?: boolean;
  /** Enable plugins */
  plugins?: boolean;
  /** Enable analytics */
  analytics?: boolean;
  /** Enable AI features */
  aiFeatures?: boolean;
  /** Max file size (MB) */
  maxFileSizeMB?: number;
}

// ============================================================================
// Embed Types
// ============================================================================

export type EmbedPosition = 'inline' | 'floating' | 'modal';
export type EmbedTheme = 'light' | 'dark' | 'auto' | 'custom';

export interface EmbedOptions {
  /** Container element ID */
  containerId: string;
  /** Embed position */
  position?: EmbedPosition;
  /** Theme */
  theme?: EmbedTheme;
  /** Height */
  height?: number | string;
  /** Width */
  width?: number | string;
  /** Start in editor mode */
  editorMode?: boolean;
  /** Read-only mode */
  readOnly?: boolean;
  /** File to load initially */
  initialFile?: string;
  /** Callback when ready */
  onReady?: () => void;
  /** Callback on change */
  onChange?: (content: string) => void;
  /** Callback on save */
  onSave?: (content: string) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

export interface EmbedInstance {
  /** Load document */
  loadDocument(content: string, format?: string): Promise<void>;
  /** Get document content */
  getContent(format?: string): Promise<string>;
  /** Save document */
  save(): Promise<void>;
  /** Destroy instance */
  destroy(): void;
  /** Set theme */
  setTheme(theme: EmbedTheme): void;
  /** Export to format */
  exportTo(format: 'html' | 'markdown' | 'json' | 'pdf'): Promise<Blob>;
}

// ============================================================================
// Widget Types
// ============================================================================

export interface WidgetConfig {
  /** Widget type */
  type: 'converter' | 'editor' | 'viewer' | 'comparison';
  /** Position */
  position?: 'left' | 'right' | 'bottom';
  /** Trigger text */
  triggerText?: string;
  /** Show on pages */
  showOnPages?: string[];
  /** Exclude from pages */
  excludeFromPages?: string[];
}

export interface WidgetInstance {
  /** Show widget */
  show(): void;
  /** Hide widget */
  hide(): void;
  /** Destroy widget */
  destroy(): void;
}

// ============================================================================
// API Client
// ============================================================================

export interface APIRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Embedded SDK Client
 */
export class DocsJSEmbeddedClient {
  private config: EmbeddedSDKConfig;
  private initialized = false;

  constructor(config: EmbeddedSDKConfig) {
    this.config = config;
  }

  /**
   * Initialize SDK
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Validate API key
    await this.validateApiKey();
    
    this.initialized = true;
  }

  /**
   * Create embed instance
   */
  createEmbed(options: EmbedOptions): EmbedInstance {
    return new EmbedInstanceImpl(this.config, options);
  }

  /**
   * Create widget
   */
  createWidget(config: WidgetConfig): WidgetInstance {
    return new WidgetInstanceImpl(this.config, config);
  }

  /**
   * Convert document
   */
  async convert(data: {
    content: string;
    inputFormat: string;
    outputFormat: string;
  }): Promise<{ output: string; metrics?: unknown }> {
    const response = await this.request<APIResponse<{ output: string }>>({
      method: 'POST',
      path: '/v1/convert',
      body: data,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Conversion failed');
    }

    return { output: response.data.output };
  }

  /**
   * Batch convert
   */
  async batchConvert(data: {
    files: Array<{ name: string; content: string }>;
    outputFormat: string;
  }): Promise<{ jobId: string }> {
    const response = await this.request<APIResponse<{ jobId: string }>>({
      method: 'POST',
      path: '/v1/convert/batch',
      body: data,
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Batch conversion failed');
    }

    return response.data;
  }

  /**
   * Get usage stats
   */
  async getUsage(): Promise<{
    apiCalls: { used: number; limit: number };
    storage: { used: number; limit: number };
    transformations: { used: number; limit: number };
  }> {
    const response = await this.request<APIResponse<any>>({
      method: 'GET',
      path: '/v1/usage',
    });

    return response.data || { apiCalls: { used: 0, limit: 0 }, storage: { used: 0, limit: 0 }, transformations: { used: 0, limit: 0 } };
  }

  /**
   * Get plan info
   */
  async getPlan(): Promise<{ plan: SubscriptionPlan; features: string[] }> {
    const response = await this.request<APIResponse<any>>({
      method: 'GET',
      path: '/v1/plan',
    });

    return response.data || { plan: 'free', features: [] };
  }

  private async validateApiKey(): Promise<void> {
    const response = await this.request<APIResponse<{ valid: boolean }>>({
      method: 'POST',
      path: '/v1/auth/validate',
    });

    if (!response.success || !response.data?.valid) {
      throw new Error('Invalid API key');
    }
  }

  private async request<T>(req: APIRequest): Promise<T> {
    const url = `${this.config.apiUrl}${req.path}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-SDK-Version': this.config.version,
      ...req.headers,
    };

    if (this.config.organizationId) {
      headers['X-Organization-Id'] = this.config.organizationId;
    }

    const response = await fetch(url, {
      method: req.method,
      headers,
      body: req.body ? JSON.stringify(req.body) : undefined,
    });

    return response.json();
  }
}

// ============================================================================
// Embed Implementation
// ============================================================================

class EmbedInstanceImpl implements EmbedInstance {
  private config: EmbeddedSDKConfig;
  private options: EmbedOptions;
  private container: HTMLElement | null = null;
  private initialized = false;

  constructor(config: EmbeddedSDKConfig, options: EmbedOptions) {
    this.config = config;
    this.options = options;
    this.init();
  }

  private async init(): Promise<void> {
    this.container = document.getElementById(this.options.containerId);
    if (!this.container) {
      throw new Error(`Container not found: ${this.options.containerId}`);
    }

    // Apply styles
    this.applyStyles();

    this.initialized = true;
    this.options.onReady?.();
  }

  private applyStyles(): void {
    if (!this.container) return;

    const theme = this.options.theme || 'light';
    const primaryColor = this.config.whiteLabel?.primaryColor || '#0066cc';

    this.container.style.setProperty('--docsjs-primary', primaryColor);
    this.container.classList.add(`docsjs-embed-${theme}`);

    if (this.config.whiteLabel?.customCSS) {
      const style = document.createElement('style');
      style.textContent = this.config.whiteLabel.customCSS;
      this.container.appendChild(style);
    }
  }

  async loadDocument(content: string, format?: string): Promise<void> {
    if (!this.initialized) throw new Error('Embed not initialized');
    // Load document logic
  }

  async getContent(format?: string): Promise<string> {
    if (!this.initialized) throw new Error('Embed not initialized');
    return '';
  }

  async save(): Promise<void> {
    if (!this.initialized) throw new Error('Embed not initialized');
    const content = await this.getContent();
    this.options.onSave?.(content);
  }

  destroy(): void {
    this.container = null;
    this.initialized = false;
  }

  setTheme(theme: EmbedTheme): void {
    this.options.theme = theme;
    this.applyStyles();
  }

  async exportTo(format: 'html' | 'markdown' | 'json' | 'pdf'): Promise<Blob> {
    const content = await this.getContent(format);
    return new Blob([content], { type: 'text/html' });
  }
}

// ============================================================================
// Widget Implementation
// ============================================================================

class WidgetInstanceImpl implements WidgetInstance {
  private config: EmbeddedSDKConfig;
  private widgetConfig: WidgetConfig;
  private element: HTMLElement | null = null;

  constructor(config: EmbeddedSDKConfig, widgetConfig: WidgetConfig) {
    this.config = config;
    this.widgetConfig = widgetConfig;
    this.init();
  }

  private init(): void {
    this.element = document.createElement('div');
    this.element.className = `docsjs-widget docsjs-widget-${this.widgetConfig.type}`;
    this.element.style.display = 'none';
    document.body.appendChild(this.element);
  }

  show(): void {
    this.element!.style.display = 'block';
  }

  hide(): void {
    this.element!.style.display = 'none';
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create embedded SDK client
 */
export function createEmbeddedClient(config: EmbeddedSDKConfig): DocsJSEmbeddedClient {
  return new DocsJSEmbeddedClient(config);
}

/**
 * Create embed with default config
 */
export function createEmbed(elementId: string, apiKey: string): EmbedInstance {
  return new DocsJSEmbeddedClient({
    version: '2.0.0',
    apiUrl: 'https://api.docsjs.com',
    apiKey,
  }).createEmbed({
    containerId: elementId,
  });
}

// ============================================================================
// OEM Licensing
// ============================================================================

export interface OEMLicense {
  id: string;
  licenseKey: string;
  organizationId: string;
  productName: string;
  allowedDomains: string[];
  allowedIPs?: string[];
  features: string[];
  expiresAt?: number;
  maxSeats: number;
  currentSeats: number;
}

export interface LicenseValidation {
  valid: boolean;
  license?: OEMLicense;
  error?: string;
}

export class OEMLicenseManager {
  private licenses: Map<string, OEMLicense> = new Map();

  /**
   * Validate license
   */
  validate(licenseKey: string, domain: string, ip?: string): LicenseValidation {
    const license = this.licenses.get(licenseKey);
    
    if (!license) {
      return { valid: false, error: 'License not found' };
    }

    if (license.expiresAt && license.expiresAt < Date.now()) {
      return { valid: false, error: 'License expired' };
    }

    if (!license.allowedDomains.includes(domain)) {
      return { valid: false, error: 'Domain not authorized' };
    }

    if (license.allowedIPs?.length && ip && !license.allowedIPs.includes(ip)) {
      return { valid: false, error: 'IP not authorized' };
    }

    if (license.currentSeats >= license.maxSeats) {
      return { valid: false, error: 'Seat limit exceeded' };
    }

    return { valid: true, license };
  }

  /**
   * Register license
   */
  register(license: OEMLicense): void {
    this.licenses.set(license.licenseKey, license);
  }

  /**
   * Use seat
   */
  useSeat(licenseKey: string): boolean {
    const license = this.licenses.get(licenseKey);
    if (!license) return false;
    
    if (license.currentSeats < license.maxSeats) {
      license.currentSeats++;
      return true;
    }
    return false;
  }

  /**
   * Release seat
   */
  releaseSeat(licenseKey: string): boolean {
    const license = this.licenses.get(licenseKey);
    if (!license) return false;
    
    if (license.currentSeats > 0) {
      license.currentSeats--;
      return true;
    }
    return false;
  }
}
