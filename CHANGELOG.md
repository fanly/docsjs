# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-03-01

### 🚀 Major Features

#### Phase 1: Foundation (v2.0)
- **Web Component Core** - `<docs-word-editor>` custom element
- **React/Vue Adapters** - Full framework integration
- **Paste Pipeline** - Clipboard content processing
- **DOCX Import** - Full Word document parsing
- **OIDC Trusted Publishing** - Secure package distribution

#### Phase 2: Platformization (v2.1-v2.5)

##### v2.1: Plugin Ecosystem Foundation
- Public plugin registry implementation
- Plugin marketplace infrastructure
- Plugin approval and security review workflow
- Plugin version management and compatibility checker
- Usage metrics and analytics dashboard

##### v2.2: Editor Integration Kit
- TipTap plugin with real-time collaboration adapter
- Slate schema adapter with document AST mapping
- ProseMirror node spec with semantic fidelity
- Editor-focused profiles (Academic, Business, Tech Author)

##### v2.3: Enterprise Services
- Compliance processing profiles (SOX, FERPA, HIPAA ready)
- Comprehensive audit logging and reporting
- Document retention and lifecycle policies
- Enterprise SSO (SAML, OAuth2, OpenID Connect)
- On-premises deployment toolkit (Docker, Kubernetes)

##### v2.4: Cloud Infrastructure
- Serverless API endpoints for document transformation
- Bulk document processing with distributed queues
- Real-time conversion API with async callbacks
- CDN delivery infrastructure for transformation engine
- Webhook support for completion events

##### v2.5: ML-Assisted Features
- Auto-structure detection and semantic tagging
- Intelligent formatting and layout optimization suggestions
- Semantic similarity detection across documents
- Quality score prediction based on document characteristics

#### Phase 3: Integration (v3.0-v3.4)

##### v3.1: CMS Integrations
- WordPress plugin with Gutenberg compatibility
- Ghost CMS adapter with native workflow integration
- Notion data import/export module
- Confluence bridge with semantic mapping
- GitBook compatibility for docs transformation

##### v3.2: Educational Platform Suite
- Blackboard/Moodle integration adapters
- Exam question extraction and bank sync
- Academic document analytics and statistics
- Student privacy protection compliance
- Grade book integration with output conversion

##### v3.3: Enterprise Integration Hub
- Microsoft SharePoint connector
- Document repository integrations (Box/OneDrive/Google Drive)
- Enterprise compliance workflow certification
- API Gateway with rate limiting and quotas
- Document governance and classification

##### v3.4: Multi-Language Platform
- Right-to-Left language layout preservation
- International character set support
- Localized profile presets (Chinese academic, Arabic business)
- Unicode and encoding normalization protocols
- Translation memory and locale detection
- Plural forms and gender support

#### Phase 4: Infrastructure Grade (v4.0-v4.3)

##### v4.0: SaaS Platform Launch
- Organization-based account management
- Subscription and billing infrastructure (Stripe/Paddle)
- Self-service help center
- Usage-based billing

##### v4.1: Plugin Marketplace Economy
- Commercial plugin distribution framework
- Plugin marketplace with revenue sharing (70/30 split)
- Creator payment and revenue tracking system
- Plugin quality scoring and recommendations

##### v4.2: Embedded Services Architecture
- SDK for embedding DocsJS in 3rd party products
- White-label product packaging
- Component marketplace compatibility

##### v4.3: AI-Native Platform
- Generative document AI (templates, summaries, outlines)
- Intelligent document analytics and insights
- Conversational document transformation assistants
- RAG Engine for semantic search

### 🛠️ Technical Improvements

- **Performance**: Benchmark runner with regression detection
- **Collaboration**: Real-time collaboration with Yjs CRDT
- **Security**: Granular permissions and sandboxing
- **Extensibility**: 8 lifecycle hooks for plugins

### 📦 New Modules

| Module | Description |
|--------|-------------|
| `src/marketplace/` | Plugin registry, approval, analytics, economy |
| `src/enterprise/` | Compliance, deployment, SSO, integration hub |
| `src/cloud/` | Serverless, queue, CDN, webhooks |
| `src/ai/` | Similarity, quality, layout, RAG, generation |
| `src/lms/` | Academic, gradebook |
| `src/i18n/` | Translation memory, locale detection |
| `src/collaboration/` | Real-time collaboration |
| `src/lib/benchmark/` | Performance benchmarking |
| `src/saas/` | Organization, billing |
| `src/embedded/` | SDK, white-label |

### 🔧 Dependencies Added

- `yjs` - CRDT for real-time collaboration

### 📝 Updated Exports

- Core Engine, Pipeline, Profile Manager
- All CMS adapters (WordPress, Ghost, Notion, Confluence, GitBook)
- LMS adapters (Blackboard, Moodle)
- Enterprise adapters (SharePoint, Box, OneDrive, Google Drive)
- All AI modules

---

## [0.2.0] - 2024-02-XX

### Added
- Initial platform architecture
- Plugin system v2 with 8 lifecycle hooks
- Profile management system (Knowledge Base, Exam Paper, Enterprise)
- DocumentAST v2 with semantic preservation

---

## [0.1.0] - 2024-01-XX

### Added
- DOCX parser
- HTML/Markdown renderers
- Basic web component
