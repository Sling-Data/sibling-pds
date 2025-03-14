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
