/**
 * SaaS Platform Module
 * 
 * Administration, organization management, and billing for DocsJS cloud platform.
 */

import type { User } from '../types';

// ============================================================================
// Organization Management
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: number;
  updatedAt: number;
  /** Subscription plan */
  plan: SubscriptionPlan;
  /** Organization settings */
  settings: OrganizationSettings;
  /** Billing info */
  billing: BillingInfo;
  /** Owner user ID */
  ownerId: string;
  /** Member IDs */
  memberIds: string[];
  /** Custom domain */
  domain?: string;
  /** Logo URL */
  logo?: string;
  /** Timezone */
  timezone: string;
}

export interface OrganizationSettings {
  /** Allow member invitations */
  allowInvitations: boolean;
  /** Require 2FA for members */
  require2FA: boolean;
  /** Default role for new members */
  defaultRole: OrganizationRole;
  /** Allowed IP ranges */
  allowedIPRanges?: string[];
  /** SSO enabled */
  ssoEnabled: boolean;
  /** SSO provider */
  ssoProvider?: string;
}

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationMember {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  joinedAt: number;
  invitedBy?: string;
  /** Custom permissions */
  permissions?: string[];
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  organizationId: string;
  role: OrganizationRole;
  invitedBy: string;
  expiresAt: number;
  acceptedAt?: number;
}

// ============================================================================
// Subscription & Billing
// ============================================================================

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Subscription {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: number;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  /** Usage-based billing */
  usage?: UsageRecord[];
}

export interface UsageRecord {
  metric: 'api_calls' | 'storage_gb' | 'transformations' | 'seats';
  used: number;
  limit: number;
  unitPrice: number;
}

export interface BillingInfo {
  /** Stripe customer ID */
  stripeCustomerId?: string;
  billingEmail: string;
  billingName?: string;
  /** VAT/GST number */
  taxId?: string;
  /** Billing address */
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  /** Payment method */
  paymentMethod?: {
    type: 'card' | 'bank';
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
}

export interface Invoice {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  periodStart: number;
  periodEnd: number;
  paidAt?: number;
  invoiceUrl?: string;
  pdfUrl?: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

// ============================================================================
// Plan Pricing
// ============================================================================

export const PLAN_PRICING: Record<SubscriptionPlan, {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  limits: {
    apiCalls: number;
    storageGB: number;
    transformations: number;
    seats: number;
  };
}> = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Up to 100 transformations/month',
      '1 GB storage',
      'Community support',
    ],
    limits: { apiCalls: 100, storageGB: 1, transformations: 100, seats: 1 },
  },
  starter: {
    name: 'Starter',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      '5,000 transformations/month',
      '10 GB storage',
      'Basic analytics',
      'Email support',
    ],
    limits: { apiCalls: 5000, storageGB: 10, transformations: 5000, seats: 3 },
  },
  professional: {
    name: 'Professional',
    monthlyPrice: 99,
    yearlyPrice: 990,
    features: [
      '50,000 transformations/month',
      '100 GB storage',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    limits: { apiCalls: 50000, storageGB: 100, transformations: 50000, seats: 10 },
  },
  enterprise: {
    name: 'Enterprise',
    monthlyPrice: 499,
    yearlyPrice: 4990,
    features: [
      'Unlimited transformations',
      '1 TB storage',
      'Enterprise analytics',
      'Dedicated support',
      'Custom contracts',
      'SSO/SAML',
      'Audit logs',
      'SLA guarantee',
    ],
    limits: { apiCalls: -1, storageGB: 1000, transformations: -1, seats: -1 },
  },
};

// ============================================================================
// Organization Manager
// ============================================================================

export class OrganizationManager {
  private organizations: Map<string, Organization> = new Map();
  private members: Map<string, OrganizationMember> = new Map();
  private invitations: Map<string, OrganizationInvitation> = new Map();

