import { redisCacheManager, CACHE_CONFIG } from "../config/redis";
import { Logger } from "../utils/Logger";

const logger = new Logger();

export interface CachedTradingData {
  symbol: string;
  price: number;
  volume: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
  lastUpdated: string;
}

export interface CachedMarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: string;
  source: string;
}

export interface CachedTradingHistory {
  symbol: string;
  trades: Array<{
    price: number;
    volume: number;
    timestamp: string;
    side: "buy" | "sell";
  }>;
  lastUpdated: string;
}

export interface CachedTechnicalIndicators {
  symbol: string;
  indicators: {
    rsi?: number;
    macd?: { macd: number; signal: number; histogram: number };
    sma20?: number;
    sma50?: number;
    sma200?: number;
    bollingerBands?: { upper: number; middle: number; lower: number };
  };
  lastUpdated: string;
}

export interface CachedPortfolioData {
  userId: string;
  totalValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    averagePrice: number;
    currentPrice: number;
    pnl: number;
    pnlPercent: number;
  }>;
  lastUpdated: string;
}

export class TradingCacheService {
  // Cache real-time trading data
  static async cacheTradingData(
    symbol: string,
    data: CachedTradingData,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:data`;
      await redisCacheManager.set(
        key,
        JSON.stringify(data),
        CACHE_CONFIG.TTL.TRADING_DATA,
      );

      // Also cache in market data for quick access
      const marketKey = `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:${symbol}:price`;
      const marketData: CachedMarketData = {
        symbol,
        price: data.price,
        volume: data.volume,
        timestamp: data.lastUpdated,
        source: "trading",
      };

      await redisCacheManager.set(
        marketKey,
        JSON.stringify(marketData),
        CACHE_CONFIG.TTL.MARKET_DATA,
      );

      logger.info(`Cached trading data for symbol ${symbol}`);
    } catch (error) {
      logger.error("Failed to cache trading data:", error);
    }
  }

  // Get cached trading data
  static async getCachedTradingData(
    symbol: string,
  ): Promise<CachedTradingData | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:data`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedTradingData;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached trading data:", error);
      return null;
    }
  }

  // Cache market data
  static async cacheMarketData(
    symbol: string,
    data: CachedMarketData,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:${symbol}:${data.source}`;
      await redisCacheManager.set(
        key,
        JSON.stringify(data),
        CACHE_CONFIG.TTL.MARKET_DATA,
      );

      logger.info(`Cached market data for symbol ${symbol}`);
    } catch (error) {
      logger.error("Failed to cache market data:", error);
    }
  }

  // Get cached market data
  static async getCachedMarketData(
    symbol: string,
    source: string = "default",
  ): Promise<CachedMarketData | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:${symbol}:${source}`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedMarketData;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached market data:", error);
      return null;
    }
  }

  // Cache trading history
  static async cacheTradingHistory(
    symbol: string,
    history: CachedTradingHistory,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:history`;
      await redisCacheManager.set(
        key,
        JSON.stringify(history),
        CACHE_CONFIG.TTL.TRADING_DATA,
      );

      logger.info(`Cached trading history for symbol ${symbol}`);
    } catch (error) {
      logger.error("Failed to cache trading history:", error);
    }
  }

  // Get cached trading history
  static async getCachedTradingHistory(
    symbol: string,
  ): Promise<CachedTradingHistory | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:history`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedTradingHistory;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached trading history:", error);
      return null;
    }
  }

  // Cache technical indicators
  static async cacheTechnicalIndicators(
    symbol: string,
    indicators: CachedTechnicalIndicators,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:indicators`;
      await redisCacheManager.set(
        key,
        JSON.stringify(indicators),
        CACHE_CONFIG.TTL.TRADING_DATA,
      );

      logger.info(`Cached technical indicators for symbol ${symbol}`);
    } catch (error) {
      logger.error("Failed to cache technical indicators:", error);
    }
  }

  // Get cached technical indicators
  static async getCachedTechnicalIndicators(
    symbol: string,
  ): Promise<CachedTechnicalIndicators | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:indicators`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedTechnicalIndicators;
      }

      return null;
    } catch (error) {
      logger.error("Failed to get cached technical indicators:", error);
      return null;
    }
  }

  // Cache portfolio data
  static async cachePortfolioData(
    userId: string,
    portfolio: CachedPortfolioData,
  ): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:portfolio`;
      await redisCacheManager.set(
        key,
        JSON.stringify(portfolio),
        CACHE_CONFIG.TTL.ANALYTICS,
      );

      logger.info(`Cached portfolio data for user ${userId}`);
    } catch (error) {
      logger.error("Failed to cache portfolio data:", error);
    }
  }

  // Get cached portfolio data
  static async getCachedPortfolioData(
    userId: string,
  ): Promise<CachedPortfolioData | null> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:portfolio`;
      const cachedData = await redisCacheManager.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as CachedPortfolioData;
      }
    } catch (error) {
      logger.error("Failed to get cached portfolio data:", error);
    }
    return null;
  }

  // Cache multiple symbols data
  static async cacheMultipleSymbolsData(
    symbolsData: Map<string, CachedTradingData>,
  ): Promise<void> {
    try {
      const promises = Array.from(symbolsData.entries()).map(([symbol, data]) =>
        this.cacheTradingData(symbol, data),
      );

      await Promise.all(promises);
      logger.info(`Cached data for ${symbolsData.size} symbols`);
    } catch (error) {
      logger.error("Failed to cache multiple symbols data:", error);
    }
  }

  // Get cached data for multiple symbols
  static async getCachedMultipleSymbolsData(
    symbols: string[],
  ): Promise<Map<string, CachedTradingData>> {
    const result = new Map<string, CachedTradingData>();

    try {
      const promises = symbols.map(async (symbol) => {
        const data = await this.getCachedTradingData(symbol);
        if (data) {
          result.set(symbol, data);
        }
      });

      await Promise.all(promises);
      logger.info(`Retrieved cached data for ${result.size} symbols`);
    } catch (error) {
      logger.error("Failed to get cached multiple symbols data:", error);
    }

    return result;
  }

  // Invalidate trading data for a symbol
  static async invalidateTradingData(symbol: string): Promise<void> {
    try {
      const patterns = [
        `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:*`,
        `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:${symbol}:*`,
      ];

      await Promise.all(
        patterns.map((pattern) => redisCacheManager.del(pattern)),
      );

      logger.info(`Invalidated trading data for symbol ${symbol}`);
    } catch (error) {
      logger.error("Failed to invalidate trading data:", error);
    }
  }

  // Invalidate all trading data
  static async invalidateAllTradingData(): Promise<void> {
    try {
      const patterns = [
        `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:*`,
        `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:*`,
      ];

      await Promise.all(
        patterns.map((pattern) => redisCacheManager.del(pattern)),
      );

      logger.info("Invalidated all trading data");
    } catch (error) {
      logger.error("Failed to invalidate all trading data:", error);
    }
  }

  // Invalidate user portfolio data
  static async invalidateUserPortfolio(userId: string): Promise<void> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.USER}:${userId}:portfolio`;
      await redisCacheManager.del(key);
      logger.info(`Invalidated portfolio data for user ${userId}`);
    } catch (error) {
      logger.error("Failed to invalidate user portfolio:", error);
    }
  }

  // Warm cache with popular symbols
  static async warmPopularSymbolsCache(
    symbolsData: Map<string, CachedTradingData>,
  ): Promise<void> {
    try {
      await this.cacheMultipleSymbolsData(symbolsData);
      logger.info(`Warmed cache for ${symbolsData.size} popular symbols`);
    } catch (error) {
      logger.error("Failed to warm popular symbols cache:", error);
    }
  }

  // Get cache statistics for trading data
  static async getTradingCacheStats(): Promise<{
    tradingKeys: number;
    marketKeys: number;
    totalKeys: number;
  }> {
    try {
      const tradingKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:*`,
      );
      const marketKeys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.MARKET}:*`,
      );

      return {
        tradingKeys: tradingKeys.length,
        marketKeys: marketKeys.length,
        totalKeys: tradingKeys.length + marketKeys.length,
      };
    } catch (error) {
      logger.error("Failed to get trading cache stats:", error);
      return { tradingKeys: 0, marketKeys: 0, totalKeys: 0 };
    }
  }

  // Check if trading data is fresh (within TTL)
  static async isTradingDataFresh(symbol: string): Promise<boolean> {
    try {
      const key = `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:${symbol}:data`;
      return await redisCacheManager.exists(key);
    } catch (error) {
      logger.error("Failed to check trading data freshness:", error);
      return false;
    }
  }

  // Get symbols with cached data
  static async getCachedSymbols(): Promise<string[]> {
    try {
      const keys = await redisCacheManager.keys(
        `${CACHE_CONFIG.KEY_PREFIXES.TRADING}:*:data`,
      );
      return keys.map((key) => {
        const parts = key.split(":");
        return parts[1]; // Extract symbol from key
      });
    } catch (error) {
      logger.error("Failed to get cached symbols:", error);
      return [];
    }
  }
}
