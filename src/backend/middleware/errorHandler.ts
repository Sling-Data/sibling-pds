import { Request, Response, NextFunction } from "express";

export interface ErrorResponse {
  status: "error";
  message: string;
}

export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500) {
    super(message);
    this.name = "AppError";
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("Error:", err);

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const response: ErrorResponse = {
    status: "error",
    message: err.message || "Internal server error",
  };

  res.status(statusCode).json(response);
};
