import express, { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";

const router = express.Router();

// Wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    });
  };
};

router.post(
  "/test-gmail-token",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    const accessToken = await gmailClient.getAccessToken(userId);
    res.json({ accessToken });
  })
);

// Get Gmail authorization URL
router.get(
  "/gmail-auth-url",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.query.userId;
    if (!userId || typeof userId !== "string") {
      throw new AppError("userId is required as a query parameter", 400);
    }

    // Generate state parameter with userId and random string for CSRF protection
    const stateBuffer = Buffer.from(
      JSON.stringify({
        userId,
        nonce: Math.random().toString(36).substring(2),
      })
    ).toString("base64");

    const authUrl = gmailClient.generateAuthUrl(stateBuffer);
    res.json({ authUrl });
  })
);

export default router;
