import { Request, Response } from "express";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import UserModel from "@backend/models/UserModel";
import * as encryption from "@backend/utils/encryption";
import * as auth from "@backend/middleware/auth";
import { AppError } from "@backend/middleware/errorHandler";
import { ResponseHandler } from "@backend/utils/ResponseHandler";
import * as userUtils from "@backend/utils/userUtils";
import {
  login,
  signup,
  refreshToken,
} from "@backend/controllers/authController";

// Mock dependencies
jest.mock("@backend/models/UserModel");
jest.mock("@backend/middleware/auth");
jest.mock("@backend/utils/encryption");
jest.mock("@backend/utils/ResponseHandler");
jest.mock("@backend/utils/userUtils");
jest.mock("bcrypt");

describe("Auth Controller", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockUser: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request and response
    mockRequest = {
      body: {},
      params: {},
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Create mock user
    mockUser = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: encryption.encrypt("Test User"),
      email: encryption.encrypt("test@example.com"),
      password: encryption.encrypt("hashedPassword123"),
    };

    // Mock encryption.decrypt to return decrypted values
    (encryption.decrypt as jest.Mock).mockImplementation((value) => {
      if (value === mockUser.password) return "hashedPassword123";
      if (value === mockUser.name) return "Test User";
      if (value === mockUser.email) return "test@example.com";
      return value;
    });

    // Mock bcrypt.compare to return true for valid password
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    // Mock auth functions
    (auth.generateToken as jest.Mock).mockReturnValue("mock-token");
    (auth.generateRefreshToken as jest.Mock).mockReturnValue(
      "mock-refresh-token"
    );
    (auth.refreshAccessToken as jest.Mock).mockReturnValue({
      accessToken: "new-mock-token",
      refreshToken: "new-mock-refresh-token",
    });

    // Mock UserModel.findById to return the mock user
    (UserModel.findById as jest.Mock).mockResolvedValue(mockUser);

    // Mock UserModel.find to return empty array by default
    (UserModel.find as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    // Mock saveUser to return the mock user
    (userUtils.saveUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("login", () => {
    it("should login a user with valid credentials", async () => {
      // Arrange
      mockRequest.body = {
        userId: mockUser._id,
        password: "correctPassword",
      };

      // Act
      await login(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(UserModel.findById).toHaveBeenCalledWith(mockUser._id);
      expect(encryption.decrypt).toHaveBeenCalledWith(mockUser.password);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "correctPassword",
        "hashedPassword123"
      );
      expect(auth.generateToken).toHaveBeenCalledWith(mockUser._id);
      expect(auth.generateRefreshToken).toHaveBeenCalledWith(mockUser._id);
      expect(mockResponse.json).toHaveBeenCalledWith({
        token: "mock-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 3600,
      });
    });

    it("should throw an error if user is not found", async () => {
      // Arrange
      mockRequest.body = {
        userId: "nonexistent-id",
        password: "password",
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Invalid credentials", 401));
    });

    it("should throw an error if password is invalid", async () => {
      // Arrange
      mockRequest.body = {
        userId: mockUser._id,
        password: "wrongPassword",
      };
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        login(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Invalid credentials", 401));
    });
  });

  describe("signup", () => {
    it("should create a new user with valid data", async () => {
      // Arrange
      mockRequest.body = {
        name: "New User",
        email: "new@example.com",
        password: "password123",
      };

      // Act
      await signup(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(userUtils.saveUser).toHaveBeenCalledWith(
        "New User",
        "new@example.com",
        "password123"
      );
      expect(auth.generateToken).toHaveBeenCalledWith(mockUser._id);
      expect(auth.generateRefreshToken).toHaveBeenCalledWith(mockUser._id);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        token: "mock-token",
        refreshToken: "mock-refresh-token",
        expiresIn: 3600,
      });
    });

    it("should throw an error if email already exists", async () => {
      // Arrange
      mockRequest.body = {
        name: "New User",
        email: "test@example.com", // Same as mock user
        password: "password123",
      };

      // Mock UserModel.find to return existing user with same email
      (UserModel.find as jest.Mock).mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([mockUser]),
      });

      // Mock decrypt to return the email that matches the request
      (encryption.decrypt as jest.Mock).mockImplementationOnce(
        () => "test@example.com"
      );

      // Act & Assert
      await expect(
        signup(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Email already in use", 400));
    });
  });

  describe("refreshToken", () => {
    it("should refresh tokens with valid refresh token", async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: "valid-refresh-token",
      };

      // Act
      await refreshToken(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(auth.refreshAccessToken).toHaveBeenCalledWith(
        "valid-refresh-token"
      );
      expect(ResponseHandler.success).toHaveBeenCalledWith(mockResponse, {
        accessToken: "new-mock-token",
        refreshToken: "new-mock-refresh-token",
        message: "Token refreshed successfully",
      });
    });

    it("should throw an error if refresh token is invalid", async () => {
      // Arrange
      mockRequest.body = {
        refreshToken: "invalid-refresh-token",
      };
      (auth.refreshAccessToken as jest.Mock).mockReturnValue(null);

      // Act & Assert
      await expect(
        refreshToken(mockRequest as Request, mockResponse as Response)
      ).rejects.toThrow(new AppError("Invalid refresh token", 401));
    });
  });
});
