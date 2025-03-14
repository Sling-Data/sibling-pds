import { Response } from "express";
import { AppError } from "../middleware/errorHandler";

export class ResponseHandler {
  static success(res: Response, data: any, status: number = 200) {
    res.status(status).json(data);
  }

  static error(res: Response, error: Error | AppError, status: number = 500) {
    const message =
      error instanceof AppError ? error.message : "Internal server error";
    const statusCode = error instanceof AppError ? error.statusCode : status;
    res.status(statusCode).json({
      status: "error",
      message,
    });
  }

  static redirect(
    res: Response,
    url: string,
    params: Record<string, string> = {}
  ) {
    const queryString = new URLSearchParams(params).toString();
    const redirectUrl = queryString ? `${url}?${queryString}` : url;
    res.redirect(redirectUrl);
  }
}
