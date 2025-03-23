import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'class-validator';

export class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError | ValidationError[],
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: err.status,
            error: {
                message: err.message
            }
        });
        return;
    }

    if (Array.isArray(err) && err[0] instanceof ValidationError) {
        res.status(400).json({
            status: 'fail',
            error: {
                message: 'Validation Error',
                errors: err.map(error => ({
                    property: error.property,
                    constraints: error.constraints
                }))
            }
        });
        return;
    }

    console.error('Error:', err);

    res.status(500).json({
        status: 'error',
        error: {
            message: 'Internal Server Error'
        }
    });
}; 