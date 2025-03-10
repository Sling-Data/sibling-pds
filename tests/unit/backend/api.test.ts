import request from "supertest";
import { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import dotenv from "dotenv";
import app, { connectDb, disconnectDb } from "@backend/index";
import { generateToken } from "@backend/middleware/auth";

// Load test environment variables
dotenv.config({ path: path.join(__dirname, ".env.test") });

describe("User API", () => {
  let server: Express;
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;

  beforeAll(async () => {
    // Use MongoMemoryServer for isolated testing
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566"; // 32-byte hex key
    await connectDb(mongoUri);
    server = app;
  });

  afterAll(async () => {
    // Clean up the test database
    delete process.env.ENCRYPTION_KEY;
    await disconnectDb();
    await mongoServer.stop();
  });

  it("should create a new user with POST /users using env key", async () => {
    const response = await request(server)
      .post("/users")
      .send({ name: "Test User", email: "test@example.com" })
      .expect(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body).toHaveProperty("name");
    expect(typeof response.body.name.iv).toBe("string");
    expect(typeof response.body.name.content).toBe("string");
    expect(response.body).toHaveProperty("email");
    expect(typeof response.body.email.iv).toBe("string");
    expect(typeof response.body.email.content).toBe("string");
  });

  it("should create a new user with fallback key if env unset", async () => {
    delete process.env.ENCRYPTION_KEY;
    const response = await request(server)
      .post("/users")
      .send({ name: "Fallback User", email: "fallback@example.com" })
      .expect(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body).toHaveProperty("name");
    expect(typeof response.body.name.iv).toBe("string");
    expect(typeof response.body.name.content).toBe("string");
    expect(response.body).toHaveProperty("email");
    expect(typeof response.body.email.iv).toBe("string");
    expect(typeof response.body.email.content).toBe("string");
  });

  it("should return 400 for invalid user data with POST /users", async () => {
    const response = await request(server)
      .post("/users")
      .send({ name: "" }) // Missing email
      .expect(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Name and email are required",
    });
  });

  it("should create volunteered data with POST /volunteered-data", async () => {
    const userResponse = await request(server)
      .post("/users")
      .send({ name: "Vol User", email: "vol@example.com" })
      .expect(201);
    const response = await request(server)
      .post("/volunteered-data")
      .send({
        userId: userResponse.body._id,
        type: "personal",
        value: "some data",
      })
      .expect(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.type).toBe("personal");
    expect(response.body).toHaveProperty("value");
    expect(typeof response.body.value.iv).toBe("string");
    expect(typeof response.body.value.content).toBe("string");
  });

  it("should return 400 for invalid volunteered data with POST /volunteered-data", async () => {
    const response = await request(server)
      .post("/volunteered-data")
      .send({ userId: "invalid", type: "" }) // Missing value
      .expect(400);
    expect(response.body).toHaveProperty(
      "error",
      "userId, type, and value are required"
    );
  });

  it("should create behavioral data with POST /behavioral-data", async () => {
    const userResponse = await request(server)
      .post("/users")
      .send({ name: "Beh User", email: "beh@example.com" })
      .expect(201);
    const response = await request(server)
      .post("/behavioral-data")
      .send({
        userId: userResponse.body._id,
        action: "login",
        context: { device: "desktop" },
      })
      .expect(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.action).toBe("login");
    expect(response.body).toHaveProperty("context");
    expect(typeof response.body.context.iv).toBe("string");
    expect(typeof response.body.context.content).toBe("string");
  });

  it("should return 400 for invalid behavioral data with POST /behavioral-data", async () => {
    const response = await request(server)
      .post("/behavioral-data")
      .send({ userId: "invalid", action: "" }) // Missing context
      .expect(400);
    expect(response.body).toHaveProperty(
      "error",
      "userId, action, and context are required"
    );
  });

  it("should create external data with POST /external-data", async () => {
    const userResponse = await request(server)
      .post("/users")
      .send({ name: "Ext User", email: "ext@example.com" })
      .expect(201);
    const response = await request(server)
      .post("/external-data")
      .send({
        userId: userResponse.body._id,
        source: "api",
        data: { key: "value" },
      })
      .expect(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.source).toBe("api");
    expect(response.body).toHaveProperty("data");
    expect(typeof response.body.data.iv).toBe("string");
    expect(typeof response.body.data.content).toBe("string");
  });

  it("should return 400 for invalid external data with POST /external-data", async () => {
    const response = await request(server)
      .post("/external-data")
      .send({ userId: "invalid", source: "" }) // Missing data
      .expect(400);
    expect(response.body).toHaveProperty(
      "error",
      "userId, source, and data are required"
    );
  });

  it("should retrieve user data with GET /user-data/:id", async () => {
    const testName = "Data User";
    const testEmail = "data@example.com";
    const testValue = "test value";
    const testContext = { device: "desktop" };
    const testData = { key: "value" };

    // Create user
    const userResponse = await request(server)
      .post("/users")
      .send({ name: testName, email: testEmail })
      .expect(201);

    // Add volunteered data
    await request(server)
      .post("/volunteered-data")
      .send({
        userId: userResponse.body._id,
        type: "personal",
        value: testValue,
      })
      .expect(201);

    // Add behavioral data
    await request(server)
      .post("/behavioral-data")
      .send({
        userId: userResponse.body._id,
        action: "login",
        context: testContext,
      })
      .expect(201);

    // Add external data
    await request(server)
      .post("/external-data")
      .send({ userId: userResponse.body._id, source: "api", data: testData })
      .expect(201);

    // Get all user data
    const getResponse = await request(server)
      .get(`/user-data/${userResponse.body._id}`)
      .expect(200);

    // Verify user data
    expect(getResponse.body.user.name).toBe(testName);
    expect(getResponse.body.user.email).toBe(testEmail);

    // Verify volunteered data
    expect(getResponse.body.volunteeredData).toHaveLength(1);
    expect(getResponse.body.volunteeredData[0].value).toBe(testValue);

    // Verify behavioral data
    expect(getResponse.body.behavioralData).toHaveLength(1);
    expect(getResponse.body.behavioralData[0].context).toEqual(testContext);

    // Verify external data
    expect(getResponse.body.externalData).toHaveLength(1);
    expect(getResponse.body.externalData[0].data).toEqual(testData);
  });

  it("should return decrypted user data with GET /users/:id", async () => {
    const testName = "Test User";
    const testEmail = "test@example.com";
    const userResponse = await request(server)
      .post("/users")
      .send({ name: testName, email: testEmail })
      .expect(201);

    const getResponse = await request(server)
      .get(`/users/${userResponse.body._id}`)
      .expect(200);

    expect(getResponse.body.name).toBe(testName);
    expect(getResponse.body.email).toBe(testEmail);
  });

  it("should return 404 for non-existent user with GET /user-data/:id", async () => {
    const response = await request(server)
      .get("/user-data/123456789012345678901234")
      .expect(404);
    expect(response.body).toHaveProperty("error", "User not found");
  });

  it("should update user data with PUT /users/:id", async () => {
    // Create initial user
    const initialResponse = await request(server)
      .post("/users")
      .send({ name: "Initial User", email: "initial@example.com" })
      .expect(201);

    const userId = initialResponse.body._id;

    // Update user
    const updateResponse = await request(server)
      .put(`/users/${userId}`)
      .send({ name: "Updated User", email: "updated@example.com" })
      .expect(200);

    expect(updateResponse.body).toHaveProperty("_id", userId);
    expect(updateResponse.body).toHaveProperty("name");
    expect(updateResponse.body).toHaveProperty("email");
    expect(typeof updateResponse.body.name.iv).toBe("string");
    expect(typeof updateResponse.body.name.content).toBe("string");
    expect(typeof updateResponse.body.email.iv).toBe("string");
    expect(typeof updateResponse.body.email.content).toBe("string");

    // Verify updated data
    const getResponse = await request(server)
      .get(`/users/${userId}`)
      .expect(200);

    expect(getResponse.body.name).toBe("Updated User");
    expect(getResponse.body.email).toBe("updated@example.com");
  });

  it("should return 404 for non-existent user with PUT /users/:id", async () => {
    const response = await request(server)
      .put("/users/123456789012345678901234")
      .send({ name: "Updated User", email: "updated@example.com" })
      .expect(404);
    expect(response.body).toEqual({
      status: "error",
      message: "User not found",
    });
  });

  it("should return 400 for invalid data with PUT /users/:id", async () => {
    const response = await request(server)
      .put("/users/123456789012345678901234")
      .send({ name: "Updated User" }) // Missing email
      .expect(400);
    expect(response.body).toEqual({
      status: "error",
      message: "Name and email are required",
    });
  });

  it("should return 404 for non-existent user with GET /users/:id", async () => {
    const response = await request(server)
      .get("/users/123456789012345678901234")
      .expect(404);
    expect(response.body).toEqual({
      status: "error",
      message: "User not found",
    });
  });
});

