import express, { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";
import plaidClient from "../services/apiClients/plaidClient";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { refreshAccessToken } from "../middleware/auth";
import { schemas } from "../middleware/validation";
import { ResponseHandler } from "../utils/ResponseHandler";
import { RouteFactory } from "../utils/RouteFactory";
import { OAuthHandler } from "../services/OAuthHandler";

const router = express.Router();

async function protectedRoute(req: Request, res: Response) {
  ResponseHandler.success(res, {
    message: "This is a protected route",
    userId: req.userId,
  });
}

async function gmailAuth(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Generate state parameter using OAuthHandler
  const state = OAuthHandler.generateState(userId, "gmail");
  const authUrl = gmailClient.generateAuthUrl(state);
  res.redirect(authUrl);
}

async function gmailCallback(req: Request, res: Response) {
  try {
    // Validate required callback parameters
    OAuthHandler.validateCallbackParams(req, ["code", "state"]);

    const { code, state } = req.query;
    if (typeof code !== "string" || typeof state !== "string") {
      throw new AppError("Invalid parameter types", 400);
    }

    // Validate and decode state
    const decodedState = OAuthHandler.validateState(state);

    // Exchange code for tokens
    let tokens;
    try {
      tokens = await gmailClient.exchangeCodeForTokens(code);
    } catch (error) {
      console.error("Failed to exchange code for tokens:", error);
      OAuthHandler.handleCallback(
        res,
        false,
        "Failed to exchange code for tokens",
        "Token exchange failed"
      );
      return;
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
      OAuthHandler.handleCallback(res, true, "Gmail connected successfully");
    } catch (error) {
      console.error("Failed to store credentials:", error);
      OAuthHandler.handleCallback(
        res,
        false,
        "Failed to store credentials",
        "Database error"
      );
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    const message =
      error instanceof AppError ? error.message : "Authorization failed";
    OAuthHandler.handleCallback(res, false, "Authorization failed", message);
  }
}

async function plaidAuth(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const response = await plaidClient.getAccessToken(userId);

  // If we got an access token, user is already authenticated
  if (response.type === "access_token") {
    OAuthHandler.handleCallback(
      res,
      true,
      "Plaid already connected",
      undefined,
      {
        status: "already_connected",
      }
    );
    return;
  }

  // Otherwise, redirect with the link token
  if (!response.linkToken) {
    throw new AppError("Failed to get link token", 500);
  }
  OAuthHandler.handleCallback(res, true, undefined, undefined, {
    linkToken: response.linkToken,
  });
}

async function plaidCallback(req: Request, res: Response) {
  try {
    // Validate required callback parameters
    OAuthHandler.validateCallbackParams(req, ["public_token", "userId"]);

    const { public_token, userId } = req.query;
    if (typeof public_token !== "string" || typeof userId !== "string") {
      throw new AppError("Invalid parameter types", 400);
    }

    // Exchange public token for access token and store credentials
    await plaidClient.exchangePublicToken(public_token, userId);
    OAuthHandler.handleCallback(res, true, "Plaid connected successfully");
  } catch (error) {
    console.error("Plaid callback error:", error);
    const message =
      error instanceof AppError
        ? error.message
        : "Failed to connect Plaid account";
    OAuthHandler.handleCallback(res, false, "Failed to connect Plaid", message);
  }
}

async function refreshToken(req: Request, res: Response) {
  const { refreshToken } = req.body;

  const tokens = refreshAccessToken(refreshToken);
  if (!tokens) {
    throw new AppError("Invalid refresh token", 401);
  }

  ResponseHandler.success(res, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    message: "Token refreshed successfully",
  });
}

// Create routes using RouteFactory
RouteFactory.createProtectedRoute(router, "/protected", protectedRoute);
RouteFactory.createProtectedRoute(router, "/gmail", gmailAuth);
RouteFactory.createProtectedRoute(router, "/callback", gmailCallback);
RouteFactory.createProtectedRoute(router, "/plaid", plaidAuth);
RouteFactory.createProtectedRoute(
  router,
  "/plaid-callback",
  plaidCallback,
  schemas.plaidCallback
);
RouteFactory.createPostRoute(
  router,
  "/refresh-token",
  refreshToken,
  schemas.refreshToken
);

export default router;
