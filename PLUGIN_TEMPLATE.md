# 🔌 Plugin Development Template

This template demonstrates how to create a new DocsJS plugin with proper security considerations and lifecycle integration.

## 📄 Basic Plugin Template

Create `my-awesome-plugin.ts`:

```typescript
import type { 
  DocxPlugin, 
  PluginContext, 
  PluginPermissions,
  PluginPhase,
  PluginPriority  
} from '@coding01/docsjs';

/**
 * Awesome Content Enhancer Plugin
 * 
 * Adds enhanced processing capabilities to the document pipeline
 */
const awesomeContentPlugin: DocxPlugin = {
  // Core Identity
  name: 'awesome-content-enhancer',
  version: '1.0.0',
  author: 'Your Name',
  description: 'Enhances document content with awesomeness',
  
  // Lifecycle Hook Registration (Pick relevant hooks)
  availableHooks: [
    'beforeParse',      // Called before document parsing begins
    'afterParse',       // Called after document parsed to AST
    'beforeTransform',  // Called before AST transformations  
    'afterTransform',   // Called after AST transformations
    'beforeRender',     // Called before rendering to output
    'afterRender'       // Called after rendering completed
  ] as const,
  
  // Supported input formats 
  supportedFormats: ['docx', 'html'],
  
  // Security Permissions (IMPORTANT!)
  permissions: {
    // File system access (be restrictive!)
    read: ['.'],        // Only read from current directory  
    write: ['/tmp'],    // Only write to temp directory
    
    // Network - disable if not required!
    network: false,     // Disallow network in most cases
    
    // Compute resources (prevent resource abuse)
    compute: { 
      maxThreads: 1,           // Restrict computation threads 
      maxMemoryMB: 10,         // Limit memory usage
      maxCpuSecs: 5           // Time-bound operations
    },
    
    // AST access control (critical for document security)
    ast: {
      canModifySemantics: false,     // For read-only enhancement
      canAccessOriginal: true,       // Needed to read content 
      canExportRawAst: false        // Prevent AST exfiltration
    },
    
    // Export abilities (control output destinations)
    export: {
      canGenerateFiles: true,       // Can output files if needed
      canUpload: false              // Disallow uploads for simple enhancement
    },
    
    // Miscellaneous safety controls
    misc: { 
      allowUnsafeCode: false        // Never allow dangerous code execution
    }
  } as const,
  
  // Execution Priority (affects execution order)
  priority: 'normal' as const,  // 'lowest' | 'low' | 'normal' | 'high' | 'highest'
  
  // Dependencies (other plugins this requires)
  dependencies: [],  // Plugin names that must run first
  
  // === LIFECYCLE HOOK IMPLEMENTATIONS ===
  
  /**
   * Called before document parsing begins
   */
  beforeParse: (context: PluginContext) => {
    console.log('[Awesome Plugin] Beginning processing of:', context.fileInfo?.fileName);
    
    // Add metadata to the pipeline state for later stages
    if (!context.pipeline.state.intermediate.awesomePlugin) {
      context.pipeline.state.intermediate.awesomePlugin = {
        startedAt: Date.now(),
        featuresApplied: []
      };
    }
    
    return context;
  },
  
  /**
   * Called after document is parsed to AST
   */
  afterParse: (context: PluginContext) => {
    if (context.pipeline.state.ast) {
      // Inspect parsed AST and prepare for transformations
      const stats = context.pipeline.state.ast.metadata.stats || {};
      
      context.pipeline.state.intermediate.awesomePlugin.featuresDetected = {
        paragraphCount: stats.paragraphCount || 0,
        tableCount: stats.tableCount || 0,
        imageCount: stats.imageCount || 0
      };
    }
    
    return context;
  },
  
  /**
   * Called before AST transformations begin
   */
  beforeTransform: (context: PluginContext) => {
    // Apply transformations to enhance content
    if (context.pipeline.state.ast) {
      // Example: Enhance heading structure
      context.pipeline.state.intermediate.awesomePlugin.headingsEnhanced = true;
      
      // Modify context as needed but respect AST semantics
    }
    
    return context;
  },
  
  /**
   * Called after AST transformations are complete
   */
  afterTransform: (context: PluginContext) => {
    // Post-process transformation results
    if (context.pipeline.state.intermediate.awesomePlugin) {
      context.pipeline.state.intermediate.awesomePlugin.transitionsCompleted = {
        started: true,
        completed: true
      };
    }
    
    return context;
  },
  
  /**
   * Called before final rendering to output format
   */
  beforeRender: (context: PluginContext) => {
    // Prepare for rendering if needed
    if (context.pipeline.state.intermediate.awesomePlugin) {
      context.pipeline.state.intermediate.awesomePlugin.preparation = 'completed';
    }
    
    return context;
  },
  
  /**
   * Called after final rendering is complete
   */
  afterRender: (context: PluginContext) => {
    const state = context.pipeline.state;
    
    // Add any final post-processing before export
    if (state.intermediate.awesomePlugin) {
      state.intermediate.awesomePlugin.durationMs = Date.now() - (state.intermediate.awesomePlugin.startedAt || Date.now());
      state.intermediate.awesomePlugin.completed = true;
      
      // Add metadata to render output if needed
      state.metadata.awesomePluginVersion = '1.0.0';
    }
    
    return context;
  },
  
  /**
   * (Optional) Cleanup/resources before plugin unloading
   */
  destroy: () => {
    console.log('[Awesome Plugin] Cleaning up resources');
    // Cleanup any allocated resources if needed
  }
};

export default awesomeContentPlugin;
export { awesomeContentPlugin };
```

