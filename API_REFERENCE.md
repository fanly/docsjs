# 📘 DocJS v2 API Reference

Complete reference for the new platform-grade API architecture.

## **Engine Core**

### **CoreEngine**

The central orchestration engine that coordinates all document transformation components.

#### **Constructor**
```typescript
new CoreEngine(config?: CoreConfig)

interface CoreConfig {
  debug?: boolean;                          // Enable detailed logging
  performance?: {                          // Runtime limits
    maxMemoryMB?: number;                   // Maximum engine memory (default: 512MB)
    maxWorkers?: number;                    // Parallel operation threads (default: 4)  
    operationTimeoutMS?: number;            // Max operation time (default: 30000ms)
  }
  security?: {                            // Security policy
    enableSandboxes?: boolean;              // Enable plug-in sandboxes (default: true) 
    allowedReadPaths?: string[];            // Safe paths for plug-ins (default: ['.')
    allowNetwork?: boolean;                 // Enable network access globally (default: false)
  }
  plugins?: {
    allowUnsigned?: boolean;                // Allow unverified plugins (default: false)
    maxExecutionTimeMS?: number;            // Plugin time limit (default: 30000ms)
    disableAll?: boolean;                   // Entire plug-in system (default: false)
  }
}
```

#### **Properties**
```typescript
engine.getConfig(): CoreConfig              // Current config
engine.getPerformanceMetrics(): Metrics     // Resource usage stats
engine.isActive(): boolean                 // Whether engine ready
```

#### **Engine Lifecycle Methods**
```typescript
async engine.initialize(): Promise<void>    // Initialize engine (auto-called)

engine.applyConfig(config: Partial<CoreConfig>): void  // Update runtime config 

const result: TransformResult = await engine.transformDocument(
  input: FileOrBuffer,                    // Input file/buffer/object
  options?: TransformOptions              // Processing options
)

interface TransformOptions {
  profileId?: string;                     // Use named profile
  plugins?: string[];                     // Subset of active plugs
  includeReport?: boolean;                // Return detailed report
  abortSignal?: AbortSignal;              // Cancel processing
}
```

#### **Profile Management**
```typescript
// Get list of available profiles
engine.listProfiles(): string[]

// Get specific profile 
const profile: Profile | undefined = engine.getProfile(profileId)

// Apply processing profile (changes engine behavior) 
engine.applyProfile(profileId: string): void

// Define custom profile
engine.registerProfile(profile: ProfileDefinition): void

interface ProfileDefinition {
  id: string;                             // Profile identifier
  name: string;                           // Display name  
  description: string;                    // Purpose description
  
  parse: {
    enablePlugins?: boolean;              // Enable parse-level plugs
    features: {                          // Feature settings
      mathML: boolean;                    // Process Math formulas
      tables: boolean;                    // Process tables  
      images: boolean;                    // Process images
      annotations: boolean;               // Process comments/notes
    },
    performance: {                       // Resource settings  
      chunkSize?: number;                 // Processing chunk size
      maxFileSizeMB?: number;             // Size limit (default: 25MB)
    }
  },
  
  transform: {
    enablePlugins?: boolean;              // Enable transform plugs
    operations: string[];                 // Enabled operations  
  },
  
  render: {
    outputFormat: 'html' | 'markdown' | 'json';  // Output format
    theme?: string;                       // Styling theme
    options?: Record<string, any>;        // Format-specific options
  },
  
  security: {
    allowedDomains?: string[];            // Trusted content domains  
    sanitizerProfile: 'fidelity-first' | 'strict' | 'none'; // Content sanitizion
  }
}
```

#### **Plugin Management** 
```typescript
// Register new plugin
engine.registerPlugin(plugin: DocxPlugin): void

// Get plugin instance
const plugin: DocxPlugin | undefined = engine.getPlugin(pluginName)  

// Get all enabled plugins
const pluginIds: string[] = engine.listPlugins()

// Get all plugins supporting specific hook
const plugins: DocxPlugin[] = engine.getPluginsForPhase(phase: PluginPhase)
```

#### **Performance Management**
```typescript
const metrics: PerformanceMetrics = engine.getPerformanceMetrics()

interface PerformanceMetrics {
  totalOperations: number;                // Total ops since startup
  averageElapsedTimeMs: number;           // Avg processing time
  peakMemoryUsageMB: number;              // Highest memory seen
  pipelineStats: {
    parseMs: number;                       // Parsing time
    transformMs: number;                   // Processing time  
    renderMs: number;                      // Rendering time
    totalOps: number;                      // Operations processed
  }
}

// Reset counters
engine.resetPerformanceMetrics(): void
```

