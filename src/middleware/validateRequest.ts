import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

interface ValidatableClass {
    new (...args: unknown[]): object;
}

export const validateRequest = (dtoClass: ValidatableClass) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const dtoObject = plainToClass(dtoClass, req.body);
        validate(dtoObject)
            .then(errors => {
                if (errors.length > 0) {
                    res.status(400).json({
                        status: 'fail',
                        message: 'Validation Error',
                        errors: errors.map(error => ({
                            property: error.property,
                            constraints: error.constraints
                        }))
                    });
                    return;
                }
                req.body = dtoObject;
                next();
            })
            .catch(next);
    };
}; 