### Plugin Registration Usage:

```typescript
import { CoreEngine } from '@coding01/docsjs';
import awesomePlugin from './my-awesome-plugin';

const engine = new CoreEngine();

// Register your plugin
engine.registerPlugin(awesomePlugin);

// Use with confidence - security and lifecycle managed automatically
const result = await engine.transformDocument(inputFile);

// Your plugin will execute at the appropriate lifecycle stages
```

## 🎯 Hook Selection Guide

Select appropriate hooks based on what your plugin needs to accomplish:

| **Hook Stage** | **Purpose** | **Good For** | **AST State** |
|----------------|-------------|--------------|----------------|
| `beforeParse` | Pre-parse preparation | Logging, state initialization, file analysis | Not created yet |
| `afterParse` | AST inspection/post-processing | Content analysis, structure detection | Available, pristine |
| `beforeTransform` | AST modification prep | Transformation planning, rule preparation | Ready for transformations |
| `afterTransform` | AST validation/post-processing | Integrity checks, statistics | Transformed, finalized |
| `beforeRender` | Rendering preparation | Theme selection, formatting prep | Transformed, ready to render |
| `afterRender` | Output post-processing | Metadata enrichment, final touches | Converted to output format |

## 🔐 Security Guidelines

When defining permissions, follow these principles:

### 1. **Principle of Least Privilege**
```typescript
// ❌ Too permissive - NEVER do this
permissions: {
  read: ['/'],      // Global read access!
  write: ['/'],     // Global write access!  
  network: true,    // Full internet access!
  compute: { maxMemoryMB: 1024 }, // Massive memory allocation!
  ast: { canModifySemantics: true }, // Can alter document meaning!
  export: { canUpload: true } // Can send data out of system!
}

// ✅ Appropriate - Only the minimum necessary
permissions: {
  read: ['.'],      // Only current directory  
  write: ['/tmp'],  // Only temp directory
  network: false,   // No network access if not needed
  compute: { maxMemoryMB: 8, maxCpuSecs: 3 }, // Conservative limits
  ast: { 
    canModifySemantics: true,     // Only if actually modifying docs 
    canAccessOriginal: true,      // Required to process content
    canExportRawAst: false       // Prevent sensitive data exfiltration
  },
  export: { 
    canGenerateFiles: true,      // Only as needed
    canUpload: false            // Generally avoid uploads
  }
}
```

### 2. **AST Protection**
- Set `canModifySemantics: false` for read-only analysis plugins
- Set `canExportRawAst: false` to prevent sensitive document structure leak
- Use `canAccessOriginal: true` only when AST access is actually needed

### 3. **Resource Conservation** 
- Limit `maxMemoryMB` to 5-20MB for simple plugins
- Limit `maxCpuSecs` to 1-10 seconds for responsive systems
- Use `maxThreads: 1` unless parallelization is strictly necessary

