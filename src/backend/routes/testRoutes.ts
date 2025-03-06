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

router.post("/test-gmail-fetch", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId || typeof userId !== "string") {
      throw new AppError("userId is required in request body", 400);
    }

    const data = await gmailClient.fetchGmailData(userId);
    res.json(data);
  } catch (error) {
    console.error("Error fetching Gmail data:", error);
    const message =
      error instanceof AppError ? error.message : "Failed to fetch Gmail data";
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      status: "error",
      message,
    });
  }
});

export default router;
