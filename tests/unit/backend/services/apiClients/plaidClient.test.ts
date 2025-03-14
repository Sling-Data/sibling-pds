import { PlaidApi, Configuration, PlaidEnvironments } from "plaid";
import UserDataSourcesModel from "@backend/models/UserDataSourcesModel";
import { PlaidClient } from "@backend/services/apiClients/plaidClient";
import { AppError } from "@backend/middleware/errorHandler";
import {
  setupTestEnvironment,
  teardownTestEnvironment,
  createMockPlaidClient,
} from "../../../helpers/testSetup";

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
  let testEnv: any;
  let plaidClient: PlaidClient;
  let mockPlaidApi: jest.Mocked<Partial<PlaidApi>>;

  beforeAll(async () => {
    testEnv = await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment(testEnv);
  });

  beforeEach(async () => {
    await UserDataSourcesModel.deleteMany({});
    jest.clearAllMocks();
    console.error = jest.fn();

    mockPlaidApi = createMockPlaidClient();
    plaidClient = new PlaidClient(mockPlaidApi as PlaidApi);
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

  describe("fetchPlaidData", () => {
    const mockUserId = "test-user-id";
    const mockAccessToken = "test-access-token";

    const mockAccounts = [
      {
        account_id: "account-1",
        name: "Checking Account",
        type: "depository",
        subtype: "checking",
        balances: {
          available: 1000,
          current: 1200,
          limit: null,
          iso_currency_code: "USD",
        },
      },
    ];

    const mockTransactions = [
      {
        transaction_id: "transaction-1",
        account_id: "account-1",
        amount: 50.25,
        date: "2023-03-01",
        name: "Grocery Store",
        merchant_name: "Whole Foods",
        category: ["Food and Drink", "Groceries"],
        pending: false,
      },
    ];

    beforeEach(() => {
      // Mock successful responses
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue({
        accessToken: mockAccessToken,
        itemId: "test-item-id",
      });

      (mockPlaidApi.accountsGet as jest.Mock).mockResolvedValue({
        data: { accounts: mockAccounts },
      });

      (mockPlaidApi.transactionsGet as jest.Mock).mockResolvedValue({
        data: {
          transactions: mockTransactions,
          total_transactions: 1,
        },
      });
    });

    it("should successfully fetch Plaid data", async () => {
      const result = await plaidClient.fetchPlaidData(mockUserId);

      expect(result).toEqual({
        accounts: [
          {
            accountId: "account-1",
            name: "Checking Account",
            type: "depository",
            subtype: "checking",
            balance: {
              available: 1000,
              current: 1200,
              limit: null,
              isoCurrencyCode: "USD",
            },
          },
        ],
        transactions: [
          {
            transactionId: "transaction-1",
            accountId: "account-1",
            amount: 50.25,
            date: "2023-03-01",
            name: "Grocery Store",
            merchantName: "Whole Foods",
            category: ["Food and Drink", "Groceries"],
            pending: false,
          },
        ],
        scheduledPayments: expect.any(Array),
      });

      expect(mockPlaidApi.accountsGet).toHaveBeenCalledWith({
        access_token: mockAccessToken,
      });

      expect(mockPlaidApi.transactionsGet).toHaveBeenCalledWith(
        expect.objectContaining({
          access_token: mockAccessToken,
        })
      );
    });

    it("should handle rate limit errors with retries", async () => {
      // First call fails with 429, second succeeds
      (mockPlaidApi.accountsGet as jest.Mock)
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValueOnce({ data: { accounts: mockAccounts } });

      const result = await plaidClient.fetchPlaidData(mockUserId);

      expect(result.accounts).toHaveLength(1);
      expect(mockPlaidApi.accountsGet).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Rate limit hit when fetching accounts")
      );
    });

    it("should throw AppError after max rate limit retries", async () => {
      // All calls fail with 429
      (mockPlaidApi.accountsGet as jest.Mock).mockRejectedValue({
        response: { status: 429 },
      });

      await expect(plaidClient.fetchPlaidData(mockUserId)).rejects.toThrow(
        "Rate limit exceeded when fetching accounts"
      );

      expect(mockPlaidApi.accountsGet).toHaveBeenCalledTimes(3); // Initial + 2 retries
      // We expect 6 console.error calls:
      // - 2 from retryWithConfig for rate limit retries
      // - 2 from fetchAccounts for each retry
      // - 2 from fetchPlaidData for the final error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Rate limit hit")
      );
    });

    it("should handle authentication errors with token refresh", async () => {
      // First call fails with 401, second succeeds
      (mockPlaidApi.accountsGet as jest.Mock)
        .mockRejectedValueOnce({ response: { status: 401 } })
        .mockResolvedValueOnce({ data: { accounts: mockAccounts } });

      const result = await plaidClient.fetchPlaidData(mockUserId);

      expect(result.accounts).toHaveLength(1);
      expect(mockPlaidApi.accountsGet).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Authentication error when fetching accounts")
      );
    });

    it("should throw AppError after max auth retries", async () => {
      // All calls fail with 401
      (mockPlaidApi.accountsGet as jest.Mock).mockRejectedValue({
        response: { status: 401 },
      });

      await expect(plaidClient.fetchPlaidData(mockUserId)).rejects.toThrow(
        "Authentication failed when fetching accounts"
      );

      expect(mockPlaidApi.accountsGet).toHaveBeenCalledTimes(2); // Initial + 1 retry
      // We expect multiple console.error calls from different parts of the code
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Authentication error")
      );
    });

    it("should handle network errors with retry", async () => {
      // First call fails with network error, second succeeds
      (mockPlaidApi.accountsGet as jest.Mock)
        .mockRejectedValueOnce({ code: "ECONNREFUSED" })
        .mockResolvedValueOnce({ data: { accounts: mockAccounts } });

      const result = await plaidClient.fetchPlaidData(mockUserId);

      expect(result.accounts).toHaveLength(1);
      expect(mockPlaidApi.accountsGet).toHaveBeenCalledTimes(2);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Network error when fetching accounts")
      );
    });

    it("should throw AppError after max network retries", async () => {
      // All calls fail with network error
      (mockPlaidApi.accountsGet as jest.Mock).mockRejectedValue({
        code: "ECONNREFUSED",
      });

      await expect(plaidClient.fetchPlaidData(mockUserId)).rejects.toThrow(
        "Network error when fetching accounts: ECONNREFUSED"
      );

      expect(mockPlaidApi.accountsGet).toHaveBeenCalledTimes(2); // Initial + 1 retry
      // We expect multiple console.error calls from different parts of the code
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Network error")
      );
    });

    it("should throw AppError for other errors", async () => {
      // Mock a generic error
      (mockPlaidApi.accountsGet as jest.Mock).mockRejectedValue(
        new Error("Unknown error")
      );

      await expect(plaidClient.fetchPlaidData(mockUserId)).rejects.toThrow(
        "Error fetching accounts: Unknown error"
      );

      expect(mockPlaidApi.accountsGet).toHaveBeenCalledTimes(1); // No retries
    });

    it("should throw AppError when no access token is available", async () => {
      // Mock no credentials
      (UserDataSourcesModel.getCredentials as jest.Mock).mockResolvedValue(
        null
      );

      // Mock link token creation
      (mockPlaidApi.linkTokenCreate as jest.Mock).mockResolvedValue({
        data: { link_token: "test-link-token" },
      });

      await expect(plaidClient.fetchPlaidData(mockUserId)).rejects.toThrow(
        "No Plaid access token available for this user"
      );
    });
  });
});
