import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/config';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/v1', routes); 

// Error handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`The Server is running in ${config.nodeEnv} mode on port ${config.port}`);
}); 