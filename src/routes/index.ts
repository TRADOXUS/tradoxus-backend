import { Router } from 'express';
import healthRouter from './health';
import courseRouter from './courseRoutes';
import lessonRouter from './lessonRoutes';
import moduleRouter from './moduleRoutes';
import capsuleRouter from './capsuleRoutes';
import nftRouter from './nftRoutes';

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

// NFT routes
router.use('/v1/nfts', nftRouter);

export default router; 