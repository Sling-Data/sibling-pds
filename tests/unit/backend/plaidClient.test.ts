import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";
import UserDataSourcesModel from "@backend/models/UserDataSourcesModel";
import { PlaidClient } from "@backend/services/apiClients/plaidClient";
import { AppError } from "@backend/middleware/errorHandler";

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
    PLAID: "plaid",
  },
}));

describe("Plaid Client", () => {
  let mongoServer: MongoMemoryServer;
  let plaidClient: PlaidClient;
  let mockPlaidApi: jest.Mocked<Partial<PlaidApi>>;

  beforeAll(async () => {
    // Set up MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Set up environment variables
    process.env.PLAID_CLIENT_ID = "test-client-id";
    process.env.PLAID_SECRET = "test-secret";
    process.env.PLAID_ENV = "sandbox";
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    delete process.env.PLAID_CLIENT_ID;
    delete process.env.PLAID_SECRET;
    delete process.env.PLAID_ENV;
  });

  beforeEach(async () => {
    await UserDataSourcesModel.deleteMany({});
    jest.clearAllMocks();

    // Create mock Plaid API instance
    mockPlaidApi = {
      linkTokenCreate: jest.fn(),
      itemPublicTokenExchange: jest.fn(),
    };

    plaidClient = new PlaidClient(mockPlaidApi as PlaidApi);
    console.error = jest.fn(); // Mock console.error
  });

  describe("getAccessToken", () => {
    it("should return access token for valid credentials", async () => {
      const mockCredentials = {
        accessToken: "test-access-token",
        itemId: "test-item-id",
      };

      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        mockCredentials
      );

      const response = await plaidClient.getAccessToken("test-user-id");
      expect(response).toEqual({
        type: "access_token",
        accessToken: mockCredentials.accessToken,
      });
    });

    it("should return link token when no credentials exist", async () => {
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        null
      );
      (mockPlaidApi.linkTokenCreate as jest.Mock).mockResolvedValue({
        data: { link_token: "test-link-token" },
      });

      const response = await plaidClient.getAccessToken("test-user-id");
      expect(response).toEqual({
        type: "link_token",
        linkToken: "test-link-token",
      });
    });

    it("should return link token when credentials are malformed", async () => {
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue({
        itemId: "test-item-id",
        // Missing accessToken
      });
      (mockPlaidApi.linkTokenCreate as jest.Mock).mockResolvedValue({
        data: { link_token: "test-link-token" },
      });

      const response = await plaidClient.getAccessToken("test-user-id");
      expect(response).toEqual({
        type: "link_token",
        linkToken: "test-link-token",
      });
    });
  });

  describe("createLinkToken", () => {
    it("should create a link token successfully", async () => {
      const mockLinkToken = "test-link-token";
      (mockPlaidApi.linkTokenCreate as jest.Mock).mockResolvedValue({
        data: { link_token: mockLinkToken },
      });

      const linkToken = await plaidClient.createLinkToken("test-user-id");
      expect(linkToken).toBe(mockLinkToken);

      // Verify correct parameters were passed
      expect(mockPlaidApi.linkTokenCreate).toHaveBeenCalledWith({
        user: { client_user_id: "test-user-id" },
        client_name: "Sibling PDS",
        products: ["transactions"],
        country_codes: ["US"],
        language: "en",
      });
    });

    it("should throw AppError when link token creation fails", async () => {
      const mockError = new Error("API error");
      (mockPlaidApi.linkTokenCreate as jest.Mock).mockRejectedValue(mockError);

      await expect(plaidClient.createLinkToken("test-user-id")).rejects.toThrow(
        AppError
      );
      expect(console.error).toHaveBeenCalledWith(
        "Error creating Plaid Link token:",
        mockError
      );
    });
  });

  describe("exchangePublicToken", () => {
    it("should exchange public token for access token successfully", async () => {
      const mockResponse = {
        data: {
          access_token: "test-access-token",
          item_id: "test-item-id",
        },
      };
      (mockPlaidApi.itemPublicTokenExchange as jest.Mock).mockResolvedValue(
        mockResponse
      );

      await plaidClient.exchangePublicToken(
        "test-public-token",
        "test-user-id"
      );

      // Verify token exchange call
      expect(mockPlaidApi.itemPublicTokenExchange).toHaveBeenCalledWith({
        public_token: "test-public-token",
      });

      // Verify credentials storage
      expect(UserDataSourcesModel.storeCredentials).toHaveBeenCalledWith(
        "test-user-id",
        "plaid",
        {
          accessToken: "test-access-token",
          itemId: "test-item-id",
        }
      );
    });

    it("should throw AppError when token exchange fails", async () => {
      const mockError = new Error("Exchange failed");
      (mockPlaidApi.itemPublicTokenExchange as jest.Mock).mockRejectedValue(
        mockError
      );

      await expect(
        plaidClient.exchangePublicToken("test-public-token", "test-user-id")
      ).rejects.toThrow(AppError);
      expect(console.error).toHaveBeenCalledWith(
        "Error exchanging public token:",
        mockError
      );
    });
  });

  describe("PlaidClient initialization", () => {
    it("should throw error when environment variables are missing", () => {
      delete process.env.PLAID_CLIENT_ID;
      delete process.env.PLAID_SECRET;

      const client = new PlaidClient();
      expect(() => client["getPlaidClient"]()).toThrow(
        "PLAID_CLIENT_ID and PLAID_SECRET must be set in environment variables"
      );
    });

    it("should initialize with custom client if provided", () => {
      const customClient = new PlaidApi(
        new Configuration({
          basePath: PlaidEnvironments.sandbox,
        })
      );
      const client = new PlaidClient(customClient);
      expect(client["getPlaidClient"]()).toBe(customClient);
    });
  });
});
