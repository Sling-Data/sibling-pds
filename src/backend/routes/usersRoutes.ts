import express, { Request, Response } from "express";
import {
  createUser,
  getUser,
  updateUser,
} from "../controllers/usersController";
import { errorHandler } from "../middleware/errorHandler";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";

const router = express.Router();

class UsersRouteHandler extends BaseRouteHandler {
  async createUser(
    req: Request<{}, {}, { name: string; email: string; password?: string }>,
    res: Response
  ) {
    return createUser(req, res);
  }

  async getUser(req: Request<{ id: string }>, res: Response) {
    return getUser(req, res);
  }

  async updateUser(
    req: Request<
      { id: string },
      {},
      { name: string; email: string; password?: string }
    >,
    res: Response
  ) {
    return updateUser(req, res);
  }
}

const usersHandler = new UsersRouteHandler();

// POST /users - Create a new user
router.post(
  "/",
  usersHandler.createAsyncHandler(usersHandler.createUser.bind(usersHandler))
);

// GET /users/:id - Get a user by ID
router.get(
  "/:id",
  usersHandler.createAsyncHandler(usersHandler.getUser.bind(usersHandler))
);

// PUT /users/:id - Update a user
router.put(
  "/:id",
  usersHandler.createAsyncHandler(usersHandler.updateUser.bind(usersHandler))
);

// Error handling middleware
router.use(errorHandler);

export default router;
