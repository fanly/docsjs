/**
 * Plugin Version Manager
 * 
 * Manages plugin versions, compatibility checking, and auto-updates.
 */

import type { PluginManifest } from '../types/plugins';

/**
 * Version constraint
 */
export interface VersionConstraint {
  /** Operator: ^, ~, >=, <=, =, etc. */
  operator: '^' | '~' | '>=' | '<=' | '>' | '<' | '=' | '~';
  /** Version string */
  version: string;
}

/**
 * Plugin version info
 */
export interface PluginVersion {
  /** Version string */
  version: string;
  /** Release date */
  releasedAt: number;
  /** Download URL */
  distUrl?: string;
  /** SHA256 hash */
  integrity?: string;
  /** Deprecate this version */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
  /** Breaking changes */
  breaking: boolean;
  /** Changelog for this version */
  changelog?: string;
  /** Compatibility */
  engineVersions: string[];
  /** Node version requirement */
  nodeVersion?: string;
}

/**
 * Compatibility check result
 */
export interface CompatibilityResult {
  /** Whether compatible */
  compatible: boolean;
  /** Warnings */
  warnings: string[];
  /** Errors */
  errors: string[];
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
  /** Missing features */
  missingFeatures: string[];
  /** Conflicting plugins */
  conflictingPlugins: string[];
}

/**
 * Update info
 */
export interface UpdateInfo {
  /** Current version */
  currentVersion: string;
  /** Latest version */
  latestVersion: string;
  /** Whether update is available */
  updateAvailable: boolean;
  /** Type of update */
  updateType: 'major' | 'minor' | 'patch' | 'none';
  /** Breaking changes */
  breaking: boolean;
  /** Migration guide */
  migrationGuide?: string;
  /** Download URL */
  downloadUrl?: string;
  /** Auto-update recommended */
  autoUpdateRecommended: boolean;
}

/**
 * Plugin version manager
 */
export class PluginVersionManager {
  private versions: Map<string, PluginVersion[]> = new Map();
  private currentEngineVersion: string;

  constructor(engineVersion: string = '2.0.0') {
    this.currentEngineVersion = engineVersion;
  }

  /**
   * Register a new version for a plugin
   */
  registerVersion(pluginId: string, version: PluginVersion): void {
    const existing = this.versions.get(pluginId) || [];
    
    // Check for duplicates
    if (existing.some(v => v.version === version.version)) {
      throw new Error(`Version ${version.version} already exists for plugin ${pluginId}`);
    }

    existing.push(version);
    
    // Sort by version (newest first)
    existing.sort((a, b) => this.compareVersions(b.version, a.version));
    
    this.versions.set(pluginId, existing);
  }

  /**
   * Get latest version of a plugin
   */
  getLatestVersion(pluginId: string, includeDeprecated: boolean = false): PluginVersion | null {
    const versions = this.versions.get(pluginId);
    if (!versions || versions.length === 0) return null;

    if (includeDeprecated) {
      return versions[0];
    }

    return versions.find(v => !v.deprecated) || null;
  }

  /**
   * Get all versions of a plugin
   */
  getVersions(pluginId: string): PluginVersion[] {
    return this.versions.get(pluginId) || [];
  }

  /**
   * Get specific version
   */
  getVersion(pluginId: string, version: string): PluginVersion | null {
    const versions = this.versions.get(pluginId);
    if (!versions) return null;
    return versions.find(v => v.version === version) || null;
  }

  /**
   * Check compatibility with engine version
   */
  checkCompatibility(pluginId: string, engineVersion?: string): CompatibilityResult {
    const engine = engineVersion || this.currentEngineVersion;
    const versions = this.versions.get(pluginId);
    
    if (!versions || versions.length === 0) {
      return {
        compatible: false,
        warnings: [],
        errors: ['Plugin not found'],
        confidence: 'high',
        missingFeatures: [],
        conflictingPlugins: []
      };
    }

    const latest = this.getLatestVersion(pluginId);
    if (!latest) {
      return {
        compatible: false,
        warnings: [],
        errors: ['No non-deprecated versions available'],
        confidence: 'high',
        missingFeatures: [],
        conflictingPlugins: []
      };
    }

    return this.validateCompatibility(latest, engine);
  }

