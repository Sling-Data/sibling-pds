import { OAuthHandler } from "@backend/services/OAuthHandler";
import { AppError } from "@backend/middleware/errorHandler";
import { Response, Request } from "express";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import { OAuth2Client } from "google-auth-library";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
} from "../../helpers/testSetup";

// Mock ResponseHandler
jest.mock("@backend/utils/ResponseHandler", () => ({
  ResponseHandler: {
    redirect: jest.fn(),
  },
}));

// Mock config
jest.mock("@backend/config/config", () => ({
  __esModule: true,
  default: {
    FRONTEND_URL: "http://localhost:3000",
  },
}));

// Mock google-auth-library
jest.mock("google-auth-library", () => {
  const mockGenerateAuthUrl = jest.fn().mockImplementation((options) => {
    const params = new URLSearchParams({
      access_type: options.access_type,
      scope: Array.isArray(options.scope)
        ? options.scope.join(" ")
        : options.scope,
      prompt: options.prompt,
      state: options.state || "",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  });

  return {
    OAuth2Client: jest.fn().mockImplementation(() => ({
      generateAuthUrl: mockGenerateAuthUrl,
      getToken: jest.fn(),
      refreshAccessToken: jest.fn(),
      setCredentials: jest.fn(),
    })),
  };
});

describe("OAuthHandler", () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment(testEnv);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOAuth2Client", () => {
    it("should create and cache OAuth2Client instances", () => {
      const config = {
        provider: "gmail" as const,
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/callback",
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      };

      const client1 = OAuthHandler.getOAuth2Client(config);
      const client2 = OAuthHandler.getOAuth2Client(config);

      expect(client1).toBe(client2); // Should return the same instance
      expect(OAuth2Client).toHaveBeenCalledTimes(1);
    });

    it("should create separate clients for different providers", () => {
      const gmailConfig = {
        provider: "gmail" as const,
        clientId: "test-gmail-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/callback",
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      };

      const plaidConfig = {
        provider: "plaid" as const,
        clientId: "test-plaid-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/callback",
      };

      const gmailClient = OAuthHandler.getOAuth2Client(gmailConfig);
      const plaidClient = OAuthHandler.getOAuth2Client(plaidConfig);

      expect(gmailClient).not.toBe(plaidClient);
      expect(OAuth2Client).toHaveBeenCalledTimes(2);
    });

    it("should throw error for missing credentials", () => {
      const config = {
        provider: "gmail" as const,
        clientId: "",
        clientSecret: "",
        redirectUri: "http://localhost:3000/callback",
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      };

      expect(() => OAuthHandler.getOAuth2Client(config)).toThrow(
        "Client ID and Client Secret must be set in environment variables"
      );
    });
  });

  describe("generateAuthUrl", () => {
    it("should generate Gmail auth URL with correct parameters", () => {
      const config = {
        provider: "gmail" as const,
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/callback",
        scopes: ["https://www.googleapis.com/auth/gmail.readonly"],
      };

      const state = "test-state";
      const url = OAuthHandler.generateAuthUrl(config, state);

      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("access_type=offline");
      expect(url).toContain("prompt=consent");
      expect(url).toContain(`state=${encodeURIComponent(state)}`);
      expect(url).toContain(
        encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly")
      );
    });

    it("should throw error for unsupported provider", () => {
      const config = {
        provider: "unsupported" as any,
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
        redirectUri: "http://localhost:3000/callback",
      };

      expect(() => OAuthHandler.generateAuthUrl(config)).toThrow(
        "Unsupported OAuth provider: unsupported"
      );
    });
  });

  describe("generateState", () => {
    it("should generate a valid state string", () => {
      const userId = "test-user-id";
      const provider = "gmail" as const;
      const state = OAuthHandler.generateState(userId, provider);

      // Decode and verify state
      const decodedState = JSON.parse(Buffer.from(state, "base64").toString());
      expect(decodedState).toHaveProperty("userId", userId);
      expect(decodedState).toHaveProperty("provider", provider);
      expect(decodedState).toHaveProperty("nonce");
      expect(typeof decodedState.nonce).toBe("string");
      expect(decodedState.nonce.length).toBeGreaterThan(0);
    });
  });

  describe("validateState", () => {
    it("should validate a valid state string", () => {
      const state = OAuthHandler.generateState("test-user-id", "gmail");
      const decodedState = OAuthHandler.validateState(state);

      expect(decodedState).toHaveProperty("userId", "test-user-id");
      expect(decodedState).toHaveProperty("provider", "gmail");
      expect(decodedState).toHaveProperty("nonce");
    });

    it("should throw AppError for invalid state format", () => {
      const invalidState = "invalid-base64";
      expect(() => OAuthHandler.validateState(invalidState)).toThrow(AppError);
    });

    it("should throw AppError for missing required fields", () => {
      const invalidState = Buffer.from(
        JSON.stringify({ userId: "test-user-id" })
      ).toString("base64");
      expect(() => OAuthHandler.validateState(invalidState)).toThrow(AppError);
    });

    it("should throw AppError for invalid provider", () => {
      const invalidState = Buffer.from(
        JSON.stringify({
          userId: "test-user-id",
          provider: "invalid-provider",
          nonce: "test-nonce",
        })
      ).toString("base64");
      expect(() => OAuthHandler.validateState(invalidState)).toThrow(AppError);
    });
  });

  describe("handleCallback", () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = {};
      jest.clearAllMocks();
    });

    it("should handle successful callback", () => {
      OAuthHandler.handleCallback(mockRes as Response, true, "Success message");

      expect(ResponseHandler.redirect).toHaveBeenCalledWith(
        mockRes,
        "http://localhost:3000/profile",
        {
          status: "success",
          message: "Success message",
        }
      );
    });

    it("should handle failed callback with error", () => {
      OAuthHandler.handleCallback(
        mockRes as Response,
        false,
        "Error message",
        "Detailed error"
      );

      expect(ResponseHandler.redirect).toHaveBeenCalledWith(
        mockRes,
        "http://localhost:3000/profile",
        {
          status: "error",
          message: "Error message",
          error: "Detailed error",
        }
      );
    });

    it("should handle callback without message", () => {
      OAuthHandler.handleCallback(mockRes as Response, true);

      expect(ResponseHandler.redirect).toHaveBeenCalledWith(
        mockRes,
        "http://localhost:3000/profile",
        {
          status: "success",
        }
      );
    });
  });

  describe("validateCallbackParams", () => {
    let mockReq: Partial<Request>;

    beforeEach(() => {
      mockReq = {
        query: {},
      } as Partial<Request>;
    });

    it("should pass validation with all required parameters", () => {
      mockReq.query = {
        code: "test-code",
        state: "test-state",
      };

      expect(() =>
        OAuthHandler.validateCallbackParams(mockReq as Request, [
          "code",
          "state",
        ])
      ).not.toThrow();
    });

    it("should throw AppError for missing parameters", () => {
      mockReq.query = {
        code: "test-code",
      };

      expect(() =>
        OAuthHandler.validateCallbackParams(mockReq as Request, [
          "code",
          "state",
        ])
      ).toThrow(AppError);
    });

    it("should throw AppError with correct missing parameters message", () => {
      mockReq.query = {
        code: "test-code",
      };

      try {
        OAuthHandler.validateCallbackParams(mockReq as Request, [
          "code",
          "state",
          "error",
        ]);
        fail("Should have thrown an error");
      } catch (error) {
        if (error instanceof AppError) {
          expect(error.message).toBe(
            "Missing required parameters: state, error"
          );
        } else {
          fail("Should have thrown an AppError");
        }
      }
    });
  });
});
