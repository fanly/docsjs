export interface LicenseInfo {
  licenseKey: string;
  plan: 'starter' | 'professional' | 'enterprise';
  customerId: string;
  customerEmail: string;
  allowedDomains: string[];
  maxDomains: number;
  issuedAt: number;
  expiresAt: number;
  features: string[];
}

export interface LicenseValidationResult {
  valid: boolean;
  license?: LicenseInfo;
  error?: {
    code: string;
    message: string;
  };
  offline?: boolean;
}

export interface ComplianceAuditLog {
  id: string;
  timestamp: number;
  userId: string;
  action: string;
  resource: string;
  result: 'success' | 'failure';
  metadata?: Record<string, unknown>;
}

export interface DataRetentionPolicy {
  retentionDays: number;
  autoDelete: boolean;
  encryptAtRest: boolean;
}

export interface SecurityConfig {
  enableAuditLog: boolean;
  requireHttps: boolean;
  allowedUploadTypes: string[];
  maxFileSizeMB: number;
  enableDlp: boolean;
  dlpPatterns?: string[];
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableAuditLog: true,
  requireHttps: true,
  allowedUploadTypes: ['.docx', '.doc'],
  maxFileSizeMB: 50,
  enableDlp: false,
};

export const DEFAULT_RETENTION_POLICY: DataRetentionPolicy = {
  retentionDays: 90,
  autoDelete: true,
  encryptAtRest: true,
};

export interface EnterpriseFeatures {
  license: LicenseManager;
  audit: AuditLogger;
  security: SecurityManager;
  compliance: ComplianceManager;
}

export class LicenseManager {
  private licenseInfo: LicenseInfo | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

  async validate(licenseKey: string, domain?: string): Promise<LicenseValidationResult> {
    const now = Date.now();
    
    if (this.licenseInfo && this.cacheExpiry > now) {
      return this.checkDomain(this.licenseInfo, domain);
    }

    return { valid: false, error: { code: 'NOT_IMPLEMENTED', message: 'License server not configured' } };
  }

  async validateOffline(licenseKey: string, domain: string): Promise<LicenseValidationResult> {
    if (!this.licenseInfo) {
      return { valid: false, error: { code: 'NO_LICENSE', message: 'No cached license' }, offline: true };
    }
    
    return this.checkDomain(this.licenseInfo, domain);
  }

  private checkDomain(license: LicenseInfo, domain?: string): LicenseValidationResult {
    if (!domain) {
      return { valid: true, license };
    }

    const allowed = license.allowedDomains.some(d => {
      if (d.startsWith('*.')) {
        const base = d.slice(2);
        return domain.endsWith(base);
      }
      return d === domain;
    });

    if (!allowed) {
      return { valid: false, error: { code: 'DOMAIN_NOT_ALLOWED', message: `Domain ${domain} not in whitelist` } };
    }

    return { valid: true, license };
  }

  setLicenseInfo(info: LicenseInfo): void {
    this.licenseInfo = info;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
  }

  getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }

  hasFeature(feature: string): boolean {
    return this.licenseInfo?.features.includes(feature) ?? false;
  }
}

export class AuditLogger {
  private logs: ComplianceAuditLog[] = [];
  private maxLogs = 10000;

  log(entry: Omit<ComplianceAuditLog, 'id' | 'timestamp'>): void {
    const log: ComplianceAuditLog = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    this.logs.push(log);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  query(filters: {
    userId?: string;
    action?: string;
    startTime?: number;
    endTime?: number;
  }): ComplianceAuditLog[] {
    return this.logs.filter(log => {
      if (filters.userId && log.userId !== filters.userId) return false;
      if (filters.action && log.action !== filters.action) return false;
      if (filters.startTime && log.timestamp < filters.startTime) return false;
      if (filters.endTime && log.timestamp > filters.endTime) return false;
      return true;
    });
  }

  getRecent(count: number = 100): ComplianceAuditLog[] {
    return this.logs.slice(-count);
  }

  clear(): void {
    this.logs = [];
  }
}

export class SecurityManager {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  validateFile(file: { name: string; size: number; type?: string }): { valid: boolean; error?: string } {
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!this.config.allowedUploadTypes.includes(ext)) {
      return { valid: false, error: `File type ${ext} not allowed` };
    }

    const maxBytes = this.config.maxFileSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return { valid: false, error: `File size exceeds ${this.config.maxFileSizeMB}MB limit` };
    }

    return { valid: true };
  }

  scanContent(content: string): { clean: boolean; matches: string[] } {
    if (!this.config.enableDlp || !this.config.dlpPatterns) {
      return { clean: true, matches: [] };
    }

    const matches: string[] = [];
    for (const pattern of this.config.dlpPatterns) {
      const regex = new RegExp(pattern, 'gi');
      const found = content.match(regex);
      if (found) {
        matches.push(...found);
      }
    }

    return { clean: matches.length === 0, matches };
  }

  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export class ComplianceManager {
  private retentionPolicy: DataRetentionPolicy;
  private licenseManager: LicenseManager;
  private auditLogger: AuditLogger;

  constructor(
    licenseManager: LicenseManager,
    auditLogger: AuditLogger,
    retentionPolicy: Partial<DataRetentionPolicy> = {}
  ) {
    this.licenseManager = licenseManager;
    this.auditLogger = auditLogger;
    this.retentionPolicy = { ...DEFAULT_RETENTION_POLICY, ...retentionPolicy };
  }

  setRetentionPolicy(policy: Partial<DataRetentionPolicy>): void {
    this.retentionPolicy = { ...this.retentionPolicy, ...policy };
  }

  getRetentionPolicy(): DataRetentionPolicy {
    return { ...this.retentionPolicy };
  }

  shouldDelete(timestamp: number): boolean {
    if (!this.retentionPolicy.autoDelete) return false;
    
    const ageMs = Date.now() - timestamp;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    return ageDays > this.retentionPolicy.retentionDays;
  }

  checkFeatureAccess(feature: string): { allowed: boolean; reason?: string } {
    if (this.licenseManager.hasFeature(feature)) {
      return { allowed: true };
    }
    return { allowed: false, reason: `Feature ${feature} not available in your plan` };
  }
}

export function createEnterpriseFeatures(
  securityConfig?: Partial<SecurityConfig>,
  retentionPolicy?: Partial<DataRetentionPolicy>
): EnterpriseFeatures {
  const licenseManager = new LicenseManager();
  const auditLogger = new AuditLogger();
  const securityManager = new SecurityManager(securityConfig);
  const complianceManager = new ComplianceManager(licenseManager, auditLogger, retentionPolicy);

  return {
    license: licenseManager,
    audit: auditLogger,
    security: securityManager,
    compliance: complianceManager,
  };
}
