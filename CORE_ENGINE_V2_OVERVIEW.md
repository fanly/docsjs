# DocsJS - Core Engine v2 (Development Branch)

This branch implements the next-generation document transformation engine with enhanced architecture based on the three-tier model, inspired by successful platforms like PicGo.

## 🏗️ Architecture Overview

The new engine implements the following three-tier architecture:

```
┌─────────────────────────────────────────────────┐
│ Platform Layer (CLI+Server+GUI+Profile Mgmt)  │
├─────────────────────────────────────────────────┤
│ Format Adapters (Multiple Parsers & Renderers)│
├─────────────────────────────────────────────────┤
│ Core Engine (AST, Pipeline, Plugin System)    │
└─────────────────────────────────────────────────┘
```

### Core Engine v2 Highlights

1. **Enhanced Plugin System**:
   - Lifecycle hooks (beforeParse, afterParse, beforeTransform, etc.)
   - Permission and security model
   - Dependency management
   - Priority-based execution
2. **Profile Management**:
   - Predefined profiles (Knowledge Base, Exam Paper, Enterprise)
   - Custom profile creation and sharing
   - Configuration-as-code approach

3. **Improved Pipeline**:
   - Streaming and chunk processing
   - Comprehensive metrics and diagnostics
   - Plugin orchestration
   - Error boundaries

4. **AST v2.0** (evolution of existing DocumentAST):
   - Enhanced schema with versioning
   - Improved migration capabilities
   - Better serialization

## 📁 Directory Structure

```
src/
├── engine/                 # Core engine implementation
│   └── core.ts            # Main engine class
├── types/                  # Shared type definitions
│   └── engine.ts          # Core engine types
├── pipeline/               # Pipeline orchestration
│   ├── types.ts           # Pipeline types
│   └── manager.ts         # Pipeline coordinator
├── plugins-v2/            # Enhanced plugin system
│   ├── types.ts           # Plugin type definitions
│   └── manager.ts         # Plugin lifecycle management
├── profiles/               # Profile management
│   └── profile-manager.ts # Profile registry and manager
└── engine-v2.ts           # Main entry point
```

## ✨ Key Features

### 1. Flexible Processing Profiles

Choose from predefined profiles for:

- Knowledge Base: High-fidelity, SEO-optimized
- Exam Paper: Clean formatting, question extraction
- Enterprise: Security & compliance focus

### 2. Extensible Plugin System

- 8 lifecycle hooks for deep integration points
- Secure sandbox execution for safety
- Permissions system for access control
- Dependency management

### 3. Performance Optimizations

- Streaming processing for large files
- Web Worker thread management
- Granular metrics and diagnostics
- Memory usage controls

## 🚧 Status & Roadmap

### Implemented ✅

- [x] Core engine foundation with configuration system
- [x] Complete plugin lifecycle and permission system
- [x] Profile management and system profiles
- [x] Enhanced pipeline orchestration
- [x] Type definitions for all major components

### Next Steps 🔜

- [ ] Full AST migration with backwards compatibility
- [ ] Integration with existing parsers (docx, html, md)
- [ ] Full renderer implementations (html, markdown)
- [ ] End-to-end integration tests

## 💡 Usage (Future API)

Example of the planned usage pattern:

```typescript
import { CoreEngine, SYSTEM_PROFILES } from "@coding01/docsjs-v2";

// Initialize engine
const engine = new CoreEngine({
  performance: { maxMemoryMB: 1024 },
  security: { enableSandboxes: true },
});

// Register profiles
engine.registerProfile(SYSTEM_PROFILES["knowledge-base"]);
engine.applyProfile("knowledge-base");

// Add plugins with lifecycle hooks
engine.registerPlugin({
  name: "image-enrichment",
  availableHooks: ["afterParse", "beforeRender"],
  afterParse: async (ctx) => {
    // Process images extracted during parsing
  },
  // ... implementation
});

// Transform document
const result = await engine.transformDocument(inputFile, "knowledge-base");

console.log(result.diagnostics);
```

## 🤝 Contributing

This branch represents the next major version of DocsJS. Contributions focused on:

- Plugin system enhancements
- Performance optimizations
- Additional format support
- Profile creation and tuning

Are especially welcome!

---

This work is part of the strategic evolution from a Word-to-HTML utility to a comprehensive document transformation platform.
