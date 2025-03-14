import { Router, RequestHandler, Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { BaseRouteHandler } from "./BaseRouteHandler";
import { validate } from "../middleware/validation";

export class RouteFactory {
  static createGetRoute<P extends ParamsDictionary = ParamsDictionary, B = any>(
    router: Router,
    path: string,
    handler: (req: Request<P, any, B>, res: Response) => Promise<void>,
    validationSchema?: any,
    validationProperty: "body" | "query" | "params" = "body"
  ) {
    const middlewares: RequestHandler[] = [];

    if (validationSchema) {
      middlewares.push(validate(validationSchema, validationProperty));
    }

    router.get(path, ...middlewares, (req, res) =>
      BaseRouteHandler.prototype.createAsyncHandler<P, B>(handler)(
        req as Request<P>,
        res
      )
    );
  }

  static createPostRoute<
    P extends ParamsDictionary = ParamsDictionary,
    B = any
  >(
    router: Router,
    path: string,
    handler: (req: Request<P, any, B>, res: Response) => Promise<void>,
    validationSchema?: any,
    validationProperty: "body" | "query" | "params" = "body"
  ) {
    const middlewares: RequestHandler[] = [];

    if (validationSchema) {
      middlewares.push(validate(validationSchema, validationProperty));
    }

    router.post(path, ...middlewares, (req, res) =>
      BaseRouteHandler.prototype.createAsyncHandler<P, B>(handler)(
        req as Request<P>,
        res
      )
    );
  }

  static createPutRoute<P extends ParamsDictionary = ParamsDictionary, B = any>(
    router: Router,
    path: string,
    handler: (req: Request<P, any, B>, res: Response) => Promise<void>,
    validationSchema?: any,
    validationProperty: "body" | "query" | "params" = "body"
  ) {
    const middlewares: RequestHandler[] = [];

    if (validationSchema) {
      middlewares.push(validate(validationSchema, validationProperty));
    }

    router.put(path, ...middlewares, (req, res) =>
      BaseRouteHandler.prototype.createAsyncHandler<P, B>(handler)(
        req as Request<P>,
        res
      )
    );
  }

  static createDeleteRoute<
    P extends ParamsDictionary = ParamsDictionary,
    B = any
  >(
    router: Router,
    path: string,
    handler: (req: Request<P, any, B>, res: Response) => Promise<void>,
    validationSchema?: any,
    validationProperty: "body" | "query" | "params" = "body"
  ) {
    const middlewares: RequestHandler[] = [];

    if (validationSchema) {
      middlewares.push(validate(validationSchema, validationProperty));
    }

    router.delete(path, ...middlewares, (req, res) =>
      BaseRouteHandler.prototype.createAsyncHandler<P, B>(handler)(
        req as Request<P>,
        res
      )
    );
  }

  static createPatchRoute<
    P extends ParamsDictionary = ParamsDictionary,
    B = any
  >(
    router: Router,
    path: string,
    handler: (req: Request<P, any, B>, res: Response) => Promise<void>,
    validationSchema?: any,
    validationProperty: "body" | "query" | "params" = "body"
  ) {
    const middlewares: RequestHandler[] = [];

    if (validationSchema) {
      middlewares.push(validate(validationSchema, validationProperty));
    }

    router.patch(path, ...middlewares, (req, res) =>
      BaseRouteHandler.prototype.createAsyncHandler<P, B>(handler)(
        req as Request<P>,
        res
      )
    );
  }
}
