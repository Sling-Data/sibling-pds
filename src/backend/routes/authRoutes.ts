import express from "express";
import { schemas } from "../middleware/validation";
import { RouteFactory } from "../utils/RouteFactory";
import { login, signup, refreshToken } from "../controllers/authController";

const protectedRouter = express.Router();
const publicRouter = express.Router();

// Create protected routes using RouteFactory
RouteFactory.createPostRoute(
  publicRouter,
  "/refresh-token",
  refreshToken,
  schemas.refreshToken
);

// Create public routes using RouteFactory
RouteFactory.createPostRoute(publicRouter, "/login", login, schemas.login);
RouteFactory.createPostRoute(publicRouter, "/signup", signup, schemas.signup);

export default { protectedRouter, publicRouter };
