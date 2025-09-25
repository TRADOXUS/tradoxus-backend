import { Request, Response, NextFunction } from "express";
import { redisCacheManager, CACHE_CONFIG } from "../config/redis";
import crypto from "crypto";
import { Logger } from "../utils/Logger";

const logger = new Logger();

// Enhanced cache middleware with comprehensive features
interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
  cacheCondition?: (req: Request, res: Response) => boolean;
  tags?: string[];
  compress?: boolean;
}

interface CacheableResponse {
  [key: string]: unknown;
  data?: unknown;
  error?: string;
  message?: string;
  statusCode?: number;
}

// Default key generator
const defaultKeyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id || "anonymous";
  const queryString = req.query ? JSON.stringify(req.query) : "";
  const bodyHash = req.body
    ? crypto.createHash("md5").update(JSON.stringify(req.body)).digest("hex")
    : "";

  return `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:${req.method}:${req.originalUrl}:${userId}:${queryString}:${bodyHash}`;
};

// Cache middleware factory
export const createCacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = CACHE_CONFIG.TTL.STATIC_DATA,
    keyGenerator = defaultKeyGenerator,
    skipCache = () => false,
    cacheCondition = () => true,
    tags = [],
    compress = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests or if skipCache returns true
    if (req.method !== "GET" || skipCache(req)) {
      return next();
    }

    const cacheKey = keyGenerator(req);

    try {
      // Check if cache is healthy
      if (!redisCacheManager.isHealthy()) {
        logger.warn("Cache is unhealthy, skipping cache lookup");
        return next();
      }

      // Try to get cached response
      const cachedResponse = await redisCacheManager.get(cacheKey);

      if (cachedResponse) {
        const parsedResponse = JSON.parse(cachedResponse);

        // Add cache headers
        res.set({
          "X-Cache": "HIT",
          "X-Cache-Key": cacheKey,
          "X-Cache-TTL": ttl.toString(),
        });

        return res.json(parsedResponse);
      }

      // Cache miss - modify res.json to cache the response
      const originalJson = res.json;
      res.json = function (body: CacheableResponse) {
        // Only cache successful responses
        if (
          cacheCondition(req, res) &&
          res.statusCode >= 200 &&
          res.statusCode < 300
        ) {
          const responseToCache = {
            ...body,
            cachedAt: new Date().toISOString(),
            cacheKey,
          };

          // Store in cache with TTL
          redisCacheManager
            .set(cacheKey, JSON.stringify(responseToCache), ttl)
            .catch((error) => {
              logger.error("Failed to cache response:", error);
            });

          // Add cache tags if provided
          if (tags.length > 0) {
            tags.forEach((tag) => {
              redisCacheManager
                .set(
                  `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:tag:${tag}:${cacheKey}`,
                  "1",
                  ttl,
                )
                .catch((error) => {
                  logger.error("Failed to cache tag:", error);
                });
            });
          }
        }

        // Add cache headers
        res.set({
          "X-Cache": "MISS",
          "X-Cache-Key": cacheKey,
          "X-Cache-TTL": ttl.toString(),
        });

        return originalJson.call(this, body);
      };

      return next();
    } catch (error) {
      logger.error("Cache middleware error:", error);
      return next();
    }
  };
};

// Predefined cache middlewares for different data types
export const userCacheMiddleware = createCacheMiddleware({
  ttl: CACHE_CONFIG.TTL.USER_PROFILE,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || "anonymous";
    return `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:profile:${req.originalUrl}`;
  },
  tags: ["user-profile"],
});

export const tradingCacheMiddleware = createCacheMiddleware({
  ttl: CACHE_CONFIG.TTL.TRADING_DATA,
  keyGenerator: (req: Request) => {
    const symbol = req.params.symbol || req.query.symbol || "default";
    return `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:${req.originalUrl}`;
  },
  tags: ["trading-data"],
});

export const courseCacheMiddleware = createCacheMiddleware({
  ttl: CACHE_CONFIG.TTL.COURSE_CONTENT,
  keyGenerator: (req: Request) => {
    const courseId = req.params.courseId || req.query.courseId || "all";
    return `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:${courseId}:${req.originalUrl}`;
  },
  tags: ["course-content"],
});

export const marketCacheMiddleware = createCacheMiddleware({
  ttl: CACHE_CONFIG.TTL.MARKET_DATA,
  keyGenerator: (req: Request) => {
    const symbol = req.params.symbol || req.query.symbol || "all";
    return `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:${symbol}:${req.originalUrl}`;
  },
  tags: ["market-data"],
});

