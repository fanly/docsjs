/**
 * Multi-Tenancy Support
 * 
 * Provides tenant isolation and quota management.
 */

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  quota: TenantQuota;
  settings: TenantSettings;
  createdAt: number;
  updatedAt: number;
}

export interface TenantQuota {
  maxApiCalls: number;
  maxStorageMB: number;
  maxFileSizeMB: number;
  maxUsers: number;
  rateLimit: number;
}

export interface TenantSettings {
  allowCustomBranding: boolean;
  allowWebhooks: boolean;
  allowBatchProcessing: boolean;
  retentionDays: number;
}

export interface UsageRecord {
  tenantId: string;
  period: string; // YYYY-MM
  apiCalls: number;
  storageUsedMB: number;
  fileCount: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage: {
    apiCalls: number;
    storageMB: number;
    fileSizeMB: number;
  };
  quota: TenantQuota;
}

const DEFAULT_QUOTAS: Record<string, TenantQuota> = {
  free: { maxApiCalls: 1000, maxStorageMB: 100, maxFileSizeMB: 10, maxUsers: 1, rateLimit: 10 },
  pro: { maxApiCalls: 10000, maxStorageMB: 1000, maxFileSizeMB: 50, maxUsers: 5, rateLimit: 100 },
  enterprise: { maxApiCalls: -1, maxStorageMB: -1, maxFileSizeMB: 200, maxUsers: -1, rateLimit: 1000 }
};

export class TenantManager {
  private tenants = new Map<string, Tenant>();
  private usage = new Map<string, UsageRecord[]>();
  private storage = new Map<string, number>();

  constructor(initialTenants?: Tenant[]) {
    if (initialTenants) {
      for (const tenant of initialTenants) {
        this.tenants.set(tenant.id, tenant);
      }
    }
  }

  async createTenant(data: { name: string; plan?: Tenant['plan'] }): Promise<Tenant> {
    const id = `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const plan = data.plan || 'free';
    const quota = this.getQuotaForPlan(plan);
    
    const tenant: Tenant = {
      id,
      name: data.name,
      plan,
      quota,
      settings: {
        allowCustomBranding: plan === 'enterprise',
        allowWebhooks: plan !== 'free',
        allowBatchProcessing: plan !== 'free',
        retentionDays: plan === 'free' ? 7 : plan === 'pro' ? 30 : 90
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tenants.set(id, tenant);
    this.usage.set(id, []);
    return tenant;
  }

  async getTenant(id: string): Promise<Tenant | null> {
    return this.tenants.get(id) || null;
  }

  async updateTenant(id: string, updates: Partial<Pick<Tenant, 'name' | 'plan' | 'settings'>>): Promise<Tenant | null> {
    const tenant = this.tenants.get(id);
    if (!tenant) return null;

    const updated: Tenant = {
      ...tenant,
      ...updates,
      quota: updates.plan ? this.getQuotaForPlan(updates.plan) : tenant.quota,
      updatedAt: Date.now()
    };

    this.tenants.set(id, updated);
    return updated;
  }

  async deleteTenant(id: string): Promise<boolean> {
    const existed = this.tenants.has(id);
    this.tenants.delete(id);
    this.usage.delete(id);
    this.storage.delete(id);
    return existed;
  }

  async checkQuota(tenantId: string, operation: {
    type: 'api_call' | 'upload' | 'storage';
    sizeMB?: number;
  }): Promise<QuotaCheckResult> {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      return { allowed: false, reason: 'Tenant not found', currentUsage: { apiCalls: 0, storageMB: 0, fileSizeMB: 0 }, quota: DEFAULT_QUOTAS.free };
    }

    const period = new Date().toISOString().slice(0, 7);
    const usage = this.getOrCreateUsage(tenantId, period);

    const quota = tenant.quota;
    let allowed = true;
    let reason: string | undefined;

    switch (operation.type) {
      case 'api_call':
        if (quota.maxApiCalls > 0 && usage.apiCalls >= quota.maxApiCalls) {
          allowed = false;
          reason = 'API call limit exceeded';
        }
        break;
      case 'upload':
        const fileSizeMB = operation.sizeMB || 0;
        if (quota.maxFileSizeMB > 0 && fileSizeMB > quota.maxFileSizeMB) {
          allowed = false;
          reason = `File size exceeds limit of ${quota.maxFileSizeMB}MB`;
        }
        break;
      case 'storage':
        const currentStorage = this.storage.get(tenantId) || 0;
        if (quota.maxStorageMB > 0 && currentStorage >= quota.maxStorageMB) {
          allowed = false;
          reason = 'Storage limit exceeded';
        }
        break;
    }

    return {
      allowed,
      reason,
      currentUsage: { apiCalls: usage.apiCalls, storageMB: this.storage.get(tenantId) || 0, fileSizeMB: 0 },
      quota
    };
  }

  async recordUsage(tenantId: string, operation: { type: 'api_call' | 'upload' | 'storage'; sizeMB?: number }): Promise<void> {
    const period = new Date().toISOString().slice(0, 7);
    const usage = this.getOrCreateUsage(tenantId, period);

    switch (operation.type) {
      case 'api_call':
        usage.apiCalls++;
        break;
      case 'upload':
        usage.fileCount++;
        break;
      case 'storage':
        const current = this.storage.get(tenantId) || 0;
        this.storage.set(tenantId, current + (operation.sizeMB || 0));
        break;
    }

    const allUsage = this.usage.get(tenantId) || [];
    const idx = allUsage.findIndex(u => u.period === period);
    if (idx >= 0) {
      allUsage[idx] = usage;
    } else {
      allUsage.push(usage);
    }
    this.usage.set(tenantId, allUsage);
  }

  async getUsage(tenantId: string, period?: string): Promise<UsageRecord[]> {
    const allUsage = this.usage.get(tenantId) || [];
    if (period) {
      return allUsage.filter(u => u.period === period);
    }
    return allUsage;
  }

  private getOrCreateUsage(tenantId: string, period: string): UsageRecord {
    const allUsage = this.usage.get(tenantId) || [];
    let usage = allUsage.find(u => u.period === period);
    if (!usage) {
      usage = { tenantId, period, apiCalls: 0, storageUsedMB: 0, fileCount: 0 };
      allUsage.push(usage);
      this.usage.set(tenantId, allUsage);
    }
    return usage;
  }

  private getQuotaForPlan(plan: Tenant['plan']): TenantQuota {
    return { ...DEFAULT_QUOTAS[plan] };
  }
}

export function createTenantManager(initialTenants?: Tenant[]): TenantManager {
  return new TenantManager(initialTenants);
}

export { DEFAULT_QUOTAS };
