import { Router, RequestHandler } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { validateDto } from '../middleware/validation';
import { BulkUpdateDto, BulkStatusDto } from '../dto/Analytics.dto';
import { authMiddleware } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

export function createAnalyticsRoutes(controller: AnalyticsController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware as RequestHandler);

  // Analytics endpoints
  router.get('/user/:userId/statistics', cacheMiddleware(300) as RequestHandler, controller.getUserStatistics.bind(controller) as RequestHandler);
  router.get('/lessons/:lessonId/analytics', cacheMiddleware(300) as RequestHandler, controller.getLessonAnalytics.bind(controller) as RequestHandler);
  router.get('/course/:courseId/completion-rate', cacheMiddleware(300) as RequestHandler, controller.getCourseCompletionRate.bind(controller) as RequestHandler);

  // Bulk operations endpoints
  router.post('/bulk/update', validateDto(BulkUpdateDto) as RequestHandler, controller.bulkUpdateProgress.bind(controller) as RequestHandler);
  router.get('/bulk/status', validateDto(BulkStatusDto) as RequestHandler, controller.getBulkStatus.bind(controller) as RequestHandler);

  return router;
} 