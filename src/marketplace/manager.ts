/**
 * Plugin Manager
 * 
 * Handles plugin lifecycle management, versioning, compatibility checking,
 * and performance metrics.
 */

import type { EnginePlugin, PluginManifest, PluginMetadata, PluginPermissions } from '../types/plugins';

export interface PluginVersion {
  version: string;
  releaseDate: string;
  downloadUrl: string;
  changelog?: string;
  breaking: boolean;
  compatibility: {
    minEngineVersion: string;
    maxEngineVersion: string;
  };
}

export interface PluginMetrics {
  pluginId: string;
  installs: number;
  activeUsers: number;
  averageRating: number;
  totalRatings: number;
  crashRate: number;
  averageLoadTimeMs: number;
  lastUpdated: number;
}

export interface PluginCompatibilityResult {
  compatible: boolean;
  issues: string[];
  warnings: string[];
  requiredPermissions: string[];
  missingCapabilities: string[];
}

export interface PluginSearchQuery {
  query?: string;
  tags?: string[];
  author?: string;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  compatibility?: string;
  sortBy?: 'downloads' | 'rating' | 'updated' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PluginSearchResult {
  plugins: MarketplacePluginBrief[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MarketplacePluginBrief {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  rating: number;
  downloads: number;
  tags: string[];
  verified: boolean;
  premium: boolean;
  price?: number;
}

export interface PluginSubmissionRequest {
  name: string;
  description: string;
  packageUrl: string;
  readme: string;
  license: string;
  tags: string[];
  screenshots?: string[];
  repository?: string;
  author: {
    name: string;
    email: string;
    website?: string;
  };
}

export interface PluginApprovalStatus {
  pluginId: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs-review';
  reviewer?: string;
  feedback?: string;
  submittedAt: number;
  reviewedAt?: number;
}

export class PluginManager {
  private plugins: Map<string, PluginMetadata> = new Map();
  private versions: Map<string, PluginVersion[]> = new Map();
  private metrics: Map<string, PluginMetrics> = new Map();
  private submissions: Map<string, PluginSubmissionRequest> = new Map();
  private approvalStatus: Map<string, PluginApprovalStatus> = new Map();
  
  private currentEngineVersion: string;
  
  constructor(engineVersion: string = '2.0.0') {
    this.currentEngineVersion = engineVersion;
  }
  
  /**
   * Register a plugin
   */
  register(plugin: EnginePlugin, manifest: PluginManifest): void {
    const metadata: PluginMetadata = {
      id: plugin.name,
      name: plugin.name,
      version: manifest.version,
      author: plugin.author || 'Unknown',
      description: plugin.description || '',
      installed: true,
      enabled: true,
      permissions: plugin.permissions,
      compatibility: manifest.compatibility,
      metrics: { installs: 0, errors: 0 },
    };
    
    this.plugins.set(plugin.name, metadata);
    this.initializeMetrics(plugin.name);
  }
  
  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): boolean {
    this.plugins.delete(pluginId);
    return true;
  }
  
  /**
   * Get plugin metadata
   */
  getPlugin(pluginId: string): PluginMetadata | undefined {
    return this.plugins.get(pluginId);
  }
  
  /**
   * List all registered plugins
   */
  listPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values());
  }
  
  /**
   * Check plugin compatibility
   */
  checkCompatibility(pluginId: string): PluginCompatibilityResult {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return {
        compatible: false,
        issues: ['Plugin not found'],
        warnings: [],
        requiredPermissions: [],
        missingCapabilities: [],
      };
    }
    
    const issues: string[] = [];
    const warnings: string[] = [];
    const requiredPermissions: string[] = [];
    const missingCapabilities: string[] = [];
    
    // Check version compatibility
    const compatibility = plugin.compatibility;
    if (compatibility) {
      const minVersion = compatibility.minEngineVersion;
      const maxVersion = compatibility.maxEngineVersion;
      
      if (this.compareVersions(this.currentEngineVersion, minVersion) < 0) {
        issues.push(`Requires engine version ${minVersion}, current is ${this.currentEngineVersion}`);
      }
      
      if (this.compareVersions(this.currentEngineVersion, maxVersion) > 0) {
        issues.push(`Maximum supported version is ${maxVersion}, current is ${this.currentEngineVersion}`);
      }
    }
    
