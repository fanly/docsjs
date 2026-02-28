/**
 * Plugin Marketplace Infrastructure
 * 
 * Core systems for managing community and commercial plugins.
 */

import type { EnginePlugin, PluginPermissions, PluginMetadata, PluginManifest } from '../types/plugins';

export interface PluginRegistryConfig {
  /** Enable plugin installation/removal */
  allowInstall: boolean;
  
  /** Security policy for unsigned plugins */
  allowUnsigned: boolean;
  
  /** Auto-update policy */
  autoUpdate: boolean;
  
  /** Trusted publisher verification */
  trustedPublishers: string[];
  
  /** Plugin performance limits */
  performanceLimits: {
    maxInstallationSizeMB: number;
    maxMemoryPerPluginMB: number;
    maxCpuTimePerPluginSec: number;
  };
}

export interface PluginInstallResult {
  success: boolean;
  error?: string;
  plugin: EnginePlugin;
  verification: {
    signatureValid: boolean;
    publisherTrusted: boolean;
    securityScanPassed: boolean;
    performanceCompliant: boolean;
  };
}

export interface MarketplaceEntry {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  publisher: string;
  tags: string[];
  rating: number;
  downloads: number;
  lastUpdated: string;
  manifest: PluginManifest;
  compatibility: {
    minEngineVersion: string;
    maxEngineVersion: string;
  };
  pricing?: {
    type: 'free' | 'freemium' | 'commercial' | 'open-core';
    priceUSD?: number;
  };
}

/**
 * Secure Plugin Registry
 * 
 * Handles download, verification, and management of plugins from marketplace.
 */
export class SecurePluginRegistry {
  private plugins: Map<string, InstalledPlugin> = new Map();
  private config: PluginRegistryConfig;
  private trustStore: Map<string, string> = new Map(); // publisher -> signingPubKey

  constructor(config?: Partial<PluginRegistryConfig>) {
    this.config = {
      allowInstall: true,
      allowUnsigned: false,
      autoUpdate: true,
      trustedPublishers: ['@coding01', '@docsjs-org', '@community'],
      performanceLimits: {
        maxInstallationSizeMB: 10,
        maxMemoryPerPluginMB: 20,
        maxCpuTimePerPluginSec: 10
      },
      ...config
    };

    // Pre-populate with known publisher keys in production
  }

  /**
   * Install a plugin from marketplace identifier
   */
  async install(pluginId: string, version?: string): Promise<PluginInstallResult> {
    try {
      // 1. Locate plugin in marketplace
      const entry = await this.fetchPluginEntry(pluginId, version);
      
      // 2. Verify plugin authenticity and security
      const verification = await this.verifyPlugin(entry);
      if (!verification.signatureValid || !verification.securityScanPassed) {
        return {
          success: false,
          error: `Plugin verification failed: ${verification.securityScanPassed ? 'signature issue' : 'security scan failed'}`,
          plugin: null!,
          verification
        };
      }
      
      // 3. Download and unpack plugin
      const pluginArchive = await this.downloadPlugin(entry);
      
      // 4. Validate against performance and security limits
      if (!this.validatePluginArchive(pluginArchive)) {
        return {
          success: false,
          error: 'Plugin violates performance or security constraints',
          plugin: null!,
          verification
        };
      }
      
      // 5. Install to secure location
      const installPath = await this.installToSecureLocation(pluginArchive, entry);
      
      // 6. Load and register plugin
      const plugin = await this.loadPluginFromDisk(installPath);
      this.plugins.set(pluginId, plugin);
      
      return {
        success: true,
        plugin,
        verification
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        plugin: null!,
        verification: {
          signatureValid: false,
          publisherTrusted: false,
          securityScanPassed: false,
          performanceCompliant: false
        }
      };
    }
  }

