import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    this.code = code || "GENERIC_ERROR";
  }
}

// Specific error classes for different domains
export class ReferralError extends AppError {
  constructor(
    statusCode: number,
    message: string,
    code: string,
    details?: any
  ) {
    super(statusCode, message, `REFERRAL_${code}`, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    field?: string,
    value?: any
  ) {
    super(400, message, "VALIDATION_ERROR", { field, value });
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(401, message, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(403, message, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(404, message, "NOT_FOUND_ERROR", { resource, id });
  }
}

export class ConflictError extends AppError {
  constructor(message: string, conflictingField?: string) {
    super(409, message, "CONFLICT_ERROR", { conflictingField });
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(429, message, "RATE_LIMIT_ERROR");
  }
}

// Enhanced error response interface
interface ErrorResponse {
  status: "error";
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
    timestamp: string;
    path: string;
  };
  requestId?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error(`[${new Date().toISOString()}] Error:`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const requestId = req.headers['x-request-id'] as string || 
                   Math.random().toString(36).substr(2, 9);

  // Enhanced AppError handling
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      status: "error",
      error: {
        code: err.code || "GENERIC_ERROR",
        message: err.message,
        statusCode: err.statusCode,
        details: err.details,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
      requestId,
    };

    return res.status(err.statusCode).json(errorResponse);
  }

  // TypeORM validation error
  if (err.name === "QueryFailedError") {
    const queryError = err as any;
    let message = "Database error";
    let code = "DATABASE_ERROR";
    
    // Handle specific PostgreSQL errors
    if (queryError.code === "23505") {
      message = "Resource already exists";
      code = "DUPLICATE_ENTRY";
    } else if (queryError.code === "23503") {
      message = "Referenced resource not found";
      code = "FOREIGN_KEY_VIOLATION";
    } else if (queryError.code === "23514") {
      message = "Data validation failed";
      code = "CHECK_VIOLATION";
    }

    const errorResponse: ErrorResponse = {
      status: "error",
      error: {
        code,
        message,
        statusCode: 400,
        details: process.env.NODE_ENV === 'development' ? {
          constraint: queryError.constraint,
          table: queryError.table,
          column: queryError.column,
        } : undefined,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
      requestId,
    };

    return res.status(400).json(errorResponse);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const errorResponse: ErrorResponse = {
      status: "error",
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token",
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
      requestId,
    };

    return res.status(401).json(errorResponse);
  }

  if (err.name === "TokenExpiredError") {
    const errorResponse: ErrorResponse = {
      status: "error",
      error: {
        code: "TOKEN_EXPIRED",
        message: "Authentication token has expired",
        statusCode: 401,
        timestamp: new Date().toISOString(),
        path: req.path,
      },
      requestId,
    };

    return res.status(401).json(errorResponse);
  }

  // Class-validator errors
  if (err.name === "ValidationError" || (err as any).constraints) {
    const validationError = err as any;
    const errorResponse: ErrorResponse = {
      status: "error",
      error: {
        code: "VALIDATION_ERROR",
        message: "Input validation failed",
        statusCode: 400,
        details: {
          field: validationError.property,
          constraints: validationError.constraints,
          value: validationError.value,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      },
      requestId,
    };

    return res.status(400).json(errorResponse);
  }

  // Default error for unhandled cases
  const errorResponse: ErrorResponse = {
    status: "error",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === 'production' 
        ? "Internal server error" 
        : err.message,
      statusCode: 500,
      details: process.env.NODE_ENV === 'development' ? {
        stack: err.stack,
      } : undefined,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
    requestId,
  };

  return res.status(500).json(errorResponse);
};

// Utility functions for creating specific errors
export const createReferralError = {
  codeInvalid: () => new ReferralError(400, "Invalid or expired referral code", "CODE_INVALID"),
  codeExpired: () => new ReferralError(400, "Referral code has expired", "CODE_EXPIRED"),
  usageLimit: () => new ReferralError(400, "Referral code usage limit reached", "USAGE_LIMIT_REACHED"),
  selfReferral: () => new ReferralError(400, "Cannot use your own referral code", "SELF_REFERRAL_FORBIDDEN"),
  alreadyUsed: () => new ReferralError(400, "User has already used a referral code", "ALREADY_USED"),
  codeTooNew: () => new ReferralError(400, "Referral code must age 1 minute before use", "CODE_TOO_NEW"),
  notFound: () => new ReferralError(404, "Referral not found", "NOT_FOUND"),
  notPending: () => new ReferralError(400, "Referral is not in pending status", "NOT_PENDING"),
  codeNotFound: () => new ReferralError(404, "Referral code not found", "CODE_NOT_FOUND"),
  generationFailed: () => new ReferralError(500, "Failed to generate unique referral code", "GENERATION_FAILED"),
};
