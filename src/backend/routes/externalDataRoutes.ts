import express, { Request, Response } from "express";
import { encrypt } from "../utils/encryption";
import ExternalData from "../models/ExternalDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";

const router = express.Router();

class ExternalDataRouteHandler extends BaseRouteHandler {
  async createExternalData(req: Request, res: Response) {
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
  }
}

const externalDataHandler = new ExternalDataRouteHandler();

router.post(
  "/",
  externalDataHandler.createAsyncHandler(
    externalDataHandler.createExternalData.bind(externalDataHandler)
  )
);

export default router;
