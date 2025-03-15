import express from "express";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import {
  storeCredentials,
  getCredentials,
} from "../controllers/userDataSourcesController";

const router = express.Router();

/**
 * TODO: Implement User Data Sources Endpoints
 *
 * Create endpoints to manage user data sources (external service connections).
 *
 * Required endpoints:
 * - GET /user-data-sources - Get all user data sources for the current user
 * - POST /user-data-sources - Connect a new data source
 * - DELETE /user-data-sources/:id - Disconnect a data source
 *
 * Implementation notes:
 * - Create a controller file (userDataSourcesController.ts) with appropriate functions
 * - Follow the existing patterns for route creation using RouteFactory
 * - Implement appropriate validation schemas for each endpoint
 * - Ensure proper error handling and response formatting
 * - Make sure to check that users can only access their own data sources
 * - Consider implementing secure storage for credentials (using encryption)
 */

// TODO: Implement controller functions and create routes

// Create routes using RouteFactory
RouteFactory.createPostRoute(
  router,
  "/",
  storeCredentials,
  schemas.userDataSources
);
RouteFactory.createGetRoute(router, "/:userId/:dataSourceType", getCredentials);

export default router;
