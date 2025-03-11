import { Request, Response, NextFunction } from "express";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import crypto from "crypto";

// Extend Express Request type to include userId and refreshToken
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      refreshToken?: string;
    }
  }
}

// JWT configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || ("default-secret" as Secret),
  accessTokenExpiry: "1m" as const,
  refreshTokenExpiry: 7 * 24 * 60 * 60, // 7 days in seconds
};

// Simple in-memory store for refresh tokens (in production, use Redis or DB)
interface RefreshTokenStore {
  [token: string]: {
    userId: string;
    expiresAt: number;
  };
}

const refreshTokens: RefreshTokenStore = {};

/**
 * JWT Authentication middleware
 * Verifies the JWT token from the Authorization header
 * Adds userId to the request object if token is valid
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get the auth header value
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Access denied. No token provided." });
    return;
  }

  try {
    // Format should be "Bearer [token]"
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "Access denied. Invalid token format." });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as {
      userId: string;
      exp: number;
      iat: number;
    };

    // Add userId to request
    req.userId = decoded.userId;

    // Check if token is about to expire (less than 5 minutes remaining)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = decoded.exp - currentTime;

    if (timeRemaining < 300) {
      // Token is about to expire, attach refresh token to response
      const refreshToken = generateRefreshToken(decoded.userId);
      res.setHeader("X-Refresh-Token", refreshToken);
    }

    next();
  } catch (error) {
    // Check if error is due to token expiration
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: "Token expired. Please refresh your token.",
        expired: true,
      });
      return;
    }

    res.status(403).json({ message: "Invalid token." });
    return;
  }
};

/**
 * Generate JWT token for a user
 * @param userId - The user ID to encode in the token
 * @returns JWT token string
 */
export const generateToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: JWT_CONFIG.accessTokenExpiry };
  return jwt.sign({ userId }, JWT_CONFIG.secret, options);
};

/**
 * Generate a cryptographically secure random string for use as a refresh token
 * @returns Random string
 */
const generateRandomToken = (): string => {
  return crypto.randomBytes(40).toString("hex");
};

/**
 * Generate refresh token for a user
 * @param userId - The user ID to associate with the token
 * @returns Refresh token string
 */
export const generateRefreshToken = (userId: string): string => {
  // Generate a random token
  const refreshToken = generateRandomToken();

  // Store refresh token with expiry
  const expiresAt =
    Math.floor(Date.now() / 1000) + JWT_CONFIG.refreshTokenExpiry;
  refreshTokens[refreshToken] = {
    userId,
    expiresAt,
  };

  return refreshToken;
};

/**
 * Refresh an access token using a refresh token
 * Also implements token rotation - invalidates the old refresh token and issues a new one
 * @param refreshToken - The refresh token to use
 * @returns Object containing new access token and refresh token, or null if refresh token is invalid
 */
export const refreshAccessToken = (
  refreshToken: string
): { accessToken: string; refreshToken: string } | null => {
  try {
    // Check if refresh token exists in store
    const storedToken = refreshTokens[refreshToken];
    if (!storedToken) {
      return null;
    }

    // Check if refresh token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (storedToken.expiresAt < currentTime) {
      // Remove expired token
      delete refreshTokens[refreshToken];
      return null;
    }

    const { userId } = storedToken;

    // Implement token rotation - invalidate the old token
    delete refreshTokens[refreshToken];

    // Generate new tokens
    const newAccessToken = generateToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to handle token refresh
 */
export const handleTokenRefresh = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const refreshToken =
    req.body.refreshToken ||
    req.query.refreshToken ||
    req.headers["x-refresh-token"];

  if (!refreshToken) {
    next();
    return;
  }

  const tokens = refreshAccessToken(refreshToken as string);
  if (tokens) {
    res.setHeader("X-Access-Token", tokens.accessToken);
    res.setHeader("X-Refresh-Token", tokens.refreshToken);
  }

  next();
};
