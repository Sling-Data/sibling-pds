import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

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
    const secret = process.env.JWT_SECRET || "default-secret";
    const decoded = jwt.verify(token, secret) as { userId: string };

    // Add userId to request
    req.userId = decoded.userId;

    next();
  } catch (error) {
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
  const secret = process.env.JWT_SECRET || "default-secret";
  return jwt.sign({ userId }, secret, { expiresIn: "24h" });
};
