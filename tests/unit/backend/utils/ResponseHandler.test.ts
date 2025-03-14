import { AppError } from "@backend/middleware/errorHandler";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import { Response } from "express";

describe("ResponseHandler", () => {
  let mockRes: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let redirectSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    redirectSpy = jest.fn();

    mockRes = {
      json: jsonSpy,
      status: statusSpy,
      redirect: redirectSpy,
    };
  });

  describe("success", () => {
    it("should send success response with default status code", () => {
      const data = { message: "Success" };
      ResponseHandler.success(mockRes as Response, data);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(data);
    });

    it("should send success response with custom status code", () => {
      const data = { message: "Created" };
      ResponseHandler.success(mockRes as Response, data, 201);

      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(data);
    });

    it("should handle complex data objects", () => {
      const data = {
        user: { id: 1, name: "Test" },
        items: [1, 2, 3],
      };
      ResponseHandler.success(mockRes as Response, data);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith(data);
    });
  });

  describe("error", () => {
    it("should handle AppError with custom status code", () => {
      const error = new AppError("Not found", 404);
      ResponseHandler.error(mockRes as Response, error);

      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({
        status: "error",
        message: "Not found",
      });
    });

    it("should handle regular Error with default status code", () => {
      const error = new Error("Something went wrong");
      ResponseHandler.error(mockRes as Response, error);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        status: "error",
        message: "Internal server error",
      });
    });

    it("should use provided status code for regular Error", () => {
      const error = new Error("Something went wrong");
      ResponseHandler.error(mockRes as Response, error, 400);

      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({
        status: "error",
        message: "Internal server error",
      });
    });
  });

  describe("redirect", () => {
    it("should redirect to URL without parameters", () => {
      const url = "https://example.com";
      ResponseHandler.redirect(mockRes as Response, url);

      expect(redirectSpy).toHaveBeenCalledWith(url);
    });

    it("should redirect to URL with query parameters", () => {
      const url = "https://example.com";
      const params = {
        code: "123",
        state: "abc",
      };
      ResponseHandler.redirect(mockRes as Response, url, params);

      expect(redirectSpy).toHaveBeenCalledWith(
        "https://example.com?code=123&state=abc"
      );
    });

    it("should handle empty parameters object", () => {
      const url = "https://example.com";
      ResponseHandler.redirect(mockRes as Response, url, {});

      expect(redirectSpy).toHaveBeenCalledWith(url);
    });

    it("should handle special characters in parameters", () => {
      const url = "https://example.com";
      const params = {
        code: "123&456",
        state: "abc def",
      };
      ResponseHandler.redirect(mockRes as Response, url, params);

      expect(redirectSpy).toHaveBeenCalledWith(
        "https://example.com?code=123%26456&state=abc+def"
      );
    });
  });
});
