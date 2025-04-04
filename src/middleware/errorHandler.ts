import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    // TypeORM validation error
    if (err.name === 'QueryFailedError') {
        return res.status(400).json({
            status: 'error',
            message: 'Database error'
        });
    }

    // JWT error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }

    // Default error
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
}; 