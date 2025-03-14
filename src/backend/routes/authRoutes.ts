import express, { Request, Response } from "express";
import { refreshAccessToken } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { schemas } from "../middleware/validation";
import { ResponseHandler } from "../utils/ResponseHandler";
import { RouteFactory } from "../utils/RouteFactory";

const router = express.Router();

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
RouteFactory.createPostRoute(
  router,
  "/refresh-token",
  refreshToken,
  schemas.refreshToken
);

export default router;
