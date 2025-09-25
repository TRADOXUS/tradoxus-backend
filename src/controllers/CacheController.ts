import { Request, Response } from "express";
import { redisCacheManager } from "../config/redis";
import { cacheMonitoringService } from "../services/CacheMonitoringService";
import { cacheWarmingService } from "../services/CacheWarmingService";
import { AuthCacheService } from "../services/AuthCacheService";
import { TradingCacheService } from "../services/TradingCacheService";
import { CourseCacheService } from "../services/CourseCacheService";
import { DatabaseCacheService } from "../services/DatabaseCacheService";
import { cacheOptimizationService } from "../services/CacheOptimizationService";
import { cacheFallbackService } from "../services/CacheFallbackService";
import {
  invalidateCache,
  invalidateCacheByTags,
  clearAllCache,
} from "../middleware/cache";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export class CacheController {
  // Get cache health status
  static async getHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await cacheMonitoringService.getCacheHealth();
      res.json({
        success: true,
        data: health,
      });
    } catch (error) {
      logger.error("Failed to get cache health:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get cache health",
      });
    }
  }

  // Get cache performance metrics
  static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await cacheMonitoringService.getPerformanceMetrics();
      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      logger.error("Failed to get cache metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get cache metrics",
      });
    }
  }

  // Get comprehensive dashboard data
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const dashboard = await cacheMonitoringService.getDashboardData();
      res.json({
        success: true,
        data: dashboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to get dashboard data",
      });
    }
  }

  // Get cache statistics by service
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const [authStats, tradingStats, courseStats, databaseStats] =
        await Promise.all([
          TradingCacheService.getTradingCacheStats(),
          CourseCacheService.getCourseCacheStats(),
          DatabaseCacheService.getDatabaseCacheStats(),
          cacheMonitoringService.getCacheStatistics(),
        ]);

      res.json({
        success: true,
        data: {
          auth: authStats,
          trading: tradingStats,
          course: courseStats,
          database: databaseStats,
        },
      });
    } catch (error) {
      logger.error("Failed to get cache statistics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get cache statistics",
      });
    }
  }

  // Get cache warming status
  static async getWarmingStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = cacheWarmingService.getStatus();
      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error("Failed to get warming status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get warming status",
      });
    }
  }

  // Start cache warming
  static async startWarming(req: Request, res: Response): Promise<void> {
    try {
      await cacheWarmingService.start();
      res.json({
        success: true,
        message: "Cache warming started successfully",
      });
    } catch (error) {
      logger.error("Failed to start cache warming:", error);
      res.status(500).json({
        success: false,
        error: "Failed to start cache warming",
      });
    }
  }

  // Stop cache warming
  static async stopWarming(req: Request, res: Response): Promise<void> {
    try {
      await cacheWarmingService.stop();
      res.json({
        success: true,
        message: "Cache warming stopped successfully",
      });
    } catch (error) {
      logger.error("Failed to stop cache warming:", error);
      res.status(500).json({
        success: false,
        error: "Failed to stop cache warming",
      });
    }
  }

  // Trigger specific warming strategy
  static async triggerWarmingStrategy(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { strategyName } = req.params;
      const result = await cacheWarmingService.triggerStrategy(strategyName);

      if (result) {
        res.json({
          success: true,
          data: result,
        });
      } else {
        res.status(404).json({
          success: false,
          error: `Warming strategy '${strategyName}' not found`,
        });
      }
    } catch (error) {
      logger.error("Failed to trigger warming strategy:", error);
      res.status(500).json({
        success: false,
        error: "Failed to trigger warming strategy",
      });
    }
  }

  // Invalidate cache by pattern
  static async invalidateCache(req: Request, res: Response): Promise<void> {
    try {
      const { pattern } = req.body;

      if (!pattern) {
        res.status(400).json({
          success: false,
          error: "Pattern is required",
        });
        return;
      }

      await invalidateCache(pattern);
      res.json({
        success: true,
        message: `Cache invalidated for pattern: ${pattern}`,
      });
    } catch (error) {
      logger.error("Failed to invalidate cache:", error);
      res.status(500).json({
        success: false,
        error: "Failed to invalidate cache",
      });
    }
  }

  // Invalidate cache by tags
  static async invalidateCacheByTags(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { tags } = req.body;

      if (!tags || !Array.isArray(tags)) {
        res.status(400).json({
          success: false,
          error: "Tags array is required",
        });
        return;
      }

      await invalidateCacheByTags(tags);
      res.json({
        success: true,
        message: `Cache invalidated for tags: ${tags.join(", ")}`,
      });
    } catch (error) {
      logger.error("Failed to invalidate cache by tags:", error);
      res.status(500).json({
        success: false,
        error: "Failed to invalidate cache by tags",
      });
    }
  }

  // Clear all cache
  static async clearAllCache(req: Request, res: Response): Promise<void> {
    try {
      await clearAllCache();
      res.json({
        success: true,
        message: "All cache cleared successfully",
      });
    } catch (error) {
      logger.error("Failed to clear all cache:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear all cache",
      });
    }
  }

  // Invalidate user cache
  static async invalidateUserCache(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: "User ID is required",
        });
        return;
      }

      await AuthCacheService.invalidateUserCache(userId);
      res.json({
        success: true,
        message: `User cache invalidated for user: ${userId}`,
      });
    } catch (error) {
      logger.error("Failed to invalidate user cache:", error);
      res.status(500).json({
        success: false,
        error: "Failed to invalidate user cache",
      });
    }
  }

  // Invalidate trading cache
  static async invalidateTradingCache(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { symbol } = req.query;

      await TradingCacheService.invalidateTradingData(symbol as string);
      res.json({
        success: true,
        message: `Trading cache invalidated${symbol ? ` for symbol: ${symbol}` : " for all symbols"}`,
      });
    } catch (error) {
      logger.error("Failed to invalidate trading cache:", error);
      res.status(500).json({
        success: false,
        error: "Failed to invalidate trading cache",
      });
    }
  }

  // Invalidate course cache
  static async invalidateCourseCache(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const { courseId } = req.params;

      if (courseId) {
        await CourseCacheService.invalidateCourseCache(courseId);
        res.json({
          success: true,
          message: `Course cache invalidated for course: ${courseId}`,
        });
      } else {
        // Invalidate all course cache
        await CourseCacheService.invalidateCourseCache("*");
        res.json({
          success: true,
          message: "All course cache invalidated",
        });
      }
    } catch (error) {
      logger.error("Failed to invalidate course cache:", error);
      res.status(500).json({
        success: false,
        error: "Failed to invalidate course cache",
      });
    }
  }

  // Get cache keys
  static async getCacheKeys(req: Request, res: Response): Promise<void> {
    try {
      const { pattern = "*" } = req.query;
      const keys = await redisCacheManager.keys(pattern as string);

      res.json({
        success: true,
        data: {
          keys,
          count: keys.length,
          pattern: pattern as string,
        },
      });
    } catch (error) {
      logger.error("Failed to get cache keys:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get cache keys",
      });
    }
  }

  // Get cache value by key
  static async getCacheValue(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(400).json({
          success: false,
          error: "Key is required",
        });
        return;
      }

      const value = await redisCacheManager.get(key);

      if (value) {
        try {
          const parsedValue = JSON.parse(value);
          res.json({
            success: true,
            data: {
              key,
              value: parsedValue,
              rawValue: value,
            },
          });
        } catch {
          res.json({
            success: true,
            data: {
              key,
              value: value,
              rawValue: value,
            },
          });
        }
      } else {
        res.status(404).json({
          success: false,
          error: "Key not found",
        });
      }
    } catch (error) {
      logger.error("Failed to get cache value:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get cache value",
      });
    }
  }

  // Delete cache key
  static async deleteCacheKey(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;

      if (!key) {
        res.status(400).json({
          success: false,
          error: "Key is required",
        });
        return;
      }

      const deleted = await redisCacheManager.del(key);

      res.json({
        success: true,
        message: deleted
          ? `Key '${key}' deleted successfully`
          : `Key '${key}' not found`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete cache key",
      });
    }
  }

  // Get cache report
  static async getCacheReport(req: Request, res: Response): Promise<void> {
    try {
      const report = await cacheMonitoringService.generateCacheReport();
      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      logger.error("Failed to generate cache report:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate cache report",
      });
    }
  }

  // Get performance history
  static async getPerformanceHistory(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const history = cacheMonitoringService.getPerformanceHistory();
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error("Failed to get performance history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get performance history",
      });
    }
  }

  // Get health trends
  static async getHealthTrends(req: Request, res: Response): Promise<void> {
    try {
      const { hours = 24 } = req.query;
      const trends = await cacheMonitoringService.getHealthTrends(
        parseInt(hours as string),
      );
      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      logger.error("Failed to get health trends:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get health trends",
      });
    }
  }

  // Get alerts
  static async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      const alerts = cacheMonitoringService.getRecentAlerts(
        parseInt(limit as string),
      );
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error) {
      logger.error("Failed to get alerts:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get alerts",
      });
    }
  }

  // Clear alerts
  static async clearAlerts(req: Request, res: Response): Promise<void> {
    try {
      cacheMonitoringService.clearAlerts();
      res.json({
        success: true,
        message: "Alerts cleared successfully",
      });
    } catch (error) {
      logger.error("Failed to clear alerts:", error);
      res.status(500).json({
        success: false,
        error: "Failed to clear alerts",
      });
    }
  }

  // Reset cache metrics
  static async resetMetrics(req: Request, res: Response): Promise<void> {
    try {
      redisCacheManager.resetMetrics();
      res.json({
        success: true,
        message: "Cache metrics reset successfully",
      });
    } catch (error) {
      logger.error("Failed to reset metrics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset metrics",
      });
    }
  }

  // Get optimization recommendations
  static async getOptimizationRecommendations(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const recommendations =
        await cacheOptimizationService.getOptimizationRecommendations();
      res.json({
        success: true,
        data: recommendations,
      });
    } catch (error) {
      logger.error("Failed to get optimization recommendations:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get optimization recommendations",
      });
    }
  }

  // Get optimization configuration
  static async getOptimizationConfig(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const config = cacheOptimizationService.getCurrentConfiguration();
      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      logger.error("Failed to get optimization configuration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get optimization configuration",
      });
    }
  }

  // Update optimization configuration
  static async updateOptimizationConfig(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const updates = req.body;
      cacheOptimizationService.updateConfiguration(updates);
      res.json({
        success: true,
        message: "Optimization configuration updated successfully",
      });
    } catch (error) {
      logger.error("Failed to update optimization configuration:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update optimization configuration",
      });
    }
  }

  // Trigger optimization
  static async triggerOptimization(req: Request, res: Response): Promise<void> {
    try {
      const { ruleName } = req.query;
      const results = await cacheOptimizationService.triggerOptimization(
        ruleName as string,
      );
      res.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error("Failed to trigger optimization:", error);
      res.status(500).json({
        success: false,
        error: "Failed to trigger optimization",
      });
    }
  }

  // Get optimization history
  static async getOptimizationHistory(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const history = cacheOptimizationService.getOptimizationHistory();
      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      logger.error("Failed to get optimization history:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get optimization history",
      });
    }
  }

  // Get optimization statistics
  static async getOptimizationStats(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const stats = cacheOptimizationService.getOptimizationStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error("Failed to get optimization statistics:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get optimization statistics",
      });
    }
  }

  // Get fallback strategies
  static async getFallbackStrategies(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const strategies = cacheFallbackService.getStrategies();
      res.json({
        success: true,
        data: strategies,
      });
    } catch (error) {
      logger.error("Failed to get fallback strategies:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get fallback strategies",
      });
    }
  }

  // Get circuit breaker states
  static async getCircuitBreakerStates(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      const states = cacheFallbackService.getCircuitBreakerStates();
      res.json({
        success: true,
        data: Object.fromEntries(states),
      });
    } catch (error) {
      logger.error("Failed to get circuit breaker states:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get circuit breaker states",
      });
    }
  }

  // Reset circuit breakers
  static async resetCircuitBreakers(
    req: Request,
    res: Response,
  ): Promise<void> {
    try {
      cacheFallbackService.resetAllCircuitBreakers();
      res.json({
        success: true,
        message: "Circuit breakers reset successfully",
      });
    } catch (error) {
      logger.error("Failed to reset circuit breakers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to reset circuit breakers",
      });
    }
  }
}
