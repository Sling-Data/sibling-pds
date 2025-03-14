import express, { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";
import plaidClient from "../services/apiClients/plaidClient";
import scheduler from "../services/scheduler";
import { authenticateJWT } from "../middleware/auth";
import { RouteFactory } from "../utils/RouteFactory";
import { OAuthHandler } from "../services/OAuthHandler";

const router = express.Router();

// Apply JWT authentication to all routes in this router
router.use(authenticateJWT as express.RequestHandler);

async function testGmailToken(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const accessToken = await gmailClient.getAccessToken(userId);
  res.json({ accessToken });
}

async function getGmailAuthUrl(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Generate state parameter using OAuthHandler
  const state = OAuthHandler.generateState(userId, "gmail");
  const authUrl = gmailClient.generateAuthUrl(state);
  res.json({ authUrl });
}

async function testGmailFetch(req: Request, res: Response) {
  // Use userId from JWT token
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const data = await gmailClient.fetchGmailData(userId);
  res.json(data);
}

async function testPlaidToken(req: Request, res: Response) {
  // Use userId from JWT token
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  // Get auth response which could contain either access token or link token
  const authResponse = await plaidClient.getAccessToken(userId);
  res.json(authResponse);
}

async function getPlaidAuthUrl(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const response = await plaidClient.getAccessToken(userId);

  // Return the URL that would be redirected to
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
  } else if (response.linkToken) {
    OAuthHandler.handleCallback(res, true, undefined, undefined, {
      linkToken: response.linkToken,
    });
  } else {
    throw new AppError("Failed to get link token", 500);
  }
}

async function testPlaidFetch(req: Request, res: Response) {
  // Use userId from JWT token
  const userId = req.userId;
  if (!userId) {
    throw new AppError("Authentication required", 401);
  }

  const plaidData = await plaidClient.fetchPlaidData(userId);
  res.json(plaidData);
}

async function runDataIngestion(_req: Request, res: Response) {
  console.log("Manually triggering data ingestion process");
  await scheduler.runDataIngestionNow();
  res.json({ message: "Data ingestion process triggered successfully" });
}

// Create routes using RouteFactory
RouteFactory.createGetRoute(router, "/test-gmail-token", testGmailToken);
RouteFactory.createGetRoute(router, "/gmail-auth-url", getGmailAuthUrl);
RouteFactory.createGetRoute(router, "/test-gmail-fetch", testGmailFetch);
RouteFactory.createGetRoute(router, "/test-plaid-token", testPlaidToken);
RouteFactory.createGetRoute(router, "/plaid-auth-url", getPlaidAuthUrl);
RouteFactory.createGetRoute(router, "/test-plaid-fetch", testPlaidFetch);
RouteFactory.createGetRoute(router, "/run-data-ingestion", runDataIngestion);

export default router;
