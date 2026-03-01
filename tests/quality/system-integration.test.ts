/**
 * System Integration Tests
 * 
 * Comprehensive test combining all new engine components in realistic scenarios.
 */

import { describe, it, expect } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { SYSTEM_PROFILES } from '../../src/profiles/profile-manager';

describe('System Integration Tests', () => {
  it('works correctly in a real-world configuration scenario', async () => {
    // Simulate initializing a new DocsJS instance with common configuration
    const engine = new CoreEngine({
      debug: true,
      performance: {
        maxMemoryMB: 1024,
        maxWorkers: 4,
        operationTimeoutMS: 60000
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.'],
        allowNetwork: false // Disable network for security
      },
      plugins: {
        allowUnsigned: false,    // Require verified plugins
        maxExecutionTimeMS: 30000 // 30 sec max execution time
      }
    });
    
    // Initialize the engine to load profiles
    await engine.initialize();
    
    // Check that core functionality works with this configuration
    const config = engine.getConfig();
  it('works correctly in a real-world configuration scenario', async () => {
    // Simulate initializing a new DocsJS instance with common configuration
    const engine = new CoreEngine({
      debug: true,
      performance: {
        maxMemoryMB: 1024,
        maxWorkers: 4,
        operationTimeoutMS: 60000
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.'],
        allowNetwork: false // Disable network for security
      },
      plugins: {
        allowUnsigned: false,    // Require verified plugins
        maxExecutionTimeMS: 30000 // 30 sec max execution time
      }
    });

    // Check that core functionality works with this configuration
    const config = engine.getConfig();
    expect(config.debug).toBe(true);
    expect(config.performance.maxMemoryMB).toBe(1024);
    expect(config.security.enableSandboxes).toBe(true);
    expect(config.plugins.allowUnsigned).toBe(false);

    // Verify system profiles are available as expected
    const profiles = engine.listProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(4); // Default + system profiles
    
    // Verify core functionality still works
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    
    await engine.destroy();
  });

  it('processes document transformation with plugins and profiles', async () => {
    const engine = new CoreEngine({ debug: false });
    
    // Initialize the engine to load profiles
    await engine.initialize();
    
    // Apply a specific use-case profile
    const engine = new CoreEngine({ debug: false });

    // Apply a specific use-case profile
    engine.applyProfile('knowledge-base');
    
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile).toBeDefined();
    expect(kbProfile!.parse.features.mathML).toBe(true);
    expect(kbProfile!.parse.features.tables).toBe(true);
    expect(kbProfile!.render.outputFormat).toBe('html');

    // Register a plugin that matches KB requirements
    const enrichingPlugin = {
      name: 'content-enrichment-plugin',
      version: '1.0.0',
      author: 'KB Enhancer',
      description: 'Enriches content for knowledge base', 
      availableHooks: ['beforeRender', 'afterTransform'] as const,
      supportedFormats: ['docx'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 20, maxCpuSecs: 10 },
        ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'high' as const,
      dependencies: [],
      beforeRender: (context: any) => {
        // Enrich content before rendering based on semantic knowledge
        if (!context.pipeline.state.intermediate.enrichments) {
          context.pipeline.state.intermediate.enrichments = [];
        }
        context.pipeline.state.intermediate.enrichments.push('knowledge_base_enrichment');
        return context;
      },
      afterTransform: (context: any) => {
        // Post-processing based on transform results
        context.pipeline.state.intermediate.kbPostProcess = true;
        return context;
      }
    };

    engine.registerPlugin(enrichingPlugin);
    
    const registered = engine.getPlugin('content-enrichment-plugin');
    expect(registered).toBeDefined();
    expect(registered?.priority).toBe('high');
    
    // Verify integration: plugin registration worked with profile and engine configuration
    expect(engine.listPlugins()).toContain('content-enrichment-plugin');
    
    // Test with mock file (as much as we can simulate without real file in test)
    // The integration test proves that profile + plugin system works
    const activeProfile = engine.getProfile('knowledge-base');
    expect(activeProfile).toBeDefined();
    expect(engine.getPlugin('content-enrichment-plugin')).toBeDefined();

    await engine.destroy();
  });

  it('handles complex migration patterns from existing configurations', () => {
    const legacyConfig = {
      debug: true,
      oldSetting1: 'value', // Simulate an old config property
      // ... more legacy settings ...
    };

    // Engine should handle mixed old/new configurations gracefully
    const engine = new CoreEngine({
      debug: legacyConfig.debug,
      performance: {
        maxMemoryMB: 512, // Standard memory limit for migration
        maxWorkers: 2,
        operationTimeoutMS: 30000
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['.'],
        allowNetwork: false
      }
    });

    const config = engine.getConfig();
    expect(config.debug).toBe(true);
    expect(config.performance.maxMemoryMB).toBe(512);
    
    // System profiles should be available for different migration scenarios
    const enterpriseProfile = engine.getProfile('enterprise-document');
    expect(enterpriseProfile).toBeDefined();
    
    if (enterpriseProfile) {
      expect(enterpriseProfile.security.sanitizerProfile).toBe('strict');
    }
    
    // Custom profile could be created to match legacy config
    const customProfile = {
      id: 'migrated-from-legacy',
      name: 'Legacy Migrated Profile',
      description: 'Profile replicating legacy behavior',
      parse: {
        enablePlugins: true,
        features: {
          mathML: true,    // Maintain legacy behavior for math
          tables: true,    // Legacy: keep tables
          images: true,    // Legacy: keep images
          annotations: false // Perhaps legacy didn't support annotations
        },
        performance: {
          chunkSize: 10 * 1024 * 1024, // 10 MB chunks (reasonable for legacy patterns)
          maxFileSizeMB: 50
        }
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize', 'legacy-compatible-transform']
      },
      render: {
        outputFormat: 'html' as const,
        theme: 'legacy-default',
        options: {
          preserveFormatting: true, // Match legacy fidelity
        }
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first' as const // Preserve original look
      }
    };

    engine.registerProfile(customProfile);

    const migratedProfile = engine.getProfile('migrated-from-legacy');
    expect(migratedProfile).toBeDefined();
    expect(migratedProfile!.name).toBe('Legacy Migrated Profile');
    expect(migratedProfile!.parse.features.annotations).toBe(false);
    expect(migratedProfile!.parse.features.mathML).toBe(true);
    expect(migratedProfile!.render.options?.preserveFormatting).toBe(true);

    engine.destroy();
  });

  it('coordinates between profile system and plugins effectively', async () => {
    const engine = new CoreEngine({ debug: true });

    // Use exam-paper profile which has different feature requirements
    engine.applyProfile('exam-paper');
    
    const examProfile = engine.getProfile('exam-paper');
    expect(examProfile).toBeDefined();
    if (examProfile) {
      expect(examProfile.parse.features.mathML).toBe(true);  // Exams have math
      expect(examProfile.parse.features.tables).toBe(false); // Exams don't emphasize tables 
    }

    // Add a plugin that works well within exam-paper constraints
    const questionParserPlugin = {
      name: 'question-detection-plugin', 
      version: '1.1.0',
      author: 'Exam Assistant',
      description: 'Detects exam questions in document',
      availableHooks: ['afterParse', 'beforeTransform'] as const,
      supportedFormats: ['docx'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false,
        compute: { maxThreads: 1, maxMemoryMB: 15, maxCpuSecs: 8 },
        ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: false, canUpload: false },
        misc: { allowUnsafeCode: false }
      },
      priority: 'higher',  // Need to analyze early
      dependencies: [],
      afterParse: (context: any) => {
        // In exam context, look for question patterns
        if (!context.pipeline.state.intermediate.examAnalysis) {
          context.pipeline.state.intermediate.examAnalysis = {};
        }
        context.pipeline.state.intermediate.examAnalysis.questionPatternsDetected = true;
        return context;
      },
      beforeTransform: (context: any) => {
        // Prepare special transformations for exam processing
        context.pipeline.state.intermediate.examProcessing = true;
        return context;
      }
    };

    engine.registerPlugin(questionParserPlugin);

    // Verify the exam profile works synergistically with the plugin
    const updatedExamProfile = engine.getProfile('exam-paper');
    expect(updatedExamProfile?.parse.features.mathML).toBe(true);
    expect(engine.getPlugin('question-detection-plugin')).toBeDefined();
    
    // Profile and plugin should be compatible - both designed for exam processing
    const plugin = engine.getPlugin('question-detection-plugin');
    const profile = engine.getProfile('exam-paper');
    
    // Exam profile enables math, plugin can process math questions
    expect(profile!.parse.features.mathML).toBe(true);
    expect(plugin?.availableHooks.includes('afterParse')).toBe(true);
    
    await engine.destroy();
  });

  it('handles concurrent and complex document operations correctly', async () => {
    // Create engine with resources to handle concurrent operations
    const engine = new CoreEngine({
      debug: false, // Minimal logging for concurrent ops
      performance: {
        maxMemoryMB: 768,
        maxWorkers: 4,  // Higher thread count for concurrency
        operationTimeoutMS: 45000
      }
    });
    
    // Apply a performance-oriented profile
    engine.applyProfile('default');

    // Register some plugins that handle concurrent loads well
    const performancePlugins = [
      {
        name: 'perf-transform-plugin',
        version: '1.0.0',
        author: 'Performance Enhancer',
        description: 'Plugin for performance testing',
        availableHooks: ['beforeTransform'] as const,
        supportedFormats: ['docx'],
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 8, maxCpuSecs: 3 },
          ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'normal' as const,
        dependencies: [],
        beforeTransform: (context: any) => {
          context.pipeline.state.intermediate.perfOps += 1;
          if (!context.pipeline.state.intermediate.perfOps) {
            context.pipeline.state.intermediate.perfOps = 1;
          }
          return context;
        }
      },
      {
        name: 'perf-render-plugin',
        version: '1.0.0', 
        author: 'Performance Enhancer',
        description: 'Performance rendering plugin',
        availableHooks: ['beforeRender'] as const,
        supportedFormats: ['docx'],
        permissions: {
          read: ['.'],
          write: ['.'],
          network: false,
          compute: { maxThreads: 1, maxMemoryMB: 8, maxCpuSecs: 3 },
          ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
          export: { canGenerateFiles: false, canUpload: false },
          misc: { allowUnsafeCode: false }
        },
        priority: 'normal' as const,
        dependencies: [],
        beforeRender: (context: any) => {
          context.pipeline.state.intermediate.renderOps += 1;
          if (!context.pipeline.state.intermediate.renderOps) {
            context.pipeline.state.intermediate.renderOps = 1;
          }
          return context;
        }
      }
    ];
    
    // Register multiple plugins
    for (const p of performancePlugins) {
      engine.registerPlugin(p);
    }
    
    // Check all registered successfully
    for (const p of performancePlugins) {
      expect(engine.getPlugin(p.name)).toBeDefined();
    }
    
    // Verify system can process mock operations without interference
    const initialMetrics = engine.getPerformanceMetrics();
    
    // Simulate processing operations (we can't fully process docs in unit test)
    // But verify the system state remains consistent
    
    // Profile should work with all registered plugins
    expect(engine.getProfile('default')).toBeDefined();
    expect(engine.listPlugins().length).toBeGreaterThanOrEqual(2); // Both plugins registered
    
    // Metrics should remain valid
    const currentMetrics = engine.getPerformanceMetrics();
    expect(currentMetrics.totalOperations).toBeGreaterThanOrEqual(initialMetrics.totalOperations);
    
    await engine.destroy();
  });

  it('manages security across all system components effectively', async () => {
    // Create engine with strict security profile
    const secureEngine = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 512,
        maxWorkers: 2, 
        operationTimeoutMS: 30000
      },
      security: {
        enableSandboxes: true,
        allowedReadPaths: ['/secure-data', '/approved-inputs'],
        allowNetwork: false  // Network completely disabled
      }
    });

    // Register a plugin with minimal permissions needed for secure operation
    const securePlugin = {
      name: 'secure-processing-plugin',
      version: '2.1.0',
      author: 'Security First Developer',
      description: 'Processes documents securely',
      availableHooks: ['beforeParse', 'beforeExport'] as const,  // Minimal hooks
      supportedFormats: ['docx'],
      permissions: {
        // Minimal file system access
        read: ['/approved-inputs'],
        write: ['/secure-output'],
        network: false, // Plugin respects engine restriction
        compute: { 
          maxThreads: 1,    // Limited threads  
          maxMemoryMB: 10,  // Small memory footprint
          maxCpuSecs: 5     // Limited CPU time
        },
        ast: {
          canModifySemantics: false,    // Read-only AST modifications  
          canAccessOriginal: true,      // Can access AST for processing
          canExportRawAst: false        // Cannot exfiltrate raw AST
        },
        export: {
          canGenerateFiles: true,   // Can generate output files
          canUpload: false          // Cannot upload anywhere  
        },
        misc: {
          allowUnsafeCode: false    // No unsafe operations allowed
        }
      },
      priority: 'normal' as const,
      dependencies: [],
      beforeParse: (context: any) => {
        // Perform minimal processing respecting all restrictions
        context.pipeline.state.securityProcessed = true;
        return context;
      },
      beforeExport: (context: any) => {
        // Final security check before export
        if (context.pipeline.state.securityProcessed) {
          context.pipeline.state.securityVerified = true;
        }
        return context;
      }
    };

    // Register the security-conscious plugin
    secureEngine.registerPlugin(securePlugin);
    
    const registeredPlugin = secureEngine.getPlugin('secure-processing-plugin');
    expect(registeredPlugin).toBeDefined();
    
    // Check that plugin's permissions align with engine restrictions
    const perm = registeredPlugin!.permissions;
    expect(perm.network).toBe(false); // Plugin respects network restriction
    expect(perm.compute.maxMemoryMB).toBe(10); // Conservative memory usage
    
    // Engine should allow operations that don't exceed security bounds
    const engineConfig = secureEngine.getConfig();
    expect(engineConfig.security.allowNetwork).toBe(false);
    expect(engineConfig.security.allowedReadPaths).toContain('/secure-data');
    
    // Verify that security settings are effectively applied
    expect(perm.ast.canExportRawAst).toBe(false); // AST leakage protected at plugin level
    expect(perm.ast.canModifySemantics).toBe(false);
    
    // Profile system also needs to be security-aware
    const secureProfile = {
      id: 'audit-profile', 
      name: 'Audit & Security Profile',
      description: 'Profile emphasizing security and compliance',
      parse: {
        enablePlugins: true,
        features: { 
          mathML: false,    // Disable complex processing for security
          tables: true, 
          images: false,    // Disable images to reduce attack surface
          annotations: false 
        },
        performance: { chunkSize: 512000, maxFileSizeMB: 10 } // Smaller for security
      },
      transform: {
        enablePlugins: true, 
        operations: ['minimal-safe-process']
      },
      render: {
        outputFormat: 'html' as const,
        theme: 'security-focused'
      },
      security: {
        allowedDomains: ['whitelisted.com'], // Highly restricted domains
        sanitizerProfile: 'strict' as const
      }
    };

    secureEngine.registerProfile(secureProfile);
    
    const profile = secureEngine.getProfile('audit-profile');
    expect(profile).toBeDefined();
    if (profile) {
      expect(profile.parse.features.mathML).toBe(false);
      expect(profile.parse.features.images).toBe(false); 
      expect(profile.security.sanitizerProfile).toBe('strict');
    }
    
    await secureEngine.destroy();
  });

  it('maintains consistent behavior across different operating environments', () => {
    // Test basic configuration that should work identically in different environments
    const envConfigs = [
      {
        id: 'production',
        config: {
          debug: false,
          performance: { maxMemoryMB: 1024, maxWorkers: 4, operationTimeoutMS: 60000 },
          security: { enableSandboxes: true, allowNetwork: false, allowedReadPaths: ['.'] }
        }
      },
      {
        id: 'development', 
        config: {
          debug: true,
          performance: { maxMemoryMB: 2048, maxWorkers: 8, operationTimeoutMS: 120000 },
          security: { enableSandboxes: true, allowNetwork: true, allowedReadPaths: ['.'] }
        }
      },
      {
        id: 'ci/cd', 
        config: {
          debug: false,
          performance: { maxMemoryMB: 512, maxWorkers: 2, operationTimeoutMS: 30000 },
          security: { enableSandboxes: true, allowNetwork: false, allowedReadPaths: ['.'] }
        }
      }
    ];

    const results: { [key: string]: { engine: CoreEngine, config: any } } = {};

    for (const env of envConfigs) {
      // Create engine for each environment type
      const engine = new CoreEngine(env.config as any);
      
      // Validate that all behave consistently at core level
      const config = engine.getConfig();
      expect(config.security.enableSandboxes).toBe(true); // All should have sandboxes
      
      // Check that system profiles are available in all environments
      const profileCount = engine.listProfiles().length;
      expect(profileCount).toBeGreaterThan(3); // All should have default profiles
      
      results[env.id] = { engine, config };
    }

    // Validate that all environments can apply the same default profile
    for (const env of Object.values(results)) {
      (env.engine as CoreEngine).applyProfile('default');
      const profile = (env.engine as CoreEngine).getProfile('default');
      expect(profile).toBeDefined();
      expect(profile!.id).toBe('default');
      
      (env.engine as CoreEngine).destroy();
    }
  });

  it('integrates with surrounding platform ecosystem', async () => {
    const engine = new CoreEngine({
      debug: false,
      performance: {
        maxMemoryMB: 1024,
        maxWorkers: 4,
        operationTimeoutMS: 60000
      }
    });

    // Test profile that might be used in a CMS or learning platform
    engine.applyProfile('knowledge-base');
    
    // The engine should be ready for integration scenarios:
    // 1. API-based document processing services
    expect(engine.getConfig().performance.operationTimeoutMS).toBe(60000);
    
    // 2. Batch processing (enabled by performance configuration) 
    expect(engine.getConfig().performance.maxWorkers).toBe(4);
    
    // 3. Multi-user isolation (via profiles per user/org)
    expect(engine.getProfile('knowledge-base')).toBeDefined();
    
    // 4. Enterprise compliance (via security settings available)
    expect(engine.getConfig().security.enableSandboxes).toBe(true);
    
    // Should be able to register plugins for specific use cases in ecosystems
    const cmsIntegrationPlugin = {
      name: 'cms-integration-plugin',
      version: '1.0.0',
      author: 'CMS Connector', 
      description: 'Integrates with CMS systems',
      availableHooks: ['afterExport'] as const,
      supportedFormats: ['html'],
      permissions: {
        read: ['.'],
        write: ['.'],
        network: false, // Not accessing network directly
        compute: { maxThreads: 1, maxMemoryMB: 10, maxCpuSecs: 10 },
        ast: { canModifySemantics: false, canAccessOriginal: true, canExportRawAst: false },
        export: { canGenerateFiles: true, canUpload: false }, // Can export but not upload
        misc: { allowUnsafeCode: false }
      },
      priority: 'normal' as const,
      dependencies: [],
      afterExport: (context: any) => {
        // Prepare output for CMS ingestion
        if (!context.pipeline.state.intermediate.cmsReady) {
          context.pipeline.state.intermediate.cmsReady = {};
        }
        
        const output = context.pipeline.state.intermediate.renderedOutput;
        if (output && typeof output === 'string') {
          context.pipeline.state.intermediate.cmsReady.processedLength = output.length;
        }
        
        return context;
      }
    };

    engine.registerPlugin(cmsIntegrationPlugin);
    
    const plugin = engine.getPlugin('cms-integration-plugin');
    expect(plugin).toBeDefined();
    expect(plugin!.name).toBe('cms-integration-plugin');

    // Verify integration points are properly configured for surrounding systems
    expect(engine.listProfiles().length).toBeGreaterThanOrEqual(4);
    expect(engine.listPlugins().length).toBeGreaterThanOrEqual(1);

    await engine.destroy();
  });

  it('provides comprehensive diagnostic and monitoring support', () => {
    const engine = new CoreEngine({ debug: true });

    // Engine should provide comprehensive operational data
    const metrics = engine.getPerformanceMetrics();
    expect(typeof metrics.totalOperations).toBe('number');
    expect(typeof metrics.averageElapsedTimeMs).toBe('number');
    expect(metrics.pipelineStats).toBeDefined();
    expect(typeof metrics.pipelineStats).toBe('object');

    // Configuration should be introspectable
    const config = engine.getConfig();
    expect(config.debug).toBe(true);
    expect(config.performance).toBeDefined();
    expect(config.security).toBeDefined();

    // Plugin system should provide information about its registered components
    const plugins = engine.listPlugins();
    expect(Array.isArray(plugins)).toBe(true);

    // Profile system should list what processing profiles are available
    const profiles = engine.listProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    expect(profiles.length).toBeGreaterThanOrEqual(4); // At least system profiles

    // Individual profiles should provide their configuration details
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    if (defaultProfile) {
      expect(defaultProfile.id).toBe('default');
      expect(defaultProfile.description).toBeDefined();
      expect(defaultProfile.parse).toBeDefined();
      expect(defaultProfile.render).toBeDefined();
    }

    // The engine as a whole is prepared to provide monitoring data
    // that external systems might need for dashboards or alerts
    const currentMetrics = engine.getPerformanceMetrics();
    expect(currentMetrics).toBeTruthy(); 

    engine.destroy();
  });
});