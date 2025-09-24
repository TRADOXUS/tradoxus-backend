import { redisCacheManager, CACHE_CONFIG } from "../config/redis";
import crypto from "crypto";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface CachedQueryResult<T = any> {
  data: T;
  queryHash: string;
  cachedAt: string;
  ttl: number;
  metadata?: {
    tableName?: string;
    operation?: string;
    recordCount?: number;
  };
}

export interface QueryCacheOptions {
  ttl?: number;
  keyPrefix?: string;
  includeUserContext?: boolean;
  tags?: string[];
  compress?: boolean;
}

export class DatabaseCacheService {
  // Generate cache key for database query
  private static generateQueryKey(
    query: string,
    params: any[] = [],
    options: QueryCacheOptions = {},
    userId?: string,
  ): string {
    const { keyPrefix = "db", includeUserContext = false } = options;

    // Create query hash
    const queryHash = this.generateQueryHash(query, params);

    // Build cache key
    let key = `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:${keyPrefix}:${queryHash}`;

    if (includeUserContext && userId) {
      key += `:user:${userId}`;
    }

    return key;
  }

  private static generateQueryHash(query: string, params: any[]): string {
    return crypto
      .createHash("md5")
      .update(query + JSON.stringify(params))
      .digest("hex");
  }

  // Cache database query result
  static async cacheQueryResult<T>(
    query: string,
    params: any[],
    result: T,
    options: QueryCacheOptions = {},
    userId?: string,
  ): Promise<void> {
    try {
      const queryKey = this.generateQueryKey(query, params, options, userId);

      const cachedResult: CachedQueryResult<T> = {
        data: result,
        queryHash: this.generateQueryHash(query, params),
        cachedAt: new Date().toISOString(),
        ttl: options.ttl || CACHE_CONFIG.TTL.STATIC_DATA,
        metadata: {
          tableName: this.extractTableName(query),
          operation: this.extractOperation(query),
          recordCount: Array.isArray(result) ? result.length : 1,
        },
      };

      await redisCacheManager.set(
        queryKey,
        JSON.stringify(cachedResult),
        options.ttl || CACHE_CONFIG.TTL.STATIC_DATA,
      );

      // Add cache tags if provided
      if (options.tags && options.tags.length > 0) {
        await Promise.all(
          options.tags.map((tag) =>
            redisCacheManager.set(
              `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:tag:${tag}:${queryKey}`,
              "1",
              options.ttl || CACHE_CONFIG.TTL.STATIC_DATA,
            ),
          ),
        );
      }

      logger.info(`Cached query result for key: ${queryKey}`);
    } catch (error) {
      logger.error("Failed to cache query result:", error);
    }
  }

  // Get cached query result
  static async getCachedQueryResult<T>(
    query: string,
    params: any[] = [],
    options: QueryCacheOptions = {},
    userId?: string,
  ): Promise<T | null> {
    try {
      const queryKey = this.generateQueryKey(query, params, options, userId);
      const cachedData = await redisCacheManager.get(queryKey);

      if (cachedData) {
        const cachedResult = JSON.parse(cachedData) as CachedQueryResult<T>;
        logger.info(`Cache hit for query: ${queryKey}`);
        return cachedResult.data;
      }

      logger.info(`Cache miss for query: ${queryKey}`);
      return null;
    } catch (error) {
      logger.error("Failed to get cached query result:", error);
      return null;
    }
  }

  // Cache aggregated data
  static async cacheAggregatedData<T>(
    aggregationType: string,
    params: Record<string, any>,
    data: T,
    ttl: number = CACHE_CONFIG.TTL.ANALYTICS,
  ): Promise<void> {
    try {
      const paramString = JSON.stringify(params);
      const paramHash = crypto
        .createHash("md5")
        .update(paramString)
        .digest("hex");
      const key = `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:${aggregationType}:${paramHash}`;

      const cachedData = {
        data,
        aggregationType,
        params,
        cachedAt: new Date().toISOString(),
        ttl,
      };

      await redisCacheManager.set(key, JSON.stringify(cachedData), ttl);
      logger.info(`Cached aggregated data for ${aggregationType}`);
    } catch (error) {
      logger.error("Failed to cache aggregated data:", error);
    }
  }

