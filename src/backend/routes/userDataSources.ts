import express, { Request, Response, NextFunction } from "express";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { AppError } from "../middleware/errorHandler";
import gmailClient from "../services/apiClients/gmailClient";

const router = express.Router();

// Wrap async route handlers
const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        next(error);
      }
    });
  };
};

// Store credentials for a data source
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
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

    res.status(201).json({
      _id: dataSource._id,
      userId: dataSource.userId,
      dataSourceType: dataSource.dataSourceType,
      lastIngestedAt: dataSource.lastIngestedAt,
    });
  })
);

// Get credentials for a data source
router.get(
  "/:userId/:dataSourceType",
  asyncHandler(async (req: Request, res: Response) => {
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

    res.json({
      credentials,
    });
  })
);

// Temporary endpoint for testing Gmail token generation
router.post(
  "/test-gmail-token",
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
      throw new AppError("userId is required", 400);
    }

    const accessToken = await gmailClient.getAccessToken(userId);
    res.json({ accessToken });
  })
);

// Get Gmail authorization URL
router.get(
  "/gmail-auth-url",
  asyncHandler(async (_req: Request, res: Response) => {
    const authUrl = gmailClient.generateAuthUrl();
    res.json({ authUrl });
  })
);

export default router;
