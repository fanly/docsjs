/**
 * Enterprise Compliance Profiles
 * 
 * Compliance processing profiles for SOX, FERPA, HIPAA, and other regulations.
 */



/**
 * Compliance framework types
 */
export enum ComplianceFramework {
  SOX = 'sox',           // Sarbanes-Oxley Act
  FERPA = 'ferpa',       // Family Educational Rights and Privacy Act
  HIPAA = 'hipaa',       // Health Insurance Portability and Accountability Act
  GDPR = 'gdpr',         // General Data Protection Regulation
  PCI_DSS = 'pci_dss',   // Payment Card Industry Data Security Standard
  ISO_27001 = 'iso27001' // Information Security Management
}

/**
 * Compliance profile configuration
 */
export interface ComplianceProfileConfig {
  /** Framework */
  framework: ComplianceFramework;
  /** Profile name */
  name: string;
  /** Enabled features */
  features: ComplianceFeature[];
  /** Data handling rules */
  dataHandling: DataHandlingRules;
  /** Retention requirements */
  retention: RetentionRequirements;
  /** Access control */
  accessControl: AccessControlRules;
  /** Audit requirements */
  auditLevel: 'basic' | 'standard' | 'strict';
  /** Encryption requirements */
  encryption: EncryptionRequirements;
}

/**
 * Data handling rules
 */
export interface DataHandlingRules {
  /** PII must be masked */
  maskPII: boolean;
  /** PII patterns to detect */
  piiPatterns: string[];
  /** Redact sensitive data */
  redactPatterns: string[];
  /** Maximum data retention days */
  maxRetentionDays: number;
  /** Allow external processing */
  allowExternalProcessing: boolean;
  /** Data must stay in region */
  dataResidency?: 'us' | 'eu' | 'apac';
}

/**
 * Retention requirements
 */
export interface RetentionRequirements {
  /** Minimum retention days */
  minDays: number;
  /** Maximum retention days */
  maxDays: number;
  /** Require approval for deletion */
  deletionApproval: boolean;
  /** Archive before delete */
  archiveBeforeDelete: boolean;
  /** Immutable audit trail required */
  immutableAuditTrail: boolean;
}

/**
 * Access control rules
 */
export interface AccessControlRules {
  /** Require multi-factor authentication */
  requireMFA: boolean;
  /** Role-based access only */
  roleBasedAccess: boolean;
  /** Session timeout minutes */
  sessionTimeoutMinutes: number;
  /** IP allowlist enabled */
  ipAllowlist: boolean;
  /** Allowed IP ranges */
  allowedIPs?: string[];
}

/**
 * Encryption requirements
 */
export interface EncryptionRequirements {
  /** Require encryption at rest */
  requireAtRest: boolean;
  /** Require encryption in transit */
  requireInTransit: boolean;
  /** Minimum key length */
  minKeyLength: number;
  /** Allowed algorithms */
  allowedAlgorithms: string[];
}

/**
 * Compliance feature flags
 */
export enum ComplianceFeature {
  AUDIT_LOGGING = 'audit_logging',
  DATA_MASKING = 'data_masking',
  ACCESS_CONTROL = 'access_control',
  ENCRYPTION = 'encryption',
  DATA_RETENTION = 'data_retention',
  CONSENT_MANAGEMENT = 'consent_management',
  RIGHT_TO_DELETE = 'right_to_delete',
  DATA_PORTABILITY = 'data_portability',
  BREACH_NOTIFICATION = 'breach_notification',
  TRAINING_TRACKING = 'training_tracking'
}

/**
 * SOX Compliance Profile
 */
