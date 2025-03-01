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

  it("should retrieve a user with GET /users/:id", async () => {
    const postResponse = await request(server)
      .post("/users")
      .send({ name: "Fetch User", email: "fetch@example.com" })
      .expect(201);
    const getResponse = await request(server)
      .get(`/users/${postResponse.body._id}`)
      .expect(200);
    expect(getResponse.body.name).toBe("Fetch User");
    expect(getResponse.body.email).toBe("fetch@example.com");
  });

  it("should return 404 for non-existent user with GET /users/:id", async () => {
    const response = await request(server)
      .get("/users/123456789012345678901234")
      .expect(404);
    expect(response.body).toHaveProperty("error", "User not found");
  });
});
