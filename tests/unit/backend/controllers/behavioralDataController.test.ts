import { Request, Response } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Document, Types } from "mongoose";
import { ParamsDictionary } from "express-serve-static-core";
import {
  createBehavioralData,
  getBehavioralData,
  getUserBehavioralData,
} from "@backend/controllers/behavioralDataController";
import BehavioralDataModel from "@backend/models/BehavioralDataModel";
import UserModel from "@backend/models/UserModel";
import * as encryption from "@backend/utils/encryption";
import { AppError } from "@backend/middleware/errorHandler";
import { hashPassword } from "@backend/utils/userUtils";

// Types
interface BehavioralDataRequest {
  userId: string;
  action: string;
  context: any;
}

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

// Define param interfaces to match controller
interface GetBehavioralDataParams extends ParamsDictionary {
  id: string;
}

interface GetUserBehavioralDataParams extends ParamsDictionary {
  userId: string;
}

describe("Behavioral Data Controller", () => {
  let mongoServer: MongoMemoryServer;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseObject: any = {};
  let testUserId: string;

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up encryption key for tests
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566"; // 32-byte hex key
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.ENCRYPTION_KEY;
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

    // Set up mock request and response
    responseObject = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
        return mockResponse;
      }),
    };
  });

  describe("createBehavioralData", () => {
    it("should create behavioral data with valid input", async () => {
      const behavioralDataInput: BehavioralDataRequest = {
        userId: testUserId,
        action: "login",
        context: { device: "desktop", browser: "chrome" },
      };

      mockRequest = {
        body: behavioralDataInput,
      };

      await createBehavioralData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(responseObject).toHaveProperty("_id");
      expect(responseObject.userId.toString()).toBe(testUserId);
      expect(responseObject).toHaveProperty("action", "login");
      expect(responseObject).toHaveProperty("context");
      expect(responseObject.context).toHaveProperty("iv");
      expect(responseObject.context).toHaveProperty("content");

      // Verify user has been updated with reference
      const updatedUser = (await UserModel.findById(
        testUserId
      )) as UserDocument;
      expect(updatedUser?.behavioralData).toHaveLength(1);
      expect(updatedUser?.behavioralData[0].toString()).toBe(
        responseObject._id.toString()
      );
    });

    it("should throw error for missing required fields", async () => {
      const invalidInput = {
        userId: testUserId,
        // Missing action and context
      };

      mockRequest = {
        body: invalidInput,
      };

      await expect(
        createBehavioralData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);

      try {
        await createBehavioralData(
          mockRequest as Request,
          mockResponse as Response
        );
      } catch (error) {
        if (error instanceof AppError) {
          expect(error.message).toBe(
            "userId, action, and context are required"
          );
          expect(error.statusCode).toBe(400);
        }
      }
    });

    it("should throw error for non-existent user", async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();
      const invalidInput = {
        userId: nonExistentUserId,
        action: "login",
        context: { device: "desktop" },
      };

      mockRequest = {
        body: invalidInput,
      };

      await expect(
        createBehavioralData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(AppError);

      try {
        await createBehavioralData(
          mockRequest as Request,
          mockResponse as Response
        );
      } catch (error) {
        if (error instanceof AppError) {
          expect(error.message).toBe("User not found");
          expect(error.statusCode).toBe(404);
        }
      }
    });
  });

  describe("getBehavioralData", () => {
    it("should retrieve behavioral data by ID", async () => {
      // Create behavioral data first
      const context = { device: "desktop", browser: "chrome" };
      const encryptedContext = encryption.encrypt(JSON.stringify(context));

      const behavioralData = (await BehavioralDataModel.create({
        userId: testUserId,
        action: "login",
        context: encryptedContext,
      })) as BehavioralDataDocument;

      const user = (await UserModel.findById(testUserId)) as UserDocument;
      user?.behavioralData.push(behavioralData._id);
      await user?.save();

      const req = {
        params: { id: behavioralData._id.toString() },
      } as unknown as Request<GetBehavioralDataParams>;

      await getBehavioralData(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(responseObject).toHaveProperty("_id");
      expect(responseObject.userId.toString()).toBe(testUserId);
      expect(responseObject).toHaveProperty("action", "login");
      expect(responseObject).toHaveProperty("context");
      expect(responseObject.context).toEqual(context);
    });

    it("should throw error for non-existent behavioral data", async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const req = {
        params: { id: nonExistentId },
      } as unknown as Request<GetBehavioralDataParams>;

      await expect(
        getBehavioralData(req, mockResponse as Response)
      ).rejects.toThrow(AppError);

      try {
        await getBehavioralData(req, mockResponse as Response);
      } catch (error) {
        if (error instanceof AppError) {
          expect(error.message).toBe("Behavioral data not found");
          expect(error.statusCode).toBe(404);
        }
      }
    });
  });

  describe("getUserBehavioralData", () => {
    it("should retrieve all behavioral data for a user", async () => {
      // Create multiple behavioral data entries
      const context1 = { device: "desktop", browser: "chrome" };
      const context2 = { device: "mobile", browser: "safari" };

      const encryptedContext1 = encryption.encrypt(JSON.stringify(context1));
      const encryptedContext2 = encryption.encrypt(JSON.stringify(context2));

      const behavioralData1 = (await BehavioralDataModel.create({
        userId: testUserId,
        action: "login",
        context: encryptedContext1,
      })) as BehavioralDataDocument;

      const behavioralData2 = (await BehavioralDataModel.create({
        userId: testUserId,
        action: "search",
        context: encryptedContext2,
      })) as BehavioralDataDocument;

      const user = (await UserModel.findById(testUserId)) as UserDocument;
      user?.behavioralData.push(behavioralData1._id, behavioralData2._id);
      await user?.save();

      const req = {
        params: { userId: testUserId },
      } as unknown as Request<GetUserBehavioralDataParams>;

      await getUserBehavioralData(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(Array.isArray(responseObject)).toBe(true);
      expect(responseObject).toHaveLength(2);

      // Check first entry
      expect(responseObject[0]).toHaveProperty("action", "login");
      expect(responseObject[0]).toHaveProperty("context");
      expect(responseObject[0].context).toEqual(context1);

      // Check second entry
      expect(responseObject[1]).toHaveProperty("action", "search");
      expect(responseObject[1]).toHaveProperty("context");
      expect(responseObject[1].context).toEqual(context2);
    });

    it("should throw error for non-existent user", async () => {
      const nonExistentUserId = new mongoose.Types.ObjectId().toString();

      const req = {
        params: { userId: nonExistentUserId },
      } as unknown as Request<GetUserBehavioralDataParams>;

      await expect(
        getUserBehavioralData(req, mockResponse as Response)
      ).rejects.toThrow(AppError);

      try {
        await getUserBehavioralData(req, mockResponse as Response);
      } catch (error) {
        if (error instanceof AppError) {
          expect(error.message).toBe("User not found");
          expect(error.statusCode).toBe(404);
        }
      }
    });

    it("should return empty array for user with no behavioral data", async () => {
      const req = {
        params: { userId: testUserId },
      } as unknown as Request<GetUserBehavioralDataParams>;

      await getUserBehavioralData(req, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(Array.isArray(responseObject)).toBe(true);
      expect(responseObject).toHaveLength(0);
    });
  });
});
