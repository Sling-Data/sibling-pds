import { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";
import plaidClient from "../services/apiClients/plaidClient";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { OAuthHandler } from "../services/OAuthHandler";
import config from "../config/config";
import { ResponseHandler } from "../utils/ResponseHandler";

/**
 * Initiates Gmail OAuth flow
 */
export async function gmailAuth(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Generate state parameter using OAuthHandler
  const state = OAuthHandler.generateState(userId, "gmail");
  const authUrl = gmailClient.generateAuthUrl(state);
  res.redirect(authUrl);
}

/**
 * Handles Gmail OAuth callback
 */
export async function gmailCallback(req: Request, res: Response) {
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
}

/**
 * Initiates Plaid authentication flow
 */
export async function plaidAuth(req: Request, res: Response) {
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

/**
 * Handles Plaid callback with public token
 */
export async function plaidCallback(req: Request, res: Response) {
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

/**
 * Creates a Plaid link token
 */
export async function createLinkToken(req: Request, res: Response) {
  const { userId } = req.query;

  try {
    const linkToken = await plaidClient.createLinkToken(userId as string);
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error("Error creating link token:", error);
    throw new AppError(
      error instanceof Error ? error.message : "Failed to create link token",
      500
    );
  }
}

/**
 * Exchanges a public token for an access token
 */
export async function exchangePublicToken(req: Request, res: Response) {
  const { public_token, userId } = req.body;

  try {
    await plaidClient.exchangePublicToken(public_token, userId);
    ResponseHandler.success(res, { success: true });
  } catch (error) {
    console.error("Error exchanging public token:", error);
    throw new AppError(
      error instanceof Error
        ? error.message
        : "Failed to exchange public token",
      500
    );
  }
}
