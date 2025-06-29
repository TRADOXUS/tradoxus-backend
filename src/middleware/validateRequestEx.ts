import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validateRequestEx = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: "fail",
      message: "Validation Error",
      errors: errors.array(),
    });
    return;
  }
  next();
};