// Add JWT Authentication and Validation Tests
describe("JWT Authentication and Validation", () => {
  let server: Express;
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;
  let userId: string;
  let password: string;
  let validToken: string;

  beforeAll(async () => {
    // Use MongoMemoryServer for isolated testing
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    process.env.ENCRYPTION_KEY = "68656c6c6f31323334353637383930616263646566"; // 32-byte hex key
    await connectDb(mongoUri);
    server = app;

    // Create a test user
    const userResponse = await request(server)
      .post("/users")
      .send({ name: "Auth Test User", email: "auth@example.com", password: "securePassword123" });

    userId = userResponse.body._id;
    password = "securePassword123";
    validToken = generateToken(userId);
  });

  afterAll(async () => {
    // Clean up the test database
    delete process.env.ENCRYPTION_KEY;
    await disconnectDb();
    await mongoServer.stop();
  });

  // Test login endpoint with valid input
  it("should generate a JWT token with valid userId at POST /auth/login", async () => {
    const response = await request(server)
      .post("/auth/login")
      .send({ userId, password })
      .expect(200);

    expect(response.body).toHaveProperty("token");
    expect(typeof response.body.token).toBe("string");
    expect(response.body.token.split(".").length).toBe(3); // JWT has 3 parts

    // Check for refresh token
    expect(response.body).toHaveProperty("refreshToken");
    expect(typeof response.body.refreshToken).toBe("string");
    // Opaque tokens don't have JWT structure

    // Check for expiration time
    expect(response.body).toHaveProperty("expiresIn");
    expect(typeof response.body.expiresIn).toBe("number");
  });

  // Test login endpoint with invalid input
  it("should return 400 for missing userId at POST /auth/login", async () => {
    const response = await request(server)
      .post("/auth/login")
      .send({ password })
      .expect(400);

    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Validation error");
    expect(response.body).toHaveProperty("details");
    expect(response.body.details).toContain("userId is required");
  });

  // Test login endpoint with empty userId
  it("should return 400 for empty userId at POST /auth/login", async () => {
    const response = await request(server)
      .post("/auth/login")
      .send({ userId: "" })
      .expect(400);

    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Validation error");
    expect(response.body.details).toContain("userId cannot be empty");
  });

  // Test protected route with valid token
  it("should allow access to protected route with valid token", async () => {
    const response = await request(server)
      .get("/auth/protected")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);

    expect(response.body).toHaveProperty(
      "message",
      "This is a protected route"
    );
    expect(response.body).toHaveProperty("userId", userId);
  });

  // Test protected route with invalid token
  it("should deny access to protected route with invalid token", async () => {
    const response = await request(server)
      .get("/auth/protected")
      .set("Authorization", "Bearer invalid.token.here")
      .expect(403);

    expect(response.body).toHaveProperty("message", "Invalid token.");
  });

  // Test protected route with missing token
  it("should deny access to protected route with missing token", async () => {
    const response = await request(server).get("/auth/protected").expect(401);

    expect(response.body).toHaveProperty(
      "message",
      "Access denied. No token provided."
    );
  });

  // Test protected route with malformed token
  it("should deny access to protected route with malformed token", async () => {
    const response = await request(server)
      .get("/auth/protected")
      .set("Authorization", "InvalidFormat")
      .expect(401);

    expect(response.body).toHaveProperty(
      "message",
      "Access denied. Invalid token format."
    );
  });

  // Test API validation with valid input - skipping due to mocking issues
  it.skip("should accept valid input for /api/plaid/create-link-token", async () => {
    // This test is skipped due to mocking issues
    // The functionality is covered by the plaidClient.test.ts tests
  });

  // Test API validation with invalid input
  it("should reject missing userId for /api/plaid/create-link-token", async () => {
    const response = await request(server)
      .get("/api/plaid/create-link-token")
      .expect(400);

    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Validation error");
    expect(response.body.details).toContain("userId is required");
  });

  // Test API validation with empty userId
  it("should reject empty userId for /api/plaid/create-link-token", async () => {
    const response = await request(server)
      .get("/api/plaid/create-link-token?userId=")
      .expect(400);

    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Validation error");
    expect(response.body.details).toContain("userId cannot be empty");
  });

  // Test API validation for exchange-public-token - skipping due to mocking issues
  it.skip("should validate input for /api/plaid/exchange-public-token", async () => {
    // This test is skipped due to mocking issues
    // The functionality is covered by the plaidClient.test.ts tests
  });

  // Test API validation for missing fields in exchange-public-token
  it("should reject missing fields for /api/plaid/exchange-public-token", async () => {
    const response = await request(server)
      .post("/api/plaid/exchange-public-token")
      .send({
        userId,
      })
      .expect(400);

    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Validation error");
    expect(response.body.details).toContain("public_token is required");
  });

  // Test refresh token endpoint with valid input
  it("should refresh access token with valid refresh token at POST /auth/refresh-token", async () => {
    // First get a refresh token
    const loginResponse = await request(server)
      .post("/auth/login")
      .send({ userId, password })
      .expect(200);

    const refreshToken = loginResponse.body.refreshToken;

    // Then use it to get a new access token
    const response = await request(server)
      .post("/auth/refresh-token")
      .send({ refreshToken })
      .expect(200);

    expect(response.body).toHaveProperty("accessToken");
    expect(typeof response.body.accessToken).toBe("string");
    expect(response.body.accessToken.split(".").length).toBe(3); // JWT has 3 parts

    // Check for new refresh token (token rotation)
    expect(response.body).toHaveProperty("refreshToken");
    expect(typeof response.body.refreshToken).toBe("string");
    expect(response.body.refreshToken).not.toBe(refreshToken); // Should be different from original

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Token refreshed successfully");

    // Try to use the old refresh token again (should fail due to token rotation)
    await request(server)
      .post("/auth/refresh-token")
      .send({ refreshToken })
      .expect(401);
  });

  // Test refresh token endpoint with invalid input
  it("should return 401 for invalid refresh token at POST /auth/refresh-token", async () => {
    const response = await request(server)
      .post("/auth/refresh-token")
      .send({ refreshToken: "invalid-token" })
      .expect(401);

    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Invalid refresh token");
  });

  // Test refresh token endpoint with missing token
  it("should return 400 for missing refresh token at POST /auth/refresh-token", async () => {
    const response = await request(server)
      .post("/auth/refresh-token")
      .send({})
      .expect(400);

    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Validation error");
    expect(response.body).toHaveProperty("details");
    expect(response.body.details).toContain("refreshToken is required");
  });

  // Test refresh token endpoint with empty token
  it("should return 400 for empty refresh token at POST /auth/refresh-token", async () => {
    const response = await request(server)
      .post("/auth/refresh-token")
      .send({ refreshToken: "" })
      .expect(400);

    expect(response.body).toHaveProperty("status", "error");
    expect(response.body).toHaveProperty("message", "Validation error");
    expect(response.body).toHaveProperty("details");
    expect(response.body.details).toContain("refreshToken cannot be empty");
  });
});
