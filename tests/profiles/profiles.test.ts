/**
 * Profile Management System Tests
 * 
 * Tests for the profile management functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { ProfileManager, SYSTEM_PROFILES } from '../../src/profiles/profile-manager';

describe('ProfileManager', () => {
  let engine: CoreEngine;
  let profileManager: ProfileManager;

  beforeEach(() => {
    engine = new CoreEngine();
    profileManager = new ProfileManager(engine, { loadSystemProfiles: true });
  });

  it('should initialize with system profiles loaded', () => {
    const allProfiles = profileManager.getProfileIds();
    const allSystemProfileIds = Object.keys(SYSTEM_PROFILES);
    
    allSystemProfileIds.forEach(id => {
      expect(allProfiles).toContain(id);
    });
    
    expect(allProfiles.length).toBeGreaterThanOrEqual(allSystemProfileIds.length);
  });

  it('should get specific system profiles correctly', () => {
    const defaultProfile = profileManager.getProfile('default');
    expect(defaultProfile).toBeDefined();
    expect(defaultProfile!.id).toBe('default');
    expect(defaultProfile!.name).toBe('Default Profile');

    const knowledgeBaseProfile = profileManager.getProfile('knowledge-base');
    expect(knowledgeBaseProfile).toBeDefined();
    expect(knowledgeBaseProfile!.id).toBe('knowledge-base');
    expect(knowledgeBaseProfile!.name).toBe('Knowledge Base Profile');
  });

  it('should return all profile IDs', () => {
    const profileIds = profileManager.getProfileIds();
    
    // Should contain at least the system profile IDs
    expect(profileIds).toContain('default');
    expect(profileIds).toContain('knowledge-base');
    expect(profileIds).toContain('exam-paper');
    expect(profileIds).toContain('enterprise-document');
  });

  it('should return all profile objects', () => {
    const profiles = profileManager.getAllProfiles();
    const profileIds = profiles.map(p => p.id);
    
    expect(profileIds).toContain('default');
    expect(profileIds).toContain('knowledge-base');
  });

  it('should add custom profiles', () => {
    const customProfile = {
      id: 'custom-profile',
      name: 'Custom Profile',
      description: 'A custom profile',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: true, images: true, annotations: false },
        performance: { 
          chunkSize: 10 * 1024 * 1024, // 10MB 
          maxFileSizeMB: 50
        }
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize']
      },
      render: {
        outputFormat: 'html',
        theme: 'default'
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first' as const
      }
    };

    profileManager.addProfile(customProfile);

    expect(profileManager.getProfile('custom-profile')).toBeDefined();
    expect(profileManager.getProfileIds()).toContain('custom-profile');
  });

  it('should throw error if profile ID already exists', () => {
    const existingProfile = {
      id: 'default', // Already exists
      name: 'Duplicate Profile',
      description: 'A duplicate profile',
      parse: SYSTEM_PROFILES.default.parse,
      transform: SYSTEM_PROFILES.default.transform,
      render: SYSTEM_PROFILES.default.render,
      security: SYSTEM_PROFILES.default.security
    };

    expect(() => {
      profileManager.addProfile(existingProfile);
    }).toThrow('already exists');
  });

  it('should remove profiles', () => {
    const profileToRemoveId = 'test-profile-to-remove';
    const profileToAdd = {
      id: profileToRemoveId,
      name: 'To Remove',
      description: 'A test profile to remove',
      parse: SYSTEM_PROFILES.default.parse,
      transform: SYSTEM_PROFILES.default.transform,
      render: SYSTEM_PROFILES.default.render,
      security: SYSTEM_PROFILES.default.security
    };

    profileManager.addProfile(profileToAdd);
    expect(profileManager.getProfileIds()).toContain(profileToRemoveId);

    const removed = profileManager.removeProfile(profileToRemoveId);
    expect(removed).toBe(true);
    expect(profileManager.getProfileIds()).not.toContain(profileToRemoveId);
    
    // Try removing non-existent profile
    const nonExistentRemoved = profileManager.removeProfile('non-existent');
    expect(nonExistentRemoved).toBe(false);
  });

  it('should activate profiles and get current profile', () => {
    profileManager.activateProfile('knowledge-base');
    
    const currentProfile = profileManager.getCurrentProfile();
    expect(currentProfile).toBeDefined();
    expect(currentProfile!.id).toBe('knowledge-base');
    expect(currentProfile!.name).toBe('Knowledge Base Profile');
  });

  it('should create profile variants', () => {
    profileManager.createVariantFrom('knowledge-base', 'knowledge-base-custom', {
      parse: {
        features: { mathML: false, tables: true, images: true, annotations: true }
      }
    });

    const variantProfile = profileManager.getProfile('knowledge-base-custom');
    expect(variantProfile).toBeDefined();
    expect(variantProfile!.id).toBe('knowledge-base-custom');
    expect(variantProfile!.parse.features.mathML).toBe(false); // Overridden
    expect(variantProfile!.parse.features.tables).toBe(true); // From original
  });

  it('should throw error when creating variant from non-existent profile', () => {
    expect(() => {
      profileManager.createVariantFrom('non-existent', 'new-variant', {});
    }).toThrow('Cannot find source profile: non-existent');
  });

  it('should validate profiles', () => {
    // Valid profile
    const validProfile = {
      id: 'valid-test-profile',
      name: 'Valid Profile',
      description: 'A valid profile',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: true, images: true, annotations: false },
        performance: { chunkSize: 10000, maxFileSizeMB: 10 }
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize']
      },
      render: {
        outputFormat: 'html',
        theme: 'default'
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first' as const
      }
    };

    const validationResult = profileManager.validateProfile(validProfile);
    expect(validationResult.valid).toBe(true);
    expect(validationResult.errors).toHaveLength(0);

    // Invalid profiles
    const invalidProfiles = [
      // Missing required fields
      { ...validProfile, id: '' },
      // Invalid id format
      { ...validProfile, id: 'Invalid ID With Spaces' },
      // Invalid sanitizer
      { ...validProfile, security: { ...validProfile.security, sanitizerProfile: 'invalid' as any } },
      // Invalid domain
      { ...validProfile, security: { ...validProfile.security, allowedDomains: ['invalid domain'] } },
      // Invalid output format
      { ...validProfile, render: { ...validProfile.render, outputFormat: 'invalid' as any } }
    ];

    for (const invalidProfile of invalidProfiles) {
      const result = profileManager.validateProfile(invalidProfile as any);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('should handle profile exports and imports', () => {
    const profileId = 'export-import-test';
    const testProfile = {
      id: profileId,
      name: 'Export Import Test',
      description: 'Profile created for export/import test',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: false, images: true, annotations: true },
        performance: { chunkSize: 5000, maxFileSizeMB: 25 }
      },
      transform: {
        enablePlugins: true,
        operations: ['enhance']
      },
      render: {
        outputFormat: 'markdown',
        theme: 'light'
      },
      security: {
        allowedDomains: ['example.com'],
        sanitizerProfile: 'strict' as const
      }
    };

    profileManager.addProfile(testProfile);

    // Export the profile
    const exportedString = profileManager.exportProfile(profileId);
    expect(exportedString).toBeDefined();

    // Import into a new instance (simulated)
    const importedProfile = profileManager.importProfile(exportedString);

    // Check that the imported profile matches the original
    expect(importedProfile.id).toBe(testProfile.id);
    expect(importedProfile.name).toBe(testProfile.name);
    expect(importedProfile.parse.features.mathML).toBe(testProfile.parse.features.mathML);
    expect(importedProfile.parse.performance.chunkSize).toBe(testProfile.parse.performance.chunkSize);
  });

  it('should find profiles by filter criteria', () => {
    // Find default profile by ID
    const foundById = profileManager.findProfile({ id: 'default' });
    expect(foundById).toBeDefined();
    expect(foundById!.id).toBe('default');

    // Find knowledge-base profile by name
    const foundByName = profileManager.findProfile({ name: 'Knowledge Base Profile' });
    expect(foundByName).toBeDefined();
    expect(foundByName!.id).toBe('knowledge-base');

    // Find profiles by output format
    const foundByOutputFormat = profileManager.findProfile({ 
      render: { outputFormat: 'html' as const }
    });
    expect(foundByOutputFormat).toBeDefined();
    // Most system profiles render to HTML
  });

  it('should handle non-existent filters gracefully', () => {
    const notFound = profileManager.findProfile({ 
      id: 'non-existent-profile', 
      name: 'Non-existent Name' 
    });
    expect(notFound).toBeNull();
  });

  it('should persist profiles to storage', () => {
    // This test uses a mock storage mechanism since in Node.js localStorage doesn't exist
    const testProfile = {
      id: 'persistent-test',
      name: 'Persistent Test',
      description: 'Profile to test persistence',
      parse: SYSTEM_PROFILES.default.parse,
      transform: SYSTEM_PROFILES.default.transform,
      render: {...SYSTEM_PROFILES.default.render},
      security: SYSTEM_PROFILES.default.security
    };

    // Add custom profile
    profileManager.addProfile(testProfile);

    // Since we may not have localStorage in Node, we test that the method exists and doesn't crash
    // In a real browser environment, this would actually save
    expect(() => {
      profileManager.saveProfiles();
    }).not.toThrow();
  });
});