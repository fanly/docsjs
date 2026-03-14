---
layout: doc
---

# CoreEngine API

Complete API reference for the DocsJS CoreEngine.

## Constructor

```ts
new CoreEngine(config?: EngineConfig)
```

Creates a new CoreEngine instance.

### Parameters

| Parameter | Type           | Description                   |
| --------- | -------------- | ----------------------------- |
| `config`  | `EngineConfig` | Optional engine configuration |

### Example

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine({
  profile: "knowledge-base",
  plugins: [myPlugin],
});
```

## Methods

### transformDocument

```ts
transformDocument(file: File, options?: TransformOptions): Promise<TransformResult>
```

Transform a document file.

#### Parameters

| Parameter | Type               | Description                     |
| --------- | ------------------ | ------------------------------- |
| `file`    | `File`             | The document file to transform  |
| `options` | `TransformOptions` | Optional transformation options |

#### Returns

`Promise<TransformResult>` - The transformation result

#### Example

```ts
const result = await engine.transformDocument(file);
console.log(result.output);
console.log(result.diagnostics);
console.log(result.metrics);
```

### applyProfile

```ts
applyProfile(profileId: string): void
```

Apply a processing profile.

#### Parameters

| Parameter   | Type     | Description             |
| ----------- | -------- | ----------------------- |
| `profileId` | `string` | The profile ID to apply |

#### Example

```ts
engine.applyProfile("knowledge-base");
```

### registerPlugin

```ts
registerPlugin(plugin: PluginConfig): void
```

Register a custom plugin.

#### Parameters

| Parameter | Type           | Description              |
| --------- | -------------- | ------------------------ |
| `plugin`  | `PluginConfig` | The plugin configuration |

#### Example

```ts
engine.registerPlugin({
  name: "my-plugin",
  availableHooks: ["afterParse"],
  afterParse: (context) => context,
});
```

### registerProfile

```ts
registerProfile(profile: ProfileConfig): void
```

Register a custom profile.

#### Parameters

| Parameter | Type            | Description               |
| --------- | --------------- | ------------------------- |
| `profile` | `ProfileConfig` | The profile configuration |

#### Example

```ts
engine.registerProfile({
  id: "custom-profile",
  name: "Custom Profile",
  parse: { features: { mathML: true } },
});
```

### getProfile

```ts
getProfile(profileId: string): ProfileConfig | undefined
```

Get a registered profile.

#### Parameters

| Parameter   | Type     | Description    |
| ----------- | -------- | -------------- |
| `profileId` | `string` | The profile ID |

#### Returns

`ProfileConfig | undefined` - The profile or undefined

### getProfiles

```ts
getProfiles(): ProfileConfig[]
```

Get all registered profiles.

#### Returns

`ProfileConfig[]` - Array of profiles

### clearPlugins

```ts
clearPlugins(): void
```

Remove all registered plugins.

### clearProfiles

```ts
clearProfiles(): void
```

Remove all registered custom profiles.

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

### TransformOptions

```ts
interface TransformOptions {
  profile?: string;
  outputFormat?: "html" | "markdown" | "json";
  plugins?: PluginConfig[];
}
```

### TransformResult

```ts
interface TransformResult {
  output: string;
  diagnostics: Diagnostic[];
  metrics: PerformanceMetrics;
  metadata?: DocumentMetadata;
}
```

### Diagnostic

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

```ts
interface PerformanceMetrics {
  parseTime: number;
  transformTime: number;
  renderTime: number;
  totalTime: number;
  memoryUsage?: number;
}
```

## Next Steps

- [Components API](/api/components) - Component reference
- [Events API](/api/events) - Event handling
- [Types](/api/types) - Complete type reference
