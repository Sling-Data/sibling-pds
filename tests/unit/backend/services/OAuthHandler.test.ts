import { OAuthHandler } from "@backend/services/OAuthHandler";
import { AppError } from "@backend/middleware/errorHandler";
import { Response, Request } from "express";
import { ResponseHandler } from "@backend/utils/ResponseHandler";

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

describe("OAuthHandler", () => {
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
