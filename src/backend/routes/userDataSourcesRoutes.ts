import express, { Request, Response } from "express";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { AppError } from "../middleware/errorHandler";
import { BaseRouteHandler } from "../utils/BaseRouteHandler";
import { ResponseHandler } from "../utils/ResponseHandler";

const router = express.Router();

interface StoreCredentialsRequest {
  userId: string;
  dataSourceType: string;
  credentials: any;
}

class UserDataSourcesRouteHandler extends BaseRouteHandler {
  async storeCredentials(
    req: Request<{}, {}, StoreCredentialsRequest>,
    res: Response
  ) {
    const { userId, dataSourceType, credentials } = req.body;

    if (!userId || !dataSourceType || !credentials) {
      throw new AppError(
        "userId, dataSourceType, and credentials are required",
        400
      );
    }

    if (
      !Object.values(DataSourceType).includes(dataSourceType as DataSourceType)
    ) {
      throw new AppError(
        `Invalid data source type. Must be one of: ${Object.values(
          DataSourceType
        ).join(", ")}`,
        400
      );
    }

    const dataSource = await UserDataSourcesModel.storeCredentials(
      userId,
      dataSourceType as DataSourceType,
      credentials
    );

    ResponseHandler.success(
      res,
      {
        _id: dataSource._id,
        userId: dataSource.userId,
        dataSourceType: dataSource.dataSourceType,
        lastIngestedAt: dataSource.lastIngestedAt,
      },
      201
    );
  }

  async getCredentials(
    req: Request<{ userId: string; dataSourceType: string }>,
    res: Response
  ) {
    const { userId, dataSourceType } = req.params;

    if (
      !Object.values(DataSourceType).includes(dataSourceType as DataSourceType)
    ) {
      throw new AppError(
        `Invalid data source type. Must be one of: ${Object.values(
          DataSourceType
        ).join(", ")}`,
        400
      );
    }

    const credentials = await UserDataSourcesModel.getCredentials(
      userId,
      dataSourceType as DataSourceType
    );

    if (!credentials) {
      throw new AppError(
        `No credentials found for user ${userId} and data source ${dataSourceType}`,
        404
      );
    }

    ResponseHandler.success(res, { credentials });
  }
}

const userDataSourcesHandler = new UserDataSourcesRouteHandler();

// Store credentials for a data source
router.post(
  "/",
  userDataSourcesHandler.createAsyncHandler(
    userDataSourcesHandler.storeCredentials.bind(userDataSourcesHandler)
  )
);

// Get credentials for a data source
router.get(
  "/:userId/:dataSourceType",
  userDataSourcesHandler.createAsyncHandler(
    userDataSourcesHandler.getCredentials.bind(userDataSourcesHandler)
  )
);

export default router;
