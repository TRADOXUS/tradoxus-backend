import { AuthCacheService } from "./AuthCacheService";
import { TradingCacheService } from "./TradingCacheService";
import { CourseCacheService } from "./CourseCacheService";
import { DatabaseCacheService } from "./DatabaseCacheService";
import { User } from "../entities/User";
import { Course } from "../entities/Course";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface WarmingStrategy {
  name: string;
  priority: number;
  interval: number; // in milliseconds
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface WarmingResult {
  strategy: string;
  success: boolean;
  itemsWarmed: number;
  duration: number;
  error?: string;
}

export class CacheWarmingService {
  private strategies: Map<string, WarmingStrategy> = new Map();
  private warmingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private checkInterval: number = 60 * 1000; // 1 minute

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    const strategies: WarmingStrategy[] = [
      {
        name: "popular-courses",
        priority: 1,
        interval: 30 * 60 * 1000, // 30 minutes
        enabled: true,
      },
      {
        name: "active-users",
        priority: 2,
        interval: 15 * 60 * 1000, // 15 minutes
        enabled: true,
      },
      {
        name: "trading-data",
        priority: 3,
        interval: 5 * 60 * 1000, // 5 minutes
        enabled: true,
      },
      {
        name: "market-data",
        priority: 4,
        interval: 2 * 60 * 1000, // 2 minutes
        enabled: true,
      },
      {
        name: "statistics",
        priority: 5,
        interval: 60 * 60 * 1000, // 1 hour
        enabled: true,
      },
      {
        name: "user-sessions",
        priority: 6,
        interval: 10 * 60 * 1000, // 10 minutes
        enabled: true,
      },
    ];

    strategies.forEach((strategy) => {
      this.strategies.set(strategy.name, strategy);
    });
  }

  // Start cache warming service
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.info("Cache warming service is already running");
      return;
    }

    this.isRunning = true;
    logger.info("Starting cache warming service...");

    // Initial warm-up
    await this.performInitialWarmup();

    // Schedule periodic warming
    this.schedulePeriodicWarming();

    logger.info("Cache warming service started successfully");
  }

  // Stop cache warming service
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.info("Cache warming service is not running");
      return;
    }

    this.isRunning = false;

    if (this.warmingInterval) {
      clearInterval(this.warmingInterval);
      this.warmingInterval = null;
    }

    logger.info("Cache warming service stopped");
  }

  // Perform initial warmup
  private async performInitialWarmup(): Promise<void> {
    logger.info("Performing initial cache warmup...");

    const results: WarmingResult[] = [];

    // Warm up critical data first
    try {
      results.push(await this.warmPopularCourses());
      results.push(await this.warmActiveUsers());
      results.push(await this.warmTradingData());
      results.push(await this.warmMarketData());
      results.push(await this.warmStatistics());
    } catch (error) {
      logger.error("Error during initial warmup:", error);
    }

    this.logWarmingResults(results);
  }

  // Schedule periodic warming
  private schedulePeriodicWarming(): void {
    this.warmingInterval = setInterval(async () => {
      if (!this.isRunning) return;

      const now = new Date();
      const strategiesToRun = Array.from(this.strategies.values())
        .filter(
          (strategy) =>
            strategy.enabled && (!strategy.nextRun || strategy.nextRun <= now),
        )
        .sort((a, b) => a.priority - b.priority);

      for (const strategy of strategiesToRun) {
        try {
          await this.runWarmingStrategy(strategy);
        } catch (error) {
          logger.error(
            `Error running warming strategy ${strategy.name}:`,
            error,
          );
        }
      }
    }, this.checkInterval);
  }

  // Run a specific warming strategy
  private async runWarmingStrategy(
    strategy: WarmingStrategy,
  ): Promise<WarmingResult> {
    const startTime = Date.now();
    let result: WarmingResult;

    try {
      switch (strategy.name) {
        case "popular-courses":
          result = await this.warmPopularCourses();
          break;
        case "active-users":
          result = await this.warmActiveUsers();
          break;
        case "trading-data":
          result = await this.warmTradingData();
          break;
        case "market-data":
          result = await this.warmMarketData();
          break;
        case "statistics":
          result = await this.warmStatistics();
          break;
        case "user-sessions":
          result = await this.warmUserSessions();
          break;
        default:
          throw new Error(`Unknown warming strategy: ${strategy.name}`);
      }

      // Update strategy timing
      strategy.lastRun = new Date();
      strategy.nextRun = new Date(Date.now() + strategy.interval);

      logger.info(`Warming strategy ${strategy.name} completed:`, result);
      return result;
    } catch (error) {
      const errorResult: WarmingResult = {
        strategy: strategy.name,
        success: false,
        itemsWarmed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };

      logger.error(`Warming strategy ${strategy.name} failed:`, errorResult);
      return errorResult;
    }
  }

  // Warm popular courses
  private async warmPopularCourses(): Promise<WarmingResult> {
    const startTime = Date.now();
    let itemsWarmed = 0;

    try {
      // For now, we'll simulate with mock data
      // TODO: Fetch from database
      const popularCourses: Partial<Course>[] = [
        {
          id: "1",
          title: "Introduction to Crypto Trading",
          description: "This is a description of the course",
          isPublished: true,
        },
        {
          id: "2",
          title: "Advanced Trading Strategies",
          description: "This is a description of the course",
          isPublished: true,
        },
        {
          id: "3",
          title: "Risk Management Fundamentals",
          description: "This is a description of the course",
          isPublished: true,
        },
      ];

      await CourseCacheService.cachePopularCourses(popularCourses);
      itemsWarmed = popularCourses.length;

      return {
        strategy: "popular-courses",
        success: true,
        itemsWarmed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        strategy: "popular-courses",
        success: false,
        itemsWarmed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Warm active users
  private async warmActiveUsers(): Promise<WarmingResult> {
    const startTime = Date.now();
    let itemsWarmed = 0;

    try {
      // For now, we'll simulate with mock data
      // TODO: Fetch from database
      const activeUsers: Partial<User>[] = [
        { id: "1", email: "user1@example.com", isAdmin: false, isActive: true },
        { id: "2", email: "user2@example.com", isAdmin: false, isActive: true },
        { id: "3", email: "admin@example.com", isAdmin: true, isActive: true },
      ];

      for (const user of activeUsers) {
        await AuthCacheService.warmUserCache(
          user.id!.toString(),
          user as User,
          [],
        );
        itemsWarmed++;
      }

      return {
        strategy: "active-users",
        success: true,
        itemsWarmed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        strategy: "active-users",
        success: false,
        itemsWarmed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Warm trading data
  private async warmTradingData(): Promise<WarmingResult> {
    const startTime = Date.now();
    let itemsWarmed = 0;

    try {
      // For now, we'll simulate with mock data
      // TODO: Fetch from external APIs
      const symbols = ["BTC", "ETH", "ADA", "DOT", "LINK"];
      const tradingData = new Map();

      for (const symbol of symbols) {
        const data = {
          symbol,
          price: Math.random() * 100000,
          volume: Math.random() * 1000000,
          change24h: (Math.random() - 0.5) * 1000,
          changePercent24h: (Math.random() - 0.5) * 10,
          high24h: Math.random() * 100000,
          low24h: Math.random() * 100000,
          lastUpdated: new Date().toISOString(),
        };

        tradingData.set(symbol, data);
        itemsWarmed++;
      }

      await TradingCacheService.warmPopularSymbolsCache(tradingData);

      return {
        strategy: "trading-data",
        success: true,
        itemsWarmed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        strategy: "trading-data",
        success: false,
        itemsWarmed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Warm market data
  private async warmMarketData(): Promise<WarmingResult> {
    const startTime = Date.now();
    let itemsWarmed = 0;

    try {
      // For now, we'll simulate with mock data
      // TODO: Fetch from market data providers
      const symbols = ["BTC", "ETH", "ADA"];

      for (const symbol of symbols) {
        const marketData = {
          symbol,
          price: Math.random() * 100000,
          volume: Math.random() * 1000000,
          timestamp: new Date().toISOString(),
          source: "market-api",
        };

        await TradingCacheService.cacheMarketData(symbol, marketData);
        itemsWarmed++;
      }

      return {
        strategy: "market-data",
        success: true,
        itemsWarmed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        strategy: "market-data",
        success: false,
        itemsWarmed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Warm statistics
  private async warmStatistics(): Promise<WarmingResult> {
    const startTime = Date.now();
    let itemsWarmed = 0;

    try {
      // For now, we'll simulate with mock data
      // TODO: Fetch from database
      const statistics = {
        totalUsers: 1250,
        totalCourses: 25,
        totalLessons: 150,
        activeUsers: 850,
        completedCourses: 320,
        averageRating: 4.7,
      };

      await DatabaseCacheService.cacheStatistics(
        "platform-overview",
        statistics,
      );
      itemsWarmed++;

      return {
        strategy: "statistics",
        success: true,
        itemsWarmed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        strategy: "statistics",
        success: false,
        itemsWarmed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Warm user sessions
  private async warmUserSessions(): Promise<WarmingResult> {
    const startTime = Date.now();
    let itemsWarmed = 0;

    try {
      // This would typically fetch active sessions from database
      // For now, we'll simulate with mock data
      const activeSessions = [
        { userId: "1", sessionId: "session-1" },
        { userId: "2", sessionId: "session-2" },
        { userId: "3", sessionId: "session-3" },
      ];

      for (const session of activeSessions) {
        const sessionData = {
          userId: session.userId,
          email: `user${session.userId}@example.com`,
          role: "user",
          permissions: ["read", "write"],
          lastActivity: new Date().toISOString(),
          sessionId: session.sessionId,
        };

        await AuthCacheService.cacheUserSession(
          session.sessionId,
          sessionData as any,
          [],
        );
        itemsWarmed++;
      }

      return {
        strategy: "user-sessions",
        success: true,
        itemsWarmed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        strategy: "user-sessions",
        success: false,
        itemsWarmed: 0,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Log warming results
  private logWarmingResults(results: WarmingResult[]): void {
    logger.info("Cache warming results:");
    results.forEach((result) => {
      const status = result.success ? "✅" : "❌";
      logger.info(
        `${status} ${result.strategy}: ${result.itemsWarmed} items warmed in ${result.duration}ms`,
      );
      if (result.error) {
        logger.error(`   Error: ${result.error}`);
      }
    });
  }

  // Get warming service status
  getStatus(): {
    isRunning: boolean;
    strategies: WarmingStrategy[];
    nextRun?: Date;
  } {
    const strategies = Array.from(this.strategies.values());
    const nextRun = strategies
      .filter((s) => s.enabled && s.nextRun)
      .sort(
        (a, b) => (a.nextRun?.getTime() || 0) - (b.nextRun?.getTime() || 0),
      )[0]?.nextRun;

    return {
      isRunning: this.isRunning,
      strategies,
      nextRun,
    };
  }

  // Enable/disable a warming strategy
  setStrategyEnabled(strategyName: string, enabled: boolean): boolean {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.enabled = enabled;
      return true;
    }
    return false;
  }

  // Update strategy interval
  setStrategyInterval(strategyName: string, interval: number): boolean {
    const strategy = this.strategies.get(strategyName);
    if (strategy) {
      strategy.interval = interval;
      return true;
    }
    return false;
  }

  // Manually trigger a warming strategy
  async triggerStrategy(strategyName: string): Promise<WarmingResult | null> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      return null;
    }

    return await this.runWarmingStrategy(strategy);
  }

  // Get warming statistics
  async getWarmingStats(): Promise<{
    totalStrategies: number;
    enabledStrategies: number;
    lastRuns: Array<{ strategy: string; lastRun: Date; nextRun?: Date }>;
  }> {
    const strategies = Array.from(this.strategies.values());
    const enabledStrategies = strategies.filter((s) => s.enabled).length;

    const lastRuns = strategies
      .filter((s) => s.lastRun)
      .map((s) => ({
        strategy: s.name,
        lastRun: s.lastRun!,
        nextRun: s.nextRun,
      }));

    return {
      totalStrategies: strategies.length,
      enabledStrategies,
      lastRuns,
    };
  }
}

// Export singleton instance
export const cacheWarmingService = new CacheWarmingService();
