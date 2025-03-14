import UserDataSourcesModel from "@backend/models/UserDataSourcesModel";
import { GmailClient } from "@backend/services/apiClients/gmailClient";
import { OAuth2Client, Credentials } from "google-auth-library";
import nock from "nock";
import { AppError } from "@backend/middleware/errorHandler";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockOAuth2Client,
  mockGmailApi,
  mockGmailResponse,
  mockMessageResponse,
} from "../../../helpers/testSetup";

// Mock Gmail API
jest.mock("googleapis", () => ({
  google: {
    gmail: jest.fn().mockImplementation(({ version, auth }) => {
      if (version !== "v1") throw new Error("Invalid version");
      if (!auth) throw new Error("Auth required");
      return mockGmailApi;
    }),
  },
}));

// Mock UserDataSourcesModel
jest.mock("@backend/models/UserDataSourcesModel", () => ({
  __esModule: true,
  default: {
    getCredentials: jest.fn(),
    storeCredentials: jest.fn().mockResolvedValue(true),
    deleteMany: jest
      .fn()
      .mockResolvedValue({ acknowledged: true, deletedCount: 0 }),
  },
  DataSourceType: {
    GMAIL: "gmail",
  },
}));

describe("Gmail Client", () => {
  let testEnv: any;
  let gmailClient: GmailClient;
  let mockOAuth2Client: jest.Mocked<Partial<OAuth2Client>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment(testEnv);
  });

  beforeEach(async () => {
    await UserDataSourcesModel.deleteMany({});
    jest.clearAllMocks();
    nock.cleanAll();

    // Set up default mock for getCredentials
    (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue({
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
      expiry: new Date(Date.now() + 3600000).toISOString(),
    });

    mockOAuth2Client = createMockOAuth2Client();
    gmailClient = new GmailClient(mockOAuth2Client as OAuth2Client);
    console.error = jest.fn(); // Mock console.error
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

  describe("fetchGmailData", () => {
    it("should successfully fetch Gmail data", async () => {
      mockGmailApi.users.messages.list.mockResolvedValueOnce(mockGmailResponse);
      mockGmailApi.users.messages.get
        .mockResolvedValueOnce(mockMessageResponse)
        .mockResolvedValueOnce(mockMessageResponse);

      const result = await gmailClient.fetchGmailData("test-user-id");

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0]).toEqual(
        expect.objectContaining({
          subject: "Test Subject",
          sender: "sender@example.com",
          recipients: ["recipient@example.com"],
        })
      );
      expect(result.contacts).toContain("sender@example.com");
      expect(result.contacts).toContain("recipient@example.com");
    });

    it("should handle rate limit errors with retries", async () => {
      mockGmailApi.users.messages.list
        .mockRejectedValueOnce({ status: 429 })
        .mockResolvedValueOnce(mockGmailResponse);

      mockGmailApi.users.messages.get
        .mockResolvedValueOnce(mockMessageResponse)
        .mockResolvedValueOnce(mockMessageResponse);

      const result = await gmailClient.fetchGmailData("test-user-id");

      expect(result.messages).toHaveLength(2);
      const errorCalls = (console.error as jest.Mock).mock.calls;
      expect(errorCalls[0]).toEqual(["Gmail API Error:", expect.any(Object)]);
      expect(errorCalls).toEqual(
        expect.arrayContaining([["Gmail API Error:", expect.any(Object)]])
      );
    });

    it("should handle auth errors by refreshing token", async () => {
      // Mock token refresh
      const mockRefreshResponse = {
        credentials: {
          access_token: "new-access-token",
          expiry_date: Date.now() + 3600000,
        } as Credentials,
      };
      (mockOAuth2Client.refreshAccessToken as jest.Mock).mockResolvedValueOnce(
        mockRefreshResponse
      );

      mockGmailApi.users.messages.list
        .mockRejectedValueOnce({ status: 401 })
        .mockResolvedValueOnce(mockGmailResponse);

      mockGmailApi.users.messages.get
        .mockResolvedValueOnce(mockMessageResponse)
        .mockResolvedValueOnce(mockMessageResponse);

      const result = await gmailClient.fetchGmailData("test-user-id");

      expect(result.messages).toHaveLength(2);
      const errorCalls = (console.error as jest.Mock).mock.calls;
      expect(errorCalls[0]).toEqual(["Gmail API Error:", expect.any(Object)]);
      expect(errorCalls[1]).toEqual([
        "Auth error detected, refreshing token...",
      ]);
    });

    it("should handle network errors with retry", async () => {
      mockGmailApi.users.messages.list
        .mockRejectedValueOnce(new Error("ECONNREFUSED"))
        .mockResolvedValueOnce(mockGmailResponse);

      mockGmailApi.users.messages.get
        .mockResolvedValueOnce(mockMessageResponse)
        .mockResolvedValueOnce(mockMessageResponse);

      const result = await gmailClient.fetchGmailData("test-user-id");

      expect(result.messages).toHaveLength(2);
      const errorCalls = (console.error as jest.Mock).mock.calls;
      expect(errorCalls[0]).toEqual(["Gmail API Error:", expect.any(Object)]);
      expect(errorCalls).toEqual(
        expect.arrayContaining([["Gmail API Error:", expect.any(Object)]])
      );
    });

    it("should throw AppError after max retries", async () => {
      mockGmailApi.users.messages.list
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 })
        .mockRejectedValueOnce({ status: 429 });

      await expect(gmailClient.fetchGmailData("test-user-id")).rejects.toThrow(
        AppError
      );

      const errorCalls = (console.error as jest.Mock).mock.calls;
      expect(errorCalls[0]).toEqual(["Gmail API Error:", expect.any(Object)]);
      expect(errorCalls).toEqual(
        expect.arrayContaining([
          ["Gmail API Error:", expect.any(Object)],
          ["Error fetching Gmail data:", expect.any(Object)],
        ])
      );
    });
  });
});
