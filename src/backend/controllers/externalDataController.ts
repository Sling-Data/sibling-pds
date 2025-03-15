import { Request, Response } from "express";
import { encrypt } from "../utils/encryption";
import ExternalData from "../models/ExternalDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../utils/ResponseHandler";
import { Types } from "mongoose";

interface CreateExternalDataRequest {
  userId: string;
  source: string;
  data: any;
}

/**
 * Create external data for a user
 */
export async function createExternalData(
  req: Request<{}, {}, CreateExternalDataRequest>,
  res: Response
) {
  const { userId, source, data } = req.body;

  if (!userId || !source || !data) {
    throw new AppError("userId, source, and data are required", 400);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const encryptedData = encrypt(JSON.stringify(data));

  const externalData = await ExternalData.create({
    userId,
    source,
    data: encryptedData,
  });

  user.externalData.push(externalData._id as Types.ObjectId);
  await user.save();

  ResponseHandler.success(res, externalData, 201);
}
