import express from "express";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";
import { createVolunteeredData } from "../controllers/volunteeredDataController";

const router = express.Router();

/**
 * TODO: Implement Missing Volunteered Data Endpoints
 *
 * Create additional endpoints to provide complete CRUD operations for volunteered data.
 *
 * Required endpoints:
 * - GET /volunteered-data - Get all volunteered data for the current user (use req.userId)
 * - GET /volunteered-data/:id - Get volunteered data by ID
 * - PUT /volunteered-data/:id - Update volunteered data
 * - DELETE /volunteered-data/:id - Delete volunteered data
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
  createVolunteeredData,
  schemas.volunteeredData
);

export default router;
