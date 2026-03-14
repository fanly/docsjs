---
layout: doc
---

# API 参考

DocsJS 完整 API 参考。

## CoreEngine

用于编程式文档处理的主引擎。

### 构造函数

```ts
new CoreEngine(config?: EngineConfig)
```

### 方法

#### `transformDocument(file: File): Promise<TransformResult>`

转换文档文件。

```ts
const engine = new CoreEngine();
const result = await engine.transformDocument(file);
```

#### `applyProfile(profileId: string): void`

应用处理配置。

```ts
engine.applyProfile("knowledge-base");
```

#### `registerPlugin(plugin: PluginConfig): void`

注册自定义插件。

```ts
engine.registerPlugin({
  name: "my-plugin",
  availableHooks: ["afterParse"],
  afterParse: (context) => context,
});
```

#### `registerProfile(profile: ProfileConfig): void`

注册自定义配置。

```ts
engine.registerProfile({
  id: "custom-profile",
  name: "自定义配置",
  parse: { features: { mathML: true } },
});
```

## 组件

### Web Component

```html
<docs-word-editor lang="zh" show-toolbar profile="knowledge-base"></docs-word-editor>
```

#### 属性

| 属性           | 类型      | 默认值      | 描述       |
| -------------- | --------- | ----------- | ---------- |
| `lang`         | `string`  | `'en'`      | UI 语言    |
| `show-toolbar` | `boolean` | `false`     | 显示工具栏 |
| `profile`      | `string`  | `'default'` | 处理配置   |

#### 方法

| 方法              | 参数           | 返回值          | 描述           |
| ----------------- | -------------- | --------------- | -------------- |
| `loadHtml(html)`  | `html: string` | `Promise<void>` | 加载 HTML 内容 |
| `loadDocx(file)`  | `file: File`   | `Promise<void>` | 加载 DOCX 文件 |
| `loadClipboard()` | -              | `Promise<void>` | 从剪贴板加载   |
| `getSnapshot()`   | -              | `string`        | 获取 HTML 输出 |
| `clear()`         | -              | `void`          | 清空内容       |

### React 组件

```tsx
<WordFidelityEditorReact
  lang="zh"
  showToolbar={true}
  profile="knowledge-base"
  config={{}}
  onReady={() => {}}
  onChange={(e) => {}}
  onError={(e) => {}}
/>
```

#### Props

| Prop          | 类型                       | 默认值      | 描述       |
| ------------- | -------------------------- | ----------- | ---------- |
| `lang`        | `string`                   | `'en'`      | UI 语言    |
| `showToolbar` | `boolean`                  | `false`     | 显示工具栏 |
| `profile`     | `string`                   | `'default'` | 处理配置   |
| `config`      | `EngineConfig`             | `{}`        | 引擎配置   |
| `onReady`     | `() => void`               | -           | 就绪回调   |
| `onChange`    | `(e: ChangeEvent) => void` | -           | 变更回调   |
| `onError`     | `(e: ErrorEvent) => void`  | -           | 错误回调   |

### Vue 组件

```vue
<WordFidelityEditorVue
  lang="zh"
  :show-toolbar="true"
  profile="knowledge-base"
  @ready="onReady"
  @change="onChange"
  @error="onError"
/>
```

#### Props

| Prop          | 类型           | 默认值      | 描述       |
| ------------- | -------------- | ----------- | ---------- |
| `lang`        | `string`       | `'en'`      | UI 语言    |
| `showToolbar` | `boolean`      | `false`     | 显示工具栏 |
| `profile`     | `string`       | `'default'` | 处理配置   |
| `config`      | `EngineConfig` | `{}`        | 引擎配置   |

#### 事件

| 事件     | 载荷                            | 描述       |
| -------- | ------------------------------- | ---------- |
| `ready`  | `{}`                            | 编辑器就绪 |
| `change` | `{ htmlSnapshot, textContent }` | 内容变更   |
| `error`  | `{ error }`                     | 发生错误   |

## 事件

### docsjs-change

内容变更时触发。

```js
editor.addEventListener("docsjs-change", (e) => {
  const { htmlSnapshot, textContent } = e.detail;
});
```

### docsjs-ready

编辑器就绪时触发。

```js
editor.addEventListener("docsjs-ready", () => {
  console.log("就绪！");
});
```

### docsjs-error

发生错误时触发。

```js
editor.addEventListener("docsjs-error", (e) => {
  const { error } = e.detail;
  console.error(error);
});
```

## 类型

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

## 内置配置

| 配置 ID               | 描述                      |
| --------------------- | ------------------------- |
| `default`             | 性能与保真平衡            |
| `knowledge-base`      | 高保真、MathML 支持、表格 |
| `exam-paper`          | 题目提取、严格语义解析    |
| `enterprise-document` | 安全、合规、净化          |

## 下一步

- [Core Engine API](/zh/api/core-engine) - 详细引擎文档
- [组件 API](/zh/api/components) - 组件参考
- [事件 API](/zh/api/events) - 事件处理
- [类型](/zh/api/types) - 完整类型参考
