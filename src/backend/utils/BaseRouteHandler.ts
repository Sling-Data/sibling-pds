import { Request, Response } from "express";
import { ResponseHandler } from "./ResponseHandler";

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
      ResponseHandler.error(res, error as Error);
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
