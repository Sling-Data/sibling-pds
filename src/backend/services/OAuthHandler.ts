import { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../utils/ResponseHandler";
import config from "../config/config";
import { OAuth2Client } from "google-auth-library";

interface OAuthState {
  userId: string;
  nonce: string;
  provider: "gmail" | "plaid";
}

interface BaseOAuth2ClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface GmailOAuth2ClientConfig extends BaseOAuth2ClientConfig {
  provider: "gmail";
  scopes: string[];
}

interface PlaidOAuth2ClientConfig extends BaseOAuth2ClientConfig {
  provider: "plaid";
  // Add Plaid-specific config here
}

type OAuth2ClientConfig = GmailOAuth2ClientConfig | PlaidOAuth2ClientConfig;

export class OAuthHandler {
  private static oauth2Clients: Map<string, OAuth2Client> = new Map();

  /**
   * Gets or creates an OAuth2Client instance
   * @param config - OAuth2Client configuration with provider-specific settings
   * @returns OAuth2Client instance
   */
  static getOAuth2Client(config: OAuth2ClientConfig): OAuth2Client {
    const clientKey = `${config.provider}-${config.clientId}`;

    if (!this.oauth2Clients.has(clientKey)) {
      const { clientId, clientSecret, redirectUri } = config;
      if (!clientId || !clientSecret) {
        throw new Error(
          "Client ID and Client Secret must be set in environment variables"
        );
      }

      const oauth2Client = new OAuth2Client({
        clientId,
        clientSecret,
        redirectUri,
      });

      this.oauth2Clients.set(clientKey, oauth2Client);
    }

    return this.oauth2Clients.get(clientKey)!;
  }

  /**
   * Generates an OAuth2 authorization URL
   * @param config - OAuth2Client configuration with provider-specific settings
   * @param state - Optional state parameter for CSRF protection
   * @returns Authorization URL
   */
  static generateAuthUrl(config: OAuth2ClientConfig, state?: string): string {
    const oauth2Client = this.getOAuth2Client(config);

    // Provider-specific URL generation
    if (config.provider === "gmail") {
      return oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: config.scopes,
        prompt: "consent", // Force consent screen to ensure we get refresh token
        state: state,
      });
    }

    // Add other provider-specific URL generation here
    throw new Error(`Unsupported OAuth provider: ${config.provider}`);
  }

  /**
   * Generates a secure state parameter for OAuth flows
   * @param userId - The user's ID
   * @param provider - The OAuth provider (gmail or plaid)
   * @returns A base64 encoded state string
   */
  static generateState(userId: string, provider: "gmail" | "plaid"): string {
    const state: OAuthState = {
      userId,
      provider,
      nonce: Math.random().toString(36).substring(2),
    };
    return Buffer.from(JSON.stringify(state)).toString("base64");
  }

  /**
   * Validates and decodes the state parameter
   * @param state - The base64 encoded state string
   * @returns Decoded state object
   * @throws AppError if state is invalid
   */
  static validateState(state: string): OAuthState {
    try {
      const stateJson = Buffer.from(state, "base64").toString();
      const decodedState = JSON.parse(stateJson) as OAuthState;

      if (
        !decodedState.userId ||
        !decodedState.nonce ||
        !decodedState.provider
      ) {
        throw new AppError("Invalid state parameter format", 400);
      }

      if (!["gmail", "plaid"].includes(decodedState.provider)) {
        throw new AppError("Invalid OAuth provider", 400);
      }

      return decodedState;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Invalid state parameter", 400);
    }
  }

  /**
   * Handles OAuth callback responses
   * @param res - Express response object
   * @param success - Whether the OAuth flow was successful
   * @param message - Optional message to display to the user
   * @param error - Optional error details
   * @param additionalParams - Optional additional query parameters
   */
  static handleCallback(
    res: Response,
    success: boolean,
    message?: string,
    error?: string,
    additionalParams?: Record<string, string>
  ): void {
    const params: Record<string, string> = {
      status: success ? "success" : "error",
    };

    if (message) {
      params.message = message;
    }

    if (error) {
      params.error = error;
    }

    // Merge additional parameters if provided
    if (additionalParams) {
      Object.assign(params, additionalParams);
    }

    ResponseHandler.redirect(res, `${config.FRONTEND_URL}/profile`, params);
  }

  /**
   * Validates OAuth callback parameters
   * @param req - Express request object
   * @param requiredParams - Array of required parameter names
   * @throws AppError if required parameters are missing
   */
  static validateCallbackParams(req: Request, requiredParams: string[]): void {
    const missingParams = requiredParams.filter((param) => !req.query[param]);

    if (missingParams.length > 0) {
      throw new AppError(
        `Missing required parameters: ${missingParams.join(", ")}`,
        400
      );
    }
  }
}
