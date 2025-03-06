import express, { Request, Response, NextFunction } from "express";
import { decrypt } from "../utils/encryption";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { Document, Types } from "mongoose";
import { EncryptedData } from "../utils/encryption";

const router = express.Router();

interface UserDocument extends Document {
  name: EncryptedData;
  email: EncryptedData;
  volunteeredData: Types.ObjectId[];
  behavioralData: Types.ObjectId[];
  externalData: Types.ObjectId[];
}

// Wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      // Format error response to match existing tests
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    });
  };
};

router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
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

    res.json({
      user: { _id: user._id, name: decryptedName, email: decryptedEmail },
      volunteeredData,
      behavioralData,
      externalData,
    });
  })
);

export default router;
