import { Request, Response } from "express";
import {
  storeCredentials,
  getCredentials,
} from "@backend/controllers/userDataSourcesController";
import UserDataSourcesModel, {
  DataSourceType,
} from "@backend/models/UserDataSourcesModel";
import { AppError } from "@backend/middleware/errorHandler";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from "../../helpers/testSetup";

// Mock dependencies
jest.mock("@backend/models/UserDataSourcesModel");
jest.mock("@backend/utils/ResponseHandler");

describe("User Data Sources Controller", () => {
  let testEnv: { mongoServer: any; mongoUri: string };
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockDataSource: any;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment(testEnv);
  });

  beforeEach(() => {
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    mockDataSource = {
      _id: "data-source-id",
      userId: "test-user-id",
      dataSourceType: DataSourceType.GMAIL,
      credentials: {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
        expiry: new Date().toISOString(),
      },
      lastIngestedAt: new Date(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("storeCredentials", () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          userId: "test-user-id",
          dataSourceType: DataSourceType.GMAIL,
          credentials: {
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiry: new Date().toISOString(),
          },
        },
      };

      // Mock UserDataSourcesModel.storeCredentials
      (UserDataSourcesModel.storeCredentials as jest.Mock).mockResolvedValue(
        mockDataSource
      );
    });

    it("should store credentials successfully", async () => {
      await storeCredentials(mockRequest as Request, mockResponse as Response);

      expect(UserDataSourcesModel.storeCredentials).toHaveBeenCalledWith(
        "test-user-id",
        DataSourceType.GMAIL,
        expect.objectContaining({
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
        })
      );

      expect(ResponseHandler.success).toHaveBeenCalledWith(
        mockResponse,
        {
          _id: mockDataSource._id,
          userId: mockDataSource.userId,
          dataSourceType: mockDataSource.dataSourceType,
          lastIngestedAt: mockDataSource.lastIngestedAt,
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
        storeCredentials(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError(
          "userId, dataSourceType, and credentials are required",
          400
        )
      );
    });

    it("should throw error if dataSourceType is missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        dataSourceType: undefined,
      };

      await expect(
        storeCredentials(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError(
          "userId, dataSourceType, and credentials are required",
          400
        )
      );
    });

    it("should throw error if credentials are missing", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        credentials: undefined,
      };

      await expect(
        storeCredentials(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError(
          "userId, dataSourceType, and credentials are required",
          400
        )
      );
    });

    it("should throw error if dataSourceType is invalid", async () => {
      mockRequest.body = {
        ...mockRequest.body,
        dataSourceType: "INVALID_TYPE",
      };

      await expect(
        storeCredentials(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(
        new AppError(
          "Invalid data source type. Must be one of: gmail, plaid",
          400
        )
      );
    });
  });

  describe("getCredentials", () => {
    beforeEach(() => {
      mockRequest = {
        params: {
          userId: "test-user-id",
          dataSourceType: DataSourceType.GMAIL,
        },
      };

      // Mock UserDataSourcesModel.getCredentials
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        mockDataSource.credentials
      );
    });

    it("should get credentials successfully", async () => {
      await getCredentials(
        mockRequest as Request<{ userId: string; dataSourceType: string }>,
        mockResponse as Response
      );

      expect(UserDataSourcesModel.getCredentials).toHaveBeenCalledWith(
        "test-user-id",
        DataSourceType.GMAIL
      );

      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        credentials: mockDataSource.credentials,
      });
    });

    it("should throw error if dataSourceType is invalid", async () => {
      mockRequest.params = {
        ...mockRequest.params,
        dataSourceType: "INVALID_TYPE",
      };

      await expect(
        getCredentials(
          mockRequest as Request<{ userId: string; dataSourceType: string }>,
          mockResponse as Response
        )
      ).rejects.toThrow(
        new AppError(
          "Invalid data source type. Must be one of: gmail, plaid",
          400
        )
      );
    });

    it("should throw error if credentials are not found", async () => {
      // Mock UserDataSourcesModel.getCredentials to return null
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        null
      );

      await expect(
        getCredentials(
          mockRequest as Request<{ userId: string; dataSourceType: string }>,
          mockResponse as Response
        )
      ).rejects.toThrow(
        new AppError(
          "No credentials found for user test-user-id and data source gmail",
          404
        )
      );
    });
  });
});