  /**
   * Check if update is available
   */
  checkForUpdates(pluginId: string, currentVersion: string): UpdateInfo {
    const latest = this.getLatestVersion(pluginId);
    
    if (!latest) {
      return {
        currentVersion,
        latestVersion: currentVersion,
        updateAvailable: false,
        updateType: 'none',
        breaking: false,
        autoUpdateRecommended: false
      };
    }

    const comparison = this.compareVersions(latest.version, currentVersion);
    
    let updateType: 'major' | 'minor' | 'patch' | 'none' = 'none';
    let breaking = false;

    if (comparison > 0) {
      const currentParts = currentVersion.split('.').map(Number);
      const latestParts = latest.version.split('.').map(Number);

      if (latestParts[0] > currentParts[0]) {
        updateType = 'major';
        breaking = true;
      } else if (latestParts[1] > currentParts[1]) {
        updateType = 'minor';
      } else {
        updateType = 'patch';
      }
    }

    return {
      currentVersion,
      latestVersion: latest.version,
      updateAvailable: comparison > 0,
      updateType,
      breaking,
      migrationGuide: latest.changelog,
      downloadUrl: latest.distUrl,
      autoUpdateRecommended: updateType !== 'none' && !breaking
    };
  }

  /**
   * Get deprecated versions
   */
  getDeprecatedVersions(pluginId: string): PluginVersion[] {
    const versions = this.versions.get(pluginId);
    if (!versions) return [];
    return versions.filter(v => v.deprecated);
  }

  /**
   * Deprecate a version
   */
  deprecateVersion(pluginId: string, version: string, message: string): void {
    const versions = this.versions.get(pluginId);
    if (!versions) throw new Error('Plugin not found');

    const v = versions.find(v => v.version === version);
    if (!v) throw new Error(`Version ${version} not found`);

    v.deprecated = true;
    v.deprecationMessage = message;
  }

  /**
   * Check if plugin supports given engine version
   */
  supportsEngineVersion(pluginId: string, engineVersion: string): boolean {
    const latest = this.getLatestVersion(pluginId, true);
    if (!latest) return false;

    return latest.engineVersions.some(constraint => {
      return this.satisfies(engineVersion, constraint);
    });
  }

  /**
   * Parse version range
   */
  parseRange(range: string): VersionConstraint[] {
    const constraints: VersionConstraint[] = [];
    
    // Match patterns like ^1.0.0, >=2.0.0, ~1.2.0
    const matches = range.matchAll(/(\^|~|>=|<=|>|<|=)?(\d+\.\d+\.\d+)/g);
    
    for (const match of matches) {
      constraints.push({
        operator: (match[1] || '=') as VersionConstraint['operator'],
        version: match[2]
      });
    }
    
    return constraints;
  }

  /**
   * Compare two versions
   * @returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  compareVersions(v1: string, v2: string): number {
    const p1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
    const p2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const n1 = p1[i] || 0;
      const n2 = p2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  }

  /**
   * Check if version satisfies constraint
   */
  private satisfies(version: string, constraint: string): boolean {
    const constraints = this.parseRange(constraint);
    return constraints.every(c => this.satisfiesConstraint(version, c));
  }

  private satisfiesConstraint(version: string, constraint: VersionConstraint): boolean {
    const comparison = this.compareVersions(version, constraint.version);
    
    switch (constraint.operator) {
      case '^': // Caret - compatible updates
        const vParts = version.split('.');
        const cParts = constraint.version.split('.');
        return vParts[0] === cParts[0] && comparison >= 0;
      case '~': // Tilde - patch updates
        return version.startsWith(constraint.version.replace(/\.\d+$/, '')) && comparison >= 0;
      case '>=':
        return comparison >= 0;
      case '<=':
        return comparison <= 0;
      case '>':
        return comparison > 0;
      case '<':
        return comparison < 0;
      case '=':
        return comparison === 0;
      default:
        return comparison >= 0;
    }
  }

