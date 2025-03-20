import request from "supertest";
import express, { Express, NextFunction, Request, Response } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import api from "@backend/routes/apiClientRoutes";
import { errorHandler } from "@backend/middleware/errorHandler";
import { hashPassword } from "@backend/utils/userUtils";
import * as encryption from "@backend/utils/encryption";
import UserModel from "@backend/models/UserModel";
describe("API Routes", () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let validToken: string;
  let invalidToken: string;

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

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up encryption key for tests
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566"; // 32-byte hex key
    process.env.JWT_SECRET = "test-jwt-secret";

    // Set up Express app with routes
    app = express();
    app.use(express.json());

    // Apply mock authentication middleware
    app.use(mockAuth);

    app.use("/api", api.protectedRouter);
    app.use("/api", api.publicRouter);
    app.use(errorHandler);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.ENCRYPTION_KEY;
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    // Clear database collections
    await UserModel.deleteMany({});

    // Create a test user
    const encryptedName = encryption.encrypt("Test User");
    const encryptedEmail = encryption.encrypt("test@example.com");

    // Create a hashed and encrypted password
    const hashedPassword = await hashPassword("testPassword123");
    const encryptedPassword = encryption.encrypt(hashedPassword);

    await UserModel.create({
      name: encryptedName,
      email: encryptedEmail,
      password: encryptedPassword,
    });

    // Create test tokens
    validToken = "valid.token.string";
    invalidToken = "invalid.token.string";
  });

  // Test route authentication
  describe("Route Authentication", () => {
    it("should require authentication for protected routes", async () => {
      // Test without token
      const noTokenResponse = await request(app).get(`/api/gmail/auth`);

      expect(noTokenResponse.status).toBe(401);
    });

    it("should reject requests with invalid tokens", async () => {
      const response = await request(app)
        .get(`/api/gmail/auth`)
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it("should accept requests with valid tokens", async () => {
      const response = await request(app)
        .get(`/api/gmail/auth`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).not.toBe(401);
    });
  });

  // Test basic route functionality (smoke test)
  describe("Route Registration", () => {
    it("should have Gmail endpoints registered", async () => {
      // Test Gmail auth endpoint
      const gmailAuthResponse = await request(app)
        .get("/api/gmail")
        .set("Authorization", `Bearer ${validToken}`);

      // Verify endpoint is registered (not 404)
      expect(gmailAuthResponse.status).not.toBe(404);
    });

    it("should have Plaid endpoints registered", async () => {
      // Test Plaid auth endpoint
      const plaidAuthResponse = await request(app)
        .get("/api/plaid")
        .set("Authorization", `Bearer ${validToken}`);

      // Test Plaid create link token endpoint
      const createLinkTokenResponse = await request(app)
        .get("/api/plaid/create-link-token?userId=test-user-id")
        .set("Authorization", `Bearer ${validToken}`);

      // Test Plaid exchange public token endpoint
      const exchangeTokenResponse = await request(app)
        .post("/api/plaid/exchange-public-token")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          public_token: "test-public-token",
          userId: "test-user-id",
        });

      // Verify endpoints are registered (not 404)
      expect(plaidAuthResponse.status).not.toBe(404);
      expect(createLinkTokenResponse.status).not.toBe(404);
      expect(exchangeTokenResponse.status).not.toBe(404);
    });
  });
});
