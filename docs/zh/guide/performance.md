---
title: 性能
---

# 性能优化

DocsJS 专为大规模高性能文档处理而设计。

## 流式处理

大文档采用流式处理，最小化内存占用：

```ts
const engine = new CoreEngine();
// 文档分块处理
const result = await engine.transformDocument(largeFile);
```

## 工作线程管理

CPU 密集型任务可卸载到工作线程：

```ts
const engine = new CoreEngine({
  workers: {
    enabled: true,
    maxConcurrency: 4,
    timeout: 30000,
  },
});
```

## 资源控制

内置限制防止资源耗尽：

```ts
const profile = {
  id: "performance-optimized",
  compute: {
    maxMemoryMB: 100,
    maxCpuSecs: 10,
  },
};
```

## 性能基准

| 操作               | 时间   | 内存   |
| ------------------ | ------ | ------ |
| 小型 DOCX (< 1MB)  | ~50ms  | ~10MB  |
| 中型 DOCX (1-10MB) | ~200ms | ~50MB  |
| 大型 DOCX (> 10MB) | ~1s    | ~100MB |

## 优化建议

1. **使用配置**: 为场景选择合适的配置
2. **启用缓存**: 缓存解析后的 AST
3. **批量处理**: 并行处理多个文档
4. **懒加载**: 仅在需要时加载插件
