import express, { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import plaidClient from "../services/apiClients/plaidClient";
import { schemas } from "../middleware/validation";
import { RouteFactory } from "../utils/RouteFactory";

const router = express.Router();

async function createLinkToken(req: Request, res: Response) {
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

async function exchangePublicToken(req: Request, res: Response) {
  const { public_token, userId } = req.body;

  try {
    await plaidClient.exchangePublicToken(public_token, userId);
    res.json({ success: true });
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

// Create routes using RouteFactory
RouteFactory.createProtectedRoute(
  router,
  "/plaid/create-link-token",
  createLinkToken,
  schemas.userIdQuery,
  "query"
);
RouteFactory.createPostRoute(
  router,
  "/plaid/exchange-public-token",
  exchangePublicToken,
  schemas.plaidTokenExchange
);

export default router;
