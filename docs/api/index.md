---
layout: doc
---

# API Reference

Complete API reference for DocsJS.

## CoreEngine

The main engine for programmatic document processing.

### Constructor

```ts
new CoreEngine(config?: EngineConfig)
```

### Methods

#### `transformDocument(file: File): Promise<TransformResult>`

Transform a document file.

```ts
const engine = new CoreEngine();
const result = await engine.transformDocument(file);
```

#### `applyProfile(profileId: string): void`

Apply a processing profile.

```ts
engine.applyProfile("knowledge-base");
```

#### `registerPlugin(plugin: PluginConfig): void`

Register a custom plugin.

```ts
engine.registerPlugin({
  name: "my-plugin",
  availableHooks: ["afterParse"],
  afterParse: (context) => context,
});
```

#### `registerProfile(profile: ProfileConfig): void`

Register a custom profile.

```ts
engine.registerProfile({
  id: "custom-profile",
  name: "Custom Profile",
  parse: { features: { mathML: true } },
});
```

## Components

### Web Component

```html
<docs-word-editor lang="en" show-toolbar profile="knowledge-base"></docs-word-editor>
```

#### Attributes

| Attribute      | Type      | Default     | Description        |
| -------------- | --------- | ----------- | ------------------ |
| `lang`         | `string`  | `'en'`      | UI language        |
| `show-toolbar` | `boolean` | `false`     | Show toolbar       |
| `profile`      | `string`  | `'default'` | Processing profile |

#### Methods

| Method            | Parameters     | Returns         | Description         |
| ----------------- | -------------- | --------------- | ------------------- |
| `loadHtml(html)`  | `html: string` | `Promise<void>` | Load HTML content   |
| `loadDocx(file)`  | `file: File`   | `Promise<void>` | Load DOCX file      |
| `loadClipboard()` | -              | `Promise<void>` | Load from clipboard |
| `getSnapshot()`   | -              | `string`        | Get HTML output     |
| `clear()`         | -              | `void`          | Clear content       |

### React Component

```tsx
<WordFidelityEditorReact
  lang="en"
  showToolbar={true}
  profile="knowledge-base"
  config={{}}
  onReady={() => {}}
  onChange={(e) => {}}
  onError={(e) => {}}
/>
```

#### Props

| Prop          | Type                       | Default     | Description          |
| ------------- | -------------------------- | ----------- | -------------------- |
| `lang`        | `string`                   | `'en'`      | UI language          |
| `showToolbar` | `boolean`                  | `false`     | Show toolbar         |
| `profile`     | `string`                   | `'default'` | Processing profile   |
| `config`      | `EngineConfig`             | `{}`        | Engine configuration |
| `onReady`     | `() => void`               | -           | Ready callback       |
| `onChange`    | `(e: ChangeEvent) => void` | -           | Change callback      |
| `onError`     | `(e: ErrorEvent) => void`  | -           | Error callback       |

### Vue Component

```vue
<WordFidelityEditorVue
  lang="en"
  :show-toolbar="true"
  profile="knowledge-base"
  @ready="onReady"
  @change="onChange"
  @error="onError"
/>
```

#### Props

| Prop          | Type           | Default     | Description          |
| ------------- | -------------- | ----------- | -------------------- |
| `lang`        | `string`       | `'en'`      | UI language          |
| `showToolbar` | `boolean`      | `false`     | Show toolbar         |
| `profile`     | `string`       | `'default'` | Processing profile   |
| `config`      | `EngineConfig` | `{}`        | Engine configuration |

#### Events

| Event    | Payload                         | Description     |
| -------- | ------------------------------- | --------------- |
| `ready`  | `{}`                            | Editor ready    |
| `change` | `{ htmlSnapshot, textContent }` | Content changed |
| `error`  | `{ error }`                     | Error occurred  |

## Events

### docsjs-change

Fired when content changes.

```js
editor.addEventListener("docsjs-change", (e) => {
  const { htmlSnapshot, textContent } = e.detail;
});
```

### docsjs-ready

Fired when the editor is ready.

```js
editor.addEventListener("docsjs-ready", () => {
  console.log("Ready!");
});
```

### docsjs-error

Fired when an error occurs.

```js
editor.addEventListener("docsjs-error", (e) => {
  const { error } = e.detail;
  console.error(error);
});
```

## Types

### EngineConfig

```ts
interface EngineConfig {
  profile?: string;
  plugins?: PluginConfig[];
  security?: SecurityConfig;
  performance?: PerformanceConfig;
}
```

### PluginConfig

```ts
interface PluginConfig {
  name: string;
  version?: string;
  availableHooks: HookName[];
  permissions?: PluginPermissions;
  beforeParse?: (context: PluginContext) => PluginContext;
  afterParse?: (context: PluginContext) => PluginContext;
  beforeTransform?: (context: PluginContext) => PluginContext;
  afterTransform?: (context: PluginContext) => PluginContext;
  beforeRender?: (context: PluginContext) => PluginContext;
  afterRender?: (context: PluginContext) => PluginContext;
  beforeExport?: (context: PluginContext) => PluginContext;
  afterExport?: (context: PluginContext) => PluginContext;
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
```

### PluginPermissions

```ts
interface PluginPermissions {
  read?: string[];
  write?: string[];
  network?: boolean;
  compute?: {
    maxMemoryMB?: number;
    maxCpuSecs?: number;
  };
  ast?: {
    canModifySemantics?: boolean;
    canAccessOriginal?: boolean;
    canExportRawAst?: boolean;
  };
  export?: {
    canGenerateFiles?: boolean;
    canUpload?: boolean;
  };
  misc?: {
    allowUnsafeCode?: boolean;
  };
}
```

### ProfileConfig

```ts
interface ProfileConfig {
  id: string;
  name: string;
  description?: string;
  parse?: ParseConfig;
  transform?: TransformConfig;
  render?: RenderConfig;
  security?: SecurityConfig;
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
  type: "error" | "warning" | "info";
  message: string;
  location?: {
    line: number;
    column: number;
  };
}

interface PerformanceMetrics {
  parseTime: number;
  transformTime: number;
  renderTime: number;
  totalTime: number;
}
```

## Built-in Profiles

| Profile ID            | Description                                  |
| --------------------- | -------------------------------------------- |
| `default`             | Balanced performance vs fidelity             |
| `knowledge-base`      | High-fidelity, MathML support, tables        |
| `exam-paper`          | Question extraction, strict semantic parsing |
| `enterprise-document` | Security, compliance, sanitization           |

## Next Steps

- [Core Engine API](/api/core-engine) - Detailed engine documentation
- [Components API](/api/components) - Component reference
- [Events API](/api/events) - Event handling
- [Types](/api/types) - Complete type reference
