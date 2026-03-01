/**
 * Plugin Analytics
 * 
 * Tracks plugin usage metrics, performance data, and provides analytics dashboard.
 */

/**
 * Usage event types
 */
export enum EventType {
  INSTALL = 'install',
  UNINSTALL = 'uninstall',
  UPDATE = 'update',
  ENABLE = 'enable',
  DISABLE = 'disable',
  LOAD = 'load',
  ERROR = 'error',
  RENDER = 'render',
  PARSE = 'parse',
  TRANSFORM = 'transform'
}

/**
 * Usage event
 */
export interface UsageEvent {
  id: string;
  pluginId: string;
  eventType: EventType;
  timestamp: number;
  engineVersion: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  duration?: number;
  success: boolean;
  errorMessage?: string;
}

/**
 * Plugin metrics
 */
export interface PluginMetrics {
  pluginId: string;
  /** Total installs */
  installs: number;
  /** Uninstalls */
  uninstalls: number;
  /** Active users (last 30 days) */
  activeUsers: number;
  /** Total usage count */
  usageCount: number;
  /** Average load time (ms) */
  avgLoadTime: number;
  /** Error rate (0-1) */
  errorRate: number;
  /** Average execution time (ms) */
  avgExecutionTime: number;
  /** Last updated */
  updatedAt: number;
  /** Rating */
  rating: number;
  /** Review count */
  reviewCount: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** CPU usage percentage */
  cpuUsage: number;
  /** Memory usage MB */
  memoryUsage: number;
  /** Execution time ms */
  executionTime: number;
  /** Throughput (ops/sec) */
  throughput: number;
  /** Error count */
  errors: number;
}

/**
 * Dashboard summary
 */
export interface DashboardSummary {
  totalPlugins: number;
  totalInstalls: number;
  totalActiveUsers: number;
  avgErrorRate: number;
  topPlugins: PluginMetrics[];
  trendingPlugins: PluginMetrics[];
  recentEvents: UsageEvent[];
  performance: PerformanceMetrics;
}

/**
 * Plugin analytics tracker
 */
export class PluginAnalytics {
  private events: UsageEvent[] = [];
  private metrics: Map<string, PluginMetrics> = new Map();
  private sessions: Map<string, Session> = new Map();
  private maxEvents: number = 100000;
  private flushInterval: number = 60000; // 1 minute

  constructor() {
    // Periodic flush
    setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Track an event
   */
  track(event: Omit<UsageEvent, 'id' | 'timestamp'>): void {
    const fullEvent: UsageEvent = {
      ...event,
      id: this.generateId(),
      timestamp: Date.now()
    };

    this.events.push(fullEvent);

    // Trim if exceeds max
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents / 2);
    }

