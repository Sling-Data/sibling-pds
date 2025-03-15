import express from "express";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import {
  storeCredentials,
  getCredentials,
} from "../controllers/userDataSourcesController";

const router = express.Router();

// Create routes using RouteFactory
RouteFactory.createPostRoute(
  router,
  "/",
  storeCredentials,
  schemas.userDataSources
);
RouteFactory.createGetRoute(router, "/:userId/:dataSourceType", getCredentials);

export default router;