  // Get cached aggregated data
  static async getCachedAggregatedData<T>(
    aggregationType: string,
    params: Record<string, any>,
  ): Promise<T | null> {
    try {
      const paramString = JSON.stringify(params);
      const paramHash = crypto
        .createHash("md5")
        .update(paramString)
        .digest("hex");
      const key = `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:${aggregationType}:${paramHash}`;

      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        logger.info(`Cache hit for aggregated data: ${aggregationType}`);
        return parsed.data;
      }

      logger.info(`Cache miss for aggregated data: ${aggregationType}`);
      return null;
    } catch (error) {
      logger.error("Failed to get cached aggregated data:", error);
      return null;
    }
  }

  // Cache user-specific query results
  static async cacheUserQueryResult<T>(
    userId: string,
    query: string,
    params: any[],
    result: T,
    options: QueryCacheOptions = {},
  ): Promise<void> {
    const userOptions = { ...options, includeUserContext: true };
    await this.cacheQueryResult(query, params, result, userOptions, userId);
  }

  // Get cached user-specific query result
  static async getCachedUserQueryResult<T>(
    userId: string,
    query: string,
    params: any[] = [],
    options: QueryCacheOptions = {},
  ): Promise<T | null> {
    const userOptions = { ...options, includeUserContext: true };
    return await this.getCachedQueryResult(query, params, userOptions, userId);
  }

  // Cache statistics and metrics
  static async cacheStatistics(
    statsType: string,
    data: any,
    ttl: number = CACHE_CONFIG.TTL.ANALYTICS,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:stats:${statsType}`;

      const cachedData = {
        data,
        statsType,
        cachedAt: new Date().toISOString(),
        ttl,
      };

      await redisCacheManager.set(key, JSON.stringify(cachedData), ttl);
      logger.info(`Cached statistics for ${statsType}`);
    } catch (error) {
      logger.error("Failed to cache statistics:", error);
    }
  }

  // Get cached statistics
  static async getCachedStatistics(statsType: string): Promise<any | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:stats:${statsType}`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        logger.info(`Cache hit for statistics: ${statsType}`);
        return parsed.data;
      }

      logger.info(`Cache miss for statistics: ${statsType}`);
      return null;
    } catch (error) {
      logger.error("Failed to get cached statistics:", error);
      return null;
    }
  }

  // Invalidate cache by table name
  static async invalidateCacheByTable(tableName: string): Promise<void> {
    try {
      const pattern = `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:db:*`;
      const keys = await redisCacheManager.keys(pattern);

      const keysToDelete = keys.filter((key) => {
        const cachedData = redisCacheManager.get(key);
        return cachedData.then((data) => {
          if (data) {
            const parsed = JSON.parse(data);
            return parsed.metadata?.tableName === tableName;
          }
          return false;
        });
      });

      if (keysToDelete.length > 0) {
        await Promise.all(
          keysToDelete.map((key) => redisCacheManager.del(key)),
        );
        logger.info(
          `Invalidated ${keysToDelete.length} cache entries for table ${tableName}`,
        );
      }
    } catch (error) {
      logger.error(`Failed to invalidate cache for table ${tableName}:`, error);
    }
  }

  // Invalidate cache by tags
  static async invalidateCacheByTags(tags: string[]): Promise<void> {
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
            `Invalidated ${cacheKeys.length} cache entries for tag: ${tag}`,
          );
        }
      }
    } catch (error) {
      logger.error(
        `Failed to invalidate cache by tags ${tags.join(",")}:`,
        error,
      );
    }
  }

  // Invalidate user-specific cache
  static async invalidateUserCache(userId: string): Promise<void> {
    try {
      const pattern = `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:db:*:user:${userId}`;
      const keys = await redisCacheManager.keys(pattern);

      if (keys.length > 0) {
        await Promise.all(keys.map((key) => redisCacheManager.del(key)));
        logger.info(
          `Invalidated ${keys.length} user-specific cache entries for user ${userId}`,
        );
      }
    } catch (error) {
      logger.error(
        `Failed to invalidate user cache for user ${userId}:`,
        error,
      );
    }
  }

  // Invalidate all database cache
  static async invalidateAllDatabaseCache(): Promise<void> {
    try {
      const patterns = [
        `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:db:*`,
        `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:*`,
      ];

      await Promise.all(
        patterns.map(async (pattern) => {
          const keys = await redisCacheManager.keys(pattern);
          if (keys.length > 0) {
            await Promise.all(keys.map((key) => redisCacheManager.del(key)));
          }
        }),
      );

      logger.info("Invalidated all database cache");
    } catch (error) {
      logger.error("Failed to invalidate all database cache:", error);
    }
  }

  // Warm cache with frequently accessed data
  static async warmFrequentQueries(
    queries: Array<{
      query: string;
      params: any[];
      result: any;
      options?: QueryCacheOptions;
    }>,
  ): Promise<void> {
    try {
      await Promise.all(
        queries.map(({ query, params, result, options }) =>
          this.cacheQueryResult(query, params, result, options),
        ),
      );

      logger.info(`Warmed cache with ${queries.length} frequent queries`);
    } catch (error) {
      logger.error("Failed to warm frequent queries cache:", error);
    }
  }

  // Get cache statistics for database queries
  static async getDatabaseCacheStats(): Promise<{
    queryKeys: number;
    analyticsKeys: number;
    statsKeys: number;
    totalKeys: number;
  }> {
    try {
      const queryKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.CACHE}:db:*`,
      );
      const analyticsKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:*`,
      );
      const statsKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.ANALYTICS}:stats:*`,
      );

      return {
        queryKeys: queryKeys.length,
        analyticsKeys: analyticsKeys.length,
        statsKeys: statsKeys.length,
        totalKeys: queryKeys.length + analyticsKeys.length,
      };
    } catch (error) {
      logger.error("Failed to get database cache stats:", error);
      return { queryKeys: 0, analyticsKeys: 0, statsKeys: 0, totalKeys: 0 };
    }
  }

  // Helper method to extract table name from query
  private static extractTableName(query: string): string | undefined {
    const match = query.match(
      /(?:FROM|UPDATE|INSERT INTO|DELETE FROM)\s+(\w+)/i,
    );
    return match ? match[1] : undefined;
  }

  // Helper method to extract operation from query
  private static extractOperation(query: string): string | undefined {
    const trimmedQuery = query.trim().toUpperCase();
    if (trimmedQuery.startsWith("SELECT")) return "SELECT";
    if (trimmedQuery.startsWith("INSERT")) return "INSERT";
    if (trimmedQuery.startsWith("UPDATE")) return "UPDATE";
    if (trimmedQuery.startsWith("DELETE")) return "DELETE";
    return undefined;
  }

  // Check if query result is cached
  static async isQueryCached(
    query: string,
    params: any[] = [],
    options: QueryCacheOptions = {},
  ): Promise<boolean> {
    try {
      const queryKey = this.generateQueryKey(query, params, options);
      return await redisCacheManager.exists(queryKey);
    } catch (error) {
      logger.error("Failed to check if query is cached:", error);
      return false;
    }
  }

  // Get cache hit ratio for database queries
  static async getDatabaseCacheHitRatio(): Promise<number> {
    try {
      const metrics = redisCacheManager.getMetrics();
      return metrics.hitRatio;
    } catch (error) {
      logger.error("Failed to get database cache hit ratio:", error);
      return 0;
    }
  }
}
