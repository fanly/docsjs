/**
 * API Compatibility & Migration Tests
 * 
 * Tests to verify that the new engine can work alongside existing code
 * and provides clear migration patterns for API users.
 */

import { describe, it, expect } from 'vitest';
import { CoreEngine } from '../../src/engine/core';
import { SYSTEM_PROFILES } from '../../src/profiles/profile-manager';

describe('API Compatibility & Migration Patterns', () => {
  it('should allow graceful migration from simple API patterns', () => {
    // Simulate the old way of parsing a document
    // The new engine should support equivalent functionality
    
    // Old pattern probably looked like:
    // const html = await parseDocxToHtmlSnapshot(file);
    
    // New pattern should offer similar simplicity but with more power
    const engine = new CoreEngine();
    
    // Verify the new API offers equivalent functionality
    expect(typeof engine.transformDocument).toBe('function');
    
    // While not executable without an actual file in the test,
    // we can verify API signature and method availability
    engine.destroy();
  });

  it('should provide migration paths for common scenarios', () => {
    const engine = new CoreEngine();
    
    // Scenario 1: Parse DOCX and get HTML (old way)
    // This was likely a single function call
    // Old: parseDocxToHtmlSnapshot(file) -> HTML string
    // New: engine.applyProfile('default').transformDocument(file) -> ExportResult
    
    // Verify we have the profile needed to replicate old behavior
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile?.render.outputFormat).toBe('html');
    
    // Scenario 2: Apply different processing (like pasting vs uploading)
    // The new system does this through profiles
    engine.applyProfile('knowledge-base');  // For heavy-duty parsing
    expect(engine.getProfile('knowledge-base')).toBeDefined();
    
    engine.destroy();
  }); 

  it('should support hybrid usage patterns for gradual migration', () => {
    // Users might gradually move from old API to new API
    const engine = new CoreEngine();
    
    // The engine should be usable alongside both old and new patterns
    // during a transition period
    
    // Engine can be configured to match old behavior through profile system
    const config = engine.getConfig();
    expect(config.performance).toBeDefined();
    expect(config.security).toBeDefined();
    
    // The system should support the old behavior via default profile
    const defaultProfile = engine.getProfile('default');
    
    // Verify default profile maintains high-fidelity like old system
    if (defaultProfile) {
      expect(defaultProfile.security.sanitizerProfile).toBe('fidelity-first');
      expect(defaultProfile.parse.features.mathML).toBe(true);
      expect(defaultProfile.parse.features.tables).toBe(true);
      expect(defaultProfile.parse.features.images).toBe(true);
    }
    
    engine.destroy();
  });

  it('should allow plugins to be upgraded gradually', () => {
    const engine = new CoreEngine();
    
    // Old system might have had a simple plugin registration
    // New plugins can use old patterns wrapped for compatibility
    const oldStylePlugin = {
      // This would be an old plugin interface being adapted
      name: 'adaptive-plugin',
      version: '1.0.0',
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
      beforeParse: (context: any) => {
        // Old style processing in a new wrapper
        context.pipeline.state.intermediate.adaptedFromOldPattern = true;
        return context;
      }
    };

    // Should register with new system
    engine.registerPlugin(oldStylePlugin);
    
    const plugin = engine.getPlugin('adaptive-plugin');
    expect(plugin).toBeDefined();
    
    engine.destroy();
  });

  it('should support profile switching to replicate old conditional behavior', () => {
    const engine = new CoreEngine();
    
    // Old system might switch behavior dynamically
    // Like: if (source === 'paste') usePasteSettings else useUploadSettings
    
    // New system does this more explicitly via profiles:
    
    // Check that we have profiles for different scenarios
    expect(engine.getProfile('default')).toBeDefined();
    
    // For academic documents
    expect(engine.getProfile('exam-paper')).toBeDefined();
    
    // For complex business documents  
    expect(engine.getProfile('enterprise-document')).toBeDefined();
    
    // The engine should be flexible enough to support old heuristics
    // through appropriate profile selection
    
    engine.destroy();
  });

  it('maintains core functionality semantics', () => {
    // The new system should preserve semantic meaning of operations
    const engine = new CoreEngine();
    
    // Core operations should maintain their conceptual meanings:
    // - Parse: Extract meaning from input format
    // - Transform: Apply processing rules
    // - Render: Generate output in target format
    // - Export: Prepare for final use
    
    // These phases should be representable in the new system
    const defaultProfile = engine.getProfile('default');
    expect(defaultProfile).toBeDefined();
    
    if (defaultProfile) {
      // Should have parsing phase enabled by default
      expect(defaultProfile.parse.enablePlugins).toBe(true);
      
      // Should have transformation phase enabled
      expect(defaultProfile.transform.enablePlugins).toBe(true);
      
      // Should target reasonable output by default  
      expect(defaultProfile.render.outputFormat).toBe('html');
    }
    
    engine.destroy();
  });

  it('should allow configuration mapping from old to new settings', () => {
    // Example configuration migration map:
    // Old: { enableMathML: true, allowTables: false }
    // New: { parse: { features: { mathML: true, tables: false }}}
    
    const engine = new CoreEngine();
    
    // The system should be configurable to replicate old behavior
    const kbProfile = engine.getProfile('knowledge-base');
    expect(kbProfile?.parse.features.mathML).toBe(true); // KB profile keeps math
    expect(kbProfile?.parse.features.tables).toBe(true); // KB profile keeps tables
    
    // Check exam paper profile which de-emphasizes tables
    const examProfile = engine.getProfile('exam-paper');
    if (examProfile) {
      // Exam profile should match academic document handling
      expect(examProfile.parse.features.mathML).toBe(true); // Math still needed for exams
      // Images may be disabled in exam profile
    }
    
    engine.destroy();
  });

  it('preserves performance characteristics', () => {
    // The new engine should maintain performance expectations from the old version
    
    const engine = new CoreEngine({
      debug: true
    });
    
    const initialMetrics = engine.getPerformanceMetrics();
    expect(initialMetrics.totalOperations).toBe(0);
    expect(initialMetrics.averageElapsedTimeMs).toBeDefined();
    
    // Basic performance characteristics should be reasonable
    const config = engine.getConfig();
    
    // Should have reasonable defaults unlike very aggressive or conservative settings
    expect(config.performance.maxMemoryMB).toBeGreaterThan(64);
    expect(config.performance.maxMemoryMB).toBeLessThan(4096); // Not too much
    
    engine.destroy();
  });

  it('allows phased migration strategies', () => {
    // Organization can adopt new features gradually using profiles
    
    const engine = new CoreEngine();
    
    // Initially start with default behavior matching old system
    const defaultProfile = engine.getProfile('default');
    
    // Gradually introduce new features through specific profiles
    const customProf = {
      id: 'migrated-profile',
      name: 'Migration Phase Profile', 
      description: 'Profile for migration stage',
      parse: {
        enablePlugins: true,
        features: { mathML: true, tables: true, images: true, annotations: false },
        performance: { chunkSize: 1024000, maxFileSizeMB: 15 } // Conservative migration setting
      },
      transform: {
        enablePlugins: true,
        operations: ['normalize'] // Just the safe operations
      },
      render: {
        outputFormat: 'html',
        theme: 'default'
      },
      security: {
        allowedDomains: [],
        sanitizerProfile: 'fidelity-first' as const
      }
    };
    
    engine.registerProfile(customProf);
    
    const migratedProfile = engine.getProfile('migrated-profile');
    expect(migratedProfile).toBeDefined();
    expect(migratedProfile?.parse.performance.maxFileSizeMB).toBe(15);
    
    engine.destroy();
  });

  it('maintains diagnostic and error handling semantics', () => {
    const engine = new CoreEngine();
    
    // Errors and diagnostics should maintain logical consistency
    const metrics = engine.getPerformanceMetrics();
    expect(metrics.totalOperations).toBe(0);
    expect(metrics.averageElapsedTimeMs).toBeDefined();
    
    // Metrics naming and types should be meaningful for existing error handling code
    expect(typeof metrics.totalOperations).toBe('number');
    expect(typeof metrics.averageElapsedTimeMs).toBe('number');
    expect(metrics.pipelineStats).toBeDefined();
    
    engine.destroy();
  });
});