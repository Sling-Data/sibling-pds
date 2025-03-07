import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
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
}

export default new PlaidClient();
