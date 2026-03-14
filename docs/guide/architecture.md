---
layout: doc
---

# Architecture

Understand the DocsJS core architecture and design decisions.

## Three-Tier Architecture

DocsJS uses a PicGo-inspired three-tier architecture:

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

## Platform Layer

The top layer provides user-facing interfaces:

- **CLI** - Command-line tool for batch processing
- **API** - REST and programmatic interfaces
- **GUI** - Visual editors and management interfaces
- **Profile Management** - Configure processing behavior
- **Plugin Registry** - Discover and manage plugins

## Adapter Layer

The middle layer handles format conversion:

### DOCX Parser

Parses .docx files into the internal AST:

- Extract document structure
- Parse styles and formatting
- Handle embedded resources (images, charts)
- Preserve semantic elements

### DocumentAST

The core abstract syntax tree:

- Framework-agnostic representation
- Preserves all document semantics
- Supports incremental updates
- Enables efficient transformations

### Renderers

Convert AST to output formats:

- **HTML Renderer** - Web-ready output
- **Markdown Renderer** - Documentation-friendly
- **JSON Renderer** - Programmatic access

## Core Engine

The foundation layer powers all functionality:

### AST v2

The enhanced abstract syntax tree:

```ts
interface DocumentNode {
  type: string;
  children?: DocumentNode[];
  attributes?: Record<string, unknown>;
  content?: string;
}
```

### Pipeline

The processing pipeline orchestrates transformations:

1. **Parse** - Convert input to AST
2. **Transform** - Apply modifications
3. **Render** - Generate output
4. **Export** - Prepare final result

### Plugin Orchestrator

Manages plugin lifecycle:

- Registration and validation
- Hook execution
- Permission enforcement
- Error handling

### Security

Built-in security measures:

- Plugin sandboxing
- Permission system
- Content sanitization
- Resource limits

## Data Flow

```
Input (DOCX/HTML/Clipboard)
    ↓
┌─────────────────┐
│   Parser        │ → beforeParse/afterParse hooks
└─────────────────┘
    ↓
┌─────────────────┐
│   AST           │ → beforeTransform/afterTransform hooks
└─────────────────┘
    ↓
┌─────────────────┐
│   Renderer      │ → beforeRender/afterRender hooks
└─────────────────┘
    ↓
┌─────────────────┐
│   Exporter      │ → beforeExport/afterExport hooks
└─────────────────┘
    ↓
Output (HTML/MD/JSON)
```

## Key Design Decisions

### 1. AST-Centric

All operations work through the AST:

- Single source of truth
- Enables powerful transformations
- Facilitates debugging
- Supports incremental updates

### 2. Plugin-First

Extensibility is core to the design:

- 8 lifecycle hooks
- Granular permissions
- Sandboxed execution
- Rich context API

### 3. Profile-Driven

Configuration through profiles:

- Pre-built for common use cases
- Customizable for specific needs
- Switchable at runtime
- Composable settings

### 4. Security-Conscious

Security is not an afterthought:

- Principle of least privilege
- Sandboxed plugin execution
- Content sanitization
- Audit capabilities

## Performance Considerations

- **Streaming** - Process large documents efficiently
- **Caching** - Cache parsed results
- **Lazy Loading** - Load plugins on demand
- **Tree Shaking** - Include only what you use

## Next Steps

- [Plugin System](/guide/plugins) - Learn about the plugin architecture
- [Profile System](/guide/profiles) - Configure processing behavior
- [API Reference](/api/) - Explore the full API