  async uninstall(pluginId: string): Promise<boolean> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    
    try {
      // Notify plugin to cleanup resources
      if (plugin.cleanup) {
        await plugin.cleanup();
      }
      
      // Remove from registry
      this.plugins.delete(pluginId);
      
      // Delete from file system (security)
      await this.deletePluginFiles(plugin);
      
      return true;
    } catch (error) {
      console.error(`Failed to uninstall plugin ${pluginId}:`, error);
      return false;
    }
  }

  listInstalled(): string[] {
    return Array.from(this.plugins.keys())
      .filter(id => this.plugins.get(id)?.installed);
  }

  getPluginMetadata(pluginId: string): PluginMetadata | undefined {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return undefined;
    
    return {
      id: pluginId,
      name: plugin.name,
      version: plugin.version,
      author: plugin.author,
      description: plugin.description,
      installed: plugin.installed,
      enabled: plugin.enabled,
      permissions: plugin.permissions,
      compatibility: plugin.manifest?.compatibility,
      metrics: plugin.metrics
    };
  }

  /**
   * Get trusted plugins for specific security level
   */
  getTrustedPlugins(minTrustLevel: 'unsigned' | 'signed' | 'verified' | 'enterprise'): EnginePlugin[] {
    const levelThreshold = this.trustLevelToScore(minTrustLevel);
    
    return Array.from(this.plugins.values())
      .filter(plugin => this.calculateTrustScore(plugin) >= levelThreshold)
      .map(p => p.plugin);
  }

  private trustLevelToScore(level: string): number {
    return level === 'enterprise' ? 400 :
           level === 'verified' ? 300 : 
           level === 'signed' ? 200 : 100;
  }

  private calculateTrustScore(plugin: InstalledPlugin): number {
    let score = 0;
    
    if (plugin.verified) score += 200;
    if (plugin.signatureValid) score += 100;
    if (this.config.trustedPublishers.includes(plugin.publisher)) score += 150;
    if (plugin.rating > 4.0) score += 50;
    
    return score;
  }

  private async fetchPluginEntry(pluginId: string, version?: string): Promise<MarketplaceEntry> {
    // This would fetch from marketplace API
    const url = version 
      ? `https://marketplace.docsjs.org/api/plugins/${pluginId}/${version}`  
      : `https://marketplace.docsjs.org/api/plugins/${pluginId}/latest`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Plugin not found: ${pluginId}@${version || 'latest'}`);
    }
    
    return response.json();
  }

  private async verifyPlugin(entry: MarketplaceEntry): Promise<PluginVerification> {
    // Check signature validity
    const signatureValid = await this.verifySignature(entry);
    
    // Check publisher is trusted  
    const publisherTrusted = this.config.trustedPublishers.includes(entry.publisher);
    
    // Check security scan (simplified) 
    const securityScanPassed = await this.performSecurityScan(entry);
    
    // Check performance compliance
    const performanceCompliant = this.validatePerformanceCharacteristics(entry);
    
    return {
      signatureValid,
      publisherTrusted,
      securityScanPassed,
      performanceCompliant
    };
  }

  private async verifySignature(entry: MarketplaceEntry): Promise<boolean> {
    if (!entry.manifest.signature) {
      return !this.config.allowUnsigned;
    }
    
    // Real implementation would verify cryptographic signature
    // This is simplified for now
    return true;
  }

  private async performSecurityScan(entry: MarketplaceEntry): Promise<boolean> {
    // Check the plugin manifest for potentially dangerous capabilities
    const manifest = entry.manifest;
    
    // Verify permissions are reasonable
    if (manifest.permissions?.network && 
        !entry.publishers.includes('@official') && 
        !this.config.trustedPublishers.includes(entry.publisher)) {
      return false; // Untrusted publishers shouldn't access network by default
    }
    
    // Check no dangerous file access patterns
    if (manifest.permissions?.read?.includes('/') || 
        manifest.permissions?.read?.includes('..')) {
      return false; // Dangerous path access
    }
    
    if (manifest.permissions?.compute?.maxMemoryMB > 100) {
      return false; // Excessive memory request
    }
    
    return true;
  }

  private validatePerformanceCharacteristics(entry: MarketplaceEntry): boolean {
    // Check if plugin meets performance criteria
    return (
      (entry.manifest.sizeMB ?? 0) <= this.config.performanceLimits.maxInstallationSizeMB &&
      (entry.manifest.permissions?.compute?.maxMemoryMB ?? 0) <= this.config.performanceLimits.maxMemoryMBPerPlugin &&
      (entry.manifest.permissions?.compute?.maxCpuSecs ?? 0) <= this.config.performanceLimits.maxCpuTimePerPluginSec
    );
  }

  private async downloadPlugin(entry: MarketplaceEntry): Promise<Uint8Array> {
    // Download plugin package from marketplace
    const response = await fetch(entry.manifest.downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to download plugin ${entry.id}`);
    }
    
    return new Uint8Array(await response.arrayBuffer());
  }

  private validatePluginArchive(archive: Uint8Array): boolean {
    // Validate archive format and size before installation
    return archive.length > 0 && archive.length < (this.config.performanceLimits.maxInstallationSizeMB * 1024 * 1024);
  }

  private async installToSecureLocation(archive: Uint8Array, entry: MarketplaceEntry): Promise<string> {
    // Install to application's protected plugin directory
    const installPath = this.getSecurePluginPath(entry.id, entry.version);
    
    // In real implementation, would securely extract and install package
    // For now returning the mock path
    return installPath;
  }

  private getSecurePluginPath(pluginId: string, version: string): string {
    // Return secure installation path for plugin
    // This would be in a protected application directory
    return `/private_secure/plugins/${pluginId}/${version}`;
  }

  private async loadPluginFromDisk(path: string): Promise<InstalledPlugin> {
    // Actually load and initialize the plugin (mock for now)
    // Implementation would vary whether we're in browser vs Node
    return {
      id: path.split('/')[3], // Extract from path
      plugin: {} as EnginePlugin,
      installed: true,
      enabled: true,
      verified: false,
      signatureValid: false,
      publisher: 'unknown',
      rating: 0,
      metrics: { installs: 0, errors: 0 },
      manifest: {} as PluginManifest
    };
  }

  private async deletePluginFiles(plugin: InstalledPlugin): Promise<void> {
    // Securely delete plugin files from disk
    // Implementation varies by environment
    console.log(`Deleting plugin files for ${plugin.id}`);
  }
}

