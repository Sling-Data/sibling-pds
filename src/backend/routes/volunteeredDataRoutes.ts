import express, { Request, Response } from "express";
import { encrypt } from "../utils/encryption";
import VolunteeredData from "../models/VolunteeredDataModel";
import UserModel from "../models/UserModel";
import { AppError } from "../middleware/errorHandler";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";
import { ResponseHandler } from "../utils/ResponseHandler";

const router = express.Router();

interface CreateVolunteeredDataRequest {
  userId: string;
  type: string;
  value: any;
}

class VolunteeredDataRouteHandler extends BaseRouteHandler {
  async createVolunteeredData(
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
}

const volunteeredDataHandler = new VolunteeredDataRouteHandler();

router.post(
  "/",
  volunteeredDataHandler.createAsyncHandler(
    volunteeredDataHandler.createVolunteeredData.bind(volunteeredDataHandler)
  )
);

export default router;
