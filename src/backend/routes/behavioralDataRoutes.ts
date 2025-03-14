import express, { Request, Response } from "express";
import BehavioralDataModel from "../models/BehavioralDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../utils/ResponseHandler";
import { encrypt } from "../utils/encryption";
import { Types } from "mongoose";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";

const router = express.Router();

interface CreateBehavioralDataRequest {
  userId: string;
  action: string;
  context: any;
}

async function createBehavioralData(
  req: Request<{}, {}, CreateBehavioralDataRequest>,
  res: Response
) {
  const { userId, action, context } = req.body;

  if (!userId || !action || !context) {
    throw new AppError("userId, action, and context are required", 400);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const encryptedContext = encrypt(JSON.stringify(context));

  const behavioralData = await BehavioralDataModel.create({
    userId,
    action,
    context: encryptedContext,
  });

  user.behavioralData.push(behavioralData._id as Types.ObjectId);
  await user.save();

  ResponseHandler.success(res, behavioralData, 201);
}

// Create routes using RouteFactory
RouteFactory.createPostRoute(
  router,
  "/",
  createBehavioralData,
  schemas.behavioralData
);

export default router;
