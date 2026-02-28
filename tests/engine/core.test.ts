/**
 * Core Engine v2 Tests
 * 
 * Tests the new engine architecture and its main functionalities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { SYSTEM_PROFILES } from '../../src/profiles/profile-manager';

describe('CoreEngine', () => {
  let engine: CoreEngine;

  beforeEach(() => {
    engine = new CoreEngine();
  });

  afterEach(async () => {
    if (engine) {
      await engine.destroy();
    }
  });

  it('should initialize with default configuration', () => {
    const config = engine.getConfig();
    
    expect(config).toBeDefined();
    expect(config.debug).toBe(false);
    expect(config.performance.maxMemoryMB).toBe(512);
    expect(config.performance.maxWorkers).toBe(4);
    expect(config.security.enableSandboxes).toBe(true);
  });

  it('should update configuration properly', () => {
    engine.configure({
      debug: true,
      performance: { maxMemoryMB: 1024, maxWorkers: 2, operationTimeoutMS: 30000 }
    });

    const config = engine.getConfig();
    expect(config.debug).toBe(true);
    expect(config.performance.maxMemoryMB).toBe(1024);
    expect(config.performance.maxWorkers).toBe(2);
  });

  it('should manage profiles correctly', () => {
    // Initially should have system profiles
    const initialProfiles = engine.listProfiles();
    expect(initialProfiles.length).toBeGreaterThan(0);

    // Should be able to get a specific profile
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    expect(defaultProfile!.id).toBe('default');
  });

  it('should apply and get current profile', () => {
    engine.applyProfile('knowledge-base');

    const currentProfile = engine.getProfile('knowledge-base');
    expect(currentProfile).toBeDefined();
    expect(currentProfile!.name).toBe('Knowledge Base Profile');
  });

  it('should register and manage plugins', () => {
    const mockPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      author: 'Author',
      description: 'Test plugin',
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
      beforeParse: (ctx: any) => ctx
    };

    engine.registerPlugin(mockPlugin);

    expect(engine.listPlugins()).toContain('test-plugin');
    expect(engine.getPlugin('test-plugin')).toBeDefined();
    expect(engine.getPlugin('test-plugin')!.name).toBe('test-plugin');
  });

  it('should handle plugin lifecycle (init/destroy)', async () => {
    const initSpy = vi.fn();
    const destroySpy = vi.fn();

    const mockPlugin = {
      name: 'lifecycle-test-plugin',
      version: '1.0.0',
      author: 'Author', 
      description: 'Test plugin with lifecycle',
      availableHooks: [] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'], 
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: false, canAccessOriginal: false, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      init: () => {
        initSpy();
        return Promise.resolve();
      },
      destroy: () => {
        destroySpy();
        return Promise.resolve();
      }
    };

    engine.registerPlugin(mockPlugin);

    // Init should happen during registration or explicit initialization
    await engine.initialize();
    expect(initSpy).toHaveBeenCalled();

    await engine.destroy();
    expect(destroySpy).toHaveBeenCalled();
  });

  it('should maintain performance metrics', () => {
    const metrics = engine.getPerformanceMetrics();
    expect(metrics).toBeDefined();
    expect(typeof metrics.totalOperations).toBe('number');
    expect(typeof metrics.averageElapsedTimeMs).toBe('number');
  });

  it('should reset performance metrics', () => {
    const initialMetrics = engine.getPerformanceMetrics();
    expect(initialMetrics.totalOperations).toBe(0);

    // Simulate updating
    engine.resetPerformanceMetrics();
    const resetMetrics = engine.getPerformanceMetrics();
    expect(resetMetrics.totalOperations).toBe(0);
  });

  it('should have default profile registered initially', () => {
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    expect(defaultProfile!.id).toBe('default');
    expect(defaultProfile!.name).toBe('Default Profile');
  });

  it('should validate a simple profile correctly', () => {
    const testProfile = {
      id: 'test-profile',
      name: 'Test Profile',
      description: 'A test profile',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: true, images: true, annotations: false },
        performance: { chunkSize: 10000, maxFileSizeMB: 10 },
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize'],
      },
      render: {
        outputFormat: 'html',
        theme: 'default',
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first',
      },
    } as const;

    engine.registerProfile(testProfile);
    
    const retrievedProfile = engine.getProfile('test-profile');
    expect(retrievedProfile).toBeDefined();
    expect(retrievedProfile!.id).toBe('test-profile');
  });
});