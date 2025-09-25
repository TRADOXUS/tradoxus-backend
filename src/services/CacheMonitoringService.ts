import { redisCacheManager, CacheMetrics } from "../config/redis";
import { AuthCacheService } from "./AuthCacheService";
import { TradingCacheService } from "./TradingCacheService";
import { CourseCacheService } from "./CourseCacheService";
import { DatabaseCacheService } from "./DatabaseCacheService";
import { cacheWarmingService } from "./CacheWarmingService";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface CacheHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  isConnected: boolean;
  metrics: CacheMetrics;
  memoryUsage?: {
    used: number;
    peak: number;
    fragmentation: number;
  };
  lastChecked: string;
}

export interface CachePerformanceMetrics {
  hitRatio: number;
  missRatio: number;
  errorRate: number;
  averageResponseTime: number;
  totalRequests: number;
  cacheSize: number;
  evictionRate: number;
}

export interface CacheDashboardData {
  health: CacheHealthStatus;
  performance: CachePerformanceMetrics;
  warming: {
    isRunning: boolean;
    strategies: Array<{
      name: string;
      enabled: boolean;
      lastRun?: Date;
      nextRun?: Date;
    }>;
  };
  statistics: {
    auth: { keys: number; hitRatio: number };
    trading: { keys: number; hitRatio: number };
    course: { keys: number; hitRatio: number };
    database: { keys: number; hitRatio: number };
  };
  alerts: Array<{
    level: "info" | "warning" | "error";
    message: string;
    timestamp: string;
  }>;
}

export class CacheMonitoringService {
  private alerts: Array<{
    level: "info" | "warning" | "error";
    message: string;
    timestamp: string;
  }> = [];
  private performanceHistory: CachePerformanceMetrics[] = [];
  private maxHistorySize = 100;

