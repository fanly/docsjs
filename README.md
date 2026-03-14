# 📄 DocsJS v2 - Document Transformation Platform

> A PicGo-inspired document processing platform with plugin ecosystem and configurable profiles. Transform documents with security, fidelity, and extensibility.

[![npm version](https://img.shields.io/npm/v/@coding01/docsjs)](https://www.npmjs.com/package/@coding01/docsjs)
[![License](https://img.shields.io/npm/l/@coding01/docsjs)](LICENSE)

## 🚀 Documentation Website

📚 **Explore our comprehensive documentation: [docsjs.coding01.cn](https://docsjs.coding01.cn)**

## 🚀 Key Features

- 🔌 **Plugin Ecosystem** - 8 lifecycle hooks with security sandboxing ([Learn more](./PLUGINS.md))
- 📋 **Configurable Profiles** - Knowledge Base, Exam Paper, Enterprise defaults ([Learn more](./PROFILES.md))
- 🛡️ **Security-First** - Granular permissions and execution sandboxing
- ⚡ **High Fidelity** - Preserve Word document semantics and layout
- 🌐 **Multi-Format** - DOCX / HTML / Markdown / JSON with AST core
- 🏗️ **Platform-Grade** - Designed for extensibility and integrations
- ⚡ **Built with Vite+** - Powered by the next-generation unified toolchain (Vite 8 + Rolldown + Oxlint)

## 🛠️ Built with Vite+

DocsJS is built and powered by [Vite+](https://viteplus.dev), the next-generation unified JavaScript toolchain:

```bash
# Development
vp dev              # Start dev server with HMR
vp test             # Run tests with Vitest 4.1
vp check            # TypeScript + Oxlint + Oxfmt

# Build & Release
vp build            # Production build with Rolldown
vp pack             # Package library for distribution
```

### Why Vite+?

- **🚀 Faster Builds** - Rolldown-based bundling for optimal production output
- **🔒 Type-Safe** - Integrated Oxlint for comprehensive linting with type awareness
- **📦 Smaller Bundles** - Tree-shaking and code splitting optimized for production
- **🧪 Better Testing** - Vitest 4.1 with improved performance and reliability
- **🎯 Unified Toolchain** - Single CLI for dev, test, build, and lint workflows

## 🏗️ Core Architecture

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

## 🚀 Quick Start

### Installation

```bash
npm install @coding01/docsjs
```

### Web Component

```html
<script type="module">
  import { defineDocsWordElement } from "@coding01/docsjs";
  defineDocsWordElement();
</script>

<docs-word-editor></docs-word-editor>
```

### React Integration

```tsx
import { WordFidelityEditorReact } from "@coding01/docsjs/react";

function App() {
  return (
    <WordFidelityEditorReact
      config={{ profile: "knowledge-base" }}
      onReady={() => console.log("Ready!")}
      onChange={console.log}
    />
  );
}
```

### Advanced Usage - Plugin System

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();

// Apply processing profile
engine.applyProfile("knowledge-base");

// Register plugins with 8 lifecycle hooks
const contentEnhancer = {
  name: "math-enhancer",
  availableHooks: ["beforeRender"] as const,
  permissions: {
    compute: { maxMemoryMB: 20 },
    ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
  },
  beforeRender: (context) => {
    // Enhance content before final rendering
    context.pipeline.state.intermediate.mathEnchanced = true;
    return context;
  },
};

engine.registerPlugin(contentEnhancer);

// Transform with full functionality
const result = await engine.transformDocument(file);
console.log(result.output); // Converted content
console.log(result.diagnostics); // Errors and warnings
console.log(result.metrics); // Performance data
```

### Profile System

Switch processing behavior based on use-case:

```ts
// For documentation with high fidelity
engine.applyProfile("knowledge-base");

// For exam papers with question extraction
engine.applyProfile("exam-paper");

// For enterprise docs with security focus
engine.applyProfile("enterprise-document");

// Custom profiles
const custom = {
  id: "scientific-paper",
  name: "Scientific Paper Processor",
  parse: { features: { mathML: true, tables: true, images: false } },
  security: { allowedDomains: ["arxiv.org"], sanitizerProfile: "fidelity-first" },
};
engine.registerProfile(custom);
```

## 🔌 Plugin Development

Build extendable functionality with security controls:

```ts
const myPlugin = {
  name: "table-of-contents-generator",
  version: "1.0.0",
  supportedHooks: ["afterParse", "beforeRender"] as const,
  permissions: {
    // Security enforcement
    read: ["."],
    write: ["."],
    network: false,
    compute: { maxMemoryMB: 15, maxCpuSecs: 5 },
    ast: { canModifySemantics: true, canAccessOriginal: true, canExportRawAst: false },
    export: { canGenerateFiles: false, canUpload: false },
    misc: { allowUnsafeCode: false },
  },
  afterParse: (context) => {
    // Extract heading structure from AST
    context.pipeline.state.intermediate.tocDetected = true;
    return context;
  },
  beforeRender: (context) => {
    // Insert ToC before final rendering
    if (context.pipeline.state.intermediate.tocDetected) {
      context.pipeline.state.intermediate.insertTocAtStart = true;
    }
    return context;
  },
};
```

**8 Available Lifecycle Hooks:**

- `beforeParse, afterParse` → Document parsing
- `beforeTransform, afterTransform` → AST processing
- `beforeRender, afterRender` → Content rendering
- `beforeExport, afterExport` → Output preparation

## 💼 Use Cases

| **Scenario**                | **Best Profile** | **Key Features**                             |
| --------------------------- | ---------------- | -------------------------------------------- |
| **Technical Documentation** | `knowledge-base` | High-fidelity, MathML support, tables        |
| **Academic Papers**         | `exam-paper`     | Question extraction, strict semantic parsing |
| **Corporate Documents**     | `enterprise`     | Security, compliance, sanitization           |
| **General Use**             | `default`        | Balanced performance vs fidelity             |

## 🌟 Platform Benefits

### For End Users

- **Rich Semantic Fidelity**: Word → HTML with layout, math, tables preserved
- **Configurable Workflows**: Switch processing based on document type/use case
- **Security Focused**: Sandboxed execution of plugins, granular controls
- **Performance Optimized**: Streaming processing for large documents

### For Developers

- **Extensible Architecture**: 8 hook points for custom functionality injection
- **Security Model**: Fine-grained permissions for safe plugin ecosystem
- **Profile System**: Configure processing behavior for domain-specific needs
- **Integration Friendly**: API and component interfaces

### For Organizations

- **Enterprise-Grade**: Audit trails, compliance-ready profiles
- **Scalable**: Worker management and resource controls
- **Platform Capable**: Ready for CMS/blog editor integrations
- **Extensible**: Internal plugin development enabled

## 🌐 CMS & Platform Integrations

DocsJS integrates with major content platforms:

| Platform                | Integration                |
| ----------------------- | -------------------------- |
| **WordPress**           | Publish posts via REST API |
| **Ghost**               | Blog posts and newsletters |
| **Notion**              | Pages and databases        |
| **Confluence**          | Enterprise documentation   |
| **GitBook**             | Technical documentation    |
| **Moodle**              | Educational content        |
| **Blackboard**          | Course materials           |
| **SharePoint**          | Enterprise documents       |
| **Box/OneDrive/GDrive** | Cloud storage              |

## 🔐 Enterprise Features

- **SSO Integration**: SAML 2.0, OAuth 2.0/OIDC (Okta, Azure AD, Auth0)
- **Multi-tenancy**: Organization-based isolation
- **Audit Logging**: Full activity tracking
- **Compliance**: SOX, FERPA, HIPAA ready profiles

## 🤖 AI-Powered Features

- **Document Generation**: Generate from templates (meeting notes, proposals, specs)
- **Smart Extraction**: Extract contacts, tables, dates, links
- **AI Comparison**: Semantic diff between documents
- **Auto-structure Detection**: Automatically detect document type
- **RAG Engine**: Semantic search over document content

## 📱 Editor Adapters

Convert between DocumentAST and popular editors:

- **TipTap** - Headless editor framework
- **Slate** - Customizable rich text
- **ProseMirror** - Schema-based editing

## 🌍 Internationalization

- **20+ Languages**: Full i18n support
- **RTL Languages**: Arabic, Hebrew, Persian, Urdu support
- **RTL Layout**: Automatic layout mirroring

## ☁️ Cloud & Enterprise

- **REST API Server**: Convert, batch, async jobs
- **Webhooks**: Event-driven workflows
- **Rate Limiting**: Token bucket algorithm
- **Storage**: Redis, PostgreSQL, memory backends

## 💰 SaaS Platform Ready

- **Organization Management**: Multi-team workspaces
- **Subscription Billing**: Stripe/Paddle integration
- **Usage-Based Billing**: API calls, storage, transformations
- **Plugin Marketplace**: Commercial plugins with revenue sharing

## 🛡️ Security Model

Security is built into the core:

- **Plugin Sandboxing**: Execution isolation
- **Permission System**: Granular file, network, compute access controls
- **AST Protection**: Prevent unintended semantic changes
- **Content Sanitization**: Profile-dependent sanitization (fidelity-first to strict)

## 📚 Documentation

- [Plugin Development](./PLUGINS.md) - Build your own plugins
- [Profile Configuration](./PROFILES.md) - Customize processing behavior
- [API Reference](./API.md) - Full API documentation
- [Security Model](./SECURITY.md) - Permissions and sandboxing details

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

MIT License - Free for commercial and personal use.

---

Transform documents with unprecedented fidelity and extensibility. Platform-grade security. PicGo-inspired extensibility. Ready for the next generation of document processing workflows.
