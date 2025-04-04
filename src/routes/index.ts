import { Router } from 'express';
import healthRouter from './health';
import courseRouter from './courseRoutes';
import lessonRouter from './lessonRoutes';
import moduleRouter from './moduleRoutes';
import capsuleRouter from './capsuleRoutes';
import achievementRouter from './achievementRoutes';
import { createAuthRoutes } from './auth.routes';
import { createLessonProgressRoutes } from './lessonProgress.routes';
import { AuthController } from '../controllers/AuthController';
import { LessonProgressController } from '../controllers/LessonProgressController';
import { AuthService } from '../services/AuthService';
import { LessonProgressService } from '../services/LessonProgressService';
import { getRepository } from 'typeorm';
import { User } from '../entities/User';
import { LessonProgress } from '../entities/LessonProgress';
import { Lesson } from '../entities/Lesson';

import nftRouter from './nftRoutes';

export function setupRoutes(): Router {
  const router = Router();

  // Inicializar servicios
  const authService = new AuthService(getRepository(User));
  const lessonProgressService = new LessonProgressService(
    getRepository(LessonProgress),
    getRepository(Lesson)
  );

  // Inicializar controladores
  const authController = new AuthController(authService);
  const lessonProgressController = new LessonProgressController(lessonProgressService);

  // Configurar rutas
  router.use('/auth', createAuthRoutes(authController));
  router.use('/progress', createLessonProgressRoutes(lessonProgressController));

  // Health check routes
  router.use('/health', healthRouter);

  // Course routes
  router.use('/courses', courseRouter);

  // Lesson routes
  router.use('/lessons', lessonRouter);

  // Module routes
  router.use('/modules', moduleRouter);

  // Capsule routes
  router.use('/capsules', capsuleRouter);

  // Achievements routes
  router.use('/achievements', achievementRouter);

  // NFT routes
  router.use('/v1/nfts', nftRouter);

  return router;
}

export default setupRoutes(); 