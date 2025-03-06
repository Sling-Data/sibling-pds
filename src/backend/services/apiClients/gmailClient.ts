import { OAuth2Client, Credentials } from "google-auth-library";
import UserDataSourcesModel, {
  DataSourceType,
} from "../../models/UserDataSourcesModel";

interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
  expiry: string;
}

export class GmailClient {
  private oauth2Client: OAuth2Client | null = null;
  private readonly GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
  ];
  private readonly REDIRECT_URI =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    "http://localhost:3000/auth/callback";

  constructor(private customOAuth2Client?: OAuth2Client) {}

  private getOAuth2Client(): OAuth2Client {
    if (this.customOAuth2Client) {
      return this.customOAuth2Client;
    }

    if (!this.oauth2Client) {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables"
        );
      }

      this.oauth2Client = new OAuth2Client({
        clientId,
        clientSecret,
        redirectUri: this.REDIRECT_URI,
      });
    }

    return this.oauth2Client;
  }

  generateAuthUrl(state?: string): string {
    const oauth2Client = this.getOAuth2Client();
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.GMAIL_SCOPES,
      prompt: "consent", // Force consent screen to ensure we get refresh token
      state: state, // Pass through the state parameter if provided
    });
  }

  async exchangeCodeForTokens(code: string): Promise<Credentials> {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    // Validate required token fields
    if (!tokens.access_token) {
      throw new Error(
        "Invalid token response from Google: missing access_token"
      );
    }
    if (!tokens.refresh_token) {
      throw new Error(
        "Invalid token response from Google: missing refresh_token"
      );
    }
    if (!tokens.expiry_date) {
      throw new Error(
        "Invalid token response from Google: missing expiry_date"
      );
    }

    return tokens;
  }

  async getAccessToken(userId: string): Promise<string> {
    // Get stored credentials from UserDataSources
    const credentials = (await UserDataSourcesModel.getCredentials(
      userId,
      DataSourceType.GMAIL
    )) as GmailCredentials | null;

    if (!credentials) {
      throw new Error(`No Gmail credentials found for user ${userId}`);
    }

    const oauth2Client = this.getOAuth2Client();

    // Set credentials in OAuth2Client
    oauth2Client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
      expiry_date: new Date(credentials.expiry).getTime(),
    });

    // Check if token is expired or will expire soon (within 5 minutes)
    const expiryDate = new Date(credentials.expiry).getTime();
    const fiveMinutes = 5 * 60 * 1000;
    const now = Date.now();

    if (expiryDate - now <= fiveMinutes) {
      // Token is expired or will expire soon, refresh it
      const { credentials: refreshedCredentials } =
        await oauth2Client.refreshAccessToken();

      // Store the refreshed credentials
      await UserDataSourcesModel.storeCredentials(
        userId,
        DataSourceType.GMAIL,
        {
          accessToken: refreshedCredentials.access_token!,
          refreshToken:
            refreshedCredentials.refresh_token || credentials.refreshToken, // Keep old refresh token if new one not provided
          expiry: new Date(refreshedCredentials.expiry_date!).toISOString(),
        }
      );

      return refreshedCredentials.access_token!;
    }

    // Return existing access token if not expired
    return credentials.accessToken;
  }
}

export default new GmailClient();
