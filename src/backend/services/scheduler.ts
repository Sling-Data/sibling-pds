import cron from "node-cron";
import gmailClient from "./apiClients/gmailClient";
import plaidClient from "./apiClients/plaidClient";
import UserDataSourcesModel, {
  DataSourceType,
} from "../models/UserDataSourcesModel";
import { AppError } from "../middleware/errorHandler";

interface SchedulerOptions {
  cronExpression?: string;
  enabled?: boolean;
  runImmediately?: boolean;
}

// TODO: move to config
const DEFAULT_OPTIONS: SchedulerOptions = {
  cronExpression: "0 2 * * *", // Daily at 2 AM UTC
  enabled: true,
  runImmediately: false, // Default to false to prevent unnecessary API calls on server restarts
};

/**
 * Fetches data for a specific user and data source
 * @param userId The user ID
 * @param dataSourceType The data source type (gmail or plaid)
 */
async function fetchDataForUser(
  userId: string,
  dataSourceType: DataSourceType
): Promise<void> {
  try {
    console.log(
      `[Scheduler] Fetching ${dataSourceType} data for user ${userId}`
    );

    if (dataSourceType === DataSourceType.GMAIL) {
      const data = await gmailClient.fetchGmailData(userId);
      console.log(
        `[Scheduler] Successfully fetched Gmail data for user ${userId}: ${data.messages.length} messages`
      );

      // Update last ingested timestamp
      await UserDataSourcesModel.updateLastIngestedAt(
        userId,
        DataSourceType.GMAIL
      );
    } else if (dataSourceType === DataSourceType.PLAID) {
      const data = await plaidClient.fetchPlaidData(userId);
      console.log(
        `[Scheduler] Successfully fetched Plaid data for user ${userId}: ${data.accounts.length} accounts, ${data.transactions.length} transactions`
      );

      // Update last ingested timestamp
      await UserDataSourcesModel.updateLastIngestedAt(
        userId,
        DataSourceType.PLAID
      );
    }
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 401) {
      console.error(
        `[Scheduler] Authentication error for ${dataSourceType} data, user ${userId}: ${error.message}`
      );
    } else {
      console.error(
        `[Scheduler] Error fetching ${dataSourceType} data for user ${userId}:`,
        error
      );
    }
  }
}

/**
 * Runs the data ingestion process for all users
 */
async function runDataIngestion(): Promise<void> {
  console.log("[Scheduler] Starting data ingestion process");

  try {
    // Get all Gmail users
    const gmailUsers = await UserDataSourcesModel.getUsersWithDataSource(
      DataSourceType.GMAIL
    );
    console.log(
      `[Scheduler] Found ${gmailUsers.length} users with Gmail data source`
    );

    // Get all Plaid users
    const plaidUsers = await UserDataSourcesModel.getUsersWithDataSource(
      DataSourceType.PLAID
    );
    console.log(
      `[Scheduler] Found ${plaidUsers.length} users with Plaid data source`
    );

    // Process Gmail users
    for (const userId of gmailUsers) {
      await fetchDataForUser(userId, DataSourceType.GMAIL);
    }

    // Process Plaid users
    for (const userId of plaidUsers) {
      await fetchDataForUser(userId, DataSourceType.PLAID);
    }

    console.log("[Scheduler] Data ingestion process completed");
  } catch (error) {
    console.error("[Scheduler] Error during data ingestion process:", error);
  }
}

/**
 * Starts the scheduler for data ingestion
 * @param options Scheduler options
 *   - cronExpression: Cron expression for scheduling (default: '0 2 * * *', daily at 2 AM UTC)
 *   - enabled: Whether the scheduler is enabled (default: true)
 *   - runImmediately: Whether to run data ingestion immediately on startup (default: false)
 *     Setting this to true will trigger data ingestion on every server restart, which may increase API usage and costs.
 */
export function startScheduler(options: SchedulerOptions = {}): void {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  if (!mergedOptions.enabled) {
    console.log("[Scheduler] Scheduler is disabled, not starting");
    return;
  }

  console.log(
    `[Scheduler] Starting scheduler with cron expression: ${mergedOptions.cronExpression}`
  );

  // Schedule the cron job
  cron.schedule(mergedOptions.cronExpression!, async () => {
    await runDataIngestion();
  });

  // Run immediately on startup (optional)
  if (mergedOptions.runImmediately && process.env.NODE_ENV !== "test") {
    console.log("[Scheduler] Running initial data ingestion");
    // Use setTimeout to ensure database connection is fully established
    setTimeout(() => {
      runDataIngestion();
    }, 5000); // Wait 5 seconds after startup
  }

  console.log("[Scheduler] Scheduler started successfully");
}

/**
 * Runs the data ingestion process immediately (for testing)
 */
export async function runDataIngestionNow(): Promise<void> {
  console.log("[Scheduler] Running data ingestion immediately");
  await runDataIngestion();
}

export default {
  startScheduler,
  runDataIngestionNow,
};
