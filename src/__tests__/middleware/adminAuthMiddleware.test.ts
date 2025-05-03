import { Request, Response, NextFunction } from "express";
import { requireAdmin } from "../../middleware/adminAuthMiddleware";
import { AppError } from "../../middleware/errorHandler";
import { User } from "../../entities/User";

// Mock the AppError class to verify its usage
jest.mock("../../middleware/errorHandler", () => {
  // Store the original implementation if needed, though not strictly required for this mock
  // const original = jest.requireActual('../../middleware/errorHandler');
  return {
    // Mock the class constructor
    AppError: jest
      .fn()
      .mockImplementation((statusCode: number, message: string) => {
        const error = new Error(message);
        (error as any).statusCode = statusCode;
        (error as any).isOperational = true;
        return error;
      }),
    // Keep other exports from the module if necessary
    // errorHandler: original.errorHandler,
  };
});

describe("Admin Auth Middleware (requireAdmin)", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  // Reset mocks before each test
  beforeEach(() => {
    mockRequest = {};
    // Mock Response methods if needed, though not directly used by this middleware
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    // Clear any previous calls to the AppError mock constructor
    (AppError as jest.MockedClass<typeof AppError>).mockClear();
  });

  it("should call next with a 403 AppError if req.user is missing", () => {
    requireAdmin(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    expect(AppError).toHaveBeenCalledWith(
      403,
      "Forbidden: Administrator privileges required.",
    );
  });

  it("should call next with a 403 AppError if req.user.isAdmin is false", () => {
    mockRequest.user = { isAdmin: false } as User;
    requireAdmin(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
    expect(AppError).toHaveBeenCalledWith(
      403,
      "Forbidden: Administrator privileges required.",
    );
  });

  it("should call next without arguments if req.user.isAdmin is true", () => {
    mockRequest.user = { isAdmin: true } as User;
    requireAdmin(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith();
    expect(AppError).not.toHaveBeenCalled();
  });
});
