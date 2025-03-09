import express, { Request, Response, NextFunction } from "express";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";
import plaidClient from "../services/apiClients/plaidClient";
import scheduler from "../services/scheduler";
import { authenticateJWT } from "../middleware/auth";
import config from "../config/config";

const router = express.Router();

// Apply JWT authentication to all routes in this router
router.use(authenticateJWT as express.RequestHandler);

interface PlaidTokenRequest {
  userId: string;
}

// Wrap async route handlers with proper return type
const asyncHandler = (fn: (req: Request, res: Response) => Promise<any>) => {
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
    // Use userId from JWT token
    const userId = req.userId;

    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const accessToken = await gmailClient.getAccessToken(userId);
    res.json({ accessToken });
  })
);

// Get Gmail authorization URL
router.get(
  "/gmail-auth-url",
  asyncHandler(async (req: Request, res: Response) => {
    // Use userId from JWT token
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Authentication required", 401);
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
    // Use userId from JWT token
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Authentication required", 401);
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

router.post(
  "/test-plaid-token",
  (
    req: Request<{}, any, PlaidTokenRequest>,
    res: Response,
    next: NextFunction
  ) => {
    void (async () => {
      try {
        // Use userId from JWT token
        const userId = req.userId;
        if (!userId) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }

        try {
          // Get auth response which could contain either access token or link token
          const authResponse = await plaidClient.getAccessToken(userId);
          res.json(authResponse);
        } catch (error) {
          next(error);
        }
      } catch (error) {
        next(error);
      }
    })();
  }
);

router.get(
  "/plaid-auth-url",
  asyncHandler(async (req: Request, res: Response) => {
    // Use userId from JWT token
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const response = await plaidClient.getAccessToken(userId);

    // Return the URL that would be redirected to
    if (response.type === "access_token") {
      return res.json({
        redirectUrl: `${config.FRONTEND_URL}/connect-plaid?status=already_connected`,
      });
    }

    return res.json({
      redirectUrl: `${config.FRONTEND_URL}/connect-plaid?linkToken=${response.linkToken}`,
    });
  })
);

router.post(
  "/test-plaid-fetch",
  asyncHandler(async (req: Request, res: Response) => {
    // Use userId from JWT token
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const plaidData = await plaidClient.fetchPlaidData(userId);
    res.json(plaidData);
  })
);

router.post(
  "/run-data-ingestion",
  asyncHandler(async (_req: Request, res: Response) => {
    console.log("Manually triggering data ingestion process");
    await scheduler.runDataIngestionNow();
    res.json({ message: "Data ingestion process triggered successfully" });
  })
);

export default router;
