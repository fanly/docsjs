/**
 * Plugin Approval Workflow
 * 
 * Handles plugin submission review, security audit, and approval process.
 */

import type { MarketplacePlugin, PluginSubmission } from './types';

/**
 * Approval status for plugin submissions
 */
export enum ApprovalStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision',
  SECURITY_AUDIT = 'security_audit',
  COMPLIANCE_CHECK = 'compliance_check'
}

/**
 * Review criteria for plugin approval
 */
export interface ReviewCriteria {
  /** Code quality score (0-100) */
  codeQuality: number;
  /** Security score (0-100) */
  securityScore: number;
  /** Documentation score (0-100) */
  documentationScore: number;
  /** Test coverage percentage */
  testCoverage: number;
  /** Performance score (0-100) */
  performanceScore: number;
  /** Compatibility score (0-100) */
  compatibilityScore: number;
  /** Overall recommendation */
  recommendation: 'approve' | 'reject' | 'revision';
  /** Comments from reviewers */
  comments: ReviewComment[];
}

/**
 * Review comment
 */
export interface ReviewComment {
  id: string;
  reviewerId: string;
  timestamp: number;
  category: 'security' | 'code' | 'docs' | 'performance' | 'compatibility';
  severity: 'critical' | 'major' | 'minor' | 'suggestion';
  message: string;
  resolved: boolean;
}

/**
 * Security audit result
 */
export interface SecurityAuditResult {
  /** Overall pass/fail */
  passed: boolean;
  /** Vulnerability findings */
  vulnerabilities: SecurityVulnerability[];
  /** Risk score (0-100, lower is safer) */
  riskScore: number;
  /** Scan timestamp */
  scannedAt: number;
  /** Scanner version */
  scannerVersion: string;
}

/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  title: string;
  description: string;
  location: string;
  remediation?: string;
  cweId?: string;
  cvssScore?: number;
}

/**
 * Plugin approval workflow manager
 */
export class PluginApprovalWorkflow {
  private submissions: Map<string, PluginSubmissionRecord> = new Map();
  private reviewers: Map<string, Reviewer> = new Map();

  /**
   * Submit plugin for review
   */
  async submitPlugin(submission: PluginSubmission): Promise<SubmissionResult> {
    const record: PluginSubmissionRecord = {
      id: this.generateId(),
      submission,
      status: ApprovalStatus.PENDING,
      submittedAt: Date.now(),
      updatedAt: Date.now(),
      reviews: [],
      securityAudit: null,
      version: submission.config?.version as string || '1.0.0'
    };

    // Initial validation
    const validation = await this.validateSubmission(submission);
    if (!validation.valid) {
      record.status = ApprovalStatus.REJECTED;
      record.rejectionReason = validation.reason;
    }

    this.submissions.set(record.id, record);
    
    return {
      submissionId: record.id,
      status: record.status,
      message: validation.valid ? 'Submission received' : validation.reason
    };
  }

  /**
   * Start security audit for submission
   */
  async startSecurityAudit(submissionId: string): Promise<SecurityAuditResult> {
    const record = this.submissions.get(submissionId);
    if (!record) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    record.status = ApprovalStatus.SECURITY_AUDIT;
    record.updatedAt = Date.now();

    // Perform security scan (simplified)
    const auditResult = await this.performSecurityScan(record.submission);
    
    record.securityAudit = auditResult;
    record.updatedAt = Date.now();

    if (!auditResult.passed) {
      record.status = ApprovalStatus.NEEDS_REVISION;
    }

    return auditResult;
  }

  /**
   * Add reviewer to submission
   */
  addReviewer(submissionId: string, reviewerId: string, role: 'primary' | 'secondary'): void {
    const record = this.submissions.get(submissionId);
    if (!record) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    record.reviewers.push({ reviewerId, role, assignedAt: Date.now() });
    record.status = ApprovalStatus.IN_REVIEW;
    record.updatedAt = Date.now();
  }

  /**
   * Submit review for plugin
   */
  async submitReview(
    submissionId: string,
    reviewerId: string,
    criteria: Partial<ReviewCriteria>
  ): Promise<void> {
    const record = this.submissions.get(submissionId);
    if (!record) {
      throw new Error(`Submission not found: ${submissionId}`);
    }

    const review: PluginReview = {
      id: this.generateId(),
      pluginId: submissionId,
      reviewerId,
      rating: criteria.codeQuality ? Math.round(criteria.codeQuality / 20) : 3,
      title: criteria.recommendation === 'approve' ? 'Approved' : criteria.recommendation === 'reject' ? 'Rejected' : 'Needs Revision',
      content: criteria.comments?.map(c => c.message).join('\n') || '',
      createdAt: Date.now(),
      verified: true,
      helpful: 0
    };

    record.reviews.push(review);
    record.reviewCriteria = criteria as ReviewCriteria;
    record.updatedAt = Date.now();

    // Check if all required reviews are complete
    if (this.areReviewsComplete(record)) {
      await this.finalizeApproval(record);
    }
  }

