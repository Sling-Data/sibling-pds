import express, { Request, Response } from "express";
import { decrypt } from "../utils/encryption";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { Document, Types } from "mongoose";
import { EncryptedData } from "../utils/encryption";
import { ResponseHandler } from "../utils/ResponseHandler";
import { RouteFactory } from "../utils/RouteFactory";
import { schemas } from "../middleware/validation";

const router = express.Router();

interface UserDocument extends Document {
  name: EncryptedData;
  email: EncryptedData;
  volunteeredData: Types.ObjectId[];
  behavioralData: Types.ObjectId[];
  externalData: Types.ObjectId[];
}

async function getUserData(req: Request<{ id: string }>, res: Response) {
  const user = await UserModel.findById<UserDocument>(req.params.id)
    .populate("volunteeredData")
    .populate("behavioralData")
    .populate("externalData");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const decryptedName = decrypt(user.name);
  const decryptedEmail = decrypt(user.email);

  const volunteeredData = await Promise.all(
    user.volunteeredData.map(async (data: any) => ({
      _id: data._id,
      type: data.type,
      value: decrypt(data.value),
    }))
  );

  const behavioralData = await Promise.all(
    user.behavioralData.map(async (data: any) => ({
      _id: data._id,
      action: data.action,
      context: JSON.parse(decrypt(data.context)),
    }))
  );

  const externalData = await Promise.all(
    user.externalData.map(async (data: any) => ({
      _id: data._id,
      source: data.source,
      data: JSON.parse(decrypt(data.data)),
    }))
  );

  ResponseHandler.success(res, {
    user: { _id: user._id, name: decryptedName, email: decryptedEmail },
    volunteeredData,
    behavioralData,
    externalData,
  });
}

// Create routes using RouteFactory
RouteFactory.createGetRoute(
  router,
  "/:id",
  getUserData,
  schemas.userIdParam,
  "params"
);

export default router;
