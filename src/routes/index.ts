import { Router } from 'express';
import healthRouter from './health';
import nftRouter from './nft.routes';

const router = Router();

// Health check routes
router.use('/health', healthRouter);

// NFT routes
router.use('/v1/nfts', nftRouter);

export default router; 