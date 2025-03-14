import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import * as cron from "node-cron";
import {
  startScheduler,
  runDataIngestionNow,
} from "@backend/services/scheduler";
import gmailClient from "@backend/services/apiClients/gmailClient";
import plaidClient from "@backend/services/apiClients/plaidClient";
import UserDataSourcesModel, {
  DataSourceType,
} from "@backend/models/UserDataSourcesModel";
import { AppError } from "@backend/middleware/errorHandler";

// Mock dependencies
jest.mock("node-cron", () => ({
  schedule: jest.fn().mockReturnValue({
    stop: jest.fn(),
  }),
}));

jest.mock("@backend/services/apiClients/gmailClient", () => ({
  fetchGmailData: jest.fn(),
}));

jest.mock("@backend/services/apiClients/plaidClient", () => ({
  fetchPlaidData: jest.fn(),
}));

jest.mock("@backend/models/UserDataSourcesModel", () => ({
  getUsersWithDataSource: jest.fn(),
  updateLastIngestedAt: jest.fn(),
  DataSourceType: {
    GMAIL: "gmail",
    PLAID: "plaid",
  },
}));

// Mock setTimeout to execute immediately in tests
jest.mock(
  "global",
  () => ({
    ...global,
    setTimeout: (fn: Function) => fn(),
  }),
  { virtual: true }
);

