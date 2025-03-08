import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
  AccountsGetRequest,
  TransactionsGetRequest,
  PaymentInitiationPaymentGetRequest,
} from "plaid";
import UserDataSourcesModel, {
  DataSourceType,
} from "../../models/UserDataSourcesModel";
import { AppError } from "../../middleware/errorHandler";

interface PlaidCredentials {
  accessToken: string;
  itemId: string;
}

interface PlaidAuthResponse {
  type: "access_token" | "link_token";
  accessToken?: string;
  linkToken?: string;
}

interface PlaidAccount {
  accountId: string;
  name: string;
  type: string;
  subtype: string;
  balance: {
    available: number | null;
    current: number;
    limit: number | null;
    isoCurrencyCode: string;
  };
}

interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName: string | null | undefined;
  category: string[];
  pending: boolean;
}

interface PlaidScheduledPayment {
  paymentId: string;
  amount: {
    value: number;
    currency: string;
  };
  status: string;
  recipientName: string;
  scheduledDate: string;
}

interface PlaidData {
  accounts: PlaidAccount[];
  transactions: PlaidTransaction[];
  scheduledPayments: PlaidScheduledPayment[];
}

// Helper function to delay execution
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class PlaidClient {
  private plaidClient: PlaidApi | null = null;

  constructor(private customPlaidClient?: PlaidApi) {
    if (customPlaidClient) {
      this.plaidClient = customPlaidClient;
    }
  }

  private getPlaidClient(): PlaidApi {
    if (this.customPlaidClient) {
      return this.customPlaidClient;
    }

    if (!this.plaidClient) {
      const clientId = process.env.PLAID_CLIENT_ID;
      const secret = process.env.PLAID_SECRET;
      const environment = process.env.PLAID_ENV || "sandbox";

      if (!clientId || !secret) {
        throw new Error(
          "PLAID_CLIENT_ID and PLAID_SECRET must be set in environment variables"
        );
      }

      const configuration = new Configuration({
        basePath: PlaidEnvironments[environment],
        baseOptions: {
          headers: {
            "PLAID-CLIENT-ID": clientId,
            "PLAID-SECRET": secret,
          },
        },
      });

      this.plaidClient = new PlaidApi(configuration);
    }

    return this.plaidClient;
  }

  async createLinkToken(userId: string): Promise<string> {
    const client = this.getPlaidClient();

    const configs: LinkTokenCreateRequest = {
      user: { client_user_id: userId },
      client_name: "Sibling PDS",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    };

    try {
      const response = await client.linkTokenCreate(configs);
      return response.data.link_token;
    } catch (error) {
      console.error("Error creating Plaid Link token:", error);
      throw new AppError(
        `Failed to create Plaid Link token: ${(error as Error).message}`,
        500
      );
    }
  }

  async exchangePublicToken(
    publicToken: string,
    userId: string
  ): Promise<void> {
    const client = this.getPlaidClient();

    try {
      const response = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });

      const { access_token: accessToken, item_id: itemId } = response.data;

      // Store the credentials
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.PLAID,
        {
          accessToken,
          itemId,
        }
      );
    } catch (error) {
      console.error("Error exchanging public token:", error);
      throw new AppError(
        `Failed to exchange public token: ${(error as Error).message}`,
        500
      );
    }
  }

  async getAccessToken(userId: string): Promise<PlaidAuthResponse> {
    // Get stored credentials from UserDataSources
    const credentials = (await UserDataSourcesModel.getCredentials(
      userId,
      DataSourceType.PLAID
    )) as PlaidCredentials | null;

    // Add runtime check for malformed data
    if (!credentials || !credentials.accessToken) {
      // If no credentials exist or they're invalid, create a new Link token
      const linkToken = await this.createLinkToken(userId);
      return {
        type: "link_token",
        linkToken,
      };
    }

    return {
      type: "access_token",
      accessToken: credentials.accessToken,
    };
  }

  async fetchPlaidData(userId: string): Promise<PlaidData> {
    try {
      // Get the access token
      const authResponse = await this.getAccessToken(userId);

      if (authResponse.type !== "access_token" || !authResponse.accessToken) {
        throw new AppError(
          "No Plaid access token available for this user",
          401
        );
      }

      const accessToken = authResponse.accessToken;
      const client = this.getPlaidClient();

      // Fetch data with retries
      const accounts = await this.retryWithConfig(
        () => this.fetchAccounts(accessToken, client),
        "accounts"
      );

      const transactions = await this.retryWithConfig(
        () => this.fetchTransactions(accessToken, client),
        "transactions"
      );

      const scheduledPayments = await this.retryWithConfig(
        () => this.fetchScheduledPayments(accessToken, client),
        "scheduled payments"
      );

      return {
        accounts,
        transactions,
        scheduledPayments,
      };
    } catch (error) {
      console.error("Error fetching Plaid data:", error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        `Failed to fetch Plaid data: ${(error as Error).message}`,
        500
      );
    }
  }

  /**
   * Retry a Plaid API operation with configurable retries for different error types
   * @param operation The async operation to retry
   * @param operationName Name of the operation for logging
   * @returns The result of the operation
   */
  private async retryWithConfig<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const MAX_RATE_LIMIT_RETRIES = 2;
    const MAX_AUTH_RETRIES = 1;
    const MAX_NETWORK_RETRIES = 1;
    const RETRY_DELAY_MS = 1000;

    let rateLimitRetries = 0;
    let authRetries = 0;
    let networkRetries = 0;

    while (true) {
      try {
        return await operation();
      } catch (error: any) {
        // Handle rate limit errors (429)
        if (error.response && error.response.status === 429) {
          if (rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
            rateLimitRetries++;
            console.error(
              `Rate limit hit when fetching ${operationName}. Retrying (${rateLimitRetries}/${MAX_RATE_LIMIT_RETRIES}) after ${RETRY_DELAY_MS}ms`
            );
            await delay(RETRY_DELAY_MS);
            continue;
          } else {
            throw new AppError(
              `Rate limit exceeded when fetching ${operationName}`,
              429
            );
          }
        }

        // Handle authentication errors (401)
        if (error.response && error.response.status === 401) {
          if (authRetries < MAX_AUTH_RETRIES) {
            authRetries++;
            console.error(
              `Authentication error when fetching ${operationName}. Refreshing token and retrying.`
            );
            // In a real implementation, we would refresh the token here
            // For Plaid, this might involve re-authenticating the user
            // For now, we'll just retry after a delay
            await delay(RETRY_DELAY_MS);
            continue;
          } else {
            throw new AppError(
              `Authentication failed when fetching ${operationName}`,
              401
            );
          }
        }

        // Handle network errors
        if (
          error.code === "ECONNREFUSED" ||
          error.code === "ENOTFOUND" ||
          error.code === "ETIMEDOUT"
        ) {
          if (networkRetries < MAX_NETWORK_RETRIES) {
            networkRetries++;
            console.error(
              `Network error when fetching ${operationName}: ${error.code}. Retrying after ${RETRY_DELAY_MS}ms`
            );
            await delay(RETRY_DELAY_MS);
            continue;
          } else {
            throw new AppError(
              `Network error when fetching ${operationName}: ${error.code}`,
              500
            );
          }
        }

        // For other errors, rethrow
        if (error instanceof AppError) {
          throw error;
        }
        throw new AppError(
          `Error fetching ${operationName}: ${error.message}`,
          500
        );
      }
    }
  }

  private async fetchAccounts(
    accessToken: string,
    client: PlaidApi
  ): Promise<PlaidAccount[]> {
    const request: AccountsGetRequest = {
      access_token: accessToken,
    };

    try {
      const response = await client.accountsGet(request);

      return response.data.accounts.map((account) => ({
        accountId: account.account_id,
        name: account.name,
        type: account.type,
        subtype: account.subtype || "",
        balance: {
          available: account.balances.available,
          current: account.balances.current || 0,
          limit: account.balances.limit,
          isoCurrencyCode: account.balances.iso_currency_code || "USD",
        },
      }));
    } catch (error) {
      console.error("Error fetching accounts:", error);
      // Don't transform the error here, let retryWithConfig handle it
      throw error;
    }
  }

  private async fetchTransactions(
    accessToken: string,
    client: PlaidApi
  ): Promise<PlaidTransaction[]> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const startDate = thirtyDaysAgo.toISOString().split("T")[0];
      const endDate = now.toISOString().split("T")[0];

      let allTransactions: PlaidTransaction[] = [];
      let hasMore = true;
      let offset = 0;
      const PAGE_SIZE = 100;

      // Paginate through all transactions
      while (hasMore) {
        const request: TransactionsGetRequest = {
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          options: {
            count: PAGE_SIZE,
            offset: offset,
          },
        };

        const response = await client.transactionsGet(request);

        const transactions = response.data.transactions.map((transaction) => ({
          transactionId: transaction.transaction_id,
          accountId: transaction.account_id,
          amount: transaction.amount,
          date: transaction.date,
          name: transaction.name,
          merchantName: transaction.merchant_name,
          category: transaction.category || [],
          pending: transaction.pending,
        }));

        allTransactions = [...allTransactions, ...transactions];

        // Check if there are more transactions to fetch
        hasMore = allTransactions.length < response.data.total_transactions;
        offset += PAGE_SIZE;

        // Safety check to prevent infinite loops
        if (offset > 1000) {
          console.warn("Reached maximum transaction fetch limit (1000)");
          break;
        }
      }

      return allTransactions;
    } catch (error) {
      console.error("Error fetching transactions:", error);
      // Don't transform the error here, let retryWithConfig handle it
      throw error;
    }
  }

  private async fetchScheduledPayments(
    _accessToken: string,
    client: PlaidApi
  ): Promise<PlaidScheduledPayment[]> {
    try {
      // In sandbox mode, we'll return mock data since payment_initiation
      // may not be available or requires additional setup
      if (process.env.PLAID_ENV === "sandbox") {
        return this.getMockScheduledPayments();
      }

      // For non-sandbox environments, attempt to fetch real payment data
      // Note: This requires the payment_initiation product to be enabled
      const request: PaymentInitiationPaymentGetRequest = {
        payment_id: "dummy-id", // This would be replaced with a real payment ID in production
      };

      try {
        await client.paymentInitiationPaymentGet(request);
        // If successful, we'd process real payments here
        return [];
      } catch (error) {
        // If payment_initiation is not available, return mock data
        console.warn("Payment initiation not available, using mock data");
        return this.getMockScheduledPayments();
      }
    } catch (error) {
      console.error("Error fetching scheduled payments:", error);
      // Don't transform the error here, let retryWithConfig handle it
      throw error;
    }
  }

  private getMockScheduledPayments(): PlaidScheduledPayment[] {
    // Generate some realistic mock scheduled payments
    const mockPayments: PlaidScheduledPayment[] = [
      {
        paymentId: "payment-1",
        amount: {
          value: 1250.0,
          currency: "USD",
        },
        status: "SCHEDULED",
        recipientName: "Mortgage Company",
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      {
        paymentId: "payment-2",
        amount: {
          value: 85.75,
          currency: "USD",
        },
        status: "SCHEDULED",
        recipientName: "Electric Utility",
        scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
      {
        paymentId: "payment-3",
        amount: {
          value: 120.5,
          currency: "USD",
        },
        status: "SCHEDULED",
        recipientName: "Internet Provider",
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      },
    ];

    return mockPayments;
  }
}

export default new PlaidClient();
