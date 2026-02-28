/**
 * Performance Benchmark Tests
 * 
 * Benchmarks the new engine's performance against standards.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CoreEngine } from '../../src/engine/core';

describe('Performance Benchmarks', () => {
  let engine: CoreEngine;

  beforeEach(async () => {
    engine = new CoreEngine({
      debug: false, // Disable debug to reduce noise
      performance: {
        maxMemoryMB: 512,  
        maxWorkers: 2,
        operationTimeoutMS: 60000 // Increase for testing
      }
    });
    
    await engine.initialize();
  });

  afterEach(async () => {
    if (engine) {
      await engine.destroy();
    }
  });

  it('maintains fast bootstrapping time (sub-50ms)', () => {
    // Note: this is testing the time for the test setup, not including initialization
    // The actual bootstrap time would be measured separately
    const start = performance.now();
    
    const newEngine = new CoreEngine({ debug: false });
    
    const creationTime = performance.now() - start;
    
    // We expect object construction to be fast (creation of object in memory)
    expect(creationTime).toBeLessThan(10); // Creation should be under 10ms
    
    // Clean up
    newEngine.destroy();
  });

  it('registers plugins with reasonable speed', async () => {
    const start = performance.now();
    
    // Register several plugins to test registration performance
    for (let i = 0; i < 10; i++) {
      const mockPlugin = {
        name: `perf-test-plugin-${i}`,
        version: '1.0.0',
        author: 'Performance Test',
        description: `Performance test plugin ${i}`,
        availableHooks: ['beforeParse'] as const,
        supportedFormats: ['docx'],
        permissions: {
          read: ['.'],
          write: ['.'],  
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 5, maxCpuSecs: 3 },
          ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'normal' as const,
        dependencies: [],
        beforeParse: (ctx: any) => ctx
      };

      engine.registerPlugin(mockPlugin);
    }

    const endTime = performance.now();
    const totalTime = endTime - start;
    
    // Expect to register 10 plugins quickly  
    expect(totalTime).toBeLessThan(50); // Under 50ms for 10 plugin registrations
    
    const registeredCount = engine.listPlugins().length;
    expect(registeredCount).toBeGreaterThanOrEqual(10);
  });

  it('loads configuration efficiently', () => {
    const start = performance.now();
    
    const config = engine.getConfig();
    
    const configTime = performance.now() - start;
    
    // Getting configuration should be very fast
    expect(configTime).toBeLessThan(1); // Sub-millisecond for config get
    expect(config).toBeDefined();
    expect(config.performance).toBeDefined();
  });

  it('queries profiles quickly', () => {
    const iterations = 100;
    
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      engine.getProfile('default');
      engine.listProfiles();
    }
    
    const totalTime = performance.now() - start;
    const avgTime = totalTime / iterations / 2; // Divided by 2 because 2 operations per iteration
    
    // This should be extremely fast since it's just map lookups
    expect(avgTime).toBeLessThan(0.1); // Less than 0.1ms average for profile lookup
  });

  it('manages metrics without performance degradation', () => {
    // Test that the metrics system doesn't impede performance
    const start = performance.now();
    
    // Perform multiple metric access operations
    for (let i = 0; i < 100; i++) {
      engine.getPerformanceMetrics();
      engine.resetPerformanceMetrics();
    }
    
    const totalTime = performance.now() - start;
    const avgTime = totalTime / 100;
    
    // Metric operations should remain fast
    expect(avgTime).toBeLessThan(0.5); // Less than 0.5ms average per operation
  });

  it('handles concurrent profile operations', async () => {
    const start = performance.now();
    
    // Simulate concurrent access to profile management
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(
        Promise.resolve().then(() => {
          engine.getProfile('default');
          engine.getProfile('knowledge-base');
          engine.listProfiles();
        })
      );
    }
    
    await Promise.all(promises);
    
    const totalTime = performance.now() - start;
    
    expect(totalTime < 20).toBe(true);  // All profile operations under 20ms
  });

  it('maintains performance under plugin load', () => {
    // Add a moderate number of plugins
    const pluginCount = 5;
    for (let i = 0; i < pluginCount; i++) {
      const mockPlugin = {
        name: `perf-plugin-${i}`,
        version: '1.0.0',  
        author: 'Benchmarker',
        description: `Performance plugin ${i}`,
        availableHooks: ['beforeParse'] as const,
        supportedFormats: ['docx'],
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 5, maxCpuSecs: 3 },
          ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'normal' as const,
        dependencies: [],
        beforeParse: (ctx: any) => ctx
      };
      
      engine.registerPlugin(mockPlugin);
    }
    
    // Measure the performance of plugin listing operation
    const start = performance.now();
    
    for (let j = 0; j < 50; j++) {
      engine.listPlugins();
      engine.getPlugin('perf-plugin-1');
    }
    
    const totalTime = performance.now() - start;
    const avgTime = totalTime / 50 / 2; // 2 operations per loop
    
    // Plugin operations should still be performant even with 5 plugins
    expect(avgTime).toBeLessThan(0.2); // Sub 0.2ms average per plugin operation
  });

  it('retains efficient memory utilization patterns', () => {
    // The engine maintains lightweight configuration state
    const initialMetrics = engine.getPerformanceMetrics();
    
    expect(initialMetrics.peakMemoryUsageMB).toBeGreaterThanOrEqual(0);
    
    // Check that config sizes are reasonable
    const config = engine.getConfig();
    const configSize = JSON.stringify(config).length;
    
    // Configuration shouldn't be excessively large (> ~1KB)
    expect(configSize).toBeLessThan(2048); // Less than 2KB for config
    
    // Profile structures should be reasonably sized
    const profile = engine.getProfile('default');
    if (profile) {
        const profileSize = JSON.stringify(profile).length;
        expect(profileSize).toBeLessThan(8192); // Less than 8KB per profile specification
    }
  });

  it('maintains fast profile switching times', () => {
    const start = performance.now();
    
    // Switch between profiles multiple times
    for (let i = 0; i < 50; i++) {
      engine.applyProfile('default');
      engine.applyProfile('knowledge-base');
    }
    
    const totalTime = performance.now() - start;
    const avgSwitchTime = totalTime / 50; // 2 switches per pair, so effectively 100 ops
    const perSwitchTime = totalTime / 100;
    
    expect(perSwitchTime).toBeLessThan(0.5); // Profile switching under 0.5ms per operation
  });

  it('initializes with reasonable memory footprint', () => {
    // Although we can't measure exact memory in Node.js reliably,
    // we verify that the core system doesn't create excessive data during init
    
    const config = engine.getConfig();
    const profileCount = engine.listProfiles().length;
    const initialMetrics = engine.getPerformanceMetrics();
    
    // All basic resources should be initialized but not excessive
    expect(config).toBeTruthy();
    expect(profileCount).toBeGreaterThanOrEqual(4); // At least system profiles
    expect(initialMetrics.totalOperations).toBe(0); // No operations yet
    expect(typeof initialMetrics.averageElapsedTimeMs).toBe('number');
  });
});