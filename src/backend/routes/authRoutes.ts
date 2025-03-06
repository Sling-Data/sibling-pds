import { Router } from "express";
import gmailClient from "../services/apiClients/gmailClient";
import { AppError } from "../middleware/errorHandler";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";

const router = Router();

router.get("/gmail", async (req, res) => {
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

    // Exchange code for tokens
    const tokens = await gmailClient.exchangeCodeForTokens(code);

    // Store credentials in UserDataSources
    await UserDataSourcesModel.storeCredentials(
      decodedState.userId,
      DataSourceType.GMAIL,
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token!,
        expiry: new Date(tokens.expiry_date!).toISOString(),
      }
    );

    // Redirect to profile page with success status
    res.redirect("http://localhost:3000/profile?status=success");
  } catch (error) {
    console.error("OAuth callback error:", error);
    const message =
      error instanceof AppError ? error.message : "Authorization failed";
    res.redirect(
      `http://localhost:3000/profile?status=error&message=${encodeURIComponent(
        message
      )}`
    );
  }
});

export default router;
