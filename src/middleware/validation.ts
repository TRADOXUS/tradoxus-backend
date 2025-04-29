import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

interface ValidatableClass {
    new (...args: unknown[]): object;
}

export function validateDto(dtoClass: ValidatableClass) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dtoObj = plainToInstance(dtoClass, req.body);
    const errors = await validate(dtoObj);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => ({
        property: error.property,
        constraints: error.constraints
      }));
      res.status(400).json({ errors: errorMessages });
      return;
    }

    req.body = dtoObj;
    next();
  };
} 