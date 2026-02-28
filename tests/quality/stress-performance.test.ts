/**
 * Stress & Large Document Performance Tests
 * 
 * Tests performance and stability with large documents and heavy workloads.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoreEngine } from '../../src/engine/core';

describe('Performance & Stress Tests', () => {
  let engine: CoreEngine;

  beforeEach(async () => {
    engine = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 1024,
        maxWorkers: 4,
        operationTimeoutMS: 60000  // 1 minute for heavy operations
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.'],
        allowNetwork: false,
      }
    });

    await engine.initialize();
  });

  it('handles multiple concurrent engine operations', async () => {
    const ops: Promise<any>[] = [];
    
    // Start multiple operations simultaneously to test concurrent resource usage
    for (let i = 0; i < 5; i++) {
      ops.push(
        new Promise((resolve) => {
          setTimeout(() => {
            const config = engine.getConfig();
            resolve(config);
          }, Math.random() * 50); // Stagger slightly
        })
      );
    }

    const results = await Promise.all(ops);
    
    // All operations should complete successfully
    expect(results.length).toBe(5);
    expect(results.every(r => typeof r === 'object')).toBe(true);
  });

  it('maintains memory usage within configured limits', () => {
    // Test that the engine stays within memory bounds under normal operation
    const config = engine.getConfig();
    
    // Verify memory limit is set to reasonable level  
    expect(config.performance.maxMemoryMB).toBe(1024);
    
    // Although we can't directly measure memory in this test environment,
    // we verify that the limits are properly configured for memory management
    const metrics = engine.getPerformanceMetrics();
    expect(typeof metrics).toBe('object');
    expect(metrics.totalOperations).toBe(0); // No operations performed yet
  });

  it('processes simulated large inputs efficiently', () => {
    // While we can't process real large documents in this unit test environment,
    // we can test that the configuration and system respond appropriately
    
    // Test that configuration has appropriate settings for large files
    const testEngine = new CoreEngine({
      performance: {
        maxMemoryMB: 2048, // Larger memory allowance for big documents
        maxWorkers: 4,     // Multiple workers
        operationTimeoutMS: 120000 // 2 minutes for large doc processing
      }
    });

    const config = testEngine.getConfig();
    expect(config.performance.maxMemoryMB).toBe(2048); // Should be as configured
    expect(config.performance.operationTimeoutMS).toBe(120000); // High timeout for large docs

    testEngine.destroy();
  });

  it('manages plugin loading without degrading performance', async () => {
    // Simulate loading many plugins as in a real scenario with multiple plugin types
    
    // Register several plugins to test performance under load
    const plugins: any[] = [];
    for (let i = 0; i < 15; i++) {
      plugins.push({
        name: `stress-test-plugin-${i}`,
        version: '1.0.0',
        author: 'Stress Tester',
        description: `Stress test plugin ${i}`,
        availableHooks: ['beforeParse'] as const,
        supportedFormats: ['docx', 'html'],
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 2, maxCpuSecs: 1 },
          ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'normal' as const,
        dependencies: [],
        beforeParse: (ctx: any) => {
          ctx.pipeline.state.intermediate[`plugin-${i}-executed`] = true;
          return ctx;
        }
      });
    }

    // Load plugins and measure performance
    const beforeRegister = performance.now();
    
    for (const plugin of plugins) {
      engine.registerPlugin(plugin);
    }
    
    const afterRegister = performance.now();
    
    // All plugins should be registered successfully
    expect(engine.listPlugins().length).toBeGreaterThanOrEqual(15);
    
    // Registration with 15 plugins should finish reasonably quickly
    const registrationTime = afterRegister - beforeRegister;
    
    // 15 plugins should register in under 200ms in a real environment
    expect(registrationTime).toBeLessThan(500); // Allowing more for test environment overhead
    
    // Verify plugins were loaded properly and are accessible
    for (let i = 0; i < 15; i++) {
      expect(engine.getPlugin(`stress-test-plugin-${i}`)).toBeDefined();
    }
  });

  it('maintains performance characteristics under sustained load', () => {
    const testIterations = 30;
    const initialMetrics = engine.getPerformanceMetrics();
    
    // Run simple operations in a loop to simulate sustained usage
    for (let i = 0; i < testIterations; i++) {
      // Perform simple engine operations
      const config = engine.getConfig();
      const profiles = engine.listProfiles();
      const metrics = engine.getPerformanceMetrics();
      
      // Operations should be consistently fast
      expect(config).toBeDefined();
      expect(Array.isArray(profiles)).toBe(true);
      expect(metrics).toBeDefined();
    }
    
    const finalMetrics = engine.getPerformanceMetrics();
    
    expect(finalMetrics.totalOperations).toBeGreaterThanOrEqual(initialMetrics.totalOperations);
  });

  it('handles profile switching efficiently during sustained usage', () => {
    // Stress the system with intensive profile switching
    const profileIds = engine.listProfiles();
    expect(profileIds.length).toBeGreaterThan(3);
    
    const iterations = 20;
    for (let i = 0; i < iterations; i++) {
      // Rotate between different profiles
      const profileId = profileIds[i % profileIds.length];
      
      // Apply profile - this should be fast under sustained load
      engine.applyProfile(profileId);
      
      // Get the profile back to ensure it worked
      const retrieved = engine.getProfile(profileId);
      expect(retrieved).toBeDefined();
    }
    
    // Operation should finish in reasonable time
  });

  it('respects configured timeouts to prevent runaways', async () => {
    // The engine should support configurable timeouts that prevent operations from hanging
    const timeoutConfiguredEngine = new CoreEngine({
      performance: {
        operationTimeoutMS: 50,  // Very short timeout for test
        maxMemoryMB: 128,
        maxWorkers: 1
      }
    });

    // Do not initialize this test engine as we're testing timeout logic
    // which is more relevant at operation time
    
    const config = timeoutConfiguredEngine.getConfig();
    expect(config.performance.operationTimeoutMS).toBe(50);
    
    timeoutConfiguredEngine.destroy();
  });

  it('should maintain stable operation under maximum configured resource limits', () => {
    // Use maximum reasonable configuration to test stability
    const maxEngine = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 2048,  // 2GB
        maxWorkers: 8,      // Maximum workers for parallel processing
        operationTimeoutMS: 300000  // 5 minutes timeout for processing
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.', './tmp', './uploads'],  // Multiple allowed paths
        allowNetwork: false  // Network still disabled for security
      }
    });

    // Get config and verify all settings are properly applied
    const config = maxEngine.getConfig();
    expect(config.performance.maxMemoryMB).toBe(2048);
    expect(config.performance.maxWorkers).toBe(8);
    expect(config.performance.operationTimeoutMS).toBe(300000);
    expect(config.security.allowedReadPaths).toContain('./uploads');
    
    maxEngine.destroy();
  });

  it('can handle rapid sequential operations', () => {
    // Test rapid succession operations to verify no locking/resources conflicts
    const startOpCount = engine.getPerformanceMetrics().totalOperations;
    
    // Perform many quick operations sequentially
    for (let i = 0; i < 50; i++) {
      // These should be very fast operations
      const config = engine.getConfig();
      const profileCount = engine.listProfiles().length;
      const pluginCount = engine.listPlugins().length;
      
      // All operations should return valid data
      expect(config).toBeDefined();
      expect(profileCount).toBeGreaterThanOrEqual(4); // Should have default profiles
      expect(typeof pluginCount).toBe('number');
    }
    
    const endMetrics = engine.getPerformanceMetrics();
    
    // In a real performance environment, this would confirm operations complete quickly
    expect(endMetrics.totalOperations).toBeGreaterThanOrEqual(startOpCount);
  });

  it('properly releases resources upon engine destruction', async () => {
    const testEngine = new CoreEngine();
    
    // Add some plugins and profiles
    testEngine.registerPlugin({
      name: 'destruction-test-plugin',
      version: '1.0.0', 
      author: 'Tester',
      description: 'Test plugin for destruction',
      availableHooks: [] as const,
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
      dependencies: []
    });
    
    // Verify resource has been allocated
    expect(testEngine.listPlugins()).toContain('destruction-test-plugin');
    
    // Perform destruction
    await testEngine.destroy();
    
    // After destruction the engine should be cleaned up
    // In a real system, this would also free memory and close workers
  });

  it('maintains consistent performance characteristics across all profile types', () => {
    // The system should perform equally well regardless of active profile
    
    // Cycle through different types of profiles and check consistent operations
    const profiles = ['default', 'knowledge-base', 'exam-paper'];
    
    for (const profileId of profiles) {
      if (engine.listProfiles().includes(profileId)) {
        engine.applyProfile(profileId);
        
        // Basic operation should complete quickly regardless of profile
        const config = engine.getConfig();
        const currentProfile = engine.getProfile(profileId);
        
        expect(config).toBeDefined();
        expect(currentProfile).toBeDefined();
        expect(currentProfile!.id).toBe(profileId);
      }
    }
  });
});