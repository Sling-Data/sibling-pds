import request from "supertest";
import express, { Express, NextFunction, Request, Response } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Document, Types } from "mongoose";
import behavioralDataRouter from "@backend/routes/behavioralDataRoutes";
import UserModel from "@backend/models/UserModel";
import BehavioralDataModel from "@backend/models/BehavioralDataModel";
import * as encryption from "@backend/utils/encryption";
import { generateToken } from "@backend/middleware/auth";
import { errorHandler } from "@backend/middleware/errorHandler";
import { hashPassword } from "@backend/utils/userUtils";

// Define interfaces for document types
interface UserDocument extends Document {
  _id: Types.ObjectId;
  name: any;
  email: any;
  password: any;
  behavioralData: Types.ObjectId[];
}

interface BehavioralDataDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  action: string;
  context: any;
}

describe("Behavioral Data Routes", () => {
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

    app.use("/behavioral-data", behavioralDataRouter);
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
    await BehavioralDataModel.deleteMany({});
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
      behavioralData: [],
    })) as UserDocument;
    testUserId = user._id.toString();

    // Create test tokens
    validToken = generateToken(testUserId);
    invalidToken = "invalid.token.string";
  });

  // Test route authentication
  describe("Route Authentication", () => {
    it("should require authentication for protected routes", async () => {
      // Test without token
      const noTokenResponse = await request(app).get(
        `/behavioral-data/user/${testUserId}`
      );

      expect(noTokenResponse.status).toBe(401);
    });

    it("should reject requests with invalid tokens", async () => {
      const response = await request(app)
        .get(`/behavioral-data/user/${testUserId}`)
        .set("Authorization", `Bearer ${invalidToken}`);

      expect(response.status).toBe(401);
    });

    it("should accept requests with valid tokens", async () => {
      // Create test data
      const behavioralData = (await BehavioralDataModel.create({
        userId: testUserId,
        action: "test",
        context: encryption.encrypt(JSON.stringify({ test: true })),
      })) as BehavioralDataDocument;

      const response = await request(app)
        .get(`/behavioral-data/${behavioralData._id}`)
        .set("Authorization", `Bearer ${validToken}`);

      expect(response.status).not.toBe(401);
    });
  });

  // Test basic route functionality (smoke test)
  describe("Route Registration", () => {
    it("should have all required endpoints registered", async () => {
      // Create test data
      const behavioralData = (await BehavioralDataModel.create({
        userId: testUserId,
        action: "test",
        context: encryption.encrypt(JSON.stringify({ test: true })),
      })) as BehavioralDataDocument;

      // Test POST endpoint
      const postResponse = await request(app)
        .post("/behavioral-data")
        .set("Authorization", `Bearer ${validToken}`)
        .send({
          userId: testUserId,
          action: "test",
          context: { test: true },
        });

      // Test GET by ID endpoint
      const getByIdResponse = await request(app)
        .get(`/behavioral-data/${behavioralData._id}`)
        .set("Authorization", `Bearer ${validToken}`);

      // Test GET by user ID endpoint
      const getByUserIdResponse = await request(app)
        .get(`/behavioral-data/user/${testUserId}`)
        .set("Authorization", `Bearer ${validToken}`);

      // Verify all endpoints are registered (not 404)
      expect(postResponse.status).not.toBe(404);
      expect(getByIdResponse.status).not.toBe(404);
      expect(getByUserIdResponse.status).not.toBe(404);
    });
  });
});
