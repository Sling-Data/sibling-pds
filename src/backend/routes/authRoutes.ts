import express, { Request, Response, RequestHandler } from "express";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";
import plaidClient from "../services/apiClients/plaidClient";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { refreshAccessToken } from "../middleware/auth";
import config from "../config/config";
import { validate, schemas } from "../middleware/validation";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";
import { ResponseHandler } from "../utils/ResponseHandler";

const router = express.Router();

class AuthRouteHandler extends BaseRouteHandler {
  protectedRoute(req: Request, res: Response) {
    ResponseHandler.success(res, {
      message: "This is a protected route",
      userId: req.userId,
    });
  }

  async gmailAuth(req: Request, res: Response) {
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
  }

  async gmailCallback(req: Request, res: Response) {
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
    ResponseHandler.redirect(res, `${config.FRONTEND_URL}/profile`, {
      status: "success",
    });
  }

  async plaidAuth(req: Request, res: Response) {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Authentication required", 401);
    }

    const response = await plaidClient.getAccessToken(userId);

    // If we got an access token, user is already authenticated
    if (response.type === "access_token") {
      return ResponseHandler.redirect(
        res,
        `${config.FRONTEND_URL}/connect-plaid`,
        { status: "already_connected" }
      );
    }

    // Otherwise, redirect with the link token
    if (!response.linkToken) {
      throw new AppError("Failed to get link token", 500);
    }
    return ResponseHandler.redirect(
      res,
      `${config.FRONTEND_URL}/connect-plaid`,
      { linkToken: response.linkToken }
    );
  }

  async plaidCallback(req: Request, res: Response) {
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
      ResponseHandler.redirect(res, `${config.FRONTEND_URL}/profile`, {
        status: "success",
      });
    } catch (error) {
      console.error("Plaid callback error:", error);
      const message =
        error instanceof AppError
          ? error.message
          : "Failed to connect Plaid account";
      ResponseHandler.redirect(res, `${config.FRONTEND_URL}/profile`, {
        error: message,
      });
    }
  }

  async refreshToken(req: Request, res: Response) {
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
}

const authHandler = new AuthRouteHandler();

// Protected route example
router.get(
  "/protected",
  authHandler.createAsyncHandler(authHandler.protectedRoute.bind(authHandler))
);

// Gmail OAuth routes
router.get(
  "/gmail",
  authHandler.createAsyncHandler(authHandler.gmailAuth.bind(authHandler))
);

router.get(
  "/callback",
  authHandler.createAsyncHandler(authHandler.gmailCallback.bind(authHandler))
);

// Plaid routes
router.get(
  "/plaid",
  authHandler.createAsyncHandler(authHandler.plaidAuth.bind(authHandler))
);

router.get(
  "/plaid-callback",
  validate(schemas.plaidCallback, "query") as RequestHandler,
  authHandler.createAsyncHandler(authHandler.plaidCallback.bind(authHandler))
);

// Add refresh token endpoint
router.post(
  "/refresh-token",
  validate(schemas.refreshToken),
  authHandler.createAsyncHandler(authHandler.refreshToken.bind(authHandler))
);

export default router;
