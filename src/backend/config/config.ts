import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

/**
 * Centralized configuration for the application
 * Provides default values for development and allows overrides via environment variables
 */
const config = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database configuration
  MONGODB_URI:
    process.env.MONGODB_URI || "mongodb://localhost:27018/sibling-pds",

  // URL configuration
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3001",
  API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3000",

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || "default-secret",

  // External APIs
  GMAIL_REDIRECT_URI:
    process.env.GMAIL_REDIRECT_URI ||
    "http://localhost:3000/api/gmail/callback",
  PLAID_REDIRECT_URI:
    process.env.PLAID_REDIRECT_URI ||
    "http://localhost:3000/api/plaid/callback",

  // Encryption
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "",
};

export default config;
