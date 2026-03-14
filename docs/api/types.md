---
layout: doc
---

# Types

Complete TypeScript type reference for DocsJS.

## Core Types

### DocumentNode

The base AST node type.

```ts
interface DocumentNode {
  type: string;
  children?: DocumentNode[];
  attributes?: Record<string, unknown>;
  content?: string;
  position?: Position;
}
```

### Position

Source position information.

```ts
interface Position {
  start: { line: number; column: number; offset?: number };
  end: { line: number; column: number; offset?: number };
}
```

## Configuration Types

### EngineConfig

Engine configuration options.

```ts
interface EngineConfig {
  profile?: string;
  plugins?: PluginConfig[];
  security?: SecurityConfig;
  performance?: PerformanceConfig;
}
```

### PluginConfig

Plugin configuration.

```ts
interface PluginConfig {
  name: string;
  version?: string;
  availableHooks: HookName[];
  permissions?: PluginPermissions;
  beforeParse?: HookFunction;
  afterParse?: HookFunction;
  beforeTransform?: HookFunction;
  afterTransform?: HookFunction;
  beforeRender?: HookFunction;
  afterRender?: HookFunction;
  beforeExport?: HookFunction;
  afterExport?: HookFunction;
}

type HookName =
  | "beforeParse"
  | "afterParse"
  | "beforeTransform"
  | "afterTransform"
  | "beforeRender"
  | "afterRender"
  | "beforeExport"
  | "afterExport";

type HookFunction = (context: PluginContext) => PluginContext | Promise<PluginContext>;
```

### ProfileConfig

Profile configuration.

```ts
interface ProfileConfig {
  id: string;
  name: string;
  description?: string;
  parse?: ParseConfig;
  transform?: TransformConfig;
  render?: RenderConfig;
  security?: SecurityConfig;
  export?: ExportConfig;
}
```

### ParseConfig

Parsing configuration.

```ts
interface ParseConfig {
  features?: {
    mathML?: boolean;
    tables?: boolean;
    images?: boolean;
    footnotes?: boolean;
    citations?: boolean;
    crossReferences?: boolean;
  };
  options?: {
    preserveStyles?: boolean;
    extractMetadata?: boolean;
  };
}
```

### TransformConfig

Transformation configuration.

```ts
interface TransformConfig {
  preserveStructure?: boolean;
  extractMetadata?: boolean;
  customRules?: TransformRule[];
}

interface TransformRule {
  selector: string;
  action: "replace" | "remove" | "wrap" | "unwrap";
  value?: string;
}
```

### RenderConfig

Rendering configuration.

```ts
interface RenderConfig {
  format?: "html" | "markdown" | "json";
  includeStyles?: boolean;
  mathRenderer?: "katex" | "mathjax" | "none";
  codeHighlighter?: "prism" | "highlight" | "none";
}
```

## Security Types

### SecurityConfig

Security configuration.

```ts
interface SecurityConfig {
  allowedDomains?: string[];
  sanitizerProfile?: "strict" | "balanced" | "fidelity-first";
  removeScripts?: boolean;
  removeExternalLinks?: boolean;
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}
```

### PluginPermissions

Plugin permission settings.

```ts
interface PluginPermissions {
  read?: string[];
  write?: string[];
  network?: boolean;
  compute?: ComputePermissions;
  ast?: ASTPermissions;
  export?: ExportPermissions;
  misc?: MiscPermissions;
}

interface ComputePermissions {
  maxMemoryMB?: number;
  maxCpuSecs?: number;
}

interface ASTPermissions {
  canModifySemantics?: boolean;
  canAccessOriginal?: boolean;
  canExportRawAst?: boolean;
}

interface ExportPermissions {
  canGenerateFiles?: boolean;
  canUpload?: boolean;
}

interface MiscPermissions {
  allowUnsafeCode?: boolean;
}
```

## Context Types

### PluginContext

Context passed to plugin hooks.

```ts
interface PluginContext {
  ast: DocumentNode;
  input: InputContext;
  output: OutputContext;
  pipeline: PipelineContext;
  utils: UtilityContext;
}

interface InputContext {
  source: string;
  format: string;
  metadata?: Record<string, unknown>;
}

interface OutputContext {
  content?: string;
  format: string;
  metadata?: Record<string, unknown>;
}

interface PipelineContext {
  state: PipelineState;
  config: EngineConfig;
  profile?: ProfileConfig;
}

interface PipelineState {
  intermediate: Record<string, unknown>;
  errors: Error[];
  warnings: string[];
}

interface UtilityContext {
  logger: Logger;
  cache: Cache;
}
```

## Result Types

### TransformResult

Result of document transformation.

```ts
interface TransformResult {
  output: string;
  diagnostics: Diagnostic[];
  metrics: PerformanceMetrics;
  metadata?: DocumentMetadata;
}
```

### Diagnostic

Processing diagnostic information.

```ts
interface Diagnostic {
  type: "error" | "warning" | "info";
  message: string;
  location?: {
    line: number;
    column: number;
  };
  code?: string;
}
```

### PerformanceMetrics

Performance measurement data.

```ts
interface PerformanceMetrics {
  parseTime: number;
  transformTime: number;
  renderTime: number;
  totalTime: number;
  memoryUsage?: number;
}
```

### DocumentMetadata

Extracted document metadata.

```ts
interface DocumentMetadata {
  title?: string;
  author?: string;
  created?: Date;
  modified?: Date;
  wordCount?: number;
  pageCount?: number;
  language?: string;
}
```

## Event Types

### ChangeEventDetail

Detail for docsjs-change event.

```ts
interface ChangeEventDetail {
  htmlSnapshot: string;
  textContent: string;
  wordCount: number;
  charCount: number;
}
```

### ErrorEventDetail

Detail for docsjs-error event.

```ts
interface ErrorEventDetail {
  error: Error;
  code?: string;
  recoverable: boolean;
}
```

### LoadEventDetail

Detail for docsjs-load event.

```ts
interface LoadEventDetail {
  source: "html" | "docx" | "clipboard";
  size: number;
  processingTime: number;
}
```

## Utility Types

### Logger

Logging utility interface.

```ts
interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}
```

### Cache

Caching utility interface.

```ts
interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}
```

## Next Steps

- [CoreEngine API](/api/core-engine) - Engine reference
- [Components API](/api/components) - Component reference
- [Events API](/api/events) - Event handling
