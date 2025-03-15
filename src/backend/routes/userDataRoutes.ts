import express from "express";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import { getUserData } from "../controllers/userDataController";

const router = express.Router();

// Create routes using RouteFactory
RouteFactory.createGetRoute(
  router,
  "/:id",
  getUserData,
  schemas.userIdParam,
  "params"
);

export default router;
