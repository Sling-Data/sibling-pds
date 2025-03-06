import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import UserDataSourcesModel from "@backend/models/UserDataSourcesModel";
import defaultGmailClient, {
  GmailClient,
} from "@backend/services/apiClients/gmailClient";
import { OAuth2Client } from "google-auth-library";

jest.mock("@backend/models/UserDataSourcesModel");

describe("Gmail Client", () => {
  let mongoServer: MongoMemoryServer;

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
    jest.clearAllMocks();
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

      const token = await defaultGmailClient.getAccessToken("test-user-id");
      expect(token).toBe(mockCredentials.accessToken);
    });

    it("should throw error for non-existent credentials", async () => {
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        null
      );

      await expect(
        defaultGmailClient.getAccessToken("test-user-id")
      ).rejects.toThrow("No Gmail credentials found for user test-user-id");
    });
  });

  describe("generateAuthUrl", () => {
    it("should generate a valid authorization URL", () => {
      const mockOAuth2Client = {
        generateAuthUrl: jest.fn().mockImplementation((options) => {
          const params = new URLSearchParams({
            access_type: options.access_type,
            scope: Array.isArray(options.scope)
              ? options.scope.join(" ")
              : options.scope,
            prompt: options.prompt,
          });
          return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        }),
      } as unknown as OAuth2Client;

      const gmailClient = new GmailClient(mockOAuth2Client);
      const url = gmailClient.generateAuthUrl();

      expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
      expect(url).toContain("access_type=offline");
      expect(url).toContain("prompt=consent");
      expect(url).toContain(
        encodeURIComponent("https://www.googleapis.com/auth/gmail.readonly")
      );
    });

    it("should include state parameter when provided", () => {
      const mockOAuth2Client = {
        generateAuthUrl: jest.fn().mockImplementation((options) => {
          const params = new URLSearchParams({
            access_type: options.access_type,
            scope: Array.isArray(options.scope)
              ? options.scope.join(" ")
              : options.scope,
            prompt: options.prompt,
            state: options.state,
          });
          return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        }),
      } as unknown as OAuth2Client;

      const gmailClient = new GmailClient(mockOAuth2Client);
      const state = Buffer.from(
        JSON.stringify({ userId: "123", nonce: "abc" })
      ).toString("base64");
      const url = gmailClient.generateAuthUrl(state);
      expect(url).toContain(`state=${encodeURIComponent(state)}`);
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("should exchange authorization code for tokens", async () => {
      const mockOAuth2Client = {
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            expiry_date: Date.now() + 3600000,
          },
        }),
      } as unknown as OAuth2Client;

      const gmailClient = new GmailClient(mockOAuth2Client);
      const tokens = await gmailClient.exchangeCodeForTokens("test-code");

      expect(tokens).toEqual({
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expiry_date: expect.any(Number),
      });
    });

    it("should throw error if tokens are incomplete", async () => {
      const mockOAuth2Client = {
        getToken: jest.fn().mockResolvedValue({
          tokens: { access_token: "mock-token" }, // Missing refresh_token and expiry_date
        }),
      } as unknown as OAuth2Client;

      const gmailClient = new GmailClient(mockOAuth2Client);
      await expect(
        gmailClient.exchangeCodeForTokens("test-code")
      ).rejects.toThrow(
        "Invalid token response from Google: missing refresh_token"
      );
    });
  });
});