export const SOX_PROFILE: ComplianceProfileConfig = {
  framework: ComplianceFramework.SOX,
  name: 'SOX Compliance',
  features: [
    ComplianceFeature.AUDIT_LOGGING,
    ComplianceFeature.DATA_MASKING,
    ComplianceFeature.ACCESS_CONTROL,
    ComplianceFeature.ENCRYPTION,
    ComplianceFeature.DATA_RETENTION,
    ComplianceFeature.BREACH_NOTIFICATION
  ],
  dataHandling: {
    maskPII: true,
    piiPatterns: ['\\b\\d{3}-\\d{2}-\\d{4}\\b', '\\b\\d{16}\\b'], // SSN, Credit Card
    redactPatterns: ['financial_data', 'executive_compensation'],
    maxRetentionDays: 2555, // 7 years
    allowExternalProcessing: false,
    dataResidency: 'us'
  },
  retention: {
    minDays: 2555, // 7 years
    maxDays: 3650, // 10 years
    deletionApproval: true,
    archiveBeforeDelete: true,
    immutableAuditTrail: true
  },
  accessControl: {
    requireMFA: true,
    roleBasedAccess: true,
    sessionTimeoutMinutes: 15,
    ipAllowlist: true
  },
  auditLevel: 'strict',
  encryption: {
    requireAtRest: true,
    requireInTransit: true,
    minKeyLength: 256,
    allowedAlgorithms: ['AES-256-GCM', 'RSA-OAEP']
  }
};

/**
 * FERPA Compliance Profile
 */
export const FERPA_PROFILE: ComplianceProfileConfig = {
  framework: ComplianceFramework.FERPA,
  name: 'FERPA Compliance',
  features: [
    ComplianceFeature.AUDIT_LOGGING,
    ComplianceFeature.DATA_MASKING,
    ComplianceFeature.ACCESS_CONTROL,
    ComplianceFeature.DATA_RETENTION,
    ComplianceFeature.CONSENT_MANAGEMENT,
    ComplianceFeature.DATA_PORTABILITY
  ],
  dataHandling: {
    maskPII: true,
    piiPatterns: [
      '\\b\\d{3}-\\d{2}-\\d{4}\\b', // SSN
      '\\b[A-Z]{2}\\d{6,9}\\b', // Student ID
      '\\b\\d{3}[-.]?\\d{3}[-.]?\\d{4}\\b' // Phone
    ],
    redactPatterns: ['grades', 'disciplinary_records', 'medical_records'],
    maxRetentionDays: 2190, // 6 years
    allowExternalProcessing: false,
    dataResidency: 'us'
  },
  retention: {
    minDays: 2190, // 6 years
    maxDays: 2920, // 8 years
    deletionApproval: true,
    archiveBeforeDelete: true,
    immutableAuditTrail: true
  },
  accessControl: {
    requireMFA: true,
    roleBasedAccess: true,
    sessionTimeoutMinutes: 30,
    ipAllowlist: false
  },
  auditLevel: 'standard',
  encryption: {
    requireAtRest: true,
    requireInTransit: true,
    minKeyLength: 128,
    allowedAlgorithms: ['AES-128-GCM', 'RSA-OAEP']
  }
};

/**
 * HIPAA Compliance Profile
 */
export const HIPAA_PROFILE: ComplianceProfileConfig = {
  framework: ComplianceFramework.HIPAA,
  name: 'HIPAA Compliance',
  features: [
    ComplianceFeature.AUDIT_LOGGING,
    ComplianceFeature.DATA_MASKING,
    ComplianceFeature.ACCESS_CONTROL,
    ComplianceFeature.ENCRYPTION,
    ComplianceFeature.DATA_RETENTION,
    ComplianceFeature.BREACH_NOTIFICATION,
    ComplianceFeature.CONSENT_MANAGEMENT
  ],
  dataHandling: {
    maskPII: true,
    piiPatterns: [
      '\\b\\d{3}-\\d{2}-\\d{4}\\b', // SSN
      '\\b\\d{9}\\b', // Medical Record Number
      '\\b\\d{3}[-.]?\\d{2}[-.]?\\d{4}\\b', // Phone
      '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b' // Email
    ],
    redactPatterns: ['diagnosis', 'treatment', 'prescription', 'medical_history'],
    maxRetentionDays: 2190, // 6 years
    allowExternalProcessing: false,
    dataResidency: 'us'
  },
  retention: {
    minDays: 2190, // 6 years
    maxDays: 3650, // 10 years
    deletionApproval: true,
    archiveBeforeDelete: true,
    immutableAuditTrail: true
  },
  accessControl: {
    requireMFA: true,
    roleBasedAccess: true,
    sessionTimeoutMinutes: 15,
    ipAllowlist: true
  },
  auditLevel: 'strict',
  encryption: {
    requireAtRest: true,
    requireInTransit: true,
    minKeyLength: 256,
    allowedAlgorithms: ['AES-256-GCM', 'RSA-OAEP', 'ECC']
  }
};

