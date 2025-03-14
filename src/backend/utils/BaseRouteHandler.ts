import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ResponseHandler } from "./ResponseHandler";

export abstract class BaseRouteHandler {
  protected async handleRequest<
    P extends ParamsDictionary = ParamsDictionary,
    B = any
  >(
    req: Request<P, any, B>,
    res: Response,
    handler: (req: Request<P, any, B>, res: Response) => Promise<void>
  ) {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("Route error:", error);
      ResponseHandler.error(res, error as Error);
    }
  }

  public createAsyncHandler<
    P extends ParamsDictionary = ParamsDictionary,
    B = any
  >(handler: (req: Request<P, any, B>, res: Response) => Promise<void>) {
    return (req: Request<P, any, B>, res: Response) => {
      this.handleRequest(req, res, handler);
    };
  }
}
