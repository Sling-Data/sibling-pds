import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import User from "./user.model";

const app = express();
app.use(cors());
app.use(express.json());

let isConnected = false;

export const connectDb = async (uri: string) => {
  if (!isConnected) {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Connected to MongoDB");
  }
};

export const disconnectDb = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  isConnected = false;
};

app.post("/users", async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      res.status(400).json({ error: "Name and email are required" });
      return;
    }
    const user = new User({ name, email });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user" });
  }
});

// Only start server if run directly
if (require.main === module) {
  require("dotenv").config();
  connectDb(process.env.MONGO_URI as string).catch((err) =>
    console.error("MongoDB connection error:", err)
  );
  app.listen(3000, () => {
    console.log("Backend running on port 3000");
  });
}

export default app;
