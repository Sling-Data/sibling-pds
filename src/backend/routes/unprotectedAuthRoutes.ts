import express, { Request, Response, RequestHandler } from "express";
import { AppError } from "../middleware/errorHandler";
import { generateToken, generateRefreshToken } from "../middleware/auth";
import { validate, schemas } from "../middleware/validation";
import UserModel from "../models/UserModel";
import bcrypt from "bcrypt";
import { decrypt } from "../utils/encryption";
import { saveUser } from "../utils/userUtils";
import config from "../config/config";
import { Document } from "mongoose";

const router = express.Router();

// Interface for User Document
interface UserDocument extends Document {
  _id: any;
  name: any;
  email: any;
  password: any;
}

// Wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      console.error("Route error:", error);
      const message =
        error instanceof AppError ? error.message : "Internal server error";
      res.redirect(
        `${config.FRONTEND_URL}/profile?error=${encodeURIComponent(message)}`
      );
    });
  };
};

// Signup endpoint to create a new user
router.post(
  "/signup",
  validate(schemas.signup) as RequestHandler,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body;

    try {
      // Check if email already exists
      const existingUsers = await UserModel.find({}).exec();
      for (const user of existingUsers) {
        const decryptedEmail = decrypt(user.email);
        if (decryptedEmail.toLowerCase() === email.toLowerCase()) {
          res.status(400).json({ message: "Email already in use" });
          return;
        }
      }

      // Use saveUser utility to create the user with proper password hashing and encryption
      const savedUser = await saveUser(name, email, password) as UserDocument;
      
      // Verify that the decrypted password is a bcrypt hash
      const decryptedPassword = decrypt(savedUser.password);
      if (!decryptedPassword.startsWith('$2b$') && !decryptedPassword.startsWith('$2a$')) {
        console.error("Password not properly hashed before encryption");
        res.status(500).json({ message: "Error creating user: password not properly secured" });
        return;
      }
      
      const userId = savedUser._id.toString();
      
      // Generate JWT token and refresh token
      const token = generateToken(userId);
      const refreshToken = generateRefreshToken(userId);
      
      // Return user ID and tokens
      res.status(201).json({
        userId,
        token,
        refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
);

// Login endpoint to authenticate user and generate JWT token
router.post(
  "/login",
  validate(schemas.login) as RequestHandler,
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, password } = req.body;

    try {
      // Find user by ID
      const user = await UserModel.findById(userId);
      
      if (!user) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      // Decrypt the stored password
      const decryptedPassword = decrypt(user.password);
      
      // Compare the provided password with the decrypted password using bcrypt
      const isValid = await bcrypt.compare(password, decryptedPassword);

      if (!isValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      // Generate JWT token and refresh token
      const token = generateToken(userId);
      const refreshToken = generateRefreshToken(userId);

      // Return tokens
      res.json({
        token,
        refreshToken,
        expiresIn: 3600, // 1 hour in seconds
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  })
);

export default router;
