import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { Document } from "mongoose";
import {
  generateRefreshToken,
  generateToken,
  refreshAccessToken,
} from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import UserModel, { User } from "../models/UserModel";
import { decrypt } from "../utils/encryption";
import { ResponseHandler } from "../utils/ResponseHandler";
import { saveUser } from "../utils/userUtils";

interface LoginRequest {
  email: string;
  password: string;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

// Interface for User Document
interface UserDocument extends Document {
  _id: any;
  name: any;
  email: any;
  password: any;
}

/**
 * Login a user with email and password
 */
export async function login(req: Request<{}, {}, LoginRequest>, res: Response) {
  const { email, password } = req.body;

  try {
    // Find all users and check for matching email
    const users = await UserModel.find({}).exec();
    let user: User | null = null;

    // Find user with matching email
    for (const u of users) {
      const decryptedEmail = decrypt(u.email);
      if (decryptedEmail.toLowerCase() === email.toLowerCase()) {
        user = u;
        break;
      }
    }

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // Decrypt the stored password
    const decryptedPassword = decrypt(user.password);

    // Compare the provided password with the decrypted password using bcrypt
    const isValid = await bcrypt.compare(password, decryptedPassword);

    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    // Generate JWT token and refresh token
    const userId = user._id as string;
    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);

    res.json({
      token,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error) {
    console.error("Login error:", error);
    throw new AppError(
      error instanceof AppError ? error.message : "Login failed",
      error instanceof AppError ? error.statusCode : 500
    );
  }
}

/**
 * Register a new user
 */
export async function signup(
  req: Request<{}, {}, SignupRequest>,
  res: Response
) {
  const { name, email, password } = req.body;

  try {
    // Check if email already exists
    const existingUsers = await UserModel.find({}).exec();
    for (const user of existingUsers) {
      const decryptedEmail = decrypt(user.email);
      if (decryptedEmail.toLowerCase() === email.toLowerCase()) {
        throw new AppError("Email already in use", 400);
      }
    }

    // Save the user with proper encryption and hashing
    const savedUser = (await saveUser(name, email, password)) as UserDocument;
    const userId = savedUser._id;

    // Generate JWT token and refresh token
    const token = generateToken(userId.toString());
    const refreshToken = generateRefreshToken(userId.toString());

    res.status(201).json({
      token,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
    });
  } catch (error) {
    console.error("Signup error:", error);
    throw new AppError(
      error instanceof AppError ? error.message : "Signup failed",
      error instanceof AppError ? error.statusCode : 500
    );
  }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;

  const tokens = refreshAccessToken(refreshToken);
  if (!tokens) {
    throw new AppError("Invalid refresh token", 401);
  }

  // Create a new response object with explicit types
  const responseData = {
    accessToken: String(tokens.accessToken),
    refreshToken: String(tokens.refreshToken),
    message: "Token refreshed successfully",
  };

  ResponseHandler.success(res, responseData);
}
