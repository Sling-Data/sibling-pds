import express, { Request, Response } from "express";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../utils/ResponseHandler";
import { encrypt, decrypt } from "../utils/encryption";
import { errorHandler } from "../middleware/errorHandler";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";

const router = express.Router();

/**
 * TODO: Implement User "Me" Endpoints
 *
 * Create new endpoints to simplify access to the current user's data without requiring
 * the frontend to extract the user ID from the JWT token.
 *
 * Required endpoints:
 * - GET /users/me - Get current user profile (use req.userId from JWT token)
 * - PUT /users/me - Update current user profile (use req.userId from JWT token)
 * - GET /users/me/onboarding - Check if user has completed onboarding
 *
 * Implementation notes:
 * - These endpoints should reuse existing controller logic where possible
 * - Consider adding an onboarding status field to the user model if it doesn't exist
 */

interface CreateUserRequest {
  name: string;
  email: string;
}

interface UpdateUserRequest {
  name: string;
  email: string;
}

async function createUser(
  req: Request<{}, {}, CreateUserRequest>,
  res: Response
) {
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

async function updateUser(
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

async function getUser(req: Request<{ id: string }>, res: Response) {
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

// Create routes using RouteFactory
RouteFactory.createPostRoute(router, "/", createUser, schemas.createUser);
RouteFactory.createPutRoute(router, "/:id", updateUser, schemas.updateUser);
RouteFactory.createGetRoute(router, "/:id", getUser);

// Error handling middleware
router.use(errorHandler);

export default router;
