import { Router } from "express";
import gmailClient from "../services/apiClients/gmailClient";

const router = Router();

router.get("/gmail", async (_, res) => {
  const authUrl = await gmailClient.generateAuthUrl();
  res.redirect(authUrl);
});

export default router;
