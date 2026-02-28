# 🛡️ Security Model & Sandboxing Architecture

The DocsJS v2 security model implements defense-in-depth with zero-trust for plugin execution while maintaining platform extensibility.

## **Threat Model**

Understanding the attack classes we defend against:

### Primary Threats:
- **Code Injection**: Malicious plugins executing dangerous scripts or code
- **Information Disclosure**: Plugins exfiltrating document content or structure
- **Resource Exhaustion**: Plugins consuming unlimited memory/CPU/time
- **File System Abuse**: Plugins accessing sensitive files or writing destructively  
- **Network Exfiltration**: Plugins sending document content externally
- **AST Integrity Violations**: Plugins corrupting document semantics

### Attack Scenarios Mitigated:
- Malicious plugin stealing confidential documents
- Plugin performing DoS on resource allocation
- Plugin escalating privileges by exploiting engine internals
- Plugin bypassing permission controls

---

## **Security Architecture**

### **1. Granular Permission System**

Every operation is controlled by specific permissions:

```typescript
interface PluginPermissions {
  // File System Permissions  
  read: string[];    // Paths that can be read from
  write: string[];   // Paths that can write to
  network: boolean;  // Whether network access allowed at all
  
  // Computation Limits (Resource Control)
  compute: {
    maxThreads: number;     // CPU cores allowed for plugin
    maxMemoryMB: number;    // Memory upper bound (10MB default)  
    maxCpuSecs: number;     // Time allowed for execution (5secs default)
  };
  
  // AST Access Permissions (Semantic Security)
  ast: {
    canModifySemantics: boolean;    // Can change meaning of document?
    canAccessOriginal: boolean;     // Can view original AST structure?
    canExportRawAst: boolean;       // Can output raw AST externally?
  };
  
  // Export Limits (Data Leakage Prevention)
  export: {
    canGenerateFiles: boolean;      // Can generate output files?  
    canUpload: boolean;             // Can upload to external servers?
  };
  
  // Miscellaneous Safety Controls
  misc: {
    allowUnsafeCode: boolean;       // Can execute eval/unsafe ops? (Always false)
  };
}
```

### **2. Execution Sandboxing**

Each plugin executes in restricted context:

```
┌─────────────────────────────────────────────────────────────┐
│ Plugin Process (Isolated Context)                          │
├─────────────────────────────────────────────────────────────┤
│ - Limited to assigned permissions only                      │
│ - Resource consumption metered                              │
│ - No direct access to engine internals                      │
│ - All operations subject to permission checks               │
│ - Execution terminates when limits reached                  │
└─────────────────────────────────────────────────────────────┘
            │
            ▼ (Mediated)
┌─────────────────────────────────────────────────────────────┐
│ Engine Core (Privileged Context)                           │
├─────────────────────────────────────────────────────────────┤  
│ - Enforces all permissions                                    │
│ - Monitors all resource usage                               │
│ - Controls all side effects                                 │
│ - Maintains AST integrity                                   │
└─────────────────────────────────────────────────────────────┘
```

### **3. Hook-Specific Security Enforcement**

Each execution phase has appropriate security:

| **Hook Phase** | **Security Focus** | **Constraints Applied** |
|----------------|--------------------|--------------------------|
| `beforeParse`   | Input inspection   | Read-only file access, can't see AST |
| `afterParse`    | AST modification   | AST semantics modification permission check |
| `beforeTransform` | AST preparation | AST read/write based on permissions |
| `afterTransform` | AST integrity | Validation that semantics preserved |
| `beforeRender`  | Content access   | AST read allowed based on canAccessOriginal | 
| `afterRender`   | Output inspection | Export permissions checked here |
| `beforeExport`  | Data leakage     | CanExport permissions validated |
| `afterExport`   | Side effects     | File write permissions enforced |

---

## **Permission Validation Strategy**

