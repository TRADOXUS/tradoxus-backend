import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './config/database';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';

const app = express();
const port = process.env.PORT || 4001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());

// Routes
app.use('/api/v1/', routes);

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
});

// Database connection and server start
AppDataSource.initialize()
    .then(() => {
        console.log('Database connected successfully');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error);
    });

export default app; 