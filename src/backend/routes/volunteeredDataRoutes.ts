import express from "express";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import { createVolunteeredData } from "../controllers/volunteeredDataController";

const router = express.Router();

// Create routes using RouteFactory
RouteFactory.createPostRoute(
  router,
  "/",
  createVolunteeredData,
  schemas.volunteeredData
);

export default router;