#### **Resource Management**
```typescript  
// Clean up all resources (call before disposal)
async engine.destroy(): Promise<void>
```

---

## **Plugin System API**

### **DocxPlugin Interface**

Complete interface definition for plugins compatible with the 8-lifecycle hook system.

```typescript
interface DocxPlugin {
  // Identity
  readonly name: string;                   // Unique identifier
  readonly version: string;                // SemVer version
  readonly author: string;                 // Developer name
  readonly description: string;            // Brief description
  
  // Supported hooks 
  availableHooks: readonly DocxPluginHook[];  // Lifecycle hooks implemented
  
  // Processing capabilities  
  supportedFormats: readonly string[];     // e.g., ['docx', 'html']
  
  // Security permissions (mandatory!)
  permissions: PluginPermissions;
  
  // Execution order priority
  priority: PluginPriority;                //'lowest'|'low'|'normal'|'high'|'highest' 
  
  // Dependencies (other plugins required)  
  dependencies?: readonly string[];        // Must be loaded first
  
  // Lifecycle hooks - optional, only implement those needed
  
  beforeParse?: (context: PluginContext) => PluginContext | Promise<PluginContext>;
  afterParse?: (context: PluginContext) => PluginContext | Promise<PluginContext>;  
  beforeTransform?: (context: PluginContext) => PluginContext | Promise<PluginContext>;
  afterTransform?: (context: PluginContext) => PluginContext | Promise<PluginContext>;
  beforeRender?: (context: PluginContext) => PluginContext | Promise<PluginContext>;
  afterRender?: (context: PluginContext) => PluginContext | Promise<PluginContext>;
  beforeExport?: (context: PluginContext) => PluginContext | Promise<PluginContext>;
  afterExport?: (context: PluginContext) => PluginContext | Promise<PluginContext>;
  
  // Lifecycle callbacks (optional)
  init?: (engineContext: EngineContext) => void | Promise<void>;      // On registration
  destroy?: () => void;                                             // On engine destroy
}

interface PluginPermissions {
  read: readonly string[];                 // Allow read paths (e.g., ['.'])
  write: readonly string[];                // Allow write paths  
  network: boolean;                        // Enable network access?
  
  // Computational constraints
  compute: {
    maxThreads: 1;                         // Limited parallel processing
    maxMemoryMB: number;                   // Memory cap (e.g., 10)  
    maxCpuSecs: number;                    // Time limit (e.g., 5)
  };
  
  // AST security controls
  ast: {
    canModifySemantics: boolean;           // Alter document meaning?
    canAccessOriginal: boolean;            // Full AST read access?  
    canExportRawAst: boolean;              // Exfiltrate raw tree?
  };
  
  // Export restrictions
  export: {
    canGenerateFiles: boolean;             // Local file creation?              
    canUpload: boolean;                    // Network upload?
  };
  
  misc: {
    allowUnsafeCode: boolean;              // Dangerous operations? (should be false)
  }
}

type PluginPriority = 'lowest' | 'low' | 'normal' | 'high' | 'highest';
type DocxPluginHook = 
  | 'beforeParse' | 'afterParse' 
  | 'beforeTransform' | 'afterTransform'  
  | 'beforeRender' | 'afterRender'
  | 'beforeExport' | 'afterExport';

interface PluginContext {
  pipelineState: PipelineState;            // Current pipeline state
  fileInfo: FileMetadata;                  // Input file information
  engine: CoreEngine;                      // Engine reference  
  plugin: DocxPlugin;                      // Calling plugin reference
}

interface PipelineState {
  ast?: DocumentAST;                      // Document Abstract Syntax Tree
  intermediate: Record<string, any>;      // Plugin-specific data
  errors: string[];                       // Processing errors  
  warnings: string[];                     // Processing warnings
  metadata: {
    source: string;                       // File name/source
    byteCount: number;                    // File size
    parseTimeMs: number;                  // Parsing duration
    [key: string]: any
  }
}
```

---

## **AST Core API**

### **DocumentAST v2 Interface**

Semantic representation of document contents with full structural fidelity.

