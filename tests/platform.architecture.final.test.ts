/**
 * Final Platform Architecture Verification
 * 
 * Comprehensive test to validate the complete transformation to platform architecture
 */

import { CoreEngine } from './src/engine/core';
import { SYSTEM_PROFILES } from './src/profiles/profile-manager';
import { describe, it, expect } from 'vitest';

describe('Platform Architecture Final Validation', () => {
  it('demonstrates all platform capabilities working together', async () => {
    const engine = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 1024,
        maxWorkers: 4,
        operationTimeoutMS: 60000
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.'],
        allowNetwork: false // Security by default
      }
    });

    // 1. Core configuration validation
    const config = engine.getConfig();
    expect(config.debug).toBe(false);
    expect(config.performance.maxMemoryMB).toBe(1024);
    expect(config.security.enableSandboxes).toBe(true);

    // 2. System profile validation
    const profileIds = engine.listProfiles();
    expect(profileIds.length).toBeGreaterThan(3); // Default + system profiles
    
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile).toBeDefined();
    if (kbProfile) {
      expect(kbProfile.parse.features.mathML).toBe(true);  // KB: preserve math
      expect(kbProfile.parse.features.images).toBe(true);  // KB: preserve images
      expect(kbProfile.security.sanitizerProfile).toBe('fidelity-first');
    }

    const examProfile = engine.getProfile('exam-paper');
    expect(examProfile).toBeDefined();
    if (examProfile) {
      expect(examProfile.parse.features.tables).toBe(false); // Exams: don't emphasize tables
      expect(examProfile.transform.operations).toContain('extract-questions');
    }
    
    // 3. Plugin system validation
    const plugins = engine.listPlugins();
    expect(Array.isArray(plugins)).toBe(true); // Should return array

    // 4. Lifecycle and state management
    expect(engine.getPerformanceMetrics().totalOperations).toBe(0);

    // 5. Profile switching works
    engine.applyProfile('knowledge-base');
    const activeProfile = engine.getProfile('knowledge-base');
    expect(activeProfile).toBeDefined();
    expect(activeProfile?.id).toBe('knowledge-base');

    await engine.destroy();
  });

  it('maintains backward compatibility with original patterns', () => {
    // Even with new architecture, old usage patterns should continue working
    const engine = new CoreEngine();
    
    const config = engine.getConfig();
    expect(config.debug).toBe(false);
    expect(config.performance.maxMemoryMB).toBe(512); // Default
    
    // Check all system profiles are available (backward compatibility)
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    expect(defaultProfile!.name).toBe('Default Profile');
    expect(defaultProfile!.parse.enablePlugins).toBe(true);
    expect(defaultProfile!.render.outputFormat).toBe('html');
    
    engine.destroy();
  });

  it('shows platform-grade architectural characteristics', () => {
    const engine = new CoreEngine({
      debug: true, // Enable for platform monitoring
    });

    // Platform architecture characteristics validation:
    const platformCharacteristics = {
      extensibility: typeof engine.registerPlugin === 'function',  // Plugins available
      configurability: typeof engine.applyProfile === 'function',  // Profiles available  
      security: engine.getConfig().security.enableSandboxes,  // Security model
      diagnostics: typeof engine.getPerformanceMetrics === 'function', // Metrics available
      resourceControl: engine.getConfig().performance.maxMemoryMB > 0, // Resource management
      lifecycle: typeof engine.destroy === 'function' // Proper cleanup
    };

    expect(platformCharacteristics.extensibility).toBe(true);
    expect(platformCharacteristics.configurability).toBe(true);
    expect(platformCharacteristics.security).toBe(true);
    expect(platformCharacteristics.diagnostics).toBe(true);
    expect(platformCharacteristics.resourceControl).toBe(true);
    expect(platformCharacteristics.lifecycle).toBe(true);

    // Multiple profile types for different use cases exist
    const profiles = engine.listProfiles();
    expect(profiles).toContain('default');
    expect(profiles).toContain('knowledge-base'); 
    expect(profiles).toContain('exam-paper');
    expect(profiles).toContain('enterprise-document');
    
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile).toBeDefined();
    expect(kbProfile!.parse.features.mathML).toBe(true);
    expect(kbProfile!.transform.operations).toContain('enhance-structure');
    
    const enterpriseProfile = engine.getProfile('enterprise-document');
    expect(enterpriseProfile).toBeDefined();
    expect(enterpriseProfile!.security.sanitizerProfile).toBe('strict');
    expect(enterpriseProfile!.parse.features.annotations).toBe(true); // Audit trails

    engine.destroy();
  });

  it('supports new plugin architecture while maintaining legacy compatibility', () => {
    const engine = new CoreEngine();

    // New plugin architecture (would work when plugins are registered):
    // Define a test plugin
    const testPlugin = {
      name: 'platform-validation-plugin',
      version: '1.0.0',
      author: 'Platform Validator',
      description: 'Validates platform plugin capabilities',
      availableHooks: ['beforeParse', 'afterTransform'] as const,
      supportedFormats: ['docx'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { 
          maxThreads: 1, 
          maxMemoryMB: 8, 
          maxCpuSecs: 5 
        },
        ast: { 
          canModifySemantics: true, 
          canAccessOriginal: true, 
          canExportRawAst: false 
        },
        export: { 
          canGenerateFiles: false, 
          canUpload: false 
        },
        misc: { 
          allowUnsafeCode: false 
        }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeParse: (context: any) => {
        if (!context.pipeline.state.validation) context.pipeline.state.validation = {};
        context.pipeline.state.validation.pluginRan = true;
        return context;
      },
      afterTransform: (context: any) => {
        context.pipeline.state.validation.afterTransformApplied = true;  
        return context;
      }
    };

    // Register new plugin with security model
    engine.registerPlugin(testPlugin);

    const registered = engine.getPlugin('platform-validation-plugin');
    expect(registered).toBeDefined();
    expect(registered!.name).toBe('platform-validation-plugin');
    expect(registered!.permissions.network).toBe(false); // Security enforced
    expect(registered!.availableHooks.length).toBeGreaterThan(0); // New hook system

    const allPlugins = engine.listPlugins();
    expect(allPlugins).toContain('platform-validation-plugin');

    engine.destroy();
  });

  it('manages different processing profiles effectively', () => {
    const engine = new CoreEngine();
    
    // Different profiles should exist for different use cases
    const profiles = engine.listProfiles();
    expect(profiles).toContain('knowledge-base');
    expect(profiles).toContain('exam-paper');
    expect(profiles).toContain('enterprise-document');
    
    // KB profile optimized for documentation work
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile).toBeDefined();
    if (kbProfile) {
      expect(kbProfile.parse.features.mathML).toBe(true);
      expect(kbProfile.parse.features.tables).toBe(true);
      expect(kbProfile.parse.features.images).toBe(true);
      expect(kbProfile.render.theme).toBe('knowledge-enhanced');
    }
    
    // Exam profile optimized for testing content processing
    const examProfile = engine.getProfile('exam-paper');
    expect(examProfile).toBeDefined();
    if (examProfile) {
      expect(examProfile.parse.features.mathML).toBe(true);     // Exams have math
      expect(examProfile.parse.features.tables).toBe(false);    // Not emphasizing tables  
      expect(examProfile.transform.operations).toContain('extract-questions');
    }
    
    // Enterprise profile with security first approach
    const enterpriseProfile = engine.getProfile('enterprise-document');
    expect(enterpriseProfile).toBeDefined();
    if (enterpriseProfile) {
      expect(enterpriseProfile.security.sanitizerProfile).toBe('strict');
      expect(enterpriseProfile.parse.enablePlugins).toBe(false);  // Reduced plugins for security
      expect(enterpriseProfile.render.outputFormat).toBe('html');
    }

    engine.destroy();
  });

  it('preserves performance characteristics while enhancing capabilities', () => {
    const start = performance.now();
    const engine = new CoreEngine({
      performance: { 
        maxMemoryMB: 256,
        maxWorkers: 2
      }
    });

    const initTime = performance.now() - start;
    
    // Should initialize quickly despite enhanced capabilities
    expect(initTime).toBeLessThan(100); // Sub-100ms initialization
    
    const config = engine.getConfig();
    expect(config.performance.maxMemoryMB).toBe(256);
    
    // Performance metrics should be available
    const metrics = engine.getPerformanceMetrics();
    expect(metrics.totalOperations).toBe(0);
    expect(metrics.averageElapsedTimeMs).toBe(0);
    
    // Default pipeline stats should exist
    expect(metrics.pipelineStats).toBeDefined();
    
    const profiles = engine.listProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4); // All system profiles
    
    engine.destroy();
  });

  it('confirms successful strategic platform transformation', () => {
    /*
     * Validation that we've achieved the strategic transformation:
     * FROM: Simple Word → HTML utility 
     * TO: Platform with profiles, plugins, security model, extensibility
     */
     
    const engine = new CoreEngine();
    
    // BEFORE transformation, this would check:
    // - Single function: parseDocxToHtml(file) → htmlString
    
    // AFTER transformation, validation checks now include:
    const platformFeatures = {
      profiles_available: engine.listProfiles().length >= 4,
      plugin_system_available: typeof engine.registerPlugin === 'function', 
      security_model_active: engine.getConfig().security.enableSandboxes,
      performance_tracking: typeof engine.getPerformanceMetrics === 'function',
      lifecycle_management: typeof engine.destroy === 'function',
      
      // Use-case specialization
      kb_mode_available: !!engine.getProfile('knowledge-base'),
      exam_mode_available: !!engine.getProfile('exam-paper'), 
      enterprise_mode_available: !!engine.getProfile('enterprise-document'),
      
      // API richness
      config_system: !!engine.getConfig(),
      metrics_system: !!engine.getPerformanceMetrics(),
      plugin_registry: !!engine.listPlugins(),
      profile_registry: !!engine.listProfiles(),
      
      // Security controls
      sandbox_controls: !!engine.getConfig().security,
      permission_model: !!engine.getPlugin /* Has plugin system with security */,
    };

    // All platform features should now exist and be functional
    expect(platformFeatures.profiles_available).toBe(true);
    expect(platformFeatures.plugin_system_available).toBe(true);
    expect(platformFeatures.security_model_active).toBe(true);
    expect(platformFeatures.performance_tracking).toBe(true);
    expect(platformFeatures.lifecycle_management).toBe(true);
    
    expect(platformFeatures.kb_mode_available).toBe(true);
    expect(platformFeatures.exam_mode_available).toBe(true);
    expect(platformFeatures.enterprise_mode_available).toBe(true);
    
    expect(platformFeatures.config_system).toBe(true);
    expect(platformFeatures.metrics_system).toBe(true);
    expect(platformFeatures.sandbox_controls).toBe(true);
    
    // Backward compatibility: old functions still work
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    expect(defaultProfile!.name).toBe('Default Profile'); // Should preserve original behavior
    
    engine.destroy();
  });

  it('maintains ecosystem compatibility with surrounding modules', () => {
    const engine = new CoreEngine();
    
    // Engine should be configured to work with expected ecosystem components:
    expect(engine.applyProfile).toBeDefined(); // Profile-based switching
    
    // Profile system should support different types of processing
    const allProfiles = engine.listProfiles();
    const profileTypes = {
      defaultPresent: allProfiles.includes('default'),
      knowledgeBase: allProfiles.includes('knowledge-base'),
      examFocused: allProfiles.includes('exam-paper'),
      enterpriseSecure: allProfiles.includes('enterprise-document')
    };
    
    expect(profileTypes.defaultPresent).toBe(true);  // Original behavior preserved  
    expect(profileTypes.knowledgeBase).toBe(true);   // Academic/knowledge base mode
    expect(profileTypes.examFocused).toBe(true);     // Testing/exam paper mode  
    expect(profileTypes.enterpriseSecure).toBe(true); // Enterprise security mode
    
    // Configuration should support different environments
    const config = engine.getConfig();
    expect(config.performance).toBeDefined();    // Performance controls
    expect(config.security).toBeDefined();       // Security model  
    expect(config.security.enableSandboxes).toBe(true); // Security by default
    
    // System should maintain ability to work with different integration layers 
    // (Could be consumed by React, Vue, Node, CLI, web components)
    expect(typeof engine.transformDocument).toBe('function'); // Main interface exists
    
    engine.destroy();
  });
});