## 🧪 Testing Your Plugin

Create `my-awesome-plugin.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CoreEngine } from '@coding01/docsjs';  
import awesomeContentPlugin from './my-awesome-plugin';

describe('Awesome Content Plugin', () => {
  let engine: CoreEngine;

  beforeEach(() => {
    engine = new CoreEngine({ debug: true });
    engine.registerPlugin(awesomeContentPlugin);
  });

  it('registers successfully with proper configuration', () => {
    const plugin = engine.getPlugin('awesome-content-enhancer');
    expect(plugin).toBeDefined();
    expect(plugin?.name).toBe('awesome-content-enhancer');
    expect(plugin?.version).toBe('1.0.0');
    expect(plugin?.permissions.read).toContain('.');
  });

  it('executes lifecycle hooks without breaking pipeline', async () => {
    // Even a fake document should process without plugin errors
    const plugin = engine.getPlugin('awesome-content-enhancer');
    
    // Verify all required hooks are present if declared
    for (const hook of awesomeContentPlugin.availableHooks) {
      expect(typeof (plugin as any)[hook]).toBe('function');
    }
    
    // Plugin shouldn't error the core engine
    expect(engine.listPlugins()).toContain('awesome-content-enhancer');
  });

  it('maintains security constraints', () => {
    const plugin = engine.getPlugin('awesome-content-enhancer');
    expect(plugin!.permissions.network).toBe(false);  // Security default
    expect(plugin!.permissions.ast.canExportRawAst).toBe(false);  // Data protection
  });

  afterEach(() => {
    engine.destroy();
  });
});
```

## 🚀 Publishing Your Plugin

### 1. Create Package Template
```json
{
  "name": "@your-org/docsjs-awesomeness-plugin",
  "version": "1.0.0", 
  "description": "Add awesomeness to DocsJS document processing",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["docsjs-plugin", "docx", "enhancement"],
  "dependencies": {
    "@coding01/docsjs": "^2.0.0"
  },
  "peerDependencies": { 
    "@coding01/docsjs": "^2.0.0"
  }
}
```

### 2. Plugin Index File
```typescript
// src/index.ts
export { default as awesomeContentPlugin } from './my-awesome-plugin';
export type { DocxPlugin } from '@coding01/docsjs';

// For convenience
export default awesomeContentPlugin;
```

### 3. Configuration Options (Optional)
Some plugins benefit from runtime configuration:

```typescript
// Extend your plugin to support options
type AwesomePluginOptions = {
  enableFeatureA: boolean;
  enableFeatureB: boolean;
  processingSpeed: 'fast' | 'balanced' | 'quality';
};

// Factory function for different configurations
export function createAwesomePlugin(config: Partial<AwesomePluginOptions> = {}) {
  const finalConfig: AwesePluginOptions = {
    enableFeatureA: true,
    enableFeatureB: true,  // defaults
    processingSpeed: 'balanced',
    ...config
  };
  
  return {
    ...awesomeContentPlugin,
    // Modify behavior based on config if needed
    beforeParse: (context: PluginContext) => {
      context.pipeline.state.intermediate.awesomeConfig = finalConfig;
      return awesomeContentPlugin.beforeParse!(context); 
    }
  };
}
```

## ⚡ Performance Considerations

- Plugins execute during document transformation - don't make them slow
- Process in batches where possible 
- Don't retain unnecessary memory beyond execution
- Use the compute limits to enforce efficiency

## 🎨 Popular Plugin Categories

### Content Enhancement Plugins
- Mathematical notation processors
- Diagram and chart converters  
- Citation and bibliography processors
- Table of contents generators

### Analysis & Reporting Plugins  
- Document statistics collectors
- Fidelity assessment tools
- Structure analyzers
- Compliance checkers

### Format Converters
- Custom AST to format translators
- Semantic content extractors  
- Media optimization processors

### Security Enhancers
- Content sanitizers
- Privacy processors
- Redaction tools
- Digital rights management

---

## 🏁 Ready to Build?

Create your first plugin by modifying the template above! Remember to maintain security standards, test thoroughly, and focus on one concern per plugin for better modularity and user experience.