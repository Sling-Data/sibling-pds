import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import UserDataSourcesModel, {
  DataSourceType,
} from "@backend/models/UserDataSourcesModel";
import * as encryption from "@backend/utils/encryption";

describe("UserDataSources Model", () => {
  let mongoServer: MongoMemoryServer;
  const userId = new mongoose.Types.ObjectId().toString();
  const testCredentials = {
    accessToken: "test-token",
    refreshToken: "test-refresh-token",
  };

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up encryption key
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566";
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.ENCRYPTION_KEY;
  });

  beforeEach(async () => {
    await UserDataSourcesModel.deleteMany({});
  });

  describe("Storing credentials", () => {
    it("should store encrypted credentials", async () => {
      const dataSource = await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        testCredentials
      );

      // Verify the stored data
      expect(dataSource.userId.toString()).toBe(userId);
      expect(dataSource.dataSourceType).toBe(DataSourceType.GMAIL);
      expect(dataSource.credentials).toHaveProperty("iv");
      expect(dataSource.credentials).toHaveProperty("content");
      expect(dataSource.credentials.content).not.toBe(
        JSON.stringify(testCredentials)
      );
    });

    it("should update existing credentials", async () => {
      // Store initial credentials
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        testCredentials
      );

      // Update with new credentials
      const newCredentials = {
        accessToken: "new-token",
        refreshToken: "new-refresh-token",
      };

      const updatedDataSource = await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        newCredentials
      );

      // Verify the update
      const decryptedCredentials = encryption.decrypt(
        updatedDataSource.credentials
      );
      expect(JSON.parse(decryptedCredentials)).toEqual(newCredentials);
      expect(JSON.parse(decryptedCredentials)).not.toEqual(testCredentials);
    });

    it("should enforce unique userId and dataSourceType combination", async () => {
      // Store initial credentials
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        testCredentials
      );

      // Try to create another record with the same userId and dataSourceType
      const duplicateCredentials = {
        accessToken: "duplicate-token",
        refreshToken: "duplicate-refresh-token",
      };

      // Should update instead of creating new
      const result = await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        duplicateCredentials
      );

      const count = await UserDataSourcesModel.countDocuments({
        userId,
        dataSourceType: DataSourceType.GMAIL,
      });
      expect(count).toBe(1);

      // Verify it's the updated credentials
      const decryptedCredentials = encryption.decrypt(result.credentials);
      expect(JSON.parse(decryptedCredentials)).toEqual(duplicateCredentials);
    });
  });

  describe("Retrieving credentials", () => {
    it("should retrieve and decrypt credentials", async () => {
      // Store credentials
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        testCredentials
      );

      // Retrieve credentials
      const retrievedCredentials = await UserDataSourcesModel.getCredentials(
        userId,
        DataSourceType.GMAIL
      );

      expect(retrievedCredentials).toEqual(testCredentials);
    });

    it("should return null for non-existent credentials", async () => {
      const nonExistentCredentials = await UserDataSourcesModel.getCredentials(
        new mongoose.Types.ObjectId().toString(),
        DataSourceType.GMAIL
      );

      expect(nonExistentCredentials).toBeNull();
    });
  });

  describe("Data source types", () => {
    it("should validate data source types", async () => {
      await expect(
        UserDataSourcesModel.storeCredentials(
          userId,
          "invalid-source" as DataSourceType,
          testCredentials
        )
      ).rejects.toThrow();
    });

    it("should store credentials for different data sources", async () => {
      // Store Gmail credentials
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        testCredentials
      );

      // Store Plaid credentials
      const plaidCredentials = {
        accessToken: "plaid-token",
        itemId: "plaid-item-id",
      };
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.PLAID,
        plaidCredentials
      );

      // Verify both exist
      const count = await UserDataSourcesModel.countDocuments({ userId });
      expect(count).toBe(2);

      // Verify both are retrievable
      const gmailCreds = await UserDataSourcesModel.getCredentials(
        userId,
        DataSourceType.GMAIL
      );
      const plaidCreds = await UserDataSourcesModel.getCredentials(
        userId,
        DataSourceType.PLAID
      );

      expect(gmailCreds).toEqual(testCredentials);
      expect(plaidCreds).toEqual(plaidCredentials);
    });
  });
});
