import express, { Request, Response, RequestHandler } from "express";
import { AppError } from "../middleware/errorHandler";
import plaidClient from "../services/apiClients/plaidClient";
import { validate, schemas } from "../middleware/validation";
import Joi from "joi";

const router = express.Router();

// Wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      console.error("API route error:", error);
      const status = error instanceof AppError ? error.statusCode : 500;
      const message =
        error instanceof AppError ? error.message : "Internal server error";
      res.status(status).json({ error: message });
    });
  };
};

// Create a Plaid link token
router.get(
  "/plaid/create-link-token",
  validate(schemas.userId, "query") as RequestHandler,
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);

// Exchange a public token for an access token
router.post(
  "/plaid/exchange-public-token",
  validate(
    Joi.object({
      public_token: Joi.string().required().messages({
        "string.empty": "public_token cannot be empty",
        "any.required": "public_token is required",
      }),
      userId: Joi.string().required().messages({
        "string.empty": "userId cannot be empty",
        "any.required": "userId is required",
      }),
    })
  ) as RequestHandler,
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);

export default router;
