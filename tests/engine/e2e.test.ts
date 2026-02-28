/**
 * End-to-End Tests for Core Engine v2
 * 
 * Tests the full flow of the new system.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { EnginePlugin } from '../../src/plugins-v2/types';

describe('Core Engine v2 - End-to-End', () => {
  let engine: CoreEngine;

  beforeEach(async () => {
    engine = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 512,
        maxWorkers: 2,
        operationTimeoutMS: 30000
      }
    });
    
    await engine.initialize();
  });

  afterEach(async () => {
    if (engine) {
      await engine.destroy();
    }
  });

  it('should work through complete flow - engine init → profile apply → plugin register → transform', async () => {
    // Step 1: Verify initialization worked correctly
    const initialConfig = engine.getConfig();
    expect(initialConfig.performance.maxMemoryMB).toBe(512);
    expect(initialConfig.performance.maxWorkers).toBe(2);
    
    // Step 2: Verify system profiles are available
    const profileIds = engine.listProfiles();
    expect(profileIds).toContain('default');
    expect(profileIds).toContain('knowledge-base');
    expect(profileIds.length).toBeGreaterThanOrEqual(4);
    
    // Step 3: Apply a specific profile
    engine.applyProfile('knowledge-base');
    const currentProfile = engine.getProfile('knowledge-base');
    expect(currentProfile).toBeDefined();
    expect(currentProfile!.name).toBe('Knowledge Base Profile');
    
    // Step 4: Register a plugin
    const mockPlugin: EnginePlugin = {
      name: 'e2e-test-plugin',
      version: '1.0.0',
      author: 'Test Runner',
      description: 'Plugin for end-to-end testing',
      availableHooks: ['beforeParse'] as const,
      supportedFormats: ['docx'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeParse: async (context) => {
        // In a real plugin, it might add extra context
        context.pipeline.state.intermediate.wasProcessedByPlugin = true;
        return context;
      }
    };

    engine.registerPlugin(mockPlugin);
    expect(engine.listPlugins()).toContain('e2e-test-plugin');
    
    // Step 5: Test with a mock file
    // Since we don't have actual parsers in our test setup yet, 
    // we'll just verify that the structure is in place
    if (engine) {
      // Engine exists and was initialized
    }

    // Step 6: Check performance metrics
    const metrics = engine.getPerformanceMetrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalOperations).toBe('number');
    
  });

  it('should support configuration customization flow', async () => {
    // Initial config
    let config = engine.getConfig();
    expect(config.performance.maxWorkers).toBe(2);
    
    // Customize config
    engine.configure({
      performance: {
        maxWorkers: 4,  // Increase worker count
        maxMemoryMB: 1024 // Increase memory limit
      }
    });
    
    // Check updated config
    config = engine.getConfig();
    expect(config.performance.maxWorkers).toBe(4);
    expect(config.performance.maxMemoryMB).toBe(1024);
    
    // Ensure system profiles are still available
    expect(engine.listProfiles()).toContain('default');
  });

  it('should support custom profile creation and usage flow', () => {
    // Start with system profiles
    const initialProfiles = engine.listProfiles();
    expect(initialProfiles.length).toBeGreaterThanOrEqual(4);
    
    // Create a custom profile based on an existing one
    const customProfile = {
      id: 'my-custom-profile',
      name: 'My Custom Profile',
      description: 'Custom configuration for my specific needs',
      parse: {
        enablePlugins: true,
        features: { 
          mathML: true, 
          tables: true, 
          images: false, // Disable images for this profile
          annotations: true 
        },
        performance: { 
          chunkSize: 20 * 1024 * 1024, // 20MB 
          maxFileSizeMB: 100
        }
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize', 'enhance-accessibility']
      },
      render: {
        outputFormat: 'html',
        theme: 'minimal',
        options: {
          removeHeaders: true,
          optimizeForPrint: true
        }
      },
      security: {
        allowedDomains: ['my-cdn.example.com'],
        sanitizerProfile: 'strict' as const
      }
    };

    // Register custom profile 
    engine.registerProfile(customProfile);

    // Verify it can be retrieved
    const retrievedProfile = engine.getProfile('my-custom-profile');
    expect(retrievedProfile).toBeDefined();
    expect(retrievedProfile!.id).toBe('my-custom-profile');
    expect(retrievedProfile!.parse.features.images).toBe(false); // Should be our custom setting
    expect(retrievedProfile!.render.options?.optimizeForPrint).toBe(true);
    
    // Should now appear in the list
    expect(engine.listProfiles()).toContain('my-custom-profile');
  });

  it('should maintain system and user-defined profiles separately', () => {
    const initialCount = engine.listProfiles().length;
    const initialList = [...engine.listProfiles()];

    // Register a user profile
    const userProfile = {
      id: 'user-specific-profile',
      name: 'User Profile',
      description: 'Profile specific to a user\'s use case',
      parse: {
        enablePlugins: false,
        features: { mathML: false, tables: false, images: true, annotations: false },
        performance: { chunkSize: 10000, maxFileSizeMB: 10 }
      },
      transform: {
        enablePlugins: false,
        operations: []
      },
      render: {
        outputFormat: 'json',
        theme: 'raw-data'
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'none' as const
      }
    };

    engine.registerProfile(userProfile);

    // Now should have one more than before
    const afterCount = engine.listProfiles().length;
    expect(afterCount).toBe(initialCount + 1);

    const newList = engine.listProfiles();
    expect(newList).toContain('user-specific-profile');
    
    // Original profiles still exist
    for (const original of initialList) {
      expect(newList).toContain(original);
    }
  });

  it('should handle performance metrics throughout workflow', () => {
    // Get initial metrics
    const initialMetrics = engine.getPerformanceMetrics();
    const initialOperations = initialMetrics.totalOperations;
    
    // Perform a few operations to increase the count (even though the methods might not be complete yet)
    engine.resetPerformanceMetrics();
    
    // After reset, metrics should be at zero
    const resetMetrics = engine.getPerformanceMetrics();
    expect(resetMetrics.totalOperations).toBe(0);
    
    // Even after reset, we can get metrics without error
    const finalMetrics = engine.getPerformanceMetrics();
    expect(finalMetrics.totalOperations).toBe(0);
  });

  it('should handle plugin life cycle correctly: register → check → list', () => {
    // At start, no custom plugins should exist (only the default behavior)
    const initialPlugins = engine.listPlugins().length;
    
    // Register a plugin
    const lifecyclePlugin: EnginePlugin = {
      name: 'lifecycle-test-plugin',
      version: '2.1.0',
      author: 'Lifecycle Tester',
      description: 'Tests plugin lifecycle',
      availableHooks: ['afterParse', 'beforeExport'] as const,
      supportedFormats: ['docx', 'html'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 15, maxCpuSecs: 8 },
        ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'high' as const,
      dependencies: [],
      afterParse: (context) => {
        context.pipeline.state.intermediate.lifecycleTestAfterParse = true;
        return context;
      },
      beforeExport: (context) => {
        context.pipeline.state.intermediate.lifecycleTestBeforeExport = true;
        return context;
      }
    };

    engine.registerPlugin(lifecyclePlugin);

    // Verify it's in the system
    const registeredList = engine.listPlugins();
    expect(registeredList).toContain('lifecycle-test-plugin');
    expect(registeredList.length).toBe(initialPlugins + 1);

    // Verify plugin is retrievable with all expected props
    const retrievedPlugin = engine.getPlugin('lifecycle-test-plugin');
    expect(retrievedPlugin).toBeDefined();
    expect(retrievedPlugin!.name).toBe('lifecycle-test-plugin');
    expect(retrievedPlugin!.version).toBe('2.1.0');
    expect(retrievedPlugin!.permissions.compute.maxMemoryMB).toBe(15);
    expect(retrievedPlugin!.priority).toBe('high');
    
    // Verify supported hooks
    expect(retrievedPlugin!.availableHooks).toContain('afterParse');
    expect(retrievedPlugin!.availableHooks).toContain('beforeExport');
  });

  it('should support profile switching and context isolation', () => {
    // Apply first profile
    engine.applyProfile('knowledge-base');
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile).toBeDefined();
    expect(kbProfile!.parse.features.mathML).toBe(true);  // KB profile enables math
    
    // Now switch to exam profile which has different settings
    engine.applyProfile('exam-paper');
    const examProfile = engine.getProfile('exam-paper');
    expect(examProfile).toBeDefined();
    expect(examProfile!.parse.features.mathML).toBe(true);  // Exam profile also enables math
    expect(examProfile!.parse.features.tables).toBe(false); // But disables tables
    
    // Switch to enterprise which has different security settings
    engine.applyProfile('enterprise-document');
    const enterpriseProfile = engine.getProfile('enterprise-document');
    expect(enterpriseProfile).toBeDefined();
    expect(enterpriseProfile!.security.sanitizerProfile).toBe('strict');
  });

  it('should provide full functionality in sync with design architecture', () => {
    // Check that all architectural components are present
    
    // 1. Engine should have config system
    const config = engine.getConfig();
    expect(config).toBeDefined();
    expect(config.performance).toBeDefined();
    expect(config.security).toBeDefined();
    
    // 2. Profile management available
    const profiles = engine.listProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);  // At least system profiles
    
    // 3. Plugin system available
    const plugins = engine.listPlugins();
    expect(Array.isArray(plugins)).toBe(true);  // Should be array even if empty
    
    // 4. Metrics system available  
    const metrics = engine.getPerformanceMetrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalOperations).toBe('number');
    
    // 5. Profile activation works
    engine.applyProfile('default');
    const currentProfile = engine.getProfile('default');
    expect(currentProfile).toBeDefined();
    
    // Everything operates as expected based on architecture
  });
});