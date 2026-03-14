---
layout: doc
---

# Introduction

DocsJS is a **render-first Word fidelity component** with Web Component core and React/Vue adapters. It brings Word/WPS/Google Docs content to web apps without rebuilding layout by hand, keeping structure, styles, and semantics in one import flow.

## What is DocsJS?

DocsJS solves a common problem: **importing rich document content into web applications without losing formatting**. When users paste from Word, WPS, or Google Docs, the result is often a mess of broken styles, lost formatting, and mangled tables.

DocsJS provides:

- **Lossless import** - Preserve every element from source documents
- **Multi-framework support** - Works with React, Vue, and vanilla Web Components
- **Extensible architecture** - Plugin system for custom transformations
- **Production ready** - TypeScript, tree-shakeable, CSP-friendly

## Core Architecture

The new 3-tier PicGo-inspired architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PLATFORM LAYER                              │
│  CLI + API + GUI + Profile Management + Plugin Registry           │
├─────────────────────────────────────────────────────────────────────┤
│                      ADAPTER LAYER                                 │
│  DOCX Parser ←→ DocumentAST ←→ HTML/MD/JSON Renderers             │
├─────────────────────────────────────────────────────────────────────┤
│                        CORE ENGINE                                 │
│  AST v2 + Pipeline + Plugin Orchestrator + Security              │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 🔌 Plugin Ecosystem

8 lifecycle hooks with security sandboxing:

- `beforeParse`, `afterParse` → Document parsing
- `beforeTransform`, `afterTransform` → AST processing
- `beforeRender`, `afterRender` → Content rendering
- `beforeExport`, `afterExport` → Output preparation

### 📋 Configurable Profiles

Switch processing behavior based on use-case:

| Profile               | Use Case                                   |
| --------------------- | ------------------------------------------ |
| `knowledge-base`      | Technical documentation with high fidelity |
| `exam-paper`          | Academic papers with question extraction   |
| `enterprise-document` | Corporate docs with security focus         |
| `default`             | Balanced performance vs fidelity           |

### 🛡️ Security-First

- Plugin sandboxing with execution isolation
- Granular file, network, compute access controls
- AST protection to prevent unintended semantic changes
- Profile-dependent content sanitization

## Who Should Use DocsJS?

### For End Users

- Rich Semantic Fidelity: Word → HTML with layout, math, tables preserved
- Configurable Workflows: Switch processing based on document type
- Security Focused: Sandboxed execution with granular controls
- Performance Optimized: Streaming processing for large documents

### For Developers

- Extensible Architecture: 8 hook points for custom functionality
- Security Model: Fine-grained permissions for safe plugin ecosystem
- Profile System: Configure processing for domain-specific needs
- Integration Friendly: API and component interfaces

### For Organizations

- Enterprise-Grade: Audit trails, compliance-ready profiles
- Scalable: Worker management and resource controls
- Platform Capable: Ready for CMS/blog editor integrations
- Extensible: Internal plugin development enabled

## Next Steps

- [Installation](/guide/installation) - Get DocsJS installed in your project
- [Quick Start](/guide/quick-start) - Start using DocsJS in minutes
- [Plugin System](/guide/plugins) - Learn about the plugin architecture
- [API Reference](/api/) - Explore the full API
