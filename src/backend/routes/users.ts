import express from "express";
import {
  createUser,
  getUser,
  updateUser,
} from "../controllers/usersController";
import { errorHandler } from "../middleware/errorHandler";

const router = express.Router();

// Wrap async route handlers to catch errors
const asyncHandler =
  (fn: Function) =>
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// POST /users - Create a new user
router.post("/", asyncHandler(createUser));

// GET /users/:id - Get a user by ID
router.get("/:id", asyncHandler(getUser));

// PUT /users/:id - Update a user
router.put("/:id", asyncHandler(updateUser));

// Error handling middleware
router.use(errorHandler);

export default router;
