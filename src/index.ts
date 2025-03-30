import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from "./middleware/authMiddleware";
import { connectToRedis } from "./config/redis";
import { rateLimiter } from "./middleware/rateLimiter";

const app = express();

connectToRedis();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting middleware
app.use(rateLimiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT token middleware
app.use('/api', authMiddleware);

// API routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server is running in ${config.nodeEnv} mode on port ${config.port}`);
}); 