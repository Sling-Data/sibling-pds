import { Request, Response } from "express";
import { getUserData } from "@backend/controllers/userDataController";
import UserModel from "@backend/models/UserModel";
import { AppError } from "@backend/middleware/errorHandler";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import * as encryption from "@backend/utils/encryption";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from "../../helpers/testSetup";

// Mock dependencies
jest.mock("@backend/models/UserModel");
jest.mock("@backend/utils/ResponseHandler");
jest.mock("@backend/utils/encryption");

describe("User Data Controller", () => {
  let testEnv: { mongoServer: any; mongoUri: string };
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockUser: any;
  let mockVolunteeredData: any[];
  let mockBehavioralData: any[];
  let mockExternalData: any[];

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment(testEnv);
  });

  beforeEach(() => {
    mockRequest = {
      params: { id: "test-user-id" },
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Mock user data
    mockVolunteeredData = [
      {
        _id: "vol-data-1",
        type: "personal",
        value: { iv: "iv", content: "encrypted-value" },
      },
    ];

    mockBehavioralData = [
      {
        _id: "beh-data-1",
        action: "login",
        context: { iv: "iv", content: "encrypted-context" },
      },
    ];

    mockExternalData = [
      {
        _id: "ext-data-1",
        source: "api",
        data: { iv: "iv", content: "encrypted-data" },
      },
    ];

    mockUser = {
      _id: "test-user-id",
      name: { iv: "iv", content: "encrypted-name" },
      email: { iv: "iv", content: "encrypted-email" },
      volunteeredData: mockVolunteeredData,
      behavioralData: mockBehavioralData,
      externalData: mockExternalData,
    };

    // Mock UserModel.findById
    (UserModel.findById as jest.Mock).mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockUser),
        }),
      }),
    });

    // Mock encryption.decrypt
    (encryption.decrypt as jest.Mock).mockImplementation((data) => {
      if (data === mockUser.name) return "Test User";
      if (data === mockUser.email) return "test@example.com";
      if (data === mockVolunteeredData[0].value) return "test-value";
      if (data === mockBehavioralData[0].context)
        return JSON.stringify({ device: "desktop" });
      if (data === mockExternalData[0].data)
        return JSON.stringify({ key: "value" });
      return "decrypted-data";
    });

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("getUserData", () => {
    it("should get user data with decrypted values", async () => {
      await getUserData(
        mockRequest as Request<{ id: string }>,
        mockResponse as Response
      );

      expect(UserModel.findById).toHaveBeenCalledWith("test-user-id");
      expect(encryption.decrypt).toHaveBeenCalledWith(mockUser.name);
      expect(encryption.decrypt).toHaveBeenCalledWith(mockUser.email);
      expect(encryption.decrypt).toHaveBeenCalledWith(
        mockVolunteeredData[0].value
      );
      expect(encryption.decrypt).toHaveBeenCalledWith(
        mockBehavioralData[0].context
      );
      expect(encryption.decrypt).toHaveBeenCalledWith(mockExternalData[0].data);

      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        user: {
          _id: "test-user-id",
          name: "Test User",
          email: "test@example.com",
        },
        volunteeredData: [
          {
            _id: "vol-data-1",
            type: "personal",
            value: "test-value",
          },
        ],
        behavioralData: [
          {
            _id: "beh-data-1",
            action: "login",
            context: { device: "desktop" },
          },
        ],
        externalData: [
          {
            _id: "ext-data-1",
            source: "api",
            data: { key: "value" },
          },
        ],
      });
    });

    it("should throw error if user not found", async () => {
      // Mock UserModel.findById to return null
      (UserModel.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      await expect(
        getUserData(
          mockRequest as Request<{ id: string }>,
          mockResponse as Response
        )
      ).rejects.toThrow(new AppError("User not found", 404));
    });
  });
});
