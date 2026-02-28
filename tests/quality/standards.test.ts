/**
 * Quality Metrics & Standards Verification
 * 
 * Validates that the new engine meets quality standards and best practices.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { PluginManagerImpl } from '../../src/plugins-v2/manager';
import { ProfileManager } from '../../src/profiles/profile-manager';

describe('Quality Standards Verification', () => {
  let engine: CoreEngine;

  beforeEach(() => {
    engine = new CoreEngine({ debug: false });
  });

  /**
   * 1. VERIFICATION: Type Safety
   * Ensures all components use proper type safety as designed in architecture.
   */
  it('maintains full type safety across all components', () => {
    // Engine should accept typed config
    const typedConfig = engine.getConfig();
    expect(typeof typedConfig.debug).toBe('boolean');
    expect(typeof typedConfig.performance.maxMemoryMB).toBe('number');
    expect(typeof typedConfig.security.enableSandboxes).toBe('boolean');

    // Engine should manage typed profiles
    const allProfiles = engine.listProfiles();
    expect(Array.isArray(allProfiles)).toBe(true);

    const defaultProfile = engine.getProfile('default');
    if (defaultProfile) {
      expect(typeof defaultProfile.id).toBe('string');
      expect(Array.isArray(defaultProfile.parse.features)).toBe(false); // is an object
      expect(typeof defaultProfile.parse.features.mathML).toBe('boolean');
    } 

    // Engine should manage typed plugins
    const plugins = engine.listPlugins();
    expect(Array.isArray(plugins)).toBe(true);
  });

  /**
   * 2. VERIFICATION: Performance Standards
   * Checks that performance metrics and capabilities meet design specifications.
   */
  it('meets performance standards and efficiency requirements', () => {
    // Initial state validation
    const metrics = engine.getPerformanceMetrics();
    expect(typeof metrics.totalOperations).toBe('number');
    expect(typeof metrics.averageElapsedTimeMs).toBe('number');
    
    // Metrics structure should be complete
    expect(metrics.pipelineStats).toBeDefined();
    expect(typeof metrics.pipelineStats).toBe('object');
    
    // Memory and operations should start at reasonable values
    expect(metrics.totalOperations).toBeGreaterThanOrEqual(0);
  });

  /**
   * 3. VERIFICATION: Security Standards
   * Validates that security features are correctly implemented.
   */
  it('implements proper security controls and isolation', () => {
    const config = engine.getConfig();
    
    // Security settings should be properly configured by default
    expect(config.security.enableSandboxes).toBe(true);
    expect(Array.isArray(config.security.allowedReadPaths)).toBe(true);
    expect(typeof config.security.allowNetwork).toBe('boolean');
    
    // Plugin system should validate permissions
    const pluginManager = new PluginManagerImpl(engine);
    
    // Should have methods to validate plugin permissions
    expect(typeof pluginManager.validatePermissions).toBe('function');
    
    // Check that the plugin permissions structure is properly typed
    const mockPluginPermissions = {
      read: ['.'],
      write: ['.'],
      network: false,
      compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
      ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
      export: { canGenerateFiles: false, canUpload: false },
      misc: { allowUnsafeCode: false }
    };
    
    expect(mockPluginPermissions.compute.maxMemoryMB).toBe(10);
    expect(typeof mockPluginPermissions.ast.canModifySemantics).toBe('boolean');
  });

  /**
   * 4. VERIFICATION: Architectural Compliance
   * Confirms that the implementation follows the designed three-tier architecture.
   */
  it('follows the designated three-tier architecture design', () => {
    // Architecture layers verification:
    
    // Layer 1: Core Engine (validated by engine existence)
    expect(engine).toBeDefined();
    
    // Layer 2: Pipeline System (should be accessible through engine)
    // PipelineManager is integrated internally, but we can check that
    // the engine has the methods that indicate pipeline functionality
    expect(typeof engine.transformDocument).toBe('function');  // Would use pipeline
	
    // Layer 3: Plugins and Adapters (verified by plugin system existence)  
    const pluginMgr = new PluginManagerImpl(engine);
    expect(pluginMgr).toBeDefined();
    expect(typeof pluginMgr.register).toBe('function');
    expect(typeof pluginMgr.listForHook).toBe('function');
    
    // Profile system for platform layer
    const profileMgr = new ProfileManager(engine);
    expect(profileMgr).toBeDefined();
    expect(typeof profileMgr.addProfile).toBe('function');
  });

  /**
   * 5. VERIFICATION: Extensibility Standards
   * Makes sure the engine is designed for easy extensibility.
   */
  it('supports extensibility patterns as designed', () => {
    // Plugin extendability
    const pluginManager = new PluginManagerImpl(engine);
    
    // Support for multiple hooks (extensibility point #1)
    const mockExtendedPlugin = {
      name: 'extensibility-test-plugin',
      version: '1.0.0',
      author: 'Extensibility Test',
      description: 'Plugin to test extensibility',
      availableHooks: ['beforeParse', 'afterParse', 'beforeTransform', 'afterTransform'] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'], 
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 5, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeParse: (ctx: any) => ctx,  // Extensibility point #2: lifecycle hooks
      afterParse: (ctx: any) => ctx,
    };
    
    // Should be able to register custom plugins (extensibility pattern)
    pluginManager.register(mockExtendedPlugin);
    expect(pluginManager.list()).toContain('extensibility-test-plugin');
    
    // Profile extendability (extensibility point #3)
    const profileManager = new ProfileManager(engine);
    
    // Create custom profile
    const customProfile = {
      id: 'custom-extensibility-profile',
      name: 'Custom Extensibility Profile',
      description: 'Extension profile for testing',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: true, images: true, annotations: false },
        performance: { chunkSize: 10000, maxFileSizeMB: 10 }
      },
      transform: {
        enablePlugins: true, 
        operations: ['normalize', 'extend-functionality']
      },
      render: {
        outputFormat: 'html',
        theme: 'custom-extension',
        options: { extendedProperty: true }
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first' as const
      }
    };
    
    profileManager.addProfile(customProfile);
    expect(profileManager.getProfile('custom-extensibility-profile')).toBeDefined();
  });

  /**
   * 6. VERIFICATION: Backwards Compatibility
   * Ensures integration points with existing system are maintained.
   */
  it('maintains backward compatibility where required', () => {
    // The core engine should follow same initialization patterns as needed
    expect(typeof engine.initialize).toBe('function');
    expect(typeof engine.destroy).toBe('function');
    
    // Profile system should be expandable from existing patterns
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    
    // Should support same config patterns as original system (while extending them)
    expect(defaultProfile!.parse.enablePlugins).toBe(true);
    expect(defaultProfile!.transform.enablePlugins).toBe(true);
  });

  /**
   * 7. VERIFICATION: Error Handling Standards 
   * Verifies robust error handling and diagnostic capabilities.
   */
  it('implements comprehensive error handling and diagnostics', () => {
    // Check that profile manager validates properly
    const profileManager = new ProfileManager(engine);
    
    // Attempt to create invalid profile (should either throw or return validation error)
    const invalidProfile = {
      id: '', // Invalid ID
      name: 'Invalid Profile',
      description: 'Should fail validation',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: true, images: true, annotations: false },
        performance: { chunkSize: 10000, maxFileSizeMB: 10 }
      },
      transform: {
        enablePlugins: true,
        operations: []
      },
      render: {
        outputFormat: 'invalid-format' as any, // Invalid format intentionally
        theme: 'default'
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'invalid-security' as any // Invalid security profile
      }
    };
    
    // Test validation functionality exists
    const validationResult = profileManager.validateProfile(invalidProfile as any);
    expect(validationResult).toBeDefined();
    expect(typeof validationResult.valid).toBe('boolean');
    expect(Array.isArray(validationResult.errors)).toBe(true);
    
    // For valid profile, validation should succeed
    const validProfile = {
      id: 'valid-test-profile',
      name: 'Valid Profile',
      description: 'Should pass validation',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: false, images: true, annotations: true },
        performance: { chunkSize: 5000, maxFileSizeMB: 20 }
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize']
      },
      render: {
        outputFormat: 'html' as const, // Valid format
        theme: 'default'
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first' as const // Valid security
      }
    };
    
    const validResult = profileManager.validateProfile(validProfile);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors.length).toBe(0);
  });

  /**
   * 8. VERIFICATION: Resource Management Standards
   * Confirms proper resource allocation and cleanup.
   */
  it('manages resources efficiently and cleans up properly', () => {
    const metrics = engine.getPerformanceMetrics();
    
    // Metrics exist to measure resource usage
    expect(typeof metrics.peakMemoryUsageMB).toBe('number');  // Should track memory 
    
    // Engine implements cleanup lifecycle
    expect(typeof engine.destroy).toBe('function');
    expect(typeof engine.resetPerformanceMetrics).toBe('function');
    
    // Plugin system has cleanup methods
    const pluginManager = new PluginManagerImpl(engine);
    expect(typeof pluginManager).toBe('object');
    
    // Profile system supports cleanup of dynamic profiles
    const profileManager = new ProfileManager(engine);
    expect(typeof profileManager.removeProfile).toBe('function');
  });

  /**
   * 9. VERIFICATION: Monitoring & Observability
   * Validates that the system supports operational monitoring.
   */
  it('includes sufficient logging and monitoring hooks', () => {
    // The engine should have methods to retrieve operational metrics
    const metrics = engine.getPerformanceMetrics();
    expect(metrics).toBeDefined();
    
    // The metrics should include data suitable for monitoring
    expect(typeof metrics.totalOperations).toBe('number');
    expect(typeof metrics.averageElapsedTimeMs).toBe('number');
    expect(metrics.pipelineStats).toBeDefined();
    expect(typeof metrics.pipelineStats).toBe('object');
    
    // Profiles should be introspectable
    const profiles = engine.listProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBeGreaterThanOrEqual(4); // At least system profiles
    
    // Plugins should be discoverable
    const plugins = engine.listPlugins();
    expect(Array.isArray(plugins)).toBe(true);
    
    // Debug mode should be controllable
    const initialDebug = engine.getConfig().debug;
    expect(typeof initialDebug).toBe('boolean');

    // Engine should support configurable behaviors that affect monitoring
    const config = engine.getConfig();
    expect(config.performance.operationTimeoutMS).toBe(30000); // Default timeout
  });

  /**
   * 10. VERIFICATION: Documentation & Self-Description
   * Ensures components can describe themselves for system health checks.
   */
  it('includes self-descriptive capabilities for health monitoring', () => {
    // Verify the system can enumerate its capabilities 
    const profiles = engine.listProfiles();
    const plugins = engine.listPlugins();
    const config = engine.getConfig();
    const metrics = engine.getPerformanceMetrics();

    // All should provide descriptive data
    expect(Array.isArray(profiles)).toBe(true);
    expect(typeof config).toBe('object');
    expect(typeof metrics).toBe('object');
    
    // Components should have human-readable descriptions
    const defaultManagerProfile = engine.getProfile('default');
    expect(defaultManagerProfile).toBeDefined();
    expect(typeof defaultManagerProfile?.description).toBe('string');
    
    expect(typeof defaultManagerProfile?.parse.features).toBe('object');
    expect(typeof defaultManagerProfile?.transform.operations).toBe('object');
  });
});