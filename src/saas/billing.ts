/**
 * Billing Module
 * 
 * Handles subscription management, payments, invoicing, and usage-based billing.
 */

import type { SubscriptionPlan, UsageRecord, Invoice, BillingInfo } from './organization';

export type PaymentProvider = 'stripe' | 'paddle';

export interface PaymentConfig {
  provider: PaymentProvider;
  /** Stripe Publishable Key */
  publishableKey?: string;
  /** Stripe Secret Key (server-side) */
  secretKey?: string;
  /** Paddle Vendor ID */
  vendorId?: string;
  /** Paddle API Key */
  apiKey?: string;
  /** Webhook signing secret */
  webhookSecret: string;
}

export interface PaymentIntent {
  id: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
  invoiceId?: string;
}

export interface CheckoutSession {
  id: string;
  organizationId: string;
  plan: SubscriptionPlan;
  successUrl: string;
  cancelUrl: string;
  /** Stripe Checkout session ID */
  sessionId?: string;
  /** Paddle checkout URL */
  checkoutUrl?: string;
  expiresAt: number;
}

export interface SubscriptionUpdate {
  /** New plan */
  plan: SubscriptionPlan;
  /** Proration behavior */
  prorationBehavior: 'create_prorations' | 'always_invoice' | 'never_invoice';
}

/**
 * Billing Manager
 */
export class BillingManager {
  private config: PaymentConfig;
  private subscriptions: Map<string, Subscription> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private payments: Map<string, PaymentIntent> = new Map();
  private checkouts: Map<string, CheckoutSession> = new Map();

  constructor(config: PaymentConfig) {
    this.config = config;
  }

  /**
   * Create checkout session for new subscription
   */
  async createCheckoutSession(data: {
    organizationId: string;
    plan: SubscriptionPlan;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
    coupon?: string;
  }): Promise<CheckoutSession> {
    const session: CheckoutSession = {
      id: 'cs_' + this.generateId(),
      organizationId: data.organizationId,
      plan: data.plan,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes
    };

    if (this.config.provider === 'stripe') {
      session.sessionId = await this.createStripeCheckout(data);
    } else {
      session.checkoutUrl = await this.createPaddleCheckout(data);
    }

    this.checkouts.set(session.id, session);
    return session;
  }

