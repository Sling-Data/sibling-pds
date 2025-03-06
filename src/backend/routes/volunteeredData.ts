import express, { Request, Response, NextFunction } from "express";
import { encrypt } from "../utils/encryption";
import VolunteeredData from "../models/VolunteeredDataModel";
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
    const { userId, type, value } = req.body;
    if (!userId || !type || value === undefined) {
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

    res.status(201).json({
      _id: savedData._id,
      type: savedData.type,
      userId: savedData.userId,
      value: encryptedValue,
    });
  })
);

export default router;
