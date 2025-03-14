import { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";

export abstract class BaseRouteHandler {
  protected async handleRequest(
    req: Request,
    res: Response,
    handler: (req: Request, res: Response) => Promise<void>
  ) {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("Route error:", error);
      const status = error instanceof AppError ? error.statusCode : 500;
      const message =
        error instanceof AppError ? error.message : "Internal server error";
      res.status(status).json({ status: "error", message });
    }
  }

  public createAsyncHandler(
    handler: (req: Request, res: Response) => Promise<void>
  ) {
    return (req: Request, res: Response) => {
      this.handleRequest(req, res, handler);
    };
  }
}
