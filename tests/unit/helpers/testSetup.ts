import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
import { PlaidApi } from "plaid";

export interface TestEnvironment {
  mongoServer: MongoMemoryServer;
  mongoUri: string;
}

export async function setupTestEnvironment(): Promise<TestEnvironment> {
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Set up common environment variables
  process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566";
  process.env.JWT_SECRET = "test-jwt-secret";
  process.env.GOOGLE_CLIENT_ID = "test-client-id";
  process.env.GOOGLE_CLIENT_SECRET = "test-client-secret";
  process.env.PLAID_CLIENT_ID = "test-plaid-client-id";
  process.env.PLAID_SECRET = "test-plaid-secret";

  await mongoose.connect(mongoUri);

  return { mongoServer, mongoUri };
}

export async function teardownTestEnvironment(
  env: TestEnvironment
): Promise<void> {
  await mongoose.disconnect();
  await env.mongoServer.stop();

  // Clean up environment variables
  delete process.env.ENCRYPTION_KEY;
  delete process.env.JWT_SECRET;
  delete process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_SECRET;
  delete process.env.PLAID_CLIENT_ID;
  delete process.env.PLAID_SECRET;
}

export function createMockOAuth2Client(): jest.Mocked<Partial<OAuth2Client>> {
  return {
    setCredentials: jest.fn(),
    getToken: jest.fn(),
    refreshAccessToken: jest.fn(),
    generateAuthUrl: jest.fn(),
    request: jest.fn(),
  } as jest.Mocked<Partial<OAuth2Client>>;
}

export function createMockPlaidClient(): jest.Mocked<Partial<PlaidApi>> {
  return {
    linkTokenCreate: jest.fn(),
    itemPublicTokenExchange: jest.fn(),
    accountsGet: jest.fn(),
    transactionsGet: jest.fn(),
    paymentInitiationPaymentGet: jest.fn(),
  } as jest.Mocked<Partial<PlaidApi>>;
}

export const mockGmailApi = {
  users: {
    messages: {
      list: jest.fn(),
      get: jest.fn(),
    },
  },
};

export const mockGmailResponse = {
  data: {
    messages: [{ id: "msg1" }, { id: "msg2" }],
  },
};

export const mockMessageResponse = {
  data: {
    id: "msg1",
    payload: {
      headers: [
        { name: "Subject", value: "Test Subject" },
        { name: "From", value: "sender@example.com" },
        { name: "To", value: "recipient@example.com" },
        { name: "Date", value: "2024-03-12T12:00:00Z" },
      ],
      parts: [
        {
          mimeType: "text/plain",
          body: { data: Buffer.from("Test body").toString("base64") },
        },
      ],
    },
  },
};
