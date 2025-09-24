import { redisCacheManager } from "../config/redis";
import { CacheMetrics } from "../config/redis";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface FallbackStrategy {
  name: string;
  enabled: boolean;
  threshold: number; // Error rate threshold to trigger fallback
  timeout: number; // Timeout in milliseconds
  retryAttempts: number;
  retryDelay: number; // Delay between retries in milliseconds
}

export interface FallbackResult<T> {
  success: boolean;
  data?: T;
  fromCache: boolean;
  error?: string;
  fallbackUsed: boolean;
  responseTime: number;
}

export class CacheFallbackService {
  private strategies: Map<string, FallbackStrategy> = new Map();
  private circuitBreakerState: Map<
    string,
    {
      failures: number;
      lastFailure: Date;
      isOpen: boolean;
    }
  > = new Map();

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    const strategies: FallbackStrategy[] = [
      {
        name: "database-fallback",
        enabled: true,
        threshold: 0.1, // 10% error rate
        timeout: 5000, // 5 seconds
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
      },
      {
        name: "memory-fallback",
        enabled: true,
        threshold: 0.05, // 5% error rate
        timeout: 2000, // 2 seconds
        retryAttempts: 2,
        retryDelay: 500, // 500ms
      },
      {
        name: "api-fallback",
        enabled: true,
        threshold: 0.15, // 15% error rate
        timeout: 10000, // 10 seconds
        retryAttempts: 2,
        retryDelay: 2000, // 2 seconds
      },
    ];

