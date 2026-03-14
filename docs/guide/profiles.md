---
layout: doc
---

# Profile System

Configure DocsJS processing behavior for different use cases.

## Overview

Profiles are preset configurations that define how documents are processed. They control parsing features, security settings, and output formats.

## Built-in Profiles

### default

Balanced performance and fidelity for general use.

```ts
engine.applyProfile("default");
```

Features:

- Standard parsing features
- Basic sanitization
- HTML output

### knowledge-base

High-fidelity processing for technical documentation.

```ts
engine.applyProfile("knowledge-base");
```

Features:

- MathML support
- Table preservation
- Image hydration
- Footnote handling
- Cross-reference support

### exam-paper

Specialized for academic and exam content.

```ts
engine.applyProfile("exam-paper");
```

Features:

- Question extraction
- Answer detection
- Strict semantic parsing
- Numbering preservation

### enterprise-document

Security-focused for corporate documents.

```ts
engine.applyProfile("enterprise-document");
```

Features:

- Strict sanitization
- External link removal
- Script stripping
- Compliance logging

## Creating Custom Profiles

### Basic Profile

```ts
const customProfile = {
  id: "my-profile",
  name: "My Custom Profile",
  description: "Custom processing configuration",
};
```

### Full Profile Configuration

```ts
const fullProfile = {
  id: "scientific-paper",
  name: "Scientific Paper Processor",
  description: "Optimized for academic papers",

  parse: {
    features: {
      mathML: true,
      tables: true,
      images: true,
      footnotes: true,
      citations: true,
      crossReferences: true,
    },
    options: {
      preserveStyles: true,
      extractMetadata: true,
    },
  },

  transform: {
    preserveStructure: true,
    extractMetadata: true,
    customRules: [],
  },

  render: {
    format: "html",
    includeStyles: true,
    mathRenderer: "katex",
    codeHighlighter: "prism",
  },

  security: {
    allowedDomains: ["arxiv.org", "doi.org"],
    sanitizerProfile: "fidelity-first",
    removeScripts: true,
    removeExternalLinks: false,
  },

  export: {
    formats: ["html", "markdown", "json"],
    includeMetadata: true,
  },
};
```

## Registering Profiles

### With CoreEngine

```ts
import { CoreEngine } from "@coding01/docsjs";

const engine = new CoreEngine();
engine.registerProfile(customProfile);
engine.applyProfile("my-profile");
```

### With Component

```tsx
<WordFidelityEditorReact
  profile="my-profile"
  config={{
    profiles: [customProfile],
  }}
/>
```

## Profile Options

### Parse Options

| Option               | Type      | Description              |
| -------------------- | --------- | ------------------------ |
| `features.mathML`    | `boolean` | Enable MathML parsing    |
| `features.tables`    | `boolean` | Enable table parsing     |
| `features.images`    | `boolean` | Enable image extraction  |
| `features.footnotes` | `boolean` | Enable footnote handling |
| `preserveStyles`     | `boolean` | Preserve original styles |

### Transform Options

| Option              | Type      | Description                 |
| ------------------- | --------- | --------------------------- |
| `preserveStructure` | `boolean` | Keep document structure     |
| `extractMetadata`   | `boolean` | Extract document metadata   |
| `customRules`       | `array`   | Custom transformation rules |

### Render Options

| Option            | Type      | Description                        |
| ----------------- | --------- | ---------------------------------- |
| `format`          | `string`  | Output format (html/markdown/json) |
| `includeStyles`   | `boolean` | Include inline styles              |
| `mathRenderer`    | `string`  | Math rendering library             |
| `codeHighlighter` | `string`  | Code highlighting library          |

### Security Options

| Option                | Type      | Description              |
| --------------------- | --------- | ------------------------ |
| `allowedDomains`      | `array`   | Allowed external domains |
| `sanitizerProfile`    | `string`  | Sanitization level       |
| `removeScripts`       | `boolean` | Remove script elements   |
| `removeExternalLinks` | `boolean` | Remove external links    |

## Switching Profiles

### Runtime Switching

```ts
// Switch based on document type
if (isAcademicPaper(file)) {
  engine.applyProfile("exam-paper");
} else if (isEnterpriseDoc(file)) {
  engine.applyProfile("enterprise-document");
} else {
  engine.applyProfile("knowledge-base");
}
```

### Per-Document

```ts
const result = await engine.transformDocument(file, {
  profile: "scientific-paper",
});
```

## Profile Composition

Combine settings from multiple sources:

```ts
const baseProfile = engine.getProfile("knowledge-base");
const customProfile = {
  ...baseProfile,
  security: {
    ...baseProfile.security,
    sanitizerProfile: "strict",
  },
};
```

## Best Practices

1. **Start with built-ins** - Use built-in profiles as starting points
2. **Document decisions** - Explain why custom settings are needed
3. **Test thoroughly** - Verify output quality with sample documents
4. **Version control** - Track profile changes over time
5. **Share profiles** - Reuse profiles across projects

## Next Steps

- [Plugin System](/guide/plugins) - Extend functionality with plugins
- [Security Model](/guide/security) - Understand security controls
- [API Reference](/api/) - Full API documentation