describe("Scheduler", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe("startScheduler", () => {
    it("should initialize cron with the correct schedule", () => {
      startScheduler();

      expect(cron.schedule).toHaveBeenCalledWith(
        "0 2 * * *", // Default schedule (2 AM daily)
        expect.any(Function)
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          "Starting scheduler with cron expression: 0 2 * * *"
        )
      );
    });

    it("should use custom schedule if provided", () => {
      const customSchedule = "*/10 * * * *"; // Every 10 minutes
      startScheduler({ cronExpression: customSchedule });

      expect(cron.schedule).toHaveBeenCalledWith(
        customSchedule,
        expect.any(Function)
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          `Starting scheduler with cron expression: ${customSchedule}`
        )
      );
    });

    it("should not start scheduler if disabled", () => {
      startScheduler({ enabled: false });

      expect(cron.schedule).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("Scheduler is disabled, not starting")
      );
    });
  });

  describe("runDataIngestion", () => {
    const mockGmailUsers = ["user1", "user2"];
    const mockPlaidUsers = ["user2", "user3"];

    beforeEach(() => {
      (
        UserDataSourcesModel.getUsersWithDataSource as jest.Mock
      ).mockImplementation((dataSourceType: DataSourceType) => {
        if (dataSourceType === DataSourceType.GMAIL) {
          return Promise.resolve(mockGmailUsers);
        } else if (dataSourceType === DataSourceType.PLAID) {
          return Promise.resolve(mockPlaidUsers);
        }
        return Promise.resolve([]);
      });

      (gmailClient.fetchGmailData as jest.Mock).mockResolvedValue({
        messages: [{ id: "msg1" }, { id: "msg2" }],
      });

      (plaidClient.fetchPlaidData as jest.Mock).mockResolvedValue({
        accounts: [{ accountId: "acc1" }],
        transactions: [{ transactionId: "tx1" }, { transactionId: "tx2" }],
        scheduledPayments: [],
      });

      (
        UserDataSourcesModel.updateLastIngestedAt as jest.Mock
      ).mockResolvedValue({});
    });

    it("should fetch users with Gmail and Plaid data sources", async () => {
      await runDataIngestionNow();

      expect(UserDataSourcesModel.getUsersWithDataSource).toHaveBeenCalledWith(
        DataSourceType.GMAIL
      );
      expect(UserDataSourcesModel.getUsersWithDataSource).toHaveBeenCalledWith(
        DataSourceType.PLAID
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          `Found ${mockGmailUsers.length} users with Gmail data source`
        )
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(
          `Found ${mockPlaidUsers.length} users with Plaid data source`
        )
      );
    });

    it("should fetch Gmail data for each Gmail user", async () => {
      await runDataIngestionNow();

      // Should call fetchGmailData for each Gmail user
      expect(gmailClient.fetchGmailData).toHaveBeenCalledTimes(
        mockGmailUsers.length
      );
      mockGmailUsers.forEach((userId) => {
        expect(gmailClient.fetchGmailData).toHaveBeenCalledWith(userId);
      });

      // Should update lastIngestedAt for each successful fetch
      expect(UserDataSourcesModel.updateLastIngestedAt).toHaveBeenCalledTimes(
        mockGmailUsers.length + mockPlaidUsers.length
      );
      mockGmailUsers.forEach((userId) => {
        expect(UserDataSourcesModel.updateLastIngestedAt).toHaveBeenCalledWith(
          userId,
          DataSourceType.GMAIL
        );
      });
    });

    it("should fetch Plaid data for each Plaid user", async () => {
      await runDataIngestionNow();

      // Should call fetchPlaidData for each Plaid user
      expect(plaidClient.fetchPlaidData).toHaveBeenCalledTimes(
        mockPlaidUsers.length
      );
      mockPlaidUsers.forEach((userId) => {
        expect(plaidClient.fetchPlaidData).toHaveBeenCalledWith(userId);
      });

      // Should update lastIngestedAt for each successful fetch
      mockPlaidUsers.forEach((userId) => {
        expect(UserDataSourcesModel.updateLastIngestedAt).toHaveBeenCalledWith(
          userId,
          DataSourceType.PLAID
        );
      });
    });

    it("should handle Gmail fetch errors gracefully", async () => {
      const errorMessage = "Gmail API error";
      (gmailClient.fetchGmailData as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await runDataIngestionNow();

      // Should still process other users despite error
      expect(gmailClient.fetchGmailData).toHaveBeenCalledTimes(
        mockGmailUsers.length
      );
      expect(plaidClient.fetchPlaidData).toHaveBeenCalledTimes(
        mockPlaidUsers.length
      );

      // Should log the error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `Error fetching gmail data for user ${mockGmailUsers[0]}`
        ),
        expect.anything()
      );

      // Should update lastIngestedAt only for successful fetches
      expect(UserDataSourcesModel.updateLastIngestedAt).toHaveBeenCalledTimes(
        mockGmailUsers.length + mockPlaidUsers.length - 1
      );
    });

    it("should handle Plaid fetch errors gracefully", async () => {
      const errorMessage = "Plaid API error";
      (plaidClient.fetchPlaidData as jest.Mock).mockRejectedValueOnce(
        new Error(errorMessage)
      );

      await runDataIngestionNow();

      // Should still process other users despite error
      expect(gmailClient.fetchGmailData).toHaveBeenCalledTimes(
        mockGmailUsers.length
      );
      expect(plaidClient.fetchPlaidData).toHaveBeenCalledTimes(
        mockPlaidUsers.length
      );

      // Should log the error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(
          `Error fetching plaid data for user ${mockPlaidUsers[0]}`
        ),
        expect.anything()
      );

      // Should update lastIngestedAt only for successful fetches
      expect(UserDataSourcesModel.updateLastIngestedAt).toHaveBeenCalledTimes(
        mockGmailUsers.length + mockPlaidUsers.length - 1
      );
    });

    it("should handle authentication errors specially", async () => {
      const authError = new AppError("Authentication required", 401);
      (gmailClient.fetchGmailData as jest.Mock).mockRejectedValueOnce(
        authError
      );

      await runDataIngestionNow();

      // Should log authentication error specifically
      expect(console.error).toHaveBeenCalledWith(
        `[Scheduler] Authentication error for gmail data, user ${mockGmailUsers[0]}: Authentication required`
      );
    });

    it("should handle errors in getUsersWithDataSource gracefully", async () => {
      const errorMessage = "Database error";
      (
        UserDataSourcesModel.getUsersWithDataSource as jest.Mock
      ).mockRejectedValueOnce(new Error(errorMessage));

      await runDataIngestionNow();

      // Should log the error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Error during data ingestion process"),
        expect.anything()
      );

      // Should not crash the process
      expect(gmailClient.fetchGmailData).not.toHaveBeenCalled();
      expect(plaidClient.fetchPlaidData).not.toHaveBeenCalled();
    });
  });
});
