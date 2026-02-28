# 🔄 Migration Guide: v1.x to v2.x

## 🚀 Overview

DocsJS v2 represents a platform-architectural upgrade while preserving full backward compatibility. This guide explains what's new and how your existing integrations continue to work unchanged.

## 🔄 Automatic Breaking Change Detection

✅ **ZERO breaking changes** - Every existing API continues to function identically

**Migration Path**: 
1. Update package version 
2. Existing code continues to work unchanged
3. New functionality becomes available (opt-in features)

## ✨ New Features (Opt-in)

### Enhanced Processing Profiles
The old system used a monolithic approach. The new system lets you choose purpose-optimized profiles:

**Before:**
```js
import { parseDocxToHtmlSnapshot } from '@coding01/docsjs';

const html = await parseDocxToHtmlSnapshot(file);
// One size fits all processing
```

**After (still compatible):**
```js
// Same call - identical behavior
import { parseDocxToHtmlSnapshot } from '@coding01/docsjs';

const html = await parseDocxToHtmlSnapshot(file); 
// Uses 'default' profile (preserves original behavior)  
```

**Plus new options:**
```js
import { CoreEngine } from '@coding01/docsjs';

const engine = new CoreEngine();

// Knowledge base profile for documentation fidelity
engine.applyProfile('knowledge-base');
const kbResult = await engine.transformDocument(file);

// Exam paper profile for question extraction  
engine.applyProfile('exam-paper');
const examResult = await engine.transformDocument(file);

// Enterprise profile for security/compliance
engine.applyProfile('enterprise-document');
const enterpriseResult = await engine.transformDocument(file);
```

### Plugin Ecosystem Ready
The system now supports plugins but your existing flow continues unchanged:

**Before:**
```js
// Simple import and usage
import { parseDocxToHtmlSnapshot } from '@coding01/docsjs';
const html = await parseDocxToHtmlSnapshot(file);
```

**After (still supported):**
```js
// Same import and usage works identically
import { parseDocxToHtmlSnapshot } from '@coding01/docsjs';
const html = await parseDocxToHtmlSnapshot(file);
```

**Plus advanced usage:**
```js
import { CoreEngine } from '@coding01/docsjs';

// When you want plugin capabilities
const engine = new CoreEngine();

// Register processing enhancement plugins
const mathEnhancer = {
  name: 'math-enhancer', 
  availableHooks: ['beforeRender'],
  permissions: { /* security configuration */},
  beforeRender: (context) => {
    // Add MathML processing
    context.pipelineState.enhancedMath = true; 
    return context;
  }
};

engine.registerPlugin(mathEnhancer);
```

### Performance & Security Monitoring
New rich diagnostics now available without changing existing code:

```js
import { parseDocxToHtmlSnapshotWithReport } from '@coding01/docsjs';

// Still has same simple usage
const { html, report } = await parseDocxToHtmlSnapshotWithReport(file);

console.log(report.performance.elapsedTimeMs);
console.log(report.features.mathMLCount); 
console.log(report.fidelityScore.semanticPreservation);
```

## 🔧 Migration Steps

### Step 1: Update Dependencies
```bash
npm install @coding01/docsjs@latest
```

### Step 2: Verify Existing Code Still Works
```js
// Your existing code should work unchanged
import { parseDocxToHtmlSnapshot } from '@coding01/docsjs';

const html = await parseDocxToHtmlSnapshot(yourFile);
console.log('Migration successful'); // This will run as before
```

### Step 3: Explore New Capabilities (Optional)

When you're ready, leverage new platform capabilities:

```js
import { CoreEngine, SYSTEM_PROFILES } from '@coding01/docsjs';

// New: Profile-based processing
const engine = new CoreEngine();
engine.applyProfile('knowledge-base'); // Higher fidelity for docs
const result = await engine.transformDocument(file);

// New: Plugin ecosystem 
engine.registerPlugin(yourCustomPlugin);
// Now processing will include both core functionality and your plugin

// New: Rich diagnostics and performance metrics
const richResult = await engine.transformDocumentWithReport(file);
console.log(richResult.performance);
console.log(richResult.diagnostics); 
console.log(richResult.fidelity);
```

## 📝 Feature Map: v1 → v2

| **Old Usage** | **New Capability** | **Change Required?** | 
|---------------|--------------------|----------------------|
| `parseDocxToHtmlSnapshot(file)` | Same behavior preserved | No |
| `parseDocxToHtmlSnapshotWithReport(file)` | More detailed reports | No |
| Plugins via complex hooks | 8 secure lifecycle hooks | Optional new |
| Single processing approach | Multiple profile optimization | Optional new |
| Basic error reporting | Rich diagnostics/metrics | Optional new |
| No security boundaries | Granular permissions | Transparent |
| No extensibility  | Plugin ecosystem ready | Optional |

## 🌐 Integration Guides

### React/Vue Components
Still work exactly the same:

```tsx
// Still works: No changes needed
import WordFidelityEditorReact from '@coding01/docsjs/react';

<WordFidelityEditorReact onReady={console.log} onChange={console.log} />
```

### New Advanced Patterns
When you're ready, use new capabilities:

```tsx  
import WordFidelityEditorReact from '@coding01/docsjs/react';

// New: Props-driven profiles
<WordFidelityEditorReact 
  config={{ profile: 'knowledge-base' }}  // Different processing mode
  onReady={console.log} 
  onChange={console.log} 
/>
```

### CLI Tools
Commands still function identically:
```bash
# This continues to work as before
npx docsjs process input.docx -o output.html
```

## 🚨 Potential Confusion Points to Avoid

### 1. Multiple Entry Points Are Related
```js
// OLD (still works)
import { parseDocxToHtmlSnapshot } from '@coding01/docsjs';

// NEW (additional options)
import { CoreEngine } from '@coding01/docsjs'; 
import { parseDocxToHtmlSnapshot } from '@coding01/docsjs'; // Same function, same behavior

// These are different ways to solve different needs
// Use the old way for simple conversions
// Use the new CoreEngine when you need profiles/plugins/advanced features
```

### 2. Security is Now Built-In (No Action Required) 
The new permission model is enforced automatically - your existing code benefits silently:
- Plugins execute in sandboxes (if you use plugins later)
- Network access restricted by default  
- Document processing resource limits enforced

### 3. Performance is Maintained
The enhanced architecture doesn't slow down old usage patterns:
- All the same parsing shortcuts are available
- No overhead applied when not using new features
- Rich diagnostics don't impact simple usage speed

## 🔧 Troubleshooting

### Issue: Unexpected behavior after update
**Solution**: Make sure you're importing from the primary entrypoint. The architecture upgrade maintains all external interfaces.

### Issue: Want to use new features but confused
**Solution**: Start with the `SYSTEM_PROFILES` - they preserve original behavior while offering new performance/fidelity options:
```js
import { CoreEngine } from '@coding01/docsjs';

const engine = new CoreEngine();
engine.applyProfile('default'); // This is same as original behavior
```

## 🎯 Migration Benefits

Even if you never use new features, you gain:
- ✅ **More reliable processing** (better error handling) 
- ✅ **Greater stability** (enhanced architecture)
- ✅ **Better security** (automatic when using plugins) 
- ✅ **Future compatibility** (forward-compatible design)
- ✅ **Performance insights** (optional diagnostic data)

The migration path ensures zero disruption while opening pathways for future enhancement.

---
**Ready to upgrade?**: Run `npm install @coding01/docsjs@latest` and continue using your existing implementation. Explore new capabilities at your pace.