  // Get comprehensive cache health status
  async getCacheHealth(): Promise<CacheHealthStatus> {
    try {
      const healthCheck = await redisCacheManager.healthCheck();
      const metrics = redisCacheManager.getMetrics();

      // Determine health status based on metrics
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";

      if (!healthCheck.isConnected) {
        status = "unhealthy";
      } else if (
        metrics.hitRatio < 0.5 ||
        metrics.errors > metrics.totalRequests * 0.1
      ) {
        status = "degraded";
      }

      // Get memory usage if available
      let memoryUsage;
      try {
        const info = await redisCacheManager.getClient().info("memory");
        const memoryInfo = this.parseRedisInfo(info);
        memoryUsage = {
          used: memoryInfo.used_memory || 0,
          peak: memoryInfo.used_memory_peak || 0,
          fragmentation: memoryInfo.mem_fragmentation_ratio || 0,
        };
      } catch (error) {
        logger.warn("Failed to get memory usage:", error);
      }

      return {
        status,
        isConnected: healthCheck.isConnected,
        metrics,
        memoryUsage,
        lastChecked: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Failed to get cache health:", error);
      return {
        status: "unhealthy",
        isConnected: false,
        metrics: {
          hits: 0,
          misses: 0,
          errors: 1,
          totalRequests: 0,
          hitRatio: 0,
        },
        lastChecked: new Date().toISOString(),
      };
    }
  }

  // Get cache performance metrics
  async getPerformanceMetrics(): Promise<CachePerformanceMetrics> {
    try {
      const metrics = redisCacheManager.getMetrics();

      // Calculate additional metrics
      const hitRatio = metrics.hitRatio;
      const missRatio = 1 - hitRatio;
      const errorRate =
        metrics.totalRequests > 0 ? metrics.errors / metrics.totalRequests : 0;

      // Get cache size
      const cacheSize = await this.getCacheSize();

      // Calculate average response time (simplified)
      const averageResponseTime = this.calculateAverageResponseTime();

      return {
        hitRatio,
        missRatio,
        errorRate,
        averageResponseTime,
        totalRequests: metrics.totalRequests,
        cacheSize,
        evictionRate: 0, // Would need Redis INFO for this
      };
    } catch (error) {
      logger.error("Failed to get performance metrics:", error);
      return {
        hitRatio: 0,
        missRatio: 1,
        errorRate: 1,
        averageResponseTime: 0,
        totalRequests: 0,
        cacheSize: 0,
        evictionRate: 0,
      };
    }
  }

  // Get comprehensive dashboard data
  async getDashboardData(): Promise<CacheDashboardData> {
    try {
      const [health, performance, warmingStatus, statistics] =
        await Promise.all([
          this.getCacheHealth(),
          this.getPerformanceMetrics(),
          this.getWarmingStatus(),
          this.getCacheStatistics(),
        ]);

      return {
        health,
        performance,
        warming: warmingStatus,
        statistics,
        alerts: this.getRecentAlerts(),
      };
    } catch (error) {
      logger.error("Failed to get dashboard data:", error);
      throw error;
    }
  }

  // Get warming service status
  private async getWarmingStatus(): Promise<{
    isRunning: boolean;
    strategies: Array<{
      name: string;
      enabled: boolean;
      lastRun?: Date;
      nextRun?: Date;
    }>;
  }> {
    try {
      const status = cacheWarmingService.getStatus();
      return {
        isRunning: status.isRunning,
        strategies: status.strategies.map((s) => ({
          name: s.name,
          enabled: s.enabled,
          lastRun: s.lastRun,
          nextRun: s.nextRun,
        })),
      };
    } catch (error) {
      logger.error("Failed to get warming status:", error);
      return { isRunning: false, strategies: [] };
    }
  }

  // Get cache statistics by service
  async getCacheStatistics(): Promise<{
    auth: { keys: number; hitRatio: number };
    trading: { keys: number; hitRatio: number };
    course: { keys: number; hitRatio: number };
    database: { keys: number; hitRatio: number };
  }> {
    try {
      const [authStats, tradingStats, courseStats, databaseStats] =
        await Promise.all([
          AuthCacheService.getAuthCacheStats(),
          TradingCacheService.getTradingCacheStats(),
          CourseCacheService.getCourseCacheStats(),
          DatabaseCacheService.getDatabaseCacheStats(),
        ]);

      const overallMetrics = redisCacheManager.getMetrics();

      return {
        auth: { keys: authStats, hitRatio: overallMetrics.hitRatio },
        trading: {
          keys: tradingStats.totalKeys,
          hitRatio: overallMetrics.hitRatio,
        },
        course: {
          keys: courseStats.totalKeys,
          hitRatio: overallMetrics.hitRatio,
        },
        database: {
          keys: databaseStats.totalKeys,
          hitRatio: overallMetrics.hitRatio,
        },
      };
    } catch (error) {
      logger.error("Failed to get cache statistics:", error);
      return {
        auth: { keys: 0, hitRatio: 0 },
        trading: { keys: 0, hitRatio: 0 },
        course: { keys: 0, hitRatio: 0 },
        database: { keys: 0, hitRatio: 0 },
      };
    }
  }

  // Get cache size
  private async getCacheSize(): Promise<number> {
    try {
      const keys = await redisCacheManager.keys("*");
      return keys.length;
    } catch (error) {
      logger.error("Failed to get cache size:", error);
      return 0;
    }
  }

  // Calculate average response time (simplified)
  private calculateAverageResponseTime(): number {
    // This would typically be tracked over time
    // For now, return a mock value
    return 5.2; // milliseconds
  }

  // Parse Redis INFO output
  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = info.split("\r\n");

    for (const line of lines) {
      if (line.includes(":")) {
        const [key, value] = line.split(":");
        const numValue = parseFloat(value);
        result[key] = isNaN(numValue) ? value : numValue;
      }
    }

    return result;
  }

  // Add alert
  addAlert(level: "info" | "warning" | "error", message: string): void {
    this.alerts.push({
      level,
      message,
      timestamp: new Date().toISOString(),
    });

    // Keep only recent alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    logger.info(`Cache Alert [${level.toUpperCase()}]: ${message}`);
  }

  // Get recent alerts
  getRecentAlerts(limit: number = 10): Array<{
    level: "info" | "warning" | "error";
    message: string;
    timestamp: string;
  }> {
    return this.alerts.slice(-limit);
  }

