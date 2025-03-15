import express from "express";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import { createExternalData } from "../controllers/externalDataController";

const router = express.Router();

// Create routes using RouteFactory
RouteFactory.createPostRoute(
  router,
  "/",
  createExternalData,
  schemas.externalData
);

export default router;
