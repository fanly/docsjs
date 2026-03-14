---
layout: doc
---

# 插件系统

使用 DocsJS 插件系统构建自定义功能。

## 概述

DocsJS 提供强大的插件系统，包含 8 个生命周期钩子和细粒度安全控制。插件可以在处理管道的任何阶段修改文档。

## 生命周期钩子

8 个可用钩子覆盖整个文档处理生命周期：

| 钩子              | 阶段 | 描述       |
| ----------------- | ---- | ---------- |
| `beforeParse`     | 解析 | 文档解析前 |
| `afterParse`      | 解析 | AST 创建后 |
| `beforeTransform` | 转换 | AST 转换前 |
| `afterTransform`  | 转换 | AST 转换后 |
| `beforeRender`    | 渲染 | 输出渲染前 |
| `afterRender`     | 渲染 | 输出生成后 |
| `beforeExport`    | 导出 | 最终导出前 |
| `afterExport`     | 导出 | 导出完成后 |

## 创建插件

### 基本结构

```ts
const myPlugin = {
  name: "my-plugin",
  version: "1.0.0",
  availableHooks: ["afterParse", "beforeRender"],

  afterParse: (context) => {
    // 解析后修改 AST
    return context;
  },

  beforeRender: (context) => {
    // 准备渲染
    return context;
  },
};
```

### 带权限

```ts
const advancedPlugin = {
  name: "advanced-plugin",
  version: "1.0.0",
  availableHooks: ["afterParse", "beforeRender"],

  permissions: {
    read: ["./data"],
    write: ["./output"],
    network: false,
    compute: {
      maxMemoryMB: 50,
      maxCpuSecs: 10,
    },
    ast: {
      canModifySemantics: true,
      canAccessOriginal: true,
      canExportRawAst: false,
    },
    export: {
      canGenerateFiles: true,
      canUpload: false,
    },
    misc: {
      allowUnsafeCode: false,
    },
  },

  afterParse: (context) => {
    // 访问 AST
    const ast = context.ast;

    // 存储中间数据
    context.pipeline.state.intermediate.myData = {};

    return context;
  },
};
```

## 插件上下文

每个钩子接收一个上下文对象：

```ts
interface PluginContext {
  ast: DocumentNode;
  input: {
    source: string;
    format: string;
    metadata?: Record<string, unknown>;
  };
  output: {
    content?: string;
    format: string;
    metadata?: Record<string, unknown>;
  };
  pipeline: {
    state: {
      intermediate: Record<string, unknown>;
      errors: Error[];
      warnings: string[];
    };
    config: EngineConfig;
    profile?: ProfileConfig;
  };
  utils: {
    logger: Logger;
    cache: Cache;
  };
}
```

## 权限系统

### 读写权限

```ts
permissions: {
  read: ["./data", "./templates"],
  write: ["./output", "./cache"],
}
```

### 网络权限

```ts
permissions: {
  network: true,
}
```

### 计算权限

```ts
permissions: {
  compute: {
    maxMemoryMB: 100,
    maxCpuSecs: 30,
  },
}
```

### AST 权限

```ts
permissions: {
  ast: {
    canModifySemantics: true,
    canAccessOriginal: true,
    canExportRawAst: false,
  },
}
```

## 注册插件

### 使用 CoreEngine

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();
engine.registerPlugin(myPlugin);
```

### 使用组件

```tsx
<WordFidelityEditorReact
  config={{
    plugins: [myPlugin],
  }}
/>
```

## 示例插件

### 目录生成器

```ts
const tocPlugin = {
  name: "toc-generator",
  availableHooks: ["afterParse", "beforeRender"],
  permissions: {
    ast: { canModifySemantics: true },
  },
  afterParse: (context) => {
    const headings = findHeadings(context.ast);
    context.pipeline.state.intermediate.toc = headings;
    return context;
  },
  beforeRender: (context) => {
    const toc = context.pipeline.state.intermediate.toc;
    if (toc?.length > 0) {
      insertToc(context.ast, toc);
    }
    return context;
  },
};
```

### 图片优化器

```ts
const imageOptimizerPlugin = {
  name: "image-optimizer",
  availableHooks: ["beforeRender"],
  permissions: {
    compute: { maxMemoryMB: 100 },
  },
  beforeRender: async (context) => {
    const images = findImages(context.ast);
    for (const img of images) {
      img.src = await optimizeImage(img.src);
    }
    return context;
  },
};
```

### 自定义净化器

```ts
const sanitizerPlugin = {
  name: "custom-sanitizer",
  availableHooks: ["afterTransform"],
  permissions: {
    ast: { canModifySemantics: true },
  },
  afterTransform: (context) => {
    sanitizeScripts(context.ast);
    removeExternalLinks(context.ast);
    return context;
  },
};
```

## 最佳实践

1. **最小权限** - 只请求需要的权限
2. **错误处理** - 优雅地处理错误
3. **性能** - 注意处理时间
4. **幂等性** - 相同输入产生相同输出
5. **文档** - 记录插件行为

## 下一步

- [配置系统](/zh/guide/profiles) - 配置处理行为
- [安全模型](/zh/guide/security) - 了解安全控制
- [API 参考](/zh/api/) - 完整 API 文档
