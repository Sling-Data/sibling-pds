import express, { Request, Response, RequestHandler } from "express";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";
import plaidClient from "../services/apiClients/plaidClient";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { authenticateJWT, generateToken } from "../middleware/auth";
import config from "../config/config";

const router = express.Router();

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

// Mock login endpoint to generate JWT token
router.post("/login", ((req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({ message: "userId is required" });
    return;
  }

  // Generate JWT token
  const token = generateToken(userId);

  // Return token
  res.json({ token });
  return;
}) as RequestHandler);

// Protected route example - requires JWT authentication
router.get(
  "/protected",
  authenticateJWT as RequestHandler,
  ((req, res) => {
    res.json({
      message: "This is a protected route",
      userId: req.userId,
    });
    return;
  }) as RequestHandler
);

// Apply JWT authentication to Gmail routes
router.get("/gmail", authenticateJWT as RequestHandler, async (req, res) => {
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
  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
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
});

router.get(
  "/plaid",
  authenticateJWT as RequestHandler,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const response = await plaidClient.getAccessToken(userId);

    // If we got an access token, user is already authenticated
    if (response.type === "access_token") {
      return res.redirect(
        `${config.FRONTEND_URL}/connect-plaid?status=already_connected`
      );
    }

    // Otherwise, redirect with the link token
    return res.redirect(
      `${config.FRONTEND_URL}/connect-plaid?linkToken=${response.linkToken}`
    );
  })
);

router.get(
  "/plaid-callback",
  asyncHandler(async (req: Request, res: Response) => {
    const { public_token, userId } = req.query;

    if (!public_token || typeof public_token !== "string") {
      throw new AppError("public_token is required as a query parameter", 400);
    }

    if (!userId || typeof userId !== "string") {
      throw new AppError("userId is required as a query parameter", 400);
    }

    try {
      // Exchange public token for access token and store credentials
      await plaidClient.exchangePublicToken(public_token, userId);

      // Redirect to profile page with success status
      res.redirect(`${config.FRONTEND_URL}/profile?status=success`);
    } catch (error) {
      console.error("Plaid callback error:", error);
      const message =
        error instanceof AppError
          ? error.message
          : "Failed to connect Plaid account";
      res.redirect(
        `${config.FRONTEND_URL}/profile?error=${encodeURIComponent(message)}`
      );
    }
  })
);

export default router;
