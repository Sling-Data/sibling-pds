import express, { Request, Response } from "express";
import { AppError } from "../middleware/errorHandler";
import plaidClient from "../services/apiClients/plaidClient";

const router = express.Router();

// Wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      console.error("API route error:", error);
      const status = error instanceof AppError ? error.statusCode : 500;
      const message = error instanceof AppError ? error.message : "Internal server error";
      res.status(status).json({ error: message });
    });
  };
};

// Create a Plaid link token
router.get(
  "/plaid/create-link-token",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      throw new AppError("userId is required as a query parameter", 400);
    }

    try {
      const linkToken = await plaidClient.createLinkToken(userId);
      res.json({ link_token: linkToken });
    } catch (error) {
      console.error("Error creating link token:", error);
      throw new AppError(
        error instanceof Error ? error.message : "Failed to create link token",
        500
      );
    }
  })
);

// Exchange a public token for an access token
router.post(
  "/plaid/exchange-public-token",
  asyncHandler(async (req: Request, res: Response) => {
    const { public_token, userId } = req.body;

    if (!public_token || typeof public_token !== "string") {
      throw new AppError("public_token is required in the request body", 400);
    }

    if (!userId || typeof userId !== "string") {
      throw new AppError("userId is required in the request body", 400);
    }

    try {
      await plaidClient.exchangePublicToken(public_token, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error exchanging public token:", error);
      throw new AppError(
        error instanceof Error ? error.message : "Failed to exchange public token",
        500
      );
    }
  })
);

export default router;
