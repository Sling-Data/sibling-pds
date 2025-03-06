import { Router } from "express";
import gmailClient from "../services/apiClients/gmailClient";
import { AppError } from "../middleware/errorHandler";

const router = Router();

router.get("/gmail", async (req, res) => {
  const userId = req.query.userId;
  if (!userId || typeof userId !== "string") {
    throw new AppError("userId is required as a query parameter", 400);
  }

  // Generate state parameter with userId and random string for CSRF protection
  const stateBuffer = Buffer.from(
    JSON.stringify({
      userId,
      nonce: Math.random().toString(36).substring(2),
    })
  ).toString("base64");

  const authUrl = await gmailClient.generateAuthUrl(stateBuffer);
  res.redirect(authUrl);
});

export default router;
