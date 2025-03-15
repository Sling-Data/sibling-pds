import express from "express";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import { createExternalData } from "../controllers/externalDataController";

const router = express.Router();

/**
 * TODO: Implement Missing External Data Endpoints
 *
 * Create additional endpoints to provide more comprehensive access to external data.
 *
 * Required endpoints:
 * - GET /external-data - Get all external data for the current user (use req.userId)
 * - GET /external-data/source/:source - Get external data by source
 *
 * Implementation notes:
 * - Follow the existing patterns for route creation using RouteFactory
 * - Implement appropriate validation schemas for each endpoint
 * - Ensure proper error handling and response formatting
 * - Make sure to check that users can only access their own data
 */

// Create routes using RouteFactory
RouteFactory.createPostRoute(
  router,
  "/",
  createExternalData,
  schemas.externalData
);

export default router;
