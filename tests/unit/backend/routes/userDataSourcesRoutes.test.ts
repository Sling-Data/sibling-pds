import request from "supertest";
import express, { Express, NextFunction, Request, Response } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Document } from "mongoose";
import userDataSourcesRouter from "@backend/routes/userDataSourcesRoutes";
import { errorHandler } from "@backend/middleware/errorHandler";
import { hashPassword } from "@backend/utils/userUtils";
import * as encryption from "@backend/utils/encryption";
import UserModel from "@backend/models/UserModel";
import { DataSourceType } from "@backend/models/UserDataSourcesModel";
import UserDataSourcesModel from "@backend/models/UserDataSourcesModel";

// Mock UserDataSourcesModel
jest.mock("@backend/models/UserDataSourcesModel");

// Define interface for User Document
interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: any;
  email: any;
  password: any;
}

describe("User Data Sources Routes", () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let testUserId: string;
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

    app.use("/user-data-sources", userDataSourcesRouter);
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

    const user = (await UserModel.create({
      name: encryptedName,
      email: encryptedEmail,
      password: encryptedPassword,
    })) as UserDocument;

    testUserId = user._id.toString();

    // Create test tokens
    validToken = "valid.token.string";
    invalidToken = "invalid.token.string";

    // Mock UserDataSourcesModel.getCredentials to return a valid response
    (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue({
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiry: new Date().toISOString(),
    });
  });

  // Test route authentication
  describe("Route Authentication", () => {
    it("should require authentication for protected routes", async () => {
      // Test without token
      const noTokenResponse = await request(app)
        .post("/user-data-sources")
        .send({
          userId: testUserId,
          dataSourceType: DataSourceType.GMAIL,
          credentials: {
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiry: new Date().toISOString(),
          },
        });

      expect(noTokenResponse.status).toBe(401);
    });

    it("should reject requests with invalid tokens", async () => {
      const response = await request(app)
        .post("/user-data-sources")
        .set("Authorization", `Bearer ${invalidToken}`)
        .send({
          userId: testUserId,
          dataSourceType: DataSourceType.GMAIL,
          credentials: {
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiry: new Date().toISOString(),
          },
        });

      expect(response.status).toBe(401);
    });

    it("should accept requests with valid tokens", async () => {
      const response = await request(app)
        .post("/user-data-sources")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          userId: testUserId,
          dataSourceType: DataSourceType.GMAIL,
          credentials: {
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiry: new Date().toISOString(),
          },
        });

      expect(response.status).not.toBe(401);
    });
  });

  // Test basic route functionality (smoke test)
  describe("Route Registration", () => {
    it("should have POST endpoint registered", async () => {
      // Test POST endpoint
      const response = await request(app)
        .post("/user-data-sources")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          userId: testUserId,
          dataSourceType: DataSourceType.GMAIL,
          credentials: {
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiry: new Date().toISOString(),
          },
        });

      // Verify endpoint is registered (not 404)
      expect(response.status).not.toBe(404);
    });

    it("should have GET endpoint registered", async () => {
      // Test GET endpoint with correct path format
      const response = await request(app)
        .get(`/user-data-sources/${testUserId}/${DataSourceType.GMAIL}`)
        .set("Authorization", `Bearer ${validToken}`);

      // Verify endpoint is registered (not 404)
      expect(response.status).not.toBe(404);
    });
  });
});
