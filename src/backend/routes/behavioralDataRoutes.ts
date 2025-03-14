import express, { Request, Response } from "express";
import { encrypt } from "../utils/encryption";
import BehavioralData from "../models/BehavioralDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";

const router = express.Router();

class BehavioralDataRouteHandler extends BaseRouteHandler {
  async createBehavioralData(req: Request, res: Response) {
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
  }
}

const behavioralDataHandler = new BehavioralDataRouteHandler();

router.post(
  "/",
  behavioralDataHandler.createAsyncHandler(
    behavioralDataHandler.createBehavioralData.bind(behavioralDataHandler)
  )
);

export default router;
