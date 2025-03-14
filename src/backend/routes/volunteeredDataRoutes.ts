import express, { Request, Response } from "express";
import { encrypt } from "../utils/encryption";
import VolunteeredData from "../models/VolunteeredDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";

const router = express.Router();

class VolunteeredDataRouteHandler extends BaseRouteHandler {
  async createVolunteeredData(req: Request, res: Response) {
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
  }
}

const volunteeredDataHandler = new VolunteeredDataRouteHandler();

router.post(
  "/",
  volunteeredDataHandler.createAsyncHandler(
    volunteeredDataHandler.createVolunteeredData.bind(volunteeredDataHandler)
  )
);

export default router;
