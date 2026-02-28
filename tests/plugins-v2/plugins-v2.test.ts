/**
 * Enhanced Plugin System Tests
 * 
 * Tests for the new plugin system with lifecycle hooks.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PluginManagerImpl } from '../../src/plugins-v2/manager';
import { CoreEngine } from '../../src/engine/core';

describe('PluginManagerImpl', () => {
  let engine: CoreEngine;
  let pluginManager: PluginManagerImpl;

  beforeEach(() => {
    engine = new CoreEngine({ debug: false });
    pluginManager = new PluginManagerImpl(engine);
  });

  it('should initialize correctly without plugins', () => {
    expect(pluginManager).toBeDefined();
    expect(pluginManager.list()).toHaveLength(0);
  });

  it('should register and retrieve plugins', () => {
    const mockPlugin = {
      name: 'test-plugin',
      version: '1.0.0', 
      author: 'Test Author',
      description: 'A test plugin',
      availableHooks: ['beforeParse'] as const,
      supportedFormats: ['test'],
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

    pluginManager.register(mockPlugin);

    const plugins = pluginManager.list();
    expect(plugins).toContain('test-plugin');
    
    const retrievedPlugin = pluginManager.get('test-plugin');
    expect(retrievedPlugin).toBeDefined();
    expect(retrievedPlugin!.name).toBe('test-plugin');
    expect(retrievedPlugin!.version).toBe('1.0.0');
  });

  it('should validate plugins correctly', () => {
    // Valid plugin
    const validPlugin = {
      name: 'valid-plugin',
      version: '1.0.0',
      author: 'Author',
      description: 'Valid plugin',
      availableHooks: [] as const,
      supportedFormats: ['test'],
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
      dependencies: []
    };

    const isValid = pluginManager.validatePlugin(validPlugin);
    expect(isValid).toBe(true);

    // Invalid plugin (missing required fields)
    const invalidPlugin = {
      name: '', // no name
      version: '1.0.0',
      author: 'Author',
      description: 'No name plugin',
      availableHooks: [] as const,
      supportedFormats: ['test'],
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
      dependencies: []
    };

    const isInvalid = pluginManager.validatePlugin(invalidPlugin as any);
    expect(isInvalid).toBe(false);
  });

  it('should handle plugin priorities', () => {
    const highPriorityPlugin = {
      name: 'high-priority',
      version: '1.0.0',
      author: 'Author',
      description: 'High priority plugin',
      availableHooks: ['beforeParse'] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'high' as const,
      dependencies: [],
      beforeParse: (ctx: any) => ctx
    };

    const lowPriorityPlugin = {
      name: 'low-priority', 
      version: '1.0.0',
      author: 'Author',
      description: 'Low priority plugin',
      availableHooks: ['beforeParse'] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'low' as const,
      dependencies: [],
      beforeParse: (ctx: any) => ctx
    };

    pluginManager.register(highPriorityPlugin);
    pluginManager.register(lowPriorityPlugin);

    // Get plugins for 'beforeParse' hook and check their order
    const beforeParsePlugins = pluginManager.listForHook('beforeParse');
    expect(beforeParsePlugins).toHaveLength(2);
    
    // High priority should come first
    expect(beforeParsePlugins[0].name).toBe('high-priority');
    expect(beforeParsePlugins[1].name).toBe('low-priority');
  });

  it('should group plugins by hook', () => {
    const parsePlugin = {
      name: 'parse-plugin',
      version: '1.0.0',
      author: 'Author',
      description: 'Parse plugin',
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

    const transformPlugin = {
      name: 'transform-plugin',
      version: '1.0.0', 
      author: 'Author',
      description: 'Transform plugin',
      availableHooks: ['afterTransform'] as const,
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
      afterTransform: (ctx: any) => ctx
    };

    pluginManager.register(parsePlugin);
    pluginManager.register(transformPlugin);

    // Check plugins for each hook
    const beforeParsePlugins = pluginManager.listForHook('beforeParse');
    expect(beforeParsePlugins).toHaveLength(1);
    expect(beforeParsePlugins[0].name).toBe('parse-plugin');

    const afterTransformPlugins = pluginManager.listForHook('afterTransform');
    expect(afterTransformPlugins).toHaveLength(1);
    expect(afterTransformPlugins[0].name).toBe('transform-plugin');

    // Other hooks should have no plugins
    const afterParsePlugins = pluginManager.listForHook('afterParse');
    expect(afterParsePlugins).toHaveLength(0);
  });

  it('should handle plugin dependencies', () => {
    const dependencyPlugin = {
      name: 'dependency-plugin',
      version: '1.0.0',
      author: 'Author',
      description: 'Dependency plugin',
      availableHooks: [] as const,
      supportedFormats: ['test'],
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
      dependencies: []
    };

    const dependentPlugin = {
      name: 'dependent-plugin',
      version: '1.0.0',
      author: 'Author',
      description: 'Dependent plugin',
      availableHooks: [] as const,
      supportedFormats: ['test'],
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
      dependencies: ['dependency-plugin'] // Depends on the first plugin
    };

    pluginManager.register(dependencyPlugin);
    pluginManager.register(dependentPlugin);

    // Resolve dependencies for the dependent plugin
    const resolved = pluginManager.resolveDependencies(dependentPlugin);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].name).toBe('dependency-plugin');
  });

  it('should reject plugin registration when dependency is missing', () => {
    const dependentPlugin = {
      name: 'dependent-plugin-no-dep',
      version: '1.0.0',
      author: 'Author',
      description: 'Dependent plugin without dep',
      availableHooks: [] as const,
      supportedFormats: ['test'],
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
      dependencies: ['nonexistent-plugin'] // This plugin doesn't exist
    };

    expect(() => {
      pluginManager.register(dependentPlugin);
    }).toThrow('Dependency not found: nonexistent-plugin for plugin dependent-plugin-no-dep');
  });

  it('should handle plugin unregistration', () => {
    const plugin = {
      name: 'temp-plugin',
      version: '1.0.0',
      author: 'Author', 
      description: 'Temporary plugin',
      availableHooks: [] as const,
      supportedFormats: ['test'],
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
      dependencies: []
    };

    pluginManager.register(plugin);
    expect(pluginManager.list()).toContain('temp-plugin');

    const result = pluginManager.unregister('temp-plugin');
    expect(result).toBe(true);
    expect(pluginManager.list()).not.toContain('temp-plugin');

    // Try to unregister again should return false
    const duplicateResult = pluginManager.unregister('temp-plugin');
    expect(duplicateResult).toBe(false);
  });

  it('should validate permissions against engine policy', () => {
    // Setup an engine with restrictive settings
    const restrictiveEngine = new CoreEngine({
      security: {
        allowNetwork: false  // Network access disabled
      }
    } as any);

    const pluginManagerRestrictive = new PluginManagerImpl(restrictiveEngine);

    // Plugin requesting network access on a restrictive engine
    const networkPlugin = {
      name: 'network-plugin',
      version: '1.0.0',
      author: 'Author',
      description: 'Plugin with network access',
      availableHooks: [] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: true, // This should trigger the validation check
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: []
    };

    expect(() => {
      pluginManagerRestrictive.register(networkPlugin);
    }).toThrow('Plugin requests network access but engine restricts it');
  });
});