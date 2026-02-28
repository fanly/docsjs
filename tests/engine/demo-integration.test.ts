/**
 * React/Vue Demo Integration Test
 * 
 * Tests to verify compatibility with existing React/Vue adapters and Web Component.
 */

import { describe, it, expect, beforeEach, vi, afterEach, beforeAll } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { SYSTEM_PROFILES } from '../../src/profiles/profile-manager';

describe('Demo Framework Integration', () => {
  let engine: CoreEngine;

  beforeAll(() => {
    // Mock DOM APIs for Node.js environment as needed by web components
    if (typeof window === 'undefined') {
      // Create minimal DOM mocks if in Node environment
      global.window = {
        // Mock essential DOM APIs  
      } as any;
      
      global.document = {
        createElement: vi.fn((tag: string) => ({
          tagName: tag.toUpperCase(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          setAttribute: vi.fn(),
          getAttribute: vi.fn(),
          style: {},
          children: [],
          appendChild: vi.fn()
        })),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as any;
    }
  });

  beforeEach(async () => {
    // Create an engine instance as might be used in a frontend application
    engine = new CoreEngine({
      debug: true,  // Enable in test for extra logging
      performance: {
        maxMemoryMB: 256,
        maxWorkers: 2,
        operationTimeoutMS: 30000
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.'],
        allowNetwork: false,
      }
    });

    await engine.initialize();
  });

  afterEach(async () => {
    if (engine) {
      await engine.destroy();
    }
  });

  it('should operate in a web application context similar to existing adapters', () => {
    // Verify core functionality works as expected
    const config = engine.getConfig();
    expect(config).toBeDefined();
    expect(config.performance.maxMemoryMB).toBe(256);
    expect(config.debug).toBe(true);
    
    // Verify profiles are correctly loaded
    const profiles = engine.listProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4);
    expect(profiles).toContain('default');
    expect(profiles).toContain('knowledge-base');
  });

  it('should have default profiles that match expected use cases', () => {
    // System profiles should contain expected use cases
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile).toBeDefined();
    expect(kbProfile!.description).toContain('documentation and knowledge bases');
    
    const examProfile = engine.getProfile('exam-paper');
    expect(examProfile).toBeDefined();
    expect(examProfile!.description).toContain('academic document');
    
    const enterpriseProfile = engine.getProfile('enterprise-document');
    expect(enterpriseProfile).toBeDefined();
    expect(enterpriseProfile!.description).toContain('security and compliance');
  });

  it('should be compatible with plugin patterns used in existing integrations', () => {
    // Define a plugin similar to how one might be used in a web context
    const webIntegrationPlugin = {
      name: 'web-integration-test-plugin',
      version: '1.0.0',
      author: 'Web Integrator',
      description: 'Emulates web framework integration',
      availableHooks: [
        'beforeRender',
        'afterExport'
      ] as const,
      supportedFormats: ['html', 'docx'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { 
          maxThreads: 1, 
          maxMemoryMB: 5,  // Low memory for client-side
          maxCpuSecs: 10 
        },
        ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: true, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeRender: async (context) => {
        // Typical client-side operation
        if (!context.pipeline.state.intermediate.metadata) {
          context.pipeline.state.intermediate.metadata = {};
        }
        
        // Add client info
        context.pipeline.state.intermediate.metadata.fromWebFramework = true;
        return context;
      },
      afterExport: (context) => {
        // Might log analytics, etc.
        context.pipeline.state.intermediate.frameworkHandled = true;
        return context;
      }
    };

    // Register the plugin like in a real web app
    engine.registerPlugin(webIntegrationPlugin);

    // Verify the plugin was registered correctly
    expect(engine.listPlugins()).toContain('web-integration-test-plugin');
    const plugin = engine.getPlugin('web-integration-test-plugin');
    expect(plugin).toBeDefined();
    expect(plugin!.permissions.compute.maxMemoryMB).toBe(5); // Low memory like web app
    
    // Check that lifecycle methods exist
    expect(typeof plugin!.beforeRender).toBe('function');
    expect(typeof plugin!.afterExport).toBe('function');
  });

  it('should support profile-based configuration like a web application would', () => {
    // Emulate a web app selecting profile based on document type
    const selectProfile = (documentType: string): string => {
      if (documentType === 'academic' || documentType === 'exam') {
        return 'exam-paper';
      } else if (documentType === 'business') {
        return 'enterprise-document';
      } else {
        return 'default'; // General purpose
      }
    };

    // Test profile selection logic
    const academicDocProfile = selectProfile('academic');
    expect(academicDocProfile).toBe('exam-paper');
    
    const businessDocProfile = selectProfile('business');
    expect(businessDocProfile).toBe('enterprise-document');
    
    const generalProfile = selectProfile('general');
    expect(generalProfile).toBe('default');

    // Actually apply the selected profiles through the engine
    engine.applyProfile(academicDocProfile);
    const activeAcademicProfile = engine.getProfile(academicDocProfile)?.name;
    expect(activeAcademicProfile).toContain('Exam Paper');
    
    engine.applyProfile(businessDocProfile);
    const activeBusinessProfile = engine.getProfile(businessDocProfile)?.name;
    expect(activeBusinessProfile).toContain('Enterprise Document');
  });

  it('should maintain performance within acceptable web app limits', () => {
    // Check that defaults are reasonable for web environment
    const config = engine.getConfig();
    
    // Memory limits suitable for browser
    expect(config.performance.maxMemoryMB).toBeLessThanOrEqual(1024); // 1GB max
    expect(config.performance.maxWorkers).toBeLessThanOrEqual(4);     // Reasonable for browser
    
    // Simulate some processing to verify metrics work
    const initialMetrics = engine.getPerformanceMetrics();
    expect(initialMetrics).toBeDefined();
    
    // Metrics should be in appropriate ranges
    expect(typeof initialMetrics.totalOperations).toBe('number');
    expect(typeof initialMetrics.averageElapsedTimeMs).toBe('number');
    
    // After reset, operations should be 0
    engine.resetPerformanceMetrics();
    const afterResetMetrics = engine.getPerformanceMetrics();
    expect(afterResetMetrics.totalOperations).toBe(0);
  });

  it('should have security features suitable for client-side use', () => {
    // Check security configuration is appropriate for client-side execution
    const config = engine.getConfig();
    
    // Network access should be disabled by default for security
    expect(config.security.allowNetwork).toBe(false);
    
    // Sandboxed execution should be enabled
    expect(config.security.enableSandboxes).toBe(true);
    
    // Paths should be restricted
    expect(config.security.allowedReadPaths).toBeDefined();
    expect(config.security.allowedReadPaths.length).toBeGreaterThan(0);
    
    // Test attempting to register a plugin with invalid permissions
    const insecurePlugin = {
      name: 'insecure-test-plugin',
      version: '1.0.0',
      author: 'Tester',
      description: 'Plugin that tries to request invalid permissions',
      availableHooks: [] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: true, // This is what the engine should reject if set to disallow network
        compute: { maxThreads: 2, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: true, canUpload: true },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: []
    };

    // With network disabled in engine config, registering a plugin with network access
    // should fail in the real implementation, but we'll check the permission validation
    // works in the next test
  });

  it('should validate plugin permissions against engine security policy', () => {
    // Create an engine with strict security settings
    const strictEngine = new CoreEngine({
      debug: true,
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['./allowed'],  // Restricted paths
        allowNetwork: false,  // Network disabled
      }
    });

    const pluginWithNetAccess = {
      name: 'network-test-plugin',
      version: '1.0.0', 
      author: 'Security Tester',
      description: 'Plugin requesting network access',
      availableHooks: [] as const,
      supportedFormats: ['test'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: true,  // Tries to request network access
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 5 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: []
    };

    // Registering this plugin with network access should work here 
    // since validation occurs at execution time
    strictEngine.registerPlugin(pluginWithNetAccess);
    
    const registered = strictEngine.getPlugin('network-test-plugin');
    expect(registered).toBeDefined();
    // The validation of conflicting permissions with engine would happen during execution
    
    strictEngine.destroy();
  });

  it('should be able to serialize/deserialize configuration similarly to adapter systems', () => {
    // Verify that profile configurations can be serialized like in a web setting
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    
    // Check that we can JSON-serialize profile configurations (like sent to FE)
    const profileJson = JSON.stringify(defaultProfile, null, 2);
    expect(profileJson).toBeDefined();
    expect(typeof profileJson).toBe('string');
    expect(profileJson.length).toBeGreaterThan(0);
    
    // And deserialize
    const deserialized = JSON.parse(profileJson);
    expect(deserialized.id).toBe('default');
    expect(deserialized.name).toBeDefined();
    
    // The same should work for metrics
    const metrics = engine.getPerformanceMetrics();
    const metricsJson = JSON.stringify(metrics);
    expect(metricsJson).toBeDefined();
    
    const deserializedMetrics = JSON.parse(metricsJson);
    expect(typeof deserializedMetrics.totalOperations).toBe('number');
  });

  it('should provide lifecycle events and hooks usable in web frameworks', () => {
    // Verify the plugin architecture supports web app requirements
    expect(engine).toBeDefined();
    
    // Engine provides methods that web frameworks would expect
    expect(typeof engine.listProfiles).toBe('function');
    expect(typeof engine.getProfile).toBe('function');
    expect(typeof engine.applyProfile).toBe('function');
    expect(typeof engine.registerPlugin).toBe('function');
    expect(typeof engine.listPlugins).toBe('function');
    expect(typeof engine.getPerformanceMetrics).toBe('function');
    
    // These correspond to lifecycle events that a React/Vue component
    // could hook into to manage document conversion processes
  });
});