```typescript
interface DocumentAST {
  readonly type: 'document';
  readonly id: string;                    // Unique AST identifier
  readonly version: '2.0.0';              // AST schema version
  
  metadata: {
    sourceFormat: string;                 // Original format ID (e.g., 'docx-Office365')  
    parseTimestamp: number;               // When creation started
    processedFeatures: string[];          // Detected features in source
    wordFeatures: {                       // Specific Word feature counts  
      mathMLElements: number;
      tables: number;
      images: number;
      equations: number;
      footnotes: number;
      endnotes: number;  
      comments: number;
    };
  };
  
  properties: DocumentProperties;         // Document-level properties
  
  styles: StyleDefinition[];             // Global style definitions
  
  // Main document content
  children: SectionNode[];                // Top-level sections
  
  // Associated content
  auxiliary?: AuxiliaryContent;           // Footnotes, comments, etc.
}

// AST Node Base Interface
interface ASTNode {
  readonly type: string;                  // Node type discriminator
  readonly id: string;                    // Unique node identifier  
  readonly attributes?: Record<string, any>; // Semantic attributes
}

// Content Nodes  
interface SectionNode extends ASTNode {
  type: 'section';
  children: BlockNode[];                 // Section contents
  properties: SectionProperties;         // Layout/section properties
} 

interface ParagraphNode extends ASTNode {
  type: 'paragraph';
  children: InlineNode[];                // Paragraph content
  semantics: ParagraphSemantics;         // Formatting semantics
}

interface HeadingNode extends ASTNode {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;        // Heading level
  children: InlineNode[];                // Heading text content
  numbering?: HeadingNumbering;          // Automatic number info
}  

interface ListNode extends ASTNode { 
  type: 'list'; 
  listType: 'ordered' | 'unordered';     // List type
  items: ListItemNode[];                 // List items
  numbering?: ListNumbering;             // Numbering settings
}

type BlockNode = 
  | ParagraphNode
  | HeadingNode  
  | ListNode
  | TableNode
  | CodeBlockNode
  | BlockquoteNode
  | ImageNode
  | CustomBlockNode
  // Plus others...

type InlineNode =
  | TextNode
  | HyperlinkNode
  | MarkNode
  | ImageNode  
  | MathNode
  | FootnoteRefNode
  | CustomInlineNode
  // Plus others...
```

---

## **Backward Compatibility API**

### **Legacy-compatible Functions (Maintained)**
All previous v1.x functionality continues to work unchanged:

```typescript  
import { 
  parseDocxToHtmlSnapshot, 
  parseDocxToHtmlSnapshotWithReport 
} from "@coding01/docsjs";

// Still available with identical functionality
const html = await parseDocxToHtmlSnapshot(docxFile);

const { html, report } = await parseDocxToHtmlSnapshotWithReport(docxFile);
```

### **Enhanced Backward-Compatible Functions**  
New options added without breaking existing usage:

```typescript
// New option added (but optional) to maintain compatibility
const html = await parseDocxToHtmlSnapshot(docxFile, { 
  profile?: 'default' | 'knowledge-base' | 'exam-paper' | 'enterprise-document',
  includePluginProcessing?: boolean  
  // Old behavior is preserved by default if no profile specified
});
```

---

## **Helper APIs**

### **Performance Utilities**
```typescript  
const { engine, destroy } = await createEngineWithMetrics({
  enablePerfTracing: boolean,
  maxOperationsBeforeLogging: number  
});

// Generate performance report
const report = engine.generatePerformanceReport();
```

### **Security Validation** 
```typescript
// Validate a plugin for security compliance
type ValidationResult = validatePluginSecurity(plugin: DocxPlugin, enginePolicy: SecurityPolicy);

// Check profile security level  
const riskScore: number = analyzeProfileSecurity(selectedProfile);
```

### **Migration Aids**
```typescript
// Convert legacy plugin to new format
const newPlugin: DocxPlugin = adaptLegacyPlugin(legacyPlugin);

// Convert legacy configuration
const newProfile: Profile = convertLegacyConfigToProfile(legacyConfig);  
```

---

## **Type Exports**

All AST nodes, interfaces, types, and utilities are available for type safety:

```typescript
// Full AST type system
import type { 
  DocumentAST, 
  BlockNode, 
  InlineNode, 
  ParagraphNode, 
  HeadingNode, 
  ListNode,
  // ... plus 50+ more AST types
} from "@coding01/docsjs";

// Plugin system types  
import type { 
  DocxPlugin, 
  PluginContext, 
  PluginPermissions, 
  PluginPhase,
  // ... plus 20+ plugin-related types
} from "@coding01/docsjs";

// Profile system types
import type { 
  Profile,
  ProfileDefinition,
  TransformOptions,
  // ... plus 15+ profile-related types  
} from "@coding01/docsjs";
```

This API reference documents the complete platform-grade functionality while maintaining the backward compatibility that enables seamless transitions from v1.x systems.