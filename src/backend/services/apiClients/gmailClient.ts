import { OAuth2Client, Credentials } from "google-auth-library";
import { gmail_v1 } from "@googleapis/gmail";
import { google } from "googleapis";
import UserDataSourcesModel, {
  DataSourceType,
} from "../../models/UserDataSourcesModel";
import { AppError } from "../../middleware/errorHandler";
import { OAuthHandler } from "../OAuthHandler";

interface GmailCredentials {
  accessToken: string;
  refreshToken: string;
  expiry: string;
}

interface GmailMessage {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  sender: string;
  timestamp: string;
}

interface GmailData {
  messages: GmailMessage[];
  contacts: string[];
}

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
}

interface GmailApiError extends Error {
  code?: number;
  status?: number;
}

export class GmailClient {
  private readonly GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
  ];
  private readonly REDIRECT_URI =
    process.env.GOOGLE_OAUTH_REDIRECT_URI ||
    "http://localhost:3000/api/gmail/callback";
  private readonly MAX_MESSAGES = 100;
  private readonly RATE_LIMIT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 2,
    delayMs: 1000,
  };
  private readonly NETWORK_RETRY_CONFIG: RetryConfig = {
    maxRetries: 1,
    delayMs: 1000,
  };

  constructor(private customOAuth2Client?: OAuth2Client) {}

  private getOAuth2Client(): OAuth2Client {
    if (this.customOAuth2Client) {
      return this.customOAuth2Client;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error(
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in environment variables"
      );
    }

    return OAuthHandler.getOAuth2Client({
      provider: "gmail",
      clientId,
      clientSecret,
      redirectUri: this.REDIRECT_URI,
      scopes: this.GMAIL_SCOPES,
    });
  }

  private getGmailClient(accessToken: string): gmail_v1.Gmail {
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.gmail({ version: "v1", auth: oauth2Client });
  }

  private parseEmailAddress(header: string): string {
    const match = header.match(/<([^>]+)>/) || header.match(/([^\s]+@[^\s]+)/);
    return match ? match[1] : header;
  }

  private extractEmailAddresses(header: string | undefined): string[] {
    if (!header) return [];
    return header.split(",").map((addr) => this.parseEmailAddress(addr.trim()));
  }

  private decodeMessagePart(part: gmail_v1.Schema$MessagePart): string {
    if (!part.body?.data) return "";
    return Buffer.from(part.body.data, "base64").toString();
  }

  private findMessageBody(payload: gmail_v1.Schema$MessagePart): string {
    // First try to find text/plain part
    const plainPart = this.findPartByMimeType(payload, "text/plain");
    if (plainPart) {
      return this.decodeMessagePart(plainPart);
    }

    // Fall back to text/html if no plain text is available
    const htmlPart = this.findPartByMimeType(payload, "text/html");
    if (htmlPart) {
      return this.decodeMessagePart(htmlPart);
    }

    // If no text parts found, try the main body
    if (payload.body?.data) {
      return this.decodeMessagePart(payload);
    }

    return "";
  }

  private findPartByMimeType(
    part: gmail_v1.Schema$MessagePart,
    mimeType: string
  ): gmail_v1.Schema$MessagePart | null {
    if (part.mimeType === mimeType) {
      return part;
    }

    if (part.parts) {
      for (const subPart of part.parts) {
        const found = this.findPartByMimeType(subPart, mimeType);
        if (found) return found;
      }
    }

    return null;
  }

  private async processMessage(
    gmail: gmail_v1.Gmail,
    messageId: string
  ): Promise<GmailMessage> {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const message = response.data;
    const headers = message.payload?.headers || [];
    const subject =
      headers.find((h) => h.name === "Subject")?.value || "(no subject)";
    const from = headers.find((h) => h.name === "From")?.value || "";
    const to = headers.find((h) => h.name === "To")?.value || "";
    const cc = headers.find((h) => h.name === "Cc")?.value || "";
    const date = headers.find((h) => h.name === "Date")?.value || "";

    const body = message.payload ? this.findMessageBody(message.payload) : "";
    const sender = this.parseEmailAddress(from);
    const recipients = [
      ...this.extractEmailAddresses(to),
      ...this.extractEmailAddresses(cc),
    ];

    return {
      id: messageId,
      subject,
      body,
      recipients,
      sender,
      timestamp: date,
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isRateLimitError(error: GmailApiError): boolean {
    return error.code === 429 || error.status === 429;
  }

  private isAuthError(error: GmailApiError): boolean {
    return error.code === 401 || error.status === 401;
  }

  private isNetworkError(error: Error): boolean {
    return (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ENOTFOUND")
    );
  }

  private async retryWithConfig<T>(
    operation: () => Promise<T>,
    config: RetryConfig,
    retryCount = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retryCount >= config.maxRetries) {
        throw error;
      }

      console.error(
        `Retry attempt ${retryCount + 1}/${config.maxRetries}`,
        error
      );
      await this.delay(config.delayMs);
      return this.retryWithConfig(operation, config, retryCount + 1);
    }
  }

  private async handleGmailApiError(
    error: GmailApiError,
    userId: string,
    operation: () => Promise<any>
  ): Promise<any> {
    console.error("Gmail API Error:", error);

    if (this.isRateLimitError(error)) {
      return this.retryWithConfig(operation, this.RATE_LIMIT_RETRY_CONFIG);
    }

    if (this.isAuthError(error)) {
      console.error("Auth error detected, refreshing token...");
      await this.getAccessToken(userId); // This will refresh the token
      return operation(); // Retry once with new token
    }

    if (this.isNetworkError(error)) {
      return this.retryWithConfig(operation, this.NETWORK_RETRY_CONFIG);
    }

    throw new AppError(
      `Gmail API error: ${error.message}`,
      error.status || 500
    );
  }

  private async processMessageWithRetry(
    gmail: gmail_v1.Gmail,
    messageId: string,
    userId: string
  ): Promise<GmailMessage> {
    const operation = () => this.processMessage(gmail, messageId);

    try {
      return await operation();
    } catch (error) {
      return this.handleGmailApiError(
        error as GmailApiError,
        userId,
        operation
      );
    }
  }

  async fetchGmailData(userId: string): Promise<GmailData> {
    const accessToken = await this.getAccessToken(userId);
    const gmail = this.getGmailClient(accessToken);
    const messages: GmailMessage[] = [];
    const contacts = new Set<string>();
    let nextPageToken: string | undefined;

    try {
      do {
        const fetchMessages = async () => {
          const response = await gmail.users.messages.list({
            userId: "me",
            maxResults: Math.min(50, this.MAX_MESSAGES - messages.length),
            pageToken: nextPageToken,
          });
          return response;
        };

        let response;
        try {
          response = await fetchMessages();
        } catch (error) {
          response = await this.handleGmailApiError(
            error as GmailApiError,
            userId,
            fetchMessages
          );
        }

        if (!response.data.messages) break;

        // Process each message with retry logic
        const messagePromises = response.data.messages
          .filter(
            (msg: gmail_v1.Schema$Message): msg is { id: string } =>
              msg.id !== null && msg.id !== undefined
          )
          .map((msg: { id: string }) =>
            this.processMessageWithRetry(gmail, msg.id, userId)
          );

        const processedMessages = await Promise.all(messagePromises);

        // Add messages and collect contacts
        for (const msg of processedMessages) {
          messages.push(msg);
          contacts.add(msg.sender);
          msg.recipients.forEach((recipient: string) =>
            contacts.add(recipient)
          );
        }

        nextPageToken = response.data.nextPageToken || undefined;
      } while (nextPageToken && messages.length < this.MAX_MESSAGES);

      return {
        messages,
        contacts: Array.from(contacts),
      };
    } catch (error) {
      console.error("Error fetching Gmail data:", error);
      throw new AppError(
        `Failed to fetch Gmail data: ${(error as Error).message}`,
        (error as GmailApiError).status || 500
      );
    }
  }

  generateAuthUrl(state?: string, isPopup: boolean = false): string {
    // If isPopup is true, append a popup indicator to the state
    let finalState = state;
    if (isPopup && state) {
      try {
        // Decode the state
        const stateJson = Buffer.from(state, "base64").toString();
        const decodedState = JSON.parse(stateJson);

        // Add popup flag
        decodedState.popup = true;

        // Re-encode the state
        finalState = Buffer.from(JSON.stringify(decodedState)).toString(
          "base64"
        );
      } catch (error) {
        console.error("Error modifying state for popup:", error);
        // Fall back to original state if there's an error
        finalState = state;
      }
    }

    return OAuthHandler.generateAuthUrl(
      {
        provider: "gmail",
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        redirectUri: this.REDIRECT_URI,
        scopes: this.GMAIL_SCOPES,
      },
      finalState
    );
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
