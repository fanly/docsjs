/**
 * Plugin Marketplace Economy
 * 
 * Commercial plugin distribution, revenue sharing, and creator payments.
 */

export interface PluginPricing {
  /** Pricing type */
  type: 'free' | 'freemium' | 'commercial' | 'open-core';
  /** Price in USD (for commercial) */
  price?: number;
  /** Monthly subscription price */
  subscriptionPrice?: number;
  /** Feature tiers for freemium */
  tiers?: FeatureTier[];
}

export interface FeatureTier {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export interface PluginRevenue {
  pluginId: string;
  totalRevenue: number;
  monthlyRevenue: number;
  totalSales: number;
  salesThisMonth: number;
  averageRating: number;
  refundRate: number;
}

export interface CreatorPayout {
  id: string;
  creatorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  method: 'bank_transfer' | 'paypal' | 'stripe_connect';
  createdAt: number;
  paidAt?: number;
  bankInfo?: {
    accountLast4: string;
    routingLast4: string;
    bankName: string;
  };
}

export interface CreatorAccount {
  id: string;
  userId: string;
  email: string;
  /** Stripe Connect account ID */
  stripeAccountId?: string;
  /** PayPal email */
  paypalEmail?: string;
  bankAccount?: {
    accountNumber: string;
    routingNumber: string;
    bankName: string;
    accountHolderName: string;
  };
  /** Payout settings */
  payoutSchedule: 'weekly' | 'monthly';
  /** Minimum payout amount */
  minimumPayout: number;
  /** Total earned */
  totalEarned: number;
  /** Pending balance */
  pendingBalance: number;
  /** Number of plugins */
  pluginCount: number;
}

export interface SalesRecord {
  id: string;
  pluginId: string;
  buyerOrganizationId: string;
  tierId?: string;
  amount: number;
  currency: string;
  timestamp: number;
  refunded: boolean;
  refundAmount?: number;
}

export interface Review {
  id: string;
  pluginId: string;
  userId: string;
  organizationId: string;
  rating: number; // 1-5
  title: string;
  content: string;
  helpful: number;
  createdAt: number;
  /** Is verified purchase */
  verified: boolean;
  /** Developer response */
  developerResponse?: {
    content: string;
    respondedAt: number;
  };
}

// Revenue sharing configuration
export const REVENUE_SHARE = {
  /** Platform takes this percentage */
  platformPercent: 30,
  /** Creator takes this percentage */
  creatorPercent: 70,
  /** Processing fee percentage */
  processingFeePercent: 2.9,
  /** Processing fee flat amount */
  processingFeeFlat: 0.30,
};

/**
 * Plugin Economy Manager
 */
export class PluginEconomyManager {
  private creators: Map<string, CreatorAccount> = new Map();
  private sales: Map<string, SalesRecord> = new Map();
  private payouts: Map<string, CreatorPayout> = new Map();
  private reviews: Map<string, Review> = new Map();

  /**
   * Register as plugin creator
   */
  async registerCreator(userId: string, email: string): Promise<CreatorAccount> {
    const creator: CreatorAccount = {
      id: 'creator_' + this.generateId(),
      userId,
      email,
      payoutSchedule: 'monthly',
      minimumPayout: 50,
      totalEarned: 0,
      pendingBalance: 0,
      pluginCount: 0,
    };

    this.creators.set(creator.id, creator);
    return creator;
  }

  /**
   * Get creator account
   */
  getCreator(userId: string): CreatorAccount | undefined {
    return Array.from(this.creators.values()).find(c => c.userId === userId);
  }

  /**
   * Get creator by ID
   */
  getCreatorById(creatorId: string): CreatorAccount | undefined {
    return this.creators.get(creatorId);
  }

  /**
   * Update creator payout settings
   */
  async updatePayoutSettings(
    creatorId: string,
    settings: Partial<Pick<CreatorAccount, 'payoutSchedule' | 'minimumPayout' | 'stripeAccountId' | 'paypalEmail' | 'bankAccount'>>
  ): Promise<CreatorAccount | null> {
    const creator = this.creators.get(creatorId);
    if (!creator) return null;

    Object.assign(creator, settings);
    this.creators.set(creatorId, creator);
    return creator;
  }

  /**
   * Record sale
   */
  async recordSale(data: {
    pluginId: string;
    creatorId: string;
    buyerOrganizationId: string;
    tierId?: string;
    amount: number;
    currency?: string;
  }): Promise<SalesRecord> {
    const salesRecord: SalesRecord = {
      id: 'sale_' + this.generateId(),
      pluginId: data.pluginId,
      buyerOrganizationId: data.buyerOrganizationId,
      tierId: data.tierId,
      amount: data.amount,
      currency: data.currency || 'usd',
      timestamp: Date.now(),
      refunded: false,
    };

    this.sales.set(salesRecord.id, salesRecord);

    // Update creator balance
    const creator = this.creators.get(data.creatorId);
    if (creator) {
      const netAmount = this.calculateNetRevenue(data.amount);
      creator.pendingBalance += netAmount;
      creator.totalEarned += netAmount;
      this.creators.set(data.creatorId, creator);
    }

    return salesRecord;
  }

