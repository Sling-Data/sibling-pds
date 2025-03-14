import express, { Request, Response } from "express";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";
import { ResponseHandler } from "../utils/ResponseHandler";
import { encrypt, decrypt } from "../utils/encryption";
import { errorHandler } from "../middleware/errorHandler";

const router = express.Router();

interface CreateUserRequest {
  name: string;
  email: string;
}

interface UpdateUserRequest {
  name: string;
  email: string;
}

class UsersRouteHandler extends BaseRouteHandler {
  async createUser(req: Request<{}, {}, CreateUserRequest>, res: Response) {
    const { name, email } = req.body;

    if (!name || !email) {
      throw new AppError("Name and email are required", 400);
    }

    const encryptedName = encrypt(name);
    const encryptedEmail = encrypt(email);
    const encryptedPassword = encrypt("defaultPassword123"); // Default password for testing

    const user = await UserModel.create({
      name: encryptedName,
      email: encryptedEmail,
      password: encryptedPassword,
    });

    ResponseHandler.success(
      res,
      {
        _id: user._id,
        name: encryptedName,
        email: encryptedEmail,
      },
      201
    );
  }

  async updateUser(
    req: Request<{ id: string }, {}, UpdateUserRequest>,
    res: Response
  ) {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      throw new AppError("Name and email are required", 400);
    }

    const encryptedName = encrypt(name);
    const encryptedEmail = encrypt(email);

    const user = await UserModel.findByIdAndUpdate(
      id,
      {
        name: encryptedName,
        email: encryptedEmail,
      },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    ResponseHandler.success(res, {
      _id: user._id,
      name: encryptedName,
      email: encryptedEmail,
    });
  }

  async getUser(req: Request<{ id: string }>, res: Response) {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const decryptedName = decrypt(user.name);
    const decryptedEmail = decrypt(user.email);

    ResponseHandler.success(res, {
      _id: user._id,
      name: decryptedName,
      email: decryptedEmail,
    });
  }
}

const usersHandler = new UsersRouteHandler();

// POST /users - Create a new user
router.post(
  "/",
  usersHandler.createAsyncHandler(usersHandler.createUser.bind(usersHandler))
);

// PUT /users/:id - Update a user
router.put(
  "/:id",
  usersHandler.createAsyncHandler(usersHandler.updateUser.bind(usersHandler))
);

// GET /users/:id - Get a user by ID
router.get(
  "/:id",
  usersHandler.createAsyncHandler(usersHandler.getUser.bind(usersHandler))
);

// Error handling middleware
router.use(errorHandler);

export default router;
