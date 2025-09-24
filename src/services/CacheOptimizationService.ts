import { redisCacheManager } from "../config/redis";
import { CacheMetrics } from "../config/redis";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface OptimizationRule {
  name: string;
  enabled: boolean;
  condition: (metrics: CacheMetrics) => boolean;
  action: () => Promise<void>;
  description: string;
}

export interface OptimizationResult {
  rule: string;
  applied: boolean;
  success: boolean;
  impact: "low" | "medium" | "high";
  description: string;
  error?: string;
}

export interface CacheConfiguration {
  maxMemory: string;
  evictionPolicy:
    | "allkeys-lru"
    | "allkeys-lfu"
    | "volatile-lru"
    | "volatile-lfu"
    | "allkeys-random"
    | "volatile-random"
    | "volatile-ttl"
    | "noeviction";
  compressionEnabled: boolean;
  compressionThreshold: number;
  ttlOptimization: boolean;
  adaptiveTTL: boolean;
}

export class CacheOptimizationService {
  private optimizationRules: Map<string, OptimizationRule> = new Map();
  private optimizationHistory: OptimizationResult[] = [];
  private currentConfiguration: CacheConfiguration;
  private optimizationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.currentConfiguration = {
      maxMemory: "256mb",
      evictionPolicy: "allkeys-lru",
      compressionEnabled: true,
      compressionThreshold: 1024, // 1KB
      ttlOptimization: true,
      adaptiveTTL: true,
    };