    // Check required permissions
    const permissions = plugin.permissions;
    if (permissions) {
      if (permissions.compute?.maxMemoryMB > 100) {
        warnings.push('Plugin requests high memory allocation');
      }
      if (permissions.network) {
        requiredPermissions.push('network');
      }
    }
    
    return {
      compatible: issues.length === 0,
      issues,
      warnings,
      requiredPermissions,
      missingCapabilities,
    };
  }
  
  /**
   * Add a plugin version
   */
  addVersion(pluginId: string, version: PluginVersion): void {
    const existing = this.versions.get(pluginId) || [];
    existing.push(version);
    existing.sort((a, b) => this.compareVersions(b.version, a.version));
    this.versions.set(pluginId, existing);
  }
  
  /**
   * Get plugin versions
   */
  getVersions(pluginId: string): PluginVersion[] {
    return this.versions.get(pluginId) || [];
  }
  
  /**
   * Get latest version
   */
  getLatestVersion(pluginId: string): PluginVersion | undefined {
    const versions = this.versions.get(pluginId);
    return versions?.[0];
  }
  
  /**
   * Check if update available
   */
  checkForUpdate(pluginId: string, currentVersion: string): { available: boolean; newVersion?: string; breaking: boolean } {
    const latest = this.getLatestVersion(pluginId);
    if (!latest) {
      return { available: false };
    }
    
    const comparison = this.compareVersions(latest.version, currentVersion);
    return {
      available: comparison > 0,
      newVersion: latest.version,
      breaking: latest.breaking,
    };
  }
  
  /**
   * Submit plugin for review
   */
  submitPlugin(request: PluginSubmissionRequest): string {
    const submissionId = 'sub_' + Math.random().toString(36).substr(2, 9);
    this.submissions.set(submissionId, request);
    
    const status: PluginApprovalStatus = {
      pluginId: submissionId,
      status: 'pending',
      submittedAt: Date.now(),
    };
    this.approvalStatus.set(submissionId, status);
    
    return submissionId;
  }
  
  /**
   * Get submission status
   */
  getSubmissionStatus(submissionId: string): PluginApprovalStatus | undefined {
    return this.approvalStatus.get(submissionId);
  }
  
  /**
   * Approve plugin submission
   */
  approvePlugin(submissionId: string, reviewer: string, feedback?: string): boolean {
    const status = this.approvalStatus.get(submissionId);
    if (!status) return false;
    
    status.status = 'approved';
    status.reviewer = reviewer;
    status.feedback = feedback;
    status.reviewedAt = Date.now();
    
    return true;
  }
  
  /**
   * Reject plugin submission
   */
  rejectPlugin(submissionId: string, reviewer: string, feedback: string): boolean {
    const status = this.approvalStatus.get(submissionId);
    if (!status) return false;
    
    status.status = 'rejected';
    status.reviewer = reviewer;
    status.feedback = feedback;
    status.reviewedAt = Date.now();
    
    return true;
  }
  
  /**
   * Get plugin metrics
   */
  getMetrics(pluginId: string): PluginMetrics | undefined {
    return this.metrics.get(pluginId);
  }
  
  /**
   * Update plugin metrics
   */
  updateMetrics(pluginId: string, updates: Partial<PluginMetrics>): void {
    const metrics = this.metrics.get(pluginId);
    if (metrics) {
      Object.assign(metrics, updates);
    }
  }
  
  /**
   * Record plugin install
   */
  recordInstall(pluginId: string): void {
    const metrics = this.metrics.get(pluginId);
    if (metrics) {
      metrics.installs++;
    }
  }
  
  /**
   * Record plugin error
   */
  recordError(pluginId: string): void {
    const metrics = this.metrics.get(pluginId);
    if (metrics) {
      const totalRuns = metrics.installs || 1;
      metrics.crashRate = ((metrics.crashRate * totalRuns) + 1) / totalRuns;
    }
  }
  
  /**
   * Search marketplace (mock implementation)
   */
  searchMarketplace(query: PluginSearchQuery): PluginSearchResult {
    // In real implementation, this would query marketplace API
    // Mock result for now
    const mockPlugins: MarketplacePluginBrief[] = [
      {
        id: 'math-enhancer',
        name: 'MathML Enhancer',
        description: 'Advanced MathML layout preservation',
        author: '@community',
        version: '1.2.0',
        rating: 4.8,
        downloads: 12500,
        tags: ['math', 'fidelity'],
        verified: true,
        premium: false,
      },
      {
        id: 'table-optimizer',
        name: 'Table Layout Optimizer',
        description: 'Preserves table structure and formatting',
        author: '@community',
        version: '2.1.0',
        rating: 4.6,
        downloads: 8500,
        tags: ['tables', 'layout'],
        verified: true,
        premium: false,
      },
    ];
    
    let results = mockPlugins;
    
    // Apply filters
    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }
    
    if (query.tags?.length) {
      results = results.filter(p => 
        query.tags!.some(t => p.tags.includes(t))
      );
    }
    
    if (query.verifiedOnly) {
      results = results.filter(p => p.verified);
    }
    
    if (query.minRating) {
      results = results.filter(p => p.rating >= query.minRating!);
    }
    
    // Sort
    const sortKey = query.sortBy || 'downloads';
    const sortOrder = query.sortOrder || 'desc';
    results.sort((a, b) => {
      const aVal = a[sortKey] as number;
      const bVal = b[sortKey] as number;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    // Paginate
    const page = query.page || 1;
    const limit = query.limit || 20;
    const start = (page - 1) * limit;
    const paginatedResults = results.slice(start, start + limit);
    
    return {
      plugins: paginatedResults,
      total: results.length,
      page,
      limit,
      hasMore: start + limit < results.length,
    };
  }
  
  private initializeMetrics(pluginId: string): void {
    this.metrics.set(pluginId, {
      pluginId,
      installs: 0,
      activeUsers: 0,
      averageRating: 0,
      totalRatings: 0,
      crashRate: 0,
      averageLoadTimeMs: 0,
      lastUpdated: Date.now(),
    });
  }
  
  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }
    return 0;
  }
}

