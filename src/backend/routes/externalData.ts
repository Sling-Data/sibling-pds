import express, { Request, Response, NextFunction } from "express";
import { encrypt } from "../utils/encryption";
import ExternalData from "../models/ExternalDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";

const router = express.Router();

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

router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId, source, data } = req.body;
    if (!userId || !source || data === undefined) {
      throw new AppError("userId, source, and data are required", 400);
    }

    const encryptedData = encrypt(JSON.stringify(data));
    const externalData = new ExternalData({
      userId,
      source,
      data: encryptedData,
    });

    const savedData = await externalData.save();
    await UserModel.findByIdAndUpdate(userId, {
      $push: { externalData: savedData._id },
    });

    res.status(201).json({
      _id: savedData._id,
      source: savedData.source,
      userId: savedData.userId,
      data: encryptedData,
    });
  })
);

export default router;
