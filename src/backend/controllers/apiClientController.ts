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
 * Generate Gmail auth url
 */
export async function generateGmailAuthUrl(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Check if this is a popup request
  const isPopup = req.query.popup === "true";

  const state = OAuthHandler.generateState(userId, "gmail");
  const authUrl = gmailClient.generateAuthUrl(state, isPopup);
  res.json({ authUrl });
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

    // Check if this is a popup request (based on state parameter)
    const isPopup = decodedState.popup === true;

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

    if (isPopup) {
      // Return HTML with JavaScript to communicate with the parent window
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Authentication Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .success-message {
              margin: 20px;
              padding: 20px;
              background-color: #d4edda;
              border-radius: 5px;
              color: #155724;
            }
          </style>
        </head>
        <body>
          <div class="success-message">
            <h2>Authentication Successful!</h2>
            <p>Your Gmail account has been connected successfully.</p>
            <p>This window will close automatically.</p>
          </div>
          <script>
            // Send message to parent window and close
            (function() {
              try {
                if (window.opener && !window.opener.closed) {
                  // Log for debugging
                  console.log('Sending success message to parent window');
                  
                  // Send the message
                  window.opener.postMessage(
                    { 
                      type: 'gmail-auth-success',
                      message: 'Gmail account connected successfully'
                    }, 
                    '*'  // Use * to ensure the message gets through
                  );
                  
                  // Close immediately to prevent redirect
                  window.close();
                } else {
                  console.error('Opener window not available');
                  document.body.innerHTML += '<p>Please close this window and return to the application.</p>';
                  // Redirect to profile page as fallback after a delay
                  setTimeout(function() {
                    window.location.href = '${config.FRONTEND_URL}/profile?status=success';
                  }, 3000);
                }
              } catch (error) {
                console.error('Error communicating with parent window:', error);
                // Redirect to profile page as fallback
                setTimeout(function() {
                  window.location.href = '${config.FRONTEND_URL}/profile?status=success';
                }, 3000);
              }
            })();
          </script>
        </body>
        </html>
      `);
    } else {
      // Traditional redirect for non-popup flows
      res.redirect(`${config.FRONTEND_URL}/profile?status=success`);
    }
  } catch (error) {
    console.error("OAuth callback error:", error);
    const message =
      error instanceof AppError ? error.message : "Authorization failed";

    // Check if this is a popup request
    let isPopup = false;

    // Try to extract popup flag from state if available
    if (req.query.state && typeof req.query.state === "string") {
      try {
        const stateJson = Buffer.from(
          req.query.state as string,
          "base64"
        ).toString();
        const decodedState = JSON.parse(stateJson);
        isPopup = decodedState.popup === true;
      } catch (err) {
        // Fallback to other methods if state parsing fails
        console.error("Error parsing state for popup flag:", err);
      }
    }

    // Fallback to query param or user agent if state parsing failed
    if (!isPopup) {
      isPopup =
        req.query.popup === "true" ||
        (!!req.headers["user-agent"] &&
          req.headers["user-agent"].toString().includes("gmailAuthPopup"));
    }

    if (isPopup) {
      // Return HTML with JavaScript to communicate error to the parent window
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gmail Authentication Failed</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .error-message {
              margin: 20px;
              padding: 20px;
              background-color: #f8d7da;
              border-radius: 5px;
              color: #721c24;
            }
          </style>
        </head>
        <body>
          <div class="error-message">
            <h2>Authentication Failed</h2>
            <p>${message}</p>
            <p>This window will close automatically.</p>
          </div>
          <script>
            // Send error message to parent window and close
            (function() {
              try {
                if (window.opener && !window.opener.closed) {
                  // Log for debugging
                  console.log('Sending error message to parent window');
                  
                  // Send the message
                  window.opener.postMessage(
                    { 
                      type: 'gmail-auth-error',
                      message: '${message.replace(/'/g, "\\'")}'
                    }, 
                    '*'  // Use * to ensure the message gets through
                  );
                  
                  // Close immediately to prevent redirect
                  window.close();
                } else {
                  console.error('Opener window not available');
                  document.body.innerHTML += '<p>Please close this window and return to the application.</p>';
                  // Redirect to profile page as fallback after a delay
                  setTimeout(function() {
                    window.location.href = '${
                      config.FRONTEND_URL
                    }/profile?status=error&message=${encodeURIComponent(
        message
      )}';
                  }, 3000);
                }
              } catch (error) {
                console.error('Error communicating with parent window:', error);
                // Redirect to profile page as fallback
                setTimeout(function() {
                  window.location.href = '${
                    config.FRONTEND_URL
                  }/profile?status=error&message=${encodeURIComponent(
        message
      )}';
                }, 3000);
              }
            })();
          </script>
        </body>
        </html>
      `);
    } else {
      // Traditional redirect for non-popup flows
      res.redirect(
        `${
          config.FRONTEND_URL
        }/profile?status=error&message=${encodeURIComponent(message)}`
      );
    }
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
