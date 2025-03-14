import express, { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { generateToken, generateRefreshToken } from "../middleware/auth";
import { schemas } from "../middleware/validation";
import UserModel from "../models/UserModel";
import bcrypt from "bcrypt";
import { decrypt } from "../utils/encryption";
import { saveUser } from "../utils/userUtils";
import config from "../config/config";
import { Document } from "mongoose";
import gmailClient from "../services/apiClients/gmailClient";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { RouteFactory } from "../utils/RouteFactory";

const router = express.Router();

// Interface for User Document
interface UserDocument extends Document {
  _id: any;
  name: any;
  email: any;
  password: any;
}

interface LoginRequest {
  userId: string;
  password: string;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

async function login(req: Request<{}, {}, LoginRequest>, res: Response) {
  const { userId, password } = req.body;

  try {
    const user = await UserModel.findById(userId);
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

async function signup(req: Request<{}, {}, SignupRequest>, res: Response) {
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
    const token = generateToken(userId);
    const refreshToken = generateRefreshToken(userId);

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

async function gmailCallback(req: Request, res: Response) {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== "string") {
      throw new AppError("Authorization code is required", 400);
    }

    if (!state || typeof state !== "string") {
      throw new AppError("State parameter is required", 400);
    }

    // Decode and verify state
    let decodedState;
    try {
      const stateJson = Buffer.from(state, "base64").toString();
      decodedState = JSON.parse(stateJson);
    } catch (error) {
      throw new AppError("Invalid state parameter", 400);
    }

    if (!decodedState.userId || !decodedState.nonce) {
      throw new AppError("Invalid state parameter format", 400);
    }

    let tokens;
    // Exchange code for tokens
    try {
      tokens = await gmailClient.exchangeCodeForTokens(code);
    } catch (error) {
      console.error("Failed to exchange code for tokens:", error);
      throw new AppError("Failed to exchange code for tokens", 500);
    }

    // Store credentials in UserDataSources
    try {
      await UserDataSourcesModel.storeCredentials(
        decodedState.userId,
        DataSourceType.GMAIL,
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token!,
          expiry: new Date(tokens.expiry_date!).toISOString(),
        }
      );
    } catch (error) {
      console.error("Failed to store credentials:", error);
      throw new AppError("Failed to store credentials", 500);
    }

    // Redirect to profile page with success status
    res.redirect(`${config.FRONTEND_URL}/profile?status=success`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    const message =
      error instanceof AppError ? error.message : "Authorization failed";
    res.redirect(
      `${config.FRONTEND_URL}/profile?status=error&message=${encodeURIComponent(
        message
      )}`
    );
  }
}

// Create routes using RouteFactory
RouteFactory.createPostRoute(router, "/login", login, schemas.login);
RouteFactory.createPostRoute(router, "/signup", signup, schemas.signup);
RouteFactory.createProtectedRoute(router, "/callback", gmailCallback);

export default router;