  /**
   * Create organization
   */
  async create(data: {
    name: string;
    slug: string;
    ownerId: string;
    plan?: SubscriptionPlan;
  }): Promise<Organization> {
    const org: Organization = {
      id: 'org_' + this.generateId(),
      name: data.name,
      slug: data.slug,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      plan: data.plan || 'free',
      settings: {
        allowInvitations: true,
        require2FA: false,
        defaultRole: 'member',
        ssoEnabled: false,
      },
      billing: {
        billingEmail: '',
      },
      ownerId: data.ownerId,
      memberIds: [data.ownerId],
      timezone: 'UTC',
    };

    this.organizations.set(org.id, org);

    // Add owner as member
    const member: OrganizationMember = {
      id: 'mem_' + this.generateId(),
      userId: data.ownerId,
      organizationId: org.id,
      role: 'owner',
      joinedAt: Date.now(),
    };
    this.members.set(member.id, member);

    return org;
  }

  /**
   * Get organization by ID
   */
  getOrganization(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  /**
   * Get organization by slug
   */
  getOrganizationBySlug(slug: string): Organization | undefined {
    return Array.from(this.organizations.values()).find(o => o.slug === slug);
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | null> {
    const org = this.organizations.get(id);
    if (!org) return null;

    const updated = { ...org, ...updates, updatedAt: Date.now() };
    this.organizations.set(id, updated);
    return updated;
  }

  /**
   * Get organization members
   */
  getMembers(organizationId: string): OrganizationMember[] {
    return Array.from(this.members.values()).filter(m => m.organizationId === organizationId);
  }

  /**
   * Add member to organization
   */
  async addMember(organizationId: string, userId: string, role: OrganizationRole = 'member'): Promise<OrganizationMember> {
    const org = this.organizations.get(organizationId);
    if (!org) throw new Error('Organization not found');

    const member: OrganizationMember = {
      id: 'mem_' + this.generateId(),
      userId,
      organizationId,
      role,
      joinedAt: Date.now(),
    };

    this.members.set(member.id, member);
    org.memberIds.push(userId);
    org.updatedAt = Date.now();

    return member;
  }

  /**
   * Remove member from organization
   */
  async removeMember(organizationId: string, userId: string): Promise<boolean> {
    const org = this.organizations.get(organizationId);
    if (!org) return false;

    const member = Array.from(this.members.values()).find(
      m => m.organizationId === organizationId && m.userId === userId
    );

    if (member) {
      this.members.delete(member.id);
      org.memberIds = org.memberIds.filter(id => id !== userId);
      org.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Update member role
   */
  async updateMemberRole(organizationId: string, userId: string, role: OrganizationRole): Promise<boolean> {
    const member = Array.from(this.members.values()).find(
      m => m.organizationId === organizationId && m.userId === userId
    );

    if (member) {
      member.role = role;
      this.members.set(member.id, member);
      return true;
    }
    return false;
  }

  /**
   * Invite user to organization
   */
  async inviteMember(
    organizationId: string,
    email: string,
    role: OrganizationRole,
    invitedBy: string
  ): Promise<OrganizationInvitation> {
    const invitation: OrganizationInvitation = {
      id: 'inv_' + this.generateId(),
      email,
      organizationId,
      role,
      invitedBy,
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    };

    this.invitations.set(invitation.id, invitation);
    return invitation;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(invitationId: string, userId: string): Promise<OrganizationMember | null> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.expiresAt < Date.now()) return null;

    // Add member
    const member = await this.addMember(invitation.organizationId, userId, invitation.role);

    // Mark invitation accepted
    invitation.acceptedAt = Date.now();
    this.invitations.delete(invitationId);

    return member;
  }

  /**
   * Get usage for organization
   */
  getUsage(organizationId: string): UsageRecord[] {
    const org = this.organizations.get(organizationId);
    if (!org) return [];

    const plan = PLAN_PRICING[org.plan];
    // Mock usage data - real impl would query actual metrics
    return [
      { metric: 'api_calls', used: 0, limit: plan.limits.apiCalls, unitPrice: 0 },
      { metric: 'storage_gb', used: 0, limit: plan.limits.storageGB, unitPrice: 0.1 },
      { metric: 'transformations', used: 0, limit: plan.limits.transformations, unitPrice: 0 },
      { metric: 'seats', used: org.memberIds.length, limit: plan.limits.seats, unitPrice: 0 },
    ];
  }

  /**
   * Check if over usage limits
   */
  isOverUsageLimit(organizationId: string): { over: boolean; metrics: string[] } {
    const usage = this.getUsage(organizationId);
    const overMetrics: string[] = [];

    for (const record of usage) {
      if (record.limit > 0 && record.used > record.limit) {
        overMetrics.push(record.metric);
      }
    }

    return { over: overMetrics.length > 0, metrics: overMetrics };
  }

  /**
   * Get plan features
   */
  getPlanFeatures(plan: SubscriptionPlan): string[] {
    return PLAN_PRICING[plan].features;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

// ============================================================================
// Admin Dashboard Types
// ============================================================================

export interface AdminStats {
  /** Total organizations */
  totalOrganizations: number;
  /** Active subscriptions */
  activeSubscriptions: number;
  /** Monthly recurring revenue */
  mrr: number;
  /** Annual recurring revenue */
  arr: number;
  /** Total users */
  totalUsers: number;
  /** Total transformations */
  totalTransformations: number;
  /** New organizations this month */
  newOrganizationsThisMonth: number;
  /** Churn rate */
  churnRate: number;
}

export interface AdminAuditLog {
  id: string;
  organizationId?: string;
  userId?: string;
  action: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  timestamp: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: {
    api: { status: 'ok' | 'degraded' | 'down'; latencyMs: number };
    database: { status: 'ok' | 'degraded' | 'down'; connections: number };
    cache: { status: 'ok' | 'degraded' | 'down'; hitRate: number };
    queue: { status: 'ok' | 'degraded' | 'down'; pending: number };
  };
}

/**
 * Admin manager
 */
export class AdminManager {
  private auditLogs: Map<string, AdminAuditLog> = new Map();

  /**
   * Get admin stats
   */
  async getStats(): Promise<AdminStats> {
    // Mock implementation - real would query database
    return {
      totalOrganizations: 0,
      activeSubscriptions: 0,
      mrr: 0,
      arr: 0,
      totalUsers: 0,
      totalTransformations: 0,
      newOrganizationsThisMonth: 0,
      churnRate: 0,
    };
  }

  /**
   * Log admin action
   */
  async logAction(data: {
    organizationId?: string;
    userId?: string;
    action: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
  }): Promise<AdminAuditLog> {
    const log: AdminAuditLog = {
      id: 'log_' + this.generateId(),
      organizationId: data.organizationId,
      userId: data.userId,
      action: data.action,
      details: data.details || {},
      ipAddress: data.ipAddress,
      timestamp: Date.now(),
    };

    this.auditLogs.set(log.id, log);
    return log;
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    organizationId?: string;
    userId?: string;
    action?: string;
    from?: number;
    to?: number;
    limit?: number;
  }): AdminAuditLog[] {
    let logs = Array.from(this.auditLogs.values());

    if (filters?.organizationId) {
      logs = logs.filter(l => l.organizationId === filters.organizationId);
    }
    if (filters?.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters?.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters?.from) {
      logs = logs.filter(l => l.timestamp >= filters.from!);
    }
    if (filters?.to) {
      logs = logs.filter(l => l.timestamp <= filters.to!);
    }

    logs.sort((a, b) => b.timestamp - a.timestamp);

    if (filters?.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return {
      status: 'healthy',
      services: {
        api: { status: 'ok', latencyMs: 50 },
        database: { status: 'ok', connections: 10 },
        cache: { status: 'ok', hitRate: 0.95 },
        queue: { status: 'ok', pending: 0 },
      },
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}
