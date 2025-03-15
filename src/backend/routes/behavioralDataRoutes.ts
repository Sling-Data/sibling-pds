import express, { Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import {
  createBehavioralData,
  getBehavioralData,
  getUserBehavioralData,
} from "../controllers/behavioralDataController";

const router = express.Router();

/**
 * TODO: Implement Missing Behavioral Data Endpoints
 *
 * Create additional endpoints to provide more convenient access to behavioral data.
 *
 * Required endpoints:
 * - GET /behavioral-data - Get all behavioral data for the current user (use req.userId)
 *
 * Implementation notes:
 * - This endpoint should reuse the existing getUserBehavioralData controller function
 * - Follow the existing patterns for route creation using RouteFactory
 * - Ensure proper error handling and response formatting
 */

// Define param interfaces for type safety
interface IdParams extends ParamsDictionary {
  id: string;
}

interface UserIdParams extends ParamsDictionary {
  userId: string;
}

// Create behavioral data
RouteFactory.createPostRoute(
  router,
  "/",
  createBehavioralData,
  schemas.behavioralData
);

// Get behavioral data by ID
RouteFactory.createGetRoute<IdParams>(
  router,
  "/:id",
  (req: Request<IdParams>, res) => getBehavioralData(req, res)
);

// Get all behavioral data for a user
RouteFactory.createGetRoute<UserIdParams>(
  router,
  "/user/:userId",
  (req: Request<UserIdParams>, res) => getUserBehavioralData(req, res)
);

export default router;
