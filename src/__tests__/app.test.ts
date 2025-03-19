import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from '../routes';
import { errorHandler } from '../middleware/errorHandler';

const app = express();

// Setup middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api', routes);

// 404 handler - Add this before error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found'
    }
  });
});

// Error handler should be last
app.use(errorHandler);

describe('Express App Tests', () => {
  it('should respond with 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/api/nonexistent-route')
      .expect('Content-Type', /json/)
      .expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('message', 'Route not found');
  });

  // Add more test cases here for your actual routes
}); 