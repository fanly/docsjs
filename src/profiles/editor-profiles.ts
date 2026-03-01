/**
 * Editor Profiles
 * 
 * Specialized profiles optimized for different editor use cases:
 * - Academic: Papers, theses, research documents
 * - Business: Reports, memos, presentations
 * - Tech Author: API docs, technical documentation
 */

import type { TransformationProfile } from '../types/engine';

export interface EditorProfile extends TransformationProfile {
  /** Specific editor features */
  editorFeatures: {
    /** Enable real-time collaboration */
    collaboration?: boolean;
    /** Enable change tracking */
    changeTracking?: boolean;
    /** Enable comments */
    comments?: boolean;
    /** Enable suggestions */
    suggestions?: boolean;
    /** Enable version history */
    versionHistory?: boolean;
    /** Auto-save interval in ms */
    autoSaveInterval?: number;
  };
}

/**
 * Editor-focused profiles
 */
export const EDITOR_PROFILES: Record<string, EditorProfile> = {
  /**
   * Academic Editor Profile
   * Optimized for academic papers, theses, research documents
   * - Strict citation preservation
   * - Math/equation support
   * - Figure and table numbering
   * - Bibliography handling
   */
  academic: {
    id: 'academic',
    name: 'Academic Editor',
    description: 'Profile optimized for academic papers, theses, and research documents',
    editorFeatures: {
      changeTracking: true,
      comments: true,
      suggestions: true,
      versionHistory: true,
      autoSaveInterval: 30000,
    },
    parse: {
      enablePlugins: true,
      features: {
        mathML: true,
        tables: true,
        images: true,
        annotations: true,
        citations: true,
        footnotes: true,
      },
      performance: {
        chunkSize: 15 * 1024 * 1024,
        maxFileSizeMB: 80,
      },
    },
    transform: {
      enablePlugins: true,
      operations: [
        'normalize-citations',
        'preserve-footnotes',
        'number-figures',
        'number-tables',
        'preserve-cross-references',
      ],
    },
    render: {
      outputFormat: 'html',
      theme: 'academic',
      options: {
        fidelityMode: true,
        includeImageData: true,
        preserveComments: true,
        preserveTrackChanges: true,
      },
    },
    security: {
      allowedDomains: ['arxiv.org', 'pubmed.ncbi.nlm.nih.gov', 'scholar.google.com'],
      sanitizerProfile: 'strict',
    },
  },

  /**
   * Business Editor Profile
   * Optimized for corporate documents, reports, memos
   * - Professional formatting
   * - Header/footer preservation
   * - Confidentiality markers
   * - Watermark support
   */
  business: {
    id: 'business',
    name: 'Business Editor',
    description: 'Profile optimized for business documents, reports, and corporate communications',
    editorFeatures: {
      changeTracking: true,
      comments: true,
      suggestions: true,
      versionHistory: true,
      autoSaveInterval: 15000,
    },
    parse: {
      enablePlugins: true,
      features: {
        mathML: true,
        tables: true,
        images: true,
        annotations: true,
        headersFooters: true,
        watermarks: true,
      },
      performance: {
        chunkSize: 25 * 1024 * 1024,
        maxFileSizeMB: 100,
      },
    },
    transform: {
      enablePlugins: true,
      operations: [
        'preserve-headers-footers',
        'preserve-watermarks',
        'normalize-styles',
        'business-formatting',
      ],
    },
    render: {
      outputFormat: 'html',
      theme: 'business',
      options: {
        fidelityMode: true,
        includeImageData: true,
        preserveComments: true,
        professionalMode: true,
      },
    },
    security: {
      allowedDomains: [],
      sanitizerProfile: 'business',
    },
  },

  /**
   * Tech Author Profile
   * Optimized for API docs, technical documentation
   * - Code block preservation
   - Syntax highlighting
   - Collapsible sections
   - Search optimization
   */
  'tech-author': {
    id: 'tech-author',
    name: 'Tech Author',
    description: 'Profile optimized for technical documentation and API references',
    editorFeatures: {
      collaboration: true,
      changeTracking: true,
      comments: true,
      suggestions: false,
      versionHistory: true,
      autoSaveInterval: 10000,
    },
    parse: {
      enablePlugins: true,
      features: {
        mathML: true,
        tables: true,
        images: true,
        annotations: true,
        codeBlocks: true,
        syntaxHighlighting: true,
      },
      performance: {
        chunkSize: 30 * 1024 * 1024,
        maxFileSizeMB: 150,
      },
    },
    transform: {
      enablePlugins: true,
      operations: [
        'syntax-highlight-code',
        'extract-code-examples',
        'generate-toc',
        'optimize-for-search',
        'add-anchor-links',
      ],
    },
    render: {
      outputFormat: 'html',
      theme: 'tech-author',
      options: {
        fidelityMode: true,
        includeImageData: true,
        enableSyntaxHighlighting: true,
        collapsibleSections: true,
        includeToc: true,
      },
    },
    security: {
      allowedDomains: ['github.com', 'gitlab.com', 'readthedocs.org'],
      sanitizerProfile: 'fidelity-first',
    },
  },

  /**
   * Collaborative Editor Profile
   * Optimized for real-time collaborative editing
   * - Yjs support built-in
   * - Conflict resolution
   * - Presence awareness
   * - Cursor sharing
   */
  collaborative: {
    id: 'collaborative',
    name: 'Collaborative Editor',
    description: 'Profile optimized for real-time collaborative document editing',
    editorFeatures: {
      collaboration: true,
      changeTracking: true,
      comments: true,
      suggestions: true,
      versionHistory: true,
      autoSaveInterval: 5000,
    },
    parse: {
      enablePlugins: true,
      features: {
        mathML: true,
        tables: true,
        images: true,
        annotations: true,
      },
      performance: {
        chunkSize: 10 * 1024 * 1024,
        maxFileSizeMB: 50,
      },
    },
    transform: {
      enablePlugins: true,
      operations: [
        'normalize',
        'prepare-for-collab',
      ],
    },
    render: {
      outputFormat: 'html',
      theme: 'default',
      options: {
        fidelityMode: true,
        includeImageData: false,
        collaborativeMode: true,
      },
    },
    security: {
      allowedDomains: [],
      sanitizerProfile: 'balanced',
    },
  },
};

/**
 * Get editor profile by ID
 */
export function getEditorProfile(id: string): EditorProfile | undefined {
  return EDITOR_PROFILES[id];
}

/**
 * List all editor profiles
 */
export function listEditorProfiles(): EditorProfile[] {
  return Object.values(EDITOR_PROFILES);
}

/**
 * Create custom editor profile
 */
export function createCustomEditorProfile(
  baseId: string,
  overrides: Partial<EditorProfile>
): EditorProfile {
  const base = EDITOR_PROFILES[baseId];
  if (!base) {
    throw new Error(`Base profile '${baseId}' not found`);
  }
  
  return {
    ...base,
    ...overrides,
    id: overrides.id || `custom-${baseId}`,
    name: overrides.name || `Custom ${base.name}`,
  };
}
