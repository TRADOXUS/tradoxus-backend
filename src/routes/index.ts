import { Router } from 'express';
import healthRouter from './health';
import courseRouter from './courseRoutes';
import lessonRouter from './lessonRoutes';
import moduleRouter from './moduleRoutes';
import capsuleRouter from './capsuleRoutes';
import achievementRouter from './achievementRoutes';
import nftRouter from './nftRoutes';
import authRouter from './authRoutes';
import userRouter from './userRoutes';

const router = Router();

// Health check routes
router.use('/health', healthRouter);

// Auth routes
router.use('/auth', authRouter);

// User routes
router.use('/users', userRouter);

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


export default router;