  private validateCompatibility(version: PluginVersion, engineVersion: string): CompatibilityResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFeatures: string[] = [];
    const conflictingPlugins: string[] = [];

    // Check engine version compatibility
    const hasCompatible = version.engineVersions.some(v => this.satisfies(engineVersion, v));
    if (!hasCompatible) {
      errors.push(`Plugin requires engine version ${version.engineVersions.join(' or ')}, but running ${engineVersion}`);
    }

    // Check for deprecated version
    if (version.deprecated) {
      warnings.push(`Version ${version.version} is deprecated: ${version.deprecationMessage}`);
    }

    // Check for breaking changes
    if (version.breaking) {
      warnings.push('This version contains breaking changes');
    }

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (errors.length > 0) confidence = 'high';
    else if (warnings.length > 2) confidence = 'medium';
    else if (version.engineVersions.length > 3) confidence = 'low';

    return {
      compatible: errors.length === 0,
      warnings,
      errors,
      confidence,
      missingFeatures,
      conflictingPlugins
    };
  }
}

/**
 * Plugin compatibility checker
 */
export class PluginCompatibilityChecker {
  private manifestCache: Map<string, PluginManifest> = new Map();
  private pluginDependencies: Map<string, string[]> = new Map();

  /**
   * Check compatibility between plugins
   */
  checkPluginCompatibility(pluginIds: string[]): Map<string, string[]> {
    const conflicts = new Map<string, string[]>();

    for (let i = 0; i < pluginIds.length; i++) {
      for (let j = i + 1; j < pluginIds.length; j++) {
        const p1 = pluginIds[i];
        const p2 = pluginIds[j];
        
        const conflict = this.findConflict(p1, p2);
        if (conflict) {
          if (!conflicts.has(p1)) conflicts.set(p1, []);
          conflicts.get(p1)!.push(p2);
          
          if (!conflicts.has(p2)) conflicts.set(p2, []);
          conflicts.get(p2)!.push(p1);
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if plugins can be loaded together
   */
  canLoadTogether(pluginIds: string[]): { possible: boolean; reasons: string[] } {
    const conflicts = this.checkPluginCompatibility(pluginIds);
    const reasons: string[] = [];

    conflicts.forEach((conflictList, pluginId) => {
      reasons.push(`${pluginId} conflicts with: ${conflictList.join(', ')}`);
    });

    return {
      possible: conflicts.size === 0,
      reasons
    };
  }

  /**
   * Find conflict between two plugins
   */
  private findConflict(p1: string, p2: string): string | null {
    const deps1 = this.pluginDependencies.get(p1) || [];
    const deps2 = this.pluginDependencies.get(p2) || [];

    // Check direct conflict
    if (deps1.includes(p2) || deps2.includes(p1)) {
      return `${p1} and ${p2} have mutual dependency conflict`;
    }

    // Check shared dependency with version conflict (simplified)
    const sharedDeps = deps1.filter(d => deps2.includes(d));
    if (sharedDeps.length > 0) {
      return `${p1} and ${p2} share dependencies: ${sharedDeps.join(', ')}`;
    }

    return null;
  }

  /**
   * Register plugin manifest
   */
  registerManifest(pluginId: string, manifest: PluginManifest): void {
    this.manifestCache.set(pluginId, manifest);
    
    const deps: string[] = [];
    if (manifest.dependencies) {
      for (const [dep] of Object.entries(manifest.dependencies)) {
        deps.push(dep);
      }
    }
    this.pluginDependencies.set(pluginId, deps);
  }

  /**
   * Get missing dependencies
   */
  getMissingDependencies(pluginId: string, availablePlugins: string[]): string[] {
    const deps = this.pluginDependencies.get(pluginId) || [];
    return deps.filter(dep => !availablePlugins.includes(dep));
  }
}
