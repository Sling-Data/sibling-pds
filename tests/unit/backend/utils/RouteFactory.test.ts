import { Router, IRoute } from "express";
import { RouteFactory } from "@backend/utils/RouteFactory";
import { validate } from "@backend/middleware/validation";

jest.mock("@backend/middleware/validation", () => ({
  validate: jest
    .fn()
    .mockReturnValue((_req: any, _res: any, next: any) => next()),
}));

interface RouteWithMethods extends IRoute {
  methods: {
    get?: boolean;
    post?: boolean;
    put?: boolean;
    delete?: boolean;
    patch?: boolean;
  };
}

interface RouteLayer {
  route?: {
    path: string;
    methods: {
      get?: boolean;
      post?: boolean;
      put?: boolean;
      delete?: boolean;
      patch?: boolean;
    };
    stack: any[];
  };
}

describe("RouteFactory", () => {
  let router: Router;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    router = Router();
    mockHandler = jest.fn();
    jest.clearAllMocks();
  });

  describe("createProtectedRoute", () => {
    it("should create a GET route with handler", () => {
      RouteFactory.createGetRoute(router, "/test", mockHandler);

      const routes = router.stack
        .filter((r) => r.route)
        .map((r) => (r as RouteLayer).route as RouteWithMethods);
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/test");
      expect(routes[0]?.methods.get).toBeTruthy();
    });

    it("should apply validation middleware when schema is provided", () => {
      const schema = { body: {} };
      RouteFactory.createGetRoute(router, "/test", mockHandler, schema);

      const routes = router.stack.filter((r) => r.route) as RouteLayer[];
      expect(routes[0]?.route?.stack).toHaveLength(2); // validation + handler
      expect(validate).toHaveBeenCalledWith(schema, "body");
    });
  });

  describe("createPostRoute", () => {
    it("should create a POST route with handler", () => {
      RouteFactory.createPostRoute(router, "/test", mockHandler);

      const routes = router.stack
        .filter((r) => r.route)
        .map((r) => (r as RouteLayer).route as RouteWithMethods);
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/test");
      expect(routes[0]?.methods.post).toBeTruthy();
    });

    it("should apply validation middleware when schema is provided", () => {
      const schema = { body: {} };
      RouteFactory.createPostRoute(router, "/test", mockHandler, schema);

      const routes = router.stack.filter((r) => r.route) as RouteLayer[];
      expect(routes[0]?.route?.stack).toHaveLength(2); // validation + handler
      expect(validate).toHaveBeenCalledWith(schema, "body");
    });
  });

  describe("createPutRoute", () => {
    it("should create a PUT route with handler", () => {
      RouteFactory.createPutRoute(router, "/test", mockHandler);

      const routes = router.stack
        .filter((r) => r.route)
        .map((r) => (r as RouteLayer).route as RouteWithMethods);
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/test");
      expect(routes[0]?.methods.put).toBeTruthy();
    });

    it("should apply validation middleware when schema is provided", () => {
      const schema = { body: {} };
      RouteFactory.createPutRoute(router, "/test", mockHandler, schema);

      const routes = router.stack.filter((r) => r.route) as RouteLayer[];
      expect(routes[0]?.route?.stack).toHaveLength(2); // validation + handler
      expect(validate).toHaveBeenCalledWith(schema, "body");
    });
  });

  describe("createDeleteRoute", () => {
    it("should create a DELETE route with handler", () => {
      RouteFactory.createDeleteRoute(router, "/test", mockHandler);

      const routes = router.stack
        .filter((r) => r.route)
        .map((r) => (r as RouteLayer).route as RouteWithMethods);
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/test");
      expect(routes[0]?.methods.delete).toBeTruthy();
    });

    it("should apply validation middleware when schema is provided", () => {
      const schema = { body: {} };
      RouteFactory.createDeleteRoute(router, "/test", mockHandler, schema);

      const routes = router.stack.filter((r) => r.route) as RouteLayer[];
      expect(routes[0]?.route?.stack).toHaveLength(2); // validation + handler
      expect(validate).toHaveBeenCalledWith(schema, "body");
    });
  });

  describe("createPatchRoute", () => {
    it("should create a PATCH route with handler", () => {
      RouteFactory.createPatchRoute(router, "/test", mockHandler);

      const routes = router.stack
        .filter((r) => r.route)
        .map((r) => (r as RouteLayer).route as RouteWithMethods);
      expect(routes).toHaveLength(1);
      expect(routes[0]?.path).toBe("/test");
      expect(routes[0]?.methods.patch).toBeTruthy();
    });

    it("should apply validation middleware when schema is provided", () => {
      const schema = { body: {} };
      RouteFactory.createPatchRoute(router, "/test", mockHandler, schema);

      const routes = router.stack.filter((r) => r.route) as RouteLayer[];
      expect(routes[0]?.route?.stack).toHaveLength(2); // validation + handler
      expect(validate).toHaveBeenCalledWith(schema, "body");
    });
  });
});
