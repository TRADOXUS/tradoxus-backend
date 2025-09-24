import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";
import { Logger } from "../utils/Logger";

dotenv.config();

const logger = new Logger();

// Cache configuration constants
export const CACHE_CONFIG = {
  TTL: {
    USER_SESSION: 24 * 60 * 60, // 24 hours
    TRADING_DATA: 5 * 60, // 5 minutes
    COURSE_CONTENT: 60 * 60, // 1 hour
    STATIC_DATA: 24 * 60 * 60, // 24 hours
    MARKET_DATA: 60, // 1 minute
    USER_PROFILE: 30 * 60, // 30 minutes
    ANALYTICS: 10 * 60, // 10 minutes
    PERMISSIONS: 60 * 60, // 1 hour
  },
  KEY_PREFIXES: {
    USER: "user",
    SESSION: "session",
    TRADING: "trading",
    COURSE: "course",
    MODULE: "module",
    LESSON: "lesson",
    MARKET: "market",
    ANALYTICS: "analytics",
    PERMISSIONS: "permissions",
    CACHE: "cache",
  },
  MAX_RETRIES: 5,
  RETRY_DELAY: 2000,
  CONNECTION_TIMEOUT: 10000,
  MAX_RECONNECT_ATTEMPTS: 10,
};

// Cache metrics interface
export interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
  hitRatio: number;
}

// Enhanced Redis client with connection pooling and monitoring
class RedisCacheManager {
  private client: RedisClientType;
  private metrics: CacheMetrics;
  private isConnected: boolean = false;

  constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0,
      hitRatio: 0,
    };

    this.client = this.createClient();
    this.setupEventHandlers();
  }

  private createClient(): RedisClientType {
    const host = process.env.REDIS_HOST || "localhost";
    const port = process.env.REDIS_PORT || "6381";
    const password = process.env.REDIS_PASSWORD;
    const db = process.env.REDIS_DB || "0";

    logger.info(`Creating Redis client for ${host}:${port}`);

    const clientConfig: any = {
      url: `redis://${host}:${port}`,
      database: parseInt(db),
      socket: {
        connectTimeout: CACHE_CONFIG.CONNECTION_TIMEOUT,
        reconnectStrategy: (retries: number) => {
          logger.info(`Redis reconnection attempt ${retries}`);
          if (retries > CACHE_CONFIG.MAX_RECONNECT_ATTEMPTS) {
            return new Error("Max reconnection attempts reached");
          }
          return Math.min(retries * 100, 3000);
        },
      },
    };

    if (password) {
      clientConfig.password = password;
    }

    return createClient(clientConfig);
  }

  private setupEventHandlers(): void {
    this.client.on("error", (err) => {
      logger.error("Redis client error:", err);
      this.isConnected = false;
      this.metrics.errors++;
      if (err instanceof Error) {
        logger.error("Error details:", {
          name: err.name,
          message: err.message,
          stack: err.stack,
        });
      }
    });

    this.client.on("connect", () => {
      logger.info("Redis client connected");
      this.isConnected = true;
    });

    this.client.on("reconnecting", () => {
      logger.info("Redis client reconnecting");
      this.isConnected = false;
    });

    this.client.on("ready", () => {
      logger.info("Redis client ready");
      this.isConnected = true;
    });

    this.client.on("end", () => {
      logger.info("Redis client connection ended");
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    let retries = 0;

    while (retries < CACHE_CONFIG.MAX_RETRIES) {
      try {
        logger.info(
          `Attempting to connect to Redis (attempt ${retries + 1}/${CACHE_CONFIG.MAX_RETRIES}) at ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        );

        if (!this.client.isOpen) {
          await this.client.connect();
          logger.info("Connected to Redis successfully");
          this.isConnected = true;
          return;
        }
      } catch (error) {
        logger.error(`Connection attempt ${retries + 1} failed:`, error);
        if (error instanceof Error) {
          logger.error("Connection error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }

        retries++;
        if (retries < CACHE_CONFIG.MAX_RETRIES) {
          logger.info(
            `Waiting ${CACHE_CONFIG.RETRY_DELAY}ms before next attempt...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, CACHE_CONFIG.RETRY_DELAY),
          );
        } else {
          logger.error("Max connection attempts reached");
          throw error;
        }
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  // Cache operations with metrics tracking
  async get(key: string): Promise<string | null> {
    try {
      this.metrics.totalRequests++;
      const result = await this.client.get(key);

      if (result) {
        this.metrics.hits++;
      } else {
        this.metrics.misses++;
      }

      this.updateHitRatio();
      return result;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.metrics.errors++;
      logger.error(`Cache keys error for pattern ${pattern}:`, error);
      return [];
    }
  }

  async flushAll(): Promise<boolean> {
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      this.metrics.errors++;
      logger.error("Cache flush all error:", error);
      return false;
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: string;
    metrics: CacheMetrics;
    isConnected: boolean;
  }> {
    try {
      await this.client.ping();
      return {
        status: "healthy",
        metrics: { ...this.metrics },
        isConnected: this.isConnected,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        metrics: { ...this.metrics },
        isConnected: false,
      };
    }
  }

  private updateHitRatio(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRatio = this.metrics.hits / this.metrics.totalRequests;
    }
  }

  // Get metrics
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0,
      hitRatio: 0,
    };
  }

  // Get client for advanced operations
  getClient(): RedisClientType {
    return this.client;
  }

  // Check if connected
  isHealthy(): boolean {
    return this.isConnected && this.client.isOpen;
  }
}

// Create singleton instance
const redisCacheManager = new RedisCacheManager();

// Legacy exports for backward compatibility
export const redisClient = redisCacheManager.getClient();
export const connectToRedis = () => redisCacheManager.connect();

// Export the enhanced cache manager
export { redisCacheManager };
export default redisCacheManager;
