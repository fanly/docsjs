---
title: 类型
---

# TypeScript 类型

DocsJS 提供完整的 TypeScript 类型定义。

## 核心类型

### DocumentAST

```ts
interface DocumentAST {
  type: "document";
  children: ASTNode[];
  metadata: DocumentMetadata;
}

interface DocumentMetadata {
  source: string;
  encoding: string;
  parseTime: number;
}
```

### TransformResult

```ts
interface TransformResult {
  output: string;
  diagnostics: Diagnostic[];
  metrics: PerformanceMetrics;
}

interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  location?: SourceLocation;
}

interface PerformanceMetrics {
  parseTime: number;
  transformTime: number;
  renderTime: number;
  memoryUsed: number;
}
```

## 插件类型

```ts
interface Plugin {
  name: string;
  version: string;
  supportedHooks: HookName[];
  permissions: PluginPermissions;
  beforeParse?: HookHandler;
  afterParse?: HookHandler;
  beforeTransform?: HookHandler;
  afterTransform?: HookHandler;
  beforeRender?: HookHandler;
  afterRender?: HookHandler;
  beforeExport?: HookHandler;
  afterExport?: HookHandler;
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

interface PluginPermissions {
  read?: string[];
  write?: string[];
  network?: boolean;
  compute?: ComputeLimits;
  ast?: ASTPermissions;
}

interface ComputeLimits {
  maxMemoryMB?: number;
  maxCpuSecs?: number;
}

interface ASTPermissions {
  canModifySemantics?: boolean;
  canAccessOriginal?: boolean;
  canExportRawAst?: boolean;
}
```

## 配置类型

```ts
interface Profile {
  id: string;
  name: string;
  parse?: ParseOptions;
  transform?: TransformOptions;
  render?: RenderOptions;
  security?: SecurityOptions;
}

interface ParseOptions {
  features: {
    mathML?: boolean;
    tables?: boolean;
    images?: boolean;
    footnotes?: boolean;
  };
}

interface SecurityOptions {
  allowedDomains?: string[];
  sanitizerProfile?: "fidelity-first" | "strict" | "balanced";
}
```

## 事件类型

```ts
interface ChangeEventDetail {
  htmlSnapshot: string;
  textContent: string;
  wordCount: number;
}

interface ErrorEventDetail {
  error: Error;
  phase: string;
  recoverable: boolean;
}

interface ReadyEventDetail {
  version: string;
  features: string[];
}
```
