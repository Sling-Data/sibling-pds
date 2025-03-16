import express from "express";
import { schemas } from "../middleware/validation";
import { RouteFactory } from "../utils/RouteFactory";
import {
  gmailAuth,
  plaidAuth,
  plaidCallback,
  createLinkToken,
  exchangePublicToken,
  gmailCallback,
  generateGmailAuthUrl,
} from "../controllers/apiClientController";

const protectedRouter = express.Router();
const publicRouter = express.Router();

// Gmail routes
RouteFactory.createGetRoute(protectedRouter, "/gmail", gmailAuth);
RouteFactory.createGetRoute(publicRouter, "/gmail/callback", gmailCallback);
RouteFactory.createGetRoute(
  protectedRouter,
  "/gmail/auth-url",
  generateGmailAuthUrl
);

// Plaid routes
RouteFactory.createGetRoute(protectedRouter, "/plaid", plaidAuth);
RouteFactory.createGetRoute(protectedRouter, "/plaid/callback", plaidCallback);
RouteFactory.createGetRoute(
  protectedRouter,
  "/plaid/create-link-token",
  createLinkToken,
  schemas.userId,
  "query"
);
RouteFactory.createPostRoute(
  protectedRouter,
  "/plaid/exchange-public-token",
  exchangePublicToken,
  schemas.plaidTokenExchange
);

export default { protectedRouter, publicRouter };
