import { Router } from "express";
import { CacheController } from "../controllers/CacheController";
import { authenticate } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/adminAuthMiddleware";

const router = Router();

// Apply authentication to all cache routes
router.use(authenticate);

// Health and monitoring routes
router.get("/health", CacheController.getHealth);
router.get("/metrics", CacheController.getMetrics);
router.get("/dashboard", CacheController.getDashboard);
router.get("/statistics", CacheController.getStatistics);
router.get("/report", CacheController.getCacheReport);
router.get("/performance-history", CacheController.getPerformanceHistory);
router.get("/health-trends", CacheController.getHealthTrends);
router.get("/alerts", CacheController.getAlerts);

// Cache warming routes
router.get("/warming/status", CacheController.getWarmingStatus);
router.post("/warming/start", requireAdmin, CacheController.startWarming);
router.post("/warming/stop", requireAdmin, CacheController.stopWarming);
router.post(
  "/warming/trigger/:strategyName",
  requireAdmin,
  CacheController.triggerWarmingStrategy,
);

// Cache invalidation routes (admin only)
router.post("/invalidate", requireAdmin, CacheController.invalidateCache);
router.post(
  "/invalidate/tags",
  requireAdmin,
  CacheController.invalidateCacheByTags,
);
router.post("/clear-all", requireAdmin, CacheController.clearAllCache);
router.post(
  "/invalidate/user/:userId",
  requireAdmin,
  CacheController.invalidateUserCache,
);
router.post(
  "/invalidate/trading",
  requireAdmin,
  CacheController.invalidateTradingCache,
);
router.post(
  "/invalidate/course/:courseId?",
  requireAdmin,
  CacheController.invalidateCourseCache,
);

// Cache management routes (admin only)
router.get("/keys", requireAdmin, CacheController.getCacheKeys);
router.get("/keys/:key", requireAdmin, CacheController.getCacheValue);
router.delete("/keys/:key", requireAdmin, CacheController.deleteCacheKey);

// Optimization routes
router.get(
  "/optimization/recommendations",
  CacheController.getOptimizationRecommendations,
);
router.get("/optimization/config", CacheController.getOptimizationConfig);
router.put(
  "/optimization/config",
  requireAdmin,
  CacheController.updateOptimizationConfig,
);
router.post(
  "/optimization/trigger",
  requireAdmin,
  CacheController.triggerOptimization,
);
router.get("/optimization/history", CacheController.getOptimizationHistory);
router.get("/optimization/stats", CacheController.getOptimizationStats);

// Fallback routes
router.get("/fallback/strategies", CacheController.getFallbackStrategies);
router.get(
  "/fallback/circuit-breakers",
  CacheController.getCircuitBreakerStates,
);
router.post(
  "/fallback/reset-circuit-breakers",
  requireAdmin,
  CacheController.resetCircuitBreakers,
);

// Utility routes
router.delete("/alerts", requireAdmin, CacheController.clearAlerts);
router.post("/reset-metrics", requireAdmin, CacheController.resetMetrics);

export default router;
