---
layout: doc
---

# Plugin System

Build custom functionality with the DocsJS plugin system.

## Overview

DocsJS provides a powerful plugin system with 8 lifecycle hooks and fine-grained security controls. Plugins can modify documents at any stage of the processing pipeline.

## Lifecycle Hooks

The 8 available hooks cover the entire document processing lifecycle:

| Hook              | Stage     | Description               |
| ----------------- | --------- | ------------------------- |
| `beforeParse`     | Parse     | Before document parsing   |
| `afterParse`      | Parse     | After AST is created      |
| `beforeTransform` | Transform | Before AST transformation |
| `afterTransform`  | Transform | After AST transformation  |
| `beforeRender`    | Render    | Before output rendering   |
| `afterRender`     | Render    | After output is generated |
| `beforeExport`    | Export    | Before final export       |
| `afterExport`     | Export    | After export complete     |

## Creating a Plugin

### Basic Structure

```ts
const myPlugin = {
  name: "my-plugin",
  version: "1.0.0",
  availableHooks: ["afterParse", "beforeRender"],

  afterParse: (context) => {
    // Modify the AST after parsing
    return context;
  },

  beforeRender: (context) => {
    // Prepare for rendering
    return context;
  },
};
```

### With Permissions

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
    // Access the AST
    const ast = context.ast;

    // Store intermediate data
    context.pipeline.state.intermediate.myData = {};

    return context;
  },
};
```

## Plugin Context

Each hook receives a context object:

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

## Permission System

### Read/Write Permissions

```ts
permissions: {
  read: ["./data", "./templates"],
  write: ["./output", "./cache"],
}
```

### Network Permissions

```ts
permissions: {
  network: true,
}
```

### Compute Permissions

```ts
permissions: {
  compute: {
    maxMemoryMB: 100,
    maxCpuSecs: 30,
  },
}
```

### AST Permissions

```ts
permissions: {
  ast: {
    canModifySemantics: true,
    canAccessOriginal: true,
    canExportRawAst: false,
  },
}
```

## Registering Plugins

### With CoreEngine

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();
engine.registerPlugin(myPlugin);
```

### With Component

```tsx
<WordFidelityEditorReact
  config={{
    plugins: [myPlugin],
  }}
/>
```

## Example Plugins

### Table of Contents Generator

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

### Image Optimizer

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

### Custom Sanitizer

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

## Best Practices

1. **Minimal Permissions** - Request only what you need
2. **Error Handling** - Handle errors gracefully
3. **Performance** - Be mindful of processing time
4. **Idempotency** - Same input should produce same output
5. **Documentation** - Document your plugin's behavior

## Next Steps

- [Profile System](/guide/profiles) - Configure processing behavior
- [Security Model](/guide/security) - Understand security controls
- [API Reference](/api/) - Full API documentation
