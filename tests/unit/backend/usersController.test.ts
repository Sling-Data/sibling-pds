import { Request, Response } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Document } from "mongoose";
import {
  createUser,
  getUser,
  updateUser,
} from "@backend/controllers/usersController";
import UserModel from "@backend/models/UserModel";
import * as encryption from "@backend/utils/encryption";
import { AppError } from "@backend/middleware/errorHandler";

// Types
interface UserRequest {
  name: string;
  email: string;
}

interface UserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  name: encryption.EncryptedData;
  email: encryption.EncryptedData;
}

interface RequestWithParams extends Request {
  params: { id: string };
}

interface RequestWithParamsAndBody extends RequestWithParams {
  body: UserRequest;
}

describe("Users Controller", () => {
  let mongoServer: MongoMemoryServer;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject = {};
  let consoleErrorSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeAll(async () => {
    // Mock console methods to suppress logs
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566";
  });

  afterAll(async () => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();

    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.ENCRYPTION_KEY;
  });

  beforeEach(() => {
    responseObject = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
  });

  describe("createUser", () => {
    it("should create a new user with valid data", async () => {
      const userData = { name: "Test User", email: "test@example.com" };
      mockRequest = {
        body: userData,
      };

      await createUser(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty("_id");
      expect(responseObject).toHaveProperty("name");
      expect(responseObject).toHaveProperty("email");
      expect(typeof (responseObject as any).name.iv).toBe("string");
      expect(typeof (responseObject as any).name.content).toBe("string");
    });

    it("should throw AppError when name is missing", async () => {
      mockRequest = {
        body: { email: "test@example.com" },
      };

      await expect(
        createUser(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Name and email are required", 400));
    });

    it("should throw AppError when email is missing", async () => {
      mockRequest = {
        body: { name: "Test User" },
      };

      await expect(
        createUser(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Name and email are required", 400));
    });
  });

  describe("getUser", () => {
    it("should return decrypted user data for valid ID", async () => {
      // Create a test user first
      const userData = { name: "Get User", email: "get@example.com" };
      const encryptedName = encryption.encrypt(userData.name);
      const encryptedEmail = encryption.encrypt(userData.email);
      const user = (await new UserModel({
        name: encryptedName,
        email: encryptedEmail,
      }).save()) as UserDocument;

      mockRequest = {
        params: { id: user._id.toString() },
      };

      await getUser(mockRequest as RequestWithParams, mockResponse as Response);

      expect(responseObject).toHaveProperty("_id");
      expect(responseObject).toHaveProperty("name", userData.name);
      expect(responseObject).toHaveProperty("email", userData.email);
    });

    it("should throw AppError for non-existent user", async () => {
      mockRequest = {
        params: { id: new mongoose.Types.ObjectId().toString() },
      };

      await expect(
        getUser(mockRequest as RequestWithParams, mockResponse as Response)
      ).rejects.toThrow(new AppError("User not found", 404));
    });
  });

  describe("updateUser", () => {
    it("should update user data with valid input", async () => {
      // Create a test user first
      const initialData = {
        name: "Initial User",
        email: "initial@example.com",
      };
      const encryptedName = encryption.encrypt(initialData.name);
      const encryptedEmail = encryption.encrypt(initialData.email);
      const user = (await new UserModel({
        name: encryptedName,
        email: encryptedEmail,
      }).save()) as UserDocument;

      const updateData = { name: "Updated User", email: "updated@example.com" };
      mockRequest = {
        params: { id: user._id.toString() },
        body: updateData,
      };

      await updateUser(
        mockRequest as RequestWithParamsAndBody,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty("_id");
      expect(responseObject).toHaveProperty("name");
      expect(responseObject).toHaveProperty("email");

      // Verify the data is encrypted
      expect(typeof (responseObject as any).name.iv).toBe("string");
      expect(typeof (responseObject as any).name.content).toBe("string");

      // Verify we can decrypt it back
      const decryptedName = encryption.decrypt((responseObject as any).name);
      const decryptedEmail = encryption.decrypt((responseObject as any).email);
      expect(decryptedName).toBe(updateData.name);
      expect(decryptedEmail).toBe(updateData.email);
    });

    it("should throw AppError when updating non-existent user", async () => {
      mockRequest = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        body: { name: "Test User", email: "test@example.com" },
      };

      await expect(
        updateUser(
          mockRequest as RequestWithParamsAndBody,
          mockResponse as Response
        )
      ).rejects.toThrow(new AppError("User not found", 404));
    });

    it("should throw AppError when update data is invalid", async () => {
      const user = (await new UserModel({
        name: encryption.encrypt("Test User"),
        email: encryption.encrypt("test@example.com"),
      }).save()) as UserDocument;

      mockRequest = {
        params: { id: user._id.toString() },
        body: { name: "" }, // Missing email
      };

      await expect(
        updateUser(
          mockRequest as RequestWithParamsAndBody,
          mockResponse as Response
        )
      ).rejects.toThrow(new AppError("Name and email are required", 400));
    });
  });
});
