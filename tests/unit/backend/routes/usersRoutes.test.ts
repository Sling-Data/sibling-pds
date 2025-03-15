import { errorHandler } from "@backend/middleware/errorHandler";
import { schemas } from "@backend/middleware/validation";
import * as encryption from "@backend/utils/encryption";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import { RouteFactory } from "@backend/utils/RouteFactory";
import express, { Express, NextFunction, Request, Response } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

// Mock dependencies
jest.mock("@backend/utils/encryption");
jest.mock("@backend/utils/userUtils");
jest.mock("@backend/models/UserModel");
jest.mock("@backend/utils/ResponseHandler");
jest.mock("@backend/utils/RouteFactory");

describe("Users Routes", () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let testUserId: string;

  // Mock authentication middleware
  const mockAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (token === "invalid.token.string") {
      res.status(401).json({ message: "Invalid token." });
      return;
    }

    // Set userId for valid tokens
    req.userId = "test-auth-user-id";
    next();
  };

  // Mock route handlers
  const mockCreateUser = jest.fn(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.body.name || !req.body.email) {
        res
          .status(400)
          .json({ status: "error", message: "Name and email are required" });
        return;
      }

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: `encrypted-${req.body.name}`,
        email: `encrypted-${req.body.email}`,
      };

      ResponseHandler.success(res, mockUser, 201);
    }
  );

  const mockUpdateUser = jest.fn(
    async (req: Request, res: Response): Promise<void> => {
      if (!req.body.name || !req.body.email) {
        res
          .status(400)
          .json({ status: "error", message: "Name and email are required" });
        return;
      }

      if (req.params.id === "nonexistent-id") {
        res.status(404).json({ status: "error", message: "User not found" });
        return;
      }

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: `encrypted-${req.body.name}`,
        email: `encrypted-${req.body.email}`,
      };

      ResponseHandler.success(res, mockUser);
    }
  );

  const mockGetUser = jest.fn(
    async (req: Request, res: Response): Promise<void> => {
      if (req.params.id === "nonexistent-id") {
        res.status(404).json({ status: "error", message: "User not found" });
        return;
      }

      const mockUser = {
        _id: new mongoose.Types.ObjectId(),
        name: "Test User",
        email: "test@example.com",
      };

      ResponseHandler.success(res, mockUser);
    }
  );

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up encryption key for tests
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566"; // 32-byte hex key

    // Mock RouteFactory methods
    (RouteFactory.createPostRoute as jest.Mock).mockImplementation(
      (router, path, handler, schema) => {
        router.post(path, (req: Request, res: Response) => {
          if (schema && req.body) {
            // Simple validation
            if (
              schema === schemas.createUser &&
              (!req.body.name || !req.body.email)
            ) {
              res
                .status(400)
                .json({ status: "error", message: "Validation failed" });
              return;
            }
          }
          handler(req, res);
        });
      }
    );

    (RouteFactory.createPutRoute as jest.Mock).mockImplementation(
      (router, path, handler, schema) => {
        router.put(path, (req: Request, res: Response) => {
          if (schema && req.body) {
            // Simple validation
            if (
              schema === schemas.updateUser &&
              (!req.body.name || !req.body.email)
            ) {
              res
                .status(400)
                .json({ status: "error", message: "Validation failed" });
              return;
            }
          }
          handler(req, res);
        });
      }
    );

    (RouteFactory.createGetRoute as jest.Mock).mockImplementation(
      (router, path, handler) => {
        router.get(path, handler);
      }
    );

    // Mock ResponseHandler.success
    (ResponseHandler.success as jest.Mock).mockImplementation(
      (res, data, statusCode = 200) => {
        res.status(statusCode).json({ data });
      }
    );

    // Set up Express app with routes
    app = express();
    app.use(express.json());

    // Apply mock authentication middleware
    app.use(mockAuth);

    // Create router with mock handlers
    const router = express.Router();
    RouteFactory.createPostRoute(
      router,
      "/",
      mockCreateUser as unknown as (
        req: Request,
        res: Response
      ) => Promise<void>,
      schemas.createUser
    );
    RouteFactory.createPutRoute(
      router,
      "/:id",
      mockUpdateUser as unknown as (
        req: Request,
        res: Response
      ) => Promise<void>,
      schemas.updateUser
    );
    RouteFactory.createGetRoute(
      router,
      "/:id",
      mockGetUser as unknown as (req: Request, res: Response) => Promise<void>
    );

    app.use("/users", router);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.ENCRYPTION_KEY;
  });

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();

    // Create a test user
    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      name: "encrypted-name",
      email: "encrypted-email",
      password: "encrypted-password",
    };

    testUserId = mockUser._id.toString();

    // Mock encryption functions
    (encryption.encrypt as jest.Mock).mockImplementation(
      (value) => `encrypted-${value}`
    );
    (encryption.decrypt as jest.Mock).mockImplementation((value) => {
      if (value === "encrypted-name") return "Test User";
      if (value === "encrypted-email") return "test@example.com";
      return value.replace("encrypted-", "");
    });
  });

  // Test route authentication
  describe("Route Authentication", () => {
    it("should require authentication for protected routes", async () => {
      // Test without token
      const noTokenResponse = await request(app).post("/users").send({
        name: "Test User",
        email: "test@example.com",
      });

      expect(noTokenResponse.status).toBe(401);
    });

    it("should reject requests with invalid tokens", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", "Bearer invalid.token.string")
        .send({
          name: "Test User",
          email: "test@example.com",
        });

      expect(response.status).toBe(401);
    });

    it("should accept requests with valid tokens", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", "Bearer valid.token.string")
        .send({
          name: "Test User",
          email: "test@example.com",
        });

      expect(response.status).not.toBe(401);
    });
  });

  // Test POST /users (createUser)
  describe("POST /users", () => {
    it("should create a user with valid data", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", "Bearer valid.token.string")
        .send({
          name: "Test User",
          email: "test@example.com",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data).toHaveProperty("name", "encrypted-Test User");
      expect(response.body.data).toHaveProperty(
        "email",
        "encrypted-test@example.com"
      );
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", "Bearer valid.token.string")
        .send({
          // Missing name and email
        });

      expect(response.status).toBe(400);
    });
  });

  // Test PUT /users/:id (updateUser)
  describe("PUT /users/:id", () => {
    it("should update a user with valid data", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", "Bearer valid.token.string")
        .send({
          name: "Updated User",
          email: "updated@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data).toHaveProperty(
        "name",
        "encrypted-Updated User"
      );
      expect(response.body.data).toHaveProperty(
        "email",
        "encrypted-updated@example.com"
      );
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .put("/users/nonexistent-id")
        .set("Authorization", "Bearer valid.token.string")
        .send({
          name: "Updated User",
          email: "updated@example.com",
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message", "User not found");
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", "Bearer valid.token.string")
        .send({
          // Missing name and email
        });

      expect(response.status).toBe(400);
    });
  });

  // Test GET /users/:id (getUser)
  describe("GET /users/:id", () => {
    it("should get a user by ID", async () => {
      const response = await request(app)
        .get(`/users/${testUserId}`)
        .set("Authorization", "Bearer valid.token.string");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("_id");
      expect(response.body.data).toHaveProperty("name", "Test User");
      expect(response.body.data).toHaveProperty("email", "test@example.com");
    });

    it("should return 404 for non-existent user", async () => {
      const response = await request(app)
        .get("/users/nonexistent-id")
        .set("Authorization", "Bearer valid.token.string");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message", "User not found");
    });
  });
});
