import request from "supertest";
import { Express } from "express";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import dotenv from "dotenv";
import app, { connectDb, disconnectDb } from "../src/backend/index";

// Load test environment variables
dotenv.config({ path: path.join(__dirname, ".env.test") });

jest.setTimeout(30000); // Set global timeout to 30 seconds

describe("User API", () => {
  let server: Express;
  let mongoServer: MongoMemoryServer;
  let mongoUri: string;

  beforeAll(async () => {
    // Use MongoMemoryServer for isolated testing
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    await connectDb(mongoUri);
    server = app;
  });

  afterAll(async () => {
    // Clean up the test database
    await disconnectDb();
    await mongoServer.stop();
  });

  it("should create a new user with POST /users", async () => {
    const response = await request(server)
      .post("/users")
      .send({ name: "Test User", email: "test@example.com" })
      .expect(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body.name).toBe("Test User");
    expect(response.body.email).toBe("test@example.com");
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
    const userResponse = await request(server)
      .post("/users")
      .send({ name: "Data User", email: "data@example.com" })
      .expect(201);
    await request(server)
      .post("/volunteered-data")
      .send({ userId: userResponse.body._id, type: "personal", value: "test" })
      .expect(201);
    const getResponse = await request(server)
      .get(`/user-data/${userResponse.body._id}`)
      .expect(200);
    expect(getResponse.body.user.name).toBe("Data User");
    expect(getResponse.body.volunteeredData).toBeDefined();
  });

  it("should return 404 for non-existent user with GET /user-data/:id", async () => {
    const response = await request(server)
      .get("/user-data/123456789012345678901234")
      .expect(404);
    expect(response.body).toHaveProperty("error", "User not found");
  });
});
