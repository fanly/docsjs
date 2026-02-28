/**
 * Profile Management System
 * 
 * Handles configuration profiles for different transformation needs.
 */

import type { TransformationProfile, EngineConfig } from '../types/engine';
import type { CoreEngine } from '../engine/core';

// Predefined system profiles
export const SYSTEM_PROFILES: Record<string, TransformationProfile> = {
  'default': {
    id: 'default',
    name: 'Default Profile',
    description: 'General-purpose profile for typical document conversion',
    parse: {
      enablePlugins: true,
      features: {
        mathML: true,
        tables: true,
        images: true,
        annotations: true,
      },
      performance: {
        chunkSize: 10 * 1024 * 1024, // 10MB
        maxFileSizeMB: 50,
      },
    },
    transform: {
      enablePlugins: true,
      operations: ['normalize', 'enhance-structure', 'preserve-semantics'],
    },
    render: {
      outputFormat: 'html',
      theme: 'default',
      options: {
        fidelityMode: true,
        includeImageData: false
      }
    },
    security: {
      allowedDomains: [],
      sanitizerProfile: 'fidelity-first',
    },
  },

  'knowledge-base': {
    id: 'knowledge-base',
    name: 'Knowledge Base Profile',
    description: 'High-fidelity conversion optimal for documentation and knowledge bases',
    parse: {
      enablePlugins: true,
      features: {
        mathML: true,
        tables: true,
        images: true,
        annotations: true,
      },
      performance: {
        chunkSize: 20 * 1024 * 1024, // 20MB 
        maxFileSizeMB: 100,
      },
    },
    transform: {
      enablePlugins: true,
      operations: [
        'normalize-headings', 
        'enhance-semantic-meaning', 
        'preserve-structure', 
        'optimize-for-search',
        'annotate-with-ids'
      ],
    },
    render: {
      outputFormat: 'html',
      theme: 'knowledge-base',
      options: {
        fidelityMode: true,
        includeImageData: true,
        enableSyntaxHighlighting: true,
        generateTOC: true
      }
    },
    security: {
      allowedDomains: ['*.cdn.jsdelivr.net', '*.githubusercontent.com'],
      sanitizerProfile: 'fidelity-first',
    },
  },

  'exam-paper': {
    id: 'exam-paper',
    name: 'Exam Paper Profile',
    description: 'Optimized for academic document and exam paper conversion',
    parse: {
      enablePlugins: true,
      features: {
        mathML: true,  // Critical for exams
        tables: false, // Don't prioritize complex tables
        images: true,
        annotations: false, // Don't want comments in exam papers
      },
      performance: {
        chunkSize: 5 * 1024 * 1024, // 5MB - usually smaller docs
        maxFileSizeMB: 25,
      },
    },
    transform: {
      enablePlugins: true,
      operations: [
        'extract-questions', 
        'sanitize-content', 
        'preserve-question-formatting',
        'optimize-for-print'
      ],
    },
    render: {
      outputFormat: 'html',
      theme: 'exam-paper',
      options: {
        fidelityMode: false,  // Focus on readability over 1:1 fidelity
        printOptimized: true,
        hideAnswers: true
      }
    },
    security: {
      allowedDomains: [],
      sanitizerProfile: 'strict',
    },
  },

  'enterprise-document': {
    id: 'enterprise-document',
    name: 'Enterprise Document Profile',
    description: 'Security and compliance-focused document processing',
    parse: {
      enablePlugins: true,
      features: {
        mathML: false,      // Not always needed in business docs
        tables: true,
        images: true,
        annotations: true,  // For tracking changes
      },
      performance: {
        chunkSize: 50 * 1024 * 1024, // 50MB for large enterprise docs
        maxFileSizeMB: 200,
      },
    },
    transform: {
      enablePlugins: true,
      operations: [
        'add-metadata', 
        'apply-watermark', 
        'remove-personal-info',
        'compliance-check',
        'security-classification'
      ],
    },
    render: {
      outputFormat: 'html',
      theme: 'enterprise',
      options: {
        enterpriseBranding: true,
        watermarkTemplate: 'CONFIDENTIAL',
        trackChangesOverlay: true
      }
    },
    security: {
      allowedDomains: ['*.company.internal', '*.enterprise-domain.com'],
      sanitizerProfile: 'strict',
    },
  },
};