  /**
   * Create checkout session for plan upgrade/downgrade
   */
  async createPlanUpdateSession(data: {
    organizationId: string;
    newPlan: SubscriptionPlan;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    const session: CheckoutSession = {
      id: 'cs_' + this.generateId(),
      organizationId: data.organizationId,
      plan: data.newPlan,
      successUrl: data.successUrl,
      cancelUrl: data.cancelUrl,
      expiresAt: Date.now() + (30 * 60 * 1000),
    };

    // In real implementation, would create Stripe Customer Portal session
    this.checkouts.set(session.id, session);
    return session;
  }

  /**
   * Create payment intent for usage-based billing
   */
  async createPaymentIntent(data: {
    organizationId: string;
    amount: number;
    currency?: string;
  }): Promise<PaymentIntent> {
    const intent: PaymentIntent = {
      id: 'pi_' + this.generateId(),
      organizationId: data.organizationId,
      amount: data.amount,
      currency: data.currency || 'usd',
      status: 'pending',
    };

    // In real implementation, would create Stripe PaymentIntent
    this.payments.set(intent.id, intent);
    return intent;
  }

  /**
   * Confirm payment
   */
  async confirmPayment(paymentId: string): Promise<PaymentIntent | null> {
    const payment = this.payments.get(paymentId);
    if (!payment) return null;

    payment.status = 'succeeded';
    this.payments.set(paymentId, payment);
    return payment;
  }

  /**
   * Get subscription
   */
  getSubscription(organizationId: string): Subscription | undefined {
    return this.subscriptions.get(organizationId);
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(organizationId: string, update: SubscriptionUpdate): Promise<Subscription | null> {
    const current = this.subscriptions.get(organizationId);
    if (!current) return null;

    const updated: Subscription = {
      ...current,
      plan: update.plan,
      // Handle proration
    };

    this.subscriptions.set(organizationId, updated);
    return updated;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(organizationId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(organizationId);
    if (!subscription) return false;

    subscription.cancelAtPeriodEnd = true;
    this.subscriptions.set(organizationId, subscription);
    return true;
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(organizationId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(organizationId);
    if (!subscription) return false;

    subscription.cancelAtPeriodEnd = false;
    this.subscriptions.set(organizationId, subscription);
    return true;
  }

  /**
   * Get invoices
   */
  getInvoices(organizationId: string): Invoice[] {
    return Array.from(this.invoices.values())
      .filter(i => i.organizationId === organizationId)
      .sort((a, b) => b.periodEnd - a.periodEnd);
  }

  /**
   * Get invoice by ID
   */
  getInvoice(invoiceId: string): Invoice | undefined {
    return this.invoices.get(invoiceId);
  }

  /**
   * Create invoice (internal)
   */
  createInvoice(data: Omit<Invoice, 'id'>): Invoice {
    const invoice: Invoice = {
      id: 'inv_' + this.generateId(),
      ...data,
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  /**
   * Handle webhook
   */
  async handleWebhook(payload: string, signature: string): Promise<{ handled: boolean; event?: string }> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      return { handled: false };
    }

    const event = JSON.parse(payload);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object);
        break;
    }

    return { handled: true, event: event.type };
  }

  /**
   * Calculate usage cost
   */
  calculateUsageCost(usage: UsageRecord[]): number {
    return usage.reduce((total, record) => {
      if (record.used > record.limit && record.limit > 0) {
        const overage = record.used - record.limit;
        return total + (overage * record.unitPrice);
      }
      return total;
    }, 0);
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(organizationId: string): Promise<BillingInfo['paymentMethod'][]> {
    // In real implementation, would fetch from Stripe/Paddle
    return [];
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(organizationId: string, paymentMethodId: string): Promise<boolean> {
    // In real implementation, would attach payment method to customer
    return true;
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(organizationId: string, paymentMethodId: string): Promise<boolean> {
    // In real implementation, would detach payment method from customer
    return true;
  }

  private async createStripeCheckout(data: {
    organizationId: string;
    plan: SubscriptionPlan;
    successUrl: string;
    cancelUrl: string;
    customerId?: string;
    coupon?: string;
  }): Promise<string> {
    // In real implementation, would use Stripe API
    return 'cs_mock_' + this.generateId();
  }

  private async createPaddleCheckout(data: {
    organizationId: string;
    plan: SubscriptionPlan;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string> {
    // In real implementation, would use Paddle API
    return 'https://checkout.paddle.com/mock';
  }

  private async handleCheckoutComplete(session: { subscription: string; customer: string }): Promise<void> {
    // Handle successful checkout
  }

  private async handleInvoicePaid(invoice: { id: string }): Promise<void> {
    const existingInvoice = this.invoices.get(invoice.id);
    if (existingInvoice) {
      existingInvoice.status = 'paid';
      existingInvoice.paidAt = Date.now();
      this.invoices.set(invoice.id, existingInvoice);
    }
  }

  private async handlePaymentFailed(invoice: { id: string }): Promise<void> {
    const existingInvoice = this.invoices.get(invoice.id);
    if (existingInvoice) {
      existingInvoice.status = 'open';
      this.invoices.set(invoice.id, existingInvoice);
    }
  }

  private async handleSubscriptionUpdated(subscription: { id: string; status: string; plan: string }): Promise<void> {
    // Update subscription status
  }

  private async handleSubscriptionCanceled(subscription: { id: string }): Promise<void> {
    // Mark subscription as canceled
  }

  private verifyWebhookSignature(payload: string, signature: string): boolean {
    // In real implementation, would verify HMAC signature
    return true;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

/**
 * Usage-based billing manager
 */
export class UsageBillingManager {
  private usageRecords: Map<string, UsageRecord[]> = new Map();
  private billingManager: BillingManager;

  constructor(billingManager: BillingManager) {
    this.billingManager = billingManager;
  }

  /**
   * Record usage
   */
  async recordUsage(organizationId: string, metric: UsageRecord['metric'], amount: number): Promise<void> {
    const records = this.usageRecords.get(organizationId) || [];
    const existing = records.find(r => r.metric === metric);

    if (existing) {
      existing.used += amount;
    } else {
      records.push({
        metric,
        used: amount,
        limit: 0,
        unitPrice: 0,
      });
    }

    this.usageRecords.set(organizationId, records);
  }

  /**
   * Get current usage
   */
  getUsage(organizationId: string): UsageRecord[] {
    return this.usageRecords.get(organizationId) || [];
  }

  /**
   * Check if usage exceeded limits
   */
  checkLimits(organizationId: string): { exceeded: boolean; overages: UsageRecord[] } {
    const records = this.usageRecords.get(organizationId) || [];
    const overages = records.filter(r => r.limit > 0 && r.used > r.limit);
    return { exceeded: overages.length > 0, overages };
  }

  /**
   * Generate usage invoice
   */
  async generateUsageInvoice(organizationId: string): Promise<Invoice | null> {
    const usage = this.getUsage(organizationId);
    const overages = usage.filter(r => r.used > r.limit && r.limit > 0);

    if (overages.length === 0) return null;

    const amount = this.billingManager.calculateUsageCost(overages);

    return this.billingManager.createInvoice({
      organizationId,
      amount,
      currency: 'usd',
      status: 'open',
      periodStart: Date.now() - (30 * 24 * 60 * 60 * 1000),
      periodEnd: Date.now(),
      lineItems: overages.map(o => ({
        description: `${o.metric} overage`,
        quantity: o.used - o.limit,
        unitAmount: o.unitPrice,
        amount: (o.used - o.limit) * o.unitPrice,
      })),
    });
  }

  /**
   * Reset usage (monthly)
   */
  resetUsage(organizationId: string): void {
    const records = this.usageRecords.get(organizationId) || [];
    for (const record of records) {
      record.used = 0;
    }
    this.usageRecords.set(organizationId, records);
  }
}
