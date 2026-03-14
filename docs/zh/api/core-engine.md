---
title: CoreEngine
---

# CoreEngine API

CoreEngine 是文档转换、插件注册和运行时配置的核心入口。

## 方法

### transformDocument

转换文档，返回处理结果：

```ts
const result = await engine.transformDocument(file, {
  profile: "knowledge-base",
});
console.log(result.output); // 转换后的内容
console.log(result.diagnostics); // 错误和警告
console.log(result.metrics); // 性能数据
```

### registerPlugin

注册插件到引擎：

```ts
const plugin = {
  name: "my-plugin",
  version: "1.0.0",
  supportedHooks: ["beforeRender"],
  beforeRender: (context) => {
    return context;
  },
};

engine.registerPlugin(plugin);
```

### applyProfile

应用处理配置：

```ts
engine.applyProfile("knowledge-base");
// 或自定义配置
engine.registerProfile(customProfile);
engine.applyProfile("custom-profile");
```

## 类型定义

```ts
interface TransformResult {
  output: string;
  diagnostics: Diagnostic[];
  metrics: PerformanceMetrics;
}

interface Diagnostic {
  severity: "error" | "warning" | "info";
  message: string;
  location?: Location;
}
```

## 完整示例

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// 注册插件
engine.registerPlugin({
  name: "math-enhancer",
  supportedHooks: ["beforeRender"],
  beforeRender: (context) => {
    context.pipeline.state.intermediate.mathEnhanced = true;
    return context;
  },
});

// 应用配置
engine.applyProfile("knowledge-base");

// 转换文档
const result = await engine.transformDocument(file);
```