export interface ProfileManagerOptions {
  /** Whether to load system profiles initially */
  loadSystemProfiles: boolean;
  
  /** Location to load custom profiles from */
  customProfileDir?: string;
  
  /** Whether to sync profiles to storage */
  syncToStorage: boolean;
  
  /** Storage key for profiles */
  storageKey: string;
}

/**
 * Manages transformation profiles for the engine.
 */
export class ProfileManager {
  private engine: CoreEngine;
  private profiles: Map<string, TransformationProfile> = new Map();
  private currentProfileId: string | null = null;
  private options: ProfileManagerOptions;

  constructor(engine: CoreEngine, options?: Partial<ProfileManagerOptions>) {
    this.engine = engine;
    this.options = {
      loadSystemProfiles: true,
      syncToStorage: true,
      storageKey: 'docsjs-profiles',
      ...options
    };
    
    if (this.options.loadSystemProfiles) {
      this.loadSystemProfiles();
    }
  }

  /**
   * Load all predefined system profiles
   */
  private loadSystemProfiles(): void {
    for (const [id, profile] of Object.entries(SYSTEM_PROFILES)) {
      this.profiles.set(id, profile);
      
      if (this.engine.getConfig().debug) {
        console.log(`Loaded system profile: ${profile.name} (${id})`);
      }
    }
  }

  /**
   * Register a new profile
   */
  addProfile(profile: TransformationProfile): void {
    if (this.profiles.has(profile.id)) {
      throw new Error(`Profile with id '${profile.id}' already exists`);
    }
    
    this.profiles.set(profile.id, profile);
    
    if (this.engine.getConfig().debug) {
      console.log(`Added profile: ${profile.name} (${profile.id})`);
    }
  }

  /**
   * Get a registered profile
   */
  getProfile(id: string): TransformationProfile | undefined {
    return this.profiles.get(id);
  }

  /**
   * Get all profile IDs
   */
  getProfileIds(): string[] {
    return Array.from(this.profiles.keys());
  }

  /**
   * Get all profile definitions
   */
  getAllProfiles(): TransformationProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Remove a profile
   */
  removeProfile(id: string): boolean {
    const existed = this.profiles.has(id);
    if (existed) {
      this.profiles.delete(id);
      
      // If we removed the currently active profile, reset it
      if (this.currentProfileId === id) {
        this.currentProfileId = null;
      }
      
      if (this.engine.getConfig().debug) {
        console.log(`Removed profile: ${id}`);
      }
    }
    
    return existed;
  }

  /**
   * Activate a profile for use in engine operations
   */
  activateProfile(id: string): void {
    if (!this.profiles.has(id)) {
      throw new Error(`Profile not found: ${id}`);
    }
    
    this.currentProfileId = id;
    
    if (this.engine.getConfig().debug) {
      console.log(`Activated profile: ${id}`);
    }
  }

  /**
   * Get the currently active profile
   */
  getCurrentProfile(): TransformationProfile | null {
    if (this.currentProfileId) {
      return this.profiles.get(this.currentProfileId) || null;
    }
    return null;
  }

  /**
   * Create a new profile based on an existing one
   */
  createVariantFrom(sourceId: string, newId: string, modifications: Partial<TransformationProfile> = {}): void {
    const sourceProfile = this.getProfile(sourceId);
    if (!sourceProfile) {
      throw new Error(`Cannot find source profile: ${sourceId}`);
    }
    
    // Clone the source profile deeply with modifications applied
    const newProfile = this.combineProfileWithOverrides(sourceProfile, modifications);
    newProfile.id = newId;
    newProfile.name = `${sourceProfile.name} (variant)`;
    newProfile.description = `${sourceProfile.description} [Variant based on ${sourceProfile.name}]`;
    
    this.addProfile(newProfile);
  }