/**
 * GDPR Compliance Profile
 */
export const GDPR_PROFILE: ComplianceProfileConfig = {
  framework: ComplianceFramework.GDPR,
  name: 'GDPR Compliance',
  features: [
    ComplianceFeature.AUDIT_LOGGING,
    ComplianceFeature.DATA_MASKING,
    ComplianceFeature.ACCESS_CONTROL,
    ComplianceFeature.ENCRYPTION,
    ComplianceFeature.DATA_RETENTION,
    ComplianceFeature.CONSENT_MANAGEMENT,
    ComplianceFeature.RIGHT_TO_DELETE,
    ComplianceFeature.DATA_PORTABILITY,
    ComplianceFeature.BREACH_NOTIFICATION
  ],
  dataHandling: {
    maskPII: true,
    piiPatterns: [
      '\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b', // Email
      '\\b\\+?\\d{1,3}[-.\\s]?\\(?\\d{1,4}\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}\\b', // Phone
      '\\b\\d{4}[-]?\\d{4}[-]?\\d{4}[-]?\\d{4}\\b' // Credit Card
    ],
    redactPatterns: [],
    maxRetentionDays: 730, // 2 years
    allowExternalProcessing: false,
    dataResidency: 'eu'
  },
  retention: {
    minDays: 0,
    maxDays: 730,
    deletionApproval: false,
    archiveBeforeDelete: false,
    immutableAuditTrail: true
  },
  accessControl: {
    requireMFA: false,
    roleBasedAccess: true,
    sessionTimeoutMinutes: 60,
    ipAllowlist: false
  },
  auditLevel: 'standard',
  encryption: {
    requireAtRest: true,
    requireInTransit: true,
    minKeyLength: 128,
    allowedAlgorithms: ['AES-128-GCM', 'RSA-OAEP']
  }
};

/**
 * Compliance profile map
 */
export const COMPLIANCE_PROFILES: Record<ComplianceFramework, ComplianceProfileConfig> = {
  [ComplianceFramework.SOX]: SOX_PROFILE,
  [ComplianceFramework.FERPA]: FERPA_PROFILE,
  [ComplianceFramework.HIPAA]: HIPAA_PROFILE,
  [ComplianceFramework.GDPR]: GDPR_PROFILE,
  [ComplianceFramework.PCI_DSS]: {
    framework: ComplianceFramework.PCI_DSS,
    name: 'PCI-DSS Compliance',
    features: [ComplianceFeature.AUDIT_LOGGING, ComplianceFeature.DATA_MASKING, ComplianceFeature.ENCRYPTION, ComplianceFeature.ACCESS_CONTROL],
    dataHandling: {
      maskPII: true,
      piiPatterns: ['\\b\\d{4}[-]?\\d{4}[-]?\\d{4}[-]?\\d{4}\\b'],
      redactPatterns: ['cvv', 'pin'],
      maxRetentionDays: 365,
      allowExternalProcessing: false,
      dataResidency: 'us'
    },
    retention: { minDays: 365, maxDays: 730, deletionApproval: true, archiveBeforeDelete: true, immutableAuditTrail: true },
    accessControl: { requireMFA: true, roleBasedAccess: true, sessionTimeoutMinutes: 15, ipAllowlist: true },
    auditLevel: 'strict',
    encryption: { requireAtRest: true, requireInTransit: true, minKeyLength: 256, allowedAlgorithms: ['AES-256-GCM'] }
  },
  [ComplianceFramework.ISO_27001]: {
    framework: ComplianceFramework.ISO_27001,
    name: 'ISO 27001 Compliance',
    features: [ComplianceFeature.AUDIT_LOGGING, ComplianceFeature.ACCESS_CONTROL, ComplianceFeature.ENCRYPTION, ComplianceFeature.DATA_RETENTION],
    dataHandling: {
      maskPII: false,
      piiPatterns: [],
      redactPatterns: [],
      maxRetentionDays: 1095, // 3 years
      allowExternalProcessing: false
    },
    retention: { minDays: 1095, maxDays: 1825, deletionApproval: true, archiveBeforeDelete: true, immutableAuditTrail: true },
    accessControl: { requireMFA: true, roleBasedAccess: true, sessionTimeoutMinutes: 30, ipAllowlist: false },
    auditLevel: 'strict',
    encryption: { requireAtRest: true, requireInTransit: true, minKeyLength: 128, allowedAlgorithms: ['AES-128-GCM', 'AES-256-GCM', 'RSA-OAEP'] }
  }
};

