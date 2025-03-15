import request from "supertest";
import express, { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import authRouter from "@backend/routes/authRoutes";
import { errorHandler } from "@backend/middleware/errorHandler";
import * as encryption from "@backend/utils/encryption";
import UserModel from "@backend/models/UserModel";
import { hashPassword } from "@backend/utils/userUtils";
import * as auth from "@backend/middleware/auth";
import * as authController from "@backend/controllers/authController";

// Mock dependencies
jest.mock("@backend/middleware/auth");
jest.mock("@backend/utils/encryption");
jest.mock("@backend/utils/userUtils");
jest.mock("@backend/models/UserModel");
jest.mock("@backend/controllers/authController");

describe("Auth Routes", () => {
  let app: Express;
  let mongoServer: MongoMemoryServer;
  let testUserId: string;
  let email: string;

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
    app.use("/auth", authRouter.publicRouter);
    app.use("/auth", authRouter.protectedRouter);
    app.use(errorHandler);

    // Mock auth functions
    (auth.generateToken as jest.Mock).mockReturnValue("mock-token");
    (auth.generateRefreshToken as jest.Mock).mockReturnValue(
      "mock-refresh-token"
    );
    (auth.refreshAccessToken as jest.Mock).mockReturnValue({
      accessToken: "new-mock-token",
      refreshToken: "new-mock-refresh-token",
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.ENCRYPTION_KEY;
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    // Clear mocks
    jest.clearAllMocks();

    // Create a test user
    const encryptedName = "encrypted-name";
    const encryptedEmail = "encrypted-email";
    email = "test@example.com";
    const hashedPassword = "hashed-password";
    const encryptedPassword = "encrypted-password";

    (encryption.encrypt as jest.Mock).mockImplementation((value) => {
      if (value === "Test User") return encryptedName;
      if (value === email) return encryptedEmail;
      if (value === hashedPassword) return encryptedPassword;
      return `encrypted-${value}`;
    });

    (encryption.decrypt as jest.Mock).mockImplementation((value) => {
      if (value === encryptedName) return "Test User";
      if (value === encryptedEmail) return email;
      if (value === encryptedPassword) return hashedPassword;
      return value;
    });

    (hashPassword as jest.Mock).mockResolvedValue(hashedPassword);

    const mockUser = {
      _id: new mongoose.Types.ObjectId(),
      name: encryptedName,
      email: encryptedEmail,
      password: encryptedPassword,
    };

    testUserId = mockUser._id.toString();

    // Mock UserModel.findById to return the mock user
    (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);
    (UserModel.find as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });
    (UserModel.create as jest.Mock).mockResolvedValue(mockUser);

    // Mock controller functions to simulate successful responses
    (authController.login as jest.Mock).mockImplementation((_req, res) => {
      res.json({
        token: "mock-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 3600,
      });
    });

    (authController.signup as jest.Mock).mockImplementation((_req, res) => {
      res.status(201).json({
        token: "mock-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 3600,
      });
    });

    (authController.refreshToken as jest.Mock).mockImplementation(
      (_req, res) => {
        res.json({
          data: {
            accessToken: "new-mock-token",
            refreshToken: "new-mock-refresh-token",
            message: "Token refreshed successfully",
          },
        });
      }
    );
  });

  describe("POST /auth/login", () => {
    it("should login a user with valid credentials", async () => {
      const response = await request(app).post("/auth/login").send({
        email,
        password: "correctPassword",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token", "mock-token");
      expect(response.body).toHaveProperty(
        "refreshToken",
        "mock-refresh-token"
      );
      expect(response.body).toHaveProperty("expiresIn", 3600);
    });

    it("should return 401 for invalid credentials", async () => {
      // Mock controller to throw an error
      (authController.login as jest.Mock).mockImplementation((_req, res) => {
        res.status(401).json({
          status: "error",
          message: "Invalid credentials",
        });
      });

      const response = await request(app).post("/auth/login").send({
        email: "nonexistent@email.com",
        password: "password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app).post("/auth/login").send({
        // Missing userId and password
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/signup", () => {
    it("should create a new user with valid data", async () => {
      const response = await request(app).post("/auth/signup").send({
        name: "New User",
        email: "new@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token", "mock-token");
      expect(response.body).toHaveProperty(
        "refreshToken",
        "mock-refresh-token"
      );
      expect(response.body).toHaveProperty("expiresIn", 3600);
    });

    it("should return 400 for email already in use", async () => {
      // Mock controller to throw an error
      (authController.signup as jest.Mock).mockImplementation((_req, res) => {
        res.status(400).json({
          status: "error",
          message: "Email already in use",
        });
      });

      const response = await request(app).post("/auth/signup").send({
        name: "New User",
        email: "test@example.com", // Same as mock user
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message", "Email already in use");
    });

    it("should return 400 for missing required fields", async () => {
      const response = await request(app).post("/auth/signup").send({
        // Missing name, email, and password
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/refresh-token", () => {
    it("should refresh tokens with valid refresh token", async () => {
      const response = await request(app).post("/auth/refresh-token").send({
        refreshToken: "valid-refresh-token",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty(
        "accessToken",
        "new-mock-token"
      );
      expect(response.body.data).toHaveProperty(
        "refreshToken",
        "new-mock-refresh-token"
      );
      expect(response.body.data).toHaveProperty(
        "message",
        "Token refreshed successfully"
      );
    });

    it("should return 401 for invalid refresh token", async () => {
      // Mock controller to throw an error
      (authController.refreshToken as jest.Mock).mockImplementation(
        (_req, res) => {
          res.status(401).json({
            status: "error",
            message: "Invalid refresh token",
          });
        }
      );

      const response = await request(app).post("/auth/refresh-token").send({
        refreshToken: "invalid-refresh-token",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("status", "error");
      expect(response.body).toHaveProperty("message", "Invalid refresh token");
    });

    it("should return 400 for missing refresh token", async () => {
      const response = await request(app).post("/auth/refresh-token").send({
        // Missing refreshToken
      });

      expect(response.status).toBe(400);
    });
  });
});
