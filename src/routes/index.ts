import { Router } from 'express';
import healthRouter from './health';
import courseRouter from './courseRoutes';
import lessonRouter from './lessonRoutes';
import moduleRouter from './moduleRoutes';
import capsuleRouter from './capsuleRoutes';
import achievementRouter from './achievementRoutes';


const router = Router();

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


export default router; 