### **Runtime Enforcement**
```typescript
async function executePluginLifecycle(plugin, hookType, context) {
  // 1. Validate hook-specific permissions
  const permissionCheck = validatePermissions(plugin.permissions, hookType);
  if (!permissionCheck.allowed) {
    throw new SecurityError(`Plugin ${plugin.name} lacks ${hookType} permission`);
  }
  
  // 2. Create privileged context with enforced limits
  const privilegedContext = createContextWithLimits(
    context, 
    plugin.permissions
  );
  
  // 3. Execute within resource constraints
  return withResourceLimits(
    plugin.permissions.compute,
    () => plugin[hookType]?.(privilegedContext)
  );
}
```

### **Resource Usage Monitoring**
- Each plugin execution is metered in real-time
- Memory consumption tracked and capped
- CPU time monitored with hard limits
- File access logged and validated against permissions

### **AST Integrity Protection**
- All AST mutations are validated against schema
- Semantic preservation checks prevent meaningful corruption
- Content integrity hashes verify no accidental alterations
- Versioning control prevents downgrades to vulnerable schemas

---

## **Defense Layers**

### **Layer 1: Permission Validation**
- Strict allow-list permission model
- Granular path restrictions for file access
- Network connectivity completely severed by default
- Compute limits enforced for all operations

### **Layer 2: Execution Isolation**  
- Separate process/context for plugin execution
- No access to internal engine state
- All communication via controlled interfaces

### **Layer 3: Resource Caps**
- Hard memory limits per plugin (typically 5-10MB)
- Execution time limits (typically 5-10 seconds)  
- Thread/process count restrictions
- File size/write amount limits

### **Layer 4: Content Protection**
- AST exports require explicit permission
- Document content cannot be exfiltrated without permission
- All AST mutations are integrity-validated
- Semantic meaning preservation enforced

### **Layer 5: Audit Trailing**
- All plugin activities logged with detailed traces
- Security violations captured and escalated
- Performance impacts of plugins tracked
- Anomaly patterns identified in real-time

---

## **Security Defaults & Best Practices**

### **Strong Security Out-of-Box**
- Default plugin permissions: `network: false` 
- Default compute limits: 10MB memory, 5 seconds CPU
- Default AST: `canExportRawAst: false`
- Default export: `canUpload: false`
- No unsafe code evaluation enabled by default

### **Security by Default Configuration**
```typescript
const DEFAULT_PLUGIN_PERMISSIONS = {
  read: [],           // No file read by default
  write: [],          // No file write by default  
  network: false,     // Network disabled by default
  compute: { maxThreads: 1, maxMemoryMB: 5, maxCpuSecs: 5 }, // Conservative
  ast: { canModifySemantics: false, canAccessOriginal: false, canExportRawAst: false }, // Secure defaults
  export: { canGenerateFiles: false, canUpload: false }, // Data protection
  misc: { allowUnsafeCode: false } // Safety guaranteed
};
```

---

## **Security Validation Process**

### **Plugin Registration Security Check**
When a plugin is registered, we validate:
- All declared permissions are valid and secure
- No dangerous operations granted by default
- Dependencies are from trusted sources
- No conflicting permissions with other plugins

### **Runtime Security Monitoring**  
During execution:
- Continuous resource consumption monitoring
- Live permission enforcement at access time
- Immediate termination on policy violation
- Automatic recovery and logging from violations

### **Security Reporting**
- Complete audit log of all plugin activity
- Security metrics and violation reports
- Performance impact of security constraints
- Compliance and regulatory reporting

---

## **Compliance Support**

### **Enterprise Security**
- FIPS-compliant cryptography where applicable
- Detailed user privacy controls for document handling
- Audit logs meeting enterprise requirements
- Secure software supply chain for plugin verification

### **Data Processing Protection**
- GDPR-ready by default (no network access, no data transfer)
- Document content remains within processing scope
- Export controls prevent unauthorized transmission
- Complete data lifecycle controls

---

The security model provides robust protection while enabling safe and scalable plugin development, maintaining the platform's extensibility without compromising safety.