  /**
   * Process refund
   */
  async processRefund(saleId: string, amount?: number): Promise<boolean> {
    const sale = this.sales.get(saleId);
    if (!sale || sale.refunded) return false;

    const refundAmount = amount || sale.amount;
    sale.refunded = true;
    sale.refundAmount = refundAmount;
    this.sales.set(saleId, sale);

    // Adjust creator balance
    const creator = Array.from(this.creators.values()).find(c => c.pluginCount > 0);
    if (creator) {
      const netRefund = this.calculateNetRevenue(refundAmount);
      creator.pendingBalance -= netRefund;
      creator.totalEarned -= netRefund;
    }

    return true;
  }

  /**
   * Get plugin revenue stats
   */
  async getPluginRevenue(pluginId: string): Promise<PluginRevenue> {
    const pluginSales = Array.from(this.sales.values()).filter(s => s.pluginId === pluginId);
    
    const now = Date.now();
    const monthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const thisMonthSales = pluginSales.filter(s => s.timestamp > monthAgo && !s.refunded);
    const totalSales = pluginSales.filter(s => !s.refunded);
    
    const totalRevenue = totalSales.reduce((sum, s) => sum + this.calculateNetRevenue(s.amount), 0);
    const monthlyRevenue = thisMonthSales.reduce((sum, s) => sum + this.calculateNetRevenue(s.amount), 0);

    const pluginReviews = Array.from(this.reviews.values()).filter(r => r.pluginId === pluginId);
    const avgRating = pluginReviews.length > 0
      ? pluginReviews.reduce((sum, r) => sum + r.rating, 0) / pluginReviews.length
      : 0;
    
    const refundedCount = pluginSales.filter(s => s.refunded).length;

    return {
      pluginId,
      totalRevenue,
      monthlyRevenue,
      totalSales: totalSales.length,
      salesThisMonth: thisMonthSales.length,
      averageRating: avgRating,
      refundRate: totalSales.length > 0 ? refundedCount / totalSales.length : 0,
    };
  }

  /**
   * Get creator earnings
   */
  async getCreatorEarnings(creatorId: string): Promise<{
    totalEarned: number;
    pendingBalance: number;
    paidOut: number;
  }> {
    const creator = this.creators.get(creatorId);
    if (!creator) {
      return { totalEarned: 0, pendingBalance: 0, paidOut: 0 };
    }

    const payouts = Array.from(this.payouts.values()).filter(
      p => p.creatorId === creatorId && p.status === 'paid'
    );
    const paidOut = payouts.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalEarned: creator.totalEarned,
      pendingBalance: creator.pendingBalance,
      paidOut,
    };
  }

  /**
   * Request payout
   */
  async requestPayout(creatorId: string, method: CreatorPayout['method']): Promise<CreatorPayout | null> {
    const creator = this.creators.get(creatorId);
    if (!creator || creator.pendingBalance < creator.minimumPayout) return null;

    const payout: CreatorPayout = {
      id: 'payout_' + this.generateId(),
      creatorId,
      amount: creator.pendingBalance,
      currency: 'usd',
      status: 'pending',
      method,
      createdAt: Date.now(),
    };

    this.payouts.set(payout.id, payout);
    
    // Reset pending balance
    creator.pendingBalance = 0;
    this.creators.set(creatorId, creator);

    return payout;
  }

  /**
   * Get payouts
   */
  getPayouts(creatorId: string): CreatorPayout[] {
    return Array.from(this.payouts.values())
      .filter(p => p.creatorId === creatorId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Add review
   */
  async addReview(data: {
    pluginId: string;
    userId: string;
    organizationId: string;
    rating: number;
    title: string;
    content: string;
    verified: boolean;
  }): Promise<Review> {
    const review: Review = {
      id: 'review_' + this.generateId(),
      pluginId: data.pluginId,
      userId: data.userId,
      organizationId: data.organizationId,
      rating: data.rating,
      title: data.title,
      content: data.content,
      helpful: 0,
      createdAt: Date.now(),
      verified: data.verified,
    };

    this.reviews.set(review.id, review);
    return review;
  }

  /**
   * Get reviews for plugin
   */
  getReviews(pluginId: string): Review[] {
    return Array.from(this.reviews.values())
      .filter(r => r.pluginId === pluginId)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Mark review as helpful
   */
  async markReviewHelpful(reviewId: string): Promise<boolean> {
    const review = this.reviews.get(reviewId);
    if (!review) return false;

    review.helpful++;
    this.reviews.set(reviewId, review);
    return true;
  }

  /**
   * Developer responds to review
   */
  async respondToReview(reviewId: string, response: string): Promise<boolean> {
    const review = this.reviews.get(reviewId);
    if (!review) return false;

    review.developerResponse = {
      content: response,
      respondedAt: Date.now(),
    };
    this.reviews.set(reviewId, review);
    return true;
  }

  /**
   * Calculate net revenue after platform fee and processing
   */
  calculateNetRevenue(grossAmount: number): number {
    const platformFee = grossAmount * (REVENUE_SHARE.platformPercent / 100);
    const processingFee = (grossAmount * (REVENUE_SHARE.processingFeePercent / 100)) + 
                          REVENUE_SHARE.processingFeeFlat;
    return grossAmount - platformFee - processingFee;
  }

  /**
   * Get revenue share breakdown
   */
  getRevenueBreakdown(amount: number): {
    gross: number;
    platformFee: number;
    processingFee: number;
    net: number;
  } {
    const platformFee = amount * (REVENUE_SHARE.platformPercent / 100);
    const processingFee = (amount * (REVENUE_SHARE.processingFeePercent / 100)) + 
                         REVENUE_SHARE.processingFeeFlat;
    
    return {
      gross: amount,
      platformFee,
      processingFee,
      net: amount - platformFee - processingFee,
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}