/**
 * Mock marketplace API simulator
 * 
 * In real implementation, this would connect to actual backend
 */
export class MarketplaceAPISimulator {
  private listings: Map<string, MarketplaceEntry> = new Map();

  constructor() {
    // Initialize with example community plugins
    this.initializeExamplePlugins();
  }

  private initializeExamplePlugins(): void {
    // MathML enhanced processing plugin
    this.listings.set('math-enhancer', {
      id: 'math-enhancer',
      version: '1.2.0',
      name: 'MathML Enhancer',
      description: 'Advanced MathML layout preservation',
      author: 'MathML Consortium',
      publisher: '@community',
      tags: ['math', 'fidelity', 'formatting'],
      rating: 4.8,
      downloads: 12500,
      lastUpdated: '2024-02-25',
      manifest: {
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 15, maxCpuSecs: 5 },
          ast: { 
            canModifySemantics: false, 
            canAccessOriginal: true, 
            canExportRawAst: false
          },
          export: { canGenerateFiles: true, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        supportedHooks: ['afterParse', 'beforeRender'] as const,
        sizeMB: 2.3,
        signature: 'mock-signature-here'
      },
      compatibility: {
        minEngineVersion: '2.0.0',
        maxEngineVersion: '3.0.0'
      },
      pricing: { type: 'free' }
    });

    // Table layout optimization plugin
    this.listings.set('table-optimizer', {
      id: 'table-optimizer',
      version: '2.1.0',
      name: 'Table Layout Optimizer',
      description: 'Preserves table structure, formatting, and layout',
      author: 'Format Optimization Group',
      publisher: '@community',
      tags: ['tables', 'layout', 'formatting'],
      rating: 4.6,
      downloads: 8500,
      lastUpdated: '2024-02-20',
      manifest: {
        permissions: {
          read: ['.'],
          write: ['.'], 
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 25, maxCpuSecs: 8 },
          ast: { 
            canModifySemantics: true,   // Needs to modify table semantics
            canAccessOriginal: true,
            canExportRawAst: false
          },
          export: { canGenerateFiles: true, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        supportedHooks: ['afterParse', 'beforeTransform', 'afterTransform'] as const,
        sizeMB: 4.2,
        signature: 'mock-signature-here'
      },
      compatibility: {
        minEngineVersion: '2.0.0',
        maxEngineVersion: '3.0.0'
      },
      pricing: { type: 'freemium' }
    });

    // Enterprise security compliance plugin
    this.listings.set('security-compliance', {
      id: 'security-compliance',
      version: '1.0.0',
      name: 'Enterprise Security Compliance',
      description: 'Auditing, compliance checking, security enforcement',
      author: 'Enterprise Security Solutions',
      publisher: '@enterprise',
      tags: ['security', 'compliance', 'audit', 'enterprise'],
      rating: 4.9,
      downloads: 450,
      lastUpdated: '2024-02-18',
      manifest: {
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false, // No network requests for security
          compute: { maxThreads: 1, maxMemoryMB: 40, maxCpuSecs: 15 },  // Higher for analysis
          ast: { 
            canModifySemantics: true,   // Can modify for sanitization
            canAccessOriginal: true, 
            canExportRawAst: false      // Security: no exporting raw AST
          },
          export: { 
            canGenerateFiles: true, 
            canUpload: false             // Security: no uploads allowed
          },
          misc: { allowUnsafeCode: false }
        },
        supportedHooks: [
          'beforeTransform', 'afterTransform', 
          'beforeRender', 'afterRender'
        ] as const,
        sizeMB: 12.8,
        signature: 'mock-enterprise-signature'
      },
      compatibility: {
        minEngineVersion: '2.1.0',
        maxEngineVersion: '3.0.0'
      },
      pricing: { 
        type: 'commercial', 
        priceUSD: 499 
      }
    });
  }

  search(query: string): MarketplaceEntry[] {
    const allEntries = Array.from(this.listings.values());
    
    if (!query) return allEntries;
    
    return allEntries.filter(entry => 
      entry.id.includes(query) ||
      entry.name.toLowerCase().includes(query.toLowerCase()) ||
      entry.tags.some(tag => tag.includes(query.toLowerCase()))
    );
  }

  getPlugin(id: string, version?: string): MarketplaceEntry | undefined {
    if (version) {
      // Would get specific version in real API
      return this.listings.get(id);
    }
    
    // Get latest version
    return this.listings.get(id);
  }

  getCategory(category: string): MarketplaceEntry[] {
    return Array.from(this.listings.values())
      .filter(entry => entry.tags.includes(category));
  }
}