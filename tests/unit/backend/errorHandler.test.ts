import { Request, Response, NextFunction } from "express";
import { AppError, errorHandler } from "@backend/middleware/errorHandler";

describe("Error Handler Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();
  let responseObject = {};
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(() => {
    // Mock console methods to suppress logs
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  beforeEach(() => {
    mockRequest = {};
    responseObject = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
  });

  it("should handle AppError with custom status code", () => {
    const error = new AppError("Custom error message", 400);

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(responseObject).toEqual({
      status: "error",
      message: "Custom error message",
    });
  });

  it("should handle AppError with 404 status", () => {
    const error = new AppError("Not found", 404);

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(responseObject).toEqual({
      status: "error",
      message: "Not found",
    });
  });

  it("should handle unknown errors with 500 status", () => {
    const error = new Error("Unknown error");

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(responseObject).toEqual({
      status: "error",
      message: "Unknown error",
    });
  });

  it("should handle validation errors", () => {
    const error = new AppError("Validation failed", 400);

    errorHandler(
      error,
      mockRequest as Request,
      mockResponse as Response,
      nextFunction
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(responseObject).toEqual({
      status: "error",
      message: "Validation failed",
    });
  });

  describe("AppError class", () => {
    it("should create an error with custom message and status code", () => {
      const error = new AppError("Custom message", 418);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Custom message");
      expect(error.statusCode).toBe(418);
    });

    it("should default to 500 status code if not provided", () => {
      const error = new AppError("Server error");

      expect(error.statusCode).toBe(500);
    });
  });
});