/**
 * Compliance manager
 */
export class ComplianceManagerV2 {
  private activeFramework: ComplianceFramework | null = null;
  private config: ComplianceProfileConfig | null = null;

  /**
   * Apply a compliance profile
   */
  applyProfile(framework: ComplianceFramework): ComplianceProfileConfig {
    const profile = COMPLIANCE_PROFILES[framework];
    if (!profile) {
      throw new Error(`Unknown compliance framework: ${framework}`);
    }
    this.activeFramework = framework;
    this.config = profile;
    return profile;
  }

  /**
   * Get current config
   */
  getConfig(): ComplianceProfileConfig | null {
    return this.config;
  }

  /**
   * Get active framework
   */
  getActiveFramework(): ComplianceFramework | null {
    return this.activeFramework;
  }

  /**
   * Check if feature is enabled
   */
  hasFeature(feature: ComplianceFeature): boolean {
    return this.config?.features.includes(feature) ?? false;
  }

  /**
   * Validate data handling
   */
  validateDataHandling(content: string): {
    compliant: boolean;
    issues: string[];
    masked: string;
  } {
    if (!this.config) {
      return { compliant: true, issues: [], masked: content };
    }

    const issues: string[] = [];
    let masked = content;

    // Check PII patterns
    for (const pattern of this.config.dataHandling.piiPatterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      if (matches && this.config.dataHandling.maskPII) {
        masked = masked.replace(regex, '[REDACTED]');
        issues.push(`PII detected and masked: ${matches.length} occurrences`);
      }
    }

    // Check for prohibited patterns
    for (const pattern of this.config.dataHandling.redactPatterns) {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        issues.push(`Prohibited content detected: ${pattern}`);
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      masked
    };
  }

  /**
   * Check retention requirements
   */
  checkRetentionPolicy(createdAt: number): {
    compliant: boolean;
    action: 'keep' | 'archive' | 'delete';
    reason?: string;
  } {
    if (!this.config) {
      return { compliant: true, action: 'keep' };
    }

    const ageMs = Date.now() - createdAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const { minDays, maxDays, archiveBeforeDelete } = this.config.retention;

    if (ageDays < minDays) {
      return { compliant: true, action: 'keep' };
    }

    if (ageDays >= maxDays) {
      return {
        compliant: true,
        action: 'delete',
        reason: 'Maximum retention period exceeded'
      };
    }

    if (ageDays >= minDays && archiveBeforeDelete) {
      return {
        compliant: true,
        action: 'archive',
        reason: 'Approaching retention limit, archive recommended'
      };
    }

    return { compliant: true, action: 'keep' };
  }

  /**
   * Convert to processing profile
   */
  toProcessingProfile(): Partial<Profile> {
    if (!this.config) {
      return {};
    }

    return {
      id: `compliance-${this.activeFramework}`,
      name: this.config.name,
      security: {
        allowedDomains: this.config.dataHandling.dataResidency 
          ? [this.config.dataHandling.dataResidency] 
          : [],
        sanitizerProfile: this.config.auditLevel === 'strict' ? 'strict' : 'standard'
      }
    };
  }
}
