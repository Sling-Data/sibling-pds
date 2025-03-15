import { Request, Response } from "express";
import { createExternalData } from "@backend/controllers/externalDataController";
import ExternalData from "@backend/models/ExternalDataModel";
import UserModel from "@backend/models/UserModel";
import { AppError } from "@backend/middleware/errorHandler";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import * as encryption from "@backend/utils/encryption";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from "../../helpers/testSetup";

// Mock dependencies
jest.mock("@backend/models/ExternalDataModel");
jest.mock("@backend/models/UserModel");
jest.mock("@backend/utils/ResponseHandler");
jest.mock("@backend/utils/encryption");

describe("External Data Controller", () => {
  let testEnv: { mongoServer: any; mongoUri: string };
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockExternalData: any;
  let mockEncryptedData: any;
  let mockUser: any;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment(testEnv);
  });

  beforeEach(() => {
    mockRequest = {
      body: {
        userId: "test-user-id",
        source: "api",
        data: { key: "value" },
      },
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockEncryptedData = { iv: "iv", content: "encrypted-data" };
    mockExternalData = {
      _id: "ext-data-id",
      userId: "test-user-id",
      source: "api",
      data: mockEncryptedData,
    };

    mockUser = {
      _id: "test-user-id",
      externalData: [],
      save: jest.fn().mockResolvedValue({
        _id: "test-user-id",
        externalData: ["ext-data-id"],
      }),
    };

    // Mock encryption.encrypt
    (encryption.encrypt as jest.Mock).mockReturnValue(mockEncryptedData);

    // Mock ExternalData.create
    (ExternalData.create as jest.Mock).mockResolvedValue(mockExternalData);

    // Mock UserModel.findById
    (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("createExternalData", () => {
    it("should create external data successfully", async () => {
      await createExternalData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(UserModel.findById).toHaveBeenCalledWith("test-user-id");
      expect(encryption.encrypt).toHaveBeenCalledWith(
        JSON.stringify({ key: "value" })
      );
      expect(ExternalData.create).toHaveBeenCalledWith({
        userId: "test-user-id",
        source: "api",
        data: mockEncryptedData,
      });
      expect(mockUser.externalData).toContain(mockExternalData._id);
      expect(mockUser.save).toHaveBeenCalled();
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        mockExternalData,
        201
      );
    });

    it("should throw error if userId is missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        userId: undefined,
      };

      await expect(
        createExternalData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError("userId, source, and data are required", 400)
      );
    });

    it("should throw error if source is missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        source: undefined,
      };

      await expect(
        createExternalData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError("userId, source, and data are required", 400)
      );
    });

    it("should throw error if data is missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        data: undefined,
      };

      await expect(
        createExternalData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError("userId, source, and data are required", 400)
      );
    });

    it("should throw error if user is not found", async () => {
      // Mock UserModel.findById to return null
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        createExternalData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("User not found", 404));
    });
  });
});
