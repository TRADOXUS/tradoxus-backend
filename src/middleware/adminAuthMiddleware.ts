import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const isAdmin = req.user && req.user.isAdmin === true;
  if (!isAdmin) {
    // Use AppError for consistent error handling
    return next(
      new AppError(403, "Forbidden: Administrator privileges required."),
    );
  }
  next();
};