export const analyticsCacheMiddleware = createCacheMiddleware({
  ttl: CACHE_CONFIG.TTL.ANALYTICS,
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.id || "anonymous";
    const period = req.query.period || "default";
    return `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:${userId}:${period}:${req.originalUrl}`;
  },
  tags: ["analytics"],
});

// Cache invalidation middleware
export const createCacheInvalidationMiddleware = (patterns: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only invalidate on write operations
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }

    try {
      // Invalidate specific patterns
      for (const pattern of patterns) {
        await invalidateCache(pattern);
      }

      // Invalidate user-specific cache if user is authenticated
      const userId = (req as any).user?.id;
      if (userId) {
        await invalidateCache(`${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:*`);
      }

      // Add invalidation headers
      res.set("X-Cache-Invalidated", patterns.join(","));

      return next();
    } catch (error) {
      logger.error("Cache invalidation error:", error);
      return next();
    }
  };
};

// Cache invalidation functions
export const invalidateCache = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisCacheManager.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redisCacheManager.del(key)));
      logger.info(
        `Invalidated ${keys.length} cache keys matching pattern: ${pattern}`,
      );
    }
  } catch (error) {
    logger.error(`Failed to invalidate cache for pattern ${pattern}:`, error);
  }
};

export const invalidateCacheByTags = async (tags: string[]): Promise<void> => {
  try {
    for (const tag of tags) {
      const tagKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:tag:${tag}:*`,
      );
      const cacheKeys = tagKeys.map((key) =>
        key.replace(`${CACHE_CONFIG.KEY_PREFIXES.CACHE}:tag:${tag}:`, ""),
      );

      if (cacheKeys.length > 0) {
        await Promise.all(cacheKeys.map((key) => redisCacheManager.del(key)));
        await Promise.all(tagKeys.map((key) => redisCacheManager.del(key)));
        logger.info(
          `Invalidated ${cacheKeys.length} cache keys for tag: ${tag}`,
        );
      }
    }
  } catch (error) {
    logger.error(
      `Failed to invalidate cache by tags ${tags.join(",")}:`,
      error,
    );
  }
};

export const invalidateUserCache = async (userId: string): Promise<void> => {
  await invalidateCache(`${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:*`);
};

export const invalidateTradingCache = async (
  symbol?: string,
): Promise<void> => {
  const pattern = symbol
    ? `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:*`
    : `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:*`;
  await invalidateCache(pattern);
};

export const invalidateCourseCache = async (
  courseId?: string,
): Promise<void> => {
  const pattern = courseId
    ? `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:${courseId}:*`
    : `${CACHE_CONFIG.KEY_PREFIXES.COURSE}:*`;
  await invalidateCache(pattern);
};

export const invalidateMarketCache = async (symbol?: string): Promise<void> => {
  const pattern = symbol
    ? `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:${symbol}:*`
    : `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:*`;
  await invalidateCache(pattern);
};

// Cache warming functions
export const warmCache = async (
  key: string,
  data: any,
  ttl: number,
): Promise<void> => {
  try {
    await redisCacheManager.set(key, JSON.stringify(data), ttl);
    logger.info(`Warmed cache for key: ${key}`);
  } catch (error) {
    logger.error(`Failed to warm cache for key ${key}:`, error);
  }
};

export const warmUserCache = async (
  userId: string,
  userData: any,
): Promise<void> => {
  const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:profile`;
  await warmCache(key, userData, CACHE_CONFIG.TTL.USER_PROFILE);
};

export const warmTradingCache = async (
  symbol: string,
  tradingData: any,
): Promise<void> => {
  const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:data`;
  await warmCache(key, tradingData, CACHE_CONFIG.TTL.TRADING_DATA);
};

// Cache health check
export const getCacheHealth = async () => {
  return await redisCacheManager.healthCheck();
};

// Cache metrics
export const getCacheMetrics = () => {
  return redisCacheManager.getMetrics();
};

// Clear all cache
export const clearAllCache = async (): Promise<void> => {
  try {
    await redisCacheManager.flushAll();
    logger.info("All cache cleared");
  } catch (error) {
    logger.error("Failed to clear all cache:", error);
  }
};

// Legacy exports for backward compatibility
export const cacheMiddleware = createCacheMiddleware();
export const clearCache = invalidateCache;