/**
 * Plugin documentation template generator
 */
export function generatePluginDocs(manifest: PluginManifest): string {
  return `# ${manifest.name}

${manifest.description}

## Version

${manifest.version}

## Installation

\`\`\`bash
npm install @docsjs/plugin-${manifest.name}
\`\`\`

## Requirements

- DocsJS Engine: ${manifest.compatibility?.minEngineVersion || '2.0.0'} or higher

## Permissions

${renderPermissions(manifest.permissions)}

## Supported Hooks

${manifest.supportedHooks?.join(', ') || 'None'}

## Usage

\`\`\`javascript
import { ${manifest.name} } from '@docsjs/plugin-${manifest.name}';

const plugin = ${manifest.name};
// Register with DocsJS engine
engine.registerPlugin(plugin);
\`\`\`

## Changelog

${manifest.changelog || 'No changelog available.'}

## License

${manifest.license || 'MIT'}
`;
}

function renderPermissions(permissions?: PluginPermissions): string {
  if (!permissions) return 'None required';
  
  const lines: string[] = [];
  
  if (permissions.read?.length) {
    lines.push(`- **Read**: ${permissions.read.join(', ')}`);
  }
  if (permissions.write?.length) {
    lines.push(`- **Write**: ${permissions.write.join(', ')}`);
  }
  if (permissions.network !== undefined) {
    lines.push(`- **Network**: ${permissions.network ? 'Allowed' : 'Not allowed'}`);
  }
  if (permissions.compute) {
    lines.push(`- **Compute**: Max ${permissions.compute.maxMemoryMB}MB memory, ${permissions.compute.maxCpuSecs}s CPU`);
  }
  
  return lines.length > 0 ? lines.join('\n') : 'None required';
}
