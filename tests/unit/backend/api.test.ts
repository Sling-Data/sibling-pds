import request from "supertest";
import { Express } from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import dotenv from "dotenv";
import app, { connectDb, disconnectDb } from "@backend/index";

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
    expect(response.body).toHaveProperty(
      "error",
      "Name and email are required"
    );
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
});