    strategies.forEach((strategy) => {
      this.strategies.set(strategy.name, strategy);
    });
  }

  // Execute operation with fallback
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    strategyName: string = "database-fallback",
    cacheKey?: string,
  ): Promise<FallbackResult<T>> {
    const startTime = Date.now();
    const strategy = this.strategies.get(strategyName);

    if (!strategy || !strategy.enabled) {
      return await this.executeDirect(operation, fallbackOperation, startTime);
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(strategyName)) {
      logger.info(
        `Circuit breaker is open for ${strategyName}, using fallback`,
      );
      return await this.executeFallback(fallbackOperation, startTime);
    }

    try {
      // Try cache operation with timeout
      const result = await this.executeWithTimeout(operation, strategy.timeout);

      // Reset circuit breaker on success
      this.resetCircuitBreaker(strategyName);

      return {
        success: true,
        data: result,
        fromCache: true,
        fallbackUsed: false,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.warn(`Cache operation failed for ${strategyName}:`, error);

      // Record failure
      this.recordFailure(strategyName);

      // Try fallback operation
      try {
        const fallbackResult = await this.executeWithTimeout(
          fallbackOperation,
          strategy.timeout,
        );

        return {
          success: true,
          data: fallbackResult,
          fromCache: false,
          fallbackUsed: true,
          responseTime: Date.now() - startTime,
        };
      } catch (fallbackError) {
        logger.error(
          `Fallback operation also failed for ${strategyName}:`,
          fallbackError,
        );

        return {
          success: false,
          fromCache: false,
          fallbackUsed: true,
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error",
          responseTime: Date.now() - startTime,
        };
      }
    }
  }

  // Execute cache operation with retry logic
  async executeCacheOperation<T>(
    operation: () => Promise<T>,
    strategyName: string = "database-fallback",
  ): Promise<T> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= strategy.retryAttempts; attempt++) {
      try {
        return await this.executeWithTimeout(operation, strategy.timeout);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < strategy.retryAttempts) {
          logger.info(
            `Retry attempt ${attempt} for ${strategyName}, waiting ${strategy.retryDelay}ms`,
          );
          await this.delay(strategy.retryDelay);
        }
      }
    }

    throw lastError || new Error("All retry attempts failed");
  }

  // Execute operation with timeout
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeout: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      operation()
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // Execute operation directly without fallback
  private async executeDirect<T>(
    operation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    startTime: number,
  ): Promise<FallbackResult<T>> {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        fromCache: true,
        fallbackUsed: false,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      try {
        const fallbackResult = await fallbackOperation();
        return {
          success: true,
          data: fallbackResult,
          fromCache: false,
          fallbackUsed: true,
          responseTime: Date.now() - startTime,
        };
      } catch (fallbackError) {
        return {
          success: false,
          fromCache: false,
          fallbackUsed: true,
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error",
          responseTime: Date.now() - startTime,
        };
      }
    }
  }

  // Execute fallback operation
  private async executeFallback<T>(
    fallbackOperation: () => Promise<T>,
    startTime: number,
  ): Promise<FallbackResult<T>> {
    try {
      const result = await fallbackOperation();
      return {
        success: true,
        data: result,
        fromCache: false,
        fallbackUsed: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        fromCache: false,
        fallbackUsed: true,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime: Date.now() - startTime,
      };
    }
  }

  // Circuit breaker logic
  private isCircuitBreakerOpen(strategyName: string): boolean {
    const state = this.circuitBreakerState.get(strategyName);
    if (!state) return false;

    const strategy = this.strategies.get(strategyName);
    if (!strategy) return false;

    // Check if circuit breaker should be reset
    const timeSinceLastFailure = Date.now() - state.lastFailure.getTime();
    const resetTimeout = strategy.timeout * 10; // 10x the operation timeout

    if (timeSinceLastFailure > resetTimeout) {
      this.resetCircuitBreaker(strategyName);
      return false;
    }

    return state.isOpen;
  }

  private recordFailure(strategyName: string): void {
    const state = this.circuitBreakerState.get(strategyName) || {
      failures: 0,
      lastFailure: new Date(),
      isOpen: false,
    };

    state.failures++;
    state.lastFailure = new Date();

    const strategy = this.strategies.get(strategyName);
    if (strategy && state.failures >= 5) {
      // Open circuit after 5 failures
      state.isOpen = true;
      logger.info(
        `Circuit breaker opened for ${strategyName} after ${state.failures} failures`,
      );
    }

    this.circuitBreakerState.set(strategyName, state);
  }

  private resetCircuitBreaker(strategyName: string): void {
    const state = this.circuitBreakerState.get(strategyName);
    if (state) {
      state.failures = 0;
      state.isOpen = false;
      this.circuitBreakerState.set(strategyName, state);
    }
  }

  // Delay utility
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Check if cache is healthy
  async isCacheHealthy(): Promise<boolean> {
    try {
      const health = await redisCacheManager.healthCheck();
      return health.status === "healthy" && health.isConnected;
    } catch (error) {
      logger.error("Failed to check cache health:", error);
      return false;
    }
  }

  // Get cache metrics for fallback decisions
  getCacheMetrics(): CacheMetrics {
    return redisCacheManager.getMetrics();
  }

  // Should use fallback based on metrics
  shouldUseFallback(strategyName: string): boolean {
    const strategy = this.strategies.get(strategyName);
    if (!strategy || !strategy.enabled) return false;

    const metrics = this.getCacheMetrics();
    const errorRate =
      metrics.totalRequests > 0 ? metrics.errors / metrics.totalRequests : 0;

    return (
      errorRate > strategy.threshold || this.isCircuitBreakerOpen(strategyName)
    );
  }

  // Update strategy configuration
  updateStrategy(
    strategyName: string,
    updates: Partial<FallbackStrategy>,
  ): boolean {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return false;

    Object.assign(strategy, updates);
    this.strategies.set(strategyName, strategy);
    return true;
  }

  // Get all strategies
  getStrategies(): FallbackStrategy[] {
    return Array.from(this.strategies.values());
  }

  // Get circuit breaker states
  getCircuitBreakerStates(): Map<
    string,
    {
      failures: number;
      lastFailure: Date;
      isOpen: boolean;
    }
  > {
    return new Map(this.circuitBreakerState);
  }

  // Reset all circuit breakers
  resetAllCircuitBreakers(): void {
    this.circuitBreakerState.clear();
    logger.info("All circuit breakers reset");
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    logger.info("Cache fallback service shutting down...");
    this.resetAllCircuitBreakers();
    logger.info("Cache fallback service shutdown complete");
  }
}

// Export singleton instance
export const cacheFallbackService = new CacheFallbackService();