    // Update metrics
    this.updateMetrics(fullEvent);
  }

  /**
   * Track plugin install
   */
  trackInstall(pluginId: string, engineVersion: string, userId?: string): void {
    this.track({
      pluginId,
      eventType: EventType.INSTALL,
      engineVersion,
      userId,
      success: true
    });
  }

  /**
   * Track plugin error
   */
  trackError(
    pluginId: string, 
    engineVersion: string, 
    error: string,
    metadata?: Record<string, unknown>
  ): void {
    this.track({
      pluginId,
      eventType: EventType.ERROR,
      engineVersion,
      success: false,
      errorMessage: error,
      metadata
    });
  }

  /**
   * Track plugin execution
   */
  trackExecution(
    pluginId: string,
    engineVersion: string,
    duration: number,
    success: boolean
  ): void {
    this.track({
      pluginId,
      eventType: EventType.LOAD,
      engineVersion,
      duration,
      success
    });
  }

  /**
   * Get metrics for a plugin
   */
  getMetrics(pluginId: string): PluginMetrics | null {
    return this.metrics.get(pluginId) || null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PluginMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get dashboard summary
   */
  getDashboardSummary(limit: number = 10): DashboardSummary {
    const allMetrics = this.getAllMetrics();
    
    const topPlugins = [...allMetrics]
      .sort((a, b) => b.installs - a.installs)
      .slice(0, limit);

    const trendingPlugins = [...allMetrics]
      .sort((a, b) => b.activeUsers - a.activeUsers)
      .slice(0, limit);

    const recentEvents = this.events.slice(-50);

    const totalInstalls = allMetrics.reduce((sum, m) => sum + m.installs, 0);
    const totalActiveUsers = new Set(
      this.events
        .filter(e => e.timestamp > Date.now() - 30 * 24 * 60 * 60 * 1000)
        .map(e => e.userId)
    ).size;

    return {
      totalPlugins: allMetrics.length,
      totalInstalls,
      totalActiveUsers,
      avgErrorRate: allMetrics.length > 0 
        ? allMetrics.reduce((sum, m) => sum + m.errorRate, 0) / allMetrics.length 
        : 0,
      topPlugins,
      trendingPlugins,
      recentEvents,
      performance: this.getPerformanceMetrics()
    };
  }

  /**
   * Get events for a plugin
   */
  getEvents(pluginId: string, limit: number = 100): UsageEvent[] {
    return this.events
      .filter(e => e.pluginId === pluginId)
      .slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: EventType, limit: number = 100): UsageEvent[] {
    return this.events
      .filter(e => e.eventType === eventType)
      .slice(-limit);
  }

  /**
   * Get error events
   */
  getErrors(limit: number = 100): UsageEvent[] {
    return this.events
      .filter(e => e.eventType === EventType.ERROR)
      .slice(-limit);
  }

  /**
   * Get usage over time
   */
  getUsageOverTime(
    pluginId: string, 
    startTime: number, 
    endTime: number
  ): { timestamp: number; count: number }[] {
    const events = this.events.filter(
      e => e.pluginId === pluginId && 
           e.timestamp >= startTime && 
           e.timestamp <= endTime
    );

    // Group by hour
    const grouped = new Map<number, number>();
    events.forEach(e => {
      const hour = Math.floor(e.timestamp / 3600000) * 3600000;
      grouped.set(hour, (grouped.get(hour) || 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Export analytics data
   */
  exportData(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify({
        events: this.events,
        metrics: Array.from(this.metrics.entries())
      }, null, 2);
    }

    // CSV format
    const headers = ['id', 'pluginId', 'eventType', 'timestamp', 'engineVersion', 'success', 'duration'];
    const rows = this.events.map(e => [
      e.id, e.pluginId, e.eventType, e.timestamp, e.engineVersion, e.success, e.duration || ''
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Flush events (send to backend)
   */
  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    // In real implementation, would send to analytics backend
    console.log(`[Analytics] Flushing ${this.events.length} events`);
  }

  /**
   * Update metrics based on event
   */
  private updateMetrics(event: UsageEvent): void {
    let m = this.metrics.get(event.pluginId);
    
    if (!m) {
      m = {
        pluginId: event.pluginId,
        installs: 0,
        uninstalls: 0,
        activeUsers: 0,
        usageCount: 0,
        avgLoadTime: 0,
        errorRate: 0,
        avgExecutionTime: 0,
        updatedAt: Date.now(),
        rating: 0,
        reviewCount: 0
      };
      this.metrics.set(event.pluginId, m);
    }

    switch (event.eventType) {
      case EventType.INSTALL:
        m.installs++;
        break;
      case EventType.UNINSTALL:
        m.uninstalls++;
        break;
      case EventType.LOAD:
        m.usageCount++;
        if (event.duration) {
          const total = m.avgExecutionTime * (m.usageCount - 1);
          m.avgExecutionTime = (total + event.duration) / m.usageCount;
        }
        break;
      case EventType.ERROR:
        m.errorRate = (m.errorRate * m.usageCount + 1) / (m.usageCount + 1);
        break;
    }

    m.updatedAt = Date.now();
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): PerformanceMetrics {
    const recentErrors = this.events.filter(
      e => e.eventType === EventType.ERROR && 
           e.timestamp > Date.now() - 60000
    );

    return {
      cpuUsage: process.cpuUsage().user / 1000000, // Approximate
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
      executionTime: 0,
      throughput: this.events.length / 60,
      errors: recentErrors.length
    };
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Session tracking
 */
interface Session {
  id: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  events: number;
}

/**
 * Analytics aggregator for reports
 */
export class AnalyticsAggregator {
  private analytics: PluginAnalytics;

  constructor(analytics: PluginAnalytics) {
    this.analytics = analytics;
  }

  /**
   * Get daily report
   */
  getDailyReport(date: Date): {
    installs: number;
    uninstalls: number;
    errors: number;
    activePlugins: number;
  } {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayEvents = this.analytics['events'].filter(
      e => e.timestamp >= startOfDay.getTime() && e.timestamp <= endOfDay.getTime()
    );

    return {
      installs: dayEvents.filter(e => e.eventType === EventType.INSTALL).length,
      uninstalls: dayEvents.filter(e => e.eventType === EventType.UNINSTALL).length,
      errors: dayEvents.filter(e => e.eventType === EventType.ERROR).length,
      activePlugins: new Set(dayEvents.map(e => e.pluginId)).size
    };
  }

  /**
   * Get weekly trends
   */
  getWeeklyTrends(): { date: string; installs: number; errors: number }[] {
    const trends: { date: string; installs: number; errors: number }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const report = this.getDailyReport(date);
      trends.push({
        date: date.toISOString().split('T')[0],
        installs: report.installs,
        errors: report.errors
      });
    }

    return trends;
  }
}
