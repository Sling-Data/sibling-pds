import express from "express";
import {
  createUser,
  getUser,
  updateUser,
} from "../controllers/usersController";

const router = express.Router();

// POST /users - Create a new user
router.post("/", createUser);

// GET /users/:id - Get a user by ID
router.get("/:id", getUser);

// PUT /users/:id - Update a user
router.put("/:id", updateUser);

export default router;
