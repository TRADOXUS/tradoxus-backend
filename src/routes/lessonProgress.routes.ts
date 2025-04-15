import { Router, RequestHandler } from 'express';
import { LessonProgressController } from '../controllers/LessonProgressController';
import { authMiddleware } from '../middleware/auth';

export function createLessonProgressRoutes(controller: LessonProgressController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware as RequestHandler);

  // Progress routes
  router.post('/lessons/:lessonId/start', controller.startProgress.bind(controller) as RequestHandler);
  router.post('/lessons/:lessonId/complete', controller.completeProgress.bind(controller) as RequestHandler);
  router.put('/lessons/:lessonId/update', controller.updateProgress.bind(controller) as RequestHandler);
  router.get('/lessons/:lessonId/status', controller.getProgress.bind(controller) as RequestHandler);
  router.get('/user/lessons', controller.getUserProgress.bind(controller) as RequestHandler);

  return router;
} 