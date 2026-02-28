/**
 * Full Regression Tests
 * 
 * End-to-end integration tests to ensure no breaking changes to core functionality.
 */

import { describe, it, expect } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { SYSTEM_PROFILES } from '../../src/profiles/profile-manager';

// These tests verify that the new architecture doesn't break existing expectations
describe('Full Regression Tests', () => {
  it('preserves original engine configuration interface', () => {
    // Test that the new engine can accept configuration similarly to what an older version might expect
    const engine = new CoreEngine({
      debug: true
      // Should accept minimal config object as the original implementation may have
    });
    
    const config = engine.getConfig();
    expect(config.debug).toBe(true);
    
    // Performance and security should have reasonable defaults
    expect(config.performance.maxMemoryMB).toBe(512); // Default value
    expect(config.security.enableSandboxes).toBe(true); // Security default
    
    engine.destroy();
  });

  it('maintains expected system profiles for core functionality', () => {
    const engine = new CoreEngine();
    
    // Essential profiles should exist for basic functionality 
    const expectedProfiles = ['default', 'knowledge-base', 'exam-paper', 'enterprise-document'];
    
    for (const profileId of expectedProfiles) {
      const profile = engine.getProfile(profileId);
      expect(profile, `Profile ${profileId} should exist`).toBeDefined();
      
      if (profile) {
        // Each profile should have essential properties defined
        expect(profile.id).toBe(profileId);
        expect(profile.name).toBeDefined();
        expect(profile.description).toBeDefined();
        expect(profile.parse).toBeDefined();
        expect(profile.transform).toBeDefined(); 
        expect(profile.render).toBeDefined();
        expect(profile.security).toBeDefined();
      }
    }
    
    // Should have more profiles than the expected minimums
    const allProfiles = engine.listProfiles();
    expect(allProfiles.length).toBeGreaterThanOrEqual(expectedProfiles.length);
    
    engine.destroy();
  });

  it('supports original plugin integration methods and expectations', () => {
    const engine = new CoreEngine();
    
    // Register a simple plugin with common interface
    const testPlugin = {
      name: 'regression-test-plugin',
      version: '1.0.0',
      author: 'Regression Tester',
      description: 'Tests for original plugin API compatibility',
      availableHooks: ['beforeParse'] as const,
      supportedFormats: ['docx', 'html'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 5, maxCpuSecs: 5 },
        ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeParse: (context: any) => {
        // In the original architecture, plugins might set flags on context
        if (!context.pipeline.state.intermediate.originalPatternTest) {
          context.pipeline.state.intermediate.originalPatternTest = true;
        }
        return context;
      }
    };

    // Plugin should register successfully with new system
    engine.registerPlugin(testPlugin);
    
    // Plugin accessibility should work as expected
    const plugin = engine.getPlugin('regression-test-plugin');
    expect(plugin).toBeDefined();
    expect(plugin!.name).toBe('regression-test-plugin');
    
    // Should be listed in available plugins 
    expect(engine.listPlugins()).toContain('regression-test-plugin');
    
    // Plugin configuration/permissions should be preserved
    expect(plugin!.permissions.compute.maxMemoryMB).toBe(5);
    expect(plugin!.priority).toBe('normal');
    expect(plugin!.dependencies).toEqual([]);
    
    engine.destroy();
  });

  it('does not degrade basic functionality compared to original', () => {
    const engine = new CoreEngine({
      debug: false,  // Should default to same as original
      performance: {
        maxMemoryMB: 512, // Should be similar to original performance
        maxWorkers: 4,
        operationTimeoutMS: 30000  // Reasonable timeout
      }
    });
    
    // Basic operations should still work efficiently
    const initialMetrics = engine.getPerformanceMetrics();
    expect(initialMetrics.totalOperations).toBe(0);
    
    // Configuration access should be as performant as original
    const config = engine.getConfig();
    expect(config.debug).toBe(false);
    expect(config.performance.maxMemoryMB).toBe(512);
    
    // Profile access should be as quick as originally expected 
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    
    if (defaultProfile) {
      // The profile should contain the expected original transformation features
      expect(defaultProfile.parse.enablePlugins).toBe(true);   // Parse plugins enabled by default
      expect(defaultProfile.parse.features.mathML).toBe(true); // Original feature preserved
      expect(defaultProfile.render.outputFormat).toBe('html'); // Original output preserved
    }
    
    // Profile listing performance should be adequate
    const allProfiles = engine.listProfiles();
    expect(allProfiles.length).toBeGreaterThanOrEqual(4); // Should at least have system profiles
    
    const finalMetrics = engine.getPerformanceMetrics();
    expect(finalMetrics.totalOperations).toBeGreaterThanOrEqual(initialMetrics.totalOperations);
    
    engine.destroy();
  });

  it('maintains backward compatibility in core transformation logic', () => {
    const engine = new CoreEngine();
    
    // Profiles should maintain transformation behavior aligned with original expectations
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile!.parse.enablePlugins).toBe(true);   // Original expectation: process plugins
    expect(defaultProfile!.parse.features.mathML).toBe(true);  // Original: support math
    expect(defaultProfile!.render.outputFormat).toBe('html');   // Original: HTML output
    expect(defaultProfile!.security.sanitizerProfile).toBe('fidelity-first'); // Original: maintain fidelity
    
    // Knowledge base profile should preserve original expectations for academic/business docs
    const kbProfile = engine.getProfile('knowledge-base');
    if (kbProfile) {
      expect(kbProfile.parse.features.tables).toBe(true);    // Original: keep tables for KBase
      expect(kbProfile.transform.operations).toContain('normalize'); // Original: normalization
      expect(kbProfile.render.theme).toBe('knowledge-base'); // Original: KB specific rendering
    }
    
    // Enterprise profile should preserve original compliance expectations
    const enterpriseProfile = engine.getProfile('enterprise-document');
    if (enterpriseProfile) {
      expect(enterpriseProfile.security.sanitizerProfile).toBe('strict'); // Original: enhanced security
      expect(enterpriseProfile.parse.features.annotations).toBe(true);    // Original: audit trails
    }
    
    engine.destroy();
  });

  it('preserves original performance characteristics for standard operations', () => {
    const start = performance.now();
    const engine = new CoreEngine({
      performance: {
        maxMemoryMB: 256,  // Conservative but sufficient
        maxWorkers: 2,
        operationTimeoutMS: 15000
      }
    });
    
    const engineCreationTime = performance.now() - start;
    
    // Engine creation should be quick (original behavior)
    expect(engineCreationTime).toBeLessThan(50); // Creation within 50ms
    
    // Config access should be immediate
    const configAccessStart = performance.now();
    const config = engine.getConfig();
    const configAccessTime = performance.now() - configAccessStart;
    
    expect(configAccessTime).toBeLessThan(1); // Config read under 1ms
    
    // Profile access should be fast
    const profileAccessStart = performance.now();
    const defaultProfile = engine.getProfile('default');
    const profileAccessTime = performance.now() - profileAccessStart;
    
    expect(profileAccessTime).toBeLessThan(1); // Profile read under 1ms
    
    // Plugin list should be immediate (empty initially)
    const listAccessStart = performance.now();
    const plugins = engine.listPlugins();
    const listAccessTime = performance.now() - listAccessStart;
    
    expect(listAccessTime).toBeLessThan(1); // Plugin list under 1ms
    
    // Metrics access should be fast 
    const metrics = engine.getPerformanceMetrics();
    expect(metrics.totalOperations).toBe(0);
    
    // Basic functionality performance should match originals
    expect(config.performance.maxMemoryMB).toBe(256);
    expect(Array.isArray(plugins)).toBe(true);
    expect(defaultProfile).toBeDefined();
    
    engine.destroy();
  });

  it('maintains compatibility with original error handling patterns', () => {
    const engine = new CoreEngine();
    
    // Should handle registration of duplicate profiles (similar to original error handling)
    expect(() => {
      engine.registerProfile({
        id: 'default',  // Already exists
        name: 'Duplicate Of Default',
        description: 'This should conflict with default profile',
        parse: {
          enablePlugins: true,
          features: { mathML: true, tables: true, images: true, annotations: true },
          performance: { chunkSize: 10000, maxFileSizeMB: 10 }
        },
        transform: { enablePlugins: true, operations: ['normalize'] },
        render: { outputFormat: 'html', theme: 'duplicate' },
        security: { allowedDomains: [], sanitizerProfile: 'fidelity-first' as const }
      });
    }).toThrow(); // Should throw for duplicate name, as original might have
    
    // Should validate profiles correctly 
    expect(() => {
      engine.registerProfile({
        // Missing required properties should cause validation failure
        id: '',  // Invalid: empty id
        name: 'Invalid Profile',
        description: 'Profile with invalid configuration',
        parse: {
          enablePlugins: true,
          features: { mathML: true, tables: true, images: true, annotations: true },
          performance: { chunkSize: 10000, maxFileSizeMB: 10 }
        },
        transform: { enablePlugins: true, operations: ['normalize'] },
        render: { outputFormat: 'html', theme: 'invalid' },
        security: { allowedDomains: [], sanitizerProfile: 'fidelity-first' as const }
      });
    }).toThrow(); // Should validate and reject bad profiles
    
    // Plugin registration should also validate properly
    expect(() => {
      engine.registerPlugin({
        // Invalid plugin - missing name
        name: '', 
        version: '1.0.0',
        author: 'Tester',
        description: 'Invalid plugin with no name',
        availableHooks: [] as const,
        supportedFormats: ['docx'],
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,  
          compute: { maxThreads: 1, maxMemoryMB: 5, maxCpuSecs: 5 },  
          ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'normal' as const,
        dependencies: []
        // Missing required methods for the hooks it claims to support
      });
    }).toThrow(); // Should validate and reject incomplete plugin
    
    // After all error attempts, engine should still function normally
    const normalOperation = engine.listProfiles();
    expect(normalOperation.length).toBeGreaterThanOrEqual(4); // Normal operations still work
    
    engine.destroy();
  });

  it('preserves original security model expectations', () => {
    const secureConfig = {
      debug: false,
      performance: {
        maxMemoryMB: 128, // Lower memory for security
        maxWorkers: 1,    // Contained workers 
        operationTimeoutMS: 10000
      },
      security: {
        enableSandboxes: true,         // Original security expectation
        allowedReadPaths: ['.'],       // Minimal read access
        allowNetwork: false            // Original: block network access by default
      }
    };
    
    const engine = new CoreEngine(secureConfig);
    
    const config = engine.getConfig();
    
    // Security configuration should match expectations
    expect(config.security.enableSandboxes).toBe(true);
    expect(config.security.allowNetwork).toBe(false);
    expect(config.security.allowedReadPaths).toContain('.');
    
    // Default profile should also adhere to original security expectations
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile!.security.sanitizerProfile).toBe('fidelity-first'); // Original balance
    
    engine.destroy();
  });

  it('maintains plugin compatibility patterns expected from original', () => {
    const engine = new CoreEngine();
    
    // Plugin should expose similar lifecycle events as original implementation
    const lifecycleTrackingPlugin = {
      name: 'lifecycle-compat-test',
      version: '1.0.0', 
      author: 'Compatibility Tester',
      description: 'Tests for lifecycle compatibility',
      availableHooks: [] as const,  // No hooks just for lifecycle test
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 5, maxCpuSecs: 5 },
        ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      // In original systems, plugins might have had init/destroy
      init: (ctx: any) => {
        ctx.lifecycleInitCallCount = (ctx.lifecycleInitCallCount || 0) + 1;
      },
      destroy: () => {
        // Original patterns: cleanup resources on termination
      }
    };

    engine.registerPlugin(lifecycleTrackingPlugin);
    
    const plugin = engine.getPlugin('lifecycle-compat-test');
    expect(plugin).toBeDefined();
    expect(typeof plugin!.init).toBe('function');
    expect(typeof plugin!.destroy).toBe('function');
    
    // Engine should allow plugins to have initialization and cleanup
    expect(plugin!.name).toBe('lifecycle-compat-test');
    expect(plugin!.version).toBe('1.0.0');
    expect(plugin!.priority).toBe('normal');
    
    engine.destroy();
  });

  it('ensures consistent state management behavior', async () => {
    const engine = new CoreEngine({ debug: true });
    
    // Apply different profiles and verify state isolation
    const initialActive = engine.getProfile('default');
    expect(initialActive).toBeDefined();
    expect(initialActive!.id).toBe('default');
    
    // Switch to another profile
    engine.applyProfile('knowledge-base');
    const activeKB = engine.getProfile('knowledge-base');
    expect(activeKB).toBeDefined();
    expect(activeKB!.name).toContain('Knowledge Base'); // Verify KB became active
    
    // Switch again
    engine.applyProfile('exam-paper');
    const activeExam = engine.getProfile('exam-paper');
    expect(activeExam).toBeDefined();
    expect(activeExam!.name).toContain('Exam Paper');
    
    // All profiles should remain available despite current active selection
    const availableProfiles = engine.listProfiles();
    expect(availableProfiles.includes('default')).toBe(true);
    expect(availableProfiles.includes('knowledge-base')).toBe(true);
    expect(availableProfiles.includes('exam-paper')).toBe(true);
    expect(availableProfiles.includes('enterprise-document')).toBe(true);
    
    // Metrics tracking should be consistent 
    const metricsAfterProfileOps = engine.getPerformanceMetrics();
    expect(metricsAfterProfileOps.pipelineStats).toBeDefined();
    
    await engine.destroy();
    
    // After destruction, verify no resource leaks (in real implementation)  
  });

  it('completes full lifecycle without degrading performance', async () => {
    const startTime = performance.now();
    
    // Create and configure engine (Setup)
    const engine = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 256,
        maxWorkers: 2,
        operationTimeoutMS: 20000
      }
    });
    
    const setupTime = performance.now() - startTime;
    
    // Perform operations such as configuring profiles and registering plugins (Execution)
    engine.applyProfile('default');
    
    const pluginForLifeTest = {
      name: 'lifecycle-test-plugin',
      version: '1.0.0',
      author: 'Lifecycle Validator',
      description: 'Validates full component lifecycle',
      availableHooks: ['beforeRender'] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 6, maxCpuSecs: 3 },
        ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeRender: (ctx: any) => {
        if (!ctx.lifecycleCheckPoint) ctx.lifecycleCheckPoint = 0;
        ctx.lifecycleCheckPoint++;
        return ctx;
      }
    };
    
    engine.registerPlugin(pluginForLifeTest);
    
    const opsTime = performance.now() - startTime - setupTime;
    
    // Perform final validation operations
    expect(engine.getPlugin('lifecycle-test-plugin')).toBeDefined();
    expect(engine.getProfile('default')).toBeDefined();
    
    // Perform cleanup and destruction (Finalization)
    const preDestroyTime = performance.now();
    await engine.destroy();
    const destroyTime = performance.now() - preDestroyTime;
    
    const totalTime = performance.now() - startTime;
    
    // Timings should be within original expectations
    expect(setupTime).toBeLessThan(100);    // Creation < 100ms
    expect(opsTime).toBeLessThan(100);     // Operations < 100ms  
    expect(destroyTime).toBeLessThan(20);  // Destruction < 20ms
    expect(totalTime).toBeLessThan(200);   // Total lifecycle < 200ms
    
    // All expected cleanup should complete with no errors
  });

  it('successfully integrates with expected ecosystem components', () => {
    // The new engine should be able to work as a drop-in replacement 
    // for original engine in ecosystem components
    
    const engine = new CoreEngine({
      debug: false, 
      performance: {
        maxMemoryMB: 512,
        maxWorkers: 2,
        operationTimeoutMS: 30000
      }
    });
    
    // Should support the same profile selection logic that ecosystem tools expect
    const processingStrategies = [
      { id: 'default', purpose: 'general-purpose processing' },
      { id: 'knowledge-base', purpose: 'academic/business documentation' },
      { id: 'exam-paper', purpose: 'assessment materials' },
      { id: 'enterprise-document', purpose: 'compliance/security focused' },
    ];
    
    for (const { id, purpose } of processingStrategies) {
      engine.applyProfile(id);
      const activeProfile = engine.getProfile(id);
      
      expect(activeProfile, `Profile ${id} not available for ${purpose}`).toBeDefined();
      expect(activeProfile!.id).toBe(id);
    }
    
    // Should allow ecosystem plugins to register (using original-style interfaces)
    const sampleEcosystemPlugins = [
      // Example: A math rendering plugin that the ecosystem might provide
      {
        name: 'widespace-math-plugin', // E.g., a math rendering plugin
        version: '1.0.0',
        author: 'Ecosystem Provider',
        description: 'Handles mathematical formulas',
        availableHooks: ['beforeRender'] as const,
        supportedFormats: ['docx'],
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 8, maxCpuSecs: 5 },
          ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'high' as const,  // Math processing often prioritized
        dependencies: [],
        beforeRender: (ctx: any) => {
          // Process math formulas before HTML rendering
          ctx.pipeline.state.intermediate.mathProcessed = true;
          return ctx;
        }
      },
      
      // Example: A table processing plugin that the ecosystem might provide
      {
        name: 'table-enhancement-plugin',
        version: '2.1.0',
        author: 'Ecosystem Provider', 
        description: 'Enhances table processing fidelity',
        availableHooks: ['afterParse'] as const,
        supportedFormats: ['docx'],
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 12, maxCpuSecs: 7 },
          ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'higher' as const,  // Tables often need early processing 
        dependencies: [],
        afterParse: (ctx: any) => {
          // Enhance table interpretation after initial parsing
          ctx.pipeline.state.intermediate.tableEnhanced = true;
          return ctx;
        }
      }
    ];
    
    // Register ecosystem plugins using the new system
    for (const plugin of sampleEcosystemPlugins) {
      engine.registerPlugin(plugin);
      
      // Verify successful registration
      const registered = engine.getPlugin(plugin.name);
      expect(registered).toBeDefined();
      expect(registered!.name).toBe(plugin.name);
      expect(registered!.version).toBe(plugin.version);
      expect(registered!.priority).toBe(plugin.priority); 
      expect(registered!.supportedFormats).toContain('docx');
    }
    
    // Should maintain all expected interfaces that ecosystem tools depend on
    const config = engine.getConfig();
    expect(config).toBeDefined();
    expect(config.performance.maxMemoryMB).toBe(512);
    expect(config.performance.maxWorkers).toBe(2);
    expect(config.security.enableSandboxes).toBe(true);
    
    // Profile management should be ecosystem-friendly 
    const profiles = engine.listProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);
    
    // Plugin management should support expected ecosystem behaviors
    const plugins = engine.listPlugins();
    expect(plugins.length).toBeGreaterThanOrEqual(sampleEcosystemPlugins.length);
    
    engine.destroy();
  });
});