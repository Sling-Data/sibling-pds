import { Request, Response } from "express";
import {
  gmailAuth,
  gmailCallback,
  plaidAuth,
  plaidCallback,
  createLinkToken,
  exchangePublicToken,
} from "@backend/controllers/apiClientController";
import { OAuthHandler } from "@backend/services/OAuthHandler";
import gmailClient from "@backend/services/apiClients/gmailClient";
import plaidClient from "@backend/services/apiClients/plaidClient";
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
jest.mock("@backend/services/OAuthHandler");
jest.mock("@backend/services/apiClients/gmailClient");
jest.mock("@backend/services/apiClients/plaidClient");
jest.mock("@backend/models/UserDataSourcesModel");
jest.mock("@backend/utils/ResponseHandler");

describe("API Client Controller", () => {
  let testEnv: { mongoServer: any; mongoUri: string };
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment(testEnv);
  });

  beforeEach(() => {
    mockRequest = {
      userId: "test-user-id",
      query: {},
      body: {},
    };
    mockResponse = {
      redirect: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe("gmailAuth", () => {
    it("should generate auth URL and redirect", async () => {
      // Mock OAuthHandler.generateState
      (OAuthHandler.generateState as jest.Mock).mockReturnValue("mock-state");

      // Mock gmailClient.generateAuthUrl
      (gmailClient.generateAuthUrl as jest.Mock).mockReturnValue(
        "https://gmail-auth-url.com"
      );

      await gmailAuth(mockRequest as Request, mockResponse as Response);

      expect(OAuthHandler.generateState).toHaveBeenCalledWith(
        "test-user-id",
        "gmail"
      );
      expect(gmailClient.generateAuthUrl).toHaveBeenCalledWith("mock-state");
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        "https://gmail-auth-url.com"
      );
    });

    it("should throw error if userId is not provided", async () => {
      mockRequest.userId = undefined;

      await expect(
        gmailAuth(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Authentication required", 401));
    });
  });

  describe("gmailCallback", () => {
    it("should handle successful callback", async () => {
      // Mock request query
      mockRequest.query = {
        code: "test-code",
        state: Buffer.from(
          JSON.stringify({ userId: "test-user-id", nonce: "test-nonce" })
        ).toString("base64"),
      };

      // Mock gmailClient.exchangeCodeForTokens
      const mockTokens = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expiry_date: new Date().getTime(),
      };
      (gmailClient.exchangeCodeForTokens as jest.Mock).mockResolvedValue(
        mockTokens
      );

      // Mock UserDataSourcesModel.storeCredentials
      (UserDataSourcesModel.storeCredentials as jest.Mock).mockResolvedValue(
        true
      );

      await gmailCallback(mockRequest as Request, mockResponse as Response);

      expect(gmailClient.exchangeCodeForTokens).toHaveBeenCalledWith(
        "test-code"
      );
      expect(UserDataSourcesModel.storeCredentials).toHaveBeenCalledWith(
        "test-user-id",
        DataSourceType.GMAIL,
        expect.objectContaining({
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
        })
      );
      expect(mockResponse.redirect).toHaveBeenCalled();
    });

    it("should handle popup request with successful callback", async () => {
      // Mock request query with popup flag in state
      mockRequest.query = {
        code: "test-code",
        state: Buffer.from(
          JSON.stringify({
            userId: "test-user-id",
            nonce: "test-nonce",
            popup: true,
          })
        ).toString("base64"),
      };

      // Add headers to the mock request
      mockRequest.headers = {
        "user-agent": "Mozilla/5.0 gmailAuthPopup",
      };

      // Mock gmailClient.exchangeCodeForTokens
      const mockTokens = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expiry_date: new Date().getTime(),
      };
      (gmailClient.exchangeCodeForTokens as jest.Mock).mockResolvedValue(
        mockTokens
      );

      // Mock UserDataSourcesModel.storeCredentials
      (UserDataSourcesModel.storeCredentials as jest.Mock).mockResolvedValue(
        true
      );

      // Mock response.send
      mockResponse.send = jest.fn();

      await gmailCallback(mockRequest as Request, mockResponse as Response);

      expect(gmailClient.exchangeCodeForTokens).toHaveBeenCalledWith(
        "test-code"
      );
      expect(UserDataSourcesModel.storeCredentials).toHaveBeenCalledWith(
        "test-user-id",
        DataSourceType.GMAIL,
        expect.objectContaining({
          accessToken: "test-access-token",
          refreshToken: "test-refresh-token",
        })
      );

      // Verify it sends HTML response instead of redirecting
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining("Authentication Successful")
      );
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it("should handle popup request with error", async () => {
      // Mock request query with popup flag
      mockRequest.query = {
        code: "test-code",
        popup: "true",
      };

      // Mock response.send
      mockResponse.send = jest.fn();

      await gmailCallback(mockRequest as Request, mockResponse as Response);

      // Verify it sends HTML response instead of redirecting
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining("Authentication Failed")
      );
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it("should handle popup request with user agent", async () => {
      // Mock request query without popup flag
      mockRequest.query = {
        code: "test-code",
        state: Buffer.from(
          JSON.stringify({ userId: "test-user-id", nonce: "test-nonce" })
        ).toString("base64"),
      };

      // Add headers to the mock request with gmailAuthPopup in user agent
      mockRequest.headers = {
        "user-agent": "Mozilla/5.0 gmailAuthPopup",
      };

      // Mock gmailClient.exchangeCodeForTokens
      const mockTokens = {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expiry_date: new Date().getTime(),
      };
      (gmailClient.exchangeCodeForTokens as jest.Mock).mockResolvedValue(
        mockTokens
      );

      // Mock UserDataSourcesModel.storeCredentials
      (UserDataSourcesModel.storeCredentials as jest.Mock).mockResolvedValue(
        true
      );

      // Mock response.send
      mockResponse.send = jest.fn();

      await gmailCallback(mockRequest as Request, mockResponse as Response);

      // Verify it sends HTML response instead of redirecting
      expect(mockResponse.send).toHaveBeenCalled();
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.stringContaining("Authentication Successful")
      );
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it("should handle missing code parameter", async () => {
      mockRequest.query = { state: "test-state" };
      mockRequest.headers = {}; // Add empty headers
      mockResponse.send = jest.fn();

      await gmailCallback(mockRequest as Request, mockResponse as Response);

      // Verify it redirects with error status
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("status=error")
      );
    });

    it("should handle missing state parameter", async () => {
      mockRequest.query = { code: "test-code" };
      mockRequest.headers = {}; // Add empty headers
      mockResponse.send = jest.fn();

      await gmailCallback(mockRequest as Request, mockResponse as Response);

      // Verify it redirects with error status
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("status=error")
      );
    });

    it("should handle invalid state format", async () => {
      mockRequest.query = {
        code: "test-code",
        state: "invalid-state",
      };
      mockRequest.headers = {}; // Add empty headers
      mockResponse.send = jest.fn();

      await gmailCallback(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining("status=error")
      );
    });
  });

  describe("plaidAuth", () => {
    it("should handle already connected user", async () => {
      // Mock plaidClient.getAccessToken
      (plaidClient.getAccessToken as jest.Mock).mockResolvedValue({
        type: "access_token",
        accessToken: "test-access-token",
      });

      await plaidAuth(mockRequest as Request, mockResponse as Response);

      expect(plaidClient.getAccessToken).toHaveBeenCalledWith("test-user-id");
      expect(OAuthHandler.handleCallback).toHaveBeenCalledWith(
        mockResponse,
        true,
        "Plaid already connected",
        undefined,
        { status: "already_connected" }
      );
    });

    it("should handle new connection with link token", async () => {
      // Mock plaidClient.getAccessToken
      (plaidClient.getAccessToken as jest.Mock).mockResolvedValue({
        type: "link_token",
        linkToken: "test-link-token",
      });

      await plaidAuth(mockRequest as Request, mockResponse as Response);

      expect(plaidClient.getAccessToken).toHaveBeenCalledWith("test-user-id");
      expect(OAuthHandler.handleCallback).toHaveBeenCalledWith(
        mockResponse,
        true,
        undefined,
        undefined,
        { linkToken: "test-link-token" }
      );
    });

    it("should throw error if link token creation fails", async () => {
      // Mock plaidClient.getAccessToken
      (plaidClient.getAccessToken as jest.Mock).mockResolvedValue({
        type: "link_token",
        linkToken: null,
      });

      await expect(
        plaidAuth(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Failed to get link token", 500));
    });

    it("should throw error if userId is not provided", async () => {
      mockRequest.userId = undefined;

      await expect(
        plaidAuth(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Authentication required", 401));
    });
  });

  describe("plaidCallback", () => {
    it("should handle successful callback", async () => {
      // Mock request query
      mockRequest.query = {
        public_token: "test-public-token",
        userId: "test-user-id",
      };

      // Mock OAuthHandler.validateCallbackParams
      (OAuthHandler.validateCallbackParams as jest.Mock).mockImplementation(
        () => true
      );

      // Mock plaidClient.exchangePublicToken
      (plaidClient.exchangePublicToken as jest.Mock).mockResolvedValue(true);

      await plaidCallback(mockRequest as Request, mockResponse as Response);

      expect(OAuthHandler.validateCallbackParams).toHaveBeenCalledWith(
        mockRequest,
        ["public_token", "userId"]
      );
      expect(plaidClient.exchangePublicToken).toHaveBeenCalledWith(
        "test-public-token",
        "test-user-id"
      );
      expect(OAuthHandler.handleCallback).toHaveBeenCalledWith(
        mockResponse,
        true,
        "Plaid connected successfully"
      );
    });

    it("should handle validation error", async () => {
      // Mock OAuthHandler.validateCallbackParams to throw error
      (OAuthHandler.validateCallbackParams as jest.Mock).mockImplementation(
        () => {
          throw new AppError("Missing required parameters", 400);
        }
      );

      await plaidCallback(mockRequest as Request, mockResponse as Response);

      expect(OAuthHandler.handleCallback).toHaveBeenCalledWith(
        mockResponse,
        false,
        "Failed to connect Plaid",
        "Missing required parameters"
      );
    });
  });

  describe("createLinkToken", () => {
    it("should create link token successfully", async () => {
      // Mock request query
      mockRequest.query = { userId: "test-user-id" };

      // Mock plaidClient.createLinkToken
      (plaidClient.createLinkToken as jest.Mock).mockResolvedValue(
        "test-link-token"
      );

      await createLinkToken(mockRequest as Request, mockResponse as Response);

      expect(plaidClient.createLinkToken).toHaveBeenCalledWith("test-user-id");
      expect(mockResponse.json).toHaveBeenCalledWith({
        link_token: "test-link-token",
      });
    });

    it("should handle error in link token creation", async () => {
      // Mock request query
      mockRequest.query = { userId: "test-user-id" };

      // Mock plaidClient.createLinkToken to throw error
      const error = new Error("Link token creation failed");
      (plaidClient.createLinkToken as jest.Mock).mockRejectedValue(error);

      await expect(
        createLinkToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Link token creation failed", 500));
    });
  });

  describe("exchangePublicToken", () => {
    it("should exchange public token successfully", async () => {
      // Mock request body
      mockRequest.body = {
        public_token: "test-public-token",
        userId: "test-user-id",
      };

      // Mock plaidClient.exchangePublicToken
      (plaidClient.exchangePublicToken as jest.Mock).mockResolvedValue(true);

      await exchangePublicToken(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(plaidClient.exchangePublicToken).toHaveBeenCalledWith(
        "test-public-token",
        "test-user-id"
      );
      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        success: true,
      });
    });

    it("should handle error in token exchange", async () => {
      // Mock request body
      mockRequest.body = {
        public_token: "test-public-token",
        userId: "test-user-id",
      };

      // Mock plaidClient.exchangePublicToken to throw error
      const error = new Error("Token exchange failed");
      (plaidClient.exchangePublicToken as jest.Mock).mockRejectedValue(error);

      await expect(
        exchangePublicToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Token exchange failed", 500));
    });
  });
});
