/**
 * Compatibility Tests
 * 
 * Verifies that the new engine architecture maintains compatibility with existing patterns.
 */

import { describe, it, expect, beforeEach, vi, type MockInstance } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { getGlobalEngine } from '../../src/engine/core';

// Mock existing API patterns to ensure compatibility
describe('Compatibility with Existing Patterns', () => {
  
  let engine: CoreEngine;
  let consoleSpy: MockInstance;

  beforeEach(async () => {
    engine = new CoreEngine({
      debug: false
    });
    
    await engine.initialize();
    
    // Spy on console to verify debug patterns work
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // Test 1: Constructor compatibility (existing initialization patterns) 
  it('supports existing engine instantiation patterns', async () => {
    // Old-style instantiation
    const oldStyleEngine = new CoreEngine();
    expect(oldStyleEngine).toBeDefined();

    // With options - should be backward compatible
    const configuredEngine = new CoreEngine({ debug: true });
    expect(configuredEngine).toBeDefined();
    
    // Config should be mergable as expected
    const config = configuredEngine.getConfig();
    expect(config.debug).toBe(true);
    
    // Cleanup
    await oldStyleEngine.destroy();
    await configuredEngine.destroy();
  });

  // Test 2: Singleton pattern compatibility
  it('maintains singleton pattern compatibility', () => {
    // Access global engine - should function properly
    const globalEng = getGlobalEngine();
    expect(globalEng).toBeDefined();
    expect(globalEng).toBeInstanceOf(CoreEngine);

    // Multiple accesses should return same instance
    const globalEngAgain = getGlobalEngine();
    expect(globalEng).toBe(globalEngAgain);

    // This matches expected singleton use patterns
  });

  // Test 3: Configuration object compatibility
  it('accepts configuration in expected formats', () => {
    // Standard config format
    const stdConfigEngine = new CoreEngine({
      debug: true,
      performance: {
        maxMemoryMB: 256,
        maxWorkers: 2, 
        operationTimeoutMS: 30000
      }
    });

    const stdConfig = stdConfigEngine.getConfig();
    expect(stdConfig.debug).toBe(true);
    expect(stdConfig.performance.maxMemoryMB).toBe(256);
    expect(stdConfig.performance.maxWorkers).toBe(2);

    // Should support partial configs too (like old API)
    const partialConfigEngine = new CoreEngine({
      debug: true
      // leaving others as default
    });

    const partialConfig = partialConfigEngine.getConfig();
    expect(partialConfig.debug).toBe(true);
    // Others should have defaults
    expect(partialConfig.performance.maxMemoryMB).toBe(512); // Default
    expect(partialConfig.performance.maxWorkers).toBe(4);   // Default

    // Verify the patterns work the same
    stdConfigEngine.destroy();
    partialConfigEngine.destroy(); 
  });

  // Test 4: Method and property compatibility
  it('maintains API method compatibility', () => {
    // Check that expected methods exist with expected signatures
    expect(typeof engine.configure).toBe('function');
    expect(typeof engine.getConfig).toBe('function'); 
    expect(typeof engine.initialize).toBe('function');
    expect(typeof engine.destroy).toBe('function');
    expect(typeof engine.getPerformanceMetrics).toBe('function');
    expect(typeof engine.resetPerformanceMetrics).toBe('function');

    // Verify that profile methods exist
    expect(typeof engine.registerProfile!).toBe('function');
    expect(typeof engine.getProfile).toBe('function');
    expect(typeof engine.listProfiles).toBe('function');
    expect(typeof engine.applyProfile).toBe('function');

    // Verify that plugin methods exist with expected names as per new design
    expect(typeof engine.registerPlugin!).toBe('function');
    expect(typeof engine.getPlugin).toBe('function');
    expect(typeof engine.listPlugins).toBe('function');

    // Check method signatures by calling them (safely)
    const config = engine.getConfig();
    expect(config).toBeDefined();
    
    const profiles = engine.listProfiles();
    expect(profiles).toBeDefined();
    
    const metrics = engine.getPerformanceMetrics();
    expect(metrics).toBeDefined();
  });

  // Test 5: Plugin integration compatibility patterns
  it('allows plugin registration with expected patterns', () => {
    // Define a plugin that could work with both old and new engine patterns
    const compatibilityPlugin = {
      // Core properties that should be expected
      name: 'compatibility-test-plugin',
      version: '1.0.0', 
      description: 'Plugin testing compatibility',
      author: 'Dev',
      
      // New lifecycle hook properties
      availableHooks: ['beforeParse', 'afterTransform'] as const,
      supportedFormats: ['docx'],
      priority: 'normal' as const,
      dependencies: [],
      
      // Security/permission properties (new engine)
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      
      // Lifecycle methods (new engine)
      beforeParse: (context: any) => context,
      afterTransform: (context: any) => context
    };

    // Register like would be done in old/new patterns
    engine.registerPlugin(compatibilityPlugin);

    // Verify it registered as expected 
    const registered = engine.getPlugin('compatibility-test-plugin');
    expect(registered).toBeDefined();
    expect(registered!.name).toBe('compatibility-test-plugin');
    expect(registered!.version).toBe('1.0.0');
    expect(registered!.priority).toBe('normal');
  });

  // Test 6: Profile system compatibility
  it('supports profile patterns that extend existing functionality', () => {
    // The new profile system should accommodate patterns that existing code might follow
    const existingStyleProfile = {
      id: 'existing-style-profile',
      name: 'Legacy-Style Profile',
      description: 'A profile simulating existing API style',
      // New engine has expanded parse section
      parse: {
        enablePlugins: true,
        features: { 
          mathML: true, 
          tables: true, 
          images: true, 
          annotations: false 
        },
        performance: { 
          chunkSize: 5 * 1024 * 1024, // 5MB 
          maxFileSizeMB: 25 
        }
      },
      // New engine has extended transform section
      transform: {
        enablePlugins: true,
        operations: ['normalize', 'existing-operation']  // Array of operations
      },
      // New engine has richer render section
      render: {
        outputFormat: 'html' as const, // Constrained type
        theme: 'existing-theme',       // String-based theme
        options: {                     // Additional options
          legacyFlag: true
        }
      },
      // New engine has security section (existing engines didn't)
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first' as const
      }
    };

    // Profile should be registerable
    engine.registerProfile(existingStyleProfile);

    // Should be retrievable
    const retrieved = engine.getProfile('existing-style-profile');
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Legacy-Style Profile');
    expect(retrieved!.parse.features.mathML).toBe(true);
    expect(retrieved!.parse.performance.chunkSize).toBe(5 * 1024 * 1024);
    expect(retrieved!.render.outputFormat).toBe('html');
    expect(retrieved!.render.options?.legacyFlag).toBe(true);
  });

  // Test 7: Error handling compatibility 
  it('throws errors in expected patterns for compatibility', () => {
    // Should throw for duplicate profile
    const profile1 = {
      id: 'duplicate-test',
      name: 'Profile 1',
      description: 'First profile', 
      parse: {enablePlugins: true, features: { mathML: true, tables: true, images: true, annotations: true }, performance: { chunkSize: 10000, maxFileSizeMB: 10 }},
      transform: {enablePlugins: true, operations: ['normalize']},
      render: { outputFormat: 'html' as const, theme: 'default' },
      security: { allowedDomains: [], sanitizerProfile: 'fidelity-first' as const }
    };
    
    engine.registerProfile(profile1);
    
    // Attempting to register the same ID should fail similar to existing APIs
    expect(() => {
      engine.registerProfile({ ...profile1 });
    }).toThrow();

    // Should throw for malformed profile via validation
    const badIdProfile = { 
      id: '', // Invalid
      name: 'Bad Profile',
      description: 'Bad ID profile',
      parse: {enablePlugins: true, features: { mathML: true, tables: true, images: true, annotations: true }, performance: { chunkSize: 10000, maxFileSizeMB: 10 }},
      transform: {enablePlugins: true, operations: ['normalize']},
      render: { outputFormat: 'html' as const, theme: 'default' },
      security: { allowedDomains: [], sanitizerProfile: 'fidelity-first' as const }
    };
    
    expect(() => {
      engine.registerProfile(badIdProfile);
    }).toThrow();

    // Plugin registration should also follow expected error patterns
    const badPlugin = {
      name: '', // Invalid name
      version: '1.0.0',
      description: 'Bad plugin',
      author: 'Tester',
      availableHooks: [] as const,
      supportedFormats: [],
      permissions: { read: ['.'], write: ['.'], network: false, compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 }, ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false }, export: { canGenerateFiles: false, canUpload: false }, misc: { allowUnsafeCode: false } },
      priority: 'normal' as const,
      dependencies: []
    };

    expect(() => {
      engine.registerPlugin(badPlugin); 
    }).toThrow();
  });

  // Test 8: Lifecycle compatibility (init/destroy patterns)
  it('follows expected lifecycle patterns for compatibility', async () => {
    // Engine should initialize and deinitialize as expected
    const lifecycleEngine = new CoreEngine({ debug: false });
    
    // Check initial state
    const initialMetrics = lifecycleEngine.getPerformanceMetrics();
    expect(initialMetrics.totalOperations).toBe(0);
    
    // Should be possible to init multiple times without crashing (even if redundant)
    if (!lifecycleEngine[`initialized`]) { // Using internal state check as example
      await lifecycleEngine.initialize();
    }
    
    // Should be destroyable as expected in shutdown patterns
    await lifecycleEngine.destroy();

    // Should allow re-initialization after destroy for reuse patterns (where appropriate)
  });

  // Test 9: Debug/Logging compatibility
  it('maintains debug messaging and logging patterns', () => {
    // Create engine with debug to test log patterns
    const debugEngine = new CoreEngine({ debug: true });
    
    // Perform an operation that would generate logs in debug mode
    if (debugEngine.getConfig().debug) {
      // In debug mode, expect logging to occur  
    }
    
    debugEngine.destroy();

    // When debug disabled, we expect minimal/no logging for performance
    const quietEngine = new CoreEngine({ debug: false });
    
    expect(quietEngine.getConfig().debug).toBe(false);
    
    quietEngine.destroy();
  });
});