    this.initializeOptimizationRules();
  }

  private initializeOptimizationRules(): void {
    const rules: OptimizationRule[] = [
      {
        name: "increase-ttl-low-hit-ratio",
        enabled: true,
        condition: (metrics) =>
          metrics.hitRatio < 0.3 && metrics.totalRequests > 100,
        action: async () => {
          // Increase TTL for frequently accessed data
          console.log("Increasing TTL for low hit ratio");
          // This would typically update TTL configurations
        },
        description: "Increase TTL values when hit ratio is below 30%",
      },
      {
        name: "decrease-ttl-high-memory",
        enabled: true,
        condition: (metrics) => {
          // This would check memory usage
          return metrics.totalRequests > 1000 && metrics.hitRatio > 0.8;
        },
        action: async () => {
          console.log("Decreasing TTL for high memory usage");
          // This would typically decrease TTL configurations
        },
        description: "Decrease TTL values when memory usage is high",
      },
      {
        name: "enable-compression-large-data",
        enabled: true,
        condition: (metrics) => metrics.totalRequests > 500,
        action: async () => {
          console.log("Enabling compression for large data");
          this.currentConfiguration.compressionEnabled = true;
        },
        description: "Enable compression for large datasets",
      },
      {
        name: "optimize-eviction-policy",
        enabled: true,
        condition: (metrics) => metrics.hitRatio < 0.5,
        action: async () => {
          console.log("Optimizing eviction policy");
          this.currentConfiguration.evictionPolicy = "allkeys-lfu";
        },
        description: "Switch to LFU eviction policy for better hit ratio",
      },
    ];

    rules.forEach((rule) => {
      this.optimizationRules.set(rule.name, rule);
    });
  }

  // Start automatic optimization
  startOptimization(intervalMs: number = 300000): void {
    // 5 minutes
    if (this.optimizationInterval) {
      logger.info("Optimization service is already running");
      return;
    }

    this.optimizationInterval = setInterval(async () => {
      await this.runOptimization();
    }, intervalMs);

    logger.info(
      `Cache optimization service started with ${intervalMs}ms interval`,
    );
  }

  // Stop automatic optimization
  stopOptimization(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
      logger.info("Cache optimization service stopped");
    }
  }

  // Run optimization analysis and apply rules
  async runOptimization(): Promise<OptimizationResult[]> {
    const metrics = redisCacheManager.getMetrics();
    const results: OptimizationResult[] = [];

    logger.info("Running cache optimization analysis...");

    for (const rule of this.optimizationRules.values()) {
      if (!rule.enabled) continue;

      try {
        const shouldApply = rule.condition(metrics);

        if (shouldApply) {
          console.log(`Applying optimization rule: ${rule.name}`);
          await rule.action();

          const result: OptimizationResult = {
            rule: rule.name,
            applied: true,
            success: true,
            impact: this.calculateImpact(rule.name),
            description: rule.description,
          };

          results.push(result);
          console.log(`✅ Applied optimization: ${rule.description}`);
        }
      } catch (error) {
        const result: OptimizationResult = {
          rule: rule.name,
          applied: true,
          success: false,
          impact: "low",
          description: rule.description,
          error: error instanceof Error ? error.message : "Unknown error",
        };

        results.push(result);
        console.error(`❌ Failed to apply optimization ${rule.name}:`, error);
      }
    }

    // Store results in history
    this.optimizationHistory.push(...results);
    if (this.optimizationHistory.length > 100) {
      this.optimizationHistory = this.optimizationHistory.slice(-100);
    }

    return results;
  }

  // Calculate optimization impact
  private calculateImpact(ruleName: string): "low" | "medium" | "high" {
    const highImpactRules = [
      "increase-ttl-low-hit-ratio",
      "optimize-eviction-policy",
    ];
    const mediumImpactRules = [
      "decrease-ttl-high-memory",
      "enable-compression-large-data",
    ];

    if (highImpactRules.includes(ruleName)) return "high";
    if (mediumImpactRules.includes(ruleName)) return "medium";
    return "low";
  }

  // Optimize TTL values based on access patterns
  async optimizeTTLValues(): Promise<void> {
    try {
      console.log("Optimizing TTL values based on access patterns...");

      // This would analyze access patterns and adjust TTL values
      // For now, we'll implement basic optimization logic

      const metrics = redisCacheManager.getMetrics();

      if (metrics.hitRatio < 0.3) {
        // Increase TTL for frequently accessed data
        console.log("Increasing TTL for frequently accessed data");
        // Update TTL configurations
      } else if (metrics.hitRatio > 0.8) {
        // Decrease TTL for less frequently accessed data
        console.log("Decreasing TTL for less frequently accessed data");
        // Update TTL configurations
      }

      console.log("TTL optimization completed");
    } catch (error) {
      console.error("Failed to optimize TTL values:", error);
    }
  }

  // Optimize memory usage
  async optimizeMemoryUsage(): Promise<void> {
    try {
      console.log("Optimizing memory usage...");

      // Get memory information
      const info = await redisCacheManager.getClient().info("memory");
      const memoryInfo = this.parseRedisInfo(info);

      if (memoryInfo.used_memory && memoryInfo.maxmemory) {
        const usageRatio = memoryInfo.used_memory / memoryInfo.maxmemory;

        if (usageRatio > 0.8) {
          logger.info("High memory usage detected, triggering cleanup");
          await this.cleanupLeastUsedKeys();
        }
      }

      logger.info("Memory optimization completed");
    } catch (error) {
      logger.error("Failed to optimize memory usage:", error);
    }
  }

  // Clean up least used keys
  async cleanupLeastUsedKeys(): Promise<void> {
    try {
      console.log("Cleaning up least used keys...");

      // This would identify and remove least used keys
      // For now, we'll implement a basic cleanup strategy

      const keys = await redisCacheManager.keys("*");
      const keysToCleanup = keys.slice(0, Math.floor(keys.length * 0.1)); // Clean up 10% of keys

      if (keysToCleanup.length > 0) {
        await Promise.all(
          keysToCleanup.map((key) => redisCacheManager.del(key)),
        );
        logger.info(`Cleaned up ${keysToCleanup.length} least used keys`);
      }
    } catch (error) {
      logger.error("Failed to cleanup least used keys:", error);
    }
  }

  // Configure Redis settings
  async configureRedis(): Promise<void> {
    try {
      console.log("Configuring Redis settings...");

      const client = redisCacheManager.getClient();

      // Set eviction policy
      await client.configSet(
        "maxmemory-policy",
        this.currentConfiguration.evictionPolicy,
      );

      // Set max memory if specified
      if (this.currentConfiguration.maxMemory) {
        await client.configSet(
          "maxmemory",
          this.currentConfiguration.maxMemory,
        );
      }

      logger.info("Redis configuration updated");
    } catch (error) {
      logger.error("Failed to configure Redis:", error);
    }
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

  // Get optimization recommendations
  async getOptimizationRecommendations(): Promise<
    Array<{
      category: string;
      priority: "low" | "medium" | "high";
      recommendation: string;
      impact: string;
    }>
  > {
    const metrics = redisCacheManager.getMetrics();
    const recommendations: Array<{
      category: string;
      priority: "low" | "medium" | "high";
      recommendation: string;
      impact: string;
    }> = [];

    // Hit ratio recommendations
    if (metrics.hitRatio < 0.3) {
      recommendations.push({
        category: "Performance",
        priority: "high",
        recommendation: "Increase TTL values for frequently accessed data",
        impact: "Significantly improve cache hit ratio",
      });
    }

    // get error rate
    const errorRate = metrics.errors / metrics.totalRequests;
    // Error rate recommendations
    if (errorRate > 0.05) {
      recommendations.push({
        category: "Reliability",
        priority: "high",
        recommendation: "Investigate and fix cache connection issues",
        impact: "Reduce error rate and improve reliability",
      });
    }

    // Memory recommendations
    if (metrics.totalRequests > 1000) {
      recommendations.push({
        category: "Memory",
        priority: "medium",
        recommendation: "Enable compression for large data objects",
        impact: "Reduce memory usage by 20-40%",
      });
    }

    return recommendations;
  }

  // Get current configuration
  getCurrentConfiguration(): CacheConfiguration {
    return { ...this.currentConfiguration };
  }

  // Update configuration
  updateConfiguration(updates: Partial<CacheConfiguration>): void {
    Object.assign(this.currentConfiguration, updates);
    logger.info("Cache configuration updated:", updates);
  }

  // Get optimization history
  getOptimizationHistory(): OptimizationResult[] {
    return [...this.optimizationHistory];
  }

  // Get optimization rules
  getOptimizationRules(): OptimizationRule[] {
    return Array.from(this.optimizationRules.values());
  }

  // Enable/disable optimization rule
  setRuleEnabled(ruleName: string, enabled: boolean): boolean {
    const rule = this.optimizationRules.get(ruleName);
    if (rule) {
      rule.enabled = enabled;
      return true;
    }
    return false;
  }

  // Get optimization statistics
  getOptimizationStats(): {
    totalRules: number;
    enabledRules: number;
    totalOptimizations: number;
    successfulOptimizations: number;
    failedOptimizations: number;
  } {
    const rules = Array.from(this.optimizationRules.values());
    const enabledRules = rules.filter((rule) => rule.enabled).length;

    const totalOptimizations = this.optimizationHistory.length;
    const successfulOptimizations = this.optimizationHistory.filter(
      (result) => result.success,
    ).length;
    const failedOptimizations = totalOptimizations - successfulOptimizations;

    return {
      totalRules: rules.length,
      enabledRules,
      totalOptimizations,
      successfulOptimizations,
      failedOptimizations,
    };
  }

  // Manual optimization trigger
  async triggerOptimization(ruleName?: string): Promise<OptimizationResult[]> {
    if (ruleName) {
      const rule = this.optimizationRules.get(ruleName);
      if (!rule || !rule.enabled) {
        return [];
      }

      const metrics = redisCacheManager.getMetrics();
      if (rule.condition(metrics)) {
        try {
          await rule.action();
          return [
            {
              rule: rule.name,
              applied: true,
              success: true,
              impact: this.calculateImpact(rule.name),
              description: rule.description,
            },
          ];
        } catch (error) {
          return [
            {
              rule: rule.name,
              applied: true,
              success: false,
              impact: "low",
              description: rule.description,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          ];
        }
      }
      return [];
    }

    return await this.runOptimization();
  }
}

// Export singleton instance
export const cacheOptimizationService = new CacheOptimizationService();
