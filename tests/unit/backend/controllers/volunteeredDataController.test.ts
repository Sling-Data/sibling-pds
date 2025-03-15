import { Request, Response } from "express";
import { createVolunteeredData } from "@backend/controllers/volunteeredDataController";
import VolunteeredData from "@backend/models/VolunteeredDataModel";
import UserModel from "@backend/models/UserModel";
import { AppError } from "@backend/middleware/errorHandler";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import * as encryption from "@backend/utils/encryption";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from "../../helpers/testSetup";

// Mock dependencies
jest.mock("@backend/models/VolunteeredDataModel");
jest.mock("@backend/models/UserModel");
jest.mock("@backend/utils/ResponseHandler");
jest.mock("@backend/utils/encryption");

describe("Volunteered Data Controller", () => {
  let testEnv: { mongoServer: any; mongoUri: string };
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockVolunteeredData: any;
  let mockEncryptedValue: any;

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
        type: "personal",
        value: "test-value",
      },
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockEncryptedValue = { iv: "iv", content: "encrypted-value" };
    mockVolunteeredData = {
      _id: "vol-data-id",
      userId: "test-user-id",
      type: "personal",
      value: mockEncryptedValue,
      save: jest.fn().mockResolvedValue({
        _id: "vol-data-id",
        userId: "test-user-id",
        type: "personal",
        value: mockEncryptedValue,
      }),
    };

    // Mock encryption.encrypt
    (encryption.encrypt as jest.Mock).mockReturnValue(mockEncryptedValue);

    // Mock VolunteeredData constructor
    (VolunteeredData as unknown as jest.Mock).mockImplementation(
      () => mockVolunteeredData
    );

    // Mock UserModel.findByIdAndUpdate
    (UserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      _id: "test-user-id",
      volunteeredData: ["vol-data-id"],
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("createVolunteeredData", () => {
    it("should create volunteered data successfully", async () => {
      await createVolunteeredData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(encryption.encrypt).toHaveBeenCalledWith(
        JSON.stringify("test-value")
      );
      expect(VolunteeredData).toHaveBeenCalledWith({
        userId: "test-user-id",
        type: "personal",
        value: mockEncryptedValue,
      });
      expect(mockVolunteeredData.save).toHaveBeenCalled();
      expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith("test-user-id", {
        $push: { volunteeredData: "vol-data-id" },
      });
      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        {
          _id: "vol-data-id",
          type: "personal",
          userId: "test-user-id",
          value: mockEncryptedValue,
        },
        201
      );
    });

    it("should throw error if userId is missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        userId: undefined,
      };

      await expect(
        createVolunteeredData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError("userId, type, and value are required", 400)
      );
    });

    it("should throw error if type is missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        type: undefined,
      };

      await expect(
        createVolunteeredData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError("userId, type, and value are required", 400)
      );
    });

    it("should throw error if value is missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        value: undefined,
      };

      await expect(
        createVolunteeredData(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError("userId, type, and value are required", 400)
      );
    });
  });
});
