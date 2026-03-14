---
title: Security
---

# Security Model

DocsJS is built with a security-first approach, providing multiple layers of protection for document processing in untrusted environments.

## Plugin Sandboxing

Plugins run in a restricted sandbox with limited global access. Any external API access is mediated through the CoreEngine with explicit permissions.

```ts
const plugin = {
  name: "safe-plugin",
  permissions: {
    compute: { maxMemoryMB: 20 },
    ast: { canModifySemantics: true, canAccessOriginal: true },
  },
  beforeRender: (context) => {
    // Plugin code runs in isolated context
    return context;
  },
};
```

## Permission System

Fine-grained permissions control what plugins can access:

| Permission | Description                  |
| ---------- | ---------------------------- |
| `read`     | File system read access      |
| `write`    | File system write access     |
| `network`  | Network request capabilities |
| `compute`  | CPU/memory limits            |
| `ast`      | AST modification rights      |

## AST Protection

Core transforms are validated against a whitelist to prevent unauthorized modifications:

```ts
const permissions = {
  ast: {
    canModifySemantics: true, // Allow semantic changes
    canAccessOriginal: true, // Access source document
    canExportRawAst: false, // Prevent AST export
  },
};
```

## Content Sanitization

Profile-dependent sanitization prevents XSS and injection attacks:

- **fidelity-first**: Minimal sanitization, preserve original content
- **strict**: Aggressive sanitization, remove all potentially harmful content
- **balanced**: Default profile with standard sanitization rules

## Best Practices

1. **Least Privilege**: Grant only necessary permissions to plugins
2. **Validate Input**: Always sanitize external content
3. **Audit Trails**: Enable logging for security events
4. **Regular Updates**: Keep dependencies updated
