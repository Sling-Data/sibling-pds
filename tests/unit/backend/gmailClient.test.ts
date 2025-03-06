import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import UserDataSourcesModel, {
  DataSourceType,
} from "@backend/models/UserDataSourcesModel";
import gmailClient from "@backend/services/apiClients/gmailClient";

jest.mock("@backend/models/UserDataSourcesModel");

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
      const mockCredentials = {
        accessToken: "test-token",
        refreshToken: "test-refresh",
        expiry: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };

      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        mockCredentials
      );

      const token = await gmailClient.getAccessToken("test-user-id");
      expect(token).toBe(mockCredentials.accessToken);
    });

    it("should throw error for non-existent credentials", async () => {
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        null
      );

      await expect(gmailClient.getAccessToken("test-user-id")).rejects.toThrow(
        "No Gmail credentials found for user test-user-id"
      );
    });

    // Note: We can't easily test token refresh without mocking the OAuth2Client
    // That would require setting up Jest mocks for google-auth-library
  });

  describe("generateAuthUrl", () => {
    it("should generate a valid authorization URL", () => {
      const url = gmailClient.generateAuthUrl();
      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("access_type=offline");
      expect(url).toContain("prompt=consent");
      expect(url).toContain(
        encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly")
      );
    });

    it("should include state parameter when provided", () => {
      const state = Buffer.from(
        JSON.stringify({ userId: "123", nonce: "abc" })
      ).toString("base64");
      const url = gmailClient.generateAuthUrl(state);
      expect(url).toContain(`state=${encodeURIComponent(state)}`);
    });
  });
});
