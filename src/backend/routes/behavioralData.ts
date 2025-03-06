import express, { Request, Response, NextFunction } from "express";
import { encrypt } from "../utils/encryption";
import BehavioralData from "../models/BehavioralDataModel";
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
    const { userId, action, context } = req.body;
    if (!userId || !action || context === undefined) {
      throw new AppError("userId, action, and context are required", 400);
    }

    const encryptedContext = encrypt(JSON.stringify(context));
    const behavioralData = new BehavioralData({
      userId,
      action,
      context: encryptedContext,
    });

    const savedData = await behavioralData.save();
    await UserModel.findByIdAndUpdate(userId, {
      $push: { behavioralData: savedData._id },
    });

    res.status(201).json({
      _id: savedData._id,
      action: savedData.action,
      userId: savedData.userId,
      context: encryptedContext,
    });
  })
);

export default router;
