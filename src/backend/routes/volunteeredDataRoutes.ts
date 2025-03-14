import express, { Request, Response } from "express";
import { encrypt } from "../utils/encryption";
import VolunteeredData from "../models/VolunteeredDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { ResponseHandler } from "../utils/ResponseHandler";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";

const router = express.Router();

interface CreateVolunteeredDataRequest {
  userId: string;
  type: string;
  value: any;
}

async function createVolunteeredData(
  req: Request<{}, {}, CreateVolunteeredDataRequest>,
  res: Response
) {
  const { userId, type, value } = req.body;

  if (!userId || !type || !value) {
    throw new AppError("userId, type, and value are required", 400);
  }

  const encryptedValue = encrypt(value.toString());
  const volunteeredData = new VolunteeredData({
    userId,
    type,
    value: encryptedValue,
  });

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

// Create routes using RouteFactory
RouteFactory.createPostRoute(
  router,
  "/",
  createVolunteeredData,
  schemas.volunteeredData
);

export default router;
