import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { User } from '../entities/User'; 

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const isAdmin = req.user && req.user.isAdmin === true;
    if (!isAdmin) {
        // Use AppError for consistent error handling
        return next(new AppError(403, 'Forbidden: Administrator privileges required.'));
    }
    next(); 
};





