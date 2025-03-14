import { Request, Response } from "express";
import BehavioralDataModel from "../models/BehavioralDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../utils/ResponseHandler";
import { encrypt, decrypt } from "../utils/encryption";
import { Types } from "mongoose";

interface CreateBehavioralDataRequest {
  userId: string;
  action: string;
  context: any;
}

interface GetBehavioralDataParams {
  id: string;
}

/**
 * Create a new behavioral data entry
 * @param req Request with behavioral data information
 * @param res Response object
 */
export async function createBehavioralData(
  req: Request<{}, {}, CreateBehavioralDataRequest>,
  res: Response
) {
  const { userId, action, context } = req.body;

  // Validate input
  if (!userId || !action || !context) {
    throw new AppError("userId, action, and context are required", 400);
  }

  // Check if user exists
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Encrypt context data
  const encryptedContext = encrypt(JSON.stringify(context));

  // Create behavioral data entry
  const behavioralData = await BehavioralDataModel.create({
    userId,
    action,
    context: encryptedContext,
  });

  // Add reference to user
  user.behavioralData.push(behavioralData._id as Types.ObjectId);
  await user.save();

  ResponseHandler.success(res, behavioralData, 201);
}

/**
 * Get behavioral data by ID
 * @param req Request with behavioral data ID
 * @param res Response object
 */
export async function getBehavioralData(
  req: Request<GetBehavioralDataParams>,
  res: Response
) {
  const behavioralData = await BehavioralDataModel.findById(req.params.id);

  if (!behavioralData) {
    throw new AppError("Behavioral data not found", 404);
  }

  // Decrypt context for response
  const decryptedData = {
    ...behavioralData.toObject(),
    context: JSON.parse(decrypt(behavioralData.context)),
  };

  ResponseHandler.success(res, decryptedData);
}

/**
 * Get all behavioral data for a user
 * @param req Request with user ID
 * @param res Response object
 */
export async function getUserBehavioralData(
  req: Request<{ userId: string }>,
  res: Response
) {
  const { userId } = req.params;

  // Check if user exists
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const behavioralData = await BehavioralDataModel.find({ userId });

  // Decrypt context for each entry
  const decryptedData = await Promise.all(
    behavioralData.map(async (data) => ({
      ...data.toObject(),
      context: JSON.parse(decrypt(data.context)),
    }))
  );

  ResponseHandler.success(res, decryptedData);
}
