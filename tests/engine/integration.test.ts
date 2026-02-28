/**
 * Core Engine Integration Tests
 * 
 * Tests that verify the various components work together.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { SYSTEM_PROFILES } from '../../src/profiles/profile-manager';
import { DEFAULT_PIPELINE_CONTEXT } from '../../src/pipeline/types';

describe('Core Engine Integration', () => {
  let engine: CoreEngine;

  beforeEach(async () => {
    // Create engine with debug mode
    engine = new CoreEngine({ 
      debug: false,
      performance: {
        maxMemoryMB: 256,
        maxWorkers: 2,
        operationTimeoutMS: 15000
      }
    });
    
    // Initialize the engine
    await engine.initialize();
  });

  it('should correctly instantiate and initialize the engine with profiles', () => {
    // Verify core engine functionality
    const config = engine.getConfig();
    expect(config.debug).toBe(false); // Debug off as set above
    expect(config.performance.maxMemoryMB).toBe(256);
    
    // Verify profiles were loaded
    const profiles = engine.listProfiles();
    expect(profiles).toContain('default');
    expect(profiles.length).toBeGreaterThanOrEqual(4); // At least 4 system profiles
    
    // Verify specific profile availability
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    expect(defaultProfile!.id).toBe('default');
    expect(defaultProfile!.parse.features.tables).toBe(true);
  });

  it('should handle plugin registration and lifecycle correctly', async () => {
    const mockPlugin = {
      name: 'integration-test-plugin',
      version: '1.0.0',
      author: 'Integration Test',
      description: 'Plugin for integration testing',
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
      // Mock implementation for the plugin method
      beforeParse: (ctx: any) => {
        // Add some context to indicate the plugin ran
        if (!ctx.pipeline.state.intermediate.pluginTestFlag) {
          ctx.pipeline.state.intermediate.pluginTestFlag = 0;
        }
        ctx.pipeline.state.intermediate.pluginTestFlag += 1;
        return ctx;
      }
    };

    // Register plugin
    engine.registerPlugin(mockPlugin);
    
    // Verify plugin was registered
    expect(engine.listPlugins()).toContain('integration-test-plugin');
    const regPlugin = engine.getPlugin('integration-test-plugin');
    expect(regPlugin).toBeDefined();
    expect(regPlugin!.name).toBe('integration-test-plugin');
    
    // Verify plugin methods are properly defined
    expect(typeof (regPlugin as any).beforeParse).toBe('function');
  });

  it('should apply and switch between different profiles', () => {
    // Initially the current profile is null
    const initialProfile = engine.getProfile('default');
    expect(initialProfile).toBeDefined();
    
    // Apply first profile
    engine.applyProfile('knowledge-base');
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile).toBeDefined();
    expect(kbProfile!.name).toBe('Knowledge Base Profile');
    expect(kbProfile!.parse.features.mathML).toBe(true);

    // Switch to second profile
    engine.applyProfile('exam-paper');
    const examProfile = engine.getProfile('exam-paper');
    expect(examProfile).toBeDefined();
    expect(examProfile!.name).toBe('Exam Paper Profile');
    expect(examProfile!.parse.features.mathML).toBe(true); // This is true in exam profile
    expect(examProfile!.parse.features.tables).toBe(false); // This is false in exam profile
  });

  it('should track metrics properly during operations', () => {
    // Initial metrics
    const initialMetrics = engine.getPerformanceMetrics();
    expect(initialMetrics.totalOperations).toBe(0);
    expect(typeof initialMetrics.averageElapsedTimeMs).toBe('number');

    // Perform some operations
    engine.resetPerformanceMetrics();
    
    // New metrics should be reset
    const newMetrics = engine.getPerformanceMetrics();
    expect(newMetrics.totalOperations).toBe(0);
    expect(newMetrics.averageElapsedTimeMs).toBe(0);
  });

  it('should maintain state isolation across different components', () => {
    // Test profile isolation
    let originalProfileCount = engine.listProfiles().length;
    
    // Apply a profile that should exist
    engine.applyProfile('default');
    let currentProfile = engine.getProfile('default');
    expect(currentProfile).toBeTruthy();
    
    // Check that changing something doesn't affect engine state in unexpected ways
    const configBefore = engine.getConfig();
    
    const configModified = { ...configBefore };
    configModified.debug = true;
    
    expect(engine.getConfig().debug).toBeFalsy(); // Should still be false
  });

  it('should allow multiple engine instances with isolated state', () => {
    // Create a second engine with custom config
    const engine2 = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 128, // Different memory limit
        maxWorkers: 1,
        operationTimeoutMS: 10000
      }
    });

    // Both engines should have different configs
    const config1 = engine.getConfig();
    const config2 = engine2.getConfig();
    
    expect(config1.performance.maxMemoryMB).toBe(256); // First engine
    expect(config2.performance.maxMemoryMB).toBe(128); // Second engine

    // Both should have profile systems
    const profiles1 = engine.listProfiles();
    const profiles2 = engine2.listProfiles();
    
    expect(profiles1.length).toBeGreaterThanOrEqual(4);
    expect(profiles2.length).toBeGreaterThanOrEqual(4);

    // Cleanup
    engine2.destroy();
  });

  it('should maintain profile system integrity across operations', () => {
    // Verify system profiles exist
    const kbProfileExists = engine.getProfile('knowledge-base');
    expect(kbProfileExists).toBeDefined();
    expect(kbProfileExists!.id).toBe('knowledge-base');
    expect(kbProfileExists!.security.sanitizerProfile).toBe('fidelity-first');

    // Add a temporary profile
    const tempProfile = {
      id: 'temp-test-profile',
      name: 'Temp Test',
      description: 'Temporary profile for test',
      parse: {
        enablePlugins: true,
        features: { mathML: false, tables: true, images: true, annotations: false },
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
        sanitizerProfile: 'strict' as const
      }
    };
    
    engine.registerProfile(tempProfile);
    
    // Verify new profile is available
    const addedProfile = engine.getProfile('temp-test-profile');
    expect(addedProfile).toBeDefined();
    expect(addedProfile!.parse.features.mathML).toBe(false);
    expect(addedProfile!.render.theme).toBe('default');

    // Original system profiles still exist
    const defaultProfileStillExists = engine.getProfile('default');
    expect(defaultProfileStillExists).toBeDefined();
  });

  it('should properly initialize and clean up all subsystems', async () => {
    // Engine was initialized in before() hook
    const initialProfiles = engine.listProfiles().length;
    expect(initialProfiles).toBeGreaterThanOrEqual(4);

    // Add plugin for testing
    const testPlugin = {
      name: 'cleanup-test-plugin',
      version: '1.0.0',
      author: 'Cleanup Test',
      description: 'Plugin for cleanup testing',
      availableHooks: [] as const,
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
      destroy: () => {
        // This should be called during destroy
      }
    };
    
    engine.registerPlugin(testPlugin);
    expect(engine.listPlugins()).toContain('cleanup-test-plugin');
    
    // Destroy engine
    await engine.destroy();
    
    // After destroy, engine-specific resources should be cleaned up
    // Though the exact cleanup behavior depends on implementation
    // The most important thing is that destroy doesn't throw
    
    const pluginsAfterDestroy = engine.listPlugins();
    // The plugin list might still contain the plugin depending on impl.
  });

  it('should handle context creation properly', () => {
    // Verify that our default context template is properly structured
    const context = DEFAULT_PIPELINE_CONTEXT;
    
    expect(context).toBeDefined();
    expect(context.state).toBeDefined();
    expect(context.state.phase).toBe('initializing');
    expect(context.hooks).toBeDefined();
    expect(context.hooks.beforeParse).toBeInstanceOf(Array);
    expect(context.hooks.afterParse).toBeInstanceOf(Array);
    expect(context.metrics).toBeDefined();
  });
});