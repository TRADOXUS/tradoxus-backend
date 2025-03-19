import { Router } from 'express';
import healthRouter from './health';

const router = Router();

// Health check routes
router.use('/health', healthRouter);

export default router; 