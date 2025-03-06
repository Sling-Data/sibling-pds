import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import UserDataSourcesModel, {
  DataSourceType,
} from "@backend/models/UserDataSourcesModel";
import gmailClient from "@backend/services/apiClients/gmailClient";

describe("Gmail Client", () => {
  let mongoServer: MongoMemoryServer;
  const userId = new mongoose.Types.ObjectId().toString();
  const testCredentials = {
    accessToken: "test-access-token",
    refreshToken: "test-refresh-token",
    expiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  };

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up environment variables
    process.env.GOOGLE_CLIENT_ID = "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566";
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.ENCRYPTION_KEY;
  });

  beforeEach(async () => {
    await UserDataSourcesModel.deleteMany({});
  });

  describe("getAccessToken", () => {
    it("should return access token for valid credentials", async () => {
      // Store test credentials
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        testCredentials
      );

      const accessToken = await gmailClient.getAccessToken(userId);
      expect(accessToken).toBe(testCredentials.accessToken);
    });

    it("should throw error for non-existent credentials", async () => {
      await expect(gmailClient.getAccessToken(userId)).rejects.toThrow(
        `No Gmail credentials found for user ${userId}`
      );
    });

    // Note: We can't easily test token refresh without mocking the OAuth2Client
    // That would require setting up Jest mocks for google-auth-library
  });

  describe("generateAuthUrl", () => {
    it("should generate a valid authorization URL", () => {
      const authUrl = gmailClient.generateAuthUrl();
      expect(authUrl).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(authUrl).toContain(
        "scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly"
      );
      expect(authUrl).toContain("access_type=offline");
      expect(authUrl).toContain("prompt=consent");
      expect(authUrl).toContain("client_id=test-client-id");
      expect(authUrl).toContain("redirect_uri=");
    });
  });
});
