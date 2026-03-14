---
title: Performance
---

# Performance Optimization

DocsJS is designed for high-performance document processing at scale.

## Streaming Processing

Large documents are processed using streaming to minimize memory footprint:

```ts
const engine = new CoreEngine();
// Documents are processed in chunks
const result = await engine.transformDocument(largeFile);
```

## Worker Management

CPU-intensive tasks can be offloaded to workers:

```ts
const engine = new CoreEngine({
  workers: {
    enabled: true,
    maxConcurrency: 4,
    timeout: 30000,
  },
});
```

## Resource Controls

Prevent resource exhaustion with built-in limits:

```ts
const profile = {
  id: "performance-optimized",
  compute: {
    maxMemoryMB: 100,
    maxCpuSecs: 10,
  },
};
```

## Benchmarks

| Operation            | Time   | Memory |
| -------------------- | ------ | ------ |
| Small DOCX (< 1MB)   | ~50ms  | ~10MB  |
| Medium DOCX (1-10MB) | ~200ms | ~50MB  |
| Large DOCX (> 10MB)  | ~1s    | ~100MB |

## Optimization Tips

1. **Use Profiles**: Select appropriate profiles for your use case
2. **Enable Caching**: Cache parsed AST for repeated operations
3. **Batch Processing**: Process multiple documents in parallel
4. **Lazy Loading**: Load plugins only when needed
