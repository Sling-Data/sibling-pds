import bcrypt from "bcrypt";
import express, { Request, Response } from "express";
import { Document } from "mongoose";
import { generateRefreshToken, generateToken } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { schemas } from "../middleware/validation";
import UserModel from "../models/UserModel";
import { decrypt } from "../utils/encryption";
import { RouteFactory } from "../utils/RouteFactory";
import { saveUser } from "../utils/userUtils";

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

// Create routes using RouteFactory
RouteFactory.createPostRoute(router, "/login", login, schemas.login);
RouteFactory.createPostRoute(router, "/signup", signup, schemas.signup);

export default router;
