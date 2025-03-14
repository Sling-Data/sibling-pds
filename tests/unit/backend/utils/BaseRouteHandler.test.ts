import { Request, Response } from "express";
import { BaseRouteHandler } from "@backend/utils/BaseRouteHandler";
import { AppError } from "@backend/middleware/errorHandler";

class TestRouteHandler extends BaseRouteHandler {
  async testHandler(_req: Request, _res: Response) {
    throw new AppError("Test error", 400);
  }

  async testGenericErrorHandler(_req: Request, _res: Response) {
    throw new Error("Generic error");
  }
}

describe("BaseRouteHandler", () => {
  describe("createAsyncHandler", () => {
    let testHandler: TestRouteHandler;
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      testHandler = new TestRouteHandler();
      mockReq = {};
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    });

    it("should handle AppError instances", async () => {
      const handler = testHandler.createAsyncHandler(
        testHandler.testHandler.bind(testHandler)
      );

      await handler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Test error",
      });
    });

    it("should handle generic errors", async () => {
      const handler = testHandler.createAsyncHandler(
        testHandler.testGenericErrorHandler.bind(testHandler)
      );

      await handler(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: "error",
        message: "Internal server error",
      });
    });
  });
});