  /**
   * Get submission status
   */
  getSubmission(submissionId: string): PluginSubmissionRecord | undefined {
    return this.submissions.get(submissionId);
  }

  /**
   * List all submissions with filters
   */
  listSubmissions(status?: ApprovalStatus): PluginSubmissionRecord[] {
    const all = Array.from(this.submissions.values());
    if (status) {
      return all.filter(r => r.status === status);
    }
    return all;
  }

  /**
   * Approve or reject plugin
   */
  private async finalizeApproval(record: PluginSubmissionRecord): Promise<void> {
    const criteria = record.reviewCriteria;
    if (!criteria) {
      throw new Error('No review criteria found');
    }

    // Calculate overall score
    const avgScore = (
      criteria.codeQuality +
      criteria.securityScore +
      criteria.documentationScore +
      criteria.performanceScore +
      criteria.compatibilityScore
    ) / 5;

    // Check security audit
    const securityPassed = record.securityAudit?.passed ?? false;
    const noCriticalVulns = (record.securityAudit?.vulnerabilities.filter(v => v.severity === 'critical').length ?? 0) === 0;

    if (criteria.recommendation === 'approve' && securityPassed && noCriticalVulns && avgScore >= 70) {
      record.status = ApprovalStatus.APPROVED;
    } else if (criteria.recommendation === 'reject' || avgScore < 50) {
      record.status = ApprovalStatus.REJECTED;
    } else {
      record.status = ApprovalStatus.NEEDS_REVISION;
    }

    record.updatedAt = Date.now();
  }

  private async validateSubmission(submission: PluginSubmission): Promise<{ valid: boolean; reason?: string }> {
    // Basic validation
    if (!submission.package) {
      return { valid: false, reason: 'Package is required' };
    }
    if (!submission.readme || submission.readme.length < 50) {
      return { valid: false, reason: 'README must be at least 50 characters' };
    }
    return { valid: true };
  }

  private async performSecurityScan(submission: PluginSubmission): Promise<SecurityAuditResult> {
    // Simplified security scan
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check for dangerous patterns in config
    const config = submission.config as Record<string, unknown> || {};
    
    if (config.permissions?.network === true) {
      vulnerabilities.push({
        id: this.generateId(),
        severity: 'medium',
        category: 'Network Access',
        title: 'Plugin requests network access',
        description: 'Network access should be minimized for security',
        location: 'manifest.permissions.network',
        remediation: 'Remove network permission if not required'
      });
    }

    const riskScore = vulnerabilities.reduce((score, v) => {
      switch (v.severity) {
        case 'critical': return score + 30;
        case 'high': return score + 20;
        case 'medium': return score + 10;
        case 'low': return score + 5;
        default: return score;
      }
    }, 0);

    return {
      passed: vulnerabilities.filter(v => v.severity === 'critical').length === 0,
      vulnerabilities,
      riskScore: Math.min(100, riskScore),
      scannedAt: Date.now(),
      scannerVersion: '1.0.0'
    };
  }

  private areReviewsComplete(record: PluginSubmissionRecord): boolean {
    const requiredReviewers = record.reviewers.filter(r => r.role === 'primary').length;
    const completedReviews = record.reviews.length;
    return completedReviews >= requiredReviewers;
  }

  private generateId(): string {
    return `plugin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Plugin submission record
 */
export interface PluginSubmissionRecord {
  id: string;
  submission: PluginSubmission;
  status: ApprovalStatus;
  submittedAt: number;
  updatedAt: number;
  reviewers: Reviewer[];
  reviews: PluginReview[];
  securityAudit: SecurityAuditResult | null;
  reviewCriteria?: ReviewCriteria;
  rejectionReason?: string;
  version: string;
}

/**
 * Reviewer assignment
 */
interface Reviewer {
  reviewerId: string;
  role: 'primary' | 'secondary';
  assignedAt: number;
}

/**
 * Plugin review (from types)
 */
interface PluginReview {
  id: string;
  pluginId: string;
  reviewerId: string;
  rating: number;
  title: string;
  content: string;
  createdAt: number;
  verified: boolean;
  helpful: number;
}

/**
 * Submission result
 */
export interface SubmissionResult {
  submissionId: string;
  status: ApprovalStatus;
  message: string;
}

export { ApprovalStatus as default };
