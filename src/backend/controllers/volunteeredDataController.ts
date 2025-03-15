import { Request, Response } from "express";
import { encrypt } from "../utils/encryption";
import VolunteeredData from "../models/VolunteeredDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../utils/ResponseHandler";

interface CreateVolunteeredDataRequest {
  userId: string;
  type: string;
  value: any;
}

/**
 * Create volunteered data for a user
 */
export async function createVolunteeredData(
  req: Request<{}, {}, CreateVolunteeredDataRequest>,
  res: Response
) {
  const { userId, type, value } = req.body;

  if (!userId || !type || !value) {
    throw new AppError("userId, type, and value are required", 400);
  }

  const encryptedValue = encrypt(JSON.stringify(value));
  const volunteeredData = new VolunteeredData({
    userId,
    type,
    value: encryptedValue,
  });

  console.log({ value });

  const savedData = await volunteeredData.save();
  await UserModel.findByIdAndUpdate(userId, {
    $push: { volunteeredData: savedData._id },
  });

  ResponseHandler.success(
    res,
    {
      _id: savedData._id,
      type: savedData.type,
      userId: savedData.userId,
      value: encryptedValue,
    },
    201
  );
}