  /**
   * Validate a profile against engine configuration
   */
  validateProfile(profile: TransformationProfile): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.id || !/^[a-z0-9][a-z0-9_-]*$/.test(profile.id)) {
      errors.push("Profile ID must match pattern: /^[a-z0-9][a-z0-9_-]*$/");
    }

    if (!profile.name) {
      errors.push("Profile must have a name");
    }

    if (!profile.description) {
      errors.push("Profile must have a description");
    }

    // Validate security settings
    const config = this.engine.getConfig();
    
    // Check if sanitizer is valid
    if (!['fidelity-first', 'strict', 'none'].includes(profile.security.sanitizerProfile)) {
      errors.push("Invalid sanitizer profile - must be 'fidelity-first', 'strict', or 'none'");
    }

    // Check if allowed domains are valid URL-like patterns
    for (const domain of profile.security.allowedDomains) {
      if (!/^[a-z0-9*.\-]+$/.test(domain)) {
        errors.push(`Invalid domain pattern: ${domain}`);
      }
    }

    // Check if output format is valid
    if (!['html', 'markdown', 'json', 'editor'].includes(profile.render.outputFormat)) {
      errors.push("Invalid output format - must be 'html', 'markdown', 'json', or 'editor'");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Save all profiles to persistent storage (if supported)
   */
  saveProfiles(): void {
    if (this.options.syncToStorage && typeof window !== 'undefined' && window.localStorage) {
      const serializableProfiles: Record<string, any> = {};
      
      // Just include user-defined profiles, not system ones to prevent bloat
      for (const [id, profile] of this.profiles.entries()) {
        if (!this.isSystemProfile(id)) {
          serializableProfiles[id] = profile;
        }
      }
      
      try {
        localStorage.setItem(this.options.storageKey, JSON.stringify(serializableProfiles));
      } catch (error) {
        console.error('Failed to save profiles to storage:', error);
      }
    }
  }

  /**
   * Load profiles from persistent storage (if supported)
   */
  loadProfiles(): void {
    if (this.options.syncToStorage && typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = localStorage.getItem(this.options.storageKey);
        if (stored) {
          const storedProfiles = JSON.parse(stored);
          
          for (const [id, profile] of Object.entries(storedProfiles as Record<string, any>)) {
            this.addProfile(profile as TransformationProfile);
          }
        }
      } catch (error) {
        console.error('Failed to load profiles from storage:', error);
      }
    }
  }

  /**
   * Export a profile to be used in other systems
   */
  exportProfile(id: string): string {
    const profile = this.getProfile(id);
    if (!profile) {
      throw new Error(`Profile not found: ${id}`);
    }
    
    return JSON.stringify(profile, null, 2);
  }

  /**
   * Import a profile from a JSON string
   */
  importProfile(jsonStr: string): TransformationProfile {
    const profile: TransformationProfile = JSON.parse(jsonStr);
    
    const validation = this.validateProfile(profile);
    if (!validation.valid) {
      throw new Error(`Imported profile is invalid: ${validation.errors.join('; ')}`);
    }
    
    this.addProfile(profile);
    return profile;
  }

  /**
   * Check if a profile is a system profile
   */
  private isSystemProfile(id: string): boolean {
    return Object.prototype.hasOwnProperty.call(SYSTEM_PROFILES, id);
  }

  /**
   * Combine a profile with overrides to create a custom version
   */
  private combineProfileWithOverrides(
    original: TransformationProfile, 
    overrides: Partial<TransformationProfile>
  ): TransformationProfile {
    const result: TransformationProfile = JSON.parse(JSON.stringify(original));
    
    // Merge nested objects properly
    if (overrides.parse) {
      result.parse = { ...result.parse, ...overrides.parse };
      if (overrides.parse.features) {
        result.parse.features = { ...result.parse.features, ...overrides.parse.features };
      }
      if (overrides.parse.performance) {
        result.parse.performance = { ...result.parse.performance, ...overrides.parse.performance };
      }
    }
    
    if (overrides.transform) {
      result.transform = { ...result.transform, ...overrides.transform };
    }
    
    if (overrides.render) {
      result.render = { ...result.render, ...overrides.render };
    }
    
    if (overrides.security) {
      result.security = { ...result.security, ...overrides.security };
    }
    
    return result;
  }

  /**
   * Get a profile by matching against specific characteristics
   */
  findProfile(filter: Partial<TransformationProfile>): TransformationProfile | null {
    for (const profile of this.getAllProfiles()) {
      let matches = true;
      
      // Test top-level matches
      if (filter.id && profile.id !== filter.id) matches = false;
      if (filter.name && profile.name !== filter.name) matches = false;
      
      // Test nested matches if needed
      if (filter.render?.outputFormat !== undefined && 
          profile.render.outputFormat !== filter.render.outputFormat) {
        matches = false;
      }
      
      if (matches) {
        return profile;
      }
    }
    
    return null;
  }
}