  // Clear alerts
  clearAlerts(): void {
    this.alerts = [];
  }

  // Monitor cache performance
  async monitorPerformance(): Promise<void> {
    try {
      const performance = await this.getPerformanceMetrics();

      // Add to history
      this.performanceHistory.push(performance);
      if (this.performanceHistory.length > this.maxHistorySize) {
        this.performanceHistory = this.performanceHistory.slice(
          -this.maxHistorySize,
        );
      }

      // Check for performance issues
      if (performance.hitRatio < 0.3) {
        this.addAlert(
          "warning",
          `Low cache hit ratio: ${(performance.hitRatio * 100).toFixed(1)}%`,
        );
      }

      if (performance.errorRate > 0.05) {
        this.addAlert(
          "error",
          `High cache error rate: ${(performance.errorRate * 100).toFixed(1)}%`,
        );
      }

      if (performance.averageResponseTime > 100) {
        this.addAlert(
          "warning",
          `High cache response time: ${performance.averageResponseTime}ms`,
        );
      }
    } catch (error) {
      logger.error("Failed to monitor performance:", error);
      this.addAlert(
        "error",
        `Performance monitoring failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  // Get performance history
  getPerformanceHistory(): CachePerformanceMetrics[] {
    return [...this.performanceHistory];
  }

  // Get cache health trends
  async getHealthTrends(hours: number = 24): Promise<
    Array<{
      timestamp: string;
      hitRatio: number;
      errorRate: number;
      cacheSize: number;
    }>
  > {
    // This would typically fetch from a time-series database
    // For now, return mock data based on current metrics
    const currentMetrics = redisCacheManager.getMetrics();
    const trends = [];

    for (let i = hours; i >= 0; i--) {
      const timestamp = new Date(Date.now() - i * 60 * 60 * 1000).toISOString();
      trends.push({
        timestamp,
        hitRatio: currentMetrics.hitRatio + (Math.random() - 0.5) * 0.1,
        errorRate: Math.max(
          0,
          currentMetrics.errors / Math.max(currentMetrics.totalRequests, 1) +
            (Math.random() - 0.5) * 0.02,
        ),
        cacheSize: Math.floor(Math.random() * 1000) + 500,
      });
    }

    return trends;
  }

  // Generate cache report
  async generateCacheReport(): Promise<{
    summary: {
      totalKeys: number;
      hitRatio: number;
      errorRate: number;
      memoryUsage: number;
      uptime: string;
    };
    recommendations: string[];
    alerts: Array<{
      level: "info" | "warning" | "error";
      message: string;
      timestamp: string;
    }>;
  }> {
    try {
      const [health, performance, cacheSize] = await Promise.all([
        this.getCacheHealth(),
        this.getPerformanceMetrics(),
        this.getCacheSize(),
      ]);

      const recommendations: string[] = [];

      if (performance.hitRatio < 0.5) {
        recommendations.push(
          "Consider increasing TTL values for frequently accessed data",
        );
      }

      if (performance.errorRate > 0.01) {
        recommendations.push(
          "Investigate cache connection issues and error patterns",
        );
      }

      if (health.memoryUsage && health.memoryUsage.fragmentation > 1.5) {
        recommendations.push("Consider Redis memory optimization or restart");
      }

      return {
        summary: {
          totalKeys: cacheSize,
          hitRatio: performance.hitRatio,
          errorRate: performance.errorRate,
          memoryUsage: health.memoryUsage?.used || 0,
          uptime: "24h", // Would be calculated from actual uptime
        },
        recommendations,
        alerts: this.getRecentAlerts(20),
      };
    } catch (error) {
      logger.error("Failed to generate cache report:", error);
      throw error;
    }
  }

  // Start monitoring
  startMonitoring(intervalMs: number = 60000): void {
    setInterval(async () => {
      await this.monitorPerformance();
    }, intervalMs);

    logger.info(`Cache monitoring started with ${intervalMs}ms interval`);
  }
}

// Export singleton instance
export const cacheMonitoringService = new CacheMonitoringService();
